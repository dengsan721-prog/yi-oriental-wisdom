import { branchElements, cycle, stemElements, stems } from "./stems-branches";
import type { BirthInput, ChartRelation, ElementName, FourPillarsResult, Pillar, PillarKey, ProfessionalChart, TenGodName } from "./types";

const labels = { year: "根基｜年柱", month: "环境｜月柱", day: "本我｜日柱", hour: "愿景｜时柱" };

function makePillar(index: number, label: string): Pillar {
  const value = cycle(index);
  return { ...value, element: stemElements[value.stem], branchElement: branchElements[value.branch], label };
}

function julianDay(year: number, month: number, day: number) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function monthBranchIndex(month: number, day: number) {
  const approximateSolarBoundaries = [5, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];
  const solarMonth = day >= approximateSolarBoundaries[month - 1] ? month : month - 1 || 12;
  return (solarMonth + 1) % 12;
}

const elementOrder: ElementName[] = ["木", "火", "土", "金", "水"];
const primaryHiddenStem: Record<string, string> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙",
  午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};
const stemCombinations = ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"];
const branchCombinations = ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"];
const branchClashes = ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"];

function polarity(stem: string): "yang" | "yin" {
  return stems.indexOf(stem as typeof stems[number]) % 2 === 0 ? "yang" : "yin";
}

function tenGod(dayStem: string, targetStem: string): TenGodName {
  const dayElement = stemElements[dayStem];
  const targetElement = stemElements[targetStem];
  const dayIndex = elementOrder.indexOf(dayElement);
  const targetIndex = elementOrder.indexOf(targetElement);
  const relation = (targetIndex - dayIndex + 5) % 5;
  const samePolarity = polarity(dayStem) === polarity(targetStem);
  const names: Record<number, [TenGodName, TenGodName]> = {
    0: ["比肩", "劫财"], 1: ["食神", "伤官"], 2: ["偏财", "正财"],
    3: ["七杀", "正官"], 4: ["偏印", "正印"],
  };
  return names[relation][samePolarity ? 0 : 1];
}

function relationOf(
  type: ChartRelation["type"],
  left: [PillarKey, Pillar],
  right: [PillarKey, Pillar],
): ChartRelation | null {
  const [leftKey, leftPillar] = left;
  const [rightKey, rightPillar] = right;
  const symbols: [string, string] = type === "stem-combination"
    ? [leftPillar.stem, rightPillar.stem]
    : [leftPillar.branch, rightPillar.branch];
  const pairs = type === "stem-combination" ? stemCombinations : type === "branch-combination" ? branchCombinations : branchClashes;
  if (!pairs.some(pair => pair.includes(symbols[0]) && pair.includes(symbols[1]))) return null;
  const suffix = type === "branch-clash" ? "相冲" : "相合";
  return { type, pillars: [leftKey, rightKey], symbols, label: `${symbols.join("")}${suffix}` };
}

