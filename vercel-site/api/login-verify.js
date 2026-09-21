import {
    verifyAuthenticationResponse
} from "@simplewebauthn/server";

import {
    getDb,
    findUser
} from "./lib/db.js";

import {
    createSession
} from "./lib/session.js";


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
 * 요청 JSON 읽기
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

            username,

            flowId,

            response

        } =
            body;


        /*
         * 필수값 확인
         */
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


        /*
         * 사용자 조회
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
                        "사용자를 찾을 수 없습니다.",

                    code:
                        "USER_NOT_FOUND"

                });

        }


        const db =
            getDb();


        /*
         * challenge를 여기서 바로 사용 처리한다.
         *
         * 중요한 부분:
         *
         * used_at IS NULL인 경우만
         * UPDATE 성공.
         *
         * 따라서 같은 flowId를
         * 두 번째 사용하면 rows가 0개가 됨.
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
                      'login'

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
         * challenge가 이미 사용되었거나
         * 5분이 지나 만료됨.
         */
        if (
            challengeResult
                .rows
                .length === 0
        ) {

            return res
                .status(401)
                .json({

                    verified:
                        false,

                    error:
                        "로그인 challenge가 만료되었거나 이미 사용되었습니다.",

                    code:
                        "CHALLENGE_REUSED_OR_EXPIRED"

                });

        }


        const expectedChallenge =
            challengeResult
                .rows[0]
                .challenge;


        /*
         * 브라우저가 사용한
         * Credential ID를 기준으로
         *
         * 반드시 현재 사용자의
         * 패스키만 검색한다.
         *
         * 이 조건이 중요하다:
         *
         * WHERE user_id = user.id
         */
        const passkeyResult =
            await db.query(
                `
                SELECT
                    id,
                    user_id,
                    credential_id,
                    public_key,
                    counter,
                    transports,
                    name,
                    created_at

                FROM passkeys

                WHERE user_id =
                      $1

                  AND credential_id =
                      $2

                LIMIT 1
                `,
                [

                    user.id,

                    response.id

                ]
            );


        const passkey =
            passkeyResult
                .rows[0];


        /*
         * 다른 계정의 패스키거나
         * 이미 삭제된 패스키인 경우
         */
        if (!passkey) {

            console.log(
                "[PASSKEY LOGIN DENIED]",
                {

                    username:
                        user.username,

                    credentialId:
                        response.id,

                    reason:
                        "UNKNOWN_OR_OTHER_USER_CREDENTIAL"

                }
            );


            return res
                .status(401)
                .json({

                    verified:
                        false,

                    error:
                        "이 계정에 등록되지 않았거나 삭제된 패스키입니다.",

                    code:
                        "UNKNOWN_CREDENTIAL"

                });

        }


        /*
         * DB에는 공개키가
         * Base64URL 문자열로 저장되어 있음.
         *
         * SimpleWebAuthn은
         * Uint8Array를 필요로 함.
         */
        const credentialPublicKey =
            new Uint8Array(

                Buffer.from(
                    passkey.public_key,
                    "base64url"
                )

            );


        const {
            rpID,
            origin
        } =
            getWebAuthnConfig(
                req
            );


        /*
         * 핵심:
         *
         * authenticator가 만든 서명을
         * DB에 저장한 공개키로 검증.
         */
        const verification =
            await verifyAuthenticationResponse({

                response,

                expectedChallenge,

                expectedOrigin:
                    origin,

                expectedRPID:
                    rpID,

                requireUserVerification:
                    true,

                credential: {

                    id:
                        passkey
                            .credential_id,

                    publicKey:
                        credentialPublicKey,

                    counter:
                        Number(
                            passkey
                                .counter
                        ),

                    transports:
                        Array.isArray(
                            passkey
                                .transports
                        )
                            ? passkey
                                .transports
                            : []

                }

            });


        /*
         * 서명 검증 실패
         */
        if (
            !verification.verified
        ) {

            console.log(
                "[PASSKEY SIGNATURE FAILED]",
                {

                    username:
                        user.username,

                    credentialId:
                        passkey
                            .credential_id,

                    verified:
                        false

                }
            );


            return res
                .status(401)
                .json({

                    verified:
                        false,

                    error:
                        "패스키 서명 검증에 실패했습니다.",

                    code:
                        "SIGNATURE_INVALID"

                });

        }


        /*
         * 인증 성공 후
         * 새로운 signature counter 저장.
         *
         * SimpleWebAuthn 공식 권장 사항.
         */
        const newCounter =
            verification
                .authenticationInfo
                .newCounter;


        await db.query(
            `
            UPDATE passkeys

            SET counter =
                $1

            WHERE id =
                  $2
            `,
            [

                newCounter,

                passkey.id

            ]
        );


        /*
         * 공개키 검증까지 성공했으므로
         * 이제 로그인 세션 생성.
         */
        createSession(
            req,
            res,
            user
        );


        /*
         * 성공 로그.
         *
         * Cookie 값이나 세션 토큰 자체는
         * 절대 로그에 출력하지 않음.
         */
        console.log(
            "[PASSKEY LOGIN SUCCESS]",
            {

                username:
                    user.username,

                credentialId:
                    passkey
                        .credential_id,

                signatureValid:
                    true,

                oldCounter:
                    passkey.counter,

                newCounter

            }
        );


        return res
            .status(200)
            .json({

                verified:
                    true,

                message:
                    "패스키 로그인에 성공했습니다.",

                user: {

                    username:
                        user.username,

                    displayName:
                        user.display_name

                },

                authentication: {

                    signatureValid:
                        true,

                    credentialId:
                        passkey
                            .credential_id

                }

            });

    } catch (
        error
    ) {

        /*
         * verifyAuthenticationResponse가
         * 실제 서명 검증 오류를 throw할 수도 있음.
         */
        console.error(
            "[LOGIN VERIFY ERROR]",
            {

                name:
                    error?.name,

                message:
                    error?.message

            }
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
                    "패스키 인증에 실패했습니다.",

                code:
                    error.code ||
                    "PASSKEY_VERIFY_FAILED"

            });

    }

}