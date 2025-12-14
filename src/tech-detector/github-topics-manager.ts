import type { Octokit } from "@octokit/rest";
import type { Logger } from "../logger/logger";

export class GitHubTopicsManager {
  private readonly maxTopics = 20;

  constructor(
    private readonly octokit: Octokit,
    private readonly owner: string,
    private readonly repo: string,
    private readonly logger: Logger,
  ) {}

  async updateTopics(newTopics: string[]): Promise<void> {
    const currentTopics = await this.getCurrentTopics();
    this.logger.info(`Current topics: ${currentTopics.join(", ")}`);

    const mergedTopics = this.mergeTopics(currentTopics, newTopics);
    this.logger.info(`Merged topics: ${mergedTopics.join(", ")}`);

    if (mergedTopics.length > this.maxTopics) {
      this.logger.info(
        `Topics exceed maximum of ${this.maxTopics}, truncating`,
      );
      mergedTopics.splice(this.maxTopics);
    }

    await this.setTopics(mergedTopics);
  }

  private async getCurrentTopics(): Promise<string[]> {
    const response = await this.octokit.rest.repos.getAllTopics({
      owner: this.owner,
      repo: this.repo,
    });

    return response.data.names;
  }

  private async setTopics(topics: string[]): Promise<void> {
    await this.octokit.rest.repos.replaceAllTopics({
      owner: this.owner,
      repo: this.repo,
      names: topics,
    });
  }

  private mergeTopics(current: string[], newTopics: string[]): string[] {
    const merged = new Set([...current, ...newTopics]);
    return [...merged];
  }
}
