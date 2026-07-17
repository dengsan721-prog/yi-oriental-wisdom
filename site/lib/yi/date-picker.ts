const EARTHLY_HOURS = ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"] as const;

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
