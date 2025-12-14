import { ProjectService } from "../src/app";

describe("ProjectService (Application)", () => {
  it("should initialize a project with the given name", () => {
    const service = new ProjectService("Weekly Plan");
    const project = service.getProject();

    expect(project.toJSON().name).toBe("Weekly Plan");
  });

  it("should add multiple tasks", () => {
    const service = new ProjectService("Weekly Plan");
    service.addTasks(["Task A", "Task B"]);
    const project = service.getProject();

    expect(project.getTasks()).toEqual(["Task A", "Task B"]);
  });

  it("should add multiple goals", () => {
    const service = new ProjectService("Weekly Plan");
    service.addGoals(["Goal A", "Goal B"]);
    const project = service.getProject();

    expect(project.getGoals()).toEqual(["Goal A", "Goal B"]);
  });
});
