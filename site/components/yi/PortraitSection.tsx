import type { CSSProperties } from "react";
import {
  buildLifeScrollNarrative,
  type DaoStoryNote,
  type LifeScrollRecommendations,
} from "../../lib/yi/life-scroll";
import { buildFortuneStoryTimeline } from "../../lib/yi/fortune-story";
import type { StoryMirror } from "../../lib/yi/story-mirrors";
import type {
  BirthInput,
  FourPillarsResult,
  InterpretationItem,
  ProfessionalReport,
} from "../../lib/yi/types";
import { CollapseSectionButton, SceneLineArt, type SceneLineArtKind } from "./SceneLineArt";

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
  artKind,
  index,
  title,
  subtitle,
}: {
  artKind: SceneLineArtKind;
  index: string;
  title: string;
  subtitle: string;
}) {
  return <summary>
    <SceneLineArt kind={artKind} />
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
  return <details className="life-scroll-part waterfall-card waterfall-card--illustrated life-scroll-interlude">
    <WaterfallSummary
      artKind={kind === "动物镜像" ? "animal" : "history"}
      index={kind}
      title={kind === "历史镜像" ? `历史导师 · ${mirror.name}` : mirror.name}
      subtitle={kind === "动物镜像" ? "用一个动物场景读懂行动方式" : "用一个历史人物读懂人生回声"}
    />
    <div className="waterfall-card-body life-scroll-mirror">
      <p><strong>{kind === "动物镜像" ? "它是谁" : "这位人物是谁"}</strong>{mirror.introduction}</p>
      <p><strong>相像的一幕</strong>{mirror.matchingScene}</p>
      <p><strong>重要区别</strong>{mirror.difference}</p>
      <p><strong>带走的方法</strong>{mirror.takeaway}</p>
      <CollapseSectionButton label="收起，回到总览" quiet />
    </div>
  </details>;
}

function RecommendationCard({
  artKind,
  index,
  title,
  item,
}: {
  artKind: SceneLineArtKind;
  index: string;
  title: string;
  item: { phrase?: string; title?: string; original?: string; lyricImagery?: string; commentary: string };
}) {
  const headline = item.phrase ?? item.title ?? title;
  return <details className="life-scroll-part waterfall-card waterfall-card--illustrated life-scroll-recommendation">
    <WaterfallSummary artKind={artKind} index={index} title={title} subtitle={headline} />
    <div className="waterfall-card-body">
      <p className="life-recommendation-headline">{headline}</p>
      {item.original && <section className="life-recommendation-original"><b>原诗</b><p>{item.original}</p></section>}
      {item.lyricImagery && <section className="life-recommendation-original"><b>歌词意象</b><p>{item.lyricImagery}</p></section>}
      <p>{item.commentary}</p>
      <CollapseSectionButton label="收起，回到总览" quiet />
    </div>
  </details>;
}

function LifeScrollRecommendationCards({ recommendations }: { recommendations: LifeScrollRecommendations }) {
  return <>
    <RecommendationCard artKind="idiom" index="趣味签 · 成语" title="命运成语" item={recommendations.idiom} />
    <RecommendationCard artKind="proverb" index="趣味签 · 俗语" title="一句俗语" item={recommendations.proverb} />
    <RecommendationCard artKind="poem" index="趣味签 · 诗" title="推荐一首诗" item={recommendations.poem} />
    <RecommendationCard artKind="music" index="趣味签 · 古典乐" title="传统古典音乐" item={recommendations.classicalMusic} />
    <RecommendationCard artKind="jay" index="趣味签 · 周杰伦" title="周杰伦歌单" item={recommendations.jayChouSong} />
    <RecommendationCard artKind="herb" index="趣味签 · 药材" title="像哪一味中药材" item={recommendations.herb} />
    <RecommendationCard artKind="mountain" index="趣味签 · 名山" title="像哪一座名山" item={recommendations.mountain} />
    <RecommendationCard artKind="book" index="趣味签 · 人生之书" title="推荐一本古代典籍" item={recommendations.lifeBook} />
    <RecommendationCard artKind="poem" index="趣味签 · 定场诗" title="给人生写一首定场诗" item={recommendations.settingPoem} />
  </>;
}

