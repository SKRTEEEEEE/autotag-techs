import type { Octokit } from "@octokit/rest";
import type { Logger } from "@/src/logger/logger";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TechsStorage } from "@/src/tech-detector/techs-storage";

describe("TechsStorage", () => {
  const testRepoPath = path.join(process.cwd(), ".test-techs-storage-temp");
  const techsJsonPath = path.join(testRepoPath, ".github", "techs.json");

  let mockLogger: Logger;
  let techsStorage: TechsStorage;

  beforeEach(async () => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    await mkdir(path.dirname(techsJsonPath), { recursive: true });
    techsStorage = new TechsStorage(testRepoPath, mockLogger);
  });

  afterEach(async () => {
    await rm(testRepoPath, { recursive: true, force: true });
  });

  describe("loadTechs", () => {
    it("should load existing techs.json file", async () => {
      const mockData = {
        user: ["react", "typescript"],
        "15-12-2025-14": ["nextjs"],
      };

      await writeFile(techsJsonPath, JSON.stringify(mockData), "utf8");

      const result = await techsStorage.loadTechs();

      expect(result).toEqual(mockData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Loaded existing techs.json"),
      );
    });

    it("should return default structure when techs.json does not exist", async () => {
      const result = await techsStorage.loadTechs();

      expect(result).toEqual({ user: [] });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("techs.json not found or invalid"),
      );
    });

    it("should ensure user field exists when loading", async () => {
      const mockDataWithoutUser = {
        "15-12-2025-14": ["nextjs"],
      };

      await writeFile(
        techsJsonPath,
        JSON.stringify(mockDataWithoutUser),
        "utf8",
      );

      const result = await techsStorage.loadTechs();

      expect(result.user).toEqual([]);
    });
  });

  describe("saveTechs", () => {
    it("should save techs.json with proper formatting", async () => {
      const techsData = {
        user: ["react"],
        "15-12-2025-14": ["typescript"],
      };

      await techsStorage.saveTechs(techsData);

      const savedContent = await readFile(techsJsonPath, "utf8");
      const parsed = JSON.parse(savedContent) as typeof techsData;

      expect(parsed).toEqual(techsData);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Saved techs.json"),
      );
    });

    it("should create .github directory if it does not exist", async () => {
      await rm(path.dirname(techsJsonPath), { recursive: true, force: true });

      const techsData = { user: ["react"] };
      await techsStorage.saveTechs(techsData);

      const savedContent = await readFile(techsJsonPath, "utf8");
      expect(JSON.parse(savedContent)).toEqual(techsData);
    });
  });

  describe("addNewTechs", () => {
    it("should add new technologies to techs.json", async () => {
      const initialData = {
        user: ["react"],
        "15-12-2025-14": ["typescript"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      await techsStorage.addNewTechs(["nextjs", "tailwindcss"]);

      const result = await techsStorage.loadTechs();
      const allTechs = techsStorage.getAllTechs(result);

      expect(allTechs.has("nextjs")).toBe(true);
      expect(allTechs.has("tailwindcss")).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Added 2 new technologies"),
      );
    });

    it("should not add duplicate technologies", async () => {
      const initialData = {
        user: [],
        "15-12-2025-14": ["react", "typescript"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      await techsStorage.addNewTechs(["react", "typescript", "nextjs"]);

      const result = await techsStorage.loadTechs();
      const allTechs = techsStorage.getAllTechs(result);

      expect(allTechs.has("nextjs")).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Added 1 new"),
      );
    });

    it("should handle empty array of new techs", async () => {
      await techsStorage.addNewTechs([]);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("No new technologies to add"),
      );
    });
  });

  describe("removeTechs", () => {
    it("should remove technologies from timestamp entries", async () => {
      const initialData = {
        user: ["react"],
        "15-12-2025-14": ["typescript", "nextjs"],
        "16-12-2025-15": ["tailwindcss"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      await techsStorage.removeTechs(["typescript", "tailwindcss"]);

      const result = await techsStorage.loadTechs();
      const allTechs = techsStorage.getAllTechs(result);

      expect(allTechs.has("typescript")).toBe(false);
      expect(allTechs.has("tailwindcss")).toBe(false);
      expect(allTechs.has("nextjs")).toBe(true);
      expect(allTechs.has("react")).toBe(true); // user techs not removed
    });

    it("should not remove technologies from user array", async () => {
      const initialData = {
        user: ["react", "typescript"],
        "15-12-2025-14": ["nextjs"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      await techsStorage.removeTechs(["react"]);

      const result = await techsStorage.loadTechs();

      expect(result.user).toContain("react");
    });

    it("should remove empty timestamp entries after removal", async () => {
      const initialData = {
        user: [],
        "15-12-2025-14": ["typescript"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      await techsStorage.removeTechs(["typescript"]);

      const result = await techsStorage.loadTechs();

      expect(result["15-12-2025-14"]).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Removed empty timestamp entry"),
      );
    });
  });

  describe("updateTimestamps", () => {
    it("should consolidate all techs under current timestamp", async () => {
      const initialData = {
        user: ["react"],
        "15-12-2025-14": ["typescript"],
        "16-12-2025-15": ["nextjs"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      await techsStorage.updateTimestamps();

      const result = await techsStorage.loadTechs();
      const timestamps = Object.keys(result).filter(k => k !== "user");

      expect(timestamps.length).toBe(1);
      expect(result.user).toEqual(["react"]);

      const newTimestamp = timestamps[0];
      expect(result[newTimestamp]).toContain("typescript");
      expect(result[newTimestamp]).toContain("nextjs");
    });
  });

  describe("hasTech", () => {
    it("should return true if tech exists", async () => {
      const initialData = {
        user: ["react"],
        "15-12-2025-14": ["typescript"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      expect(await techsStorage.hasTech("react")).toBe(true);
      expect(await techsStorage.hasTech("typescript")).toBe(true);
    });

    it("should return false if tech does not exist", async () => {
      const initialData = {
        user: ["react"],
      };

      await writeFile(techsJsonPath, JSON.stringify(initialData), "utf8");

      expect(await techsStorage.hasTech("angular")).toBe(false);
    });
  });

  describe("getAllTechs", () => {
    it("should return all techs including user techs", () => {
      const techs = {
        user: ["react", "typescript"],
        "15-12-2025-14": ["nextjs"],
        "16-12-2025-15": ["tailwindcss"],
      };

      const result = techsStorage.getAllTechs(techs);

      expect(result.size).toBe(4);
      expect(result.has("react")).toBe(true);
      expect(result.has("typescript")).toBe(true);
      expect(result.has("nextjs")).toBe(true);
      expect(result.has("tailwindcss")).toBe(true);
    });

    it("should exclude user techs when excludeUser is true", () => {
      const techs = {
        user: ["react", "typescript"],
        "15-12-2025-14": ["nextjs"],
      };

      const result = techsStorage.getAllTechs(techs, true);

      expect(result.size).toBe(1);
      expect(result.has("react")).toBe(false);
      expect(result.has("typescript")).toBe(false);
      expect(result.has("nextjs")).toBe(true);
    });
  });

  describe("getUserTechs", () => {
    it("should return only user-defined techs", () => {
      const techs = {
        user: ["react", "typescript"],
        "15-12-2025-14": ["nextjs"],
      };

      const result = techsStorage.getUserTechs(techs);

      expect(result).toEqual(["react", "typescript"]);
    });
  });

  describe("normalizeToBadge", () => {
    it("should normalize dots to dashes", () => {
      expect(techsStorage.normalizeToBadge("Next.js")).toBe("next-js");
      expect(techsStorage.normalizeToBadge(".NET")).toBe("net");
    });

    it("should handle scoped packages correctly", () => {
      expect(techsStorage.normalizeToBadge("@types/react")).toBe("react");
      expect(techsStorage.normalizeToBadge("@babel/core")).toBe("core");
    });

    it("should handle node-red packages", () => {
      expect(techsStorage.normalizeToBadge("node-red-dashboard")).toBe(
        "node-red",
      );
      expect(techsStorage.normalizeToBadge("node-red-contrib-s7")).toBe(
        "node-red",
      );
    });

    it("should convert to lowercase and replace special chars", () => {
      expect(techsStorage.normalizeToBadge("React+Native")).toBe(
        "react-native",
      );
      expect(techsStorage.normalizeToBadge("C++")).toBe("c");
      expect(techsStorage.normalizeToBadge("C#")).toBe("c");
    });

    it("should collapse multiple dashes", () => {
      expect(techsStorage.normalizeToBadge("some---tech")).toBe("some-tech");
    });

    it("should handle empty result", () => {
      expect(techsStorage.normalizeToBadge("...")).toBe("unknown");
    });
  });

  describe("commitAndPushTechs", () => {
    it("should skip commit when octokit is not available", async () => {
      await techsStorage.commitAndPushTechs();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Skipping GitHub API commit"),
      );
    });

    it("should commit changes when content differs", async () => {
      const mockOctokit = {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              sha: "abc123",
              content: Buffer.from('{"user":[]}').toString("base64"),
            },
          }),
          createOrUpdateFileContents: vi.fn().mockResolvedValue({}),
        },
      } as unknown as Octokit;

      const techsStorageWithOctokit = new TechsStorage(
        testRepoPath,
        mockLogger,
        mockOctokit,
        "test-owner",
        "test-repo",
      );

      await techsStorageWithOctokit.saveTechs({
        user: ["react"],
      });

      await techsStorageWithOctokit.commitAndPushTechs();

      expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "test-owner",
          repo: "test-repo",
          path: ".github/techs.json",
          message: "chore: update techs.json with detected technologies",
          committer: {
            name: "github-actions[bot]",
            email: "41898282+github-actions[bot]@users.noreply.github.com",
          },
          author: {
            name: "github-actions[bot]",
            email: "41898282+github-actions[bot]@users.noreply.github.com",
          },
        }),
      );
    });

    it("should skip commit when content is unchanged", async () => {
      const techsData = { user: ["react"] };
      const content = JSON.stringify(techsData, undefined, 2);

      const mockOctokit = {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              sha: "abc123",
              content: Buffer.from(content).toString("base64"),
            },
          }),
          createOrUpdateFileContents: vi.fn(),
        },
      } as unknown as Octokit;

      const techsStorageWithOctokit = new TechsStorage(
        testRepoPath,
        mockLogger,
        mockOctokit,
        "test-owner",
        "test-repo",
      );

      await techsStorageWithOctokit.saveTechs(techsData);
      await techsStorageWithOctokit.commitAndPushTechs();

      expect(
        mockOctokit.repos.createOrUpdateFileContents,
      ).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("content unchanged"),
      );
    });
  });
});
