const mockTasks = [
  { id: 1, description: 'Some random task you need to do and describe a lot about it because it is very involved',
    priority: 3, time: '1 hr'},
  { id: 2, description: 'Some other random task you need to do.',
    priority: 3, time: '0.5 hr'},
  { id: 3, description: 'Important task you need to do and describe a lot about it because it is very involved. It even got more involved so you had to add a sentence or two',
    priority: 1, time: '2 hr'},
  { id: 4, description: 'Important task you need to do and describe a lot about it because it is very involved',
    priority: 1, time: '1 hr'},
  { id: 5, description: 'Task you need to do and describe a lot about it because it is very involved',
    priority: 2, time: '1 hr'},
  { id: 6, description: 'Task you need to do',
    priority: 2, time: '1 hr'},
  { id: 7, description: 'Task',
    priority: 2, time: '1 hr'},
  { id: 8, description: 'Long ass task you need to do and describe a lot about it because it is very involved',
    priority: 2, time: '1 week'},
  { id: 9, description: 'Some random task you need to do and describe a lot about it because it is very involved',
    priority: 3, time: '1 hr'},
  { id: 10, description: 'Some random task you need to do and describe a lot about it because it is very involved',
    priority: 3, time: '1 hr'},
];
const priorityEnum = {
  1: 'High', 2: 'Mid', 3: 'Low', 'High': 1, 'Mid': 2, 'Low': 3
};
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

function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    return a.priority - b.priority;
  });
}