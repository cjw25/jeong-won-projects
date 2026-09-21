document.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById(
                "createCodeButton"
            );


        const codeArea =
            document.getElementById(
                "codeArea"
            );


        const deviceCode =
            document.getElementById(
                "deviceCode"
            );


        const expiresText =
            document.getElementById(
                "expiresText"
            );


        const registerUrl =
            document.getElementById(
                "registerUrl"
            );


        const message =
            document.getElementById(
                "message"
            );


        /*
         * 현재 production origin 사용.
         */
        const targetUrl =
            `${window.location.origin}/device-register.html`;


        registerUrl.href =
            targetUrl;


        registerUrl.textContent =
            targetUrl;


        async function createCode() {

            try {

                message.textContent =
                    "1회용 코드를 생성하고 있습니다.";


                message.dataset.type =
                    "info";


                const response =
                    await fetch(
                        "/api/device-link",
                        {

                            method:
                                "POST",

                            credentials:
                                "same-origin",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            }

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data.error ||
                        `HTTP ${response.status}`
                    );

                }


                deviceCode.textContent =
                    data.code;


                const expires =
                    new Date(
                        data.expiresAt
                    );


                expiresText.textContent =
                    `만료 시각: ${expires.toLocaleString("ko-KR")}`;


                codeArea.hidden =
                    false;


                message.textContent =
                    `${data.username} 계정용 1회용 코드가 생성되었습니다.`;


                message.dataset.type =
                    "success";

            } catch (
                error
            ) {

                message.textContent =
                    error.message;


                message.dataset.type =
                    "error";

            }

        }


        button.addEventListener(
            "click",
            createCode
        );

    }
);