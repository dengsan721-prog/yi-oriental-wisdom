import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CurrentNameContent,
  NameCandidateComparison,
  NameConfirmationControls,
  NameCoverageCard,
  NameSection,
  buildCandidateAnalysisRequest,
  composeCandidateFullName,
  createNameSectionOwnerKey,
  createLatestNameRequestGuard,
  formatNameCoverageScore,
  getCurrentNameLoadStatus,
  nameSectionLoadReducer,
  runLatestNameRequest,
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

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

describe("candidate full-name composition", () => {
  it("keeps a reviewed single surname fixed and trims only surrounding whitespace", () => {
    expect(composeCandidateFullName({
      currentSurname: { value: "林", kind: "single" },
      candidateInput: " 清 禾 ",
    })).toEqual({
      status: "ready",
      fullName: "林清 禾",
      inputKind: "given-name",
      fixedSurname: "林",
    });
  });

  it("keeps a reviewed compound surname fixed without converting glyphs", () => {
    expect(composeCandidateFullName({
      currentSurname: { value: "歐陽", kind: "compound" },
      candidateInput: "髮",
    })).toEqual({
      status: "ready",
      fullName: "歐陽髮",
      inputKind: "given-name",
      fixedSurname: "歐陽",
    });
  });

  it.each([
    [{ value: "", kind: "unknown" } as const],
    [null],
  ])("treats the input as a complete name when the surname is unknown", currentSurname => {
    expect(composeCandidateFullName({
      currentSurname,
      candidateInput: " 顾清禾 ",
    })).toEqual({
      status: "ready",
      fullName: "顾清禾",
      inputKind: "full-name",
      fixedSurname: null,
    });
  });

  it.each(["", "   "])("rejects empty candidate input %j", candidateInput => {
    expect(composeCandidateFullName({
      currentSurname: { value: "林", kind: "single" },
      candidateInput,
    })).toEqual({
      status: "invalid",
      reason: "empty-input",
    });
  });
});

describe("latest candidate request", () => {
  it("applies only the latest candidate result", async () => {
    const guard = createLatestNameRequestGuard();
    const first = deferred<string>();
    const second = deferred<string>();
    const applied: string[] = [];

    const firstRun = runLatestNameRequest({
      guard,
      load: () => first.promise,
      apply: value => applied.push(value),
    });
    const secondRun = runLatestNameRequest({
      guard,
      load: () => second.promise,
      apply: value => applied.push(value),
    });

    second.resolve("K2-new-blockers");
    first.resolve("K1-old-blockers");

    await expect(secondRun).resolves.toBe("applied");
    await expect(firstRun).resolves.toBe("stale");
    expect(applied).toEqual(["K2-new-blockers"]);
  });

  it("invalidates an in-flight request before another load starts", async () => {
    const guard = createLatestNameRequestGuard();
    const first = deferred<string>();
    const applied: string[] = [];
    const firstRun = runLatestNameRequest({
      guard,
      load: () => first.promise,
      apply: value => applied.push(value),
    });

    guard.invalidate();
    first.resolve("stale");

    await expect(firstRun).resolves.toBe("stale");
    expect(applied).toEqual([]);
  });
});

describe("candidate analysis request", () => {
  it("projects only candidate confirmations and exact chart/report references", () => {
    let candidateState = createNameAnalysisViewState("林清禾");
    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "set-mode",
      mode: "traditional-reference",
    });
    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "select-traditional",
      characterIndex: 1,
      glyph: "清",
    });
    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "select-reading",
      characterIndex: 1,
      reading: "qīng",
    });
    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "answer-reality",
      dimension: "hearing",
      answer: "both",
    });

    const request = buildCandidateAnalysisRequest({
      viewState: candidateState,
      chart,
      professionalReport,
    });

    expect(request).toEqual({
      mode: "traditional-reference",
      traditionalSelections: candidateState.traditionalSelections,
      actualReadings: candidateState.actualReadings,
      requestFreshDirection: true,
      chart,
      professionalReport,
    });
    expect(request.chart).toBe(chart);
    expect(request.professionalReport).toBe(professionalReport);
    expect(request).not.toHaveProperty("realityTest");
    expect(request).not.toHaveProperty("usageRisks");
  });

  it("keeps default candidate mode and carries fresh direction explicitly", () => {
    const viewState = createNameAnalysisViewState("林清禾");

    expect(buildCandidateAnalysisRequest({
      viewState,
      chart,
      professionalReport,
    })).toMatchObject({
      mode: "candidate",
      requestFreshDirection: true,
    });
  });

  it("preserves a real traditional candidate glyph and reading through the loader", async () => {
    let viewState = createNameAnalysisViewState("发");
    viewState = nameAnalysisViewReducer(viewState, {
      type: "set-mode",
      mode: "traditional-reference",
    });
    viewState = nameAnalysisViewReducer(viewState, {
      type: "select-traditional",
      characterIndex: 0,
      glyph: "髮",
    });
    viewState = nameAnalysisViewReducer(viewState, {
      type: "select-reading",
      characterIndex: 0,
      reading: "fà",
    });
    const request = buildCandidateAnalysisRequest({
      viewState,
      chart,
      professionalReport,
    });
    const analysis = await loadNameAnalysisForView("发", request);
    if (!analysis) throw new Error("Traditional candidate fixture is required");

    expect(analysis.characters[0]).toMatchObject({
      adoptedGlyph: "髮",
      adoptedReading: "fà",
    });
    const coverage = calculateNameElementCoverage({
      chart,
      characters: toNameElementCoverageCharacters(analysis.characters),
    });
    if (coverage.status === "pending") {
      expect(coverage.reasons).not.toContain("glyph-unconfirmed");
      expect(coverage.reasons).not.toContain("reading-unconfirmed");
    }
  });

  it("resets only candidate confirmations when the candidate full name changes", () => {
    let currentState = createNameAnalysisViewState("林知夏");
    currentState = nameAnalysisViewReducer(currentState, {
      type: "select-reading",
      characterIndex: 1,
      reading: "zhī",
    });
    let candidateState = createNameAnalysisViewState("林清禾");
    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "select-traditional",
      characterIndex: 1,
      glyph: "清",
    });
    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "select-reading",
      characterIndex: 1,
      reading: "qīng",
    });
    const currentSnapshot = structuredClone(currentState);

    candidateState = nameAnalysisViewReducer(candidateState, {
      type: "reset-name",
      name: "林明川",
    });

    expect(candidateState).toMatchObject({
      name: "林明川",
      traditionalSelections: {},
      actualReadings: {},
    });
    expect(currentState).toEqual(currentSnapshot);
  });
});

