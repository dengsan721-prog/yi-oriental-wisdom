import { getAllSources } from "./sources";

export { getAllSources } from "./sources";
export type { UnifiedSource } from "./sources";

export function auditSourceReferences(ids: string[]): string[] {
  const knownIds = new Set(getAllSources().map(source => source.id));
  const issues: string[] = [];
  for (const id of ids) {
    if (!knownIds.has(id) && !issues.includes(`来源不存在:${id}`)) issues.push(`来源不存在:${id}`);
  }
  return issues;
}
