import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialResultShellState, createResultScrollPositions, getAvailableSections, getResultSections, resultShellReducer, restoreScrollTop, selectResultSection } from "../../components/yi/ResultShell";
import { ResultShell } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput } from "../../lib/yi/types";

const exactBirth: BirthInput = {
  name: "林",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female" as const,
  timeConfidence: "exact" as const,
};

function renderResult(birth: BirthInput = exactBirth, options: {
  ambiguousDay?: boolean;
  storageError?: string;
} = {}) {
  const chart = calculateFourPillars(birth);
  if (options.ambiguousDay) chart.ambiguousPillars = [...chart.ambiguousPillars, "day"];
  const report = buildProfessionalReport(chart, birth);
  return { report, html: renderToStaticMarkup(createElement(ResultShell, {
    name: birth.name,
    chart,
    birth,
    report,
    overview: buildProfessionalOverview(chart),
    interpretations: buildInterpretations(chart),
    activeSection: "portrait",
    onSectionChange: () => {},
    onRestart: () => {},
    onSaveHome: () => {},
    storageError: options.storageError,
    themeElement: deriveYiThemeElement(chart),
  })) };
}

describe("result navigation", () => {
  it("introduces the report owner before the independent document title", () => {
    const { html } = renderResult({ ...exactBirth, name: "林知夏" });
    const owner = html.indexOf('data-testid="report-owner-ritual"');
    const reportTitle = html.indexOf('data-testid="report-document-title"');
    const facts = html.indexOf('data-testid="adopted-birth-facts"');
    const actions = html.indexOf('data-testid="report-save-actions"');
    const titleRegion = html.slice(
      html.indexOf('data-testid="report-title-region"'),
      html.indexOf("</header>"),
    );

    expect(html).toContain("本卷主人");
    expect(html).toContain('class="report-owner-name">林知夏<');
    expect(html).toContain('data-testid="report-document-title"');
    expect(html).toContain("<h1>个人命运全景报告</h1>");
    expect(html).toContain('class="yi-brand-mark yi-brand-mark--compact"');
    expect(html).toContain('aria-label="命"');
    expect(html).toContain('data-code-point="U+547D"');
    expect(html).not.toContain("访客的人生报告");
    expect(titleRegion.match(/<h1>/g)).toHaveLength(1);
    expect(owner).toBeGreaterThan(-1);
    expect(reportTitle).toBeGreaterThan(owner);
    expect(facts).toBeGreaterThan(reportTitle);
    expect(actions).toBeGreaterThan(facts);
  });

  it("uses a clear fallback for an empty report owner and wraps long names", () => {
    const empty = renderResult({ ...exactBirth, name: "" });
    const long = renderResult({ ...exactBirth, name: "欧阳司徒上官诸葛林知夏" });

    expect(empty.html).toContain('class="report-owner-name">未填写姓名<');
    expect(long.html).toContain('class="report-owner-name">欧阳司徒上官诸葛林知夏<');
  });

  it("keeps neutral evidence neutral in the owner seal", () => {
    const { html } = renderResult(exactBirth, { ambiguousDay: true });

    expect(html).toContain('<span class="report-owner-seal">待定命印</span>');
    expect(html).not.toMatch(/[木火土金水]命印/);
  });

  it("reuses the compact audited mark on life home and passes the derived theme", () => {
    const lifeHomeSource = readFileSync(new URL("../../components/yi/LifeHome.tsx", import.meta.url), "utf8");
    const experienceSource = readFileSync(new URL("../../components/yi/YiExperience.tsx", import.meta.url), "utf8");

    expect(lifeHomeSource).toContain('<YiBrandMark variant="compact" />');
    expect(lifeHomeSource).not.toContain('className="mini-mark"');
    expect(experienceSource).toContain("themeElement={themeElement}");
  });

  it("places save and restart actions after the adopted facts, outside the title row", () => {
    const { html } = renderResult();
    const titleStart = html.indexOf('data-testid="report-title-region"');
    const factsStart = html.indexOf('data-testid="adopted-birth-facts"');
    const actionsStart = html.indexOf('data-testid="report-save-actions"');
    const titleEnd = html.indexOf("</header>");

    expect(titleStart).toBeGreaterThan(-1);
    expect(factsStart).toBeGreaterThan(titleStart);
    expect(titleEnd).toBeGreaterThan(titleStart);
    expect(factsStart).toBeGreaterThan(titleEnd);
    expect(html.slice(titleStart, titleEnd)).not.toContain("<button");
    expect(actionsStart).toBeGreaterThan(factsStart);
    expect(html).toContain('<button class="primary">保存并进入人生首页</button>');
    expect(html).toContain("<button>修改出生资料</button>");
    expect(html).not.toContain("保存到本机");
  });

  it("keeps the result actions tappable and free of horizontal overflow on narrow screens", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.result-head-actions\{[^}]*display:flex[^}]*justify-content:flex-end[^}]*gap:8px/);
    expect(css).toMatch(/\.result-head-actions button\{[^}]*min-width:0[^}]*min-height:44px/);
    expect(css).toMatch(/@media\(max-width:520px\)\{\.result-head>\.result-head-actions\{[^}]*display:grid[^}]*grid-template-columns:1fr/);
    expect(css).toMatch(/@media\(max-width:520px\)\{\.result-head>\.result-head-actions\{[^}]*\}\.result-head-actions button\{[^}]*width:100%/);
    expect(css).toMatch(/\.report-owner-name\{[^}]*overflow-wrap:anywhere/);
    expect(css).toMatch(/\.report-title-region\{[^}]*min-width:0/);
  });

  it("shows the adopted report facts and unknown-time scope in the header", () => {
    const { report, html } = renderResult();
    const unknown = renderResult({ ...exactBirth, time: null, timeConfidence: "unknown" as const });

    expect(html).toContain("本次采用");
    expect(html).toContain(report.birthFacts.solar);
    expect(html).toContain(report.birthFacts.timeConfidence);
    expect(html).toContain(report.birthFacts.location);
    expect(html).toContain("UTC+8");
    expect(html).toContain("修改出生资料");
    expect(unknown.html).toContain("已关闭：时柱、时柱派生判断与精确大运年份。");
    expect(renderResult({ ...exactBirth, time: null, timeConfidence: "exact" }).html).toContain("已关闭：时柱、时柱派生判断与精确大运年份。");
  });

  it("keeps the seven report sections in a stable reading order", () => {
    expect(getResultSections().map(([id]) => id)).toEqual([
      "portrait", "chart", "detail", "fortune", "compatibility", "mirror", "tradition",
    ]);
  });

  it("exposes all seven production sections", () => {
    expect(getAvailableSections(true)).toHaveLength(7);
  });

  it("keeps the selected parent-child report role through compatibility changes", () => {
    const initial = createInitialResultShellState();
    const withRole = resultShellReducer(initial, { type: "set-parent-child-primary-role", primaryParentRole: "child" });
    const withRelationship = resultShellReducer(withRole, { type: "set-relationship", relationship: "business" });
    expect(initial.compatibility.primaryParentRole).toBe("caregiver");
    expect(withRole.compatibility.primaryParentRole).toBe("child");
    expect(withRelationship.compatibility.relationship).toBe("business");
    expect(withRelationship.compatibility.primaryParentRole).toBe("child");
  });

  it("preserves the submitted second birth object in compatibility state", () => {
    const birth = { name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "female", timeConfidence: "exact", birthDate: { mode: "solar", year: 1992, month: 11, day: 3, isLeapMonth: false }, timeMode: "exact" } as const;
    const roleSelected = resultShellReducer(createInitialResultShellState(), { type: "set-parent-child-primary-role", primaryParentRole: "child" });
    const submitted = resultShellReducer(roleSelected, { type: "set-second-birth", birth });
    expect(submitted.compatibility.secondBirth).toBe(birth);
    expect(submitted.compatibility.primaryParentRole).toBe("child");
  });

  it("uses a four-column no-scroll mobile report navigation while preserving desktop navigation", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/@media\(max-width:760px\)\{[^}]*\.result-tabs\{[^}]*display:grid[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)[^}]*overflow-x:hidden/);
    expect(css).toMatch(/\.result-tabs button\{min-width:0;min-height:44px;padding-inline:4px\}/);
    expect(css).toMatch(/\.result-tabs\{position:sticky;top:0;[^}]*display:flex/);
  });

  it("keeps all five life-home destinations visible at 390px without horizontal scrolling", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toContain(".life-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding-inline:12px}");
    expect(css).toContain(".life-nav button{min-width:0}");
  });

  it("defines a modal keyboard contract for save confirmation", async () => {
    const resultModule = await import("../../components/yi/ResultShell");
    const resolver = (resultModule as unknown as Record<string, unknown>).resolveSaveDialogKey;
    expect(resolver).toBeTypeOf("function");
    if (typeof resolver !== "function") return;

    expect(resolver("Escape", false, 0, 2)).toEqual({ type: "close" });
    expect(resolver("Tab", false, 1, 2)).toEqual({ type: "focus", index: 0 });
    expect(resolver("Tab", true, 0, 2)).toEqual({ type: "focus", index: 1 });
    expect(resolver("Tab", false, 0, 2)).toEqual({ type: "none" });
  });

  it("marks the save dialog modal and restores focus through the real trigger", () => {
    const source = readFileSync(new URL("../../components/yi/ResultShell.tsx", import.meta.url), "utf8");

    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-labelledby="save-home-title"');
    expect(source).toContain('aria-describedby="save-home-description"');
    expect(source).toContain('querySelector<HTMLElement>("button")?.focus()');
    expect(source).toMatch(/event\.key === "Escape"/);
    expect(source).toMatch(/event\.key === "Tab"/);
    expect(source).toContain("saveTriggerRef.current?.focus()");
    expect(source).toContain("onConfirm={() => { closeSaveDialog(); onSaveHome?.(); }}");
  });

  it("keeps save failure feedback visible without changing the confirmation callback", () => {
    const { html } = renderResult(exactBirth, { storageError: "本机档案保存失败，请重试。" });

    expect(html).toContain('<p class="storage-error" role="alert">本机档案保存失败，请重试。</p>');
  });

  it("delegates section changes while keeping reusable scroll positions", () => {
    expect(getAvailableSections()).toEqual(["portrait", "chart", "detail"]);
    const positions = createResultScrollPositions();
    const selected: string[] = [];
    expect(positions).toBeInstanceOf(Map);
    selectResultSection(positions, "detail", "mirror", 320, section => selected.push(section));
    selectResultSection(positions, "mirror", "detail", 85, section => selected.push(section));
    expect(positions.get("detail")).toBe(320);
    expect(positions.get("mirror")).toBe(85);
    expect(selected).toEqual(["mirror", "detail"]);
    expect(restoreScrollTop(positions, "detail")).toBe(320);
    expect(restoreScrollTop(positions, "mirror")).toBe(85);
    expect(restoreScrollTop(positions, "portrait")).toBe(0);
  });
});
