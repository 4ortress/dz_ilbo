let tasks = [];

function createEmptyTask() {
  return {
    menu: "",
    dueDate: "",
    content: "",
    progress: "",
    completeType: "", // PACKAGE | EXCLUSIVE (progress=100일 때만 사용)
    client: ""
  };
}
