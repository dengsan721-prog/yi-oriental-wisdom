import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildFortuneTimeline, calculateTenGod } from "../../lib/yi/fortune";
import { matchAnimalArchetype, matchHistoricalMirror } from "../../lib/yi/mirrors";

const input = { name: "林知远", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
const chart = calculateFourPillars(input);

describe("fortune timeline", () => {
  it("distinguishes all ten gods by element and polarity", () => {
    expect(["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].map(stem => calculateTenGod("甲", stem))).toEqual(["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"]);
  });
  it("builds selectable decades with traceable yearly readings", () => {
    const timeline = buildFortuneTimeline(chart, input);
    expect(timeline.length).toBeGreaterThanOrEqual(8);
    expect(timeline[0]).toMatchObject({ stemBranch: expect.any(String), startAge: expect.any(Number), startYear: expect.any(Number), tenGod: expect.any(String), theme: expect.any(String), years: expect.any(Array) });
    expect(timeline[0].years).toHaveLength(10);
    expect(timeline[0].years[0]).toMatchObject({ age: expect.any(Number), year: expect.any(Number), stemBranch: expect.any(String), basis: expect.any(String), action: expect.any(String) });
    expect(timeline[0].method.basis).toContain("lunar-typescript");
  });

  it("marks hour-dependent claims as limited when time is unknown", () => {
    const unknownInput = { ...input, time: null, timeConfidence: "unknown" } as const;
    const unknown = calculateFourPillars(unknownInput);
    expect(buildFortuneTimeline(unknown, unknownInput)[0].confidence).toBe("limited");
  });

  it("does not invent direction when gender is unspecified", () => {
    const unspecified = { ...input, gender: "unspecified" } as const;
    expect(buildFortuneTimeline(calculateFourPillars(unspecified), unspecified)).toEqual([]);
  });
});

describe("auditable mirrors", () => {
  it("explains explicit animal mapping without a derogatory label", () => {
    expect(matchAnimalArchetype(chart)).toMatchObject({ name: expect.any(String), basis: expect.stringContaining("映射"), mappedFeatures: expect.any(Array), pressurePattern: expect.any(String), action: expect.any(String) });
  });

  it("limits a sourced historical mirror to one dimension", () => {
    expect(matchHistoricalMirror(chart)).toMatchObject({ person: expect.any(String), dimension: expect.any(String), basis: expect.any(String), source: expect.any(String), reliability: expect.stringMatching(/high|medium|contextual/), caution: expect.stringContaining("命运") });
  });
});
