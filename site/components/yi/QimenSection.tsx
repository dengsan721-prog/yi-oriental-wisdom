"use client";

/* eslint-disable @next/next/no-img-element -- ritual assets are static public files shared by GitHub Pages and Sites */
import { useState } from "react";
import { buildQimenExpansion, expandedQimenQuestionPresets } from "../../lib/yi/ritual-expansion";
import { branches, cycle, stems } from "../../lib/yi/stems-branches";
import { deriveYiThemeElement, type YiThemeElement } from "../../lib/yi/theme";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

type QimenPalaceCell = {
  palace: string;
  gate: string;
  star: string;
  deity: string;
};

type DailyQimenRecord = {
  element: YiThemeElement;
  dynamicKey: string;
  invariant: string;
  solarTerm: string;
  dayGanzhi: string;
  hourGanzhi: string;
  xunshou: string;
  chief: string;
  envoy: string;
  plate: QimenPalaceCell[];
  direction: string;
  gate: string;
  method: string;
  prompt: string;
  actionGuide: string;
  directionGuide: string;
  timingGuide: string;
};

type DailyQimenBaseRecord = Omit<DailyQimenRecord, "element" | "dynamicKey" | "invariant" | "solarTerm" | "dayGanzhi" | "hourGanzhi" | "xunshou" | "chief" | "envoy" | "plate" | "actionGuide" | "directionGuide" | "timingGuide">;

const qimenDatabase: Record<YiThemeElement, DailyQimenBaseRecord[]> = {
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

const qimenQuestionPresets = expandedQimenQuestionPresets;
type QimenQuestionTopic = "career" | "relationship" | "wealth" | "action";
const qimenPalaces = ["坎一宫", "坤二宫", "震三宫", "巽四宫", "中五宫", "乾六宫", "兑七宫", "艮八宫", "离九宫"];
const qimenGates = ["休门", "生门", "伤门", "杜门", "景门", "死门", "惊门", "开门", "值门"];
const qimenStars = ["天蓬", "天芮", "天冲", "天辅", "天禽", "天心", "天柱", "天任", "天英"];
const qimenDeities = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天", "太常"];

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

function dayCycleIndex(now: Date) {
  const base = Date.UTC(1984, 1, 2);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - base) / 86400000);
}

function dayGanzhi(now: Date) {
  const item = cycle(dayCycleIndex(now));
  return `${item.stem}${item.branch}`;
}

function hourGanzhi(now: Date) {
  const dayStemIndex = stems.indexOf(cycle(dayCycleIndex(now)).stem);
  const branch = hourBranch(now) as (typeof branches)[number];
  const branchIndex = branches.indexOf(branch);
  const stem = stems[((dayStemIndex % 5) * 2 + branchIndex) % stems.length];
  return `${stem}${branch}`;
}

function solarTermLabel(now: Date) {
  const terms = ["小寒", "立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪"];
  const term = terms[now.getMonth()] ?? "节令";
  return `节气近${term}`;
}

function buildXunshou(ganzhi: string) {
  const index = stems.findIndex(stem => stem === ganzhi[0]);
  const branchIndex = branches.findIndex(branch => branch === ganzhi[1]);
  const cycleIndex = Array.from({ length: 60 }, (_, item) => cycle(item)).findIndex(item => item.stem === stems[index] && item.branch === branches[branchIndex]);
  const head = cycle(Math.max(0, cycleIndex - (cycleIndex % 10)));
  return `旬首${head.stem}${head.branch}`;
}

function buildQimenPlate(seed: string): QimenPalaceCell[] {
  const gateShift = hashText(`${seed}-gate`) % qimenPalaces.length;
  const starShift = hashText(`${seed}-star`) % qimenStars.length;
  const deityShift = hashText(`${seed}-deity`) % qimenDeities.length;
  return qimenPalaces.map((palace, index) => ({
    palace,
    gate: qimenGates[(index + gateShift) % qimenGates.length],
    star: qimenStars[(index * 2 + starShift) % qimenStars.length],
    deity: qimenDeities[(qimenDeities.length - 1 - index + deityShift) % qimenDeities.length],
  }));
}

function hashText(value: string) {
  return [...value].reduce((sum, char) => (sum * 131 + char.charCodeAt(0)) % 1000003, 17);
}

