"use client";

/* eslint-disable @next/next/no-img-element -- ritual assets are static public files shared by GitHub Pages and Sites */
import { useState } from "react";
import { deriveYiThemeElement, type YiThemeElement } from "../../lib/yi/theme";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

type DailyDrawRecord = {
  element: YiThemeElement;
  dynamicKey: string;
  invariant: string;
  signNumber: string;
  category: "事业" | "关系" | "财运" | "行动";
  level: "小凶" | "小吉" | "中吉" | "大吉";
  fortune: "小凶" | "小吉" | "中吉" | "大吉";
  sign: string;
  text: string;
  poem: string;
  verse: string;
  allusion: string;
  reading: string;
};

const drawQuestionPresets = [
  "事业去留", "工作沟通", "关系修复", "家庭安排",
  "财运取舍", "健康作息", "学习考试", "出行办事",
  "今日行动", "合作邀约", "情绪整理", "重要决定",
];
type DrawQuestionTopic = "career" | "relationship" | "wealth" | "action";

const drawTopicGuidance: Record<DrawQuestionTopic, { title: string; category: DailyDrawRecord["category"]; verse: string; reading: string; index: number }> = {
  career: {
    title: "事业问路",
    category: "事业",
    verse: "灯照案头卷，刀分眼前枝；先明一日事，再看百步棋。",
    reading: "问事业，先别急着赌输赢。今天只抓三件事：谁拍板、验收看什么、第一步交给谁。把这三件写清，路就从雾里露出边。",
    index: 0,
  },
  relationship: {
    title: "关系问心",
    category: "关系",
    verse: "一语先藏火，三分留晚晴；慢把心门叩，旧路也生春。",
    reading: "问关系，先把情绪和事实分开。今天不争谁对谁错，先说一件具体事、一个真实感受、一个可执行请求。话说得清，心才有台阶下。",
    index: 1,
  },
  wealth: {
    title: "财路问筹",
    category: "财运",
    verse: "米入仓中稳，泉从石上来；先守三分本，再开一寸财。",
    reading: "问财运，先看现金流、时间账、人情账。今天不贪远利，先止一处漏、清一笔账、定一个可复盘的小动作。财不是猛冲来的，是一格一格守出来的。",
    index: 2,
  },
  action: {
    title: "今日问行",
    category: "行动",
    verse: "晨光催脚起，暮鼓点心回；只行当下一步，明日自然开。",
    reading: "问今日行动，答案不在玄处，在手边。挑一件二十分钟能开始的事，做完就记录结果；若卡住，换小一步，不把一天耗在空想里。",
    index: 3,
  },
};

