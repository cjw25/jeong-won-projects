import crypto from "node:crypto";

import {
    generateRegistrationOptions
} from "@simplewebauthn/server";

import {
    getDb,
    getOrCreateUser,
    getPasskeys
} from "./lib/db.js";

import {
    getSession
} from "./lib/session.js";


/*
 * 현재 접속 주소를 기준으로
 * WebAuthn RP ID / Origin 결정
 *
 * 운영 Vercel에서는 환경변수를
 * 넣어두는 것을 권장.
 */
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
        req.headers["x-forwarded-proto"];


    const protocol =
        String(
            Array.isArray(forwardedProto)
                ? forwardedProto[0]
                : (
                    forwardedProto ||
                    (
                        hostname === "localhost"
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


/*
 * JSON Body
 */
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

    /*
     * POST만 허용
     */
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


        const username =
            String(
                body.username || ""
            )
                .trim()
                .toLowerCase();


        /*
         * 계정 생성 또는 조회
         */
        const user =
            await getOrCreateUser(
                username
            );


        /*
         * 이미 등록된 패스키 조회
         */
        const existingPasskeys =
            await getPasskeys(
                user.id
            );


        /*
         * 첫 번째 패스키 등록은 허용.
         *
         * 패스키가 이미 존재한다면
         * 같은 계정으로 로그인된 경우에만
         * 추가 패스키 등록 가능.
         */
        if (
            existingPasskeys.length >
            0
        ) {

            const session =
                getSession(req);


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
                            "추가 패스키 등록은 기존 패스키로 로그인한 뒤 가능합니다.",

                        code:
                            "LOGIN_REQUIRED_FOR_EXTRA_PASSKEY"

                    });

            }

        }


        const {
            rpID
        } =
            getWebAuthnConfig(
                req
            );


        /*
         * SimpleWebAuthn v14에서는
         * userID에 문자열을 직접 넣지 않고
         * Uint8Array를 사용.
         */
        const userID =
            new TextEncoder()
                .encode(
                    String(
                        user.id
                    )
                );


        /*
         * 새 등록 challenge 생성
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
                                passkey.credential_id,

                            transports:
                                Array.isArray(
                                    passkey.transports
                                )
                                    ? passkey.transports
                                    : []

                        })
                    ),

                authenticatorSelection: {

                    residentKey:
                        "required",

                    userVerification:
                        "required"

                },

                /*
                 * 첫 번째 키:
                 * 현재 장치 사용
                 *
                 * 두 번째 이상:
                 * iPhone / Android 같은
                 * 원격 장치를 우선 표시
                 */
                preferredAuthenticatorType:
                    existingPasskeys.length === 0
                        ? "localDevice"
                        : "remoteDevice",

                supportedAlgorithmIDs:
                    [
                        -7,
                        -257
                    ]

            });


        const db =
            getDb();


        /*
         * 각 등록 시도마다
         * 새로운 flowId 생성
         */
        const flowId =
            crypto.randomUUID();


        /*
         * 오래된 challenge 정리
         */
        await db.query(
            `
            DELETE FROM challenges

            WHERE expires_at <
                  NOW() - INTERVAL '1 hour'
            `
        );


        /*
         * challenge DB 저장
         *
         * 5분 후 만료
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
                $3,
                $4,
                NOW() + INTERVAL '5 minutes'
            )
            `,
            [
                flowId,
                user.id,
                "register",
                options.challenge
            ]
        );


        /*
         * 과제 증거용 로그
         *
         * 등록할 때마다 challenge가
         * 달라지는지 확인 가능.
         */
        console.log(
            "[PASSKEY REGISTER OPTIONS]",
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


        /*
         * 브라우저로 전달
         */
        return res
            .status(200)
            .json({

                flowId,

                options

            });

    } catch (
        error
    ) {

        console.error(
            "[REGISTER OPTIONS ERROR]",
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
                    "패스키 등록 옵션 생성 중 오류가 발생했습니다."

            });

    }

}