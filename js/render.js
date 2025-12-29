function renderTable() {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";

  tasks.forEach((task, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input data-idx="${idx}" data-key="menu" value="${task.menu}"></td>
      <td><input data-idx="${idx}" data-key="dueDate" value="${task.dueDate}"></td>
      <td><input data-idx="${idx}" data-key="content" value="${task.content}"></td>
      <td><input data-idx="${idx}" data-key="progress" value="${task.progress}"></td>
      <td><input data-idx="${idx}" data-key="client" value="${task.client}"></td>
      <td><button class="btn-mini" onclick="removeRow(${idx})">X</button></td>
    `;

    tbody.appendChild(tr);
  });
}

function removeRow(idx) {
  tasks.splice(idx, 1);
  renderTable();
}
