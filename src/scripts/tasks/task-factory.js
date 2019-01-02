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