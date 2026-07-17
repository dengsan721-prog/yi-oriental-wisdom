import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import { YI_RULE_SOURCES } from "../../lib/yi/sources";

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

  it("marks hour-dependent content limited when hour is unknown", () => {
    const items = buildInterpretations(unknownHourChart);
    const hourDependent = items.filter(item => item.affectedByUnknownHour);
    expect(hourDependent.length).toBeGreaterThan(0);
    expect(hourDependent.every(item => item.confidence === "limited")).toBe(true);
    expect(hourDependent.every(item => !item.basis.includes("时柱为"))).toBe(true);
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

  it("does not claim a classical pattern or favorable elements from a product score", () => {
    const overview = buildProfessionalOverview(knownChart);
    expect(overview.pattern).toMatch(/^结构观察：/);
    expect(overview.climate).toMatch(/^调候提示：/);
    expect(overview).not.toHaveProperty("favorableElements");
    expect(overview).not.toHaveProperty("unfavorableElements");
  });

  it("contains no random or input-year-modulo professional rule", () => {
    const sources = ["../../lib/yi/four-pillars.ts", "../../lib/yi/interpretation.ts"]
      .map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
    expect(sources).not.toMatch(/Math\.random/);
    expect(sources).not.toMatch(/\byear\s*%/);
  });
});
