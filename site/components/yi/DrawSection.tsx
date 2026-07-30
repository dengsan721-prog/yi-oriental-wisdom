"use client";

import { useState } from "react";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { SceneLineArt } from "./SceneLineArt";

const drawCopy = {
  木: {
    sign: "新枝得雨签",
    verse: "旧土藏根，新枝向明；先修一寸，春风自临。",
    reading: "这一签像雨后树枝：不要急着证明自己已经成林，先把手边一件事做出新芽。适合开新局、修关系、补学习，忌一口气铺太大。",
  },
  火: {
    sign: "灯火照路签",
    verse: "一灯破夜，众影归形；先明其心，再动其兵。",
    reading: "这一签像夜路点灯：先把目的说清，把情绪降温，再开口、签字、定计划。适合表达、亮相、推进，忌带着火气争输赢。",
  },
  土: {
    sign: "厚土承车签",
    verse: "车行厚土，慢处有功；先稳其基，再起高楼。",
    reading: "这一签像车轮压过厚土：看似慢，实则稳。适合整理账本、家庭安排、长期责任，忌为了热闹临时改方向。",
  },
  金: {
    sign: "金刃开局签",
    verse: "金刃出鞘，先断乱麻；留其精要，去其浮华。",
    reading: "这一签像利刃切线：先定标准，删掉杂事，再把真正要紧的事拿到台前。适合谈规则、做取舍、立边界，忌话太硬伤人。",
  },
  水: {
    sign: "行舟见桥签",
    verse: "水到桥前，舟自识门；不争一浪，终有归津。",
    reading: "这一签像小船靠近桥洞：路不一定在远处，常在靠近后显形。适合沟通、迁移、学习新信息，忌还没看清就下死结论。",
  },
  neutral: {
    sign: "云开见径签",
    verse: "云不久遮，路自成行；先行一步，再问远方。",
    reading: "这一签适合时辰或结构暂未完全稳定的人：不急着给人生定性，先把今天能做的小步做完，路会在行动里慢慢清楚。",
  },
} as const;

const drawLevels = {
  木: "小吉",
  火: "中吉",
  土: "中吉",
  金: "大吉",
  水: "小凶",
  neutral: "小吉",
} as const;

export function DrawSection({
  chart,
  birth,
}: {
  chart: FourPillarsResult;
  birth: BirthInput;
}) {
  const [drawn, setDrawn] = useState(false);
  const element = deriveYiThemeElement(chart);
  const copy = drawCopy[element];
  const level = drawLevels[element];
  const branch = chart.pillars.year.branch;

  return <section className="report-section oracle-report">
    <header>
      <small>民间趣味签</small>
      <h1>抽一支当下行动签</h1>
      <p>这支签跟着你的出生盘气质、年支与当下阅读场景变化，重点不在吓人，而在给今天一个能落地的小动作。</p>
    </header>
    <article className={"oracle-ritual-stage oracle-card oracle-card--interactive" + (drawn ? " has-drawn" : "")}>
      <div className="oracle-ritual-focus">
        <div className="oracle-seal">签</div>
        <button className="oracle-tube-button oracle-tube-button--large" data-testid="draw-lot-trigger" type="button" onClick={() => setDrawn(true)}><SceneLineArt kind="oracle" /><span>签筒</span><small>{drawn ? "再摇一次" : "点击摇签"}</small></button>
      </div>
      <div className="oracle-reading">
        <small>{birth.name.trim() || "你"} · 年支{branch} · 每日行动签</small>
        <h2>{drawn ? copy.sign : "签筒已备，先摇一支"}</h2>
        {drawn && <span className="oracle-level">{level}</span>}
        {drawn && <section className="oracle-poem" aria-label="签诗"><b>签诗</b><blockquote>{copy.verse}</blockquote></section>}
        <p>{drawn ? copy.reading : "抽签每天随阅读时间、命盘气质和当下阶段变换。先想一件卡住的事，再点签筒，签文就不只是热闹，而是给今天一枚小小的行动令。"}</p>
      </div>
    </article>
  </section>;
}
