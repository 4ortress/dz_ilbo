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
const toast = document.getElementById("toast");

const COMPLETE_TYPES = ["패키지", "전용", "기능통화"];

function createTaskRow(defaults = {}) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="text" class="menuName" placeholder="메뉴명" value="${escapeAttr(defaults.menuName || "")}" /></td>
    <td><input type="text" class="dueDate" placeholder="MM/DD" value="${escapeAttr(defaults.dueDate || "")}" /></td>
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
    return `- (개발) ${row.menuName}${dueDatePart} : ${row.content} 완료${customerPart}`;
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
    inProgressLines,
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

function buildMdGroups({ inProgressLines, packageCompleteLines, functionCurrencyCompleteLines, customRows }) {
  const groups = [];

  const packageMdLines = [
    ...inProgressLines,
    ...packageCompleteLines,
    ...functionCurrencyCompleteLines
  ];

  groups.push({
    name: "패키지",
    lines: packageMdLines
  });

  const customerMap = new Map();

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

restoreTheme();
resetPage();
