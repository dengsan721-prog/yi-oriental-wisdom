"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { RelationshipType } from "../../lib/yi/compatibility";
import type { ReportSectionId } from "../../lib/yi/hash-router";
import type { BirthSubmission } from "./BirthIntake";
import type { BirthInput, FourPillarsResult, InterpretationItem, ProfessionalOverview, ProfessionalReport } from "../../lib/yi/types";
import { PortraitSection } from "./PortraitSection";
import { ChartSection } from "./ChartSection";
import { DetailSection } from "./DetailSection";
import { SourceNote } from "./SourceNote";
import { FortuneSection } from "./FortuneSection";
import { MirrorSection } from "./MirrorSection";
import { CompatibilitySection } from "./CompatibilitySection";
import type { ParentChildPrimaryRole } from "./CompatibilitySection";
import { TraditionSection } from "./TraditionSection";

export const getResultSections = () => [
  ["portrait", "画像"], ["chart", "命盘"], ["detail", "详批"],
  ["fortune", "大运"], ["compatibility", "合盘"], ["mirror", "镜像"],
  ["tradition", "传统"],
] as const;

export const getAvailableSections = (includeExtended = false): ReportSectionId[] => includeExtended ? getResultSections().map(([id]) => id) : ["portrait", "chart", "detail"];
export const shouldRenderSourceNote = (section: ReportSectionId) => section === "detail";
export const createResultScrollPositions = () => new Map<ReportSectionId, number>();
export const restoreScrollTop = (positions: Map<ReportSectionId, number>, section: ReportSectionId) => positions.get(section) ?? 0;
export const selectResultSection = (positions: Map<ReportSectionId, number>, activeSection: ReportSectionId, next: ReportSectionId, scrollTop: number, onSectionChange: (section: ReportSectionId) => void) => {
  positions.set(activeSection, scrollTop);
  onSectionChange(next);
};
export type ResultShellState = { compatibility: { relationship: RelationshipType; secondBirth: BirthSubmission | null; primaryParentRole: ParentChildPrimaryRole } };
export type ResultShellAction = { type: "set-relationship"; relationship: RelationshipType } | { type: "set-second-birth"; birth: BirthSubmission } | { type: "set-parent-child-primary-role"; primaryParentRole: ParentChildPrimaryRole };
export const createInitialResultShellState = (): ResultShellState => ({ compatibility: { relationship: "partner", secondBirth: null, primaryParentRole: "caregiver" } });
export function resultShellReducer(state: ResultShellState, action: ResultShellAction): ResultShellState {
  if (action.type === "set-relationship") return { ...state, compatibility: { ...state.compatibility, relationship: action.relationship } };
  if (action.type === "set-second-birth") return { ...state, compatibility: { ...state.compatibility, secondBirth: action.birth } };
  return { ...state, compatibility: { ...state.compatibility, primaryParentRole: action.primaryParentRole } };
}

export type SaveDialogKeyAction = { type: "close" } | { type: "focus"; index: number } | { type: "none" };
export function resolveSaveDialogKey(key: string, shiftKey: boolean, activeIndex: number, focusableCount: number): SaveDialogKeyAction {
  if (key === "Escape") return { type: "close" };
  if (key !== "Tab" || focusableCount < 1) return { type: "none" };
  if (shiftKey && activeIndex <= 0) return { type: "focus", index: focusableCount - 1 };
  if (!shiftKey && activeIndex >= focusableCount - 1) return { type: "focus", index: 0 };
  return { type: "none" };
}

function SaveHomeDialog({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);
  return <div className="save-home-overlay">
    <aside
      aria-describedby="save-home-description"
      aria-labelledby="save-home-title"
      aria-modal="true"
      className="source-note save-home-dialog"
      onKeyDown={event => {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex="0"]') ?? []);
        const action = resolveSaveDialogKey(event.key, event.shiftKey, focusable.indexOf(document.activeElement as HTMLElement), focusable.length);
        if (event.key === "Escape" && action.type === "close") { event.preventDefault(); onClose(); return; }
        if (event.key === "Tab" && action.type === "focus") { event.preventDefault(); focusable[action.index]?.focus(); }
      }}
      ref={dialogRef}
      role="dialog"
    >
      <b id="save-home-title">保存前确认</b>
      <div id="save-home-description"><p>将保存：姓名、出生日期与时辰、性别、命盘摘要、行动计划、事件及关系记录；不会保存出生地点。</p><p>数据写入当前网站来源的浏览器存储；同一设备上能使用此浏览器资料的人可能看到，清理浏览器数据也可能删除档案。</p></div>
      <div className="save-home-actions"><button onClick={onConfirm}>确认保存并进入人生首页</button><button onClick={onClose}>仅本次使用，不保存</button></div>
    </aside>
  </div>;
}

