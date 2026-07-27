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

function WaterfallSummary({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return <summary>
    <small>{index}</small>
    <h2>{title}</h2>
    <p>{subtitle}</p>
    <span className="waterfall-open-hint">点开阅读 · 收起回到总览</span>
  </summary>;
}

function MirrorInterlude({
  kind,
  mirror,
}: {
  kind: "动物镜像" | "历史镜像";
  mirror: StoryMirror;
}) {
  return <details className="life-scroll-part waterfall-card life-scroll-interlude">
    <WaterfallSummary
      index={kind}
      title={mirror.name}
      subtitle={kind === "动物镜像" ? "用一个动物场景读懂行动方式" : "用一个历史人物读懂人生回声"}
    />
    <div className="waterfall-card-body life-scroll-mirror">
      <p><strong>{kind === "动物镜像" ? "它是谁" : "这位人物是谁"}</strong>{mirror.introduction}</p>
      <p><strong>相像的一幕</strong>{mirror.matchingScene}</p>
      <p><strong>重要区别</strong>{mirror.difference}</p>
      <p><strong>带走的方法</strong>{mirror.takeaway}</p>
    </div>
  </details>;
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
    <div className="life-scroll-reading waterfall-grid">
      <details className="life-scroll-part waterfall-card life-scroll-opening">
        <WaterfallSummary index="01" title="人生一句话" subtitle={narrative.oneLineTheme} />
        <div className="waterfall-card-body">
          <blockquote>{narrative.oneLineTheme}</blockquote>
          {narrative.openingScene.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </details>

      <MirrorInterlude kind="动物镜像" mirror={narrative.animalInterlude} />

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="02" title="事业线" subtitle="事业、承担与机会怎样展开" />
        <div className="waterfall-card-body">
          {narrative.careerArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="career" />
        </div>
      </details>

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="03" title="婚姻与关系线" subtitle="亲密关系、沟通和修复的一幕" />
        <div className="waterfall-card-body">
          {narrative.relationshipArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="relationship" />
        </div>
      </details>

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="04" title="命运转折线" subtitle="低点、选择与转身的方式" />
        <div className="waterfall-card-body">
          {narrative.turningPointArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="turning-point" />
        </div>
      </details>

      <MirrorInterlude kind="历史镜像" mirror={narrative.historicalInterlude} />

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="05" title="中后程" subtitle="成熟之后怎样收束力量" />
        <div className="waterfall-card-body">
          {narrative.matureArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </details>

      <details className="life-scroll-part waterfall-card life-scroll-closing">
        <WaterfallSummary index="写在卷尾" title="收束" subtitle="读完之后今天先做什么" />
        <div className="waterfall-card-body">
          <p>{narrative.closingLine}</p>
          <aside className="life-scroll-action">
            <strong>当下行动</strong>
            <p>{narrative.actionNow}</p>
          </aside>
          <PlacedDaoNotes notes={narrative.daoNotes} placement="closing" />
        </div>
      </details>
    </div>
  </section>;
}
