"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDualCalendarLabel, toSolarSelection } from "../../lib/yi/calendar";
import { getWheelOptions } from "../../lib/yi/date-picker";
import type { BirthDateSelection, BirthInput, TimeMode } from "../../lib/yi/types";
import { TimePicker, getEarthlyPeriodLabel } from "./TimePicker";
import { WheelPicker } from "./WheelPicker";

export type BirthSubmission = BirthInput & { birthDate: BirthDateSelection; timeMode: TimeMode };
export type BirthSubmissionDraft = {
  name: string; location: string; date: BirthDateSelection; timeMode: TimeMode;
  hour: number | null; minute: number | null; earthlyIndex: number | null;
  gender: BirthInput["gender"];
};

type PendingTime = Pick<BirthSubmissionDraft, "timeMode" | "hour" | "minute" | "earthlyIndex">;
type FocusTarget = { isConnected: boolean; focus: () => void };

export function getTimeFocusTarget<T extends FocusTarget>(opener: T | null, fallback: T | null) {
  return opener?.isConnected ? opener : fallback;
}

export function clampWheelDate(current: Pick<BirthDateSelection, "year" | "month" | "day">, patch: Partial<Pick<BirthDateSelection, "year" | "month" | "day">>) {
  const year = patch.year ?? current.year;
  const month = patch.month ?? current.month;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day: Math.min(patch.day ?? current.day, maxDay) };
}

export function normalizeBirthSubmission(draft: BirthSubmissionDraft): BirthSubmission {
  const solar = toSolarSelection(draft.date);
  let time: string | null = null;
  let timeConfidence: BirthInput["timeConfidence"] = "unknown";
  if (draft.timeMode === "exact" && draft.hour !== null && draft.minute !== null) {
    time = `${String(draft.hour).padStart(2, "0")}:${String(draft.minute).padStart(2, "0")}`;
    timeConfidence = "exact";
  } else if (draft.timeMode === "earthly" && draft.earthlyIndex !== null) {
    const hour = draft.earthlyIndex === 0 ? 0 : draft.earthlyIndex * 2;
    time = `${String(hour).padStart(2, "0")}:00`;
    timeConfidence = "approximate";
  }
  return {
    name: draft.name.trim(), location: draft.location.trim(),
    date: `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`,
    time, gender: draft.gender, timeConfidence, birthDate: draft.date, timeMode: draft.timeMode,
  };
}

