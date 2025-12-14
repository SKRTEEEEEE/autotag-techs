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
    it('should return the value of "token" input', () => {
      const expectedToken = "test-token-value";
      (core.getInput as Mock).mockReturnValueOnce(expectedToken);

      const inputs = new CoreInputs();
      const token = inputs.token;

      expect(token).toBe(expectedToken);
      expect(core.getInput).toHaveBeenCalledWith("token", { required: true });
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
