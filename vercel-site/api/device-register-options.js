import crypto from "node:crypto";

import {
    generateRegistrationOptions
} from "@simplewebauthn/server";

import {
    getDb,
    getPasskeys
} from "./lib/db.js";

import {
    consumeDeviceInvite
} from "./lib/device-invite.js";


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


        if (!body.code) {

            return res
                .status(400)
                .json({

                    error:
                        "등록 코드가 필요합니다."

                });

        }


        /*
         * 코드 검증 + 1회 사용 처리
         */
        const userId =
            await consumeDeviceInvite(
                body.code
            );


        const db =
            getDb();


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
                        "등록할 사용자를 찾을 수 없습니다."

                });

        }


        const existingPasskeys =
            await getPasskeys(
                user.id
            );


        const {
            rpID
        } =
            getWebAuthnConfig(
                req
            );


        const userID =
            new TextEncoder()
                .encode(
                    String(
                        user.id
                    )
                );


        /*
         * 아이폰에서 직접 접속하므로
         * localDevice 힌트를 줌.
         *
         * 아이폰 Face ID / iCloud Keychain
         * 패스키 등록을 우선한다.
         */
        const options =
            await generateRegistrationOptions({

                rpName:
                    "CJW's STORY",

                rpID,

                userID,

                userName:
                    user.username,

                userDisplayName:
                    user.display_name,

                attestationType:
                    "none",

                excludeCredentials:
                    existingPasskeys.map(
                        passkey => ({

                            id:
                                passkey
                                    .credential_id,

                            transports:
                                Array.isArray(
                                    passkey
                                        .transports
                                )
                                    ? passkey
                                        .transports

                                    : []

                        })
                    ),

                authenticatorSelection: {

                    residentKey:
                        "required",

                    userVerification:
                        "required"

                },

                preferredAuthenticatorType:
                    "localDevice",

                supportedAlgorithmIDs:
                    [
                        -7,
                        -257
                    ]

            });


        const flowId =
            crypto.randomUUID();


        /*
         * 등록 challenge 저장
         */
        await db.query(
            `
            INSERT INTO challenges (

                id,

                user_id,

                challenge_type,

                challenge,

                expires_at

            )

            VALUES (

                $1,

                $2,

                'device-register',

                $3,

                NOW()
                +
                INTERVAL '5 minutes'

            )
            `,
            [

                flowId,

                user.id,

                options.challenge

            ]
        );


        console.log(
            "[DEVICE REGISTER OPTIONS]",
            {

                username:
                    user.username,

                flowId,

                challenge:
                    options.challenge,

                existingPasskeyCount:
                    existingPasskeys.length

            }
        );


        return res
            .status(200)
            .json({

                flowId,

                username:
                    user.username,

                displayName:
                    user.display_name,

                options

            });

    } catch (
        error
    ) {

        console.error(
            "[DEVICE REGISTER OPTIONS ERROR]",
            error
        );


        return res
            .status(
                error.status ||
                500
            )
            .json({

                error:
                    error.message ||
                    "다른 기기 패스키 등록 옵션 생성에 실패했습니다.",

                code:
                    error.code ||
                    undefined

            });

    }

}