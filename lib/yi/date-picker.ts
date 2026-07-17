import { LunarYear } from "lunar-typescript";
import type { BirthDateSelection } from "./types";

const EARTHLY_HOURS = ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"] as const;

export type WheelMonthOption = {
  value: number;
  isLeapMonth: boolean;
  label: string;
};

export type WheelOptions = {
  years: number[];
  months: WheelMonthOption[];
  days: number[];
};

export function getYearGroups(currentYear: number): number[] {
  if (!Number.isInteger(currentYear) || currentYear < 1900) throw new Error("年份范围无效");
  const groups: number[] = [];
  for (let year = 1900; year <= currentYear; year += 10) groups.push(year);
  return groups;
}

export function getDaysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || year < 1900 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("日期范围无效");
  return new Date(year, month, 0).getDate();
}

export function toEarthlyHour(hour: number): string {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("小时范围无效");
  return EARTHLY_HOURS[Math.floor(((hour + 1) % 24) / 2)];
}

export function getWheelOptions(selection: BirthDateSelection, currentYear = new Date().getFullYear()): WheelOptions {
  if (!Number.isInteger(currentYear) || currentYear < 1900 || selection.year < 1900 || selection.year > currentYear) {
    throw new Error("年份范围无效");
  }

  const years = Array.from({ length: currentYear - 1899 }, (_, index) => 1900 + index);
  if (selection.mode === "solar") {
    const months = Array.from({ length: 12 }, (_, index) => ({
      value: index + 1,
      isLeapMonth: false,
      label: `${index + 1}月`,
    }));
    const dayCount = getDaysInMonth(selection.year, selection.month);
    return { years, months, days: Array.from({ length: dayCount }, (_, index) => index + 1) };
  }

  const lunarMonths = LunarYear.fromYear(selection.year).getMonths().filter((month) => month.getYear() === selection.year);
  const months = lunarMonths.map((month) => {
    const rawMonth = month.getMonth();
    const value = Math.abs(rawMonth);
    return {
      value,
      isLeapMonth: rawMonth < 0,
      label: `${rawMonth < 0 ? "闰" : ""}${toChineseMonth(value)}月`,
    };
  });
  const selectedMonth = lunarMonths.find((month) => month.getMonth() === (selection.isLeapMonth ? -selection.month : selection.month));
  if (!selectedMonth) throw new Error(selection.isLeapMonth ? `${selection.year}年不存在所选闰月` : "农历月份无效");

  return {
    years,
    months,
    days: Array.from({ length: selectedMonth.getDayCount() }, (_, index) => index + 1),
  };
}

function toChineseMonth(month: number): string {
  return ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"][month - 1] ?? String(month);
}
