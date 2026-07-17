import { branchElements, cycle, stemElements, stems } from "./stems-branches";
import type { BirthInput, ElementName, FourPillarsResult, Pillar } from "./types";

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
    confidence: input.timeConfidence === "exact" ? "high" : input.timeConfidence === "approximate" ? "medium" : "limited",
    disclaimer: "传统文化体验与自我观察参考，不作为重大人生决策依据。",
  };
}
