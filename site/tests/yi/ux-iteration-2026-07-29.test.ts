import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BirthIntake } from "../../components/yi/BirthIntake";
import { CompatibilitySection } from "../../components/yi/CompatibilitySection";
import { LifeHome } from "../../components/yi/LifeHome";
import {
  createNameAnalysisViewState,
  nameAnalysisViewReducer,
  NameAnalysisView,
} from "../../components/yi/NameAnalysisSection";
import { PortraitSection } from "../../components/yi/PortraitSection";
import { ResultShell, getAvailableSections, getResultSections } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { buildLifeScrollNarrative } from "../../lib/yi/life-scroll";
import { analyzeName } from "../../lib/yi/name-analysis";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput } from "../../lib/yi/types";

const birth: BirthInput = {
  name: "欧阳司徒",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female",
  timeConfidence: "exact",
};

function renderReport(input: BirthInput = birth) {
  const chart = calculateFourPillars(input);
  const report = buildProfessionalReport(chart, input);
  return renderToStaticMarkup(createElement(ResultShell, {
    name: input.name,
    chart,
    birth: input,
    report,
    interpretations: buildInterpretations(chart),
    activeSection: "portrait",
    onSectionChange: () => undefined,
    onRestart: () => undefined,
    onSaveHome: () => undefined,
    themeElement: deriveYiThemeElement(chart),
  }));
}

