import {
    destroySession
} from "../lib/session.js";


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

        /*
         * 현재 로그인 세션 삭제
         */
        destroySession(
            req,
            res
        );


        console.log(
            "[PASSKEY LOGOUT]",
            {
                success: true
            }
        );


        return res
            .status(200)
            .json({

                success:
                    true,

                message:
                    "로그아웃되었습니다."

            });

    } catch (
        error
    ) {

        console.error(
            "[LOGOUT ERROR]",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                error:
                    error.message ||
                    "로그아웃 처리 중 오류가 발생했습니다."

            });

    }

}