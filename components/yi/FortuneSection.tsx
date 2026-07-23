"use client";

import { useState } from "react";
import {
  buildFortuneStoryTimeline,
  type FortuneStoryPeriod,
} from "../../lib/yi/fortune-story";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

type AvailableFortuneStoryProps = Readonly<{
  periods: readonly [FortuneStoryPeriod, ...FortuneStoryPeriod[]];
  timingNote: string;
}>;

function AvailableFortuneStory({
  periods,
  timingNote,
}: AvailableFortuneStoryProps) {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  const period = periods[Math.min(periodIndex, periods.length - 1)];
  const year = period.years[Math.min(yearIndex, period.years.length - 1)];

  return (
    <section className="report-section fortune-report">
      <header>
        <small>大运阶段</small>
        <h1>看见这一程的生活主题</h1>
        <p>{timingNote}</p>
      </header>

      <div
        className="fortune-stage-selector"
        role="group"
        aria-label="选择大运阶段"
      >
        {periods.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={periodIndex === index ? "active" : ""}
            aria-pressed={periodIndex === index}
            onClick={() => {
              setPeriodIndex(index);
              setYearIndex(0);
            }}
          >
            {item.title}
            <small>{item.ageRange} · {item.yearRange}</small>
          </button>
        ))}
      </div>

      <article className="fortune-period-card fortune-story-card">
        <header>
          <div>
            <small>{period.ageRange} · {period.yearRange}</small>
            <h2>{period.title}</h2>
          </div>
        </header>

        <section className="fortune-stage-story">
          <b>阶段故事</b>
          <p>{period.openingScene}</p>
        </section>

        <div className="fortune-story-grid">
          <section>
            <b>事业</b>
            <p>{period.careerScene}</p>
          </section>
          <section>
            <b>资源</b>
            <p>{period.resourceScene}</p>
          </section>
          <section>
            <b>关系</b>
            <p>{period.relationshipScene}</p>
          </section>
          <section>
            <b>家庭</b>
            <p>{period.familyScene}</p>
          </section>
          <section>
            <b>身心节奏</b>
            <p>{period.rhythmScene}</p>
          </section>
        </div>

        <div className="fortune-state-grid">
          <section>
            <b>顺风处</b>
            <p>{period.favorableCurrent}</p>
          </section>
          <section>
            <b>最容易吃亏的地方</b>
            <p>{period.likelyCost}</p>
          </section>
        </div>

        <section className="fortune-stage-actions">
          <b>这一程最值得做的三件事</b>
          <ol>
            {period.actions.map((action, index) => (
              <li key={action}>
                <span>0{index + 1}</span>
                {action}
              </li>
            ))}
          </ol>
        </section>
      </article>

      <div
        className="fortune-year-selector"
        role="group"
        aria-label="选择阶段年份"
      >
        {period.years.map((item, index) => (
          <button
            key={item.year}
            type="button"
            className={yearIndex === index ? "active" : ""}
            aria-pressed={yearIndex === index}
            onClick={() => setYearIndex(index)}
          >
            {item.year}
            <small>{item.age}岁</small>
          </button>
        ))}
      </div>

      <article className="fortune-year-card fortune-story-card fortune-story-year">
        <header>
          <div>
            <small>{year.year}年 · {year.age}岁</small>
            <h2>{year.title}</h2>
          </div>
        </header>
        <div className="fortune-year-story">
          <section>
            <b>这一年的场景</b>
            <p>{year.scene}</p>
          </section>
          <section>
            <b>可以先做</b>
            <p>{year.action}</p>
          </section>
        </div>
      </article>
    </section>
  );
}

export function FortuneSection({
  chart,
  birth,
}: {
  chart: FourPillarsResult;
  birth: BirthInput;
}) {
  const timeline = buildFortuneStoryTimeline(chart, birth);
  if (timeline.status === "unavailable") {
    return (
      <section className="report-section fortune-report">
        <header>
          <small>大运阶段</small>
          <h1>阶段故事暂未生成</h1>
          <p>{timeline.explanation}</p>
        </header>
      </section>
    );
  }

  return (
    <AvailableFortuneStory
      periods={timeline.periods}
      timingNote={timeline.timingNote}
    />
  );
}