describe("candidate owner isolation", () => {
  it("uses stable content and changes for any name, chart, or report owner change", () => {
    const base = createNameSectionOwnerKey({
      name: birth.name,
      chart,
      professionalReport,
    });
    expect(createNameSectionOwnerKey({
      name: birth.name,
      chart: structuredClone(chart),
      professionalReport: structuredClone(professionalReport),
    })).toBe(base);
    expect(createNameSectionOwnerKey({
      name: `${birth.name}新`,
      chart,
      professionalReport,
    })).not.toBe(base);
    expect(createNameSectionOwnerKey({
      name: birth.name,
      chart: {
        ...chart,
        pillars: {
          ...chart.pillars,
          year: {
            ...chart.pillars.year,
            element: chart.pillars.year.element === "木" ? "火" : "木",
          },
        },
      },
      professionalReport,
    })).not.toBe(base);
    expect(createNameSectionOwnerKey({
      name: birth.name,
      chart,
      professionalReport: {
        ...professionalReport,
        summary: `${professionalReport.summary}变更`,
      },
    })).not.toBe(base);
  });
});

describe("confirmation group isolation", () => {
  it("renders distinct current and candidate radio groups in the same markup", async () => {
    const analysis = await loadNameAnalysisForView("发", {
      mode: "current",
      chart,
      professionalReport,
    });
    if (!analysis) throw new Error("发 confirmation fixture is required");
    let state = createNameAnalysisViewState("发");
    state = nameAnalysisViewReducer(state, {
      type: "set-mode",
      mode: "traditional-reference",
    });
    const controls = {
      analysis,
      state,
      onModeChange: () => undefined,
      onReadingSelection: () => undefined,
      onTraditionalSelection: () => undefined,
    };
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(NameConfirmationControls, {
        ...controls,
        groupPrefix: "current",
      }),
      createElement(NameConfirmationControls, {
        ...controls,
        groupPrefix: "candidate",
      }),
    ));
    const names = [...html.matchAll(/name="([^"]+)"/g)]
      .map(match => match[1]);

    expect(names).toContain("current-traditional-0");
    expect(names).toContain("candidate-traditional-0");
    expect(names).toContain("current-reading-0");
    expect(names).toContain("candidate-reading-0");
    const currentGroups = new Set(
      names.filter(name => name.startsWith("current-")),
    );
    const candidateGroups = new Set(
      names.filter(name => name.startsWith("candidate-")),
    );
    expect(currentGroups.size).toBe(2);
    expect(candidateGroups.size).toBe(2);
    expect([...currentGroups].some(group => candidateGroups.has(group)))
      .toBe(false);
  });
});

