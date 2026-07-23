"use client";

import {
  useEffect,
  useReducer,
  useRef,
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
import type { NameSurname } from "../../lib/yi/name-types";
import {
  createNameAnalysisViewState,
  loadNameAnalysisForView,
  nameAnalysisViewReducer,
  type NameAnalysisRequest,
  type NameAnalysisViewResult,
  type NameAnalysisViewState,
} from "./NameAnalysisSection";

export type NameSectionProps = {
  name: string;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
};

export type CandidateNameComposition =
  | {
      status: "ready";
      fullName: string;
      inputKind: "given-name" | "full-name";
      fixedSurname: string | null;
    }
  | {
      status: "invalid";
      reason: "empty-input";
    };

export type LatestNameRequestGuard = {
  begin(): number;
  isCurrent(requestId: number): boolean;
  invalidate(): void;
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

export type NameCandidateComparisonProps = {
  current: NameCoverageCardProps;
  candidate: NameCoverageCardProps | null;
  fixedSurname: string | null;
  candidateInput?: string;
  candidateFullName?: string | null;
  candidateStatus?: "idle" | "loading" | "ready" | "error";
  onCandidateInputChange?: (value: string) => void;
};

export type FormattedNameCoverageScore = {
  primary: `覆盖 ${NameElementCoverageCount}/5 项`;
  secondary: `${NameElementCoverageScore}/100`;
};

export type NameSectionLoadState = {
  requestKey: string;
  status: "loading" | "ready" | "error";
  analysis: NameAnalysisViewResult | null;
};

export type NameSectionLoadAction =
  | { type: "start"; requestKey: string }
  | {
      type: "resolve";
      requestKey: string;
      analysis: NameAnalysisViewResult | null;
      error: boolean;
    };

type CandidateLoadState = {
  status: "idle" | "loading" | "ready" | "error";
  ownerKey: string;
  fullName: string | null;
  analysis: NameAnalysisViewResult | null;
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

export function composeCandidateFullName(input: {
  currentSurname: Readonly<NameSurname> | null;
  candidateInput: string;
}): CandidateNameComposition {
  const candidateInput = input.candidateInput.trim();
  if (!candidateInput) return { status: "invalid", reason: "empty-input" };

  if (
    input.currentSurname?.kind === "single"
    || input.currentSurname?.kind === "compound"
  ) {
    return {
      status: "ready",
      fullName: `${input.currentSurname.value}${candidateInput}`,
      inputKind: "given-name",
      fixedSurname: input.currentSurname.value,
    };
  }

  return {
    status: "ready",
    fullName: candidateInput,
    inputKind: "full-name",
    fixedSurname: null,
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record).sort().map(key => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

export function createNameSectionOwnerKey(input: {
  name: string;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
}): string {
  return JSON.stringify(canonicalize(input));
}

export function createLatestNameRequestGuard(): LatestNameRequestGuard {
  let latestRequestId = 0;
  return {
    begin() {
      latestRequestId += 1;
      return latestRequestId;
    },
    isCurrent(requestId) {
      return requestId === latestRequestId;
    },
    invalidate() {
      latestRequestId += 1;
    },
  };
}

export async function runLatestNameRequest<T>(input: {
  guard: LatestNameRequestGuard;
  load: () => Promise<T>;
  apply: (value: T) => void;
}): Promise<"applied" | "stale"> {
  const requestId = input.guard.begin();
  const value = await input.load();
  if (!input.guard.isCurrent(requestId)) return "stale";
  input.apply(value);
  return "applied";
}

export function buildCandidateAnalysisRequest(input: {
  viewState: Readonly<NameAnalysisViewState>;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
}): Partial<NameAnalysisRequest> {
  return {
    mode: input.viewState.mode === "traditional-reference"
      ? "traditional-reference"
      : "candidate",
    traditionalSelections: input.viewState.traditionalSelections,
    actualReadings: input.viewState.actualReadings,
    requestFreshDirection: true,
    chart: input.chart,
    professionalReport: input.professionalReport,
  };
}

export function formatNameCoverageScore(
  coveredCount: NameElementCoverageCount,
): FormattedNameCoverageScore {
  return SCORE_LABELS[coveredCount];
}

export function nameSectionLoadReducer(
  state: NameSectionLoadState | null,
  action: NameSectionLoadAction,
): NameSectionLoadState {
  if (action.type === "start") {
    return {
      requestKey: action.requestKey,
      status: "loading",
      analysis: null,
    };
  }
  if (state?.requestKey !== action.requestKey) return state ?? {
    requestKey: action.requestKey,
    status: "loading",
    analysis: null,
  };
  return {
    requestKey: action.requestKey,
    status: action.error ? "error" : "ready",
    analysis: action.analysis,
  };
}

export function getCurrentNameLoadStatus(
  state: NameSectionLoadState | null,
  requestKey: string,
): NameSectionLoadState["status"] {
  return state?.requestKey === requestKey ? state.status : "loading";
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

export function NameCandidateComparison({
  current,
  candidate,
  fixedSurname,
  candidateInput = "",
  candidateFullName = null,
  candidateStatus = candidate ? "ready" : "idle",
  onCandidateInputChange,
}: NameCandidateComparisonProps): ReactElement {
  return <section
    aria-label="候选姓名入口"
    className="yi-name-candidate-entry"
  >
    <h3>候选姓名</h3>
    <CandidateNameInput
      candidateInput={candidateInput}
      fixedSurname={fixedSurname}
      onCandidateInputChange={onCandidateInputChange}
    />
    <div className="yi-name-character-list">
      <section data-name-role="current">
        <h3>当前姓名：{current.name}</h3>
        <NameCoverageCard {...current} />
      </section>
      {candidateStatus === "loading"
        ? <p aria-busy="true" className="yi-name-pending">
            正在更新候选姓名：{candidateFullName ?? ""}
          </p>
        : candidateStatus === "error"
          ? <p className="yi-name-pending" role="alert">候选姓名资料暂时无法载入。</p>
          : candidate && <section data-name-role="candidate">
              <h3>候选姓名：{candidate.name}</h3>
              <NameCoverageCard {...candidate} />
            </section>}
    </div>
  </section>;
}

function CandidateNameInput({
  candidateInput,
  fixedSurname,
  onCandidateInputChange,
}: {
  candidateInput: string;
  fixedSurname: string | null;
  onCandidateInputChange?: (value: string) => void;
}): ReactElement {
  const inputLabel = fixedSurname
    ? "候选名（不含姓氏）"
    : "候选完整姓名";
  return <>
    {fixedSurname && <p>保留姓氏：{fixedSurname}</p>}
    <label className="yi-name-empty-input">
      <span>{inputLabel}</span>
      <input
        aria-label={inputLabel}
        onChange={event => onCandidateInputChange?.(event.currentTarget.value)}
        type="text"
        value={candidateInput}
      />
    </label>
  </>;
}

export function NameConfirmationControls({
  analysis,
  state,
  groupPrefix,
  onModeChange,
  onTraditionalSelection,
  onReadingSelection,
}: {
  analysis: NameAnalysisViewResult;
  state: ReturnType<typeof createNameAnalysisViewState>;
  groupPrefix: "current" | "candidate";
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
              name={`${groupPrefix}-traditional-${index}`}
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
              name={`${groupPrefix}-reading-${index}`}
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

function coverageCardProps(
  analysis: NameAnalysisViewResult,
  chart: Readonly<FourPillarsResult>,
  label: NameCoverageCardProps["label"],
): NameCoverageCardProps {
  const coverage = calculateNameElementCoverage({
    chart,
    characters: toNameElementCoverageCharacters(analysis.characters),
  });
  const recommendationsByElement: NameCoverageRecommendations =
    coverage.status === "complete"
      ? Object.fromEntries(coverage.missingElements.map(element => [
          element,
          getReviewedNameElementRecommendations(element).slice(0, 6),
        ]))
      : {};
  return {
    label,
    name: analysis.rawInput,
    coverage,
    recommendationsByElement,
  };
}

export function CurrentNameContent({
  analysis,
  chart,
  state,
  onModeChange,
  onTraditionalSelection,
  onReadingSelection,
  showCoverageCard = true,
}: {
  analysis: NameAnalysisViewResult;
  chart: Readonly<FourPillarsResult>;
  state: ReturnType<typeof createNameAnalysisViewState>;
  onModeChange: (mode: "current" | "traditional-reference") => void;
  onTraditionalSelection: (characterIndex: number, glyph: string) => void;
  onReadingSelection: (characterIndex: number, reading: string) => void;
  showCoverageCard?: boolean;
}): ReactElement {
  const currentCard = coverageCardProps(analysis, chart, "当前姓名");

  return <>
    <NameConfirmationControls
      analysis={analysis}
      groupPrefix="current"
      onModeChange={onModeChange}
      onReadingSelection={onReadingSelection}
      onTraditionalSelection={onTraditionalSelection}
      state={state}
    />
    {showCoverageCard && <NameCoverageCard {...currentCard} />}
  </>;
}

export function NameSection({
  name,
  chart,
  professionalReport,
}: NameSectionProps): ReactElement {
  const ownerKey = createNameSectionOwnerKey({
    name,
    chart,
    professionalReport,
  });
  const [state, dispatch] = useReducer(
    nameAnalysisViewReducer,
    name,
    createNameAnalysisViewState,
  );
  const [loaded, dispatchLoad] = useReducer(nameSectionLoadReducer, null);
  const [candidateInput, setCandidateInput] = useState("");
  const [candidateState, setCandidateState] = useState(
    () => createNameAnalysisViewState(""),
  );
  const [candidateLoad, setCandidateLoad] = useState<CandidateLoadState>({
    status: "idle",
    ownerKey,
    fullName: null,
    analysis: null,
  });
  const candidateGuard = useRef(createLatestNameRequestGuard());
  const requestKey = JSON.stringify([
    name,
    state.mode,
    state.traditionalSelections,
    state.actualReadings,
    chart.pillars,
    chart.ambiguousPillars,
  ]);

  useEffect(() => {
    const guard = candidateGuard.current;
    let active = true;
    guard.invalidate();
    queueMicrotask(() => {
      if (!active) return;
      setCandidateInput("");
      setCandidateState(createNameAnalysisViewState(""));
      setCandidateLoad({
        status: "idle",
        ownerKey,
        fullName: null,
        analysis: null,
      });
    });
    return () => {
      active = false;
      guard.invalidate();
    };
  }, [ownerKey]);

  useEffect(() => {
    if (state.name !== name) dispatch({ type: "reset-name", name });
  }, [name, state.name]);

  useEffect(() => {
    if (!name.trim()) return;
    let active = true;
    dispatchLoad({ type: "start", requestKey });
    loadNameAnalysisForView(name, {
      mode: state.mode,
      traditionalSelections: state.traditionalSelections,
      actualReadings: state.actualReadings,
      chart,
      professionalReport,
    }).then(analysis => {
      if (active) dispatchLoad({
        type: "resolve",
        requestKey,
        analysis,
        error: false,
      });
    }).catch(() => {
      if (active) dispatchLoad({
        type: "resolve",
        requestKey,
        analysis: null,
        error: true,
      });
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

  const loadStatus = getCurrentNameLoadStatus(loaded, requestKey);
  const analysis = loadStatus === "ready" ? loaded?.analysis ?? null : null;
  const startCandidateRequest = (
    fullName: string,
    viewState: NameAnalysisViewState,
  ): void => {
    const request = buildCandidateAnalysisRequest({
      viewState,
      chart,
      professionalReport,
    });
    setCandidateLoad({
      status: "loading",
      ownerKey,
      fullName,
      analysis: null,
    });
    void runLatestNameRequest({
      guard: candidateGuard.current,
      load: async () => {
        try {
          return {
            analysis: await loadNameAnalysisForView(fullName, request),
            error: false,
          };
        } catch {
          return { analysis: null, error: true };
        }
      },
      apply: result => setCandidateLoad({
        status: result.error ? "error" : "ready",
        ownerKey,
        fullName,
        analysis: result.analysis,
      }),
    });
  };
  const handleCandidateInputChange = (value: string): void => {
    candidateGuard.current.invalidate();
    setCandidateInput(value);
    const composition = composeCandidateFullName({
      currentSurname: analysis?.surname ?? null,
      candidateInput: value,
    });
    if (composition.status === "invalid") {
      setCandidateState(createNameAnalysisViewState(""));
      setCandidateLoad({
        status: "idle",
        ownerKey,
        fullName: null,
        analysis: null,
      });
      return;
    }
    const nextCandidateState = createNameAnalysisViewState(
      composition.fullName,
    );
    setCandidateState(nextCandidateState);
    startCandidateRequest(composition.fullName, nextCandidateState);
  };
  const updateCandidateState = (nextState: NameAnalysisViewState): void => {
    candidateGuard.current.invalidate();
    setCandidateState(nextState);
    if (nextState.name) startCandidateRequest(nextState.name, nextState);
  };
  const currentCard = analysis
    ? coverageCardProps(analysis, chart, "当前姓名")
    : null;
  const candidateLoadForOwner = candidateLoad.ownerKey === ownerKey
    ? candidateLoad
    : {
        status: "idle" as const,
        ownerKey,
        fullName: null,
        analysis: null,
      };
  const candidateInputForOwner = candidateLoad.ownerKey === ownerKey
    ? candidateInput
    : "";
  const candidateCard = candidateLoadForOwner.status === "ready"
    && candidateLoadForOwner.analysis
    ? coverageCardProps(candidateLoadForOwner.analysis, chart, "候选姓名")
    : null;
  const fixedSurname = analysis?.surname.kind === "single"
    || analysis?.surname.kind === "compound"
    ? analysis.surname.value
    : null;

  return <section className="yi-name-section">
    <header className="yi-name-section-head">
      <small>现用姓名</small>
      <h2>姓名五行齐备度</h2>
      <p>只看五行覆盖，不是姓名好坏</p>
      <p className="yi-name-scope">{NAME_COVERAGE_SCOPE_NOTICE}</p>
    </header>

    {!name.trim()
      ? <>
          <label className="yi-name-empty-input">
            <span>现用姓名</span>
            <input aria-label="输入现用姓名" defaultValue="" type="text" />
          </label>
          <section
            aria-label="候选姓名入口"
            className="yi-name-candidate-entry"
          >
            <h3>候选姓名</h3>
            <CandidateNameInput
              candidateInput={candidateInputForOwner}
              fixedSurname={null}
              onCandidateInputChange={handleCandidateInputChange}
            />
            {candidateLoadForOwner.status === "loading"
              ? <p aria-busy="true" className="yi-name-pending">
                  正在更新候选姓名：{candidateLoadForOwner.fullName ?? ""}
                </p>
              : candidateLoadForOwner.status === "error"
                ? <p className="yi-name-pending" role="alert">
                    候选姓名资料暂时无法载入。
                  </p>
                : candidateCard && <NameCoverageCard {...candidateCard} />}
          </section>
        </>
      : <>
          {loadStatus === "error"
            ? <p className="yi-name-pending" role="alert">姓名资料暂时无法载入。</p>
            : analysis && currentCard
              ? <CurrentNameContent
                  analysis={analysis}
                  chart={chart}
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
                  showCoverageCard={false}
                  state={state}
                />
              : <p aria-busy="true" className="yi-name-pending">正在核对姓名资料…</p>}
          {!analysis && <section
            aria-label="候选姓名入口"
            className="yi-name-candidate-entry"
          >
            <h3>候选姓名</h3>
            <p>当前姓名核对完成后可比较候选姓名。</p>
          </section>}
          {analysis && currentCard && <>
            <NameCandidateComparison
              candidate={candidateCard}
              candidateFullName={candidateLoadForOwner.fullName}
              candidateInput={candidateInputForOwner}
              candidateStatus={candidateLoadForOwner.status}
              current={currentCard}
              fixedSurname={fixedSurname}
              onCandidateInputChange={handleCandidateInputChange}
            />
            {candidateLoadForOwner.status === "ready"
              && candidateLoadForOwner.analysis
              && <section aria-label="候选姓名字形与读音确认">
                <NameConfirmationControls
                  analysis={candidateLoadForOwner.analysis}
                  groupPrefix="candidate"
                  onModeChange={mode => updateCandidateState(
                    nameAnalysisViewReducer(candidateState, {
                      type: "set-mode",
                      mode,
                    }),
                  )}
                  onReadingSelection={(characterIndex, reading) =>
                    updateCandidateState(nameAnalysisViewReducer(
                      candidateState,
                      {
                        type: "select-reading",
                        characterIndex,
                        reading,
                      },
                    ))}
                  onTraditionalSelection={(characterIndex, glyph) =>
                    updateCandidateState(nameAnalysisViewReducer(
                      candidateState,
                      {
                        type: "select-traditional",
                        characterIndex,
                        glyph,
                      },
                    ))}
                  state={candidateState}
                />
              </section>}
          </>}
        </>}
  </section>;
}
