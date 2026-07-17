import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildChartRows, ChartSection } from "../../components/yi/ChartSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { BirthInput, FourPillarsResult, ProfessionalReport } from "../../lib/yi/types";

const exactBirth = {
  name: "林",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female" as const,
  timeConfidence: "exact" as const,
};

function renderChart(birth: BirthInput) {
  const chart = calculateFourPillars(birth);
  const report = buildProfessionalReport(chart, birth);
  const Component = ChartSection as unknown as ComponentType<{
    chart: FourPillarsResult;
    report: ProfessionalReport;
  }>;
  const html = renderToStaticMarkup(createElement(Component, { chart, report }));
  return { chart, report, html };
}

it("exposes all paid-report chart rows", () => {
  const report = buildProfessionalReport(calculateFourPillars(exactBirth), exactBirth);

  expect(buildChartRows(report).map((row) => row.label)).toEqual([
    "日主",
    "月令",
    "透干",
    "根气",
    "十神结构",
    "干支关系",
    "调候",
    "五行提醒",
  ]);
});

describe("complete professional chart rendering", () => {
  it("renders the factual band, paid summary, complete pillars and diagnostic skeleton", () => {
    const { report, html } = renderChart(exactBirth);

    for (const label of ["公历", "农历", "出生地址", "生肖", "星座", "时辰可信度"]) {
      expect(html).toContain(label);
    }
    for (const value of [
      report.birthFacts.solar,
      report.birthFacts.lunar,
      report.birthFacts.location,
      report.birthFacts.zodiac,
      report.birthFacts.starSign,
      report.birthFacts.timeConfidence,
      report.birthFacts.timezone,
      report.birthFacts.trueSolarTime,
      report.summary,
      ...report.keyJudgments,
      ...report.actions,
    ]) {
      expect(html).toContain(value);
    }

    expect(report.actions).toHaveLength(3);
    expect(html.match(/class="report-action"/g)).toHaveLength(3);
    for (const pillar of report.pillarFacts) {
      expect(html).toContain(`data-pillar="${pillar.key}"`);
      for (const value of [pillar.label, pillar.stem, pillar.branch, pillar.stemElement, pillar.branchElement, pillar.stemTenGod]) {
        expect(html).toContain(value);
      }
      for (const hidden of pillar.hiddenStems) {
        expect(html).toContain(`${hidden.stem} · ${hidden.tenGod}`);
      }
    }

    for (const relation of report.relations) {
      expect(html).toContain(relation.label);
      expect(html).toContain(relation.pillars.map((pillar) => ({ year: "年柱", month: "月柱", day: "日柱", hour: "时柱" })[pillar]).join(" · "));
    }
    for (const diagnostic of report.elementDiagnostics) {
      expect(html).toContain(`${diagnostic.element}${diagnostic.count}`);
      expect(html).toContain(diagnostic.conclusion);
    }

    expect(html).toContain("月令");
    expect(html).toContain("透干");
    expect(html).toContain("藏干");
    expect(html).toContain("根气");
    expect(html).toContain("干支关系");
    expect(html).not.toMatch(/缺什么补什么|喜用神为/);
  });

  it("renders three explicitly bounded pillars when the birth hour is unknown", () => {
    const { report, html } = renderChart({
      ...exactBirth,
      time: null,
      timeConfidence: "unknown",
    });

    expect(report.pillarFacts).toHaveLength(3);
    expect(html.match(/data-pillar=/g)).toHaveLength(3);
    expect(html).not.toContain('data-pillar="hour"');
    expect(html).toContain('aria-label="三柱命盘，时柱未生成"');
  });

  it("marks boundary pillars and the representative month coordinate as check candidates", () => {
    const { report, html } = renderChart({
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown",
      location: "",
    });

    expect(report.monthCommand.ambiguous).toBe(true);
    expect(html).toContain('aria-label="年柱待核代表坐标"');
    expect(html).toContain('aria-label="月柱待核代表坐标"');
    expect(html).toContain("代表坐标");
    expect(html).toContain("仅供核对");
    expect(html).toContain("待核");
  });
});
