import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";

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
});
