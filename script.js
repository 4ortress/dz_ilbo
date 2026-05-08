const taskTbody = document.getElementById("taskTbody");
const nsmCountInput = document.getElementById("nsmCount");
const majorTaskInput = document.getElementById("majorTask");
const dailyOutput = document.getElementById("dailyOutput");
const mdOutput = document.getElementById("mdOutput");
const mdButtonArea = document.getElementById("mdButtonArea");

const addRowBtn = document.getElementById("addRowBtn");
const convertBtn = document.getElementById("convertBtn");
const resetBtn = document.getElementById("resetBtn");
const copyDailyBtn = document.getElementById("copyDailyBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const saveLoadBtn = document.getElementById("saveLoadBtn");
const previousReportBtn = document.getElementById("previousReportBtn");

const modalOverlay = document.getElementById("modalOverlay");
const saveLoadModal = document.getElementById("saveLoadModal");
const previousReportModal = document.getElementById("previousReportModal");
const saveTitleInput = document.getElementById("saveTitleInput");
const saveCurrentBtn = document.getElementById("saveCurrentBtn");
const savedList = document.getElementById("savedList");
const previousReportText = document.getElementById("previousReportText");
const applyPreviousReportBtn = document.getElementById("applyPreviousReportBtn");

const toast = document.getElementById("toast");

const COMPLETE_TYPES = ["패키지", "전용", "기능통화"];
const SAVE_COOKIE_NAME = "reportConverterSaves";
const SAVE_LOCAL_STORAGE_KEY = "reportConverterSavesFallback";

function createTaskRow(defaults = {}) {
  const tr = document.createElement("tr");
  const dueDate = Object.prototype.hasOwnProperty.call(defaults, "dueDate")
    ? defaults.dueDate
    : getTodayMmDd();

  tr.innerHTML = `
    <td><input type="text" class="menuName" placeholder="메뉴명" value="${escapeAttr(defaults.menuName || "")}" /></td>
    <td><input type="text" class="dueDate" placeholder="MM/DD" value="${escapeAttr(dueDate || "")}" /></td>
    <td><input type="text" class="content" placeholder="내용" value="${escapeAttr(defaults.content || "")}" /></td>
    <td><input type="number" class="progress" min="1" max="100" placeholder="1~100" value="${escapeAttr(defaults.progress || "")}" /></td>
    <td>
      <select class="completeType">
        ${COMPLETE_TYPES.map(type => `<option value="${type}" ${type === (defaults.completeType || "패키지") ? "selected" : ""}>${type}</option>`).join("")}
      </select>
    </td>
    <td><input type="text" class="customer" placeholder="전용인 경우 필수" value="${escapeAttr(defaults.customer || "")}" /></td>
    <td class="center"><button type="button" class="btn delete-btn">X</button></td>
  `;

  tr.querySelector(".delete-btn").addEventListener("click", () => {
    tr.remove();

    if (taskTbody.children.length === 0) {
      taskTbody.appendChild(createTaskRow());
    }
  });

  return tr;
}

function getTodayMmDd() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getRowsData() {
  return Array.from(taskTbody.querySelectorAll("tr")).map(tr => ({
    tr,
    menuName: tr.querySelector(".menuName").value.trim(),
    dueDate: tr.querySelector(".dueDate").value.trim(),
    content: tr.querySelector(".content").value.trim(),
    progressText: tr.querySelector(".progress").value.trim(),
    completeType: tr.querySelector(".completeType").value,
    customer: tr.querySelector(".customer").value.trim()
  }));
}

function setRowsData(rows) {
  taskTbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    taskTbody.appendChild(createTaskRow());
    return;
  }

  rows.forEach(row => {
    taskTbody.appendChild(createTaskRow({
      menuName: row.menuName || "",
      dueDate: Object.prototype.hasOwnProperty.call(row, "dueDate") ? row.dueDate : getTodayMmDd(),
      content: row.content || "",
      progress: row.progress || "",
      completeType: row.completeType || "패키지",
      customer: row.customer || ""
    }));
  });
}

function clearInvalidState() {
  document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
}

