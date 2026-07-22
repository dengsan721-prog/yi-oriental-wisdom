import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  createNameAnalysisViewState,
  loadNameAnalysisForView,
  nameAnalysisViewReducer,
  NameAnalysisView,
} from "../../components/yi/NameAnalysisSection";
import { analyzeName } from "../../lib/yi/name-analysis";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildProfessionalReport } from "../../lib/yi/report-model";

const exactBirth = {
  name: "林知远",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female" as const,
  timeConfidence: "exact" as const,
};

const allVerified = {
  hearing: "both" as const,
  inputDisplay: "both" as const,
  documents: "both" as const,
  meaningAcceptance: "accepted" as const,
};

const noop = () => {};

function renderView(
  analysis: NonNullable<Awaited<ReturnType<typeof analyzeName>>>,
  state = createNameAnalysisViewState(analysis.rawInput),
) {
  return renderToStaticMarkup(createElement(NameAnalysisView, {
    analysis,
    state,
    onModeChange: noop,
    onTraditionalSelection: noop,
    onReadingSelection: noop,
    onRealityAnswer: noop,
    onToggleDirections: noop,
    onConfirmSameNameExit: noop,
  }));
}

describe("name analysis loading boundary", () => {
  it("does not import the name engine for a blank or whitespace-only name", async () => {
    const loadEngine = vi.fn();

    await expect(loadNameAnalysisForView(" \n\t ", {}, loadEngine)).resolves.toBeNull();
    expect(loadEngine).not.toHaveBeenCalled();
  });

  it("keeps the engine behind one guarded dynamic import and no runtime static import", () => {
    const source = readFileSync(new URL("../../components/yi/NameAnalysisSection.tsx", import.meta.url), "utf8");
    const runtimeStaticImports = [...source.matchAll(/import\s+(?!type\b)[^;]+?from\s+["']([^"']*name-analysis)["']/g)];
    const dynamicImports = [...source.matchAll(/import\(["']([^"']*name-analysis)["']\)/g)];

    expect(runtimeStaticImports).toEqual([]);
    expect(dynamicImports).toHaveLength(1);
    expect(source).toContain("if (!name.trim()) return null");
  });
});

describe("name analysis state", () => {
  it("starts traditional candidates unselected and clears every local choice when the name changes", () => {
    let state = createNameAnalysisViewState("发");
    state = nameAnalysisViewReducer(state, { type: "set-mode", mode: "traditional-reference" });
    state = nameAnalysisViewReducer(state, { type: "select-traditional", characterIndex: 0, glyph: "髮" });
    state = nameAnalysisViewReducer(state, { type: "select-reading", characterIndex: 0, reading: "fà" });
    state = nameAnalysisViewReducer(state, { type: "answer-reality", dimension: "hearing", answer: "both" });
    state = nameAnalysisViewReducer(state, { type: "toggle-directions" });
    state = nameAnalysisViewReducer(state, { type: "confirm-same-name-exit" });

    expect(state.traditionalSelections).toEqual({ 0: "髮" });
    state = nameAnalysisViewReducer(state, { type: "reset-name", name: "林知远" });

    expect(state).toEqual(createNameAnalysisViewState("林知远"));
    expect(state.traditionalSelections).toEqual({});
    expect(state.actualReadings).toEqual({});
    expect(Object.values(state.realityTest)).toEqual(["unverified", "unverified", "unverified", "unverified"]);
  });
});

