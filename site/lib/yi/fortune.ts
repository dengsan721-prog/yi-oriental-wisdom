import { Solar } from "lunar-typescript";
import { branchElements, stemElements } from "./stems-branches";
import type { BirthInput, FourPillarsResult, PillarKey, TenGodName } from "./types";

export type FortuneReading = {
  climate: string;
  originalInteraction: string;
  opportunity: string;
  pressure: string;
  career: string;
  resources: string;
  relationship: string;
  wellbeing: string;
  strategy: string;
};

export type FortuneYear = {
  age: number;
  year: number;
  stemBranch: string;
  basis: string;
  theme: string;
  interaction: string;
  scenario: string;
  action: string;
};

export type FortunePeriod = {
  id: string;
  stemBranch: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  tenGod: TenGodName;
  theme: string;
  reading: FortuneReading;
  years: FortuneYear[];
  confidence: FourPillarsResult["confidence"];
  method: { ruleVersion: string; basis: string; disclaimer: string };
};

type KnownPillar = { label: string; stem: string; branch: string };

const elementOrder = ["木", "火", "土", "金", "水"] as const;
const pillarLabels: Record<PillarKey, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };
const stemCombinations = [["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"]] as const;
const branchPairRules = [
  { suffix: "六合", pairs: [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]] },
  { suffix: "六冲", pairs: [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]] },
  { suffix: "六害", pairs: [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]] },
  { suffix: "六破", pairs: [["子", "酉"], ["卯", "午"], ["辰", "丑"], ["戌", "未"], ["寅", "亥"], ["巳", "申"]] },
  { suffix: "相刑", pairs: [["子", "卯"]] },
] as const;
const trines = [["申", "子", "辰", "水"], ["亥", "卯", "未", "木"], ["寅", "午", "戌", "火"], ["巳", "酉", "丑", "金"]] as const;
const punishmentGroups = [["寅", "巳", "申"], ["丑", "戌", "未"]] as const;
const selfPunishments = ["辰", "午", "酉", "亥"] as const;

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

function knownPillars(chart: FourPillarsResult): KnownPillar[] {
  return (Object.entries(chart.pillars) as [PillarKey, FourPillarsResult["pillars"][PillarKey]][])
    .filter((entry): entry is [PillarKey, NonNullable<typeof entry[1]>] => Boolean(entry[1]))
    .map(([key, pillar]) => ({ label: pillarLabels[key], stem: pillar.stem, branch: pillar.branch }));
}

function isPair(pairs: ReadonlyArray<readonly [string, string]>, left: string, right: string): boolean {
  return pairs.some(([first, second]) => (left === first && right === second) || (left === second && right === first));
}

function pairRelations(left: string, right: string): string[] {
  const labels: string[] = [];
  if (isPair(stemCombinations, left[0], right[0])) labels.push(`${left[0]}${right[0]}天干五合`);
  for (const rule of branchPairRules) if (isPair(rule.pairs, left[1], right[1])) labels.push(`${left[1]}${right[1]}${rule.suffix}`);
  if (left[1] === right[1] && selfPunishments.includes(left[1] as typeof selfPunishments[number])) labels.push(`${left[1]}${right[1]}自刑`);
  return labels;
}

function relationEvidence(stemBranch: string, chart: FourPillarsResult): string {
  const pillars = knownPillars(chart);
  const comparisons = pillars.flatMap(pillar => pairRelations(stemBranch, `${pillar.stem}${pillar.branch}`)
    .map(relation => `${pillar.label}${pillar.stem}${pillar.branch}见${relation}`));
  const natalBranches = pillars.map(pillar => pillar.branch);
  for (const [first, second, third, element] of trines) {
    const group = [first, second, third];
    if (group.includes(stemBranch[1] as typeof group[number])
      && group.filter(branch => branch !== stemBranch[1]).every(branch => natalBranches.includes(branch))) {
      comparisons.push(`原局支位与${stemBranch[1]}补成${first}${second}${third}三合${element}局`);
    }
  }
  for (const group of punishmentGroups) {
    if (group.includes(stemBranch[1] as typeof group[number])
      && group.filter(branch => branch !== stemBranch[1]).every(branch => natalBranches.includes(branch))) {
      comparisons.push(`原局支位与${stemBranch[1]}补成${group.join("")}三刑`);
    }
  }
  const coordinates = pillars.map(pillar => `${pillar.label}${pillar.stem}${pillar.branch}`).join("、");
  return comparisons.length
    ? `${coordinates}中，${comparisons.join("；")}`
    : `${coordinates}逐柱核对，未见五合、六合、六冲、刑、害、破或三合补局`;
}

