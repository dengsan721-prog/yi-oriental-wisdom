import { Solar } from "lunar-typescript";
import { branchElements, stemElements, stems } from "./stems-branches";
import type { BirthInput, ChartRelation, ElementName, FourPillarsResult, Pillar, PillarKey, ProfessionalChart, TenGodEntry, TenGodName } from "./types";

const labels = { year: "根基｜年柱", month: "环境｜月柱", day: "本我｜日柱", hour: "愿景｜时柱" };
const elementOrder: ElementName[] = ["木", "火", "土", "金", "水"];
const stemCombinations = ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"];
const branchCombinations = ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"];
const branchClashes = ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"];

function makePillar(stem: string, branch: string, label: string): Pillar {
  return { stem, branch, element: stemElements[stem], branchElement: branchElements[branch], label };
}

function polarity(stem: string): "yang" | "yin" {
  return stems.indexOf(stem as typeof stems[number]) % 2 === 0 ? "yang" : "yin";
}

function relationOf(type: ChartRelation["type"], left: [PillarKey, Pillar], right: [PillarKey, Pillar]): ChartRelation | null {
  const [leftKey, leftPillar] = left;
  const [rightKey, rightPillar] = right;
  const symbols: [string, string] = type === "stem-combination" ? [leftPillar.stem, rightPillar.stem] : [leftPillar.branch, rightPillar.branch];
  const pairs = type === "stem-combination" ? stemCombinations : type === "branch-combination" ? branchCombinations : branchClashes;
  if (!pairs.some(pair => pair === symbols.join("") || pair === [...symbols].reverse().join(""))) return null;
  return { type, pillars: [leftKey, rightKey], symbols, label: `${symbols.join("")}${type === "branch-clash" ? "相冲" : "相合"}` };
}

function buildProfessional(
  pillars: FourPillarsResult["pillars"],
  elementCounts: Record<ElementName, number>,
  tenGods: TenGodEntry[],
  ambiguousPillars: PillarKey[],
): ProfessionalChart {
  const dayElement = pillars.day.element;
  const resourceElement = elementOrder[(elementOrder.indexOf(dayElement) + 4) % 5];
  const present = (Object.entries(pillars) as [PillarKey, Pillar | null][]).filter((entry): entry is [PillarKey, Pillar] => Boolean(entry[1]));
  const support = present.reduce((score, [key, pillar]) => {
    const weight = key === "month" ? 2 : 1;
    return score + (pillar.element === dayElement || pillar.element === resourceElement ? weight : 0)
      + (pillar.branchElement === dayElement || pillar.branchElement === resourceElement ? weight : 0);
  }, 0);
  const supportScore = Math.round((support / (present.length * 2 + 2)) * 100);
  const structureBalance = supportScore >= 58 ? "support-heavy" : supportScore <= 35 ? "expression-heavy" : "mixed";
  const sameAndResourceElements = [resourceElement, dayElement];
  const lowerCountElements = (Object.entries(elementCounts) as [ElementName, number][])
    .filter(([element]) => !sameAndResourceElements.includes(element)).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([element]) => element);
  const monthGod = tenGods.find(item => item.pillar === "month" && item.position === "branch")?.tenGod ?? "月支十神未取";
  const climate = ambiguousPillars.includes("month") ? "调候提示：出生当日跨节且时辰未知，月令可能变化，暂不作单一季节判断"
    : ["亥", "子", "丑"].includes(pillars.month.branch) ? "调候提示：生于寒月，可观察温养、启动与燥湿平衡"
    : ["巳", "午", "未"].includes(pillars.month.branch) ? "调候提示：生于暑月，可观察润燥、休息与持续性"
      : "调候提示：春秋转换期，可观察升降收放与日常节律";
  const relations: ChartRelation[] = [];
  for (let left = 0; left < present.length; left += 1) for (let right = left + 1; right < present.length; right += 1) {
    for (const type of ["stem-combination", "branch-combination", "branch-clash"] as const) {
      const relation = relationOf(type, present[left], present[right]);
      if (relation) relations.push(relation);
    }
  }
  return {
    dayMaster: { stem: pillars.day.stem, element: dayElement, polarity: polarity(pillars.day.stem) },
    structureBalance, supportScore, observationConfidence: pillars.hour ? "medium" : "limited",
    pattern: ambiguousPillars.includes("month") ? "结构观察：出生当日月柱跨节，月支十神暂不作单一判断" : `结构观察：月支本气呈${monthGod}，仅作为十神侧重，不判定古法格局`,
    climate, sameAndResourceElements, lowerCountElements, tenGods, relations,
  };
}

