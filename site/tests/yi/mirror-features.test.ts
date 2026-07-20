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

const boundaryChart = calculateFourPillars({
  name: "沈观澜",
  date: "1980-01-01",
  time: "00:00",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});

describe("explainable mirror features", () => {
  it("derives five bounded features, evidence and a stress style", () => {
    const result = extractMirrorFeatures(exactChart);

    expect(result.vector).toEqual({
      growth: 2,
      expression: 6.5,
      stability: 2,
      discernment: 7,
      adaptability: 6.5,
    });
    for (const value of Object.values(result.vector)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
    expect(result.evidence).toHaveLength(4);
    expect(result.evidence[0]).toContain("仅统计稳定柱天干与地支主五行，未展开藏干权重");
    expect(result.evidence[0]).toContain("每维基准2，每出现一处+1.5");
    expect(result.evidence[0]).toContain("已确认日主对应维度再+2");
    expect(result.evidence.join("")).toContain(exactChart.professional.dayMaster.stem);
    expect(result.stressStyle).toBe(exactChart.professional.structureBalance);
  });

  it("returns the same result for the same chart", () => {
    expect(extractMirrorFeatures(exactChart)).toEqual(extractMirrorFeatures(exactChart));
  });

  it("changes specific dimensions when a second calculated chart changes confirmed evidence", () => {
    const first = extractMirrorFeatures(exactChart);
    const second = extractMirrorFeatures(boundaryChart);

    expect(boundaryChart.pillars).toMatchObject({
      year: { stem: "己", branch: "未" },
      month: { stem: "丙", branch: "子" },
      day: { stem: "癸", branch: "酉" },
      hour: { stem: "壬", branch: "子" },
    });
    expect(second.vector).toEqual({
      growth: 2,
      expression: 3.5,
      stability: 5,
      discernment: 3.5,
      adaptability: 10,
    });
    expect(second.vector.stability).toBeGreaterThan(first.vector.stability);
    expect(second.vector.adaptability).toBeGreaterThan(first.vector.adaptability);
    expect(first.evidence[0]).toContain("土0");
    expect(second.evidence[0]).toContain("土2");
    expect(second.evidence[0]).toContain("水4");
  });

  it("ignores a candidate day master when only dayMaster is pending verification", () => {
    const ambiguous = structuredClone(exactChart);
    ambiguous.ambiguousPillars = [];
    ambiguous.professional.ambiguousFields = ["dayMaster"];
    const baseline = extractMirrorFeatures(ambiguous);

    const mutated = structuredClone(ambiguous);
    mutated.professional.dayMaster = { stem: "甲", element: "木", polarity: "yang" };

    const result = extractMirrorFeatures(mutated);
    expect(ambiguous.ambiguousPillars).not.toContain("day");
    expect(result.vector).toEqual(baseline.vector);
    expect(result.stressStyle).toBe(baseline.stressStyle);
    expect(result.evidence).toEqual(baseline.evidence);
    expect(result.evidence.join("")).toContain("待核");
    expect(result.evidence.join("")).not.toContain("甲木");
    expect(result.evidence.join("")).not.toContain(exactChart.professional.dayMaster.stem);
  });

  it("ignores a candidate day pillar when only dayPillar is pending verification", () => {
    const ambiguous = structuredClone(exactChart);
    ambiguous.professional.ambiguousFields = ["dayPillar"];
    const baseline = extractMirrorFeatures(ambiguous);

    const mutated = structuredClone(ambiguous);
    mutated.pillars.day = { stem: "甲", branch: "寅", element: "木", branchElement: "木", label: "秘密候选标签" };

    const result = extractMirrorFeatures(mutated);
    expect(result.vector).toEqual(baseline.vector);
    expect(result.stressStyle).toBe(baseline.stressStyle);
    expect(result.evidence).toEqual(baseline.evidence);
    expect(result.evidence.join("")).toContain("待核");
    expect(result.evidence.join("")).not.toContain("甲寅");
    expect(result.evidence.join("")).not.toContain("秘密候选标签");
  });

  it("ignores a candidate structure when only structureBalance is pending verification", () => {
    const ambiguous = structuredClone(exactChart);
    ambiguous.professional.ambiguousFields = ["structureBalance"];
    const baseline = extractMirrorFeatures(ambiguous);

    const mutated = structuredClone(ambiguous);
    mutated.professional.structureBalance = "support-heavy";

    const result = extractMirrorFeatures(mutated);
    expect(result.vector).toEqual(baseline.vector);
    expect(result.stressStyle).toBe(baseline.stressStyle);
    expect(result.evidence).toEqual(baseline.evidence);
    expect(result.evidence.join("")).toContain("待核");
  });

  it("ignores candidate relations when only relationSummary is pending verification", () => {
    const ambiguous = structuredClone(exactChart);
    ambiguous.professional.ambiguousFields = ["relationSummary"];
    const baseline = extractMirrorFeatures(ambiguous);

    const mutated = structuredClone(ambiguous);
    mutated.professional.relations = [{
      type: "branch-clash",
      pillars: ["year", "month"],
      symbols: ["卯", "酉"],
      label: "候选卯酉关系",
    }];

    const result = extractMirrorFeatures(mutated);
    expect(result.vector).toEqual(baseline.vector);
    expect(result.stressStyle).toBe(baseline.stressStyle);
    expect(result.evidence).toEqual(baseline.evidence);
    expect(result.evidence.join("")).toContain("待核");
    expect(result.evidence.join("")).not.toContain("候选卯酉关系");
    expect(result.evidence.join("")).not.toContain("卯酉");
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
