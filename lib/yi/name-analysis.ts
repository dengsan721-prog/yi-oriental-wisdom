import {
  findReviewedFullName,
  findReviewedNameCharacter,
  getCommonVariantDisambiguation,
  inspectRawNameInput,
  loadTghCoreData,
} from "./name-data";
import {
  scoreNameRealityTest,
  type NameRealityScore,
  type NameRealityTestAnswers,
} from "./name-score-contract";
import type {
  AnalysisBlocker,
  ConfirmedUsageRisk,
  ElementVector,
  NameAdvice,
  NameBlockerOccurrence,
  NameCharacterRecord,
  NameChartInteraction,
  NameChartInteractionInput,
  NameDirection,
  NameSemanticSummary,
  NameSurname,
  ReviewedFullNameRecord,
  TghCoreData,
  TghCoreRecord,
  VariantCandidate,
} from "./name-types";
import type { FourPillarsResult, PillarKey, ProfessionalReport } from "./types";

export type NameAnalysisMode = "current" | "traditional-reference" | "candidate";

export type UsageRiskInput = {
  id: ConfirmedUsageRisk["id"];
  severity: "hard";
  evidence: string;
  manuallyReviewed: boolean;
  userConfirmed: boolean;
  characterIndex?: number;
};

export type NameAnalysisRequest = {
  rawInput: string;
  mode?: NameAnalysisMode;
  traditionalSelections?: Readonly<Record<number, string | undefined>>;
  actualReadings?: Readonly<Record<number, string | undefined>>;
  usageRisks?: readonly UsageRiskInput[];
  realityTest?: NameRealityTestAnswers;
  requestFreshDirection?: boolean;
  chart?: Readonly<FourPillarsResult>;
  professionalReport?: Readonly<ProfessionalReport>;
};

export type NameAnalysisDependencies = {
  loadCore?: () => Promise<TghCoreData>;
};

export type NameAnalysisResult = {
  rawInput: string;
  mode: NameAnalysisMode;
  surname: NameSurname;
  givenName: string;
  characters: NameCharacterRecord[];
  blockers: NameBlockerOccurrence[];
  confirmedUsageRisks: ConfirmedUsageRisk[];
  semanticSummary: NameSemanticSummary;
  realityScore: NameRealityScore;
  advice: NameAdvice;
  chartInteraction: NameChartInteraction | null;
  directions: [NameDirection, NameDirection, NameDirection];
  exactReviewedFullName: ReviewedFullNameRecord | null;
  fullNameReviewStatus: "已审校" | "待人工复核";
  frequencyContext: string;
  ruleObservation: string;
  plainLanguageScene: string;
  action: string;
  boundary: string;
  sourceIds: string[];
};

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const PILLAR_KEYS: PillarKey[] = ["year", "month", "day", "hour"];
const COMPOUND_SURNAMES = [
  "欧阳", "司马", "上官", "诸葛", "东方", "皇甫", "尉迟", "公孙", "慕容", "司徒", "司空", "夏侯",
] as const;

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function addBlocker(blockers: AnalysisBlocker[], blocker: AnalysisBlocker) {
  if (!blockers.some(item => item.id === blocker.id)) blockers.push(blocker);
}

function provisionalVariants(record: TghCoreRecord | null): VariantCandidate[] {
  if (!record) return [];
  return [...record.traditionalVariants, ...record.simplifiedVariants]
    .filter(candidate => candidate.glyph !== record.glyph)
    .filter((candidate, index, all) => all.findIndex(item => item.glyph === candidate.glyph) === index)
    .map(candidate => ({
      glyph: candidate.glyph,
      codePoints: [...candidate.codePoints],
      meaningHint: "Unihan 仅提供临时字形关联，具体姓名义项仍需本人确认。",
      variantRelation: "simplified-to-traditional",
      sourceIds: [...candidate.sourceIds],
    }));
}

function candidateSet(inputGlyph: string, inputRecord: TghCoreRecord | null): VariantCandidate[] {
  const manual = getCommonVariantDisambiguation(inputGlyph);
  return manual ? manual.candidates.map(candidate => ({ ...candidate, codePoints: [...candidate.codePoints], sourceIds: [...candidate.sourceIds] })) : provisionalVariants(inputRecord);
}

function isConfirmedRiskInput(input: UsageRiskInput): boolean {
  const validId = input.id === "confirmed-severe-homophone-or-ambiguity"
    || input.id === "persistent-input-document-or-calling-issue";
  return validId && input.severity === "hard" && input.manuallyReviewed === true && input.userConfirmed === true && Boolean(input.evidence.trim());
}

