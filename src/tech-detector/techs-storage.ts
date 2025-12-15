import type { Logger } from "../logger/logger";

import { readFile, writeFile } from "node:fs/promises";
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
  ) {
    this.techsJsonPath = path.join(repoPath, ".github", "techs.json");
  }

  async loadTechs(): Promise<TechsJson> {
    try {
      const content = await readFile(this.techsJsonPath, "utf8");
      const techs = JSON.parse(content) as TechsJson;

      // Ensure user field exists
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
      await writeFile(
        this.techsJsonPath,
        JSON.stringify(techs, undefined, 2),
        "utf8",
      );
      this.logger.info(
        `Saved techs.json with ${Object.keys(techs).length} entries`,
      );
    } catch {
      this.logger.error("Failed to save techs.json");
      throw new Error("Failed to save techs.json");
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
    if (!excludeUser) {
      for (const t of techs.user ?? []) allTechs.add(t);
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
}
