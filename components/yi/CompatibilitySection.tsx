"use client";
import { useState } from "react";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { calculateCompatibility, type RelationshipType } from "../../lib/yi/compatibility";
import type { FourPillarsResult } from "../../lib/yi/types";

const labels: Record<RelationshipType, string> = { partner: "伴侣", "parent-child": "亲子", business: "商业伙伴", friend: "朋友" };
export function CompatibilitySection({ chart }: { chart: FourPillarsResult }) {
  const [relationship, setRelationship] = useState<RelationshipType>("partner");
  const [draft, setDraft] = useState({ name: "", date: "1992-11-03", time: "18:20", location: "上海", gender: "unspecified" as const });
  const [second, setSecond] = useState<FourPillarsResult | null>(null);
  const result = second ? calculateCompatibility(chart, second, relationship) : null;
  return <section className="report-section"><header><small>关系合盘</small><h1>不打分，拆开看互动</h1><p>第二份录入会在章节切换时保留；合盘不判断关系成败。</p></header>
    <form className="relation-form" onSubmit={event => { event.preventDefault(); setSecond(calculateFourPillars({ ...draft, time: draft.time || null, timeConfidence: draft.time ? "exact" : "unknown" })); }}>
      <label>关系<select value={relationship} onChange={e => setRelationship(e.target.value as RelationshipType)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>姓名<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label><label>出生日期<input required type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label><label>出生时间<input type="time" value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} /></label><label>出生地点<input required value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} /></label><button className="primary" type="submit">生成关系观察</button>
    </form>{result && <div className="detail-groups"><section><h2>沟通场景</h2><p>{result.communicationScenario}</p></section><section><h2>五行互动</h2>{result.elementDynamics.map(item => <p key={item.element}><b>{item.element} {item.first}:{item.second}</b>　{item.observation}</p>)}</section><section><h2>双向十神</h2>{result.tenGodDynamics.map(item => <p key={item.direction}><b>{item.direction} · {item.theme}</b>　{item.basis}；{item.observation}</p>)}</section><section><h2>合冲刑害观察</h2>{result.combinationsAndClashes.map((item, index) => <p key={index}><b>{item.symbols.join("·")} · {item.relation}</b>　{item.observation}</p>)}</section><section><h2>行动规则</h2>{result.actionRules.map(item => <p key={item}>{item}</p>)}{result.limitations.map(item => <small key={item}>{item}</small>)}</section></div>}</section>;
}
