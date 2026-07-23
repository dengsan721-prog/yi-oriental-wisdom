import { describe, expect, it } from "vitest";
import { NA_YIN_RULE_METADATA } from "../../lib/yi/na-yin";
import {
  TWELVE_GROWTH_RULE_METADATA,
  getTwelveGrowthStage,
  type TwelveGrowthStage,
} from "../../lib/yi/twelve-growth";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const STAGES = [
  "长生", "沐浴", "冠带", "临官", "帝旺", "衰",
  "病", "死", "墓", "绝", "胎", "养",
] as const satisfies readonly TwelveGrowthStage[];
const EXPECTED_MATRIX: Readonly<Record<typeof STEMS[number], readonly TwelveGrowthStage[]>> = {
  甲: ["沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养", "长生"],
  乙: ["病", "衰", "帝旺", "临官", "冠带", "沐浴", "长生", "养", "胎", "绝", "墓", "死"],
  丙: ["胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝"],
  丁: ["绝", "墓", "死", "病", "衰", "帝旺", "临官", "冠带", "沐浴", "长生", "养", "胎"],
  戊: ["胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝"],
  己: ["绝", "墓", "死", "病", "衰", "帝旺", "临官", "冠带", "沐浴", "长生", "养", "胎"],
  庚: ["死", "墓", "绝", "胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病"],
  辛: ["长生", "养", "胎", "绝", "墓", "死", "病", "衰", "帝旺", "临官", "冠带", "沐浴"],
  壬: ["帝旺", "衰", "病", "死", "墓", "绝", "胎", "养", "长生", "沐浴", "冠带", "临官"],
  癸: ["临官", "冠带", "沐浴", "长生", "养", "胎", "绝", "墓", "死", "病", "衰", "帝旺"],
};

function assertDeepFrozen(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) assertDeepFrozen(child);
}

describe("verified twelve-growth lookup", () => {
  it("matches the complete ten-stem by twelve-branch adopted matrix", () => {
    for (const stem of STEMS) {
      expect(
        BRANCHES.map(branch => getTwelveGrowthStage(stem, branch)),
        stem,
      ).toEqual(EXPECTED_MATRIX[stem]);
    }
  });

  it("produces every stage exactly once for each stem and preserves all ten starts", () => {
    const starts = {
      甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅",
      己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯",
    } as const;

    for (const stem of STEMS) {
      const values = BRANCHES.map(branch => getTwelveGrowthStage(stem, branch));
      expect(new Set(values), stem).toEqual(new Set(STAGES));
      expect(getTwelveGrowthStage(stem, starts[stem]), stem).toBe("长生");
    }
    expect(getTwelveGrowthStage("甲", "卯")).toBe("帝旺");
    expect(getTwelveGrowthStage("乙", "寅")).toBe("帝旺");
  });

  it("rejects malformed inputs instead of normalizing them", () => {
    for (const [stem, branch] of [
      ["", "子"],
      ["甲", ""],
      ["甲木", "亥"],
      ["甲", "亥时"],
      [" 甲", "亥"],
      ["甲", "亥 "],
      ["A", "亥"],
      ["甲", "A"],
    ]) {
      expect(getTwelveGrowthStage(stem, branch), `${stem}|${branch}`).toBeNull();
    }
  });

  it("uses a separate deep-frozen witness for the adopted convention without claiming human review", () => {
    expect(TWELVE_GROWTH_RULE_METADATA).toMatchObject({
      sourceId: "classic.san-ming-tong-hui.twelve-growth.v1",
      workingTextUrl: "https://ctext.org/wiki.pl?chapter=17423&if=gb&remap=gb",
      isbnOrCatalogId: "NLC data_416,13jh000156,94145",
      independentWitnessUrl: "https://commons.wikimedia.org/wiki/File:NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf",
      reviewStatus: "source-cross-checked-awaiting-human",
      humanReviewerId: null,
    });
    for (const field of [
      "workingTextLocator",
      "adoptedEdition",
      "pageOrImageLocator",
      "independentEditionCheck",
      "adoptedConvention",
    ] as const) {
      expect(TWELVE_GROWTH_RULE_METADATA[field].trim(), field).not.toBe("");
    }
    expect(TWELVE_GROWTH_RULE_METADATA.pageOrImageLocator)
      .toMatch(/80.*84.*卷二.*2.*6/);
    expect(TWELVE_GROWTH_RULE_METADATA.adoptedConvention)
      .toMatch(/阳干顺.*阴干逆.*戊随丙.*己随丁/);
    expect(TWELVE_GROWTH_RULE_METADATA.variantDecisions).toMatchObject({
      阴阳顺逆: expect.stringMatching(/阳干顺.*阴干逆/),
      土的寄生口径: expect.stringMatching(/戊随丙.*己随丁/),
      异说边界: expect.any(String),
    });
    expect(TWELVE_GROWTH_RULE_METADATA).not.toHaveProperty("reviewedAt");
    expect(TWELVE_GROWTH_RULE_METADATA.sourceId)
      .not.toBe(NA_YIN_RULE_METADATA.sourceId);
    expect(TWELVE_GROWTH_RULE_METADATA.workingTextLocator)
      .not.toBe(NA_YIN_RULE_METADATA.workingTextLocator);
    expect(TWELVE_GROWTH_RULE_METADATA.pageOrImageLocator)
      .not.toBe(NA_YIN_RULE_METADATA.pageOrImageLocator);
    assertDeepFrozen(TWELVE_GROWTH_RULE_METADATA);
  });
});
