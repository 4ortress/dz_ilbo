function validate(task) {
  if (!/^\d{2}\/\d{2}$/.test(task.dueDate)) throw "date";
  const p = Number(task.progress);
  if (!Number.isInteger(p) || p < 1 || p > 100) throw "progress";
}

function convertTasks() {
  let daily = { progress: [], tomorrow: [], package: [], exclusive: [] };
  let md = [];
  let mdByClient = {};

  tasks.forEach(task => {
    validate(task);

    const client = task.client.trim() || "패키지";
    const p = Number(task.progress);

    if (p < 100) {
      daily.progress.push(`-(개발) ${task.menu}(${task.dueDate}) : ${task.content}(${p}%) - ${client}`);
      daily.tomorrow.push(`-(개발) ${task.menu}(${task.dueDate}) : ${task.content} - ${client}`);
    } else {
      const line = `-(개발) ${task.menu} : ${task.content} 완료 - ${client}`;
      client.includes("패키지") ? daily.package.push(line) : daily.exclusive.push(line);
    }

    const mdLine = `[${task.menu} : ${task.content}(${p}%)]_[${client}]_[강촌]`;
    md.push(mdLine);

    if (!mdByClient[client]) mdByClient[client] = [];
    mdByClient[client].push(mdLine);
  });

  return { daily, md, mdByClient };
}
