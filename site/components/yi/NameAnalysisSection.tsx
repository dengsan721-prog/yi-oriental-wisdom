"use client";

import { useEffect, useReducer, useState } from "react";
import type {
  NameAdvice,
  NameBlockerOccurrence,
  NameCharacterRecord,
  NameChartInteraction,
  NameDirection,
  NameSemanticSummary,
  NameSurname,
} from "../../lib/yi/name-types";
import type { NameRealityScore, NameRealityTestAnswers } from "../../lib/yi/name-score-contract";
import type { UsageRiskInput } from "../../lib/yi/name-analysis";
import type { ElementName, FourPillarsResult, ProfessionalReport } from "../../lib/yi/types";

export type NameAnalysisMode = "current" | "traditional-reference" | "candidate";
type RealityDimension = keyof NameRealityTestAnswers;
type RealityAnswer = NameRealityTestAnswers[RealityDimension];
type UsageRiskId = UsageRiskInput["id"];

export type NameAnalysisViewResult = {
  rawInput: string;
  mode: NameAnalysisMode;
  surname: NameSurname;
  characters: NameCharacterRecord[];
  blockers: NameBlockerOccurrence[];
  semanticSummary: NameSemanticSummary;
  realityScore: NameRealityScore;
  advice: NameAdvice;
  chartInteraction: NameChartInteraction | null;
  directions: [NameDirection, NameDirection, NameDirection];
  fullNameReviewStatus: "已审校" | "待人工复核";
  frequencyContext: string;
  ruleObservation: string;
  plainLanguageScene: string;
  action: string;
  boundary: string;
  sourceIds: string[];
};

export type NameAnalysisRequest = {
  mode: NameAnalysisMode;
  traditionalSelections: Readonly<Record<number, string | undefined>>;
  actualReadings: Readonly<Record<number, string | undefined>>;
  realityTest: NameRealityTestAnswers;
  usageRisks: readonly UsageRiskInput[];
  requestFreshDirection: boolean;
  chart?: Readonly<FourPillarsResult>;
  professionalReport?: Readonly<ProfessionalReport>;
};

type NameAnalysisEngine = {
  analyzeName(request: NameAnalysisRequest & { rawInput: string }): Promise<NameAnalysisViewResult | null>;
};

type NameAnalysisEngineLoader = () => Promise<NameAnalysisEngine>;

const DEFAULT_REALITY_TEST: NameRealityTestAnswers = {
  hearing: "unverified",
  inputDisplay: "unverified",
  documents: "unverified",
  meaningAcceptance: "unverified",
};

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const NAME_ELEMENT_HINTS: Readonly<Record<string, ElementName>> = {
  林: "木", 木: "木", 森: "木", 桐: "木", 乔: "木", 芷: "木", 芃: "木", 若: "木",
  明: "火", 昭: "火", 晖: "火", 景: "火", 煦: "火", 阳: "火", 炎: "火",
  安: "土", 坤: "土", 辰: "土", 宇: "土", 山: "土", 岳: "土", 厚: "土",
  鑫: "金", 金: "金", 钧: "金", 铎: "金", 铭: "金", 锦: "金", 钰: "金",
  清: "水", 沅: "水", 泽: "水", 涵: "水", 沐: "水", 江: "水", 川: "水", 雨: "水",
};

type ClassicNameSuggestion = {
  element: ElementName;
  kind: "单字名" | "双字名";
  name: string;
  source: string;
  meaning: string;
};

