import * as core from "@actions/core";
import { vi } from "vitest";

import { CoreOutputs } from "@/src/outputs/core-outputs";

vi.mock("@actions/core", () => ({
  setOutput: vi.fn(),
}));

describe("CoreOutputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set the output value correctly", () => {
    const expectedName = "outputName";
    const expectedValue = "outputValue";

    const outputs = new CoreOutputs();
    outputs.save(expectedName, expectedValue);

    expect(core.setOutput).toHaveBeenCalledWith(expectedName, expectedValue);
  });

  it("should set detected techs output", () => {
    const techs = ["react", "typescript"];
    const outputs = new CoreOutputs();
    outputs.saveDetectedTechs(techs);

    expect(core.setOutput).toHaveBeenCalledWith(
      "detected_techs",
      "react,typescript",
    );
  });

  it("should set created topics output", () => {
    const topics = ["javascript", "nodejs"];
    const outputs = new CoreOutputs();
    outputs.saveCreatedTopics(topics);

    expect(core.setOutput).toHaveBeenCalledWith(
      "created_topics",
      "javascript,nodejs",
    );
  });

  it("should set skip message when action is skipped", () => {
    const skipMessage = "No changes detected in dependencies";
    const outputs = new CoreOutputs();
    outputs.setSkipMessage(skipMessage);

    expect(core.setOutput).toHaveBeenCalledWith("skip_message", skipMessage);
    expect(core.setOutput).toHaveBeenCalledWith("skipped", "true");
  });
});
