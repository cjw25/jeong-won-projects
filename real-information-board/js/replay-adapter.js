(function (global) {

    "use strict";


    const ASSET_ROOT =
        "./assets/t04-real-information-board-public-v1";


    const FIXTURE_FILES =
        Object.freeze({

            "T04-AUTH-401":
                "fixtures/auth-401.json",

            "T04-NORMAL-D1-A":
                "fixtures/normal-d1-a.json",

            "T04-NORMAL-D1-B":
                "fixtures/normal-d1-b.json",

            "T04-NORMAL-D2":
                "fixtures/normal-d2.json",

            "T04-OFFLINE":
                "fixtures/offline.json",

            "T04-RATE-429":
                "fixtures/rate-429.json",

            "T04-RECOVER-D2":
                "fixtures/recover-d2.json",

            "T04-SCHEMA-BREAK":
                "fixtures/schema-break.json",

            "T04-TIMEOUT":
                "fixtures/timeout.json"
        });


    /* =====================================================
       LOAD FIXTURE
    ====================================================== */

    async function loadFixture(
        fixtureId
    ) {

        const relative =
            FIXTURE_FILES[
                fixtureId
            ];


        if (
            !relative
        ) {

            throw new Error(
                `알 수 없는 fixture: ${fixtureId}`
            );
        }


        const response =
            await fetch(
                `${ASSET_ROOT}/${relative}`,
                {
                    cache:
                        "no-store"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `fixture 파일을 읽지 못했습니다: ${fixtureId}`
            );
        }


        const fixture =
            await response.json();


        if (
            fixture.fixture_id !==
            fixtureId
        ) {

            throw new Error(
                `fixture_id 불일치: ${fixtureId}`
            );
        }


        return fixture;
    }


    /* =====================================================
       RUN FIXTURE
    ====================================================== */

    function runFixture(
        inputState,
        fixture
    ) {

        const headers =
            fixture.transport
                ?.headers ||
            {};


        const meta = {

            fixture_id:
                fixture.fixture_id,

            virtual_now:
                fixture.virtual_now,

            retry_after_seconds:
                headers[
                    "retry-after"
                ]

                    ? Number(
                        headers[
                            "retry-after"
                        ]
                    )

                    : null
        };


        /* TIMEOUT */

        if (
            fixture.transport
                .mode ===
            "timeout"
        ) {

            return global.T04Core
                .applyError(
                    inputState,
                    "timeout",
                    meta
                );
        }


        /* OFFLINE */

        if (
            fixture.transport
                .mode ===
            "offline"
        ) {

            return global.T04Core
                .applyError(
                    inputState,
                    "offline",
                    meta
                );
        }


        /* AUTH */

        if (
            fixture.transport
                .status ===
                401 ||

            fixture.transport
                .status ===
                403
        ) {

            return global.T04Core
                .applyError(
                    inputState,
                    "auth",
                    meta
                );
        }


        /* RATE LIMIT */

        if (
            fixture.transport
                .status ===
            429
        ) {

            return global.T04Core
                .applyError(
                    inputState,
                    "rate_limit",
                    meta
                );
        }


        /* SUCCESS */

        if (
            fixture.transport
                .status >=
                200 &&

            fixture.transport
                .status <
                300
        ) {

            try {

                return global.T04Core
                    .applySuccessfulReading(
                        inputState,
                        fixture.payload,
                        meta,
                        "demo"
                    );

            } catch {

                return global.T04Core
                    .applyError(
                        inputState,
                        "schema_error",
                        meta
                    );
            }
        }


        return global.T04Core
            .applyError(
                inputState,
                "schema_error",
                meta
            );
    }


    /* =====================================================
       REPLAY
    ====================================================== */

    async function replay(
        inputState,
        fixtureId
    ) {

        const fixture =
            await loadFixture(
                fixtureId
            );


        return {

            state:
                runFixture(
                    inputState,
                    fixture
                ),

            fixture
        };
    }


    /* =====================================================
       SHA-256
    ====================================================== */

    async function sha256Hex(
        arrayBuffer
    ) {

        const digest =
            await crypto.subtle
                .digest(
                    "SHA-256",
                    arrayBuffer
                );


        return Array.from(
            new Uint8Array(
                digest
            )
        )
        .map(
            byte =>
                byte
                    .toString(
                        16
                    )
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");
    }


    /* =====================================================
       VERIFY PACKAGE
    ====================================================== */

    async function verifyAssetPackage() {

        const manifestResponse =
            await fetch(
                `${ASSET_ROOT}/asset-manifest.json`,
                {
                    cache:
                        "no-store"
                }
            );


        if (
            !manifestResponse.ok
        ) {

            throw new Error(
                "asset-manifest.json을 읽지 못했습니다."
            );
        }


        const manifest =
            await manifestResponse
                .json();


        const results =
            [];


        for (
            const item
            of manifest.files
        ) {

            const response =
                await fetch(
                    `${ASSET_ROOT}/${item.path}`,
                    {
                        cache:
                            "no-store"
                    }
                );


            if (
                !response.ok
            ) {

                results.push({

                    path:
                        item.path,

                    expected:
                        item.sha256,

                    actual:
                        null,

                    ok:
                        false
                });


                continue;
            }


            const actual =
                await sha256Hex(
                    await response
                        .arrayBuffer()
                );


            results.push({

                path:
                    item.path,

                expected:
                    item.sha256,

                actual,

                ok:
                    actual ===
                    item.sha256
            });
        }


        return {

            package_id:
                manifest.package_id,

            results,

            total:
                results.length,

            matched:
                results
                    .filter(
                        result =>
                            result.ok
                    )
                    .length
        };
    }


    global.T04ReplayAdapter = {

        ASSET_ROOT,

        FIXTURE_FILES,

        loadFixture,

        runFixture,

        replay,

        verifyAssetPackage
    };

})(window);