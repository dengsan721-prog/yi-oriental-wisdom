import { resolveReviewedNameElement } from "./name-element-data";
import type { NameCharacterRecord } from "./name-types";
import type { ElementName, FourPillarsResult } from "./types";

export const NAME_COVERAGE_SCOPE_NOTICE =
  "本趣味分只计算稳定命盘中直接显示的五行与姓名已审校用字；不计算命盘中隐藏的五行，也不用于判断姓名吉凶。" as const;

export type NameElementCoverageCount = 0 | 1 | 2 | 3 | 4 | 5;
export type NameElementCoverageScore = 0 | 20 | 40 | 60 | 80 | 100;

export type NameElementCoveragePendingReason =
  | "chart-unavailable"
  | "glyph-unconfirmed"
  | "reading-unconfirmed"
  | "meaning-unconfirmed"
  | "unreviewed-character"
  | "element-classification-pending"
  | "unsupported-input";

export type NameElementCoverageCharacter = {
  inputGlyph: string;
  adoptedGlyph: string | null;
  adoptedReading: string | null;
  adoptedMeaning: string | null;
  unsupportedInput: boolean;
};

export type NameElementCoverage =
  | {
      status: "complete";
      visibleChartElements: readonly ElementName[];
      nameElements: readonly ElementName[];
      coveredElements: readonly ElementName[];
      missingElements: readonly ElementName[];
      coveredCount: NameElementCoverageCount;
      score: NameElementCoverageScore;
      chartAlreadyComplete: boolean;
      notice: string;
      scopeNotice: typeof NAME_COVERAGE_SCOPE_NOTICE;
    }
  | {
      status: "pending";
      reasons: readonly NameElementCoveragePendingReason[];
      pendingGlyphs: readonly string[];
      notice: "资料待确认，暂不评分";
      scopeNotice: typeof NAME_COVERAGE_SCOPE_NOTICE;
    };

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const PILLARS = ["year", "month", "day", "hour"] as const;
const SCORES = [0, 20, 40, 60, 80, 100] as const;

export function toNameElementCoverageCharacters(
  characters: readonly Readonly<NameCharacterRecord>[],
): readonly NameElementCoverageCharacter[] {
  return characters.map(character => ({
    inputGlyph: character.inputGlyph,
    adoptedGlyph: character.adoptedGlyph,
    adoptedReading: character.adoptedReading,
    adoptedMeaning: character.meaning,
    unsupportedInput: character.analysisBlockers.some(
      blocker => blocker.id === "unsupported-input",
    ),
  }));
}

export function getStableVisibleChartElements(
  chart: Readonly<FourPillarsResult>,
): readonly ElementName[] {
  const found = new Set<ElementName>();
  for (const key of PILLARS) {
    const pillar = chart.pillars[key];
    if (!pillar || chart.ambiguousPillars.includes(key)) continue;
    found.add(pillar.element);
    found.add(pillar.branchElement);
  }
  return ELEMENTS.filter(element => found.has(element));
}

function coverageCount(value: number): NameElementCoverageCount {
  switch (value) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return value;
    default:
      throw new Error(`Invalid element coverage count: ${value}`);
  }
}

export function calculateNameElementCoverage(input: {
  chart: Readonly<FourPillarsResult> | null;
  characters: readonly Readonly<NameElementCoverageCharacter>[];
}): NameElementCoverage {
  const reasons: NameElementCoveragePendingReason[] = [];
  const pendingGlyphs: string[] = [];
  const nameElementSet = new Set<ElementName>();

  const addReason = (reason: NameElementCoveragePendingReason): void => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };
  const addPendingGlyph = (glyph: string): void => {
    if (!pendingGlyphs.includes(glyph)) pendingGlyphs.push(glyph);
  };

  if (input.chart === null) addReason("chart-unavailable");

  for (const character of input.characters) {
    if (character.unsupportedInput) {
      addReason("unsupported-input");
      addPendingGlyph(character.adoptedGlyph ?? character.inputGlyph);
      continue;
    }

    const resolution = resolveReviewedNameElement({
      inputGlyph: character.inputGlyph,
      adoptedGlyph: character.adoptedGlyph,
      adoptedReading: character.adoptedReading,
      adoptedMeaning: character.adoptedMeaning,
    });
    if (resolution.status === "pending") {
      addReason(resolution.reason);
      addPendingGlyph(resolution.glyph ?? character.inputGlyph);
      continue;
    }
    nameElementSet.add(resolution.record.element);
  }

  if (reasons.length > 0) {
    return {
      status: "pending",
      reasons,
      pendingGlyphs,
      notice: "资料待确认，暂不评分",
      scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
    };
  }

  const visibleChartElements = getStableVisibleChartElements(input.chart!);
  const nameElements = ELEMENTS.filter(element => nameElementSet.has(element));
  const coveredSet = new Set<ElementName>([
    ...visibleChartElements,
    ...nameElements,
  ]);
  const coveredElements = ELEMENTS.filter(element => coveredSet.has(element));
  const missingElements = ELEMENTS.filter(element => !coveredSet.has(element));
  const coveredCount = coverageCount(coveredElements.length);
  const chartAlreadyComplete = visibleChartElements.length === ELEMENTS.length;

  return {
    status: "complete",
    visibleChartElements,
    nameElements,
    coveredElements,
    missingElements,
    coveredCount,
    score: SCORES[coveredCount],
    chartAlreadyComplete,
    notice: chartAlreadyComplete
      ? "当前命盘显示的五行已经齐备，候选名字不会提高覆盖项；只看五行覆盖，不是姓名好坏"
      : "只看五行覆盖，不是姓名好坏",
    scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
  };
}
