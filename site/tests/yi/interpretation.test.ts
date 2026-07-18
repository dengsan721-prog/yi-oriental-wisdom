import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DetailSection } from "../../components/yi/DetailSection";
import { findRepeatedSections, validateInterpretation } from "../../lib/yi/content-quality";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview, interpretationLength } from "../../lib/yi/interpretation";
import { scenarioLibrary } from "../../lib/yi/scenario-library";
import { YI_RULE_SOURCES } from "../../lib/yi/sources";

const expectedIds = [
  "self-day-master", "self-support", "self-interface",
  "talent-public", "talent-hidden", "talent-output",
  "career-role", "career-pressure", "career-environment",
  "wealth-structure", "wealth-risk", "wealth-boundary",
  "relationship-day-branch", "relationship-trigger", "relationship-repair",
  "family-year", "family-resource", "family-boundary",
  "rhythm-climate", "rhythm-recovery", "rhythm-decision",
] as const;

const coreIds = new Set([
  "self-day-master", "self-support", "career-role", "wealth-structure",
  "relationship-day-branch", "rhythm-climate",
]);
const importantIds = new Set([
  "self-interface", "talent-public", "talent-hidden", "career-pressure", "career-environment",
  "wealth-risk", "relationship-trigger", "relationship-repair", "family-resource", "rhythm-recovery",
]);

const knownChart = calculateFourPillars({
  name: "林知远",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});

const unknownHourChart = calculateFourPillars({
  name: "林知远",
  date: "1990-06-15",
  time: null,
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "unknown",
});

const boundaryUnknownChart = calculateFourPillars({
  name: "立春边界", date: "2024-02-04", time: null, location: "北京",
  gender: "unspecified", timeConfidence: "unknown",
});