function periodPrefix(stemBranch: string, tenGod: TenGodName, chart: FourPillarsResult): string {
  const stemElement = stemElements[stemBranch[0]];
  const branchElement = branchElements[stemBranch[1]];
  return `${stemBranch}大运以${stemElement}天干为主、地支属${branchElement}，相对日主${chart.pillars.day.stem}呈${tenGod}；${relationEvidence(stemBranch, chart)}`;
}

function buildFortuneReading(stemBranch: string, tenGod: TenGodName, chart: FourPillarsResult): FortuneReading {
  const prefix = periodPrefix(stemBranch, tenGod, chart);
  const stemElement = stemElements[stemBranch[0]];
  const branchElement = branchElements[stemBranch[1]];
  const lowest = Object.entries(chart.elementCounts).sort((left, right) => left[1] - right[1])[0];
  const originalRelations = chart.professional.relations.map(relation => relation.label).join("、") || "原局稳定四柱内部未检出显式合冲刑害破";
  const godTheme = periodTheme(tenGod);
  return {
    climate: `${prefix}。阶段气候看${stemElement}干与${branchElement}支如何进入原局，宜把“${godTheme}”当作观察主题，不直接判吉凶。`,
    originalInteraction: `${prefix}。原局内部另有${originalRelations}；两组关系应分层阅读，先观察既有模式何时被放大或获得缓冲。`,
    opportunity: `${prefix}。机会来源落在${tenGod}所代表的${godTheme}，可从一项低成本试验、小范围反馈和真实结果中辨认可用开口。`,
    pressure: `${prefix}。压力来源也会借${tenGod}主题出现；当${stemElement}${branchElement}同时被现实任务触发，应先区分外部约束与自己的惯性反应。`,
    career: `${prefix}。工作推进可围绕${godTheme}设置阶段交付物，用职责、期限和复盘标准检验${tenGod}动力是否真正转成成果。`,
    resources: `${prefix}。资源配置需同时照看时间、注意力与现金边界；原局五行计数较低的是${lowest[0]}（${lowest[1]}项），只作结构提示，不等同于简单补足。`,
    relationship: `${prefix}。关系沟通可把${tenGod}的${godTheme}翻译成可讨论的请求，遇到关系触发时说明事实、需求和界限，不给任何人贴命理标签。`,
    wellbeing: `${prefix}。身心边界重点是为${stemElement}${branchElement}的阶段节奏预留恢复间隔，记录睡眠与负荷变化；不据此预测健康，也不替代医疗判断。`,
    strategy: `${prefix}。阶段策略是每季度只选一项${godTheme}实验，保留开始条件、停止条件和复盘证据，再决定是否扩大，不把大运当作确定事件表。`,
  };
}

function annualScenario(god: TenGodName): string {
  if (["比肩", "劫财"].includes(god)) return "同伴分工、个人边界或资源共享被摆到桌面，需要把各自承担与退出条件说清";
  if (["食神", "伤官"].includes(god)) return "表达、作品或方法需要接受真实反馈，容易同时出现想说清楚与担心被误读的拉扯";
  if (["正财", "偏财"].includes(god)) return "预算、时间和承诺同时进入排期，新的机会必须与现有资源容量放在一张表里比较";
  if (["正官", "七杀"].includes(god)) return "规则、责任或期限变得更醒目，临场应对之前需要先确认权限、标准与可求助对象";
  return "学习、支持系统与经验整合成为重点，信息很多时需要辨认哪些能立刻验证、哪些只是暂存假设";
}

