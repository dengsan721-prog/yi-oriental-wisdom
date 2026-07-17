import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { calculateCompatibility, classifyBranchRelation } from "../../lib/yi/compatibility";
import { calculateTenGod } from "../../lib/yi/fortune";
import { buildTraditionalReadings, calculateBoneWeight } from "../../lib/yi/traditions";

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

  it("calculates a known bone weight from lunar year month day and hour tables", () => {
    const input = { name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
    expect(calculateBoneWeight(input)).toMatchObject({ yearGanZhi: "庚午", totalQian: 38 });
  });

  it("keeps lunar-year bone weight separate from the Li Chun zodiac boundary", () => {
    const input = { name: "边界", date: "2024-02-05", time: "12:00", location: "北京", gender: "male", timeConfidence: "exact" } as const;
    const chart = calculateFourPillars(input);
    const readings = buildTraditionalReadings(chart, input);
    expect(calculateBoneWeight(input).yearGanZhi).toBe("癸卯");
    expect(readings.find(item => item.method === "生肖")?.subject).toContain("龙");
  });

  it("changes seven-layer content across zodiac and star-sign results and honors star boundary", () => {
    const a = { name: "甲", date: "1990-06-21", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
    const b = { ...a, date: "1990-06-22" } as const;
    const ar = buildTraditionalReadings(calculateFourPillars(a), a);
    const br = buildTraditionalReadings(calculateFourPillars(b), b);
    expect(ar.find(item => item.method === "星座")?.subject).toBe("双子座");
    expect(br.find(item => item.method === "星座")?.subject).toBe("巨蟹座");
    expect(ar.find(item => item.method === "星座")?.layers).not.toEqual(br.find(item => item.method === "星座")?.layers);
    expect(ar.find(item => item.method === "生肖")?.layers[1].observation).not.toBe(ar.find(item => item.method === "星座")?.layers[1].observation);
    const c = { ...a, date: "1991-06-21" } as const;
    const cr = buildTraditionalReadings(calculateFourPillars(c), c);
    expect(ar.find(item => item.method === "生肖")?.layers).not.toEqual(cr.find(item => item.method === "生肖")?.layers);
  });

  it.each([
    ["子", "丑", "合"], ["子", "午", "冲"], ["子", "未", "害"], ["寅", "巳", "刑"], ["子", "寅", undefined],
  ])("classifies %s-%s as %s", (left, right, expected) => {
    const relations = classifyBranchRelation(left, right);
    if (expected) expect(relations).toContain(expected);
    else expect(relations).toEqual([]);
  });
});
