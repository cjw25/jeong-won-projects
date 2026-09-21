import crypto from "node:crypto";


const COOKIE_NAME =
    "cjw_passkey_session";


/*
 * Vercel 환경변수에서
 * 세션 서명용 secret 가져오기
 */
function getSecret() {

    const secret =
        process.env
            .SESSION_SECRET;


    if (
        !secret ||
        secret.length < 32
    ) {

        throw new Error(
            "SESSION_SECRET 환경변수는 32자 이상이어야 합니다."
        );

    }


    return secret;

}


/*
 * HMAC-SHA256 서명
 */
function createSignature(
    value
) {

    return crypto
        .createHmac(
            "sha256",
            getSecret()
        )
        .update(
            value
        )
        .digest(
            "base64url"
        );

}


/*
 * 세션 내용을 Base64URL로 변환
 */
function encode(
    data
) {

    return Buffer
        .from(
            JSON.stringify(
                data
            )
        )
        .toString(
            "base64url"
        );

}


/*
 * Cookie 헤더 파싱
 */
function readCookies(
    req
) {

    const result =
        {};


    const cookieHeader =
        req.headers.cookie ||
        "";


    cookieHeader
        .split(";")
        .forEach(
            cookie => {

                const index =
                    cookie.indexOf(
                        "="
                    );


                if (
                    index <= 0
                ) {

                    return;

                }


                const name =
                    cookie
                        .slice(
                            0,
                            index
                        )
                        .trim();


                const value =
                    cookie
                        .slice(
                            index + 1
                        )
                        .trim();


                result[name] =
                    decodeURIComponent(
                        value
                    );

            }
        );


    return result;

}


/*
 * 패스키 로그인 성공 후
 * 세션 생성
 */
export function createSession(
    req,
    res,
    user
) {

    const payload =
        encode(
            {

                userId:
                    String(
                        user.id
                    ),

                username:
                    user.username,

                displayName:
                    user.display_name,

                /*
                 * 24시간
                 */
                expiresAt:
                    Date.now()
                    +
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )

            }
        );


    const signature =
        createSignature(
            payload
        );


    const token =
        `${payload}.${signature}`;


    const hostname =
        String(
            req.headers.host ||
            ""
        );


    /*
     * localhost에서는 Secure 사용 안 함.
     * Vercel에서는 Secure 사용.
     */
    const secure =
        !hostname.startsWith(
            "localhost"
        );


    let cookie =
        `${COOKIE_NAME}=${encodeURIComponent(token)}; `
        +
        `Path=/; `
        +
        `HttpOnly; `
        +
        `SameSite=Lax; `
        +
        `Max-Age=86400`;


    if (secure) {

        cookie +=
            "; Secure";

    }


    res.setHeader(
        "Set-Cookie",
        cookie
    );

}


/*
 * 현재 세션 읽기
 */
export function getSession(
    req
) {

    const cookies =
        readCookies(
            req
        );


    const token =
        cookies[
            COOKIE_NAME
        ];


    if (!token) {

        return null;

    }


    const parts =
        token.split(
            "."
        );


    if (
        parts.length !== 2
    ) {

        return null;

    }


    const [
        payload,
        receivedSignature
    ] =
        parts;


    const expectedSignature =
        createSignature(
            payload
        );


    const receivedBuffer =
        Buffer.from(
            receivedSignature
        );


    const expectedBuffer =
        Buffer.from(
            expectedSignature
        );


    if (
        receivedBuffer.length !==
        expectedBuffer.length
    ) {

        return null;

    }


    const valid =
        crypto.timingSafeEqual(
            receivedBuffer,
            expectedBuffer
        );


    if (!valid) {

        return null;

    }


    try {

        const session =
            JSON.parse(
                Buffer
                    .from(
                        payload,
                        "base64url"
                    )
                    .toString(
                        "utf8"
                    )
            );


        /*
         * 세션 만료
         */
        if (
            !session.expiresAt ||
            session.expiresAt <
            Date.now()
        ) {

            return null;

        }


        return session;

    } catch {

        return null;

    }

}


/*
 * 로그인이 필요한 API에서 사용.
 *
 * 인증 안 됨 → HTTP 401
 */
export function requireSession(
    req
) {

    const session =
        getSession(
            req
        );


    if (!session) {

        const error =
            new Error(
                "패스키 인증이 필요합니다."
            );


        error.status =
            401;


        error.code =
            "AUTH_REQUIRED";


        throw error;

    }


    return session;

}


/*
 * 로그아웃
 */
export function destroySession(
    req,
    res
) {

    const hostname =
        String(
            req.headers.host ||
            ""
        );


    const secure =
        !hostname.startsWith(
            "localhost"
        );


    let cookie =
        `${COOKIE_NAME}=; `
        +
        `Path=/; `
        +
        `HttpOnly; `
        +
        `SameSite=Lax; `
        +
        `Max-Age=0`;


    if (secure) {

        cookie +=
            "; Secure";

    }


    res.setHeader(
        "Set-Cookie",
        cookie
    );

}