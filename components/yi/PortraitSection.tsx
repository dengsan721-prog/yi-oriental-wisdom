import { matchAnimalArchetype, matchHistoricalMirror } from "../../lib/yi/mirrors";
import type { FourPillarsResult, InterpretationItem, ProfessionalOverview } from "../../lib/yi/types";

function pick(items: InterpretationItem[], id: string) {
  const item = items.find(candidate => candidate.id === id);
  if (!item) throw new Error(`人生画像缺少必需解读：${id}`);
  return item;
}

export function PortraitSection({ chart, overview, items }: { chart: FourPillarsResult; overview: ProfessionalOverview; items: InterpretationItem[] }) {
  const lead = pick(items, "self-day-master");
  const features = [pick(items, "self-support"), pick(items, "self-interface"), pick(items, "career-environment")];
  const outside = pick(items, "talent-public");
  const inside = pick(items, "talent-hidden");
  const pressure = pick(items, "relationship-trigger");
  const task = pick(items, "rhythm-decision");
  const animal = matchAnimalArchetype(chart);
  const person = matchHistoricalMirror(chart);
  const dataBand = [
    { label: "别人眼中的我", item: outside, text: outside.plainLanguage },
    { label: "真实的我", item: inside, text: inside.plainLanguage },
    { label: "天赋怎么用", item: inside, text: inside.action },
    { label: "压力下的反应", item: pressure, text: pressure.scenario },
    { label: "当前人生主线", item: task, text: task.action },
  ];

  return <section className="report-section portrait-report">
    <header><small>人生画像</small><h1>{overview.dayMaster} · 人生观察</h1><p>{overview.pattern}</p></header>
    <article className="portrait-lead">
      <span>一句话看懂</span>
      <h2>{lead.professionalTitle}</h2>
      <p>{lead.plainLanguage}</p>
      <small><b>专业依据</b>{lead.basis}</small>
    </article>
    <div className="portrait-feature-grid">
      {features.map((item, index) => <article key={item.id}>
        <span>核心特征 0{index + 1}</span>
        <h2>{item.professionalTitle}</h2>
        <p>{item.plainLanguage}</p>
        <small><b>专业依据</b>{item.basis}</small>
      </article>)}
    </div>
    <dl className="portrait-data-band">
      {dataBand.map(({ label, item, text }) => <div key={label}><dt>{label} · {item.professionalTitle}</dt><dd>{text}</dd></div>)}
    </dl>
    <div className="portrait-mirrors">
      <article>
        <span>自然动物原型 · 行为隐喻</span>
        <h2>{animal.name}</h2>
        <p>{animal.basis}</p>
        <b>现在可做</b><p>{animal.action}</p>
        <small>{animal.caution}</small>
      </article>
      <article>
        <span>历史人物维度 · {person.reliability} 可靠级</span>
        <h2>{person.person} · {person.dimension}</h2>
        <p>{person.basis}</p>
        <b>资料来源</b><p>{person.source}</p>
        <small>{person.caution}</small>
      </article>
    </div>
  </section>;
}
