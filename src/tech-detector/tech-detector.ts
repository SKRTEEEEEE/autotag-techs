import type { DependencyParser } from "../dependency-parser/dependency-parser";
import type { Logger } from "../logger/logger";
import type { GitHubTopicsManager } from "./github-topics-manager";

import { readdirSync } from "node:fs";
import path from "node:path";

interface SimpleIconTech {
  title: string;
  slug: string;
}

export class TechDetector {
  private readonly apiBaseUrl =
    "https://kind-creation-production.up.railway.app/pre-tech";

  private readonly languageExtensions: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sh": "bash",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".vue": "vue",
    ".json": "json",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".sql": "sql",
    ".r": "r",
    ".m": "objc",
    ".groovy": "groovy",
  };

  constructor(
    private readonly dependencyParser: DependencyParser,
    private readonly topicsManager: GitHubTopicsManager,
    private readonly logger: Logger,
  ) {}

  async detectAndTag(repoPath: string, includeFull: boolean): Promise<void> {
    this.logger.info("Starting technology detection...");

    // Get dependencies from dependency files
    const dependencies =
      await this.dependencyParser.parseDependencies(repoPath);
    this.logger.info(`Found ${dependencies.length} dependencies`);

    // Detect technologies from file extensions
    const detectedLanguages = this.detectLanguages(repoPath);
    this.logger.info(`Detected ${detectedLanguages.length} languages`);

    // Combine both sources
    const allTechs = [...new Set([...dependencies, ...detectedLanguages])];

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

  private detectLanguages(repoPath: string): string[] {
    const languages = new Set<string>();

    try {
      const files = this.getAllFiles(repoPath);

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const language = this.languageExtensions[ext];
        if (language) {
          languages.add(language);
        }
      }
    } catch (error) {
      this.logger.info(
        `Error detecting languages: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return [...languages];
  }

  private getAllFiles(
    dir: string,
    fileList: string[] = [],
    depth = 0,
  ): string[] {
    // Limit recursion depth to avoid too much scanning
    if (depth > 3) {
      return fileList;
    }

    try {
      const files = readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        // Skip node_modules, .git, and hidden directories
        if (
          file.name.startsWith(".") ||
          file.name === "node_modules" ||
          file.name === "dist" ||
          file.name === "build"
        ) {
          continue;
        }

        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          this.getAllFiles(fullPath, fileList, depth + 1);
        } else {
          fileList.push(fullPath);
        }
      }
    } catch {
      // Directory read error, skip
    }

    return fileList;
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
