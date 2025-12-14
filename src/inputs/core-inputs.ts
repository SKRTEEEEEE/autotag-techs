import { getBooleanInput, getInput } from "@actions/core";

import { Inputs } from "./inputs";

export class CoreInputs implements Inputs {
  get token(): string {
    // Try to get token from input first, fallback to GITHUB_TOKEN environment variable
    const inputToken = getInput("token", { required: false });
    if (inputToken) {
      return inputToken;
    }

    // Fallback to GITHUB_TOKEN from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error(
        "GitHub token is required. Either provide it as 'token' input or ensure GITHUB_TOKEN is available in the environment.",
      );
    }

    return githubToken;
  }

  get full(): boolean {
    return getBooleanInput("full") || false;
  }
}
