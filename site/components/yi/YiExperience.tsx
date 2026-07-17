"use client";

import { useEffect, useState } from "react";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";
import { ResultShell } from "./ResultShell";

type Stage = "intro" | "intake" | "calculating" | "result";

function Mark() {
  return <div className="yi-mark" aria-label="艺"><span>艺</span><i /><b /></div>;
}

export function YiExperience() {
  const [stage, setStage] = useState<Stage>("intro");
  const [name, setName] = useState("");
  const [calcStep, setCalcStep] = useState(0);
  const [result, setResult] = useState<FourPillarsResult | null>(null);
  const [birth, setBirth] = useState<BirthInput | null>(null);

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

  return <main>
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
    />}
  </main>;
}
