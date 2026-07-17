import { buildTraditionalReadings } from "../../lib/yi/traditions";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

export function TraditionSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  const readings = buildTraditionalReadings(chart, birth);
  return <section className="report-section"><header><small>传统技法</small><h1>辅助传统，逐层与主盘校验</h1><p>三种方法各有独立七层；与子平主盘冲突时，以主盘与现实证据为先。</p></header><div className="detail-groups">
    {readings.map((reading, index) => <section key={reading.method}><h2>{reading.method} · {reading.subject}</h2><p>{reading.role}</p>
      <details open={index === 0}><summary>计算与核心 <small>展开</small></summary><div className="seven-layers">{reading.layers.slice(0, 3).map(layer => <p key={layer.title}><b>{layer.title}</b>{layer.observation}<small>{layer.mainChartComparison}</small></p>)}</div></details>
      <details><summary>生活校验 <small>展开</small></summary><div className="seven-layers">{reading.layers.slice(3, 6).map(layer => <p key={layer.title}><b>{layer.title}</b>{layer.observation}<small>{layer.mainChartComparison}</small></p>)}</div></details>
      <details><summary>边界与出处 <small>展开</small></summary><div className="seven-layers">{reading.layers.slice(6).map(layer => <p key={layer.title}><b>{layer.title}</b>{layer.observation}<small>{layer.mainChartComparison}<br />{layer.source}</small></p>)}<p><b>提醒</b>{reading.caution}</p></div></details>
    </section>)}
  </div></section>;
}
