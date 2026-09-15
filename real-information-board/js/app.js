(function () {

    "use strict";


    /* =====================================================
       STORAGE KEYS
    ====================================================== */

    const LIVE_STATE_KEY =
        "t04.live.state.v1";


    const LIVE_RAW_KEY =
        "t04.live.raw-by-date.v1";


    const REPLAY_STATE_KEY =
        "t04.replay.state.v1";


    const PUBLIC_RECORDS_URL =
        "./data/live-records.json";


    /* =====================================================
       ELEMENTS
    ====================================================== */

    const $ =
        id =>
            document.getElementById(
                id
            );


    const els = {

        liveStatusBadge:
            $("liveStatusBadge"),

        liveValue:
            $("liveValue"),

        liveUnit:
            $("liveUnit"),

        liveStaleNote:
            $("liveStaleNote"),

        liveDelta:
            $("liveDelta"),


        sourceLink:
            $("sourceLink"),

        sourceTime:
            $("sourceTime"),

        fetchedAt:
            $("fetchedAt"),

        recordTimezone:
            $("recordTimezone"),


        fetchLiveButton:
            $("fetchLiveButton"),

        exportLiveButton:
            $("exportLiveButton"),

        liveMessage:
            $("liveMessage"),


        auditMatchBadge:
            $("auditMatchBadge"),

        rawValue:
            $("rawValue"),

        rawUnit:
            $("rawUnit"),

        storedValue:
            $("storedValue"),

        storedUnit:
            $("storedUnit"),

        screenValue:
            $("screenValue"),

        screenUnit:
            $("screenUnit"),

        rawJson:
            $("rawJson"),


        liveRecordCount:
            $("liveRecordCount"),

        liveRecordsBody:
            $("liveRecordsBody"),


        replayResetButton:
            $("replayResetButton"),

        replayFreshness:
            $("replayFreshness"),

        replayErrorCode:
            $("replayErrorCode"),

        replayLastGood:
            $("replayLastGood"),

        replayRowCount:
            $("replayRowCount"),

        replayDelta:
            $("replayDelta"),

        replayLastFixture:
            $("replayLastFixture"),

        replayFailureBox:
            $("replayFailureBox"),

        replayFailureTitle:
            $("replayFailureTitle"),

        replayFailureDescription:
            $("replayFailureDescription"),

        replayFailureAction:
            $("replayFailureAction"),

        replayRetryButton:
            $("replayRetryButton"),

        replayMessage:
            $("replayMessage"),

        replayRecordsBody:
            $("replayRecordsBody"),


        hashBadge:
            $("hashBadge"),

        verifyHashesButton:
            $("verifyHashesButton"),

        hashMessage:
            $("hashMessage"),

        packageId:
            $("packageId")
    };


    /* =====================================================
       STATES
    ====================================================== */

    let liveState =
        T04Core
            .resetEvaluationState();


    let replayState =
        T04Core
            .resetEvaluationState();


    let rawByDate =
        {};


    let publicRawByDate =
        {};


    /* =====================================================
       STORAGE
    ====================================================== */

    function readJsonStorage(
        key,
        fallback
    ) {

        try {

            const raw =
                localStorage
                    .getItem(
                        key
                    );


            return raw
                ? JSON.parse(
                    raw
                )
                : fallback;

        } catch {

            return fallback;
        }
    }


    function saveLive() {

        localStorage.setItem(
            LIVE_STATE_KEY,
            JSON.stringify(
                liveState
            )
        );


        localStorage.setItem(
            LIVE_RAW_KEY,
            JSON.stringify(
                rawByDate
            )
        );
    }


    function saveReplay() {

        localStorage.setItem(
            REPLAY_STATE_KEY,
            JSON.stringify(
                replayState
            )
        );
    }


    /* =====================================================
       MESSAGE
    ====================================================== */

    function setMessage(
        element,
        text,
        type = ""
    ) {

        element.textContent =
            text;


        element.classList.remove(
            "error",
            "success"
        );


        if (
            type
        ) {

            element.classList.add(
                type
            );
        }
    }


    /* =====================================================
       STATUS BADGE
    ====================================================== */

    function setStatusBadge(
        element,
        freshness
    ) {

        element.classList.remove(
            "fresh",
            "stale",
            "error",
            "neutral"
        );


        if (
            freshness ===
            "fresh"
        ) {

            element.textContent =
                "FRESH";


            element.classList.add(
                "fresh"
            );


        } else if (
            freshness ===
            "stale"
        ) {

            element.textContent =
                "STALE";


            element.classList.add(
                "stale"
            );


        } else {

            element.textContent =
                "NO DATA";


            element.classList.add(
                "neutral"
            );
        }
    }


    /* =====================================================
       RAW CURRENT
    ====================================================== */

    function rawForCurrentReading() {

        const date =
            liveState
                .current_reading
                ?.record_date;


        return date

            ? (
                rawByDate[
                    date
                ] ||

                publicRawByDate[
                    date
                ] ||

                null
            )

            : null;
    }


    /* =====================================================
       RENDER LIVE
    ====================================================== */

    function renderLive() {

        const reading =
            liveState
                .current_reading;


        const status =
            liveState
                .status;


        setStatusBadge(
            els.liveStatusBadge,
            status?.freshness
        );


        els.liveStaleNote.hidden =
            status?.freshness !==
            "stale";


        if (
            !reading
        ) {

            els.liveValue.textContent =
                "--";


            els.liveUnit.textContent =
                "°C";


            els.sourceTime.textContent =
                "--";


            els.fetchedAt.textContent =
                "--";


            els.recordTimezone.textContent =
                "Asia/Seoul";


            els.liveDelta.textContent =
                "어제 대비: 비교할 실제 기록이 아직 없습니다.";


            renderAudit();

            renderLiveRecords();


            return;
        }


        els.liveValue.textContent =
            reading.normalized_value;


        els.liveUnit.textContent =
            reading.unit;


        els.sourceLink.textContent =
            reading.source_name;


        els.sourceLink.href =
            reading.source_url;


        els.sourceTime.textContent =
            T04Core.formatKst(
                reading.source_time
            );


        els.fetchedAt.textContent =
            T04Core.formatKst(
                reading.fetched_at
            );


        els.recordTimezone.textContent =
            reading.record_timezone;


        const deltaText =
            T04Core
                .signedComparisonText(
                    liveState
                        .last_comparison
                );


        els.liveDelta.textContent =
            deltaText

                ? `어제 대비: ${deltaText}`

                : "어제 대비: 비교할 이전 실제 날짜 기록이 없습니다.";


        renderAudit();

        renderLiveRecords();
    }


    /* =====================================================
       RENDER AUDIT
    ====================================================== */

    function renderAudit() {

        const reading =
            liveState
                .current_reading;


        const raw =
            rawForCurrentReading();


        if (
            !reading ||
            !raw
        ) {

            els.rawValue.textContent =
                "--";


            els.rawUnit.textContent =
                "--";


            els.storedValue.textContent =
                reading?.normalized_value ??
                "--";


            els.storedUnit.textContent =
                reading?.unit ??
                "--";


            els.screenValue.textContent =
                reading?.normalized_value ??
                "--";


            els.screenUnit.textContent =
                reading?.unit ??
                "--";


            els.auditMatchBadge.textContent =
                "WAIT";


            els.auditMatchBadge.className =
                "status-badge neutral";


            els.rawJson.textContent =
                raw

                    ? JSON.stringify(
                        raw,
                        null,
                        2
                    )

                    : "현재 실제 기록에 연결된 원자료 JSON이 없습니다.";


            return;
        }


        const rawValue =
            raw?.current
                ?.temperature_2m;


        const rawUnit =
            raw?.current_units
                ?.temperature_2m;


        els.rawValue.textContent =
            rawValue ??
            "--";


        els.rawUnit.textContent =
            rawUnit ??
            "--";


        els.storedValue.textContent =
            reading.normalized_value;


        els.storedUnit.textContent =
            reading.unit;


        els.screenValue.textContent =
            els.liveValue.textContent;


        els.screenUnit.textContent =
            els.liveUnit.textContent;


        const matched =

            rawValue ===
                reading.normalized_value &&

            rawUnit ===
                reading.unit &&

            String(
                reading.normalized_value
            ) ===
                els.liveValue.textContent &&

            reading.unit ===
                els.liveUnit.textContent;


        els.auditMatchBadge.textContent =
            matched
                ? "MATCH"
                : "MISMATCH";


        els.auditMatchBadge.className =
            `status-badge ${
                matched
                    ? "fresh"
                    : "error"
            }`;


        els.rawJson.textContent =
            JSON.stringify(
                raw,
                null,
                2
            );
    }


    /* =====================================================
       RENDER LIVE RECORDS
    ====================================================== */

    function renderLiveRecords() {

        const rows =
            [
                ...liveState
                    .daily_readings
            ]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.record_date
                        .localeCompare(
                            a.record_date
                        )
            );


        els.liveRecordCount.textContent =
            `${rows.length}건`;


        if (
            !rows.length
        ) {

            els.liveRecordsBody.innerHTML =
                `
                <tr>
                    <td
                        colspan="5"
                        class="empty-cell"
                    >
                        실제 기록이 아직 없습니다.
                    </td>
                </tr>
                `;


            return;
        }


        els.liveRecordsBody.innerHTML =
            "";


        for (
            const row
            of rows
        ) {

            const tr =
                document.createElement(
                    "tr"
                );


            const dateCell =
                document.createElement(
                    "td"
                );


            dateCell.textContent =
                row.record_date;


            const valueCell =
                document.createElement(
                    "td"
                );


            const valueStrong =
                document.createElement(
                    "strong"
                );


            valueStrong.textContent =
                `${row.normalized_value} ${row.unit}`;


            valueCell.appendChild(
                valueStrong
            );


            const sourceTimeCell =
                document.createElement(
                    "td"
                );


            sourceTimeCell.textContent =
                T04Core.formatKst(
                    row.reading
                        .source_time
                );


            const fetchedCell =
                document.createElement(
                    "td"
                );


            fetchedCell.textContent =
                T04Core.formatKst(
                    row.last_fetched_at
                );


            const sourceCell =
                document.createElement(
                    "td"
                );


            const sourceLink =
                document.createElement(
                    "a"
                );


            sourceLink.href =
                row.reading
                    .source_url;


            sourceLink.target =
                "_blank";


            sourceLink.rel =
                "noreferrer";


            sourceLink.textContent =
                row.reading
                    .source_name;


            sourceCell.appendChild(
                sourceLink
            );


            tr.append(
                dateCell,
                valueCell,
                sourceTimeCell,
                fetchedCell,
                sourceCell
            );


            els.liveRecordsBody
                .appendChild(
                    tr
                );
        }
    }


    /* =====================================================
       LIVE FETCH
    ====================================================== */

    async function fetchLive() {

        els.fetchLiveButton.disabled =
            true;


        setMessage(
            els.liveMessage,
            "실제 공개 원천을 조회하는 중입니다…"
        );


        try {

            const result =
                await T04LiveAdapter
                    .fetchLiveReading();


            liveState =
                T04Core
                    .applySuccessfulReading(
                        liveState,
                        result.reading,
                        {
                            virtual_now:
                                result.reading
                                    .fetched_at
                        },
                        "live"
                    );


            rawByDate[
                result.reading
                    .record_date
            ] =
                result.raw;


            saveLive();


            renderLive();


            setMessage(
                els.liveMessage,
                `정상 수신 · ${result.reading.record_date} KST 일별 행을 1건으로 유지했습니다.`,
                "success"
            );


        } catch (error) {

            if (
                liveState
                    .current_reading &&

                T04Core.ERROR_CODES
                    .includes(
                        error.code
                    )
            ) {

                liveState =
                    T04Core.applyError(
                        liveState,
                        error.code,
                        {
                            virtual_now:
                                new Date()
                                    .toISOString()
                        }
                    );


                saveLive();

                renderLive();
            }


            setMessage(
                els.liveMessage,
                `${error.message} 마지막 정상값이 있으면 그대로 유지합니다.`,
                "error"
            );


        } finally {

            els.fetchLiveButton.disabled =
                false;
        }
    }


    /* =====================================================
       EXPORT LIVE RECORDS
    ====================================================== */

    function exportLiveRecords() {

        const records =
            liveState
                .daily_readings
                .map(
                    row => ({

                        reading:
                            row.reading,

                        raw_snapshot:
                            rawByDate[
                                row.record_date
                            ] ||

                            publicRawByDate[
                                row.record_date
                            ] ||

                            null
                    })
                );


        const payload = {

            schema_version:
                "t04-public-live-records-v1",

            signal_id:
                T04LiveAdapter
                    .SIGNAL_ID,

            records
        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        payload,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "live-records.json";


        document.body
            .appendChild(
                link
            );


        link.click();


        link.remove();


        setTimeout(
            () =>
                URL.revokeObjectURL(
                    url
                ),

            1000
        );


        setMessage(
            els.liveMessage,
            "현재 실제 일별 기록을 JSON으로 내보냈습니다. 최종 제출 전 서로 다른 실제 KST 날짜 2건인지 확인하세요.",
            "success"
        );
    }


    /* =====================================================
       LOAD PUBLIC RECORDS
    ====================================================== */

    async function loadPublicRecords() {

        try {

            const response =
                await fetch(
                    PUBLIC_RECORDS_URL,
                    {
                        cache:
                            "no-store"
                    }
                );


            if (
                !response.ok
            ) {

                return;
            }


            const payload =
                await response
                    .json();


            if (
                !payload ||
                !Array.isArray(
                    payload.records
                )
            ) {

                return;
            }


            for (
                const item
                of payload.records
            ) {

                if (
                    !item?.reading
                ) {

                    continue;
                }


                try {

                    T04Core
                        .validateNormalizedReading(
                            item.reading
                        );


                    liveState =
                        T04Core
                            .applySuccessfulReading(
                                liveState,
                                item.reading,
                                {
                                    virtual_now:
                                        item.reading
                                            .fetched_at
                                },
                                "live"
                            );


                    if (
                        item.raw_snapshot
                    ) {

                        publicRawByDate[
                            item.reading
                                .record_date
                        ] =
                            item.raw_snapshot;
                    }


                } catch {

                    /*
                     * 잘못된 공개 기록은 무시
                     */
                }
            }


        } catch {

            /*
             * 공개 JSON이 없어도 앱은 계속 동작
             */
        }
    }


    /* =====================================================
       MERGE LOCAL
    ====================================================== */

    function mergeLocalLiveState(
        localState
    ) {

        if (
            !localState
                ?.daily_readings
        ) {

            return;
        }


        for (
            const row
            of localState
                .daily_readings
        ) {

            try {

                liveState =
                    T04Core
                        .applySuccessfulReading(
                            liveState,
                            row.reading,
                            {
                                virtual_now:
                                    row.last_fetched_at
                            },
                            "live"
                        );


            } catch {

                /*
                 * 손상된 로컬 행 무시
                 */
            }
        }


        if (
            localState.status
                ?.freshness ===
                "stale" &&

            localState.status
                ?.error_code &&

            T04Core.ERROR_CODES
                .includes(
                    localState.status
                        .error_code
                )
        ) {

            liveState =
                T04Core
                    .applyError(
                        liveState,
                        localState.status
                            .error_code,
                        localState.last_run ||
                        {}
                    );
        }
    }


    /* =====================================================
       FAILURE COPY
    ====================================================== */

    const failureCopy = {

        timeout: [

            "느린 외부 응답",

            "제한시간보다 늦게 도착해 timeout으로 분류했습니다.",

            "다시 시도하면 공개 T04-RECOVER-D2로 복구 상태를 확인합니다."
        ],


        auth: [

            "외부 원천 401/403 거절",

            "외부 데이터 원천이 요청을 거절해 auth로 분류했습니다.",

            "외부 원천의 접근 정책을 확인한 뒤 다시 시도합니다."
        ],


        rate_limit: [

            "호출 제한 429",

            "외부 원천의 호출 제한에 걸려 rate_limit으로 분류했습니다.",

            "Retry-After를 존중한 뒤 다시 시도합니다."
        ],


        offline: [

            "오프라인",

            "네트워크 연결 중단을 offline으로 분류했습니다.",

            "연결을 확인한 뒤 다시 시도합니다."
        ],


        schema_error: [

            "응답 형식 변경",

            "HTTP는 성공했지만 필수 필드 타입이 달라 schema_error로 분류했습니다.",

            "스키마를 확인하고 adapter를 수정한 뒤 다시 시도합니다."
        ]
    };


    /* =====================================================
       RENDER REPLAY
    ====================================================== */

    function renderReplay() {

        const status =
            replayState.status;


        setStatusBadge(
            els.replayFreshness,
            status?.freshness
        );


        els.replayErrorCode.textContent =
            `error: ${
                status?.error_code ||
                "--"
            }`;


        const current =
            replayState
                .current_reading;


        els.replayLastGood.textContent =
            current

                ? `${current.normalized_value} ${current.unit}`

                : "--";


        els.replayRowCount.textContent =
            String(
                replayState
                    .daily_readings
                    .length
            );


        els.replayDelta.textContent =
            T04Core
                .signedComparisonText(
                    replayState
                        .last_comparison
                ) ||
            "--";


        els.replayLastFixture.textContent =
            replayState
                .last_run
                ?.fixture_id ||
            "--";


        /* FAILURE */

        const isFailure =
            status?.freshness ===
            "stale";


        els.replayFailureBox.hidden =
            !isFailure;


        if (
            isFailure
        ) {

            const copy =
                failureCopy[
                    status.error_code
                ] ||

                [
                    "오류",

                    "합성 오류를 재생했습니다.",

                    "다시 시도하세요."
                ];


            els.replayFailureTitle.textContent =
                `${copy[0]} · STALE`;


            els.replayFailureDescription.textContent =
                `${copy[1]} 마지막 정상값 ${
                    current

                        ? current.normalized_value +
                          " " +
                          current.unit

                        : "--"
                }은 지우지 않았습니다.`;


            const retry =
                replayState
                    .last_run
                    ?.retry_after_seconds;


            els.replayFailureAction.textContent =
                retry

                    ? `${copy[2]} (Retry-After ${retry}초)`

                    : copy[2];
        }


        /* TABLE */

        if (
            !replayState
                .daily_readings
                .length
        ) {

            els.replayRecordsBody.innerHTML =
                `
                <tr>
                    <td
                        colspan="5"
                        class="empty-cell"
                    >
                        합성 일별 행이 없습니다.
                    </td>
                </tr>
                `;


            return;
        }


        els.replayRecordsBody.innerHTML =
            "";


        for (
            const row
            of replayState
                .daily_readings
        ) {

            const tr =
                document.createElement(
                    "tr"
                );


            const recordCell =
                document.createElement(
                    "td"
                );


            recordCell.textContent =
                row.record_id;


            const dateCell =
                document.createElement(
                    "td"
                );


            dateCell.textContent =
                row.record_date;


            const valueCell =
                document.createElement(
                    "td"
                );


            valueCell.textContent =
                `${row.normalized_value} ${row.unit}`;


            const firstCell =
                document.createElement(
                    "td"
                );


            firstCell.textContent =
                row.first_fetched_at;


            const lastCell =
                document.createElement(
                    "td"
                );


            lastCell.textContent =
                row.last_fetched_at;


            tr.append(
                recordCell,
                dateCell,
                valueCell,
                firstCell,
                lastCell
            );


            els.replayRecordsBody
                .appendChild(
                    tr
                );
        }
    }


    /* =====================================================
       REPLAY FIXTURE
    ====================================================== */

    async function replayFixture(
        fixtureId
    ) {

        try {

            const result =
                await T04ReplayAdapter
                    .replay(
                        replayState,
                        fixtureId
                    );


            replayState =
                result.state;


            saveReplay();

            renderReplay();


            const expected =
                result.fixture
                    .expected;


            const actualValue =
                replayState
                    .current_reading
                    ?.normalized_value ??
                null;


            const okay =

                replayState.status
                    ?.freshness ===
                    expected.freshness &&

                replayState.status
                    ?.error_code ===
                    expected.error_code &&

                replayState
                    .daily_readings
                    .length ===
                    expected.row_count &&

                actualValue ===
                    expected.stored_value;


            setMessage(
                els.replayMessage,

                `${fixtureId} 재생 · 기대값 대조 ${
                    okay
                        ? "PASS"
                        : "CHECK"
                } · 상태 ${
                    replayState.status
                        .freshness
                }/${
                    replayState.status
                        .error_code
                } · 행 ${
                    replayState
                        .daily_readings
                        .length
                } · 마지막 정상값 ${
                    actualValue ??
                    "--"
                }`,

                okay
                    ? "success"
                    : "error"
            );


        } catch (error) {

            setMessage(
                els.replayMessage,
                error.message,
                "error"
            );
        }
    }


    /* =====================================================
       RESET REPLAY
    ====================================================== */

    function resetReplay() {

        replayState =
            T04Core
                .resetEvaluationState();


        localStorage.removeItem(
            REPLAY_STATE_KEY
        );


        renderReplay();


        setMessage(
            els.replayMessage,
            "합성 평가 상태만 초기화했습니다. 실제 공개 원천 기록은 변경하지 않았습니다.",
            "success"
        );
    }


    /* =====================================================
       VERIFY HASH
    ====================================================== */

    async function verifyHashes() {

        els.verifyHashesButton.disabled =
            true;


        els.hashBadge.textContent =
            "CHECKING";


        els.hashBadge.className =
            "status-badge neutral";


        setMessage(
            els.hashMessage,
            "공개 asset SHA-256을 계산하는 중입니다…"
        );


        try {

            const result =
                await T04ReplayAdapter
                    .verifyAssetPackage();


            els.packageId.textContent =
                result.package_id;


            const ok =
                result.matched ===
                result.total;


            els.hashBadge.textContent =
                ok
                    ? "MATCH"
                    : "MISMATCH";


            els.hashBadge.className =
                `status-badge ${
                    ok
                        ? "fresh"
                        : "error"
                }`;


            setMessage(
                els.hashMessage,

                `${result.matched}/${result.total} 파일 SHA-256 ${
                    ok
                        ? "일치"
                        : "중 일부 불일치"
                } · asset-manifest.json은 계약대로 self-excluded입니다.`,

                ok
                    ? "success"
                    : "error"
            );


        } catch (error) {

            els.hashBadge.textContent =
                "ERROR";


            els.hashBadge.className =
                "status-badge error";


            setMessage(
                els.hashMessage,
                error.message,
                "error"
            );


        } finally {

            els.verifyHashesButton.disabled =
                false;
        }
    }


    /* =====================================================
       INIT
    ====================================================== */

    async function init() {

        const localState =
            readJsonStorage(
                LIVE_STATE_KEY,
                null
            );


        rawByDate =
            readJsonStorage(
                LIVE_RAW_KEY,
                {}
            );


        replayState =
            readJsonStorage(
                REPLAY_STATE_KEY,
                T04Core
                    .resetEvaluationState()
            );


        await loadPublicRecords();


        mergeLocalLiveState(
            localState
        );


        renderLive();

        renderReplay();
    }


    /* =====================================================
       EVENTS
    ====================================================== */

    els.fetchLiveButton
        .addEventListener(
            "click",
            fetchLive
        );


    els.exportLiveButton
        .addEventListener(
            "click",
            exportLiveRecords
        );


    els.replayResetButton
        .addEventListener(
            "click",
            resetReplay
        );


    document
        .querySelectorAll(
            "[data-fixture]"
        )
        .forEach(
            button => {

                button
                    .addEventListener(
                        "click",
                        () => {

                            replayFixture(
                                button.dataset
                                    .fixture
                            );
                        }
                    );
            }
        );


    els.replayRetryButton
        .addEventListener(
            "click",
            () => {

                replayFixture(
                    "T04-RECOVER-D2"
                );
            }
        );


    els.verifyHashesButton
        .addEventListener(
            "click",
            verifyHashes
        );


    init();

})();