import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface DependencyFile {
  name: string;
  parser: (content: string) => string[];
}

export class DependencyParser {
  private readonly dependencyFiles: DependencyFile[] = [
    {
      name: "package.json",
      parser: (content: string) => this.parsePackageJson(content),
    },
    {
      name: "requirements.txt",
      parser: (content: string) => this.parseRequirementsTxt(content),
    },
    {
      name: "go.mod",
      parser: (content: string) => this.parseGoMod(content),
    },
    {
      name: "Cargo.toml",
      parser: (content: string) => this.parseCargoToml(content),
    },
    {
      name: "composer.json",
      parser: (content: string) => this.parseComposerJson(content),
    },
    {
      name: "Gemfile",
      parser: (content: string) => this.parseGemfile(content),
    },
    {
      name: "pom.xml",
      parser: (content: string) => this.parsePomXml(content),
    },
    {
      name: "build.gradle",
      parser: (content: string) => this.parseBuildGradle(content),
    },
    {
      name: "pyproject.toml",
      parser: (content: string) => this.parsePyprojectToml(content),
    },
    {
      name: "Pipfile",
      parser: (content: string) => this.parsePipfile(content),
    },
  ];

  async parseDependencies(repoPath: string): Promise<string[]> {
    const dependencies = new Set<string>();

    // First, check if the repository path exists and log what we find
    console.debug(`Parsing dependencies from: ${repoPath}`);

    // Check for common dependency file patterns in root and subdirectories
    const searchPaths = [
      repoPath, // Root directory
      path.join(repoPath, "frontend"), // Common frontend folder
      path.join(repoPath, "backend"), // Common backend folder
      path.join(repoPath, "src"), // Common source folder
      path.join(repoPath, "client"), // Common client folder
      path.join(repoPath, "server"), // Common server folder
    ];

    const foundFiles: string[] = [];

    // Search all paths for dependency files
    for (const searchPath of searchPaths) {
      console.debug(`Checking directory: ${searchPath}`);
      for (const depFile of this.dependencyFiles) {
        try {
          const filePath = path.join(searchPath, depFile.name);
          const content = await readFile(filePath, "utf8");
          const deps = depFile.parser(content);

          foundFiles.push(filePath);
          console.debug(
            `Found ${depFile.name} at ${filePath} with ${deps.length} dependencies`,
          );

          for (const dep of deps) dependencies.add(dep);
        } catch (error) {
          // File doesn't exist or can't be read, log it for debugging
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          if (!errorMsg.includes("ENOENT")) {
            // Only log non-"file not found" errors
            console.debug(
              `Error reading ${depFile.name}: ${errorMsg.slice(0, 100)}`,
            );
          }
        }
      }
    }

    // Additional check: try to find any package.json files in subdirectories
    try {
      const entries = await readdir(repoPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPackagePath = path.join(
            repoPath,
            entry.name,
            "package.json",
          );
          try {
            const content = await readFile(subPackagePath, "utf8");
            const deps = this.parsePackageJson(content);
            foundFiles.push(subPackagePath);
            console.debug(
              `Found package.json in subdirectory ${entry.name}/ with ${deps.length} dependencies`,
            );
            for (const dep of deps) dependencies.add(dep);
          } catch {
            // Not found or can't read, skip
          }
        }
      }
    } catch (error) {
      // Failed to read directory, log it
      console.debug(
        `Failed to read directory ${repoPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const displayFiles =
      foundFiles.length > 0
        ? foundFiles.join(", ")
        : "None - checked paths: " +
          searchPaths.map(p => p.replace(repoPath, "")).join(", ");
    console.debug(`Found dependency files: ${displayFiles}`);
    const result = [...dependencies];
    console.debug(`Total dependencies extracted: ${result.length}`);

    return result;
  }

  private parsePackageJson(content: string): string[] {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
  }

  private parseRequirementsTxt(content: string): string[] {
    return content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .map(line => line.split(/[=<>~!]/)[0]?.trim() ?? "")
      .filter(Boolean);
  }

  private parseGoMod(content: string): string[] {
    const deps: string[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const match = /^\s*([a-zA-Z0-9.\-/]+)\s+v/.exec(line);
      if (match?.[1]) {
        const parts = match[1].split("/");
        if (parts.length > 0) {
          deps.push(parts.at(-1) ?? "");
        }
      }
    }

    return deps.filter(Boolean);
  }

  private parseCargoToml(content: string): string[] {
    const deps: string[] = [];
    const lines = content.split("\n");
    let inDepsSection = false;

    for (const line of lines) {
      if (
        line.startsWith("[dependencies]") ||
        line.startsWith("[dev-dependencies]")
      ) {
        inDepsSection = true;
        continue;
      }
      if (line.startsWith("[")) {
        inDepsSection = false;
      }
      if (inDepsSection) {
        const match = /^([a-zA-Z0-9_-]+)\s*=/.exec(line);
        if (match?.[1]) {
          deps.push(match[1]);
        }
      }
    }

    return deps;
  }

  private parseComposerJson(content: string): string[] {
    const composer = JSON.parse(content) as {
      require?: Record<string, string>;
      "require-dev"?: Record<string, string>;
    };
    return [
      ...Object.keys(composer.require ?? {}),
      ...Object.keys(composer["require-dev"] ?? {}),
    ];
  }

  private parseGemfile(content: string): string[] {
    return content
      .split("\n")
      .map(line => line.trim())
      .filter(line => /^gem\s+['"]/.test(line))
      .map(line => {
        const match = /gem\s+['"]([^'"]+)['"]/.exec(line);
        return match?.[1] ?? "";
      })
      .filter(Boolean);
  }

  private parsePomXml(content: string): string[] {
    const deps: string[] = [];
    const artifactIdMatches = content.matchAll(
      /<artifactId>([^<]+)<\/artifactId>/g,
    );

    for (const match of artifactIdMatches) {
      if (match[1]) {
        deps.push(match[1]);
      }
    }

    return deps;
  }

  private parseBuildGradle(content: string): string[] {
    const deps: string[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const match =
        /(?:implementation|api|compile|testImplementation)\s*['"]([^:'"]+):([^:'"]+)/.exec(
          line,
        );
      if (match?.[2]) {
        deps.push(match[2]);
      }
    }

    return deps;
  }

  private parsePyprojectToml(content: string): string[] {
    const deps: string[] = [];
    const lines = content.split("\n");
    let inDepsSection = false;

    for (const line of lines) {
      if (line.startsWith("[tool.poetry.dependencies]")) {
        inDepsSection = true;
        continue;
      }
      if (line.startsWith("[")) {
        inDepsSection = false;
      }
      if (inDepsSection) {
        const match = /^([a-zA-Z0-9_-]+)\s*=/.exec(line);
        if (match?.[1] && match[1] !== "python") {
          deps.push(match[1]);
        }
      }
    }

    return deps;
  }

  private parsePipfile(content: string): string[] {
    const deps: string[] = [];
    const lines = content.split("\n");
    let inPackagesSection = false;

    for (const line of lines) {
      if (line.startsWith("[packages]") || line.startsWith("[dev-packages]")) {
        inPackagesSection = true;
        continue;
      }
      if (line.startsWith("[")) {
        inPackagesSection = false;
      }
      if (inPackagesSection) {
        const match = /^([a-zA-Z0-9_-]+)\s*=/.exec(line);
        if (match?.[1]) {
          deps.push(match[1]);
        }
      }
    }

    return deps;
  }
}
