"use client";

import { useEffect, useMemo, useState } from "react";
import { domainLabels, relationshipTypes } from "../../lib/content/demo";
import { toEarthlyHour } from "../../lib/yi/date-picker";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";
import type {
  ElementName,
  FourPillarsResult,
} from "../../lib/yi/types";

type Stage = "intro" | "intake" | "calculating" | "result";
const elements: ElementName[] = ["木", "火", "土", "金", "水"];
const zodiac: Record<string, string> = {
  子: "鼠",
  丑: "牛",
  寅: "虎",
  卯: "兔",
  辰: "龙",
  巳: "蛇",
  午: "马",
  未: "羊",
  申: "猴",
  酉: "鸡",
  戌: "狗",
  亥: "猪",
};
const elementStory: Record<
  ElementName,
  { title: string; summary: string; action: string }
> = {
  木: {
    title: "生发成势",
    summary: "重成长与连接，越有空间越能发挥。",
    action: "聚焦一个长期方向，持续积累。",
  },
  火: {
    title: "明朗显化",
    summary: "重表达与影响，行动常因目标清晰而加速。",
    action: "先做出可见成果，再扩大影响。",
  },
  土: {
    title: "厚重承载",
    summary: "重秩序与稳定，善于把复杂事情落稳。",
    action: "守住边界，避免承接过多。",
  },
  金: {
    title: "清晰取舍",
    summary: "重标准与效率，擅长判断、收束和决断。",
    action: "保留关键目标，减少低效消耗。",
  },
  水: {
    title: "深思应变",
    summary: "重观察与变化，善于在复杂环境寻找出口。",
    action: "为决策设置期限，避免过度等待。",
  },
};

function Mark() {
  return (
    <div className="yi-mark" aria-label="艺">
      <span>艺</span>
      <i />
      <b />
    </div>
  );
}

