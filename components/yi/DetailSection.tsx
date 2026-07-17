import type { InterpretationItem } from "../../lib/yi/types";

export function DetailSection({ title, items }: { title: string; items: InterpretationItem[] }) {
  return <section className="report-section"><header><small>专业详批</small><h1>{title}</h1><p>从命盘结构出发，给出可核对、可行动的观察。</p></header><div className="detail-list">{items.map(item => <article key={item.id}><div><small>{item.innovationTitle} · {item.confidence}</small><h2>{item.professionalTitle}</h2></div><p><b>依据</b>{item.basis}</p><p><b>场景</b>{item.scenario}</p><p><b>行动</b>{item.action}</p><p><b>提醒</b>{item.caution}</p></article>)}</div></section>;
}
