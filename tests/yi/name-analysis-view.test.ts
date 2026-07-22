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
    onDetailsOpenChange: noop,
    onModeChange: noop,
    onTraditionalSelection: noop,
    onReadingSelection: noop,
    onRealityAnswer: noop,
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

  it("sends the fresh-direction gate only for candidate mode", async () => {
    const analyzeName = vi.fn().mockResolvedValue(null);
    const loadEngine = vi.fn().mockResolvedValue({ analyzeName });

    await loadNameAnalysisForView("林知远", { mode: "candidate" }, loadEngine);
    expect(analyzeName).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "candidate",
      requestFreshDirection: true,
    }));

    await loadNameAnalysisForView("林知远", { mode: "current" }, loadEngine);
    expect(analyzeName).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "current",
      requestFreshDirection: false,
    }));

    await loadNameAnalysisForView("林知远", { mode: "traditional-reference" }, loadEngine);
    expect(analyzeName).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "traditional-reference",
      requestFreshDirection: false,
    }));
  });

  it("passes only explicitly reviewed real-world risks into the advice engine", async () => {
    const analyzeName = vi.fn().mockResolvedValue(null);
    const loadEngine = vi.fn().mockResolvedValue({ analyzeName });
    const usageRisks = [{
      id: "confirmed-severe-homophone-or-ambiguity" as const,
      severity: "hard" as const,
      evidence: "本人确认存在严重长期歧义，并已完成人工复核。",
      manuallyReviewed: true,
      userConfirmed: true,
    }];

    await loadNameAnalysisForView("林知远", { usageRisks } as never, loadEngine);

    expect(analyzeName).toHaveBeenCalledWith(expect.objectContaining({ usageRisks }));
  });

  it("keeps fixed UI copy free of prohibited promises and persistence calls", () => {
    const source = readFileSync(new URL("../../components/yi/NameAnalysisSection.tsx", import.meta.url), "utf8");

    for (const forbidden of ["姓名适配分", "改名改命", "最吉", "必选", "补足五行", "康熙古法", "公安保证批准"]) {
      expect(source).not.toContain(forbidden);
    }
    expect(source).not.toMatch(/localStorage|sessionStorage|URLSearchParams|fetch\(|XMLHttpRequest/);
  });

  it("offers an in-place retry when the lazy name data load fails", () => {
    const source = readFileSync(new URL("../../components/yi/NameAnalysisSection.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(source).toContain("姓名资料暂时无法载入");
    expect(source).toContain("重试姓名资料");
    expect(source).toMatch(/setLoadAttempt\([^)]+\+\s*1\)/);
    expect(css).toMatch(/\.name-analysis-loading button\{[^}]*min-height:44px/);
    expect(css).toMatch(/\.name-risk-review\{[^}]*border/);
    expect(css).toMatch(/\.name-risk-review label\{[^}]*min-height:44px/);
  });
});