describe("2026-07-29 mobile-first wisdom iteration", () => {
  it("adds抽签 and奇门 as report chapters while keeping name after详批", () => {
    expect(getResultSections().map(([id]) => id)).toEqual([
      "portrait",
      "chart",
      "detail",
      "name",
      "fortune",
      "draw",
      "qimen",
      "compatibility",
      "mirror",
      "tradition",
    ]);
    expect(getAvailableSections(true)).toHaveLength(10);
    expect(renderReport()).toContain("<span>10章命运全景 · 点击切换重点</span>");
  });

  it("makes the report title solemn and resilient for three- or four-character names", () => {
    const html = renderReport();
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(html).toContain('class="report-title-name">欧阳司徒</span>');
    expect(html).toContain('class="report-title-core">命运报告</span>');
    expect(html).toContain('class="report-title-scope">全景</span>');
    expect(css).toContain(".report-title-name{max-width:min(7.2em,46vw)");
    expect(css).toContain(".report-title-core{white-space:nowrap");
    expect(css).toMatch(/@media\(max-width:520px\)\{\.report-document-title h1\{[^}]*display:flex[^}]*gap:4px[^}]*font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif[^}]*white-space:nowrap/);
  });

  it("uses a vertical 本次采用 rail with two mobile chip columns", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toContain("@media(max-width:520px){.adopted-facts{grid-template-columns:auto repeat(2,minmax(0,1fr))");
    expect(css).toContain(".adopted-facts>b{grid-row:1/span 2;writing-mode:vertical-rl");
    expect(css).toContain(".adopted-facts span{max-width:100%;text-align:center}");
  });

  it("requires birth location on the intake form and keeps time-label chips compact", () => {
    const html = renderToStaticMarkup(createElement(BirthIntake, { onSubmit: () => undefined }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(html).toContain("出生地址（必填）");
    expect(html).toContain('required=""');
    expect(css).toContain("@media(max-width:520px){.time-mode-row button,.time-branch-grid button{font-size:13px;white-space:nowrap");
  });

  it("replaces the compatibility select popup with aesthetic relationship cards", () => {
    const chart = calculateFourPillars(birth);
    const html = renderToStaticMarkup(createElement(CompatibilitySection, {
      chart,
      primaryName: birth.name,
      relationship: "partner",
      primaryParentRole: "caregiver",
      secondBirth: null,
      onRelationshipChange: () => undefined,
      onSecondBirthChange: () => undefined,
      onParentChildPrimaryRoleChange: () => undefined,
    }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(html).toContain('class="relationship-choice-panel"');
    expect(html).toContain('aria-label="选择关系类型"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain("<select");
    expect(css).toContain(".relationship-choice-panel{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))");
  });

  it("adds a collapse button at the end of expanded story cards", () => {
    const chart = calculateFourPillars(birth);
    const report = buildProfessionalReport(chart, birth);
    const html = renderToStaticMarkup(createElement(PortraitSection, {
      birth,
      chart,
      report,
      items: buildInterpretations(chart),
      today: new Date("2026-07-28T00:00:00+08:00"),
    }));

    expect(html.match(/data-collapse-section="true"/g)?.length ?? 0).toBeGreaterThanOrEqual(17);
    expect(html).toContain("收起本章，回到总览");
  });

  it("enriches life-scroll recommendations without publishing full song lyrics", () => {
    const chart = calculateFourPillars(birth);
    const report = buildProfessionalReport(chart, birth);
    const narrative = buildLifeScrollNarrative(chart, report, buildInterpretations(chart));
    const recommendations = narrative.recommendations as unknown as Record<string, Record<string, string>>;
    const html = renderToStaticMarkup(createElement(PortraitSection, {
      birth,
      chart,
      report,
      items: buildInterpretations(chart),
      today: new Date("2026-07-28T00:00:00+08:00"),
    }));

    for (const key of ["herb", "mountain", "lifeBook", "settingPoem"]) {
      expect(recommendations[key]).toBeTruthy();
      expect(html).toContain(recommendations[key].title ?? recommendations[key].phrase);
    }
    expect(recommendations.poem.original.length).toBeGreaterThan(10);
    expect(html).toContain("原诗");
    expect(recommendations.jayChouSong.lyricImagery).toBeTruthy();
    expect(html).toContain("歌词意象");
    expect(html).not.toContain("完整歌词");
  });

  it("varies poems, songs and hundred-year blessing by chart texture", () => {
    const firstChart = calculateFourPillars(birth);
    const secondBirth = {
      ...birth,
      name: "顾临川",
      date: "1985-02-20",
      time: "23:40",
      location: "成都市",
    };
    const secondChart = calculateFourPillars(secondBirth);
    const first = buildLifeScrollNarrative(firstChart, buildProfessionalReport(firstChart, birth), buildInterpretations(firstChart));
    const second = buildLifeScrollNarrative(secondChart, buildProfessionalReport(secondChart, secondBirth), buildInterpretations(secondChart));

    expect(first.recommendations.poem.title).not.toBe(second.recommendations.poem.title);
    expect(first.recommendations.jayChouSong.title).not.toBe(second.recommendations.jayChouSong.title);
    expect(first.closingLine).not.toBe(second.closingLine);
  });

  it("lets classical name suggestions cycle through five batches and loop", async () => {
    const chart = calculateFourPillars(birth);
    const report = buildProfessionalReport(chart, birth);
    const analysis = await analyzeName({ rawInput: birth.name, chart, professionalReport: report });
    let state = createNameAnalysisViewState(birth.name) as ReturnType<typeof createNameAnalysisViewState> & { suggestionBatchIndex: number };

    expect(state.suggestionBatchIndex).toBe(0);
    state = nameAnalysisViewReducer(state, { type: "next-suggestion-batch" } as never) as typeof state;
    expect(state.suggestionBatchIndex).toBe(1);
    for (let index = 0; index < 4; index += 1) {
      state = nameAnalysisViewReducer(state, { type: "next-suggestion-batch" } as never) as typeof state;
    }
    expect(state.suggestionBatchIndex).toBe(0);

    const html = renderToStaticMarkup(createElement(NameAnalysisView, {
      analysis: analysis!,
      state,
      onDetailsOpenChange: () => undefined,
      onModeChange: () => undefined,
      onTraditionalSelection: () => undefined,
      onReadingSelection: () => undefined,
      onRealityAnswer: () => undefined,
      onConfirmSameNameExit: () => undefined,
      onSuggestionBatchChange: () => undefined,
    } as never));
    expect(html).toContain("换一批");
    expect(html).toContain("第1/5批");
  });

  it("keeps life-home wording neutral, visual and badge-oriented", () => {
    const html = renderToStaticMarkup(createElement(LifeHome, {
      profile: {
        version: 1,
        name: "欧阳司徒",
        birth: { ...birth, location: "" },
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-07-16T00:00:00.000Z",
        currentStage: "在稳住节奏后打开新的空间",
        annualMap: [{ year: 2026, theme: "年度复盘计划模板", focus: "只推进一件重要的事" }],
        monthlyRhythm: [{ month: "2026-07", theme: "月度行动计划模板", action: "写下本月要停止的一件事" }],
        events: [{ id: "event-1", title: "准备转岗", date: "2026-08-01", note: "先完成信息访谈" }],
        relations: [],
        actions: [],
      },
      onChange: () => ({ ok: true as const }),
      onClear: () => ({ ok: true as const }),
      onViewReport: () => undefined,
    }));

    expect(html).toContain("<small>改命记录</small>");
    expect(html).toContain('class="scene-line-art scene-line-art--sprout');
    expect(html).toContain('class="scene-line-art scene-line-art--badge');
    expect(html).toContain("称号徽章");
    expect(html).not.toContain("了凡式");
    expect(html).not.toContain("了凡四训");
  });
});
