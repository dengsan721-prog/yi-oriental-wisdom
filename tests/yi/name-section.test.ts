import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CurrentNameContent,
  NameCoverageCard,
  NameSection,
  formatNameCoverageScore,
  getCurrentNameLoadStatus,
  nameSectionLoadReducer,
} from "../../components/yi/NameSection";
import {
  createNameAnalysisViewState,
  loadNameAnalysisForView,
  nameAnalysisViewReducer,
} from "../../components/yi/NameAnalysisSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  getReviewedNameElementRecommendations,
} from "../../lib/yi/name-element-data";
import {
  calculateNameElementCoverage,
  NAME_COVERAGE_SCOPE_NOTICE,
  toNameElementCoverageCharacters,
  type NameElementCoverage,
  type NameElementCoverageCount,
  type NameElementCoverageScore,
} from "../../lib/yi/name-element-coverage";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { BirthInput, ElementName } from "../../lib/yi/types";

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const SCORES = [0, 20, 40, 60, 80, 100] as const;
const FORBIDDEN_COPY = [
  "现实使用实测分",
  "本章来源",
  "专业依据",
  "使用边界",
  "高分姓名",
  "满分好名",
  "吉名",
  "改运",
  "必须改名",
  "四柱",
  "天干",
  "地支",
  "藏干",
  "旺衰",
  "喜用神",
] as const;

const birth: BirthInput = {
  name: "宋江",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
};
const chart = calculateFourPillars(birth);
const professionalReport = buildProfessionalReport(chart, birth);

function completeCoverage(
  coveredCount: NameElementCoverageCount,
): NameElementCoverage {
  const coveredElements: readonly ElementName[] =
    ELEMENTS.slice(0, coveredCount);
  const score: NameElementCoverageScore = SCORES[coveredCount];
  return {
    status: "complete",
    visibleChartElements: coveredElements,
    nameElements: [],
    coveredElements,
    missingElements: ELEMENTS.slice(coveredCount),
    coveredCount,
    score,
    chartAlreadyComplete: coveredCount === 5,
    notice: coveredCount === 5
      ? "当前命盘显示的五行已经齐备，候选名字不会提高覆盖项；只看五行覆盖，不是姓名好坏"
      : "只看五行覆盖，不是姓名好坏",
    scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
  };
}

const pendingCoverage: NameElementCoverage = {
  status: "pending",
  reasons: ["reading-unconfirmed"],
  pendingGlyphs: ["解"],
  notice: "资料待确认，暂不评分",
  scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
};

describe("name coverage score presentation", () => {
  it.each([
    [0, 0],
    [1, 20],
    [2, 40],
    [3, 60],
    [4, 80],
    [5, 100],
  ] as const)("renders %s/5 as %s/100", (count, score) => {
    expect(formatNameCoverageScore(count)).toEqual({
      primary: `覆盖 ${count}/5 项`,
      secondary: `${score}/100`,
    });

    const html = renderToStaticMarkup(createElement(NameCoverageCard, {
      label: "当前姓名",
      name: "林知夏",
      coverage: completeCoverage(count),
      recommendationsByElement: {},
    }));
    expect(html).toContain(`覆盖 ${count}/5 项`);
    expect(html).toContain(`${score}/100`);
    expect(html).not.toMatch(/四柱|天干|地支|藏干|旺衰|喜用神/);
  });

  it("renders pending without a score or covered count", () => {
    const html = renderToStaticMarkup(createElement(NameCoverageCard, {
      label: "当前姓名",
      name: "解珍",
      coverage: pendingCoverage,
      recommendationsByElement: {},
    }));

    expect(html).toContain("资料待确认，暂不评分");
    expect(html).not.toContain("/100");
    expect(html).not.toMatch(/覆盖 \d\/5 项/);
  });

  it("shows at most six approved recommendations with glyph, reading, and meaning", () => {
    const recommendations = getReviewedNameElementRecommendations("金");
    const missingMetalBase = completeCoverage(4);
    if (missingMetalBase.status !== "complete") {
      throw new Error("Complete coverage fixture is required");
    }
    const missingMetalCoverage: NameElementCoverage = {
      ...missingMetalBase,
      visibleChartElements: ["木", "火", "土", "水"],
      coveredElements: ["木", "火", "土", "水"],
      missingElements: ["金"],
    };
    const html = renderToStaticMarkup(createElement(NameCoverageCard, {
      label: "当前姓名",
      name: "林知夏",
      coverage: missingMetalCoverage,
      recommendationsByElement: { 金: recommendations },
    }));

    expect(html).toContain("还差：金");
    const shown = recommendations.slice(0, 6);
    for (const record of shown) {
      expect(html).toContain(record.glyph);
      expect(html).toContain(record.displayPinyin);
      expect(html).toContain(record.adoptedMeaning);
    }
    if (recommendations[6]) {
      expect(html).not.toContain(recommendations[6].id);
    }
  });

  it("states that a chart already covering all five cannot be improved by a candidate", () => {
    const html = renderToStaticMarkup(createElement(NameCoverageCard, {
      label: "当前姓名",
      name: "宋江",
      coverage: completeCoverage(5),
      recommendationsByElement: {},
    }));

    expect(html).toContain("当前命盘显示的五行已经齐备，候选名字不会提高覆盖项");
  });
});

