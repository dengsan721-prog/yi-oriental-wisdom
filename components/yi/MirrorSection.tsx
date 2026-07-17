import { matchAnimalArchetype, matchHistoricalMirror } from "../../lib/yi/mirrors";
import { YI_REFERENCE_SOURCES } from "../../lib/yi/sources";
import type { FourPillarsResult } from "../../lib/yi/types";
import { buildZodiacMirror } from "../../lib/yi/zodiac-mirror";

export function MirrorSection({ chart }: { chart: FourPillarsResult }) {
  const zodiac = buildZodiacMirror(chart);
  const animal = matchAnimalArchetype(chart);
  const person = matchHistoricalMirror(chart);
  return <section className="report-section">
    <header>
      <small>东方镜像</small>
      <h1>借一面镜子，看一个维度</h1>
      <p>先看生肖的年支文化镜，再用主盘与现实经历校准；镜像提供观察语言，不宣称人与人的命运相同。</p>
    </header>

    <article className="reading-card zodiac-mirror">
      <span>生肖镜像 · 年支文化镜</span>
      <div className="zodiac-heading">
        <div><small>{zodiac.branch}支 · {zodiac.element} · {zodiac.yinYang}</small><h2>{zodiac.zodiac} · {zodiac.firstImpression}</h2></div>
        <p>{zodiac.culturalSource}</p>
      </div>
      <div className="zodiac-patterns">
        <p><b>建立信任</b>{zodiac.trustStyle}</p>
        <p><b>顺境能力</b>{zodiac.strengthPattern}</p>
        <p><b>压力提醒</b>{zodiac.pressurePattern}</p>
      </div>
      <div className="zodiac-scenes">
        <section><b>工作现场</b><p>{zodiac.workScene}</p></section>
        <section><b>关系现场</b><p>{zodiac.relationshipScene}</p></section>
        <section><b>家庭现场</b><p>{zodiac.familyScene}</p></section>
      </div>
      <details className="zodiac-evidence">
        <summary>与八字主盘互证</summary>
        <p>{zodiac.chartAgreement}</p>
        <p>{zodiac.chartDifference}</p>
      </details>
      <div className="zodiac-actions">
        <p><b>此刻可做</b>{zodiac.immediateAction}</p>
        <p><b>长期练习</b>{zodiac.longTermPractice}</p>
      </div>
      <aside className="zodiac-boundary"><b>使用边界</b><p>{zodiac.caution}</p></aside>
      <footer className="zodiac-sources"><b>理论与文化来源</b>{zodiac.sources.map(id => {
        const source = YI_REFERENCE_SOURCES[id];
        return <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.grade} · {source.title}</a>;
      })}</footer>
    </article>

    <div className="mirror-grid">
      <article className="reading-card">
        <span>动物原型 · 显式规则映射</span>
        <h2>{animal.name}</h2>
        <p>{animal.basis}</p>
        <b>顺境</b><p>{animal.strengthPattern}</p>
        <b>压力</b><p>{animal.pressurePattern}</p>
        <b>行动</b><p>{animal.action}</p>
        <small>{animal.caution}</small>
      </article>
      <article className="reading-card">
        <span>历史人物 · {person.reliability} 可靠级</span>
        <h2>{person.person} · {person.dimension}</h2>
        <p>{person.basis}</p>
        <b>资料来源</b><p>{person.source}</p>
        <b>行动</b><p>{person.action}</p>
        <small>{person.caution}</small>
      </article>
    </div>
  </section>;
}