function confirmedRisk(input: UsageRiskInput): ConfirmedUsageRisk {
  return {
    id: input.id,
    severity: "hard",
    evidence: input.evidence,
    manuallyReviewed: true,
    userConfirmed: true,
  };
}

function validConfirmedRisks(inputs: readonly UsageRiskInput[]): ConfirmedUsageRisk[] {
  return inputs.filter(isConfirmedRiskInput).map(confirmedRisk);
}

function parseSurname(graphemes: readonly string[]): { surname: NameSurname; givenName: string } {
  const joined = graphemes.join("");
  const compound = COMPOUND_SURNAMES.find(value => joined.startsWith(value));
  if (compound) return { surname: { value: compound, kind: "compound" }, givenName: graphemes.slice(2).join("") };
  if (!graphemes[0]) return { surname: { value: "", kind: "unknown" }, givenName: "" };
  return { surname: { value: graphemes[0], kind: "single" }, givenName: graphemes.slice(1).join("") };
}

function semanticSummary(characters: readonly NameCharacterRecord[]): NameSemanticSummary {
  const reviewed = characters.flatMap(character => character.semantic ? [character.semantic] : []);
  const totalCount = characters.length;
  if (!reviewed.length) {
    return { vector: null, reviewedCount: 0, totalCount, coverage: totalCount ? 0 : 1, unknownShare: totalCount ? 1 : 0, methodIds: [], sourceIds: [] };
  }
  const sums: ElementVector = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const semantic of reviewed) for (const element of ELEMENTS) sums[element] += semantic.vector[element];
  const vectorTotal = Object.values(sums).reduce((sum, value) => sum + value, 0);
  const vector = Object.fromEntries(ELEMENTS.map(element => [element, vectorTotal ? sums[element] / vectorTotal : 0])) as ElementVector;
  const uncoveredCount = totalCount - reviewed.length;
  return {
    vector,
    reviewedCount: reviewed.length,
    totalCount,
    coverage: totalCount ? reviewed.length / totalCount : 1,
    unknownShare: totalCount ? (uncoveredCount + reviewed.reduce((sum, item) => sum + item.unknownShare, 0)) / totalCount : 0,
    methodIds: unique(reviewed.map(item => item.methodId)) as NameSemanticSummary["methodIds"],
    sourceIds: unique(reviewed.flatMap(item => item.sourceIds)),
  };
}

function cloneReviewedFullName(record: ReviewedFullNameRecord | null): ReviewedFullNameRecord | null {
  return record ? {
    ...record,
    adoptedReadings: [...record.adoptedReadings],
    risks: record.risks.map(risk => ({ ...risk })),
  } : null;
}

function buildAdvice(
  mode: NameAnalysisMode,
  blockerCount: number,
  risks: readonly ConfirmedUsageRisk[],
  requestFreshDirection: boolean,
): NameAdvice {
  const sourceIds = ["name.advice-gate.v1", "law.civil-code-name-rights"];
  const boundary = "建议档位只读取经人工与用户共同确认的现实使用风险；分数、字形等级和五行文化并读都不触发建议。";
  if (blockerCount) return {
    tier: "hold",
    ruleObservation: `仍有${blockerCount}项字形、读音或字义事实待确认，本次暂停形成更名方向。`,
    plainLanguageScene: "像核对证件姓名一样，先把本次采用的字形、读音和含义逐项说清楚。",
    action: "先确认待核事实，再查看现实使用实测；当前只核对事实，不进入姓名变更建议。",
    boundary,
    sourceIds,
  };
  if (mode === "candidate" && requestFreshDirection) return {
    tier: "rebuild-direction",
    ruleObservation: "用户已主动进入候选模式并明确要求查看全新方向，因此只提供有限审校方向。",
    plainLanguageScene: "先比较三种表达方向，再决定是否请人工复核具体完整姓名。",
    action: "从三个方向中选一个表达主题，不在页面内自动拼接完整姓名。",
    boundary,
    sourceIds,
  };
  if (risks.length >= 2) return {
    tier: "rebuild",
    ruleObservation: "两项以上现实硬风险已经由本人和人工共同确认，可把重构作为备选方案。",
    plainLanguageScene: "当称呼、输入或证件系统问题持续叠加时，单次解释往往不能解决现实摩擦。",
    action: "先保留身份连续性记录，再请人工逐个复核新的完整姓名方案。",
    boundary,
    sourceIds,
  };
  if (risks.length === 1) return {
    tier: "micro-adjust",
    ruleObservation: "恰有一项现实硬风险已经由本人和人工共同确认，优先做局部处理。",
    plainLanguageScene: "一个固定场景持续出错时，先调整介绍、读音说明或单个字的候选口径。",
    action: "保留姓氏和主要身份线索，围绕这一项真实问题做最小调整。",
    boundary,
    sourceIds,
  };
  return {
    tier: "keep",
    ruleObservation: "现用姓名没有经人工与用户共同确认的现实硬风险，默认尊重并保留。",
    plainLanguageScene: "真实称呼、输入和证件使用都没有持续问题时，没有必要被文化分数推着改变。",
    action: "继续使用现名，并按需要补做现实场景验证即可。",
    boundary,
    sourceIds,
  };
}

