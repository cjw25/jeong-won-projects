
(() => {
  "use strict";

  // ==========================================
  // 1. 기본 설정
  // ==========================================

  const STORAGE_KEY = "ansim-hangeoreum-checks-v1";

  const CHECK_IDS = [
    "lock",
    "updates",
    "accounts",
    "recovery"
  ];

  const SHORTENER_HOSTS = [
    "bit.ly",
    "bitly.com",
    "t.co",
    "tinyurl.com",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "cutt.ly",
    "rb.gy",
    "rebrand.ly",
    "lnkd.in",
    "shorturl.at"
  ];

  // URL 자동 분석 대기 시간
  const ANALYSIS_DELAY = 650;

  // ==========================================
  // 2. HTML 요소 연결
  // ==========================================

  const navButtons = Array.from(
    document.querySelectorAll("[data-view]")
  );

  const panels = Array.from(
    document.querySelectorAll("[data-panel]")
  );

  const progressLabel =
    document.getElementById("progress-label");

  const progressTrack =
    document.getElementById("progress-track");

  const progressFill =
    document.getElementById("progress-fill");

  const completionMessage =
    document.getElementById("completion-message");

  const storageStatus =
    document.getElementById("storage-status");

  const resetButton =
    document.getElementById("reset-checks");

  const signalInputs = Array.from(
    document.querySelectorAll(".signal-checkbox")
  );

  const signalResult =
    document.getElementById("signal-result");

  const autoCheckList =
    document.getElementById("auto-check-list");

  const autoCheckTime =
    document.getElementById("auto-check-time");

  const runAutoChecksButton =
    document.getElementById("run-auto-checks");

  const linkCheckForm =
    document.getElementById("link-check-form");

  const linkInput =
    document.getElementById("link-input");

  const linkAnalysisResult =
    document.getElementById("link-analysis-result");

  const clearLinkCheckButton =
    document.getElementById("clear-link-check");

  let storageAvailable = true;

  let linkAnalysisTimer = null;

  let isComposingLink = false;

  // ==========================================
  // 3. 기본 보안 점검 저장
  // ==========================================

  function emptyChecks() {
    return Object.fromEntries(
      CHECK_IDS.map((id) => [id, false])
    );
  }

  function loadChecks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return emptyChecks();
      }

      const parsed = JSON.parse(saved);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return emptyChecks();
      }

      return Object.fromEntries(
        CHECK_IDS.map((id) => [
          id,
          parsed[id] === true
        ])
      );

    } catch (error) {
      storageAvailable = false;
      return emptyChecks();
    }
  }

  let checks = loadChecks();

  function updateStorageMessage() {
    if (!storageStatus) return;

    storageStatus.textContent = storageAvailable
      ? "완료 표시만 이 브라우저에 저장됩니다. 메시지나 계정 정보는 입력하지 마세요."
      : "브라우저 저장소를 사용할 수 없어 완료 표시가 유지되지 않을 수 있습니다.";
  }

  function saveChecks() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(checks)
      );

      storageAvailable = true;

    } catch (error) {
      storageAvailable = false;
    }

    updateStorageMessage();
  }

  // ==========================================
  // 4. 체크리스트 진행률 자동 계산
  // ==========================================

  function renderChecks() {
    const completed = CHECK_IDS.filter(
      (id) => checks[id]
    ).length;

    CHECK_IDS.forEach((id) => {
      const button = document.querySelector(
        `[data-check-id="${id}"]`
      );

      if (!button) return;

      const isComplete = checks[id];

      button.setAttribute(
        "aria-pressed",
        String(isComplete)
      );

      button.classList.toggle(
        "is-complete",
        isComplete
      );

      const stateLabel =
        button.querySelector(".check-state");

      if (stateLabel) {
        stateLabel.textContent = isComplete
          ? "완료됨 · 취소하려면 누르기"
          : "완료로 표시";
      }
    });

    if (progressLabel) {
      progressLabel.textContent =
        `${completed} / ${CHECK_IDS.length} 완료`;
    }

    if (progressTrack) {
      progressTrack.setAttribute(
        "aria-valuenow",
        String(completed)
      );
    }

    if (progressFill) {
      progressFill.style.width =
        `${(completed / CHECK_IDS.length) * 100}%`;
    }

    if (completionMessage) {
      if (completed === CHECK_IDS.length) {
        completionMessage.textContent =
          "기본 항목을 모두 확인했어요. 자동으로 기기 설정을 검사했다는 뜻은 아닙니다.";

      } else if (completed === 0) {
        completionMessage.textContent =
          "직접 확인한 항목만 완료로 표시합니다.";

      } else {
        completionMessage.textContent =
          `${CHECK_IDS.length - completed}개 항목이 남아 있어요.`;
      }
    }
  }

  CHECK_IDS.forEach((id) => {
    const button = document.querySelector(
      `[data-check-id="${id}"]`
    );

    if (!button) return;

    button.addEventListener("click", () => {
      checks[id] = !checks[id];

      saveChecks();
      renderChecks();
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const hasChecks = CHECK_IDS.some(
        (id) => checks[id]
      );

      if (!hasChecks) return;

      const confirmed = window.confirm(
        "저장된 완료 표시를 모두 지울까요?"
      );

      if (!confirmed) return;

      checks = emptyChecks();

      saveChecks();
      renderChecks();
    });
  }

  // ==========================================
  // 5. 화면 전환
  // ==========================================

  function showPanel(viewName, moveFocus = true) {
    let activePanel = null;

    panels.forEach((panel) => {
      const isActive =
        panel.dataset.panel === viewName;

      panel.hidden = !isActive;

      if (isActive) {
        activePanel = panel;
      }
    });

    navButtons.forEach((button) => {
      if (button.dataset.view === viewName) {
        button.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (moveFocus && activePanel) {
      const heading =
        activePanel.querySelector("h1");

      if (heading) {
        heading.focus({
          preventScroll: true
        });
      }

      window.scrollTo({
        top: 0,
        behavior: "auto"
      });
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showPanel(button.dataset.view);
    });
  });

  // ==========================================
  // 6. 메시지 위험 신호 안내
  // ==========================================

  function renderSignalResult() {
    if (!signalResult) return;

    const selectedCount = signalInputs.filter(
      (input) => input.checked
    ).length;

    if (selectedCount > 0) {
      signalResult.className =
        "result-box result-box--warning";

      signalResult.textContent =
        "주의 신호가 선택되었습니다. 링크와 첨부파일을 열거나 답장·송금·인증번호 전달을 멈추고 공식 경로로 확인하세요. 이것만으로 사기 여부를 확정할 수는 없습니다.";

    } else {
      signalResult.className = "result-box";

      signalResult.textContent =
        "선택된 위험 신호가 없더라도 안전하다는 뜻은 아닙니다. 의심스러운 연락은 공식 경로로 확인하세요.";
    }
  }

  signalInputs.forEach((input) => {
    input.addEventListener(
      "change",
      renderSignalResult
    );
  });

  // ==========================================
  // 7. 브라우저 저장 공간 자동 점검
  // ==========================================

  function testBrowserStorage() {
    let storage = null;

    let roundTripSucceeded = false;

    let cleanupSucceeded = false;

    let randomPart =
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {
        randomPart = window.crypto.randomUUID();
      }
    } catch (error) {
      // 임시 식별자 사용
    }

    const key =
      `__ansim_hangeoreum_probe_${randomPart}`;

    const value = "temporary-check";

    try {
      storage = window.localStorage;

      storage.setItem(key, value);

      roundTripSucceeded =
        storage.getItem(key) === value;

    } catch (error) {
      roundTripSucceeded = false;

    } finally {
      if (storage) {
        try {
          storage.removeItem(key);
          cleanupSucceeded = true;

        } catch (error) {
          cleanupSucceeded = false;
        }
      }
    }

    if (!roundTripSucceeded) {
      return {
        level: "warning",
        title: "브라우저 저장 공간을 사용할 수 없어요",
        detail: "브라우저 정책에 따라 완료 표시가 저장되지 않을 수 있습니다."
      };
    }

    if (!cleanupSucceeded) {
      return {
        level: "warning",
        title: "임시 저장 항목 삭제 실패",
        detail: "브라우저 저장 공간에서 시험용 항목을 삭제하지 못했습니다."
      };
    }

    return {
      level: "pass",
      title: "브라우저 저장 공간을 사용할 수 있어요",
      detail: "임시 값을 저장하고 읽은 뒤 삭제했습니다."
    };
  }

  // ==========================================
  // 8. 외부 리소스 자동 점검
  // ==========================================

  function collectExternalResources() {
    const hosts = new Map();

    let entries = [];

    try {
      entries =
        performance.getEntriesByType("resource");

    } catch (error) {
      return {
        available: false,
        hosts: []
      };
    }

    entries.forEach((entry) => {
      if (
        !entry ||
        typeof entry.name !== "string"
      ) {
        return;
      }

      try {
        const resourceUrl = new URL(entry.name);

        if (
          resourceUrl.protocol !== "http:" &&
          resourceUrl.protocol !== "https:"
        ) {
          return;
        }

        if (
          resourceUrl.origin ===
          window.location.origin
        ) {
          return;
        }

        hosts.set(
          resourceUrl.origin,
          resourceUrl.host
        );

      } catch (error) {
        // 읽을 수 없는 리소스 제외
      }
    });

    return {
      available: true,
      hosts: Array.from(hosts.values())
    };
  }

  // ==========================================
  // 9. 자동 점검 결과 HTML 생성
  // ==========================================

  function makeAutoCheckItem(result) {
    const item = document.createElement("li");

    item.className =
      `auto-check-item auto-check-item--${result.level}`;

    const badge = document.createElement("span");

    badge.className = "auto-check-badge";

    badge.textContent =
      result.level === "pass"
        ? "확인됨"
        : result.level === "warning"
          ? "주의"
          : "안내";

    const copy = document.createElement("span");

    copy.className = "auto-check-copy";

    const title = document.createElement("strong");

    title.textContent = result.title;

    const detail = document.createElement("span");

    detail.textContent = result.detail;

    copy.append(title, detail);

    item.append(badge, copy);

    return item;
  }

  // ==========================================
  // 10. 페이지 실행 시 자동 보안 점검
  // ==========================================

  function runAutomaticChecks() {
    if (!autoCheckList) return;

    const results = [];

    const protocol = window.location.protocol;

    const hostname =
      window.location.hostname.toLowerCase();

    const isLocalHost =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("127.") ||
      hostname === "[::1]" ||
      hostname === "::1";

    // 연결 방식 자동 확인

    if (protocol === "https:") {
      results.push({
        level: "pass",
        title: "이 페이지는 HTTPS로 열렸어요",
        detail: "브라우저와 서버 사이의 연결이 암호화됩니다. HTTPS만으로 사이트의 신뢰성을 보장하지는 않습니다."
      });

    } else if (
      protocol === "http:" &&
      isLocalHost
    ) {
      results.push({
        level: "info",
        title: "로컬 개발 주소에서 열렸어요",
        detail: "개발 환경에서 실행 중입니다. 실제 서비스 공개 시 HTTPS를 사용해야 합니다."
      });

    } else if (protocol === "http:") {
      results.push({
        level: "warning",
        title: "HTTP 연결이 감지되었습니다",
        detail: "연결이 암호화되지 않았습니다. 민감한 정보를 입력하지 마세요."
      });

    } else if (protocol === "file:") {
      results.push({
        level: "info",
        title: "로컬 파일로 실행 중입니다",
        detail: "로컬 파일 실행 상태에서는 공개 웹서비스의 HTTPS 연결 보안을 확인할 수 없습니다."
      });

    } else {
      results.push({
        level: "info",
        title: "연결 방식을 확인하기 어렵습니다",
        detail: `현재 연결 방식: ${protocol || "알 수 없음"}`
      });
    }

    // 저장 공간 자동 점검

    results.push(testBrowserStorage());

    // 외부 리소스 자동 점검

    const externalResources =
      collectExternalResources();

    if (!externalResources.available) {
      results.push({
        level: "info",
        title: "외부 리소스 목록을 읽을 수 없습니다",
        detail: "브라우저 정책으로 인해 일부 정보가 제공되지 않을 수 있습니다."
      });

    } else if (
      externalResources.hosts.length === 0
    ) {
      results.push({
        level: "pass",
        title: "보고된 외부 리소스가 없습니다",
        detail: "현재 브라우저에 노출된 리소스 기록 기준입니다. 모든 외부 연결이 없다는 뜻은 아닙니다."
      });

    } else {
      const visibleHosts =
        externalResources.hosts.slice(0, 5);

      const hostSummary =
        visibleHosts.join(", ");

      results.push({
        level: "info",
        title: `외부 리소스 호스트 ${externalResources.hosts.length}곳 확인`,
        detail: `${hostSummary}. 외부 리소스가 있다는 사실만으로 위험하다는 뜻은 아닙니다.`
      });
    }

    // 결과 자동 출력

    const fragment =
      document.createDocumentFragment();

    results.forEach((result) => {
      fragment.appendChild(
        makeAutoCheckItem(result)
      );
    });

    autoCheckList.replaceChildren(fragment);

    // 점검 시간 표시

    if (autoCheckTime) {
      const time = new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      ).format(new Date());

      autoCheckTime.textContent =
        `브라우저 안에서 자동 점검 완료: ${time}. 점검 결과는 서버로 전송되지 않습니다.`;
    }
  }

  // ==========================================
  // 11. URL 분석 보조 함수
  // ==========================================

  function isIpAddress(hostname) {
    const host = hostname.toLowerCase();

    return (
      host.startsWith("[") &&
      host.endsWith("]")
    ) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  }

  function isLoopbackHost(hostname) {
    const host = hostname
      .toLowerCase()
      .replace(/^\[|\]$/g, "");

    return (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "::1" ||
      host.startsWith("127.")
    );
  }

  function isKnownShortener(hostname) {
    const host = hostname.toLowerCase();

    return SHORTENER_HOSTS.some(
      (domain) =>
        host === domain ||
        host.endsWith(`.${domain}`)
    );
  }

  // ==========================================
  // 12. URL 분석 오류 출력
  // ==========================================

  function showLinkAnalysisError(message) {
    if (!linkAnalysisResult) return;

    linkAnalysisResult.className =
      "result-box link-result link-result--error";

    linkAnalysisResult.replaceChildren();

    const title = document.createElement("strong");

    title.textContent =
      "주소를 분석할 수 없어요.";

    const detail = document.createElement("p");

    detail.textContent = message;

    linkAnalysisResult.append(
      title,
      detail
    );
  }

  // ==========================================
  // 13. URL 분석 결과 자동 출력
  // ==========================================

  function showLinkAnalysis(
    url,
    findings,
    warningCount
  ) {
    if (!linkAnalysisResult) return;

    linkAnalysisResult.className =
      warningCount > 0
        ? "result-box result-box--warning link-result"
        : "result-box result-box--info link-result";

    linkAnalysisResult.replaceChildren();

    const title = document.createElement("strong");

    title.textContent =
      warningCount > 0
        ? `추가로 확인할 신호가 ${warningCount}개 있어요.`
        : "확인한 형식 규칙에서 추가 신호를 찾지 못했어요.";

    const summary = document.createElement("p");

    summary.textContent =
      `분석 대상 호스트: ${url.host}. 입력한 주소의 경로와 추가 정보는 표시하지 않습니다.`;

    const list = document.createElement("ul");

    list.className = "link-findings";

    findings.forEach((finding) => {
      const item =
        document.createElement("li");

      const findingTitle =
        document.createElement("strong");

      findingTitle.textContent =
        finding.title;

      const findingDetail =
        document.createElement("span");

      findingDetail.textContent =
        finding.detail;

      item.append(
        findingTitle,
        findingDetail
      );

      list.appendChild(item);
    });

    const limitation =
      document.createElement("p");

    limitation.textContent =
      "주소를 실제로 열거나 외부 평판 서비스를 조회하지 않았습니다. 분석 결과는 안전을 보장하거나 사기 여부를 확정하지 않습니다.";

    linkAnalysisResult.append(
      title,
      summary,
      list,
      limitation
    );
  }

  // ==========================================
  // 14. URL 규칙 기반 자동 분석 엔진
  // ==========================================

  function analyzeLink(rawValue) {
    const raw = rawValue.trim();

    // 입력값 검사

    if (!raw) {
      clearLinkAnalysis();
      return;
    }

    if (raw.length > 2048) {
      showLinkAnalysisError(
        "주소가 너무 깁니다. 개인용 정보가 포함된 링크는 입력하지 마세요."
      );
      return;
    }

    if (/[\u0000-\u001f\u007f]/.test(raw)) {
      showLinkAnalysisError(
        "주소에 제어 문자가 포함되어 분석하지 않았습니다."
      );
      return;
    }

    // URL 형식 보정

    let candidate = raw;

    if (!/^[a-z][a-z\d+.-]*:/i.test(candidate)) {
      candidate = candidate.startsWith("//")
        ? `https:${candidate}`
        : `https://${candidate}`;
    }

    let url;

    try {
      url = new URL(candidate);

    } catch (error) {
      showLinkAnalysisError(
        "주소 형식을 읽을 수 없습니다. https://example.com 형식으로 입력하세요."
      );
      return;
    }

    // HTTP / HTTPS만 분석

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      showLinkAnalysisError(
        "HTTP 또는 HTTPS 웹 주소만 분석할 수 있습니다."
      );
      return;
    }

    if (!url.hostname) {
      showLinkAnalysisError(
        "주소에서 사이트 호스트를 찾을 수 없습니다."
      );
      return;
    }

    const findings = [];

    let warningCount = 0;

    // ------------------------------------------
    // 규칙 1. HTTPS / HTTP
    // ------------------------------------------

    if (url.protocol === "https:") {
      findings.push({
        title: "HTTPS 연결을 사용합니다",
        detail: "전송 중 연결을 암호화하는 방식입니다. 사이트 자체의 안전성을 보장하지는 않습니다."
      });

    } else if (isLoopbackHost(url.hostname)) {
      findings.push({
        title: "HTTP 로컬 주소입니다",
        detail: "로컬 개발용 주소일 수 있습니다. 실제 공개 사이트에서는 HTTPS 사용 여부를 확인하세요."
      });

    } else {
      warningCount++;

      findings.push({
        title: "암호화되지 않은 HTTP 주소입니다",
        detail: "로그인·결제·개인정보 입력을 피하고 공식 경로로 확인하세요."
      });
    }

    // ------------------------------------------
    // 규칙 2. URL 사용자 정보
    // ------------------------------------------

    if (url.username || url.password) {
      warningCount++;

      findings.push({
        title: "주소에 사용자 정보가 포함되어 있습니다",
        detail: "URL에 로그인 정보처럼 보이는 부분이 포함되어 있습니다. 주소를 공유하지 마세요."
      });
    }

    // ------------------------------------------
    // 규칙 3. IP 주소
    // ------------------------------------------

    if (isIpAddress(url.hostname)) {
      warningCount++;

      findings.push({
        title: "도메인 대신 IP 주소를 사용합니다",
        detail: "IP 주소만으로 운영자를 확인할 수 없습니다. 공식 경로를 통해 확인하세요."
      });
    }

    // ------------------------------------------
    // 규칙 4. Punycode
    // ------------------------------------------

    const domainLabels =
      url.hostname.toLowerCase().split(".");

    const hasPunycode = domainLabels.some(
      (label) => label.startsWith("xn--")
    );

    if (hasPunycode) {
      warningCount++;

      findings.push({
        title: "다국어 도메인 변환 표기가 감지되었습니다",
        detail: "비슷하게 보이는 다른 문자를 사용한 주소일 수 있습니다. 실제 도메인을 확인하세요."
      });
    }

    // ------------------------------------------
    // 규칙 5. 단축 URL
    // ------------------------------------------

    if (isKnownShortener(url.hostname)) {
      warningCount++;

      findings.push({
        title: "알려진 링크 단축 도메인 형식입니다",
        detail: "최종 이동 주소는 확인하지 않습니다. 보낸 사람과 목적을 별도로 확인하세요."
      });
    }

    // ------------------------------------------
    // 규칙 6. 비기본 포트
    // ------------------------------------------

    if (url.port) {
      warningCount++;

      findings.push({
        title: `기본값이 아닌 포트 ${url.port}를 사용합니다`,
        detail: "해당 포트가 필요한 주소인지 공식 경로에서 확인하세요."
      });
    }

    // ------------------------------------------
    // 최종 자동 분류
    // ------------------------------------------

    showLinkAnalysis(
      url,
      findings,
      warningCount
    );
  }

  // ==========================================
  // 15. URL 분석 결과 초기화
  // ==========================================

  function clearLinkAnalysis() {
    if (!linkAnalysisResult) return;

    linkAnalysisResult.className =
      "result-box link-result";

    linkAnalysisResult.replaceChildren();

    const title =
      document.createElement("strong");

    title.textContent =
      "아직 분석하지 않았어요.";

    const detail =
      document.createElement("p");

    detail.textContent =
      "웹 주소를 입력하거나 붙여넣으면 자동으로 분석합니다.";

    linkAnalysisResult.append(
      title,
      detail
    );
  }

  // ==========================================
  // 16. 입력 감지 자동화 (핵심)
  // ==========================================

  function scheduleLinkAnalysis() {
    // 이전 분석 예약 취소
    window.clearTimeout(linkAnalysisTimer);

    if (!linkInput) return;

    const value = linkInput.value.trim();

    // 입력 삭제 시 결과 초기화
    if (!value) {
      clearLinkAnalysis();
      return;
    }

    // 입력이 멈춘 뒤 자동 분석
    linkAnalysisTimer = window.setTimeout(() => {
      if (isComposingLink) return;

      analyzeLink(linkInput.value);

    }, ANALYSIS_DELAY);
  }

  // ==========================================
  // 17. URL 입력 / 붙여넣기 자동 감지
  // ==========================================

  if (linkInput) {
    linkInput.addEventListener("input", () => {
      if (!isComposingLink) {
        scheduleLinkAnalysis();
      }
    });

    // 한글 조합 입력 중 분석 방지
    linkInput.addEventListener(
      "compositionstart",
      () => {
        isComposingLink = true;

        window.clearTimeout(
          linkAnalysisTimer
        );
      }
    );

    linkInput.addEventListener(
      "compositionend",
      () => {
        isComposingLink = false;

        scheduleLinkAnalysis();
      }
    );
  }

  // ==========================================
  // 18. 즉시 분석 버튼
  // ==========================================

  if (linkCheckForm) {
    linkCheckForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        window.clearTimeout(
          linkAnalysisTimer
        );

        analyzeLink(
          linkInput ? linkInput.value : ""
        );
      }
    );
  }

  // ==========================================
  // 19. 입력 및 분석 결과 지우기
  // ==========================================

  if (clearLinkCheckButton) {
    clearLinkCheckButton.addEventListener(
      "click",
      () => {
        window.clearTimeout(
          linkAnalysisTimer
        );

        if (linkInput) {
          linkInput.value = "";
          linkInput.focus();
        }

        clearLinkAnalysis();
      }
    );
  }

  // ==========================================
  // 20. 자동 점검 재실행
  // ==========================================

  if (runAutoChecksButton) {
    runAutoChecksButton.addEventListener(
      "click",
      runAutomaticChecks
    );
  }

  // ==========================================
  // 21. 앱 최초 실행
  // ==========================================

  updateStorageMessage();

  renderChecks();

  renderSignalResult();

  // 페이지를 열면 자동 점검 시작
  runAutomaticChecks();

})();
