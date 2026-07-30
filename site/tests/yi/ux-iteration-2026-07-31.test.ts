import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DrawSection, selectDailyDrawRecord } from "../../components/yi/DrawSection";
import { QimenSection, selectDailyQimenRecord } from "../../components/yi/QimenSection";
import { ResultShell, getResultSections } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
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

function renderShell(activeSection: "portrait" | "draw" | "qimen" = "portrait") {
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

describe("2026-07-31 clean mobile report and daily ritual pages", () => {
  it("replaces adopted facts with a clean brand line and solemn life fate title", () => {
    const html = renderShell("portrait");
    const head = html.slice(html.indexOf('class="result-head"'), html.indexOf('class="daily-oracle-strip'));

    expect(head).toContain("report-brand-line");
    expect(head).toContain("命");
    expect(head).toContain("东方人生智慧");
    expect(head).toContain("欧阳司徒人生命运报告");
    expect(head).not.toContain("本次采用");
    expect(head).not.toContain("adopted-birth-facts");
    expect(head).not.toContain("命运全景报告");
  });

  it("renames draw to today sign and keeps it out of the life-scroll content", () => {
    const html = renderShell("portrait");
    const portraitContent = html.slice(html.indexOf('class="result-content"'));

    expect(getResultSections().find(([id]) => id === "draw")).toEqual(["draw", "今日签"]);
    expect(html).toContain("今日签");
    expect(html).toContain("每日一签，平平安安");
    expect(portraitContent).not.toContain("每日一签");
    expect(portraitContent).not.toContain("奇门起局");
  });

  it("renders today sign as a clean standalone page with a realistic classical tube and back button", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-30T10:00:00+08:00"),
    }));
    const shell = renderShell("draw");

    expect(shell).not.toContain('class="result-head"');
    expect(html).toContain("每日一签");
    expect(html).toContain("平平安安");
    expect(html).toContain("回到命盘");
    expect(html).toContain('class="realistic-oracle-tube"');
    expect(html).toContain('class="oracle-tube-inscription">签');
    expect(html).not.toContain("scene-line-art--oracle");
    expect(html).toContain("结合生辰签");
    expect(html).toMatch(/小凶|小吉|中吉|大吉/);
  });

  it("renders qimen as a clean standalone page without address display and with dynamic guidance", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(QimenSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-30T10:00:00+08:00"),
    }));

    expect(html).toContain("今日奇门");
    expect(html).toContain("起局");
    expect(html).toContain("回到命盘");
    expect(html).toContain('class="realistic-qimen-plate"');
    expect(html).not.toContain("浙江杭州");
    expect(html).not.toContain("scene-line-art--qimen");
    expect(html).toContain("当下提示");
  });

  it("selects daily sign and qimen records from fixed birth logic plus changing moment", () => {
    const { chart } = model();
    const first = selectDailyDrawRecord(chart, birth, new Date("2026-07-30T10:00:00+08:00"));
    const second = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"));
    const qimenMorning = selectDailyQimenRecord(chart, birth, new Date("2026-07-30T10:00:00+08:00"));
    const qimenNight = selectDailyQimenRecord(chart, birth, new Date("2026-07-30T22:00:00+08:00"));

    expect(first.element).toBe(deriveYiThemeElement(chart));
    expect(first.invariant).toContain(chart.pillars.year.branch);
    expect(first.dynamicKey).not.toBe(second.dynamicKey);
    expect(qimenMorning.invariant).toContain(chart.pillars.day.stem);
    expect(qimenMorning.dynamicKey).not.toBe(qimenNight.dynamicKey);
  });

  it("adds mobile CSS for clean standalone ritual pages", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toContain(".result-shell--standalone-ritual");
    expect(css).toContain(".ritual-standalone-page");
    expect(css).toContain(".realistic-oracle-tube");
    expect(css).toContain(".realistic-qimen-plate");
  });
});
