import type { ElementName, FourPillarsResult, Pillar, PillarKey } from "./types";

export type MirrorFeatureVector = {
  growth: number;
  expression: number;
  stability: number;
  discernment: number;
  adaptability: number;
};

type MirrorFeatureKey = keyof MirrorFeatureVector;
type MirrorStressStyle = FourPillarsResult["professional"]["structureBalance"] | "待核";

const featureKeys: MirrorFeatureKey[] = [
  "growth",
  "expression",
  "stability",
  "discernment",
  "adaptability",
];
const elements: ElementName[] = ["木", "火", "土", "金", "水"];
const featureByElement: Record<ElementName, MirrorFeatureKey> = {
  木: "growth",
  火: "expression",
  土: "stability",
  金: "discernment",
  水: "adaptability",
};
const featureLabelByElement: Record<ElementName, string> = {
  木: "成长",
  火: "表达",
  土: "稳定",
  金: "辨识",
  水: "适应",
};

const clampFeature = (value: number) => Math.max(0, Math.min(10, value));
const clampScore = (value: number) => Math.max(0, Math.min(50, value));

function excludedPillars(chart: FourPillarsResult): Set<PillarKey> {
  const excluded = new Set(chart.ambiguousPillars);
  if (chart.professional.ambiguousFields.includes("dayMaster")
    || chart.professional.ambiguousFields.includes("dayPillar")) {
    excluded.add("day");
  }
  return excluded;
}

function confirmedElementCounts(chart: FourPillarsResult, excluded: Set<PillarKey>): Record<ElementName, number> {
  const counts: Record<ElementName, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const [key, pillar] of Object.entries(chart.pillars) as [PillarKey, Pillar | null][]) {
    if (!pillar || excluded.has(key)) continue;
    counts[pillar.element] += 1;
    counts[pillar.branchElement] += 1;
  }
  return counts;
}

export function extractMirrorFeatures(chart: FourPillarsResult): {
  vector: MirrorFeatureVector;
  evidence: string[];
  stressStyle: MirrorStressStyle;
} {
  const excluded = excludedPillars(chart);
  const counts = confirmedElementCounts(chart, excluded);
  const vector: MirrorFeatureVector = {
    growth: 2,
    expression: 2,
    stability: 2,
    discernment: 2,
    adaptability: 2,
  };
  for (const element of elements) {
    vector[featureByElement[element]] = clampFeature(2 + counts[element] * 1.5);
  }

  const dayMasterPending = excluded.has("day");
  const dayMasterEvidence = dayMasterPending
    ? "日主加权待核：候选日柱或日主未用于五维计算"
    : `日主加权：${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}，${featureLabelByElement[chart.professional.dayMaster.element]}维度增加2`;
  if (!dayMasterPending) {
    const dayFeature = featureByElement[chart.professional.dayMaster.element];
    vector[dayFeature] = clampFeature(vector[dayFeature] + 2);
  }

  const structurePending = chart.professional.ambiguousFields.includes("structureBalance");
  const stressStyle: MirrorStressStyle = structurePending ? "待核" : chart.professional.structureBalance;
  const structureEvidence = structurePending
    ? "压力风格待核：候选结构未用于判断"
    : `压力风格：${chart.professional.structureBalance}`;

  const relationsPending = chart.professional.ambiguousFields.includes("relationSummary");
  const relationLabels = relationsPending ? [] : chart.professional.relations
    .filter((relation) => relation.pillars.every((pillar) => !excluded.has(pillar)))
    .map((relation) => relation.label);
  const relationEvidence = relationsPending
    ? "柱间关系待核：候选关系未用于证据"
    : `已确认柱间关系：${relationLabels.join("、") || "暂无"}`;

  return {
    vector,
    stressStyle,
    evidence: [
      `五维来源：仅统计稳定柱天干与地支主五行，未展开藏干权重；每维基准2，每出现一处+1.5；已确认日主对应维度再+2。已确认计数：${elements.map((element) => `${element}${counts[element]}`).join("、")}；木→成长、火→表达、土→稳定、金→辨识、水→适应`,
      dayMasterEvidence,
      structureEvidence,
      relationEvidence,
    ],
  };
}

export function scoreMirror(left: MirrorFeatureVector, right: MirrorFeatureVector): number {
  const distance = featureKeys.reduce((sum, key) => sum + Math.abs(left[key] - right[key]), 0);
  return clampScore(50 - distance);
}
