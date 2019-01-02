class TaskList {
  constructor(tasklist, taskEnum, taskRepo) {
    this.taskList = document.querySelector(tasklist);
    this.taskEnum = taskEnum;
    this.taskRepo = taskRepo;
  }

  editTask(taskId, taskEditModalSelector, formSelector) {
    const editModal = document.querySelector(taskEditModalSelector);
    const form = document.querySelector(formSelector);
    this.taskRepo.getTask(taskId).then(task => {
      form.taskDescModal.value = task.description;
      form.taskPriorityModal.value = task.priority;
      form.taskTimeModal.value = task.time;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const changedTask = {
          id: task.id,
          description: form.taskDescModal.value,
          priority: form.taskPriorityModal.value,
          time: form.taskTimeModal.value
        };
        this.taskRepo.storeTask(changedTask);
        TaskList.closeEdit(taskEditModalSelector);
        location.reload();
      });
    });
    editModal.removeAttribute('hidden');
  }

  static closeEdit(taskEditModalSelector) {
    const editModal = document.querySelector(taskEditModalSelector);
    editModal.setAttribute('hidden', 'true');
  }

  renderTask(task) {
    const taskHtml = `
      <div id="${task.id}" class="container task" onclick="taskList.editTask('${task.id}', '.task-edit-modal', '#editTask')">
        <p class="task-desc">${task.description}</p>
        <div class="taskFooter">
          <select id="priority${task.id}">
            <option value="${task.priority}">${this.taskEnum[task.priority]}</option>
            <option value="3"> Low </option>
            <option value="2"> Mid </option>
            <option value="1"> High </option>
          </select>
          <div class="task-time">Estimate: ${task.time}</div>
        </div>
      </div>
    `;
    this.taskList.insertAdjacentHTML('afterbegin', taskHtml);
  }

  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      return a.priority - b.priority;
    });
  }

  renderTasks(tasks) {
    const containerDiv = this.taskList;
  
    tasks.forEach(task => {
      const taskContainer = document.createElement('div');
      taskContainer.id = `task${task.id}`;
      taskContainer.classList = 'container task';
      taskContainer.addEventListener('click', () => {
        this.editTask(task.id, '.task-edit-modal', '#editTask');
      });
  
      const taskDescP = document.createElement('p');
      taskDescP.innerHTML = task.description;
      taskDescP.classList = 'task-desc';
  
      const taskFooter = document.createElement('div');
      taskFooter.classList = 'taskFooter';
  
      const taskSelect = document.createElement('select');
      taskSelect.id = `priority${task.id}`;
  
      const selectedOption = document.createElement('option');
      selectedOption.value = task.priority;
      selectedOption.innerHTML = this.taskEnum[task.priority][0].toLocaleUpperCase() + this.taskEnum[task.priority].slice(1);
      taskSelect.appendChild(selectedOption);
  
      ['Low', 'Mid', 'High'].forEach(level => {
        const option = document.createElement('option');
        option.value = this.taskEnum[level];
        option.innerHTML = level;
        taskSelect.appendChild(option);
      });
  
      const taskTime = document.createElement('div');
      taskTime.innerHTML = `Estimate: ${task.time}`;
      taskTime.classList = 'task-time';
  
      taskContainer.appendChild(taskDescP);
      taskFooter.appendChild(taskSelect);
      taskFooter.appendChild(taskTime);
      taskContainer.appendChild(taskFooter);
  
      containerDiv.appendChild(taskContainer);
    });
  }
  
}