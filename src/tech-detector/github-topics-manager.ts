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
    try {
      await this.octokit.rest.repos.replaceAllTopics({
        owner: this.owner,
        repo: this.repo,
        names: topics,
      });
      this.logger.info("Topics updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("403") ||
        errorMessage.includes("Resource not accessible")
      ) {
        this.logger.info(
          `Warning: Could not update topics due to insufficient permissions. ` +
            `The GITHUB_TOKEN may not have write access to repository metadata. ` +
            `Consider using a Personal Access Token with 'repo' scope instead. ` +
            `Error: ${errorMessage}`,
        );
      } else {
        throw error;
      }
    }
  }

  private mergeTopics(current: string[], newTopics: string[]): string[] {
    const merged = new Set([...current, ...newTopics]);
    return [...merged];
  }
}
