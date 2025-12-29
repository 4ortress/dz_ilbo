function validate(task) {
  if (!/^\d{2}\/\d{2}$/.test(task.dueDate)) {
    alert("완료 예정일은 MM/DD 형식입니다. 예) 12/29");
    return false;
  }

  const p = Number(task.progress);
  if (!Number.isInteger(p) || p < 1 || p > 100) {
    alert("진행도는 1~100 정수입니다.");
    return false;
  }
  return true;
}

function convertTasks() {
  let daily = {
    progress: [],
    tomorrow: [],
    package: [],
    exclusive: []
  };

  let md = [];

  tasks.forEach(task => {
    if (!validate(task)) throw new Error();

    const client = task.client?.trim() || "패키지";
    const p = Number(task.progress);

    // --- 일일 업무 보고 ---
    if (p >= 1 && p <= 99) {
      // 진행중: (진행도%) 유지, 고객사 대괄호 제거
      daily.progress.push(
        `-(개발) ${task.menu}(${task.dueDate}) : ${task.content}(${p}%) - ${client}`
      );

      // 익일: (진행도%) 제거, 고객사 대괄호 제거
      daily.tomorrow.push(
        `-(개발) ${task.menu}(${task.dueDate}) : ${task.content} - ${client}`
      );
    } else {
      // 진행완료(100): 완료예정일 제거 + " 완료"
      const line = `-(개발) ${task.menu} : ${task.content} 완료`;

      // 고객사가 '패키지' (공백 포함) 계열이면 패키지 메뉴로
      if (client.includes("패키지")) daily.package.push(line);
      else daily.exclusive.push(line);
    }

    // --- MD ---
    // 고객사와 강촌에 대괄호 추가
    md.push(`[${task.menu} : ${task.content}(${p}%)]_[${client}]_[강촌]`);
  });

  return { daily, md };
}
