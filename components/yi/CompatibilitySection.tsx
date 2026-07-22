"use client";

import { calculateCompatibility, type RelationshipType } from "../../lib/yi/compatibility";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import type { FourPillarsResult } from "../../lib/yi/types";
import { BirthIntake, type BirthSubmission } from "./BirthIntake";

const labels: Record<RelationshipType, string> = { partner: "伴侣", "parent-child": "亲子", business: "商业伙伴", friend: "朋友" };

export type ParentChildPrimaryRole = "caregiver" | "child";
type CompatibilityParticipants = { first: string; second: string };

export function getCompatibilityParticipants(primaryName: string, secondName: string, relationship: RelationshipType, primaryParentRole: ParentChildPrimaryRole): CompatibilityParticipants {
  const first = primaryName.trim() || "报告主人";
  const second = secondName.trim() || "第二位";
  if (relationship !== "parent-child") return { first, second };
  return primaryParentRole === "caregiver"
    ? { first: `${first}（照顾者）`, second: `${second}（孩子）` }
    : { first: `${first}（孩子）`, second: `${second}（照顾者）` };
}

export function formatCompatibilityCopy(copy: string, participants: CompatibilityParticipants) {
  return copy.replace(/[AB]/g, marker => marker === "A" ? participants.first : participants.second);
}

export function CompatibilitySection({ chart, primaryName, relationship, primaryParentRole, secondBirth, onRelationshipChange, onSecondBirthChange, onParentChildPrimaryRoleChange }: { chart: FourPillarsResult; primaryName: string; relationship: RelationshipType; primaryParentRole: ParentChildPrimaryRole; secondBirth: BirthSubmission | null; onRelationshipChange: (value: RelationshipType) => void; onSecondBirthChange: (value: BirthSubmission) => void; onParentChildPrimaryRoleChange: (value: ParentChildPrimaryRole) => void }) {
  const participants = getCompatibilityParticipants(primaryName, secondBirth?.name ?? "", relationship, primaryParentRole);
  const format = (copy: string) => formatCompatibilityCopy(copy, participants);
  const result = secondBirth ? calculateCompatibility(chart, calculateFourPillars(secondBirth), relationship) : null;
  return <section className="report-section">
    <header><small>关系合盘</small><h1>不打分，拆开看互动</h1><p>第二份完整出生录入会随报告保留，支持阳历、农历、精确时刻、十二时辰或未知时辰。</p></header>
    <label className="relationship-kind">关系类型<select value={relationship} onChange={event => onRelationshipChange(event.target.value as RelationshipType)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {relationship === "parent-child" && <section className="parent-child-role" role="group" aria-label="报告主人亲子角色"><button type="button" aria-pressed={primaryParentRole === "caregiver"} className={primaryParentRole === "caregiver" ? "active" : ""} onClick={() => onParentChildPrimaryRoleChange("caregiver")}>报告主人是照顾者</button><button type="button" aria-pressed={primaryParentRole === "child"} className={primaryParentRole === "child" ? "active" : ""} onClick={() => onParentChildPrimaryRoleChange("child")}>报告主人是孩子</button></section>}
    <BirthIntake heading="录入对方出生坐标" onSubmit={onSecondBirthChange} />
    {result && <aside className="compatibility-participants" aria-label="合盘参与者"><span>A方：{participants.first}</span><span>B方：{participants.second}</span></aside>}
    {result && <div className="compatibility-manual">
      <header className="compatibility-summary"><small>两个人的关系主旋律</small><p>{format(result.summary)}</p></header>
      <div className="compatibility-axes">
        {result.axes.map(axis => <article className="compatibility-axis-card" key={axis.id}>
          <h2>{format(axis.label)}</h2>
          <p>{format(axis.plainLanguage)}</p>
          <blockquote>{format(axis.scene)}</blockquote>
          <b>可以这样做</b><p>{format(axis.action)}</p>
          <details className="compatibility-axis-evidence"><summary>专业依据与边界</summary><p>{format(axis.professionalBasis)}</p><small>{format(axis.caution)}</small></details>
        </article>)}
      </div>
      <section className="role-guidance"><h2>{labels[relationship]}关系说明书</h2>{result.roleSpecificGuidance.map(item => <p key={item}>{format(item)}</p>)}</section>
      <details className="compatibility-evidence">
        <summary>查看双向十神、五行和干支关系</summary>
        <div className="detail-groups compatibility-evidence-content">
          <section><h2>沟通场景</h2><p>{format(result.communicationScenario)}</p></section>
          <section><h2>五行互动</h2>{result.elementDynamics.map(item => <p key={item.element}><b>{item.element} {participants.first}：{item.first}；{participants.second}：{item.second}</b>　{format(item.observation)}</p>)}</section>
          <section><h2>双向十神</h2>{result.tenGodDynamics.map(item => <p key={item.direction}><b>{format(item.direction)} · {item.theme}</b>　{format(item.basis)}；{format(item.observation)}</p>)}</section>
          <section><h2>合、冲、刑、害、破与三合观察</h2>{result.combinationsAndClashes.map((item, index) => <p key={`${item.symbols.join("")}-${item.relation}-${index}`}><b>{item.symbols.join("·")} · {item.relation}</b>　{format(item.observation)}{!item.observation.includes("坐标") && <small>坐标：{format(item.coordinates.join("；"))}</small>}</p>)}</section>
          <section><h2>行动规则</h2>{result.actionRules.map(item => <p key={item}>{format(item)}</p>)}{result.limitations.map(item => <small key={item}>{format(item)}</small>)}</section>
        </div>
      </details>
    </div>}
  </section>;
}
