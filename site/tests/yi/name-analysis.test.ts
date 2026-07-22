import { describe, expect, it, vi } from "vitest";
import {
  analyzeName,
  buildNameChartInteractionInput,
  type NameAnalysisRequest,
  type UsageRiskInput,
} from "../../lib/yi/name-analysis";
import { findReviewedNameCharacter } from "../../lib/yi/name-data";
import * as nameDataModule from "../../lib/yi/name-data";
import {
  NAME_REALITY_SCORE_VERSION,
  scoreNameRealityTest,
  type NameRealityTestAnswers,
} from "../../lib/yi/name-score-contract";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { BirthInput } from "../../lib/yi/types";

const allVerified: NameRealityTestAnswers = {
  hearing: "both",
  inputDisplay: "both",
  documents: "both",
  meaningAcceptance: "accepted",
};

const exactBirth: BirthInput = {
  name: "林知远",
  date: "1985-02-20",
  time: "10:20",
  location: "成都",
  gender: "unspecified",
  timeConfidence: "exact",
};

const firstRisk: UsageRiskInput = {
  id: "confirmed-severe-homophone-or-ambiguity",
  severity: "hard",
  evidence: "本人和人工复核均确认，长期称呼中持续出现严重歧义。",
  manuallyReviewed: true,
  userConfirmed: true,
};

const secondRisk: UsageRiskInput = {
  id: "persistent-input-document-or-calling-issue",
  severity: "hard",
  evidence: "本人和人工复核均确认，多个实际系统持续无法正确录入。",
  manuallyReviewed: true,
  userConfirmed: true,
};

async function analyzeReviewed(overrides: Partial<NameAnalysisRequest> = {}) {
  return analyzeName({ rawInput: "林知远", realityTest: allVerified, ...overrides });
}

