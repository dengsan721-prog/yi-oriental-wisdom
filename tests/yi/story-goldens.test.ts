import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { ChartNarrative } from "../../lib/yi/chart-narrative";
import type { LifeScrollNarrative } from "../../lib/yi/life-scroll";
import {
  STORY_GOLDEN_CASES,
  type StoryGoldenArtifact,
} from "../fixtures/yi/story-golden-cases";

const GOLDEN_DIRECTORY = fileURLToPath(
  new URL("../fixtures/yi/story-goldens/", import.meta.url),
);
const REVIEW_PATH = fileURLToPath(
  new URL("../../../docs/editorial/yi-story-golden-review-v1.md", import.meta.url),
);
const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const STRUCTURES = ["support-heavy", "mixed", "expression-heavy"] as const;
const BEAT_FIELDS = [
  "situation",
  "opportunity",
  "firstStrength",
  "overuseCost",
  "lowPoint",
  "newChoice",
  "turn",
  "observableSignal",
] as const;
const MICRO_FIELDS = [
  "title",
  "trigger",
  "firstReaction",
  "apparentBenefit",
  "cost",
  "turnAction",
  "example",
  "observableSignal",
] as const;
const FORBIDDEN_PUBLIC_COPY =
  /专业依据|本章来源|本章依据与使用边界|可靠级|证据等级|计算规则|规则 ID|数据来源清单|注定|必然|一定会|将会|保证|预示|发财|破财|结婚|离婚|患病|灾难|寿命/u;
const EXACT_FUTURE_PROMISE =
  /(?:在|到|等到)?(?:\d{1,3}岁|\d{4}年|\d{1,2}月|\d{1,2}日).{0,16}(?:必|一定|注定|将会|必然).{0,24}(?:成功|离职|结婚|离婚|发财|破财|患病|灾祸)/u;
const FORBIDDEN_STORY_TEMPLATES = [
  "人物先寻找一个可控制的入口",
  "让压力成为可讨论的条件",
  "能让事情启动并给出下一步",
  "重要反馈就会被挡在决定之外",
  "小问题也会被误作无法改变的困局",
  "变化来自反复核对不是突然逆转",
  "连续记录两周再判断",
  "这会检验",
  "连续记录后再判断",
  "还没有足够个人记录时先把这一段当作一周小实验",
] as const;

function countHan(value: string): number {
  return value.match(/\p{Script=Han}/gu)?.length ?? 0;
}

function lifeVisible(narrative: LifeScrollNarrative): string[] {
  return [
    narrative.oneLineTheme,
    ...narrative.openingScene,
    ...narrative.careerArc,
    ...narrative.relationshipArc,
    ...narrative.turningPointArc,
    ...narrative.matureArc,
    narrative.closingLine,
    narrative.actionNow,
    narrative.animalInterlude.name,
    narrative.animalInterlude.introduction,
    narrative.animalInterlude.matchingScene,
    narrative.animalInterlude.difference,
    narrative.animalInterlude.takeaway,
    narrative.historicalInterlude.name,
    narrative.historicalInterlude.introduction,
    narrative.historicalInterlude.matchingScene,
    narrative.historicalInterlude.difference,
    narrative.historicalInterlude.takeaway,
    ...narrative.daoNotes.flatMap(note => [
      note.excerpt,
      note.plainCommentary.traditionalMeaning,
      note.plainCommentary.storyConnection,
      note.plainCommentary.sceneGuidance,
    ]),
  ];
}

function lifeMainArcs(narrative: LifeScrollNarrative): string[] {
  return [
    ...narrative.openingScene,
    ...narrative.careerArc,
    ...narrative.relationshipArc,
    ...narrative.turningPointArc,
    ...narrative.matureArc,
  ];
}

function beatValues(beat: ChartNarrative["self"]): string[] {
  return BEAT_FIELDS.map(field => beat[field]);
}

function microValues(
  story:
    | ChartNarrative["careerAdvice"][number]
    | ChartNarrative["relationshipAdvice"][number]
    | ChartNarrative["rhythmAdvice"][number],
): string[] {
  return MICRO_FIELDS.map(field => story[field]);
}

