import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MirrorSection } from "../../components/yi/MirrorSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { YI_REFERENCE_SOURCES, YI_RULE_SOURCES } from "../../lib/yi/sources";
import { branchElements } from "../../lib/yi/stems-branches";
import type { FourPillarsResult, TenGodName } from "../../lib/yi/types";
import { buildZodiacMirror } from "../../lib/yi/zodiac-mirror";

const input = { name: "林知远", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male", timeConfidence: "exact" } as const;
const chart = calculateFourPillars(input);
const mappings = [
  ["子", "鼠"], ["丑", "牛"], ["寅", "虎"], ["卯", "兔"],
  ["辰", "龙"], ["巳", "蛇"], ["午", "马"], ["未", "羊"],
  ["申", "猴"], ["酉", "鸡"], ["戌", "狗"], ["亥", "猪"],
] as const;
const tenGodNames: TenGodName[] = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"];

function withoutTenGodNames(value: string): string {
  return tenGodNames.reduce((result, name) => result.replaceAll(name, "十神"), value);
}

function withMonthCommand(source: FourPillarsResult, tenGod: TenGodName): FourPillarsResult {
  return {
    ...source,
    professional: {
      ...source.professional,
      tenGods: source.professional.tenGods.map(item => item.pillar === "month" && item.position === "branch" && item.hiddenStemIndex === 0
        ? { ...item, tenGod }
        : item),
    },
  };
}

function chartWithYearBranch(branch: string): FourPillarsResult {
  return {
    ...chart,
    pillars: {
      ...chart.pillars,
      year: { ...chart.pillars.year, branch, branchElement: branchElements[branch] },
    },
  };
}

describe("complete zodiac mirror", () => {
  it.each(mappings)("maps %s to %s without a random fallback", (branch, animal) => {
    const mirror = buildZodiacMirror(chartWithYearBranch(branch));
    expect(mirror).toMatchObject({ branch, zodiac: animal, element: branchElements[branch] });
  });

  it("gives every zodiac a complete and semantically distinct life translation", () => {
    const mirrors = mappings.map(([branch]) => buildZodiacMirror(chartWithYearBranch(branch)));
    for (const mirror of mirrors) {
      expect(mirror.culturalSource.length).toBeGreaterThan(20);
      expect(mirror.workScene.length).toBeGreaterThan(25);
      expect(mirror.relationshipScene.length).toBeGreaterThan(25);
      expect(mirror.familyScene.length).toBeGreaterThan(25);
      expect(mirror.immediateAction.length).toBeGreaterThan(20);
      expect(mirror.longTermPractice.length).toBeGreaterThan(20);
      expect(mirror.caution).toMatch(/文化镜像|不是|不等于/);
      expect(mirror.sources.length).toBeGreaterThan(0);
    }
    for (const field of ["culturalSource", "workScene", "relationshipScene", "familyScene", "immediateAction"] as const) {
      expect(new Set(mirrors.map(mirror => mirror[field])).size, field).toBe(12);
    }
    expect(JSON.stringify(mirrors)).not.toMatch(/注定|保证发财|必然离婚|克夫|克妻|克子|灾祸|寿命/);
  });

  it("uses actual year, day-master and month-command evidence instead of a fixed comparison", () => {
    const baseline = buildZodiacMirror(chart);
    const changedTenGod: TenGodName = chart.professional.tenGods.find(item => item.pillar === "month" && item.position === "branch")?.tenGod === "正印" ? "七杀" : "正印";
    const changed: FourPillarsResult = {
      ...chart,
      pillars: {
        ...chart.pillars,
        year: { ...chart.pillars.year, branch: "亥", branchElement: "水" },
        month: { ...chart.pillars.month, branch: "酉", branchElement: "金" },
        day: { ...chart.pillars.day, stem: "丙", element: "火" },
      },
      professional: {
        ...chart.professional,
        dayMaster: { stem: "丙", element: "火", polarity: "yang" },
        tenGods: chart.professional.tenGods.map(item => item.pillar === "month" && item.position === "branch" && item.hiddenStemIndex === 0 ? { ...item, tenGod: changedTenGod } : item),
      },
    };
    const altered = buildZodiacMirror(changed);

    for (const value of [baseline.chartAgreement, baseline.chartDifference, altered.chartAgreement, altered.chartDifference]) {
      expect(value).toContain("主盘");
    }
    expect(baseline.chartAgreement).toContain(`${chart.pillars.year.branch}属${branchElements[chart.pillars.year.branch]}`);
    expect(baseline.chartAgreement).toContain(`日主${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}`);
    expect(baseline.chartAgreement).toContain(`月支${chart.pillars.month.branch}`);
    expect(altered.chartAgreement).toContain("亥属水");
    expect(altered.chartAgreement).toContain("日主丙火");
    expect(altered.chartAgreement).toContain("月支酉");
    expect(`${altered.chartAgreement}${altered.chartDifference}`).toContain(changedTenGod);
    expect(altered.chartAgreement).not.toBe(baseline.chartAgreement);
    expect(altered.chartDifference).not.toBe(baseline.chartDifference);
  });

  it("changes the comparison meaning when only the day-master interaction or month-command theme changes", () => {
    const dayChanged = buildZodiacMirror({
      ...chart,
      pillars: { ...chart.pillars, day: { ...chart.pillars.day, stem: "甲", element: "木" } },
      professional: { ...chart.professional, dayMaster: { stem: "甲", element: "木", polarity: "yang" } },
    });
    const baseline = buildZodiacMirror(chart);
    expect(dayChanged.chartAgreement).not.toBe(baseline.chartAgreement);
    expect(dayChanged.chartDifference).not.toBe(baseline.chartDifference);

    const resourceTheme = buildZodiacMirror(withMonthCommand(chart, "正印"));
    const pressureTheme = buildZodiacMirror(withMonthCommand(chart, "七杀"));
    expect(withoutTenGodNames(resourceTheme.chartAgreement)).not.toBe(withoutTenGodNames(pressureTheme.chartAgreement));
    expect(withoutTenGodNames(resourceTheme.chartDifference)).not.toBe(withoutTenGodNames(pressureTheme.chartDifference));
  });

  it("marks the year and month as representative limited candidates at the 2024-02-04 unknown-time boundary", () => {
    const boundaryChart = calculateFourPillars({
      name: "边界样本",
      date: "2024-02-04",
      time: null,
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "unknown",
    });
    const mirror = buildZodiacMirror(boundaryChart);
    const html = renderToStaticMarkup(createElement(MirrorSection, { chart: boundaryChart }));

    expect(boundaryChart.ambiguousPillars).toEqual(expect.arrayContaining(["year", "month"]));
    expect(mirror).toMatchObject({ confidence: "limited", yearAmbiguous: true, monthAmbiguous: true });
    expect(mirror.chartAgreement).toContain("年柱待核");
    expect(mirror.chartAgreement).toContain("月令代表候选");
    expect(html).toContain(`代表候选：${mirror.branch}${mirror.zodiac}`);
    expect(html).toContain("limited");
  });

  it("resolves authoritative and contextual source ids to graded https records", () => {
    const expected = {
      "calendar.gb-t-33661-2017": ["A", "GB/T 33661-2017 农历的编算和颁行"],
      "classic.san-ming-tong-hui": ["A/B", "三命通会"],
      "classic.di-tian-sui": ["A/B", "滴天髓辑要"],
      "culture.zodiac-national-museum": ["B", "中国国家博物馆：人化的生肖"],
      "culture.nasa-constellations": ["B", "NASA: What Are Constellations?"],
    } as const;
    for (const [id, [grade, title]] of Object.entries(expected)) {
      expect(YI_REFERENCE_SOURCES[id]).toMatchObject({ grade, title, url: expect.stringMatching(/^https:\/\//) });
    }
  });

  it("states different coordinate requirements for pair, three-branch and self-punishment rules", () => {
    const appliesWhen = YI_RULE_SOURCES["relation.gan-zhi.v1"].appliesWhen;
    expect(appliesWhen).toMatch(/两支关系.*两处已知坐标/);
    expect(appliesWhen).toMatch(/三合与三刑.*三支齐全/);
    expect(appliesWhen).toMatch(/自刑.*同一地支.*两处已知坐标/);
  });

  it("renders zodiac before other mirrors with scenes, comparison, actions, caution and linked sources", () => {
    const mirror = buildZodiacMirror(chart);
    const html = renderToStaticMarkup(createElement(MirrorSection, { chart }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(html.indexOf("生肖镜像")).toBeGreaterThan(-1);
    expect(html.indexOf("生肖镜像")).toBeLessThan(html.indexOf("动物原型"));
    expect(html.indexOf("动物原型")).toBeLessThan(html.indexOf("历史人物"));
    for (const label of ["工作现场", "关系现场", "家庭现场", "与八字主盘互证", "此刻可做", "长期练习", "使用边界"]) expect(html).toContain(label);
    for (const value of [mirror.workScene, mirror.relationshipScene, mirror.familyScene, mirror.immediateAction, mirror.longTermPractice, mirror.caution]) expect(html).toContain(value);
    for (const id of mirror.sources) {
      const source = YI_REFERENCE_SOURCES[id];
      expect(html).toContain(`href="${source.url}"`);
      expect(html).toContain(source.title);
      expect(html).toContain(source.role);
      expect(html).toContain(source.boundary);
    }
    expect(html).toContain("生活场景、信任方式与行动建议属于产品观察模型和生活化转译，不是古籍原文");
    expect(css).toMatch(/\.zodiac-scenes\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
    expect(css).toMatch(/\.zodiac-evidence summary\{[^}]*min-height:44px/);
    expect(css).toMatch(/@media\(max-width:760px\)\{[^}]*\.zodiac-scenes\{grid-template-columns:1fr\}/);
    expect(css).toMatch(/\.zodiac-mirror[^}]*overflow-wrap:anywhere/);
    expect(css).toMatch(/\.zodiac-sources a\{[^}]*min-height:44px/);
  });
});