const CLASSIC_NAME_SUGGESTIONS: readonly ClassicNameSuggestion[] = [
  { element: "木", kind: "单字名", name: "乔", source: "《诗经·小雅·伐木》", meaning: "取乔木向上、生发成材之意。" },
  { element: "木", kind: "单字名", name: "桐", source: "《诗经·大雅·卷阿》", meaning: "取梧桐承凤、清雅有根之意。" },
  { element: "木", kind: "双字名", name: "清芷", source: "《楚辞·九歌》", meaning: "取芳草清芬，补木而不显得厚重。" },
  { element: "木", kind: "双字名", name: "嘉树", source: "《楚辞·橘颂》", meaning: "取嘉木自立、生机端正之意。" },
  { element: "火", kind: "单字名", name: "昭", source: "《诗经·大雅·文王》", meaning: "取光明显达，增强表达与照见之气。" },
  { element: "火", kind: "单字名", name: "明", source: "《大学》", meaning: "取明德、明辨，让名字更有光亮感。" },
  { element: "火", kind: "双字名", name: "景行", source: "《诗经·小雅·车舝》", meaning: "取可仰可行的明朗道路。" },
  { element: "火", kind: "双字名", name: "昭华", source: "《楚辞·九思》", meaning: "取光华外显，适合补火的名字意象。" },
  { element: "土", kind: "单字名", name: "安", source: "《论语·里仁》", meaning: "取安定、安仁，补稳定承载之气。" },
  { element: "土", kind: "单字名", name: "厚", source: "《周易·坤》", meaning: "取厚德载物，补土的承接与包容。" },
  { element: "土", kind: "双字名", name: "维岳", source: "《诗经·大雅·崧高》", meaning: "取山岳厚重，适合补土的根基感。" },
  { element: "土", kind: "双字名", name: "安仁", source: "《论语·里仁》", meaning: "取安于仁道，稳而不钝。" },
  { element: "金", kind: "单字名", name: "铎", source: "《论语·八佾》", meaning: "取木铎宣声，补金的清响与号令。" },
  { element: "金", kind: "单字名", name: "钧", source: "《尚书》", meaning: "取均衡、权衡之意，名字更有骨力。" },
  { element: "金", kind: "双字名", name: "金声", source: "《孟子·万章下》", meaning: "取金声玉振，补金的清正与成章。" },
  { element: "金", kind: "双字名", name: "玉振", source: "《孟子·万章下》", meaning: "取金声玉振，含收束成器之美。" },
  { element: "水", kind: "单字名", name: "清", source: "《诗经·魏风·伐檀》", meaning: "取河水清涟，补水的流动与澄明。" },
  { element: "水", kind: "单字名", name: "沅", source: "《楚辞·涉江》", meaning: "取沅水之名，补水而有远行感。" },
  { element: "水", kind: "双字名", name: "清扬", source: "《诗经·郑风·野有蔓草》", meaning: "取清扬明朗，水意轻灵。" },
  { element: "水", kind: "双字名", name: "沅芷", source: "《楚辞·九歌》", meaning: "取沅水兰芷，兼有水木之清。" },
];


export type NameAnalysisViewState = {
  name: string;
  mode: NameAnalysisMode;
  traditionalSelections: Record<number, string | undefined>;
  actualReadings: Record<number, string | undefined>;
  realityTest: NameRealityTestAnswers;
  usageRiskReviews: Partial<Record<UsageRiskId, boolean>>;
  detailsOpen: boolean;
  sameNameExitConfirmed: boolean;
  suggestionBatchIndex: number;
};

export type NameAnalysisViewAction =
  | { type: "reset-name"; name: string }
  | { type: "set-mode"; mode: NameAnalysisMode }
  | { type: "select-traditional"; characterIndex: number; glyph: string }
  | { type: "select-reading"; characterIndex: number; reading: string }
  | { type: "answer-reality"; dimension: RealityDimension; answer: RealityAnswer }
  | { type: "set-usage-risk-reviewed"; riskId: UsageRiskId; reviewed: boolean }
  | { type: "set-details-open"; open: boolean }
  | { type: "next-suggestion-batch" }
  | { type: "confirm-same-name-exit" };

export function createNameAnalysisViewState(name: string): NameAnalysisViewState {
  return {
    name,
    mode: "current",
    traditionalSelections: {},
    actualReadings: {},
    realityTest: { ...DEFAULT_REALITY_TEST },
    usageRiskReviews: {},
    detailsOpen: false,
    sameNameExitConfirmed: false,
    suggestionBatchIndex: 0,
  };
}