const hundredYearDays = Math.round(365.2425 * 100);

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseBirthLocalDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function buildHundredYearLifeProgress(
  birthDate: string,
  today = new Date(),
) {
  const daysLived = Math.max(
    0,
    Math.floor(
      (startOfLocalDay(today).getTime() - parseBirthLocalDay(birthDate).getTime())
        / 86_400_000,
    ),
  );
  const progressPercent = Math.min(100, daysLived / hundredYearDays * 100);
  const percentText = `${progressPercent.toFixed(1)}%`;
  return {
    daysLived,
    formattedDays: new Intl.NumberFormat("en-US").format(daysLived),
    progressPercent,
    percentText,
    blessing: "愿你看见过去没有白走，也愿未来越走越亮：心里有火，脚下有路，转念之后，命就开始松动。",
  };
}

function buildFortuneCue(
  chart: Readonly<FourPillarsResult>,
  birth: BirthInput,
  today: Date,
) {
  const timeline = buildFortuneStoryTimeline(chart, birth);
  if (timeline.status !== "available") return "这一程先把脚步踩稳，等时辰更清楚，再看大运流年的细线。";
  const year = today.getFullYear();
  const period = timeline.periods.find(item =>
    item.years.some(storyYear => storyYear.year === year),
  ) ?? timeline.periods[0];
  const storyYear = period.years.find(item => item.year === year) ?? period.years[0];
  return `大运这一幕：${period.title}；流年这一格：${storyYear.title}。`;
}

function HundredYearLifeCard({
  birth,
  chart,
  today,
}: {
  birth: BirthInput;
  chart: FourPillarsResult;
  today: Date;
}) {
  const progress = buildHundredYearLifeProgress(birth.date, today);
  const fortuneCue = buildFortuneCue(chart, birth, today);
  const walkerX = 16 + 188 * progress.progressPercent / 100;
  return (
    <article className="life-progress-card">
      <div className="life-progress-copy">
        <small>百岁人生进度</small>
        <h2>你已经走过 {progress.formattedDays} 天</h2>
        <p>若把人生暂按 100 岁铺成一条长路，现在走到 {progress.percentText}。前路有汗、有弯、有硬扛；后路也还留着翻盘、发芽和再出发。</p>
        <p className="life-progress-fortune">{fortuneCue}</p>
        <strong>{progress.blessing}</strong>
      </div>
      <div className="life-progress-visual" style={{ "--life-walker-x": `${walkerX}px` } as CSSProperties}>
        <svg className="life-progress-stickman" aria-hidden="true" focusable="false" viewBox="0 0 220 118">
          <path className="life-progress-road life-progress-road--past" d="M16 88C48 70 79 99 111 77s61-23 93-3" />
          <path className="life-progress-road life-progress-road--future" d="M110 78c30-22 62-25 94-3" />
          <g className="life-progress-person">
            <circle cx="0" cy="-23" r="8" />
            <path d="M0-14v24M0-4l-16 10M0-4l15 9M0 10l-12 18M0 10l15 17" />
          </g>
          <g className="life-progress-sun"><circle cx="185" cy="25" r="8" /><path d="M185 10v7M185 33v7M170 25h7M193 25h7M174 14l5 5M196 14l-5 5M174 36l5-5M196 36l-5-5" /></g>
        </svg>
        <span>{progress.percentText}</span>
      </div>
    </article>
  );
}

