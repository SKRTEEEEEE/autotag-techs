import { getOctokit } from "@actions/github";

import { DependencyParser } from "./dependency-parser/dependency-parser";
import { Inputs } from "./inputs/inputs";
import { Logger } from "./logger/logger";
import { Outputs } from "./outputs/outputs";
import { GitHubTopicsManager } from "./tech-detector/github-topics-manager";
import { TechDetector } from "./tech-detector/tech-detector";

export class Action {
  private readonly logger;
  private readonly outputs;

  constructor(dependencies: { logger: Logger; outputs: Outputs }) {
    this.logger = dependencies.logger;
    this.outputs = dependencies.outputs;
  }

  async run(inputs: Inputs) {
    this.logger.info("Starting autotag-techs-action...");

    const octokit = getOctokit(inputs.token);

    const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
    if (!owner || !repo) {
      throw new Error("GITHUB_REPOSITORY environment variable is not set");
    }

    const repoPath = process.env.GITHUB_WORKSPACE ?? process.cwd();
    this.logger.info(`Repository: ${owner}/${repo}`);
    this.logger.info(`Workspace: ${repoPath}`);

    const dependencyParser = new DependencyParser();
    const topicsManager = new GitHubTopicsManager(
      octokit,
      owner,
      repo,
      this.logger,
    );
    const techDetector = new TechDetector(
      octokit,
      owner,
      repo,
      dependencyParser,
      topicsManager,
      this.logger,
    );

    try {
      const includeFull = inputs.full ?? false;
      await techDetector.detectAndTag(repoPath, includeFull);

      const dependencies = await dependencyParser.parseDependencies(repoPath);
      this.outputs.saveDetectedTechs(dependencies);

      this.logger.info("Action completed successfully");
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Action failed: ${error.message}`);
        throw error;
      }
      throw new Error("Unknown error occurred");
    }
  }
}