function buildProfessional(pillars: FourPillarsResult["pillars"], elementCounts: Record<ElementName, number>): ProfessionalChart {
  const dayStem = pillars.day.stem;
  const dayElement = pillars.day.element;
  const resourceElement = elementOrder[(elementOrder.indexOf(dayElement) + 4) % 5];
  const present = (Object.entries(pillars) as [PillarKey, Pillar | null][]).filter((entry): entry is [PillarKey, Pillar] => Boolean(entry[1]));
  const support = present.reduce((score, [key, pillar]) => {
    const weight = key === "month" ? 2 : 1;
    return score + (pillar.element === dayElement || pillar.element === resourceElement ? weight : 0)
      + (pillar.branchElement === dayElement || pillar.branchElement === resourceElement ? weight : 0);
  }, 0);
  const total = present.length * 2 + 2; // 月柱的干支各加一份月令权重
  const strengthScore = Math.round((support / total) * 100);
  const strength = strengthScore >= 58 ? "strong" : strengthScore <= 35 ? "weak" : "balanced";
  const tenGods = present.flatMap(([key, pillar]) => {
    const entries = [];
    if (key !== "day") entries.push({ pillar: key, position: "stem" as const, symbol: pillar.stem, tenGod: tenGod(dayStem, pillar.stem) });
    const hidden = primaryHiddenStem[pillar.branch];
    entries.push({ pillar: key, position: "branch" as const, symbol: hidden, tenGod: tenGod(dayStem, hidden) });
    return entries;
  });
  const monthGod = tenGod(dayStem, primaryHiddenStem[pillars.month.branch]);
  const patternGroup = monthGod.includes("财") ? "财星格" : monthGod.includes("官") || monthGod === "七杀" ? "官杀格"
    : monthGod.includes("印") ? "印星格" : monthGod === "食神" || monthGod === "伤官" ? "食伤格" : "比劫格";
  const favorableElements = strength === "weak" ? [resourceElement, dayElement]
    : strength === "strong" ? [elementOrder[(elementOrder.indexOf(dayElement) + 1) % 5], elementOrder[(elementOrder.indexOf(dayElement) + 2) % 5]]
      : (Object.entries(elementCounts) as [ElementName, number][]).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([element]) => element);
  const unfavorableElements = (Object.entries(elementCounts) as [ElementName, number][])
    .filter(([element]) => !favorableElements.includes(element)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([element]) => element);
  const climate = ["亥", "子", "丑"].includes(pillars.month.branch) ? "寒月重温养，宜取火暖局并兼顾燥湿"
    : ["巳", "午", "未"].includes(pillars.month.branch) ? "暑月重润燥，宜取水调候并避免偏枯"
      : "春秋气候较平，结合五行强弱取中和";
  const relations: ChartRelation[] = [];
  for (let left = 0; left < present.length; left += 1) {
    for (let right = left + 1; right < present.length; right += 1) {
      for (const type of ["stem-combination", "branch-combination", "branch-clash"] as const) {
        const relation = relationOf(type, present[left], present[right]);
        if (relation) relations.push(relation);
      }
    }
  }
  return {
    dayMaster: { stem: dayStem, element: dayElement, polarity: polarity(dayStem) },
    strength, strengthScore, pattern: `${monthGod}当令，取${patternGroup}观察`, climate,
    favorableElements, unfavorableElements, tenGods, relations,
  };
}

export function calculateFourPillars(input: BirthInput): FourPillarsResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  if (!match) throw new Error("请输入有效的公历日期");
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error("请输入有效的公历日期");

  const adjustedYear = month < 2 || (month === 2 && day < 4) ? year - 1 : year;
  const yearIndex = adjustedYear - 1984;
  const yearPillar = makePillar(yearIndex, labels.year);
  const branchIndex = monthBranchIndex(month, day);
  const yinStemIndex = ((stems.indexOf(yearPillar.stem as typeof stems[number]) % 5) * 2 + 2) % 10;
  const monthOffset = (branchIndex - 2 + 12) % 12;
  const monthPillar = makePillar((yinStemIndex + monthOffset) + branchIndex * 10, labels.month);
  const dayIndex = julianDay(year, month, day) + 49;
  const dayPillar = makePillar(dayIndex, labels.day);

  let hourPillar: Pillar | null = null;
  if (input.time && input.timeConfidence !== "unknown") {
    const hour = Number(input.time.slice(0, 2));
    const hourBranch = Math.floor(((hour + 1) % 24) / 2);
    const dayStem = stems.indexOf(dayPillar.stem as typeof stems[number]);
    hourPillar = makePillar(((dayStem % 5) * 2 + hourBranch) + hourBranch * 10, labels.hour);
  }

  const elementCounts: Record<ElementName, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const pillar of [yearPillar, monthPillar, dayPillar, hourPillar]) {
    if (!pillar) continue;
    elementCounts[pillar.element] += 1;
    elementCounts[pillar.branchElement] += 1;
  }

  return {
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
    elementCounts,
    professional: buildProfessional({ year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar }, elementCounts),
    confidence: input.timeConfidence === "exact" ? "high" : input.timeConfidence === "approximate" ? "medium" : "limited",
    disclaimer: "传统文化体验与自我观察参考，不作为重大人生决策依据。",
  };
}
