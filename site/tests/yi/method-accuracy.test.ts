import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Solar } from "lunar-typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartSection } from "../../components/yi/ChartSection";
import { FortuneSection } from "../../components/yi/FortuneSection";
import { PortraitSection } from "../../components/yi/PortraitSection";
import { ReferenceAtlasSection } from "../../components/yi/ReferenceAtlasSection";
import { SourceNote } from "../../components/yi/SourceNote";
import { calculateCompatibility, classifyBranchRelation } from "../../lib/yi/compatibility";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildFortuneTimeline } from "../../lib/yi/fortune";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { getAllSources, YI_RULE_SOURCES } from "../../lib/yi/sources";
import { branches, branchElements } from "../../lib/yi/stems-branches";
import { buildAtlasReading, getAtlasGroups } from "../../lib/yi/traditional-atlas";
import type { BirthInput, FourPillarsResult, PillarKey } from "../../lib/yi/types";

const exactBirth: BirthInput = {
  name: "林知远",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "male",
  timeConfidence: "exact",
};

function dayOracle(date: string, time: string, sect: 1 | 2): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  eightChar.setSect(sect);
  return eightChar.getDay();
}

function chartWithBranches(values: [string, string, string, string]): FourPillarsResult {
  const chart = calculateFourPillars(exactBirth);
  const keys: PillarKey[] = ["year", "month", "day", "hour"];
  const pillars = structuredClone(chart.pillars);
  keys.forEach((key, index) => {
    const pillar = pillars[key];
    if (!pillar) throw new Error(`测试命盘缺少${key}柱`);
    pillar.branch = values[index];
    pillar.branchElement = branchElements[values[index]];
  });
  return { ...chart, pillars, ambiguousPillars: [], confidence: "high" };
}

function relationCoordinates(relation: unknown): string[] | undefined {
  return (relation as { coordinates?: string[] } | undefined)?.coordinates;
}

afterEach(() => {
  vi.doUnmock("../../lib/yi/fortune");
  vi.doUnmock("../../lib/yi/report-model");
  vi.resetModules();
});

describe("1. civil-midnight day convention", () => {
  it("matches an explicit sect-2 oracle before, within and after late 子时", () => {
    const fixtures = [
      { date: "1990-06-15", time: "22:40" },
      { date: "1990-06-15", time: "23:40" },
      { date: "1990-06-16", time: "00:20" },
    ];
    for (const fixture of fixtures) {
      const birth = { ...exactBirth, ...fixture };
      const chart = calculateFourPillars(birth);
      expect(`${chart.pillars.day.stem}${chart.pillars.day.branch}`).toBe(dayOracle(fixture.date, fixture.time, 2));
    }
    expect(dayOracle("1990-06-15", "23:40", 2)).not.toBe(dayOracle("1990-06-15", "23:40", 1));
  });

  it("locks sect 2 explicitly in every base-chart constructor", () => {
    const fourPillarsSource = readFileSync(new URL("../../lib/yi/four-pillars.ts", import.meta.url), "utf8");
    const fortuneSource = readFileSync(new URL("../../lib/yi/fortune.ts", import.meta.url), "utf8");
    expect(fourPillarsSource).toMatch(/setSect\(2\)/);
    expect(fortuneSource).toMatch(/setSect\(2\)/);
  });

  it("discloses the civil-midnight convention and the late-子时 boundary in professional copy", () => {
    const ordinary = buildProfessionalReport(calculateFourPillars(exactBirth), exactBirth);
    const lateBirth = { ...exactBirth, time: "23:40" };
    const late = buildProfessionalReport(calculateFourPillars(lateBirth), lateBirth);
    const ordinaryBoundary = (ordinary.birthFacts as unknown as Record<string, string>).dayBoundary;
    const lateBoundary = (late.birthFacts as unknown as Record<string, string>).dayBoundary;

    expect(ordinaryBoundary).toMatch(/00:00|零点/);
    expect(lateBoundary).toMatch(/部分.*23:00.*本报告.*00:00/);
    expect(`${ordinaryBoundary}${lateBoundary}`).not.toMatch(/sect\s*[12]/i);
  });

  it("distinguishes the start-age algorithm parameter from the day-boundary convention", () => {
    const period = buildFortuneTimeline(calculateFourPillars(exactBirth), exactBirth)[0];
    const fortuneSource = readFileSync(new URL("../../lib/yi/fortune.ts", import.meta.url), "utf8");
    expect(fortuneSource).toMatch(/getYun\([^,]+,\s*1\)/);
    expect(period.method.basis).toMatch(/起运年龄.*第1种计算口径/);
    expect(`${period.method.basis}${period.method.ruleVersion}`).not.toMatch(/(?:日柱|换日).*sect|yun-sect/i);
  });
});

