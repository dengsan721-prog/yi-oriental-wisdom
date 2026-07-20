import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FortuneSection } from "../../components/yi/FortuneSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { analyzeFortuneRelations, buildFortuneGuidance, buildFortuneTimeline, buildFortuneYearReading, calculateTenGod } from "../../lib/yi/fortune";
import { extractMirrorFeatures } from "../../lib/yi/mirror-features";
import { matchAnimalArchetype, matchHistoricalMirror, matchLifeMirrors } from "../../lib/yi/mirrors";
import { branchElements, stemElements } from "../../lib/yi/stems-branches";
import type { ChartRelation, FourPillarsResult, PillarKey } from "../../lib/yi/types";

const input = { name: "林知远", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
const chart = calculateFourPillars(input);

function chartWithBranches(branches: Record<PillarKey, string>): FourPillarsResult {
  const stems: Record<PillarKey, string> = { year: "乙", month: "丁", day: "戊", hour: "庚" };
  return {
    ...chart,
    pillars: Object.fromEntries((Object.keys(branches) as PillarKey[]).map(key => [key, {
      ...chart.pillars[key]!, stem: stems[key], branch: branches[key],
      element: stemElements[stems[key]], branchElement: branchElements[branches[key]],
    }])) as FourPillarsResult["pillars"],
    ambiguousPillars: [],
  };
}

function chartForControlledPeriodRelation(type: ChartRelation["type"] | null): FourPillarsResult {
  const branches: Record<PillarKey, string> = { year: "寅", month: "午", day: "申", hour: "丑" };
  const stems: Record<PillarKey, string> = { year: "甲", month: "丙", day: "戊", hour: "壬" };
  if (type === "stem-combination") stems.year = "庚";
  if (type === "branch-combination") branches.year = "辰";
  if (type === "branch-trine") branches.year = "巳";
  if (type === "branch-clash") branches.year = "卯";
  if (type === "branch-punishment") branches.year = "酉";
  if (type === "branch-harm") branches.year = "戌";
  if (type === "branch-break") branches.year = "子";
  return {
    ...chart,
    pillars: Object.fromEntries((Object.keys(branches) as PillarKey[]).map(key => [key, {
      ...chart.pillars[key]!, stem: stems[key], branch: branches[key],
      element: stemElements[stems[key]], branchElement: branchElements[branches[key]],
    }])) as FourPillarsResult["pillars"],
    ambiguousPillars: [],
  };
}

function controlledPeriod(type: ChartRelation["type"] | null) {
  const period = buildFortuneTimeline(chartForControlledPeriodRelation(type), input).find(item => item.stemBranch === "乙酉");
  if (!period) throw new Error("测试需要乙酉大运");
  return period;
}

function stripControlledStageEvidence(period: ReturnType<typeof controlledPeriod>): string {
  const stageStory = period.stageStory.replace(/提供环境和执行坐标，.*?，事情因此/, "提供环境和执行坐标，关系证据，事情因此");
  const aligned = period.alignedState.replace(/。当.*?能够/, "。当关系证据能够");
  const strained = period.strainedState.replace(/。若忽略.*?和日柱/, "。若忽略关系证据和日柱");
  const action = period.actions[0].replace(/。执行时把.*?写进观察记录/, "。执行时把关系证据写进观察记录");
  return [stageStory, aligned, strained, action].join("|")
    .replace(/\d{1,4}/g, "数字")
    .replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g, "符号")
    .replace(/比肩|劫财|食神|伤官|偏财|正财|七杀|正官|偏印|正印/g, "十神")
    .replace(/年柱|月柱|日柱|时柱/g, "原局坐标")
    .replace(/相合|三合|相冲|相刑|相害|相破|自刑|未见|未命中/g, "关系类型");
}

function longestCommonPrefix(values: string[]): string {
  return values.reduce((prefix, value) => {
    let index = 0;
    while (index < prefix.length && prefix[index] === value[index]) index += 1;
    return prefix.slice(0, index);
  });
}

function stripTenGodNames(value: string): string {
  return value.replace(/比肩|劫财|食神|伤官|偏财|正财|七杀|正官|偏印|正印/g, "十神");
}