function formatQimenMoment(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function classifyQimenQuestion(question: string): QimenQuestionTopic {
  if (/关系|婚|伴侣|亲子|朋友|沟通|推进|感情|见面|家事/u.test(question)) return "relationship";
  if (/财|钱|收入|资源|投资|生意|账/u.test(question)) return "wealth";
  if (/行动|今日|今天|计划|选择|执行|开始|考试|学习|搬家|出行|就医|问诊|决定/u.test(question)) return "action";
  return "career";
}

function explainQimenDirection(direction: string, gate: string) {
  return `朝向说的是做事的发力方向，不是一定要搬椅子、改门窗。${direction}向 · ${gate}，普通人可以这样用：先找这件事里最像“${direction}”的入口——可能是一个人、一通电话、一份资料、一个场景。若方便，也可以面向这个方向坐定一分钟，把问题写成一句话，再动手。方向只是帮你收心、定焦点，不替你决定结果。`;
}

function explainTwentyMinuteAction(topic: QimenQuestionTopic, method: string, question: string) {
  const topicAction: Record<QimenQuestionTopic, string> = {
    career: "写下目标、拍板人、验收标准各一句；然后只推进最小的一步，比如发一条确认消息、整理一页材料、约一个十分钟沟通。",
    relationship: "先写事实、感受、请求三句话；然后选一句最不伤人的话发出或当面说，别在二十分钟里翻旧账。",
    wealth: "打开账本或备忘录，只做一件事：止一处漏、清一笔账、确认一次收支。二十分钟结束就停，先求账面清楚。",
    action: "把问题缩到今天能开始的第一步，计时二十分钟，只做不评判；完成后记录卡点和下一步。",
  };
  return `二十分钟的意思是给行动设一个小局，不是让你硬熬。所问“${question}”，先按“${method}”做一个可停、可看、可复盘的小动作：${topicAction[topic]}做之前用朝向帮自己定焦点，做的时候只看眼前这一步。顺，是做完之后心更定、信息更清、人更愿意配合；不顺，是越做越乱、越说越僵、越算越慌，那就停下来，改小问题，重新起局。`;
}

function explainQimenTiming(now: Date) {
  return `普通人不用背奇门盘。你只要记住：奇门看的是“此时此刻问这件事”的气口。现在是${formatQimenMoment(now)}，先按这一局做一次小验证；过了一个时辰、换了问题、情绪明显变化，都可以重新问，不要拿旧局硬套新事。`;
}

export function selectDailyQimenRecord(chart: FourPillarsResult, birth: BirthInput, now = new Date(), question = ""): DailyQimenRecord {
  const element = deriveYiThemeElement(chart);
  const records = qimenDatabase[element];
  const asked = question.trim() || "今日行动";
  const topic = qimenTopicGuidance[classifyQimenQuestion(asked)];
  const currentDayGanzhi = dayGanzhi(now);
  const currentHourGanzhi = hourGanzhi(now);
  const dynamicKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${currentHourGanzhi}-${birth.name.trim()}-${question.trim()}-${chart.pillars.day.stem}`;
  const hourShift = hashText(`${currentHourGanzhi}-${chart.pillars.day.branch}-${birth.name.trim()}`) % records.length;
  const record = records[(topic.index + hourShift) % records.length];
  const plate = buildQimenPlate(`${dynamicKey}-${element}-${topic.index}`);
  const expansion = buildQimenExpansion({
    seed: dynamicKey,
    topic: classifyQimenQuestion(asked),
    question: asked,
    hourGanzhi: currentHourGanzhi,
    dayGanzhi: currentDayGanzhi,
  });
  const envoy = plate.find(cell => cell.gate === record.gate)?.gate ?? plate[0].gate;
  return {
    ...record,
    solarTerm: solarTermLabel(now),
    dayGanzhi: currentDayGanzhi,
    hourGanzhi: currentHourGanzhi,
    xunshou: buildXunshou(currentDayGanzhi),
    chief: `值符${plate[0].star}`,
    envoy: `值使${envoy}`,
    plate,
    method: `${topic.title} · ${topic.method} · ${record.method} · ${expansion.method}`,
    prompt: `${topic.prompt}\n\n${record.prompt}\n\n${expansion.prompt}`,
    actionGuide: `${explainTwentyMinuteAction(classifyQimenQuestion(asked), `${topic.method} · ${record.method}`, asked)}\n\n${expansion.actionGuide}`,
    directionGuide: `${explainQimenDirection(record.direction, record.gate)}\n\n${expansion.directionNote}`,
    timingGuide: explainQimenTiming(now),
    element,
    dynamicKey,
    invariant: `不变：日主${chart.pillars.day.stem}${chart.pillars.day.branch}、命盘五行气质；变化：${currentDayGanzhi}日与${currentHourGanzhi}时。`,
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
    <button className="ritual-back-button ritual-back-button--mini" type="button" onClick={onBackToChart}>‹ 命盘</button>
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
    <button className={"realistic-qimen-plate qimen-plate-classic qimen-scene-asset-plate" + (opened ? " is-opened" : "")} data-testid="qimen-calc-trigger" type="button" disabled={!question.trim()} onClick={() => setOpenedRecord(selectDailyQimenRecord(chart, birth, now, question))} aria-label="奇门起局">
      <span className="qimen-scene-asset-shell" aria-hidden="true">
        <img className="qimen-scene-reference-asset" src="qimen-scene-reference.png" alt="" />
      </span>
      <span className="qimen-breathe-target" aria-hidden="true" />
    </button>
    {openedRecord && <article className="ritual-result-card">
      <small>问事时间 · {formatQimenMoment(now)}｜所问：{question.trim()}｜{openedRecord.invariant}</small>
      <h2>{openedRecord.direction}向 · {openedRecord.gate} · {openedRecord.method}</h2>
      <section className="qimen-classic-summary" aria-label="奇门盘式">
        <span>{openedRecord.solarTerm}</span>
        <span>日干支 {openedRecord.dayGanzhi}</span>
        <span>时干支 {openedRecord.hourGanzhi}</span>
        <span>{openedRecord.xunshou}</span>
        <span>{openedRecord.chief}</span>
        <span>{openedRecord.envoy}</span>
      </section>
      <p>{openedRecord.prompt}</p>
      <section className="qimen-guidance-card qimen-palace-list"><b>九宫盘</b><p>{openedRecord.plate.map(cell => `${cell.palace}${cell.gate}${cell.star}${cell.deity}`).join(" · ")}</p></section>
      <section className="qimen-guidance-card"><b>朝向怎么用</b><p>{openedRecord.directionGuide}</p></section>
      <section className="qimen-guidance-card"><b>二十分钟怎么做</b><p>{openedRecord.actionGuide}</p></section>
      <section className="qimen-guidance-card"><b>什么时候重问</b><p>{openedRecord.timingGuide}</p></section>
    </article>}
  </section>;
}