function direction(id: string, title: string, glyphs: readonly string[], scene: string): NameDirection {
  const records = glyphs.map(glyph => findReviewedNameCharacter(glyph)).filter(record => record !== null);
  return {
    id,
    title,
    ruleObservation: "方向只组合表达主题与有限人工审校示例字，不自动生成完整姓名。",
    plainLanguageScene: scene,
    action: `先确认是否希望表达“${title}”，再把具体完整姓名交给人工逐项复核。`,
    boundary: "示例字已逐字审校不等于动态组合已经审校；未进入有限整名库的组合一律待人工复核。",
    exampleCharacters: records.map(record => ({ glyph: record.glyph, meaning: record.meaning, sourceIds: [...record.semantic.sourceIds, ...record.coverageSourceIds] })),
    sourceIds: unique(records.flatMap(record => [...record.semantic.sourceIds, ...record.coverageSourceIds])),
  };
}

function namingDirections(): [NameDirection, NameDirection, NameDirection] {
  return [
    direction("growth-and-cultivation", "生长与涵养", ["林", "艺", "涵"], "像长期练习一门手艺，重点放在成长、耐心与容纳。"),
    direction("openness-and-extension", "开阔与延展", ["远", "临", "川"], "像走到开阔水岸，重点放在眼界、面对与持续前行。"),
    direction("understanding-and-trust", "理解与守信", ["知", "诺", "欣"], "像一次清楚而可信的自我介绍，重点放在理解、承诺与友好感受。"),
  ];
}

export function buildNameChartInteractionInput(chart: Readonly<FourPillarsResult>): NameChartInteractionInput {
  const unavailableReasons: NameChartInteractionInput["unavailableReasons"] = [];
  if (chart.ambiguousPillars.includes("year")) unavailableReasons.push("year-boundary");
  if (chart.ambiguousPillars.includes("month")) unavailableReasons.push("month-boundary");
  if (!chart.pillars.hour || chart.ambiguousPillars.includes("hour")) unavailableReasons.push("unknown-time");
  const certainPillars: Partial<Record<PillarKey, Readonly<FourPillarsResult["pillars"][PillarKey]>>> = {};
  for (const key of PILLAR_KEYS) {
    const pillar = chart.pillars[key];
    if (pillar && !chart.ambiguousPillars.includes(key)) certainPillars[key] = pillar;
  }
  return {
    available: !unavailableReasons.includes("year-boundary") && !unavailableReasons.includes("month-boundary"),
    certainPillars: certainPillars as NameChartInteractionInput["certainPillars"],
    unavailableReasons,
  };
}

