import {
    getDb,
    initDb,
    validateUsername
} from "../lib/db.js";

import {
    requireSession
} from "../lib/session.js";


export default async function handler(
    req,
    res
) {

    /*
     * GET만 허용
     */
    if (
        req.method !== "GET"
    ) {

        res.setHeader(
            "Allow",
            "GET"
        );


        return res
            .status(405)
            .json({

                error:
                    "GET 요청만 사용할 수 있습니다."

            });

    }


    try {

        await initDb();


        /*
         * 가장 먼저 세션 검사.
         *
         * 인증되지 않은 사용자는
         * DB 조회 전에 401.
         */
        const session =
            requireSession(
                req
            );


        const db =
            getDb();


        /* ==================================================
           다른 사용자 직접 지정 테스트

           예:
           /api/private-items?username=owner-b

           owner-a 로그인 상태에서
           owner-b를 지정하면 403.
        ================================================== */

        if (
            req.query.username
        ) {

            const requestedUsername =
                validateUsername(
                    req.query.username
                );


            if (
                requestedUsername !==
                session.username
            ) {

                console.log(
                    "[PRIVATE ACCESS DENIED]",
                    {

                        loginUser:
                            session.username,

                        requestedUser:
                            requestedUsername,

                        result:
                            403

                    }
                );


                return res
                    .status(403)
                    .json({

                        error:
                            "다른 계정의 비공개 자료에는 접근할 수 없습니다.",

                        code:
                            "FORBIDDEN_OTHER_USER"

                    });

            }

        }


        /*
         * 매우 중요:
         *
         * userId 같은 값이 URL에 들어와도
         * 절대 그 값을 DB 조건에 사용하지 않는다.
         *
         * 예:
         *
         * /api/private-items?userId=999
         *
         * 를 보내도
         *
         * session.userId
         *
         * 만 사용한다.
         */
        const result =
            await db.query(
                `
                SELECT
                    id,
                    title,
                    content,
                    created_at

                FROM private_items

                WHERE user_id = $1

                ORDER BY id ASC
                `,
                [
                    session.userId
                ]
            );


        const items =
            result.rows.map(
                item => ({

                    id:
                        String(
                            item.id
                        ),

                    title:
                        item.title,

                    content:
                        item.content,

                    createdAt:
                        item.created_at

                })
            );


        console.log(
            "[PRIVATE ITEMS]",
            {

                username:
                    session.username,

                count:
                    items.length

            }
        );


        return res
            .status(200)
            .json({

                owner:
                    session.username,

                displayName:
                    session.displayName,

                count:
                    items.length,

                items

            });

    } catch (
        error
    ) {

        console.error(
            "[PRIVATE ITEMS ERROR]",
            {

                message:
                    error?.message,

                code:
                    error?.code

            }
        );


        return res
            .status(
                error.status ||
                500
            )
            .json({

                error:
                    error.message ||
                    "비공개 자료를 불러오는 중 오류가 발생했습니다.",

                code:
                    error.code ||
                    undefined

            });

    }

}