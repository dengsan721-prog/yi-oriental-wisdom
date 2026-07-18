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

const lifeAreaLabels = {
  career: "事业",
  wealth: "财富",
  relationship: "关系",
  family: "家庭",
  rhythm: "身心节奏",
} as const;

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
      <details className="fortune-stage-depth"><summary>展开阶段故事与行动</summary>
        <section className="fortune-stage-story"><b>阶段故事</b><p>{period.stageStory}</p></section>
        <dl className="fortune-life-areas">
          {(Object.keys(lifeAreaLabels) as Array<keyof typeof lifeAreaLabels>).map(key => <div key={key}><dt>{lifeAreaLabels[key]}</dt><dd>{period.lifeAreas[key]}</dd></div>)}
        </dl>
        <div className="fortune-stage-states">
          <section><b>顺势状态</b><p>{period.alignedState}</p></section>
          <section><b>吃力状态</b><p>{period.strainedState}</p></section>
        </div>
        <section className="fortune-stage-actions"><b>三项阶段行动</b><ol>{period.actions.map((action, index) => <li key={action}><span>0{index + 1}</span>{action}</li>)}</ol></section>
      </details>
      <details className="fortune-professional-depth"><summary>查看九项专业依据</summary>
        <dl className="fortune-reading">
          {readingLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{period.reading[key]}</dd></div>)}
        </dl>
        <details className="fortune-method"><summary>查看排运方法与起运依据</summary><p>{period.method.basis}</p><small>规则版本：{period.method.ruleVersion}</small></details>
      </details>
    </article>

    <div className="choice-row year-row" role="group" aria-label="选择流年">
      {period.years.map((item, index) => <button key={item.year} className={yearIndex === index ? "active" : ""} aria-pressed={yearIndex === index} onClick={() => setYearIndex(index)}>
        {item.year}<small>{item.stemBranch} · {item.age}岁</small>
      </button>)}
    </div>

    <article className="fortune-year-card">
      <header><span>{year.year} · {year.stemBranch}</span><h2>{year.theme}</h2></header>
      <section className="fortune-weather"><b>年度天气</b><p>{year.weatherMetaphor}</p></section>
      <details className="fortune-year-evidence"><summary>查看年度依据、场景与行动</summary>
        <p className="fortune-year-basis">{year.basis}</p>
        <div className="fortune-year-layers">
          <section><b>岁运关系</b><p>{year.interaction}</p></section>
          <section><b>典型场景</b><p>{year.scenario}</p></section>
          <section><b>年度动作</b><p>{year.action}</p></section>
        </div>
      </details>
    </article>
  </section>;
}