export function BirthIntake({ onSubmit }: { onSubmit: (value: BirthSubmission) => void }) {
  const currentYear = new Date().getFullYear();
  const [draft, setDraft] = useState<BirthSubmissionDraft>({
    name: "", location: "", date: { mode: "solar", year: 1990, month: 6, day: 15, isLeapMonth: false },
    timeMode: "exact", hour: 9, minute: 30, earthlyIndex: null, gender: "unspecified",
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState(draft.date);
  const [timeOpen, setTimeOpen] = useState(false);
  const [pendingTime, setPendingTime] = useState<PendingTime>({
    timeMode: draft.timeMode, hour: draft.hour, minute: draft.minute, earthlyIndex: draft.earthlyIndex,
  });
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusFrame = useRef<number | null>(null);
  const timeTriggerRef = useRef<HTMLButtonElement>(null);
  const timeOpenerRef = useRef<HTMLButtonElement>(null);
  const timeDialogRef = useRef<HTMLDivElement>(null);
  const timeCancelRef = useRef<HTMLButtonElement>(null);
  const restoreTimeFocusFrame = useRef<number | null>(null);
  const options = useMemo(() => getWheelOptions(pendingDate, currentYear), [pendingDate, currentYear]);
  const labels = getDualCalendarLabel(draft.date);
  const dateSummary = draft.date.mode === "solar" ? labels.solar : labels.lunar;
  const timeSummary = draft.timeMode === "unknown" ? "时柱未定，仍可排盘" : draft.timeMode === "earthly" ? getEarthlyPeriodLabel(draft.earthlyIndex) : `${String(draft.hour).padStart(2, "0")}:${String(draft.minute).padStart(2, "0")}`;

  useEffect(() => {
    if (dateOpen) cancelRef.current?.focus();
  }, [dateOpen]);

  useEffect(() => {
    if (timeOpen) timeCancelRef.current?.focus();
  }, [timeOpen]);

  useEffect(() => () => {
    if (restoreFocusFrame.current !== null) cancelAnimationFrame(restoreFocusFrame.current);
    if (restoreTimeFocusFrame.current !== null) cancelAnimationFrame(restoreTimeFocusFrame.current);
  }, []);

  const closeDatePicker = () => {
    setDateOpen(false);
    if (restoreFocusFrame.current !== null) cancelAnimationFrame(restoreFocusFrame.current);
    restoreFocusFrame.current = requestAnimationFrame(() => {
      dateTriggerRef.current?.focus();
      restoreFocusFrame.current = null;
    });
  };

  const closeTimePicker = () => {
    setTimeOpen(false);
    if (restoreTimeFocusFrame.current !== null) cancelAnimationFrame(restoreTimeFocusFrame.current);
    restoreTimeFocusFrame.current = requestAnimationFrame(() => {
      getTimeFocusTarget(timeOpenerRef.current, timeTriggerRef.current)?.focus();
      timeOpenerRef.current = null;
      restoreTimeFocusFrame.current = null;
    });
  };

  const chooseTimeMode = (timeMode: TimeMode, opener: HTMLButtonElement) => {
    if (timeMode === "unknown") {
      setDraft({ ...draft, timeMode, hour: null, minute: null, earthlyIndex: null });
      return;
    }
    timeOpenerRef.current = opener;
    setPendingTime({
      timeMode,
      hour: timeMode === "exact" ? (draft.hour ?? 9) : null,
      minute: timeMode === "exact" ? (draft.minute ?? 0) : null,
      earthlyIndex: timeMode === "earthly" ? (draft.earthlyIndex ?? 0) : null,
    });
    setTimeOpen(true);
  };

  const updatePending = (patch: Partial<BirthDateSelection>) => {
    const next = { ...pendingDate, ...patch };
    if (next.mode === "solar") {
      const clamped = clampWheelDate(pendingDate, next);
      setPendingDate({ ...next, ...clamped, isLeapMonth: false });
      return;
    }
    try {
      const nextOptions = getWheelOptions(next, currentYear);
      if (!nextOptions.months.some((item) => item.value === next.month && item.isLeapMonth === next.isLeapMonth)) {
        next.month = nextOptions.months[0].value; next.isLeapMonth = nextOptions.months[0].isLeapMonth;
      }
      const valid = getWheelOptions(next, currentYear);
      next.day = Math.min(next.day, valid.days.length);
      setPendingDate(next);
    } catch {
      setPendingDate({ ...next, month: 1, day: 1, isLeapMonth: false });
    }
  };

  return (
    <form className="intake-card wheel-intake" onSubmit={(event) => { event.preventDefault(); onSubmit(normalizeBirthSubmission(draft)); }}>
      <div className="step-head"><h1>建立出生坐标</h1></div>
      <div className="identity-row">
        <label><span>姓名（选填）</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="姓名（选填）" /></label>
        <label><span>出生地址（选填）</span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="城市或区县" /></label>
      </div>
      <section className="calendar-switch gender-switch" role="group" aria-label="出生性别（用于大运顺逆）">
        {(["male", "female", "unspecified"] as const).map(value => <button type="button" key={value} aria-pressed={draft.gender === value} className={draft.gender === value ? "active" : ""} onClick={() => setDraft({ ...draft, gender: value })}>{value === "male" ? "男" : value === "female" ? "女" : "暂不指定"}</button>)}
      </section>
      <section className="summary-control"><span>出生日期 · {draft.date.mode === "solar" ? "阳历" : "农历"}</span><strong>{dateSummary}</strong><button ref={dateTriggerRef} type="button" onClick={() => { setPendingDate(draft.date); setDateOpen(true); }}>选择日期</button></section>
      <section className="time-entry" aria-labelledby="time-summary-heading">
        <h2 id="time-summary-heading">出生时辰</h2>
        <div className="time-modes" role="group" aria-label="时辰精度">
          <button ref={draft.timeMode === "exact" ? timeTriggerRef : undefined} type="button" aria-pressed={draft.timeMode === "exact"} className={draft.timeMode === "exact" ? "active" : ""} onClick={(event) => chooseTimeMode("exact", event.currentTarget)}>精确时间</button>
          <button ref={draft.timeMode === "earthly" ? timeTriggerRef : undefined} type="button" aria-pressed={draft.timeMode === "earthly"} className={draft.timeMode === "earthly" ? "active" : ""} onClick={(event) => chooseTimeMode("earthly", event.currentTarget)}>十二时辰</button>
          <button ref={draft.timeMode === "unknown" ? timeTriggerRef : undefined} type="button" aria-pressed={draft.timeMode === "unknown"} className={draft.timeMode === "unknown" ? "active" : ""} onClick={(event) => chooseTimeMode("unknown", event.currentTarget)}>不知道时辰</button>
        </div>
        {draft.timeMode !== "unknown" && <section className="summary-control time-summary"><span>{draft.timeMode === "exact" ? "当前时间" : "当前时辰"}</span><strong>{timeSummary}</strong><button type="button" onClick={(event) => chooseTimeMode(draft.timeMode, event.currentTarget)}>修改时辰</button></section>}
      </section>
      <button className="primary submit" type="submit">生成命盘 <span>→</span></button>
      {dateOpen && (
        <div className="picker-overlay" role="dialog" aria-modal="true" aria-labelledby="date-picker-title" ref={dialogRef} onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); closeDatePicker(); return; }
          if (event.key !== "Tab") return;
          const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]') ?? []);
          if (!focusable.length) return;
          const first = focusable[0]; const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}>
          <div className="picker-sheet">
            <header><button ref={cancelRef} type="button" onClick={closeDatePicker}>取消</button><h2 id="date-picker-title">选择出生日期</h2><button type="button" onClick={() => { setDraft({ ...draft, date: pendingDate }); closeDatePicker(); }}>确认</button></header>
            <div className="calendar-switch" role="group" aria-label="历法"><button type="button" aria-pressed={pendingDate.mode === "solar"} className={pendingDate.mode === "solar" ? "active" : ""} onClick={() => updatePending({ mode: "solar", isLeapMonth: false })}>阳历</button><button type="button" aria-pressed={pendingDate.mode === "lunar"} className={pendingDate.mode === "lunar" ? "active" : ""} onClick={() => updatePending({ mode: "lunar", isLeapMonth: false })}>农历</button></div>
            <div className="date-wheels">
              <WheelPicker label="年" value={pendingDate.year} options={options.years.map((value) => ({ value, label: `${value} 年` }))} onChange={(year) => updatePending({ year })} />
              <WheelPicker label="月" value={`${pendingDate.month}:${pendingDate.isLeapMonth ? 1 : 0}`} options={options.months.map((item) => ({ value: `${item.value}:${item.isLeapMonth ? 1 : 0}`, label: item.label }))} onChange={(value) => { const [month, leap] = value.split(":"); updatePending({ month: Number(month), isLeapMonth: leap === "1" }); }} />
              <WheelPicker label="日" value={pendingDate.day} options={options.days.map((value) => ({ value, label: `${value} 日` }))} onChange={(day) => updatePending({ day })} />
            </div>
          </div>
        </div>
      )}
      {timeOpen && (
        <div className="picker-overlay" role="dialog" aria-modal="true" aria-labelledby="time-picker-title" ref={timeDialogRef} onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); closeTimePicker(); return; }
          if (event.key !== "Tab") return;
          const focusable = Array.from(timeDialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]') ?? []);
          if (!focusable.length) return;
          const first = focusable[0]; const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}>
          <div className="picker-sheet time-picker-sheet">
            <header><button ref={timeCancelRef} type="button" onClick={closeTimePicker}>取消</button><h2 id="time-picker-title">选择出生时辰</h2><button type="button" onClick={() => { setDraft({ ...draft, ...pendingTime }); closeTimePicker(); }}>确认</button></header>
            <TimePicker mode={pendingTime.timeMode} hour={pendingTime.hour} minute={pendingTime.minute} earthlyIndex={pendingTime.earthlyIndex} onChange={(time) => setPendingTime({ timeMode: time.mode, hour: time.hour, minute: time.minute, earthlyIndex: time.earthlyIndex })} />
          </div>
        </div>
      )}
    </form>
  );
}
