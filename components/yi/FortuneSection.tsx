"use client";
import { useState } from "react";
import { buildFortuneTimeline } from "../../lib/yi/fortune";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

export function FortuneSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  const timeline = buildFortuneTimeline(chart, birth);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  if (!timeline.length) return <section className="report-section"><header><small>阶段节律</small><h1>大运时间线待确认</h1><p>{birth.timeConfidence === "unknown" ? "出生时辰未知会影响起运时刻、起运年龄与阶段年份，当前不生成精确大运或流年时间线；补充可靠时辰后再查看。" : "顺逆排需要出生性别。当前未指定，因此不生成可能误导的起运年份；补全资料后再查看。"}</p></header></section>;
  const period = timeline[Math.min(periodIndex, timeline.length - 1)]; const year = period.years[Math.min(yearIndex, period.years.length - 1)];
  return <section className="report-section"><header><small>大运流年</small><h1>把阶段主题落到一年</h1><p>{period.method.disclaimer}</p></header>
    <div className="choice-row" role="group" aria-label="选择大运">{timeline.map((item, index) => <button key={item.id} className={periodIndex === index ? "active" : ""} onClick={() => { setPeriodIndex(index); setYearIndex(0); }}>{item.stemBranch}<small>{item.startYear}–{item.endYear}</small></button>)}</div>
    <article className="reading-card"><span>{period.tenGod} · {period.startAge}–{period.endAge} 岁</span><h2>{period.theme}</h2><p>{period.method.basis}</p></article>
    <div className="choice-row year-row" role="group" aria-label="选择流年">{period.years.map((item, index) => <button key={item.year} className={yearIndex === index ? "active" : ""} onClick={() => setYearIndex(index)}>{item.year}<small>{item.stemBranch}</small></button>)}</div>
    <article className="reading-card"><h2>{year.year} · {year.theme}</h2><p>{year.basis}</p><b>行动</b><p>{year.action}</p></article>
  </section>;
}
