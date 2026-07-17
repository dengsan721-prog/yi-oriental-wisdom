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
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const availableSections = getAvailableSections(true);
  function selectSection(next: SectionId) {
    scrollPositions.set(activeSection, window.scrollY);
    dispatch({ type: "select-section", section: next });
    window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollTop(scrollPositions, next) }));
  }
  return <section className="result-shell">
    <header className="result-head"><div><span className="mini-mark">艺</span><b>{name || "访客"}的人生报告</b></div><div>{onSaveHome && <button onClick={() => setSaveConfirmOpen(true)}>保存到本机</button>}<button onClick={onRestart}>重新排盘</button></div></header>
    {saveConfirmOpen && <aside className="source-note" role="dialog" aria-label="确认保存本机档案"><b>保存前确认</b><p>将保存：姓名、出生日期与时辰、性别、命盘摘要、行动计划、事件及关系记录；不会保存出生地点。</p><p>数据写入当前网站来源的浏览器存储；同一设备上能使用此浏览器资料的人可能看到，清理浏览器数据也可能删除档案。</p><button onClick={() => { setSaveConfirmOpen(false); onSaveHome?.(); }}>确认保存并进入人生首页</button><button onClick={() => setSaveConfirmOpen(false)}>仅本次使用，不保存</button></aside>}
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