describe("2. portrait semantic mappings", () => {
  it("uses distinct current relationship-pressure and rhythm-decision content", () => {
    const chart = calculateFourPillars(exactBirth);
    const items = buildInterpretations(chart);
    const html = renderToStaticMarkup(createElement(PortraitSection, {
      chart,
      overview: buildProfessionalOverview(chart),
      items,
    }));
    const pressure = items.find((item) => item.id === "relationship-trigger");
    const mainLine = items.find((item) => item.id === "rhythm-decision");
    expect(pressure).toBeTruthy();
    expect(mainLine).toBeTruthy();
    expect(pressure?.professionalTitle).not.toBe(mainLine?.professionalTitle);
    expect(html).toContain(`压力下的反应 · ${pressure?.professionalTitle}`);
    expect(html).toContain(`当前人生主线 · ${mainLine?.professionalTitle}`);
  });

  it("fails loudly when a required portrait item is absent", () => {
    const chart = calculateFourPillars(exactBirth);
    const items = buildInterpretations(chart).filter((item) => item.id !== "relationship-trigger");
    expect(() => renderToStaticMarkup(createElement(PortraitSection, {
      chart,
      overview: buildProfessionalOverview(chart),
      items,
    }))).toThrow(/relationship-trigger/);
  });
});

describe("3. complete compatibility relationship rules", () => {
  it("detects all six breaks with exact cross-chart pillar coordinates", () => {
    const breaks = [["子", "酉"], ["卯", "午"], ["辰", "丑"], ["戌", "未"], ["寅", "亥"], ["巳", "申"]] as const;
    for (const [left, right] of breaks) {
      expect(classifyBranchRelation(left, right), `${left}${right}`).toContain("破");
      const filler = branches.find((branch) => branch !== left && branch !== right) ?? "子";
      const first = chartWithBranches([left, filler, filler, filler]);
      const second = chartWithBranches([right, filler, filler, filler]);
      const relation = calculateCompatibility(first, second, "partner").combinationsAndClashes
        .find((item) => item.relation === "破" && item.symbols.includes(left) && item.symbols.includes(right));
      expect(relation, `${left}${right}相破`).toBeTruthy();
      expect(relationCoordinates(relation)).toEqual(["A年柱", "B年柱"]);
    }
  });

  it("detects each complete four-trine only when both charts contribute known coordinates", () => {
    const trines = [
      ["申", "子", "辰", "水"],
      ["亥", "卯", "未", "木"],
      ["寅", "午", "戌", "火"],
      ["巳", "酉", "丑", "金"],
    ] as const;
    for (const [firstBranch, secondBranch, thirdBranch, element] of trines) {
      const filler = branches.find((branch) => ![firstBranch, secondBranch, thirdBranch].includes(branch)) ?? "子";
      const first = chartWithBranches([firstBranch, secondBranch, filler, filler]);
      const second = chartWithBranches([filler, filler, thirdBranch, filler]);
      const relation = calculateCompatibility(first, second, "friend").combinationsAndClashes
        .find((item) => item.relation === "三合" && item.symbols.join("") === `${firstBranch}${secondBranch}${thirdBranch}`);
      expect(relation, `${firstBranch}${secondBranch}${thirdBranch}三合${element}局`).toBeTruthy();
      expect(relationCoordinates(relation)).toEqual(["A年柱", "A月柱", "B日柱"]);
      expect(relation?.observation).toContain(`${firstBranch}${secondBranch}${thirdBranch}三合${element}局`);
    }
  });

  it("does not infer a trine from only two branches", () => {
    const filler = "丑";
    const first = chartWithBranches(["申", filler, filler, filler]);
    const second = chartWithBranches(["子", filler, filler, filler]);
    const result = calculateCompatibility(first, second, "business");
    expect(result.combinationsAndClashes.some((item) => item.relation === "三合" && item.symbols.includes("辰"))).toBe(false);
  });
});

describe("4. truthful relationship provenance", () => {
  it("registers the relationship rule table as a product method without a false classical closure", () => {
    const rule = YI_RULE_SOURCES["relation.gan-zhi.v1"];
    const unified = getAllSources().find((source) => source.id === "relation.gan-zhi.v1");
    expect(rule.sourceType).toBe("product-method");
    expect(unified?.title).toContain("产品方法记录");
    expect(`${unified?.role}${unified?.editionNote}`).not.toContain("古典文献来源待核");
  });

  it("shows 三命通会 only as contextual background beside relationship rules", () => {
    const chart = calculateFourPillars(exactBirth);
    const items = buildInterpretations(chart).filter((item) => item.sourceRuleIds.includes("relation.gan-zhi.v1"));
    const html = renderToStaticMarkup(createElement(SourceNote, { chart, items }));
    expect(html).toContain("干支关系完整规则表产品方法记录");
    expect(html).toContain("三命通会");
    expect(html).toMatch(/脉络|背景/);
    expect(html).not.toContain("古典文献来源待核");
  });
});

