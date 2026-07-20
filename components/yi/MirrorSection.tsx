"use client";

import { useState } from "react";
import { matchLifeMirrors, type MirrorCandidate } from "../../lib/yi/mirrors";
import type { MovieCharacterRecord } from "../../lib/yi/movie-characters";
import { YI_REFERENCE_SOURCES } from "../../lib/yi/sources";
import type { FourPillarsResult } from "../../lib/yi/types";
import { buildZodiacMirror } from "../../lib/yi/zodiac-mirror";

type MirrorView = "zodiac" | "animals" | "historical" | "movies";

const MIRROR_TABS: { id: MirrorView; label: string }[] = [
  { id: "zodiac", label: "生肖镜像" },
  { id: "animals", label: "动物镜像" },
  { id: "historical", label: "历史人物" },
  { id: "movies", label: "电影角色" },
];

function isMovieCandidate(candidate: MirrorCandidate): candidate is MovieCharacterRecord {
  return candidate.kind === "movie" && "characterName" in candidate;
}

export function MirrorSection({ chart }: { chart: FourPillarsResult }) {
  const [activeView, setActiveView] = useState<MirrorView>("zodiac");
  const zodiac = buildZodiacMirror(chart);
  const mirrors = matchLifeMirrors(chart);
  const candidateViews = [
    { id: "animals", candidates: mirrors.animals },
    { id: "historical", candidates: mirrors.historical },
    { id: "movies", candidates: mirrors.movies },
  ] as const;

  return <section className="report-section">
    <header>
      <small>东方镜像</small>
      <h1>借一面镜子，看一个维度</h1>
      <p>先看生肖镜像这面年支文化镜，再用主盘与现实经历校准；动物原型、历史人物与电影角色只用于维度比较。镜像提供观察语言，不宣称人与人的命运相同。</p>
    </header>

    <nav className="mirror-tabs" aria-label="人生镜像选择">
      {MIRROR_TABS.map(tab => <button
        type="button"
        aria-pressed={activeView === tab.id}
        className={activeView === tab.id ? "active" : ""}
        key={tab.id}
        onClick={() => setActiveView(tab.id)}
      >{tab.label}</button>)}
    </nav>

    <div className="mirror-view" data-mirror-view="zodiac" hidden={activeView !== "zodiac"}>
      <article className="reading-card zodiac-mirror">
        <span>生肖镜像 · 年支文化镜</span>
        <div className="zodiac-heading">
          <div>
            <small>{zodiac.yearAmbiguous ? `代表候选：${zodiac.branch}${zodiac.zodiac}` : `${zodiac.branch}支 · ${zodiac.element} · ${zodiac.yinYang}`} · {zodiac.confidence}</small>
            <h2>{zodiac.zodiac} · {zodiac.firstImpression}</h2>
          </div>
          <p>{zodiac.culturalSource}</p>
        </div>
        {(zodiac.yearAmbiguous || zodiac.monthAmbiguous) && <p className="zodiac-coordinate-note">{zodiac.yearAmbiguous ? "年柱处于交节边界，生肖仅显示当前代表候选。" : ""}{zodiac.monthAmbiguous ? "月柱处于交节边界，月令互证仅显示代表候选。" : ""}</p>}
        <div className="zodiac-patterns">
          <p><b>建立信任</b>{zodiac.trustStyle}</p>
          <p><b>顺境能力</b>{zodiac.strengthPattern}</p>
          <p><b>压力提醒</b>{zodiac.pressurePattern}</p>
        </div>
        <div className="zodiac-scenes">
          <section><b>工作现场</b><p>{zodiac.workScene}</p></section>
          <section><b>关系现场</b><p>{zodiac.relationshipScene}</p></section>
          <section><b>家庭现场</b><p>{zodiac.familyScene}</p></section>
        </div>
        <details className="zodiac-evidence">
          <summary>与八字主盘互证</summary>
          <p>{zodiac.chartAgreement}</p>
          <p>{zodiac.chartDifference}</p>
        </details>
        <div className="zodiac-actions">
          <p><b>此刻可做</b>{zodiac.immediateAction}</p>
          <p><b>长期练习</b>{zodiac.longTermPractice}</p>
        </div>
        <aside className="zodiac-boundary"><b>使用边界</b><p>{zodiac.caution}</p></aside>
        <footer className="zodiac-sources">
          <b>理论与文化来源</b>
          <p className="zodiac-product-note"><strong>产品观察模型</strong>：生活场景、信任方式与行动建议属于产品观察模型和生活化转译，不是古籍原文。</p>
          <details>
            <summary>查看来源用途与边界</summary>
            <ul>{zodiac.sources.map(id => {
              const source = YI_REFERENCE_SOURCES[id];
              return <li key={id}>
                <a href={source.url} target="_blank" rel="noreferrer">{source.grade} · {source.title}</a>
                <p>{source.role}</p>
                <small>{source.boundary}</small>
              </li>;
            })}</ul>
          </details>
        </footer>
      </article>
    </div>

    {candidateViews.map(view => <div
      className="mirror-view"
      data-mirror-view={view.id}
      hidden={activeView !== view.id}
      key={view.id}
    >
      <div className="mirror-candidates">
        {view.candidates.map(candidate => {
          const movie = isMovieCandidate(candidate) ? candidate : null;
          return <article className="mirror-candidate" key={candidate.id}>
            <header>
              <small>{candidate.kind === "movie" ? "电影角色镜像" : "人生镜像"}</small>
              <h2>{movie ? movie.characterName : candidate.name}</h2>
              {movie && <p className="mirror-film-title">《{movie.filmTitle}》</p>}
            </header>
            <section><b>为什么相似</b><p>{candidate.similar}</p></section>
            <section><b>哪里不同</b><p>{candidate.different}</p></section>
            <section><b>可以借鉴</b><p>{candidate.lesson}</p></section>
            <aside><b>需要避开的阴影</b><p>{candidate.shadow}</p></aside>
            <details><summary>来源与使用边界</summary><p>{candidate.sourceReferences.join("｜")}</p></details>
          </article>;
        })}
      </div>
    </div>)}
  </section>;
}
