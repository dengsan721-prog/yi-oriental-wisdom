"use client";

import { useEffect, useState } from "react";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";
import { ResultShell } from "./ResultShell";
import { LifeHome } from "./LifeHome";
import { clearLifeProfile, createLifeProfile, loadLifeProfile, saveLifeProfile, type LifeProfile } from "../../lib/yi/life-profile";

type Stage = "loading" | "intro" | "intake" | "calculating" | "result" | "home";

function Mark() {
  return <div className="yi-mark" aria-label="艺"><span>艺</span><i /><b /></div>;
}

export function YiExperience() {
  const [stage, setStage] = useState<Stage>("loading");
  const [name, setName] = useState("");
  const [calcStep, setCalcStep] = useState(0);
  const [result, setResult] = useState<FourPillarsResult | null>(null);
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [profile, setProfile] = useState<LifeProfile | null>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const saved = loadLifeProfile(window.localStorage);
      if (saved) {
        setProfile(saved);
        setName(saved.name);
        setBirth(saved.birth);
        const savedResult = calculateFourPillars(saved.birth);
        setResult(savedResult);
        setStage("home");
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
    setName(value.name);
    setBirth(value);
    setResult(calculateFourPillars(value));
    setCalcStep(0);
    setStage("calculating");
  }

  function saveAndOpenHome() {
    if (!result || !birth) return;
    if (profile && profile.birth.date === birth.date && profile.birth.time === birth.time && profile.birth.location === birth.location) {
      setStage("home");
      return;
    }
    const next = createLifeProfile({ name, birth, chart: result, overview: buildProfessionalOverview(result), interpretations: buildInterpretations(result) });
    saveLifeProfile(window.localStorage, next);
    setProfile(next);
    setStage("home");
  }

  function updateProfile(next: LifeProfile) {
    saveLifeProfile(window.localStorage, next);
    setProfile(next);
  }

  function removeProfile() {
    clearLifeProfile(window.localStorage);
    setProfile(null);
    setName("");
    setBirth(null);
    setResult(null);
    setStage("intro");
  }

  return <main>
    {stage === "loading" && <section className="calculating"><Mark /><p>正在读取本机档案</p></section>}
    {stage === "home" && profile && <LifeHome profile={profile} onChange={updateProfile} onClear={removeProfile} onViewReport={() => setStage("result")} />}
    {stage === "intro" && <section className="ritual">
      <div className="ritual-bg" /><Mark />
      <h1 className="ritual-lines"><span>看见命局</span><span>读懂时运</span></h1>
      <button className="primary" onClick={() => setStage("intake")}>开始排盘 <span>→</span></button>
    </section>}
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
    />}
  </main>;
}
