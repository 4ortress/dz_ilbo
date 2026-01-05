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

// ===== save slots (localStorage) =====
const PRESET_KEY = "task_presets_v1";

function readPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY)) || {};
  } catch {
    return {};
  }
}

function writePresets(obj) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(obj || {}));
}

function formatSavedAt(ts) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function renderSaveSlots() {
  const list = document.getElementById("saveList");
  const presets = readPresets();

  list.innerHTML = "";

  const titles = Object.keys(presets)
    .sort((a, b) => (presets[b].savedAt || 0) - (presets[a].savedAt || 0));

  if (!titles.length) {
    list.innerHTML = `<div class="save-meta">저장된 작업이 없습니다.</div>`;
    return;
  }

  titles.forEach(title => {
    const slot = document.createElement("div");
    slot.className = "save-slot";

    slot.innerHTML = `
      <div class="save-info">
        <div class="save-title">${title}</div>
        <div class="save-meta">
          ${formatSavedAt(presets[title].savedAt)} · ${presets[title].tasks.length}건
        </div>
      </div>
      <div class="save-actions">
        <button class="btn-mini load">불러오기</button>
        <button class="btn-mini overwrite">덮어쓰기</button>
        <button class="btn-mini btn-ghost delete">삭제</button>
      </div>
    `;

    slot.querySelector(".load").onclick = () => {
      tasks = presets[title].tasks;
      if (!tasks.length) tasks = [createEmptyTask()];
      renderTable();
      showSnack("불러왔습니다");
      presetModal.classList.remove("show");
    };

    slot.querySelector(".overwrite").onclick = () => {
      presets[title] = {
        savedAt: Date.now(),
        tasks: JSON.parse(JSON.stringify(tasks))
      };
      writePresets(presets);
      renderSaveSlots();
      showSnack("덮어쓰기 완료");
    };

    slot.querySelector(".delete").onclick = () => {
      if (!confirm(`'${title}' 저장 데이터를 삭제할까요?`)) return;
      delete presets[title];
      writePresets(presets);
      renderSaveSlots();
      showSnack("삭제되었습니다");
    };

    list.appendChild(slot);
  });
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

  const presetOpen = document.getElementById("presetOpen");
const presetModal = document.getElementById("presetModal");
const presetClose = document.getElementById("presetClose");
const presetTitle = document.getElementById("presetTitle");
const presetSaveNew = document.getElementById("presetSaveNew");

presetOpen.onclick = () => {
  renderSaveSlots();
  presetTitle.value = "";
  presetModal.classList.add("show");
};

presetClose.onclick = () => {
  presetModal.classList.remove("show");
};

presetModal.addEventListener("click", (e) => {
  if (e.target === presetModal) presetModal.classList.remove("show");
});

presetSaveNew.onclick = () => {
  const title = presetTitle.value.trim();
  if (!title) return showSnack("제목을 입력해 주세요");

  const presets = readPresets();
  if (presets[title]) return showSnack("이미 존재하는 제목입니다");

  presets[title] = {
    savedAt: Date.now(),
    tasks: JSON.parse(JSON.stringify(tasks))
  };

  writePresets(presets);
  renderSaveSlots();
  presetTitle.value = "";
  showSnack("저장되었습니다");
};


});
