import {
  buildLifeScrollNarrative,
  type DaoStoryNote,
} from "../../lib/yi/life-scroll";
import type { StoryMirror } from "../../lib/yi/story-mirrors";
import type {
  FourPillarsResult,
  InterpretationItem,
  ProfessionalReport,
} from "../../lib/yi/types";

function DaoNote({ note }: { note: DaoStoryNote }) {
  return <aside className="dao-story-note">
    <small>《道德经》小注 · 第{note.chapter}章</small>
    <blockquote>{note.excerpt}</blockquote>
    <p><strong>这句话原本在说：</strong>{note.plainCommentary.traditionalMeaning}</p>
    <p><strong>放进你这一卷：</strong>{note.plainCommentary.storyConnection}</p>
    <p><strong>落到眼前一幕：</strong>{note.plainCommentary.sceneGuidance}</p>
  </aside>;
}

function PlacedDaoNotes({
  notes,
  placement,
}: {
  notes: readonly DaoStoryNote[];
  placement: DaoStoryNote["placement"];
}) {
  return notes
    .filter(note => note.placement === placement)
    .map(note => <DaoNote key={note.internalSourceId} note={note} />);
}

function MirrorInterlude({
  kind,
  mirror,
}: {
  kind: "动物镜像" | "历史镜像";
  mirror: StoryMirror;
}) {
  return <article className="life-scroll-part life-scroll-interlude">
    <header>
      <small>{kind}</small>
      <h2>{mirror.name}</h2>
    </header>
    <div className="life-scroll-mirror">
      <p><strong>{kind === "动物镜像" ? "它是谁" : "这位人物是谁"}</strong>{mirror.introduction}</p>
      <p><strong>相像的一幕</strong>{mirror.matchingScene}</p>
      <p><strong>重要区别</strong>{mirror.difference}</p>
      <p><strong>带走的方法</strong>{mirror.takeaway}</p>
    </div>
  </article>;
}

export function PortraitSection({
  chart,
  report,
  items,
}: {
  chart: FourPillarsResult;
  report: ProfessionalReport;
  items: InterpretationItem[];
}) {
  const narrative = buildLifeScrollNarrative(chart, report, items);

  return <section className="report-section portrait-report">
    <header className="life-scroll-heading">
      <small>第一章 · 先读故事</small>
      <h1>人生画卷</h1>
      <p>从眼前处境读起，看见事业、关系与节奏怎样彼此牵动，再把今天能做的一步留下来。</p>
    </header>
    <div className="life-scroll-reading">
      <article className="life-scroll-part life-scroll-opening">
        <header><small>01</small><h2>人生一句话</h2></header>
        <blockquote>{narrative.oneLineTheme}</blockquote>
        {narrative.openingScene.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </article>

      <MirrorInterlude kind="动物镜像" mirror={narrative.animalInterlude} />

      <article className="life-scroll-part">
        <header><small>02</small><h2>事业线</h2></header>
        {narrative.careerArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <PlacedDaoNotes notes={narrative.daoNotes} placement="career" />
      </article>

      <article className="life-scroll-part">
        <header><small>03</small><h2>婚姻与关系线</h2></header>
        {narrative.relationshipArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <PlacedDaoNotes notes={narrative.daoNotes} placement="relationship" />
      </article>

      <article className="life-scroll-part">
        <header><small>04</small><h2>命运转折线</h2></header>
        {narrative.turningPointArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <PlacedDaoNotes notes={narrative.daoNotes} placement="turning-point" />
      </article>

      <MirrorInterlude kind="历史镜像" mirror={narrative.historicalInterlude} />

      <article className="life-scroll-part">
        <header><small>05</small><h2>中后程</h2></header>
        {narrative.matureArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </article>

      <article className="life-scroll-part life-scroll-closing">
        <header><small>写在卷尾</small><h2>收束</h2></header>
        <p>{narrative.closingLine}</p>
        <aside className="life-scroll-action">
          <strong>当下行动</strong>
          <p>{narrative.actionNow}</p>
        </aside>
        <PlacedDaoNotes notes={narrative.daoNotes} placement="closing" />
      </article>
    </div>
  </section>;
}