describe("name analysis reading view", () => {
  it("keeps the first layer concise and separates verified use score from evidence coverage", async () => {
    const chart = calculateFourPillars(exactBirth);
    const analysis = await analyzeName({ rawInput: exactBirth.name, chart, realityTest: allVerified });
    const unverified = await analyzeName({ rawInput: exactBirth.name, chart });
    const html = renderView(analysis!);
    const unverifiedHtml = renderView(unverified!);

    expect(html).toContain("姓名使用与五行文化");
    expect(html).toContain(exactBirth.name);
    expect(html).toContain("姓名现实使用实测分");
    expect(html).toContain("100 / 100");
    expect(html).toContain("资料覆盖");
    expect(html).toContain(analysis!.action);
    expect(html).not.toContain("姓名适配分");
    expect(unverifiedHtml).toContain("尚未完成现实验证，暂不评分");
  });

  it("renders unselected 发→發/髮 meaning choices, then requires an explicit 髮 reading", async () => {
    const pending = await analyzeName({ rawInput: "发", mode: "traditional-reference" });
    const hair = await analyzeName({
      rawInput: "发",
      mode: "traditional-reference",
      traditionalSelections: { 0: "髮" },
    });
    const confirmed = await analyzeName({
      rawInput: "发",
      mode: "traditional-reference",
      traditionalSelections: { 0: "髮" },
      actualReadings: { 0: "fà" },
    });
    const pendingHtml = renderView(pending!, {
      ...createNameAnalysisViewState("发"),
      mode: "traditional-reference",
    });
    const hairHtml = renderView(hair!, {
      ...createNameAnalysisViewState("发"),
      mode: "traditional-reference",
      traditionalSelections: { 0: "髮" },
    });
    const confirmedHtml = renderView(confirmed!, {
      ...createNameAnalysisViewState("发"),
      mode: "traditional-reference",
      traditionalSelections: { 0: "髮" },
      actualReadings: { 0: "fà" },
    });

    expect(pendingHtml).toContain("现实登记字形");
    expect(pendingHtml).toContain("发");
    expect(pendingHtml).toContain("發");
    expect(pendingHtml).toContain("髮");
    expect(pendingHtml).toContain("生发、出发、发展等义项");
    expect(pendingHtml).toContain("头发、毛发等义项");
    expect(pendingHtml).toContain("现实登记字形事实");
    expect(pendingHtml).not.toContain("U+53D1 · 8105 字核心表暂未覆盖");
    expect(pendingHtml).not.toMatch(/name="traditional-0"[^>]*checked/);
    expect(hairHtml).toContain("采用的传统参考字形");
    expect(hairHtml).toContain("传统参考字形事实");
    expect(hairHtml).toContain("规范等级只用于现实登记字形");
    expect(hairHtml).toContain("fà");
    expect(hairHtml).toContain("fǎ");
    expect(hairHtml).toContain("请确认姓名中的实际读音");
    expect(confirmedHtml).toContain('name="reading-0" checked="" value="fà"');
  });

  it("shows glyph facts, semantic coverage, chart comparison, advice, directions, sources and boundaries", async () => {
    const chart = calculateFourPillars(exactBirth);
    const report = buildProfessionalReport(chart, exactBirth);
    const analysis = await analyzeName({ rawInput: exactBirth.name, chart, professionalReport: report });
    const state = { ...createNameAnalysisViewState(exactBirth.name), showDirections: true };
    const html = renderView(analysis!, state);

    for (const label of [
      "逐字事实与采用口径",
      "字义五行文化向量",
      "未知比例",
      "姓名文化与出生盘并排看",
      "建议门禁",
      "三个命名方向",
      "依据与流派边界",
      "本产品未查询全国同名人数",
      "分数只评估姓名方案，不评价人",
      "姓名不会改写出生盘",
    ]) expect(html).toContain(label);
    expect(html).toContain("生长与涵养");
    expect(html).toContain("开阔与延展");
    expect(html).toContain("理解与守信");
    expect(html).toContain("待人工复核");
    expect(html).toContain("教育部《通用规范汉字表》");
    expect(html).toContain("Unicode 17.0.0 Unihan");
    expect(html).not.toContain('href="https://ywtb.mps.gov.cn/"');

    const confirmedExitHtml = renderView(analysis!, { ...state, sameNameExitConfirmed: true });
    expect(confirmedExitHtml).toContain("将离开本产品");
    expect(confirmedExitHtml).toContain("登录、实名认证和信息处理由公安部平台负责");
    expect(confirmedExitHtml).toContain('href="https://ywtb.mps.gov.cn/"');
    expect(confirmedExitHtml).not.toContain(encodeURIComponent(exactBirth.name));
  });
});
