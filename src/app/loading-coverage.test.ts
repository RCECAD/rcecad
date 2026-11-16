import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function findPageDirectories(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findPageDirectories(path);
    return entry.name === "page.tsx" ? [directory] : [];
  });
}

describe("route loading coverage", () => {
  it("provides a loading boundary for every page segment", () => {
    const pagesWithoutLoading = findPageDirectories("src/app").filter(
      (directory) => !existsSync(join(directory, "loading.tsx")),
    );

    expect(pagesWithoutLoading).toEqual([]);
  });
});
