import {
  buildLifeScrollNarrative,
  type DaoStoryNote,
  type LifeScrollRecommendations,
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
      title={kind === "历史镜像" ? `历史导师 · ${mirror.name}` : mirror.name}
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

function RecommendationCard({
  index,
  title,
  item,
}: {
  index: string;
  title: string;
  item: { phrase?: string; title?: string; commentary: string };
}) {
  const headline = item.phrase ?? item.title ?? title;
  return <details className="life-scroll-part waterfall-card life-scroll-recommendation">
    <WaterfallSummary index={index} title={title} subtitle={headline} />
    <div className="waterfall-card-body">
      <p className="life-recommendation-headline">{headline}</p>
      <p>{item.commentary}</p>
    </div>
  </details>;
}

function LifeScrollRecommendationCards({ recommendations }: { recommendations: LifeScrollRecommendations }) {
  return <>
    <RecommendationCard index="趣味签 · 成语" title="命运成语" item={recommendations.idiom} />
    <RecommendationCard index="趣味签 · 俗语" title="一句俗语" item={recommendations.proverb} />
    <RecommendationCard index="趣味签 · 诗" title="推荐一首诗" item={recommendations.poem} />
    <RecommendationCard index="趣味签 · 古典乐" title="传统古典音乐" item={recommendations.classicalMusic} />
    <RecommendationCard index="趣味签 · 周杰伦" title="周杰伦歌单" item={recommendations.jayChouSong} />
  </>;
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
      <small>第一章 · 英雄成长记</small>
      <h1>人生画卷</h1>
      <p>把命盘读成一部电影：开场遇见难题，路上遇见镜像和导师，在事业、关系与节奏里闯关，最后带走今天能升级的一招。</p>
    </header>
    <div className="life-scroll-reading waterfall-grid">
      <details className="life-scroll-part waterfall-card life-scroll-opening">
        <WaterfallSummary index="开场 · 命运给出的第一道题" title="人生一句话" subtitle={narrative.oneLineTheme} />
        <div className="waterfall-card-body">
          <blockquote>{narrative.oneLineTheme}</blockquote>
          {narrative.openingScene.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </details>

      <MirrorInterlude kind="动物镜像" mirror={narrative.animalInterlude} />

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="副本一 · 事业副本" title="事业线" subtitle="事业、承担与机会怎样展开" />
        <div className="waterfall-card-body">
          {narrative.careerArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="career" />
        </div>
      </details>

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="副本二 · 关系副本" title="婚姻与关系线" subtitle="亲密关系、沟通和修复的一幕" />
        <div className="waterfall-card-body">
          {narrative.relationshipArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="relationship" />
        </div>
      </details>

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="转折 · 命运转折" title="命运转折线" subtitle="低点、选择与转身的方式" />
        <div className="waterfall-card-body">
          {narrative.turningPointArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="turning-point" />
        </div>
      </details>

      <MirrorInterlude kind="历史镜像" mirror={narrative.historicalInterlude} />

      <details className="life-scroll-part waterfall-card">
        <WaterfallSummary index="后半场" title="中后程" subtitle="成熟之后怎样收束力量" />
        <div className="waterfall-card-body">
          {narrative.matureArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </details>

      <LifeScrollRecommendationCards recommendations={narrative.recommendations} />

      <details className="life-scroll-part waterfall-card life-scroll-closing">
        <WaterfallSummary index="写在卷尾 · 卷尾行动" title="收束" subtitle="读完之后今天先做什么" />
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
