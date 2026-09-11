document.addEventListener("DOMContentLoaded", () => {

    const pages = Array.from(document.querySelectorAll(".page"));

    let currentPage = 1;

    function showPage(pageNumber) {

        if (pageNumber < 1 || pageNumber > pages.length) {
            return;
        }

        pages.forEach(page => {
            page.classList.remove("active");
        });

        const targetPage = document.querySelector(
            `.page[data-page="${pageNumber}"]`
        );

        targetPage.classList.add("active");

        currentPage = pageNumber;

        const firstButton = targetPage.querySelector("button");

        if (firstButton) {
            firstButton.focus();
        }
    }


    /* 다음 */

    document.querySelectorAll("[data-next]").forEach(button => {

        button.addEventListener("click", () => {

            showPage(currentPage + 1);

        });

    });


    /* 이전 */

    document.querySelectorAll("[data-prev]").forEach(button => {

        button.addEventListener("click", () => {

            showPage(currentPage - 1);

        });

    });


    /* 바로가기 */

    document.querySelectorAll("[data-target]").forEach(button => {

        button.addEventListener("click", () => {

            const target = Number(button.dataset.target);

            showPage(target);

        });

    });


    /* 좌우 방향키 */

    document.addEventListener("keydown", event => {

        if (event.key === "ArrowRight") {

            showPage(currentPage + 1);

        }

        if (event.key === "ArrowLeft") {

            showPage(currentPage - 1);

        }

    });


    /* PAGE 3 상세보기 */

    const processButton =
        document.getElementById("processButton");

    const processDetail =
        document.getElementById("processDetail");

    processButton.addEventListener("click", () => {

        const isExpanded =
            processButton.getAttribute("aria-expanded") === "true";

        processButton.setAttribute(
            "aria-expanded",
            String(!isExpanded)
        );

        processDetail.hidden = isExpanded;

        if (isExpanded) {

            processButton.textContent =
                "내가 문제를 확인하는 방식 보기";

        } else {

            processButton.textContent =
                "내용 접기";

        }

    });

});