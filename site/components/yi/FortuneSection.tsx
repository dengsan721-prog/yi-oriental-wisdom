"use client";
import { useState } from "react";
import { buildFortuneTimeline, type FortuneReading } from "../../lib/yi/fortune";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

const readingLabels: ReadonlyArray<[keyof FortuneReading, string]> = [
  ["climate", "阶段气候"],
  ["originalInteraction", "原局互动"],
  ["opportunity", "机会来源"],
  ["pressure", "压力来源"],
  ["career", "工作推进"],
  ["resources", "资源配置"],
  ["relationship", "关系沟通"],
  ["wellbeing", "身心边界"],
  ["strategy", "阶段策略"],
];

const confidenceLabels: Record<FourPillarsResult["confidence"], string> = {
  high: "高置信",
  medium: "中等置信",
  limited: "有限置信",
};

export function FortuneSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  const timeline = buildFortuneTimeline(chart, birth);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  if (!timeline.length) return <section className="report-section"><header><small>阶段节律</small><h1>大运时间线待确认</h1><p>{birth.timeConfidence === "unknown" ? "出生时辰未知会影响起运时刻、起运年龄与阶段年份，当前不生成精确大运或流年时间线；补充可靠时辰后再查看。" : "顺逆排需要出生性别。当前未指定，因此不生成可能误导的起运年份；补全资料后再查看。"}</p></header></section>;
  const period = timeline[Math.min(periodIndex, timeline.length - 1)];
  const year = period.years[Math.min(yearIndex, period.years.length - 1)];
  return <section className="report-section fortune-report">
    <header><small>大运流年</small><h1>把阶段主题落到一年</h1><p>{period.method.disclaimer}</p></header>

    <div className="choice-row" role="group" aria-label="选择大运">
      {timeline.map((item, index) => <button key={item.id} className={periodIndex === index ? "active" : ""} aria-pressed={periodIndex === index} onClick={() => { setPeriodIndex(index); setYearIndex(0); }}>
        {item.stemBranch}<small>{item.startYear}–{item.endYear}</small>
      </button>)}
    </div>

    <article className="fortune-period-card">
      <header><div><span>{period.stemBranch}大运 · {period.tenGod}</span><h2>{period.theme}</h2></div><small>{period.startAge}–{period.endAge} 岁 · {period.startYear}–{period.endYear} · {confidenceLabels[period.confidence]}</small></header>
      <dl className="fortune-reading">
        {readingLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{period.reading[key]}</dd></div>)}
      </dl>
      <details className="fortune-method"><summary>查看排运方法与起运依据</summary><p>{period.method.basis}</p><small>规则版本：{period.method.ruleVersion}</small></details>
    </article>

    <div className="choice-row year-row" role="group" aria-label="选择流年">
      {period.years.map((item, index) => <button key={item.year} className={yearIndex === index ? "active" : ""} aria-pressed={yearIndex === index} onClick={() => setYearIndex(index)}>
        {item.year}<small>{item.stemBranch} · {item.age}岁</small>
      </button>)}
    </div>

    <article className="fortune-year-card">
      <header><span>{year.year} · {year.stemBranch}</span><h2>{year.theme}</h2><p>{year.basis}</p></header>
      <div className="fortune-year-layers">
        <section><b>岁运关系</b><p>{year.interaction}</p></section>
        <section><b>典型场景</b><p>{year.scenario}</p></section>
        <section><b>年度动作</b><p>{year.action}</p></section>
      </div>
    </article>
  </section>;
}
