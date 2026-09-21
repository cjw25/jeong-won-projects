import {
    getDb,
    initDb
} from "../lib/db.js";

import {
    requireSession
} from "../lib/session.js";


export default async function handler(
    req,
    res
) {

    try {

        /*
         * DB 테이블 준비
         */
        await initDb();


        /*
         * 반드시 로그인한 사용자만
         * 패스키 목록/삭제 가능
         */
        const session =
            requireSession(
                req
            );


        const db =
            getDb();


        /* ==================================================
           GET
           등록된 패스키 목록
        ================================================== */

        if (
            req.method === "GET"
        ) {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        credential_id,
                        public_key,
                        name,
                        created_at

                    FROM passkeys

                    WHERE user_id = $1

                    ORDER BY created_at ASC
                    `,
                    [
                        session.userId
                    ]
                );


            const passkeys =
                result.rows.map(
                    passkey => ({

                        /*
                         * 프런트에서 삭제할 때 사용할
                         * DB ID
                         */
                        id:
                            String(
                                passkey.id
                            ),

                        name:
                            passkey.name,

                        credentialId:
                            passkey
                                .credential_id,

                        /*
                         * 서버가 공개키를
                         * 저장했다는 것을
                         * 과제 증거로 확인 가능
                         */
                        publicKey:
                            passkey
                                .public_key,

                        createdAt:
                            passkey
                                .created_at

                    })
                );


            return res
                .status(200)
                .json({

                    username:
                        session.username,

                    count:
                        passkeys.length,

                    passkeys

                });

        }


        /* ==================================================
           DELETE
           패스키 삭제

           호출 예:
           DELETE /api/passkeys?id=3
        ================================================== */

        if (
            req.method === "DELETE"
        ) {

            const passkeyId =
                String(
                    req.query.id ||
                    ""
                )
                    .trim();


            if (!passkeyId) {

                return res
                    .status(400)
                    .json({

                        error:
                            "삭제할 패스키 id가 필요합니다."

                    });

            }


            /*
             * 현재 사용자에게 등록된
             * 패스키 총 개수 확인
             */
            const countResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*)::int
                        AS count

                    FROM passkeys

                    WHERE user_id = $1
                    `,
                    [
                        session.userId
                    ]
                );


            const passkeyCount =
                countResult
                    .rows[0]
                    .count;


            /*
             * 마지막 1개는 삭제 불가.
             *
             * 패스키가 0개가 되어
             * 계정에 다시 접근하지 못하는
             * 상황을 방지한다.
             */
            if (
                passkeyCount <= 1
            ) {

                return res
                    .status(409)
                    .json({

                        error:
                            "마지막 패스키는 삭제할 수 없습니다. 새 패스키를 먼저 등록하세요.",

                        code:
                            "LAST_PASSKEY"

                    });

            }


            /*
             * 중요한 보안 조건:
             *
             * id뿐 아니라
             * user_id도 같이 확인.
             *
             * 다른 사람의 패스키 ID를
             * 알고 있어도 삭제 불가능.
             */
            const deleteResult =
                await db.query(
                    `
                    DELETE FROM passkeys

                    WHERE id = $1
                      AND user_id = $2

                    RETURNING
                        id,
                        credential_id,
                        name
                    `,
                    [
                        passkeyId,
                        session.userId
                    ]
                );


            if (
                deleteResult
                    .rows
                    .length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "삭제할 패스키를 찾을 수 없습니다.",

                        code:
                            "PASSKEY_NOT_FOUND"

                    });

            }


            const deleted =
                deleteResult.rows[0];


            /*
             * 삭제 후 남은 패스키 개수
             */
            const remainingResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*)::int
                        AS count

                    FROM passkeys

                    WHERE user_id = $1
                    `,
                    [
                        session.userId
                    ]
                );


            const remaining =
                remainingResult
                    .rows[0]
                    .count;


            console.log(
                "[PASSKEY DELETE]",
                {

                    username:
                        session.username,

                    credentialId:
                        deleted
                            .credential_id,

                    remaining

                }
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    deleted: {

                        id:
                            String(
                                deleted.id
                            ),

                        name:
                            deleted.name,

                        credentialId:
                            deleted
                                .credential_id

                    },

                    remaining

                });

        }


        /*
         * GET / DELETE 외에는 거부
         */
        res.setHeader(
            "Allow",
            "GET, DELETE"
        );


        return res
            .status(405)
            .json({

                error:
                    "GET 또는 DELETE 요청만 사용할 수 있습니다."

            });

    } catch (
        error
    ) {

        console.error(
            "[PASSKEYS API ERROR]",
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
                    "패스키 처리 중 오류가 발생했습니다.",

                code:
                    error.code ||
                    undefined

            });

    }

}