describe("name analysis state", () => {
  it("switches current to candidate and back, then clears every local choice when the name changes", () => {
    let state = createNameAnalysisViewState("发");
    state = nameAnalysisViewReducer(state, { type: "set-mode", mode: "candidate" });
    expect(state.mode).toBe("candidate");
    state = nameAnalysisViewReducer(state, { type: "set-mode", mode: "current" });
    expect(state.mode).toBe("current");
    state = nameAnalysisViewReducer(state, { type: "set-mode", mode: "traditional-reference" });
    state = nameAnalysisViewReducer(state, { type: "select-traditional", characterIndex: 0, glyph: "髮" });
    state = nameAnalysisViewReducer(state, { type: "select-reading", characterIndex: 0, reading: "fà" });
    state = nameAnalysisViewReducer(state, { type: "answer-reality", dimension: "hearing", answer: "both" });
    state = nameAnalysisViewReducer(state, { type: "set-usage-risk-reviewed", riskId: "persistent-input-document-or-calling-issue", reviewed: true } as never);
    state = nameAnalysisViewReducer(state, { type: "confirm-same-name-exit" });

    expect(state.traditionalSelections).toEqual({ 0: "髮" });
    expect((state as typeof state & { usageRiskReviews: Record<string, boolean> }).usageRiskReviews).toEqual({ "persistent-input-document-or-calling-issue": true });
    state = nameAnalysisViewReducer(state, { type: "reset-name", name: "林知远" });

    expect(state).toEqual(createNameAnalysisViewState("林知远"));
    expect(state.traditionalSelections).toEqual({});
    expect(state.actualReadings).toEqual({});
    expect((state as typeof state & { usageRiskReviews: Record<string, boolean> }).usageRiskReviews).toEqual({});
    expect(Object.values(state.realityTest)).toEqual(["unverified", "unverified", "unverified", "unverified"]);
  });

  it("keeps expanded details open across analysis controls and closes for a new name", async () => {
    let state = createNameAnalysisViewState("发");
    state = nameAnalysisViewReducer(state, { type: "set-details-open", open: true });
    expect(state.detailsOpen).toBe(true);

    state = nameAnalysisViewReducer(state, { type: "set-mode", mode: "traditional-reference" });
    expect(state.detailsOpen).toBe(true);
    state = nameAnalysisViewReducer(state, { type: "select-traditional", characterIndex: 0, glyph: "髮" });
    expect(state.detailsOpen).toBe(true);
    state = nameAnalysisViewReducer(state, { type: "select-reading", characterIndex: 0, reading: "fà" });
    expect(state.detailsOpen).toBe(true);
    state = nameAnalysisViewReducer(state, { type: "answer-reality", dimension: "hearing", answer: "both" });
    expect(state.detailsOpen).toBe(true);
    state = nameAnalysisViewReducer(state, { type: "set-mode", mode: "candidate" });
    expect(state.detailsOpen).toBe(true);

    const analysis = await analyzeName({ rawInput: "发", mode: "candidate", requestFreshDirection: true });
    expect(renderView(analysis!, state)).toContain('<details class="name-analysis-depth" open="">');

    state = nameAnalysisViewReducer(state, { type: "reset-name", name: "林知远" });
    expect(state.detailsOpen).toBe(false);
  });
});