const dailySignDatabase: Record<YiThemeElement, Omit<DailyDrawRecord, "element" | "dynamicKey" | "invariant" | "signNumber" | "category" | "fortune" | "text" | "poem">[]> = {
  木: [
    { level: "小吉", sign: "新枝得雨签", verse: "旧土藏根，新枝向明；先修一寸，春风自临。", allusion: "典出春雨润木，新枝不争一夜成林。", reading: "这支签看见的是生发之气。今天不求大开大合，先把一件小事扶正：回一条该回的消息，补一页该补的功课，给关系留一点水分。枝条长得慢，但只要方向朝阳，明天就有新芽。" },
    { level: "中吉", sign: "青藤攀壁签", verse: "青藤不争高，借势自上墙；心稳手勤处，贵人递梯来。", allusion: "典取青藤借墙而上，柔韧处自有生机。", reading: "木局重在借势。今天适合请教、协作、补连接，不适合硬撑面子。把姿态放柔，把问题问清，身边能借的梯子就会显出来。" },
  ],
  火: [
    { level: "中吉", sign: "灯火照路签", verse: "一灯破夜，众影归形；先明其心，再动其兵。", allusion: "典取暗夜点灯，先照己心再照前路。", reading: "火局要先照亮，不要先烧起来。今天适合表态、说明、公开推进。话要亮，但不要刺；心要热，但手要稳。把目的说清，路就少一半雾。" },
    { level: "大吉", sign: "朱雀传声签", verse: "朱雀衔书至，赤心照远门；一句真诚话，能开两处春。", allusion: "典借朱雀传书，贵在明白、真诚、有回音。", reading: "这支签利表达、亮相、传播。若你正卡在沟通，今天可以主动讲清楚。真话不必重，重在有温度；愿景不必大，大在能让人跟着看见光。" },
  ],
  土: [
    { level: "中吉", sign: "厚土承车签", verse: "车行厚土，慢处有功；先稳其基，再起高楼。", allusion: "典取厚土载车，重物能行全靠地基。", reading: "土局讲承载。今天适合整理账本、安排家事、梳理责任。别嫌慢，慢是为了不翻车。把地基夯实，后面的高楼才不摇。" },
    { level: "小吉", sign: "仓廪添谷签", verse: "一粒归仓，一担心安；不贪远利，先护眼前盘。", allusion: "典取仓廪积谷，小收成也能安人心。", reading: "今天的好运藏在收纳和复盘里。把钱、时间、人情债理一理，心会落地。眼前盘稳住，远处机会才接得住。" },
  ],
  金: [
    { level: "大吉", sign: "金刃开局签", verse: "金刃出鞘，先断乱麻；留其精要，去其浮华。", allusion: "典借金刃断麻，利在快刀理清乱局。", reading: "金局贵在决断。今天适合定标准、删杂事、立边界。刀要快，话要留余地；该砍的是混乱，不是人情。清出一条线，局面就亮。" },
    { level: "中吉", sign: "白虎守门签", verse: "白虎守正门，闲言莫近身；一线分轻重，三步见乾坤。", allusion: "典取白虎守门，边界立住，杂音自退。", reading: "今天别被噪音拉走。先分轻重，再做取舍。守住规则，少解释，多行动；该拒绝时拒绝，气场反而稳。" },
  ],
  水: [
    { level: "小凶", sign: "行舟见桥签", verse: "水到桥前，舟自识门；不争一浪，终有归津。", allusion: "典取行舟过桥，水路未明时先找门洞。", reading: "小凶不是坏，是提醒水雾未散。今天别急着下死结论，先探路、问清、留退路。水能绕，绕不是退，是为了找到真正能过的桥洞。" },
    { level: "小吉", sign: "寒泉醒石签", verse: "寒泉洗旧尘，石上见清纹；静听三更水，明朝路自分。", allusion: "典取寒泉洗石，静下来才看得见纹理。", reading: "今天适合冷静观察。少一点情绪判断，多一点信息收集。你越安静，越能听见局里的暗流；等水纹清楚，再下桨。" },
  ],
  neutral: [
    { level: "小吉", sign: "云开见径签", verse: "云不久遮，路自成行；先行一步，再问远方。", allusion: "典取云开见路，不等万事齐备才出门。", reading: "信息未全时，不急着给人生定性。先做一件能落地的小事，记录结果，再决定下一步。路常常不是想出来的，是走出来的。" },
    { level: "小吉", sign: "素纸待墨签", verse: "素纸铺案前，轻墨也成山；先写第一笔，风月自相关。", allusion: "典取素纸待墨，第一笔落下才有章法。", reading: "今天先开始，不求漂亮。把念头写下来，把计划落成一句话。第一笔不必惊人，但它会把散乱的心收回来。" },
  ],
};

