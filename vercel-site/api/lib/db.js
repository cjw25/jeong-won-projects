import pg from "pg";

const {
    Pool
} = pg;


/*
 * Vercel 서버리스 인스턴스가 살아 있는 동안
 * DB Pool을 재사용한다.
 *
 * 요청마다 new Pool()을 만들지 않는다.
 */
let pool = null;


/*
 * DB 초기화 중복 실행 방지
 */
let schemaPromise = null;


/*
 * 과제용 테스트 사용자
 *
 * 실제 개인정보가 아니다.
 */
const allowedUsers = {

    "owner-a":
        "계정 A",

    "owner-b":
        "계정 B"

};


/* ==================================================
   PostgreSQL 연결

   Vercel
       ↓
   Supabase Transaction Pooler
       ↓
   PostgreSQL
================================================== */
export function getDb() {

    if (
        !process.env.DATABASE_URL
    ) {

        throw new Error(
            "DATABASE_URL 환경변수가 설정되어 있지 않습니다."
        );

    }


    if (!pool) {

        pool =
            new Pool({

                /*
                 * Supabase에서 복사한
                 * Transaction Pooler 주소
                 */
                connectionString:
                    process.env.DATABASE_URL,


                /*
                 * Vercel 서버리스에서는
                 * 인스턴스마다 많은 연결을
                 * 유지할 필요가 없다.
                 */
                max:
                    1,


                /*
                 * 유휴 연결 정리
                 */
                idleTimeoutMillis:
                    10000,


                /*
                 * 연결 시도 제한
                 */
                connectionTimeoutMillis:
                    10000,


                /*
                 * 서버리스 함수 종료 시
                 * Pool 때문에 프로세스가
                 * 붙잡히는 것을 줄인다.
                 */
                allowExitOnIdle:
                    true,


                /*
                 * Supabase PostgreSQL은
                 * SSL 연결 사용.
                 *
                 * DATABASE_URL에도
                 * sslmode=require 사용 권장.
                 */
                ssl: {
                    rejectUnauthorized:
                        false
                }

            });

    }


    return pool;

}


/* ==================================================
   DB 테이블 초기화
================================================== */
export async function initDb() {

    /*
     * 이미 초기화 작업이 시작됐다면
     * 같은 Promise 사용
     */
    if (
        schemaPromise
    ) {

        return schemaPromise;

    }


    schemaPromise =
        (
            async () => {

                const db =
                    getDb();


                /* ==========================================
                   USERS

                   비밀번호 컬럼이 없다.
                ========================================== */
                await db.query(`
                    CREATE TABLE IF NOT EXISTS users (

                        id
                            BIGSERIAL
                            PRIMARY KEY,

                        username
                            VARCHAR(50)
                            UNIQUE
                            NOT NULL,

                        display_name
                            VARCHAR(100)
                            NOT NULL,

                        created_at
                            TIMESTAMPTZ
                            NOT NULL
                            DEFAULT NOW()

                    )
                `);


                /* ==========================================
                   PASSKEYS

                   서버에 저장하는 것:
                   - credential_id
                   - public_key
                   - counter
                   - transports
                   - name

                   private_key는 없다.
                ========================================== */
                await db.query(`
                    CREATE TABLE IF NOT EXISTS passkeys (

                        id
                            BIGSERIAL
                            PRIMARY KEY,

                        user_id
                            BIGINT
                            NOT NULL
                            REFERENCES users(id)
                            ON DELETE CASCADE,

                        credential_id
                            TEXT
                            UNIQUE
                            NOT NULL,

                        public_key
                            TEXT
                            NOT NULL,

                        counter
                            BIGINT
                            NOT NULL
                            DEFAULT 0,

                        transports
                            JSONB
                            NOT NULL
                            DEFAULT '[]'::jsonb,

                        name
                            VARCHAR(100)
                            NOT NULL,

                        created_at
                            TIMESTAMPTZ
                            NOT NULL
                            DEFAULT NOW()

                    )
                `);


                /* ==========================================
                   PRIVATE ITEMS

                   과제용 비공개 자료
                ========================================== */
                await db.query(`
                    CREATE TABLE IF NOT EXISTS private_items (

                        id
                            BIGSERIAL
                            PRIMARY KEY,

                        user_id
                            BIGINT
                            NOT NULL
                            REFERENCES users(id)
                            ON DELETE CASCADE,

                        title
                            VARCHAR(200)
                            NOT NULL,

                        content
                            TEXT
                            NOT NULL,

                        created_at
                            TIMESTAMPTZ
                            NOT NULL
                            DEFAULT NOW()

                    )
                `);


                /* ==========================================
                   CHALLENGES

                   등록/로그인 challenge를 저장.

                   used_at이 NULL:
                       아직 사용 안 함

                   used_at 값 있음:
                       이미 사용됨

                   따라서 같은 challenge 재사용 방지.
                ========================================== */
                await db.query(`
                    CREATE TABLE IF NOT EXISTS challenges (

                        id
                            UUID
                            PRIMARY KEY,

                        user_id
                            BIGINT
                            NOT NULL
                            REFERENCES users(id)
                            ON DELETE CASCADE,

                        challenge_type
                            VARCHAR(20)
                            NOT NULL,

                        challenge
                            TEXT
                            NOT NULL,

                        expires_at
                            TIMESTAMPTZ
                            NOT NULL,

                        used_at
                            TIMESTAMPTZ,

                        created_at
                            TIMESTAMPTZ
                            NOT NULL
                            DEFAULT NOW()

                    )
                `);


                /* ==========================================
                   INDEX
                ========================================== */

                await db.query(`
                    CREATE INDEX IF NOT EXISTS
                        idx_passkeys_user_id

                    ON passkeys(user_id)
                `);


                await db.query(`
                    CREATE INDEX IF NOT EXISTS
                        idx_private_items_user_id

                    ON private_items(user_id)
                `);


                await db.query(`
                    CREATE INDEX IF NOT EXISTS
                        idx_challenges_user_id

                    ON challenges(user_id)
                `);


                await db.query(`
                    CREATE INDEX IF NOT EXISTS
                        idx_challenges_lookup

                    ON challenges(
                        id,
                        user_id,
                        challenge_type
                    )
                `);


                console.log(
                    "[DATABASE]",
                    "Supabase schema ready"
                );

            }
        )();


    /*
     * 초기화 실패하면 다음 요청에서
     * 다시 초기화할 수 있도록 초기화.
     */
    try {

        await schemaPromise;

    } catch (
        error
    ) {

        schemaPromise =
            null;


        console.error(
            "[DATABASE INIT ERROR]",
            error
        );


        throw error;

    }

}


