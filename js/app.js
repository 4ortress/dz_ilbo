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
  // setVersion();
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


  const prevReportBtn = document.getElementById("prevReport");
  const prevModal = document.getElementById("prevModal");
  const prevInput = document.getElementById("prevInput");
  const applyPrev = document.getElementById("applyPrev");
  const closePrev = document.getElementById("closePrev");

  // 버튼/모달이 없으면 조용히 리턴 (파일 누락 방지)
  if (!prevReportBtn || !prevModal || !prevInput || !applyPrev || !closePrev) {
    console.warn("[전일보고] modal elements not found. Check index.html ids.");
    return;
  }

  prevReportBtn.onclick = () => {
    prevModal.classList.add("show");
    prevInput.focus();
  };

  closePrev.onclick = () => {
    prevModal.classList.remove("show");
  };

  // 모달 바깥 클릭 시 닫기(선택 사항인데 UX 좋아서 기본으로 넣음)
  prevModal.addEventListener("click", (e) => {
    if (e.target === prevModal) prevModal.classList.remove("show");
  });

  applyPrev.onclick = () => {
    const text = prevInput.value.trim();
    if (!text) {
      showSnack("입력된 내용이 없습니다");
      return;
    }

    const parsed = parseDailyReportToTasks(text);

    if (!parsed || parsed.length === 0) {
      showSnack("변환 가능한 항목이 없습니다");
      return;
    }

    // ✅ 기존 내용 덮어쓰기(요구사항: 바인딩)
    tasks = parsed;
    renderTable();

    prevModal.classList.remove("show");
    prevInput.value = "";
    showSnack("전일 보고가 적용되었습니다");
  };
});
