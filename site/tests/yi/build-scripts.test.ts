import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  scripts: Record<string, string>;
};

describe("cross-platform release scripts", () => {
  it("avoids POSIX-only environment assignment and unavailable npm chaining", () => {
    for (const name of ["dev", "build", "start"] as const) {
      expect(packageJson.scripts[name]).not.toMatch(/^[A-Z_]+=\S+\s/);
    }
    for (const name of ["build:github", "test:github", "test:rendered"] as const) {
      expect(packageJson.scripts[name]).not.toMatch(/\bnpm\s+run\b/);
    }
  });
});
