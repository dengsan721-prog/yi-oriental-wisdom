import type { InterpretationItem, ProfessionalOverview } from "../../lib/yi/types";

export function PortraitSection({ overview, items }: { overview: ProfessionalOverview; items: InterpretationItem[] }) {
  const leads = items.filter((item, index) => items.findIndex(other => other.domain === item.domain) === index);
  return <section className="report-section"><header><small>人生画像</small><h1>{overview.dayMaster}日主 · 七维观察</h1><p>{overview.pattern}</p></header><div className="portrait-grid">{leads.map(item => <article key={item.id}><span>{item.innovationTitle}</span><h2>{item.professionalTitle}</h2><p>{item.plainLanguage}</p><b>{item.action}</b></article>)}</div></section>;
}
