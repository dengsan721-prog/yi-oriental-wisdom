import { branches, stems } from "./stems-branches";

export type ReviewedChartRuleMetadata = Readonly<{
  ruleVersion: string;
  sourceId: string;
  workingTextUrl: string;
  workingTextLocator: string;
  adoptedEdition: string;
  isbnOrCatalogId: string;
  independentWitnessUrl: string;
  pageOrImageLocator: string;
  independentEditionCheck: string;
  adoptedConvention: string;
  variantDecisions: Readonly<Record<string, string>>;
  verifiedAt: string;
  reviewStatus: "source-cross-checked-awaiting-human";
  reviewerRole: "命理规则内容复核";
  humanReviewerId: null;
}>;

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

const VALID_STEMS = new Set<string>(stems);
const VALID_BRANCHES = new Set<string>(branches);
const NA_YIN_BY_PILLAR = Object.freeze(Object.fromEntries(
  NA_YIN_PAIRS.flatMap(([first, second, label]) => [
    [first, label],
    [second, label],
  ]),
)) as Readonly<Record<string, string>>;

export const NA_YIN_RULE_METADATA: ReviewedChartRuleMetadata = Object.freeze({
  ruleVersion: "na-yin-v1",
  sourceId: "classic.san-ming-tong-hui.na-yin.v1",
  workingTextUrl: "https://ctext.org/wiki.pl?chapter=926860&if=gb&remap=gb",
  workingTextLocator: "《三命通会》卷一《论纳音取象》及六十甲子纳音段；CText仅作工作文本定位。",
  adoptedEdition: "《三命通会》，秦慎安校勘，文明书局，1926年。",
  isbnOrCatalogId: "NLC data_416,13jh000156,94145",
  independentWitnessUrl: "https://commons.wikimedia.org/wiki/File:NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf",
  pageOrImageLocator: "国家图书馆影像PDF第34至38页（卷一刊页18至22）。",
  independentEditionCheck: "逐项核对影像本所列30组、覆盖60甲子；工作文本不单独作为定本。",
  adoptedConvention: "产品采用每两个连续甲子共享一个纳音名的30组简体显示表；纳音只作传统坐标标签。",
  variantDecisions: Object.freeze({
    "沙中金/砂中金": "采用影像本“沙中金”；“砂中金”记录为异名，不混入返回值。",
    "覆灯火/佛灯火": "采用影像本“覆灯火”；“佛灯火”记录为异名，不混入返回值。",
    "金泊金/金箔金": "影像本作“金泊金”，产品按当前约定显示“金箔金”。",
    "白鑞金/白蜡金": "影像本作“白鑞金”；产品约定显示“白蜡金”，此项是异名选择，不当作普通繁简转换。",
    "井泉水/泉中水": "影像本作“井泉水”，产品按当前约定显示“泉中水”。",
    "路傍土/路旁土": "影像本作“路傍土”，产品按当前约定显示“路旁土”。",
    通用繁简: "其余字形按现代规范简体显示，例如爐中火为炉中火、劒鋒金为剑锋金。",
  }),
  verifiedAt: "2026-07-23",
  reviewStatus: "source-cross-checked-awaiting-human",
  reviewerRole: "命理规则内容复核",
  humanReviewerId: null,
});

export function getNaYin(stem: string, branch: string): string | null {
  if (!VALID_STEMS.has(stem) || !VALID_BRANCHES.has(branch)) return null;
  return NA_YIN_BY_PILLAR[`${stem}${branch}`] ?? null;
}
