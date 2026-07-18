import type { InterpretationItem } from "./types";

const forbidden = ["功能入口", "资源接口", "社会接口", "能量端口", "底层模型", "高维链接"];
const required = [
  "professionalTitle", "innovationTitle", "basis", "traditionalJudgment", "plainLanguage",
  "scenario", "advantageVersion", "shadowVersion", "actionNow", "actionLongTerm", "caution",
] as const;
const repeatedFields = ["scenario", "actionNow", "actionLongTerm"] as const;

export function validateInterpretation(item: InterpretationItem): string[] {
  const errors: string[] = [];
  for (const field of required) {
    const raw = item[field];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) errors.push(field + ":缺失");
    for (const word of forbidden) if (value.includes(word)) errors.push(field + ":禁用词:" + word);
  }
  if (!Array.isArray(item.sourceReferences) || item.sourceReferences.length === 0) errors.push("sourceReferences:缺失");
  if (!Array.isArray(item.sourceRuleIds) || item.sourceRuleIds.length === 0) errors.push("sourceRuleIds:缺失");
  if (item.priority === "core" && item.confidence === "limited") errors.push("priority:有限置信度不能成为核心判断");
  return errors;
}

export function findRepeatedSections(items: InterpretationItem[]): string[] {
  const errors: string[] = [];
  for (const field of repeatedFields) {
    const values = items.map(item => item[field].trim()).filter(Boolean);
    if (new Set(values).size !== values.length) errors.push(field + ":重复");
  }
  return errors;
}
