"use client";

import {
  useEffect,
  useReducer,
  useState,
  type ReactElement,
} from "react";
import {
  getReviewedNameElementRecommendations,
  type ApprovedNameElementRecord,
} from "../../lib/yi/name-element-data";
import {
  calculateNameElementCoverage,
  NAME_COVERAGE_SCOPE_NOTICE,
  toNameElementCoverageCharacters,
  type NameElementCoverage,
  type NameElementCoverageCount,
  type NameElementCoverageScore,
} from "../../lib/yi/name-element-coverage";
import type {
  ElementName,
  FourPillarsResult,
  ProfessionalReport,
} from "../../lib/yi/types";
import {
  createNameAnalysisViewState,
  loadNameAnalysisForView,
  nameAnalysisViewReducer,
  type NameAnalysisViewResult,
} from "./NameAnalysisSection";

export type NameSectionProps = {
  name: string;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
};

export type NameCoverageRecommendations = Readonly<
  Partial<Record<ElementName, readonly ApprovedNameElementRecord[]>>
>;

export type NameCoverageCardProps = {
  label: "当前姓名" | "候选姓名";
  name: string;
  coverage: NameElementCoverage;
  recommendationsByElement: NameCoverageRecommendations;
};

export type FormattedNameCoverageScore = {
  primary: `覆盖 ${NameElementCoverageCount}/5 项`;
  secondary: `${NameElementCoverageScore}/100`;
};

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const SCORE_LABELS = [
  { primary: "覆盖 0/5 项", secondary: "0/100" },
  { primary: "覆盖 1/5 项", secondary: "20/100" },
  { primary: "覆盖 2/5 项", secondary: "40/100" },
  { primary: "覆盖 3/5 项", secondary: "60/100" },
  { primary: "覆盖 4/5 项", secondary: "80/100" },
  { primary: "覆盖 5/5 项", secondary: "100/100" },
] as const satisfies readonly FormattedNameCoverageScore[];

export function formatNameCoverageScore(
  coveredCount: NameElementCoverageCount,
): FormattedNameCoverageScore {
  return SCORE_LABELS[coveredCount];
}

export function NameCoverageCard({
  label,
  name,
  coverage,
  recommendationsByElement,
}: NameCoverageCardProps): ReactElement {
  if (coverage.status === "pending") {
    return <article className="yi-name-coverage-card yi-name-coverage-card--pending">
      <header><small>{label}</small><h3>{name}</h3></header>
      <p className="yi-name-pending">{coverage.notice}</p>
      <p className="yi-name-scope">{coverage.scopeNotice}</p>
    </article>;
  }

  const formatted = formatNameCoverageScore(coverage.coveredCount);
  return <article className="yi-name-coverage-card">
    <header>
      <div><small>{label}</small><h3>{name}</h3></div>
      <div className="yi-name-score" aria-label={formatted.primary}>
        <strong>{formatted.primary}</strong>
        <span>{formatted.secondary}</span>
      </div>
    </header>
    <div className="yi-name-meter" aria-label="五行覆盖项目">
      {ELEMENTS.map(element => {
        const covered = coverage.coveredElements.includes(element);
        return <span data-covered={covered} key={element}>
          <b>{element}</b><small>{covered ? "已覆盖" : "未覆盖"}</small>
        </span>;
      })}
    </div>
    <p className="yi-name-notice">{coverage.notice}</p>
    {coverage.missingElements.map(element => {
      const recommendations = recommendationsByElement[element]?.slice(0, 6) ?? [];
      return <section className="yi-name-recommendations" key={element}>
        <h4>还差：{element}</h4>
        {recommendations.length > 0 && <ul>
          {recommendations.map(record => <li key={record.id}>
            <strong>{record.glyph}</strong>
            <span>{record.displayPinyin}</span>
            <p>{record.adoptedMeaning}</p>
          </li>)}
        </ul>}
      </section>;
    })}
    <p className="yi-name-scope">{coverage.scopeNotice}</p>
  </article>;
}

function CandidateEntry(): ReactElement {
  return <section
    aria-label="候选姓名入口"
    className="yi-name-candidate-entry"
  >
    <h3>候选姓名</h3>
    <p>候选区已保留，当前不生成候选姓名。</p>
  </section>;
}

