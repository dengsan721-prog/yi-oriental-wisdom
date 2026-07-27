import { buildChartNarrative, type ChartNarrative } from "../../../lib/yi/chart-narrative";
import { buildFortuneStoryTimeline, type FortuneStoryTimeline } from "../../../lib/yi/fortune-story";
import { calculateFourPillars } from "../../../lib/yi/four-pillars";
import { buildInterpretations } from "../../../lib/yi/interpretation";
import { buildLifeScrollNarrative, type LifeScrollNarrative } from "../../../lib/yi/life-scroll";
import { buildProfessionalReport } from "../../../lib/yi/report-model";
import type {
  BirthInput,
  ElementName,
  PillarKey,
  ProfessionalChart,
} from "../../../lib/yi/types";

export type StoryGoldenCase = Readonly<{
  id: string;
  birth: BirthInput;
  expectedFortune: "available" | "unknown-time" | "gender-unspecified";
}>;

export type StoryGoldenArtifact = Readonly<{
  schemaVersion: 1;
  caseId: string;
  birth: BirthInput;
  expectedFortune: StoryGoldenCase["expectedFortune"];
  coverage: Readonly<{
    dayMasterElement: ElementName;
    structureBalance: ProfessionalChart["structureBalance"];
    ambiguousPillars: readonly PillarKey[];
    absentVisibleElements: readonly ElementName[];
    relationCount: number;
  }>;
  lifeScroll: LifeScrollNarrative;
  chartNarrative: ChartNarrative;
  fortuneStory: FortuneStoryTimeline;
}>;

const BASE_GOLDEN_BIRTH = {
  name: "测试人林岚",
  location: "北京市",
} as const;

export const STORY_GOLDEN_CASES = [
  {
    id: "1990-06-15-0930",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "1990-06-15",
      time: "09:30",
      gender: "female",
      timeConfidence: "exact",
    },
    expectedFortune: "available",
  },
  {
    id: "1992-11-03-unknown",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "1992-11-03",
      time: null,
      gender: "unspecified",
      timeConfidence: "unknown",
    },
    expectedFortune: "unknown-time",
  },
  {
    id: "1986-02-05-1200",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "1986-02-05",
      time: "12:00",
      gender: "unspecified",
      timeConfidence: "exact",
    },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "2001-09-21-1410",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "2001-09-21",
      time: "14:10",
      gender: "unspecified",
      timeConfidence: "exact",
    },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "2024-02-04-unknown",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "2024-02-04",
      time: null,
      gender: "unspecified",
      timeConfidence: "unknown",
    },
    expectedFortune: "unknown-time",
  },
  {
    id: "1978-12-05-0620",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "1978-12-05",
      time: "06:20",
      gender: "unspecified",
      timeConfidence: "exact",
    },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "1995-05-17-1200",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "1995-05-17",
      time: "12:00",
      gender: "unspecified",
      timeConfidence: "exact",
    },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "1988-08-08-1830",
    birth: {
      ...BASE_GOLDEN_BIRTH,
      date: "1988-08-08",
      time: "18:30",
      gender: "unspecified",
      timeConfidence: "exact",
    },
    expectedFortune: "gender-unspecified",
  },
] as const satisfies readonly StoryGoldenCase[];

const ELEMENT_ORDER: readonly ElementName[] = ["木", "火", "土", "金", "水"];

export function buildStoryGoldenArtifact(
  goldenCase: StoryGoldenCase,
): StoryGoldenArtifact {
  const chart = calculateFourPillars(goldenCase.birth);
  const report = buildProfessionalReport(chart, goldenCase.birth);
  const interpretations = buildInterpretations(chart);

  return {
    schemaVersion: 1,
    caseId: goldenCase.id,
    birth: goldenCase.birth,
    expectedFortune: goldenCase.expectedFortune,
    coverage: {
      dayMasterElement: chart.professional.dayMaster.element,
      structureBalance: chart.professional.structureBalance,
      ambiguousPillars: [...chart.ambiguousPillars],
      absentVisibleElements: ELEMENT_ORDER.filter(
        element => chart.elementCounts[element] === 0,
      ),
      relationCount: chart.professional.relations.length,
    },
    lifeScroll: buildLifeScrollNarrative(chart, report, interpretations),
    chartNarrative: buildChartNarrative(chart, report, interpretations),
    fortuneStory: buildFortuneStoryTimeline(chart, goldenCase.birth),
  };
}
