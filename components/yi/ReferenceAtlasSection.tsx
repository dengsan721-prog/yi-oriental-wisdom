"use client";
/* eslint-disable @next/next/no-img-element -- static GitHub Pages assets use the configured Vite base path */

import { useState } from "react";
import { buildMoleDetailTitle, getUserSideLabel, MIRROR_GUIDANCE } from "../../lib/yi/atlas-orientation";
import { CONSTELLATIONS, type ZodiacSign } from "../../lib/yi/constellations";
import {
  buildAtlasPublicReading,
  getAtlasGroups,
  getAtlasMethods,
  resolveAtlasVisual,
  resolveReferenceGender,
  type AtlasMethodId,
  type AtlasOption,
  type AtlasPublicReading,
  type ReferenceGender,
} from "../../lib/yi/traditional-atlas";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { ConstellationMap } from "./ConstellationMap";

function getOptionLabel(method: AtlasMethodId, item: AtlasOption) {
  if (method !== "mole" || !item.userSide || item.userSide === "center") {
    return item.title;
  }
  const sideAction = `查看${getUserSideLabel(item.userSide)}`;
  if (sideAction !== "查看你的左脸" && sideAction !== "查看你的右脸") {
    return item.title;
  }
  return `${sideAction} · ${item.title}`;
}

export function AtlasPublicReadingCard({
  reading,
}: {
  reading: AtlasPublicReading;
}) {
  return <article className="atlas-public-reading">
    <header>
      <small>{reading.lead.attribution}</small>
      <h2>{reading.title}</h2>
      <p>{reading.lead.text}</p>
    </header>
    <section><b>放进生活里看看</b><p>{reading.scene}</p></section>
    <section><b>有趣的一面</b><p>{reading.playfulObservation}</p></section>
    <section><b>现在能试的小动作</b><p>{reading.action}</p></section>
  </article>;
}

export function ReferenceAtlasSection({
  birth,
}: {
  chart: FourPillarsResult;
  birth: BirthInput;
}) {
  const [method, setMethod] = useState<AtlasMethodId>("face");
  const [selectedId, setSelectedId] = useState("face-oval");
  const [genderOverride, setGenderOverride] =
    useState<ReferenceGender | undefined>();
  const groups = getAtlasGroups(method);
  const option = groups
    .flatMap(group => group.options)
    .find(item => item.id === selectedId);
  if (!option) throw new Error(`当前图谱选项不存在：${selectedId}`);

  const publicReading = buildAtlasPublicReading(option);
  const isMirrorMethod = method === "face" || method === "mole";
  const referenceGender = resolveReferenceGender(
    birth.gender,
    genderOverride,
  );
  const visual = method === "star"
    ? undefined
    : resolveAtlasVisual(option, referenceGender);
  const starSign = method === "star"
    ? option.id.slice("star-".length) as ZodiacSign
    : undefined;
  const constellation = starSign ? CONSTELLATIONS[starSign] : undefined;
  const detailTitle = method === "mole"
    ? buildMoleDetailTitle(option)
    : publicReading.title;
  const imageSrc = visual
    ? `${import.meta.env.BASE_URL}${visual.image}`
    : "";

  function selectMethod(nextMethod: AtlasMethodId) {
    setMethod(nextMethod);
    setSelectedId(getAtlasGroups(nextMethod)[0].options[0].id);
  }

  return <section className="reference-atlas">
    <div className="atlas-methods" aria-label="传统图谱与星座文化模型">
      {getAtlasMethods().map(item => <button
        type="button"
        className={method === item.id ? "active" : ""}
        aria-pressed={method === item.id}
        onClick={() => selectMethod(item.id)}
        key={item.id}
      ><b>{item.label}</b><small>{item.subtitle}</small></button>)}
    </div>
    <p className="atlas-boundary">标准照片与图谱仅供自行对照；本页不会读取、上传或识别你的照片。</p>
    {birth.gender === "unspecified" && isMirrorMethod && <div
      className="atlas-gender-switch"
      aria-label="参考人物性别"
    >
      <button
        type="button"
        aria-pressed={referenceGender === "male"}
        onClick={() => setGenderOverride("male")}
      >男相参考</button>
      <button
        type="button"
        aria-pressed={referenceGender === "female"}
        onClick={() => setGenderOverride("female")}
      >女相参考</button>
    </div>}
    {isMirrorMethod && <aside className="mirror-guide">
      <b>镜面参考｜像照镜子一样对照</b>
      <p>{MIRROR_GUIDANCE}</p>
      <div className="mirror-side-labels">
        <span>你的左脸</span><span>你的右脸</span>
      </div>
    </aside>}

    <div className="atlas-layout">
      <div className="atlas-reference" aria-label={`${option.title}标准参考图`}>
        <div
          className="atlas-visual-canvas"
          style={{
            aspectRatio: String(
              starSign ? 1 : visual?.imageAspect ?? 16 / 9,
            ),
          }}
        >
          {visual
            ? <img src={imageSrc} alt={`${option.title}标准参考照片`} />
            : starSign && constellation && <div
                className="constellation-reference"
              >
                <ConstellationMap sign={starSign} />
                <div className="constellation-meta">
                  <h3>{constellation.chineseName}</h3>
                  <span>{constellation.englishName}</span>
                </div>
              </div>}
          {visual?.visualFocus && <i
            aria-hidden="true"
            className="atlas-visual-focus"
            style={{
              left: `${visual.visualFocus.x}%`,
              top: `${visual.visualFocus.y}%`,
              width: `${visual.visualFocus.width}%`,
              height: `${visual.visualFocus.height}%`,
            }}
          />}
          {visual?.hotspot && <i
            aria-hidden="true"
            className="atlas-hotspot"
            style={{
              left: `${visual.hotspot.x}%`,
              top: `${visual.hotspot.y}%`,
            }}
          />}
          <span className="atlas-caption">选中区域 · 自行对照</span>
        </div>
      </div>

      <div className="atlas-options">
        {groups.map(group => <section key={group.title}>
          <h3>{group.title}</h3>
          <div>{group.options.map(item => <button
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={selectedId === item.id ? "active" : ""}
            aria-pressed={selectedId === item.id}
            key={item.id}
          >{getOptionLabel(method, item)}</button>)}</div>
        </section>)}
      </div>
    </div>

    <AtlasPublicReadingCard
      reading={{ ...publicReading, title: detailTitle }}
    />
  </section>;
}
