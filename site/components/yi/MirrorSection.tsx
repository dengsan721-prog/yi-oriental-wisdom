"use client";

import { useState } from "react";
import {
  buildMirrorPublicViews,
  type MirrorPublicCard,
  type MirrorPublicView,
} from "../../lib/yi/mirrors";
import type { FourPillarsResult } from "../../lib/yi/types";
import { SceneLineArt } from "./SceneLineArt";

export type MirrorView = MirrorPublicView["id"];

const MIRROR_TABS: readonly {
  id: MirrorView;
  label: string;
}[] = [
  { id: "zodiac", label: "生肖镜像" },
  { id: "animal", label: "动物镜像" },
  { id: "historical", label: "历史人物" },
  { id: "movie", label: "电影角色" },
];

export function MirrorPublicCards({
  cards,
  viewId,
}: {
  cards: readonly MirrorPublicCard[];
  viewId?: MirrorView;
}) {
  return <div className="mirror-public-cards">
    {cards.map((card, index) => <article
      className="mirror-public-card"
      key={`${card.name}-${index}`}
    >
      <header>
        {viewId === "zodiac" && <div className="zodiac-totem"><SceneLineArt kind="zodiac" /></div>}
        <small>先认识</small>
        <h2>{card.name}</h2>
        {card.workTitle && <p>{card.workTitle}</p>}
      </header>
      <p>{card.introduction}</p>
      <section><b>像你的一个现场</b><p>{card.matchingScene}</p></section>
      <section><b>最重要的不同</b><p>{card.importantDifference}</p></section>
      <section><b>可以带走的动作</b><p>{card.takeaway}</p></section>
      <aside><b>有趣的一面</b><p>{card.playfulObservation}</p></aside>
    </article>)}
  </div>;
}

export function MirrorSection({ chart }: { chart: FourPillarsResult }) {
  const [activeView, setActiveView] = useState<MirrorView>("zodiac");
  return <MirrorSectionView
    chart={chart}
    activeView={activeView}
    onSelectView={setActiveView}
  />;
}

export function MirrorSectionView({
  chart,
  activeView,
  onSelectView,
}: {
  chart: FourPillarsResult;
  activeView: MirrorView;
  onSelectView: (view: MirrorView) => void;
}) {
  const views = buildMirrorPublicViews(chart);

  return <section className="report-section">
    <header>
      <small>东方镜像</small>
      <h1>借一面镜子，看一个动作</h1>
      <p>生肖、动物、历史人物和电影角色各照一个生活维度。先认识镜中对象，再看相似现场、重要差异和能带走的小动作。</p>
    </header>

    <nav className="mirror-tabs" aria-label="人生镜像选择">
      {MIRROR_TABS.map(tab => <button
        type="button"
        aria-pressed={activeView === tab.id}
        className={activeView === tab.id ? "active" : ""}
        key={tab.id}
        onClick={() => onSelectView(tab.id)}
      >{tab.label}</button>)}
    </nav>

    {views.map(view => <section
      className="mirror-view"
      aria-label={`${view.label}内容`}
      hidden={activeView !== view.id}
      key={view.id}
    >
      {view.lead && <blockquote className="folk-lead">
        {view.lead.attribution}：“{view.lead.saying}”
      </blockquote>}
      <MirrorPublicCards cards={view.cards} viewId={view.id} />
    </section>)}
  </section>;
}
