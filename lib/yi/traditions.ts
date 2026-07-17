import type { FourPillarsResult } from "./types";

export type TraditionMethod = "称骨" | "生肖" | "星座";
export type TraditionalLayer = { title: string; observation: string; mainChartComparison: string; confidence: "medium" | "limited"; source: string };
export type TraditionalReading = { method: TraditionMethod; role: string; layers: TraditionalLayer[]; caution: string };

const layerNames = ["取象范围", "核心倾向", "优势场景", "压力场景", "关系提醒", "行动建议", "边界校验"];
const sources: Record<TraditionMethod, string> = { 称骨: "《袁天罡称骨歌》通行文本，仅作民俗文献参照", 生肖: "十二地支取象的民俗传统，以年支为索引", 星座: "西方太阳星座的通俗分类；当前命盘缺少阳历生日字段" };

function observations(method: TraditionMethod, chart: FourPillarsResult) {
  const yearBranch = chart.pillars.year.branch;
  const main = `主盘日主${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}，结构为${chart.professional.structureBalance}`;
  const seed = method === "生肖" ? `年支${yearBranch}只反映年柱的社会与早年取象` : method === "称骨" ? "当前结构化命盘不足以核定农历月日时重量，拒绝伪造骨重" : "当前结构化命盘未保存阳历月日，拒绝反推太阳星座";
  return layerNames.map((title, index): TraditionalLayer => ({ title, observation: index === 0 ? seed : index === 1 ? `${method}仅提供辅助分类语言。` : index === 2 ? "可用来提出一个待现实验证的优势假设。" : index === 3 ? "压力反应需以实际事件校验，不由类别直接判定。" : index === 4 ? "关系观察应回到沟通、边界与双方意愿。" : index === 5 ? "选择一项低风险行动进行一周复盘。" : "与主盘冲突时，以子平八字主盘和现实证据为先。", mainChartComparison: `${main}；本层${index === 6 ? "明确从属于主盘" : "仅与主盘对照，不追加确定性结论"}。`, confidence: method === "生肖" ? "medium" : "limited", source: sources[method] }));
}

export function buildTraditionalReadings(chart: FourPillarsResult): TraditionalReading[] {
  return (["称骨", "生肖", "星座"] as TraditionMethod[]).map(method => ({ method, role: "辅助观察，不覆盖子平八字主盘", layers: observations(method, chart), caution: "传统分类不用于诊断、贴标签或替代重要决定。" }));
}
