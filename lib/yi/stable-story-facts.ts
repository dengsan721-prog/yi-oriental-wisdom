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

export type SafeStoryInterpretation = Readonly<
  Pick<
    InterpretationItem,
    | "id"
    | "domain"
    | "scenario"
    | "advantageVersion"
    | "shadowVersion"
    | "actionNow"
    | "actionLongTerm"
    | "priority"
  > & {
    pillarDependencies: readonly PillarKey[];
  }
>;

export type StableStoryFacts = {
  dayMasterElement: ElementName | null;
  structureBalance: ProfessionalChart["structureBalance"] | null;
  relations: readonly ChartRelation[];
  interpretations: readonly SafeStoryInterpretation[];
  excludedInterpretationIds: readonly string[];
  currentLesson: string | null;
  hourUnknown: boolean;
  uncertaintyFlags: readonly StableStoryUncertaintyFlag[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function projectSafeInterpretation(
  item: InterpretationItem,
): SafeStoryInterpretation {
  return {
    id: item.id,
    domain: item.domain,
    scenario: item.scenario,
    advantageVersion: item.advantageVersion,
    shadowVersion: item.shadowVersion,
    actionNow: item.actionNow,
    actionLongTerm: item.actionLongTerm,
    priority: item.priority,
    pillarDependencies: [...item.pillarDependencies],
  };
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

  const relations = ambiguousFields.has("relationSummary")
    ? []
    : report.relations
      .filter(relation =>
        relation.pillars.every(key => !ambiguousPillars.has(key)))
      .map(clone);
  const interpretations: SafeStoryInterpretation[] = [];
  const excludedInterpretationIds: string[] = [];
  for (const item of items) {
    if (item.pillarDependencies.some(key => ambiguousPillars.has(key))) {
      excludedInterpretationIds.push(item.id);
    } else {
      interpretations.push(projectSafeInterpretation(item));
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
