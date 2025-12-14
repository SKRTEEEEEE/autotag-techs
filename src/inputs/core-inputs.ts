import { getBooleanInput, getInput } from "@actions/core";

import { Inputs } from "./inputs";

export class CoreInputs implements Inputs {
  get token(): string {
    // Try to get token from input first
    const inputToken = getInput("token", { required: false });
    if (inputToken) {
      return inputToken;
    }

    // Fallback to GITHUB_TOKEN from environment (standard GitHub Actions variable)
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      return githubToken;
    }

    // If neither is available, throw error
    throw new Error(
      "GitHub token is required. Either provide it as 'token' input or set GITHUB_TOKEN environment variable.",
    );
  }

  get full(): boolean {
    return getBooleanInput("full") || false;
  }
}
