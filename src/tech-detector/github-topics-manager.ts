/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import type { Logger } from "../logger/logger";

export class GitHubTopicsManager {
  private readonly maxTopics = 20;

  constructor(
    private readonly octokit: any,
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

    try {
      await this.setTopics(mergedTopics);
      this.logger.info("Topics updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.info(
        `Warning: Could not update repository topics: ${errorMessage}. Technologies were detected but not saved as topics.`,
      );
      // Don't throw - the action should succeed even if topics can't be updated
    }
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
