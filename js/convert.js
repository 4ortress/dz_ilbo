function validate(task) {
  if (!/^\d{2}\/\d{2}$/.test(task.dueDate)) {
    alert("완료 예정일은 MM/DD 형식입니다.");
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

    // 일일 업무
    if (p >= 1 && p <= 99) {
      daily.progress.push(
        `-(개발) ${task.menu}(${task.dueDate}) : ${task.content}(${p}%) - [${client}]`
      );
      daily.tomorrow.push(
        `-(개발) ${task.menu}(${task.dueDate}) : ${task.content} - [${client}]`
      );
    } else {
      const target = client.includes("패키지") ? daily.package : daily.exclusive;
      target.push(
        `-(개발) ${task.menu}(${task.dueDate}) : ${task.content} 완료`
      );
    }

    // MD
    md.push(
      `[${task.menu} : ${task.content}(${p}%)]_${client}_강촌`
    );
  });

  return { daily, md };
}
