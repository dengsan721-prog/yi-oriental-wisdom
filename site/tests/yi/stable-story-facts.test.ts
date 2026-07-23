import { describe, expect, expectTypeOf, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import {
  selectStableStoryFacts,
  type SafeStoryInterpretation,
} from "../../lib/yi/stable-story-facts";
import type { BirthInput, PillarKey } from "../../lib/yi/types";

const exactBirth: BirthInput = {
  name: "林岚",
  date: "1990-06-15",
  time: "09:30",
  location: "北京市",
  gender: "female",
  timeConfidence: "exact",
};

function fixture(birth: BirthInput) {
  const chart = calculateFourPillars(birth);
  const report = buildProfessionalReport(chart, birth);
  const items = buildInterpretations(chart);
  return { chart, report, items };
}

describe("selectStableStoryFacts", () => {
  it("projects interpretations to the explicit safe-story whitelist", () => {
    const { chart, report, items } = fixture(exactBirth);
    const poisonedChart = structuredClone(chart);
    const poisonedReport = structuredClone(report);
    const poisonedItems = structuredClone(items);
    const sentinel = "专业候选字段不得进入故事网关";
    poisonedChart.professional.ambiguousFields = ["structureBalance"];
    poisonedChart.professional.structureBalance = sentinel as never;
    poisonedReport.currentLesson = sentinel;
    for (const item of poisonedItems) {
      item.professionalTitle = sentinel;
      item.innovationTitle = sentinel;
      item.basis = sentinel;
      item.traditionalJudgment = sentinel;
      item.plainLanguage = sentinel;
      item.mirror = sentinel;
      item.action = sentinel;
      item.caution = sentinel;
      item.confidence = sentinel as never;
      item.sourceTradition = sentinel;
      item.sourceReferences = [sentinel];
      item.sourceRuleIds = [sentinel];
    }

    const facts = selectStableStoryFacts(
      poisonedChart,
      poisonedReport,
      poisonedItems,
    );
    const safeKeys: Array<keyof SafeStoryInterpretation> = [
      "id",
      "domain",
      "scenario",
      "advantageVersion",
      "shadowVersion",
      "actionNow",
      "actionLongTerm",
      "priority",
      "pillarDependencies",
    ];

    expect(JSON.stringify(facts)).not.toContain(sentinel);
    for (const item of facts.interpretations) {
      expect(Object.keys(item).sort()).toEqual([...safeKeys].sort());
      expectTypeOf(item).toEqualTypeOf<SafeStoryInterpretation>();
    }
  });

  it("projects the exact stable field paths without changing their order", () => {
    const { chart, report, items } = fixture(exactBirth);
    const facts = selectStableStoryFacts(chart, report, items);

    expect(facts).toMatchObject({
      dayMasterElement: chart.professional.dayMaster.element,
      structureBalance: chart.professional.structureBalance,
      currentLesson: report.currentLesson,
      hourUnknown: false,
      uncertaintyFlags: [],
    });
    expect(facts.relations).toEqual(report.relations);
    expect(facts.interpretations.map(item => item.id))
      .toEqual(items.map(item => item.id));
    expect(facts.excludedInterpretationIds).toEqual([]);
  });

  it("excludes hour-dependent items and adds only the natural unknown-hour flag", () => {
    const unknownBirth = {
      ...exactBirth,
      time: null,
      timeConfidence: "unknown" as const,
    };
    const { chart, report, items } = fixture(unknownBirth);
    const facts = selectStableStoryFacts(chart, report, items);
    const excluded = items
      .filter(item => item.pillarDependencies.includes("hour"))
      .map(item => item.id);

    expect(facts.hourUnknown).toBe(true);
    expect(facts.interpretations.every(item =>
      !item.pillarDependencies.includes("hour"))).toBe(true);
    expect(facts.excludedInterpretationIds).toEqual(excluded);
    expect(facts.uncertaintyFlags).toEqual(["unknown-hour"]);
  });

  it("never exposes representative day, structure, relation, or lesson values", () => {
    const { chart, report, items } = fixture(exactBirth);
    const candidateChart = structuredClone(chart);
    candidateChart.ambiguousPillars = ["day"];
    candidateChart.professional.ambiguousFields = [
      "dayMaster",
      "dayPillar",
      "structureBalance",
      "relationSummary",
    ];
    const candidateReport = structuredClone(report);
    candidateReport.currentLesson = "候选课题不应采用";
    candidateReport.relations = [
      ...candidateReport.relations,
      {
        type: "branch-clash",
        pillars: ["day", "month"],
        symbols: ["候", "选"],
        label: "候选关系不应采用",
      },
    ];

    const facts = selectStableStoryFacts(
      candidateChart,
      candidateReport,
      items,
    );

    expect(facts.dayMasterElement).toBeNull();
    expect(facts.structureBalance).toBeNull();
    expect(facts.currentLesson).toBeNull();
    expect(facts.relations.every(relation =>
      !relation.pillars.includes("day"))).toBe(true);
    expect(facts.interpretations.every(item =>
      !item.pillarDependencies.includes("day"))).toBe(true);
    expect(facts.excludedInterpretationIds).toEqual(
      items.filter(item => item.pillarDependencies.includes("day"))
        .map(item => item.id),
    );
    expect(facts.uncertaintyFlags).toEqual([
      "candidate-pillar-excluded",
      "candidate-professional-field-excluded",
    ]);
  });

  it("drops every report relation when relationSummary alone is ambiguous", () => {
    const { chart, report, items } = fixture(exactBirth);
    const candidateChart = structuredClone(chart);
    const candidateReport = structuredClone(report);
    const sentinel = "候选关系摘要不得进入稳定事实";
    candidateChart.ambiguousPillars = [];
    candidateChart.professional.ambiguousFields = ["relationSummary"];
    candidateChart.professional.relations = [{
      type: "branch-clash",
      pillars: ["year", "month"],
      symbols: [sentinel, sentinel],
      label: sentinel,
    }];
    candidateReport.relations = [{
      type: "branch-clash",
      pillars: ["year", "month"],
      symbols: [sentinel, sentinel],
      label: sentinel,
    }];

    const facts = selectStableStoryFacts(
      candidateChart,
      candidateReport,
      items,
    );

    expect(facts.relations).toEqual([]);
    expect(JSON.stringify(facts)).not.toContain(sentinel);
    expect(facts.uncertaintyFlags)
      .toContain("candidate-professional-field-excluded");
  });

  it("uses report relations, then removes every relation touching a candidate pillar", () => {
    const { chart, report, items } = fixture(exactBirth);
    const candidateChart = structuredClone(chart);
    candidateChart.ambiguousPillars = ["month"];
    const candidateReport = structuredClone(report);
    candidateReport.relations = [
      {
        type: "branch-combination",
        pillars: ["year", "day"],
        symbols: ["子", "丑"],
        label: "稳定关系",
      },
      {
        type: "branch-clash",
        pillars: ["month", "day"],
        symbols: ["子", "午"],
        label: "候选关系",
      },
    ];

    const facts = selectStableStoryFacts(
      candidateChart,
      candidateReport,
      items,
    );

    expect(facts.relations.map(relation => relation.label))
      .toEqual(["稳定关系"]);
  });

  it("returns deeply frozen copies and leaves every input unchanged and unfrozen", () => {
    const { chart, report, items } = fixture(exactBirth);
    const before = JSON.stringify({ chart, report, items });
    const facts = selectStableStoryFacts(chart, report, items);

    expect(JSON.stringify({ chart, report, items })).toBe(before);
    expect(Object.isFrozen(chart)).toBe(false);
    expect(Object.isFrozen(report)).toBe(false);
    expect(Object.isFrozen(items[0])).toBe(false);
    expect(Object.isFrozen(facts)).toBe(true);
    expect(Object.isFrozen(facts.relations)).toBe(true);
    expect(Object.isFrozen(facts.interpretations)).toBe(true);
    expect(Object.isFrozen(facts.interpretations[0])).toBe(true);
    expect(Object.isFrozen(facts.uncertaintyFlags)).toBe(true);
  });

  it("keeps excluded interpretation ids in input order for a boundary fixture", () => {
    const birth = {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown" as const,
      gender: "unspecified" as const,
    };
    const { chart, report, items } = fixture(birth);
    const facts = selectStableStoryFacts(chart, report, items);
    const ambiguous = new Set<PillarKey>(chart.ambiguousPillars);

    expect(chart.ambiguousPillars).toEqual(
      expect.arrayContaining(["year", "month", "hour"]),
    );
    expect(facts.excludedInterpretationIds).toEqual(
      items.filter(item =>
        item.pillarDependencies.some(key => ambiguous.has(key)))
        .map(item => item.id),
    );
    expect(facts.currentLesson).toBeNull();
    expect(facts.uncertaintyFlags).toEqual([
      "unknown-hour",
      "candidate-pillar-excluded",
      "candidate-professional-field-excluded",
    ]);
  });
});
