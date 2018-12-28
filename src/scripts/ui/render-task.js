function renderTasks(container, tasks, taskEnum) {
  const containerDiv = document.querySelector(container);

  tasks.forEach(task => {
    const taskContainer = document.createElement('div');
    taskContainer.id = `task${task.id}`;
    taskContainer.classList = 'container task';

    const taskDescP = document.createElement('p');
    taskDescP.innerHTML = task.description;
    taskDescP.classList = 'task-desc';

    const taskFooter = document.createElement('div');
    taskFooter.classList = 'taskFooter';

    const taskSelect = document.createElement('select');
    taskSelect.id = `priority${task.id}`;

    const selectedOption = document.createElement('option');
    selectedOption.value = task.priority;
    selectedOption.innerHTML = taskEnum[task.priority][0].toLocaleUpperCase() + taskEnum[task.priority].slice(1);
    taskSelect.appendChild(selectedOption);

    ['Low', 'Mid', 'High'].forEach(level => {
      const option = document.createElement('option');
      option.value = taskEnum[level];
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
