"use client";

import type { TimeMode } from "../../lib/yi/types";
import { WheelPicker } from "./WheelPicker";

const periods = [
  ["子时", "23:00–00:59"], ["丑时", "01:00–02:59"], ["寅时", "03:00–04:59"],
  ["卯时", "05:00–06:59"], ["辰时", "07:00–08:59"], ["巳时", "09:00–10:59"],
  ["午时", "11:00–12:59"], ["未时", "13:00–14:59"], ["申时", "15:00–16:59"],
  ["酉时", "17:00–18:59"], ["戌时", "19:00–20:59"], ["亥时", "21:00–22:59"],
] as const;

type Props = {
  mode: TimeMode;
  hour: number | null;
  minute: number | null;
  earthlyIndex: number | null;
  onChange: (value: { mode: TimeMode; hour: number | null; minute: number | null; earthlyIndex: number | null }) => void;
};

export function TimePicker({ mode, hour, minute, earthlyIndex, onChange }: Props) {
  const setMode = (next: TimeMode) => onChange({
    mode: next,
    hour: next === "exact" ? (hour ?? 9) : null,
    minute: next === "exact" ? (minute ?? 0) : null,
    earthlyIndex: next === "earthly" ? (earthlyIndex ?? 0) : null,
  });

  return (
    <section className="time-picker" aria-labelledby="time-heading">
      <h2 id="time-heading">出生时辰</h2>
      <div className="time-modes" role="group" aria-label="时辰精度">
        <button type="button" className={mode === "exact" ? "active" : ""} onClick={() => setMode("exact")}>精确时间</button>
        <button type="button" className={mode === "earthly" ? "active" : ""} onClick={() => setMode("earthly")}>十二时辰</button>
        <button type="button" className={mode === "unknown" ? "active" : ""} onClick={() => setMode("unknown")}>不知道时辰</button>
      </div>
      {mode === "exact" && (
        <div className="time-wheels">
          <WheelPicker label="小时" value={hour ?? 9} options={Array.from({ length: 24 }, (_, value) => ({ value, label: `${String(value).padStart(2, "0")} 时` }))} onChange={(value) => onChange({ mode, hour: value, minute: minute ?? 0, earthlyIndex: null })} />
          <WheelPicker label="分钟" value={minute ?? 0} options={Array.from({ length: 60 }, (_, value) => ({ value, label: `${String(value).padStart(2, "0")} 分` }))} onChange={(value) => onChange({ mode, hour: hour ?? 9, minute: value, earthlyIndex: null })} />
        </div>
      )}
      {mode === "earthly" && (
        <WheelPicker label="十二时辰" value={earthlyIndex ?? 0} options={periods.map(([name, range], value) => ({ value, label: `${name} · ${range}` }))} onChange={(value) => onChange({ mode, hour: null, minute: null, earthlyIndex: value })} />
      )}
      {mode === "unknown" && <p className="unknown-note">时柱未定，仍可排盘</p>}
    </section>
  );
}

export function getEarthlyPeriodLabel(index: number | null) {
  if (index === null || !periods[index]) return "";
  return `${periods[index][0]} · ${periods[index][1]}`;
}
