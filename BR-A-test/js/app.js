(async function () {

  const numbersGrid =
    document.getElementById(
      "numbers-grid"
    );


  if (!numbersGrid) {
    return;
  }


  try {

    const response =
      await fetch(
        "./data/generated.json",
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "generated.json load failed"
      );

    }


    const data =
      await response.json();


    numbersGrid.innerHTML =
      data.metrics
        .map((metric) => {

          return `
            <article class="metric">

              <div class="value">
                ${metric.value}
              </div>

              <h3>
                ${metric.label}
              </h3>

              <p>
                ${metric.detail}
              </p>

              <span class="source">
                출처: ${metric.source}
              </span>

            </article>
          `;

        })
        .join("");


  } catch (error) {

    console.error(error);


    numbersGrid.innerHTML = `
      <article class="metric">

        <h3>
          숫자 데이터를 불러오지 못했습니다.
        </h3>

        <p>
          python tools/update_site.py 를 실행해
          data/generated.json을 다시 생성해 주세요.
        </p>

      </article>
    `;

  }

})();