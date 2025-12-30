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

function parseDailyReportToTasks(text) {
  const lines = text.split("\n");
  const parsed = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line.startsWith("-(개발)")) return;

    // 진행중: 메뉴(12/29) : 내용(60%) - 고객사
    let m1 = line.match(/-\(개발\)\s(.+?)\((\d{2}\/\d{2})\)\s:\s(.+?)\((\d+)%\)\s-\s(.+)/);

    if (m1) {
      parsed.push({
        menu: m1[1],
        dueDate: m1[2],
        content: m1[3],
        progress: m1[4],
        client: m1[5]
      });
      return;
    }

    // 완료: 메뉴 : 내용 완료 - 고객사
    let m2 = line.match(/-\(개발\)\s(.+?)\s:\s(.+?)\s완료\s-\s(.+)/);

    if (m2) {
      parsed.push({
        menu: m2[1],
        dueDate: "",        // 완료는 예정일 없음
        content: m2[2],
        progress: "100",
        client: m2[3]
      });
    }
  });

  return parsed;
}

