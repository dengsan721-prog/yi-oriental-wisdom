import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { calculateCompatibility, classifyBranchRelation } from "../../lib/yi/compatibility";
import { calculateTenGod } from "../../lib/yi/fortune";

const first = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
const second = calculateFourPillars({ name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "unspecified", timeConfidence: "exact" });

describe("compatibility", () => {
  function withBranches(source: typeof first, branches: [string, string, string, string]) {
    const keys = ["year", "month", "day", "hour"] as const;
    return {
      ...source,
      pillars: Object.fromEntries(keys.map((key, index) => [key, { ...source.pillars[key]!, branch: branches[index] }])) as typeof source.pillars,
    };
  }

  it.each(["partner", "parent-child", "business", "friend"] as const)("does not reduce %s compatibility to a single score", (relationship) => {
    const result = calculateCompatibility(first, second, relationship);
    expect(result).not.toHaveProperty("score");
    expect(result).toMatchObject({ relationship, elementDynamics: expect.any(Array), tenGodDynamics: expect.any(Array), combinationsAndClashes: expect.any(Array), communicationScenario: expect.any(String), actionRules: expect.any(Array), limitations: expect.any(Array) });
  });

  it("reports directional evidence for both people", () => {
    const result = calculateCompatibility(first, second, "partner");
    expect(result.tenGodDynamics.map((item) => item.direction)).toEqual(expect.arrayContaining(["A→B", "B→A"]));
    expect(result.tenGodDynamics[0].theme).toBe(calculateTenGod(first.pillars.day.stem, second.pillars.day.stem));
    expect(result.tenGodDynamics[1].theme).toBe(calculateTenGod(second.pillars.day.stem, first.pillars.day.stem));
  });

  it("uses dedicated business governance rules", () => {
    const result = calculateCompatibility(first, second, "business");
    expect(result.actionRules.join(" ")).toMatch(/投资|成本审批/);
    expect(result.actionRules.join(" ")).toMatch(/利润.*亏损/);
    expect(result.actionRules.join(" ")).toMatch(/权限/);
    expect(result.actionRules.join(" ")).toMatch(/暂停/);
    expect(result.actionRules.join(" ")).toMatch(/退出/);
    expect(result.actionRules.join(" ")).toMatch(/文档交接/);
  });

  it.each([
    ["合", "子", "丑"],
    ["冲", "子", "午"],
    ["害", "子", "未"],
    ["刑", "寅", "巳"],
  ])("returns a structured %s relation through calculateCompatibility", (relation, left, right) => {
    const result = calculateCompatibility(withBranches(first, [left, left, left, left]), withBranches(second, [right, right, right, right]), "partner");
    expect(result.combinationsAndClashes).toEqual(expect.arrayContaining([
      expect.objectContaining({ symbols: [left, right], relation, observation: expect.any(String) }),
    ]));
  });

  it("returns the structured no-direct-relation fallback through calculateCompatibility", () => {
    const result = calculateCompatibility(withBranches(first, ["子", "子", "子", "子"]), withBranches(second, ["寅", "寅", "寅", "寅"]), "friend");
    expect(result.combinationsAndClashes).toEqual([{ symbols: ["子", "寅"], relation: "无直接合冲刑害", observation: expect.any(String) }]);
  });
});

describe("branch relation coverage", () => {
  it("includes branch punishment and harm in cross-chart relations", () => {
    expect(classifyBranchRelation("子", "未")).toContain("害");
    expect(classifyBranchRelation("寅", "巳")).toContain("刑");
  });

  it.each([
    ["子", "丑", "合"], ["子", "午", "冲"], ["子", "未", "害"], ["寅", "巳", "刑"], ["子", "寅", undefined],
  ])("classifies %s-%s as %s", (left, right, expected) => {
    const relations = classifyBranchRelation(left, right);
    if (expected) expect(relations).toContain(expected);
    else expect(relations).toEqual([]);
  });
});
