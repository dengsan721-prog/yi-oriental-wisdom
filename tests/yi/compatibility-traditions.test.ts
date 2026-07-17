import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { calculateCompatibility, classifyBranchRelation } from "../../lib/yi/compatibility";
import { buildTraditionalReadings } from "../../lib/yi/traditions";

const first = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
const second = calculateFourPillars({ name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "unspecified", timeConfidence: "exact" });

describe("compatibility", () => {
  it.each(["partner", "parent-child", "business", "friend"] as const)("does not reduce %s compatibility to a single score", (relationship) => {
    const result = calculateCompatibility(first, second, relationship);
    expect(result).not.toHaveProperty("score");
    expect(result).toMatchObject({ relationship, elementDynamics: expect.any(Array), tenGodDynamics: expect.any(Array), combinationsAndClashes: expect.any(Array), communicationScenario: expect.any(String), actionRules: expect.any(Array), limitations: expect.any(Array) });
  });

  it("reports directional evidence for both people", () => {
    const result = calculateCompatibility(first, second, "partner");
    expect(result.tenGodDynamics.map((item) => item.direction)).toEqual(expect.arrayContaining(["A→B", "B→A"]));
  });
});

describe("traditional readings", () => {
  it("builds seven layers for each auxiliary method and compares every layer to the main chart", () => {
    const input = { name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
    const readings = buildTraditionalReadings(first, input);
    expect(readings.map((item) => item.method)).toEqual(["称骨", "生肖", "星座"]);
    readings.forEach((reading) => {
      expect(reading.role).toContain("辅助");
      expect(reading.subject).toBeTruthy();
      expect(reading.layers).toHaveLength(7);
      reading.layers.forEach((layer) => expect(layer).toMatchObject({ title: expect.any(String), observation: expect.any(String), mainChartComparison: expect.any(String), confidence: expect.any(String), source: expect.any(String) }));
    });
  });

  it("does not claim a bone weight when birth hour is unknown", () => {
    const input = { name: "甲", date: "1990-06-15", time: null, location: "杭州", gender: "male", timeConfidence: "unknown" } as const;
    const reading = buildTraditionalReadings(calculateFourPillars(input), input).find(item => item.method === "称骨")!;
    expect(reading.available).toBe(false);
    expect(reading.subject).toContain("无法完成");
  });

  it("includes branch punishment and harm in cross-chart relations", () => {
    expect(classifyBranchRelation("子", "未")).toContain("害");
    expect(classifyBranchRelation("寅", "巳")).toContain("刑");
  });
});
