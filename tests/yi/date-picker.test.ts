import { describe, expect, it } from "vitest";
import { getDaysInMonth, getWheelOptions, getYearGroups, toEarthlyHour } from "../../lib/yi/date-picker";

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

  it("only returns valid solar days for the selected month", () => {
    const options = getWheelOptions({ mode: "solar", year: 2024, month: 2, day: 29, isLeapMonth: false }, 2026);

    expect(options.years).toContain(2024);
    expect(options.months).toHaveLength(12);
    expect(options.days).toEqual(Array.from({ length: 29 }, (_, index) => index + 1));
  });

  it("includes a valid lunar leap month and its exact day count", () => {
    const options = getWheelOptions({ mode: "lunar", year: 2023, month: 2, day: 1, isLeapMonth: true }, 2026);

    expect(options.months).toContainEqual({ value: 2, isLeapMonth: true, label: "闰二月" });
    expect(options.days).toHaveLength(29);
  });

  it.each(["solar", "lunar"] as const)("rejects a non-integer %s year before calendar lookup", (mode) => {
    expect(() => getWheelOptions({ mode, year: Number.NaN, month: 1, day: 1, isLeapMonth: false }, 2026))
      .toThrow("年份范围无效");
  });
});
