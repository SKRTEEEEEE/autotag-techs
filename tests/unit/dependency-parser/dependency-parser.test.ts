import { promises as fs } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DependencyParser } from "@/src/dependency-parser/dependency-parser";

describe("DependencyParser", () => {
  let parser: DependencyParser;
  let tempDir: string;

  beforeEach(async () => {
    parser = new DependencyParser();
    tempDir = path.join(process.cwd(), ".test-deps-temp");
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch {
      // ignore if exists
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore errors during cleanup
    }
  });

  describe("parsePackageJson", () => {
    it("should parse npm package.json dependencies", async () => {
      const packageJson = {
        dependencies: {
          react: "^18.0.0",
          "next.js": "^13.0.0",
        },
        devDependencies: {
          typescript: "^5.0.0",
        },
      };

      const filePath = path.join(tempDir, "package.json");
      await fs.writeFile(filePath, JSON.stringify(packageJson));

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("react");
      expect(deps).toContain("next.js");
      expect(deps).toContain("typescript");
    });
  });

  describe("parseRequirementsTxt", () => {
    it("should parse Python requirements.txt", async () => {
      const requirements = `
django==3.2.0
flask>=2.0.0
requests
      `.trim();

      const filePath = path.join(tempDir, "requirements.txt");
      await fs.writeFile(filePath, requirements);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("django");
      expect(deps).toContain("flask");
      expect(deps).toContain("requests");
    });
  });

  describe("parseGoMod", () => {
    it("should parse Go go.mod file", async () => {
      const goMod = `
module github.com/example/myapp

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/fiber/fiber v2.40.0
)
      `.trim();

      const filePath = path.join(tempDir, "go.mod");
      await fs.writeFile(filePath, goMod);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("gin");
      expect(deps).toContain("fiber");
    });
  });

  describe("parseCargoToml", () => {
    it("should parse Rust Cargo.toml", async () => {
      const cargoToml = `
[package]
name = "my-app"
version = "0.1.0"

[dependencies]
tokio = "1.0"
serde = "1.0"

[dev-dependencies]
assert_cmd = "2.0"
      `.trim();

      const filePath = path.join(tempDir, "Cargo.toml");
      await fs.writeFile(filePath, cargoToml);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("tokio");
      expect(deps).toContain("serde");
      expect(deps).toContain("assert_cmd");
    });
  });

  describe("parseComposerJson", () => {
    it("should parse PHP composer.json", async () => {
      const composerJson = {
        require: {
          "laravel/framework": "^10.0",
        },
        "require-dev": {
          "phpunit/phpunit": "^9.0",
        },
      };

      const filePath = path.join(tempDir, "composer.json");
      await fs.writeFile(filePath, JSON.stringify(composerJson));

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("laravel/framework");
      expect(deps).toContain("phpunit/phpunit");
    });
  });

  describe("parseGemfile", () => {
    it("should parse Ruby Gemfile", async () => {
      const gemfile = `
source "https://rubygems.org"

gem "rails", "7.0.0"
gem "pg", "~> 1.1"
      `.trim();

      const filePath = path.join(tempDir, "Gemfile");
      await fs.writeFile(filePath, gemfile);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("rails");
      expect(deps).toContain("pg");
    });
  });

  describe("parsePomXml", () => {
    it("should parse Java pom.xml", async () => {
      const pomXml = `
<?xml version="1.0"?>
<project>
  <dependencies>
    <dependency>
      <artifactId>junit</artifactId>
    </dependency>
  </dependencies>
</project>
      `.trim();

      const filePath = path.join(tempDir, "pom.xml");
      await fs.writeFile(filePath, pomXml);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("junit");
    });
  });

  describe("parseBuildGradle", () => {
    it("should parse Android/Gradle build.gradle", async () => {
      const buildGradle = `
dependencies {
    implementation 'androidx.appcompat:appcompat:1.5.1'
    testImplementation 'junit:junit:4.13.2'
}
      `.trim();

      const filePath = path.join(tempDir, "build.gradle");
      await fs.writeFile(filePath, buildGradle);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("appcompat");
      expect(deps).toContain("junit");
    });
  });

  describe("parsePyprojectToml", () => {
    it("should parse Poetry pyproject.toml", async () => {
      const pyprojectToml = `
[tool.poetry]
name = "my-app"

[tool.poetry.dependencies]
python = "^3.9"
django = "^4.0"
      `.trim();

      const filePath = path.join(tempDir, "pyproject.toml");
      await fs.writeFile(filePath, pyprojectToml);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("django");
      expect(deps).not.toContain("python");
    });
  });

  describe("parsePipfile", () => {
    it("should parse Pipenv Pipfile", async () => {
      const pipfile = `
[packages]
flask = "*"

[dev-packages]
pytest = "*"
      `.trim();

      const filePath = path.join(tempDir, "Pipfile");
      await fs.writeFile(filePath, pipfile);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("flask");
      expect(deps).toContain("pytest");
    });
  });

  describe("Multiple dependency files", () => {
    it("should parse dependencies from multiple files", async () => {
      const packageJson = {
        dependencies: { react: "^18.0.0" },
      };

      const requirements = "django==3.2.0";

      await fs.writeFile(
        path.join(tempDir, "package.json"),
        JSON.stringify(packageJson),
      );
      await fs.writeFile(path.join(tempDir, "requirements.txt"), requirements);

      const deps = await parser.parseDependencies(tempDir);

      expect(deps).toContain("react");
      expect(deps).toContain("django");
    });
  });
});