describe("5. atlas source resolution and labels", () => {
  it("uses culture-model labels for stars while retaining traditional labels elsewhere", () => {
    const chart = calculateFourPillars(exactBirth);
    const star = getAtlasGroups("star").flatMap((group) => group.options)[0];
    const face = getAtlasGroups("face").flatMap((group) => group.options)[0];
    expect(buildAtlasReading(star, chart).layers.slice(0, 2).map((layer) => layer.label)).toEqual(["文化模型结果", "模型依据"]);
    expect(buildAtlasReading(face, chart).layers.slice(0, 2).map((layer) => layer.label)).toEqual(["传统结果", "传统依据"]);
  });

  it("resolves atlas sources through the unified registry and labels the combined system truthfully", () => {
    const source = readFileSync(new URL("../../components/yi/ReferenceAtlasSection.tsx", import.meta.url), "utf8");
    const chart = calculateFourPillars(exactBirth);
    const html = renderToStaticMarkup(createElement(ReferenceAtlasSection, { chart, birth: exactBirth }));
    expect(source).toContain("getAllSources");
    expect(source).not.toContain("getTraditionalSource");
    expect(html).toContain('aria-label="传统图谱与星座文化模型"');

    const model = getAllSources().find((item) => item.id === "model.western-astrology-element-modality");
    const nasa = getAllSources().find((item) => item.id === "culture.nasa-constellations");
    expect(model?.role).toContain("产品分类约定");
    expect(nasa?.boundary).toMatch(/不属于科学证据|不为占星人格提供科学背书/);
  });
});

describe("6. fortune translation provenance", () => {
  it("registers and carries a product-owned versioned translation source", () => {
    const source = YI_RULE_SOURCES["fortune.translation.v1"];
    const period = buildFortuneTimeline(calculateFourPillars(exactBirth), exactBirth)[0];
    const sourceIds = (period.method as unknown as { sourceIds?: string[] }).sourceIds;
    expect(source).toBeDefined();
    expect(source?.sourceType).toBe("product-method");
    expect(source?.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(sourceIds).toEqual(expect.arrayContaining([
      "calendar.eight-char.v1",
      "ten-god.hidden-stems.v1",
      "relation.gan-zhi.v1",
      "fortune.translation.v1",
    ]));
  });

  it("shows the fortune translation source in the displayed method path", () => {
    const chart = calculateFourPillars(exactBirth);
    const html = renderToStaticMarkup(createElement(FortuneSection, { chart, birth: exactBirth }));
    expect(html).toContain("岁运生活领域、故事与行动转译");
    expect(html).toContain("产品方法");
  });
});

describe("7. content-audit blind spots", () => {
  it("proves male unknown-time, female unknown-time and unspecified-gender exact-time gates independently", async () => {
    vi.resetModules();
    vi.doMock("../../lib/yi/fortune", async () => {
      const actual = await vi.importActual<typeof import("../../lib/yi/fortune")>("../../lib/yi/fortune");
      return {
        ...actual,
        buildFortuneTimeline: (chart: FourPillarsResult, birth: BirthInput) => {
          const shouldLeak = (birth.gender === "male" && birth.timeConfidence === "unknown")
            || (birth.gender === "female" && birth.timeConfidence === "unknown")
            || (birth.gender === "unspecified" && birth.timeConfidence === "exact");
          return shouldLeak ? [{}] : actual.buildFortuneTimeline(chart, birth);
        },
      };
    });
    const { auditProductContent } = await import("../../lib/yi/content-audit");
    const issues = auditProductContent();
    for (const moduleName of ["fortune:male-unknown-time", "fortune:female-unknown-time", "fortune:unspecified-gender-exact-time"]) {
      expect(issues, moduleName).toEqual(expect.arrayContaining([
        expect.objectContaining({ module: moduleName, rule: "certainty", field: "periods" }),
      ]));
    }
  });

  it("audits all visible buildLifeOverview fields", async () => {
    vi.resetModules();
    vi.doMock("../../lib/yi/report-model", async () => {
      const actual = await vi.importActual<typeof import("../../lib/yi/report-model")>("../../lib/yi/report-model");
      return {
        ...actual,
        buildProfessionalReport: (...args: Parameters<typeof actual.buildProfessionalReport>) => ({
          ...actual.buildProfessionalReport(...args),
          lifeTheme: "主调线索中混入高维链接，用户可以直接看到这段内容。",
          coreTalents: [
            "第一项待验证优势保留足够完整的说明文字。",
            "第二项待验证优势保留足够完整的说明文字。",
            "第三项待验证优势保留足够完整的说明文字。",
          ],
          centralTensions: [
            "第一项待观察张力保留足够完整的说明文字。",
            "第二项待观察张力保留足够完整的说明文字。",
          ],
          currentLesson: "当前练习保留足够完整的说明文字并等待现实反馈。",
        }),
      };
    });
    const { auditProductContent } = await import("../../lib/yi/content-audit");
    expect(auditProductContent()).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "overview", rule: "forbidden", field: "lifeTheme" }),
    ]));
  });

  it("uses observation labels in the 30-second overview", () => {
    const chart = calculateFourPillars(exactBirth);
    const report = buildProfessionalReport(chart, exactBirth);
    const html = renderToStaticMarkup(createElement(ChartSection, { chart, report }));
    expect(html).toContain("主调线索");
    expect(html).toContain("待验证优势");
    expect([report.lifeTheme, ...report.coreTalents].join(" ")).not.toMatch(/人生主调|核心天赋/);
    expect(html).not.toMatch(/<small>人生主调<\/small>|<h2[^>]*>核心天赋<\/h2>/);
  });
});
