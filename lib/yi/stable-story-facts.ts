import type {
  ChartRelation,
  ElementName,
  FourPillarsResult,
  InterpretationItem,
  PillarKey,
  ProfessionalChart,
  ProfessionalReport,
} from "./types";

export type StableStoryUncertaintyFlag =
  | "unknown-hour"
  | "candidate-pillar-excluded"
  | "candidate-professional-field-excluded";

export type StableStoryFacts = {
  dayMasterElement: ElementName | null;
  structureBalance: ProfessionalChart["structureBalance"] | null;
  relations: readonly ChartRelation[];
  interpretations: readonly InterpretationItem[];
  excludedInterpretationIds: readonly string[];
  currentLesson: string | null;
  hourUnknown: boolean;
  uncertaintyFlags: readonly StableStoryUncertaintyFlag[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

export function selectStableStoryFacts(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
  items: readonly InterpretationItem[],
): StableStoryFacts {
  const ambiguousPillars = new Set<PillarKey>(chart.ambiguousPillars);
  const ambiguousFields = new Set(chart.professional.ambiguousFields);
  const dayAmbiguous = ambiguousPillars.has("day")
    || ambiguousFields.has("dayMaster")
    || ambiguousFields.has("dayPillar");
  const hourUnknown = chart.pillars.hour === null
    || ambiguousPillars.has("hour");
  const nonHourPillarAmbiguous = [...ambiguousPillars]
    .some(key => key !== "hour");

  const relations = report.relations
    .filter(relation =>
      relation.pillars.every(key => !ambiguousPillars.has(key)))
    .map(clone);
  const interpretations: InterpretationItem[] = [];
  const excludedInterpretationIds: string[] = [];
  for (const item of items) {
    if (item.pillarDependencies.some(key => ambiguousPillars.has(key))) {
      excludedInterpretationIds.push(item.id);
    } else {
      interpretations.push(clone(item));
    }
  }

  const uncertaintyFlags: StableStoryUncertaintyFlag[] = [];
  if (hourUnknown) uncertaintyFlags.push("unknown-hour");
  if (nonHourPillarAmbiguous) {
    uncertaintyFlags.push("candidate-pillar-excluded");
  }
  if (ambiguousFields.size > 0) {
    uncertaintyFlags.push("candidate-professional-field-excluded");
  }

  return deepFreeze({
    dayMasterElement: dayAmbiguous
      ? null
      : chart.professional.dayMaster.element,
    structureBalance: ambiguousFields.has("structureBalance")
      ? null
      : chart.professional.structureBalance,
    relations,
    interpretations,
    excludedInterpretationIds: [...excludedInterpretationIds],
    currentLesson: ambiguousFields.size === 0 && !nonHourPillarAmbiguous
      ? report.currentLesson
      : null,
    hourUnknown,
    uncertaintyFlags,
  });
}