describe("fortune timeline", () => {
  it("distinguishes all ten gods by element and polarity", () => {
    expect(["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].map(stem => calculateTenGod("甲", stem))).toEqual(["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"]);
  });
  it("uses the same polarity rules for a yin day master", () => {
    expect(["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].map(stem => calculateTenGod("乙", stem))).toEqual(["劫财", "比肩", "伤官", "食神", "正财", "偏财", "正官", "七杀", "正印", "偏印"]);
  });
  it("builds selectable decades with traceable yearly readings", () => {
    const timeline = buildFortuneTimeline(chart, input);
    expect(timeline.length).toBeGreaterThanOrEqual(8);
    expect(timeline[0]).toMatchObject({ stemBranch: expect.any(String), startAge: expect.any(Number), startYear: expect.any(Number), tenGod: expect.any(String), theme: expect.any(String), years: expect.any(Array) });
    expect(timeline[0].years).toHaveLength(10);
    expect(timeline[0].years[0]).toMatchObject({ age: expect.any(Number), year: expect.any(Number), stemBranch: expect.any(String), basis: expect.any(String), action: expect.any(String) });
    expect(timeline[0].method.basis).toContain("lunar-typescript");
    expect(timeline[0].method.basis).toMatch(/顺排|逆排/);
  });

  it("turns every fortune period into a complete computed stage story", () => {
    const timeline = buildFortuneTimeline(chart, input);
    for (const period of timeline) {
      const actions = period.actions;
      const paragraphs = [
        period.stageStory,
        ...Object.values(period.lifeAreas),
        period.alignedState,
        period.strainedState,
        ...actions,
      ];

      expect(period.stageStory.length, period.stemBranch).toBeGreaterThanOrEqual(120);
      expect(Object.keys(period.lifeAreas)).toEqual(["career", "wealth", "relationship", "family", "rhythm"]);
      expect(Object.values(period.lifeAreas).every((paragraph) => paragraph.length >= 50), period.stemBranch).toBe(true);
      expect(period.alignedState.length).toBeGreaterThanOrEqual(40);
      expect(period.strainedState.length).toBeGreaterThanOrEqual(40);
      expect(actions).toHaveLength(3);
      expect(period.lifeAreas.career).not.toContain(period.reading.career);
      expect(period.lifeAreas.wealth).not.toContain(period.reading.resources);
      expect(period.lifeAreas.rhythm).not.toContain(period.reading.wellbeing);
      for (const paragraph of paragraphs) {
        expect(paragraph, `${period.stemBranch} computed symbol`).toContain(period.stemBranch);
        expect(paragraph, `${period.stemBranch} ten god`).toContain(period.tenGod);
      }
      expect(period.stageStory).toMatch(/年柱|月柱|日柱|时柱/);
      expect(period.stageStory).toMatch(/相合|三合|相冲|相刑|相害|相破|未见/);
      expect(period.stageStory).toMatch(/高置信|中等置信|有限置信/);

      for (const year of period.years) {
        const annualGod = calculateTenGod(chart.pillars.day.stem, year.stemBranch[0]);
        expect(year.weatherMetaphor.length, `${year.year} weather`).toBeGreaterThanOrEqual(30);
        expect(year.weatherMetaphor).toContain(year.stemBranch);
        expect(year.weatherMetaphor).toContain(annualGod);
        expect(year.weatherMetaphor).toContain(period.stemBranch);
        expect(year.weatherMetaphor).toMatch(/相合|三合|相冲|相刑|相害|相破|未命中|未见/);
      }
    }
    expect(new Set(timeline.map((period) => period.stageStory)).size).toBe(timeline.length);
    expect(new Set(timeline.map((period) => JSON.stringify(period.lifeAreas))).size).toBe(timeline.length);
    expect(new Set(timeline.map((period) => JSON.stringify(period.actions))).size).toBe(timeline.length);
  });

  it("changes stage meaning when only the active relation type changes", () => {
    const types: Array<ChartRelation["type"] | null> = [
      null,
      "stem-combination",
      "branch-combination",
      "branch-trine",
      "branch-clash",
      "branch-punishment",
      "branch-harm",
      "branch-break",
    ];
    const periods = types.map(controlledPeriod);

    expect(periods.every((period) => period.stemBranch === "乙酉")).toBe(true);
    expect(periods.every((period) => period.tenGod === periods[0].tenGod)).toBe(true);
    expect(new Set(periods.map(stripControlledStageEvidence)).size).toBe(types.length);
  });

  it("changes stage and weather substance for different charts and fortune periods", () => {
    const alternateInput = { ...input, name: "顾临川", date: "1992-11-03", time: "18:20", location: "北京" } as const;
    const alternateChart = calculateFourPillars(alternateInput);
    const timeline = buildFortuneTimeline(chart, input);
    const alternate = buildFortuneTimeline(alternateChart, alternateInput);

    expect(timeline[0].stageStory).not.toBe(timeline[1].stageStory);
    expect(timeline[0].actions).not.toEqual(timeline[1].actions);
    expect(timeline[0].years[0].weatherMetaphor).not.toBe(timeline[0].years[1].weatherMetaphor);
    expect(alternate[0].stageStory).not.toBe(timeline[0].stageStory);
    expect(alternate[0].stageStory).toContain(alternate[0].stemBranch);
    expect(alternate[0].stageStory).toMatch(/年柱|月柱|日柱|时柱/);
  });

  it("builds nine distinct period readings from the actual decade and natal chart", () => {
    const timeline = buildFortuneTimeline(chart, input);
    const expectedKeys = [
      "climate", "originalInteraction", "opportunity", "pressure", "career",
      "resources", "relationship", "wellbeing", "strategy",
    ];
    const natalCoordinates = Object.entries(chart.pillars)
      .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Boolean(entry[1]))
      .map(([key, pillar]) => `${{ year: "年柱", month: "月柱", day: "日柱", hour: "时柱" }[key]}${pillar.stem}${pillar.branch}`);

    for (const period of timeline) {
      expect(Object.keys(period.reading), period.stemBranch).toEqual(expectedKeys);
      expect(new Set(Object.values(period.reading)).size, period.stemBranch).toBe(9);
      for (const [key, value] of Object.entries(period.reading)) {
        expect(value.length, `${period.stemBranch} ${key}`).toBeGreaterThanOrEqual(30);
        expect(value, `${period.stemBranch} ${key}`).toContain(period.stemBranch);
        expect(value, `${period.stemBranch} ${key}`).toContain(period.tenGod);
        expect(value, `${period.stemBranch} ${key}`).toContain(stemElements[period.stemBranch[0]]);
        expect(natalCoordinates.some(coordinate => value.includes(coordinate)), `${period.stemBranch} ${key} natal evidence`).toBe(true);
      }
    }
  });

  it("uses different evidence paths instead of one shared long period prefix", () => {
    const period = buildFortuneTimeline(chart, input)[0];
    const values = Object.values(period.reading);
    expect(longestCommonPrefix(values).length).toBeLessThan(8);
    expect(period.reading.climate).toMatch(/月令|月柱/);
    expect(period.reading.originalInteraction).toMatch(/相合|三合|相冲|相刑|相害|相破|未见/);
    expect(period.reading.opportunity).toMatch(/支持型关系|未见支持型/);
    expect(period.reading.pressure).toMatch(/张力型关系|未见张力型/);
    expect(period.reading.career).toMatch(/月柱.*日柱|日柱.*月柱/);
    expect(period.reading.resources).toContain("财、印、比劫");
    expect(period.reading.relationship).toContain("日支");
    expect(period.reading.wellbeing).toContain("月令");
    expect(period.reading.strategy).toContain("综合");
  });

  it("detects cross-layer trines and punishments with structured involved coordinates", () => {
    const trineChart = chartWithBranches({ year: "丑", month: "午", day: "辰", hour: "巳" });
    const trine = analyzeFortuneRelations("甲子", "丙申", trineChart).find(relation => relation.label === "申子辰三合水局");
    expect(trine).toMatchObject({ type: "branch-trine", label: "申子辰三合水局" });
    expect(trine?.coordinates).toEqual(expect.arrayContaining([
      { key: "annual", label: "流年", stemBranch: "甲子" },
      { key: "period", label: "大运", stemBranch: "丙申" },
      { key: "day", label: "日柱", stemBranch: "戊辰" },
    ]));

    const punishmentChart = chartWithBranches({ year: "丑", month: "申", day: "辰", hour: "午" });
    const punishment = analyzeFortuneRelations("甲寅", "丙巳", punishmentChart).find(relation => relation.label === "寅巳申三刑");
    expect(punishment).toMatchObject({ type: "branch-punishment", label: "寅巳申三刑" });
    expect(punishment?.coordinates.map(coordinate => coordinate.key)).toEqual(expect.arrayContaining(["annual", "period", "month"]));

    const missing = chartWithBranches({ year: "丑", month: "午", day: "卯", hour: "巳" });
    expect(analyzeFortuneRelations("甲子", "丙申", missing).some(relation => relation.label === "申子辰三合水局")).toBe(false);
  });

  it("changes annual scenes and actions for the same ten gods when the actual relation changes", () => {
    const combinedChart = chartWithBranches({ year: "寅", month: "丑", day: "辰", hour: "巳" });
    const clashedChart = chartWithBranches({ year: "寅", month: "午", day: "辰", hour: "巳" });
    const combined = buildFortuneYearReading(combinedChart, "丙戌", "甲子");
    const clashed = buildFortuneYearReading(clashedChart, "丙戌", "甲子");

    expect(combined.scenario).toContain("子丑相合");
    expect(combined.action).toContain("子丑相合");
    expect(combined.scenario).toContain("月柱丁丑");
    expect(combined.scenario).not.toContain("年柱乙寅");
    expect(clashed.scenario).toContain("子午相冲");
    expect(clashed.action).toContain("子午相冲");
    expect(clashed.scenario).toContain("月柱丁午");
    expect(clashed.scenario).not.toContain("年柱乙寅");
    expect(combined.scenario).not.toBe(clashed.scenario);
    expect(combined.action).not.toBe(clashed.action);
  });

  describe("three-layer annual guidance", () => {
    it("changes substance for a different annual ten-god under the same period and relation", () => {
      const authorityYear = buildFortuneGuidance("七杀", "正印", "branch-combination");
      const expressionYear = buildFortuneGuidance("伤官", "正印", "branch-combination");

      expect(stripTenGodNames(authorityYear.scene)).not.toBe(stripTenGodNames(expressionYear.scene));
      expect(stripTenGodNames(authorityYear.action)).not.toBe(stripTenGodNames(expressionYear.action));
    });

    it("changes substance for a different decade ten-god under the same annual trigger and relation", () => {
      const learningPeriod = buildFortuneGuidance("伤官", "正印", "branch-clash");
      const dutyPeriod = buildFortuneGuidance("伤官", "正官", "branch-clash");

      expect(stripTenGodNames(learningPeriod.scene)).not.toBe(stripTenGodNames(dutyPeriod.scene));
      expect(stripTenGodNames(learningPeriod.action)).not.toBe(stripTenGodNames(dutyPeriod.action));
    });

    it("uses both annual trigger and decade context when no relation is detected", () => {
      const baseline = buildFortuneGuidance("伤官", "正印", null);
      const changedAnnual = buildFortuneGuidance("七杀", "正印", null);
      const changedPeriod = buildFortuneGuidance("伤官", "正官", null);

      expect(baseline.scene).toContain("未命中");
      expect(baseline.action).toContain("未命中");
      expect(stripTenGodNames(baseline.scene)).not.toBe(stripTenGodNames(changedAnnual.scene));
      expect(stripTenGodNames(baseline.action)).not.toBe(stripTenGodNames(changedAnnual.action));
      expect(stripTenGodNames(baseline.scene)).not.toBe(stripTenGodNames(changedPeriod.scene));
      expect(stripTenGodNames(baseline.action)).not.toBe(stripTenGodNames(changedPeriod.action));
    });
  });

  it("compares every annual stem-branch with both the natal chart and active decade", () => {
    const timeline = buildFortuneTimeline(chart, input);
    const natalCoordinates = Object.entries(chart.pillars)
      .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Boolean(entry[1]))
      .map(([key, pillar]) => `${{ year: "年柱", month: "月柱", day: "日柱", hour: "时柱" }[key]}${pillar.stem}${pillar.branch}`);

    for (const period of timeline) {
      for (const year of period.years) {
        const annualGod = calculateTenGod(chart.pillars.day.stem, year.stemBranch[0]);
        expect(year.basis).toContain(year.stemBranch);
        expect(year.basis).toContain(annualGod);
        expect(year.interaction.length, `${year.year} interaction`).toBeGreaterThanOrEqual(25);
        expect(year.scenario.length, `${year.year} scenario`).toBeGreaterThanOrEqual(35);
        expect(year.action.length, `${year.year} action`).toBeGreaterThanOrEqual(25);
        for (const layer of [year.interaction, year.scenario, year.action]) {
          expect(layer, `${year.year} annual coordinate`).toContain(year.stemBranch);
          expect(layer, `${year.year} annual ten god`).toContain(annualGod);
          expect(layer, `${year.year} decade coordinate`).toContain(period.stemBranch);
        }
        expect(natalCoordinates.some(coordinate => year.interaction.includes(coordinate)), `${year.year} natal comparison`).toBe(true);
      }
    }
    expect(JSON.stringify(timeline)).not.toMatch(/保证收益|必然发财|注定离婚|克夫|克妻|克子|必有疾病|灾难|寿命/);
  });

  it("renders default-closed stage, professional and annual evidence layers", () => {
    const html = renderToStaticMarkup(createElement(FortuneSection, { chart, birth: input }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    for (const label of [
      "阶段故事", "事业", "财富", "关系", "家庭", "身心节奏", "顺势状态", "吃力状态", "三项阶段行动",
      "阶段气候", "原局互动", "机会来源", "压力来源", "工作推进",
      "资源配置", "关系沟通", "身心边界", "阶段策略",
      "岁运关系", "典型场景", "年度动作",
    ]) expect(html).toContain(label);
    const renderedPeriod = buildFortuneTimeline(chart, input)[0];
    expect(html).toContain('<details class="fortune-stage-depth"><summary>展开阶段故事与行动</summary>');
    expect(html).toContain('<details class="fortune-professional-depth"><summary>查看九项专业依据</summary>');
    expect(html).toContain('<details class="fortune-year-evidence"><summary>查看年度依据、场景与行动</summary>');
    expect(html).not.toMatch(/<details class="(?:fortune-stage-depth|fortune-professional-depth|fortune-year-evidence)" open/);
    expect(html.indexOf(renderedPeriod.theme)).toBeLessThan(html.indexOf("展开阶段故事与行动"));
    expect(html.indexOf("展开阶段故事与行动")).toBeLessThan(html.indexOf(renderedPeriod.stageStory));
    expect(html.indexOf(renderedPeriod.stageStory)).toBeLessThan(html.indexOf("查看九项专业依据"));
    expect(html.indexOf("查看九项专业依据")).toBeLessThan(html.indexOf("阶段气候"));
    expect(html.indexOf(renderedPeriod.years[0].weatherMetaphor)).toBeLessThan(html.indexOf(renderedPeriod.years[0].basis));
    expect(html.indexOf(renderedPeriod.years[0].weatherMetaphor)).toBeLessThan(html.indexOf(renderedPeriod.years[0].interaction));
    expect(html).toContain("<dl");
    expect(css).toMatch(/\.choice-row\{[^}]*overflow-x:auto[^}]*scrollbar-width:none/);
    expect(css).toMatch(/\.choice-row::?-webkit-scrollbar\{[^}]*display:none/);
    expect(css).toMatch(/\.choice-row button\{[^}]*min-height:(?:44|5[2-9])px/);
    expect(css).toMatch(/\.fortune-stage-depth>summary[^}]*min-height:44px[^}]*display:flex[^}]*align-items:center/);
    expect(css).toMatch(/\.fortune-stage-depth[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
    expect(css).toMatch(/\.fortune-life-areas\{[^}]*display:grid[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
    expect(css).toMatch(/@media\(max-width:700px\)\{[^}]*\.fortune-life-areas,\.fortune-stage-states[^}]*grid-template-columns:1fr/);
  });

  it("does not manufacture an exact fortune timeline when time is unknown", () => {
    const unknownInput = { ...input, time: null, timeConfidence: "unknown" } as const;
    const unknown = calculateFourPillars(unknownInput);
    expect(buildFortuneTimeline(unknown, unknownInput)).toEqual([]);
  });

  it("keeps an approximate birth time at medium confidence with an explicit basis", () => {
    const approximateInput = { ...input, timeConfidence: "approximate" } as const;
    const approximate = buildFortuneTimeline(calculateFourPillars(approximateInput), approximateInput);
    expect(approximate.length).toBeGreaterThan(0);
    expect(approximate.every(period => period.confidence === "medium")).toBe(true);
    expect(approximate.every(period => /约略时间/.test(period.method.disclaimer))).toBe(true);
    expect(approximate.every(period => /中等置信/.test(period.method.disclaimer))).toBe(true);
  });

  it("does not invent direction when gender is unspecified", () => {
    const unspecified = { ...input, gender: "unspecified" } as const;
    expect(buildFortuneTimeline(calculateFourPillars(unspecified), unspecified)).toEqual([]);
  });
});

describe("auditable mirrors", () => {
  it("adapts the first ranked animal while preserving the legacy public shape", () => {
    const first = matchLifeMirrors(chart).animals[0];
    expect(matchAnimalArchetype(chart)).toEqual({
      name: first.name,
      basis: `显式映射：${extractMirrorFeatures(chart).evidence.join("；")}`,
      mappedFeatures: Object.entries(first.vector).map(([key, value]) => `${key}=${value}`),
      strengthPattern: first.similar,
      pressurePattern: first.shadow,
      action: first.lesson,
      caution: "这是行为隐喻，不是性格标签。",
    });
  });

  it("adapts the first ranked historical candidate to a sourced single-dimension comparison", () => {
    const first = matchLifeMirrors(chart).historical[0];
    expect(matchHistoricalMirror(chart)).toEqual({
      person: first.name,
      dimension: "人生结构单维比较",
      basis: `显式映射：${extractMirrorFeatures(chart).evidence.join("；")}`,
      source: first.sourceReferences.join("；"),
      reliability: "contextual",
      observation: first.similar,
      action: first.lesson,
      caution: "仅比较具体维度，不表示命运相同。",
    });
  });

  it("keeps legacy adapter shapes stable without leaking candidate hour or day-master evidence", () => {
    const animalKeys = ["name", "basis", "mappedFeatures", "strengthPattern", "pressurePattern", "action", "caution"].sort();
    const historicalKeys = ["person", "dimension", "basis", "source", "reliability", "observation", "action", "caution"].sort();
    const expectLegacyShapes = (candidate: FourPillarsResult) => {
      expect(Object.keys(matchAnimalArchetype(candidate)).sort()).toEqual(animalKeys);
      expect(Object.keys(matchHistoricalMirror(candidate)).sort()).toEqual(historicalKeys);
    };

    const unknownInput = { ...input, time: null, timeConfidence: "unknown" } as const;
    const unknown = calculateFourPillars(unknownInput);
    const withCandidateHour = structuredClone(unknown);
    withCandidateHour.pillars.hour = {
      ...chart.pillars.hour!,
      stem: "甲",
      branch: "寅",
      element: "木",
      branchElement: "木",
      label: "秘密候选时柱",
    };
    expect(matchAnimalArchetype(withCandidateHour)).toEqual(matchAnimalArchetype(unknown));
    expect(matchHistoricalMirror(withCandidateHour)).toEqual(matchHistoricalMirror(unknown));
    expect(JSON.stringify(matchAnimalArchetype(withCandidateHour))).not.toContain("秘密候选时柱");

    const dayPending = structuredClone(chart);
    dayPending.professional.ambiguousFields = ["dayMaster"];
    const changedCandidate = structuredClone(dayPending);
    changedCandidate.professional.dayMaster = { stem: "甲", element: "木", polarity: "yang" };
    expect(matchAnimalArchetype(changedCandidate)).toEqual(matchAnimalArchetype(dayPending));
    expect(matchHistoricalMirror(changedCandidate)).toEqual(matchHistoricalMirror(dayPending));
    expect(JSON.stringify(matchHistoricalMirror(changedCandidate))).not.toContain("甲木");

    const approximateInput = { ...input, timeConfidence: "approximate" } as const;
    expectLegacyShapes(unknown);
    expectLegacyShapes(calculateFourPillars(approximateInput));
    expectLegacyShapes(dayPending);
  });
});