describe("candidate comparison", () => {
  const currentCoverage: NameElementCoverage = {
    status: "complete",
    visibleChartElements: ["木", "火", "土"],
    nameElements: ["水"],
    coveredElements: ["木", "火", "土", "水"],
    missingElements: ["金"],
    coveredCount: 4,
    score: 80,
    chartAlreadyComplete: false,
    notice: "只看五行覆盖，不是姓名好坏",
    scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
  };
  const candidateCoverage: NameElementCoverage = {
    status: "complete",
    visibleChartElements: ["木", "火", "土"],
    nameElements: ["金", "水"],
    coveredElements: ["木", "火", "土", "金", "水"],
    missingElements: [],
    coveredCount: 5,
    score: 100,
    chartAlreadyComplete: false,
    notice: "只看五行覆盖，不是姓名好坏",
    scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
  };

  it("labels current and candidate names without declaring a winner", () => {
    const html = renderToStaticMarkup(createElement(NameCandidateComparison, {
      current: {
        label: "当前姓名",
        name: "林知夏",
        coverage: currentCoverage,
        recommendationsByElement: {
          金: getReviewedNameElementRecommendations("金"),
        },
      },
      candidate: {
        label: "候选姓名",
        name: "林清禾",
        coverage: candidateCoverage,
        recommendationsByElement: {},
      },
      fixedSurname: "林",
    }));

    expect(html).toContain("保留姓氏：林");
    expect(html).toContain('aria-label="候选名（不含姓氏）"');
    expect(html).toContain("候选姓名：林清禾");
    expect(html).toContain("当前姓名：林知夏");
    expect(html).toContain("覆盖 4/5 项");
    expect(html).toContain("80/100");
    expect(html).toContain("还差：金");
    expect(html).toContain("覆盖 5/5 项");
    expect(html).toContain("100/100");
    expect(html).not.toMatch(
      /现实使用实测分|专业来源|本章依据|专业依据|使用边界|更好|胜出|吉名|改运/,
    );
  });

  it.each([null, ""])("asks for a complete candidate name without a reviewed surname", fixedSurname => {
    const html = renderToStaticMarkup(createElement(NameCandidateComparison, {
      current: {
        label: "当前姓名",
        name: "",
        coverage: currentCoverage,
        recommendationsByElement: {},
      },
      candidate: null,
      fixedSurname,
    }));

    expect(html).toContain('aria-label="候选完整姓名"');
    expect(html).not.toContain("保留姓氏：");
  });

  it("suppresses a stale candidate card while the next candidate is loading", () => {
    const html = renderToStaticMarkup(createElement(NameCandidateComparison, {
      current: {
        label: "当前姓名",
        name: "林知夏",
        coverage: currentCoverage,
        recommendationsByElement: {},
      },
      candidate: {
        label: "候选姓名",
        name: "林旧名",
        coverage: pendingCoverage,
        recommendationsByElement: {},
      },
      fixedSurname: "林",
      candidateFullName: "林新名",
      candidateStatus: "loading",
    }));

    expect(html).toContain("正在更新候选姓名：林新名");
    expect(html).not.toContain("林旧名");
  });

  it("renders a real unresolved candidate as pending without a candidate score", async () => {
    const analysis = await loadNameAnalysisForView("解珍", {
      mode: "candidate",
      chart,
      professionalReport,
    });
    if (!analysis) throw new Error("解珍 candidate fixture is required");
    const coverage = calculateNameElementCoverage({
      chart,
      characters: toNameElementCoverageCharacters(analysis.characters),
    });
    const html = renderToStaticMarkup(createElement(NameCandidateComparison, {
      current: {
        label: "当前姓名",
        name: "宋江",
        coverage: pendingCoverage,
        recommendationsByElement: {},
      },
      candidate: {
        label: "候选姓名",
        name: "解珍",
        coverage,
        recommendationsByElement: {},
      },
      fixedSurname: null,
      candidateStatus: "ready",
    }));
    const candidateHtml = html.match(
      /<section data-name-role="candidate">([\s\S]*?)<\/section>/,
    )?.[1] ?? "";

    expect(coverage.status).toBe("pending");
    expect(candidateHtml).toContain("资料待确认，暂不评分");
    expect(candidateHtml).not.toContain("/100");
  });
});

describe("candidate production wiring and persistence boundary", () => {
  it("uses the candidate helpers and invalidates before composing a new request", () => {
    const source = readFileSync(
      new URL("../../components/yi/NameSection.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("useRef(createLatestNameRequestGuard())");
    expect(source).toContain("buildCandidateAnalysisRequest({");
    expect(source).toContain("runLatestNameRequest({");
    expect(source).toContain("<NameCandidateComparison");
    expect(source.indexOf("candidateGuard.current.invalidate()")).toBeLessThan(
      source.indexOf("composeCandidateFullName({"),
    );
    expect(source).toContain("createNameSectionOwnerKey({");
    expect(source).toContain("candidateLoad.ownerKey === ownerKey");
    expect(source).toContain("const guard = candidateGuard.current");
    expect(source).toMatch(
      /useEffect\(\(\) => \{[\s\S]*guard\.invalidate\(\)[\s\S]*setCandidateInput\(""\)/,
    );
    expect(source).toContain('groupPrefix="current"');
    expect(source).toContain('groupPrefix="candidate"');
  });

  it("does not write candidate state outside the component session", () => {
    const source = readFileSync(
      new URL("../../components/yi/NameSection.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(
      /localStorage|sessionStorage|yi-life-profile-v1|URLSearchParams/,
    );
  });
});
