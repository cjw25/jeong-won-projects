
/*
 * 안심 한 걸음
 * 최종 자동화 업그레이드
 *
 * 기능:
 * 1. 기존 자동 점검 결과 수집
 * 2. URL 분석 결과 자동 요약
 * 3. 위험 신호별 대응 안내
 * 4. 세션별 분석 통계
 * 5. 개인정보를 제외한 TXT 보고서 생성
 */

(() => {
  "use strict";

  // ==========================================
  // 1. 기존 HTML 요소 연결
  // ==========================================

  const resultBox =
    document.getElementById("link-analysis-result");

  const autoCheckList =
    document.getElementById("auto-check-list");

  const clearButton =
    document.getElementById("clear-link-check");

  const progressLabel =
    document.getElementById("progress-label");

  const checker =
    resultBox?.closest(".link-checker");

  if (!resultBox || !autoCheckList || !checker) {
    return;
  }

  // URL 원문은 기록하지 않습니다.
  // 현재 브라우저 세션의 메모리에만 저장합니다.

  const session = [];

  let environment = {
    total: 0,
    pass: 0,
    warning: 0,
    info: 0
  };

  let latest = null;

  // ==========================================
  // 2. 자동화 대시보드 생성
  // ==========================================

  const dashboard = document.createElement("section");

  dashboard.className = "final-dashboard";

  dashboard.setAttribute(
    "aria-labelledby",
    "final-dashboard-heading"
  );

  dashboard.innerHTML = `
    <div class="final-dashboard-head">

      <div>
        <p class="eyebrow">
          최종 자동화 · 현재 브라우저 세션
        </p>

        <h2 id="final-dashboard-heading">
          자동 점검 통합 결과
        </h2>
      </div>

      <span
        id="final-status"
        class="final-pill"
        role="status"
        aria-live="polite"
      >
        대기 중
      </span>

    </div>

    <div class="final-stats" aria-label="자동 점검 집계">

      <div>
        <strong id="final-env-count">0</strong>
        <span>환경 점검 항목</span>
      </div>

      <div>
        <strong id="final-scan-count">0</strong>
        <span>이 세션의 URL 분석</span>
      </div>

      <div>
        <strong id="final-warning-count">0</strong>
        <span>최근 추가 확인 신호</span>
      </div>

    </div>

    <div class="final-guidance">

      <h3>자동 대응 안내</h3>

      <p id="final-advice" aria-live="polite">
        URL을 입력하면 분석 결과에 맞는 안내가
        자동 표시됩니다.
      </p>

    </div>

    <div class="final-report-head">

      <h3>자동 생성 점검 보고서</h3>

      <p>
        URL 원문, 호스트, 경로, 쿼리 및 개인용 토큰은
        보고서에 포함하지 않습니다.
      </p>

    </div>

    <pre
      id="final-report-preview"
      class="final-report-preview"
      aria-label="보고서 미리보기"
    ></pre>

    <div class="final-actions">

      <button
        class="button-primary"
        id="final-report-download"
        type="button"
      >
        보고서 TXT 저장
      </button>

      <button
        class="button-secondary"
        id="final-session-clear"
        type="button"
      >
        세션 기록 지우기
      </button>

    </div>

    <p class="final-note">
      분석 기록은 메모리에만 보관되며 새로고침하면 사라집니다.
      보고서는 버튼을 눌렀을 때만 내려받습니다.
      기기·계정 전체의 안전을 보증하지 않습니다.
    </p>
  `;

  checker.insertAdjacentElement(
    "afterend",
    dashboard
  );

  // ==========================================
  // 3. 대시보드 요소 연결
  // ==========================================

  const get = (id) =>
    document.getElementById(id);

  const countLabel =
    get("final-scan-count");

  const envLabel =
    get("final-env-count");

  const warningLabel =
    get("final-warning-count");

  const statusLabel =
    get("final-status");

  const adviceLabel =
    get("final-advice");

  const reportPreview =
    get("final-report-preview");

  // ==========================================
  // 4. 위험 신호 분류
  // ==========================================

  function describeSignal(title) {

    if (
      title.includes("HTTP") &&
      !title.includes("HTTPS")
    ) {
      return "HTTP 연결";
    }

    if (title.includes("사용자 정보")) {
      return "URL 사용자 정보";
    }

    if (title.includes("IP 주소")) {
      return "IP 주소";
    }

    if (title.includes("다국어 도메인")) {
      return "다국어 도메인";
    }

    if (title.includes("단축")) {
      return "단축 URL";
    }

    if (title.includes("포트")) {
      return "비기본 포트";
    }

    return "그 밖의 형식 신호";
  }

  // ==========================================
  // 5. 페이지 환경 자동 점검 결과 수집
  // ==========================================

  function readEnvironment() {

    const items = Array.from(
      autoCheckList.querySelectorAll(
        ".auto-check-item"
      )
    );

    environment = {

      total: items.length,

      pass: items.filter(
        (el) =>
          el.classList.contains(
            "auto-check-item--pass"
          )
      ).length,

      warning: items.filter(
        (el) =>
          el.classList.contains(
            "auto-check-item--warning"
          )
      ).length,

      info: items.filter(
        (el) =>
          el.classList.contains(
            "auto-check-item--info"
          )
      ).length
    };
  }

  // ==========================================
  // 6. 기존 URL 분석 결과 자동 수집
  // ==========================================

  function readAnalysis() {

    const title =
      resultBox.querySelector(":scope > strong")
        ?.textContent?.trim() || "";

    if (
      !title ||
      title.includes("아직 분석하지")
    ) {
      return null;
    }

    const time =
      new Date().toLocaleString("ko-KR");

    // 입력 형식 오류

    if (
      resultBox.classList.contains(
        "link-result--error"
      )
    ) {

      return {
        time,
        type: "invalid",
        warnings: 0,
        signals: []
      };
    }

    // 위험 신호 개수 확인

    const match = title.match(
      /추가로 확인할 신호가\s*(\d+)개/
    );

    const warnings = match
      ? Number(match[1])
      : 0;

    // 신호 명칭만 추출합니다.
    // URL과 호스트 정보는 저장하지 않습니다.

    const labels = Array.from(
      resultBox.querySelectorAll(
        ".link-findings li strong"
      )
    )

      .map((el) =>
        el.textContent.trim()
      )

      .filter((value) =>
        !(
          value.includes("HTTPS") ||
          value.includes("HTTP 로컬")
        )
      )

      .map(describeSignal);

    return {
      time,
      type: "analyzed",
      warnings,
      signals: [...new Set(labels)]
    };
  }

  // ==========================================
  // 7. 분석 결과별 자동 대응 안내
  // ==========================================

  function adviceFor(record) {

    if (!record) {

      return "URL을 입력하면 분석 결과에 맞는 안내가 자동 표시됩니다.";
    }

    if (record.type === "invalid") {

      return "주소 형식을 확인하세요. 개인용 링크와 인증번호는 입력하지 마세요.";
    }

    if (record.warnings === 0) {

      return "현재 형식 규칙에서는 추가 신호가 없지만 안전을 보장하지 않습니다. 서비스의 공식 앱이나 직접 입력한 주소로 확인하세요.";
    }

    if (
      record.signals.includes(
        "URL 사용자 정보"
      )
    ) {

      return "주소에 사용자 정보가 포함되어 있습니다. 해당 링크를 공유하거나 로그인 정보를 입력하지 말고, 서비스의 공식 경로를 사용하세요.";
    }

    if (
      record.signals.includes(
        "HTTP 연결"
      )
    ) {

      return "암호화되지 않은 HTTP 주소입니다. 로그인·결제·개인정보 입력을 피하고 공식 경로로 이동하세요.";
    }

    if (
      record.signals.includes(
        "단축 URL"
      )
    ) {

      return "단축 URL의 최종 목적지는 확인하지 않았습니다. 발신자와 목적을 별도 공식 경로로 확인하고 예상하지 못한 링크는 열지 마세요.";
    }

    return "추가 확인 신호가 발견됐습니다. 링크를 바로 열지 말고 운영 주체와 주소를 공식 경로에서 확인하세요.";
  }

  // ==========================================
  // 8. 점검 보고서 자동 생성
  // ==========================================

  function reportText() {

    const lines = [

      "안심 한 걸음 | 자동 점검 보고서",

      "생성 일시: " +
        new Date().toLocaleString("ko-KR"),

      "분석 방식: 브라우저 내 규칙 기반 형식 점검 (외부 평판 조회 없음)",

      "",

      "[페이지 환경 점검]",

      `점검 항목: ${environment.total}개 / 확인됨: ${environment.pass}개 / 주의: ${environment.warning}개 / 안내: ${environment.info}개`,

      "",

      "[사용자 직접 확인 항목]",

      "기본 보안 체크리스트: " +
        (
          progressLabel?.textContent?.trim() ||
          "표시 없음"
        ) +
        " (기기 설정을 자동 검사한 결과 아님)",

      "",

      "[현재 세션 URL 분석 요약]",

      `분석 횟수: ${session.length}회`,

      `추가 확인 신호가 나온 분석: ${
        session.filter(
          (entry) => entry.warnings > 0
        ).length
      }회`,

      `형식 오류: ${
        session.filter(
          (entry) => entry.type === "invalid"
        ).length
      }회`
    ];

    session.forEach((entry, i) => {

      const result =
        entry.type === "invalid"
          ? "형식 오류"
          : `추가 신호 ${entry.warnings}개`;

      const signals =
        entry.signals.join(", ") ||
        "추가 분류 신호 없음";

      lines.push(
        `${i + 1}. ${entry.time} | ${result} | ${signals}`
      );
    });

    lines.push(
      "",
      "[최근 결과에 따른 대응 안내]",
      adviceFor(latest)
    );

    lines.push(
      "",
      "[한계 및 개인정보]",

      "URL 원문·호스트·경로·쿼리·개인용 토큰을 보고서에 포함하지 않았습니다.",

      "브라우저에 표시된 URL의 실제 목적지를 조회하거나 안전을 보증하지 않습니다.",

      "이 웹앱은 기기·계정·악성코드를 검사 또는 차단하지 않습니다.",

      "기본 체크리스트 완료 표시는 별도 로컬 저장소에 유지됩니다."
    );

    return lines.join("\n") + "\n";
  }

  // ==========================================
  // 9. 자동 대시보드 갱신
  // ==========================================

  function render() {

    envLabel.textContent =
      String(environment.total);

    countLabel.textContent =
      String(session.length);

    warningLabel.textContent =
      String(latest?.warnings || 0);

    if (!latest) {

      statusLabel.textContent =
        "분석 대기";

    } else if (
      latest.type === "invalid"
    ) {

      statusLabel.textContent =
        "입력 형식 확인";

    } else if (
      latest.warnings > 0
    ) {

      statusLabel.textContent =
        "추가 확인 필요";

    } else {

      statusLabel.textContent =
        "형식 분석 완료";
    }

    statusLabel.classList.toggle(
      "final-pill--warning",

      !!latest && (
        latest.type === "invalid" ||
        latest.warnings > 0
      )
    );

    adviceLabel.textContent =
      adviceFor(latest);

    // 검사 결과가 바뀌면 보고서도 자동 갱신합니다.

    reportPreview.textContent =
      reportText();
  }

  // ==========================================
  // 10. URL 분석 완료 자동 감지
  // ==========================================

  const resultObserver =
    new MutationObserver(() => {

      const record = readAnalysis();

      if (!record) {

        latest = null;

        render();

        return;
      }

      latest = record;

      session.push(record);

      // 최근 20회 분석 결과만 유지

      if (session.length > 20) {
        session.shift();
      }

      render();
    });

  resultObserver.observe(resultBox, {

    childList: true,

    subtree: true,

    characterData: true

  });

  // ==========================================
  // 11. 페이지 점검 변경 감지
  // ==========================================

  const environmentObserver =
    new MutationObserver(() => {

      readEnvironment();

      render();

    });

  environmentObserver.observe(
    autoCheckList,
    {
      childList: true,
      subtree: true,
      characterData: true
    }
  );

  // ==========================================
  // 12. 세션 기록 초기화
  // ==========================================

  function resetSession() {

    session.length = 0;

    latest = null;

    render();
  }

  // 체크리스트 진행률 변경 시 보고서 갱신

  if (progressLabel) {

    new MutationObserver(render).observe(
      progressLabel,
      {
        childList: true,
        characterData: true,
        subtree: true
      }
    );
  }

  // 기존 입력 초기화 버튼과 연동

  clearButton?.addEventListener(
    "click",
    resetSession
  );

  // 별도 세션 기록 삭제

  get("final-session-clear").addEventListener(
    "click",
    resetSession
  );

  // ==========================================
  // 13. TXT 보고서 저장
  // ==========================================

  get("final-report-download").addEventListener(
    "click",
    () => {

      const blob = new Blob(

        ["\uFEFF", reportText()],

        {
          type: "text/plain;charset=utf-8"
        }
      );

      const objectUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = objectUrl;

      link.download =
        "ansim-hangeoreum-report.txt";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.setTimeout(() => {

        URL.revokeObjectURL(objectUrl);

      }, 1000);
    }
  );

  // ==========================================
  // 14. 최초 실행
  // ==========================================

  readEnvironment();

  render();

})();
