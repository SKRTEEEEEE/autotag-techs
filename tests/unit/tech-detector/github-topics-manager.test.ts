import type { Octokit } from "@octokit/rest";
import type { Logger } from "@/src/logger/logger";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GitHubTopicsManager } from "@/src/tech-detector/github-topics-manager";

describe("GitHubTopicsManager", () => {
  let mockLogger: Logger;
  let mockOctokit: Octokit;
  let topicsManager: GitHubTopicsManager;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    mockOctokit = {
      rest: {
        repos: {
          getAllTopics: vi.fn(),
          replaceAllTopics: vi.fn(),
        },
      },
    } as unknown as Octokit;

    topicsManager = new GitHubTopicsManager(
      mockOctokit,
      "test-owner",
      "test-repo",
      mockLogger,
    );
  });

  describe("updateTopics", () => {
    it("should merge and update topics successfully", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["javascript", "typescript"] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockResolvedValue(
        {} as never,
      );

      await topicsManager.updateTopics(["react", "nextjs"]);

      expect(mockOctokit.rest.repos.replaceAllTopics).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        names: ["javascript", "typescript", "react", "nextjs"],
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Topics updated successfully"),
      );
    });

    it("should handle empty current topics", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: [] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockResolvedValue(
        {} as never,
      );

      await topicsManager.updateTopics(["react", "nextjs"]);

      expect(mockOctokit.rest.repos.replaceAllTopics).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        names: ["react", "nextjs"],
      });
    });

    it("should not add duplicate topics", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["react", "typescript"] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockResolvedValue(
        {} as never,
      );

      await topicsManager.updateTopics(["react", "nextjs"]);

      expect(mockOctokit.rest.repos.replaceAllTopics).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        names: ["react", "typescript", "nextjs"],
      });
    });

    it("should truncate topics when exceeding maximum of 20", async () => {
      const currentTopics = Array.from({ length: 15 }, (_, i) => `tech${i}`);

      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: currentTopics },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockResolvedValue(
        {} as never,
      );

      const newTopics = Array.from({ length: 10 }, (_, i) => `new-tech${i}`);
      await topicsManager.updateTopics(newTopics);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Topics exceed maximum of 20"),
      );

      const call = vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mock
        .calls[0];
      expect(call[0]?.names.length).toBe(20);
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["javascript"] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockRejectedValue(
        new Error("API Error"),
      );

      await expect(
        topicsManager.updateTopics(["react"]),
      ).resolves.not.toThrow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Could not update repository topics"),
      );
    });
  });

  describe("removeTopics", () => {
    it("should remove specified topics", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["javascript", "typescript", "react", "nextjs"] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockResolvedValue(
        {} as never,
      );

      await topicsManager.removeTopics(["react", "nextjs"]);

      expect(mockOctokit.rest.repos.replaceAllTopics).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        names: ["javascript", "typescript"],
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Successfully removed topics"),
      );
    });

    it("should handle case-insensitive removal", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["JavaScript", "TypeScript", "React"] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockResolvedValue(
        {} as never,
      );

      await topicsManager.removeTopics(["react"]);

      expect(mockOctokit.rest.repos.replaceAllTopics).toHaveBeenCalledWith({
        owner: "test-owner",
        repo: "test-repo",
        names: ["JavaScript", "TypeScript"],
      });
    });

    it("should skip when no topics to remove", async () => {
      await topicsManager.removeTopics([]);

      expect(mockOctokit.rest.repos.getAllTopics).not.toHaveBeenCalled();
      expect(mockOctokit.rest.repos.replaceAllTopics).not.toHaveBeenCalled();
    });

    it("should skip when no topics match removal list", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["javascript", "typescript"] },
      } as never);

      await topicsManager.removeTopics(["react", "nextjs"]);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("No topics were removed"),
      );
      expect(mockOctokit.rest.repos.replaceAllTopics).not.toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(mockOctokit.rest.repos.getAllTopics).mockResolvedValue({
        data: { names: ["javascript", "react"] },
      } as never);

      vi.mocked(mockOctokit.rest.repos.replaceAllTopics).mockRejectedValue(
        new Error("API Error"),
      );

      await expect(
        topicsManager.removeTopics(["react"]),
      ).resolves.not.toThrow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Could not remove repository topics"),
      );
    });
  });
});
