function pad2(n){ return String(n).padStart(2,"0"); }

function setVersion() {
  const d = new Date();
  document.getElementById("versionText").textContent =
    `1.0.${String(d.getFullYear()).slice(-2)}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-01`;
}

function showSnack(msg) {
  const bar = document.getElementById("snackbar");
  bar.textContent = msg;
  bar.className = "show";
  setTimeout(() => bar.className = "", 2000);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showSnack("복사되었습니다"));
}

function buildDaily(d) {
  return `1. 진행중인 업무
${d.progress.join("\n")}

2. 진행완료 업무(핌스 기준)
■ 패키지 메뉴
${d.package.join("\n")}

■ 전용 메뉴
${d.exclusive.join("\n")}

3. 익일 업무
${d.tomorrow.join("\n")}`;
}

function resetPage() {
  tasks = [createEmptyTask()];
  renderTable();
  dailyReport.textContent = "";
  mdReport.textContent = "";
  mdCopyButtons.innerHTML = "";
}

document.addEventListener("DOMContentLoaded", () => {
  setVersion();
  resetPage();

  // theme
  const saved = localStorage.getItem("theme") || "dark";
  document.body.dataset.theme = saved;

  themeToggle.onclick = () => {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  addRow.onclick = () => { tasks.push(createEmptyTask()); renderTable(); };
  reset.onclick = resetPage;

  convert.onclick = () => {
    try {
      const { daily, md, mdByClient } = convertTasks();
      dailyReport.textContent = buildDaily(daily);
      mdReport.textContent = md.join("\n");

      mdCopyButtons.innerHTML = "";
      Object.keys(mdByClient).forEach(c => {
        const b = document.createElement("button");
        b.className = "btn-mini";
        b.textContent = c;
        b.onclick = () => copyText(mdByClient[c].join("\n"));
        mdCopyButtons.appendChild(b);
      });
    } catch {
      showSnack("입력값을 확인해 주세요");
    }
  };

  copyDaily.onclick = () => copyText(dailyReport.textContent);

  document.addEventListener("input", e => {
    const { idx, key } = e.target.dataset;
    if (idx !== undefined) tasks[idx][key] = e.target.value;
  });
});
