function renderTable() {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";

  tasks.forEach((task, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input value="${task.menu}" data-key="menu" data-idx="${index}"></td>
      <td><input value="${task.dueDate}" data-key="dueDate" data-idx="${index}"></td>
      <td><input value="${task.content}" data-key="content" data-idx="${index}"></td>
      <td><input value="${task.progress}" data-key="progress" data-idx="${index}"></td>
      <td><input value="${task.client}" data-key="client" data-idx="${index}"></td>
      <td><button onclick="removeRow(${index})">X</button></td>
    `;

    tbody.appendChild(tr);
  });
}

function removeRow(index) {
  tasks.splice(index, 1);
  renderTable();
}
