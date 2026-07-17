"use client";

import { useMemo, useState } from "react";
import { YI_REFERENCE_SOURCES } from "../../lib/yi/sources";
import { buildAtlasReading, getAtlasGroups, getAtlasMethods, type AtlasMethodId } from "../../lib/yi/traditional-atlas";
import { getTraditionalSource } from "../../lib/yi/traditional-sources";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

const starSymbols: Record<string, string> = {
  "star-aries":"♈", "star-taurus":"♉", "star-gemini":"♊", "star-cancer":"♋",
  "star-leo":"♌", "star-virgo":"♍", "star-libra":"♎", "star-scorpio":"♏",
  "star-sagittarius":"♐", "star-capricorn":"♑", "star-aquarius":"♒", "star-pisces":"♓",
};

function getSource(id: string) {
  const classic = getTraditionalSource(id);
  if (classic) return { title: classic.title, grade: classic.grade, url: classic.url, role: classic.usage, boundary: classic.boundary };
  const reference = YI_REFERENCE_SOURCES[id];
  return reference ? { title: reference.title, grade: reference.grade, url: reference.url, role: reference.role, boundary: reference.boundary } : null;
}

export function ReferenceAtlasSection({ chart }: { chart: FourPillarsResult; birth: BirthInput }) {
  const [method, setMethod] = useState<AtlasMethodId>("face");
  const [selectedId, setSelectedId] = useState("face-oval");
  const groups = getAtlasGroups(method);
  const option = groups.flatMap((group) => group.options).find((item) => item.id === selectedId) ?? groups[0].options[0];
  const reading = useMemo(() => buildAtlasReading(option, chart), [option, chart]);
  const sources = reading.sourceIds.map(getSource).filter((source): source is NonNullable<typeof source> => Boolean(source));

  function selectMethod(nextMethod: AtlasMethodId) {
    setMethod(nextMethod);
    setSelectedId(getAtlasGroups(nextMethod)[0].options[0].id);
  }

  return <section className="reference-atlas">
    <div className="atlas-methods" aria-label="传统图谱方法">
      {getAtlasMethods().map((item) => <button type="button" className={method === item.id ? "active" : ""} aria-pressed={method === item.id} onClick={() => selectMethod(item.id)} key={item.id}><b>{item.label}</b><small>{item.subtitle}</small></button>)}
    </div>
    <p className="atlas-boundary">标准照片与图谱仅供自行对照；本页不会读取、上传或识别你的照片。</p>

    <div className="atlas-layout">
      <div className="atlas-reference" aria-label={`${option.title}标准参考图`}>
        {option.image
          ? <img src={option.image} style={{ objectPosition: option.crop }} alt={`${option.title}标准参考照片`} />
          : <div className="star-reference" aria-hidden="true"><span>{starSymbols[option.id]}</span><i /><i /><i /><i /><i /></div>}
        {option.hotspot && <i className="atlas-hotspot" style={{ left:`${option.hotspot.x}%`, top:`${option.hotspot.y}%` }} />}
        <span className="atlas-caption">标准示意 · 自行对照</span>
      </div>

      <div className="atlas-options">
        {groups.map((group) => <section key={group.title}><h3>{group.title}</h3><div>{group.options.map((item) => <button type="button" onClick={() => setSelectedId(item.id)} className={selectedId === item.id ? "active" : ""} aria-pressed={selectedId === item.id} key={item.id}>{item.title}</button>)}</div></section>)}
      </div>
    </div>

    <article className="atlas-reading">
      <header><small>专业到生活的七层翻译</small><h2>{reading.title}</h2><p>{reading.professionalResult}</p></header>
      <div className="atlas-layers">{reading.layers.map((layer) => <section key={layer.label}><b>{layer.label}</b><p>{layer.text}</p></section>)}</div>
      <aside><b>使用边界</b><p>{reading.caution}</p></aside>
    </article>

    <details className="atlas-sources">
      <summary>理论依据与版本边界（{sources.length}）</summary>
      {sources.map((source) => <section key={source.title}><b>{source.grade} · {source.title}</b><p>{source.role}</p><small>{source.boundary}</small>{source.url && <a href={source.url} target="_blank" rel="noreferrer">查看可核来源 ↗</a>}</section>)}
    </details>
  </section>;
}