/* ==================================================
   Username 검증
================================================== */
export function validateUsername(
    username
) {

    const normalized =
        String(
            username || ""
        )
            .trim()
            .toLowerCase();


    if (
        !allowedUsers[
            normalized
        ]
    ) {

        const error =
            new Error(
                "owner-a 또는 owner-b 계정만 사용할 수 있습니다."
            );


        error.status =
            400;


        error.code =
            "INVALID_USERNAME";


        throw error;

    }


    return normalized;

}


/* ==================================================
   사용자 생성 또는 조회
================================================== */
export async function getOrCreateUser(
    username
) {

    await initDb();


    const db =
        getDb();


    const normalized =
        validateUsername(
            username
        );


    const displayName =
        allowedUsers[
            normalized
        ];


    /*
     * 사용자 생성
     *
     * 이미 존재하면 아무것도 하지 않음.
     */
    await db.query(
        `
        INSERT INTO users (

            username,

            display_name

        )

        VALUES (
            $1,
            $2
        )

        ON CONFLICT (username)

        DO NOTHING
        `,
        [

            normalized,

            displayName

        ]
    );


    /*
     * 사용자 다시 조회
     */
    const userResult =
        await db.query(
            `
            SELECT

                id,

                username,

                display_name,

                created_at

            FROM users

            WHERE username =
                  $1

            LIMIT 1
            `,
            [
                normalized
            ]
        );


    const user =
        userResult
            .rows[0];


    if (!user) {

        throw new Error(
            "사용자를 생성하거나 조회하지 못했습니다."
        );

    }


    /* ==========================================
       과제용 비공개 데이터 생성

       해당 사용자의 자료가 없을 때
       3개를 자동 생성.
    ========================================== */

    const countResult =
        await db.query(
            `
            SELECT

                COUNT(*)::int
                AS count

            FROM private_items

            WHERE user_id =
                  $1
            `,
            [
                user.id
            ]
        );


    if (
        countResult
            .rows[0]
            .count === 0
    ) {

        const prefix =
            normalized ===
            "owner-a"

                ? "A"

                : "B";


        await db.query(
            `
            INSERT INTO private_items (

                user_id,

                title,

                content

            )

            VALUES

            (
                $1,
                $2,
                $3
            ),

            (
                $1,
                $4,
                $5
            ),

            (
                $1,
                $6,
                $7
            )
            `,
            [

                user.id,


                "준비 중인 프로젝트",

                `${prefix} 계정용으로 만들어 넣은 프로젝트 메모입니다.`,


                "지원 예정 목록",

                `${prefix} 계정용으로 만들어 넣은 지원 목록입니다.`,


                "개인 회고",

                `${prefix} 계정용으로 만들어 넣은 회고입니다.`

            ]
        );


        console.log(
            "[PRIVATE DATA CREATED]",
            {

                username:
                    normalized,

                count:
                    3

            }
        );

    }


    return user;

}


/* ==================================================
   사용자 조회
================================================== */
export async function findUser(
    username
) {

    await initDb();


    const db =
        getDb();


    const normalized =
        validateUsername(
            username
        );


    const result =
        await db.query(
            `
            SELECT

                id,

                username,

                display_name,

                created_at

            FROM users

            WHERE username =
                  $1

            LIMIT 1
            `,
            [
                normalized
            ]
        );


    return result
        .rows[0]
        ||
        null;

}


/* ==================================================
   사용자 패스키 목록
================================================== */
export async function getPasskeys(
    userId
) {

    await initDb();


    const db =
        getDb();


    const result =
        await db.query(
            `
            SELECT

                id,

                credential_id,

                public_key,

                counter,

                transports,

                name,

                created_at

            FROM passkeys

            WHERE user_id =
                  $1

            ORDER BY
                created_at ASC
            `,
            [
                userId
            ]
        );


    return result.rows;

}