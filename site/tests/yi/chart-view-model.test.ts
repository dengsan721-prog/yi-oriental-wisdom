import { readFileSync } from "node:fs";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildProfessionalChartGrid,
  ChartSection,
} from "../../components/yi/ChartSection";
import { buildChartNarrative } from "../../lib/yi/chart-narrative";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type {
  AmbiguousProfessionalField,
  BirthInput,
  FourPillarsResult,
  InterpretationItem,
  PillarKey,
  ProfessionalReport,
} from "../../lib/yi/types";

const exactBirth: BirthInput = {
  name: "林知夏",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female",
  timeConfidence: "exact",
};

const alternateBirth: BirthInput = {
  name: "顾临川",
  date: "1992-11-03",
  time: "18:20",
  location: "北京市",
  gender: "male",
  timeConfidence: "exact",
};

const pillarKeys: PillarKey[] = ["year", "month", "day", "hour"];
const rowIds = [
  "stem",
  "branch",
  "stem-ten-god",
  "hidden-stems",
  "hidden-ten-gods",
  "na-yin",
  "twelve-growth",
] as const;

function renderChart(birth: BirthInput = exactBirth, mutate?: (
  chart: FourPillarsResult,
) => void) {
  const chart = calculateFourPillars(birth);
  mutate?.(chart);
  const report = buildProfessionalReport(chart, birth);
  const items = buildInterpretations(chart);
    const Component = ChartSection as unknown as ComponentType<{
    chart: FourPillarsResult;
    report: ProfessionalReport;
    items: readonly InterpretationItem[];
  }>;
  const html = renderToStaticMarkup(createElement(Component, {
    chart,
    report,
    items,
  }));
  return { chart, report, items, html };
}

function cell(
  grid: ReturnType<typeof buildProfessionalChartGrid>,
  rowId: typeof rowIds[number],
  key: PillarKey,
) {
  const row = grid.rows.find(item => item.id === rowId);
  const value = row?.cells.find(item => item.key === key);
  if (!value) throw new Error(`missing ${rowId}:${key}`);
  return value;
}

