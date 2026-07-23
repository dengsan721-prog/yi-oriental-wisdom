import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { analyzeName } from "../../lib/yi/name-analysis";
import { REVIEWED_NAME_ELEMENT_RECORDS } from "../../lib/yi/name-element-data";
import {
  calculateNameElementCoverage,
  getStableVisibleChartElements,
  NAME_COVERAGE_SCOPE_NOTICE,
  toNameElementCoverageCharacters,
  type NameElementCoverageCharacter,
} from "../../lib/yi/name-element-coverage";
import type { NameCharacterRecord } from "../../lib/yi/name-types";
import type {
  ElementName,
  FourPillarsResult,
  Pillar,
} from "../../lib/yi/types";

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const PILLARS = ["year", "month", "day", "hour"] as const;

const seed = calculateFourPillars({
  name: "测试",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});

function pillar(
  element: ElementName,
  branchElement: ElementName,
  template: Pillar = seed.pillars.year,
): Pillar {
  return { ...template, element, branchElement };
}

function chartWithVisibleElements(
  elements: readonly ElementName[],
): FourPillarsResult {
  const pairs = PILLARS.map((_, index) => {
    const first = elements[index * 2] ?? elements[0] ?? "木";
    const second = elements[index * 2 + 1] ?? first;
    return pillar(first, second);
  });
  const presentPillarCount = Math.ceil(elements.length / 2);
  return {
    ...seed,
    pillars: {
      year: pairs[0],
      month: pairs[1],
      day: pairs[2],
      hour: pairs[3],
    },
    ambiguousPillars: PILLARS.slice(presentPillarCount),
  };
}

function reviewedCharacter(
  record: (typeof REVIEWED_NAME_ELEMENT_RECORDS)[number],
): NameElementCoverageCharacter {
  return {
    inputGlyph: record.glyph,
    adoptedGlyph: record.glyph,
    adoptedReading: record.displayPinyin,
    adoptedMeaning: record.adoptedMeaning,
    unsupportedInput: false,
  };
}

function approvedRecord(element?: ElementName) {
  const record = REVIEWED_NAME_ELEMENT_RECORDS.find(candidate =>
    candidate.reviewDecision === "approved"
    && (element === undefined || candidate.element === element));
  if (!record || record.reviewDecision !== "approved") {
    throw new Error(`Approved ${element ?? "name element"} fixture is required`);
  }
  return record;
}

