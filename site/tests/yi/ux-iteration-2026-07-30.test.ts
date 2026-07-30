import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChartSection } from "../../components/yi/ChartSection";
import { CompatibilitySection, getCompatibilityParticipants } from "../../components/yi/CompatibilitySection";
import { DetailSection } from "../../components/yi/DetailSection";
import { DrawSection } from "../../components/yi/DrawSection";
import { LifeHome } from "../../components/yi/LifeHome";
import { MirrorSectionView } from "../../components/yi/MirrorSection";
import { NameAnalysisView, createNameAnalysisViewState } from "../../components/yi/NameAnalysisSection";
import { PortraitSection } from "../../components/yi/PortraitSection";
import { QimenSection } from "../../components/yi/QimenSection";
import { ResultShell } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { analyzeName } from "../../lib/yi/name-analysis";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput } from "../../lib/yi/types";

const birth: BirthInput = {
  name: "\u6b27\u9633\u53f8\u5f92",
  date: "1990-06-15",
  time: "09:30",
  location: "\u9655\u897f\u7701\u5546\u6d1b\u5e02\u5c71\u9633\u53bf",
  gender: "female",
  timeConfidence: "exact",
};

function model(input: BirthInput = birth) {
  const chart = calculateFourPillars(input);
  const report = buildProfessionalReport(chart, input);
  const items = buildInterpretations(chart);
  return { chart, report, items };
}

function renderShell(section = "portrait" as const) {
  const { chart, report, items } = model();
  return renderToStaticMarkup(createElement(ResultShell, {
    name: birth.name,
    chart,
    birth,
    report,
    interpretations: items,
    activeSection: section,
    onSectionChange: () => undefined,
    onRestart: () => undefined,
    onSaveHome: () => undefined,
    themeElement: deriveYiThemeElement(chart),
  }));
}

