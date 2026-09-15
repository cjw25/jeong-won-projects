(function (global) {

    "use strict";


    const SOURCE_NAME =
        "Open-Meteo Forecast API";


    const SIGNAL_ID =
        "daejeon.temperature_2m";


    const SOURCE_URL =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=36.3504" +
        "&longitude=127.3845" +
        "&current=temperature_2m" +
        "&temperature_unit=celsius" +
        "&timeformat=unixtime" +
        "&timezone=Asia%2FSeoul";


    /* =====================================================
       FETCH LIVE
    ====================================================== */

    async function fetchLiveReading() {

        const startedAt =
            new Date();


        const controller =
            new AbortController();


        const timeoutId =
            setTimeout(
                () => {

                    controller.abort();

                },
                8000
            );


        let response;


        try {

            response =
                await fetch(
                    SOURCE_URL,
                    {
                        cache:
                            "no-store",

                        signal:
                            controller.signal
                    }
                );

        } catch (error) {

            clearTimeout(
                timeoutId
            );


            if (
                error &&
                error.name ===
                "AbortError"
            ) {

                const wrapped =
                    new Error(
                        "실제 공개 원천의 응답 시간이 초과되었습니다."
                    );


                wrapped.code =
                    "timeout";


                throw wrapped;
            }


            const wrapped =
                new Error(
                    "실제 공개 원천에 연결하지 못했습니다."
                );


            wrapped.code =
                "offline";


            throw wrapped;
        }


        clearTimeout(
            timeoutId
        );


        /* =================================================
           HTTP STATUS
        ================================================= */

        if (
            !response.ok
        ) {

            const wrapped =
                new Error(
                    `실제 공개 원천 HTTP 오류: ${response.status}`
                );


            if (
                response.status ===
                429
            ) {

                wrapped.code =
                    "rate_limit";

            } else if (
                response.status ===
                    401 ||

                response.status ===
                    403
            ) {

                wrapped.code =
                    "auth";

            } else {

                wrapped.code =
                    "schema_error";
            }


            throw wrapped;
        }


        /* =================================================
           JSON
        ================================================= */

        let raw;


        try {

            raw =
                await response.json();

        } catch {

            const wrapped =
                new Error(
                    "실제 공개 원천의 JSON을 해석할 수 없습니다."
                );


            wrapped.code =
                "schema_error";


            throw wrapped;
        }


        /* =================================================
           FIELD VALIDATION
        ================================================= */

        const temperature =
            raw?.current
                ?.temperature_2m;


        const unit =
            raw?.current_units
                ?.temperature_2m;


        const sourceEpoch =
            raw?.current
                ?.time;


        if (
            typeof temperature !==
                "number" ||

            !Number.isFinite(
                temperature
            ) ||

            typeof unit !==
                "string" ||

            !unit ||

            typeof sourceEpoch !==
                "number"
        ) {

            const wrapped =
                new Error(
                    "실제 공개 원천의 필수 필드 형식이 예상과 다릅니다."
                );


            wrapped.code =
                "schema_error";


            throw wrapped;
        }


        /* =================================================
           NORMALIZE
        ================================================= */

        const fetchedAt =
            new Date()
                .toISOString();


        const sourceTime =
            new Date(
                sourceEpoch *
                1000
            )
            .toISOString();


        const reading = {

            signal_id:
                SIGNAL_ID,

            normalized_value:
                temperature,

            unit:
                unit,

            source_name:
                SOURCE_NAME,

            source_url:
                SOURCE_URL,

            source_time:
                sourceTime,

            fetched_at:
                fetchedAt,

            record_timezone:
                "Asia/Seoul",

            record_date:
                global.T04Core
                    .kstDate(
                        fetchedAt
                    )
        };


        global.T04Core
            .validateNormalizedReading(
                reading
            );


        return {

            reading,

            raw,

            raw_value:
                temperature,

            raw_unit:
                unit,

            request_started_at:
                startedAt
                    .toISOString()
        };
    }


    global.T04LiveAdapter = {

        SOURCE_NAME,

        SIGNAL_ID,

        SOURCE_URL,

        fetchLiveReading
    };

})(window);