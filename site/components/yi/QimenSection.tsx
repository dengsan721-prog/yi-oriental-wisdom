import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { SceneLineArt } from "./SceneLineArt";

const qimenCopy = {
  木: ["东", "先开小门", "适合从新关系、新项目、新学习处起步。别急着做终局判断，先让第一根枝条见光。"],
  火: ["南", "先点明灯", "适合公开表达、说明愿景、把话讲亮。重要提醒：灯照路，不烧人。"],
  土: ["中", "先筑台阶", "适合整理资源、盘点责任、把流程垫稳。慢一步，是为了后面少塌一步。"],
  金: ["西", "先定边界", "适合谈标准、定规则、清理无效承诺。刀要快，语气要留温度。"],
  水: ["北", "先探水路", "适合搜集信息、试探回应、迂回靠近。不要硬撞门，水会找到缝。"],
  neutral: ["中", "先看天时", "信息未全时，先守住现实动作：少许承诺，快速反馈，再决定下一步。"],
} as const;

export function QimenSection({
  chart,
  birth,
}: {
  chart: FourPillarsResult;
  birth: BirthInput;
}) {
  const element = deriveYiThemeElement(chart);
  const [direction, method, reading] = qimenCopy[element];
  const hourLabel = chart.pillars.hour ? `${chart.pillars.hour.stem}${chart.pillars.hour.branch}` : "时辰待定";

  return <section className="report-section qimen-report">
    <header>
      <small>奇门一问</small>
      <h1>给当下局势定一个方向</h1>
      <p>这里把奇门当成行动罗盘：看方向、看开门方式、看今天先做哪一步。复杂术语收在后台，页面只留下能听懂、能转述的话。</p>
    </header>
    <article className="qimen-card">
      <SceneLineArt kind="qimen" />
      <div>
        <small>{birth.location || "出生地待补"} · {hourLabel}</small>
        <h2>{direction}向 · {method}</h2>
        <p>{reading}</p>
        <p>今天的用法很简单：选一件正在卡住的事，按这条方向做一个二十分钟动作，再记录结果。能继续，就推进；不顺，就换门。</p>
      </div>
    </article>
  </section>;
}