describe("name analysis input and glyph adoption", () => {
  it("returns null for whitespace-only input without invoking the lazy core loader", async () => {
    const loadCore = vi.fn(async () => {
      throw new Error("the 8105 core must not load");
    });

    await expect(analyzeName({ rawInput: " \t\n " }, { loadCore })).resolves.toBeNull();
    expect(loadCore).not.toHaveBeenCalled();
  });

  it("preserves the complete raw input and keeps the exact current simplified glyph", async () => {
    const result = await analyzeName({ rawInput: "艺 " });

    expect(result?.rawInput).toBe("艺 ");
    expect(result?.characters[0]).toMatchObject({
      rawCluster: "艺",
      inputGlyph: "艺",
      adoptedGlyph: "艺",
      glyphBasis: "registered-input",
    });
    expect(result?.characters[0].variantCandidates.map(candidate => candidate.glyph)).toContain("藝");
  });

  it("never auto-adopts either a unique or a multi-candidate traditional proposal", async () => {
    const [unique, multiple] = await Promise.all([
      analyzeName({ rawInput: "艺", mode: "traditional-reference" }),
      analyzeName({ rawInput: "发", mode: "traditional-reference" }),
    ]);

    for (const result of [unique, multiple]) {
      expect(result?.characters[0].adoptedGlyph).toBeNull();
      expect(result?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "adopted-glyph-unconfirmed" }),
      ]));
    }
    expect(unique?.characters[0].variantCandidates.map(candidate => candidate.glyph)).toEqual(["藝"]);
    expect(multiple?.characters[0].variantCandidates.map(candidate => candidate.glyph)).toEqual(["發", "髮"]);
  });

  it("accepts only an explicitly selected glyph from the candidate set", async () => {
    const [valid, invalid, invalidWithoutCandidates] = await Promise.all([
      analyzeName({ rawInput: "发", mode: "traditional-reference", traditionalSelections: { 0: "發" } }),
      analyzeName({ rawInput: "发", mode: "traditional-reference", traditionalSelections: { 0: "髪" } }),
      analyzeName({ rawInput: "林", mode: "traditional-reference", traditionalSelections: { 0: "森" } }),
    ]);

    expect(valid?.characters[0]).toMatchObject({
      adoptedGlyph: "發",
      glyphBasis: "confirmed-traditional-reference",
    });
    expect(valid?.characters[0].analysisBlockers).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "adopted-glyph-unconfirmed" }),
    ]));
    expect(invalid?.characters[0].adoptedGlyph).toBeNull();
    expect(invalid?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "adopted-glyph-unconfirmed" }),
    ]));
    expect(invalidWithoutCandidates?.characters[0].adoptedGlyph).toBeNull();
    expect(invalidWithoutCandidates?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "adopted-glyph-unconfirmed" }),
    ]));
  });

  it("uses only the three finite reviewed traditional pairs with exact Unicode 17 engineering facts", () => {
    const pairs = (nameDataModule as typeof nameDataModule & {
      REVIEWED_TRADITIONAL_PAIRS?: Array<{
        inputGlyph: string;
        adoptedGlyph: string;
        readings: Array<{ pinyin: string; sourceProperty: string }>;
        radicalStrokeRecords: Array<{ value: string; sourceProperty: string }>;
        totalStrokeRecord: { rawValue: string; sourceProperty: string };
        meaning: string;
        semantic: { methodId: string; sourceIds: string[] };
      }>;
    }).REVIEWED_TRADITIONAL_PAIRS;

    expect(pairs?.map(pair => `${pair.inputGlyph}→${pair.adoptedGlyph}`)).toEqual(["发→發", "发→髮", "艺→藝"]);
    expect(pairs).toEqual([
      expect.objectContaining({
        adoptedGlyph: "發",
        readings: [{ pinyin: "fā", sourceProperty: "kMandarin", sourceId: "unicode.unihan-17.data", tone: 1 }],
        radicalStrokeRecords: [{ value: "105.7", sourceProperty: "kRSUnicode", sourceId: "unicode.unihan-17.data" }],
        totalStrokeRecord: { rawValue: "12", sourceProperty: "kTotalStrokes", sourceId: "unicode.unihan-17.data", informative: true },
      }),
      expect.objectContaining({
        adoptedGlyph: "髮",
        readings: [
          { pinyin: "fà", sourceProperty: "kMandarin", sourceId: "unicode.unihan-17.data", tone: 4 },
          { pinyin: "fǎ", sourceProperty: "kMandarin", sourceId: "unicode.unihan-17.data", tone: 3 },
        ],
        radicalStrokeRecords: [{ value: "190.5", sourceProperty: "kRSUnicode", sourceId: "unicode.unihan-17.data" }],
        totalStrokeRecord: { rawValue: "15", sourceProperty: "kTotalStrokes", sourceId: "unicode.unihan-17.data", informative: true },
      }),
      expect.objectContaining({
        adoptedGlyph: "藝",
        readings: [{ pinyin: "yì", sourceProperty: "kMandarin", sourceId: "unicode.unihan-17.data", tone: 4 }],
        radicalStrokeRecords: [{ value: "140.15", sourceProperty: "kRSUnicode", sourceId: "unicode.unihan-17.data" }],
        totalStrokeRecord: { rawValue: "18", sourceProperty: "kTotalStrokes", sourceId: "unicode.unihan-17.data", informative: true },
      }),
    ]);
    for (const pair of pairs ?? []) {
      expect(pair.meaning.length).toBeGreaterThan(0);
      expect(pair.semantic.methodId).toBe("name.semantic-five-elements.v1");
      expect(pair.semantic.sourceIds).toEqual(expect.arrayContaining([
        "name.semantic-five-elements.v1",
        "unicode.unihan-17.data",
      ]));
    }
  });

  it("analyzes reviewed traditional pairs end to end while retaining input TGH facts separately", async () => {
    const [development, hairPending, hairConfirmed, art] = await Promise.all([
      analyzeName({ rawInput: "发", mode: "traditional-reference", traditionalSelections: { 0: "發" } }),
      analyzeName({ rawInput: "发", mode: "traditional-reference", traditionalSelections: { 0: "髮" } }),
      analyzeName({ rawInput: "发", mode: "traditional-reference", traditionalSelections: { 0: "髮" }, actualReadings: { 0: "fà" } }),
      analyzeName({ rawInput: "艺", mode: "traditional-reference", traditionalSelections: { 0: "藝" } }),
    ]);
    const cases = [
      { result: development, glyph: "發", reading: "fā", radical: "105.7", strokes: "12" },
      { result: hairConfirmed, glyph: "髮", reading: "fà", radical: "190.5", strokes: "15" },
      { result: art, glyph: "藝", reading: "yì", radical: "140.15", strokes: "18" },
    ];

    for (const { result, glyph, reading, radical, strokes } of cases) {
      const character = result!.characters[0] as NonNullable<typeof result>["characters"][0] & {
        inputTghFacts?: {
          glyph: string;
          tghIndex: number;
          readings: Array<{ pinyin: string }>;
          radicalStrokeRecords: Array<{ value: string }>;
          totalStrokeRecord: { rawValue: string };
        };
      };
      expect(character).toMatchObject({
        inputGlyph: glyph === "藝" ? "艺" : "发",
        adoptedGlyph: glyph,
        tghIndex: null,
        adoptedReading: reading,
        meaning: expect.any(String),
        semantic: expect.objectContaining({ methodId: "name.semantic-five-elements.v1" }),
        analysisBlockers: [],
      });
      expect(character.radicalStrokeRecords.map(record => record.value)).toEqual([radical]);
      expect(character.totalStrokeRecord?.rawValue).toBe(strokes);
      expect(character.inputTghFacts).toMatchObject({
        glyph: glyph === "藝" ? "艺" : "发",
        tghIndex: expect.any(Number),
      });
      expect(character.inputTghFacts?.radicalStrokeRecords.length).toBeGreaterThan(0);
      expect(character.inputTghFacts?.totalStrokeRecord).not.toBeNull();
    }

    expect(hairPending?.characters[0].readings.map(reading => reading.pinyin)).toEqual(["fà", "fǎ"]);
    expect(hairPending?.characters[0].analysisBlockers).toEqual([
      expect.objectContaining({ id: "actual-reading-unconfirmed" }),
    ]);
    expect(hairPending?.characters[0].analysisBlockers).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "unsupported-input" }),
      expect.objectContaining({ id: "key-meaning-unreviewed" }),
    ]));

    const unreviewed = await analyzeName({ rawInput: "后", mode: "traditional-reference", traditionalSelections: { 0: "後" } });
    expect(unreviewed?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "unsupported-input" }),
      expect.objectContaining({ id: "key-meaning-unreviewed" }),
    ]));
  });

  it("requires an actual reading for a multi-reading glyph and never guesses an unreviewed meaning", async () => {
    const [pending, confirmed, invalidSingleReading] = await Promise.all([
      analyzeName({ rawInput: "行" }),
      analyzeName({ rawInput: "行", actualReadings: { 0: "xíng" } }),
      analyzeName({ rawInput: "林", actualReadings: { 0: "lǐn" } }),
    ]);

    expect(pending?.characters[0].readings.map(reading => reading.pinyin)).toEqual(["háng", "héng", "xíng"]);
    expect(pending?.characters[0].adoptedReading).toBeNull();
    expect(pending?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "actual-reading-unconfirmed" }),
      expect.objectContaining({ id: "key-meaning-unreviewed" }),
    ]));
    expect(confirmed?.characters[0].adoptedReading).toBe("xíng");
    expect(confirmed?.characters[0].semantic).toBeNull();
    expect(confirmed?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "key-meaning-unreviewed" }),
    ]));
    expect(invalidSingleReading?.characters[0].adoptedReading).toBeNull();
    expect(invalidSingleReading?.characters[0].analysisBlockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "actual-reading-unconfirmed" }),
    ]));
  });

  it("recognizes a common compound surname without inventing unsupported character facts", async () => {
    const result = await analyzeName({ rawInput: "欧阳行" });

    expect(result?.surname).toEqual({ value: "欧阳", kind: "compound" });
    expect(result?.givenName).toBe("行");
    expect(result?.characters.at(-1)?.semantic).toBeNull();
  });
});