export function calculateFourPillars(input: BirthInput): FourPillarsResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  if (!match) throw new Error("请输入有效的公历日期");
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error("请输入有效的公历日期");
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(input.time ?? "12:00");
  if (!timeMatch) throw new Error("请输入有效的出生时间");
  const hour = Number(timeMatch[1]), minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) throw new Error("请输入有效的出生时间");

  const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  const ambiguousPillars: PillarKey[] = [];
  if (!input.time || input.timeConfidence === "unknown") {
    const start = Solar.fromYmdHms(year, month, day, 0, 0, 0).getLunar().getEightChar();
    const end = Solar.fromYmdHms(year, month, day, 23, 59, 0).getLunar().getEightChar();
    if (start.getYear() !== end.getYear()) ambiguousPillars.push("year");
    if (start.getMonth() !== end.getMonth()) ambiguousPillars.push("month");
    if (start.getDay() !== end.getDay()) ambiguousPillars.push("day");
    ambiguousPillars.push("hour");
  }
  const yearPillar = makePillar(eightChar.getYearGan(), eightChar.getYearZhi(), labels.year);
  const monthPillar = makePillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), labels.month);
  const dayPillar = makePillar(eightChar.getDayGan(), eightChar.getDayZhi(), labels.day);
  const hourPillar = input.time && input.timeConfidence !== "unknown" ? makePillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), labels.hour) : null;
  const pillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };

  const elementCounts: Record<ElementName, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const pillar of Object.values(pillars)) if (pillar) {
    elementCounts[pillar.element] += 1;
    elementCounts[pillar.branchElement] += 1;
  }

  const sourceRows = [
    ["year", eightChar.getYearGan(), eightChar.getYearShiShenGan(), eightChar.getYearHideGan(), eightChar.getYearShiShenZhi()],
    ["month", eightChar.getMonthGan(), eightChar.getMonthShiShenGan(), eightChar.getMonthHideGan(), eightChar.getMonthShiShenZhi()],
    ["day", eightChar.getDayGan(), eightChar.getDayShiShenGan(), eightChar.getDayHideGan(), eightChar.getDayShiShenZhi()],
    ["hour", eightChar.getTimeGan(), eightChar.getTimeShiShenGan(), eightChar.getTimeHideGan(), eightChar.getTimeShiShenZhi()],
  ] as const;
  const tenGods: TenGodEntry[] = sourceRows.flatMap(([pillar, gan, ganGod, hidden, hiddenGods]) => {
    if (pillar === "hour" && !hourPillar) return [];
    const entries: TenGodEntry[] = pillar === "day" ? [] : [{ pillar, position: "stem", symbol: gan, tenGod: ganGod as TenGodName }];
    return entries.concat(hidden.map((symbol, hiddenStemIndex) => ({ pillar, position: "branch", symbol, tenGod: hiddenGods[hiddenStemIndex] as TenGodName, hiddenStemIndex })));
  });
  return {
    pillars, elementCounts, professional: buildProfessional(pillars, elementCounts, tenGods, ambiguousPillars), ambiguousPillars,
    confidence: input.timeConfidence === "exact" ? "high" : input.timeConfidence === "approximate" ? "medium" : "limited",
    disclaimer: "传统文化体验与自我观察参考，不作为重大人生决策依据。",
  };
}
