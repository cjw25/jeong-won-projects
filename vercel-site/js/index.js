document.addEventListener("DOMContentLoaded", () => {

    const pages = Array.from(
        document.querySelectorAll(".page")
    );

    let currentPage = 1;


    function showPage(pageNumber) {

        if (
            pageNumber < 1 ||
            pageNumber > pages.length
        ) {
            return;
        }


        pages.forEach(page => {
            page.classList.remove("active");
        });


        const targetPage =
            document.querySelector(
                `.page[data-page="${pageNumber}"]`
            );


        if (!targetPage) {
            return;
        }


        targetPage.classList.add("active");

        currentPage = pageNumber;


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        const firstButton =
            targetPage.querySelector("button");


        if (firstButton) {

            setTimeout(() => {
                firstButton.focus({
                    preventScroll: true
                });
            }, 100);

        }

    }


    /* ============================
       다음
    ============================ */

    document
        .querySelectorAll("[data-next]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        currentPage + 1
                    );

                }
            );

        });


    /* ============================
       이전
    ============================ */

    document
        .querySelectorAll("[data-prev]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        currentPage - 1
                    );

                }
            );

        });


    /* ============================
       페이지 바로가기
    ============================ */

    document
        .querySelectorAll("[data-target]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        Number(
                            button.dataset.target
                        );


                    if (
                        Number.isInteger(target)
                    ) {

                        showPage(target);

                    }

                }
            );

        });


    /* ============================
       좌우 방향키
    ============================ */

    document.addEventListener(
        "keydown",
        event => {

            /*
             * input/select 등에서
             * 방향키 사용 중일 때는
             * 페이지 이동하지 않음.
             */

            const tagName =
                document.activeElement
                    ?.tagName
                    ?.toLowerCase();


            if (
                tagName === "input" ||
                tagName === "select" ||
                tagName === "textarea"
            ) {

                return;

            }


            if (
                event.key ===
                "ArrowRight"
            ) {

                showPage(
                    currentPage + 1
                );

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                showPage(
                    currentPage - 1
                );

            }

        }
    );


    /*
     * 예전 코드에서
     * 존재하지 않는 processButton에
     * addEventListener를 걸어 오류가
     * 발생할 수 있었기 때문에 null 체크.
     */

    const processButton =
        document.getElementById(
            "processButton"
        );


    const processDetail =
        document.getElementById(
            "processDetail"
        );


    if (
        processButton &&
        processDetail
    ) {

        processButton.addEventListener(
            "click",
            () => {

                const isExpanded =
                    processButton
                        .getAttribute(
                            "aria-expanded"
                        ) === "true";


                processButton.setAttribute(
                    "aria-expanded",
                    String(!isExpanded)
                );


                processDetail.hidden =
                    isExpanded;


                processButton.textContent =
                    isExpanded
                        ? "내가 문제를 확인하는 방식 보기"
                        : "내용 접기";

            }
        );

    }

});