function annualAction(god: TenGodName): string {
  if (["比肩", "劫财"].includes(god)) return "列出共同任务、个人边界和资源使用记录，每月核对一次分工是否仍然公平可执行";
  if (["食神", "伤官"].includes(god)) return "选一个可交付作品做小范围发布，记录反馈而不急着自我定性，再迭代下一版";
  if (["正财", "偏财"].includes(god)) return "把新增承诺写进时间与预算清单，设定上限和退出条件；重大财务事项仍咨询专业人士";
  if (["正官", "七杀"].includes(god)) return "把责任拆成权限、截止时间和验收标准，压力升高时先求助或协商范围，不凭命理解读硬扛";
  return "建立学习清单与验证日程，每周只实践一个方法并记录结果，避免收集很多却没有真实应用";
}

function buildFortuneYear(
  chart: FourPillarsResult,
  periodStemBranch: string,
  periodTenGod: TenGodName,
  annual: { getAge(): number; getYear(): number; getGanZhi(): string },
): FortuneYear {
  const annualStemBranch = annual.getGanZhi();
  const annualGod = calculateTenGod(chart.pillars.day.stem, annualStemBranch[0]);
  const natalAnchor = knownPillars(chart)[0];
  const natalEvidence = relationEvidence(annualStemBranch, chart);
  const periodRelations = pairRelations(annualStemBranch, periodStemBranch);
  const periodEvidence = periodRelations.length
    ? `${annualStemBranch}与${periodStemBranch}大运见${periodRelations.join("、")}`
    : `${annualStemBranch}与${periodStemBranch}大运核对，未见直接五合、六合、六冲、刑、害或破`;
  return {
    age: annual.getAge(),
    year: annual.getYear(),
    stemBranch: annualStemBranch,
    basis: `${annualStemBranch}流年天干相对日主${chart.pillars.day.stem}为${annualGod}，置于${periodStemBranch}${periodTenGod}大运内作阶段观察。`,
    theme: periodTheme(annualGod),
    interaction: `岁运关系：${annualStemBranch}（${annualGod}）进入${periodStemBranch}${periodTenGod}大运，${periodEvidence}；原局方面，${natalEvidence}。`,
    scenario: `典型场景：在${annualStemBranch}流年（${annualGod}）叠加${periodStemBranch}${periodTenGod}大运时，${annualScenario(annualGod)}；需结合原局${natalAnchor.label}${natalAnchor.stem}${natalAnchor.branch}共同核对，不解释为必然事件。`,
    action: `年度动作：针对${annualStemBranch}流年的${annualGod}主题，并参照${periodStemBranch}${periodTenGod}大运，${annualAction(annualGod)}。`,
  };
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
    const years = period.getLiuNian(10).map(annual => buildFortuneYear(chart, stemBranch, tenGod, annual));
    return {
      id: `fortune-${periodIndex + 1}`,
      stemBranch,
      startAge: period.getStartAge(),
      endAge: period.getEndAge(),
      startYear: period.getStartYear(),
      endYear: period.getEndYear(),
      tenGod,
      theme,
      reading: buildFortuneReading(stemBranch, tenGod, chart),
      years,
      confidence: chart.confidence,
      method: {
        ruleVersion: "lunar-typescript-1.8.6-yun-sect1",
        basis: `lunar-typescript EightChar.getYun(${input.gender === "male" ? 1 : 0}) / Yun.getDaYun() 标准结果；起运于${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}日${yun.getStartHour()}时。`,
        disclaimer: input.timeConfidence === "approximate"
          ? "出生时间标记为约略时间，起运年龄与阶段年份按所填时刻计算，结论保持中等置信；不预测确定事件，也不替代现实决定。"
          : "大运用于传统文化中的阶段观察，不预测确定事件，也不替代医疗、法律、财务或关系决定。",
      },
    };
  });
}
