function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    return a.priority - b.priority;
  });
}