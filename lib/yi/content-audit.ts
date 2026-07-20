import { ANIMAL_MIRRORS } from "./animal-mirrors";
import { calculateCompatibility, type RelationshipType } from "./compatibility";
import { CONSTELLATIONS, ZODIAC_SIGNS } from "./constellations";
import { buildFortuneTimeline } from "./fortune";
import { calculateFourPillars } from "./four-pillars";
import { HISTORICAL_MIRRORS } from "./historical-mirrors";
import { buildInterpretations, buildProfessionalOverview } from "./interpretation";
import { matchLifeMirrors, type MirrorCandidate } from "./mirrors";
import { MOVIE_CHARACTERS, type MovieCharacterRecord } from "./movie-characters";
import { getAllSources } from "./source-audit";
import { getAtlasGroups, type AtlasMethodId, type AtlasOption } from "./traditional-atlas";
import type { BirthInput, FourPillarsResult, InterpretationItem } from "./types";
import { buildZodiacMirror } from "./zodiac-mirror";
import { ZODIAC_PROFILES } from "./zodiac-profiles";

export type ContentAuditIssue = {
  module: string;
  itemId: string;
  rule: "missing" | "too-short" | "forbidden" | "duplicate" | "missing-source" | "certainty";
  field: string;
};

export type AuditableContentItem = {
  module: string;
  itemId: string;
  fields: Record<string, string>;
  sourceIds: readonly string[];
  boundary: string;
  scenario?: string;
  action?: string;
  unknownHour?: boolean;
  sourceIdsAreRegistry?: boolean;
};

const FORBIDDEN = [
  "功能入口", "资源接口", "社会接口", "能量端口", "底层模型", "高维链接",
  "注定", "必然破财", "克夫", "克妻", "疾病诊断", "寿命已定",
] as const;

