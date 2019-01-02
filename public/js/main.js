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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      // Registration was successful
    }, function(err) {
      // registration failed :(
    });
  });
}
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());
class TaskFactory{
  constructor(task) {
    this.description = task.description;
    this.priority = task.priority;
    this.time = task.time;
    this.id = task.id || TaskFactory.idMaker();
  }

  static idMaker() {
    if (!TaskFactory.lastid) {
      this.lastid = 0;
    }
    
    const date = new Date();
    
    const dateObj = {
      day: date.getDate().toString(),
      hour: date.getHours().toString(),
      minutes: date.getMinutes().toString(),
      year: date.getFullYear().toString()
    };

    const dateSec = hyphenate(dateObj.day + dateObj.hour + dateObj.minutes + dateObj.year)
    this.lastid++;
    return this.lastid + dateSec;
  }
}
class TaskList {
  constructor(tasklist, taskEnum, taskRepo) {
    this.taskList = document.querySelector(tasklist);
    this.taskEnum = taskEnum;
    this.taskRepo = taskRepo;
  }

  editTask(taskId, taskEditModalSelector, formSelector) {
    const editModal = document.querySelector(taskEditModalSelector);
    const form = document.querySelector(formSelector);

    form.setAttribute('data-id', taskId);

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
      console.log('called')
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
const priorityEnum = {
  1: 'High', 2: 'Mid', 3: 'Low', 'High': 1, 'Mid': 2, 'Low': 3
};
function hyphenate(string) {
  if (string.includes(' ')) {
    let newString = string.replace(' ', '-');
    newString = newString.replace(',','');
    return hyphenate(newString);
  } else {
    return string;
  }
}