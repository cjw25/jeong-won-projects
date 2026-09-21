import {
    verifyRegistrationResponse
} from "@simplewebauthn/server";

import {
    getDb
} from "../lib/db.js";

import {
    createSession
} from "../lib/session.js";


function getWebAuthnConfig(
    req
) {

    if (
        process.env.WEBAUTHN_RP_ID &&
        process.env.WEBAUTHN_ORIGIN
    ) {

        return {

            rpID:
                process.env.WEBAUTHN_RP_ID,

            origin:
                process.env.WEBAUTHN_ORIGIN

        };

    }


    const forwardedHost =
        req.headers[
            "x-forwarded-host"
        ];


    const host =
        String(

            Array.isArray(
                forwardedHost
            )

                ? forwardedHost[0]

                : (
                    forwardedHost ||
                    req.headers.host ||
                    "localhost:3000"
                )

        )
            .split(",")[0]
            .trim();


    const hostname =
        host.replace(
            /:\d+$/,
            ""
        );


    const forwardedProto =
        req.headers[
            "x-forwarded-proto"
        ];


    const protocol =
        String(

            Array.isArray(
                forwardedProto
            )

                ? forwardedProto[0]

                : (
                    forwardedProto ||
                    (
                        hostname ===
                        "localhost"

                            ? "http"

                            : "https"
                    )
                )

        )
            .split(",")[0]
            .trim();


    return {

        rpID:
            hostname,

        origin:
            `${protocol}://${host}`

    };

}


async function getBody(
    req
) {

    if (
        req.body &&
        typeof req.body ===
        "object"
    ) {

        return req.body;

    }


    if (
        typeof req.body ===
        "string"
    ) {

        return JSON.parse(
            req.body || "{}"
        );

    }


    let raw =
        "";


    for await (
        const chunk of req
    ) {

        raw +=
            chunk;

    }


    return raw
        ? JSON.parse(raw)
        : {};

}


export default async function handler(
    req,
    res
) {

    if (
        req.method !== "POST"
    ) {

        res.setHeader(
            "Allow",
            "POST"
        );


        return res
            .status(405)
            .json({

                error:
                    "POST 요청만 사용할 수 있습니다."

            });

    }


    try {

        const body =
            await getBody(
                req
            );


        const {

            flowId,

            passkeyName,

            response

        } =
            body;


        if (
            !flowId ||
            !response
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "flowId와 response가 필요합니다."

                });

        }


        const db =
            getDb();


        /*
         * challenge를 단 한 번만 사용.
         */
        const challengeResult =
            await db.query(
                `
                UPDATE challenges

                SET used_at =
                    NOW()

                WHERE id =
                      $1

                  AND challenge_type =
                      'device-register'

                  AND used_at
                      IS NULL

                  AND expires_at >
                      NOW()

                RETURNING

                    challenge,

                    user_id
                `,
                [
                    flowId
                ]
            );


        if (
            challengeResult
                .rows
                .length ===
            0
        ) {

            return res
                .status(401)
                .json({

                    error:
                        "등록 challenge가 만료되었거나 이미 사용되었습니다.",

                    code:
                        "CHALLENGE_REUSED_OR_EXPIRED"

                });

        }


        const {

            challenge:
                expectedChallenge,

            user_id:
                userId

        } =
            challengeResult
                .rows[0];


        const userResult =
            await db.query(
                `
                SELECT

                    id,

                    username,

                    display_name

                FROM users

                WHERE id =
                      $1

                LIMIT 1
                `,
                [
                    userId
                ]
            );


        const user =
            userResult
                .rows[0];


        if (!user) {

            return res
                .status(404)
                .json({

                    error:
                        "사용자를 찾을 수 없습니다."

                });

        }


        const {
            rpID,
            origin
        } =
            getWebAuthnConfig(
                req
            );


        const verification =
            await verifyRegistrationResponse({

                response,

                expectedChallenge,

                expectedOrigin:
                    origin,

                expectedRPID:
                    rpID,

                requireUserVerification:
                    true

            });


        if (
            !verification.verified ||
            !verification.registrationInfo
        ) {

            return res
                .status(401)
                .json({

                    verified:
                        false,

                    error:
                        "아이폰 패스키 등록 검증에 실패했습니다."

                });

        }


        const {
            credential
        } =
            verification
                .registrationInfo;


        const publicKey =
            Buffer
                .from(
                    credential.publicKey
                )
                .toString(
                    "base64url"
                );


        const transports =
            credential.transports
            ||
            response
                ?.response
                ?.transports
            ||
            [];


        const name =
            String(
                passkeyName ||
                "iPhone 패스키"
            )
                .trim()
                .slice(
                    0,
                    100
                )
            ||
            "iPhone 패스키";


        const insertResult =
            await db.query(
                `
                INSERT INTO passkeys (

                    user_id,

                    credential_id,

                    public_key,

                    counter,

                    transports,

                    name

                )

                VALUES (

                    $1,

                    $2,

                    $3,

                    $4,

                    $5::jsonb,

                    $6

                )

                ON CONFLICT
                    (credential_id)

                DO NOTHING

                RETURNING

                    id,

                    credential_id,

                    public_key,

                    name,

                    created_at
                `,
                [

                    user.id,

                    credential.id,

                    publicKey,

                    credential.counter,

                    JSON.stringify(
                        transports
                    ),

                    name

                ]
            );


        if (
            insertResult
                .rows
                .length ===
            0
        ) {

            return res
                .status(409)
                .json({

                    error:
                        "이미 등록되어 있는 패스키입니다.",

                    code:
                        "PASSKEY_ALREADY_REGISTERED"

                });

        }


        const savedPasskey =
            insertResult
                .rows[0];


        /*
         * 아이폰도 등록 직후 로그인 상태로 전환.
         */
        createSession(
            req,
            res,
            user
        );


        console.log(
            "[DEVICE PASSKEY REGISTERED]",
            {

                username:
                    user.username,

                credentialId:
                    savedPasskey
                        .credential_id,

                publicKeyStored:
                    true,

                privateKeyStored:
                    false

            }
        );


        return res
            .status(200)
            .json({

                verified:
                    true,

                message:
                    "아이폰 패스키 등록에 성공했습니다.",

                user: {

                    username:
                        user.username,

                    displayName:
                        user.display_name

                },

                passkey: {

                    id:
                        String(
                            savedPasskey.id
                        ),

                    name:
                        savedPasskey.name,

                    credentialId:
                        savedPasskey
                            .credential_id,

                    publicKey:
                        savedPasskey
                            .public_key,

                    createdAt:
                        savedPasskey
                            .created_at

                },

                storage: {

                    publicKeyStored:
                        true,

                    privateKeyStored:
                        false

                }

            });

    } catch (
        error
    ) {

        console.error(
            "[DEVICE REGISTER VERIFY ERROR]",
            error
        );


        return res
            .status(
                error.status ||
                401
            )
            .json({

                verified:
                    false,

                error:
                    error.message ||
                    "아이폰 패스키 검증 중 오류가 발생했습니다.",

                code:
                    error.code ||
                    undefined

            });

    }

}