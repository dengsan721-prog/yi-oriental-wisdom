"use client";

import { useEffect, useReducer, useState } from "react";
import type {
  NameAdvice,
  NameBlockerOccurrence,
  NameCharacterRecord,
  NameChartInteraction,
  NameDirection,
  NameSemanticSummary,
} from "../../lib/yi/name-types";
import type { NameRealityScore, NameRealityTestAnswers } from "../../lib/yi/name-score-contract";
import type { FourPillarsResult, ProfessionalReport } from "../../lib/yi/types";

type NameAnalysisMode = "current" | "traditional-reference" | "candidate";
type RealityDimension = keyof NameRealityTestAnswers;
type RealityAnswer = NameRealityTestAnswers[RealityDimension];

export type NameAnalysisViewResult = {
  rawInput: string;
  mode: NameAnalysisMode;
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

type NameAnalysisRequest = {
  mode: NameAnalysisMode;
  traditionalSelections: Readonly<Record<number, string | undefined>>;
  actualReadings: Readonly<Record<number, string | undefined>>;
  realityTest: NameRealityTestAnswers;
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
const PILLAR_LABELS = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" } as const;

const REALITY_DIMENSIONS = [
  {
    id: "hearing",
    title: "听见与读准",
    prompt: "请两位不熟悉姓名的人只听一次，能否正确复述或叫读？",
    options: [["both", "两位都正确"], ["one", "一位正确"], ["none", "都未正确"], ["unverified", "尚未实测"]],
  },
  {
    id: "inputDisplay",
    title: "输入与显示",
    prompt: "在常用手机和电脑上，能否一次输入并正确显示？",
    options: [["both", "两种环境都顺畅"], ["one", "一种环境顺畅"], ["none", "两种都有问题"], ["unverified", "尚未实测"]],
  },
  {
    id: "documents",
    title: "证件与业务系统",
    prompt: "在两个实际办理场景中，姓名是否稳定可用？",
    options: [["both", "两个场景都稳定"], ["one", "一个场景稳定"], ["none", "两个都有问题"], ["unverified", "尚未经历"]],
  },
  {
    id: "meaningAcceptance",
    title: "含义与本人接受度",
    prompt: "本人是否认可本次采用义项，且没有长期困扰？",
    options: [["accepted", "认可且无困扰"], ["one-long-term-ambiguity", "有一项长期歧义"], ["severe-confirmed", "有严重且已确认的歧义"], ["unverified", "尚未确认"]],
  },
] as const satisfies readonly {
  id: RealityDimension;
  title: string;
  prompt: string;
  options: readonly (readonly [RealityAnswer, string])[];
}[];

const ADVICE_LABELS: Record<NameAdvice["tier"], string> = {
  hold: "先核对事实",
  keep: "默认尊重并保留现名",
  "micro-adjust": "只处理已确认的单项摩擦",
  rebuild: "可把重构交给人工复核",
  "rebuild-direction": "仅查看有限命名方向",
};

export type NameAnalysisViewState = {
  name: string;
  mode: NameAnalysisMode;
  traditionalSelections: Record<number, string | undefined>;
  actualReadings: Record<number, string | undefined>;
  realityTest: NameRealityTestAnswers;
  detailsOpen: boolean;
  sameNameExitConfirmed: boolean;
};

export type NameAnalysisViewAction =
  | { type: "reset-name"; name: string }
  | { type: "set-mode"; mode: NameAnalysisMode }
  | { type: "select-traditional"; characterIndex: number; glyph: string }
  | { type: "select-reading"; characterIndex: number; reading: string }
  | { type: "answer-reality"; dimension: RealityDimension; answer: RealityAnswer }
  | { type: "set-details-open"; open: boolean }
  | { type: "confirm-same-name-exit" };

export function createNameAnalysisViewState(name: string): NameAnalysisViewState {
  return {
    name,
    mode: "current",
    traditionalSelections: {},
    actualReadings: {},
    realityTest: { ...DEFAULT_REALITY_TEST },
    detailsOpen: false,
    sameNameExitConfirmed: false,
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
  if (action.type === "set-details-open") {
    return state.detailsOpen === action.open ? state : { ...state, detailsOpen: action.open };
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
    requestFreshDirection: request.mode === "candidate",
    chart: request.chart,
    professionalReport: request.professionalReport,
  });
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function scoreStatus(score: NameRealityScore): string {
  if (score.totalStatus === "complete") return `${score.total} / 100`;
  if (score.totalStatus === "blocked") return "事实尚待确认，当前不形成总分";
  return "尚未完成现实验证，暂不评分";
}

function vectorText(vector: NameSemanticSummary["vector"]): string {
  if (!vector) return "已审校字义资料不足，当前不生成文化向量。";
  return ELEMENTS.map(element => `${element} ${percent(vector[element])}`).join(" · ");
}

function registeredGlyphFacts(character: NameCharacterRecord, mode: NameAnalysisMode): string {
  const facts = mode === "traditional-reference" ? character.inputTghFacts : character;
  if (!facts) return `${character.inputCodePoints.join(" ")} · 规范等级与笔画记录将在传统候选确认后单独核对`;
  const level = facts.tghLevel ? `通用规范汉字表第 ${facts.tghLevel} 级` : "8105 字核心表暂未覆盖";
  const strokes = facts.totalStrokeRecord?.rawValue ? `总笔画工程记录 ${facts.totalStrokeRecord.rawValue}` : "总笔画记录待核";
  return `${character.inputCodePoints.join(" ")} · ${level} · ${strokes}`;
}

function traditionalGlyphFacts(character: NameCharacterRecord, selectedGlyph: string): string {
  const candidate = character.variantCandidates.find(item => item.glyph === selectedGlyph);
  const codePoints = candidate?.codePoints.join(" ") || "码位待核";
  const strokes = character.totalStrokeRecord?.rawValue ? `总笔画工程记录 ${character.totalStrokeRecord.rawValue}` : "总笔画记录待核";
  return `${codePoints} · ${strokes} · 规范等级只用于现实登记字形`;
}

function NameCharacterCard({ character, index, state, onTraditionalSelection, onReadingSelection }: {
  character: NameCharacterRecord;
  index: number;
  state: NameAnalysisViewState;
  onTraditionalSelection: (characterIndex: number, glyph: string) => void;
  onReadingSelection: (characterIndex: number, reading: string) => void;
}) {
  return <article className="name-character-card">
    <header>
      <div><small>现实登记字形</small><strong>{character.inputGlyph}</strong></div>
      {state.mode === "traditional-reference" && <div><small>采用的传统参考字形</small><strong>{character.adoptedGlyph ?? "尚未采用"}</strong></div>}
    </header>
    <div className="name-glyph-facts"><p><b>现实登记字形事实</b>{registeredGlyphFacts(character, state.mode)}</p>
      {state.mode === "traditional-reference" && character.adoptedGlyph && <p><b>传统参考字形事实</b>{traditionalGlyphFacts(character, character.adoptedGlyph)}</p>}
    </div>

    {state.mode === "traditional-reference" && character.variantCandidates.length > 0 && <fieldset className="name-choice-group">
      <legend>请选择“{character.inputGlyph}”在姓名中的实际含义对应字形</legend>
      {character.variantCandidates.map(candidate => <label key={candidate.glyph}>
        <input
          checked={state.traditionalSelections[index] === candidate.glyph}
          name={`traditional-${index}`}
          onChange={() => onTraditionalSelection(index, candidate.glyph)}
          type="radio"
          value={candidate.glyph}
        />
        <span><b>{candidate.glyph}</b><small>{candidate.meaningHint}</small></span>
      </label>)}
      <small>候选默认不选择；简体实际输入与采用的传统参考字形始终并排保留。</small>
    </fieldset>}

    {character.readings.length > 1 && <fieldset className="name-choice-group name-reading-choices">
      <legend>请确认姓名中的实际读音</legend>
      {character.readings.map(reading => <label key={reading.pinyin}>
        <input
          checked={state.actualReadings[index] === reading.pinyin}
          name={`reading-${index}`}
          onChange={() => onReadingSelection(index, reading.pinyin)}
          type="radio"
          value={reading.pinyin}
        />
        <span><b>{reading.pinyin}</b><small>声调 {reading.tone} · {reading.sourceProperty}</small></span>
      </label>)}
    </fieldset>}

    <dl className="name-character-evidence">
      <div><dt>采用读音</dt><dd>{character.adoptedReading ?? "待本人确认"}</dd></div>
      <div><dt>采用义项</dt><dd>{character.meaning ?? "有限人工审校集暂未覆盖"}</dd></div>
      <div><dt>字义五行文化向量</dt><dd>{character.semantic ? vectorText(character.semantic.vector) : "待审校"}</dd></div>
      <div><dt>未知比例</dt><dd>{character.semantic ? percent(character.semantic.unknownShare) : "100%"}</dd></div>
      <div><dt>审校依据</dt><dd>{character.semantic?.basisText ?? "不从部首、笔画或规范等级补猜汉字五行。"}</dd></div>
    </dl>
    {character.analysisBlockers.map(blocker => <p className="name-pending-note" key={blocker.id}>{blocker.evidence}</p>)}
  </article>;
}

function RealityTest({ analysis, state, onRealityAnswer }: {
  analysis: NameAnalysisViewResult;
  state: NameAnalysisViewState;
  onRealityAnswer: (dimension: RealityDimension, answer: RealityAnswer) => void;
}) {
  return <section className="name-reality-test" aria-labelledby="name-reality-title">
    <header><div><small>可选 · 约 30 秒</small><h3 id="name-reality-title">姓名现实使用实测分</h3></div><strong>{scoreStatus(analysis.realityScore)}</strong></header>
    <p>只评估这个姓名方案在现实场景中的使用情况，不评价人；任一维未验证或事实被阻断时不显示总分。</p>
    <div className="name-reality-grid">
      {REALITY_DIMENSIONS.map(dimension => {
        const result = analysis.realityScore.dimensions[dimension.id];
        return <fieldset key={dimension.id}>
          <legend><b>{dimension.title}</b><small>{dimension.prompt}</small></legend>
          <div>{dimension.options.map(([value, label]) => <label key={value}>
            <input
              checked={state.realityTest[dimension.id] === value}
              name={`reality-${dimension.id}`}
              onChange={() => onRealityAnswer(dimension.id, value)}
              type="radio"
              value={value}
            />
            <span>{label}</span>
          </label>)}</div>
          <p><code>{result.ruleId}</code>{result.score === null ? "未计分" : `${result.score} 分`} · {result.reason}</p>
        </fieldset>;
      })}
    </div>
  </section>;
}

function ChartComparison({ interaction }: { interaction: NameChartInteraction | null }) {
  if (!interaction) return null;
  return <section className="name-chart-comparison" aria-labelledby="name-chart-title">
    <header><h3 id="name-chart-title">姓名文化与出生盘并排看</h3><p>两张资料卡只并排阅读，不合并计算。</p></header>
    <div>
      <article><small>姓名字义文化向量</small><p>{vectorText(interaction.nameVector)}</p></article>
      <article><small>出生盘稳定坐标</small><p>{Object.entries(interaction.input.certainPillars).map(([key, pillar]) => `${PILLAR_LABELS[key as keyof typeof PILLAR_LABELS]} ${pillar.stem}${pillar.branch}`).join(" · ") || "边界坐标仍待核"}</p></article>
    </div>
    <p>{interaction.ruleObservation}</p>
    <p>{interaction.plainLanguageScene}</p>
    <p>{interaction.action}</p>
    <aside>{interaction.boundary}</aside>
  </section>;
}

function AdviceAndDirections({ analysis, candidateMode }: {
  analysis: NameAnalysisViewResult;
  candidateMode: boolean;
}) {
  const canShowDirections = candidateMode && analysis.advice.tier === "rebuild-direction";
  return <section className="name-advice" aria-labelledby="name-advice-title">
    <header><small>建议门禁</small><h3 id="name-advice-title">{ADVICE_LABELS[analysis.advice.tier]}</h3></header>
    <p>{analysis.advice.ruleObservation}</p>
    <p>{analysis.advice.plainLanguageScene}</p>
    <p>{analysis.advice.action}</p>
    <aside>{analysis.advice.boundary}</aside>
    {candidateMode && !canShowDirections && <p className="name-pending-note">事实确认后再显示方向。</p>}
    {canShowDirections && <section className="name-directions" aria-labelledby="name-directions-title">
      <h4 id="name-directions-title">三个命名方向</h4>
      <p>示例字经过逐字审校；动态组合的完整姓名统一标为“待人工复核”。</p>
      <div>{analysis.directions.map(direction => <article key={direction.id}>
        <small>待人工复核</small><h5>{direction.title}</h5><p>{direction.plainLanguageScene}</p>
        <ul>{direction.exampleCharacters.map(example => <li key={example.glyph}><b>{example.glyph}</b>{example.meaning}</li>)}</ul>
        <p>{direction.action}</p>
      </article>)}</div>
    </section>}
  </section>;
}

function EvidenceAndSources({ analysis, sameNameExitConfirmed, onConfirmSameNameExit }: {
  analysis: NameAnalysisViewResult;
  sameNameExitConfirmed: boolean;
  onConfirmSameNameExit: () => void;
}) {
  return <details className="name-sources">
    <summary>依据与流派边界</summary>
    <div>
      <p>{analysis.boundary}</p>
      <p>{analysis.frequencyContext}</p>
      <p>传统字形参考不是现实登记字形，也不等同于康熙字形；五格／81 数理属于 20 世纪文化附录，默认关闭，不进入主分。</p>
      <ul className="name-source-links">
        <li><a href="https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/201306/t20130601_186002.html" rel="noreferrer" target="_blank">教育部《通用规范汉字表》</a><small>规范字范围与三级边界，不支持姓名吉凶或汉字五行。</small></li>
        <li><a href="https://www.moe.gov.cn/jyb_xwfb/xw_fbh/moe_2069/s7135/s7562/s7569/201308/t20130827_156343.html" rel="noreferrer" target="_blank">教育部：简繁对应与一简多繁</a><small>必须结合具体义项确认，不授权静默换写。</small></li>
        <li><a href="https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip" rel="noreferrer" target="_blank">Unicode 17.0.0 Unihan</a><small>字符工程数据，不直接证明姓名含义或五行。</small></li>
      </ul>
      <p className="name-source-ids">来源 ID：{analysis.sourceIds.join(" · ")}</p>
      <section className="same-name-exit">
        <b>官方同名查询</b><p>本产品未查询全国同名人数，也不会预填姓名。</p>
        {!sameNameExitConfirmed
          ? <button onClick={onConfirmSameNameExit} type="button">查看离站与隐私提示</button>
          : <aside role="note"><p>将离开本产品，后续登录、实名认证和信息处理由公安部平台负责；请自行判断是否继续。</p><a href="https://ywtb.mps.gov.cn/" rel="noreferrer" target="_blank">确认后前往公安部互联网政务服务平台</a></aside>}
      </section>
    </div>
  </details>;
}

export function NameAnalysisView({
  analysis,
  state,
  onDetailsOpenChange,
  onModeChange,
  onTraditionalSelection,
  onReadingSelection,
  onRealityAnswer,
  onConfirmSameNameExit,
}: {
  analysis: NameAnalysisViewResult;
  state: NameAnalysisViewState;
  onDetailsOpenChange: (open: boolean) => void;
  onModeChange: (mode: NameAnalysisMode) => void;
  onTraditionalSelection: (characterIndex: number, glyph: string) => void;
  onReadingSelection: (characterIndex: number, reading: string) => void;
  onRealityAnswer: (dimension: RealityDimension, answer: RealityAnswer) => void;
  onConfirmSameNameExit: () => void;
}) {
  return <section className="name-analysis-section" data-name-analysis="ready">
    <header className="name-analysis-summary">
      <div><small>现用姓名 · {analysis.fullNameReviewStatus}</small><h2>姓名使用与五行文化</h2><p className="name-current-glyphs">{analysis.rawInput}</p></div>
      <dl>
        <div><dt>姓名现实使用实测分</dt><dd>{scoreStatus(analysis.realityScore)}</dd></div>
        <div><dt>资料覆盖</dt><dd>字义 {analysis.semanticSummary.reviewedCount}/{analysis.semanticSummary.totalCount} · 未知占比 {percent(analysis.semanticSummary.unknownShare)}</dd></div>
      </dl>
      <div className="name-summary-translation">
        <p><b>本次观察</b>{analysis.ruleObservation}</p>
        <p><b>现实场景</b>{analysis.plainLanguageScene}</p>
      </div>
      <p className="name-first-action"><b>现在做一件事</b>{analysis.action}</p>
      <p className="name-summary-boundary"><b>阅读边界</b>{analysis.boundary}</p>
    </header>

    <details className="name-analysis-depth" onToggle={event => onDetailsOpenChange(event.currentTarget.open)} open={state.detailsOpen}>
      <summary>展开姓名事实、现实实测与文化并读</summary>
      <div className="name-analysis-depth-content">
        <section className="name-mode-section" aria-label="姓名分析口径">
          <header><h3>逐字事实与采用口径</h3><p>主口径始终保留现实登记字形；传统参考只在本人主动确认后采用。</p></header>
          <div className="name-mode-switch">
            <button aria-pressed={state.mode === "current"} onClick={() => onModeChange("current")} type="button">现用姓名</button>
            <button aria-pressed={state.mode === "traditional-reference"} onClick={() => onModeChange("traditional-reference")} type="button">传统字形参考（可选）</button>
            <button aria-pressed={state.mode === "candidate"} onClick={() => onModeChange("candidate")} type="button">新姓名方向</button>
          </div>
          <div className="name-character-grid">{analysis.characters.map((character, index) => <NameCharacterCard
            character={character}
            index={index}
            key={`${index}-${character.rawCluster}`}
            onReadingSelection={onReadingSelection}
            onTraditionalSelection={onTraditionalSelection}
            state={state}
          />)}</div>
          <aside className="name-semantic-summary"><b>字义五行文化向量</b><p>{vectorText(analysis.semanticSummary.vector)}</p><small>审校覆盖 {analysis.semanticSummary.reviewedCount}/{analysis.semanticSummary.totalCount} · 未知比例 {percent(analysis.semanticSummary.unknownShare)}。覆盖率不是分数。</small></aside>
        </section>

        <RealityTest analysis={analysis} onRealityAnswer={onRealityAnswer} state={state} />
        <ChartComparison interaction={analysis.chartInteraction} />
        <AdviceAndDirections analysis={analysis} candidateMode={state.mode === "candidate"} />
        <EvidenceAndSources analysis={analysis} onConfirmSameNameExit={onConfirmSameNameExit} sameNameExitConfirmed={state.sameNameExitConfirmed} />
      </div>
    </details>
  </section>;
}

export function NameAnalysisSection({ name, chart, report }: {
  name: string;
  chart: FourPillarsResult;
  report: ProfessionalReport;
}) {
  const [state, dispatch] = useReducer(nameAnalysisViewReducer, name, createNameAnalysisViewState);
  const requestKey = JSON.stringify([
    name,
    state.mode,
    state.traditionalSelections,
    state.actualReadings,
    state.realityTest,
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
      chart,
      professionalReport: report,
    }).then(result => {
      if (active) setLoaded({ requestKey, analysis: result, error: false });
    }).catch(() => {
      if (active) setLoaded({ requestKey, analysis: null, error: true });
    });
    return () => { active = false; };
  }, [chart, name, report, requestKey, state.actualReadings, state.mode, state.realityTest, state.traditionalSelections]);

  if (!name.trim()) return null;
  const analysis = loaded?.requestKey === requestKey ? loaded.analysis : null;
  if (loaded?.requestKey === requestKey && loaded.error) return <section className="name-analysis-loading" data-name-analysis="error" role="alert">姓名资料暂时无法载入；命盘其他内容不受影响。</section>;
  if (!analysis) return <section aria-busy="true" className="name-analysis-loading" data-name-analysis="loading"><span>正在本机核对姓名字形资料…</span></section>;

  return <NameAnalysisView
    analysis={analysis}
    onConfirmSameNameExit={() => dispatch({ type: "confirm-same-name-exit" })}
    onDetailsOpenChange={open => dispatch({ type: "set-details-open", open })}
    onModeChange={mode => dispatch({ type: "set-mode", mode })}
    onReadingSelection={(characterIndex, reading) => dispatch({ type: "select-reading", characterIndex, reading })}
    onRealityAnswer={(dimension, answer) => dispatch({ type: "answer-reality", dimension, answer })}
    onTraditionalSelection={(characterIndex, glyph) => dispatch({ type: "select-traditional", characterIndex, glyph })}
    state={state}
  />;
}
