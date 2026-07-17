"use client";

import { useState } from "react";
import type { BirthInput, FourPillarsResult, InterpretationItem, ProfessionalOverview } from "../../lib/yi/types";
import { PortraitSection } from "./PortraitSection";
import { ChartSection } from "./ChartSection";
import { DetailSection } from "./DetailSection";
import { SourceNote } from "./SourceNote";
import { FortuneSection } from "./FortuneSection";
import { MirrorSection } from "./MirrorSection";
import { CompatibilitySection } from "./CompatibilitySection";
import { TraditionSection } from "./TraditionSection";

export const getResultSections = () => [
  ["portrait", "画像"], ["chart", "命盘"], ["detail", "详批"],
  ["fortune", "大运"], ["mirror", "镜像"], ["compatibility", "合盘"],
  ["tradition", "传统"],
] as const;

type SectionId = ReturnType<typeof getResultSections>[number][0];
export const getAvailableSections = (includeExtended = false): SectionId[] => includeExtended ? getResultSections().map(([id]) => id) : ["portrait", "chart", "detail"];
export const createResultScrollPositions = () => new Map<SectionId, number>();
export const restoreScrollTop = (positions: Map<SectionId, number>, section: SectionId) => positions.get(section) ?? 0;
export const getSectionMountPolicy = () => "persistent" as const;

export function ResultShell({ name, chart, birth, overview, interpretations, onRestart }: {
  name: string; chart: FourPillarsResult; overview: ProfessionalOverview;
  birth: BirthInput; interpretations: InterpretationItem[]; onRestart: () => void;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("portrait");
  const [scrollPositions] = useState(createResultScrollPositions);
  const availableSections = getAvailableSections(true);
  function selectSection(next: SectionId) {
    scrollPositions.set(activeSection, window.scrollY);
    setActiveSection(next);
    window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollTop(scrollPositions, next) }));
  }
  return <section className="result-shell">
    <header className="result-head"><div><span className="mini-mark">艺</span><b>{name || "访客"}的人生报告</b></div><button onClick={onRestart}>重新排盘</button></header>
    <nav className="result-tabs" aria-label="人生报告章节">
      {getResultSections().filter(([id]) => availableSections.includes(id)).map(([id, label]) => <button key={id} className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}>{label}</button>)}
    </nav>
    <div className="result-content">
      <div hidden={activeSection !== "portrait"}><PortraitSection overview={overview} items={interpretations} /></div>
      <div hidden={activeSection !== "chart"}><ChartSection chart={chart} overview={overview} /></div>
      <div hidden={activeSection !== "detail"}><DetailSection items={interpretations} /></div>
      <div hidden={activeSection !== "fortune"}><FortuneSection chart={chart} birth={birth} /></div>
      <div hidden={activeSection !== "mirror"}><MirrorSection chart={chart} /></div>
      <div hidden={activeSection !== "compatibility"}><CompatibilitySection chart={chart} /></div>
      <div hidden={activeSection !== "tradition"}><TraditionSection chart={chart} birth={birth} /></div>
      <SourceNote chart={chart} items={interpretations} />
    </div>
  </section>;
}
