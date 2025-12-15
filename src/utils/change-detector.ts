import type { Logger } from "../logger/logger";

import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { DependencyParser } from "../dependency-parser/dependency-parser";

export class ChangeDetector {
  private lastRunFile: string;

  constructor(
    private readonly repoPath: string,
    private readonly dependencyParser: DependencyParser,
    private readonly logger: Logger,
  ) {
    this.lastRunFile = path.join(repoPath, ".github", ".autotag-last-run");
  }

  async shouldRun(skipChangeDetection = false): Promise<boolean> {
    if (skipChangeDetection) {
      this.logger.info("Skipping change detection, forcing action run");
      return true;
    }

    try {
      const lastRunData = await this.loadLastRunData();
      const currentDepsHash = await this.getCurrentDependenciesHash();

      if (lastRunData.depsHash === currentDepsHash) {
        const techsJsonMtime = await this.getFileMtime(
          path.join(this.repoPath, ".github", "techs.json"),
        );
        const lastRunTime = new Date(lastRunData.timestamp).getTime();

        // If techs.json hasn't been modified since last run, skip
        if (techsJsonMtime <= lastRunTime) {
          this.logger.info(
            "No changes detected in dependencies or techs.json since last run",
          );
          this.logger.info("Skipping action execution to reduce API calls");
          return false;
        }
      }

      this.logger.info("Changes detected or first run, executing action");
      return true;
    } catch {
      // Error reading last run data means first time running
      this.logger.info(
        "First time running or error reading last run data, executing action",
      );
      return true;
    }
  }

  async saveLastRunData(): Promise<void> {
    try {
      const depsHash = await this.getCurrentDependenciesHash();
      const lastRunData = {
        depsHash,
        timestamp: new Date().toISOString(),
      };

      const content = JSON.stringify(lastRunData, undefined, 2);
      await writeFile(this.lastRunFile, content, "utf8");

      this.logger.info(`Saved last run data with hash: ${depsHash}`);
    } catch (error) {
      this.logger.error(
        `Failed to save last run data: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - action should continue even if we can't save last run data
    }
  }

  private async loadLastRunData(): Promise<{
    depsHash: string;
    timestamp: string;
  }> {
    try {
      const content = await readFile(this.lastRunFile, "utf8");
      return JSON.parse(content) as { depsHash: string; timestamp: string };
    } catch {
      throw new Error("Could not load last run data");
    }
  }

  private async getCurrentDependenciesHash(): Promise<string> {
    const dependencies = await this.dependencyParser.parseDependencies(
      this.repoPath,
    );
    const dependenciesString = dependencies.sort().join(",");

    // Simple hash function for dependency list
    return this.simpleHash(dependenciesString);
  }

  private async getFileMtime(filePath: string): Promise<number> {
    try {
      const stats = await stat(filePath);
      return stats.mtime.getTime();
    } catch {
      // File doesn't exist or can't be read, return 0
      return 0;
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.codePointAt(i) ?? 0;
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
