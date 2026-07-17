import type { ChartRelation, ElementDiagnostic, ElementName, FourPillarsResult, MonthCommandFact } from "./types";

export type ReportCopyContext = {
  dayMaster: string;
  dayMasterElement: ElementName;
  monthCommand: MonthCommandFact;
  exposedStems: string[];
  roots: string[];
  elementDiagnostics: ElementDiagnostic[];
  relations: ChartRelation[];
  pillarCount: number;
  stablePillarCount: number;
  confidence: FourPillarsResult["confidence"];
};

function elementDistribution(diagnostics: ElementDiagnostic[]): string {
  return diagnostics.map(({ element, count }) => `${element}${count}`).join("、");
}

function confidenceLabel(confidence: FourPillarsResult["confidence"]): string {
  if (confidence === "high") return "较高";
  if (confidence === "medium") return "中等";
  return "有限";
}

function relationSummary(relations: ChartRelation[]): string {
  return relations.length ? relations.map((relation) => relation.label).join("、") : "已知柱间未检出所支持的合冲刑害破或三合关系";
}

export function buildReportSummary(context: ReportCopyContext): string {
  const timeBoundary = context.pillarCount === 3
    ? `时辰不详，当前只把${context.stablePillarCount}个不受交节影响的柱作为稳定事实，其余待核`
    : `四柱信息已记录，整体观察置信度${confidenceLabel(context.confidence)}`;
  const month = context.monthCommand.ambiguous
    ? "出生日处交节边界，月令存在交节前后候选，暂不据单一月柱、本气或十神下结论"
    : `${context.monthCommand.branch}月令以${context.monthCommand.hiddenStem}为本气，对日主呈${context.monthCommand.tenGod}主题`;
  return `命盘以${context.dayMaster}${context.dayMasterElement}日主为观察起点；${month}。${timeBoundary}。五行数量、月令、根气、透干与结构分别记录，不能由其中一项直接推出喜用或确定的人生结果。`;
}

export function buildKeyJudgments(context: ReportCopyContext): string[] {
  const leastVisible = [...context.elementDiagnostics].sort((left, right) => left.count - right.count)[0];
  const mostVisible = [...context.elementDiagnostics].sort((left, right) => right.count - left.count)[0];
  const month = context.monthCommand.ambiguous
    ? `月令判断：出生日跨节且时辰未知，代表坐标为${context.monthCommand.representative.branch}月，仅供核对交节前后候选；本气、十神与季节支持均暂不作单一判断。`
    : `月令判断：${context.monthCommand.branch}月令本气为${context.monthCommand.hiddenStem}，相对${context.dayMaster}日主呈${context.monthCommand.tenGod}；这是季节与功能线索，不等同于古法格局定论。`;
  const roots = context.roots.length
    ? `根气判断：稳定柱的日主同类藏干见${context.roots.join("、")}；这里只记录根气线索，不据数量直接判旺衰。`
    : `根气判断：稳定柱藏干未见与${context.dayMaster}${context.dayMasterElement}日主同类的根气线索；待核柱不参与此结论，未见也不自动决定补益方向。`;
  const exposed = context.exposedStems.length
    ? `透干判断：${context.stablePillarCount}个稳定柱可见${context.exposedStems.join("、")}，可用于观察公开呈现的十神功能；待核柱不参与确定判断。`
    : "透干判断：当前没有可核对的天干事实，不补造十神侧重。";
  const relation = `干支关系：${relationSummary(context.relations)}；关系只描述结构互动，不映射为吉凶或确定事件。`;
  const confidence = context.pillarCount === 3
    ? `信息边界：时辰不详，时柱未生成；当前确定结论只覆盖${context.stablePillarCount}个稳定柱，交节候选与相关关系保持待核，整体置信度有限。`
    : `信息边界：出生时间按录入值计算，报告置信度${confidenceLabel(context.confidence)}；出生地址尚未进入经纬度与真太阳时校正流程。`;

  return [
    `日主判断：日干为${context.dayMaster}、五行属${context.dayMasterElement}，日主是全盘十神换算的参照轴，不是完整人格标签。`,
    month,
    exposed,
    roots,
    `五行分布：稳定柱可见干支计数为${elementDistribution(context.elementDiagnostics)}；${mostVisible.element}相对多见、${leastVisible.element}相对少见，只说明当前稳定分布，不直接推出喜忌。`,
    relation,
    confidence,
  ];
}

export function buildReportActions(context: ReportCopyContext): string[] {
  const primaryRelation = context.relations[0];
  const leastVisible = [...context.elementDiagnostics].sort((left, right) => left.count - right.count)[0];
  const monthAction = context.monthCommand.ambiguous
    ? "先核对准确出生时刻，再辨别交节前后的月令候选；未核实时保留候选，不安排基于单一本气或十神的行动。"
    : `围绕${context.monthCommand.branch}月令的${context.monthCommand.tenGod}主题，选择一个两周可完成的现实任务，记录投入、反馈和修正，不把十神名称当成职业或成败结论。`;
  const structureAction = primaryRelation
    ? `针对命盘中的${primaryRelation.label}，在下一次相似情境记录触发条件、双方需求与可调整边界，用现实反馈检验结构提示。`
    : `针对可见计数相对较少的${leastVisible.element}，先观察它在现实任务中的实际缺口，不直接用颜色、物品或行业作机械补足。`;
  return [
    `以${context.dayMaster}${context.dayMasterElement}日主为观察轴，连续七天记录自己在启动、表达与承压时最常用的方式，并同时写下一条反证。`,
    monthAction,
    structureAction,
  ];
}
