import type { InterpretationItem, ProfessionalOverview } from "../../lib/yi/types";

export function PortraitSection({ overview, items }: { overview: ProfessionalOverview; items: InterpretationItem[] }) {
  const inDomain = (domain: InterpretationItem["domain"], index = 0) => items.filter(item => item.domain === domain)[index] ?? items[0];
  const cards = [
    ["人格定位", inDomain("self")], ["核心特征一", inDomain("self",1)], ["核心特征二", inDomain("talent")], ["核心特征三", inDomain("career")],
    ["外在与真实", inDomain("relationship")], ["天赋", inDomain("talent",1)], ["压力反应", inDomain("family")], ["当前任务", inDomain("rhythm")],
  ] as const;
  return <section className="report-section"><header><small>人生画像</small><h1>{overview.dayMaster} · 人生观察</h1><p>{overview.pattern}</p></header><div className="portrait-grid">{cards.map(([label,item]) => item && <article key={label}><span>{label}</span><h2>{item.professionalTitle}</h2><p>{label === "当前任务" ? item.action : label === "压力反应" ? item.caution : label === "外在与真实" ? item.mirror : item.plainLanguage}</p></article>)}</div></section>;
}