describe("name analysis reading view", () => {
  it("keeps the first layer concise and separates verified use score from evidence coverage", async () => {
    const chart = calculateFourPillars(exactBirth);
    const analysis = await analyzeName({ rawInput: exactBirth.name, chart, realityTest: allVerified });
    const unverified = await analyzeName({ rawInput: exactBirth.name, chart });
    const html = renderView(analysis!);
    const unverifiedHtml = renderView(unverified!);
    const summaryHtml = html.slice(html.indexOf('class="name-analysis-summary"'), html.indexOf('<details class="name-analysis-depth"'));

    expect(html).toContain("姓名使用与五行文化");
    expect(html).toContain(exactBirth.name);
    expect(html).toContain("姓名现实使用实测分");
    expect(html).toContain("100 / 100");
    expect(html).toContain("资料覆盖");
    expect(summaryHtml).toContain(analysis!.ruleObservation);
    expect(summaryHtml).toContain(analysis!.plainLanguageScene);
    expect(summaryHtml).toContain(analysis!.action);
    expect(summaryHtml).toContain(analysis!.boundary);
    expect(html).not.toContain("姓名适配分");
    expect(unverifiedHtml).toContain("尚未完成现实验证，暂不评分");
  });

  it("shows a manual review gate before severe reality-test problems can change advice", async () => {
    const analysis = await analyzeName({
      rawInput: exactBirth.name,
      realityTest: {
        hearing: "none",
        inputDisplay: "none",
        documents: "none",
        meaningAcceptance: "severe-confirmed",
      },
    });
    const html = renderView(analysis!, {
      ...createNameAnalysisViewState(exactBirth.name),
      realityTest: {
        hearing: "none",
        inputDisplay: "none",
        documents: "none",
        meaningAcceptance: "severe-confirmed",
      },
    });

    expect(html).toContain("现实风险复核门");
    expect(html).toContain("人工复核");
    expect(html).toContain("确认前不会触发更名建议");
  });

  it("uses explicit candidate mode for directions and conservative advice, then returns to current", async () => {
    const current = await analyzeName({ rawInput: exactBirth.name, mode: "current" });
    const traditional = await analyzeName({ rawInput: exactBirth.name, mode: "traditional-reference" });
    const candidate = await analyzeName({ rawInput: exactBirth.name, mode: "candidate", requestFreshDirection: true });
    const currentState = createNameAnalysisViewState(exactBirth.name);
    const candidateState = { ...currentState, mode: "candidate" as const };
    const currentHtml = renderView(current!, currentState);
    const traditionalHtml = renderView(traditional!, { ...currentState, mode: "traditional-reference" });
    const candidateHtml = renderView(candidate!, candidateState);
    const returnedHtml = renderView(current!, { ...candidateState, mode: "current" });

    expect(candidate?.advice.tier).toBe("rebuild-direction");
    expect(candidateHtml).toContain("新姓名方向");
    expect(candidateHtml).toContain('aria-pressed="true"');
    expect(candidateHtml).toContain("三个命名方向");
    expect(candidateHtml).toContain("仅查看有限命名方向");
    expect(currentHtml).not.toContain("三个命名方向");
    expect(traditionalHtml).not.toContain("三个命名方向");
    expect(returnedHtml).not.toContain("三个命名方向");
  });

  it("shows directions only for an unblocked candidate advice tier", async () => {
    const [blocked, unblocked] = await Promise.all([
      analyzeName({ rawInput: "行", mode: "candidate", requestFreshDirection: true }),
      analyzeName({ rawInput: exactBirth.name, mode: "candidate", requestFreshDirection: true }),
    ]);
    const blockedHtml = renderView(blocked!, { ...createNameAnalysisViewState("行"), mode: "candidate" });
    const unblockedHtml = renderView(unblocked!, { ...createNameAnalysisViewState(exactBirth.name), mode: "candidate" });

    expect(blocked?.advice.tier).toBe("hold");
    expect(blockedHtml).toContain(blocked!.advice.ruleObservation);
    expect(blockedHtml).toContain(blocked!.advice.action);
    expect(blockedHtml).toContain("事实确认后再显示方向");
    expect(blockedHtml).not.toContain("三个命名方向");
    expect(blockedHtml).not.toContain("生长与涵养");

    expect(unblocked?.advice.tier).toBe("rebuild-direction");
    expect(unblockedHtml).toContain("三个命名方向");
    expect(unblockedHtml).toContain("生长与涵养");
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
    expect(pendingHtml).toContain("U+53D1 · 通用规范汉字表第 1 级 · 总笔画工程记录 5");
    expect(pendingHtml).toContain("尚未采用");
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

  it("keeps the registered 后 TGH facts visible beside an unreviewed 後 candidate", async () => {
    const analysis = await analyzeName({
      rawInput: "后",
      mode: "traditional-reference",
      traditionalSelections: { 0: "後" },
    });
    const html = renderView(analysis!, {
      ...createNameAnalysisViewState("后"),
      mode: "traditional-reference",
      traditionalSelections: { 0: "後" },
    });

    expect(html).toContain("现实登记字形事实");
    expect(html).toContain("U+540E · 通用规范汉字表第 1 级 · 总笔画工程记录 6");
    expect(html).toContain("采用的传统参考字形");
    expect(html).toContain("後");
    expect(html).toContain("姓名采用义项尚未进入有限人工审校集");
  });

  it("shows glyph facts, semantic coverage, chart comparison, advice, directions, sources and boundaries", async () => {
    const chart = calculateFourPillars(exactBirth);
    const report = buildProfessionalReport(chart, exactBirth);
    const analysis = await analyzeName({ rawInput: exactBirth.name, mode: "candidate", requestFreshDirection: true, chart, professionalReport: report });
    const state = { ...createNameAnalysisViewState(exactBirth.name), mode: "candidate" as const };
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
    expect(html).toContain(analysis!.chartInteraction!.plainLanguageScene);
    expect(html).toContain(analysis!.advice.plainLanguageScene);
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
