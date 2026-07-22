export const NAME_REALITY_SCORE_VERSION = "1.0" as const;

export type HearingOutcome = "both" | "one" | "none" | "unverified";
export type InputDisplayOutcome = "both" | "one" | "none" | "unverified";
export type DocumentOutcome = "both" | "one" | "none" | "unverified";
export type MeaningAcceptanceOutcome = "accepted" | "one-long-term-ambiguity" | "severe-confirmed" | "unverified";

export type NameRealityTestAnswers = {
  hearing: HearingOutcome;
  inputDisplay: InputDisplayOutcome;
  documents: DocumentOutcome;
  meaningAcceptance: MeaningAcceptanceOutcome;
};

export type NameRealityRuleId =
  | "R-HEAR-30" | "R-HEAR-15" | "R-HEAR-00" | "R-HEAR-UNVERIFIED"
  | "R-INPUT-25" | "R-INPUT-10" | "R-INPUT-00" | "R-INPUT-UNVERIFIED"
  | "R-DOC-25" | "R-DOC-10" | "R-DOC-00" | "R-DOC-UNVERIFIED"
  | "R-MEAN-20" | "R-MEAN-10" | "R-MEAN-00" | "R-MEAN-UNVERIFIED";

export type NameRealityDimensionResult = {
  answer: string;
  score: number | null;
  ruleId: NameRealityRuleId;
  reason: string;
};

export type NameRealityScore = {
  version: typeof NAME_REALITY_SCORE_VERSION;
  total: number | null;
  totalStatus: "complete" | "unverified" | "blocked";
  dimensions: {
    hearing: NameRealityDimensionResult;
    inputDisplay: NameRealityDimensionResult;
    documents: NameRealityDimensionResult;
    meaningAcceptance: NameRealityDimensionResult;
  };
  sourceIds: readonly ["name.reality-score.v1"];
};

const DEFAULT_ANSWERS: NameRealityTestAnswers = {
  hearing: "unverified",
  inputDisplay: "unverified",
  documents: "unverified",
  meaningAcceptance: "unverified",
};

const HEARING_RULES: Record<HearingOutcome, NameRealityDimensionResult> = {
  both: { answer: "both", score: 30, ruleId: "R-HEAR-30", reason: "两位不熟悉姓名的人第一次听后都能正确复述或叫读。" },
  one: { answer: "one", score: 15, ruleId: "R-HEAR-15", reason: "两位测试者中只有一位第一次听后能正确复述或叫读。" },
  none: { answer: "none", score: 0, ruleId: "R-HEAR-00", reason: "两位测试者第一次听后都未能正确复述或叫读。" },
  unverified: { answer: "unverified", score: null, ruleId: "R-HEAR-UNVERIFIED", reason: "尚未完成两位真实测试者的听读验证。" },
};

const INPUT_RULES: Record<InputDisplayOutcome, NameRealityDimensionResult> = {
  both: { answer: "both", score: 25, ruleId: "R-INPUT-25", reason: "常用手机和电脑两种环境均能一次输入并正确显示。" },
  one: { answer: "one", score: 10, ruleId: "R-INPUT-10", reason: "手机和电脑两种环境中只有一种输入显示顺畅。" },
  none: { answer: "none", score: 0, ruleId: "R-INPUT-00", reason: "手机和电脑两种环境均持续出现输入或显示问题。" },
  unverified: { answer: "unverified", score: null, ruleId: "R-INPUT-UNVERIFIED", reason: "尚未在常用手机和电脑两种环境完成验证。" },
};

const DOCUMENT_RULES: Record<DocumentOutcome, NameRealityDimensionResult> = {
  both: { answer: "both", score: 25, ruleId: "R-DOC-25", reason: "两个实际办理或业务系统场景均未出现持续问题。" },
  one: { answer: "one", score: 10, ruleId: "R-DOC-10", reason: "两个实际场景中有一个持续出现姓名使用问题。" },
  none: { answer: "none", score: 0, ruleId: "R-DOC-00", reason: "两个实际场景均持续出现姓名使用问题。" },
  unverified: { answer: "unverified", score: null, ruleId: "R-DOC-UNVERIFIED", reason: "候选姓名或尚未经历两个实际办理场景，暂未验证。" },
};

const MEANING_RULES: Record<MeaningAcceptanceOutcome, NameRealityDimensionResult> = {
  accepted: { answer: "accepted", score: 20, ruleId: "R-MEAN-20", reason: "本人确认采用义项符合表达，并且没有长期困扰。" },
  "one-long-term-ambiguity": { answer: "one-long-term-ambiguity", score: 10, ruleId: "R-MEAN-10", reason: "存在一个长期需要解释的含义歧义。" },
  "severe-confirmed": { answer: "severe-confirmed", score: 0, ruleId: "R-MEAN-00", reason: "存在经本人确认的严重负面含义歧义。" },
  unverified: { answer: "unverified", score: null, ruleId: "R-MEAN-UNVERIFIED", reason: "本人尚未确认本次采用义项与接受度。" },
};

export function scoreNameRealityTest(
  answers: NameRealityTestAnswers = DEFAULT_ANSWERS,
  options: { blocked?: boolean } = {},
): NameRealityScore {
  const dimensions = {
    hearing: { ...HEARING_RULES[answers.hearing] },
    inputDisplay: { ...INPUT_RULES[answers.inputDisplay] },
    documents: { ...DOCUMENT_RULES[answers.documents] },
    meaningAcceptance: { ...MEANING_RULES[answers.meaningAcceptance] },
  };
  const values = Object.values(dimensions).map(item => item.score);
  const hasUnverified = values.some(value => value === null);
  return {
    version: NAME_REALITY_SCORE_VERSION,
    total: options.blocked || hasUnverified ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0),
    totalStatus: options.blocked ? "blocked" : hasUnverified ? "unverified" : "complete",
    dimensions,
    sourceIds: ["name.reality-score.v1"],
  };
}
