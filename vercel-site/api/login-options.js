import crypto from "node:crypto";

import {
    generateAuthenticationOptions
} from "@simplewebauthn/server";

import {
    getDb,
    findUser,
    getPasskeys
} from "./lib/db.js";


/*
 * 현재 사이트의 RP ID 확인
 */
function getWebAuthnConfig(req) {

    /*
     * Vercel 환경변수에 직접 지정한 경우
     */
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


    /*
     * Vercel 요청 주소에서 자동 판단
     */
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
 * POST JSON 읽기
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


    let raw = "";


    for await (
        const chunk of req
    ) {

        raw += chunk;

    }


    return raw
        ? JSON.parse(raw)
        : {};

}


export default async function handler(
    req,
    res
) {

    /*
     * POST 요청만 허용
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


        if (!username) {

            return res
                .status(400)
                .json({

                    error:
                        "username이 필요합니다."

                });

        }


        /*
         * 로그인할 사용자 조회
         */
        const user =
            await findUser(
                username
            );


        if (!user) {

            return res
                .status(404)
                .json({

                    error:
                        "등록된 계정을 찾을 수 없습니다.",

                    code:
                        "USER_NOT_FOUND"

                });

        }


        /*
         * 해당 계정의 패스키 목록
         */
        const passkeys =
            await getPasskeys(
                user.id
            );


        if (
            passkeys.length === 0
        ) {

            return res
                .status(401)
                .json({

                    error:
                        "등록된 패스키가 없습니다.",

                    code:
                        "NO_PASSKEY"

                });

        }


        const {
            rpID
        } =
            getWebAuthnConfig(
                req
            );


        /*
         * 새로운 로그인 challenge 생성
         *
         * 해당 사용자가 등록한 Credential만
         * 사용할 수 있도록 allowCredentials 지정.
         */
        const options =
            await generateAuthenticationOptions({

                rpID,

                allowCredentials:
                    passkeys.map(
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

                /*
                 * 패스키 인증 시
                 * 사용자 확인 요구
                 */
                userVerification:
                    "required"

            });


        /*
         * 로그인 시도 식별 ID
         */
        const flowId =
            crypto.randomUUID();


        const db =
            getDb();


        /*
         * 오래된 challenge 정리
         */
        await db.query(`
            DELETE FROM challenges

            WHERE expires_at <
                  NOW() - INTERVAL '1 hour'
        `);


        /*
         * 서버가 방금 생성한 challenge 저장.
         *
         * 이 값을 나중에
         * login-verify에서 비교한다.
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

                "login",

                options.challenge

            ]
        );


        /*
         * 과제 증거용.
         *
         * 로그인 시도마다
         * challenge가 달라지는 것을
         * Vercel 로그에서 확인 가능.
         */
        console.log(
            "[PASSKEY LOGIN OPTIONS]",
            {

                username:
                    user.username,

                flowId,

                challenge:
                    options.challenge,

                passkeyCount:
                    passkeys.length

            }
        );


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
            "[LOGIN OPTIONS ERROR]",
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
                    "로그인 옵션 생성 중 오류가 발생했습니다."

            });

    }

}