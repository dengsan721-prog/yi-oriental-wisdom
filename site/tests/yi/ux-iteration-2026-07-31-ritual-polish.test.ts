import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DrawSection, selectDailyDrawRecord } from "../../components/yi/DrawSection";
import { NameAnalysisView, createNameAnalysisViewState } from "../../components/yi/NameAnalysisSection";
import { QimenSection, selectDailyQimenRecord } from "../../components/yi/QimenSection";
import { ResultShell, getAvailableSections, getResultSections } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { analyzeName } from "../../lib/yi/name-analysis";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput } from "../../lib/yi/types";

const birth: BirthInput = {
  name: "欧阳司徒",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江杭州",
  gender: "female",
  timeConfidence: "exact",
};

function model(input: BirthInput = birth) {
  const chart = calculateFourPillars(input);
  const report = buildProfessionalReport(chart, input);
  return { chart, report, items: buildInterpretations(chart) };
}

function renderShell(activeSection: "portrait" | "face" | "star" | "tradition" = "portrait") {
  const { chart, report, items } = model();
  return renderToStaticMarkup(createElement(ResultShell, {
    name: birth.name,
    chart,
    birth,
    report,
    interpretations: items,
    activeSection,
    onSectionChange: () => undefined,
    onRestart: () => undefined,
    onSaveHome: () => undefined,
    themeElement: deriveYiThemeElement(chart),
  }));
}

describe("2026-07-31 ritual polish and atlas module extraction", () => {
  it("centers the panoramic fate title with a lishu tuned font contract", () => {
    const html = renderShell("portrait");
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const title = html.slice(html.indexOf('data-testid="report-document-title"'), html.indexOf("</h1>"));
    const brand = html.slice(html.indexOf('data-testid="report-brand-line"'), html.indexOf('data-testid="report-document-title"'));

    expect(title).toContain("欧阳司徒命运全景报告");
    expect(brand).toContain("东方人生智慧");
    expect(brand).toContain("命");
    expect(brand).toMatch(/[木火土金水]命/u);
    expect(css).toContain(".report-brand-line{justify-self:start");
    expect(css).toContain(".report-document-title{text-align:center");
    expect(css).toMatch(/\.result-shell \.report-document-title h1\{[^}]*font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif/);
    expect(css).toMatch(/\.report-document-title h1\{[^}]*font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif/);
  });

  it("extracts face reading and star reading into lower report modules while keeping daily rituals upstairs", () => {
    const ids = getResultSections().map(([id]) => id);
    const html = renderShell("portrait");
    const nav = html.slice(html.indexOf('class="result-tabs"'), html.indexOf('class="result-content"'));

    expect(ids).toEqual([
      "portrait", "chart", "detail", "name", "fortune", "face", "star", "compatibility", "mirror", "tradition",
    ]);
    expect(getAvailableSections(true)).toHaveLength(10);
    expect(nav).toContain(">相面</button>");
    expect(nav).toContain(">星座</button>");
    expect(nav).not.toContain(">今日签</button>");
    expect(nav).not.toContain(">奇门</button>");
  });

  it("renders face and star as direct modules with focused atlas methods", () => {
    const face = renderShell("face");
    const star = renderShell("star");
    const tradition = renderShell("tradition");

    expect(face).toContain("相面");
    expect(face).toContain("面型");
    expect(face).not.toContain("<b>星座</b>");
    expect(star).toContain("星座");
    expect(star).toContain("白羊座");
    expect(star).not.toContain("<b>相面</b>");
    expect(tradition).not.toContain("<b>星座</b>");
    expect(tradition).not.toContain("<b>相面</b>");
  });

  it("makes today sign question-first, repeatable by question, and structured as sign text, poem and interpretation", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const career = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业去留");
    const relation = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "关系修复");

    expect(html).toContain("问事");
    expect(html).toContain("事业去留");
    expect(html).toContain("写下今天要问的一件事");
    expect(html).toContain("oracle-stick-fan");
    expect(html).toContain("oracle-stick-well");
    expect(html).toContain("oracle-tube-front");
    expect(html).toContain('class="oracle-tube-inscription">签');
    expect(html).not.toContain("<i>签</i>");
    expect(html).not.toContain("签文");
    expect(html).not.toContain("签诗");
    expect(career.dynamicKey).not.toBe(relation.dynamicKey);
    expect(career.sign).not.toBe(relation.sign);
    expect(career.reading).not.toBe(relation.reading);
    expect(career).toHaveProperty("text");
  });

  it("makes qimen question-first with presets and a richer classical plate", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(QimenSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const career = selectDailyQimenRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业取舍");
    const money = selectDailyQimenRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "财运取舍");

    expect(html).toContain("问事");
    expect(html).toContain("事业取舍");
    expect(html).toContain("写下今天要问的一件事");
    expect(html).toContain("qimen-nine-grid");
    expect(html).toContain("qimen-cardinal qimen-cardinal--north");
    expect(html).not.toContain("问事时间");
    expect(career.dynamicKey).not.toBe(money.dynamicKey);
    expect(career.gate + career.direction + career.prompt).not.toBe(money.gate + money.direction + money.prompt);
  });

  it("shows classic name suggestions as complete names with the detected surname", async () => {
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

    expect(html).toContain('data-classic-name="欧阳');
    expect(html).toContain("<h4>欧阳");
    expect(html).not.toContain("<h4>乔</h4>");
    expect(html).not.toContain("<h4>清芷</h4>");
  });
});
