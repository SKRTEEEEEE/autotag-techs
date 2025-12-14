import type { Octokit } from "@octokit/rest";
import type { DependencyParser } from "../dependency-parser/dependency-parser";
import type { Logger } from "../logger/logger";
import type { GitHubTopicsManager } from "./github-topics-manager";

interface SimpleIconTech {
  title: string;
  slug: string;
}

export class TechDetector {
  private readonly apiBaseUrl =
    "https://kind-creation-production.up.railway.app/pre-tech";

  constructor(
    private readonly octokit: Octokit,
    private readonly owner: string,
    private readonly repo: string,
    private readonly dependencyParser: DependencyParser,
    private readonly topicsManager: GitHubTopicsManager,
    private readonly logger: Logger,
  ) {}

  async detectAndTag(repoPath: string, includeFull: boolean): Promise<void> {
    this.logger.info("Starting technology detection...");

    const dependencies =
      await this.dependencyParser.parseDependencies(repoPath);
    this.logger.info(`Found ${dependencies.length} dependencies`);

    const githubLanguages = await this.getLanguagesFromGitHub();
    this.logger.info(
      `Detected ${githubLanguages.length} languages from GitHub`,
    );

    const allTechs = [...new Set([...dependencies, ...githubLanguages])];

    const matchedTechs: string[] = [];

    for (const tech of allTechs) {
      try {
        const results = await this.searchTechnology(tech);
        if (results.length > 0) {
          const normalized = this.normalizeTopic(tech);
          matchedTechs.push(normalized);
        } else if (includeFull) {
          const normalized = this.normalizeTopic(tech);
          matchedTechs.push(normalized);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.info(
          `Could not verify technology ${tech}: ${errorMessage}`,
        );
        if (includeFull) {
          const normalized = this.normalizeTopic(tech);
          matchedTechs.push(normalized);
        }
      }
    }

    const uniqueTechs = [...new Set(matchedTechs)];
    this.logger.info(`Matched ${uniqueTechs.length} technologies`);

    if (uniqueTechs.length === 0) {
      this.logger.info("No technologies matched, skipping topic update");
      return;
    }

    this.logger.info(`Creating topics: ${uniqueTechs.join(", ")}`);
    await this.topicsManager.updateTopics(uniqueTechs);
    this.logger.info("Topics updated successfully");
  }

  private async getLanguagesFromGitHub(): Promise<string[]> {
    try {
      const response = await this.octokit.repos.listLanguages({
        owner: this.owner,
        repo: this.repo,
      });

      const languages = Object.keys(response.data).map(lang =>
        lang
          .toLowerCase()
          .replaceAll(/\s+/g, "-")
          .replaceAll("+", "-")
          .replaceAll("#", ""),
      );

      this.logger.info(`GitHub languages: ${languages.join(", ")}`);
      return languages;
    } catch (error) {
      this.logger.info(
        `Could not fetch languages from GitHub: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  private async searchTechnology(query: string): Promise<SimpleIconTech[]> {
    try {
      const url = `${this.apiBaseUrl}?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to search technology: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new TypeError(`Expected JSON response, got ${contentType}`);
      }

      const data = (await response.json()) as SimpleIconTech[];
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TypeError(
          "Failed to parse API response as JSON. The API might be down or returning invalid data.",
        );
      }
      throw error;
    }
  }

  private normalizeTopic(name: string): string {
    return name
      .toLowerCase()
      .replaceAll(/[.@]/g, "-")
      .replaceAll(/[^a-z0-9-]/g, "")
      .replaceAll(/-+/g, "-")
      .replaceAll(/^-|-$/g, "")
      .slice(0, 50);
  }
}
