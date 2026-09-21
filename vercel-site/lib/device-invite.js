import crypto from "node:crypto";

import {
    getDb,
    initDb
} from "./db.js";


let tableReady = false;


/*
 * 0/O, 1/I 같은 헷갈리는 문자를 제외한
 * 32개 문자.
 *
 * 12자리 = 약 60bit
 */
const CODE_ALPHABET =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


export async function initDeviceInviteTable() {

    if (tableReady) {
        return;
    }


    await initDb();


    const db =
        getDb();


    await db.query(`
        CREATE TABLE IF NOT EXISTS device_invites (

            id
                UUID
                PRIMARY KEY,

            user_id
                BIGINT
                NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            code_hash
                TEXT
                UNIQUE
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


    await db.query(`
        CREATE INDEX IF NOT EXISTS
            idx_device_invites_user_id

        ON device_invites(user_id)
    `);


    await db.query(`
        CREATE INDEX IF NOT EXISTS
            idx_device_invites_code_hash

        ON device_invites(code_hash)
    `);


    tableReady =
        true;

}


/*
 * 코드 입력 시
 * 하이픈/공백 제거.
 */
export function normalizeDeviceCode(
    value
) {

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /[^A-Z0-9]/g,
            ""
        );

}


/*
 * 서버 DB에는 실제 코드를 저장하지 않고
 * SHA-256 hash만 저장.
 */
export function hashDeviceCode(
    value
) {

    const normalized =
        normalizeDeviceCode(
            value
        );


    return crypto
        .createHash(
            "sha256"
        )
        .update(
            normalized
        )
        .digest(
            "hex"
        );

}


/*
 * 12자리 랜덤 코드.
 *
 * 표시:
 * ABCD-EFGH-JKLM
 */
function createPlainCode() {

    const bytes =
        crypto.randomBytes(
            12
        );


    let code =
        "";


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        /*
         * alphabet 길이가 32이므로
         * 하위 5bit 사용 가능.
         */
        code +=
            CODE_ALPHABET[
                bytes[i] & 31
            ];

    }


    return code;

}


export function formatDeviceCode(
    code
) {

    const normalized =
        normalizeDeviceCode(
            code
        );


    return [
        normalized.slice(
            0,
            4
        ),

        normalized.slice(
            4,
            8
        ),

        normalized.slice(
            8,
            12
        )

    ].join("-");

}


/*
 * 현재 로그인 사용자의
 * 새로운 1회용 코드 생성.
 *
 * 이전에 발급했지만 아직 사용하지 않은
 * 코드는 자동 폐기.
 */
export async function createDeviceInvite(
    userId
) {

    await initDeviceInviteTable();


    const db =
        getDb();


    /*
     * 기존 미사용 코드 폐기
     */
    await db.query(
        `
        UPDATE device_invites

        SET used_at =
            NOW()

        WHERE user_id =
              $1

          AND used_at
              IS NULL
        `,
        [
            userId
        ]
    );


    const plainCode =
        createPlainCode();


    const codeHash =
        hashDeviceCode(
            plainCode
        );


    const inviteId =
        crypto.randomUUID();


    /*
     * 5분 유효
     */
    const result =
        await db.query(
            `
            INSERT INTO device_invites (

                id,

                user_id,

                code_hash,

                expires_at

            )

            VALUES (

                $1,

                $2,

                $3,

                NOW()
                +
                INTERVAL '5 minutes'

            )

            RETURNING
                expires_at
            `,
            [

                inviteId,

                userId,

                codeHash

            ]
        );


    return {

        code:
            formatDeviceCode(
                plainCode
            ),

        expiresAt:
            result
                .rows[0]
                .expires_at

    };

}


/*
 * iPhone이 코드를 입력하면
 * 딱 한 번만 사용 처리.
 *
 * 여기서 이미 코드를 소비한다.
 *
 * 등록을 취소했다면
 * PC에서 새 코드를 만들면 됨.
 */
export async function consumeDeviceInvite(
    code
) {

    await initDeviceInviteTable();


    const db =
        getDb();


    const codeHash =
        hashDeviceCode(
            code
        );


    const result =
        await db.query(
            `
            UPDATE device_invites

            SET used_at =
                NOW()

            WHERE code_hash =
                  $1

              AND used_at
                  IS NULL

              AND expires_at >
                  NOW()

            RETURNING
                user_id
            `,
            [
                codeHash
            ]
        );


    if (
        result.rows.length ===
        0
    ) {

        const error =
            new Error(
                "등록 코드가 잘못되었거나 만료되었거나 이미 사용되었습니다."
            );


        error.status =
            401;


        error.code =
            "DEVICE_CODE_INVALID";


        throw error;

    }


    return result
        .rows[0]
        .user_id;

}