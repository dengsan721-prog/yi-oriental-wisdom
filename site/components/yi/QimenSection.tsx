"use client";

import { useState } from "react";
import { deriveYiThemeElement, type YiThemeElement } from "../../lib/yi/theme";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

type DailyQimenRecord = {
  element: YiThemeElement;
  dynamicKey: string;
  invariant: string;
  direction: string;
  gate: string;
  method: string;
  prompt: string;
};

const qimenDatabase: Record<YiThemeElement, Omit<DailyQimenRecord, "element" | "dynamicKey" | "invariant">[]> = {
  木: [
    { direction: "东", gate: "生门", method: "先开小门", prompt: "当下提示：找一个容易长出新枝的小入口。先联系一个人，先做一个样品，先让事情见一点光。" },
    { direction: "东南", gate: "景门", method: "先立画面", prompt: "当下提示：把愿景画清楚，再谈步骤。木要向上长，先给它一幅能攀的墙。" },
  ],
  火: [
    { direction: "南", gate: "景门", method: "先点明灯", prompt: "当下提示：今天宜说明、展示、公开表达。灯照路，不烧人；话讲亮，不压人。" },
    { direction: "南偏东", gate: "开门", method: "先亮身份", prompt: "当下提示：该站出来就站出来。拿出你的主张，但把语气放软，光就能照到更多人。" },
  ],
  土: [
    { direction: "中", gate: "坤门", method: "先筑台阶", prompt: "当下提示：资源、责任、时间表先摆平。土局不怕慢，怕地基虚。" },
    { direction: "西南", gate: "休门", method: "先安人心", prompt: "当下提示：先照顾现实感受，再推进任务。人心稳，事情才稳。" },
  ],
  金: [
    { direction: "西", gate: "开门", method: "先定边界", prompt: "当下提示：规则先行，边界先明。刀要快，话要暖；砍混乱，不伤人。" },
    { direction: "西北", gate: "杜门", method: "先止杂音", prompt: "当下提示：关掉无效承诺，拒绝不必要的拉扯。少说一句，局面反而清。" },
  ],
  水: [
    { direction: "北", gate: "休门", method: "先探水路", prompt: "当下提示：先收信息，先听回声。水局宜绕，不宜撞；绕过去也是赢。" },
    { direction: "北偏西", gate: "惊门", method: "先问真假", prompt: "当下提示：今天别急着信第一句话。多核对一遍，能避开一处暗礁。" },
  ],
  neutral: [
    { direction: "中", gate: "值符", method: "先看天时", prompt: "当下提示：信息未全，先做二十分钟小动作。动一下，局就有回声。" },
    { direction: "中宫", gate: "休门", method: "先稳心神", prompt: "当下提示：不急、不赌、不硬冲。先把问题收成一句话，再决定开哪扇门。" },
  ],
};

function hourBranch(now: Date) {
  const hour = now.getHours();
  const branches = ["子", "丑", "丑", "寅", "寅", "卯", "卯", "辰", "辰", "巳", "巳", "午", "午", "未", "未", "申", "申", "酉", "酉", "戌", "戌", "亥", "亥", "子"];
  return branches[hour] ?? "子";
}

function hashText(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function selectDailyQimenRecord(chart: FourPillarsResult, birth: BirthInput, now = new Date()): DailyQimenRecord {
  const element = deriveYiThemeElement(chart);
  const records = qimenDatabase[element];
  const dynamicKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${hourBranch(now)}-${birth.name.trim()}`;
  const record = records[hashText(dynamicKey) % records.length];
  return {
    ...record,
    element,
    dynamicKey,
    invariant: `不变：日主${chart.pillars.day.stem}${chart.pillars.day.branch}、命盘五行气质；变化：今日与${hourBranch(now)}时。`,
  };
}

export function QimenSection({
  chart,
  birth,
  onBackToChart,
  now = new Date(),
}: {
  chart: FourPillarsResult;
  birth: BirthInput;
  onBackToChart?: () => void;
  now?: Date;
}) {
  const [opened, setOpened] = useState(false);
  const record = selectDailyQimenRecord(chart, birth, now);

  return <section className="ritual-standalone-page qimen-standalone-page">
    <button className="ritual-back-button" type="button" onClick={onBackToChart}>回到命盘</button>
    <header className="ritual-hero-copy">
      <small>奇门</small>
      <h1>今日奇门</h1>
      <p>起局看门，先走一步</p>
    </header>
    <button className={"realistic-qimen-plate" + (opened ? " is-opened" : "")} data-testid="qimen-calc-trigger" type="button" onClick={() => setOpened(true)} aria-label="今日奇门起局">
      <span className="qimen-plate-center">起局</span>
      <i className="qimen-ring qimen-ring--outer" />
      <i className="qimen-ring qimen-ring--inner" />
      <b>{record.direction}向</b>
      <small>{opened ? "局已展开" : "轻点起局"}</small>
    </button>
    <article className="ritual-result-card">
      <small>{record.invariant}</small>
      <h2>{record.gate} · {record.method}</h2>
      <p>{record.prompt}</p>
      <p>用法：把眼前最卡的一件事写成一句话，照这个门向做一个二十分钟动作。顺，就推进；不顺，就换门，不硬撞。</p>
    </article>
  </section>;
}
