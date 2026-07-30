"use client";

import {
  buildCompatibilityPublicView,
  type CompatibilityPublicView,
  type RelationshipType,
} from "../../lib/yi/compatibility";
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
  return copy
    .replaceAll("A→B", `${participants.first}→${participants.second}`)
    .replaceAll("B→A", `${participants.second}→${participants.first}`)
    .replaceAll("A对B", `${participants.first}对${participants.second}`)
    .replaceAll("B对A", `${participants.second}对${participants.first}`)
    .replace(/(A|B)(?=侧|(?:年|月|日|时)(?:柱|干|支)?|先|再|注意|从|会|该|的|待核|[：:]|长期|完整|用)/g, marker => marker === "A" ? participants.first : participants.second);
}

export function CompatibilityPublicReading({
  view,
  participants,
}: {
  view: CompatibilityPublicView;
  participants: CompatibilityParticipants;
}) {
  const format = (copy: string) =>
    formatCompatibilityCopy(copy, participants);
  const observations = [
    ["你们更像哪一种搭档", view.teamStyle],
    ["最容易产生好感的地方", view.attractionScene],
    ["最容易误会的场景", view.misunderstandingScene],
    ["一次争执可能怎样发生", view.conflictScene],
    ["怎样把话说回来", view.repairLine],
    ["下次可以一起试的小动作", view.smallAction],
  ] as const;

  return <div className="compatibility-public-reading">
    <header className="compatibility-summary">
      <blockquote className="folk-lead">
        {view.lead.attribution}：“{view.lead.saying}”
      </blockquote>
      <p>{format(view.playfulObservation)}</p>
    </header>
    <div className="compatibility-public-grid">
      {observations.map(([label, copy]) => <article key={label}>
        <h2>{label}</h2>
        <p>{format(copy)}</p>
      </article>)}
    </div>
  </div>;
}

export function CompatibilitySection({ chart, primaryName, relationship, primaryParentRole, secondBirth, onRelationshipChange, onSecondBirthChange, onParentChildPrimaryRoleChange }: { chart: FourPillarsResult; primaryName: string; relationship: RelationshipType; primaryParentRole: ParentChildPrimaryRole; secondBirth: BirthSubmission | null; onRelationshipChange: (value: RelationshipType) => void; onSecondBirthChange: (value: BirthSubmission) => void; onParentChildPrimaryRoleChange: (value: ParentChildPrimaryRole) => void }) {
  const participants = getCompatibilityParticipants(primaryName, secondBirth?.name ?? "", relationship, primaryParentRole);
  const publicView = secondBirth
    ? buildCompatibilityPublicView(
        chart,
        calculateFourPillars(secondBirth),
        relationship,
        primaryParentRole,
      )
    : null;
  return <section className="report-section">
    <header><small>关系合盘</small><h1>不打分，拆开看互动</h1><p>第二份出生资料只在本次报告浏览期间保留；刷新或离开后需重新填写。支持阳历、农历、精确时刻、十二时辰或未知时辰。</p></header>
    <section className="relationship-choice-panel" role="group" aria-label="选择关系类型">
      {Object.entries(labels).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={relationship === value}
          className={relationship === value ? "active" : ""}
          onClick={() => onRelationshipChange(value as RelationshipType)}
        >
          <span>{label}</span>
          <small>{value === "partner" ? "看亲密与磨合" : value === "parent-child" ? "看照顾与成长" : value === "business" ? "看合作与边界" : "看相处与支持"}</small>
        </button>
      ))}
    </section>
    {relationship === "parent-child" && <section className="parent-child-role" role="group" aria-label="报告主人亲子角色"><button type="button" aria-pressed={primaryParentRole === "caregiver"} className={primaryParentRole === "caregiver" ? "active" : ""} onClick={() => onParentChildPrimaryRoleChange("caregiver")}>我是照顾者</button><button type="button" aria-pressed={primaryParentRole === "child"} className={primaryParentRole === "child" ? "active" : ""} onClick={() => onParentChildPrimaryRoleChange("child")}>我是孩子</button></section>}
    <BirthIntake heading="录入对方出生坐标" onSubmit={onSecondBirthChange} />
    {publicView && <aside className="compatibility-participants" aria-label="合盘参与者"><span>报告主人：{participants.first}</span><span>对方：{participants.second}</span></aside>}
    {publicView && <CompatibilityPublicReading
      view={publicView}
      participants={participants}
    />}
  </section>;
}
