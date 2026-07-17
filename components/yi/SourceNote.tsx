import type { FourPillarsResult, InterpretationItem } from "../../lib/yi/types";

export function SourceNote({ chart, items }: { chart: FourPillarsResult; items: InterpretationItem[] }) {
  const sources = [...new Set(items.flatMap(item => item.sourceReferences))];
  return <aside className="source-note"><b>依据与边界</b><p>{chart.disclaimer}</p>{chart.confidence !== "high" && <p>当前资料置信度为 {chart.confidence}，涉及不确定柱位的内容已降低置信度。</p>}<details><summary>查看本节来源（{sources.length}）</summary><ul>{sources.map(source => <li key={source}>{source}</li>)}</ul></details></aside>;
}
