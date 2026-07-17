import { describe, expect, it } from "vitest";
import { detectChartRelations, detectRelations } from "../../lib/yi/relations";
import type { ChartRelation, PillarKey } from "../../lib/yi/types";

type InputPillar = { key: PillarKey; stem: string; branch: string };

function twoPillars(leftStem: string, leftBranch: string, rightStem: string, rightBranch: string): InputPillar[] {
  return [
    { key: "year", stem: leftStem, branch: leftBranch },
    { key: "day", stem: rightStem, branch: rightBranch },
  ];
}

function findType(result: ChartRelation[], type: ChartRelation["type"]) {
  return result.filter((relation) => relation.type === type);
}

describe("complete chart relationships", () => {
  it.each([
    ["甲", "己", "甲己相合"],
    ["乙", "庚", "乙庚相合"],
    ["丙", "辛", "丙辛相合"],
    ["丁", "壬", "丁壬相合"],
    ["戊", "癸", "戊癸相合"],
  ] as const)("finds the %s%s heavenly-stem combination", (left, right, label) => {
    const result = detectChartRelations(twoPillars(right, "辰", left, "午"));

    expect(findType(result, "stem-combination")).toEqual([
      { type: "stem-combination", pillars: ["year", "day"], symbols: [left, right], label },
    ]);
  });

  it.each([
    ["branch-combination", "子", "丑", "子丑相合"],
    ["branch-combination", "寅", "亥", "寅亥相合"],
    ["branch-combination", "卯", "戌", "卯戌相合"],
    ["branch-combination", "辰", "酉", "辰酉相合"],
    ["branch-combination", "巳", "申", "巳申相合"],
    ["branch-combination", "午", "未", "午未相合"],
    ["branch-clash", "子", "午", "子午相冲"],
    ["branch-clash", "丑", "未", "丑未相冲"],
    ["branch-clash", "寅", "申", "寅申相冲"],
    ["branch-clash", "卯", "酉", "卯酉相冲"],
    ["branch-clash", "辰", "戌", "辰戌相冲"],
    ["branch-clash", "巳", "亥", "巳亥相冲"],
    ["branch-harm", "子", "未", "子未相害"],
    ["branch-harm", "丑", "午", "丑午相害"],
    ["branch-harm", "寅", "巳", "寅巳相害"],
    ["branch-harm", "卯", "辰", "卯辰相害"],
    ["branch-harm", "申", "亥", "申亥相害"],
    ["branch-harm", "酉", "戌", "酉戌相害"],
    ["branch-break", "子", "酉", "子酉相破"],
    ["branch-break", "卯", "午", "卯午相破"],
    ["branch-break", "辰", "丑", "辰丑相破"],
    ["branch-break", "戌", "未", "戌未相破"],
    ["branch-break", "寅", "亥", "寅亥相破"],
    ["branch-break", "巳", "申", "巳申相破"],
    ["branch-punishment", "子", "卯", "子卯相刑"],
  ] as const)("finds %s for %s%s", (type, left, right, label) => {
    const result = detectChartRelations(twoPillars("甲", right, "己", left));

    expect(findType(result, type)).toContainEqual({
      type,
      pillars: ["year", "day"],
      symbols: [left, right],
      label,
    });
  });

  it.each([
    [["申", "子", "辰"], "水", ["辰", "申", "子"]],
    [["亥", "卯", "未"], "木", ["未", "亥", "卯"]],
    [["寅", "午", "戌"], "火", ["戌", "寅", "午"]],
    [["巳", "酉", "丑"], "金", ["丑", "巳", "酉"]],
  ] as const)("finds the %s three-branch trine", (canonical, element, chartOrder) => {
    const result = detectChartRelations(chartOrder.map((branch, index) => ({
      key: (["year", "month", "day"] as const)[index],
      stem: (["甲", "丙", "戊"] as const)[index],
      branch,
    })));

    expect(findType(result, "branch-trine")).toEqual([
      {
        type: "branch-trine",
        pillars: ["year", "month", "day"],
        symbols: [...canonical],
        label: `${canonical.join("")}三合${element}局`,
      },
    ]);
  });

  it.each([
    [["寅", "巳", "申"], ["申", "寅", "巳"], "寅巳申三刑"],
    [["丑", "戌", "未"], ["未", "丑", "戌"], "丑戌未三刑"],
  ] as const)("finds the %s three-branch punishment", (canonical, chartOrder, label) => {
    const result = detectChartRelations(chartOrder.map((branch, index) => ({
      key: (["year", "month", "day"] as const)[index],
      stem: (["甲", "丙", "戊"] as const)[index],
      branch,
    })));

    expect(findType(result, "branch-punishment")).toContainEqual({
      type: "branch-punishment",
      pillars: ["year", "month", "day"],
      symbols: [...canonical],
      label,
    });
  });

  it.each(["辰", "午", "酉", "亥"] as const)("finds repeated %s self-punishment once", (branch) => {
    const result = detectChartRelations([
      { key: "year", stem: "甲", branch },
      { key: "month", stem: "丙", branch },
      { key: "day", stem: "戊", branch: "子" },
    ]);

    expect(findType(result, "branch-punishment")).toEqual([
      {
        type: "branch-punishment",
        pillars: ["year", "month"],
        symbols: [branch, branch],
        label: `${branch}${branch}自刑`,
      },
    ]);
  });

  it("does not emit the same logical relation twice", () => {
    const result = detectChartRelations([
      { key: "year", stem: "甲", branch: "寅" },
      { key: "month", stem: "己", branch: "亥" },
      { key: "day", stem: "丙", branch: "午" },
      { key: "hour", stem: "辛", branch: "戌" },
    ]);
    const logicalKeys = result.map((relation) => `${relation.type}:${relation.pillars.join("-")}:${relation.symbols.join("")}`);

    expect(new Set(logicalKeys).size).toBe(result.length);
  });
});

describe("generic cross-layer relationships", () => {
  it("combines annual, decade and natal coordinates into a complete trine", () => {
    const result = detectRelations([
      { key: "annual", stem: "甲", branch: "子" },
      { key: "period", stem: "丙", branch: "申" },
      { key: "day", stem: "戊", branch: "辰" },
    ]);

    expect(result).toContainEqual({
      type: "branch-trine",
      coordinates: ["annual", "period", "day"],
      symbols: ["申", "子", "辰"],
      label: "申子辰三合水局",
    });
  });

  it("combines annual, decade and natal coordinates into a complete three-branch punishment", () => {
    const result = detectRelations([
      { key: "annual", stem: "甲", branch: "寅" },
      { key: "period", stem: "丙", branch: "巳" },
      { key: "month", stem: "戊", branch: "申" },
    ]);

    expect(result).toContainEqual({
      type: "branch-punishment",
      coordinates: ["annual", "period", "month"],
      symbols: ["寅", "巳", "申"],
      label: "寅巳申三刑",
    });
  });

  it("does not declare a trine when one required branch is absent", () => {
    const result = detectRelations([
      { key: "annual", stem: "甲", branch: "子" },
      { key: "period", stem: "丙", branch: "申" },
      { key: "day", stem: "戊", branch: "午" },
    ]);

    expect(result.some(relation => relation.type === "branch-trine")).toBe(false);
  });
});
