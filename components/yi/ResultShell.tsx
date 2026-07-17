"use client";

import { useState } from "react";
import type { FourPillarsResult, InterpretationItem, ProfessionalOverview } from "../../lib/yi/types";
import { PortraitSection } from "./PortraitSection";
import { ChartSection } from "./ChartSection";
import { DetailSection } from "./DetailSection";
import { SourceNote } from "./SourceNote";

export const getResultSections = () => [
  ["portrait", "画像"], ["chart", "命盘"], ["detail", "详批"],
  ["fortune", "流年"], ["mirror", "心镜"], ["compatibility", "合盘"],
  ["tradition", "传统"],
] as const;

type SectionId = ReturnType<typeof getResultSections>[number][0];

export function ResultShell({ name, chart, overview, interpretations, onRestart }: {
  name: string; chart: FourPillarsResult; overview: ProfessionalOverview;
  interpretations: InterpretationItem[]; onRestart: () => void;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("portrait");
  const selected = interpretations.filter(item =>
    activeSection === "detail" || activeSection === "tradition" ? true :
      activeSection === "mirror" ? item.domain === "self" :
        activeSection === "fortune" ? item.domain === "rhythm" :
          activeSection === "compatibility" ? item.domain === "relationship" : false);
  return <section className="result-shell">
    <header className="result-head"><div><span className="mini-mark">艺</span><b>{name || "访客"}的人生报告</b></div><button onClick={onRestart}>重新排盘</button></header>
    <nav className="result-tabs" aria-label="人生报告章节">
      {getResultSections().map(([id, label]) => <button key={id} className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "page" : undefined} onClick={() => setActiveSection(id)}>{label}</button>)}
    </nav>
    <div className="result-content">
      {activeSection === "portrait" && <PortraitSection overview={overview} items={interpretations} />}
      {activeSection === "chart" && <ChartSection chart={chart} overview={overview} />}
      {!["portrait", "chart"].includes(activeSection) && <DetailSection title={getResultSections().find(([id]) => id === activeSection)?.[1] ?? "详批"} items={selected} />}
      <SourceNote chart={chart} items={selected.length ? selected : interpretations} />
    </div>
  </section>;
}
