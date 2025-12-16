import type { Octokit } from "@octokit/rest";
import type { DependencyParser } from "../dependency-parser/dependency-parser";
import type { Logger } from "../logger/logger";
import type { GitHubTopicsManager } from "./github-topics-manager";

import { readdir } from "node:fs/promises";
import path from "node:path";

import { TechsStorage } from "./techs-storage";

interface SimpleIconTech {
  title: string;
  slug: string;
}

export class TechDetector {
  private readonly apiBaseUrl =
    "https://kind-creation-production.up.railway.app/pre-tech";

  private readonly searchCache = new Map<string, SimpleIconTech[]>();

  private readonly delayMs = 500; // Delay between API requests

  private readonly techsStorage: TechsStorage;

  constructor(
    private readonly octokit: Octokit,
    private readonly owner: string,
    private readonly repo: string,
    private readonly dependencyParser: DependencyParser,
    private readonly topicsManager: GitHubTopicsManager,
    private readonly logger: Logger,
    private readonly repoPath: string,
  ) {
    this.techsStorage = new TechsStorage(
      repoPath,
      logger,
      octokit,
      owner,
      repo,
    );
  }

  async detectAndTag(repoPath: string, includeFull: boolean): Promise<void> {
    this.logger.info("Starting technology detection...");

    // Load existing techs from storage
    const existingTechs = await this.techsStorage.loadTechs();
    const userTechs = this.techsStorage.getUserTechs(existingTechs);

    // First, update topics with user-defined techs (always included)
    if (userTechs.length > 0) {
      this.logger.info(
        `Including user-defined technologies: ${userTechs.join(", ")}`,
      );
      await this.topicsManager.updateTopics(userTechs);
    }

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

    const fileBasedTechs = await this.detectTechnologiesByFiles(repoPath);
    this.logger.info(
      `Detected ${fileBasedTechs.length} technologies from files`,
    );
    if (fileBasedTechs.length > 0) {
      this.logger.info(`File-based techs: ${fileBasedTechs.join(", ")}`);
    }

    const allTechs = [
      ...new Set([...dependencies, ...githubLanguages, ...fileBasedTechs]),
    ];
    this.logger.info(`Total unique technologies to check: ${allTechs.length}`);

    // Normalize all detected techs for comparison
    const normalizedDetectedTechs = new Set(
      allTechs.map(tech => this.techsStorage.normalizeToBadge(tech)),
    );

    const matchedTechs: string[] = [];
    const failedTechs: string[] = [];
    const excludedTechs: string[] = [];
    const techsToRemoveFromStorage: string[] = [];

    // When full: false, check for techs in storage that are no longer detected
    if (!includeFull) {
      const existingTechs = await this.techsStorage.loadTechs();
      const allStoredTechs = this.techsStorage.getAllTechs(
        existingTechs,
        false,
      );
      const userTechsSet = new Set(userTechs);
      for (const storedTech of allStoredTechs) {
        if (
          !normalizedDetectedTechs.has(storedTech) &&
          !userTechsSet.has(storedTech)
        ) {
          this.logger.info(
            `Technology ${storedTech} no longer detected, marking for removal (full: false)`,
          );
          techsToRemoveFromStorage.push(storedTech);
        }
      }
    }

    for (const [i, tech] of allTechs.entries()) {
      // Normalize to badge format for checking if it exists in techs.json
      const normalizedBadge = this.techsStorage.normalizeToBadge(tech);

      // When full: true, skip API check for existing techs
      // When full: false, always verify against API to catch invalid techs stored before
      const techExists = await this.techsStorage.hasTech(normalizedBadge);
      if (includeFull && techExists) {
        this.logger.info(
          `Technology ${tech} (${normalizedBadge}) already exists in techs.json, skipping API call (full: true)`,
        );
        matchedTechs.push(normalizedBadge);
        continue;
      }

      // When full: false, even if tech exists, verify it against API
      if (!includeFull && techExists) {
        this.logger.info(
          `Technology ${tech} (${normalizedBadge}) exists in techs.json, re-verifying against API (full: false)`,
        );
      }

      // Tech not found in techs.json (or need to verify for full: false)
      this.logger.info(
        `Technology ${tech} (${normalizedBadge}), checking via API...`,
      );

      // Add delay between API calls to avoid rate limiting
      if (i > 0 || matchedTechs.length > 0) {
        await this.sleep(this.delayMs);
      }

      try {
        this.logger.info(`Searching for technology: ${tech}`);
        const results = await this.searchTechnology(tech);
        if (results.length > 0) {
          this.logger.info(
            `Found ${results.length} match(es) for ${tech}: ${results.map(r => r.title).join(", ")}`,
          );
          matchedTechs.push(normalizedBadge);
        } else {
          this.logger.info(`No API matches for ${tech}`);
          if (includeFull) {
            this.logger.info(`Adding ${tech} to topics because full: true`);
            matchedTechs.push(normalizedBadge);
          } else {
            this.logger.info(
              `Excluding ${tech} because full: false and no API matches`,
            );
            excludedTechs.push(normalizedBadge);
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
          this.logger.info(
            `Adding ${tech} to topics because full: true despite API error`,
          );
          matchedTechs.push(normalizedBadge);
        } else {
          this.logger.info(
            `Excluding ${tech} because full: false and API verification failed`,
          );
          excludedTechs.push(normalizedBadge);
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

    // Save only matched techs to techs.json (not all new techs)
    if (uniqueTechs.length > 0) {
      await this.techsStorage.addNewTechs(uniqueTechs);
    }

    // Remove excluded techs from techs.json when full: false
    if (!includeFull) {
      const allToRemove = [
        ...new Set([...excludedTechs, ...techsToRemoveFromStorage]),
      ];
      if (allToRemove.length > 0) {
        this.logger.info(
          `Removing ${allToRemove.length} unverified/undetected technologies from techs.json`,
        );
        await this.techsStorage.removeTechs(allToRemove);
      }
    }

    // Update latest timestamp to keep record of recent usage
    await this.techsStorage.updateTimestamps();

    if (uniqueTechs.length === 0) {
      this.logger.info("No technologies matched, skipping topic update");
      return;
    }

    // Merge with user techs for final topics list
    const finalTechs = [...new Set([...userTechs, ...uniqueTechs])];
    this.logger.info(`Creating topics: ${finalTechs.join(", ")}`);
    await this.topicsManager.updateTopics(finalTechs);

    // Remove excluded techs from repository topics when full: false
    if (!includeFull) {
      const allToRemoveFromTopics = [
        ...new Set([...excludedTechs, ...techsToRemoveFromStorage]),
      ];
      if (allToRemoveFromTopics.length > 0) {
        this.logger.info(
          `Removing ${allToRemoveFromTopics.length} unverified/undetected technologies from topics`,
        );
        await this.topicsManager.removeTopics(allToRemoveFromTopics);
      }
    }

    // Commit and push techs.json to persist changes
    await this.techsStorage.commitAndPushTechs();
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

  private async detectTechnologiesByFiles(repoPath: string): Promise<string[]> {
    const techs = new Set<string>();

    // Define technology detection patterns
    const techPatterns: { pattern: RegExp; techs: string[] }[] = [
      { pattern: /^Dockerfile(.*)/, techs: ["docker"] },
      {
        pattern: /^docker-compose(\.ya?ml)?$/,
        techs: ["docker", "docker-compose"],
      },
      { pattern: /\.sql$/i, techs: ["sql"] },
      { pattern: /^\.dockerignore$/, techs: ["docker"] },
      { pattern: /^Makefile$/, techs: ["make"] },
      { pattern: /^\.gitlab-ci\.ya?ml$/, techs: ["gitlab-ci"] },
      { pattern: /^\.travis\.ya?ml$/, techs: ["travis-ci"] },
      { pattern: /^\.github\/workflows\//, techs: ["github-actions"] },
      { pattern: /^terraform\//i, techs: ["terraform"] },
      { pattern: /\.tf$/, techs: ["terraform"] },
      { pattern: /^k8s\//i, techs: ["kubernetes"] },
      { pattern: /^kubernetes\//i, techs: ["kubernetes"] },
      { pattern: /\.ya?ml$/i, techs: ["yaml"] },
    ];

    try {
      await this.scanFilesForTechs(repoPath, techs, techPatterns);
    } catch (error) {
      this.logger.info(
        `Error scanning files for technologies: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return [...techs];
  }

  private async scanFilesForTechs(
    dirPath: string,
    techs: Set<string>,
    patterns: {
      pattern: RegExp;
      techs: string[];
    }[],
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      const skipDirs = new Set([
        "node_modules",
        ".git",
        "dist",
        "build",
        "target",
        ".venv",
        "venv",
        "__pycache__",
        ".pytest_cache",
        "vendor",
        ".bundle",
        "coverage",
        "node-modules",
      ]);

      for (const entry of entries) {
        if (entry.isDirectory() && !skipDirs.has(entry.name)) {
          await this.scanFilesForTechs(
            path.join(dirPath, entry.name),
            techs,
            patterns,
          );
        } else if (entry.isFile()) {
          for (const { pattern, techs: patternTechs } of patterns) {
            if (pattern.test(entry.name)) {
              this.logger.info(
                `Found matching file: ${entry.name} (detected: ${patternTechs.join(", ")})`,
              );
              for (const tech of patternTechs) {
                techs.add(tech);
              }
            }
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.info(`Error scanning directory ${dirPath}: ${errorMsg}`);
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
