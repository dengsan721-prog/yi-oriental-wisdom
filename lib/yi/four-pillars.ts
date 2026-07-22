import { Solar } from "lunar-typescript";
import { detectChartRelations } from "./relations";
import { branchElements, stemElements, stems } from "./stems-branches";
import type { AmbiguousProfessionalField, BirthInput, ElementName, FourPillarsResult, Pillar, PillarKey, ProfessionalChart, TenGodEntry, TenGodName } from "./types";

const labels = { year: "根基｜年柱", month: "环境｜月柱", day: "本我｜日柱", hour: "愿景｜时柱" };
const elementOrder: ElementName[] = ["木", "火", "土", "金", "水"];

function eightCharAt(year: number, month: number, day: number, hour: number, minute: number) {
  const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  eightChar.setSect(2);
  return eightChar;
}

function makePillar(stem: string, branch: string, label: string): Pillar {
  return { stem, branch, element: stemElements[stem], branchElement: branchElements[branch], label };
}

function polarity(stem: string): "yang" | "yin" {
  return stems.indexOf(stem as typeof stems[number]) % 2 === 0 ? "yang" : "yin";
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
  const relations = detectChartRelations(present.map(([key, pillar]) => ({ key, stem: pillar.stem, branch: pillar.branch })));
  return {
    dayMaster: { stem: pillars.day.stem, element: dayElement, polarity: polarity(pillars.day.stem) },
    structureBalance, supportScore, observationConfidence: pillars.hour ? "medium" : "limited",
    pattern: ambiguousPillars.includes("month") ? "结构观察：出生当日月柱跨节，月支十神暂不作单一判断" : `结构观察：月支本气呈${monthGod}，仅作为十神侧重，不判定古法格局`,
    climate, sameAndResourceElements, lowerCountElements, tenGods, relations, ambiguousFields: [],
  };
}

function calculateFourPillarsInternal(input: BirthInput, compareUnknownTimeEndpoints: boolean): FourPillarsResult {
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

  const eightChar = eightCharAt(year, month, day, hour, minute);
  const ambiguousPillars: PillarKey[] = [];
  if (!input.time || input.timeConfidence === "unknown") {
    const start = eightCharAt(year, month, day, 0, 0);
    const end = eightCharAt(year, month, day, 23, 59);
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
  const result: FourPillarsResult = {
    pillars, elementCounts, professional: buildProfessional(pillars, elementCounts, tenGods, ambiguousPillars), ambiguousPillars,
    confidence: input.timeConfidence === "exact" ? "high" : input.timeConfidence === "approximate" ? "medium" : "limited",
    disclaimer: "传统文化体验与自我观察参考，不作为医疗、法律、投资或其他重大人生决策依据。",
  };
  if (compareUnknownTimeEndpoints && (!input.time || input.timeConfidence === "unknown")) {
    const endpointInput = { ...input, timeConfidence: "unknown" as const };
    const start = calculateFourPillarsInternal({ ...endpointInput, time: "00:00" }, false);
    const end = calculateFourPillarsInternal({ ...endpointInput, time: "23:59" }, false);
    const fields: AmbiguousProfessionalField[] = [];
    if (start.professional.structureBalance !== end.professional.structureBalance || start.professional.supportScore !== end.professional.supportScore) fields.push("structureBalance");
    if (JSON.stringify(start.professional.sameAndResourceElements) !== JSON.stringify(end.professional.sameAndResourceElements)) fields.push("sameAndResourceElements");
    if (JSON.stringify(start.elementCounts) !== JSON.stringify(end.elementCounts)
      || JSON.stringify(start.professional.lowerCountElements) !== JSON.stringify(end.professional.lowerCountElements)) fields.push("lowerCountElements");
    if (JSON.stringify(start.professional.tenGods) !== JSON.stringify(end.professional.tenGods)) fields.push("tenGodSummary");
    if (JSON.stringify(start.professional.relations) !== JSON.stringify(end.professional.relations)) fields.push("relationSummary");
    result.professional.ambiguousFields = fields;
  }
  return result;
}

export function calculateFourPillars(input: BirthInput): FourPillarsResult {
  const normalizedInput = input.time === null ? { ...input, timeConfidence: "unknown" as const } : input;
  return calculateFourPillarsInternal(normalizedInput, true);
}