describe("reviewed semantics, blockers, risks, and advice", () => {
  it("aggregates only reviewed semantic vectors, normalizes them, and exposes coverage and methods", async () => {
    const reviewed = await analyzeReviewed();
    const mixed = await analyzeName({ rawInput: "林行", actualReadings: { 1: "xíng" } });

    expect(reviewed?.semanticSummary).toMatchObject({ reviewedCount: 3, totalCount: 3, coverage: 1 });
    expect(Object.values(reviewed?.semanticSummary?.vector ?? {}).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(reviewed?.semanticSummary?.methodIds).toEqual(["name.semantic-five-elements.v1"]);
    expect(reviewed?.semanticSummary?.sourceIds).toEqual(expect.arrayContaining([
      "name.semantic-five-elements.v1",
      "classic.shangshu-hongfan-five-elements",
    ]));
    expect(mixed?.semanticSummary).toMatchObject({ reviewedCount: 1, totalCount: 2, coverage: 0.5 });
    expect(mixed?.characters[1].radicalStrokeRecords.length).toBeGreaterThan(0);
    expect(mixed?.characters[1].totalStrokeRecord).not.toBeNull();
    expect(mixed?.characters[1].semantic).toBeNull();
  });

  it("keeps runtime data blockers separate from jointly confirmed usage risks", async () => {
    const unconfirmedRisk: UsageRiskInput = { ...firstRisk, userConfirmed: false };
    const result = await analyzeName({ rawInput: "行", usageRisks: [unconfirmedRisk, firstRisk] });

    expect(result?.blockers.length).toBeGreaterThan(0);
    expect(result?.confirmedUsageRisks).toEqual([firstRisk]);
    expect(result?.characters[0].analysisBlockers.every(blocker => !("severity" in blocker))).toBe(true);
    expect(result?.confirmedUsageRisks.every(risk => !("id" in risk) || risk.manuallyReviewed && risk.userConfirmed)).toBe(true);
  });

  it.each([
    ["hold", { rawInput: "行", usageRisks: [firstRisk, secondRisk] }],
    ["keep", { rawInput: "林知远" }],
    ["micro-adjust", { rawInput: "林知远", usageRisks: [firstRisk] }],
    ["rebuild", { rawInput: "林知远", usageRisks: [firstRisk, secondRisk] }],
    ["rebuild-direction", { rawInput: "林远知", mode: "candidate", requestFreshDirection: true }],
  ] as const)("returns the %s advice tier only from blockers, confirmed risks, or an explicit fresh-direction request", async (tier, request) => {
    const result = await analyzeName(request);

    expect(result?.advice.tier).toBe(tier);
    if (tier === "hold") {
      expect(result?.advice.action).toContain("先确认");
      expect(result?.advice.action).not.toContain("建议改名");
    }
  });

  it("does not let a reality score or chart-side cultural reading change the advice tier", async () => {
    const chart = calculateFourPillars(exactBirth);
    const lowScore: NameRealityTestAnswers = {
      hearing: "none",
      inputDisplay: "none",
      documents: "none",
      meaningAcceptance: "severe-confirmed",
    };
    const result = await analyzeName({ rawInput: "林知远", chart, realityTest: lowScore });

    expect(result?.realityScore.total).toBe(0);
    expect(result?.advice.tier).toBe("keep");
  });
});

describe("reality-test score contract", () => {
  it("uses version 1.0 exact rule IDs and fixed, non-reweighted values", () => {
    expect(NAME_REALITY_SCORE_VERSION).toBe("1.0");
    expect(scoreNameRealityTest(allVerified)).toMatchObject({
      version: "1.0",
      total: 100,
      totalStatus: "complete",
      dimensions: {
        hearing: { score: 30, ruleId: "R-HEAR-30" },
        inputDisplay: { score: 25, ruleId: "R-INPUT-25" },
        documents: { score: 25, ruleId: "R-DOC-25" },
        meaningAcceptance: { score: 20, ruleId: "R-MEAN-20" },
      },
    });

    expect(scoreNameRealityTest({ ...allVerified, hearing: "one" })).toMatchObject({
      total: 85,
      dimensions: { hearing: { score: 15, ruleId: "R-HEAR-15" } },
    });
    expect(scoreNameRealityTest({ ...allVerified, inputDisplay: "one", documents: "one", meaningAcceptance: "one-long-term-ambiguity" })).toMatchObject({
      total: 60,
      dimensions: {
        inputDisplay: { score: 10, ruleId: "R-INPUT-10" },
        documents: { score: 10, ruleId: "R-DOC-10" },
        meaningAcceptance: { score: 10, ruleId: "R-MEAN-10" },
      },
    });
    expect(scoreNameRealityTest({ ...allVerified, hearing: "none", inputDisplay: "none", documents: "none", meaningAcceptance: "severe-confirmed" })).toMatchObject({
      total: 0,
      dimensions: {
        hearing: { score: 0, ruleId: "R-HEAR-00" },
        inputDisplay: { score: 0, ruleId: "R-INPUT-00" },
        documents: { score: 0, ruleId: "R-DOC-00" },
        meaningAcceptance: { score: 0, ruleId: "R-MEAN-00" },
      },
    });
  });

  it("returns no total for any unverified dimension and for an analysis blocker", async () => {
    const unverified = scoreNameRealityTest({ ...allVerified, documents: "unverified" });
    const blocked = await analyzeName({ rawInput: "行", realityTest: allVerified });

    expect(unverified).toMatchObject({ total: null, totalStatus: "unverified" });
    expect(unverified.dimensions.documents).toMatchObject({ score: null, ruleId: "R-DOC-UNVERIFIED" });
    expect(blocked?.realityScore).toMatchObject({ total: null, totalStatus: "blocked" });
  });

  it("scores the same answers identically for an exact reviewed full name and an unreviewed combination", async () => {
    const [reviewed, unreviewedCombination] = await Promise.all([
      analyzeName({ rawInput: "林知远", realityTest: allVerified }),
      analyzeName({ rawInput: "林远知", realityTest: allVerified }),
    ]);

    expect(reviewed?.exactReviewedFullName?.fullName).toBe("林知远");
    expect(unreviewedCombination?.exactReviewedFullName).toBeNull();
    expect(unreviewedCombination?.fullNameReviewStatus).toBe("待人工复核");
    expect(unreviewedCombination?.blockers).toEqual([]);
    expect(unreviewedCombination?.realityScore).toEqual(reviewed?.realityScore);
  });

  it("returns a defensive copy of exact reviewed full-name metadata", async () => {
    const first = await analyzeName({ rawInput: "林知远" });
    expect(first?.exactReviewedFullName).not.toBeNull();
    first!.exactReviewedFullName!.adoptedReadings[0] = "tampered";

    const second = await analyzeName({ rawInput: "林知远" });
    expect(second?.exactReviewedFullName?.adoptedReadings[0]).toBe("lín");
  });
});

describe("exact reviewed full-name resolution", () => {
  it("resolves candidate mode only after adopted glyphs, readings, and basis exactly match", async () => {
    const [candidate, nearMiss, readingMismatch, currentReadingMismatch, traditionalMismatch] = await Promise.all([
      analyzeName({ rawInput: "林知远", mode: "candidate" }),
      analyzeName({ rawInput: "林远知", mode: "candidate" }),
      analyzeName({ rawInput: "林知远", mode: "candidate", actualReadings: { 0: "lǐn" } }),
      analyzeName({ rawInput: "林知远", actualReadings: { 0: "lǐn" } }),
      analyzeName({ rawInput: "林知远", mode: "traditional-reference", traditionalSelections: { 2: "遠" } }),
    ]);

    expect(candidate?.exactReviewedFullName).toMatchObject({
      fullName: "林知远",
      adoptedGlyphBasis: "registered-input",
      adoptedReadings: ["lín", "zhī", "yuǎn"],
    });
    expect(candidate?.fullNameReviewStatus).toBe("已审校");
    expect(nearMiss?.exactReviewedFullName).toBeNull();
    expect(readingMismatch?.exactReviewedFullName).toBeNull();
    expect(currentReadingMismatch?.exactReviewedFullName).toBeNull();
    expect(traditionalMismatch?.exactReviewedFullName).toBeNull();
  });
});

describe("directions and chart side-by-side boundaries", () => {
  it("returns exactly three finite reviewed directions and never manufactures reviewed full names", async () => {
    const result = await analyzeName({ rawInput: "林远知" });

    expect(result?.directions).toHaveLength(3);
    for (const direction of result?.directions ?? []) {
      expect(direction.exampleCharacters.length).toBeGreaterThan(0);
      for (const example of direction.exampleCharacters) {
        expect(findReviewedNameCharacter(example.glyph)).not.toBeNull();
        expect(example).not.toHaveProperty("fullName");
      }
    }
    expect(result?.exactReviewedFullName).toBeNull();
    expect(result?.frequencyContext).toContain("只用于覆盖");
    expect(result?.frequencyContext).toContain("不用于质量判断或性别方向建议");
  });

  it("excludes an unknown hour with an explicit boundary and makes year/month boundary charts unavailable", () => {
    const unknownHour = calculateFourPillars({ ...exactBirth, time: null, timeConfidence: "unknown" });
    const boundary = calculateFourPillars({ ...exactBirth, date: "2024-02-04", time: null, timeConfidence: "unknown" });
    const unknownInput = buildNameChartInteractionInput(unknownHour);
    const boundaryInput = buildNameChartInteractionInput(boundary);

    expect(unknownInput.certainPillars).not.toHaveProperty("hour");
    expect(unknownInput.unavailableReasons).toContain("unknown-time");
    expect(boundaryInput.unavailableReasons).toEqual(expect.arrayContaining(["year-boundary", "month-boundary", "unknown-time"]));
    expect(boundaryInput.available).toBe(false);
  });

  it("uses structured stable pillars without mutating the chart or professional report", async () => {
    const chart = calculateFourPillars(exactBirth);
    const report = buildProfessionalReport(chart, exactBirth);
    const chartBefore = structuredClone(chart);
    const reportBefore = structuredClone(report);
    const result = await analyzeName({ rawInput: "林知远", chart, professionalReport: report });

    expect(result?.chartInteraction?.input.certainPillars.year).toEqual(chart.pillars.year);
    expect(result?.chartInteraction?.input.certainPillars.hour).toEqual(chart.pillars.hour);
    expect(chart).toEqual(chartBefore);
    expect(report).toEqual(reportBefore);
    expect(result?.chartInteraction?.boundary).toContain("姓名不会改写出生盘");
  });

  it("defensively copies every field of every returned certain pillar", () => {
    const chart = calculateFourPillars(exactBirth);
    const chartBefore = structuredClone(chart);
    const input = buildNameChartInteractionInput(chart);
    const fields = ["stem", "branch", "element", "branchElement", "label"] as const;

    for (const key of ["year", "month", "day", "hour"] as const) {
      const returned = input.certainPillars[key];
      expect(returned).not.toBe(chart.pillars[key]);
      for (const field of fields) {
        (returned as unknown as Record<string, string>)[field] = `tampered-${key}-${field}`;
      }
    }

    expect(chart).toEqual(chartBefore);
  });

  it("keeps main chart and professional report outputs invariant when only the name changes", async () => {
    const firstBirth = { ...exactBirth, name: "林知远" };
    const secondBirth = { ...exactBirth, name: "林远知" };
    const firstChart = calculateFourPillars(firstBirth);
    const secondChart = calculateFourPillars(secondBirth);
    const firstReport = buildProfessionalReport(firstChart, firstBirth);
    const secondReport = buildProfessionalReport(secondChart, secondBirth);

    await Promise.all([
      analyzeName({ rawInput: firstBirth.name, chart: firstChart, professionalReport: firstReport }),
      analyzeName({ rawInput: secondBirth.name, chart: secondChart, professionalReport: secondReport }),
    ]);

    expect(secondChart).toEqual(firstChart);
    expect(secondReport).toEqual(firstReport);
  });

  it("limits the first chart reading to side-by-side facts and sources", async () => {
    const chart = calculateFourPillars(exactBirth);
    const result = await analyzeName({ rawInput: "林知远", chart });
    const serialized = JSON.stringify(result?.chartInteraction);

    expect(result?.chartInteraction?.available).toBe(true);
    expect(result?.chartInteraction?.sourceIds).toEqual(expect.arrayContaining([
      "calendar.eight-char.v1",
      "name.semantic-five-elements.v1",
    ]));
    expect(serialized).not.toMatch(/匹配|适配|补益|补救|生克|喜用|幸运元素|缺什么补什么/);
  });
});