function pendingRecord() {
  const record = REVIEWED_NAME_ELEMENT_RECORDS.find(
    candidate => candidate.reviewDecision === "pending",
  );
  if (!record || record.reviewDecision !== "pending") {
    throw new Error("Pending name element fixture is required");
  }
  return record;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe("stable visible chart elements", () => {
  it("uses visible stem and branch elements and excludes counts and hidden stems", () => {
    const woodPillar = pillar("木", "木");
    const visibleWoodOnly: FourPillarsResult = {
      ...seed,
      pillars: {
        year: { ...woodPillar },
        month: { ...woodPillar },
        day: { ...woodPillar },
        hour: { ...woodPillar },
      },
      elementCounts: { 木: 0, 火: 99, 土: 99, 金: 99, 水: 99 },
      ambiguousPillars: [],
    };
    const withHiddenStemMetadata = {
      ...visibleWoodOnly,
      hiddenStems: [
        { stem: "丙", element: "火" },
        { stem: "戊", element: "土" },
        { stem: "辛", element: "金" },
        { stem: "癸", element: "水" },
      ],
    };

    expect(getStableVisibleChartElements(visibleWoodOnly)).toEqual(["木"]);
    expect(getStableVisibleChartElements(withHiddenStemMetadata)).toEqual(["木"]);
  });

  it("includes both visible fields, skips whole ambiguous pillars and missing hour, and keeps fixed order", () => {
    const chart: FourPillarsResult = {
      ...seed,
      pillars: {
        year: pillar("水", "火"),
        month: pillar("金", "土"),
        day: pillar("木", "水"),
        hour: null,
      },
      ambiguousPillars: ["month", "hour"],
    };

    expect(getStableVisibleChartElements(chart)).toEqual(["木", "火", "水"]);

    for (const ambiguous of PILLARS) {
      const candidate: FourPillarsResult = {
        ...seed,
        pillars: {
          year: pillar("木", "火"),
          month: pillar("土", "金"),
          day: pillar("水", "木"),
          hour: pillar("火", "土"),
        },
        ambiguousPillars: [ambiguous],
      };
      const excluded = candidate.pillars[ambiguous];
      const expected = ELEMENTS.filter(element =>
        PILLARS.filter(key => key !== ambiguous).some(key => {
          const current = candidate.pillars[key];
          return current?.element === element || current?.branchElement === element;
        }));
      expect(getStableVisibleChartElements(candidate)).toEqual(expected);
      expect(excluded).not.toBeNull();
    }
  });

  it("does not inspect element counts or professional metadata", () => {
    const chart = {
      ...chartWithVisibleElements(["木"]),
      elementCounts: new Proxy(seed.elementCounts, {
        get() {
          throw new Error("elementCounts must not be read");
        },
      }),
      professional: new Proxy(seed.professional, {
        get() {
          throw new Error("professional must not be read");
        },
      }),
    };

    expect(getStableVisibleChartElements(chart)).toEqual(["木"]);
  });
});

describe("name coverage character conversion", () => {
  it("maps meaning to adoptedMeaning, detects unsupported input, and ignores semantic weights", async () => {
    const result = await analyzeName({ rawInput: "宋江" });
    if (!result) throw new Error("宋江 analysis fixture is required");
    const first = {
      ...result.characters[0],
      analysisBlockers: [
        ...result.characters[0].analysisBlockers,
        {
          id: "unsupported-input",
          evidence: "test-only unsupported evidence",
        } as const,
      ],
    } satisfies NameCharacterRecord;
    const guarded = new Proxy(first, {
      get(target, property, receiver) {
        if (property === "semantic") {
          throw new Error("semantic must not be read");
        }
        return Reflect.get(target, property, receiver);
      },
    });

    expect(toNameElementCoverageCharacters([guarded])).toEqual([{
      inputGlyph: first.inputGlyph,
      adoptedGlyph: first.adoptedGlyph,
      adoptedReading: first.adoptedReading,
      adoptedMeaning: first.meaning,
      unsupportedInput: true,
    }]);
  });
});

describe("pending name element gates", () => {
  const approved = approvedRecord();
  const base = reviewedCharacter(approved);

  it.each([
    ["glyph-unconfirmed", { ...base, adoptedGlyph: null }],
    ["reading-unconfirmed", { ...base, adoptedReading: null }],
    ["meaning-unconfirmed", { ...base, adoptedMeaning: null }],
    ["unreviewed-character", {
      ...base,
      inputGlyph: "🧪",
      adoptedGlyph: "🧪",
    }],
    ["element-classification-pending", reviewedCharacter(pendingRecord())],
    ["unsupported-input", { ...base, unsupportedInput: true }],
  ] as const)("returns %s without a score", (reason, character) => {
    const result = calculateNameElementCoverage({
      chart: chartWithVisibleElements(["木"]),
      characters: [character],
    });

    expect(result).toMatchObject({
      status: "pending",
      reasons: [reason],
      notice: "资料待确认，暂不评分",
      scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
    });
    expect("score" in result).toBe(false);
    expect("coveredCount" in result).toBe(false);
  });

  it("deduplicates reasons and pending glyphs in first-seen order", () => {
    const readingPending = { ...base, adoptedReading: null };
    const unsupported = {
      ...base,
      inputGlyph: "待",
      adoptedGlyph: "待",
      unsupportedInput: true,
    };
    const result = calculateNameElementCoverage({
      chart: null,
      characters: [readingPending, readingPending, unsupported, unsupported],
    });

    expect(result).toEqual({
      status: "pending",
      reasons: ["chart-unavailable", "reading-unconfirmed", "unsupported-input"],
      pendingGlyphs: [base.adoptedGlyph, "待"],
      notice: "资料待确认，暂不评分",
      scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
    });
    expect("score" in result).toBe(false);
  });
});

describe("name element score", () => {
  it("uses an approved corpus record and the exact 20-point formula", () => {
    const result = calculateNameElementCoverage({
      chart: chartWithVisibleElements([]),
      characters: [reviewedCharacter(approvedRecord("木"))],
    });

    expect(result).toMatchObject({
      status: "complete",
      coveredCount: 1,
      score: 20,
      notice: "只看五行覆盖，不是姓名好坏",
      scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
    });
  });

  it.each([0, 1, 2, 3, 4, 5] as const)(
    "returns only the exact score domain for %i covered elements",
    coveredCount => {
      const result = calculateNameElementCoverage({
        chart: chartWithVisibleElements(ELEMENTS.slice(0, coveredCount)),
        characters: [],
      });

      expect(result.status).toBe("complete");
      if (result.status !== "complete") return;
      expect(result.coveredCount).toBe(coveredCount);
      expect(result.score).toBe(coveredCount * 20);
      expect([0, 20, 40, 60, 80, 100]).toContain(result.score);
    },
  );

  it("marks only a chart with all five visible elements as already complete", () => {
    const incomplete = calculateNameElementCoverage({
      chart: chartWithVisibleElements(["木", "火", "土", "金"]),
      characters: [reviewedCharacter(approvedRecord("水"))],
    });
    expect(incomplete).toMatchObject({
      status: "complete",
      coveredCount: 5,
      score: 100,
      chartAlreadyComplete: false,
    });

    const complete = calculateNameElementCoverage({
      chart: chartWithVisibleElements(ELEMENTS),
      characters: [],
    });
    expect(complete).toMatchObject({
      status: "complete",
      coveredCount: 5,
      score: 100,
      chartAlreadyComplete: true,
    });
  });
});

describe("real name analysis end to end", () => {
  it("calculates 宋江 as complete through analyzeName and the converter", async () => {
    const analysis = await analyzeName({ rawInput: "宋江" });
    if (!analysis) throw new Error("宋江 analysis fixture is required");

    const result = calculateNameElementCoverage({
      chart: chartWithVisibleElements(["木"]),
      characters: toNameElementCoverageCharacters(analysis.characters),
    });

    expect(result.status).toBe("complete");
  });

  it("keeps 解珍 pending for reading confirmation", async () => {
    const analysis = await analyzeName({ rawInput: "解珍" });
    if (!analysis) throw new Error("解珍 analysis fixture is required");

    expect(calculateNameElementCoverage({
      chart: chartWithVisibleElements(["木"]),
      characters: toNameElementCoverageCharacters(analysis.characters),
    })).toMatchObject({
      status: "pending",
      reasons: ["reading-unconfirmed"],
    });
  });

  it.each([
    ["解宝", { 0: "xiè" }],
    ["单廷圭", { 0: "shàn" }],
    ["彭玘", undefined],
  ] as const)("%s reaches element-classification-pending", async (rawInput, actualReadings) => {
    const analysis = await analyzeName({ rawInput, actualReadings });
    if (!analysis) throw new Error(`${rawInput} analysis fixture is required`);

    expect(calculateNameElementCoverage({
      chart: chartWithVisibleElements(["木"]),
      characters: toNameElementCoverageCharacters(analysis.characters),
    })).toMatchObject({
      status: "pending",
      reasons: ["element-classification-pending"],
    });
  });

  it("keeps two reviewed names at 100 when the visible chart is already complete", async () => {
    const analyses = await Promise.all([
      analyzeName({ rawInput: "宋江" }),
      analyzeName({ rawInput: "卢俊义" }),
    ]);
    const results = analyses.map(analysis => {
      if (!analysis) throw new Error("Reviewed name fixture is required");
      return calculateNameElementCoverage({
        chart: chartWithVisibleElements(ELEMENTS),
        characters: toNameElementCoverageCharacters(analysis.characters),
      });
    });

    for (const result of results) {
      expect(result).toMatchObject({
        status: "complete",
        coveredCount: 5,
        score: 100,
        chartAlreadyComplete: true,
      });
      expect(result.status === "complete" ? result.notice : "").toContain(
        "当前命盘显示的五行已经齐备，候选名字不会提高覆盖项",
      );
    }
  });
});

describe("immutability", () => {
  it("does not mutate deeply frozen chart or character inputs", () => {
    const chart = deepFreeze(chartWithVisibleElements(["木", "火"]));
    const characters = deepFreeze([
      reviewedCharacter(approvedRecord("水")),
    ]);
    const before = JSON.stringify({ chart, characters });

    expect(() => calculateNameElementCoverage({ chart, characters }))
      .not.toThrow();
    expect(JSON.stringify({ chart, characters })).toBe(before);
  });
});
