"use client";

import { useReducer, useState } from "react";
import type { RelationshipType } from "../../lib/yi/compatibility";
import type { BirthSubmission } from "./BirthIntake";
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
export type ResultShellState = { activeSection: SectionId; compatibility: { relationship: RelationshipType; secondBirth: BirthSubmission | null } };
export type ResultShellAction = { type: "select-section"; section: SectionId } | { type: "set-relationship"; relationship: RelationshipType } | { type: "set-second-birth"; birth: BirthSubmission };
export const createInitialResultShellState = (): ResultShellState => ({ activeSection: "portrait", compatibility: { relationship: "partner", secondBirth: null } });
export function resultShellReducer(state: ResultShellState, action: ResultShellAction): ResultShellState {
  if (action.type === "select-section") return { ...state, activeSection: action.section };
  if (action.type === "set-relationship") return { ...state, compatibility: { ...state.compatibility, relationship: action.relationship } };
  return { ...state, compatibility: { ...state.compatibility, secondBirth: action.birth } };
}

export function ResultShell({ name, chart, birth, overview, interpretations, onRestart, onSaveHome, storageError }: {
  name: string; chart: FourPillarsResult; overview: ProfessionalOverview;
  birth: BirthInput; interpretations: InterpretationItem[]; onRestart: () => void; onSaveHome?: () => void; storageError?: string;
}) {
  const [state, dispatch] = useReducer(resultShellReducer, undefined, createInitialResultShellState);
  const activeSection = state.activeSection;
  const [scrollPositions] = useState(createResultScrollPositions);
  const availableSections = getAvailableSections(true);
  function selectSection(next: SectionId) {
    scrollPositions.set(activeSection, window.scrollY);
    dispatch({ type: "select-section", section: next });
    window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollTop(scrollPositions, next) }));
  }
  return <section className="result-shell">
    <header className="result-head"><div><span className="mini-mark">艺</span><b>{name || "访客"}的人生报告</b></div><div>{onSaveHome && <button onClick={onSaveHome}>保存并进入人生首页</button>}<button onClick={onRestart}>重新排盘</button></div></header>
    {storageError && <p className="storage-error" role="alert">{storageError}</p>}
    <nav className="result-tabs" aria-label="人生报告章节">
      {getResultSections().filter(([id]) => availableSections.includes(id)).map(([id, label]) => <button key={id} className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}>{label}</button>)}
    </nav>
    <div className="result-content">
      <div hidden={activeSection !== "portrait"}><PortraitSection overview={overview} items={interpretations} /></div>
      <div hidden={activeSection !== "chart"}><ChartSection chart={chart} overview={overview} /></div>
      <div hidden={activeSection !== "detail"}><DetailSection items={interpretations} /></div>
      <div hidden={activeSection !== "fortune"}><FortuneSection chart={chart} birth={birth} /></div>
      <div hidden={activeSection !== "mirror"}><MirrorSection chart={chart} /></div>
      <div hidden={activeSection !== "compatibility"}><CompatibilitySection chart={chart} relationship={state.compatibility.relationship} secondBirth={state.compatibility.secondBirth} onRelationshipChange={relationship => dispatch({ type: "set-relationship", relationship })} onSecondBirthChange={birth => dispatch({ type: "set-second-birth", birth })} /></div>
      <div hidden={activeSection !== "tradition"}><TraditionSection chart={chart} birth={birth} /></div>
      <SourceNote chart={chart} items={interpretations} />
    </div>
  </section>;
}