function buildChartInteraction(chart: Readonly<FourPillarsResult>, semantic: NameSemanticSummary): NameChartInteraction {
  const input = buildNameChartInteractionInput(chart);
  const unknownHour = input.unavailableReasons.includes("unknown-time");
  const boundary = "姓名不会改写出生盘，也不会加入四柱五行计数；这里只把已确认的姓名文化意象与稳定柱事实并排阅读。";
  if (!input.available) return {
    available: false,
    input,
    nameVector: semantic.vector,
    ruleObservation: "年柱或月柱处于边界待核状态，当前不展示命局文化并读。",
    plainLanguageScene: "先核对出生边界，再阅读稳定坐标；候选柱不被包装成确定结论。",
    action: "确认出生日期与边界口径后再查看并排资料。",
    boundary: `${unknownHour ? "时柱不参与；" : ""}${boundary}`,
    sourceIds: unique(["calendar.eight-char.v1", ...semantic.sourceIds]),
  };
  return {
    available: true,
    input,
    nameVector: semantic.vector,
    ruleObservation: semantic.vector
      ? `姓名文化向量与${Object.keys(input.certainPillars).length}个稳定柱事实分别展示，不合并计算。`
      : "姓名字义资料尚未覆盖，当前只展示稳定柱事实和资料边界。",
    plainLanguageScene: "像把两张资料卡放在桌上对照阅读，可以同时看见，但不会把姓名内容写进出生盘。",
    action: unknownHour ? "先阅读年、月、日三柱；时柱不参与。" : "分别阅读姓名意象与四柱事实，不做加减换算。",
    boundary: `${unknownHour ? "时柱不参与；" : ""}${boundary}`,
    sourceIds: unique(["calendar.eight-char.v1", ...semantic.sourceIds]),
  };
}

function characterSources(character: NameCharacterRecord): string[] {
  return unique([
    ...(character.tghIndex === null ? [] : ["standard.tgh-table"]),
    ...character.readings.map(item => item.sourceId),
    ...character.radicalStrokeRecords.map(item => item.sourceId),
    ...(character.totalStrokeRecord ? [character.totalStrokeRecord.sourceId] : []),
    ...character.variantCandidates.flatMap(item => item.sourceIds),
    ...(character.semantic?.sourceIds ?? []),
  ]);
}

