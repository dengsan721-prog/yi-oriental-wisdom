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

const qimenQuestionPresets = ["事业取舍", "关系推进", "财运取舍", "今日行动"];
type QimenQuestionTopic = "career" | "relationship" | "wealth" | "action";

const qimenTopicGuidance: Record<QimenQuestionTopic, { title: string; method: string; prompt: string; index: number }> = {
  career: {
    title: "事业局",
    method: "先定主线",
    prompt: "问事业，先看门在哪里，再看人站在哪边。今天把目标、权限、验收三项写成一页纸；能写清，就推进，写不清，就先补证据。",
    index: 0,
  },
  relationship: {
    title: "关系局",
    method: "先通人心",
    prompt: "问关系，先不急着断输赢。把事实、感受、请求分成三句话，说完留一次复盘时间。门开在人心，不在嘴硬。",
    index: 1,
  },
  wealth: {
    title: "财路局",
    method: "先守仓门",
    prompt: "问财路，先看进出账，再看机会。今天适合止漏、盘点、留余地；钱路怕乱，先稳仓，再谈扩张。",
    index: 2,
  },
  action: {
    title: "行动局",
    method: "先走小步",
    prompt: "问今日行动，先做二十分钟能落地的一步。动起来，局才有回声；卡住就缩小动作，不硬撞门。",
    index: 3,
  },
};

function hourBranch(now: Date) {
  const hour = now.getHours();
  const branches = ["子", "丑", "丑", "寅", "寅", "卯", "卯", "辰", "辰", "巳", "巳", "午", "午", "未", "未", "申", "申", "酉", "酉", "戌", "戌", "亥", "亥", "子"];
  return branches[hour] ?? "子";
}

function hashText(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function formatQimenMoment(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function classifyQimenQuestion(question: string): QimenQuestionTopic {
  if (/关系|婚|伴侣|亲子|朋友|沟通|推进|感情/u.test(question)) return "relationship";
  if (/财|钱|收入|资源|投资|生意|账/u.test(question)) return "wealth";
  if (/行动|今日|今天|计划|选择|执行|开始/u.test(question)) return "action";
  return "career";
}

export function selectDailyQimenRecord(chart: FourPillarsResult, birth: BirthInput, now = new Date(), question = ""): DailyQimenRecord {
  const element = deriveYiThemeElement(chart);
  const records = qimenDatabase[element];
  const asked = question.trim() || "今日行动";
  const topic = qimenTopicGuidance[classifyQimenQuestion(asked)];
  const dynamicKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${hourBranch(now)}-${birth.name.trim()}-${question.trim()}`;
  const hourShift = hashText(`${hourBranch(now)}-${chart.pillars.day.branch}-${birth.name.trim()}`) % records.length;
  const record = records[(topic.index + hourShift) % records.length];
  return {
    ...record,
    method: `${topic.title} · ${topic.method} · ${record.method}`,
    prompt: `${topic.prompt}\n\n${record.prompt}`,
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
  const [question, setQuestion] = useState("");
  const [openedRecord, setOpenedRecord] = useState<DailyQimenRecord | null>(null);
  const opened = openedRecord !== null;
  function updateQuestion(next: string) {
    setQuestion(next);
    setOpenedRecord(null);
  }

  return <section className="ritual-standalone-page qimen-standalone-page">
    <button className="ritual-back-button ritual-back-button--compact" type="button" onClick={onBackToChart}>‹ 命盘</button>
    <header className="ritual-hero-copy">
      <h1>起局看门，先走一步</h1>
    </header>
    <label className="ritual-question-field qimen-question-field">
      <span>问事</span>
      <div className="ritual-question-presets">
        {qimenQuestionPresets.map(item => <button key={item} type="button" aria-pressed={question === item} onClick={() => updateQuestion(item)}>{item}</button>)}
      </div>
      <textarea value={question} onChange={(event) => updateQuestion(event.target.value)} placeholder="写下今天要问的一件事" aria-label="今天要问的事情" />
    </label>
    <button className={"realistic-qimen-plate qimen-plate-classic" + (opened ? " is-opened" : "")} data-testid="qimen-calc-trigger" type="button" disabled={!question.trim()} onClick={() => setOpenedRecord(selectDailyQimenRecord(chart, birth, now, question))} aria-label="奇门起局">
      <span className="qimen-cardinal qimen-cardinal--north">坎</span>
      <span className="qimen-cardinal qimen-cardinal--east">震</span>
      <span className="qimen-cardinal qimen-cardinal--south">离</span>
      <span className="qimen-cardinal qimen-cardinal--west">兑</span>
      <span className="qimen-nine-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>
      <span className="qimen-plate-center">起局</span>
      <i className="qimen-ring qimen-ring--outer" />
      <i className="qimen-ring qimen-ring--inner" />
    </button>
    {openedRecord && <article className="ritual-result-card">
      <small>问事时间 · {formatQimenMoment(now)}｜所问：{question.trim()}｜{openedRecord.invariant}</small>
      <h2>{openedRecord.direction}向 · {openedRecord.gate} · {openedRecord.method}</h2>
      <p>{openedRecord.prompt}</p>
      <p>用法：照这个门向做一个二十分钟动作。顺，就推进；不顺，就再问一次事、重新起局，不硬撞。</p>
    </article>}
  </section>;
}
