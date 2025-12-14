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

    // Recursively search for all dependency files in the entire repository
    await this.searchDependencyFiles(repoPath, dependencies);

    return [...dependencies];
  }

  private async searchDependencyFiles(
    dirPath: string,
    dependencies: Set<string>,
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip common directories that don't contain meaningful dependencies
        const skipDirs = [
          "node_modules",
          ".git",
          ".github",
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
        ];

        if (entry.isDirectory()) {
          if (!skipDirs.includes(entry.name)) {
            // Recursively search subdirectories
            await this.searchDependencyFiles(
              path.join(dirPath, entry.name),
              dependencies,
            );
          }
        } else if (entry.isFile()) {
          // Check if this file is a dependency file we care about
          const depFile = this.dependencyFiles.find(
            df => df.name === entry.name,
          );
          if (depFile) {
            const filePath = path.join(dirPath, entry.name);
            try {
              const content = await readFile(filePath, "utf8");
              const deps = depFile.parser(content);
              for (const dep of deps) {
                dependencies.add(dep);
              }
            } catch {
              // Silently skip files that can't be read
            }
          }
        }
      }
    } catch {
      // Silently skip directories that can't be read (permission errors, etc)
    }
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
