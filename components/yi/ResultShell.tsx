"use client";

import { useState } from "react";
import type { FourPillarsResult, InterpretationItem, ProfessionalOverview } from "../../lib/yi/types";
import { PortraitSection } from "./PortraitSection";
import { ChartSection } from "./ChartSection";
import { DetailSection } from "./DetailSection";
import { SourceNote } from "./SourceNote";

export const getResultSections = () => [
  ["portrait", "画像"], ["chart", "命盘"], ["detail", "详批"],
  ["fortune", "大运"], ["mirror", "镜像"], ["compatibility", "合盘"],
  ["tradition", "传统"],
] as const;

type SectionId = ReturnType<typeof getResultSections>[number][0];
export const getAvailableSections = (): SectionId[] => ["portrait", "chart", "detail"];
export const createResultScrollPositions = () => new Map<SectionId, number>();

export function ResultShell({ name, chart, overview, interpretations, onRestart }: {
  name: string; chart: FourPillarsResult; overview: ProfessionalOverview;
  interpretations: InterpretationItem[]; onRestart: () => void;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("portrait");
  const [scrollPositions] = useState(createResultScrollPositions);
  const availableSections = getAvailableSections();
  function selectSection(next: SectionId) {
    scrollPositions.set(activeSection, window.scrollY);
    setActiveSection(next);
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollPositions.get(next) ?? 0 }));
  }
  return <section className="result-shell">
    <header className="result-head"><div><span className="mini-mark">艺</span><b>{name || "访客"}的人生报告</b></div><button onClick={onRestart}>重新排盘</button></header>
    <nav className="result-tabs" aria-label="人生报告章节">
      {getResultSections().map(([id, label]) => <button key={id} disabled={!availableSections.includes(id)} title={!availableSections.includes(id) ? "将在后续专业模块开放" : undefined} className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}>{label}</button>)}
    </nav>
    <div className="result-content">
      {activeSection === "portrait" && <PortraitSection overview={overview} items={interpretations} />}
      {activeSection === "chart" && <ChartSection chart={chart} overview={overview} />}
      {activeSection === "detail" && <DetailSection items={interpretations} />}
      <SourceNote chart={chart} items={interpretations} />
    </div>
  </section>;
}
