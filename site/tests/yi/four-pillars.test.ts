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
  });
});
