import {
    verifyRegistrationResponse
} from "@simplewebauthn/server";

import {
    getDb,
    findUser,
    getPasskeys
} from "../lib/db.js";

import {
    getSession,
    createSession
} from "../lib/session.js";


function getWebAuthnConfig(req) {

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
        req.headers["x-forwarded-host"];


    const host =
        String(
            Array.isArray(forwardedHost)
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
            Array.isArray(forwardedProto)
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


async function getBody(req) {

    if (
        req.body &&
        typeof req.body === "object"
    ) {

        return req.body;

    }


    if (
        typeof req.body === "string"
    ) {

        return JSON.parse(
            req.body || "{}"
        );

    }


    let body = "";


    for await (
        const chunk of req
    ) {

        body += chunk;

    }


    return body
        ? JSON.parse(body)
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
            await getBody(req);


        const {

            username,

            passkeyName,

            flowId,

            response

        } =
            body;


        if (
            !username ||
            !flowId ||
            !response
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "username, flowId, response가 필요합니다."

                });

        }


        const user =
            await findUser(
                username
            );


        if (!user) {

            return res
                .status(404)
                .json({

                    error:
                        "등록할 사용자를 찾을 수 없습니다."

                });

        }


        const existingPasskeys =
            await getPasskeys(
                user.id
            );


        /*
         * 이미 패스키가 있는 사용자라면
         * 추가 등록 시 로그인 세션 필수.
         */
        if (
            existingPasskeys.length >
            0
        ) {

            const session =
                getSession(
                    req
                );


            if (
                !session ||
                String(
                    session.userId
                ) !==
                String(
                    user.id
                )
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "추가 패스키를 등록할 권한이 없습니다.",

                        code:
                            "EXTRA_PASSKEY_NOT_AUTHORIZED"

                    });

            }

        }


        const db =
            getDb();


        /*
         * challenge를 원자적으로
         * 사용 처리한다.
         *
         * used_at IS NULL인 경우만 성공.
         *
         * 같은 flowId 재사용 시
         * rows.length === 0
         */
        const challengeResult =
            await db.query(
                `
                UPDATE challenges

                SET used_at =
                    NOW()

                WHERE id =
                      $1

                  AND user_id =
                      $2

                  AND challenge_type =
                      'register'

                  AND used_at
                      IS NULL

                  AND expires_at >
                      NOW()

                RETURNING
                    challenge
                `,
                [
                    flowId,
                    user.id
                ]
            );


        /*
         * 사용했거나 만료된 challenge
         */
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


        const expectedChallenge =
            challengeResult
                .rows[0]
                .challenge;


        const {
            rpID,
            origin
        } =
            getWebAuthnConfig(
                req
            );


        /*
         * 브라우저에서 전달된
         * 등록 응답 검증.
         */
        const verification =
            await verifyRegistrationResponse({

                response,

                expectedChallenge,

                expectedOrigin:
                    origin,

                expectedRPID:
                    rpID,

                /*
                 * options 단계에서도
                 * userVerification required였기 때문에
                 * 여기서도 true.
                 */
                requireUserVerification:
                    true

            });


        if (
            !verification.verified
        ) {

            return res
                .status(401)
                .json({

                    verified:
                        false,

                    error:
                        "패스키 등록 검증에 실패했습니다."

                });

        }


        if (
            !verification
                .registrationInfo
        ) {

            return res
                .status(500)
                .json({

                    error:
                        "registrationInfo가 없습니다."

                });

        }


        /*
         * SimpleWebAuthn에서
         * 검증 완료된 Credential 정보.
         */
        const {

            credential

        } =
            verification
                .registrationInfo;


        /*
         * credential.publicKey는
         * Uint8Array 형태.
         *
         * PostgreSQL TEXT 컬럼에
         * Base64URL 문자열로 저장.
         */
        const publicKey =
            Buffer
                .from(
                    credential
                        .publicKey
                )
                .toString(
                    "base64url"
                );


        /*
         * 인증기 transport 정보
         */
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
                "내 패스키"
            )
                .trim()
                .slice(
                    0,
                    100
                )
            ||
            "내 패스키";


        /*
         * 서버에 저장하는 것은
         *
         * Credential ID
         * Public Key
         * Counter
         * Transport
         * 이름
         *
         * 개인키는 절대 저장하지 않는다.
         */
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
                    counter,
                    transports,
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


        /*
         * 이미 같은 Credential이
         * 존재하는 경우.
         */
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
                        "이미 등록된 패스키입니다.",

                    code:
                        "PASSKEY_ALREADY_REGISTERED"

                });

        }


        const savedPasskey =
            insertResult
                .rows[0];


        /*
         * 등록 성공한 사용자를
         * 바로 로그인 처리.
         */
        createSession(
            req,
            res,
            user
        );


        /*
         * 과제 증거 로그
         *
         * privateKey는 출력하지 않는다.
         */
        console.log(
            "[PASSKEY REGISTER VERIFY]",
            {

                username:
                    user.username,

                credentialId:
                    savedPasskey
                        .credential_id,

                publicKeyStored:
                    true,

                privateKeyStored:
                    false,

                counter:
                    savedPasskey
                        .counter,

                verified:
                    true

            }
        );


        return res
            .status(200)
            .json({

                verified:
                    true,

                message:
                    "패스키 등록에 성공했습니다.",

                passkey: {

                    id:
                        String(
                            savedPasskey.id
                        ),

                    name:
                        savedPasskey
                            .name,

                    credentialId:
                        savedPasskey
                            .credential_id,

                    /*
                     * 과제에서 공개키 저장 여부를
                     * 보여주기 위해 포함.
                     */
                    publicKey:
                        savedPasskey
                            .public_key,

                    createdAt:
                        savedPasskey
                            .created_at

                },

                /*
                 * 제출 증거용
                 */
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
            "[REGISTER VERIFY ERROR]",
            error
        );


        /*
         * WebAuthn 검증 오류는
         * 401로 반환.
         */
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
                    "패스키 등록 검증 중 오류가 발생했습니다."

            });

    }

}