function chartVisible(narrative: ChartNarrative): string[] {
  return [
    ...narrative.professionalTranslations.flatMap(translation => [
      translation.whatItMeans,
      translation.lifeScene,
      translation.practicalGuidance,
    ]),
    ...[
      narrative.self,
      narrative.career,
      narrative.relationship,
      narrative.rhythm,
    ].flatMap(beatValues),
    ...narrative.careerAdvice.flatMap(microValues),
    ...narrative.relationshipAdvice.flatMap(microValues),
    ...narrative.rhythmAdvice.flatMap(microValues),
  ];
}

function fortuneVisible(
  fortune: StoryGoldenArtifact["fortuneStory"],
): string[] {
  if (fortune.status === "unavailable") return [fortune.explanation];
  return [
    fortune.timingNote,
    ...fortune.periods.flatMap(period => [
      period.ageRange,
      period.yearRange,
      period.title,
      period.openingScene,
      period.careerScene,
      period.resourceScene,
      period.relationshipScene,
      period.familyScene,
      period.rhythmScene,
      period.favorableCurrent,
      period.likelyCost,
      ...period.actions,
      ...period.years.flatMap(year => [
        year.title,
        year.scene,
        year.action,
      ]),
    ]),
  ];
}

function readGolden(caseId: string): StoryGoldenArtifact {
  return JSON.parse(
    readFileSync(`${GOLDEN_DIRECTORY}${caseId}.json`, "utf8"),
  ) as StoryGoldenArtifact;
}

function normalizedSentences(values: readonly string[]): string[] {
  return values
    .flatMap(value => value.split(/[。！？；]/u))
    .map(value => value.normalize("NFC").replace(/[\s“”‘’：，、]/gu, ""))
    .filter(value => value.length >= 8);
}

function repetitionRatio(values: readonly string[]): number {
  const sentences = normalizedSentences(values);
  return sentences.length === 0
    ? 0
    : (sentences.length - new Set(sentences).size) / sentences.length;
}

function hanOnly(value: string): string {
  return value.normalize("NFC").replace(/[^\p{Script=Han}]/gu, "");
}

function repeatedLongFragments(
  values: readonly string[],
  fragmentLength = 16,
  minimumFieldCount = 3,
): string[] {
  const owners = new Map<string, Set<number>>();
  values.forEach((value, fieldIndex) => {
    const normalized = hanOnly(value);
    const fragments = new Set<string>();
    for (
      let index = 0;
      index <= normalized.length - fragmentLength;
      index += 1
    ) {
      fragments.add(normalized.slice(index, index + fragmentLength));
    }
    for (const fragment of fragments) {
      const fields = owners.get(fragment) ?? new Set<number>();
      fields.add(fieldIndex);
      owners.set(fragment, fields);
    }
  });
  return [...owners.entries()]
    .filter(([, fields]) => fields.size >= minimumFieldCount)
    .map(([fragment]) => fragment)
    .sort();
}

function reviewField(markdown: string, key: string): string {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "mu"));
  if (!match) throw new Error(`Missing review field: ${key}`);
  return match[1].trim();
}

function reviewRows(markdown: string): string[][] {
  return markdown
    .split(/\r?\n/u)
    .filter(line => /^\|\s*\d{4}-/u.test(line))
    .map(line => line.split("|").slice(1, -1).map(cell => cell.trim()));
}

