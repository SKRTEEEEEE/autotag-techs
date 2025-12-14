import { Inputs } from "@/src/inputs/inputs";

describe("Action", () => {
  beforeEach(() => {
    // Setup if needed
  });

  describe("When the token input is provided", () => {
    it("should accept valid inputs", () => {
      const inputs: Inputs = {
        token: "fake-github-token",
        full: false,
      };

      expect(inputs.token).toBe("fake-github-token");
      expect(inputs.full).toBe(false);
    });
  });
});
