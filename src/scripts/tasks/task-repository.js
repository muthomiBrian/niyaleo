class TaskRepository {
  constructor() {
    this.db = idb.open('tasks-repo', 1, upgradeDB => {
      switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('tasks-repo', {keyPath: 'id'});
      }
    });
  }

  static openTaskDB() {
    return idb.open('tasks-repo', 1, upgradeDB => {
      switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('tasks-repo', {keyPath: 'id'});
      }
    });
  }

  storeTask(task) {
    return this.db.then(db => {
      if (!db) return;
      return db
        .transaction('tasks-repo', 'readwrite')
        .objectStore('tasks-repo')
        .put(task);
    });
  }

  getTasks() {
    return this.db.then(db => {
      if (!db) return;
      return db
        .transaction('tasks-repo')
        .objectStore('tasks-repo')
        .getAll();
    });
  }

  getTask(id) {
    return this.db.then(db => {
      if (!db) return;
      return db
        .transaction('tasks-repo')
        .objectStore('tasks-repo')
        .get(id);
    });
  }

  static getTaskStatic(id) {
    return TaskRepository.openTaskDB().then(db => {
      if (!db) return;
      return db
        .transaction('tasks-repo')
        .objectStore('tasks-repo')
        .get(id);
    });
  }

  static deleteTask(taskId) {
    return TaskRepository.openTaskDB().then(db => {
      if (!db) return;
      return db
        .transaction('tasks-repo', 'readwrite')
        .objectStore('tasks-repo')
        .delete(taskId);
    });
  }
}