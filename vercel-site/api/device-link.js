import {
    requireSession
} from "./lib/session.js";

import {
    createDeviceInvite
} from "./lib/device-invite.js";


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

        /*
         * 반드시 기존 패스키로
         * 로그인되어 있어야 함.
         */
        const session =
            requireSession(
                req
            );


        const invite =
            await createDeviceInvite(
                session.userId
            );


        console.log(
            "[DEVICE PASSKEY LINK]",
            {

                username:
                    session.username,

                expiresAt:
                    invite.expiresAt

                /*
                 * 실제 코드는 로그에 출력하지 않는다.
                 */

            }
        );


        return res
            .status(200)
            .json({

                success:
                    true,

                username:
                    session.username,

                code:
                    invite.code,

                expiresAt:
                    invite.expiresAt,

                path:
                    "/device-register.html"

            });

    } catch (
        error
    ) {

        console.error(
            "[DEVICE LINK ERROR]",
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
                    "등록 코드 생성 중 오류가 발생했습니다.",

                code:
                    error.code ||
                    undefined

            });

    }

}