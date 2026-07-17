import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  clampWheelDate,
  normalizeBirthSubmission,
  type BirthSubmissionDraft,
} from "../../components/yi/BirthIntake";
import { TimePicker } from "../../components/yi/TimePicker";
import { getNextWheelIndex, WheelPicker } from "../../components/yi/WheelPicker";

const baseInput: BirthSubmissionDraft = {
  gender: "male",
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

  it("exposes only the selected wheel option in the tab order", () => {
    const html = renderToStaticMarkup(createElement(WheelPicker<number>, { label: "年", value: 2025, options: [2024, 2025, 2026].map((value) => ({ value, label: String(value) })), onChange: () => {} }));
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2);
  });

  it("announces time mode buttons as pressed", () => {
    const html = renderToStaticMarkup(createElement(TimePicker, { mode: "unknown", hour: null, minute: null, earthlyIndex: null, onChange: () => {} }));
    expect(html).toContain('aria-pressed="true"');
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
  });

  it("clamps keyboard wheel movement to the available options", () => {
    expect(getNextWheelIndex(1, "ArrowDown", 3)).toBe(2);
    expect(getNextWheelIndex(2, "ArrowDown", 3)).toBe(2);
    expect(getNextWheelIndex(0, "ArrowUp", 3)).toBe(0);
  });
});