function dayKey(now: Date) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function hashText(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function formatRitualMoment(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function classifyDrawQuestion(question: string): DrawQuestionTopic {
  if (/关系|婚|伴侣|亲子|朋友|修复|沟通|感情|家庭/u.test(question)) return "relationship";
  if (/财|钱|收入|资源|投资|生意|账/u.test(question)) return "wealth";
  if (/行动|今日|今天|计划|选择|执行|开始|健康|作息|学习|考试|出行|办事|情绪|决定/u.test(question)) return "action";
  return "career";
}

export function selectDailyDrawRecord(chart: FourPillarsResult, birth: BirthInput, now = new Date(), question = ""): DailyDrawRecord {
  const element = deriveYiThemeElement(chart);
  const records = dailySignDatabase[element];
  const asked = question.trim() || "今日平安";
  const topic = drawTopicGuidance[classifyDrawQuestion(asked)];
  const dynamicKey = `${dayKey(now)}-${chart.pillars.year.branch}-${birth.name.trim()}-${asked}`;
  const dayShift = hashText(`${dayKey(now)}-${birth.name.trim()}-${chart.pillars.day.branch}`) % records.length;
  const record = records[(topic.index + dayShift) % records.length];
  const signNumber = `第${(hashText(`${dynamicKey}-${topic.index}`) % 64) + 1}签`;
  const poem = `${record.verse}\n${topic.verse}`;
  return {
    ...record,
    signNumber,
    category: topic.category,
    fortune: record.level,
    sign: `${topic.title} · ${record.sign}`,
    text: `${topic.title}，${record.level}。所问：${asked}。先把心定住，再取眼前能做的一步；签不替人决定，只把当下的门槛、机会和提醒照出来。`,
    poem,
    verse: poem,
    reading: `${record.reading}\n\n${topic.reading}`,
    element,
    dynamicKey,
    invariant: `不变：年支${chart.pillars.year.branch}、日主${chart.pillars.day.stem}${chart.pillars.day.branch}；变化：今日日期与阅读时刻。`,
  };
}

export function DrawSection({
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
  const [drawnRecord, setDrawnRecord] = useState<DailyDrawRecord | null>(null);
  const [drawnAt, setDrawnAt] = useState<Date | null>(null);
  const shaken = drawnAt !== null;
  function updateQuestion(next: string) {
    setQuestion(next);
    setDrawnRecord(null);
    setDrawnAt(null);
  }

  return <section className="ritual-standalone-page today-sign-page">
    <button className="ritual-back-button ritual-back-button--mini" type="button" onClick={onBackToChart}>‹ 命盘</button>
    <header className="ritual-hero-copy">
      <h1>每日一签，平平安安</h1>
    </header>
    <label className="ritual-question-field">
      <span>问事</span>
      <div className="ritual-question-presets">
        {drawQuestionPresets.map(item => <button key={item} type="button" aria-pressed={question === item} onClick={() => updateQuestion(item)}>{item}</button>)}
      </div>
      <textarea value={question} onChange={(event) => updateQuestion(event.target.value)} placeholder="写下今天要问的一件事" aria-label="今天要问的一件事" />
    </label>
    <button className={"realistic-oracle-tube oracle-tube-front oracle-line-tube oracle-fortune-asset-tube" + (shaken ? " has-shaken-sticks" : "")} data-testid="draw-lot-trigger" type="button" disabled={!question.trim()} onClick={() => { setDrawnRecord(selectDailyDrawRecord(chart, birth, now, question)); setDrawnAt(now); }} aria-label="摇动今日签筒">
      <span className="oracle-tube-asset-shell" aria-hidden="true">
        <img className="oracle-tube-reference-asset" src="oracle-lot-tube-reference.png" alt="" />
      </span>
      <span className="oracle-tube-breathe-target" aria-hidden="true" />
    </button>
    {drawnAt && drawnRecord && <article className="ritual-result-card">
      <small>抽签时间 · {formatRitualMoment(drawnAt)}｜所问：{question.trim()}｜{drawnRecord.invariant}</small>
      <h2>{drawnRecord.signNumber} · {drawnRecord.sign}</h2>
      <span className="oracle-level">{drawnRecord.category} · {drawnRecord.fortune}</span>
      <section className="oracle-poem" aria-label="签文"><b>签文</b><p>{drawnRecord.text}</p></section>
      <section className="oracle-poem" aria-label="签诗"><b>签诗</b><blockquote>{drawnRecord.poem}</blockquote></section>
      <section className="oracle-poem" aria-label="典故"><b>典故</b><p>{drawnRecord.allusion}</p></section>
      <p>{drawnRecord.reading}</p>
    </article>}
  </section>;
}