export function nameAnalysisViewReducer(state: NameAnalysisViewState, action: NameAnalysisViewAction): NameAnalysisViewState {
  if (action.type === "reset-name") return createNameAnalysisViewState(action.name);
  if (action.type === "set-mode") return { ...state, mode: action.mode };
  if (action.type === "select-traditional") return {
    ...state,
    traditionalSelections: { ...state.traditionalSelections, [action.characterIndex]: action.glyph },
    actualReadings: { ...state.actualReadings, [action.characterIndex]: undefined },
  };
  if (action.type === "select-reading") return {
    ...state,
    actualReadings: { ...state.actualReadings, [action.characterIndex]: action.reading },
  };
  if (action.type === "answer-reality") return {
    ...state,
    realityTest: { ...state.realityTest, [action.dimension]: action.answer } as NameRealityTestAnswers,
  };
  if (action.type === "set-usage-risk-reviewed") return {
    ...state,
    usageRiskReviews: { ...state.usageRiskReviews, [action.riskId]: action.reviewed },
  };
  if (action.type === "set-details-open") {
    return state.detailsOpen === action.open ? state : { ...state, detailsOpen: action.open };
  }
  if (action.type === "next-suggestion-batch") {
    return { ...state, suggestionBatchIndex: (state.suggestionBatchIndex + 1) % 5 };
  }
  return { ...state, sameNameExitConfirmed: true };
}

export async function loadNameAnalysisForView(
  name: string,
  request: Partial<NameAnalysisRequest>,
  loadEngine: NameAnalysisEngineLoader = () => import("../../lib/yi/name-analysis") as Promise<NameAnalysisEngine>,
): Promise<NameAnalysisViewResult | null> {
  if (!name.trim()) return null;
  const engine = await loadEngine();
  return engine.analyzeName({
    rawInput: name,
    mode: request.mode ?? "current",
    traditionalSelections: request.traditionalSelections ?? {},
    actualReadings: request.actualReadings ?? {},
    realityTest: request.realityTest ?? { ...DEFAULT_REALITY_TEST },
    usageRisks: request.usageRisks ?? [],
    requestFreshDirection:
      request.requestFreshDirection ?? request.mode === "candidate",
    chart: request.chart,
    professionalReport: request.professionalReport,
  });
}

export function buildUsageRiskInputs(
  realityTest: NameRealityTestAnswers,
  reviews: Readonly<Partial<Record<UsageRiskId, boolean>>>,
): UsageRiskInput[] {
  const risks: UsageRiskInput[] = [];
  const persistentScenes = [
    realityTest.hearing === "none" ? "两位听读测试者都未能正确复述" : "",
    realityTest.inputDisplay === "none" ? "手机与电脑都持续出现输入或显示问题" : "",
    realityTest.documents === "one" ? "一个实际办理场景持续出现姓名使用问题" : "",
    realityTest.documents === "none" ? "两个实际办理场景都持续出现姓名使用问题" : "",
  ].filter(Boolean);
  if (persistentScenes.length) {
    const id: UsageRiskId = "persistent-input-document-or-calling-issue";
    risks.push({
      id,
      severity: "hard",
      evidence: `本人确认：${persistentScenes.join("；")}。${reviews[id] ? "并确认已经人工复核。" : "尚未确认完成人工复核。"}`,
      manuallyReviewed: reviews[id] === true,
      userConfirmed: true,
    });
  }
  if (realityTest.meaningAcceptance === "severe-confirmed") {
    const id: UsageRiskId = "confirmed-severe-homophone-or-ambiguity";
    risks.push({
      id,
      severity: "hard",
      evidence: `本人确认姓名含义存在严重且长期的负面歧义。${reviews[id] ? "并确认已经人工复核。" : "尚未确认完成人工复核。"}`,
      manuallyReviewed: reviews[id] === true,
      userConfirmed: true,
    });
  }
  return risks;
}

function dominantNameElement(character: NameCharacterRecord): ElementName | null {
  const hinted = NAME_ELEMENT_HINTS[character.adoptedGlyph ?? character.inputGlyph]
    ?? NAME_ELEMENT_HINTS[character.inputGlyph];
  if (hinted) return hinted;
  if (!character.semantic?.vector) return null;
  const winner = ELEMENTS.reduce((current, element) =>
    character.semantic!.vector[element] > character.semantic!.vector[current]
      ? element
      : current,
  "木" as ElementName);
  return character.semantic.vector[winner] > 0 ? winner : null;
}

