import type { AmbiguousProfessionalField, FourPillarsResult, ProfessionalOverview } from "../../lib/yi/types";

const confidenceLabel = { high:"高", medium:"中", limited:"有限" } as const;
const ambiguousLabel: Record<AmbiguousProfessionalField,string> = { structureBalance:"结构支持度",sameAndResourceElements:"同类与资源五行",lowerCountElements:"较少五行",tenGodSummary:"十神摘要",relationSummary:"干支关系" };
const pillarNames = { year:"年柱",month:"月柱",day:"日柱",hour:"时柱" } as const;

export function ChartSection({ chart, overview }: { chart: FourPillarsResult; overview: ProfessionalOverview }) {
  const total = Object.values(chart.elementCounts).reduce((sum, value) => sum + value, 0);
  return <section className="report-section"><header><small>命盘结构</small><h1>{overview.dayMaster}日主</h1><p>观察置信度：{confidenceLabel[overview.confidence]}</p></header>
    <div className="compact-pillars">{Object.entries(chart.pillars).map(([key,pillar]) => <article key={key}><span>{pillarNames[key as keyof typeof pillarNames]}</span>{pillar ? <><strong>{pillar.stem}{pillar.branch}</strong><small>{pillar.element} · {pillar.branchElement}</small></> : <strong>时柱未定</strong>}</article>)}</div>
    <section className="element-balance"><h2>五行与结构支持度</h2>{Object.entries(chart.elementCounts).map(([element,count]) => <div key={element}><span>{element}</span><i><b style={{width:`${total ? count / total * 100 : 0}%`}} /></i><small>{count}</small></div>)}<p>结构支持度：{overview.structureBalance === "ambiguous" ? "未作单一判断" : `${chart.professional.supportScore}（${overview.structureBalance}）`}</p></section>
    <dl className="chart-facts"><div><dt>结构观察</dt><dd>{overview.pattern}</dd></div><div><dt>调候提示</dt><dd>{overview.climate}</dd></div><div><dt>十神摘要</dt><dd>{overview.tenGodSummary}</dd></div><div><dt>干支关系</dt><dd>{overview.relationSummary}</dd></div><div><dt>喜用</dt><dd>现有引擎未作单一判断</dd></div><div><dt>当前大运</dt><dd>在大运区按专业规则展开</dd></div></dl>
    {overview.ambiguousFields.length > 0 && <aside className="ambiguity-note"><b>不确定项及影响范围</b><p>{overview.ambiguousFields.map(field => ambiguousLabel[field]).join("、")}</p><small>上述字段受未知时辰或交节边界影响，相关解读已降低置信度。</small></aside>}
  </section>;
}
