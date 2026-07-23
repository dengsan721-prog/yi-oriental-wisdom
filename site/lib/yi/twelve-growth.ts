import type { ReviewedChartRuleMetadata } from "./na-yin";
import { branches, stems } from "./stems-branches";

export type TwelveGrowthStage =
  | "长生"
  | "沐浴"
  | "冠带"
  | "临官"
  | "帝旺"
  | "衰"
  | "病"
  | "死"
  | "墓"
  | "绝"
  | "胎"
  | "养";

const STAGES = [
  "长生", "沐浴", "冠带", "临官", "帝旺", "衰",
  "病", "死", "墓", "绝", "胎", "养",
] as const satisfies readonly TwelveGrowthStage[];
const STARTS = {
  甲: ["亥", 1],
  乙: ["午", -1],
  丙: ["寅", 1],
  丁: ["酉", -1],
  戊: ["寅", 1],
  己: ["酉", -1],
  庚: ["巳", 1],
  辛: ["子", -1],
  壬: ["申", 1],
  癸: ["卯", -1],
} as const;
const VALID_STEMS = new Set<string>(stems);
const VALID_BRANCHES = new Set<string>(branches);

export const TWELVE_GROWTH_RULE_METADATA: ReviewedChartRuleMetadata = Object.freeze({
  ruleVersion: "twelve-growth-v1",
  sourceId: "classic.san-ming-tong-hui.twelve-growth.v1",
  workingTextUrl: "https://ctext.org/wiki.pl?chapter=17423&if=gb&remap=gb",
  workingTextLocator: "《三命通会》卷二《论天干阴阳生死》第1至10段；逐干核对生死与逆顺。",
  adoptedEdition: "《三命通会》，秦慎安校勘，文明书局，1926年。",
  isbnOrCatalogId: "NLC data_416,13jh000156,94145",
  independentWitnessUrl: "https://commons.wikimedia.org/wiki/File:NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf",
  pageOrImageLocator: "国家图书馆影像PDF第80至84页（卷二刊页2至6）。",
  independentEditionCheck: "核对卷二影像的阴阳逆顺说明及十干逐项起点，另核对戊、己随火寄生的段落。",
  adoptedConvention: "产品采用阳干顺、阴干逆；戊随丙从寅顺行，己随丁从酉逆行。",
  variantDecisions: Object.freeze({
    阴阳顺逆: "采用阳干顺行、阴干逆行的十干十二宫表。",
    土的寄生口径: "采用戊随丙、己随丁；戊从寅顺行，己从酉逆行。",
    异说边界: "同书讨论其他寄生口径；产品只采用已声明的十干阴阳顺逆表，不宣称为唯一古法。",
    通用繁简: "阶段名按现代规范简体显示，固定为长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养。",
  }),
  verifiedAt: "2026-07-23",
  reviewStatus: "source-cross-checked-awaiting-human",
  reviewerRole: "命理规则内容复核",
  humanReviewerId: null,
});

export function getTwelveGrowthStage(
  dayStem: string,
  targetBranch: string,
): TwelveGrowthStage | null {
  if (!VALID_STEMS.has(dayStem) || !VALID_BRANCHES.has(targetBranch)) return null;
  const [startBranch, direction] = STARTS[dayStem as keyof typeof STARTS];
  const startIndex = branches.indexOf(startBranch);
  const targetIndex = branches.indexOf(targetBranch as typeof branches[number]);
  const stageIndex = ((targetIndex - startIndex) * direction + 12) % 12;
  return STAGES[stageIndex] ?? null;
}
