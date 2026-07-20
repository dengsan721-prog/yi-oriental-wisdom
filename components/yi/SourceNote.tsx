import { getAllSources, YI_RULE_SOURCES } from "../../lib/yi/sources";
import type { FourPillarsResult, InterpretationItem } from "../../lib/yi/types";

export function SourceNote({ chart, items }: { chart: FourPillarsResult; items: InterpretationItem[] }) {
  const confidence = { high: "高", medium: "中", limited: "有限" } as const;
  const ruleIds = [...new Set(items.flatMap(item => item.sourceRuleIds))];
  const rules = ruleIds.map(id => YI_RULE_SOURCES[id]).filter(Boolean);
  const registry = new Map(getAllSources().map(source => [source.id, source]));
  const sources = ruleIds.map(id => registry.get(id)).filter((source): source is NonNullable<typeof source> => Boolean(source));
  const theory = [...new Set(rules.filter(rule => rule.sourceType !== "product-heuristic").map(rule => rule.label))];
  const translation = [...new Set(rules.filter(rule => rule.sourceType === "product-heuristic").map(rule => rule.label))];
  const references = [...new Set(rules.flatMap(rule => [...rule.references]))];

  return <aside className="source-note">
    <b>依据与边界</b>
    <p>{chart.disclaimer}</p>
    {chart.confidence !== "high" && <p>当前资料置信度为{confidence[chart.confidence]}，涉及不确定柱位的内容已降低置信度。</p>}
    <p><b>理论依据</b> {theory.join("｜")}</p>
    <p><b>现代转译</b> {translation.join("｜")}；用于生活场景和行动提示，不是古籍原断。</p>
    <details><summary>查看完整来源与规则（{sources.length}）</summary><ul>
      {sources.map(source => <li key={source.id}>
        <b>{source.title}</b> · {source.grade}<br />
        <span>用途：{source.role}</span><br />
        <span>{source.editionNote || `访问日期：${source.accessDate}`}</span><br />
        <span>使用边界：{source.boundary}</span>
        {source.url && <> <a href={source.url} target="_blank" rel="noreferrer">外部来源</a></>}
      </li>)}
      {rules.map(rule => <li key={rule.ruleId}><b>{rule.label}</b> · 规则版本 {rule.version}</li>)}
      {references.map(reference => <li key={reference}>{reference}</li>)}
    </ul></details>
  </aside>;
}
