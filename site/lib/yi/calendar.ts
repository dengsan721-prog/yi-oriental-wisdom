import { Lunar, Solar } from "lunar-typescript";
import type { BirthDateSelection } from "./types";

export type SolarSelection = Pick<BirthDateSelection, "year" | "month" | "day">;

export type DualCalendarLabel = {
  solar: string;
  lunar: string;
};

function selectionToSolar(selection: BirthDateSelection): Solar {
  if (selection.mode === "solar") {
    const dayCount = Number.isInteger(selection.year) && Number.isInteger(selection.month) && selection.month >= 1 && selection.month <= 12
      ? new Date(Date.UTC(selection.year, selection.month, 0)).getUTCDate()
      : 0;
    if (!Number.isInteger(selection.day) || selection.day < 1 || selection.day > dayCount) {
      throw new Error("阳历日期无效");
    }
    const solar = Solar.fromYmd(selection.year, selection.month, selection.day);
    if (solar.getYear() !== selection.year || solar.getMonth() !== selection.month || solar.getDay() !== selection.day) {
      throw new Error("阳历日期无效");
    }
    return solar;
  }

  const lunarMonth = selection.isLeapMonth ? -selection.month : selection.month;
  try {
    const lunar = Lunar.fromYmd(selection.year, lunarMonth, selection.day);
    if (lunar.getYear() !== selection.year || lunar.getMonth() !== lunarMonth || lunar.getDay() !== selection.day) {
      throw new Error("农历日期无效");
    }
    return lunar.getSolar();
  } catch {
    if (selection.isLeapMonth) throw new Error(`${selection.year}年不存在所选闰月或日期`);
    throw new Error("农历日期无效");
  }
}

export function toSolarSelection(selection: BirthDateSelection): SolarSelection {
  const solar = selectionToSolar(selection);
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

export function getDualCalendarLabel(selection: BirthDateSelection): DualCalendarLabel {
  const solar = selectionToSolar(selection);
  const lunar = solar.getLunar();
  return {
    solar: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`,
    lunar: `${lunar.getYear()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
  };
}
