import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canonicalizeJson } from "../../lib/yi/dao-note-corpus";
import {
  buildStoryGoldenArtifact,
  STORY_GOLDEN_CASES,
} from "../fixtures/yi/story-golden-cases";

const GOLDEN_DIRECTORY = fileURLToPath(
  new URL("../fixtures/yi/story-goldens/", import.meta.url),
);
const ALLOWED_FILENAMES = new Set(
  STORY_GOLDEN_CASES.map(goldenCase => `${goldenCase.id}.json`),
);

function expectedFile(goldenCase: typeof STORY_GOLDEN_CASES[number]): string {
  return `${canonicalizeJson(buildStoryGoldenArtifact(goldenCase))}\n`;
}

describe("story golden fixture generation", () => {
  it("writes only with explicit opt-in and otherwise proves zero drift", () => {
    const writeMode = process.env.YI_WRITE_STORY_GOLDENS === "1";
    if (writeMode) mkdirSync(GOLDEN_DIRECTORY, { recursive: true });

    for (const goldenCase of STORY_GOLDEN_CASES) {
      const filename = `${goldenCase.id}.json`;
      expect(ALLOWED_FILENAMES.has(filename)).toBe(true);
      const path = join(GOLDEN_DIRECTORY, filename);
      const expected = expectedFile(goldenCase);

      if (writeMode) {
        writeFileSync(path, expected, { encoding: "utf8", flag: "w" });
      } else {
        expect(readFileSync(path, "utf8"), filename).toBe(expected);
      }
    }

    expect(ALLOWED_FILENAMES.size).toBe(8);
  });
});
