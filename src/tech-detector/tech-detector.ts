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

  private readonly searchCache = new Map<string, SimpleIconTech[]>();

  private readonly delayMs = 500; // Delay between API requests

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
    if (dependencies.length > 0) {
      this.logger.info(
        `Dependencies: ${dependencies.slice(0, 10).join(", ")}${dependencies.length > 10 ? "..." : ""}`,
      );
    }

    const githubLanguages = await this.getLanguagesFromGitHub();
    this.logger.info(
      `Detected ${githubLanguages.length} languages from GitHub`,
    );

    const allTechs = [...new Set([...dependencies, ...githubLanguages])];
    this.logger.info(`Total unique technologies to check: ${allTechs.length}`);

    const matchedTechs: string[] = [];
    const failedTechs: string[] = [];

    for (const [i, tech] of allTechs.entries()) {
      // Add delay between API calls to avoid rate limiting
      if (i > 0) {
        await this.sleep(this.delayMs);
      }

      try {
        this.logger.info(`Searching for technology: ${tech}`);
        const results = await this.searchTechnology(tech);
        if (results.length > 0) {
          this.logger.info(
            `Found ${results.length} match(es) for ${tech}: ${results.map(r => r.title).join(", ")}`,
          );
          const normalized = this.normalizeTopic(tech);
          matchedTechs.push(normalized);
        } else {
          this.logger.info(`No API matches for ${tech}`);
          if (includeFull) {
            const normalized = this.normalizeTopic(tech);
            matchedTechs.push(normalized);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.info(
          `Could not verify technology ${tech}: ${errorMessage}`,
        );
        failedTechs.push(tech);
        if (includeFull) {
          const normalized = this.normalizeTopic(tech);
          matchedTechs.push(normalized);
        }
      }
    }

    const uniqueTechs = [...new Set(matchedTechs)];
    this.logger.info(`Matched ${uniqueTechs.length} technologies`);
    if (failedTechs.length > 0) {
      this.logger.info(
        `Failed to verify: ${failedTechs.slice(0, 5).join(", ")}${failedTechs.length > 5 ? "..." : ""}`,
      );
    }

    if (uniqueTechs.length === 0) {
      this.logger.info("No technologies matched, skipping topic update");
      return;
    }

    this.logger.info(`Creating topics: ${uniqueTechs.join(", ")}`);
    await this.topicsManager.updateTopics(uniqueTechs);
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

  private async searchTechnology(
    query: string,
    retries = 3,
  ): Promise<SimpleIconTech[]> {
    // Check cache first
    const cached = this.searchCache.get(query);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.apiBaseUrl}?q=${encodeURIComponent(query)}`;
      this.logger.info(`API request: ${url}`);

      const response = await fetch(url);

      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retries > 0) {
        const waitTime = Math.pow(2, 4 - retries) * 1000; // Exponential backoff
        this.logger.info(
          `Rate limited, waiting ${waitTime}ms before retry for ${query}...`,
        );
        await this.sleep(waitTime);
        return this.searchTechnology(query, retries - 1);
      }

      if (!response.ok) {
        this.logger.info(
          `API error: ${response.status} ${response.statusText} for query: ${query}`,
        );
        throw new Error(`Failed to search technology: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new TypeError(`Expected JSON response, got ${contentType}`);
      }

      const jsonResponse = (await response.json()) as
        | {
            success?: boolean;
            type?: string;
            data?: SimpleIconTech[];
          }
        | SimpleIconTech[];

      // Handle both array response and object response with data field
      const data = Array.isArray(jsonResponse)
        ? jsonResponse
        : (jsonResponse.data ?? []);

      // Cache the result
      this.searchCache.set(query, data);
      this.logger.info(`API response for ${query}: ${data.length} results`);
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
    // Extract the actual package name from scoped packages
    // e.g., @types/jest -> jest, @babel/core -> babel/core
    let normalized = name;

    // Handle scoped packages like @types/jest
    if (normalized.startsWith("@")) {
      const parts = normalized.split("/");
      // If it's a type definition (@types/*), use just the package name
      if (parts[0] === "@types" && parts.length > 1) {
        normalized = parts[1];
      } else if (parts.length > 1) {
        // For other scoped packages, keep the scope and package
        normalized = parts.slice(1).join("-");
      }
    }

    // Convert to lowercase and handle common patterns
    normalized = normalized
      .toLowerCase()
      // Handle common separators and special chars
      .replaceAll(/[.+#]/g, "-")
      // Replace underscores and spaces with hyphens
      .replaceAll(/[_\s]/g, "-")
      // Remove any character that's not alphanumeric or hyphen
      .replaceAll(/[^a-z0-9-]/g, "")
      // Collapse multiple hyphens into single
      .replaceAll(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replaceAll(/^-|-$/g, "");

    // Limit to 39 chars to leave room for potential prefixes
    normalized = normalized.slice(0, 39);

    // Handle some special cases to be GitHub topic compliant
    if (normalized === "") {
      normalized = "unknown";
    }

    return normalized;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
