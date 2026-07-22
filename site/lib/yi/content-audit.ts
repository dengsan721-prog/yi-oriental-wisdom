import { ANIMAL_MIRRORS } from "./animal-mirrors";
import { calculateCompatibility, type CompatibilityAxisId, type RelationshipType } from "./compatibility";
import { CONSTELLATIONS, ZODIAC_SIGNS } from "./constellations";
import { buildFortuneTimeline, FORTUNE_SOURCE_IDS } from "./fortune";
import { calculateFourPillars } from "./four-pillars";
import { HISTORICAL_MIRRORS } from "./historical-mirrors";
import { buildInterpretations, buildProfessionalOverview } from "./interpretation";
import { buildProfessionalReport } from "./report-model";
import { matchLifeMirrors, type MirrorCandidate } from "./mirrors";
import { MOVIE_CHARACTERS, type MovieCharacterRecord } from "./movie-characters";
import { getAllSources } from "./source-audit";
import { getAtlasGroups, getAtlasMethods, type AtlasMethodId, type AtlasOption } from "./traditional-atlas";
import type { NameAnalysisResult } from "./name-analysis";
import type { NameCharacterRecord } from "./name-types";
import type { BirthInput, FourPillarsResult, InterpretationItem, PillarKey } from "./types";
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
  uncertainPillars?: readonly PillarKey[];
  sourceIdsAreRegistry?: boolean;
  requiredSourceIds?: readonly string[];
};

const FORBIDDEN = [
  "功能入口", "资源接口", "社会接口", "能量端口", "底层模型", "高维链接",
  "注定", "必然破财", "克夫", "克妻", "疾病诊断", "寿命已定",
  "改名改命", "最吉", "必选", "补足五行", "康熙古法", "公安保证批准",
  "保证发财", "保证治愈", "保证婚姻", "保证生育", "保证避灾",
] as const;
const DETERMINISTIC_PROMISE = /(?:保证|必定|必然)[^。；，,\n]{0,12}(?:发财|收益|治愈|康复|婚姻|生育|避灾|批准|法律结果|投资)/g;
const NEGATED_PROMISE_PREFIX = /(?:不|不会|不能|无法|从不|并不|不作|不予)[^。；，,\n]{0,4}$/;
const DISPLAY_TITLE_FIELDS = new Set([
  "title", "professionalTitle", "innovationTitle", "label",
  "methodLabel", "methodSubtitle", "groupTitle", "directionTitle",
]);

const CERTAIN_HOUR_COORDINATE = /(?:(?:时柱\s*(?:显示|为|是|[:：=])?\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])|(?:时干\s*(?:显示|为|是|[:：=])?\s*[甲乙丙丁戊己庚辛壬癸])|(?:时支\s*(?:显示|为|是|[:：=])?\s*[子丑寅卯辰巳午未申酉戌亥]))/g;
const NEGATED_HOUR_PREFIX = /(?:不确定|不一定|无法确定|不能确定|不能断言|无法断言|不可断言|不宜断言|并非一定|尚未确定|暂不确定)[^。；，,\n]{0,12}$/;
const CERTAIN_LIFE_PATTERN = /(?:子女|晚年|晚景)[^。；，,\n]{0,16}(?:会|将|必然|必定|一定|注定|确定|肯定|固定为)/g;
const UNCERTAIN_LIFE_WORDING = /(?:不会|不将|不能|无法|未必|不一定|不确定|并非一定|不能断言|无法断言|不可断言|尚未|暂不|可能会|或许会|也许会)/;

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
const EXPECTED_COMPATIBILITY_AXIS_IDS: readonly CompatibilityAxisId[] = [
  "attraction", "communication", "trigger", "trust", "conflict",
  "resources", "decisions", "stability", "repair",
];
const COMPATIBILITY_SOURCE_IDS = ["ten-god.hidden-stems.v1", "relation.gan-zhi.v1", "classic.san-ming-tong-hui", "domain.mapping.v2"];

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

