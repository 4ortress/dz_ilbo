function renderTable() {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";

  tasks.forEach((task, idx) => {
    const tr = document.createElement("tr");
    const progressNum = Number(task.progress);
    const isComplete = progressNum === 100;

    task.completeType = "PACKAGE";
    // 진행도 100인데 완료구분이 없으면 기본값: PACKAGE
    // if (isComplete && !task.completeType) {
    //   task.completeType = "PACKAGE";
    // }

    tr.innerHTML = `
      <td>
        <input data-idx="${idx}" data-key="menu" value="${task.menu ?? ""}">
      </td>

      <td>
        <input data-idx="${idx}" data-key="dueDate" value="${task.dueDate ?? ""}">
      </td>

      <td>
        <input data-idx="${idx}" data-key="content" value="${task.content ?? ""}">
      </td>

      <td>
        <input data-idx="${idx}" data-key="progress" value="${task.progress ?? ""}">
      </td>

      <td>
        <select data-idx="${idx}" data-key="completeType">
          <option value="PACKAGE" ${task.completeType === "PACKAGE" ? "selected" : ""}>
            패키지
          </option>
          <option value="EXCLUSIVE" ${task.completeType === "EXCLUSIVE" ? "selected" : ""}>
            전용
          </option>
          <option value="ERP" ${task.completeType === "ERP" ? "selected" : ""}>ERP금융서비스</option>
        </select>
      </td>

      <td>
        <input data-idx="${idx}" data-key="client" value="${task.client ?? ""}">
      </td>

      <td>
        <button class="btn-mini" onclick="removeRow(${idx})">X</button>
      </td>
    `;
    // <select data-idx="${idx}" data-key="completeType" ${isComplete ? "" : "disabled"}></select>
    tbody.appendChild(tr);
  });
}

function removeRow(idx) {
  tasks.splice(idx, 1);
  renderTable();
}