function validateRows(rows) {
  const errors = [];

  rows.forEach((row, index) => {
    const rowNo = index + 1;
    const progress = Number(row.progressText);

    if (!row.menuName) {
      errors.push(`${rowNo}행: 메뉴명은 필수입니다.`);
      row.tr.querySelector(".menuName").classList.add("invalid");
    }

    if (!row.content) {
      errors.push(`${rowNo}행: 내용은 필수입니다.`);
      row.tr.querySelector(".content").classList.add("invalid");
    }

    if (!row.progressText || !Number.isInteger(progress) || progress < 1 || progress > 100) {
      errors.push(`${rowNo}행: 진행도는 1~100 사이의 숫자로 입력해야 합니다.`);
      row.tr.querySelector(".progress").classList.add("invalid");
    }

    if (progress !== 100) {
      if (!row.dueDate || !isValidMmDd(row.dueDate)) {
        errors.push(`${rowNo}행: 진행도 100 미만은 완료예정일을 MM/DD 형식으로 입력해야 합니다.`);
        row.tr.querySelector(".dueDate").classList.add("invalid");
      }
    } else if (row.dueDate && !isValidMmDd(row.dueDate)) {
      errors.push(`${rowNo}행: 완료예정일을 입력한 경우 MM/DD 형식이어야 합니다.`);
      row.tr.querySelector(".dueDate").classList.add("invalid");
    }

    if (row.completeType === "전용" && !row.customer) {
      errors.push(`${rowNo}행: 완료구분이 전용인 경우 고객사는 필수입니다.`);
      row.tr.querySelector(".customer").classList.add("invalid");
    }

    row.progress = progress;
  });

  return errors;
}

function isValidMmDd(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = Number(match[1]);
  const day = Number(match[2]);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

function buildLine(row, mode) {
  const dueDatePart = row.dueDate ? `(${row.dueDate})` : "";
  const customerPart = row.customer ? ` - ${row.customer}` : "";

  if (mode === "progress") {
    return `- (개발) ${row.menuName}${dueDatePart} : ${row.content}(${row.progress}%)${customerPart}`;
  }

  if (mode === "complete") {
    return `- (개발) ${row.menuName} : ${row.content} 완료${customerPart}`;
  }

  if (mode === "tomorrow") {
    return `- (개발) ${row.menuName}${dueDatePart} : ${row.content}${customerPart}`;
  }

  return "";
}

function formatSectionLines(lines) {
  return lines.length > 0 ? lines.join("\n") : "- 없음";
}

function convertReport() {
  clearInvalidState();

  const rows = getRowsData();
  const errors = validateRows(rows);

  if (errors.length > 0) {
    dailyOutput.textContent = `입력값을 확인해주세요.\n\n${errors.join("\n")}`;
    mdOutput.textContent = "입력값을 확인해주세요.";
    mdButtonArea.innerHTML = "";
    return;
  }

  const inProgressRows = rows.filter(row => row.progress >= 1 && row.progress <= 99);
  const completeRows = rows.filter(row => row.progress === 100);

  const packageRows = completeRows.filter(row => row.completeType === "패키지");
  const customRows = completeRows.filter(row => row.completeType === "전용");
  const functionCurrencyRows = completeRows.filter(row => row.completeType === "기능통화");

  const inProgressLines = inProgressRows.map(row => buildLine(row, "progress"));
  const packageCompleteLines = packageRows.map(row => buildLine(row, "complete"));
  const customCompleteLines = customRows.map(row => buildLine(row, "complete"));
  const functionCurrencyCompleteLines = functionCurrencyRows.map(row => buildLine(row, "complete"));
  const tomorrowLines = inProgressRows.map(row => buildLine(row, "tomorrow"));

  const nsmCount = normalizeCount(nsmCountInput.value);
  const majorTask = majorTaskInput.value.trim();

  const report = [
    "1. 진행중인 업무",
    formatSectionLines(inProgressLines),
    "",
    "2. 진행완료 업무(핌스 기준)",
    "■ 패키지 메뉴",
    formatSectionLines(packageCompleteLines),
    "",
    "■ 전용 메뉴",
    formatSectionLines(customCompleteLines),
    "",
    "■ 기능통화 관련",
    formatSectionLines(functionCurrencyCompleteLines),
    "",
    "3. 익일 업무",
    formatSectionLines(tomorrowLines),
    "",
    `4. 미처리 NSM 건수 - ${nsmCount}건`,
    "",
    "5. 주요 업무 현황",
    majorTask ? `- ${majorTask}` : "- 없음"
  ].join("\n");

  dailyOutput.textContent = report;

  const mdGroups = buildMdGroups({
    inProgressRows,
    packageCompleteLines,
    functionCurrencyCompleteLines,
    customRows
  });

  renderMdArea(mdGroups);
}

function normalizeCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return "0";
  return String(Math.floor(number));
}

