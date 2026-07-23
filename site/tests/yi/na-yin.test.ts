import { describe, expect, it } from "vitest";
import {
  NA_YIN_RULE_METADATA,
  getNaYin,
} from "../../lib/yi/na-yin";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const NA_YIN_PAIRS = [
  ["甲子", "乙丑", "海中金"], ["丙寅", "丁卯", "炉中火"],
  ["戊辰", "己巳", "大林木"], ["庚午", "辛未", "路旁土"],
  ["壬申", "癸酉", "剑锋金"], ["甲戌", "乙亥", "山头火"],
  ["丙子", "丁丑", "涧下水"], ["戊寅", "己卯", "城头土"],
  ["庚辰", "辛巳", "白蜡金"], ["壬午", "癸未", "杨柳木"],
  ["甲申", "乙酉", "泉中水"], ["丙戌", "丁亥", "屋上土"],
  ["戊子", "己丑", "霹雳火"], ["庚寅", "辛卯", "松柏木"],
  ["壬辰", "癸巳", "长流水"], ["甲午", "乙未", "沙中金"],
  ["丙申", "丁酉", "山下火"], ["戊戌", "己亥", "平地木"],
  ["庚子", "辛丑", "壁上土"], ["壬寅", "癸卯", "金箔金"],
  ["甲辰", "乙巳", "覆灯火"], ["丙午", "丁未", "天河水"],
  ["戊申", "己酉", "大驿土"], ["庚戌", "辛亥", "钗钏金"],
  ["壬子", "癸丑", "桑柘木"], ["甲寅", "乙卯", "大溪水"],
  ["丙辰", "丁巳", "沙中土"], ["戊午", "己未", "天上火"],
  ["庚申", "辛酉", "石榴木"], ["壬戌", "癸亥", "大海水"],
] as const;

function assertDeepFrozen(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) assertDeepFrozen(child);
}

describe("verified Na Yin lookup", () => {
  it("resolves all sixty sexagenary pairs to the adopted thirty labels", () => {
    const resolved = NA_YIN_PAIRS.flatMap(([first, second, label]) => [
      [first, label],
      [second, label],
    ] as const);

    expect(resolved).toHaveLength(60);
    for (const [pillar, label] of resolved) {
      expect(getNaYin(pillar[0], pillar[1]), pillar).toBe(label);
    }
    expect(new Set(resolved.map(([, label]) => label))).toHaveLength(30);
  });

  it("returns values for exactly sixty of the 120 stem-branch combinations", () => {
    const valid = new Set<string>(
      NA_YIN_PAIRS.flatMap(([first, second]) => [first, second]),
    );
    const resolved: string[] = [];

    for (const stem of STEMS) {
      for (const branch of BRANCHES) {
        const pillar = `${stem}${branch}`;
        const value = getNaYin(stem, branch);
        if (valid.has(pillar)) {
          expect(value, pillar).not.toBeNull();
          resolved.push(pillar);
        } else {
          expect(value, pillar).toBeNull();
        }
      }
    }

    expect(resolved).toHaveLength(60);
  });

  it("rejects malformed or normalized-looking inputs instead of guessing", () => {
    for (const [stem, branch] of [
      ["", "子"],
      ["甲", ""],
      ["甲子", ""],
      ["甲", "子时"],
      [" 甲", "子"],
      ["甲", "子 "],
      ["A", "子"],
      ["甲", "A"],
    ]) {
      expect(getNaYin(stem, branch), `${stem}|${branch}`).toBeNull();
    }
  });

  it("keeps a deep-frozen, independently located, honestly reviewed source record", () => {
    expect(NA_YIN_RULE_METADATA).toMatchObject({
      sourceId: "classic.san-ming-tong-hui.na-yin.v1",
      workingTextUrl: "https://ctext.org/wiki.pl?chapter=926860&if=gb&remap=gb",
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
      expect(NA_YIN_RULE_METADATA[field].trim(), field).not.toBe("");
    }
    expect(NA_YIN_RULE_METADATA.pageOrImageLocator).toMatch(/34.*38.*卷一.*18.*22/);
    expect(NA_YIN_RULE_METADATA.independentEditionCheck).toMatch(/30组|60/);
    expect(NA_YIN_RULE_METADATA).not.toHaveProperty("reviewedAt");

    for (const variant of [
      "沙中金/砂中金",
      "覆灯火/佛灯火",
      "金泊金/金箔金",
      "白鑞金/白蜡金",
      "井泉水/泉中水",
      "路傍土/路旁土",
      "通用繁简",
    ]) {
      expect(NA_YIN_RULE_METADATA.variantDecisions[variant]?.trim(), variant)
        .not.toBe("");
    }
    assertDeepFrozen(NA_YIN_RULE_METADATA);
  });
});
