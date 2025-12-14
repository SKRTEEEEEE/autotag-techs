import type { DependencyParser } from "../dependency-parser/dependency-parser";
import type { Logger } from "../logger/logger";
import type { GitHubTopicsManager } from "./github-topics-manager";

interface SimpleIconTech {
  title: string;
  slug: string;
}

export class TechDetector {
  private readonly apiUrl =
    "https://kind-creation-production.up.railway.app/api";

  constructor(
    private readonly dependencyParser: DependencyParser,
    private readonly topicsManager: GitHubTopicsManager,
    private readonly logger: Logger,
  ) {}

  async detectAndTag(repoPath: string, includeFull: boolean): Promise<void> {
    this.logger.info("Starting technology detection...");

    const dependencies =
      await this.dependencyParser.parseDependencies(repoPath);
    this.logger.info(`Found ${dependencies.length} dependencies`);

    const availableTechs = await this.fetchAvailableTechs();
    this.logger.info(`Fetched ${availableTechs.length} technologies from API`);

    const matchedTechs = this.matchTechnologies(
      dependencies,
      availableTechs,
      includeFull,
    );
    this.logger.info(`Matched ${matchedTechs.length} technologies`);

    if (matchedTechs.length === 0) {
      this.logger.info("No technologies matched, skipping topic update");
      return;
    }

    const topics = matchedTechs.map(tech => this.normalizeTopic(tech));
    this.logger.info(`Creating topics: ${topics.join(", ")}`);

    await this.topicsManager.updateTopics(topics);
    this.logger.info("Topics updated successfully");
  }

  private async fetchAvailableTechs(): Promise<SimpleIconTech[]> {
    const response = await fetch(this.apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch technologies: ${response.statusText}`);
    }

    const data = (await response.json()) as { icons: SimpleIconTech[] };
    return data.icons;
  }

  private matchTechnologies(
    dependencies: string[],
    availableTechs: SimpleIconTech[],
    includeFull: boolean,
  ): string[] {
    const matched: string[] = [];
    const availableSlugs = new Set(availableTechs.map(tech => tech.slug));
    const availableTitles = new Map(
      availableTechs.map(tech => [tech.title.toLowerCase(), tech.slug]),
    );

    for (const dep of dependencies) {
      const normalized = this.normalizeTopic(dep);

      if (availableSlugs.has(normalized)) {
        matched.push(normalized);
        continue;
      }

      const titleMatch = availableTitles.get(dep.toLowerCase());
      if (titleMatch) {
        matched.push(titleMatch);
        continue;
      }

      if (includeFull) {
        matched.push(normalized);
      }
    }

    return [...new Set(matched)];
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
