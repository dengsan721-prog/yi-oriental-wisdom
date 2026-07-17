import { Solar } from "lunar-typescript";
import { stemElements } from "./stems-branches";
import type { BirthInput, FourPillarsResult, TenGodName } from "./types";

export type FortuneYear = { age: number; year: number; stemBranch: string; basis: string; theme: string; action: string };
export type FortunePeriod = {
  id: string; stemBranch: string; startAge: number; endAge: number; startYear: number; endYear: number;
  tenGod: TenGodName; theme: string; years: FortuneYear[]; confidence: FourPillarsResult["confidence"];
  method: { ruleVersion: string; basis: string; disclaimer: string };
};

const elementOrder = ["木", "火", "土", "金", "水"] as const;
export function calculateTenGod(day: string, other: string): TenGodName {
  const dayIndex = elementOrder.indexOf(stemElements[day]);
  const otherIndex = elementOrder.indexOf(stemElements[other]);
  const delta = (otherIndex - dayIndex + 5) % 5;
  const samePolarity = "甲丙戊庚壬".includes(day) === "甲丙戊庚壬".includes(other);
  if (delta === 0) return samePolarity ? "比肩" : "劫财";
  if (delta === 1) return samePolarity ? "食神" : "伤官";
  if (delta === 2) return samePolarity ? "偏财" : "正财";
  if (delta === 3) return samePolarity ? "七杀" : "正官";
  return samePolarity ? "偏印" : "正印";
}

function periodTheme(god: TenGodName) {
  if (["比肩", "劫财"].includes(god)) return "边界、同伴与自主选择";
  if (["食神", "伤官"].includes(god)) return "表达、作品与经验输出";
  if (["正财", "偏财"].includes(god)) return "资源配置与现实承诺";
  if (["正官", "七杀"].includes(god)) return "责任、规则与压力转化";
  return "学习、支持与内在整合";
}

export function buildFortuneTimeline(chart: FourPillarsResult, input: BirthInput): FortunePeriod[] {
  if (input.gender === "unspecified" || input.timeConfidence === "unknown" || input.time === null) return [];
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time?.split(":").map(Number) ?? [12, 0];
  const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  const yun = eightChar.getYun(input.gender === "male" ? 1 : 0);
  return yun.getDaYun(10).filter(item => item.getIndex() > 0).map((period, periodIndex) => {
    const stemBranch = period.getGanZhi();
    const tenGod = calculateTenGod(chart.pillars.day.stem, stemBranch[0]);
    const theme = periodTheme(tenGod);
    const years = period.getLiuNian(10).map(annual => {
      const annualStemBranch = annual.getGanZhi();
      const annualGod = calculateTenGod(chart.pillars.day.stem, annualStemBranch[0]);
      return { age: annual.getAge(), year: annual.getYear(), stemBranch: annualStemBranch,
        basis: `${annualStemBranch}相对日主${chart.pillars.day.stem}按五行生克观察为${annualGod}主题`, theme: periodTheme(annualGod), action: `把“${periodTheme(annualGod)}”落实为一项可复盘的小行动，不以此替代现实决策。` };
    });
    return { id: `fortune-${periodIndex + 1}`, stemBranch, startAge: period.getStartAge(), endAge: period.getEndAge(),
      startYear: period.getStartYear(), endYear: period.getEndYear(), tenGod, theme, years, confidence: input.timeConfidence === "unknown" ? "limited" : chart.confidence,
      method: { ruleVersion: "lunar-typescript-1.8.6-yun-sect1", basis: `lunar-typescript EightChar.getYun(${input.gender === "male" ? 1 : 0}) / Yun.getDaYun() 标准结果；起运于${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}日${yun.getStartHour()}时。`,
        disclaimer: input.timeConfidence === "unknown" ? "时辰未知，暂以正午计算起运供核对；时柱及起运时刻相关结论置信度有限。" : "大运用于阶段观察，不替代医疗、法律、财务或关系决定。" } };
  });
}
