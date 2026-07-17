"use client";

import { useEffect, useState } from "react";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";
import { ResultShell } from "./ResultShell";
import { LifeHome } from "./LifeHome";
import { clearLifeProfile, createLifeProfile, getBrowserStorage, loadLifeProfile, saveLifeProfile, type LifeProfile, type StorageResult } from "../../lib/yi/life-profile";

type Stage = "loading" | "intro" | "intake" | "calculating" | "result" | "home";

function Mark() {
  return <div className="yi-mark" aria-label="艺"><span>艺</span><i /><b /></div>;
}

function RitualIntro({ restoring, onStart }: { restoring: boolean; onStart: () => void }) {
  return <section className="ritual" aria-busy={restoring}>
    <div className="ritual-bg" /><Mark />
    <h1 className="ritual-lines"><span>看见命局</span><span>读懂时运</span></h1>
    <button className="primary" disabled={restoring} onClick={onStart}>开始排盘 <span>→</span></button>
  </section>;
}

export function YiExperience() {
  const [stage, setStage] = useState<Stage>("loading");
  const [name, setName] = useState("");
  const [calcStep, setCalcStep] = useState(0);
  const [result, setResult] = useState<FourPillarsResult | null>(null);
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [profile, setProfile] = useState<LifeProfile | null>(null);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storage = getBrowserStorage(window);
      if (!storage) { setStage("intro"); return; }
      const saved = loadLifeProfile(storage);
      if (saved) {
        try {
          const savedResult = calculateFourPillars(saved.birth);
          setProfile(saved);
          setName(saved.name);
          setBirth(saved.birth);
          setResult(savedResult);
          setStage("home");
        } catch {
          clearLifeProfile(storage);
          setStage("intro");
        }
      } else setStage("intro");
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (stage !== "calculating") return;
    const timer = window.setInterval(() => setCalcStep(value => {
      if (value >= 5) {
        window.clearInterval(timer);
        window.setTimeout(() => setStage("result"), 240);
        return value;
      }
      return value + 1;
    }), 260);
    return () => window.clearInterval(timer);
  }, [stage]);

  function runBirthSubmission(value: BirthSubmission) {
    setStorageError("");
    setName(value.name);
    setBirth(value);
    setResult(calculateFourPillars(value));
    setCalcStep(0);
    setStage("calculating");
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
    setStage("home");
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
    setStage("intro");
    return cleared;
  }

  return <main>
    {stage === "home" && profile && <LifeHome profile={profile} onChange={updateProfile} onClear={removeProfile} onViewReport={() => setStage("result")} />}
    {(stage === "loading" || stage === "intro") && <RitualIntro restoring={stage === "loading"} onStart={() => setStage("intake")} />}
    {stage === "intake" && <section className="intake">
      <header><button onClick={() => setStage("intro")}>← 返回</button><span>艺</span><small>生辰排盘</small></header>
      <BirthIntake onSubmit={runBirthSubmission} />
    </section>}
    {stage === "calculating" && <section className="calculating">
      <Mark /><p>正在建立 {name || "访客"} 的命盘</p>
      <div className="calc-list">{["四柱", "五行", "十神", "格局", "喜忌", "大运"].map((item, index) => <div className={index <= calcStep ? "active" : ""} key={item}><span>{index < calcStep ? "✓" : `0${index + 1}`}</span>{item}</div>)}</div>
    </section>}
    {stage === "result" && result && birth && <ResultShell
      name={name}
      chart={result}
      birth={birth}
      overview={buildProfessionalOverview(result)}
      interpretations={buildInterpretations(result)}
      onRestart={() => setStage("intake")}
      onSaveHome={saveAndOpenHome}
      storageError={storageError}
    />}
  </main>;
}
