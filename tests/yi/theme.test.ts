import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { FourPillarsResult } from "../../lib/yi/types";

function chart(element: "木" | "火" | "土" | "金" | "水"): FourPillarsResult {
  const dayStem = { 木: "甲", 火: "丙", 土: "戊", 金: "庚", 水: "壬" }[element];
  return {
    pillars: {
      year: { stem: "甲", branch: "子", element: "木", branchElement: "水", label: "年柱" },
      month: { stem: "丙", branch: "寅", element: "火", branchElement: "木", label: "月柱" },
      day: { stem: dayStem, branch: "辰", element, branchElement: "土", label: "日柱" },
      hour: null,
    },
    elementCounts: { 木: 2, 火: 1, 土: 2, 金: 0, 水: 1 },
    professional: {
      dayMaster: { stem: dayStem, element, polarity: "yang" },
      structureBalance: "mixed",
      supportScore: 0,
      observationConfidence: "limited",
      pattern: "",
      climate: "",
      sameAndResourceElements: [],
      lowerCountElements: [],
      tenGods: [],
      relations: [],
      ambiguousFields: [],
    },
    ambiguousPillars: [],
    confidence: "medium",
    disclaimer: "",
  };
}

describe("deriveYiThemeElement", () => {
  it.each(["木", "火", "土", "金", "水"] as const)(
    "uses the unambiguous %s day master",
    (element) => expect(deriveYiThemeElement(chart(element))).toBe(element),
  );

  it("falls back to neutral without a chart", () => {
    expect(deriveYiThemeElement(null)).toBe("neutral");
  });

  it("falls back when day-pillar evidence is ambiguous", () => {
    const input = chart("水");
    input.ambiguousPillars = ["day"];
    expect(deriveYiThemeElement(input)).toBe("neutral");
  });

  it.each(["dayMaster", "dayPillar"] as const)(
    "falls back when %s is ambiguous",
    (field) => {
      const input = chart("金");
      input.professional.ambiguousFields = [field];
      expect(deriveYiThemeElement(input)).toBe("neutral");
    },
  );

  it("sets a derived root theme without persisting it", () => {
    const source = readFileSync(new URL("../../components/yi/YiExperience.tsx", import.meta.url), "utf8");
    expect(source).toContain("data-element={themeElement}");
    expect(source).not.toMatch(/themeElement\s*:/);
  });
});