describe("four-pillar by seven-row professional grid", () => {
  it("keeps four fixed pillar columns and seven verified rows in order", () => {
    const { chart, report } = renderChart();
    const grid = buildProfessionalChartGrid(chart, report);

    expect(grid.columns.map(column => column.key)).toEqual(pillarKeys);
    expect(grid.columns.map(column => column.label)).toEqual([
      "年柱",
      "月柱",
      "日柱",
      "时柱",
    ]);
    expect(grid.rows.map(row => row.id)).toEqual(rowIds);
    expect(grid.rows.map(row => row.label)).toEqual([
      "天干",
      "地支",
      "主星／十神",
      "藏干",
      "藏干十神",
      "纳音",
      "十二长生",
    ]);
    for (const row of grid.rows) {
      expect(row.cells.map(item => item.key)).toEqual(pillarKeys);
    }

    for (const fact of report.pillarFacts) {
      expect(cell(grid, "stem", fact.key).lines).toEqual([fact.stem]);
      expect(cell(grid, "branch", fact.key).lines).toEqual([fact.branch]);
      expect(cell(grid, "stem-ten-god", fact.key).lines)
        .toEqual([fact.stemTenGod]);
      expect(cell(grid, "hidden-stems", fact.key).lines)
        .toEqual(fact.hiddenStems.map(item => item.stem));
      expect(cell(grid, "hidden-ten-gods", fact.key).lines)
        .toEqual(fact.hiddenStems.map(item => item.tenGod));
      const coordinates = report.pillarCoordinates[fact.key];
      expect(cell(grid, "na-yin", fact.key).lines)
        .toEqual([coordinates.naYin.status === "unavailable"
          ? "时辰未填写"
          : coordinates.naYin.value]);
      expect(cell(grid, "twelve-growth", fact.key).lines)
        .toEqual([coordinates.twelveGrowth.status === "unavailable"
          ? "时辰未填写"
          : coordinates.twelveGrowth.value]);
    }
  });

  it("keeps an unknown hour as an unavailable fourth column without synthesizing values", () => {
    const unknown = renderChart({
      ...exactBirth,
      time: null,
      timeConfidence: "unknown",
    });
    const grid = buildProfessionalChartGrid(unknown.chart, unknown.report);

    expect(grid.columns).toHaveLength(4);
    expect(grid.columns[3]).toMatchObject({
      key: "hour",
      label: "时柱",
      status: "unavailable",
      note: "时辰未填写",
    });
    for (const row of grid.rows) {
      expect(cell(grid, row.id, "hour")).toEqual({
        key: "hour",
        status: "unavailable",
        lines: ["时辰未填写"],
      });
    }
    expect(unknown.html).toContain("时辰未填写");
    expect(unknown.html).toContain('data-pillar-column="hour"');
    expect(unknown.html).not.toContain('data-pillar-value="hour-generated"');
  });

  it("marks every cell in an ambiguous target pillar as a visible candidate", () => {
    const boundary = renderChart({
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown",
      gender: "unspecified",
    });
    const grid = buildProfessionalChartGrid(boundary.chart, boundary.report);

    expect(boundary.chart.ambiguousPillars).toEqual(
      expect.arrayContaining(["year", "month", "hour"]),
    );
    for (const key of ["year", "month"] as const) {
      expect(grid.columns.find(column => column.key === key)?.status)
        .toBe("candidate");
      for (const row of grid.rows) {
        expect(cell(grid, row.id, key).status, `${row.id}:${key}`)
          .toBe("candidate");
      }
    }
    expect(boundary.html).toContain("待核");
  });

  it.each([
    "dayMaster",
    "dayPillar",
  ] satisfies readonly AmbiguousProfessionalField[])(
    "marks every ten-god cell and coordinate-dependent growth cell as candidate for %s ambiguity",
    (field) => {
      const result = renderChart(exactBirth, chart => {
        chart.professional.ambiguousFields = [field];
      });
      const grid = buildProfessionalChartGrid(result.chart, result.report);

      for (const key of pillarKeys) {
        expect(cell(grid, "stem-ten-god", key).status, key).toBe("candidate");
        expect(cell(grid, "hidden-ten-gods", key).status, key).toBe("candidate");
        expect(cell(grid, "twelve-growth", key).status, key).toBe("candidate");
      }
      for (const key of ["year", "month", "hour"] as const) {
        expect(cell(grid, "stem", key).status, key).toBe("stable");
        expect(cell(grid, "branch", key).status, key).toBe("stable");
        expect(cell(grid, "hidden-stems", key).status, key).toBe("stable");
        expect(cell(grid, "na-yin", key).status, key).toBe("stable");
      }
      expect(cell(grid, "na-yin", "day").status).toBe("candidate");
    },
  );

  it("enforces day-axis candidate safety even when the report snapshot predates the ambiguity", () => {
    const chart = calculateFourPillars(exactBirth);
    const report = buildProfessionalReport(chart, exactBirth);
    chart.professional.ambiguousFields = ["dayMaster"];
    const grid = buildProfessionalChartGrid(chart, report);
    const html = renderToStaticMarkup(createElement(ChartSection, {
      chart,
      report,
      items: buildInterpretations(chart),
    }));

    for (const key of pillarKeys) {
      expect(cell(grid, "twelve-growth", key).status, key).toBe("candidate");
    }
    expect(html).toContain(
      "日干参照待核，月令的十神与旺衰观察暂不作单一判断",
    );
    expect(html).not.toContain(
      `${report.monthCommand.branch}月令以${report.monthCommand.hiddenStem}为本气，相对日干呈${report.monthCommand.tenGod}`,
    );
  });

  it("fails closed before rendering when chart and report come from different fixtures", () => {
    const chart = calculateFourPillars(exactBirth);
    const alternateChart = calculateFourPillars(alternateBirth);
    const alternateReport = buildProfessionalReport(
      alternateChart,
      alternateBirth,
    );
    const renderMismatched = () => renderToStaticMarkup(createElement(
      ChartSection,
      {
        chart,
        report: alternateReport,
        items: buildInterpretations(chart),
      },
    ));

    expect(() => buildProfessionalChartGrid(chart, alternateReport))
      .toThrowError("命盘与专业报告不一致：四柱坐标不匹配");
    expect(renderMismatched)
      .toThrowError("命盘与专业报告不一致：四柱坐标不匹配");
  });
});

