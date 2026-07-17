import { describe, expect, it } from "vitest";
import { getDaysInMonth, getYearGroups, toEarthlyHour } from "../../lib/yi/date-picker";

describe("date picker helpers", () => {
  it("builds decade anchors from 1900 through current year", () => {
    expect(getYearGroups(2026)).toEqual([1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]);
  });

  it("handles leap years", () => {
    expect(getDaysInMonth(2000, 2)).toBe(29);
    expect(getDaysInMonth(1900, 2)).toBe(28);
  });

  it("maps clock time to earthly hours", () => {
    expect(toEarthlyHour(23)).toBe("子时");
    expect(toEarthlyHour(12)).toBe("午时");
  });
});
