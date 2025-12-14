import { Project } from "./domain";

export class ProjectService {
  private project: Project;

  constructor(projectName: string) {
    this.project = new Project(projectName);
  }

  addTasks(tasks: string[]) {
    tasks.forEach((t) => this.project.addTask(t));
  }

  addGoals(goals: string[]) {
    goals.forEach((g) => this.project.addGoal(g));
  }

  getProject() {
    return this.project;
  }
}
