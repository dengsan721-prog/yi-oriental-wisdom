"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { actionPlan, expertSourceGraph, historicalMirrors, relationshipFixtures } from "../../lib/content/demo";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretation } from "../../lib/yi/interpret";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

type Stage = "intro" | "intake" | "calculating" | "result";
type ViewMode = "plain" | "dual" | "professional";

const steps = ["时间校准｜真太阳时", "先天结构｜四柱八字", "生命禀赋｜五行旺衰", "人生驱动力｜十神", "时运节律｜大运流年", "多模型会审｜现实印证"];
const initialInput: BirthInput = { name: "", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" };

function Mark({ small = false }: { small?: boolean }) {
  return <div className={small ? "brand-mark small" : "brand-mark"} aria-label="艺"><span>艺</span><i /><b /></div>;
}

export function YiExperience() {
  const [stage, setStage] = useState<Stage>("intro");
  const [input, setInput] = useState<BirthInput>(initialInput);
  const [result, setResult] = useState<FourPillarsResult | null>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ViewMode>("dual");
  const [relation, setRelation] = useState("partner");
  const [photo, setPhoto] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const interpretations = useMemo(() => result ? buildInterpretation(result) : [], [result]);
  const selectedRelation = relationshipFixtures.find(item => item.id === relation)!;

  useEffect(() => {
    if (stage !== "calculating") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(steps.length - 1);
      const timer = window.setTimeout(() => setStage("result"), 250);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setInterval(() => setStep(current => {
      if (current >= steps.length - 1) {
        window.clearInterval(timer);
        window.setTimeout(() => setStage("result"), 500);
        return current;
      }
      return current + 1;
    }), 420);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === "result") window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [stage]);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setResult(calculateFourPillars(input));
      setStep(0);
      setStage("calculating");
    } catch (error) {
      alert(error instanceof Error ? error.message : "请检查出生信息");
    }
  }

  function openRelationship() {
    if (stage === "result") document.querySelector("#relationship")?.scrollIntoView({ behavior: "smooth" });
    else setStage("intake");
  }

  return <main>
    <header className="topbar"><a className="wordmark" href="#top"><Mark small /><span>东方人生智慧</span></a><nav><a href="#wisdom">人生智慧</a><a href="#relationship">关系智慧</a><a href="#sources">智慧谱系</a></nav><button className="ghost" onClick={() => setStage("intake")}>开始体验</button></header>

    <section id="top" className="hero">
      <div className="aurora one" /><div className="aurora two" />
      <div className="hero-copy"><p className="kicker">东方人生智慧 · CULTURAL LIFE ATLAS</p><h1>看见命运的脉络，<br />活出人生的智慧。</h1><p className="lead">融合四柱八字、五行时运与关系合盘，把深奥命理转化为看得懂的人生故事、关系洞察与顺势行动。</p><div className="hero-actions"><button className="primary" onClick={() => setStage("intake")}>开启我的人生智慧图 <span>→</span></button><button className="text-button" onClick={openRelationship}>直接看一段关系</button></div><p className="micro">传统文化体验与自我观察参考 · 结果可追溯 · 观点可验证</p></div>
      <div className="hero-core"><Mark /><div className="orbit-label top">四时</div><div className="orbit-label right">五行</div><div className="orbit-label bottom">关系</div><div className="orbit-label left">岁运</div></div>
    </section>

    {stage === "intake" && <section className="modal-wrap" role="dialog" aria-modal="true" aria-label="输入出生信息"><div className="sheet"><button className="close" onClick={() => setStage("intro")} aria-label="关闭">×</button><div className="sheet-head"><span>01 / 建立人生坐标</span><h2>时间，是理解生命节律的起点。</h2><p>你的资料只用于本次演示计算，不会在本 Demo 中保存。</p></div><form onSubmit={submit} className="birth-form"><label><span>如何称呼你</span><input required value={input.name} onChange={e => setInput({ ...input, name: e.target.value })} placeholder="输入名字" /></label><div className="form-row"><label><span>出生日期</span><input required type="date" value={input.date} onChange={e => setInput({ ...input, date: e.target.value })} /></label><label><span>出生时间</span><input required={input.timeConfidence !== "unknown"} type="time" disabled={input.timeConfidence === "unknown"} value={input.time ?? ""} onChange={e => setInput({ ...input, time: e.target.value })} /></label></div><div className="form-row"><label><span>出生地点</span><input required value={input.location} onChange={e => setInput({ ...input, location: e.target.value })} /></label><label><span>性别（仅作传统排盘参考）</span><select value={input.gender} onChange={e => setInput({ ...input, gender: e.target.value as BirthInput["gender"] })}><option value="unspecified">暂不说明</option><option value="female">女</option><option value="male">男</option></select></label></div><fieldset><legend>出生时间可信度</legend><div className="choice-row">{[["exact", "准确"], ["approximate", "大约"], ["unknown", "不知道"]].map(([value, label]) => <label className={input.timeConfidence === value ? "choice active" : "choice"} key={value}><input type="radio" name="confidence" value={value} checked={input.timeConfidence === value} onChange={() => setInput({ ...input, timeConfidence: value as BirthInput["timeConfidence"], time: value === "unknown" ? null : input.time || "09:30" })} />{label}</label>)}</div></fieldset><button className="primary full" type="submit">开始生命计算 <span>→</span></button><p className="form-note">时辰不确定时，只呈现多个候选命盘中相对稳定的部分。</p></form></div></section>}

    {stage === "calculating" && <section className="calculation"><Mark /><p>正在为 {input.name || "你"} 建立人生智慧图</p><div className="calc-steps">{steps.map((label, index) => <div className={index <= step ? "calc-step active" : "calc-step"} key={label}><span>{index < step ? "✓" : String(index + 1).padStart(2, "0")}</span>{label}</div>)}</div><div className="progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></section>}

    {stage === "result" && result && <section ref={resultRef} id="wisdom" className="result-shell">
      <div className="result-intro"><div><p className="kicker">{input.name} · 人生智慧总览</p><h2>你不是一个结论，<br />而是一组正在生长的可能。</h2></div><div className="mode-switch" role="group" aria-label="解读模式">{[["plain", "通俗"], ["dual", "双层"], ["professional", "专业"]].map(([value, label]) => <button className={mode === value ? "active" : ""} onClick={() => setMode(value as ViewMode)} key={value}>{label}</button>)}</div></div>
      <div className="summary-grid"><article className="feature-card"><span className="card-index">当前主旋律</span><h3>{interpretations[0]?.innovationName}</h3>{mode !== "plain" && <p className="term">{interpretations[0]?.professionalName}</p>}<p>{interpretations[0]?.story}</p><div className="action-line"><span>今天的一步</span>{interpretations[0]?.action}</div></article><article className="metric-card"><span>当前节律</span><strong>由内而外</strong><p>先整理结构，再放大影响。此刻适合用小范围行动验证方向。</p></article><article className="metric-card"><span>关系提醒</span><strong>先理解，再解决</strong><p>你可能习惯快速给方案，而重要关系更需要先被听见。</p></article></div>

      <section className="chart-section"><div className="section-heading"><span>02 / 人生智慧图</span><h2>先天结构，不是人生边界。</h2><p>专业命盘保留传统叫法；通俗解读帮助你在现实中验证。</p></div><div className="pillars">{Object.values(result.pillars).map((pillar, index) => pillar && <article key={pillar.label}><span>{pillar.label}</span><strong>{pillar.stem}{pillar.branch}</strong><small>{pillar.element} · {pillar.branchElement}</small><i style={{ height: `${42 + index * 12}%` }} /></article>)}</div><div className="element-bar">{Object.entries(result.elementCounts).map(([element, count]) => <div key={element}><span>{element}</span><i><b style={{ width: `${count * 25}%` }} /></i><small>{count}</small></div>)}</div><p className="evidence">计算说明：当前 Demo 使用节气近似边界完成基础四柱展示；高级格局、调候和真太阳时将在正式算法核验后开放。可信度：{result.confidence === "high" ? "较高" : result.confidence === "medium" ? "中等" : "有限"}。</p></section>

      <section className="interpret-grid">{interpretations.map((card, index) => <article className="wisdom-card" key={card.id}><span>0{index + 1}</span><h3>{card.innovationName}{mode !== "plain" && <small>｜{card.professionalName}</small>}</h3>{mode !== "professional" && <p>{card.story}</p>}{mode !== "plain" && <details><summary>查看专业依据与验证</summary><p><b>依据：</b>{card.professionalBasis}</p><p><b>现实验证：</b>{card.realityCheck}</p><p><b>反例条件：</b>{card.counterCondition}</p></details>}<div className="card-action">顺势行动 · {card.action}</div></article>)}</section>

      <section id="relationship" className="relationship-section"><div className="section-heading"><span>03 / 关系智慧｜合盘</span><h2>不是判断合不合，<br />而是看懂如何相处。</h2><p>关系分析不输出单一分数，也不把问题归咎于任何一方。</p></div><div className="relation-layout"><div className="relation-tabs">{relationshipFixtures.map(item => <button key={item.id} className={relation === item.id ? "active" : ""} onClick={() => setRelation(item.id)}><span>{item.label}</span><small>{item.lead}</small></button>)}</div><div className="relation-result"><div className="nodes"><span>你</span><i /><span>对方</span></div><h3>{selectedRelation.lead}</h3><div className="dimension-grid">{["吸引与认同", "沟通节奏", "冲突触发", "资源互补", "长期协作"].map((label, index) => <div key={label}><span>{label}</span><i><b style={{ width: `${62 + index * 6}%` }} /></i><small>{["温暖", "错拍", "可见", "清晰", "可塑"][index]}</small></div>)}</div><blockquote>“{selectedRelation.phrase}”</blockquote><p className="next-action">下一步：{selectedRelation.action}</p></div></div></section>

      <section className="aux-grid"><article className="face-card"><div><span>04 / 相由心生</span><h2>面相与面痣</h2><p>上传照片体验面部生命地图。Demo 仅在本机预览，不上传、不保存。</p><label className="upload">选择照片<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 8 * 1024 * 1024) return alert("照片请小于 8MB"); if (photo) URL.revokeObjectURL(photo); setPhoto(URL.createObjectURL(file)); }} /></label></div><div className={photo ? "face-preview has-photo" : "face-preview"}>{photo ? <img src={photo} alt="本机照片预览" /> : <><span>面</span><i className="line-one" /><i className="line-two" /></>}</div></article><article className="ziwei-card"><span>独立第二主模型 · BETA</span><h2>紫微实践引擎</h2><p>十二宫位、案例推演与现实应事将独立呈现，不与四柱强行合并。</p><strong>Beta 演示，不参与本次四柱主结论</strong></article></section>

      <section className="mirror-section"><div className="section-heading"><span>05 / 人生镜鉴</span><h2>在前人的人生里，<br />看见自己的另一种可能。</h2></div><div className="mirror-grid">{historicalMirrors.map((item, index) => <article key={item.name}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.name}</h3><p>{item.theme}</p><small>{item.note}</small></article>)}</div></section>

      <section className="action-section"><div className="section-heading"><span>06 / 顺势而为</span><h2>把理解，变成接下来<br />真正能做的事。</h2></div><div className="action-grid">{actionPlan.map(item => <article key={item.days}><span>{item.days}</span><h3>{item.title}</h3><p>{item.detail}</p><button>加入行动书 →</button></article>)}</div></section>

      <section id="sources" className="sources-section"><div className="section-heading"><span>07 / 开放式东方智慧谱系</span><h2>不迷信名气，<br />只尊重真实专长与可追溯来源。</h2><p>南怀瑾、李叔同、倪海厦等只是典型样本；更多原典、学者与实践者按专长归席。</p></div><div className="source-list">{expertSourceGraph.map(item => <article key={item.seat}><span>{item.seat}</span><div><h3>{item.examples}</h3><p>{item.role}</p></div><small>{item.status}</small></article>)}</div></section>

      <footer><Mark small /><p>艺｜东方人生智慧</p><span>{result.disclaimer}</span><button onClick={() => setStage("intake")}>重新建立智慧图</button></footer>
    </section>}
  </main>;
}