export function ResultShell({ name, chart, birth, report, overview, interpretations, activeSection, onSectionChange, onRestart, onSaveHome, storageError }: {
  name: string; chart: FourPillarsResult; overview: ProfessionalOverview;
  birth: BirthInput; report: ProfessionalReport; interpretations: InterpretationItem[]; activeSection: ReportSectionId; onSectionChange: (section: ReportSectionId) => void;
  onRestart: () => void; onSaveHome?: () => void; storageError?: string;
}) {
  const [state, dispatch] = useReducer(resultShellReducer, undefined, createInitialResultShellState);
  const [scrollPositions] = useState(createResultScrollPositions);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const saveTriggerRef = useRef<HTMLButtonElement>(null);
  const availableSections = getAvailableSections(true);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollTop(scrollPositions, activeSection) }));
    return () => {
      window.cancelAnimationFrame(frame);
      scrollPositions.set(activeSection, window.scrollY);
    };
  }, [activeSection, scrollPositions]);
  function selectSection(next: ReportSectionId) {
    selectResultSection(scrollPositions, activeSection, next, window.scrollY, onSectionChange);
  }
  function closeSaveDialog() {
    setSaveConfirmOpen(false);
    window.requestAnimationFrame(() => saveTriggerRef.current?.focus());
  }
  return <section className="result-shell">
    <header className="result-head">
      <div className="result-head-main"><div><span className="mini-mark">艺</span><b>{name || "访客"}的人生报告</b></div></div>
      <aside className="adopted-facts" aria-label="本次采用出生事实"><b>本次采用</b><span>{report.birthFacts.solar}</span><span>{report.birthFacts.timeConfidence}</span><span>{report.birthFacts.location}</span><span>{report.birthFacts.timezone}</span>{report.birthFacts.timeConfidence === "时辰不详" && <small>已关闭：时柱、时柱派生判断与精确大运年份。</small>}</aside>
      <div className="result-head-actions">{onSaveHome && <button className="primary" ref={saveTriggerRef} onClick={() => setSaveConfirmOpen(true)}>保存并进入人生首页</button>}<button onClick={onRestart}>修改出生资料</button></div>
    </header>
    {saveConfirmOpen && <SaveHomeDialog onClose={closeSaveDialog} onConfirm={() => { closeSaveDialog(); onSaveHome?.(); }} />}
    {storageError && <p className="storage-error" role="alert">{storageError}</p>}
    <nav className="result-tabs" aria-label="人生报告章节">
      {getResultSections().filter(([id]) => availableSections.includes(id)).map(([id, label]) => <button key={id} className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}>{label}</button>)}
    </nav>
    <div className="result-content">
      <div hidden={activeSection !== "portrait"}><PortraitSection chart={chart} overview={overview} items={interpretations} /></div>
      <div hidden={activeSection !== "chart"}><ChartSection chart={chart} name={name} report={report} /></div>
      <div hidden={activeSection !== "detail"}><DetailSection items={interpretations} /></div>
      <div hidden={activeSection !== "fortune"}><FortuneSection chart={chart} birth={birth} /></div>
      <div hidden={activeSection !== "mirror"}><MirrorSection chart={chart} /></div>
      <div hidden={activeSection !== "compatibility"}><CompatibilitySection chart={chart} primaryName={name} relationship={state.compatibility.relationship} primaryParentRole={state.compatibility.primaryParentRole} secondBirth={state.compatibility.secondBirth} onRelationshipChange={relationship => dispatch({ type: "set-relationship", relationship })} onSecondBirthChange={birth => dispatch({ type: "set-second-birth", birth })} onParentChildPrimaryRoleChange={primaryParentRole => dispatch({ type: "set-parent-child-primary-role", primaryParentRole })} /></div>
      <div hidden={activeSection !== "tradition"}><TraditionSection chart={chart} birth={birth} /></div>
      {shouldRenderSourceNote(activeSection) && <SourceNote chart={chart} items={interpretations} />}
    </div>
  </section>;
}
