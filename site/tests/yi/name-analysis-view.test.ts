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

    await loadNameAnalysisForView("林知远", {
      mode: "traditional-reference",
      requestFreshDirection: true,
    }, loadEngine);
    expect(analyzeName).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "traditional-reference",
      requestFreshDirection: true,
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

  it("keeps legacy local choices in state while the public view stays collapsed", async () => {
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
    expect(renderView(analysis!, state)).not.toContain("name-analysis-depth");

    state = nameAnalysisViewReducer(state, { type: "reset-name", name: "林知远" });
    expect(state.detailsOpen).toBe(false);
  });
});

describe("name analysis reading view", () => {
  it("shows direct reference-only name scoring and four classical suggestions without review clutter", async () => {
    const chart = calculateFourPillars(exactBirth);
    const analysis = await analyzeName({ rawInput: exactBirth.name, chart, realityTest: allVerified });
    const html = renderView(analysis!);

    expect(html).toContain("姓名五行参考分");
    expect(html).toContain(exactBirth.name);
    expect(html).toMatch(/\d+\/100/);
    expect(html).toContain("仅供参考");
    expect(html).toContain("五行缺补");
    expect(html).toContain("名义五行补救建议");
    expect(html).toContain("典籍取名建议");
    expect(html.match(/data-classic-name=/g)).toHaveLength(4);
    expect(html).toContain("单字名");
    expect(html).toContain("双字名");
    expect(html).toMatch(/《诗经》|《楚辞》|《论语》|《尚书》|《周易》|《礼记》/);
    expect(html).not.toMatch(/待人工复核|待人工审核|人工复核|现实使用实测分|现实风险复核门|展开姓名事实|依据与流派边界|本章依据|使用边界|ruleId|来源 ID/);
  });

  it("keeps severe reality-test problems out of the public scoring card", async () => {
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

    expect(html).toContain("姓名五行参考分");
    expect(html).toContain("仅供参考");
    expect(html).not.toMatch(/现实风险复核门|人工复核|确认前不会触发更名建议|姓名现实使用实测分/);
  });

  it("does not expose candidate-mode direction controls in the public name score", async () => {
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
    expect(candidateHtml).toContain("典籍取名建议");
    expect(candidateHtml).not.toContain("新姓名方向");
    expect(candidateHtml).not.toContain('aria-pressed="true"');
    expect(candidateHtml).not.toContain("三个命名方向");
    expect(candidateHtml).not.toContain("仅查看有限命名方向");
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
    expect(blockedHtml).toContain("姓名五行参考分");
    expect(blockedHtml).not.toContain(blocked!.advice.ruleObservation);
    expect(blockedHtml).not.toContain(blocked!.advice.action);
    expect(blockedHtml).not.toContain("事实确认后再显示方向");
    expect(blockedHtml).not.toContain("三个命名方向");
    expect(blockedHtml).not.toContain("生长与涵养");

    expect(unblocked?.advice.tier).toBe("rebuild-direction");
    expect(unblockedHtml).not.toContain("三个命名方向");
    expect(unblockedHtml).toContain("典籍取名建议");
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

    expect(pendingHtml).toContain("姓名五行参考分");
    expect(pendingHtml).toContain("发");
    expect(pendingHtml).toContain("仅供参考");
    expect(pendingHtml).not.toContain("现实登记字形事实");
    expect(pendingHtml).not.toContain("U+53D1 · 通用规范汉字表第 1 级 · 总笔画工程记录 5");
    expect(pendingHtml).not.toMatch(/name="traditional-0"[^>]*checked/);
    expect(hairHtml).not.toContain("采用的传统参考字形");
    expect(hairHtml).not.toContain("传统参考字形事实");
    expect(hairHtml).not.toContain("规范等级只用于现实登记字形");
    expect(confirmedHtml).not.toContain('name="reading-0" checked="" value="fà"');
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

    expect(html).toContain("姓名五行参考分");
    expect(html).toContain("后");
    expect(html).not.toContain("现实登记字形事实");
    expect(html).not.toContain("U+540E · 通用规范汉字表第 1 级 · 总笔画工程记录 6");
    expect(html).not.toContain("姓名采用义项尚未进入有限人工审校集");
  });

  it("hides glyph facts, sources and boundaries from the public name score", async () => {
    const chart = calculateFourPillars(exactBirth);
    const report = buildProfessionalReport(chart, exactBirth);
    const analysis = await analyzeName({ rawInput: exactBirth.name, mode: "candidate", requestFreshDirection: true, chart, professionalReport: report });
    const state = { ...createNameAnalysisViewState(exactBirth.name), mode: "candidate" as const };
    const html = renderView(analysis!, state);

    for (const label of [
      "姓名五行参考分",
      "五行缺补",
      "名义五行补救建议",
      "典籍取名建议",
    ]) expect(html).toContain(label);
    expect(html).not.toContain("逐字事实与采用口径");
    expect(html).not.toContain("未知比例");
    expect(html).not.toContain("姓名文化与出生盘并排看");
    expect(html).not.toContain("建议门禁");
    expect(html).not.toContain("三个命名方向");
    expect(html).not.toContain("依据与流派边界");
    expect(html).not.toContain("本产品未查询全国同名人数");
    expect(html).not.toContain("教育部《通用规范汉字表》");
    expect(html).not.toContain("Unicode 17.0.0 Unihan");
    expect(html).not.toContain('href="https://ywtb.mps.gov.cn/"');

    const confirmedExitHtml = renderView(analysis!, { ...state, sameNameExitConfirmed: true });
    expect(confirmedExitHtml).not.toContain("将离开本产品");
    expect(confirmedExitHtml).not.toContain("登录、实名认证和信息处理由公安部平台负责");
    expect(confirmedExitHtml).not.toContain('href="https://ywtb.mps.gov.cn/"');
    expect(confirmedExitHtml).not.toContain(encodeURIComponent(exactBirth.name));
  });
});
