import type { Octokit } from "@octokit/rest";
import type { Logger } from "../logger/logger";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface TechsJson {
  user: string[];
  [timestamp: string]: string[] | undefined;
}

export class TechsStorage {
  private readonly techsJsonPath: string;

  constructor(
    private readonly repoPath: string,
    private readonly logger: Logger,
    private readonly octokit?: Octokit,
    private readonly owner?: string,
    private readonly repo?: string,
  ) {
    this.techsJsonPath = path.join(repoPath, ".github", "techs.json");
  }

  async loadTechs(): Promise<TechsJson> {
    try {
      const content = await readFile(this.techsJsonPath, "utf8");
      const techs = JSON.parse(content) as TechsJson;

      // Ensure user field exists
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      techs.user ??= [];

      this.logger.info(
        `Loaded existing techs.json with ${Object.keys(techs).length} entries`,
      );
      return techs;
    } catch {
      this.logger.info("techs.json not found or invalid, creating new one");
      return { user: [] };
    }
  }

  async saveTechs(techs: TechsJson): Promise<void> {
    try {
      // Ensure .github directory exists
      const dirPath = path.dirname(this.techsJsonPath);
      await mkdir(dirPath, { recursive: true });

      await writeFile(
        this.techsJsonPath,
        JSON.stringify(techs, undefined, 2),
        "utf8",
      );
      this.logger.info(
        `Saved techs.json with ${Object.keys(techs).length} entries`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save techs.json: ${errorMsg}`);
      throw new Error(`Failed to save techs.json: ${errorMsg}`);
    }
  }

  async addNewTechs(newTechs: string[]): Promise<void> {
    const techs = await this.loadTechs();
    const timestamp = this.generateTimestamp();

    // Only add techs that don't already exist
    const existingTechs = this.getAllTechs(techs);
    const uniqueNewTechs = newTechs.filter(tech => !existingTechs.has(tech));

    if (uniqueNewTechs.length > 0) {
      techs[timestamp] = uniqueNewTechs;
      await this.saveTechs(techs);
      this.logger.info(
        `Added ${uniqueNewTechs.length} new technologies to techs.json`,
      );
      this.logger.info(`New technologies: ${uniqueNewTechs.join(", ")}`);
    } else {
      this.logger.info("No new technologies to add to techs.json");
    }
  }

  async removeTechs(techsToRemove: string[]): Promise<void> {
    if (techsToRemove.length === 0) {
      return;
    }

    const techs = await this.loadTechs();
    const toRemoveSet = new Set(techsToRemove.map(t => t.toLowerCase()));

    let removedCount = 0;
    const newTechs: TechsJson = { user: techs.user };

    // Remove from all timestamp entries
    for (const [key, value] of Object.entries(techs)) {
      if (key === "user") {
        continue; // Don't remove from user-defined techs
      }

      if (Array.isArray(value)) {
        const beforeCount = value.length;
        const filtered = value.filter(
          tech => !toRemoveSet.has(tech.toLowerCase()),
        );
        removedCount += beforeCount - filtered.length;

        // Keep only non-empty timestamp entries
        if (filtered.length > 0) {
          newTechs[key] = filtered;
          this.logger.info(
            `Filtered timestamp entry ${key}: ${filtered.length} techs remaining`,
          );
        } else {
          this.logger.info(`Removed empty timestamp entry: ${key}`);
        }
      }
    }

    if (removedCount > 0) {
      await this.saveTechs(newTechs);
      this.logger.info(`Removed ${removedCount} technologies from techs.json`);
      this.logger.info(`Removed technologies: ${techsToRemove.join(", ")}`);
    } else {
      this.logger.info("No technologies were removed from techs.json");
    }
  }

  async updateTimestamps(): Promise<void> {
    // Move all techs to current timestamp to keep track of recent usage
    const techs = await this.loadTechs();
    const userTechs = techs.user;
    const allOtherTechs = this.getAllTechs(techs, true);

    const timestamp = this.generateTimestamp();
    const newTechs: TechsJson = {
      user: userTechs,
      [timestamp]: [...allOtherTechs],
    };

    await this.saveTechs(newTechs);
    this.logger.info(`Updated timestamps for all technologies`);
  }

  hasTech(tech: string): Promise<boolean> {
    return this.loadTechs().then(techs => this.getAllTechs(techs).has(tech));
  }

  getAllTechs(techs: TechsJson, excludeUser = false): Set<string> {
    const allTechs = new Set<string>();

    for (const [key, value] of Object.entries(techs)) {
      if (excludeUser && key === "user") {
        continue;
      }
      if (key !== "user" && Array.isArray(value)) {
        for (const t of value) allTechs.add(t);
      }
    }

    // Add user techs separately
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!excludeUser && techs.user) {
      for (const t of techs.user) allTechs.add(t);
    }

    return allTechs;
  }

  getUserTechs(techs: TechsJson): string[] {
    return techs.user;
  }

  private generateTimestamp(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, "0");

    return `${day}-${month}-${year}-${hour}`;
  }

  normalizeToBadge(tech: string): string {
    // Handle scoped packages like @types/jest or @babel/core
    let normalized = tech;

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

    // Extract base package name from plugin/extension packages
    // e.g., node-red-dashboard -> node-red, node-red-contrib-s7 -> node-red
    if (normalized.startsWith("node-red-")) {
      normalized = "node-red";
    }

    // Convert . to dot or - as per requirements
    normalized = normalized
      .toLowerCase()
      // Replace dots with 'dot' or '-' (using dash for better GitHub topic compatibility)
      .replaceAll(".", "-")
      // Replace other separators with dash
      .replaceAll(/[+_\s]/g, "-")
      // Remove any character that's not alphanumeric or hyphen
      .replaceAll(/[^a-z0-9-]/g, "")
      // Collapse multiple hyphens into single
      .replaceAll(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replaceAll(/^-|-$/g, "");

    // Handle some special cases to be GitHub topic compliant
    if (normalized === "") {
      normalized = "unknown";
    }

    return normalized;
  }

  async commitAndPushTechs(): Promise<void> {
    try {
      if (!this.octokit || !this.owner || !this.repo) {
        this.logger.info("Skipping GitHub API commit: octokit not available");
        return;
      }

      const content = await readFile(this.techsJsonPath, "utf8");

      // Try to get existing file to get its SHA and compare content
      let sha: string | undefined;
      let existingContent: string | undefined;

      try {
        const response = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: ".github/techs.json",
        });

        if ("sha" in response.data) {
          sha = response.data.sha;
        }

        if ("content" in response.data) {
          const content = response.data.content;
          if (typeof content === "string") {
            existingContent = Buffer.from(content, "base64").toString("utf8");
          }
        }
      } catch (error) {
        // File doesn't exist yet, which is fine
        if (error instanceof Error && error.message.includes("404")) {
          this.logger.info("techs.json does not exist yet, will create it");
        }
      }

      // Check if content actually changed
      if (existingContent && existingContent === content) {
        this.logger.info(
          "techs.json content unchanged, skipping GitHub API update",
        );
        return;
      }

      // Create or update the file only if content changed
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: ".github/techs.json",
        message: "chore: update techs.json with detected technologies [skip ci]",
        content: Buffer.from(content).toString("base64"),
        sha,
        committer: {
          name: "github-actions[bot]",
          email: "41898282+github-actions[bot]@users.noreply.github.com",
        },
        author: {
          name: "github-actions[bot]",
          email: "41898282+github-actions[bot]@users.noreply.github.com",
        },
      });

      this.logger.info("Successfully pushed techs.json to GitHub");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.info(`Warning: Could not push techs.json: ${errorMsg}`);
    }
  }
}
