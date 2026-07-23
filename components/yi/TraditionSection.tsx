import {
  buildTraditionPublicIntro,
  type TraditionPublicIntro,
} from "../../lib/yi/traditional-content";
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

export function TraditionSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  const intro = buildTraditionPublicIntro();
  return <section className="report-section tradition-section">
    <TraditionPublicIntroView view={intro} />
    <ReferenceAtlasSection chart={chart} birth={birth} />
  </section>;
}
