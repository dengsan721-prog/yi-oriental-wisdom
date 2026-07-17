import { describe, expect, it } from "vitest";
import { buildInterpretation } from "../../lib/yi/interpret";
import type { FourPillarsResult } from "../../lib/yi/types";

const fixture = {
  confidence: "high",
  disclaimer: "文化参考",
  pillars: {},
  elementCounts: { 木: 2, 火: 2, 土: 2, 金: 1, 水: 1 },
} as unknown as FourPillarsResult;

describe("buildInterpretation", () => {
  it("provides all five explanation layers", () => {
    const card = buildInterpretation(fixture)[0];
    expect(card).toMatchObject({
      professionalBasis: expect.any(String),
      story: expect.any(String),
      realityCheck: expect.any(String),
      action: expect.any(String),
      counterCondition: expect.any(String),
    });
  });

  it("contains no deterministic or blame language", () => {
    expect(JSON.stringify(buildInterpretation(fixture))).not.toMatch(/注定|必然|克夫|克妻|克子|必有一劫/);
  });
});