describe("story editorial goldens", () => {
  const goldens = STORY_GOLDEN_CASES.map(goldenCase =>
    readGolden(goldenCase.id)
  );

  it("freezes the exact eight inputs and required coverage", () => {
    expect(goldens.map(golden => golden.caseId)).toEqual(
      STORY_GOLDEN_CASES.map(goldenCase => goldenCase.id),
    );
    expect(new Set(goldens.map(golden =>
      golden.coverage.dayMasterElement
    ))).toEqual(new Set(ELEMENTS));
    expect(new Set(goldens.map(golden =>
      golden.coverage.structureBalance
    ))).toEqual(new Set(STRUCTURES));
    expect(goldens.some(golden =>
      golden.birth.timeConfidence === "exact"
    )).toBe(true);
    expect(goldens.some(golden =>
      golden.birth.timeConfidence === "unknown"
    )).toBe(true);
    expect(goldens.some(golden =>
      golden.coverage.ambiguousPillars.includes("year") &&
      golden.coverage.ambiguousPillars.includes("month")
    )).toBe(true);
    expect(goldens.some(golden =>
      golden.coverage.absentVisibleElements.length === 0
    )).toBe(true);
    expect(goldens.some(golden =>
      golden.coverage.absentVisibleElements.length > 0
    )).toBe(true);
    expect(goldens.some(golden => golden.coverage.relationCount === 0))
      .toBe(true);
    expect(goldens.some(golden => golden.coverage.relationCount > 0))
      .toBe(true);
  });

  it.each(STORY_GOLDEN_CASES)(
    "keeps $id complete, bounded, and prediction-safe",
    goldenCase => {
      const golden = readGolden(goldenCase.id);
      expect(golden.birth).toEqual(goldenCase.birth);
      expect(golden.expectedFortune).toBe(goldenCase.expectedFortune);

      const lifeText = lifeVisible(golden.lifeScroll);
      const chartText = chartVisible(golden.chartNarrative);
      const fortuneText = fortuneVisible(golden.fortuneStory);
      const publicText = [...lifeText, ...chartText, ...fortuneText].join("");

      expect(countHan(lifeText.join(""))).toBeGreaterThanOrEqual(1600);
      expect(countHan(lifeText.join(""))).toBeLessThanOrEqual(2600);
      expect(golden.lifeScroll.internalStoryBeats.map(beat => beat.id))
        .toEqual([
          "situation",
          "desire",
          "opening",
          "cost",
          "low-point",
          "choice",
          "turn",
          "mature-method",
        ]);
      expect(golden.lifeScroll.daoNotes.length).toBeGreaterThanOrEqual(2);
      expect(golden.lifeScroll.daoNotes.length).toBeLessThanOrEqual(4);
      expect(new Set(golden.lifeScroll.daoNotes.map(note =>
        note.internalSourceId
      )).size).toBe(golden.lifeScroll.daoNotes.length);
      const daoTensions = golden.lifeScroll.daoNotes.map(note =>
        note.plainCommentary.storyConnection.match(/“([^”]+)”/u)?.[1]
      );
      expect(daoTensions.every(Boolean)).toBe(true);
      expect(new Set(daoTensions).size)
        .toBe(golden.lifeScroll.daoNotes.length);
      for (const note of golden.lifeScroll.daoNotes) {
        const { traditionalMeaning, storyConnection, sceneGuidance } =
          note.plainCommentary;
        expect(countHan(traditionalMeaning)).toBeGreaterThanOrEqual(45);
        expect(countHan(traditionalMeaning)).toBeLessThanOrEqual(90);
        expect(countHan(storyConnection)).toBeGreaterThanOrEqual(55);
        expect(countHan(storyConnection)).toBeLessThanOrEqual(110);
        expect(countHan(sceneGuidance)).toBeGreaterThanOrEqual(45);
        expect(countHan(sceneGuidance)).toBeLessThanOrEqual(90);
      }

      expect(golden.chartNarrative.professionalTranslations).toHaveLength(5);
      for (const translation of
        golden.chartNarrative.professionalTranslations) {
        expect(countHan(translation.whatItMeans))
          .toBeGreaterThanOrEqual(45);
        expect(countHan(translation.lifeScene))
          .toBeGreaterThanOrEqual(55);
        expect(countHan(translation.practicalGuidance))
          .toBeGreaterThanOrEqual(45);
      }
      for (const beat of [
        golden.chartNarrative.self,
        golden.chartNarrative.career,
        golden.chartNarrative.relationship,
        golden.chartNarrative.rhythm,
      ]) {
        for (const field of BEAT_FIELDS) {
          expect(beat[field].trim()).not.toBe("");
        }
      }
      expect(golden.chartNarrative.careerAdvice).toHaveLength(2);
      expect(golden.chartNarrative.relationshipAdvice).toHaveLength(2);
      expect(golden.chartNarrative.rhythmAdvice).toHaveLength(2);

      const fortuneStatus = golden.fortuneStory.status === "available"
        ? "available"
        : golden.fortuneStory.reason;
      expect(fortuneStatus).toBe(goldenCase.expectedFortune);
      if (golden.fortuneStory.status === "available") {
        expect(golden.fortuneStory.periods.length).toBeGreaterThan(0);
        for (const period of golden.fortuneStory.periods) {
          expect(period.actions).toHaveLength(3);
          expect(period.openingScene.trim()).not.toBe("");
          expect(period.careerScene.trim()).not.toBe("");
          expect(period.relationshipScene.trim()).not.toBe("");
          expect(period.rhythmScene.trim()).not.toBe("");
          expect(period.years.length).toBeGreaterThan(0);
        }
      } else {
        expect(golden.fortuneStory.explanation.trim()).not.toBe("");
        expect("periods" in golden.fortuneStory).toBe(false);
      }

      expect(publicText).not.toMatch(FORBIDDEN_PUBLIC_COPY);
      expect(publicText).not.toMatch(EXACT_FUTURE_PROMISE);
      expect(publicText).not.toMatch(
        /(?:防御|调整)时[，,]?可以|时[，,]可以[^。！？；]{0,20}时/u,
      );
      const normalizedPublicText = hanOnly(publicText);
      for (const template of FORBIDDEN_STORY_TEMPLATES) {
        expect(normalizedPublicText).not.toContain(hanOnly(template));
      }
      expect(repetitionRatio(lifeText)).toBeLessThan(0.03);
      expect(repetitionRatio(chartText)).toBeLessThan(0.05);
      expect(repeatedLongFragments(lifeText)).toEqual([]);
      expect(repeatedLongFragments(chartText)).toEqual([]);
    },
  );

  it("changes visible substance across elements and structures", () => {
    const signatures = goldens.map(golden =>
      [...lifeVisible(golden.lifeScroll), ...chartVisible(golden.chartNarrative)]
        .join("")
    );
    expect(new Set(signatures).size).toBe(goldens.length);

    for (const element of ELEMENTS) {
      const elementSignatures = goldens
        .filter(golden => golden.coverage.dayMasterElement === element)
        .map(golden =>
          [...lifeVisible(golden.lifeScroll), ...chartVisible(
            golden.chartNarrative,
          )].join("")
        );
      expect(elementSignatures.length).toBeGreaterThan(0);
      expect(new Set(elementSignatures).size).toBe(elementSignatures.length);
    }

    const onePerElement = ELEMENTS.map(element =>
      goldens.find(golden => golden.coverage.dayMasterElement === element)!
    );
    const sentenceSets = onePerElement.map(golden =>
      new Set(
        normalizedSentences(lifeMainArcs(golden.lifeScroll))
          .filter(sentence => countHan(sentence) >= 16),
      )
    );
    const sharedByAllElements = [...sentenceSets[0]].filter(sentence =>
      sentenceSets.slice(1).every(sentences => sentences.has(sentence))
    );
    expect(sharedByAllElements).toEqual([]);
  });

  it("records an honest independent-model review and pending human review", () => {
    const markdown = readFileSync(REVIEW_PATH, "utf8");
    const generatorId = reviewField(markdown, "generatorId");
    const reviewerId = reviewField(markdown, "independentReviewerId");

    expect(reviewField(markdown, "reviewKind")).toBe("independent-model");
    expect(reviewerId).not.toBe(generatorId);
    expect(reviewField(markdown, "humanReviewStatus")).toBe("pending");
    expect(reviewField(markdown, "humanReviewerId")).toBe("null");
    expect(reviewField(markdown, "automatedGateDecision")).toBe("approved");
    expect(markdown).not.toMatch(
      /human(?:Review|Reviewer|Signoff)[^\n]*(?:approved|通过|已审)/iu,
    );

    const rows = reviewRows(markdown);
    expect(rows).toHaveLength(STORY_GOLDEN_CASES.length);
    expect(rows.map(row => row[0])).toEqual(
      STORY_GOLDEN_CASES.map(goldenCase => goldenCase.id),
    );
    for (const [index, row] of rows.entries()) {
      const scores = row.slice(1, 9).map(Number);
      expect(scores.every(score =>
        Number.isInteger(score) && score >= 0 && score <= 2
      )).toBe(true);
      expect(scores.reduce((sum, score) => sum + score, 0))
        .toBeGreaterThanOrEqual(14);
      expect(scores[3]).toBeGreaterThanOrEqual(1);
      expect(scores[4]).toBeGreaterThanOrEqual(1);
      expect(row[9]).toBe(STORY_GOLDEN_CASES[index].expectedFortune);
      for (const cell of row.slice(10, 14)) {
        expect(cell.length).toBeGreaterThanOrEqual(8);
      }
      expect(row[14]).toBe("independent-model-approved");
    }
  });
});
