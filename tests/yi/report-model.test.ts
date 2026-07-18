import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChartSection } from "../../components/yi/ChartSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { ProfessionalReport } from "../../lib/yi/types";

const birth = {
  name: "林",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female" as const,
  timeConfidence: "exact" as const,
};

const contrastingBirth = {
  name: "周",
  date: "1992-11-03",
  time: "18:20",
  location: "北京市",
  gender: "male" as const,
  timeConfidence: "exact" as const,
};

function overviewParagraphs(report: ProfessionalReport): string[] {
  return [report.lifeTheme, ...report.coreTalents, ...report.centralTensions, report.currentLesson];
}

function calculatedOverviewEvidence(report: ProfessionalReport): string[] {
  const month = report.monthCommand.ambiguous ? report.monthCommand.representative.branch : report.monthCommand.branch;
  return [
    `${report.dayMaster}日主`,
    `${month}月令`,
    ...report.pillarFacts.map((pillar) => `${pillar.stem}${pillar.branch}`),
    ...report.relations.map((relation) => relation.label),
  ];
}

function stripCalculatedNames(value: string): string {
  return value
    .replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g, "符号")
    .replace(/比肩|劫财|食神|伤官|偏财|正财|七杀|正官|偏印|正印/g, "十神")
    .replace(/[木火土金水]/g, "五行");
}