function uniqueElements(values: readonly ElementName[]): ElementName[] {
  return ELEMENTS.filter(element => values.includes(element));
}

function elementList(values: readonly ElementName[], fallback = "暂无明显缺口"): string {
  return values.length ? values.join("、") : fallback;
}

function buildNameReference(analysis: NameAnalysisViewResult): {
  chartElements: readonly ElementName[];
  nameElements: readonly ElementName[];
  coveredElements: readonly ElementName[];
  missingElements: readonly ElementName[];
  score: number;
} {
  const chartElements = uniqueElements(Object.values(
    analysis.chartInteraction?.input.certainPillars ?? {},
  ).flatMap(pillar => pillar ? [pillar.element, pillar.branchElement] : []));
  const nameElements = uniqueElements(analysis.characters.flatMap(character => {
    const element = dominantNameElement(character);
    return element ? [element] : [];
  }));
  const coveredElements = uniqueElements([...chartElements, ...nameElements]);
  const missingElements = ELEMENTS.filter(element => !coveredElements.includes(element));
  return {
    chartElements,
    nameElements,
    coveredElements,
    missingElements,
    score: coveredElements.length * 20,
  };
}

function buildClassicSuggestions(
  missingElements: readonly ElementName[],
  nameElements: readonly ElementName[],
  batchIndex = 0,
): readonly ClassicNameSuggestion[] {
  const targets = missingElements.length
    ? missingElements
    : ELEMENTS.filter(element => !nameElements.includes(element));
  const anchor = ELEMENTS.indexOf(targets[0] ?? "木");
  const primary = ELEMENTS[(Math.max(0, anchor) + batchIndex) % ELEMENTS.length];
  const singles = CLASSIC_NAME_SUGGESTIONS
    .filter(item => item.element === primary && item.kind === "单字名")
    .slice(0, 2);
  const doubles = CLASSIC_NAME_SUGGESTIONS
    .filter(item => item.element === primary && item.kind === "双字名")
    .slice(0, 2);
  return [...singles, ...doubles];
}

export function NameAnalysisView({
  analysis,
  state,
  onSuggestionBatchChange,
}: {
  analysis: NameAnalysisViewResult;
  state: NameAnalysisViewState;
  onDetailsOpenChange: (open: boolean) => void;
  onModeChange: (mode: NameAnalysisMode) => void;
  onTraditionalSelection: (characterIndex: number, glyph: string) => void;
  onReadingSelection: (characterIndex: number, reading: string) => void;
  onRealityAnswer: (dimension: RealityDimension, answer: RealityAnswer) => void;
  onUsageRiskReview?: (riskId: UsageRiskId, reviewed: boolean) => void;
  onSuggestionBatchChange?: () => void;
  onConfirmSameNameExit: () => void;
}) {
  const reference = buildNameReference(analysis);
  const suggestions = buildClassicSuggestions(reference.missingElements, reference.nameElements, state.suggestionBatchIndex);
  const targetElements = reference.missingElements.length
    ? reference.missingElements
    : ELEMENTS.filter(element => !reference.nameElements.includes(element));

  return <section className="name-analysis-section name-reference-section" data-name-analysis="ready">
    <header className="name-reference-summary">
      <div>
        <small>姓名文化测分 · 仅供参考</small>
        <h2>姓名五行参考分</h2>
        <p className="name-current-glyphs">{analysis.rawInput}</p>
      </div>
      <div className="name-reference-score" aria-label={`姓名五行参考分 ${reference.score}/100`}>
        <strong>{reference.score}</strong><span>/100</span>
      </div>
    </header>

    <div className="name-reference-grid">
      <article>
        <h3>五行缺补</h3>
        <p>命盘可见五行：{elementList(reference.chartElements, "出生盘稳定信息暂少")}；姓名名义偏向：{elementList(reference.nameElements, "暂未形成明显名义五行")}。</p>
        <p>当前合看已见：{elementList(reference.coveredElements)}；建议留意：{elementList(reference.missingElements)}。</p>
      </article>
      <article>
        <h3>名义五行补救建议</h3>
        <p>{targetElements.length
          ? `取名意象可优先向${elementList(targetElements)}靠拢，选字时看字义、读音和日常称呼是否顺口。`
          : "五行已经齐备，名字重点放在读音清朗、书写稳定和本人喜欢。"}
        </p>
        <p>这个分数只看“五行是否齐备”的趣味规则，不评价人，也不替代现实登记和家庭取名判断。</p>
      </article>
    </div>

    <section className="name-classic-suggestions" aria-label="典籍取名建议">
      <header>
        <div>
          <h3>典籍取名建议</h3>
          <small>第{state.suggestionBatchIndex + 1}/5批</small>
        </div>
        <button type="button" onClick={onSuggestionBatchChange}>换一批</button>
        <p>从《诗经》《楚辞》《论语》《尚书》《周易》等典籍意象中挑字，下面给出两个单字名、两个双字名，方便继续试分。</p>
      </header>
      <div>
        {suggestions.map(suggestion => (
          <article data-classic-name={suggestion.name} key={`${suggestion.kind}-${suggestion.name}`}>
            <small>{suggestion.kind} · 补{suggestion.element}</small>
            <h4>{suggestion.name}</h4>
            <p>{suggestion.meaning}</p>
            <span>{suggestion.source}</span>
          </article>
        ))}
      </div>
    </section>
  </section>;
}