describe("2026-07-30 mobile report system iteration", () => {
  it("puts a clean brand line above the solemn report title", () => {
    const html = renderShell();
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const topLine = html.indexOf('data-testid="report-brand-line"');
    const title = html.indexOf('data-testid="report-document-title"');

    expect(topLine).toBeGreaterThan(-1);
    expect(topLine).toBeLessThan(title);
    expect(html).toContain("report-brand-line");
    expect(html).toContain("\u6b27\u9633\u53f8\u5f92\u4eba\u751f\u547d\u8fd0\u62a5\u544a");
    expect(html).toContain("\u4e1c\u65b9\u4eba\u751f\u667a\u6167");
    expect(html).not.toContain("\u672c\u6b21\u91c7\u7528");
    expect(css).toContain(".report-brand-line{display:flex");
    expect(css).not.toContain(".report-title-topline{grid-template-columns:1fr}");
  });

  it("moves compact save and restart actions into the right side of report navigation", () => {
    const html = renderShell();
    const nav = html.slice(html.indexOf('class="result-tabs"'), html.indexOf('class="result-content"'));

    expect(nav).toContain('class="result-tabs-actions"');
    expect(nav).toContain("\u62a5\u544a\u9884\u89c8");
    expect(nav).toContain("\u4eba\u751f\u753b\u5377");
    expect(nav).toContain("\u4eba\u751f\u9996\u9875");
    expect(nav).toContain("\u4fee\u6539\u5750\u6807");
    expect(nav).not.toContain("\u5f53\u524d\u7126\u70b9");
    expect(nav).not.toContain("10");
    expect(nav).not.toContain("\u547d\u8fd0\u5165\u53e3");
    expect(nav).not.toContain("\u81ea\u5df1\u521b\u9020\u81ea\u5df1");
    expect(html).not.toContain("\u4fdd\u5b58\u5e76\u8fdb\u5165\u4eba\u751f\u9996\u9875");
    expect(html).not.toContain("\u4fee\u6539\u51fa\u751f\u8d44\u6599");
  });

  it("makes the report navigation compact with the life scroll as the only full-width capsule", () => {
    const html = renderShell();
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(html).toContain('class="result-tab result-tab--primary active"');
    expect(css).toContain(".result-tab--primary{grid-column:1/-1");
    expect(css).toContain(".result-tab-list{grid-template-columns:repeat(3,minmax(0,1fr))");
  });

  it("shows daily draw and qimen only in the report top strip and as direct life-home entries", () => {
    const shell = renderShell();
    const experienceSource = readFileSync(new URL("../../components/yi/YiExperience.tsx", import.meta.url), "utf8");
    const home = renderToStaticMarkup(createElement(LifeHome, {
      profile: {
        version: 1,
        name: birth.name,
        birth,
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-07-16T00:00:00.000Z",
        currentStage: "\u7a33\u4f4f\u8282\u594f",
        annualMap: [],
        monthlyRhythm: [],
        events: [],
        relations: [],
        actions: [],
      },
      onChange: () => ({ ok: true as const }),
      onClear: () => ({ ok: true as const }),
      onViewReport: () => undefined,
      onViewDraw: () => undefined,
      onViewQimen: () => undefined,
    }));
    const portraitContent = shell.slice(shell.indexOf('class="result-content"'));

    expect(shell).toContain('class="daily-oracle-strip daily-oracle-strip--report"');
    expect(shell).toContain('data-daily-entry="draw"');
    expect(shell).toContain('data-daily-entry="qimen"');
    expect(home).toContain('class="daily-oracle-strip daily-oracle-strip--home"');
    expect(home).toContain('data-home-entry="draw"');
    expect(home).toContain('data-home-entry="qimen"');
    expect(experienceSource).toContain('onViewDraw={() => push({ page: "report", section: "draw" })}');
    expect(experienceSource).toContain('onViewQimen={() => push({ page: "report", section: "qimen" })}');
    expect(portraitContent).not.toContain('data-testid="draw-lot-trigger"');
    expect(portraitContent).not.toContain('data-testid="qimen-calc-trigger"');
  });

  it("turns today sign and qimen into standalone classical ritual pages", () => {
    const { chart } = model();
    const draw = renderToStaticMarkup(createElement(DrawSection, { chart, birth }));
    const qimen = renderToStaticMarkup(createElement(QimenSection, { chart, birth }));

    expect(draw).toContain("ritual-standalone-page");
    expect(draw).toContain("realistic-oracle-tube");
    expect(draw).toContain('class="oracle-tube-inscription">\u7b7e');
    expect(draw).toContain('data-testid="draw-lot-trigger"');
    expect(draw).toContain("\u7b7e\u8bd7");
    expect(draw).not.toContain('scene-line-art--oracle');
    const drawSource = readFileSync(resolve(__dirname, "../../components/yi/DrawSection.tsx"), "utf8");
    expect(drawSource).toContain("dailySignDatabase");
    expect(drawSource).toContain("selectDailyDrawRecord");
    expect(drawSource).toMatch(/\u5c0f\u51f6|\u5c0f\u5409|\u4e2d\u5409|\u5927\u5409/);
    expect(qimen).toContain("ritual-standalone-page");
    expect(qimen).toContain('class="qimen-plate-center">\u8d77\u5c40');
    expect(qimen).toContain('data-testid="qimen-calc-trigger"');
    expect(qimen).toContain("\u4eca\u65e5\u5947\u95e8");
    expect(qimen).not.toContain('scene-line-art--qimen');
  });

  it("uses self-creation growth stages, a sun animation, and no loud life-scroll collapse label", () => {
    const { chart, report, items } = model();
    const html = renderToStaticMarkup(createElement(PortraitSection, {
      birth,
      chart,
      report,
      items,
      today: new Date("2026-07-30T00:00:00+08:00"),
    }));

    expect(html).toContain("\u81ea\u5df1\u521b\u9020\u81ea\u5df1");
    expect(html).toContain('class="life-scroll-order-map"');
    expect(html).toContain('class="life-progress-sun"');
    expect(html).not.toContain("\u6536\u8d77\u672c\u7ae0");
  });

  it("adds small collapse links to chart and detail cards without oversized buttons", () => {
    const { chart, report, items } = model();
    const chartHtml = renderToStaticMarkup(createElement(ChartSection, { chart, report, items }));
    const detailHtml = renderToStaticMarkup(createElement(DetailSection, { items }));

    expect(chartHtml).toContain('class="collapse-section-button collapse-section-button--quiet"');
    expect(chartHtml).toContain("\u6536\u8d77\uff0c\u56de\u5230\u547d\u76d8\u603b\u89c8");
    expect(detailHtml).toContain('class="collapse-section-button collapse-section-button--quiet"');
    expect(detailHtml).toContain("\u6536\u8d77\uff0c\u56de\u5230\u7965\u6279\u603b\u89c8");
  });

  it("places the name suggestion batch switch beside the suggestions heading", async () => {
    const { chart, report } = model();
    const analysis = await analyzeName({ rawInput: birth.name, chart, professionalReport: report });
    const html = renderToStaticMarkup(createElement(NameAnalysisView, {
      analysis: analysis!,
      state: createNameAnalysisViewState(birth.name),
      onDetailsOpenChange: () => undefined,
      onModeChange: () => undefined,
      onTraditionalSelection: () => undefined,
      onReadingSelection: () => undefined,
      onRealityAnswer: () => undefined,
      onConfirmSameNameExit: () => undefined,
      onSuggestionBatchChange: () => undefined,
    } as never));

    const header = html.slice(html.indexOf('class="name-classic-suggestions-head"'), html.indexOf('class="name-classic-suggestions-body"'));
    expect(header).toContain('class="name-batch-button"');
    expect(header.indexOf("\u5178\u7c4d\u53d6\u540d\u5efa\u8bae")).toBeLessThan(header.indexOf("\u6362\u4e00\u6279"));
  });

  it("clarifies parent-child role selection and highlights the selected role", () => {
    expect(getCompatibilityParticipants("\u9093\u4e09", "\u5c0f\u9093", "parent-child", "caregiver")).toEqual({
      first: "\u9093\u4e09\uff08\u7167\u987e\u8005\uff09",
      second: "\u5c0f\u9093\uff08\u5b69\u5b50\uff09",
    });
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(CompatibilitySection, {
      chart,
      primaryName: birth.name,
      relationship: "parent-child",
      primaryParentRole: "child",
      secondBirth: null,
      onRelationshipChange: () => undefined,
      onSecondBirthChange: () => undefined,
      onParentChildPrimaryRoleChange: () => undefined,
    }));

    expect(html).toContain("\u6211\u662f\u5b69\u5b50");
    expect(html).toContain('aria-pressed="true" class="active">\u6211\u662f\u5b69\u5b50');
  });

  it("gives the zodiac mirror a visible totem image", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(MirrorSectionView, {
      chart,
      activeView: "zodiac",
      onSelectView: () => undefined,
    }));

    expect(html).toContain('class="zodiac-totem"');
    expect(html).toContain('scene-line-art--zodiac');
  });
});
