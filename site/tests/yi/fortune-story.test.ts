import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  buildFortuneTimeline,
  type FortunePeriod,
} from "../../lib/yi/fortune";
import {
  buildFortuneStoryTimeline,
  type FortuneStoryPeriod,
  type FortuneStoryTimeline,
} from "../../lib/yi/fortune-story";
import type { BirthInput } from "../../lib/yi/types";

vi.mock("../../lib/yi/fortune", async importOriginal => {
  const actual = await importOriginal<typeof import("../../lib/yi/fortune")>();
  return {
    ...actual,
    buildFortuneTimeline: vi.fn(actual.buildFortuneTimeline),
  };
});

const exactMale: BirthInput = {
  name: "林知远",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州市",
  gender: "male",
  timeConfidence: "exact",
};

function expectAvailable(
  timeline: FortuneStoryTimeline,
): asserts timeline is Extract<FortuneStoryTimeline, { status: "available" }> {
  expect(timeline.status).toBe("available");
  if (timeline.status !== "available") {
    throw new Error(`Expected available timeline, received ${timeline.reason}`);
  }
}

function visibleStrings(timeline: FortuneStoryTimeline): string[] {
  if (timeline.status === "unavailable") return [timeline.explanation];
  return [
    timeline.timingNote,
    ...timeline.periods.flatMap(period => [
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

function poisonLegacyProse(period: FortunePeriod): FortunePeriod {
  const sentinel = "旧大运说明不得进入公开阶段故事";
  return {
    ...period,
    theme: sentinel,
    stageStory: sentinel,
    lifeAreas: {
      career: sentinel,
      wealth: sentinel,
      relationship: sentinel,
      family: sentinel,
      rhythm: sentinel,
    },
    alignedState: sentinel,
    strainedState: sentinel,
    actions: [sentinel, sentinel, sentinel],
    reading: {
      climate: sentinel,
      originalInteraction: sentinel,
      opportunity: sentinel,
      pressure: sentinel,
      career: sentinel,
      resources: sentinel,
      relationship: sentinel,
      wellbeing: sentinel,
      strategy: sentinel,
    },
    years: period.years.map(year => ({
      ...year,
      basis: sentinel,
      theme: sentinel,
      weatherMetaphor: sentinel,
      interaction: sentinel,
      scenario: sentinel,
      action: sentinel,
    })),
    method: {
      ...period.method,
      basis: sentinel,
      disclaimer: sentinel,
    },
  };
}

beforeEach(() => {
  vi.mocked(buildFortuneTimeline).mockClear();
});

describe("fortune stage story projection", () => {
  it("preserves period and year order while projecting complete public fields", () => {
    const chart = calculateFourPillars(exactMale);
    const raw = buildFortuneTimeline(chart, exactMale);
    vi.mocked(buildFortuneTimeline).mockClear();

    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);

    expect(projected.periods.map(period => [
      period.ageRange,
      period.yearRange,
    ])).toEqual(raw.map(period => [
      `${period.startAge}–${period.endAge}岁`,
      `${period.startYear}–${period.endYear}`,
    ]));
    expect(projected.periods.map(period =>
      period.years.map(year => [year.age, year.year])
    )).toEqual(raw.map(period =>
      period.years.map(year => [year.age, year.year])
    ));

    for (const [index, period] of projected.periods.entries()) {
      const publicParagraphs = [
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
      ];
      expect(publicParagraphs.every(value => value.trim().length > 0))
        .toBe(true);
      expect(period.actions).toHaveLength(3);
      expect(period.internalMethodIds)
        .toEqual(raw[index].method.sourceIds);
      expect(period.years.length).toBe(raw[index].years.length);
      for (const year of period.years) {
        expect(year).toEqual({
          age: expect.any(Number),
          year: expect.any(Number),
          title: expect.any(String),
          scene: expect.any(String),
          action: expect.any(String),
        });
        expect([year.title, year.scene, year.action]
          .every(value => value.trim().length > 0)).toBe(true);
      }
    }
  });

  it("constructs public sentences from stable categories instead of legacy prose", () => {
    const chart = calculateFourPillars(exactMale);
    const raw = buildFortuneTimeline(chart, exactMale);
    vi.mocked(buildFortuneTimeline)
      .mockReturnValueOnce(raw.map(poisonLegacyProse));

    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);
    expect(visibleStrings(projected).join(""))
      .not.toContain("旧大运说明不得进入公开阶段故事");
  });

  it("keeps internal method IDs out of every visible string", () => {
    const chart = calculateFourPillars(exactMale);
    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);

    const visible = visibleStrings(projected).join("");
    const internalIds = projected.periods.flatMap(period =>
      period.internalMethodIds
    );
    expect(internalIds.length).toBeGreaterThan(0);
    for (const id of internalIds) expect(visible).not.toContain(id);
  });

  it("keeps public copy free of method labels, chart terms, and future promises", () => {
    const chart = calculateFourPillars(exactMale);
    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);

    const visible = visibleStrings(projected).join("");
    expect(visible).not.toMatch(
      /来源|规则|置信|九项专业依据|命盘|四柱|年柱|月柱|日柱|时柱|日主|十神|月令|旺衰|藏干|纳音|干支|起运|流年|fortune-|calendar\.|relation\.|translation\./u,
    );
    expect(visible).not.toMatch(
      /注定|必然|一定会|将会|保证|预示|发财|结婚|离婚|患病|灾难|寿命/u,
    );
  });

  it.each([
    ["male", "exact"],
    ["female", "exact"],
    ["male", "approximate"],
    ["female", "approximate"],
  ] as const)("is available for %s with %s time", (gender, timeConfidence) => {
    const birth = { ...exactMale, gender, timeConfidence };
    const timeline = buildFortuneStoryTimeline(
      calculateFourPillars(birth),
      birth,
    );

    expectAvailable(timeline);
    expect(timeline.periods.length).toBeGreaterThan(0);
    expect(timeline.timingNote).toMatch(
      timeConfidence === "approximate" ? /约略时间|近似/u : /已填写的出生时间/u,
    );
  });

  it.each([
    [
      {
        ...exactMale,
        time: null,
        timeConfidence: "unknown" as const,
      },
      "unknown-time",
    ],
    [
      {
        ...exactMale,
        gender: "unspecified" as const,
      },
      "gender-unspecified",
    ],
    [
      {
        ...exactMale,
        gender: "unspecified" as const,
        time: null,
        timeConfidence: "unknown" as const,
      },
      "unknown-time",
    ],
    [
      {
        ...exactMale,
        gender: "unspecified" as const,
        time: null,
        timeConfidence: "exact" as const,
      },
      "unknown-time",
    ],
  ] as const)("returns one unavailable explanation before reading period data", (birth, reason) => {
    const timeline = buildFortuneStoryTimeline(
      calculateFourPillars(birth),
      birth,
    );

    expect(timeline).toEqual({
      status: "unavailable",
      reason,
      explanation: expect.any(String),
    });
    expect("periods" in timeline).toBe(false);
    expect(buildFortuneTimeline).not.toHaveBeenCalled();
  });

  it("throws when an available timeline has no periods", () => {
    const chart = calculateFourPillars(exactMale);
    vi.mocked(buildFortuneTimeline).mockReturnValueOnce([]);

    expect(() => buildFortuneStoryTimeline(chart, exactMale))
      .toThrow(/Fortune story invariant: available timeline has no periods/u);
  });

  it("throws when an available period has no years", () => {
    const chart = calculateFourPillars(exactMale);
    const [period] = buildFortuneTimeline(chart, exactMale);
    vi.mocked(buildFortuneTimeline).mockReturnValueOnce([{
      ...period,
      years: [],
    }]);

    expect(() => buildFortuneStoryTimeline(chart, exactMale))
      .toThrow(/Fortune story invariant: period .+ has no years/u);
  });

  it("returns a non-empty tuple for every available projection", () => {
    const chart = calculateFourPillars(exactMale);
    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);

    const periods: readonly [
      FortuneStoryPeriod,
      ...FortuneStoryPeriod[],
    ] = projected.periods;
    expect(periods[0].years[0]).toBeDefined();
  });
});