export function NameAnalysisSection({ name, chart, report }: {
  name: string;
  chart: FourPillarsResult;
  report: ProfessionalReport;
}) {
  const [state, dispatch] = useReducer(nameAnalysisViewReducer, name, createNameAnalysisViewState);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const requestKey = JSON.stringify([
    name,
    state.mode,
    state.traditionalSelections,
    state.actualReadings,
    state.realityTest,
    state.usageRiskReviews,
    loadAttempt,
    chart.pillars,
    chart.ambiguousPillars,
    report.birthFacts.solar,
  ]);
  const [loaded, setLoaded] = useState<{
    requestKey: string;
    analysis: NameAnalysisViewResult | null;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (!name.trim()) return;
    let active = true;
    loadNameAnalysisForView(name, {
      mode: state.mode,
      traditionalSelections: state.traditionalSelections,
      actualReadings: state.actualReadings,
      realityTest: state.realityTest,
      usageRisks: buildUsageRiskInputs(state.realityTest, state.usageRiskReviews),
      chart,
      professionalReport: report,
    }).then(result => {
      if (active) setLoaded({ requestKey, analysis: result, error: false });
    }).catch(() => {
      if (active) setLoaded({ requestKey, analysis: null, error: true });
    });
    return () => { active = false; };
  }, [chart, name, report, requestKey, state.actualReadings, state.mode, state.realityTest, state.traditionalSelections, state.usageRiskReviews]);

  if (!name.trim()) return null;
  const analysis = loaded?.requestKey === requestKey ? loaded.analysis : null;
  if (loaded?.requestKey === requestKey && loaded.error) return <section className="name-analysis-loading" data-name-analysis="error" role="alert"><span>姓名资料暂时无法载入；命盘其他内容不受影响。</span><button onClick={() => setLoadAttempt(value => value + 1)} type="button">重试姓名资料</button></section>;
  if (!analysis) return <section aria-busy="true" className="name-analysis-loading" data-name-analysis="loading"><span>正在本机核对姓名字形资料…</span></section>;

  return <NameAnalysisView
    analysis={analysis}
    onConfirmSameNameExit={() => dispatch({ type: "confirm-same-name-exit" })}
    onDetailsOpenChange={open => dispatch({ type: "set-details-open", open })}
    onModeChange={mode => dispatch({ type: "set-mode", mode })}
    onReadingSelection={(characterIndex, reading) => dispatch({ type: "select-reading", characterIndex, reading })}
    onRealityAnswer={(dimension, answer) => dispatch({ type: "answer-reality", dimension, answer })}
    onSuggestionBatchChange={() => dispatch({ type: "next-suggestion-batch" })}
    onUsageRiskReview={(riskId, reviewed) => dispatch({ type: "set-usage-risk-reviewed", riskId, reviewed })}
    onTraditionalSelection={(characterIndex, glyph) => dispatch({ type: "select-traditional", characterIndex, glyph })}
    state={state}
  />;
}