describe("expanded professional chart reading", () => {
  it("renders the table, five professional sections, translations and all detailed story fields", () => {
    const { chart, report, items, html } = renderChart();
    const narrative = buildChartNarrative(chart, report, items);

    expect(html).toContain('data-testid="professional-pillar-table"');
    expect(html).not.toContain("姓名五行参考分");
    expect(html).toContain('class="professional-reading-sections waterfall-grid"');
    expect(html.match(/<details class="professional-reading-section waterfall-card/g)).toHaveLength(5);
    expect(html.match(/class="scene-line-art scene-line-art--chart"/g)).toHaveLength(5);
    expect(html.match(/class="scene-line-art scene-line-art--story"/g)).toHaveLength(4);
    expect(html.match(/class="scene-line-art scene-line-art--scene"/g)).toHaveLength(6);
    expect(html).toContain("点开阅读");
    expect(html).toContain("收起回到总览");
    expect(html.match(/data-chart-row=/g)).toHaveLength(7);
    expect(html.match(/data-pillar-column=/g)).toHaveLength(4);
    for (const heading of [
      "命局总论",
      "月令与旺衰观察",
      "五行气势与显隐",
      "天干地支关系",
      "五行缺失说明",
      "详细通俗解读",
      "事业场景",
      "关系场景",
      "生活节奏",
    ]) {
      expect(html).toContain(heading);
    }
    for (const professionalCopy of html.match(/<p class="professional-reading-copy">(.+?)<\/p>/gu) ?? []) {
      expect(professionalCopy).toMatch(/日干|日主|月令|十神|藏干|纳音|十二长生|天干|地支|合|冲|刑|害|破/u);
      expect(professionalCopy.length).toBeGreaterThanOrEqual(90);
    }
    for (const translation of narrative.professionalTranslations) {
      expect(html).toContain(translation.whatItMeans);
      expect(html).toContain(translation.lifeScene);
      expect(html).toContain(translation.practicalGuidance);
    }
    for (const beat of [
      narrative.self,
      narrative.career,
      narrative.relationship,
      narrative.rhythm,
    ]) {
      for (const field of [
        beat.situation,
        beat.opportunity,
        beat.firstStrength,
        beat.overuseCost,
        beat.lowPoint,
        beat.newChoice,
        beat.turn,
        beat.observableSignal,
      ]) expect(html).toContain(field);
    }
    for (const story of [
      ...narrative.careerAdvice,
      ...narrative.relationshipAdvice,
      ...narrative.rhythmAdvice,
    ]) {
      for (const field of [
        story.title,
        story.trigger,
        story.firstReaction,
        story.apparentBenefit,
        story.cost,
        story.turnAction,
        story.example,
        story.observableSignal,
      ]) expect(html).toContain(field);
    }
    for (const id of narrative.coveredDetailActionIds) {
      expect(html).not.toContain(id);
    }
  });

  it("keeps name analysis out of the professional chart route", () => {
    const named = renderChart();

    expect(named.html).not.toContain("data-name-analysis");
    expect(named.html).not.toContain("姓名五行参考分");
  });

  it("does not render unsupported conclusions, calculation panels or a concrete relation when its summary is ambiguous", () => {
    const relation = renderChart(exactBirth, chart => {
      chart.professional.ambiguousFields = ["relationSummary"];
    });
    const source = readFileSync(
      new URL("../../components/yi/ChartSection.tsx", import.meta.url),
      "utf8",
    );

    expect(relation.html).toContain("关系资料待核");
    for (const item of relation.report.relations) {
      expect(relation.html).not.toContain(item.label);
    }
    expect(source).not.toMatch(
      /ChapterSources|confidence-badge|ambiguity-note|professional-depth|time-basis|buildChartRows/u,
    );
    expect(relation.html).not.toMatch(
      /观察置信度|查看专业命盘骨架与依据|查看时间口径与真太阳时状态|计算边界|格局|喜用神|神煞|空亡|调候/u,
    );
  });

  it("uses a fixed no-horizontal-scroll table at 390px", () => {
    const css = readFileSync(
      new URL("../../app/globals.css", import.meta.url),
      "utf8",
    );

    expect(css).toMatch(
      /\.professional-pillar-table\{[^}]*width:100%[^}]*table-layout:fixed/u,
    );
    expect(css).toMatch(
      /\.professional-pillar-table-wrap\{[^}]*min-width:0[^}]*overflow:hidden/u,
    );
    expect(css).toMatch(
      /@media\(max-width:520px\)\{[^}]*\.professional-pillar-table/u,
    );
    expect(css).not.toMatch(
      /\.professional-pillar-table-wrap\{[^}]*overflow-x:auto/u,
    );
  });
});
