function normalizeDueDate(input) {
  if (!input) return "";

  const v = input.trim();

  // MM/DD
  if (/^\d{2}\/\d{2}$/.test(v)) {
    return v;
  }

  // MMDD → MM/DD
  if (/^\d{4}$/.test(v)) {
    const mm = v.slice(0, 2);
    const dd = v.slice(2, 4);
    return `${mm}/${dd}`;
  }

  // MM-DD → MM/DD
  if (/^\d{2}-\d{2}$/.test(v)) {
    return v.replace("-", "/");
  }

  throw "date";
}

function validate(task) {
  const p = Number(task.progress);

  // 진행도 필수 + 범위 체크
  if (!Number.isInteger(p) || p < 1 || p > 100) {
    throw "progress";
  }

  // 🔴 진행도 100 미만이면 완료예정일 필수
  if (p < 100) {
    if (!task.dueDate || !task.dueDate.trim()) {
      throw "date_required";
    }

    // 형식 정규화 + 검증
    task.dueDate = normalizeDueDate(task.dueDate);
  }
}


function convertTasks() {
  let daily = { progress: [], tomorrow: [], package: [], exclusive: [] };
  let md = [];
  let mdByClient = {};

  tasks.forEach(task => {
    validate(task);
    
    const client = (task.client || "").trim() || (task.completeType == 'PACKAGE' ? "패키지" : (task.completeType === "EXCLUSIVE" ? "입력필요" : "ERP금융서비스"));
    const p = Number(task.progress);

    if (p < 100) {
      if(task.completeType == 'PACKAGE') {
        daily.progress.push(
          `-(개발) ${task.menu}(${task.dueDate}) : ${task.content}(${p}%)`
        );
        daily.tomorrow.push(
          `-(개발) ${task.menu}(${task.dueDate}) : ${task.content}`
        );
      }else {
        daily.progress.push(
          `-(개발) ${task.menu}(${task.dueDate}) : ${task.content}(${p}%) - ${client}`
        );
        daily.tomorrow.push(
          `-(개발) ${task.menu}(${task.dueDate}) : ${task.content} - ${client}`
        );
      }
    } else {
      let line = '';
      if(task.completeType == 'PACKAGE') {
        line = `-(개발) ${task.menu} : ${task.content} 완료`;
      }else {
        line = `-(개발) ${task.menu} : ${task.content} 완료 - ${client}`;
      }

      // ✅ 진행도 100%일 때는 완료구분(패키지/전용) 선택값으로 분류
      if (task.completeType === "PACKAGE" || task.completeType === "ERP") {
        daily.package.push(line);
      } else if (task.completeType === "EXCLUSIVE") {
        daily.exclusive.push(line);
      } else {
        // 미선택 시 기본은 전용
        daily.exclusive.push(line);
      }
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
        completeType: "",
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
        completeType: "",
        client: m2[3]
      });
    }
  });

  return parsed;
}
