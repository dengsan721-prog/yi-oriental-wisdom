"use client";
/* eslint-disable @next/next/no-img-element -- static GitHub Pages assets use the configured Vite base path */

import { useState } from "react";
import { ConstellationMap } from "./ConstellationMap";
import { buildMoleDetailTitle, getUserSideLabel, MIRROR_GUIDANCE } from "../../lib/yi/atlas-orientation";
import { CONSTELLATIONS, type ZodiacSign } from "../../lib/yi/constellations";
import { YI_REFERENCE_SOURCES } from "../../lib/yi/sources";
import {
  buildAtlasReading,
  getAtlasGroups,
  getAtlasMethods,
  resolveAtlasVisual,
  resolveReferenceGender,
  type AtlasMethodId,
  type AtlasOption,
  type ReferenceGender,
} from "../../lib/yi/traditional-atlas";
import { getTraditionalSource } from "../../lib/yi/traditional-sources";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { getZodiacProfile } from "../../lib/yi/zodiac-profiles";

function getSource(id: string) {
  const classic = getTraditionalSource(id);
  if (classic) return { title: classic.title, grade: classic.grade, url: classic.url, role: classic.usage, editionNote: classic.editionNote, boundary: classic.boundary };
  const reference = YI_REFERENCE_SOURCES[id];
  return reference ? { title: reference.title, grade: reference.grade, url: reference.url, role: reference.role, editionNote: "现代边界参考；链接内容与访问状态以来源页面为准。", boundary: reference.boundary } : null;
}

function getOptionLabel(method: AtlasMethodId, item: AtlasOption) {
  if (method !== "mole" || !item.userSide || item.userSide === "center") return item.title;
  const sideAction = `查看${getUserSideLabel(item.userSide)}`;
  if (sideAction !== "查看你的左脸" && sideAction !== "查看你的右脸") return item.title;
  return `${sideAction} · ${item.title}`;
}

export function ReferenceAtlasSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  const [method, setMethod] = useState<AtlasMethodId>("face");
  const [selectedId, setSelectedId] = useState("face-oval");
  const [genderOverride, setGenderOverride] = useState<ReferenceGender | undefined>();
  const groups = getAtlasGroups(method);
  const option = groups.flatMap((group) => group.options).find((item) => item.id === selectedId) ?? groups[0].options[0];
  const reading = buildAtlasReading(option, chart);
  const isMirrorMethod = method === "face" || method === "mole";
  const referenceGender = resolveReferenceGender(birth.gender, genderOverride);
  const visual = method === "star" ? undefined : resolveAtlasVisual(option, referenceGender);
  const starSign = method === "star" ? option.id.slice("star-".length) as ZodiacSign : undefined;
  const constellation = starSign ? CONSTELLATIONS[starSign] : undefined;
  const zodiacProfile = starSign ? getZodiacProfile(starSign) : undefined;
  const detailTitle = method === "mole" ? buildMoleDetailTitle(option) : reading.title;
  const imageSrc = visual ? `${import.meta.env.BASE_URL}${visual.image}` : "";
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
    {birth.gender === "unspecified" && isMirrorMethod && <div className="atlas-gender-switch" aria-label="参考人物性别">
      <button type="button" aria-pressed={referenceGender === "male"} onClick={() => setGenderOverride("male")}>男相参考</button>
      <button type="button" aria-pressed={referenceGender === "female"} onClick={() => setGenderOverride("female")}>女相参考</button>
    </div>}
    {isMirrorMethod && <aside className="mirror-guide">
      <b>镜面参考｜像照镜子一样对照</b>
      <p>{MIRROR_GUIDANCE}</p>
      <div className="mirror-side-labels"><span>你的左脸</span><span>你的右脸</span></div>
    </aside>}

    <div className="atlas-layout">
      <div className="atlas-reference" aria-label={`${option.title}标准参考图`}>
        <div className="atlas-visual-canvas" style={{ aspectRatio: String(starSign ? 1 : visual?.imageAspect ?? 16 / 9) }}>
          {visual
            ? <img src={imageSrc} alt={`${option.title}标准参考照片`} />
            : starSign && constellation && zodiacProfile && <div className="constellation-reference">
              <ConstellationMap sign={starSign} />
              <div className="constellation-meta">
                <h3>{constellation.chineseName}</h3>
                <span>{constellation.englishName}</span>
                <p><b>元素：</b>{zodiacProfile.element}<b>模式：</b>{zodiacProfile.modality}</p>
              </div>
            </div>}
          {visual?.visualFocus && <i aria-hidden="true" className="atlas-visual-focus" style={{ left:`${visual.visualFocus.x}%`, top:`${visual.visualFocus.y}%`, width:`${visual.visualFocus.width}%`, height:`${visual.visualFocus.height}%` }} />}
          {visual?.hotspot && <i aria-hidden="true" className="atlas-hotspot" style={{ left:`${visual.hotspot.x}%`, top:`${visual.hotspot.y}%` }} />}
          <span className="atlas-caption">选中区域 · 自行对照</span>
        </div>
      </div>

      <div className="atlas-options">
        {groups.map((group) => <section key={group.title}><h3>{group.title}</h3><div>{group.options.map((item) => <button type="button" onClick={() => setSelectedId(item.id)} className={selectedId === item.id ? "active" : ""} aria-pressed={selectedId === item.id} key={item.id}>{getOptionLabel(method, item)}</button>)}</div></section>)}
      </div>
    </div>

    <article className="atlas-reading">
      <header><small>专业到生活的七层翻译</small><h2>{detailTitle}</h2><p>{reading.professionalResult}</p></header>
      <div className="atlas-layers">{reading.layers.map((layer) => <section key={layer.label}><b>{layer.label}</b><p>{layer.text}</p></section>)}</div>
      <aside><b>使用边界</b><p>{reading.caution}</p></aside>
    </article>

    <details className="atlas-sources">
      <summary>理论依据与版本边界（{sources.length}）</summary>
      {sources.map((source) => <section key={source.title}><b>{source.grade} · {source.title}</b><p>{source.role}</p><small><strong>版本说明</strong>{source.editionNote}</small><small><strong>使用边界</strong>{source.boundary}</small>{source.url && <a href={source.url} target="_blank" rel="noreferrer">查看可核来源 ↗</a>}</section>)}
    </details>
  </section>;
}
