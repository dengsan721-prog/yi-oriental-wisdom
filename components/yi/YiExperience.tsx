"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { formatYiHash, guardYiRoute, parseYiHash, resolveYiHydratedRoute } from "../../lib/yi/hash-router";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";
import { ResultShell } from "./ResultShell";
import { LifeHome } from "./LifeHome";
import { clearLifeProfile, createLifeProfile, getBrowserStorage, loadLifeProfile, saveLifeProfile, type LifeProfile, type StorageResult } from "../../lib/yi/life-profile";
import { useYiRoute } from "./useYiRoute";

function Mark() {
  return <div className="yi-brand-orbit yi-mark" role="img" aria-label="艺">
    <span className="yi-brand-glyph" aria-hidden="true">艺</span>
    {Array.from({ length: 5 }, (_, index) => <i className="yi-breath-ring" aria-hidden="true" style={{ "--ring-index": index } as CSSProperties} key={index} />)}
  </div>;
}

function RitualIntro({ restoring, onStart }: { restoring: boolean; onStart: () => void }) {
  return <section className="ritual" aria-busy={restoring}>
    <div className="ritual-bg" /><Mark />
    <h1 className="ritual-lines"><span>看见命局</span><span>读懂时运</span></h1>
    <button className="primary" disabled={restoring} onClick={onStart}>开始排盘 <span>→</span></button>
  </section>;
}

export const getCalculationSteps = () => ["四柱", "五行", "藏干", "十神", "干支", "大运"] as const;

export function YiExperience() {
  const { route, push, replace } = useYiRoute();
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [calcStep, setCalcStep] = useState(0);
  const [result, setResult] = useState<FourPillarsResult | null>(null);
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [profile, setProfile] = useState<LifeProfile | null>(null);
  const [storageError, setStorageError] = useState("");
  const professionalReport = useMemo(
    () => result && birth ? buildProfessionalReport(result, birth) : null,
    [birth, result],
  );

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const requestedRoute = parseYiHash(window.location.hash);
      const finishHydration = (hasProfile: boolean) => {
        const nextRoute = resolveYiHydratedRoute(requestedRoute, hasProfile);
        if (formatYiHash(nextRoute) !== formatYiHash(requestedRoute)) replace(nextRoute);
        setHydrated(true);
      };
      const storage = getBrowserStorage(window);
      if (!storage) {
        finishHydration(false);
        return;
      }
      const saved = loadLifeProfile(storage);
      if (saved) {
        try {
          const savedResult = calculateFourPillars(saved.birth);
          setProfile(saved);
          setName(saved.name);
          setBirth(saved.birth);
          setResult(savedResult);
          finishHydration(true);
        } catch {
          clearLifeProfile(storage);
          finishHydration(false);
        }
      } else finishHydration(false);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [replace]);

  useEffect(() => {
    if (!hydrated) return;
    const guardedRoute = guardYiRoute(route, {
      hasProfile: profile !== null,
      hasResult: result !== null,
      hasBirth: birth !== null,
    });
    if (guardedRoute !== route) replace(guardedRoute);
  }, [birth, hydrated, profile, replace, result, route]);

  useEffect(() => {
    if (!hydrated || route.page !== "calculating") return;
    const timer = window.setInterval(() => setCalcStep(value => Math.min(value + 1, 5)), 260);
    return () => window.clearInterval(timer);
  }, [hydrated, route.page]);

  useEffect(() => {
    if (!hydrated || route.page !== "calculating" || calcStep < 5) return;
    const timer = window.setTimeout(() => replace({ page: "report", section: "portrait" }), 240);
    return () => window.clearTimeout(timer);
  }, [calcStep, hydrated, replace, route.page]);

  function runBirthSubmission(value: BirthSubmission) {
    setStorageError("");
    setName(value.name);
    setBirth(value);
    setResult(calculateFourPillars(value));
    setCalcStep(0);
    replace({ page: "calculating" });
  }

  function saveAndOpenHome() {
    if (!result || !birth) return;
    const next = createLifeProfile({ name, birth, chart: result, overview: buildProfessionalOverview(result), interpretations: buildInterpretations(result), existing: profile });
    const storage = getBrowserStorage(window);
    const saved = storage ? saveLifeProfile(storage, next) : { ok: false as const, reason: "security" as const };
    if (!saved.ok) {
      setStorageError("本机档案保存失败，请检查浏览器存储权限或空间后重试。");
      return;
    }
    setStorageError("");
    setProfile(next);
    push({ page: "home" });
  }

  function updateProfile(next: LifeProfile): StorageResult {
    const storage = getBrowserStorage(window);
    const saved = storage ? saveLifeProfile(storage, next) : { ok: false as const, reason: "security" as const };
    if (saved.ok) setProfile(next);
    return saved;
  }

  function removeProfile(): StorageResult {
    const storage = getBrowserStorage(window);
    const cleared = storage ? clearLifeProfile(storage) : { ok: false as const, reason: "security" as const };
    if (!cleared.ok) return cleared;
    setProfile(null);
    setName("");
    setBirth(null);
    setResult(null);
    replace({ page: "intro" });
    return cleared;
  }

  return <main>
    {hydrated && route.page === "home" && profile && <LifeHome profile={profile} onChange={updateProfile} onClear={removeProfile} onViewReport={() => push({ page: "report", section: "portrait" })} />}
    {(!hydrated || route.page === "intro") && <RitualIntro restoring={!hydrated} onStart={() => push({ page: "birth" })} />}
    {hydrated && route.page === "birth" && <section className="intake">
      <header><button onClick={() => push({ page: "intro" })}>← 返回</button></header>
      <BirthIntake onSubmit={runBirthSubmission} />
    </section>}
    {hydrated && route.page === "calculating" && <section className="calculating">
      <Mark /><p>正在建立 {name || "访客"} 的命盘</p>
      <div className="calc-list">{getCalculationSteps().map((item, index) => <div className={index <= calcStep ? "active" : ""} key={item}><span>{index < calcStep ? "✓" : `0${index + 1}`}</span>{item}</div>)}</div>
    </section>}
    {hydrated && route.page === "report" && result && birth && professionalReport && <ResultShell
      name={name}
      chart={result}
      birth={birth}
      report={professionalReport}
      overview={buildProfessionalOverview(result)}
      interpretations={buildInterpretations(result)}
      activeSection={route.section}
      onSectionChange={section => push({ page: "report", section })}
      onRestart={() => push({ page: "birth" })}
      onSaveHome={saveAndOpenHome}
      storageError={storageError}
    />}
  </main>;
}
