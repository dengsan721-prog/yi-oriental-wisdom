import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  extractMirrorFeatures,
  scoreMirror,
  type MirrorFeatureVector,
} from "../../lib/yi/mirror-features";

const exactChart = calculateFourPillars({
  name: "林知远",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});

describe("explainable mirror features", () => {
  it("derives five bounded features, evidence and a stress style", () => {
    const result = extractMirrorFeatures(exactChart);

    expect(Object.keys(result.vector)).toEqual([
      "growth",
      "expression",
      "stability",
      "discernment",
      "adaptability",
    ]);
    for (const value of Object.values(result.vector)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
    expect(result.evidence).toHaveLength(4);
    expect(result.evidence.join("")).toContain(exactChart.professional.dayMaster.stem);
    expect(result.stressStyle).toBe(exactChart.professional.structureBalance);
  });

  it("returns the same result for the same chart", () => {
    expect(extractMirrorFeatures(exactChart)).toEqual(extractMirrorFeatures(exactChart));
  });

  it("changes the vector and evidence when confirmed pillar evidence changes", () => {
    const changed = structuredClone(exactChart);
    changed.pillars.year.element = "木";

    expect(extractMirrorFeatures(changed).vector).not.toEqual(extractMirrorFeatures(exactChart).vector);
    expect(extractMirrorFeatures(changed).evidence).not.toEqual(extractMirrorFeatures(exactChart).evidence);
  });

  it("ignores candidate pillars and professional fields while marking them pending verification", () => {
    const ambiguous = structuredClone(exactChart);
    ambiguous.ambiguousPillars = ["month", "day", "hour"];
    ambiguous.professional.ambiguousFields = ["dayMaster", "dayPillar", "structureBalance"];
    const baseline = extractMirrorFeatures(ambiguous);

    const mutated = structuredClone(ambiguous);
    mutated.pillars.month = { stem: "甲", branch: "寅", element: "木", branchElement: "木", label: "候选月柱" };
    mutated.pillars.day = { stem: "丙", branch: "午", element: "火", branchElement: "火", label: "候选日柱" };
    mutated.pillars.hour = { stem: "戊", branch: "辰", element: "土", branchElement: "土", label: "候选时柱" };
    mutated.professional.dayMaster = { stem: "丙", element: "火", polarity: "yang" };
    mutated.professional.structureBalance = "support-heavy";
    mutated.professional.supportScore = 100;
    mutated.elementCounts = { 木: 10, 火: 10, 土: 10, 金: 10, 水: 10 };

    expect(extractMirrorFeatures(mutated)).toEqual(baseline);
    expect(baseline.stressStyle).toBe("待核");
    expect(baseline.evidence.join("")).toContain("待核");
    expect(baseline.evidence.join("")).not.toContain(ambiguous.professional.dayMaster.stem);
  });

  it("does not read a representative hour when birth time is unknown", () => {
    const unknownTime = calculateFourPillars({
      name: "林知远",
      date: "1990-06-15",
      time: null,
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "unknown",
    });
    const withCandidateHour = structuredClone(unknownTime);
    withCandidateHour.pillars.hour = exactChart.pillars.hour;
    withCandidateHour.elementCounts = structuredClone(exactChart.elementCounts);

    expect(extractMirrorFeatures(withCandidateHour)).toEqual(extractMirrorFeatures(unknownTime));
  });

  it("uses a symmetric, bounded ranking score with identical vectors highest", () => {
    const vector: MirrorFeatureVector = {
      growth: 8,
      expression: 6,
      stability: 4,
      discernment: 5,
      adaptability: 7,
    };
    const distant: MirrorFeatureVector = {
      growth: 1,
      expression: 1,
      stability: 10,
      discernment: 10,
      adaptability: 1,
    };
    const extreme: MirrorFeatureVector = {
      growth: 100,
      expression: 100,
      stability: 100,
      discernment: 100,
      adaptability: 100,
    };

    expect(scoreMirror(vector, vector)).toBe(50);
    expect(scoreMirror(vector, vector)).toBeGreaterThan(scoreMirror(vector, distant));
    expect(scoreMirror(vector, distant)).toBe(scoreMirror(distant, vector));
    expect(scoreMirror(vector, extreme)).toBeGreaterThanOrEqual(0);
    expect(scoreMirror(vector, extreme)).toBeLessThanOrEqual(50);
  });
});
