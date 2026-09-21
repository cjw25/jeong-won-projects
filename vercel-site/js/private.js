document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * SimpleWebAuthn UMD
         */
        const {

            startRegistration,

            startAuthentication,

            browserSupportsWebAuthn

        } =
            window.SimpleWebAuthnBrowser;


        /* =============================
           DOM
        ============================== */

        const username =
            document.getElementById(
                "username"
            );


        const passkeyName =
            document.getElementById(
                "passkeyName"
            );


        const registerButton =
            document.getElementById(
                "registerButton"
            );


        const loginButton =
            document.getElementById(
                "loginButton"
            );


        const addPasskeyButton =
            document.getElementById(
                "addPasskeyButton"
            );


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        const refreshPasskeysButton =
            document.getElementById(
                "refreshPasskeysButton"
            );


        const refreshPrivateButton =
            document.getElementById(
                "refreshPrivateButton"
            );


        const browserStatus =
            document.getElementById(
                "browserStatus"
            );


        const sessionStatus =
            document.getElementById(
                "sessionStatus"
            );


        const message =
            document.getElementById(
                "message"
            );


        const passkeySection =
            document.getElementById(
                "passkeySection"
            );


        const passkeyList =
            document.getElementById(
                "passkeyList"
            );


        const privateItems =
            document.getElementById(
                "privateItems"
            );


        const testSection =
            document.getElementById(
                "testSection"
            );


        const otherUserTestButton =
            document.getElementById(
                "otherUserTestButton"
            );


        const userIdTestButton =
            document.getElementById(
                "userIdTestButton"
            );


        const replayButton =
            document.getElementById(
                "replayButton"
            );


        const badSignatureButton =
            document.getElementById(
                "badSignatureButton"
            );


        const testResult =
            document.getElementById(
                "testResult"
            );


        /*
         * 마지막 로그인 요청을
         * challenge replay 테스트용으로
         * 메모리에만 보관.
         *
         * localStorage에는 저장하지 않는다.
         */
        let lastSuccessfulLoginPayload =
            null;


        let currentUsername =
            null;



        /* =============================
           공통 Fetch
        ============================== */

        async function api(
            url,
            options = {}
        ) {

            const response =
                await fetch(
                    url,
                    {

                        credentials:
                            "same-origin",

                        ...options,

                        headers: {

                            "Content-Type":
                                "application/json",

                            ...(
                                options.headers ||
                                {}
                            )

                        }

                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (
                !response.ok
            ) {

                const error =
                    new Error(
                        data.error ||
                        `HTTP ${response.status}`
                    );


                error.status =
                    response.status;


                error.code =
                    data.code;


                error.data =
                    data;


                throw error;

            }


            return data;

        }



        /* =============================
           메시지
        ============================== */

        function showMessage(
            text,
            type = "info"
        ) {

            message.textContent =
                text;


            message.dataset.type =
                type;

        }



        function showTestResult(
            title,
            status,
            data
        ) {

            testResult.textContent =
                [
                    title,
                    "",
                    `HTTP 상태: ${status}`,
                    "",
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                ].join("\n");

        }



        /* =============================
           잠금 화면
        ============================== */

        function showLocked() {

            privateItems.innerHTML =
                `
                <div class="locked-box">
                    <strong>
                        🔒 잠겨 있습니다.
                    </strong>

                    <p>
                        패스키 인증 후 서버에서
                        비공개 자료를 불러옵니다.
                    </p>
                </div>
                `;

        }



        /* =============================
           로그인 상태 확인
        ============================== */

        async function checkSession() {

            /*
             * 별도 session API가 없으므로
             * 인증이 필요한 /api/passkeys를
             * 사용해 현재 세션 확인.
             */
            try {

                const data =
                    await api(
                        "/api/passkeys"
                    );


                currentUsername =
                    data.username;


                username.value =
                    data.username;


                username.disabled =
                    true;


                sessionStatus.textContent =
                    `✅ 로그인됨: ${data.username}`;


                registerButton.hidden =
                    true;


                loginButton.hidden =
                    true;


                addPasskeyButton.hidden =
                    false;


                logoutButton.hidden =
                    false;


                refreshPrivateButton.hidden =
                    false;


                passkeySection.hidden =
                    false;


                testSection.hidden =
                    false;


                renderPasskeys(
                    data.passkeys
                );


                await loadPrivateItems();


                return true;

            } catch (
                error
            ) {

                if (
                    error.status !== 401
                ) {

                    console.error(
                        error
                    );

                }


                currentUsername =
                    null;


                username.disabled =
                    false;


                sessionStatus.textContent =
                    "🔒 로그인되지 않음";


                registerButton.hidden =
                    false;


                loginButton.hidden =
                    false;


                addPasskeyButton.hidden =
                    true;


                logoutButton.hidden =
                    true;


                refreshPrivateButton.hidden =
                    true;


                passkeySection.hidden =
                    true;


                testSection.hidden =
                    true;


                passkeyList.innerHTML =
                    "";


                showLocked();


                return false;

            }

        }



        /* =============================
           Passkey 등록
        ============================== */

        async function registerPasskey() {

            try {

                const selectedUsername =
                    username.value;


                const name =
                    passkeyName
                        .value
                        .trim()
                    ||
                    "내 패스키";


                showMessage(
                    "등록용 새 challenge를 생성하고 있습니다."
                );


                /*
                 * 서버에서 challenge 생성
                 */
                const begin =
                    await api(
                        "/api/register-options",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    {

                                        username:
                                            selectedUsername

                                    }
                                )

                        }
                    );


                /*
                 * 실제 기기에서
                 * 개인키 / 공개키 생성.
                 *
                 * 개인키는 브라우저에서
                 * 서버로 전송되지 않는다.
                 */
                const response =
                    await startRegistration({

                        optionsJSON:
                            begin.options

                    });


                /*
                 * WebAuthn 응답을
                 * 서버에서 검증.
                 */
                const result =
                    await api(
                        "/api/register-verify",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    {

                                        username:
                                            selectedUsername,

                                        passkeyName:
                                            name,

                                        flowId:
                                            begin.flowId,

                                        response

                                    }
                                )

                        }
                    );


                showMessage(
                    `"${result.passkey.name}" 패스키 등록에 성공했습니다. 서버에는 공개키만 저장되었습니다.`,
                    "success"
                );


                await checkSession();

            } catch (
                error
            ) {

                /*
                 * 사용자가 Windows Hello,
                 * 지문, PIN 화면을 취소한 경우.
                 */
                if (
                    error.name ===
                    "NotAllowedError"
                ) {

                    showMessage(
                        "패스키 등록을 취소했습니다. 새로운 패스키 Credential은 서버에 저장되지 않았습니다.",
                        "error"
                    );


                    return;

                }


                console.error(
                    error
                );


                showMessage(
                    error.message,
                    "error"
                );

            }

        }



        /* =============================
           로그인
        ============================== */

        async function loginPasskey() {

            try {

                const selectedUsername =
                    username.value;


                showMessage(
                    "로그인용 새 challenge를 생성하고 있습니다."
                );


                /*
                 * 새 Challenge
                 */
                const begin =
                    await api(
                        "/api/login-options",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    {

                                        username:
                                            selectedUsername

                                    }
                                )

                        }
                    );


                /*
                 * 기기 Passkey가 challenge에
                 * 서명
                 */
                const response =
                    await startAuthentication({

                        optionsJSON:
                            begin.options

                    });


                const payload = {

                    username:
                        selectedUsername,

                    flowId:
                        begin.flowId,

                    response

                };


                /*
                 * 서버 Public Key 검증
                 */
                const result =
                    await api(
                        "/api/login-verify",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }
                    );


                /*
                 * Challenge replay 검증을 위해
                 * 방금 성공한 요청을 메모리에 저장.
                 */
                lastSuccessfulLoginPayload =
                    structuredClone(
                        payload
                    );


                replayButton.disabled =
                    false;


                showMessage(
                    `${result.user.displayName} 패스키 로그인 성공. 공개키 서명 검증이 완료되었습니다.`,
                    "success"
                );


                await checkSession();

            } catch (
                error
            ) {

                if (
                    error.name ===
                    "NotAllowedError"
                ) {

                    showMessage(
                        "패스키 인증을 취소했습니다.",
                        "error"
                    );


                    return;

                }


                console.error(
                    error
                );


                showMessage(
                    error.message,
                    "error"
                );

            }

        }



        /* =============================
           로그아웃
        ============================== */

        async function logout() {

            try {

                await api(
                    "/api/logout",
                    {

                        method:
                            "POST"

                    }
                );


                lastSuccessfulLoginPayload =
                    null;


                replayButton.disabled =
                    true;


                showMessage(
                    "로그아웃했습니다. 비공개 자료 접근 권한이 제거되었습니다.",
                    "success"
                );


                await checkSession();

            } catch (
                error
            ) {

                showMessage(
                    error.message,
                    "error"
                );

            }

        }



        /* =============================
           Passkey 목록
        ============================== */

        async function loadPasskeys() {

            try {

                const data =
                    await api(
                        "/api/passkeys"
                    );


                renderPasskeys(
                    data.passkeys
                );

            } catch (
                error
            ) {

                showMessage(
                    error.message,
                    "error"
                );

            }

        }



        function renderPasskeys(
            passkeys
        ) {

            passkeyList.innerHTML =
                "";


            if (
                passkeys.length === 0
            ) {

                passkeyList.innerHTML =
                    `
                    <p>
                        등록된 패스키가 없습니다.
                    </p>
                    `;


                return;

            }


            passkeys.forEach(
                passkey => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "passkey-row";


                    const information =
                        document.createElement(
                            "div"
                        );


                    const title =
                        document.createElement(
                            "strong"
                        );


                    title.textContent =
                        passkey.name;


                    const date =
                        new Date(
                            passkey.createdAt
                        )
                            .toLocaleString(
                                "ko-KR"
                            );


                    const detail =
                        document.createElement(
                            "small"
                        );


                    /*
                     * 전체 공개키를 화면에
                     * 전부 보여줄 필요는 없으므로
                     * 앞부분만 표시.
                     */
                    detail.textContent =
                        `${date} · 공개키 ${passkey.publicKey.slice(0, 24)}...`;


                    information.append(
                        title,
                        detail
                    );


                    const deleteButton =
                        document.createElement(
                            "button"
                        );


                    deleteButton.type =
                        "button";


                    deleteButton.className =
                        "passkey-delete";


                    deleteButton.textContent =
                        "삭제";


                    deleteButton.addEventListener(
                        "click",
                        async () => {

                            await deletePasskey(
                                passkey
                            );

                        }
                    );


                    row.append(
                        information,
                        deleteButton
                    );


                    passkeyList.appendChild(
                        row
                    );

                }
            );

        }



        /* =============================
           Passkey 삭제
        ============================== */

        async function deletePasskey(
            passkey
        ) {

            try {

                const result =
                    await api(
                        `/api/passkeys?id=${encodeURIComponent(passkey.id)}`,
                        {

                            method:
                                "DELETE"

                        }
                    );


                showMessage(
                    `"${result.deleted.name}" 패스키를 삭제했습니다. 남은 패스키: ${result.remaining}개`,
                    "success"
                );


                await loadPasskeys();

            } catch (
                error
            ) {

                /*
                 * 마지막 패스키 삭제 방지
                 */
                if (
                    error.code ===
                    "LAST_PASSKEY"
                ) {

                    showMessage(
                        "마지막 패스키는 삭제할 수 없습니다. 다른 패스키를 먼저 등록하세요.",
                        "error"
                    );


                    return;

                }


                showMessage(
                    error.message,
                    "error"
                );

            }

        }



        /* =============================
           Private Item 조회
        ============================== */

        async function loadPrivateItems() {

            try {

                const data =
                    await api(
                        "/api/private-items"
                    );


                privateItems.innerHTML =
                    "";


                data.items.forEach(
                    item => {

                        const article =
                            document.createElement(
                                "article"
                            );


                        article.className =
                            "private-item";


                        const title =
                            document.createElement(
                                "h3"
                            );


                        title.textContent =
                            item.title;


                        const content =
                            document.createElement(
                                "p"
                            );


                        content.textContent =
                            item.content;


                        article.append(
                            title,
                            content
                        );


                        privateItems.appendChild(
                            article
                        );

                    }
                );


                showMessage(
                    `${data.owner}의 비공개 자료 ${data.count}개를 서버에서 불러왔습니다.`,
                    "success"
                );

            } catch (
                error
            ) {

                showLocked();


                showMessage(
                    error.message,
                    "error"
                );

            }

        }



        /* =============================
           다른 사용자 접근 테스트

           C37 / C38
        ============================== */

        async function testOtherUser() {

            if (!currentUsername) {

                return;

            }


            const otherUsername =
                currentUsername ===
                "owner-a"

                    ? "owner-b"
                    : "owner-a";


            const url =
                `/api/private-items?username=${encodeURIComponent(otherUsername)}`;


            try {

                const response =
                    await fetch(
                        url,
                        {

                            credentials:
                                "same-origin"

                        }
                    );


                const data =
                    await response.json();


                showTestResult(

                    `${currentUsername} → ${otherUsername} 접근 테스트`,

                    response.status,

                    data

                );

            } catch (
                error
            ) {

                showTestResult(
                    "다른 계정 접근 테스트",
                    "ERROR",
                    {
                        error:
                            error.message
                    }
                );

            }

        }



        /* =============================
           userId 조작 테스트

           C40
        ============================== */

        async function testUserIdModification() {

            try {

                /*
                 * 존재하지 않는 임의 userId
                 *
                 * 백엔드는 이 값을 무시하고
                 * Session userId만 사용해야 한다.
                 */
                const response =
                    await fetch(
                        "/api/private-items?userId=999999",
                        {

                            credentials:
                                "same-origin"

                        }
                    );


                const data =
                    await response.json();


                showTestResult(

                    "userId=999999 URL 조작",

                    response.status,

                    data

                );

            } catch (
                error
            ) {

                showTestResult(
                    "userId 조작 테스트",
                    "ERROR",
                    {
                        error:
                            error.message
                    }
                );

            }

        }



        /* =============================
           Challenge Replay

           C31
        ============================== */

        async function testReplay() {

            if (
                !lastSuccessfulLoginPayload
            ) {

                showTestResult(
                    "Challenge 재사용",
                    "실행 안 됨",
                    {
                        message:
                            "먼저 이 페이지에서 패스키 로그인을 한 번 성공시키세요."
                    }
                );


                return;

            }


            /*
             * 성공했던 EXACT SAME
             * flowId + assertion을 다시 보냄.
             */
            const response =
                await fetch(
                    "/api/login-verify",
                    {

                        method:
                            "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                lastSuccessfulLoginPayload
                            )

                    }
                );


            const data =
                await response.json();


            showTestResult(

                "이미 사용한 Challenge 재전송",

                response.status,

                data

            );

        }



        /* =============================
           잘못된 서명 테스트

           C30
        ============================== */

        async function testBadSignature() {

            if (!currentUsername) {

                return;

            }


            try {

                /*
                 * 이 테스트 전용
                 * 새 challenge
                 */
                const begin =
                    await api(
                        "/api/login-options",
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    {

                                        username:
                                            currentUsername

                                    }
                                )

                        }
                    );


                /*
                 * 실제 정상 서명을 먼저 받음
                 */
                const credential =
                    await startAuthentication({

                        optionsJSON:
                            begin.options

                    });


                /*
                 * 원본을 건드리지 않기 위해 복사
                 */
                const broken =
                    structuredClone(
                        credential
                    );


                /*
                 * signature의 마지막 문자를
                 * 의도적으로 변조.
                 */
                const signature =
                    broken
                        .response
                        .signature;


                if (
                    !signature ||
                    signature.length <
                    2
                ) {

                    throw new Error(
                        "서명 값을 찾을 수 없습니다."
                    );

                }


                const lastCharacter =
                    signature.slice(-1);


                broken.response.signature =
                    signature.slice(
                        0,
                        -1
                    )
                    +
                    (
                        lastCharacter === "A"
                            ? "B"
                            : "A"
                    );


                const response =
                    await fetch(
                        "/api/login-verify",
                        {

                            method:
                                "POST",

                            credentials:
                                "same-origin",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    {

                                        username:
                                            currentUsername,

                                        flowId:
                                            begin.flowId,

                                        response:
                                            broken

                                    }
                                )

                        }
                    );


                const data =
                    await response.json();


                showTestResult(

                    "의도적으로 변조한 서명",

                    response.status,

                    data

                );

            } catch (
                error
            ) {

                if (
                    error.name ===
                    "NotAllowedError"
                ) {

                    showTestResult(
                        "잘못된 서명 테스트",
                        "취소",
                        {
                            message:
                                "패스키 인증을 취소했습니다."
                        }
                    );


                    return;

                }


                showTestResult(
                    "잘못된 서명 테스트",
                    "ERROR",
                    {
                        error:
                            error.message
                    }
                );

            }

        }



        /* =============================
           이벤트

           WebAuthn 호출은 반드시
           직접 click 이벤트에서 실행.
        ============================== */

        registerButton.addEventListener(
            "click",
            registerPasskey
        );


        addPasskeyButton.addEventListener(
            "click",
            registerPasskey
        );


        loginButton.addEventListener(
            "click",
            loginPasskey
        );


        logoutButton.addEventListener(
            "click",
            logout
        );


        refreshPasskeysButton.addEventListener(
            "click",
            loadPasskeys
        );


        refreshPrivateButton.addEventListener(
            "click",
            loadPrivateItems
        );


        otherUserTestButton.addEventListener(
            "click",
            testOtherUser
        );


        userIdTestButton.addEventListener(
            "click",
            testUserIdModification
        );


        replayButton.addEventListener(
            "click",
            testReplay
        );


        badSignatureButton.addEventListener(
            "click",
            testBadSignature
        );



        /* =============================
           최초 실행
        ============================== */

        if (
            browserSupportsWebAuthn()
        ) {

            browserStatus.textContent =
                "✅ 이 브라우저는 WebAuthn을 지원합니다.";

        } else {

            browserStatus.textContent =
                "❌ 이 브라우저는 WebAuthn을 지원하지 않습니다.";


            registerButton.disabled =
                true;


            loginButton.disabled =
                true;

        }


        checkSession();

    }
);