export function PortraitSection({
  birth,
  chart,
  report,
  items,
  today = new Date(),
}: {
  birth: BirthInput;
  chart: FourPillarsResult;
  report: ProfessionalReport;
  items: InterpretationItem[];
  today?: Date;
}) {
  const narrative = buildLifeScrollNarrative(chart, report, items);

  return <section className="report-section portrait-report">
    <header className="life-scroll-heading">
      <small>自己创造自己</small>
      <h1>人生画卷</h1>
      <p>把命盘读成一条修炼路：先认命题，再破局，再把事业、关系与节奏炼成自己的手艺。主角不是被剧情推着走的人，而是一步步创造自己的人。</p>
    </header>
    <HundredYearLifeCard birth={birth} chart={chart} today={today} />
    <ol className="life-scroll-order-map" aria-label="人生画卷阅读线索"><li>命题</li><li>破局</li><li>人间现场</li><li>意象映照</li><li>百岁回望</li></ol>
    <div className="life-scroll-reading waterfall-grid">
      <details className="life-scroll-part waterfall-card waterfall-card--illustrated life-scroll-opening">
        <WaterfallSummary artKind="opening" index="开场 · 命运给出的第一道题" title="人生一句话" subtitle={narrative.oneLineTheme} />
        <div className="waterfall-card-body">
          <blockquote>{narrative.oneLineTheme}</blockquote>
          {narrative.openingScene.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <CollapseSectionButton label="收起，回到总览" quiet />
        </div>
      </details>

      <MirrorInterlude kind="动物镜像" mirror={narrative.animalInterlude} />

      <details className="life-scroll-part waterfall-card waterfall-card--illustrated">
        <WaterfallSummary artKind="career" index="副本一 · 事业副本" title="事业线" subtitle="事业、承担与机会怎样展开" />
        <div className="waterfall-card-body">
          {narrative.careerArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="career" />
          <CollapseSectionButton label="收起，回到总览" quiet />
        </div>
      </details>

      <details className="life-scroll-part waterfall-card waterfall-card--illustrated">
        <WaterfallSummary artKind="relationship" index="副本二 · 关系副本" title="婚姻与关系线" subtitle="亲密关系、沟通和修复的一幕" />
        <div className="waterfall-card-body">
          {narrative.relationshipArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="relationship" />
          <CollapseSectionButton label="收起，回到总览" quiet />
        </div>
      </details>

      <details className="life-scroll-part waterfall-card waterfall-card--illustrated">
        <WaterfallSummary artKind="turn" index="转折 · 命运转折" title="命运转折线" subtitle="低点、选择与转身的方式" />
        <div className="waterfall-card-body">
          {narrative.turningPointArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <PlacedDaoNotes notes={narrative.daoNotes} placement="turning-point" />
          <CollapseSectionButton label="收起，回到总览" quiet />
        </div>
      </details>

      <MirrorInterlude kind="历史镜像" mirror={narrative.historicalInterlude} />

      <details className="life-scroll-part waterfall-card waterfall-card--illustrated">
        <WaterfallSummary artKind="mature" index="后半场" title="中后程" subtitle="成熟之后怎样收束力量" />
        <div className="waterfall-card-body">
          {narrative.matureArc.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <CollapseSectionButton label="收起，回到总览" quiet />
        </div>
      </details>

      <LifeScrollRecommendationCards recommendations={narrative.recommendations} />

      <details className="life-scroll-part waterfall-card waterfall-card--illustrated life-scroll-closing">
        <WaterfallSummary artKind="closing" index="写在卷尾 · 卷尾行动" title="收束" subtitle="读完之后今天先做什么" />
        <div className="waterfall-card-body">
          <p>{narrative.closingLine}</p>
          <aside className="life-scroll-action">
            <strong>当下行动</strong>
            <p>{narrative.actionNow}</p>
          </aside>
          <PlacedDaoNotes notes={narrative.daoNotes} placement="closing" />
          <CollapseSectionButton label="收起，回到总览" quiet />
        </div>
      </details>
    </div>
  </section>;
}
