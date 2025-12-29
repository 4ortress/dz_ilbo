document.getElementById("addRow").addEventListener("click", () => {
  tasks.push(createEmptyTask());
  renderTable();
});

document.getElementById("convert").addEventListener("click", () => {
  try {
    const { daily, md } = convertTasks();

    document.getElementById("dailyReport").value =
`1. 진행중인 업무
${daily.progress.join("\n")}

2. 진행완료 업무(핌스 기준)
■ 패키지 메뉴
${daily.package.join("\n")}
■ 전용 메뉴
${daily.exclusive.join("\n")}

3. 익일 업무
${daily.tomorrow.join("\n")}`;

    document.getElementById("mdReport").value = md.join("\n");
  } catch (e) {
    // validation 실패
  }
});

document.addEventListener("input", e => {
  const idx = e.target.dataset.idx;
  const key = e.target.dataset.key;
  if (idx !== undefined) {
    tasks[idx][key] = e.target.value;
  }
});
