(() => {
  const STORAGE_KEY = "ansim-hangeoreum-checks-v1";
  const CHECK_IDS = ["lock", "updates", "accounts", "recovery"];
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

  const navButtons = Array.from(document.querySelectorAll("[data-view]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  const progressLabel = document.getElementById("progress-label");
  const progressTrack = document.getElementById("progress-track");
  const progressFill = document.getElementById("progress-fill");
  const completionMessage = document.getElementById("completion-message");
  const storageStatus = document.getElementById("storage-status");
  const resetButton = document.getElementById("reset-checks");
  const signalInputs = Array.from(document.querySelectorAll(".signal-checkbox"));
  const signalResult = document.getElementById("signal-result");
  const autoCheckList = document.getElementById("auto-check-list");
  const autoCheckTime = document.getElementById("auto-check-time");
  const runAutoChecksButton = document.getElementById("run-auto-checks");
  const linkCheckForm = document.getElementById("link-check-form");
  const linkInput = document.getElementById("link-input");
  const linkAnalysisResult = document.getElementById("link-analysis-result");
  const clearLinkCheckButton = document.getElementById("clear-link-check");

  let storageAvailable = true;

  function emptyChecks() {
    return Object.fromEntries(CHECK_IDS.map((id) => [id, false]));
  }

  function loadChecks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return emptyChecks();
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyChecks();
      return Object.fromEntries(CHECK_IDS.map((id) => [id, parsed[id] === true]));
    } catch {
      storageAvailable = false;
      return emptyChecks();
    }
  }

  let checks = loadChecks();

  function updateStorageMessage() {
    if (!storageStatus) return;
    storageStatus.textContent = storageAvailable
      ? "완료 표시만 이 브라우저에 저장됩니다. 메시지나 계정 정보는 입력하지 마세요."
      : "브라우저 저장소를 사용할 수 없어 완료 표시가 새로고침 후 유지되지 않을 수 있어요.";
  }

  function saveChecks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    updateStorageMessage();
  }

  function renderChecks() {
    const completed = CHECK_IDS.filter((id) => checks[id]).length;

    CHECK_IDS.forEach((id) => {
      const button = document.querySelector(`[data-check-id="${id}"]`);
      if (!button) return;
      const isComplete = checks[id];
      button.setAttribute("aria-pressed", String(isComplete));
      button.classList.toggle("is-complete", isComplete);
      const stateLabel = button.querySelector(".check-state");
      if (stateLabel) {
        stateLabel.textContent = isComplete ? "완료됨 · 취소하려면 누르기" : "완료로 표시";
      }
    });

    if (progressLabel) progressLabel.textContent = `${completed} / ${CHECK_IDS.length} 완료`;
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(completed));
    if (progressFill) progressFill.style.width = `${(completed / CHECK_IDS.length) * 100}%`;

    if (completionMessage) {
      if (completed === CHECK_IDS.length) {
        completionMessage.textContent = "기본 항목을 모두 확인했어요. 이 표시는 자동으로 기기 설정을 검사했다는 뜻은 아닙니다.";
      } else if (completed === 0) {
        completionMessage.textContent = "직접 확인한 항목만 완료로 표시해요. 자동으로 기기 설정을 읽지는 않습니다.";
      } else {
        completionMessage.textContent = `좋아요. ${CHECK_IDS.length - completed}개 항목이 남아 있어요. 서두르지 않아도 괜찮습니다.`;
      }
    }
  }

  function showPanel(viewName, moveFocus = true) {
    let activePanel = null;

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === viewName;
      panel.hidden = !isActive;
      if (isActive) activePanel = panel;
    });

    navButtons.forEach((button) => {
      if (button.dataset.view === viewName) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (moveFocus && activePanel) {
      const heading = activePanel.querySelector("h1");
      if (heading) heading.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.view));
  });

  CHECK_IDS.forEach((id) => {
    const button = document.querySelector(`[data-check-id="${id}"]`);
    if (!button) return;
    button.addEventListener("click", () => {
      checks[id] = !checks[id];
      saveChecks();
      renderChecks();
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const hasChecks = CHECK_IDS.some((id) => checks[id]);
      if (!hasChecks) return;
      if (!window.confirm("이 브라우저에 저장된 완료 표시를 모두 지울까요?")) return;
      checks = emptyChecks();
      saveChecks();
      renderChecks();
    });
  }

  function renderSignalResult() {
    if (!signalResult) return;
    const selectedCount = signalInputs.filter((input) => input.checked).length;

    if (selectedCount > 0) {
      signalResult.className = "result-box result-box--warning";
      signalResult.textContent = "주의 신호가 선택되었어요. 링크·첨부파일을 열거나 답장·송금·인증번호 전달을 멈추고, 공식 앱이나 직접 확인한 공식 연락처로 확인하세요. 이것만으로 사기 여부를 확정할 수는 없습니다.";
    } else {
      signalResult.className = "result-box";
      signalResult.textContent = "선택된 위험 신호가 없더라도 안전하다는 뜻은 아니에요. 조금이라도 이상하거나 확신이 들지 않으면 링크를 누르지 말고 공식 경로로 확인하세요.";
    }
  }

  signalInputs.forEach((input) => input.addEventListener("change", renderSignalResult));

  function testBrowserStorage() {
    let storage = null;
    let roundTripSucceeded = false;
    let cleanupSucceeded = false;
    let randomPart = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        randomPart = window.crypto.randomUUID();
      }
    } catch {
      // Use the non-sensitive fallback identifier if the browser blocks randomUUID.
    }

    const key = `__ansim_hangeoreum_probe_${randomPart}`;
    const value = "temporary-check";

    try {
      storage = window.localStorage;
      storage.setItem(key, value);
      roundTripSucceeded = storage.getItem(key) === value;
    } catch {
      roundTripSucceeded = false;
    } finally {
      if (storage) {
        try {
          storage.removeItem(key);
          cleanupSucceeded = true;
        } catch {
          cleanupSucceeded = false;
        }
      }
    }

    if (!roundTripSucceeded) {
      return {
        level: "warning",
        title: "브라우저 저장 공간을 사용할 수 없어요",
        detail: "개인정보 보호 설정이나 브라우저 정책 때문에 완료 표시가 저장되지 않을 수 있습니다. 임시 점검 항목은 삭제를 시도했습니다."
      };
    }

    if (!cleanupSucceeded) {
      return {
        level: "warning",
        title: "임시 저장 항목을 지우지 못했어요",
        detail: "브라우저가 시험용 임시 항목 삭제를 허용하지 않았습니다. 브라우저 저장 공간을 직접 확인하고, 민감한 정보를 입력하지 마세요."
      };
    }

    return {
      level: "pass",
      title: "브라우저 저장 공간을 사용할 수 있어요",
      detail: "임시 값을 저장·확인한 뒤 삭제했습니다. 이 점검에는 계정이나 개인 정보를 사용하지 않았습니다."
    };
  }

  function collectExternalResources() {
    const hosts = new Map();
    let entries = [];

    try {
      entries = performance.getEntriesByType("resource");
    } catch {
      return { available: false, hosts: [] };
    }

    entries.forEach((entry) => {
      if (!entry || typeof entry.name !== "string") return;

      try {
        const resourceUrl = new URL(entry.name);
        if (resourceUrl.protocol !== "http:" && resourceUrl.protocol !== "https:") return;
        if (resourceUrl.origin === window.location.origin) return;
        hosts.set(resourceUrl.origin, resourceUrl.host);
      } catch {
        // Ignore entries the browser does not expose as parseable URLs.
      }
    });

    return { available: true, hosts: Array.from(hosts.values()) };
  }

  function makeAutoCheckItem(result) {
    const item = document.createElement("li");
    item.className = `auto-check-item auto-check-item--${result.level}`;

    const badge = document.createElement("span");
    badge.className = "auto-check-badge";
    badge.textContent = result.level === "pass" ? "확인됨" : result.level === "warning" ? "주의" : "안내";

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

  function runAutomaticChecks() {
    if (!autoCheckList) return;

    const results = [];
    const protocol = window.location.protocol;
    const hostname = window.location.hostname.toLowerCase();
    const isLocalHost = hostname === "localhost"
      || hostname.endsWith(".localhost")
      || hostname === "127.0.0.1"
      || hostname.startsWith("127.")
      || hostname === "[::1]"
      || hostname === "::1";

    if (protocol === "https:") {
      results.push({
        level: "pass",
        title: "이 페이지는 HTTPS로 열렸어요",
        detail: "브라우저와 서버 사이의 연결은 암호화됩니다. HTTPS만으로 사이트 운영자나 콘텐츠가 믿을 만하다고 확인되는 것은 아닙니다."
      });
    } else if (protocol === "http:" && isLocalHost) {
      results.push({
        level: "info",
        title: "로컬 개발 주소에서 열렸어요",
        detail: "localhost 같은 내 기기의 시험 주소입니다. 실제 서비스 공개 시에는 HTTPS를 설정해야 합니다."
      });
    } else if (protocol === "http:") {
      results.push({
        level: "warning",
        title: "이 페이지는 암호화되지 않은 HTTP로 열렸어요",
        detail: "민감한 정보를 입력하지 마세요. 실제 서비스로 공개할 때 HTTPS를 사용해야 합니다."
      });
    } else if (protocol === "file:") {
      results.push({
        level: "info",
        title: "파일을 기기에서 직접 열었어요",
        detail: "로컬 실행에서는 공개 웹서비스의 연결 보안을 확인할 수 없습니다. 웹에 배포할 때 HTTPS가 설정되어 있는지 확인하세요."
      });
    } else {
      results.push({
        level: "info",
        title: "웹 연결 방식을 확인하기 어려워요",
        detail: `현재 연결 방식은 ${protocol || "알 수 없음"}입니다. 이 항목은 웹서비스의 HTTPS 상태를 판정할 수 없습니다.`
      });
    }

    results.push(testBrowserStorage());

    const externalResources = collectExternalResources();
    if (!externalResources.available) {
      results.push({
        level: "info",
        title: "외부 리소스 목록을 읽을 수 없어요",
        detail: "브라우저가 페이지 리소스 기록을 제공하지 않아 외부 연결을 확인하지 못했습니다. 확인할 수 없다는 뜻이지 외부 연결이 없다는 뜻은 아닙니다."
      });
    } else if (externalResources.hosts.length === 0) {
      results.push({
        level: "pass",
        title: "브라우저가 보고한 외부 리소스가 없어요",
        detail: "현재 브라우저에 노출된 페이지 기록 기준입니다. 브라우저 정책에 따라 일부 항목이 숨겨질 수 있습니다."
      });
    } else {
      const visibleHosts = externalResources.hosts.slice(0, 5);
      const hostSummary = visibleHosts.join(", ")
        + (externalResources.hosts.length > visibleHosts.length ? ` 외 ${externalResources.hosts.length - visibleHosts.length}곳` : "");
      results.push({
        level: "info",
        title: `브라우저가 외부 리소스 호스트 ${externalResources.hosts.length}곳을 보고했어요`,
        detail: `${hostSummary}. 해당 호스트는 요청 시 접속 정보를 받을 수 있습니다. 브라우저가 노출한 기록만 확인했으며, 외부 호스트가 있다는 사실만으로 위험한 것은 아닙니다.`
      });
    }

    const fragment = document.createDocumentFragment();
    results.forEach((result) => fragment.appendChild(makeAutoCheckItem(result)));
    autoCheckList.replaceChildren(fragment);

    if (autoCheckTime) {
      const time = new Intl.DateTimeFormat("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date());
      autoCheckTime.textContent = `브라우저 안에서 확인 완료: ${time}. 이 결과는 서버로 전송되거나 저장되지 않습니다.`;
    }
  }

  function isIpAddress(hostname) {
    const host = hostname.toLowerCase();
    return (host.startsWith("[") && host.endsWith("]"))
      || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  }

  function isLoopbackHost(hostname) {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return host === "localhost"
      || host.endsWith(".localhost")
      || host === "::1"
      || host.startsWith("127.");
  }

  function isKnownShortener(hostname) {
    const host = hostname.toLowerCase();
    return SHORTENER_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  }

  function showLinkAnalysisError(message) {
    if (!linkAnalysisResult) return;
    linkAnalysisResult.className = "result-box link-result link-result--error";
    linkAnalysisResult.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = "주소를 분석할 수 없어요.";
    const detail = document.createElement("p");
    detail.textContent = message;
    linkAnalysisResult.append(title, detail);
  }

  function showLinkAnalysis(url, findings, warningCount) {
    if (!linkAnalysisResult) return;
    linkAnalysisResult.className = warningCount > 0
      ? "result-box result-box--warning link-result"
      : "result-box result-box--info link-result";
    linkAnalysisResult.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = warningCount > 0
      ? `추가로 확인할 신호가 ${warningCount}개 있어요.`
      : "확인한 형식 규칙에서 추가 신호를 찾지 못했어요.";

    const summary = document.createElement("p");
    summary.textContent = `분석 대상 호스트: ${url.host}. 입력한 주소의 경로와 추가 정보는 결과에 표시하지 않습니다.`;

    const list = document.createElement("ul");
    list.className = "link-findings";

    findings.forEach((finding) => {
      const item = document.createElement("li");
      const findingTitle = document.createElement("strong");
      findingTitle.textContent = finding.title;
      const findingDetail = document.createElement("span");
      findingDetail.textContent = finding.detail;
      item.append(findingTitle, findingDetail);
      list.appendChild(item);
    });

    const limitation = document.createElement("p");
    limitation.textContent = "주소를 열거나 외부 평판 서비스를 조회하지 않았습니다. 이 규칙은 일부 신호만 살피며 안전을 보장하거나 사기를 확정하지 않습니다.";

    linkAnalysisResult.append(title, summary, list, limitation);
  }

  function analyzeLink(rawValue) {
    const raw = rawValue.trim();
    if (!raw) {
      showLinkAnalysisError("공유해도 괜찮은 웹 주소를 입력하세요. 비밀번호 재설정·결제·초대 링크는 입력하지 마세요.");
      return;
    }

    if (raw.length > 2048) {
      showLinkAnalysisError("주소가 너무 깁니다. 개인용 정보가 포함된 링크일 수 있으니 붙여넣지 마세요.");
      return;
    }

    if (/[\u0000-\u001f\u007f]/.test(raw)) {
      showLinkAnalysisError("주소에 보이지 않는 제어 문자가 포함되어 있어 분석하지 않았습니다.");
      return;
    }

    let candidate = raw;
    if (!/^[a-z][a-z\d+.-]*:/i.test(candidate)) {
      candidate = candidate.startsWith("//") ? `https:${candidate}` : `https://${candidate}`;
    }

    let url;
    try {
      url = new URL(candidate);
    } catch {
      showLinkAnalysisError("주소 형식을 읽을 수 없습니다. 예를 들어 https://example.com처럼 입력하세요.");
      return;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      showLinkAnalysisError("웹 주소(HTTP 또는 HTTPS)만 분석할 수 있습니다. 다른 종류의 주소는 열거나 실행하지 않습니다.");
      return;
    }

    if (!url.hostname) {
      showLinkAnalysisError("주소에서 사이트 호스트를 찾을 수 없습니다. 웹 주소를 다시 확인하세요.");
      return;
    }

    const findings = [];
    let warningCount = 0;

    if (url.protocol === "https:") {
      findings.push({
        title: "HTTPS 연결을 사용합니다",
        detail: "전송 중 연결을 암호화하는 방식입니다. 사이트가 정당한지 또는 안전한 콘텐츠를 제공하는지는 증명하지 않습니다."
      });
    } else if (isLoopbackHost(url.hostname)) {
      findings.push({
        title: "HTTP 로컬 주소입니다",
        detail: "내 기기에서 실행되는 시험 주소일 수 있습니다. 실제 공개 사이트에서는 HTTPS 사용 여부를 확인하세요."
      });
    } else {
      warningCount += 1;
      findings.push({
        title: "암호화되지 않은 HTTP 주소입니다",
        detail: "연결 내용이 보호되지 않을 수 있으므로 로그인·결제·개인정보 입력을 피하고 공식 경로로 확인하세요."
      });
    }

    if (url.username || url.password) {
      warningCount += 1;
      findings.push({
        title: "주소에 사용자 정보가 포함되어 있습니다",
        detail: "주소가 로그인 정보처럼 보이는 부분을 포함합니다. 공유하지 말고, 입력한 주소 자체도 다른 사람에게 보내지 마세요."
      });
    }

    if (isIpAddress(url.hostname)) {
      warningCount += 1;
      findings.push({
        title: "도메인 이름 대신 IP 주소를 사용합니다",
        detail: "IP 주소만으로는 운영자를 확인할 수 없습니다. 예상하지 못한 주소라면 열지 말고 공식 경로로 확인하세요."
      });
    }

    if (url.hostname.toLowerCase().split(".").some((label) => label.startsWith("xn--"))) {
      warningCount += 1;
      findings.push({
        title: "다국어 도메인의 변환 표기가 있습니다",
        detail: "이 표기만으로 악성 여부를 판단할 수는 없지만, 비슷하게 보이는 다른 문자를 이용한 주소일 수 있으니 도메인을 주의 깊게 확인하세요."
      });
    }

    if (isKnownShortener(url.hostname)) {
      warningCount += 1;
      findings.push({
        title: "알려진 링크 단축 도메인 형식입니다",
        detail: "최종 이동 주소를 이 도구에서 확인하지 않습니다. 보낸 사람과 목적을 별도로 확인하고 예상하지 못한 링크는 열지 마세요."
      });
    }

    if (url.port) {
      warningCount += 1;
      findings.push({
        title: `기본값이 아닌 포트 ${url.port}를 사용합니다`,
        detail: "이 포트가 필요한 주소인지 알고 있는 공식 경로에서 확인하세요. 포트 번호만으로 위험 여부를 확정할 수는 없습니다."
      });
    }

    showLinkAnalysis(url, findings, warningCount);
  }

  if (runAutoChecksButton) {
    runAutoChecksButton.addEventListener("click", runAutomaticChecks);
  }

  // Analyze after the user stops typing; do not open or transmit the URL.
  let linkAnalysisTimer = null;
  let isComposingLink = false;

  function clearLinkAnalysis() {
    if (!linkAnalysisResult) return;
    linkAnalysisResult.className = "result-box link-result";
    linkAnalysisResult.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = "아직 분석하지 않았어요.";
    const detail = document.createElement("p");
    detail.textContent = "공유 가능한 웹 주소를 입력하면 잠시 후 이 기기에서 자동으로 분석합니다.";
    linkAnalysisResult.append(title, detail);
  }

  function scheduleLinkAnalysis() {
    window.clearTimeout(linkAnalysisTimer);
    if (!linkInput) return;
    if (!linkInput.value.trim()) {
      clearLinkAnalysis();
      return;
    }
    linkAnalysisTimer = window.setTimeout(() => {
      if (!isComposingLink) analyzeLink(linkInput.value);
    }, 650);
  }

  if (linkInput) {
    linkInput.addEventListener("input", () => {
      if (!isComposingLink) scheduleLinkAnalysis();
    });
    linkInput.addEventListener("compositionstart", () => {
      isComposingLink = true;
      window.clearTimeout(linkAnalysisTimer);
    });
    linkInput.addEventListener("compositionend", () => {
      isComposingLink = false;
      scheduleLinkAnalysis();
    });
    // Pasted URLs trigger the input event too; no separate clipboard permission needed.
  }

  if (linkCheckForm) {
    linkCheckForm.addEventListener("submit", (event) => {
      event.preventDefault();
      window.clearTimeout(linkAnalysisTimer);
      analyzeLink(linkInput ? linkInput.value : "");
    });
  }

  if (clearLinkCheckButton) {
    clearLinkCheckButton.addEventListener("click", () => {
      if (linkInput) {
        linkInput.value = "";
        linkInput.focus();
      }
      window.clearTimeout(linkAnalysisTimer);
      clearLinkAnalysis();
    });
  }

  signalInputs.forEach((input) => input.addEventListener("change", renderSignalResult));

  updateStorageMessage();
  renderChecks();
  runAutomaticChecks();
})();