"use client";

import { calculateCompatibility, type RelationshipType } from "../../lib/yi/compatibility";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import type { FourPillarsResult } from "../../lib/yi/types";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";

const labels: Record<RelationshipType, string> = { partner: "伴侣", "parent-child": "亲子", business: "商业伙伴", friend: "朋友" };

export function CompatibilitySection({ chart, relationship, secondBirth, onRelationshipChange, onSecondBirthChange }: { chart: FourPillarsResult; relationship: RelationshipType; secondBirth: BirthSubmission | null; onRelationshipChange: (value: RelationshipType) => void; onSecondBirthChange: (value: BirthSubmission) => void }) {
  const result = secondBirth ? calculateCompatibility(chart, calculateFourPillars(secondBirth), relationship) : null;
  return <section className="report-section">
    <header><small>关系合盘</small><h1>不打分，拆开看互动</h1><p>第二份完整出生录入会随报告保留，支持阳历、农历、精确时刻、十二时辰或未知时辰。</p></header>
    <label className="relationship-kind">关系类型<select value={relationship} onChange={event => onRelationshipChange(event.target.value as RelationshipType)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <BirthIntake onSubmit={onSecondBirthChange} />
    {result && <div className="compatibility-manual">
      <header className="compatibility-summary"><small>两个人的关系主旋律</small><p>{result.summary}</p></header>
      <div className="compatibility-axes">
        {result.axes.map(axis => <article className="compatibility-axis-card" key={axis.id}>
          <span>{axis.label}</span>
          <p>{axis.plainLanguage}</p>
          <blockquote>{axis.scene}</blockquote>
          <b>可以这样做</b><p>{axis.action}</p>
          <details className="compatibility-axis-evidence"><summary>专业依据与边界</summary><p>{axis.professionalBasis}</p><small>{axis.caution}</small></details>
        </article>)}
      </div>
      <section className="role-guidance"><h2>{labels[relationship]}关系说明书</h2>{result.roleSpecificGuidance.map(item => <p key={item}>{item}</p>)}</section>
      <details className="compatibility-evidence">
        <summary>查看双向十神、五行和干支关系</summary>
        <div className="detail-groups compatibility-evidence-content">
          <section><h2>沟通场景</h2><p>{result.communicationScenario}</p></section>
          <section><h2>五行互动</h2>{result.elementDynamics.map(item => <p key={item.element}><b>{item.element} {item.first}:{item.second}</b>　{item.observation}</p>)}</section>
          <section><h2>双向十神</h2>{result.tenGodDynamics.map(item => <p key={item.direction}><b>{item.direction} · {item.theme}</b>　{item.basis}；{item.observation}</p>)}</section>
          <section><h2>合、冲、刑、害观察</h2>{result.combinationsAndClashes.map((item, index) => <p key={`${item.symbols.join("")}-${item.relation}-${index}`}><b>{item.symbols.join("·")} · {item.relation}</b>　{item.observation}</p>)}</section>
          <section><h2>行动规则</h2>{result.actionRules.map(item => <p key={item}>{item}</p>)}{result.limitations.map(item => <small key={item}>{item}</small>)}</section>
        </div>
      </details>
    </div>}
  </section>;
}