const CERTAIN_HOUR_PATTERNS = [
  /(?:时柱|时干|时支)(?:为|是)[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/,
  /(?:子女|晚年|晚景)(?:会|将|必|一定|注定)/,
] as const;

const EXPECTED_INTERPRETATION_IDS = [
  "self-day-master", "self-support", "self-interface",
  "talent-public", "talent-hidden", "talent-output",
  "career-role", "career-pressure", "career-environment",
  "wealth-structure", "wealth-risk", "wealth-boundary",
  "relationship-day-branch", "relationship-trigger", "relationship-repair",
  "family-year", "family-resource", "family-boundary",
  "rhythm-climate", "rhythm-recovery", "rhythm-decision",
] as const;

const EXPECTED_DOMAINS = ["self", "talent", "career", "wealth", "relationship", "family", "rhythm"] as const;
const RELATIONSHIPS: RelationshipType[] = ["partner", "parent-child", "business", "friend"];
const COMPATIBILITY_SOURCE_IDS = ["ten-god.hidden-stems.v1", "relation.gan-zhi.v1", "domain.mapping.v2"];
const FORTUNE_SOURCE_IDS = ["calendar.eight-char.v1", "ten-god.hidden-stems.v1", "relation.gan-zhi.v1"];

const FIXTURES: Array<{ id: "male" | "female" | "unknown-time"; birth: BirthInput }> = [
  {
    id: "male",
    birth: { name: "顾临川", date: "1985-02-20", time: "23:40", location: "成都", gender: "male", timeConfidence: "exact" },
  },
  {
    id: "female",
    birth: { name: "林知远", date: "1978-12-05", time: "06:20", location: "上海", gender: "female", timeConfidence: "exact" },
  },
  {
    id: "unknown-time",
    birth: { name: "周未央", date: "1992-11-03", time: null, location: "北京", gender: "unspecified", timeConfidence: "unknown" },
  },
];

function issue(
  module: string,
  itemId: string,
  rule: ContentAuditIssue["rule"],
  field: string,
): ContentAuditIssue {
  return { module, itemId, rule, field };
}

export function auditContentItems(items: readonly AuditableContentItem[]): ContentAuditIssue[] {
  const issues: ContentAuditIssue[] = [];
  const knownSourceIds = new Set(getAllSources().map(source => source.id));
  const seen = new Map<string, string>();

  for (const item of items) {
    const textFields = {
      ...item.fields,
      boundary: item.boundary,
      ...(item.scenario === undefined ? {} : { scenario: item.scenario }),
      ...(item.action === undefined ? {} : { action: item.action }),
    };
    for (const [field, value] of Object.entries(textFields)) {
      const text = value.trim();
      if (!text) {
        issues.push(issue(item.module, item.itemId, "missing", field));
        continue;
      }
      if (text.length < 12) issues.push(issue(item.module, item.itemId, "too-short", field));
      if (FORBIDDEN.some(term => text.includes(term))) {
        issues.push(issue(item.module, item.itemId, "forbidden", field));
      }
      if (item.unknownHour && CERTAIN_HOUR_PATTERNS.some(pattern => pattern.test(text))) {
        issues.push(issue(item.module, item.itemId, "certainty", field));
      }
    }

    if (!item.sourceIds.length) {
      issues.push(issue(item.module, item.itemId, "missing-source", "sourceIds"));
    } else if (item.sourceIdsAreRegistry !== false && item.sourceIds.some(id => !knownSourceIds.has(id))) {
      issues.push(issue(item.module, item.itemId, "missing-source", "sourceIds"));
    } else if (item.sourceIds.some(id => !id.trim())) {
      issues.push(issue(item.module, item.itemId, "missing-source", "sourceIds"));
    }

    for (const field of ["scenario", "action"] as const) {
      const value = item[field]?.trim();
      if (!value) continue;
      const key = `${item.module}\u0000${field}\u0000${value}`;
      if (seen.has(key)) issues.push(issue(item.module, item.itemId, "duplicate", field));
      else seen.set(key, item.itemId);
    }
  }

  return issues;
}

function requireCount(
  issues: ContentAuditIssue[],
  module: string,
  itemId: string,
  field: string,
  actual: number,
  expected: number,
) {
  if (actual === expected) return;
  issues.push(issue(module, itemId, actual > expected ? "duplicate" : "missing", `${field}:${actual}/${expected}`));
}

function requireExactIds(
  issues: ContentAuditIssue[],
  module: string,
  actual: readonly string[],
  expected: readonly string[],
) {
  for (const id of expected.filter(id => !actual.includes(id))) issues.push(issue(module, id, "missing", "id"));
  for (const id of actual.filter((id, index) => !expected.includes(id) || actual.indexOf(id) !== index)) {
    issues.push(issue(module, id, "duplicate", "id"));
  }
}

function interpretationItem(
  fixtureId: string,
  item: InterpretationItem,
  unknownHour: boolean,
): AuditableContentItem {
  return {
    module: `interpretation:${fixtureId}`,
    itemId: item.id,
    fields: {
      basis: item.basis,
      traditionalJudgment: item.traditionalJudgment,
      plainLanguage: item.plainLanguage,
      scenario: item.scenario,
      advantageVersion: item.advantageVersion,
      shadowVersion: item.shadowVersion,
      mirror: item.mirror,
      actionNow: item.actionNow,
      actionLongTerm: item.actionLongTerm,
      caution: item.caution,
    },
    sourceIds: item.sourceRuleIds,
    boundary: item.caution,
    scenario: item.scenario,
    action: item.actionNow,
    unknownHour,
  };
}

function mirrorItem(
  module: string,
  candidate: MirrorCandidate,
  sourceIds: readonly string[],
  sourceIdsAreRegistry: boolean,
): AuditableContentItem {
  return {
    module,
    itemId: candidate.id,
    fields: {
      similar: candidate.similar,
      different: candidate.different,
      lesson: candidate.lesson,
      shadow: candidate.shadow,
      references: candidate.sourceReferences.join("；"),
    },
    sourceIds,
    sourceIdsAreRegistry,
    boundary: candidate.different,
    scenario: candidate.similar,
    action: candidate.lesson,
  };
}

function movieItem(candidate: MovieCharacterRecord): AuditableContentItem {
  const base = mirrorItem("mirror:movie", candidate, [candidate.id], true);
  return {
    ...base,
    fields: {
      ...base.fields,
      coreDrive: candidate.coreDrive,
      actionStyle: candidate.actionStyle,
      stressResponse: candidate.stressResponse,
      relationshipStyle: candidate.relationshipStyle,
      talentExpression: candidate.talentExpression,
      blindSpot: candidate.blindSpot,
      turningPoint: candidate.turningPoint,
      matureArc: candidate.matureArc,
      shadowArc: candidate.shadowArc,
    },
  };
}

function atlasItem(method: AtlasMethodId, option: AtlasOption): AuditableContentItem {
  return {
    module: `atlas:${method}`,
    itemId: option.id,
    fields: {
      professionalResult: option.professionalResult,
      traditionalBasis: option.traditionalBasis,
      plainLanguage: option.plainLanguage,
      lifeScene: option.lifeScene,
      strengthAndPitfall: option.strengthAndPitfall,
      action: option.action,
      chartComparison: option.chartComparison,
      caution: option.caution,
    },
    sourceIds: option.sourceIds,
    boundary: option.caution,
    scenario: option.lifeScene,
    action: option.action,
  };
}

function auditFixture(
  issues: ContentAuditIssue[],
  items: AuditableContentItem[],
  fixture: { id: string; birth: BirthInput; chart: FourPillarsResult },
) {
  const unknownHour = fixture.birth.timeConfidence === "unknown";
  const overview = buildProfessionalOverview(fixture.chart);
  for (const [field, value] of Object.entries({
    dayMaster: overview.dayMaster,
    pattern: overview.pattern,
    climate: overview.climate,
    tenGodSummary: overview.tenGodSummary,
    relationSummary: overview.relationSummary,
  })) {
    if (!value.trim()) issues.push(issue("overview", fixture.id, "missing", field));
  }
  items.push({
    module: "overview",
    itemId: fixture.id,
    fields: {
      structure: `${overview.dayMaster}日主；${overview.pattern}；${overview.climate}`,
      professionalSummary: `十神分布：${overview.tenGodSummary}；干支关系：${overview.relationSummary}。`,
    },
    sourceIds: ["structure.support-score.v2", "ten-god.hidden-stems.v1", "relation.gan-zhi.v1"],
    boundary: fixture.chart.disclaimer,
    unknownHour,
  });

  const interpretations = buildInterpretations(fixture.chart);
  requireExactIds(issues, `interpretation:${fixture.id}`, interpretations.map(item => item.id), EXPECTED_INTERPRETATION_IDS);
  requireCount(issues, `interpretation:${fixture.id}`, "matrix", "items", interpretations.length, 21);
  for (const domain of EXPECTED_DOMAINS) {
    requireCount(
      issues,
      `interpretation:${fixture.id}`,
      domain,
      "domain-items",
      interpretations.filter(item => item.domain === domain).length,
      3,
    );
  }
  items.push(...interpretations.map(item => interpretationItem(fixture.id, item, unknownHour)));

  const matches = matchLifeMirrors(fixture.chart);
  requireCount(issues, `mirrors:${fixture.id}`, "animal", "top-matches", matches.animals.length, 3);
  requireCount(issues, `mirrors:${fixture.id}`, "historical", "top-matches", matches.historical.length, 3);
  requireCount(issues, `mirrors:${fixture.id}`, "movie", "top-matches", matches.movies.length, 3);
}

export function auditProductContent(): ContentAuditIssue[] {
  const issues: ContentAuditIssue[] = [];
  const items: AuditableContentItem[] = [];
  const fixtures = FIXTURES.map(fixture => ({
    ...fixture,
    chart: calculateFourPillars(fixture.birth),
  }));
  for (const fixture of fixtures) auditFixture(issues, items, fixture);

  const [male, female, unknown] = fixtures;
  for (const relationship of RELATIONSHIPS) {
    const exact = calculateCompatibility(male.chart, female.chart, relationship);
    const uncertain = calculateCompatibility(male.chart, unknown.chart, relationship);
    requireCount(issues, `compatibility:${relationship}`, "axes", "items", exact.axes.length, 9);
    requireCount(issues, `compatibility:${relationship}:unknown-time`, "axes", "items", uncertain.axes.length, 9);
    for (const [variant, result, unknownHour] of [
      ["exact", exact, false],
      ["unknown-time", uncertain, true],
    ] as const) {
      const moduleName = `compatibility:${relationship}:${variant}`;
      items.push({
        module: moduleName,
        itemId: "summary",
        fields: {
          summary: result.summary,
          roleSpecificGuidance: result.roleSpecificGuidance.join("；"),
          communicationScenario: result.communicationScenario,
          actionRules: result.actionRules.join("；"),
          limitations: result.limitations.join("；"),
        },
        sourceIds: COMPATIBILITY_SOURCE_IDS,
        boundary: result.limitations.join("；"),
        scenario: result.communicationScenario,
        action: result.actionRules.join("；"),
        unknownHour,
      });
      items.push(...result.axes.map(axis => ({
        module: moduleName,
        itemId: axis.id,
        fields: {
          professionalBasis: axis.professionalBasis,
          plainLanguage: axis.plainLanguage,
          scene: axis.scene,
          action: axis.action,
          caution: axis.caution,
        },
        sourceIds: COMPATIBILITY_SOURCE_IDS,
        boundary: axis.caution,
        scenario: axis.scene,
        action: axis.action,
        unknownHour,
      })));
    }
  }

  items.push(...ANIMAL_MIRRORS.map(candidate => mirrorItem(
    "mirror:animal",
    candidate,
    candidate.sourceReferences,
    false,
  )));
  items.push(...HISTORICAL_MIRRORS.map(candidate => mirrorItem(
    "mirror:historical",
    candidate,
    [candidate.id],
    true,
  )));
  items.push(...MOVIE_CHARACTERS.map(movieItem));

  const zodiacMirrors = Array.from({ length: 12 }, (_, index) => {
    const year = 1984 + index;
    const birth: BirthInput = {
      name: `生肖${year}`,
      date: `${year}-07-01`,
      time: "12:00",
      location: "北京",
      gender: "unspecified",
      timeConfidence: "exact",
    };
    return buildZodiacMirror(calculateFourPillars(birth));
  });
  requireCount(issues, "zodiac-mirror", "matrix", "items", zodiacMirrors.length, 12);
  requireCount(issues, "zodiac-mirror", "matrix", "unique-branches", new Set(zodiacMirrors.map(item => item.branch)).size, 12);
  items.push(...zodiacMirrors.map(record => ({
    module: "zodiac-mirror",
    itemId: record.branch,
    fields: {
      culturalSource: record.culturalSource,
      firstImpression: record.firstImpression,
      trustStyle: record.trustStyle,
      strengthPattern: record.strengthPattern,
      pressurePattern: record.pressurePattern,
      workScene: record.workScene,
      relationshipScene: record.relationshipScene,
      familyScene: record.familyScene,
      chartAgreement: record.chartAgreement,
      chartDifference: record.chartDifference,
      immediateAction: record.immediateAction,
      longTermPractice: record.longTermPractice,
      caution: record.caution,
    },
    sourceIds: record.sources,
    boundary: record.caution,
    scenario: record.workScene,
    action: record.immediateAction,
  })));
  const unknownZodiac = buildZodiacMirror(unknown.chart);
  items.push({
    module: "zodiac-mirror:unknown-time",
    itemId: unknownZodiac.branch,
    fields: {
      chartAgreement: unknownZodiac.chartAgreement,
      chartDifference: unknownZodiac.chartDifference,
      caution: unknownZodiac.caution,
    },
    sourceIds: unknownZodiac.sources,
    boundary: unknownZodiac.caution,
    unknownHour: true,
  });

  const zodiacProfiles = Object.values(ZODIAC_PROFILES);
  requireCount(issues, "zodiac-profile", "matrix", "items", zodiacProfiles.length, 12);
  items.push(...zodiacProfiles.map(profile => ({
    module: "zodiac-profile",
    itemId: profile.sign,
    fields: {
      coreDrive: profile.coreDrive,
      outerStyle: profile.outerStyle,
      innerNeed: profile.innerNeed,
      loveStyle: profile.loveStyle,
      friendshipStyle: profile.friendshipStyle,
      workStyle: profile.workStyle,
      stressResponse: profile.stressResponse,
      commonMisreading: profile.commonMisreading,
      matureVersion: profile.matureVersion,
      growthDirection: profile.growthDirection,
      chartComparison: profile.chartComparison,
      caution: profile.caution,
    },
    sourceIds: profile.sourceReferences,
    boundary: profile.caution,
    scenario: profile.workStyle,
    action: profile.growthDirection,
  })));

  for (const [method, expected] of [["face", 10], ["mole", 12], ["palm", 10], ["star", 12]] as const) {
    const options = getAtlasGroups(method).flatMap(group => group.options);
    requireCount(issues, `atlas:${method}`, "matrix", "items", options.length, expected);
    items.push(...options.map(option => atlasItem(method, option)));
  }
  requireCount(issues, "constellation", "matrix", "signs", ZODIAC_SIGNS.length, 12);
  requireCount(issues, "constellation", "matrix", "definitions", Object.keys(CONSTELLATIONS).length, 12);
  for (const sign of ZODIAC_SIGNS) {
    const map = CONSTELLATIONS[sign];
    if (!map?.nodes.length) issues.push(issue("constellation", sign, "missing", "nodes"));
    if (!map?.edges.length) issues.push(issue("constellation", sign, "missing", "edges"));
  }

  for (const fixture of [male, female]) {
    const timeline = buildFortuneTimeline(fixture.chart, fixture.birth);
    if (!timeline.length) issues.push(issue(`fortune:${fixture.id}`, "matrix", "missing", "periods"));
    for (const period of timeline) {
      items.push({
        module: `fortune:${fixture.id}:periods`,
        itemId: period.id,
        fields: {
          methodBasis: period.method.basis,
          stageStory: period.stageStory,
          career: period.lifeAreas.career,
          wealth: period.lifeAreas.wealth,
          relationship: period.lifeAreas.relationship,
          family: period.lifeAreas.family,
          rhythm: period.lifeAreas.rhythm,
          alignedState: period.alignedState,
          strainedState: period.strainedState,
          actions: period.actions.join("；"),
          reading: Object.values(period.reading).join("；"),
        },
        sourceIds: FORTUNE_SOURCE_IDS,
        boundary: period.method.disclaimer,
        scenario: period.stageStory,
        action: period.actions.join("；"),
      });
      for (const year of period.years) {
        if (!year.theme.trim()) {
          issues.push(issue(`fortune:${fixture.id}:years`, `${period.id}:${year.year}`, "missing", "theme"));
        }
        items.push({
          module: `fortune:${fixture.id}:years`,
          itemId: `${period.id}:${year.year}`,
          fields: {
            basis: year.basis,
            weatherMetaphor: year.weatherMetaphor,
            interaction: year.interaction,
            scenario: year.scenario,
            action: year.action,
          },
          sourceIds: FORTUNE_SOURCE_IDS,
          boundary: period.method.disclaimer,
          scenario: year.scenario,
          action: year.action,
        });
      }
    }
  }
  const unknownTimeline = buildFortuneTimeline(unknown.chart, unknown.birth);
  if (unknownTimeline.length) issues.push(issue("fortune:unknown-time", "matrix", "certainty", "periods"));

  issues.push(...auditContentItems(items));
  return issues;
}
