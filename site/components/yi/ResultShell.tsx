"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { RelationshipType } from "../../lib/yi/compatibility";
import type { ReportSectionId } from "../../lib/yi/hash-router";
import type { BirthSubmission } from "./BirthIntake";
import type { BirthInput, FourPillarsResult, InterpretationItem, ProfessionalReport } from "../../lib/yi/types";
import { PortraitSection } from "./PortraitSection";
import { ChartSection } from "./ChartSection";
import { DetailSection } from "./DetailSection";
import { SourceNote } from "./SourceNote";
import { FortuneSection } from "./FortuneSection";
import { MirrorSection } from "./MirrorSection";
import { CompatibilitySection } from "./CompatibilitySection";
import type { ParentChildPrimaryRole } from "./CompatibilitySection";
import { TraditionSection } from "./TraditionSection";
import type { YiThemeElement } from "../../lib/yi/theme";
import { NameAnalysisSection } from "./NameAnalysisSection";
import { DrawSection } from "./DrawSection";
import { QimenSection } from "./QimenSection";

export const getResultSections = () => [
  ["portrait", "人生画卷"], ["chart", "命盘"], ["detail", "详批"],
  ["name", "姓名"], ["fortune", "大运"], ["draw", "今日签"], ["qimen", "奇门"], ["compatibility", "合盘"], ["mirror", "镜像"],
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

function DailyOracleStrip({ onDraw, onQimen, variant }: { onDraw: () => void; onQimen: () => void; variant: "report" | "home" }) {
  return <section className={`daily-oracle-strip daily-oracle-strip--${variant}`} aria-label="每日灵感入口">
    <button type="button" data-daily-entry="draw" onClick={onDraw}><span>今日签</span><small>每日一签，平平安安</small></button>
    <button type="button" data-daily-entry="qimen" onClick={onQimen}><span>奇门</span><small>看当下先开哪扇门</small></button>
  </section>;
}

export function ResultShell({ name, chart, birth, report, interpretations, themeElement, activeSection, onSectionChange, onRestart, onSaveHome, storageError }: {
  name: string; chart: FourPillarsResult;
  birth: BirthInput; report: ProfessionalReport; interpretations: InterpretationItem[]; activeSection: ReportSectionId; onSectionChange: (section: ReportSectionId) => void;
  themeElement: YiThemeElement; onRestart: () => void; onSaveHome?: () => void; storageError?: string;
}) {
  const [state, dispatch] = useReducer(resultShellReducer, undefined, createInitialResultShellState);
  const [scrollPositions] = useState(createResultScrollPositions);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const saveTriggerRef = useRef<HTMLButtonElement>(null);
  const availableSections = getAvailableSections(true);
  const resultSections = getResultSections().filter(([id]) => availableSections.includes(id));
  const activeSectionLabel = resultSections.find(([id]) => id === activeSection)?.[1] ?? "人生画卷";
  const ownerName = name.trim();
  const reportTitle = ownerName ? `${ownerName}人生命运报告` : "人生命运报告";
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollTop(scrollPositions, activeSection) }));
    return () => {
      window.cancelAnimationFrame(frame);
      scrollPositions.set(activeSection, window.scrollY);
    };
  }, [activeSection, scrollPositions]);
  useEffect(() => {
    function collapseOpenSection(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest?.("[data-collapse-section]");
      if (!trigger) return;
      const details = trigger.closest("details") as HTMLDetailsElement | null;
      if (!details) return;
      details.open = false;
      details.querySelector("summary")?.scrollIntoView({ block: "nearest" });
    }
    document.addEventListener("click", collapseOpenSection);
    return () => document.removeEventListener("click", collapseOpenSection);
  }, []);
  function selectSection(next: ReportSectionId) {
    selectResultSection(scrollPositions, activeSection, next, window.scrollY, onSectionChange);
  }
  function closeSaveDialog() {
    setSaveConfirmOpen(false);
    window.requestAnimationFrame(() => saveTriggerRef.current?.focus());
  }
  function renderActiveSection() {
    switch (activeSection) {
      case "chart":
        return <ChartSection chart={chart} items={interpretations} report={report} />;
      case "detail":
        return <DetailSection items={interpretations} />;
      case "name":
        return ownerName ? <NameAnalysisSection chart={chart} key={ownerName} name={ownerName} report={report} /> : <section className="name-analysis-section name-reference-section"><header className="name-reference-summary"><div><small>姓名文化测分 · 仅供参考</small><h2>姓名五行参考分</h2><p className="name-current-glyphs">填写姓名后展示</p></div></header></section>;
      case "fortune":
        return <FortuneSection chart={chart} birth={birth} />;
      case "draw":
        return <DrawSection chart={chart} birth={birth} onBackToChart={() => selectSection("chart")} />;
      case "qimen":
        return <QimenSection chart={chart} birth={birth} onBackToChart={() => selectSection("chart")} />;
      case "mirror":
        return <MirrorSection chart={chart} />;
      case "compatibility":
        return <CompatibilitySection chart={chart} primaryName={name} relationship={state.compatibility.relationship} primaryParentRole={state.compatibility.primaryParentRole} secondBirth={state.compatibility.secondBirth} onRelationshipChange={relationship => dispatch({ type: "set-relationship", relationship })} onSecondBirthChange={birth => dispatch({ type: "set-second-birth", birth })} onParentChildPrimaryRoleChange={primaryParentRole => dispatch({ type: "set-parent-child-primary-role", primaryParentRole })} />;
      case "tradition":
        return <TraditionSection chart={chart} birth={birth} />;
      default:
        return <PortraitSection birth={birth} chart={chart} report={report} items={interpretations} />;
    }
  }
  const isStandaloneRitualPage = activeSection === "draw" || activeSection === "qimen";
  const resultContent = <div className={"result-content" + (isStandaloneRitualPage ? " result-content--daily-ritual" : "")}>
    {renderActiveSection()}
    {shouldRenderSourceNote(activeSection) && <SourceNote chart={chart} items={interpretations} />}
  </div>;
  const resultNavigation = <nav className="result-tabs" aria-label="人生报告导航">
    <div className="result-tabs-guide"><div className="result-tabs-copy"><small>报告预览</small><strong>{activeSectionLabel}</strong></div><div className="result-tabs-actions" data-testid="report-save-actions">{onSaveHome && <button className="primary" ref={saveTriggerRef} onClick={() => setSaveConfirmOpen(true)}>人生首页</button>}<button onClick={onRestart}>修改坐标</button></div></div>
    <div className="result-tab-list">
      {resultSections.map(([id, label]) => <button key={id} className={"result-tab" + (id === "portrait" ? " result-tab--primary" : "") + (activeSection === id ? " active" : "")} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}>{label}</button>)}
    </div>
  </nav>;
  if (isStandaloneRitualPage) {
    return <section className="result-shell result-shell--standalone-ritual" data-theme-element={themeElement}>
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      {resultContent}
    </section>;
  }
  return <section className="result-shell" data-theme-element={themeElement}>
    <div className="result-head">
      <header className="report-title-region" data-testid="report-title-region">
        <div className="report-title-topline report-brand-line" data-testid="report-brand-line">
          <span className="report-brand-word">命</span>
          <span className="report-brand-name">东方人生智慧</span>
        </div>
        <div className="report-document-title" data-testid="report-document-title">
          <h1>{reportTitle}</h1>
        </div>
      </header>
      <DailyOracleStrip onDraw={() => selectSection("draw")} onQimen={() => selectSection("qimen")} variant="report" />
    </div>
    {saveConfirmOpen && <SaveHomeDialog onClose={closeSaveDialog} onConfirm={() => { closeSaveDialog(); onSaveHome?.(); }} />}
    {storageError && <p className="storage-error" role="alert">{storageError}</p>}
    {resultNavigation}
    {resultContent}
  </section>;
}
