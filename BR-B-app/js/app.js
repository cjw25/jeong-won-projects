"use strict";


const body =
    document.getElementById(
        "component-body"
    );


const message =
    document.getElementById(
        "message"
    );


const directCount =
    document.getElementById(
        "direct-count"
    );


const sbomCount =
    document.getElementById(
        "sbom-count"
    );


const additionalCount =
    document.getElementById(
        "additional-count"
    );


const missedList =
    document.getElementById(
        "missed-list"
    );


const interpretation =
    document.getElementById(
        "interpretation"
    );


const loadSampleButton =
    document.getElementById(
        "load-sample"
    );


const addRowButton =
    document.getElementById(
        "add-row"
    );


const resetButton =
    document.getElementById(
        "reset"
    );


const analyzeButton =
    document.getElementById(
        "analyze"
    );



function showMessage(
    text,
    type = "success"
) {

    message.textContent =
        text;


    message.className =
        `message show ${type}`;

}



function clearMessage() {

    message.textContent = "";

    message.className =
        "message";

}



function createRow(
    component = {}
) {

    const row =
        document.createElement(
            "tr"
        );


    const name =
        component.name || "";


    const type =
        component.dependencyType
        || "direct";


    const vulnerable =
        component.vulnerable
        === true;


    row.innerHTML = `

        <td>

            <input
                type="text"
                class="component-name"
                placeholder="예: logging-core"
                value="${escapeHtml(name)}"
                aria-label="구성요소 이름"
            >

        </td>


        <td>

            <select
                class="dependency-type"
                aria-label="의존성 유형"
            >

                <option
                    value="direct"
                    ${
                        type === "direct"
                        ? "selected"
                        : ""
                    }
                >
                    직접 의존성
                </option>

                <option
                    value="transitive"
                    ${
                        type ===
                        "transitive"
                        ? "selected"
                        : ""
                    }
                >
                    전이 의존성
                </option>

            </select>

        </td>


        <td>

            <select
                class="vulnerable"
                aria-label="취약 여부"
            >

                <option
                    value="false"
                    ${
                        !vulnerable
                        ? "selected"
                        : ""
                    }
                >
                    정상
                </option>

                <option
                    value="true"
                    ${
                        vulnerable
                        ? "selected"
                        : ""
                    }
                >
                    취약
                </option>

            </select>

        </td>


        <td>

            <button
                type="button"
                class="remove-button"
            >
                삭제
            </button>

        </td>
    `;


    const remove =
        row.querySelector(
            ".remove-button"
        );


    remove.addEventListener(
        "click",
        () => {

            row.remove();

            clearMessage();

        }
    );


    body.appendChild(
        row
    );

}



function escapeHtml(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}



function resetResults() {

    directCount.textContent =
        "-";


    sbomCount.textContent =
        "-";


    additionalCount.textContent =
        "-";


    missedList.innerHTML = `

        <p class="empty-result">
            아직 분석하지 않았습니다.
        </p>

    `;


    interpretation.textContent =
        "구성요소를 입력하고 분석하기를 눌러 주세요.";

}



function clearRows() {

    body.innerHTML = "";

}



function getComponents() {

    const rows =
        [
            ...body.querySelectorAll(
                "tr"
            )
        ];


    if (
        rows.length === 0
    ) {

        showMessage(
            "분석할 구성요소를 하나 이상 추가하세요.",
            "error"
        );

        return null;

    }


    const components = [];

    let hasError = false;


    rows.forEach(
        (
            row,
            index
        ) => {

            const nameInput =
                row.querySelector(
                    ".component-name"
                );


            const dependency =
                row.querySelector(
                    ".dependency-type"
                );


            const vulnerable =
                row.querySelector(
                    ".vulnerable"
                );


            const name =
                nameInput.value.trim();


            nameInput.classList.remove(
                "invalid"
            );


            if (
                name.length === 0
            ) {

                hasError = true;

                nameInput.classList.add(
                    "invalid"
                );


                nameInput.setAttribute(
                    "aria-invalid",
                    "true"
                );

            }
            else {

                nameInput.removeAttribute(
                    "aria-invalid"
                );

            }


            components.push(
                {
                    index:
                        index + 1,

                    name,

                    dependencyType:
                        dependency.value,

                    vulnerable:
                        vulnerable.value
                        === "true"
                }
            );

        }
    );


    if (
        hasError
    ) {

        showMessage(
            "구성요소 이름이 비어 있는 행이 있습니다. 이름을 입력해 주세요.",
            "error"
        );

        return null;

    }


    return components;

}



function findDuplicates(
    components
) {

    const counts =
        new Map();


    components.forEach(
        component => {

            const key =
                component.name
                    .toLowerCase();


            counts.set(
                key,
                (
                    counts.get(key)
                    || 0
                ) + 1
            );

        }
    );


    return [
        ...counts.entries()
    ]
        .filter(
            (
                [
                    ,
                    count
                ]
            ) =>
                count > 1
        )
        .map(
            (
                [
                    name
                ]
            ) =>
                name
        );

}



