document.addEventListener(
    "DOMContentLoaded",
    () => {

        const {
            startRegistration,
            browserSupportsWebAuthn
        } =
            window.SimpleWebAuthnBrowser;


        const codeInput =
            document.getElementById(
                "deviceCode"
            );


        const passkeyName =
            document.getElementById(
                "passkeyName"
            );


        const registerButton =
            document.getElementById(
                "registerButton"
            );


        const message =
            document.getElementById(
                "message"
            );


        const successPanel =
            document.getElementById(
                "successPanel"
            );


        const successText =
            document.getElementById(
                "successText"
            );


        function showMessage(
            text,
            type = "info"
        ) {

            message.textContent =
                text;


            message.dataset.type =
                type;

        }


        if (
            !browserSupportsWebAuthn()
        ) {

            showMessage(
                "이 브라우저에서는 WebAuthn을 사용할 수 없습니다.",
                "error"
            );


            registerButton.disabled =
                true;


            return;

        }


        async function register() {

            try {

                const code =
                    codeInput
                        .value
                        .trim();


                if (!code) {

                    showMessage(
                        "PC에서 생성한 등록 코드를 입력하세요.",
                        "error"
                    );


                    return;

                }


                showMessage(
                    "등록 코드를 확인하고 있습니다."
                );


                /*
                 * 코드 사용 + Challenge 생성
                 */
                const optionsResponse =
                    await fetch(
                        "/api/device-register-options",
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
                                        code
                                    }
                                )

                        }
                    );


                const begin =
                    await optionsResponse
                        .json();


                if (
                    !optionsResponse.ok
                ) {

                    throw new Error(
                        begin.error ||
                        `HTTP ${optionsResponse.status}`
                    );

                }


                showMessage(
                    `${begin.displayName} 계정에 아이폰 패스키를 등록합니다.`
                );


                /*
                 * Safari / iPhone에서
                 * 현재 장치의 패스키 생성.
                 */
                const response =
                    await startRegistration({

                        optionsJSON:
                            begin.options

                    });


                /*
                 * 서버 검증
                 */
                const verifyResponse =
                    await fetch(
                        "/api/device-register-verify",
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

                                        flowId:
                                            begin.flowId,

                                        passkeyName:
                                            passkeyName
                                                .value
                                                .trim()
                                            ||
                                            "iPhone 패스키",

                                        response

                                    }
                                )

                        }
                    );


                const result =
                    await verifyResponse
                        .json();


                if (
                    !verifyResponse.ok
                ) {

                    throw new Error(
                        result.error ||
                        `HTTP ${verifyResponse.status}`
                    );

                }


                showMessage(
                    "아이폰 패스키 등록에 성공했습니다.",
                    "success"
                );


                successText.textContent =
                    `${result.user.displayName} (${result.user.username})에 "${result.passkey.name}" 패스키가 추가되었습니다.`;


                successPanel.hidden =
                    false;


                codeInput.disabled =
                    true;


                passkeyName.disabled =
                    true;


                registerButton.disabled =
                    true;

            } catch (
                error
            ) {

                if (
                    error.name ===
                    "NotAllowedError"
                ) {

                    showMessage(
                        "패스키 등록을 취소했습니다. PC에서 새 코드를 발급한 뒤 다시 시도하세요.",
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


        /*
         * WebAuthn은 실제 사용자 클릭 이벤트에서 시작.
         */
        registerButton.addEventListener(
            "click",
            register
        );

    }
);