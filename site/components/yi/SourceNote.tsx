import type { FourPillarsResult, InterpretationItem } from "../../lib/yi/types";

export function SourceNote({ chart, items }: { chart: FourPillarsResult; items: InterpretationItem[] }) {
  const confidence = { high:"高", medium:"中", limited:"有限" } as const;
  const sources = [...new Set(items.flatMap(item => item.sourceReferences))];
  const traditions = [...new Set(items.map(item => item.sourceTradition))];
  const rules = [...new Set(items.flatMap(item => item.sourceRuleIds))];
  return <aside className="source-note"><b>依据与边界</b><p>{chart.disclaimer}</p>{chart.confidence !== "high" && <p>当前资料置信度为{confidence[chart.confidence]}，涉及不确定柱位的内容已降低置信度。</p>}<p><b>传统框架</b> {traditions.join("、")}</p><p><b>规则标签</b> {rules.join("、")}</p><details><summary>查看参考来源（{sources.length}）</summary><ul>{sources.map(source => <li key={source}>{source}</li>)}</ul></details></aside>;
}