export function YiExperience() {
  const currentYear = new Date().getFullYear();
  const [stage, setStage] = useState<Stage>("intro");
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(6);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(30);
  const [unknownHour, setUnknownHour] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("杭州");
  const [calcStep, setCalcStep] = useState(0);
  const [result, setResult] = useState<FourPillarsResult | null>(null);
  const [relation, setRelation] = useState(0);
  const [otherYear, setOtherYear] = useState(1992);
  useEffect(() => {
    if (stage !== "calculating") return;
    const timer = window.setInterval(
      () =>
        setCalcStep((value) => {
          if (value >= 5) {
            window.clearInterval(timer);
            window.setTimeout(() => setStage("result"), 240);
            return value;
          }
          return value + 1;
        }),
      260,
    );
    return () => window.clearInterval(timer);
  }, [stage]);

  const dominant = useMemo(
    () =>
      result
        ? elements.reduce(
            (best, item) =>
              result.elementCounts[item] > result.elementCounts[best]
                ? item
                : best,
            "木",
          )
        : "木",
    [result],
  );
  const weakest = useMemo(
    () =>
      result
        ? elements.reduce(
            (best, item) =>
              result.elementCounts[item] < result.elementCounts[best]
                ? item
                : best,
            "木",
          )
        : "水",
    [result],
  );
  const pillarList = result
    ? Object.values(result.pillars).filter(Boolean)
    : [];
  const total = result
    ? Object.values(result.elementCounts).reduce((sum, value) => sum + value, 0)
    : 1;
  const birthBranch = result?.pillars.year.branch ?? "午";
  const relationDelta = Math.abs((year % 12) - (otherYear % 12));
  const relationTone =
    relationDelta <= 2 || relationDelta >= 10
      ? "互补相生"
      : relationDelta <= 5
        ? "节奏有别"
        : "张力明显";

  function runBirthSubmission(value: BirthSubmission) {
    const [nextYear, nextMonth, nextDay] = value.date.split("-").map(Number);
    const [nextHour, nextMinute] = value.time?.split(":").map(Number) ?? [0, 0];
    setYear(nextYear);
    setMonth(nextMonth);
    setDay(nextDay);
    setHour(nextHour);
    setMinute(nextMinute);
    setUnknownHour(value.time === null);
    setName(value.name);
    setLocation(value.location);
    setResult(calculateFourPillars(value));
    setCalcStep(0);
    setStage("calculating");
  }

  return (
    <main>
      {stage === "intro" && (
        <section className="ritual">
          <div className="ritual-bg" />
          <Mark />
          <h1 className="ritual-lines"><span>看见命局</span><span>读懂时运</span></h1>
          <button className="primary" onClick={() => setStage("intake")}>
            开始排盘 <span>→</span>
          </button>
        </section>
      )}

      {stage === "intake" && (
        <section className="intake">
          <header>
            <button onClick={() => setStage("intro")}>← 返回</button>
            <span>艺</span>
            <small>生辰排盘</small>
          </header>
          <BirthIntake onSubmit={runBirthSubmission} />
        </section>
      )}

      {stage === "calculating" && (
        <section className="calculating">
          <Mark />
          <p>正在建立 {name} 的命盘</p>
          <div className="calc-list">
            {["四柱", "五行", "十神", "格局", "喜忌", "大运"].map(
              (item, index) => (
                <div className={index <= calcStep ? "active" : ""} key={item}>
                  <span>{index < calcStep ? "✓" : `0${index + 1}`}</span>
                  {item}
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {stage === "result" && result && (
        <section className="chart-page">
          <header className="chart-nav">
            <div>
              <span className="mini-mark">艺</span>
              <b>{name}的命盘</b>
            </div>
            <button onClick={() => setStage("intake")}>重新排盘</button>
          </header>
          <section className="chart-hero">
            <div className="chart-title">
              <small>
                {year}年{month}月{day}日 · {zodiac[birthBranch]}年 ·{" "}
                {unknownHour ? "时辰不详" : toEarthlyHour(hour)}
              </small>
              <h1>{elementStory[dominant].title}</h1>
              <p>{elementStory[dominant].summary}</p>
            </div>
            <div className="pillars">
              {pillarList.map(
                (pillar, index) =>
                  pillar && (
                    <article key={pillar.label}>
                      <span>{["年柱", "月柱", "日柱", "时柱"][index]}</span>
                      <strong>{pillar.stem}</strong>
                      <strong>{pillar.branch}</strong>
                      <small>
                        {pillar.element}·{pillar.branchElement}
                      </small>
                    </article>
                  ),
              )}
            </div>
          </section>
          <section className="data-grid">
            <article className="data-card elements">
              <header>
                <span>五行旺衰</span>
                <b>
                  强 {dominant} · 弱 {weakest}
                </b>
              </header>
              {elements.map((item) => (
                <div key={item}>
                  <span>{item}</span>
                  <i>
                    <b
                      style={{
                        width: `${Math.max(5, (result.elementCounts[item] / total) * 100)}%`,
                      }}
                    />
                  </i>
                  <small>{result.elementCounts[item]}</small>
                </div>
              ))}
            </article>
            <article className="data-card key-facts">
              <div>
                <span>日主</span>
                <strong>
                  {result.pillars.day.stem}
                  {result.pillars.day.element}
                </strong>
              </div>
              <div>
                <span>格局</span>
                <strong>{dominant}势偏显</strong>
              </div>
              <div>
                <span>喜用</span>
                <strong>{weakest}</strong>
              </div>
              <div>
                <span>当前大运</span>
                <strong>
                  {2020 + ((year + month) % 10)}—{2029 + ((year + month) % 10)}
                </strong>
              </div>
            </article>
            <article className="data-card ten-gods">
              <header>
                <span>十神结构</span>
                <b>核心动力</b>
              </header>
              {["比劫", "食伤", "财星", "官杀", "印星"].map((item, index) => (
                <div key={item}>
                  <span>{item}</span>
                  <i
                    style={{
                      height: `${32 + ((result.elementCounts[elements[index]] + index) % 4) * 16}px`,
                    }}
                  />
                  <small>
                    {["自驱", "表达", "经营", "责任", "学习"][index]}
                  </small>
                </div>
              ))}
            </article>
          </section>
          <section className="summary-line">
            <span>一句总断</span>
            <b>{elementStory[dominant].summary}</b>
            <p>趋吉建议：{elementStory[dominant].action}</p>
          </section>
          <section className="domains">
            <header>
              <span>六大命理</span>
              <h2>人生各宫位趋势</h2>
            </header>
            <div>
              {domainLabels.map(([label, professional], index) => (
                <article key={label}>
                  <span>0{index + 1}</span>
                  <h3>{label}</h3>
                  <small>{professional}</small>
                  <i>
                    <b
                      style={{
                        width: `${55 + ((result.elementCounts[elements[index % 5]] + index) % 5) * 8}%`,
                      }}
                    />
                  </i>
                  <p>
                    {index % 2 === 0
                      ? "当前更适合稳中推进，先建立清晰节奏。"
                      : "机会来自协作与选择，避免同时铺开过多方向。"}
                  </p>
                  <button>查看专业依据 →</button>
                </article>
              ))}
            </div>
          </section>
          <section className="fortune">
            <header>
              <span>大运流年</span>
              <h2>十年一步，观势而行</h2>
            </header>
            <div className="timeline">
              {Array.from({ length: 8 }, (_, index) => {
                const start = year + 7 + index * 10;
                return (
                  <article key={start}>
                    <i
                      style={{
                        height: `${36 + ((index + result.elementCounts[dominant]) % 5) * 17}px`,
                      }}
                    />
                    <b>{start}</b>
                    <span>{cycleLabel(index)}</span>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="compatibility">
            <header>
              <span>关系合盘</span>
              <h2>两个人的命局互动</h2>
            </header>
            <div className="relation-tabs">
              {relationshipTypes.map((item, index) => (
                <button
                  className={relation === index ? "active" : ""}
                  onClick={() => setRelation(index)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="compat-grid">
              <label>
                <span>对方出生年份</span>
                <input
                  type="number"
                  min="1900"
                  max={currentYear}
                  value={otherYear}
                  onChange={(event) => setOtherYear(Number(event.target.value))}
                />
              </label>
              <article>
                <span>五行互动</span>
                <strong>{relationTone}</strong>
                <i>
                  <b style={{ width: `${62 + (relationDelta % 4) * 8}%` }} />
                </i>
              </article>
              <article>
                <span>沟通节奏</span>
                <strong>{relationDelta % 2 ? "先听后说" : "同频推进"}</strong>
                <i>
                  <b style={{ width: `${58 + (relationDelta % 5) * 7}%` }} />
                </i>
              </article>
              <article>
                <span>相处建议</span>
                <p>
                  {relation === 2
                    ? "合作前先明确权责、资金与退出机制。"
                    : "遇到分歧先确认彼此真正需要，再讨论方案。"}
                </p>
              </article>
            </div>
          </section>
          <footer>{result.disclaimer}</footer>
        </section>
      )}
    </main>
  );
}

function cycleLabel(index: number) {
  return ["启", "进", "守", "变", "升", "定", "收", "养"][index];
}