export async function analyzeName(
  request: NameAnalysisRequest,
  dependencies: NameAnalysisDependencies = {},
): Promise<NameAnalysisResult | null> {
  if (!request.rawInput.trim()) return null;
  const mode = request.mode ?? "current";
  const inspection = inspectRawNameInput(request.rawInput);
  const core = await (dependencies.loadCore ?? loadTghCoreData)();
  const exactReviewedFullName = cloneReviewedFullName(mode === "current" ? findReviewedFullName(request.rawInput) : null);
  const confirmedUsageRisks = validConfirmedRisks(request.usageRisks ?? []);

  const characters = inspection.graphemes.map((grapheme, index): NameCharacterRecord => {
    const inputRecord = grapheme.nfcLookup ? core.lookupByGlyph(grapheme.nfcLookup) : null;
    const variants = candidateSet(grapheme.rawCluster, inputRecord);
    const selected = request.traditionalSelections?.[index];
    const selectedCandidate = mode === "traditional-reference"
      ? variants.find(candidate => candidate.glyph === selected) ?? null
      : null;
    const needsTraditionalSelection = mode === "traditional-reference" && (variants.length > 0 || selected !== undefined);
    const adoptedGlyph = needsTraditionalSelection
      ? selectedCandidate?.glyph ?? null
      : grapheme.rawCluster;
    const glyphBasis = selectedCandidate ? "confirmed-traditional-reference" : "registered-input";
    const coreRecord = adoptedGlyph
      ? (adoptedGlyph === grapheme.rawCluster ? inputRecord : core.lookupByGlyph(adoptedGlyph))
      : null;
    const reviewed = adoptedGlyph ? findReviewedNameCharacter(adoptedGlyph) : null;
    const blockers: AnalysisBlocker[] = [];
    if (needsTraditionalSelection && !selectedCandidate) addBlocker(blockers, {
      id: "adopted-glyph-unconfirmed",
      evidence: selected
        ? `所选字形“${selected}”不在该字候选集合中，请重新确认。`
        : `传统字形参考不会默认选择，请本人确认“${grapheme.rawCluster}”的采用字形。`,
    });
    if (grapheme.protections.length) addBlocker(blockers, {
      id: "registration-glyph-pending",
      evidence: `原始字符包含${grapheme.protections.join("、")}，需先核对证件登记字形。`,
    });
    if (adoptedGlyph && !coreRecord) addBlocker(blockers, {
      id: "unsupported-input",
      evidence: `本地 8105 字核心表暂未覆盖采用字形“${adoptedGlyph}”，不补猜工程资料。`,
    });

    let adoptedReading: string | null = null;
    if (adoptedGlyph) {
      const reviewedReading = exactReviewedFullName?.adoptedReadings[index];
      const explicitReading = request.actualReadings?.[index];
      if (reviewedReading) adoptedReading = reviewedReading;
      else if (explicitReading !== undefined) {
        if (coreRecord?.readings.some(reading => reading.pinyin === explicitReading)) adoptedReading = explicitReading;
        else addBlocker(blockers, {
          id: "actual-reading-unconfirmed",
          evidence: `所选读音“${explicitReading}”不在“${adoptedGlyph}”的实际读音候选中，请重新确认。`,
        });
      }
      else if (coreRecord?.readings.length === 1) adoptedReading = coreRecord.readings[0].pinyin;
      else addBlocker(blockers, {
        id: "actual-reading-unconfirmed",
        evidence: coreRecord?.readings.length
          ? `“${adoptedGlyph}”有多个读音候选，请确认姓名中的实际读音。`
          : `“${adoptedGlyph}”缺少可采用的实际读音记录。`,
      });
      if (!reviewed) addBlocker(blockers, {
        id: "key-meaning-unreviewed",
        evidence: `“${adoptedGlyph}”的姓名采用义项尚未进入有限人工审校集。`,
      });
    }

    return {
      rawCluster: grapheme.rawCluster,
      nfcLookup: grapheme.nfcLookup,
      inputGlyph: grapheme.rawCluster,
      inputCodePoints: [...grapheme.rawCodePoints],
      adoptedGlyph,
      glyphBasis,
      variantCandidates: variants,
      requiresConfirmation: needsTraditionalSelection && !selectedCandidate,
      tghIndex: coreRecord?.tghIndex ?? null,
      tghLevel: coreRecord?.tghLevel ?? null,
      readings: coreRecord?.readings.map(reading => ({ ...reading })) ?? [],
      adoptedReading,
      radicalStrokeRecords: coreRecord?.radicalStrokeRecords.map(record => ({ ...record })) ?? [],
      totalStrokeRecord: coreRecord ? { ...coreRecord.totalStrokeRecord } : null,
      meaning: reviewed?.meaning ?? null,
      semantic: reviewed ? { ...reviewed.semantic, vector: { ...reviewed.semantic.vector }, sourceIds: [...reviewed.semantic.sourceIds] } : null,
      analysisBlockers: blockers,
      confirmedUsageRisks: (request.usageRisks ?? [])
        .filter(input => input.characterIndex === index && isConfirmedRiskInput(input))
        .map(confirmedRisk),
    };
  });

  const blockers = characters.flatMap((character, characterIndex) => character.analysisBlockers.map(blocker => ({
    ...blocker,
    characterIndex,
    rawCluster: character.rawCluster,
  })));
  const semantics = semanticSummary(characters);
  const realityScore = scoreNameRealityTest(request.realityTest, { blocked: blockers.length > 0 });
  const advice = buildAdvice(mode, blockers.length, confirmedUsageRisks, request.requestFreshDirection === true);
  const { surname, givenName } = parseSurname(inspection.graphemes.map(item => item.rawCluster));
  const chartInteraction = request.chart ? buildChartInteraction(request.chart, semantics) : null;
  void request.professionalReport;
  const sourceIds = unique([
    ...characters.flatMap(characterSources),
    ...semantics.sourceIds,
    ...realityScore.sourceIds,
    ...advice.sourceIds,
    ...(chartInteraction?.sourceIds ?? []),
  ]);
  const hasBlockers = blockers.length > 0;

  return {
    rawInput: request.rawInput,
    mode,
    surname,
    givenName,
    characters,
    blockers,
    confirmedUsageRisks,
    semanticSummary: semantics,
    realityScore,
    advice,
    chartInteraction,
    directions: namingDirections(),
    exactReviewedFullName,
    fullNameReviewStatus: exactReviewedFullName ? "已审校" : "待人工复核",
    frequencyContext: "公安部姓名报告中的频次只用于覆盖样本选择，不用于质量判断或性别方向建议。",
    ruleObservation: hasBlockers
      ? `本产品规则下仍有${blockers.length}项事实待确认，只展示已经核对的资料。`
      : `本次采用${characters.length}个现实输入字形，姓名文化向量只汇总有限人工审校记录。`,
    plainLanguageScene: "在电话报名字、输入证件信息或第一次自我介绍时，先观察别人是否能听清、写对和稳定显示。",
    action: hasBlockers ? "先确认采用字形、实际读音与本人认可的字义，再完成现实使用实测。" : "请两位不熟悉姓名的人复述一次，并分别在手机和电脑完整输入一次。",
    boundary: "分数只评估姓名方案，不评价人；姓名不会改写出生盘，也不保证医疗、法律、财务或其他人生结果。",
    sourceIds,
  };
}
