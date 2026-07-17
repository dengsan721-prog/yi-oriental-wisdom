import type { ElementName, FourPillarsResult } from "./types";

export type AnimalArchetype = { name: string; basis: string; mappedFeatures: string[]; strengthPattern: string; pressurePattern: string; action: string; caution: string };
export type HistoricalMirror = { person: string; dimension: string; basis: string; source: string; reliability: "high" | "medium" | "contextual"; observation: string; action: string; caution: string };

const animals: Record<ElementName, Omit<AnimalArchetype, "basis">> = {
  木: { name: "迁徙中的雁", mappedFeatures: ["木为生长", "结构重视延展"], strengthPattern: "能在方向明确时持续推进", pressurePattern: "路径受阻时容易反复寻找出口", action: "先确认方向，再缩短反馈周期", caution: "这是行为隐喻，不是性格标签。" },
  火: { name: "晨光中的蜂鸟", mappedFeatures: ["火为显化", "结构重视响应"], strengthPattern: "能快速点亮场域并带动互动", pressurePattern: "刺激过密时可能消耗注意力", action: "在高响应之后安排安静回收", caution: "这是行为隐喻，不是性格标签。" },
  土: { name: "守望的象群", mappedFeatures: ["土为承载", "结构重视稳定"], strengthPattern: "能承接复杂任务并维持秩序", pressurePattern: "责任叠加时可能把需要都留给自己", action: "把责任分层并明确求助节点", caution: "这是行为隐喻，不是性格标签。" },
  金: { name: "高处观察的鹤", mappedFeatures: ["金为辨析", "结构重视边界"], strengthPattern: "擅长识别标准并做出取舍", pressurePattern: "标准过紧时可能减少试错空间", action: "区分底线标准与可迭代标准", caution: "这是行为隐喻，不是性格标签。" },
  水: { name: "沿流探路的海豚", mappedFeatures: ["水为流动", "结构重视信息"], strengthPattern: "善于感知变化并连接线索", pressurePattern: "信息过载时可能迟迟不收束", action: "为探索设定结束条件", caution: "这是行为隐喻，不是性格标签。" },
};

const people: Record<ElementName, HistoricalMirror> = {
  木: { person: "陶渊明", dimension: "价值边界", basis: "日主属木，取其在仕隐选择中的价值边界作为单维比较。", source: "《晋书·陶潜传》；陶渊明诗文", reliability: "high", observation: "比较的是价值选择的表达方式。", action: "写下一个不愿交换的长期原则。", caution: "仅比较具体维度，不表示命运相同。" },
  火: { person: "李清照", dimension: "表达转化", basis: "日主属火，取其将经验转化为表达的能力作为单维比较。", source: "《宋史·李格非传》相关记载；李清照词作", reliability: "medium", observation: "比较的是表达如何承载经验。", action: "把一段强烈经验整理成可分享的作品。", caution: "仅比较具体维度，不表示命运相同。" },
  土: { person: "张骞", dimension: "长期承压", basis: "日主属土，取其长期任务中的承载力作为单维比较。", source: "《史记·大宛列传》；《汉书·张骞李广利传》", reliability: "high", observation: "比较的是长期任务中的耐力。", action: "为长期任务设置补给和协作节点。", caution: "仅比较具体维度，不表示命运相同。" },
  金: { person: "司马光", dimension: "规则与判断", basis: "日主属金，取其史学工作中的判断标准作为单维比较。", source: "《宋史·司马光传》；《资治通鉴》", reliability: "high", observation: "比较的是建立判断标准的方式。", action: "先公开判断标准，再处理分歧。", caution: "仅比较具体维度，不表示命运相同。" },
  水: { person: "徐霞客", dimension: "探索与校验", basis: "日主属水，取其实地观察与记录互证作为单维比较。", source: "《徐霞客游记》；钱谦益《徐霞客传》", reliability: "high", observation: "比较的是探索之后留下可核验记录。", action: "为一次探索留下观察、证据与修正三栏记录。", caution: "仅比较具体维度，不表示命运相同。" },
};

export function matchAnimalArchetype(chart: FourPillarsResult): AnimalArchetype {
  const element = chart.professional.dayMaster.element;
  return { ...animals[element], basis: `显式映射：日主五行=${element}；${animals[element].mappedFeatures.join("；")}。` };
}
export function matchHistoricalMirror(chart: FourPillarsResult): HistoricalMirror { return people[chart.professional.dayMaster.element]; }
