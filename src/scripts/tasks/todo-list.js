class TodoList {
  static openTodoDb() {
    return idb.open('todoList', 1, upgradeDB => {
      switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('todoList', {keyPath: 'id'});
      }
    });
  }

  static addToTodo(formId, taskEditModalSelector) {
    const form = document.querySelector(formId);
    return TaskRepository.getTaskStatic(form.dataset.id)
      .then(task => {
        if (!task) return;
        return TodoList.openTodoDb()
          .then(db => {
            if (!db) return;
            return db
              .transaction('todoList', 'readwrite')
              .objectStore('todoList')
              .put(task);
          })
          .then(() => {
            TaskList.closeEdit(taskEditModalSelector);
          });
      });
  }

  static getTodos() {
    return TodoList.openTodoDb().then(db => {
      if (!db) return;
      return db
        .transaction('todoList', 'readwrite')
        .objectStore('todoList')
        .getAll();
    });
  }

  static deleteTodo(taskId) {
    return TodoList.openTodoDb().then(db => {
      if (!db) return;
      return db
        .transaction('todoList', 'readwrite')
        .objectStore('todoList')
        .delete(taskId);
    });
  }

  static renderTodo(todos, todoContainer, priorityEnum) {
    const todoHTML = todos.reduce((acc, todo) => {
      return acc + `
      <div class="todo container">
        <div class="input-group">
          <label>
            <input type="checkbox" id='task${todo.id}' data-id="${todo.id}" onclick="CompletedTasks.addCompleted('${todo.id}')"/ >
            <span>${todo.description}</span>
          </label>
        </div>
        <div class="todo-footer">
          <span>Priority: ${priorityEnum[todo.priority]}</span>
          <span class="align-right">Estimate: ${todo.time}</span>
        </div>
      </div>
    `;
    }, '');

    const todoCont = document.querySelector(todoContainer);
    todoCont.insertAdjacentHTML('beforeend', todoHTML);
  }
}