describe("standalone current-name section", () => {
  it("server-renders only the initial loading shell without pretending effects ran", () => {
    const html = renderToStaticMarkup(createElement(NameSection, {
      name: birth.name,
      chart,
      professionalReport,
    }));

    expect(html).toContain("姓名五行齐备度");
    expect(html).toContain("只看五行覆盖，不是姓名好坏");
    expect(html).toContain(NAME_COVERAGE_SCOPE_NOTICE);
    for (const forbidden of FORBIDDEN_COPY) expect(html).not.toContain(forbidden);
    expect(html).toContain('aria-label="候选姓名入口"');
  });

  it("renders a labelled current-name input when the name is empty", () => {
    const emptyBirth = { ...birth, name: "" };
    const emptyChart = calculateFourPillars(emptyBirth);
    const emptyReport = buildProfessionalReport(emptyChart, emptyBirth);
    const html = renderToStaticMarkup(createElement(NameSection, {
      name: "",
      chart: emptyChart,
      professionalReport: emptyReport,
    }));

    expect(html).toContain('aria-label="输入现用姓名"');
  });

  it("renders a real current-name analysis through the standalone coverage card", async () => {
    const analysis = await loadNameAnalysisForView("宋江", {
      mode: "current",
      chart,
      professionalReport,
    });
    if (!analysis) throw new Error("宋江 analysis fixture is required");
    expect(analysis.surname).toEqual({ value: "宋", kind: "single" });
    const coverage = calculateNameElementCoverage({
      chart,
      characters: toNameElementCoverageCharacters(analysis.characters),
    });
    const html = renderToStaticMarkup(createElement(NameCoverageCard, {
      label: "当前姓名",
      name: analysis.rawInput,
      coverage,
      recommendationsByElement: {},
    }));

    expect(html).toContain("当前姓名");
    expect(html).toContain("宋江");
    expect(html).toMatch(/覆盖 [0-5]\/5 项/);
    for (const forbidden of FORBIDDEN_COPY) expect(html).not.toContain(forbidden);
  });

  it("renders real loaded confirmation controls and current coverage together", async () => {
    const analysis = await loadNameAnalysisForView("宋江", {
      mode: "current",
      chart,
      professionalReport,
    });
    if (!analysis) throw new Error("宋江 analysis fixture is required");
    const state = createNameAnalysisViewState("宋江");
    const html = renderToStaticMarkup(createElement(CurrentNameContent, {
      analysis,
      chart,
      state,
      onModeChange: () => undefined,
      onReadingSelection: () => undefined,
      onTraditionalSelection: () => undefined,
    }));

    expect(html).toContain('aria-label="姓名字形与读音确认"');
    expect(html).toContain("现用字形");
    expect(html).toContain("传统字形参考");
    expect(html).toContain("当前姓名");
    expect(html).toContain("宋江");
    expect(html).toMatch(/覆盖 [0-5]\/5 项/);
    for (const forbidden of FORBIDDEN_COPY) expect(html).not.toContain(forbidden);
  });

  it("rejects a late old request and exposes loading, error, and ready only for the current key", async () => {
    const analysis = await loadNameAnalysisForView("宋江", {
      mode: "current",
      chart,
      professionalReport,
    });
    if (!analysis) throw new Error("宋江 analysis fixture is required");

    let loadState = nameSectionLoadReducer(null, {
      type: "start",
      requestKey: "K1",
    });
    loadState = nameSectionLoadReducer(loadState, {
      type: "start",
      requestKey: "K2",
    });
    loadState = nameSectionLoadReducer(loadState, {
      type: "resolve",
      requestKey: "K1",
      analysis,
      error: false,
    });
    expect(loadState).toMatchObject({ requestKey: "K2", status: "loading" });
    expect(getCurrentNameLoadStatus(loadState, "K2")).toBe("loading");
    expect(getCurrentNameLoadStatus(loadState, "K1")).toBe("loading");

    loadState = nameSectionLoadReducer(loadState, {
      type: "resolve",
      requestKey: "K2",
      analysis,
      error: false,
    });
    expect(loadState).toMatchObject({
      requestKey: "K2",
      status: "ready",
      analysis,
    });
    expect(getCurrentNameLoadStatus(loadState, "K2")).toBe("ready");

    const errorState = nameSectionLoadReducer(loadState, {
      type: "start",
      requestKey: "K3",
    });
    const resolvedError = nameSectionLoadReducer(errorState, {
      type: "resolve",
      requestKey: "K3",
      analysis: null,
      error: true,
    });
    expect(getCurrentNameLoadStatus(resolvedError, "K3")).toBe("error");
    expect(getCurrentNameLoadStatus(resolvedError, "K2")).toBe("loading");
  });

  it("keeps the existing traditional-glyph and reading reducer mechanics intact", () => {
    let state = createNameAnalysisViewState("发");
    state = nameAnalysisViewReducer(state, {
      type: "set-mode",
      mode: "traditional-reference",
    });
    state = nameAnalysisViewReducer(state, {
      type: "select-traditional",
      characterIndex: 0,
      glyph: "髮",
    });
    state = nameAnalysisViewReducer(state, {
      type: "select-reading",
      characterIndex: 0,
      reading: "fà",
    });

    expect(state.traditionalSelections).toEqual({ 0: "髮" });
    expect(state.actualReadings).toEqual({ 0: "fà" });
  });

  it("keeps the 390px layout boundary explicit in the standalone styles", () => {
    const css = readFileSync(
      new URL("../../app/globals.css", import.meta.url),
      "utf8",
    );

    expect(css).toContain(".yi-name-section");
    expect(css).toMatch(/\.yi-name-section[\s\S]*min-width:\s*0/);
    expect(css).toMatch(/\.yi-name-section[\s\S]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.yi-name-section[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/@media\s*\(max-width:\s*390px\)/);
  });
});
