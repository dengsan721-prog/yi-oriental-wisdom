import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  BirthIntake,
  clampWheelDate,
  getTimeFocusTarget,
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
  it("restores time-dialog focus to the real opener while it remains mounted", () => {
    const modeButton = { isConnected: true, focus: () => {} };
    const modifyButton = { isConnected: true, focus: () => {} };
    const removedButton = { isConnected: false, focus: () => {} };

    expect(getTimeFocusTarget(modifyButton, modeButton)).toBe(modifyButton);
    expect(getTimeFocusTarget(removedButton, modeButton)).toBe(modeButton);
    expect(getTimeFocusTarget(null, modeButton)).toBe(modeButton);
  });

  it("accepts an empty optional name and uses the visitor fallback", () => {
    const submission = normalizeBirthSubmission({ ...baseInput, name: "" });
    expect(submission.name).toBe("");
    const html = renderToStaticMarkup(createElement(BirthIntake, { onSubmit: () => {} }));
    expect(html).toContain('placeholder="姓名（选填）"');
    expect(html).not.toMatch(/<input[^>]+required[^>]+placeholder="姓名（选填）"/);
  });

  it("renders only compact summaries before a date or time picker is opened", () => {
    const html = renderToStaticMarkup(createElement(BirthIntake, { onSubmit: () => {} }));

    expect(html).toContain('<div class="step-head"><h1>建立出生坐标</h1></div>');
    expect(html).toContain("出生地址（选填）");
    expect(html).toContain('placeholder="城市或区县"');
    expect(html).toContain('class="dual-calendar-line"');
    expect(html).toContain("不知道时辰");
    expect(html).not.toContain("请确认出生信息");
    expect(html).not.toContain("阳历、农历均可录入");
    expect(html).not.toContain("当前版本不做真太阳时校正");
    expect(html).not.toContain('role="listbox"');
  });
  it("accepts unknown hour without a clock value", () => {
    expect(normalizeBirthSubmission({ ...baseInput, timeMode: "unknown", hour: null, minute: null }))
      .toMatchObject({ time: null, timeConfidence: "unknown" });
  });

  it("keeps an optional birth address without changing the solar date", () => {
    const result = normalizeBirthSubmission({
      name: " 林 ",
      location: " 浙江省杭州市 ",
      date: { mode: "solar", year: 1990, month: 6, day: 15, isLeapMonth: false },
      timeMode: "unknown",
      hour: null,
      minute: null,
      earthlyIndex: null,
      gender: "unspecified",
    });

    expect(result.location).toBe("浙江省杭州市");
    expect(result.date).toBe("1990-06-15");
    expect(result.time).toBeNull();
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
