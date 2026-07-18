import type { InterpretationItem } from "./types";

const forbidden = [
  "功能入口", "资源接口", "社会接口", "能量端口", "底层模型", "高维链接",
  "能量底座", "内外接口", "职场接口", "组织接口", "调整接口", "底层条件",
];
const required = [
  "professionalTitle", "innovationTitle", "basis", "traditionalJudgment", "plainLanguage",
  "scenario", "advantageVersion", "shadowVersion", "actionNow", "actionLongTerm", "caution",
] as const;
const enrichmentMinimums = {
  traditionalJudgment: 50,
  advantageVersion: 45,
  shadowVersion: 45,
  actionNow: 35,
  actionLongTerm: 60,
} as const;
const repeatedFields = [
  "scenario", "traditionalJudgment", "advantageVersion", "shadowVersion", "actionNow", "actionLongTerm",
] as const;

function normalizeSection(value: string) {
  return value.normalize("NFKC").replace(/[\s\p{P}]+/gu, "");
}

export function validateInterpretation(item: InterpretationItem): string[] {
  const errors: string[] = [];
  for (const field of required) {
    const raw = item[field];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) errors.push(field + ":缺失");
    for (const word of forbidden) if (value.includes(word)) errors.push(field + ":禁用词:" + word);
  }
  for (const [field, minimum] of Object.entries(enrichmentMinimums)) {
    const raw = item[field as keyof typeof enrichmentMinimums];
    const value = typeof raw === "string" ? raw.trim() : "";
    const length = Array.from(value).length;
    if (value && length < minimum) errors.push(`${field}:过短:${length}<${minimum}`);
  }
  if (!Array.isArray(item.sourceReferences) || item.sourceReferences.length === 0) errors.push("sourceReferences:缺失");
  if (!Array.isArray(item.sourceRuleIds) || item.sourceRuleIds.length === 0) errors.push("sourceRuleIds:缺失");
  return errors;
}

export function findRepeatedSections(items: InterpretationItem[]): string[] {
  const errors: string[] = [];
  for (const field of repeatedFields) {
    const values = items.map(item => normalizeSection(item[field].trim())).filter(Boolean);
    if (new Set(values).size !== values.length) errors.push(field + ":重复");
  }
  return errors;
}
