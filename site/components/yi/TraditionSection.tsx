import {
  buildTraditionPublicIntro,
  type TraditionPublicIntro,
} from "../../lib/yi/traditional-content";
import { buildFengshuiPlans, type FengshuiPlan } from "../../lib/yi/fengshui-planning";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { ReferenceAtlasSection } from "./ReferenceAtlasSection";

export function TraditionPublicIntroView({
  view,
}: {
  view: TraditionPublicIntro;
}) {
  return <header className="tradition-public-intro">
    <small>传统技法</small>
    <h1>{view.title}</h1>
    <blockquote className="folk-lead">
      {view.lead.attribution}：“{view.lead.saying}”
    </blockquote>
    <p>{view.scene}</p>
    <p>{view.playfulObservation}</p>
    <b>先试一步</b>
    <p>{view.action}</p>
  </header>;
}

export function FengshuiPlanningView({ plans }: { plans: FengshuiPlan[] }) {
  return <section className="fengshui-planning" aria-label="风水图文规划">
    <header className="fengshui-planning-head">
      <small>图文规划</small>
      <h2>传统风水规划建议</h2>
      <p>从动线、靠背、采光通风、收纳和安全入手，把传统空间意象翻译成今天能操作的调整。</p>
    </header>
    <div className="fengshui-planning-grid">
      {plans.map((plan) => <article className="fengshui-plan-card" key={plan.id}>
        <div className={`fengshui-diagram fengshui-diagram--${plan.diagram}`} aria-label={`${plan.title}示意图`} role="img">
          <span className="fengshui-diagram-path" aria-hidden="true" />
          <span className="fengshui-diagram-anchor" aria-hidden="true" />
          <span className="fengshui-diagram-light" aria-hidden="true" />
        </div>
        <div className="fengshui-plan-copy">
          <small>{plan.subtitle}</small>
          <h3>{plan.title}</h3>
          <p>{plan.principle}</p>
          <ul>
            {plan.steps.map(step => <li key={step}>{step}</li>)}
          </ul>
          <b>先做一步</b>
          <p>{plan.quickAction}</p>
          <small>避开：{plan.avoid.join("、")}</small>
        </div>
      </article>)}
    </div>
  </section>;
}

export function TraditionSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  const intro = buildTraditionPublicIntro();
  const fengshuiPlans = buildFengshuiPlans(chart, birth);
  return <section className="report-section tradition-section">
    <TraditionPublicIntroView view={intro} />
    <FengshuiPlanningView plans={fengshuiPlans} />
    <ReferenceAtlasSection chart={chart} birth={birth} title="传统图谱" initialMethod="mole" allowedMethods={["mole", "palm"]} />
  </section>;
}