function analyze() {

    clearMessage();


    const components =
        getComponents();


    if (
        !components
    ) {

        return;

    }


    const duplicates =
        findDuplicates(
            components
        );


    /*
     * 논문의 직접 분석 조건:
     * 직접 의존성 중
     * 취약한 구성요소만 식별
     */

    const directVulnerable =
        components.filter(
            component =>
                component.dependencyType
                === "direct"
                &&
                component.vulnerable
        );


    /*
     * 논문의 SBOM 조건:
     * 직접 + 전이 의존성 전체에서
     * 취약한 구성요소 식별
     */

    const sbomVulnerable =
        components.filter(
            component =>
                component.vulnerable
        );


    /*
     * 직접 분석에서 놓치지만
     * SBOM에서는 확인 가능한 부분
     */

    const additional =
        components.filter(
            component =>
                component.dependencyType
                === "transitive"
                &&
                component.vulnerable
        );


    directCount.textContent =
        `${directVulnerable.length}건`;


    sbomCount.textContent =
        `${sbomVulnerable.length}건`;


    additionalCount.textContent =
        `+${additional.length}건`;


    renderMissed(
        additional
    );


    renderInterpretation(
        directVulnerable.length,
        sbomVulnerable.length,
        additional.length
    );


    if (
        duplicates.length > 0
    ) {

        showMessage(
            "같은 이름의 구성요소가 여러 번 있습니다. 현재 앱은 각 행을 별도 구성요소로 계산했습니다.",
            "warning"
        );

    }
    else {

        showMessage(
            "분석이 완료되었습니다.",
            "success"
        );

    }


    document
        .getElementById(
            "results"
        )
        .scrollIntoView(
            {
                behavior:
                    "smooth"
            }
        );

}



function renderMissed(
    components
) {

    if (
        components.length === 0
    ) {

        missedList.innerHTML = `

            <p class="empty-result">

                이번 입력에서는
                직접 분석과 SBOM 분석 사이에
                추가로 식별되는 취약 구성요소가 없습니다.

            </p>

        `;

        return;

    }


    missedList.innerHTML =
        components
            .map(
                component => `

                    <div class="missed-item">

                        <strong>
                            ${escapeHtml(
                                component.name
                            )}
                        </strong>

                        <span>
                            전이 의존성 · 취약
                        </span>

                    </div>

                `
            )
            .join("");

}



function renderInterpretation(
    direct,
    sbom,
    additional
) {

    if (
        additional > 0
    ) {

        interpretation.innerHTML = `

            직접 의존성만 확인하면
            <strong>${direct}건</strong>의
            취약 구성요소가 보입니다.

            전이 의존성까지 포함하는
            SBOM 관점에서는
            <strong>${sbom}건</strong>이 보이며,

            직접 분석에서 확인되지 않았던
            <strong>${additional}건</strong>이
            추가로 식별됩니다.

        `;

        return;

    }


    interpretation.innerHTML = `

        이번 입력에서는
        직접 분석과 SBOM 분석 사이에
        추가 식별 차이가 없습니다.

        이는 모든 프로젝트에서 반드시
        추가 취약점이 나온다는 뜻이 아니라,
        <strong>
            전이 의존성을 확인할 수 있는 범위 자체가 넓어진다
        </strong>
        는 논문의 분석 방법을 보여줍니다.

    `;

}



async function loadSample() {

    clearMessage();


    try {

        const response =
            await fetch(
                "./data/sample-components.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(
                data.components
            )
        ) {

            throw new Error(
                "components 배열이 없습니다."
            );

        }


        clearRows();


        data.components.forEach(
            component =>
                createRow(
                    component
                )
        );


        resetResults();


        showMessage(
            "예시 데이터를 불러왔습니다. 바로 분석하기를 눌러 보세요.",
            "success"
        );

    }
    catch (
        error
    ) {

        /*
         * 예시 파일을 읽지 못해도
         * 앱이 멈추지 않도록
         * 내부 예시 데이터 사용
         */

        const fallback = [

            {
                name:
                    "web-framework",

                dependencyType:
                    "direct",

                vulnerable:
                    true
            },

            {
                name:
                    "database-driver",

                dependencyType:
                    "direct",

                vulnerable:
                    false
            },

            {
                name:
                    "logging-core",

                dependencyType:
                    "transitive",

                vulnerable:
                    true
            },

            {
                name:
                    "legacy-codec",

                dependencyType:
                    "transitive",

                vulnerable:
                    true
            }

        ];


        clearRows();


        fallback.forEach(
            component =>
                createRow(
                    component
                )
        );


        resetResults();


        showMessage(
            "예시 파일을 읽지 못해 앱 내부의 예시 데이터를 대신 불러왔습니다.",
            "warning"
        );


        console.warn(
            error
        );

    }

}



function resetApp() {

    clearRows();

    createRow();

    resetResults();

    clearMessage();

}



loadSampleButton
    .addEventListener(
        "click",
        loadSample
    );


addRowButton
    .addEventListener(
        "click",
        () => {

            createRow();

            clearMessage();

        }
    );


resetButton
    .addEventListener(
        "click",
        resetApp
    );


analyzeButton
    .addEventListener(
        "click",
        analyze
    );



/*
 * 첫 화면에 빈 입력 한 줄 제공
 */

resetApp();