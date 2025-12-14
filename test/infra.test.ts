import inquirer from "inquirer";
import { askTasksAndGoals } from "../src/infra";

jest.mock("inquirer");

describe("CLI Prompts (Infrastructure)", () => {
  it("should return mocked tasks and goals", async () => {
    (inquirer.prompt as unknown as jest.Mock).mockResolvedValueOnce({
      tasks: ["Task X", "Task Y"],
    });
    (inquirer.prompt as unknown as jest.Mock).mockResolvedValueOnce({
      goals: ["Goal Z"],
    });

    const answers = await askTasksAndGoals();

    expect(answers.tasks).toEqual(["Task X", "Task Y"]);
    expect(answers.goals).toEqual(["Goal Z"]);
  });
});
