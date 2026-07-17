import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FortuneSection } from "../../components/yi/FortuneSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildFortuneTimeline, calculateTenGod } from "../../lib/yi/fortune";
import { matchAnimalArchetype, matchHistoricalMirror } from "../../lib/yi/mirrors";
import { stemElements } from "../../lib/yi/stems-branches";

const input = { name: "林知远", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
const chart = calculateFourPillars(input);

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

  it("renders compact nine-field and annual three-layer reading labels", () => {
    const html = renderToStaticMarkup(createElement(FortuneSection, { chart, birth: input }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    for (const label of [
      "阶段气候", "原局互动", "机会来源", "压力来源", "工作推进",
      "资源配置", "关系沟通", "身心边界", "阶段策略",
      "岁运关系", "典型场景", "年度动作",
    ]) expect(html).toContain(label);
    expect(html).toContain("<dl");
    expect(css).toMatch(/\.choice-row\{[^}]*overflow-x:auto[^}]*scrollbar-width:none/);
    expect(css).toMatch(/\.choice-row::?-webkit-scrollbar\{[^}]*display:none/);
    expect(css).toMatch(/\.choice-row button\{[^}]*min-height:(?:44|5[2-9])px/);
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
  it("explains explicit animal mapping without a derogatory label", () => {
    expect(matchAnimalArchetype(chart)).toMatchObject({ name: expect.any(String), basis: expect.stringContaining("映射"), mappedFeatures: expect.any(Array), pressurePattern: expect.any(String), action: expect.any(String) });
  });

  it("limits a sourced historical mirror to one dimension", () => {
    expect(matchHistoricalMirror(chart)).toMatchObject({ person: expect.any(String), dimension: expect.any(String), basis: expect.any(String), source: expect.any(String), reliability: expect.stringMatching(/high|medium|contextual/), caution: expect.stringContaining("命运") });
  });
});
