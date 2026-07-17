import { describe, expect, it } from "vitest";
import { getDualCalendarLabel, toSolarSelection } from "../../lib/yi/calendar";

describe("calendar conversion", () => {
  it("converts lunar new year to the matching solar day", () => {
    expect(toSolarSelection({ mode: "lunar", year: 2024, month: 1, day: 1, isLeapMonth: false }))
      .toEqual({ year: 2024, month: 2, day: 10 });
  });

  it("returns both calendar labels", () => {
    expect(getDualCalendarLabel({ mode: "solar", year: 2024, month: 2, day: 10, isLeapMonth: false }))
      .toMatchObject({ solar: "2024年2月10日", lunar: expect.stringContaining("正月初一") });
  });

  it("rejects a lunar leap month that does not exist", () => {
    expect(() => toSolarSelection({ mode: "lunar", year: 2024, month: 1, day: 1, isLeapMonth: true }))
      .toThrow(/闰月/);
  });

  it("rejects a solar day that does not exist", () => {
    expect(() => toSolarSelection({ mode: "solar", year: 2024, month: 2, day: 30, isLeapMonth: false }))
      .toThrow("阳历日期无效");
  });
});