describe("professional interpretation", () => {
  it("gives every interpretation a traceable seven-layer explanation", () => {
    const overview = buildProfessionalOverview(knownChart);
    const items = buildInterpretations(knownChart);
    expect(overview).toMatchObject({ dayMaster: expect.any(String), pattern: expect.any(String) });
    expect(items).toHaveLength(21);
    expect(new Set(items.map(item => item.domain))).toEqual(
      new Set(["self", "talent", "career", "wealth", "relationship", "family", "rhythm"]),
    );
    expect(items.every(item => item.sourceReferences.length > 0)).toBe(true);
    expect(items.every(item => item.sourceRuleIds.length > 0)).toBe(true);
    expect(items.every(item => item.pillarDependencies.length > 0)).toBe(true);
    expect(items[0]).toMatchObject({
      professionalTitle: expect.any(String),
      basis: expect.any(String),
      plainLanguage: expect.any(String),
      scenario: expect.any(String),
      mirror: expect.any(String),
      action: expect.any(String),
      caution: expect.any(String),
      confidence: expect.stringMatching(/high|medium|limited/),
      sourceTradition: expect.any(String),
    });
  });

  it("builds every interpretation with the complete unified content contract", () => {
    const items = buildInterpretations(knownChart);

    for (const item of items) {
      expect.soft(validateInterpretation(item), item.id).toEqual([]);
      expect(item.traditionalJudgment, item.id).not.toBe(item.basis);
      expect(item.advantageVersion, item.id).not.toBe(item.plainLanguage);
      expect(item.shadowVersion, item.id).not.toBe(item.caution);
      expect(item.actionNow, item.id).toBe(item.action);
      expect(item.actionLongTerm, item.id).not.toBe(item.actionNow);
      expect(item.priority, item.id).toBe(
        coreIds.has(item.id) ? "core" : importantIds.has(item.id) ? "important" : "supporting",
      );
    }
  });

  it("delivers twenty-one enriched and distinct interpretations", () => {
    const items = buildInterpretations(knownChart);
    expect(items).toHaveLength(21);
    expect(Object.fromEntries(["self", "talent", "career", "wealth", "relationship", "family", "rhythm"]
      .map(domain => [domain, items.filter(item => item.domain === domain).length])))
      .toEqual({ self: 3, talent: 3, career: 3, wealth: 3, relationship: 3, family: 3, rhythm: 3 });
    for (const item of items) {
      expect(validateInterpretation(item)).toEqual([]);
      const text = [
        item.basis, item.traditionalJudgment, item.plainLanguage, item.scenario,
        item.advantageVersion, item.shadowVersion, item.mirror,
        item.actionNow, item.actionLongTerm, item.caution,
      ].join("");
      const minimum = item.priority === "core" ? 300 : item.priority === "important" ? 180 : 80;
      expect(text.length).toBeGreaterThanOrEqual(minimum);
    }
    expect(findRepeatedSections(items)).toEqual([]);
  });

  it("uses independent domain rules with three substantively different readings", () => {
    const items = buildInterpretations(knownChart);
    for (const domain of new Set(items.map(item => item.domain))) {
      const domainItems = items.filter(item => item.domain === domain);
      expect(domainItems).toHaveLength(3);
      expect(new Set(domainItems.map(item => item.professionalTitle)).size).toBe(3);
      expect(new Set(domainItems.map(item => item.basis)).size).toBe(3);
      expect(new Set(domainItems.map(item => item.plainLanguage)).size).toBe(3);
      expect(new Set(domainItems.map(item => item.scenario)).size).toBe(3);
    }
  });

  it("varies the stable scenario set from computed chart evidence", () => {
    const contrastingChart = calculateFourPillars({
      name: "顾临川",
      date: "1985-02-20",
      time: "23:40",
      location: "成都",
      gender: "male",
      timeConfidence: "exact",
    });
    const firstScenes = buildInterpretations(knownChart).map(item => item.scenario);
    const repeatedScenes = buildInterpretations(knownChart).map(item => item.scenario);
    const contrastingScenes = buildInterpretations(contrastingChart).map(item => item.scenario);
    const stripEvidenceLabels = (scene: string) => scene
      .replace(/^[^，]+日主、[^，]+月令(?:见[^时]+|未见稳定关系)时，/, "")
      .replace(/[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/g, "符号")
      .replace(/日主|月令|相合|三合|相冲|相刑|相害|相破|自刑/g, "证据");
    const firstSubstance = firstScenes.map(stripEvidenceLabels);
    const contrastingSubstance = contrastingScenes.map(stripEvidenceLabels);

    expect(repeatedScenes).toEqual(firstScenes);
    expect(contrastingSubstance).not.toEqual(firstSubstance);
    expect(contrastingSubstance.filter((scene, index) => scene === firstSubstance[index]).length).toBe(0);
  });

  it("delivers exactly twenty-one paid-depth readings with the stable scenario IDs", () => {
    const items = buildInterpretations(knownChart);
    expect(items.map(item => item.id)).toEqual(expectedIds);
    expect(Object.keys(scenarioLibrary)).toEqual(expectedIds);
    expect(items).toHaveLength(21);

    for (const id of expectedIds) {
      expect(scenarioLibrary[id].scenarios).toHaveLength(2);
      expect(new Set(scenarioLibrary[id].scenarios).size, id).toBe(2);
    }

    for (const domain of ["self", "talent", "career", "wealth", "relationship", "family", "rhythm"] as const) {
      expect(items.filter(item => item.domain === domain)).toHaveLength(3);
    }
  });

  it("keeps every paid-depth reading within the seven-layer content contract", () => {
    const items = buildInterpretations(knownChart);
    for (const item of items) {
      expect(interpretationLength(item), item.id).toBeGreaterThanOrEqual(220);
      expect(interpretationLength(item), item.id).toBeLessThanOrEqual(450);
      expect(item.scenario.length, `${item.id} scenario`).toBeGreaterThanOrEqual(45);
      expect(item.scenario.length, `${item.id} scenario`).toBeLessThanOrEqual(85);
      expect(item.action.length, `${item.id} action`).toBeGreaterThanOrEqual(35);
      expect(item.action.length, `${item.id} action`).toBeLessThanOrEqual(70);
      expect(item.sourceTradition.length, item.id).toBeGreaterThan(0);
      expect(item.sourceReferences.length, item.id).toBeGreaterThan(0);
    }
    expect(new Set(items.map(item => item.scenario)).size).toBe(21);
    expect(new Set(items.map(item => item.action)).size).toBe(21);
  });

  it("grounds every basis in a real chart coordinate and names the complete relation set", () => {
    const items = buildInterpretations(knownChart);
    expect(items.every(item => /日主|月令|月干|月支|日支|年柱|年干|年支|时柱|时干|时支|十神|藏干|五行|根气|透干|支持度|柱/.test(item.basis))).toBe(true);

    const noRelationChart = {
      ...knownChart,
      professional: { ...knownChart.professional, relations: [] },
    };
    const fallbacks = buildInterpretations(noRelationChart)
      .filter(item => item.sourceRuleIds.includes("relation.gan-zhi.v1"))
      .map(item => item.basis).join("\n");
    expect(fallbacks).toContain("五合、六合、三合、冲、刑、害、破");
  });

  it("renders concise summaries and all expanded evidence labels with sources", () => {
    const items = buildInterpretations(knownChart);
    const html = renderToStaticMarkup(createElement(DetailSection, { items }));
    const firstPlainSentence = items[0].plainLanguage.match(/^.*?[。！？]/)?.[0] ?? items[0].plainLanguage;
    const confidenceText = { high: "高置信", medium: "中等置信", limited: "有限置信" }[items[0].confidence];
    expect(html).toContain(items[0].professionalTitle);
    expect(html).toContain(items[0].innovationTitle);
    expect(html).toContain(confidenceText);
    expect(html).not.toContain(`（${items[0].confidence}）`);
    expect(html).toContain(firstPlainSentence);
    for (const label of ["专业判断", "命理依据", "白话解释", "典型场景", "自然镜像", "行动建议", "边界提醒", "理论传统", "参考依据"]) {
      expect(html).toContain(label);
    }
  });

  it("keeps dense detail summaries wrap-safe with a mobile touch target", () => {
    const html = renderToStaticMarkup(createElement(DetailSection, { items: buildInterpretations(knownChart) }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    expect(html).toContain('class="detail-summary"');
    expect(css).toMatch(/\.detail-groups summary\{[^}]*min-height:52px/);
    expect(css).toMatch(/\.detail-summary\{[^}]*min-width:0[^}]*display:grid/);
  });

  it("marks hour-dependent content limited when hour is unknown", () => {
    const items = buildInterpretations(unknownHourChart);
    const hourDependent = items.filter(item => item.affectedByUnknownHour);
    expect(hourDependent.length).toBeGreaterThan(0);
    expect(hourDependent.every(item => item.pillarDependencies.includes("hour"))).toBe(true);
    expect(items.filter(item => !item.pillarDependencies.includes("hour")).every(item => !item.affectedByUnknownHour)).toBe(true);
    expect(hourDependent.every(item => item.confidence === "limited")).toBe(true);
    expect(hourDependent.every(item => !item.basis.includes("时柱为"))).toBe(true);
    expect(hourDependent.every(item => /时辰未知|时辰不详|出生时间/.test(`${item.basis}${item.plainLanguage}${item.caution}`))).toBe(true);
    expect(JSON.stringify(hourDependent)).not.toMatch(/子女会|晚年会|晚景会|必有子女|无子女|健康结果/);
  });

  it("keeps content priority independent from unknown-hour and boundary confidence", () => {
    for (const [label, chart] of [["unknown-hour", unknownHourChart], ["boundary", boundaryUnknownChart]] as const) {
      const items = buildInterpretations(chart);
      expect(items, label).toHaveLength(21);
      for (const item of items) {
        expect(validateInterpretation(item), `${label}:${item.id}`).toEqual([]);
        expect(item.priority, `${label}:${item.id}`).toBe(
          coreIds.has(item.id) ? "core" : importantIds.has(item.id) ? "important" : "supporting",
        );
      }
    }
  });

  it("keeps wealth, rhythm, relationship and family readings inside public-safe boundaries", () => {
    const items = buildInterpretations(knownChart);
    const wealth = items.filter(item => item.domain === "wealth").map(item => `${item.plainLanguage}${item.action}${item.caution}`).join("\n");
    const rhythm = items.filter(item => item.domain === "rhythm").map(item => `${item.plainLanguage}${item.action}${item.caution}`).join("\n");
    const relational = items.filter(item => item.domain === "relationship" || item.domain === "family").map(item => `${item.plainLanguage}${item.action}${item.caution}`).join("\n");
    expect(wealth).toMatch(/不构成投资建议|不替代财务判断|咨询持牌专业人士/);
    expect(rhythm).toMatch(/不替代医疗|医疗帮助|不是医学/);
    expect(relational).toMatch(/不预测|不作.*结果|不.*标签|不.*归罪/);
    expect(JSON.stringify(items)).not.toMatch(/保证收益|必然发财|注定离婚|克夫|克妻|克子|必有疾病|必然生病/);
  });

  it("limits every rule derived from ambiguous year or month pillars on a boundary day", () => {
    const items = buildInterpretations(boundaryUnknownChart);
    const boundaryDependent = items.filter(item => item.pillarDependencies.some(pillar => pillar === "year" || pillar === "month"));
    expect(boundaryDependent.length).toBeGreaterThan(0);
    expect(boundaryDependent.every(item => item.affectedByUnknownHour && item.confidence === "limited")).toBe(true);
    expect(items.some(item => item.pillarDependencies.every(pillar => pillar === "day") && !item.affectedByUnknownHour)).toBe(true);
  });

  it("does not expose noon-only professional overview fields on an unknown-time boundary day", () => {
    const overview = buildProfessionalOverview(boundaryUnknownChart);
    expect(overview.ambiguousFields).toEqual(expect.arrayContaining([
      "structureBalance", "lowerCountElements", "tenGodSummary", "relationSummary",
    ]));
    expect(overview.structureBalance).toBe("ambiguous");
    expect(overview.ambiguousFields).not.toContain("sameAndResourceElements");
    expect(overview.sameAndResourceElements.length).toBeGreaterThan(0);
    expect(overview.lowerCountElements).toEqual([]);
    expect(overview.tenGodSummary).toMatch(/不作单一判断|时辰不详且处交节日/);
    expect(overview.relationSummary).toMatch(/不作单一判断|时辰不详且处交节日/);
  });

  it("derives judgments from chart structure instead of the input year", () => {
    const changedStructure = calculateFourPillars({
      name: "林知远",
      date: "1990-12-15",
      time: "09:30",
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "exact",
    });
    expect(buildProfessionalOverview(changedStructure)).not.toEqual(buildProfessionalOverview(knownChart));
    expect(buildInterpretations(changedStructure).map(item => item.basis)).not.toEqual(
      buildInterpretations(knownChart).map(item => item.basis),
    );
  });

  it("ignores name and location when the chart structure is identical", () => {
    const sameChart = calculateFourPillars({
      name: "完全不同的名字", date: "1990-06-15", time: "09:30", location: "伦敦",
      gender: "unspecified", timeConfidence: "exact",
    });
    expect(sameChart).toEqual(knownChart);
    expect(buildProfessionalOverview(sameChart)).toEqual(buildProfessionalOverview(knownChart));
    expect(buildInterpretations(sameChart)).toEqual(buildInterpretations(knownChart));
  });

  it("registers versioned rule sources and identifies product heuristics", () => {
    expect(Object.values(YI_RULE_SOURCES).every(source => source.ruleId && source.appliesWhen && source.sourceType && source.version)).toBe(true);
    expect(Object.values(YI_RULE_SOURCES).some(source => source.sourceType === "product-heuristic")).toBe(true);
    expect(buildInterpretations(knownChart).every(item => item.sourceRuleIds.every(id => id in YI_RULE_SOURCES))).toBe(true);
  });

  it("publishes the complete relation rule contract through interpretation source references", () => {
    const relationSource = YI_RULE_SOURCES["relation.gan-zhi.v1"];
    expect(relationSource).toMatchObject({
      label: "干支关系完整规则表",
      appliesWhen: "两支关系需两处已知坐标；三合与三刑需三支齐全；自刑需同一地支出现在两处已知坐标",
      version: "1.1.0",
    });
    const relationItem = buildInterpretations(knownChart)
      .find(item => item.sourceRuleIds.includes("relation.gan-zhi.v1"));
    const references = relationItem?.sourceReferences.join("；") ?? "";
    for (const ruleName of [
      "天干五合表", "地支六合表", "地支三合表", "地支六冲表", "子卯相刑",
      "寅巳申三刑", "丑戌未三刑", "辰午酉亥自刑", "地支六害表", "地支六破表",
    ]) {
      expect(references, ruleName).toContain(ruleName);
    }
  });

  it("traces enrichment judgments to every professional rule they invoke", () => {
    const items = buildInterpretations(knownChart);
    expect(items.find(item => item.id === "wealth-boundary")?.sourceRuleIds)
      .toContain("ten-god.hidden-stems.v1");
    expect(items.find(item => item.id === "rhythm-recovery")?.sourceRuleIds)
      .toContain("climate.season-prompt.v1");
  });

  it.each([
    ["career-pressure", ["year", "month", "day"]],
    ["family-resource", ["year", "month", "day"]],
    ["talent-output", ["hour", "day"]],
    ["family-boundary", ["hour", "day"]],
  ] as const)("includes the day-master dependency for %s", (id, expectedDependencies) => {
    const item = buildInterpretations(knownChart).find(reading => reading.id === id);
    expect(item?.pillarDependencies).toEqual(expect.arrayContaining([...expectedDependencies]));
  });

  it("lists every distinct relation between the preferred pillar pair", () => {
    const chartWithConcurrentRelations = {
      ...knownChart,
      professional: {
        ...knownChart.professional,
        relations: [
          { type: "stem-combination" as const, pillars: ["year", "month"] as const, symbols: ["甲", "己"], label: "甲己相合" },
          { type: "branch-clash" as const, pillars: ["year", "month"] as const, symbols: ["子", "午"], label: "子午相冲" },
          { type: "branch-break" as const, pillars: ["year", "month"] as const, symbols: ["子", "酉"], label: "子酉相破" },
          { type: "branch-break" as const, pillars: ["year", "month"] as const, symbols: ["子", "酉"], label: "子酉相破" },
        ],
      },
    };
    const basis = buildInterpretations(chartWithConcurrentRelations)
      .find(item => item.id === "career-pressure")?.basis ?? "";
    expect(basis).toContain("甲己相合");
    expect(basis).toContain("子午相冲");
    expect(basis.match(/子酉相破/g)).toHaveLength(1);
  });

  it("uses the exact medical-help pause in the recovery action", () => {
    expect(scenarioLibrary["rhythm-recovery"].action).toBe(
      "连续两周记录睡眠、专注和情绪波动，找出高耗能时段并提前安排间隔；身体不适，应寻求医疗帮助。",
    );
  });

  it("does not claim a classical pattern or favorable elements from a product score", () => {
    const overview = buildProfessionalOverview(knownChart);
    const items = buildInterpretations(knownChart);
    expect(overview.pattern).toMatch(/^结构观察：/);
    expect(overview.climate).toMatch(/^调候提示：/);
    expect(overview).not.toHaveProperty("favorableElements");
    expect(overview).not.toHaveProperty("unfavorableElements");
    expect(JSON.stringify(items)).not.toMatch(/support-heavy|expression-heavy/);
  });

  it("contains no random or input-year-modulo professional rule", () => {
    const sources = ["../../lib/yi/four-pillars.ts", "../../lib/yi/interpretation.ts", "../../lib/yi/scenario-library.ts"]
      .map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
    expect(sources).not.toMatch(/Math\.random/);
    expect(sources).not.toMatch(/\byear\s*%/);
  });
});
