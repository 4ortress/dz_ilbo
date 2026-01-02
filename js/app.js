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
  if (!text) { showSnack("복사할 내용이 없습니다"); return; }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showSnack("복사되었습니다"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showSnack("복사되었습니다");
  }
}

function buildDailyText(d) {
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
  // setVersion(); // 필요 시 사용
  resetPage();

  // 테마 토글
  themeToggle.onclick = () => {
    const now = document.body.getAttribute("data-theme");
    document.body.setAttribute("data-theme", now === "dark" ? "light" : "dark");
  };

  addRow.onclick = () => {
    tasks.push(createEmptyTask());
    renderTable();
  };

  reset.onclick = resetPage;

  convert.onclick = () => {
    try {
      const { daily, md, mdByClient } = convertTasks();

      dailyReport.textContent = buildDailyText(daily);
      mdReport.textContent = md.join("\n");

      // MD 고객사별 복사 버튼
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

  function handleChange(e) {
    const { idx, key } = e.target.dataset;
    if (idx === undefined || !key) return;

    const prevValue = tasks[idx][key];
    const newValue = e.target.value;

    tasks[idx][key] = newValue;

    // ✅ 진행도 입력 처리 (커서 유지 핵심 로직)
    if (key === "progress") {
      const prevNum = Number(prevValue);
      const newNum = Number(newValue);

      // 진행도 100 → 100 아님 (완료구분 비활성화 필요)
      if (prevNum === 100 && newNum !== 100) {
        tasks[idx].completeType = "";
        renderTable();
        return;
      }

      // 진행도 100 아님 → 100 (완료구분 활성화 필요)
      if (prevNum !== 100 && newNum === 100) {
        renderTable();
        return;
      }

      // ❗ 그 외 (1 → 10 → 100 도중 단계 등)는 렌더링 안 함
    }
  }


  document.addEventListener("input", handleChange);
  document.addEventListener("change", handleChange);

  // 전일보고 모달
  const prevReportBtn = document.getElementById("prevReport");
  const prevModal = document.getElementById("prevModal");
  const prevInput = document.getElementById("prevInput");
  const applyPrev = document.getElementById("applyPrev");
  const closePrev = document.getElementById("closePrev");

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

    tasks = parsed;
    renderTable();

    prevModal.classList.remove("show");
    prevInput.value = "";
    showSnack("전일 보고가 적용되었습니다");
  };
});
