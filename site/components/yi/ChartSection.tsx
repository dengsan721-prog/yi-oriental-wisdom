import type { FourPillarsResult, ProfessionalOverview } from "../../lib/yi/types";

export function ChartSection({ chart, overview }: { chart: FourPillarsResult; overview: ProfessionalOverview }) {
  return <section className="report-section"><header><small>命盘结构</small><h1>{overview.dayMaster}日主</h1><p>{overview.climate}</p></header><div className="compact-pillars">{Object.entries(chart.pillars).map(([key, pillar]) => pillar && <article key={key}><span>{{year:"年柱",month:"月柱",day:"日柱",hour:"时柱"}[key as "year"]}</span><strong>{pillar.stem}{pillar.branch}</strong><small>{pillar.element} · {pillar.branchElement}</small></article>)}</div><dl className="chart-facts"><div><dt>结构</dt><dd>{overview.pattern}</dd></div><div><dt>十神</dt><dd>{overview.tenGodSummary}</dd></div><div><dt>干支关系</dt><dd>{overview.relationSummary}</dd></div></dl></section>;
}
