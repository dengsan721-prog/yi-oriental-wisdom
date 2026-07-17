import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";

describe("calculateFourPillars", () => {
  it("returns stable pillars, element totals and high confidence", () => {
    const result = calculateFourPillars({
      name: "林知远",
      date: "1990-06-15",
      time: "09:30",
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "exact",
    });
    expect(Object.keys(result.pillars)).toEqual(["year", "month", "day", "hour"]);
    expect(Object.values(result.elementCounts).reduce((sum, value) => sum + value, 0)).toBe(8);
    expect(result.confidence).toBe("high");
    expect(result.pillars.year).toMatchObject({ stem: "庚", branch: "午" });
    expect(result.professional).toMatchObject({
      dayMaster: { stem: expect.any(String), element: expect.any(String) },
      structureBalance: expect.stringMatching(/support-heavy|mixed|expression-heavy/),
      pattern: expect.any(String),
      climate: expect.any(String),
      sameAndResourceElements: expect.any(Array),
      lowerCountElements: expect.any(Array),
      tenGods: expect.any(Array),
      relations: expect.any(Array),
    });
    expect(result.pillars).toMatchObject({
      year: { stem: "庚", branch: "午" },
      month: { stem: "壬", branch: "午" },
      day: { stem: "辛", branch: "亥" },
      hour: { stem: "癸", branch: "巳" },
    });
    expect(result.professional.tenGods).toHaveLength(12);
    expect(result.professional.tenGods).toEqual(expect.arrayContaining([
      expect.objectContaining({ pillar: "year", position: "stem", symbol: "庚", tenGod: "劫财" }),
      expect.objectContaining({ pillar: "year", position: "branch", symbol: "丁", tenGod: "七杀" }),
      expect.objectContaining({ pillar: "year", position: "branch", symbol: "己", tenGod: "偏印" }),
    ]));
    expect(result.professional.relations.every(item => item.symbols[0] !== item.symbols[1])).toBe(true);
    expect(result.professional.relations).toContainEqual(expect.objectContaining({
      type: "branch-clash", pillars: ["day", "hour"], symbols: ["亥", "巳"],
    }));
  });

  it("omits hour pillar and lowers confidence when time is unknown", () => {
    const result = calculateFourPillars({
      name: "林知远",
      date: "1990-06-15",
      time: null,
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "unknown",
    });
    expect(result.pillars.hour).toBeNull();
    expect(result.confidence).toBe("limited");
    expect(Object.values(result.elementCounts).reduce((sum, value) => sum + value, 0)).toBe(6);
    expect(result.professional.tenGods).toHaveLength(8);
    expect(result.professional.tenGods.every(item => item.pillar !== "hour")).toBe(true);
    expect(result.professional.relations.every(item => !item.pillars.includes("hour"))).toBe(true);
  });

  it("uses the exact Li Chun instant for the standard month pillar boundary", () => {
    const before = calculateFourPillars({ name: "甲", date: "2024-02-04", time: "10:00", location: "北京", gender: "unspecified", timeConfidence: "exact" });
    const after = calculateFourPillars({ name: "乙", date: "2024-02-04", time: "17:00", location: "北京", gender: "unspecified", timeConfidence: "exact" });
    expect(before.pillars.year).toMatchObject({ stem: "癸", branch: "卯" });
    expect(before.pillars.month).toMatchObject({ stem: "乙", branch: "丑" });
    expect(after.pillars.year).toMatchObject({ stem: "甲", branch: "辰" });
    expect(after.pillars.month).toMatchObject({ stem: "丙", branch: "寅" });
  });
});
