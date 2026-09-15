(function (global) {

    "use strict";


    const NORMALIZED_KEYS =
        Object.freeze([

            "signal_id",

            "normalized_value",

            "unit",

            "source_name",

            "source_url",

            "source_time",

            "fetched_at",

            "record_timezone",

            "record_date"
        ]);


    const ERROR_CODES =
        Object.freeze([

            "timeout",

            "auth",

            "rate_limit",

            "offline",

            "schema_error"
        ]);


    /* =====================================================
       CLONE
    ====================================================== */

    function clone(
        value
    ) {

        return JSON.parse(
            JSON.stringify(
                value
            )
        );
    }


    /* =====================================================
       KST DATE
    ====================================================== */

    function kstDate(
        isoString
    ) {

        const date =
            new Date(
                isoString
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            throw new TypeError(
                "fetched_at must be a valid ISO-8601 date-time"
            );
        }


        const parts =
            new Intl.DateTimeFormat(
                "en",
                {
                    timeZone:
                        "Asia/Seoul",

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit"
                }
            )
            .formatToParts(
                date
            );


        const byType =
            Object.fromEntries(
                parts.map(
                    part => [
                        part.type,
                        part.value
                    ]
                )
            );


        return (
            `${byType.year}-${byType.month}-${byType.day}`
        );
    }


    /* =====================================================
       NORMALIZED READING VALIDATION
    ====================================================== */

    function validateNormalizedReading(
        reading
    ) {

        if (
            !reading ||
            typeof reading !==
                "object" ||
            Array.isArray(
                reading
            )
        ) {

            throw new TypeError(
                "normalized reading must be an object"
            );
        }


        const actualKeys =
            Object.keys(
                reading
            )
            .sort();


        const expectedKeys =
            [
                ...NORMALIZED_KEYS
            ]
            .sort();


        if (
            actualKeys.length !==
                expectedKeys.length ||

            actualKeys.some(
                (
                    key,
                    index
                ) =>
                    key !==
                    expectedKeys[
                        index
                    ]
            )
        ) {

            throw new TypeError(
                `normalized reading keys must be exactly: ${NORMALIZED_KEYS.join(", ")}`
            );
        }


        if (
            !/^[a-z0-9][a-z0-9._-]*$/
                .test(
                    reading.signal_id
                ) ||

            reading.signal_id
                .length >
                100
        ) {

            throw new TypeError(
                "signal_id is invalid"
            );
        }


        if (
            typeof reading.normalized_value !==
                "number" ||

            !Number.isFinite(
                reading.normalized_value
            )
        ) {

            throw new TypeError(
                "normalized_value must be a finite number"
            );
        }


        if (
            typeof reading.unit !==
                "string" ||

            !reading.unit.trim() ||

            reading.unit.length >
                24
        ) {

            throw new TypeError(
                "unit is invalid"
            );
        }


        if (
            typeof reading.source_name !==
                "string" ||

            !reading.source_name.trim() ||

            reading.source_name
                .length >
                120
        ) {

            throw new TypeError(
                "source_name is invalid"
            );
        }


        let sourceUrl;


        try {

            sourceUrl =
                new URL(
                    reading.source_url
                );

        } catch {

            throw new TypeError(
                "source_url must be an absolute URL"
            );
        }


        if (
            sourceUrl.protocol !==
            "https:"
        ) {

            throw new TypeError(
                "source_url must use HTTPS"
            );
        }


        if (
            reading.source_time !==
                null &&

            Number.isNaN(
                new Date(
                    reading.source_time
                )
                .getTime()
            )
        ) {

            throw new TypeError(
                "source_time must be a valid date-time or null"
            );
        }


        if (
            Number.isNaN(
                new Date(
                    reading.fetched_at
                )
                .getTime()
            )
        ) {

            throw new TypeError(
                "fetched_at must be a valid date-time"
            );
        }


        if (
            reading.record_timezone !==
            "Asia/Seoul"
        ) {

            throw new TypeError(
                "record_timezone must be Asia/Seoul"
            );
        }


        if (
            !/^\d{4}-\d{2}-\d{2}$/
                .test(
                    reading.record_date
                ) ||

            reading.record_date !==
                kstDate(
                    reading.fetched_at
                )
        ) {

            throw new TypeError(
                "record_date must be the Asia/Seoul date derived from fetched_at"
            );
        }


        return true;
    }


    /* =====================================================
       EMPTY STATE
    ====================================================== */

    function resetEvaluationState() {

        return {

            schema_version:
                "aleph-t04-evaluation-state-v1",

            daily_readings:
                [],

            current_reading:
                null,

            status:
                null,

            last_delta:
                null,

            last_comparison: {

                state:
                    "insufficient",

                direction:
                    null,

                magnitude:
                    null,

                unit:
                    null
            },

            last_run:
                null,

            sequence:
                0
        };
    }


    /* =====================================================
       RECORD ID
    ====================================================== */

    function recordIdFor(
        reading,
        prefix = "record"
    ) {

        return (
            `${prefix}-${reading.signal_id}-${reading.record_date}`
        );
    }


    /* =====================================================
       COMPARISON
    ====================================================== */

    function comparisonFor(
        rows,
        current
    ) {

        const previous =
            rows
                .filter(
                    row =>

                        row.signal_id ===
                            current.signal_id &&

                        row.record_date <
                            current.record_date
                )
                .sort(
                    (
                        left,
                        right
                    ) =>
                        right.record_date
                            .localeCompare(
                                left.record_date
                            )
                )[0];


        if (
            !previous
        ) {

            return {

                state:
                    "insufficient",

                direction:
                    null,

                magnitude:
                    null,

                unit:
                    null
            };
        }


        if (
            previous.unit !==
            current.unit
        ) {

            return {

                state:
                    "unit_mismatch",

                direction:
                    null,

                magnitude:
                    null,

                unit:
                    null
            };
        }


        const signed =
            current.normalized_value -
            previous.normalized_value;


        return {

            state:
                "comparable",

            direction:
                signed > 0
                    ? "increase"
                    : signed < 0
                        ? "decrease"
                        : "unchanged",

            magnitude:
                Math.abs(
                    signed
                ),

            unit:
                current.unit
        };
    }


    /* =====================================================
       SUCCESS
    ====================================================== */

    function applySuccessfulReading(
        inputState,
        reading,
        runMeta = {},
        recordPrefix = "record"
    ) {

        validateNormalizedReading(
            reading
        );


        const state =
            clone(
                inputState
            );


        const existingIndex =
            state.daily_readings
                .findIndex(
                    row =>

                        row.signal_id ===
                            reading.signal_id &&

                        row.record_date ===
                            reading.record_date
                );


        const existing =
            existingIndex >= 0
                ? state.daily_readings[
                    existingIndex
                ]
                : null;


        const row = {

            record_id:
                existing
                    ? existing.record_id
                    : recordIdFor(
                        reading,
                        recordPrefix
                    ),

            signal_id:
                reading.signal_id,

            record_date:
                reading.record_date,

            normalized_value:
                reading.normalized_value,

            unit:
                reading.unit,

            first_fetched_at:
                existing
                    ? existing.first_fetched_at
                    : reading.fetched_at,

            last_fetched_at:
                reading.fetched_at,

            reading:
                clone(
                    reading
                )
        };


        if (
            existingIndex >= 0
        ) {

            state.daily_readings[
                existingIndex
            ] = row;

        } else {

            state.daily_readings
                .push(
                    row
                );
        }


        state.daily_readings
            .sort(
                (
                    left,
                    right
                ) =>
                    left.record_date
                        .localeCompare(
                            right.record_date
                        )
            );


        state.current_reading =
            clone(
                reading
            );


        state.status = {

            freshness:
                "fresh",

            error_code:
                "none"
        };


        state.last_comparison =
            comparisonFor(
                state.daily_readings,
                row
            );


        state.last_delta =
            state.last_comparison
                .magnitude;


        state.sequence +=
            1;


        state.last_run = {

            fixture_id:
                runMeta.fixture_id ||
                null,

            virtual_now:
                runMeta.virtual_now ||
                reading.fetched_at,

            outcome:
                "success",

            error_code:
                "none",

            retry_after_seconds:
                null
        };


        return state;
    }


    /* =====================================================
       ERROR
    ====================================================== */

    function applyError(
        inputState,
        errorCode,
        runMeta = {}
    ) {

        if (
            !ERROR_CODES.includes(
                errorCode
            )
        ) {

            throw new TypeError(
                `unsupported error code: ${errorCode}`
            );
        }


        const state =
            clone(
                inputState
            );


        state.status = {

            freshness:
                "stale",

            error_code:
                errorCode
        };


        state.sequence +=
            1;


        state.last_run = {

            fixture_id:
                runMeta.fixture_id ||
                null,

            virtual_now:
                runMeta.virtual_now ||
                null,

            outcome:
                "error",

            error_code:
                errorCode,

            retry_after_seconds:
                runMeta.retry_after_seconds ??
                null
        };


        return state;
    }


    /* =====================================================
       SIGNED TEXT
    ====================================================== */

    function signedComparisonText(
        comparison
    ) {

        if (
            !comparison ||
            comparison.state !==
                "comparable"
        ) {

            return null;
        }


        const sign =
            comparison.direction ===
                "increase"

                ? "+"

                : comparison.direction ===
                    "decrease"

                    ? "-"

                    : "±";


        return (
            `${sign}${comparison.magnitude} ${comparison.unit}`
        );
    }


    /* =====================================================
       FORMAT KST
    ====================================================== */

    function formatKst(
        isoString
    ) {

        if (
            !isoString
        ) {

            return "--";
        }


        const date =
            new Date(
                isoString
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "--";
        }


        return (
            new Intl.DateTimeFormat(
                "ko-KR",
                {
                    timeZone:
                        "Asia/Seoul",

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit",

                    hour12:
                        false
                }
            )
            .format(
                date
            ) +
            " KST"
        );
    }


    global.T04Core = {

        NORMALIZED_KEYS,

        ERROR_CODES,

        clone,

        kstDate,

        validateNormalizedReading,

        resetEvaluationState,

        recordIdFor,

        comparisonFor,

        applySuccessfulReading,

        applyError,

        signedComparisonText,

        formatKst
    };

})(window);