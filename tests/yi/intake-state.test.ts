import { describe, expect, it } from "vitest";
import {
  clampWheelDate,
  normalizeBirthSubmission,
  type BirthSubmissionDraft,
} from "../../components/yi/BirthIntake";

const baseInput: BirthSubmissionDraft = {
  name: "小艺",
  location: "杭州",
  date: { mode: "solar", year: 2026, month: 3, day: 31, isLeapMonth: false },
  timeMode: "exact",
  hour: 9,
  minute: 30,
  earthlyIndex: null,
};

describe("birth intake state", () => {
  it("accepts unknown hour without a clock value", () => {
    expect(normalizeBirthSubmission({ ...baseInput, timeMode: "unknown", hour: null, minute: null }))
      .toMatchObject({ time: null, timeConfidence: "unknown" });
  });

  it("keeps date valid when changing from March 31 to April", () => {
    expect(clampWheelDate({ year: 2026, month: 3, day: 31 }, { month: 4 }))
      .toEqual({ year: 2026, month: 4, day: 30 });
  });

  it("normalizes a twelve-period selection to its representative clock time", () => {
    expect(normalizeBirthSubmission({ ...baseInput, timeMode: "earthly", hour: null, minute: null, earthlyIndex: 0 }))
      .toMatchObject({ time: "00:00", timeConfidence: "approximate" });
  });
});