const FORTUNE_GUARD_FIXTURES: Array<{ id: string; birth: BirthInput }> = [
  {
    id: "male-unknown-time",
    birth: { name: "男性时辰待核", date: "1985-02-20", time: null, location: "成都", gender: "male", timeConfidence: "unknown" },
  },
  {
    id: "female-unknown-time",
    birth: { name: "女性时辰待核", date: "1978-12-05", time: null, location: "上海", gender: "female", timeConfidence: "unknown" },
  },
  {
    id: "unspecified-gender-exact-time",
    birth: { name: "性别待核", date: "1992-11-03", time: "18:20", location: "北京", gender: "unspecified", timeConfidence: "exact" },
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

function containsCertainHourDependentClaim(text: string): boolean {
  for (const match of text.matchAll(CERTAIN_HOUR_COORDINATE)) {
    const clausePrefix = text.slice(0, match.index).split(/[。；，,\n]/).at(-1) ?? "";
    if (!NEGATED_HOUR_PREFIX.test(clausePrefix)) return true;
  }
  return [...text.matchAll(CERTAIN_LIFE_PATTERN)].some(match => !UNCERTAIN_LIFE_WORDING.test(match[0]));
}

function containsCertainPillarCoordinate(text: string, pillar: "year" | "month"): boolean {
  const label = pillar === "year" ? "年" : "月";
  const pattern = new RegExp(`${label}柱\\s*(?:显示|为|是|[:：=])?\\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]`, "g");
  for (const match of text.matchAll(pattern)) {
    const clausePrefix = text.slice(0, match.index).split(/[。；，,\n]/).at(-1) ?? "";
    if (!NEGATED_HOUR_PREFIX.test(clausePrefix)) return true;
  }
  return false;
}

function containsDeterministicPromise(text: string): boolean {
  for (const match of text.matchAll(DETERMINISTIC_PROMISE)) {
    const clausePrefix = text.slice(0, match.index).split(/[。；，,\n]/).at(-1) ?? "";
    if (!NEGATED_PROMISE_PREFIX.test(clausePrefix)) return true;
  }
  return false;
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
      const minimumLength = DISPLAY_TITLE_FIELDS.has(field) ? 2 : 12;
      if (text.length < minimumLength) issues.push(issue(item.module, item.itemId, "too-short", field));
      if (FORBIDDEN.some(term => text.includes(term)) || containsDeterministicPromise(text)) {
        issues.push(issue(item.module, item.itemId, "forbidden", field));
      }
      const uncertainPillars = new Set(item.uncertainPillars ?? []);
      if (item.unknownHour) uncertainPillars.add("hour");
      if (
        (uncertainPillars.has("hour") && containsCertainHourDependentClaim(text))
        || (uncertainPillars.has("year") && containsCertainPillarCoordinate(text, "year"))
        || (uncertainPillars.has("month") && containsCertainPillarCoordinate(text, "month"))
      ) {
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
    if (item.requiredSourceIds?.some(id => !item.sourceIds.includes(id))) {
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

function uniqueSourceIds(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function characterSourceIds(character: NameCharacterRecord): string[] {
  return uniqueSourceIds([
    ...(character.tghIndex === null ? [] : ["standard.tgh-table"]),
    ...character.readings.map(reading => reading.sourceId),
    ...character.radicalStrokeRecords.map(record => record.sourceId),
    ...(character.totalStrokeRecord ? [character.totalStrokeRecord.sourceId] : []),
    ...character.variantCandidates.flatMap(candidate => candidate.sourceIds),
    ...(character.semantic ? [character.semantic.methodId] : []),
    ...(character.semantic?.sourceIds ?? []),
  ]);
}

function vectorText(vector: Record<string, number> | null): string {
  if (!vector) return "姓名语义向量暂未取得，当前保持未知状态。";
  return Object.entries(vector).map(([element, value]) => `${element}${value.toFixed(3)}`).join("、");
}

export function nameAnalysisToAuditableItems(result: NameAnalysisResult): AuditableContentItem[] {
  const items: AuditableContentItem[] = [{
    module: "name-analysis:summary",
    itemId: "summary",
    fields: {
      rawInput: `本次完整保留的原始姓名输入为：“${result.rawInput}”。`,
      analysisMode: `本次姓名分析模式为${result.mode}，模式切换不会静默改写原始姓名。`,
      surnameAndGivenName: `识别姓氏为“${result.surname.value || "待核"}”（${result.surname.kind}），其余名字为“${result.givenName || "待核"}”。`,
      reviewStatus: `完整姓名组合复核状态：${result.fullNameReviewStatus}；只有有限整名库的精确匹配才显示已审校。`,
      fullNameRecord: result.exactReviewedFullName
        ? `精确整名记录为${result.exactReviewedFullName.id}，姓名${result.exactReviewedFullName.fullName}，采用读音${result.exactReviewedFullName.adoptedReadings.join("、")}，字形口径${result.exactReviewedFullName.adoptedGlyphBasis}，复核日期${result.exactReviewedFullName.reviewDate}，复核角色${result.exactReviewedFullName.reviewerRole}，记录风险${result.exactReviewedFullName.risks.map(risk => `${risk.id}：${risk.evidence}`).join("；") || "无"}。`
        : "当前完整姓名没有命中有限整名审校库，组合状态保持待人工复核。",
      ruleObservation: result.ruleObservation,
      plainLanguageScene: result.plainLanguageScene,
      semanticCoverage: `人工审校字义覆盖${result.semanticSummary.reviewedCount}/${result.semanticSummary.totalCount}，覆盖率${(result.semanticSummary.coverage * 100).toFixed(1)}%，未知比例${(result.semanticSummary.unknownShare * 100).toFixed(1)}%，采用方法${result.semanticSummary.methodIds.join("、") || "待核"}。`,
      semanticVector: `姓名文化向量：${vectorText(result.semanticSummary.vector)}`,
      adviceTier: `建议门禁档位为${result.advice.tier}；${result.advice.ruleObservation}`,
      adviceScene: result.advice.plainLanguageScene,
      adviceAction: result.advice.action,
      aggregateBlockers: result.blockers.length
        ? `整名待确认事实为${result.blockers.map(blocker => `第${blocker.characterIndex + 1}字${blocker.id}：${blocker.evidence}`).join("；")}`
        : "当前完整姓名没有字形、读音或字义口径的待确认阻断项。",
      aggregateConfirmedUsageRisks: result.confirmedUsageRisks.length
        ? `整名共同确认的现实硬风险为${result.confirmedUsageRisks.map(risk => `${risk.id}：${risk.evidence}；人工复核${risk.manuallyReviewed}；用户确认${risk.userConfirmed}`).join("；")}`
        : "当前完整姓名没有经人工与用户共同确认的现实硬风险。",
      frequencyContext: result.frequencyContext,
    },
    sourceIds: uniqueSourceIds([...result.sourceIds, ...result.advice.sourceIds, ...result.semanticSummary.methodIds, ...result.semanticSummary.sourceIds]),
    boundary: `${result.boundary}；${result.advice.boundary}`,
    scenario: result.plainLanguageScene,
    action: result.action,
  }];

  items.push({
    module: "name-analysis:score",
    itemId: result.realityScore.version,
    fields: {
      scoreSummary: result.realityScore.total === null
        ? `现实使用实测总分暂不显示，当前状态为${result.realityScore.totalStatus}，不重算已验证项目的权重。`
        : `现实使用实测总分为${result.realityScore.total}分，来自四项固定规则直接相加。`,
      hearingRule: `听见与读准：回答${result.realityScore.dimensions.hearing.answer}；${result.realityScore.dimensions.hearing.reason}；规则${result.realityScore.dimensions.hearing.ruleId}；得分${result.realityScore.dimensions.hearing.score ?? "未验证"}。`,
      inputRule: `输入与显示：回答${result.realityScore.dimensions.inputDisplay.answer}；${result.realityScore.dimensions.inputDisplay.reason}；规则${result.realityScore.dimensions.inputDisplay.ruleId}；得分${result.realityScore.dimensions.inputDisplay.score ?? "未验证"}。`,
      documentRule: `证件与系统：回答${result.realityScore.dimensions.documents.answer}；${result.realityScore.dimensions.documents.reason}；规则${result.realityScore.dimensions.documents.ruleId}；得分${result.realityScore.dimensions.documents.score ?? "未验证"}。`,
      meaningRule: `含义与本人接受度：回答${result.realityScore.dimensions.meaningAcceptance.answer}；${result.realityScore.dimensions.meaningAcceptance.reason}；规则${result.realityScore.dimensions.meaningAcceptance.ruleId}；得分${result.realityScore.dimensions.meaningAcceptance.score ?? "未验证"}。`,
    },
    sourceIds: result.realityScore.sourceIds,
    boundary: "分数仅来自用户明确完成的现实场景验证；资料收录、文化向量和命盘并读均不加分。",
    action: "未验证项目保持未验证，不按已完成项目重新计算分母。",
  });

  for (const [index, character] of result.characters.entries()) {
    const vector = character.semantic?.vector ?? null;
    items.push({
      module: "name-analysis:character",
      itemId: `character:${index}`,
      fields: {
        rawAndCodePoints: `原始字簇“${character.rawCluster}”，输入码点${character.inputCodePoints.join("、")}，NFC 查表形式为${character.nfcLookup ?? "停用"}。`,
        adoptedGlyphAndBasis: `本次采用字形为“${character.adoptedGlyph ?? "待确认"}”，采用口径为${character.glyphBasis}，候选确认状态为${character.requiresConfirmation ? "待确认" : "已满足"}，不得静默换写。`,
        tghFacts: character.tghIndex === null
          ? "通用规范汉字表序号与级别暂未取得，当前保持未知。"
          : `通用规范汉字表序号为${character.tghIndex}，级别为${character.tghLevel}级。`,
        readings: character.readings.length
          ? `实际读音采用${character.adoptedReading ?? "待确认"}；全部工程读音候选为${character.readings.map(reading => `${reading.pinyin}(${reading.sourceProperty})`).join("、")}。`
          : "实际读音与工程读音候选均暂未取得，当前保持未知。",
        engineeringFacts: `部首检字工程记录为${character.radicalStrokeRecords.map(record => record.value).join("、") || "未知"}；总笔画工程记录为${character.totalStrokeRecord?.rawValue ?? "未知"}。`,
        meaningAndSemantic: character.semantic
          ? `人工审校字义为${character.meaning}；方法${character.semantic.methodId}@${character.semantic.version}；可信状态${character.semantic.confidence}；向量${vectorText(vector)}；未知比例${character.semantic.unknownShare}；依据${character.semantic.basisText}`
          : "采用字义与姓名文化向量尚未进入有限人工审校集，当前不作推断。",
        variantCandidates: character.variantCandidates.length
          ? `可能关联字为${character.variantCandidates.map(candidate => `${candidate.glyph}（${candidate.variantRelation}；${candidate.meaningHint}）`).join("；")}；候选不会默认采用。`
          : "当前没有需要展示的简繁或异体候选关系，仍保留原始输入。",
        analysisBlockers: character.analysisBlockers.length
          ? `待确认事实为${character.analysisBlockers.map(blocker => `${blocker.id}：${blocker.evidence}`).join("；")}`
          : "当前字形、读音与字义口径没有待确认阻断项。",
        confirmedUsageRisks: character.confirmedUsageRisks.length
          ? `共同确认的现实使用风险为${character.confirmedUsageRisks.map(risk => `${risk.id}：${risk.evidence}`).join("；")}`
          : "当前字符没有经人工与用户共同确认的现实硬风险。",
      },
      sourceIds: uniqueSourceIds([...characterSourceIds(character), "unicode.uax38"]),
      boundary: "部首、笔画、字表级别和拼音都是工程或规范资料，不能生成姓名五行或人生结论。",
    });
  }

  if (result.chartInteraction) {
    const uncertainPillars: PillarKey[] = result.chartInteraction.input.unavailableReasons.flatMap(reason =>
      reason === "year-boundary" ? ["year"] : reason === "month-boundary" ? ["month"] : reason === "unknown-time" ? ["hour"] : []);
    items.push({
      module: "name-analysis:chart",
      itemId: "side-by-side",
      fields: {
        chartStatus: result.chartInteraction.ruleObservation,
        chartScene: result.chartInteraction.plainLanguageScene,
        unavailableReasons: `命局文化并读的不可用或降级原因为${result.chartInteraction.input.unavailableReasons.join("、") || "无"}。`,
        stablePillars: `稳定柱事实为${Object.entries(result.chartInteraction.input.certainPillars).map(([key, pillar]) => `${key}:${pillar?.stem}${pillar?.branch}/${pillar?.element}/${pillar?.branchElement}`).join("；") || "暂无可用稳定柱"}。`,
        nameVector: `并排展示的姓名文化向量为${vectorText(result.chartInteraction.nameVector)}。`,
        chartAction: result.chartInteraction.action,
      },
      sourceIds: result.chartInteraction.sourceIds,
      boundary: result.chartInteraction.boundary,
      action: result.chartInteraction.action,
      unknownHour: uncertainPillars.includes("hour"),
      uncertainPillars,
    });
  }

  for (const direction of result.directions) {
    items.push({
      module: "name-analysis:direction",
      itemId: direction.id,
      fields: {
        directionTitle: direction.title,
        directionObservation: direction.ruleObservation,
        directionScene: direction.plainLanguageScene,
        directionAction: direction.action,
        exampleCharacters: `有限人工审校示例字为${direction.exampleCharacters.map(example => `${example.glyph}：${example.meaning}`).join("；")}。`,
      },
      sourceIds: uniqueSourceIds([...direction.sourceIds, ...direction.exampleCharacters.flatMap(example => example.sourceIds)]),
      boundary: direction.boundary,
      scenario: direction.plainLanguageScene,
      action: direction.action,
    });
  }
  return items;
}

export function auditNameAnalysis(result: NameAnalysisResult): ContentAuditIssue[] {
  return auditContentItems(nameAnalysisToAuditableItems(result));
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
      professionalTitle: item.professionalTitle,
      innovationTitle: item.innovationTitle,
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
      title: option.title,
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
  const report = buildProfessionalReport(fixture.chart, fixture.birth);
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
      lifeTheme: report.lifeTheme,
      coreTalents: report.coreTalents.join("；"),
      centralTensions: report.centralTensions.join("；"),
      currentLesson: report.currentLesson,
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
      requireExactIds(issues, moduleName, result.axes.map(axis => axis.id), EXPECTED_COMPATIBILITY_AXIS_IDS);
      items.push({
        module: moduleName,
        itemId: "summary",
        fields: {
          summary: result.summary,
          roleSpecificGuidance: result.roleSpecificGuidance.join("；"),
          communicationScenario: result.communicationScenario,
          actionRules: result.actionRules.join("；"),
          limitations: result.limitations.join("；"),
          elementDynamics: result.elementDynamics.map(entry => `${entry.element}:${entry.first}/${entry.second}；${entry.observation}`).join("；"),
          tenGodDynamics: result.tenGodDynamics.map(entry => `${entry.direction}；${entry.basis}；${entry.theme}；${entry.observation}`).join("；"),
          combinationsAndClashes: result.combinationsAndClashes.map(entry => `${entry.symbols.join("")}；${entry.relation}；${entry.observation}`).join("；"),
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
          label: axis.label,
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
    requiredSourceIds: ["model.western-astrology-element-modality"],
    boundary: profile.caution,
    scenario: profile.workStyle,
    action: profile.growthDirection,
  })));

  const atlasMethods = getAtlasMethods();
  requireExactIds(issues, "atlas:methods", atlasMethods.map(method => method.id), ["face", "mole", "palm", "star"]);
  for (const [method, expected] of [["face", 10], ["mole", 12], ["palm", 10], ["star", 12]] as const) {
    const groups = getAtlasGroups(method);
    const options = groups.flatMap(group => group.options);
    requireCount(issues, `atlas:${method}`, "matrix", "items", options.length, expected);
    const firstOption = options[0];
    const methodCopy = atlasMethods.find(item => item.id === method);
    items.push({
      module: `atlas:${method}:navigation`,
      itemId: `method:${method}`,
      fields: {
        methodLabel: methodCopy?.label ?? "",
        methodSubtitle: methodCopy?.subtitle ?? "",
      },
      sourceIds: firstOption?.sourceIds ?? [],
      boundary: firstOption?.caution ?? "",
    });
    items.push(...groups.map((group, index) => ({
      module: `atlas:${method}:navigation`,
      itemId: `group:${index}`,
      fields: { groupTitle: group.title },
      sourceIds: group.options[0]?.sourceIds ?? [],
      boundary: group.options[0]?.caution ?? "",
    })));
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
        sourceIds: period.method.sourceIds,
        requiredSourceIds: FORTUNE_SOURCE_IDS,
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
          sourceIds: period.method.sourceIds,
          requiredSourceIds: FORTUNE_SOURCE_IDS,
          boundary: period.method.disclaimer,
          scenario: year.scenario,
          action: year.action,
        });
      }
    }
  }
  for (const fixture of FORTUNE_GUARD_FIXTURES) {
    const chart = calculateFourPillars(fixture.birth);
    if (buildFortuneTimeline(chart, fixture.birth).length) {
      issues.push(issue(`fortune:${fixture.id}`, "matrix", "certainty", "periods"));
    }
  }

  issues.push(...auditContentItems(items));
  return issues;
}
