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

function countHan(value: string): number {
  return value.match(/\p{Script=Han}/gu)?.length ?? 0;
}

function normalizeYearStory(value: string): string {
  return value
    .replace(/\d{4}年|\d+岁/gu, "")
    .replace(/[，。；：“”、《》\s]/gu, "");
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

  it("varies stage and year stories beyond dates while avoiding adjacent repeats", () => {
    const chart = calculateFourPillars(exactMale);
    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);

    const periodStories = projected.periods.map(period => [
      period.openingScene,
      period.careerScene,
      period.resourceScene,
      period.relationshipScene,
      period.familyScene,
      period.rhythmScene,
    ].join(""));
    expect(new Set(periodStories).size).toBe(projected.periods.length);

    const yearStories = projected.periods.flatMap(period =>
      period.years.map(year => `${year.title}${year.scene}${year.action}`)
    );
    const normalized = yearStories.map(normalizeYearStory);
    expect(new Set(normalized).size).toBeGreaterThanOrEqual(20);
    expect(yearStories.filter((story, index) =>
      index > 0 && story === yearStories[index - 1]
    )).toHaveLength(0);
  });

  it("uses age-appropriate scenes and actions for childhood stages", () => {
    const childBirth: BirthInput = {
      name: "林小满",
      date: "2001-11-08",
      time: "07:10",
      location: "北京市",
      gender: "male",
      timeConfidence: "approximate",
    };
    const projected = buildFortuneStoryTimeline(
      calculateFourPillars(childBirth),
      childBirth,
    );
    expectAvailable(projected);

    const childhood = projected.periods.find(period =>
      period.years.every(year => year.age <= 11)
    );
    expect(childhood).toBeDefined();
    if (!childhood) throw new Error("Expected a childhood fortune stage");

    const visible = [
      childhood.openingScene,
      childhood.careerScene,
      childhood.resourceScene,
      childhood.relationshipScene,
      childhood.familyScene,
      childhood.rhythmScene,
      ...childhood.actions,
      ...childhood.years.flatMap(year => [year.scene, year.action]),
    ].join("");
    expect(visible).toMatch(/课堂|学习|家务|同伴|家人/u);
    expect(visible).not.toMatch(
      /工作选择|交付容量|预算|现金流|公开责任|高压任务|负责人|退出条件|金额上限/u,
    );
    expect(visible).not.toMatch(
      /在一次一起|完成同伴游戏中的一次/u,
    );

    const ageTwo = childhood.years.find(year => year.age === 2);
    expect(ageTwo).toBeDefined();
    if (!ageTwo) throw new Error("Expected an age-two story");
    expect(`${ageTwo.title}${ageTwo.scene}${ageTwo.action}`)
      .toMatch(/玩具|画画|家人|照顾者/u);
    expect(`${ageTwo.title}${ageTwo.scene}${ageTwo.action}`)
      .not.toMatch(/课堂|老师|课程|亲手试一次|写下适用/u);
  });

  it("writes stage and year scenes with a person, event, action, and consequence", () => {
    const chart = calculateFourPillars(exactMale);
    const projected = buildFortuneStoryTimeline(chart, exactMale);
    expectAvailable(projected);

    for (const period of projected.periods) {
      expect(countHan(period.openingScene), period.ageRange)
        .toBeGreaterThanOrEqual(70);
      expect(period.openingScene, period.ageRange)
        .toMatch(/你|一个人/u);
      expect(period.openingScene, period.ageRange)
        .toMatch(/一次|一天|当|来到|走进/u);
      expect(period.openingScene, period.ageRange)
        .toMatch(/于是|结果|否则|从而|便/u);

      for (const year of period.years) {
        expect(countHan(year.scene), `${year.year}:scene`)
          .toBeGreaterThanOrEqual(45);
        expect(year.scene, `${year.year}:scene`)
          .toMatch(/你|家人|同伴|老师|伙伴/u);
        expect(year.scene, `${year.year}:scene`)
          .toMatch(/于是|结果|否则|从而|便/u);
        expect(countHan(year.action), `${year.year}:action`)
          .toBeGreaterThanOrEqual(18);
      }
    }

    const firstPeriod = projected.periods[0];
    expect(firstPeriod.ageRange).toBe("8–17岁");
    expect(firstPeriod.title).toMatch(/童年.*少年/u);
    const yearTitles = projected.periods.flatMap(period =>
      period.years.map(year => year.title)
    );
    expect(yearTitles.filter((title, index) =>
      index > 0 && title === yearTitles[index - 1]
    )).toHaveLength(0);
  });

  it("keeps every preschool year concrete and child-sized", () => {
    const birth: BirthInput = {
      ...exactMale,
      date: "2001-11-08",
      time: "07:10",
      timeConfidence: "approximate",
    };
    const projected = buildFortuneStoryTimeline(
      calculateFourPillars(birth),
      birth,
    );
    expectAvailable(projected);

    const preschoolYears = projected.periods
      .flatMap(period => period.years)
      .filter(year => year.age <= 6);
    expect(preschoolYears.length).toBeGreaterThan(0);
    for (const year of preschoolYears) {
      const visible = `${year.title}${year.scene}${year.action}`;
      expect(visible, `${year.age}岁`).toMatch(
        /玩具|画画|游戏|家人|照顾者|轮流|收拾|一起/u,
      );
      expect(visible, `${year.age}岁`).not.toMatch(
        /验证|可比较的结果|个人主张|共同任务|协作环节|事实、影响|默认同意|复述要求|检查时间/u,
      );
    }
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
    expect(visible).not.toMatch(
      /先先|若若|若如果|一次第一次|从一次从|在一次把|遇到与|承担多大范围的结果|为恢复保留真实预算/u,
    );
    expect(visible).not.toMatch(
      /在一次一起|完成同伴游戏中的一次/u,
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