function buildMdGroups({ inProgressRows, packageCompleteLines, functionCurrencyCompleteLines, customRows }) {
  const groups = [];
  const customerMap = new Map();

  const packageMdLines = [
    ...inProgressRows
      .filter(row => row.completeType !== "전용")
      .map(row => buildLine(row, "progress")),
    ...packageCompleteLines,
    ...functionCurrencyCompleteLines
  ];

  groups.push({
    name: "패키지",
    lines: packageMdLines
  });

  inProgressRows
    .filter(row => row.completeType === "전용")
    .forEach(row => {
      const customerName = row.customer || "고객사 미입력";
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, []);
      }

      customerMap.get(customerName).push(buildLine(row, "progress"));
    });

  customRows.forEach(row => {
    const customerName = row.customer || "고객사 미입력";
    if (!customerMap.has(customerName)) {
      customerMap.set(customerName, []);
    }

    customerMap.get(customerName).push(buildLine(row, "complete"));
  });

  customerMap.forEach((lines, customerName) => {
    groups.push({
      name: customerName,
      lines
    });
  });

  return groups;
}

function renderMdArea(groups) {
  mdButtonArea.innerHTML = "";

  groups.forEach(group => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn small";
    button.textContent = group.name;
    button.addEventListener("click", () => {
      copyText(formatMdLines(group.lines));
    });
    mdButtonArea.appendChild(button);
  });

  mdOutput.textContent = formatAllMdGroups(groups);
}

function formatAllMdGroups(groups) {
  return groups
    .map(group => `[${group.name}]\n${formatMdLines(group.lines)}`)
    .join("\n\n");
}

function formatMdLines(lines) {
  return lines.length > 0 ? lines.join("\n") : "- 없음";
}

function resetPage() {
  nsmCountInput.value = "0";
  majorTaskInput.value = "";
  taskTbody.innerHTML = "";
  taskTbody.appendChild(createTaskRow());
  dailyOutput.textContent = "변환 버튼을 눌러주세요.";
  mdOutput.textContent = "변환 버튼을 눌러주세요.";
  mdButtonArea.innerHTML = "";
}

function openModal(modalElement) {
  closeModal();
  modalOverlay.classList.remove("hidden");
  modalElement.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  saveLoadModal.classList.add("hidden");
  previousReportModal.classList.add("hidden");
}

function openSaveLoadModal() {
  saveTitleInput.value = getDefaultSaveTitle();
  renderSavedList();
  openModal(saveLoadModal);
}

function openPreviousReportModal() {
  previousReportText.value = "";
  openModal(previousReportModal);
  setTimeout(() => previousReportText.focus(), 0);
}

