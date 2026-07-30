import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInitialResultShellState, createResultScrollPositions, getAvailableSections, getResultSections, resultShellReducer, restoreScrollTop, selectResultSection } from "../../components/yi/ResultShell";
import { ResultShell } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { ReportSectionId } from "../../lib/yi/hash-router";
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
  activeSection?: ReportSectionId;
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
    interpretations: buildInterpretations(chart),
    activeSection: options.activeSection ?? "portrait",
    onSectionChange: () => {},
    onRestart: () => {},
    onSaveHome: () => {},
    storageError: options.storageError,
    themeElement: deriveYiThemeElement(chart),
  })) };
}

describe("result navigation", () => {
  it("puts the report owner directly into the panoramic report title", () => {
    const { html } = renderResult({ ...exactBirth, name: "林知夏" });
    const reportTitle = html.indexOf('data-testid="report-document-title"');
    const facts = html.indexOf('data-testid="adopted-birth-facts"');
    const actions = html.indexOf('data-testid="report-save-actions"');
    const titleRegion = html.slice(
      html.indexOf('data-testid="report-title-region"'),
      html.indexOf("</header>"),
    );

    expect(html).toContain('data-testid="report-owner-ritual"');
    expect(html).toContain('data-testid="report-document-title"');
    expect(html).toContain("命运全景报告");    expect(html).toContain('class="yi-brand-mark yi-brand-mark--compact"');
    expect(html).toContain('aria-label="命"');
    expect(html).toContain('data-code-point="U+547D"');
    expect(html).not.toContain("访客的人生报告");
    expect(titleRegion).not.toContain("艺｜东方人生智慧");
    expect(titleRegion).not.toContain("本卷主人");
    expect(titleRegion.match(/<h1>/g)).toHaveLength(1);
    expect(reportTitle).toBeGreaterThan(-1);
    expect(facts).toBeLessThan(reportTitle);
    expect(actions).toBeGreaterThan(reportTitle);
  });

  it("uses a clear fallback for an empty report owner and keeps owner titles on one line", () => {
    const empty = renderResult({ ...exactBirth, name: "" });
    const long = renderResult({ ...exactBirth, name: "欧阳司徒上官诸葛林知夏" });

    expect(empty.html).toContain("个人命运全景报告");    expect(empty.html).not.toContain("未填写姓名命运全景报告");
    expect(long.html).toContain("命运全景报告");
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
    expect(experienceSource).not.toContain("overview={buildProfessionalOverview(result)}");
    expect(experienceSource).toContain("overview: buildProfessionalOverview(result)");
  });

  it("places compact save and restart actions inside the report navigation", () => {
    const { html } = renderResult();
    const titleStart = html.indexOf('data-testid="report-title-region"');
    const actionsStart = html.indexOf('data-testid="report-save-actions"');
    const navStart = html.indexOf('class="result-tabs"');

    expect(titleStart).toBeGreaterThan(-1);
    expect(navStart).toBeGreaterThan(titleStart);
    expect(actionsStart).toBeGreaterThan(navStart);
    expect(html).toContain('<button class="primary">人生首页</button>');
    expect(html).toContain('<button>修改坐标</button>');
    expect(html).not.toContain("保存到本机");
  });

  it("keeps the result actions in a compact navigation area without blocking reading", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/.result-tabs-actions{[^}]*display:flex[^}]*gap:8px/);
    expect(css).toMatch(/.result-tabs-actions button{[^}]*min-height:38px/);
    expect(css).toMatch(/.report-document-title h1{[^}]*font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif[^}]*white-space:nowrap/);
    expect(css).not.toMatch(/.mini-mark|.result-head-main/);
  });

  it("compresses the adopted birth facts into two tidy chip rows on mobile", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.adopted-facts\{[^}]*display:grid[^}]*grid-template-columns:auto repeat\(4,minmax\(0,auto\)\)[^}]*align-items:center/);
    expect(css).toMatch(/\.adopted-facts span\{[^}]*min-width:0[^}]*white-space:nowrap[^}]*overflow:hidden[^}]*text-overflow:ellipsis/);
    expect(css).toMatch(/@media\(max-width:520px\)\{[\s\S]*?\.adopted-facts\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*gap:6px[^}]*padding:9px 10px/);
    expect(css).toMatch(/@media\(max-width:520px\)\{[\s\S]*?\.adopted-facts b\{[^}]*grid-column:1\/-1[^}]*text-align:left/);
    expect(css).toMatch(/@media\(max-width:520px\)\{[\s\S]*?\.adopted-facts span\{[^}]*max-width:100%[^}]*text-align:center/);
    expect(css).toMatch(/@media\(max-width:520px\)\{[\s\S]*?\.adopted-facts small\{[^}]*grid-column:1\/-1/);
  });

  it("shows the adopted report facts and unknown-time scope in the header", () => {
    const { report, html } = renderResult();
    const unknown = renderResult({ ...exactBirth, time: null, timeConfidence: "unknown" as const });

    expect(html).toContain("本次采用");
    expect(html).toContain(report.birthFacts.solar);
    expect(html).toContain(report.birthFacts.timeConfidence);
    expect(html).toContain(report.birthFacts.location);
    expect(html).toContain("UTC+8");
    expect(html).toContain("修改坐标");
    expect(unknown.html).toContain("已关闭：时柱、时柱派生判断与精确大运年份。");
    expect(renderResult({ ...exactBirth, time: null, timeConfidence: "exact" }).html).toContain("已关闭：时柱、时柱派生判断与精确大运年份。");
  });

  it("presents the report navigation as a compact report preview", () => {
    const { html } = renderResult();
    const nav = html.slice(html.indexOf('class="result-tabs"'), html.indexOf('class="result-content"'));

    expect(html).toContain('class="result-tabs"');
    expect(html).toContain('class="result-tabs-guide"');
    expect(nav).toContain("报告预览");
    expect(nav).toContain("人生画卷");
    expect(nav).toContain("人生首页");
    expect(nav).toContain("修改坐标");
    expect(nav).not.toContain("当前焦点");
    expect(nav).not.toContain("10个命运入口");
    expect(nav).not.toContain("自己创造自己");
    expect(html).toContain('class="result-tab-list"');
  });

  it("frames the life scroll as a self-creation growth path", () => {
    const { html } = renderResult();

    expect(html).toContain("自己创造自己");
    for (const label of ["命题", "破局", "人间现场", "意象映照", "百岁回望"]) expect(html).toContain(label);
  });

  it("keeps the ten report sections in a stable reading order", () => {
    expect(getResultSections().map(([id]) => id)).toEqual([
      "portrait", "chart", "detail", "name", "fortune", "draw", "qimen", "compatibility", "mirror", "tradition",
    ]);
    expect(getResultSections()[0]).toEqual(["portrait", "人生画卷"]);
    expect(getResultSections()[3]).toEqual(["name", "姓名"]);
  });

  it("exposes all ten production sections", () => {
    expect(getAvailableSections(true)).toHaveLength(10);
  });

  it("renders name analysis as its own chapter after detail instead of inside the chart", () => {
    const chartHtml = renderResult({ ...exactBirth, name: "林知夏" }, { activeSection: "chart" }).html;
    const detailHtml = renderResult({ ...exactBirth, name: "林知夏" }, { activeSection: "detail" }).html;
    const nameHtml = renderResult({ ...exactBirth, name: "林知夏" }, { activeSection: "name" }).html;
    const fortuneHtml = renderResult({ ...exactBirth, name: "林知夏" }, { activeSection: "fortune" }).html;
    const chartPane = chartHtml.indexOf('<section class="report-section chart-report"');
    const chartEnd = chartHtml.indexOf('data-testid="professional-pillar-table"', chartPane);

    expect(detailHtml).toContain("<small>专业祥批</small>");
    expect(nameHtml).toContain('data-name-analysis="loading"');
    expect(fortuneHtml).toContain('<section class="report-section fortune-report"');
    expect(chartHtml).toContain(">姓名</button>");
    expect(chartHtml.slice(chartPane, chartEnd)).not.toContain("姓名五行参考分");
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

  it("uses a prominent no-overflow focus guide on mobile while preserving desktop navigation", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/.result-tabs{[^}]*position:sticky[^}]*display:grid/);
    expect(css).toContain(".result-tabs-guide{min-width:0;display:grid;gap:2px;padding:10px 14px;border:1px solid var(--yi-accent);border-radius:16px;background:var(--yi-accent-soft)");
    expect(css).toContain(".result-tab-list{grid-template-columns:repeat(3,minmax(0,1fr))");
    expect(css).toContain(".result-tab--primary{grid-column:1/-1");
    expect(css).toMatch(/.result-tabs button{[^}]*min-width:0[^}]*min-height:48px/);
  });

  it("keeps the simple life-home record window readable at 390px without horizontal scrolling", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.life-head-simple button\{[^}]*min-width:88px/);
    expect(css).toMatch(/\.life-daily-form\{[^}]*grid-template-columns:1fr/);
    expect(css).toMatch(/\.life-record-window\{[^}]*overflow:hidden/);
    expect(css).toMatch(/\.life-data-cubes\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
    expect(css).toContain(".life-data-cubes{grid-template-columns:repeat(2,minmax(0,1fr))}");
  });

  it("passes the existing interpretation set into the chart while preserving legacy detail and source routes", () => {
    const source = readFileSync(new URL("../../components/yi/ResultShell.tsx", import.meta.url), "utf8");

    expect(source).toContain(
      "<ChartSection chart={chart} items={interpretations} report={report} />",
    );
    expect(source).toContain("<NameAnalysisSection chart={chart}");
    expect(source).toContain("<DetailSection items={interpretations} />");
    expect(source).toContain("<SourceNote chart={chart} items={interpretations} />");
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
