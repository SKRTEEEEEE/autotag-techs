export class Project {
  private tasks: string[];
  private goals: string[];

  constructor(public readonly name: string) {
    this.tasks = [];
    this.goals = [];
  }

  addTask(task: string) {
    this.tasks.push(task);
  }

  addGoal(goal: string) {
    this.goals.push(goal);
  }

  getTasks() {
    return [...this.tasks];
  }

  getGoals() {
    return [...this.goals];
  }

  toJSON() {
    return {
      name: this.name,
      tasks: this.tasks,
      goals: this.goals,
    };
  }
}