describe("professional report model", () => {
  it("builds a computed four-part life overview with fixed tuple depth", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);
    const talents: [string, string, string] = report.coreTalents;
    const tensions: [string, string] = report.centralTensions;
    const evidence = calculatedOverviewEvidence(report);

    expect(report.lifeTheme.length).toBeGreaterThanOrEqual(60);
    expect(talents).toHaveLength(3);
    expect(tensions).toHaveLength(2);
    expect(report.currentLesson.length).toBeGreaterThanOrEqual(40);
    for (const paragraph of overviewParagraphs(report)) {
      expect(paragraph.length).toBeGreaterThanOrEqual(40);
      expect(evidence.some((symbol) => paragraph.includes(symbol)), paragraph).toBe(true);
    }
    expect(overviewParagraphs(report).join(" ")).toContain(report.monthCommand.ambiguous ? "待核" : report.monthCommand.tenGod);
    if (report.relations.length) {
      expect(overviewParagraphs(report).some((paragraph) => report.relations.some((relation) => paragraph.includes(relation.label)))).toBe(true);
    }
    expect(overviewParagraphs(report).join(" ")).not.toMatch(/一定|注定|必然发财|必然结婚|灾祸|寿命/);
  });

  it("changes overview substance for a different chart but not for a renamed identical chart", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);
    const renamed = buildProfessionalReport(calculateFourPillars({ ...birth, name: "另一名字" }), { ...birth, name: "另一名字" });
    const contrasting = buildProfessionalReport(calculateFourPillars(contrastingBirth), contrastingBirth);

    expect(overviewParagraphs(renamed)).toEqual(overviewParagraphs(report));
    expect(contrasting.lifeTheme).not.toBe(report.lifeTheme);
    expect(contrasting.coreTalents).not.toEqual(report.coreTalents);
    expect(stripCalculatedNames(contrasting.coreTalents[0])).not.toBe(stripCalculatedNames(report.coreTalents[0]));
    expect(contrasting.centralTensions).not.toEqual(report.centralTensions);
    expect(contrasting.currentLesson).not.toBe(report.currentLesson);
    for (const paragraph of overviewParagraphs(contrasting)) {
      expect(calculatedOverviewEvidence(contrasting).some((symbol) => paragraph.includes(symbol)), paragraph).toBe(true);
    }
  });

  it("renders life theme, talents, tensions and lesson in order before the professional skeleton", () => {
    const chart = calculateFourPillars(birth);
    const report = buildProfessionalReport(chart, birth);
    const html = renderToStaticMarkup(createElement(ChartSection, { chart, report }));
    const orderedValues = [report.lifeTheme, ...report.coreTalents, ...report.centralTensions, report.currentLesson, "完整命盘骨架"];
    const positions = orderedValues.map((value) => html.indexOf(value));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    for (const label of ["人生主调", "核心天赋", "核心张力", "当下课题"]) expect(html).toContain(label);
  });

  it("contains dual-calendar facts and a complete exact-time chart skeleton", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);

    expect(report.birthFacts.solar).toContain("1990年6月15日 09:30");
    expect(report.birthFacts.lunar).toMatch(/年.+月.+日.+时/);
    expect(report.birthFacts.location).toBe("浙江省杭州市");
    expect(report.birthFacts.timezone).toContain("UTC+8");
    expect(report.birthFacts.zodiac).toBeTruthy();
    expect(report.birthFacts.starSign).toContain("现代文化辅助");
    expect(report.birthFacts.timeConfidence).toBe("精确时间");
    expect(report.pillarFacts).toHaveLength(4);
    expect(report.pillarFacts.map((pillar) => pillar.key)).toEqual(["year", "month", "day", "hour"]);
    expect(report.pillarFacts[1].hiddenStems.length).toBeGreaterThan(0);
    expect(report.pillarFacts[1].hiddenStems.map((stem) => stem.index)).toEqual(
      report.pillarFacts[1].hiddenStems.map((_, index) => index),
    );
    expect(report.pillarFacts.find((pillar) => pillar.key === "day")?.stemTenGod).toBe("日主");
    expect(report.monthCommand.branch).toBe(report.pillarFacts[1].branch);
    expect(report.monthCommand.hiddenStem).toBe(report.pillarFacts[1].hiddenStems[0].stem);
    expect(report.elementDiagnostics).toHaveLength(5);
    expect(report.elementDiagnostics.map((item) => item.element)).toEqual(["木", "火", "土", "金", "水"]);
    expect(report.relations).toEqual(calculateFourPillars(birth).professional.relations);
    expect(new Set(report.keyJudgments).size).toBeGreaterThanOrEqual(6);
    expect(report.actions).toHaveLength(3);
    expect(new Set(report.actions).size).toBe(3);
  });

  it("keeps every hidden stem with its ten god and stable source index", () => {
    const chart = calculateFourPillars(birth);
    const report = buildProfessionalReport(chart, birth);
    const expected = chart.professional.tenGods
      .filter((entry) => entry.pillar === "month" && entry.position === "branch")
      .map((entry) => ({ stem: entry.symbol, tenGod: entry.tenGod, index: entry.hiddenStemIndex }));

    expect(report.pillarFacts[1].hiddenStems).toEqual(expected);
  });

  it("omits the hour facts and lowers wording confidence when time is unknown", () => {
    const unknownBirth = { ...birth, time: null, timeConfidence: "unknown" as const };
    const report = buildProfessionalReport(calculateFourPillars(unknownBirth), unknownBirth);

    expect(report.birthFacts.solar).toContain("时辰不详");
    expect(report.birthFacts.lunar).toContain("时辰不详");
    expect(report.birthFacts.solar).not.toMatch(/12:00|正午/);
    expect(report.birthFacts.timeConfidence).toBe("时辰不详");
    expect(report.pillarFacts).toHaveLength(3);
    expect(report.pillarFacts.every((pillar) => pillar.key !== "hour")).toBe(true);
    expect(report.exposedStems.every((clue) => !clue.includes("时干"))).toBe(true);
    expect(report.confidence).toBe("limited");
    expect([report.summary, ...report.keyJudgments].join(" ")).toMatch(/时辰|三柱|有限/);
  });

  it("marks true solar time as uncorrected without inventing a corrected clock time", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);

    expect(report.birthFacts.trueSolarTime).toContain("未校正");
    expect(report.birthFacts.trueSolarTime).toContain("经纬度");
    expect(report.birthFacts.trueSolarTime).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("treats an absent address as metadata uncertainty and does not change the chart", () => {
    const noAddressBirth = { ...birth, location: "" };
    const chart = calculateFourPillars(noAddressBirth);
    const noAddress = buildProfessionalReport(chart, noAddressBirth);
    const otherAddress = buildProfessionalReport(chart, { ...noAddressBirth, location: "北京市" });

    expect(noAddress.birthFacts.location).toBe("未提供");
    expect(noAddress.birthFacts.trueSolarTime).toMatch(/未校正|无法校正/);
    expect(noAddress.pillarFacts).toEqual(otherAddress.pillarFacts);
    expect(noAddress.elementDiagnostics).toEqual(otherAddress.elementDiagnostics);
    expect(noAddress.relations).toEqual(otherAddress.relations);
  });

  it("separates visible count, month support, roots and exposed clues without favorable-use claims", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);

    for (const diagnostic of report.elementDiagnostics) {
      expect(diagnostic.count).toBeGreaterThanOrEqual(0);
      expect([true, false]).toContain(diagnostic.inSeason);
      expect(Array.isArray(diagnostic.roots)).toBe(true);
      expect(Array.isArray(diagnostic.exposed)).toBe(true);
      expect(diagnostic.conclusion).toMatch(/数量|分布/);
      if (diagnostic.count === 0) expect(diagnostic.conclusion).toContain("未直接出现");
    }
    expect(report.elementDiagnostics.map((item) => item.conclusion).join(" "))
      .not.toMatch(/缺什么补什么|就是喜用|喜用神为/);
  });

  it("marks month-command support as uncertain when an unknown time spans the boundary", () => {
    const boundaryBirth = {
      ...birth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown" as const,
      location: "",
    };
    const report = buildProfessionalReport(calculateFourPillars(boundaryBirth), boundaryBirth);

    expect(report.pillarFacts.find((pillar) => pillar.key === "year")?.ambiguous).toBe(true);
    expect(report.pillarFacts.find((pillar) => pillar.key === "month")?.ambiguous).toBe(true);
    expect(report.pillarFacts.find((pillar) => pillar.key === "day")?.ambiguous).toBe(false);
    expect(report.monthCommand).toMatchObject({
      branch: "待核",
      hiddenStem: "待核",
      tenGod: "待核",
      ambiguous: true,
      representative: { branch: expect.any(String), hiddenStem: expect.any(String), tenGod: expect.any(String) },
    });
    expect(report.elementDiagnostics.reduce((sum, item) => sum + item.count, 0)).toBe(2);
    expect(report.elementDiagnostics.every((item) => item.inSeason === null)).toBe(true);
    expect(report.elementDiagnostics.flatMap((item) => [...item.roots, ...item.exposed]).every((clue) => clue.startsWith("日"))).toBe(true);
    expect(report.exposedStems.every((clue) => clue.startsWith("日干"))).toBe(true);
    expect(report.roots.every((clue) => clue.startsWith("日支"))).toBe(true);
    expect(report.relations.every((relation) => relation.pillars.every((pillar) => !["year", "month", "hour"].includes(pillar)))).toBe(true);
    expect(report.elementDiagnostics.map((item) => item.conclusion).join(" ")).toContain("月令可能跨节");
    const copy = [report.summary, ...report.keyJudgments, ...report.actions].join(" ");
    expect(copy).toContain("月令");
    expect(copy).toMatch(/待核|候选/);
    expect(copy).not.toMatch(new RegExp(`${report.monthCommand.representative?.branch}月令(?:以|本气为)`));
  });

  it("normalizes a null clock time to unknown even when the caller claims exact confidence", () => {
    const contradictoryBirth = { ...birth, time: null, timeConfidence: "exact" as const };
    const chart = calculateFourPillars(contradictoryBirth);
    const report = buildProfessionalReport(chart, contradictoryBirth);

    expect(chart.pillars.hour).toBeNull();
    expect(chart.confidence).toBe("limited");
    expect(report.confidence).toBe("limited");
    expect(report.birthFacts.solar).toContain("时辰不详");
    expect(report.birthFacts.timeConfidence).toBe("时辰不详");
    expect([report.birthFacts.solar, report.birthFacts.timeConfidence, report.summary].join(" ")).not.toContain("精确时间");
  });

  it("derives judgments and actions from actual chart facts", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);
    const copy = [report.summary, ...report.keyJudgments, ...report.actions].join(" ");

    expect(copy).toContain(`${report.dayMaster}日主`);
    expect(copy).toContain(`${report.monthCommand.branch}月令`);
    expect(report.keyJudgments.some((item) => report.relations.some((relation) => item.includes(relation.label)))).toBe(true);
    expect(report.actions.some((item) => item.includes(report.dayMaster))).toBe(true);
    expect(copy).not.toMatch(/一定|注定|必然发财|必然结婚|灾祸|寿命/);
  });
});