function ConfirmationControls({
  analysis,
  state,
  onModeChange,
  onTraditionalSelection,
  onReadingSelection,
}: {
  analysis: NameAnalysisViewResult;
  state: ReturnType<typeof createNameAnalysisViewState>;
  onModeChange: (mode: "current" | "traditional-reference") => void;
  onTraditionalSelection: (characterIndex: number, glyph: string) => void;
  onReadingSelection: (characterIndex: number, reading: string) => void;
}): ReactElement {
  return <section
    aria-label="姓名字形与读音确认"
    className="yi-name-confirmation"
  >
    <div className="yi-name-mode-switch">
      <button
        aria-pressed={state.mode === "current"}
        onClick={() => onModeChange("current")}
        type="button"
      >现用字形</button>
      <button
        aria-pressed={state.mode === "traditional-reference"}
        onClick={() => onModeChange("traditional-reference")}
        type="button"
      >传统字形参考</button>
    </div>
    <div className="yi-name-character-list">
      {analysis.characters.map((character, index) => <article key={`${index}-${character.rawCluster}`}>
        <header><small>现实登记字形</small><strong>{character.inputGlyph}</strong></header>
        {state.mode === "traditional-reference" && character.variantCandidates.length > 0 && <fieldset>
          <legend>确认采用字形</legend>
          {character.variantCandidates.map(candidate => <label key={candidate.glyph}>
            <input
              checked={state.traditionalSelections[index] === candidate.glyph}
              name={`standalone-traditional-${index}`}
              onChange={() => onTraditionalSelection(index, candidate.glyph)}
              type="radio"
              value={candidate.glyph}
            />
            <span><b>{candidate.glyph}</b><small>{candidate.meaningHint}</small></span>
          </label>)}
        </fieldset>}
        {character.readings.length > 1 && <fieldset>
          <legend>确认实际读音</legend>
          {character.readings.map(reading => <label key={reading.pinyin}>
            <input
              checked={state.actualReadings[index] === reading.pinyin}
              name={`standalone-reading-${index}`}
              onChange={() => onReadingSelection(index, reading.pinyin)}
              type="radio"
              value={reading.pinyin}
            />
            <span>{reading.pinyin}</span>
          </label>)}
        </fieldset>}
      </article>)}
    </div>
  </section>;
}

export function NameSection({
  name,
  chart,
  professionalReport,
}: NameSectionProps): ReactElement {
  const [state, dispatch] = useReducer(
    nameAnalysisViewReducer,
    name,
    createNameAnalysisViewState,
  );
  const [loaded, setLoaded] = useState<{
    requestKey: string;
    analysis: NameAnalysisViewResult | null;
    error: boolean;
  } | null>(null);
  const requestKey = JSON.stringify([
    name,
    state.mode,
    state.traditionalSelections,
    state.actualReadings,
    chart.pillars,
    chart.ambiguousPillars,
  ]);

  useEffect(() => {
    if (state.name !== name) dispatch({ type: "reset-name", name });
  }, [name, state.name]);

  useEffect(() => {
    if (!name.trim()) return;
    let active = true;
    loadNameAnalysisForView(name, {
      mode: state.mode,
      traditionalSelections: state.traditionalSelections,
      actualReadings: state.actualReadings,
      chart,
      professionalReport,
    }).then(analysis => {
      if (active) setLoaded({ requestKey, analysis, error: false });
    }).catch(() => {
      if (active) setLoaded({ requestKey, analysis: null, error: true });
    });
    return () => { active = false; };
  }, [
    chart,
    name,
    professionalReport,
    requestKey,
    state.actualReadings,
    state.mode,
    state.traditionalSelections,
  ]);

  const analysis = loaded?.requestKey === requestKey ? loaded.analysis : null;
  const coverage = analysis
    ? calculateNameElementCoverage({
        chart,
        characters: toNameElementCoverageCharacters(analysis.characters),
      })
    : null;
  const recommendationsByElement: NameCoverageRecommendations =
    coverage?.status === "complete"
      ? Object.fromEntries(coverage.missingElements.map(element => [
          element,
          getReviewedNameElementRecommendations(element).slice(0, 6),
        ]))
      : {};

  return <section className="yi-name-section">
    <header className="yi-name-section-head">
      <small>现用姓名</small>
      <h2>姓名五行齐备度</h2>
      <p>只看五行覆盖，不是姓名好坏</p>
      <p className="yi-name-scope">{NAME_COVERAGE_SCOPE_NOTICE}</p>
    </header>

    {!name.trim()
      ? <label className="yi-name-empty-input">
          <span>现用姓名</span>
          <input aria-label="输入现用姓名" defaultValue="" type="text" />
        </label>
      : <>
          {loaded?.requestKey === requestKey && loaded.error
            ? <p className="yi-name-pending" role="alert">姓名资料暂时无法载入。</p>
            : analysis
              ? <>
                  <ConfirmationControls
                    analysis={analysis}
                    onModeChange={mode => dispatch({ type: "set-mode", mode })}
                    onReadingSelection={(characterIndex, reading) => dispatch({
                      type: "select-reading",
                      characterIndex,
                      reading,
                    })}
                    onTraditionalSelection={(characterIndex, glyph) => dispatch({
                      type: "select-traditional",
                      characterIndex,
                      glyph,
                    })}
                    state={state}
                  />
                  <NameCoverageCard
                    coverage={coverage!}
                    label="当前姓名"
                    name={analysis.rawInput}
                    recommendationsByElement={recommendationsByElement}
                  />
                </>
              : <p aria-busy="true" className="yi-name-pending">正在核对姓名资料…</p>}
        </>}
    <CandidateEntry />
  </section>;
}
