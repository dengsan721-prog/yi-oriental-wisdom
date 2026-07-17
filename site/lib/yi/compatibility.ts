import { calculateTenGod } from "./fortune";
import type { ElementName, FourPillarsResult, TenGodName } from "./types";

export type RelationshipType = "partner" | "parent-child" | "business" | "friend";
export type CompatibilityResult = {
  relationship: RelationshipType;
  elementDynamics: { element: ElementName; first: number; second: number; observation: string }[];
  tenGodDynamics: { direction: "A→B" | "B→A"; basis: string; theme: TenGodName; observation: string }[];
  combinationsAndClashes: { symbols: [string, string]; relation: string; observation: string }[];
  communicationScenario: string; actionRules: string[]; limitations: string[];
};

const elements: ElementName[] = ["木", "火", "土", "金", "水"];
const scenarios: Record<RelationshipType, string> = {
  partner: "讨论共同生活安排时，先分别说需要与边界，再确认一个双方都能执行的约定。",
  "parent-child": "遇到规则冲突时，照顾者先说明底线和原因，再给孩子有限而真实的选择。",
  business: "分配职责与收益前，把决策权、交付标准和复盘节点写入同一份记录。",
  friend: "出现期待落差时，用具体事件和可请求的行动代替对人格的判断。",
};

function directionalGod(source: FourPillarsResult, target: FourPillarsResult): TenGodName {
  return calculateTenGod(source.professional.dayMaster.stem, target.professional.dayMaster.stem);
}

const relationPairs: [string, string, string][] = [
  ["子", "午", "冲"], ["丑", "未", "冲"], ["寅", "申", "冲"], ["卯", "酉", "冲"], ["辰", "戌", "冲"], ["巳", "亥", "冲"],
  ["子", "丑", "合"], ["寅", "亥", "合"], ["卯", "戌", "合"], ["辰", "酉", "合"], ["巳", "申", "合"], ["午", "未", "合"],
  ["子", "未", "害"], ["丑", "午", "害"], ["寅", "巳", "害"], ["卯", "辰", "害"], ["申", "亥", "害"], ["酉", "戌", "害"],
  ["寅", "巳", "刑"], ["巳", "申", "刑"], ["寅", "申", "刑"], ["丑", "戌", "刑"], ["戌", "未", "刑"], ["丑", "未", "刑"], ["子", "卯", "刑"],
];

export function classifyBranchRelation(left: string, right: string): string[] {
  return relationPairs.filter(([a, b]) => (a === left && b === right) || (a === right && b === left)).map(([, , relation]) => relation);
}

function crossRelations(a: FourPillarsResult, b: FourPillarsResult) {
  const relations: CompatibilityResult["combinationsAndClashes"] = [];
  const aBranches = Object.values(a.pillars).filter(Boolean).map(p => p!.branch);
  const bBranches = Object.values(b.pillars).filter(Boolean).map(p => p!.branch);
  for (const [left, right, relation] of relationPairs) {
    if ((aBranches.includes(left) && bBranches.includes(right)) || (aBranches.includes(right) && bBranches.includes(left))) relations.push({ symbols: [left, right], relation, observation: relation === "合" ? "容易形成协作接口，也需明确各自边界。" : "容易出现节奏或立场拉扯，适合预先约定暂停与复盘。" });
  }
  if (relations.length) return relations;
  return [{ symbols: [a.pillars.day.branch, b.pillars.day.branch] as [string, string], relation: "无直接合冲刑害", observation: "不以单一地支关系替代真实互动观察。" }];
}

export function calculateCompatibility(first: FourPillarsResult, second: FourPillarsResult, relationship: RelationshipType): CompatibilityResult {
  const elementDynamics = elements.map(element => ({ element, first: first.elementCounts[element], second: second.elementCounts[element], observation: first.elementCounts[element] === second.elementCounts[element] ? "配置接近，仍需观察实际分工。" : `${first.elementCounts[element] > second.elementCounts[element] ? "A" : "B"}盘该元素更显，适合由经验较多的一方先示范而非包办。` }));
  const aToB = directionalGod(first, second), bToA = directionalGod(second, first);
  return { relationship, elementDynamics, tenGodDynamics: [
    { direction: "A→B", basis: `A日主${first.professional.dayMaster.stem}相对B日主${second.professional.dayMaster.stem}`, theme: aToB, observation: `以${aToB}主题观察A对B的影响，不作价值排序。` },
    { direction: "B→A", basis: `B日主${second.professional.dayMaster.stem}相对A日主${first.professional.dayMaster.stem}`, theme: bToA, observation: `以${bToA}主题观察B对A的影响，不作价值排序。` },
  ], combinationsAndClashes: crossRelations(first, second), communicationScenario: scenarios[relationship], actionRules: ["先描述事件，再表达感受和需要。", "重要约定写明负责人、时间点与复盘方式。", "高压时先暂停，恢复后只处理一个议题。"], limitations: ["合盘不输出单一分数，也不判断关系成败。", "命盘只提供观察语言，关系质量仍以真实互动、意愿和安全为准。", ...(first.confidence === "limited" || second.confidence === "limited" ? ["至少一方时辰未知，时柱相关互动不作确定结论。"] : [])] };
}