function getDefaultSaveTitle() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd} 업무보고`;
}

function collectCurrentState() {
  return {
    nsmCount: nsmCountInput.value || "0",
    majorTask: majorTaskInput.value || "",
    rows: getRowsData().map(row => ({
      menuName: row.menuName,
      dueDate: row.dueDate,
      content: row.content,
      progress: row.progressText,
      completeType: row.completeType,
      customer: row.customer
    }))
  };
}

function applyState(state) {
  nsmCountInput.value = state.nsmCount ?? "0";
  majorTaskInput.value = state.majorTask ?? "";
  setRowsData(state.rows || []);
  dailyOutput.textContent = "변환 버튼을 눌러주세요.";
  mdOutput.textContent = "변환 버튼을 눌러주세요.";
  mdButtonArea.innerHTML = "";
}

function saveCurrentState() {
  const title = saveTitleInput.value.trim() || getDefaultSaveTitle();
  const saves = readSaves();
  const now = new Date();

  saves.unshift({
    id: `${now.getTime()}_${Math.random().toString(16).slice(2)}`,
    title,
    savedAt: formatDateTime(now),
    state: collectCurrentState()
  });

  writeSaves(saves);
  renderSavedList();
  saveTitleInput.value = getDefaultSaveTitle();
  showToastMessage("✅ 저장되었습니다");
}

function renderSavedList() {
  const saves = readSaves();
  savedList.innerHTML = "";

  if (saves.length === 0) {
    savedList.innerHTML = `<div class="empty-saved-list">저장된 내용이 없습니다.</div>`;
    return;
  }

  saves.forEach(save => {
    const item = document.createElement("div");
    item.className = "saved-item";
    item.innerHTML = `
      <div>
        <div class="saved-title">${escapeHtml(save.title || "제목 없음")}</div>
        <div class="saved-meta">${escapeHtml(save.savedAt || "")}</div>
      </div>
      <div class="saved-actions">
        <button type="button" class="btn small load-save-btn">불러오기</button>
        <button type="button" class="btn small delete-save-btn">삭제</button>
      </div>
    `;

    item.querySelector(".load-save-btn").addEventListener("click", () => {
      applyState(save.state || {});
      closeModal();
      showToastMessage("✅ 불러왔습니다");
    });

    item.querySelector(".delete-save-btn").addEventListener("click", () => {
      if (!confirm(`'${save.title || "제목 없음"}' 저장 내용을 삭제할까요?`)) return;
      const nextSaves = readSaves().filter(item => item.id !== save.id);
      writeSaves(nextSaves);
      renderSavedList();
      showToastMessage("삭제되었습니다");
    });

    savedList.appendChild(item);
  });
}

function readSaves() {
  const cookieValue = getCookie(SAVE_COOKIE_NAME);
  const fallbackValue = localStorage.getItem(SAVE_LOCAL_STORAGE_KEY);
  const raw = cookieValue || fallbackValue;

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeSaves(saves) {
  const json = JSON.stringify(saves);
  setCookie(SAVE_COOKIE_NAME, json, 365);
  localStorage.setItem(SAVE_LOCAL_STORAGE_KEY, json);
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map(item => item.trim())
    .find(item => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

function parsePreviousReport(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const rows = [];
  let section = "";
  let completeType = "패키지";
  let nsmCount = null;
  let majorLines = [];
  let readingMajor = false;

  lines.forEach(line => {
    if (/^1\.\s*진행중인 업무/.test(line)) {
      section = "progress";
      readingMajor = false;
      return;
    }

    if (/^2\.\s*진행완료 업무/.test(line)) {
      section = "complete";
      completeType = "패키지";
      readingMajor = false;
      return;
    }

    if (/^3\.\s*익일 업무/.test(line)) {
      section = "tomorrow";
      readingMajor = false;
      return;
    }

    if (/^4\.\s*미처리 NSM 건수/.test(line)) {
      section = "nsm";
      readingMajor = false;
      const match = line.match(/-\s*(\d+)\s*건/);
      if (match) nsmCount = match[1];
      return;
    }

    if (/^5\.\s*주요 업무 현황/.test(line)) {
      section = "major";
      readingMajor = true;
      return;
    }

    if (line.includes("패키지 메뉴")) {
      completeType = "패키지";
      return;
    }

    if (line.includes("전용 메뉴")) {
      completeType = "전용";
      return;
    }

    if (line.includes("기능통화 관련")) {
      completeType = "기능통화";
      return;
    }

    if (line === "- 없음") return;

    if (section === "progress" && line.startsWith("-")) {
      const row = parseTaskLine(line, "progress", "패키지");
      if (row) rows.push(row);
      return;
    }

    if (section === "complete" && line.startsWith("-")) {
      const row = parseTaskLine(line, "complete", completeType);
      if (row) rows.push(row);
      return;
    }

    if (section === "major" && line.startsWith("-")) {
      majorLines.push(line.replace(/^-\s*/, ""));
    }
  });

  return {
    nsmCount,
    majorTask: majorLines.join(" / "),
    rows
  };
}


function parseTaskLine(line, mode, completeType) {
  if (!line.startsWith("- (개발)")) return null;

  const withoutPrefix = line.replace(/^-\s*\(개발\)\s*/, "");
  const colonIndex = withoutPrefix.indexOf(" : ");
  if (colonIndex < 0) return null;

  const menuPart = withoutPrefix.slice(0, colonIndex).trim();
  let body = withoutPrefix.slice(colonIndex + 3).trim();

  const menuMatch = menuPart.match(/^(.*?)(?:\((\d{2}\/\d{2})\))?$/);
  const menuName = menuMatch ? menuMatch[1].trim() : menuPart;
  const dueDate = menuMatch && menuMatch[2] ? menuMatch[2] : "";

  let customer = "";
  const customerMatch = body.match(/\s-\s([^-]+)$/);
  if (customerMatch) {
    customer = customerMatch[1].trim();
    body = body.slice(0, customerMatch.index).trim();
  }

  if (mode === "progress") {
    const progressMatch = body.match(/\((\d{1,3})%\)$/);
    const progress = progressMatch ? progressMatch[1] : "";
    const content = progressMatch ? body.slice(0, progressMatch.index).trim() : body;

    return {
      menuName,
      dueDate: dueDate || getTodayMmDd(),
      content,
      progress,
      completeType: "패키지",
      customer
    };
  }

  if (mode === "complete") {
    let content = body;
    content = content.replace(/\s*완료$/, "").trim();

    return {
      menuName,
      dueDate,
      content,
      progress: "100",
      completeType,
      customer
    };
  }

  return null;
}

function applyPreviousReport() {
  const parsed = parsePreviousReport(previousReportText.value);

  if (!parsed.rows.length && parsed.nsmCount === null && !parsed.majorTask) {
    alert("매핑할 수 있는 내용이 없습니다. 일일 업무 보고 양식을 다시 확인해주세요.");
    return;
  }

  if (parsed.rows.length) {
    setRowsData(parsed.rows);
  }

  if (parsed.nsmCount !== null) {
    nsmCountInput.value = parsed.nsmCount;
  }

  if (parsed.majorTask) {
    majorTaskInput.value = parsed.majorTask;
  }

  dailyOutput.textContent = "변환 버튼을 눌러주세요.";
  mdOutput.textContent = "변환 버튼을 눌러주세요.";
  mdButtonArea.innerHTML = "";

  closeModal();
  showToastMessage("✅ 전일보고를 적용했습니다");
}

function formatDateTime(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(text) {
  if (!text || text === "변환 버튼을 눌러주세요.") return;

  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast();
  }
}

function showToast() {
  showToastMessage("✅ 복사되었습니다");
}

function showToastMessage(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("reportConverterTheme", document.body.classList.contains("light") ? "light" : "dark");
}

function restoreTheme() {
  const savedTheme = localStorage.getItem("reportConverterTheme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }
}

addRowBtn.addEventListener("click", () => {
  taskTbody.appendChild(createTaskRow());
});

convertBtn.addEventListener("click", convertReport);
resetBtn.addEventListener("click", resetPage);
copyDailyBtn.addEventListener("click", () => copyText(dailyOutput.textContent));
themeToggleBtn.addEventListener("click", toggleTheme);
saveLoadBtn.addEventListener("click", openSaveLoadModal);
previousReportBtn.addEventListener("click", openPreviousReportModal);
saveCurrentBtn.addEventListener("click", saveCurrentState);
applyPreviousReportBtn.addEventListener("click", applyPreviousReport);

document.querySelectorAll("[data-close-modal]").forEach(button => {
  button.addEventListener("click", closeModal);
});

modalOverlay.addEventListener("click", event => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
  }
});

restoreTheme();
resetPage();
