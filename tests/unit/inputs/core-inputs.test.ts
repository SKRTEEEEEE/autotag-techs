import * as core from "@actions/core";
import { Mock, vi } from "vitest";

import { CoreInputs } from "@/src/inputs/core-inputs";

vi.mock("@actions/core", () => ({
  getBooleanInput: vi.fn(),
  getInput: vi.fn(),
}));

describe("CoreInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("token", () => {
    it('should return the value of "token" input when provided', () => {
      const expectedToken = "test-token-value";
      (core.getInput as Mock).mockReturnValueOnce(expectedToken);

      const inputs = new CoreInputs();
      const token = inputs.token;

      expect(token).toBe(expectedToken);
      expect(core.getInput).toHaveBeenCalledWith("token", { required: false });
    });

    it("should return GITHUB_TOKEN when token input is not provided", () => {
      const githubToken = "github-token-from-env";
      (core.getInput as Mock).mockReturnValueOnce("");

      // Mock process.env.GITHUB_TOKEN
      const originalEnv = process.env;
      process.env = { ...originalEnv, GITHUB_TOKEN: githubToken };

      const inputs = new CoreInputs();
      const token = inputs.token;

      expect(token).toBe(githubToken);
      expect(core.getInput).toHaveBeenCalledWith("token", { required: false });

      // Restore process.env
      process.env = originalEnv;
    });

    it("should throw error when neither token input nor GITHUB_TOKEN is provided", () => {
      (core.getInput as Mock).mockReturnValueOnce("");

      // Mock process.env without GITHUB_TOKEN
      const originalEnv = process.env;
      const envWithoutToken = { ...originalEnv };
      delete envWithoutToken.GITHUB_TOKEN;
      process.env = envWithoutToken;

      const inputs = new CoreInputs();

      expect(() => inputs.token).toThrow(
        "GitHub token is required. Either provide it as 'token' input or set GITHUB_TOKEN environment variable.",
      );

      // Restore process.env
      process.env = originalEnv;
    });
  });

  describe("full", () => {
    it('should return the value of "full" input', () => {
      (core.getBooleanInput as Mock).mockReturnValueOnce(true);

      const inputs = new CoreInputs();
      const full = inputs.full;

      expect(full).toBe(true);
      expect(core.getBooleanInput).toHaveBeenCalledWith("full");
    });

    it('should return false if "full" input is not set', () => {
      (core.getBooleanInput as Mock).mockReturnValueOnce(false);

      const inputs = new CoreInputs();
      const full = inputs.full;

      expect(full).toBe(false);
      expect(core.getBooleanInput).toHaveBeenCalledWith("full");
    });
  });
});
