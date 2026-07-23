import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import {
  buildDaoStoryNotes,
  buildLifeScrollNarrative,
  type LifeScrollNarrative,
} from "../../lib/yi/life-scroll";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type {
  BirthInput,
  InterpretationItem,
  PillarKey,
} from "../../lib/yi/types";

const exactBirth: BirthInput = {
  name: "林岚",
  date: "1990-06-15",
  time: "09:30",
  location: "北京市",
  gender: "female",
  timeConfidence: "exact",
};

const BEAT_IDS = [
  "situation",
  "desire",
  "opening",
  "cost",
  "low-point",
  "choice",
  "turn",
  "mature-method",
] as const;

function fixture(birth: BirthInput = exactBirth) {
  const chart = calculateFourPillars(birth);
  const report = buildProfessionalReport(chart, birth);
  const items = buildInterpretations(chart);
  return { chart, report, items };
}

function countHan(text: string): number {
  return [...text].filter(character => /\p{Script=Han}/u.test(character)).length;
}

function visibleParts(narrative: LifeScrollNarrative): string[] {
  return [
    narrative.oneLineTheme,
    ...narrative.openingScene,
    ...narrative.careerArc,
    ...narrative.relationshipArc,
    ...narrative.turningPointArc,
    ...narrative.matureArc,
    narrative.closingLine,
    narrative.actionNow,
    narrative.animalInterlude.name,
    narrative.animalInterlude.introduction,
    narrative.animalInterlude.matchingScene,
    narrative.animalInterlude.difference,
    narrative.animalInterlude.takeaway,
    narrative.historicalInterlude.name,
    narrative.historicalInterlude.introduction,
    narrative.historicalInterlude.matchingScene,
    narrative.historicalInterlude.difference,
    narrative.historicalInterlude.takeaway,
    ...narrative.daoNotes.flatMap(note => [
      note.excerpt,
      note.plainCommentary.traditionalMeaning,
      note.plainCommentary.storyConnection,
      note.plainCommentary.sceneGuidance,
    ]),
  ];
}

function assertCompleteNarrative(narrative: LifeScrollNarrative): void {
  expect(countHan(narrative.oneLineTheme)).toBeGreaterThanOrEqual(18);
  expect(countHan(narrative.oneLineTheme)).toBeLessThanOrEqual(36);
  for (const arc of [
    narrative.openingScene,
    narrative.careerArc,
    narrative.relationshipArc,
    narrative.turningPointArc,
    narrative.matureArc,
  ]) {
    expect(arc.length).toBeGreaterThanOrEqual(2);
    expect(arc.length).toBeLessThanOrEqual(4);
    expect(arc.every(paragraph => countHan(paragraph) >= 45)).toBe(true);
  }
  expect(narrative.closingLine.trim()).not.toBe("");
  expect(narrative.actionNow.trim()).not.toBe("");
  const visibleHan = countHan(visibleParts(narrative).join(""));
  expect(visibleHan).toBeGreaterThanOrEqual(1600);
  expect(visibleHan).toBeLessThanOrEqual(2600);
  expect(narrative.daoNotes.length).toBeGreaterThanOrEqual(2);
  expect(narrative.daoNotes.length).toBeLessThanOrEqual(4);
}

describe("deterministic life scroll", () => {
  it("builds eight distinct internal beats and five complete public arcs", () => {
    const { chart, report, items } = fixture();
    const before = JSON.stringify({ chart, report, items });
    const narrative = buildLifeScrollNarrative(chart, report, items);
    const repeat = buildLifeScrollNarrative(chart, report, items);

    assertCompleteNarrative(narrative);
    expect(narrative.internalStoryBeats.map(beat => beat.id))
      .toEqual(BEAT_IDS);
    expect(new Set(narrative.internalStoryBeats.map(beat =>
      beat.text.normalize("NFC").replace(/\s+/g, ""))).size).toBe(8);
    expect(repeat).toEqual(narrative);
    expect(JSON.stringify({ chart, report, items })).toBe(before);
    expect(Object.isFrozen(narrative)).toBe(true);
    expect(Object.isFrozen(narrative.internalStoryBeats)).toBe(true);
    expect(Object.isFrozen(narrative.daoNotes)).toBe(true);
  });

  it("keeps every Dao note complete, distinct, and inside the reviewed length gates", () => {
    const { chart, report, items } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, items);

    expect(new Set(narrative.daoNotes.map(note => note.internalSourceId)).size)
      .toBe(narrative.daoNotes.length);
    for (const note of narrative.daoNotes) {
      const { traditionalMeaning, storyConnection, sceneGuidance } =
        note.plainCommentary;
      expect(countHan(traditionalMeaning)).toBeGreaterThanOrEqual(45);
      expect(countHan(traditionalMeaning)).toBeLessThanOrEqual(90);
      expect(countHan(storyConnection)).toBeGreaterThanOrEqual(55);
      expect(countHan(storyConnection)).toBeLessThanOrEqual(110);
      expect(countHan(sceneGuidance)).toBeGreaterThanOrEqual(45);
      expect(countHan(sceneGuidance)).toBeLessThanOrEqual(90);
      expect(countHan(
        `${traditionalMeaning}${storyConnection}${sceneGuidance}`,
      )).toBeGreaterThanOrEqual(160);
      expect(countHan(
        `${traditionalMeaning}${storyConnection}${sceneGuidance}`,
      )).toBeLessThanOrEqual(260);
      expect(new Set([
        traditionalMeaning,
        storyConnection,
        sceneGuidance,
      ]).size).toBe(3);
      expect(storyConnection).not.toContain("证明");
    }
  });

  it("replaces the chapter-66 null commentary with reviewed stable fallbacks", () => {
    const result = buildDaoStoryNotes(["leadership"], {
      tension: "一项共同任务需要有人先放低位置听清不同意见",
      turn: "把指令改成提问并让参与者补充事实",
      scene: "团队讨论分工",
      action: "先请每个人说明能承担与不能承担的部分",
    });

    expect(result.daoNotes.map(note => note.internalSourceId))
      .not.toContain("dao-66-lower");
    expect(result.daoNotes.map(note => note.internalSourceId)).toEqual(
      expect.arrayContaining(["dao-33-self", "dao-64-road"]),
    );
    expect(result.uncertaintyFlags)
      .toContain("dao-note-fallback:dao-66-lower");
  });

  it("uses one natural unknown-time sentence and omits every hour-dependent item", () => {
    const unknownBirth = {
      ...exactBirth,
      time: null,
      timeConfidence: "unknown" as const,
    };
    const { chart, report, items } = fixture(unknownBirth);
    const narrative = buildLifeScrollNarrative(chart, report, items);
    const visible = visibleParts(narrative).join("");
    const naturalSentence = "出生时间没有确认，与一天具体时段有关的内容暂时留白。";

    assertCompleteNarrative(narrative);
    expect(visible.split(naturalSentence)).toHaveLength(2);
    expect(visible).not.toContain("时柱");
    expect(narrative.uncertaintyFlags).toContain("unknown-hour");
    for (const item of items.filter(item =>
      item.pillarDependencies.includes("hour"))) {
      expect(narrative.internalEvidenceIds).not.toContain(item.id);
    }
  });

  it.each([
    ["all", []],
    ["career", ["career"]],
    ["relationship", ["relationship"]],
    ["rhythm", ["rhythm"]],
  ] as const)("degrades completely when %s material is missing", (_, removed) => {
    const { chart, report, items } = fixture();
    const selected = removed.length === 0
      ? []
      : items.filter(item => !removed.includes(item.domain as never));
    const narrative = buildLifeScrollNarrative(chart, report, selected);

    assertCompleteNarrative(narrative);
    const expectedMissing = removed.length === 0
      ? ["career", "relationship", "rhythm"]
      : removed;
    for (const domain of expectedMissing) {
      expect(narrative.uncertaintyFlags)
        .toContain(`missing-domain:${domain}`);
    }
  });

  it("does not leak poisoned boundary representatives or excluded interpretations", () => {
    const boundaryBirth = {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown" as const,
      gender: "unspecified" as const,
    };
    const original = fixture(boundaryBirth);
    const chart = structuredClone(original.chart);
    const report = structuredClone(original.report);
    const items = structuredClone(original.items);
    const sentinel = "候选信息不应出现";
    const ambiguous = new Set<PillarKey>(chart.ambiguousPillars);

    expect([...ambiguous]).toEqual(
      expect.arrayContaining(["year", "month", "hour"]),
    );
    for (const key of ambiguous) {
      const pillar = chart.pillars[key];
      if (pillar) {
        pillar.stem = sentinel;
        pillar.branch = sentinel;
        pillar.label = sentinel;
      }
    }
    if (chart.professional.ambiguousFields.includes("structureBalance")) {
      chart.professional.structureBalance = sentinel as never;
      chart.professional.supportScore = Number.NaN;
    }
    if (chart.professional.ambiguousFields.includes("relationSummary")) {
      chart.professional.relations = [{
        type: "branch-clash",
        pillars: ["year", "month"],
        symbols: [sentinel, sentinel],
        label: sentinel,
      }];
    }
    report.currentLesson = sentinel;
    if (report.monthCommand.ambiguous) {
      report.monthCommand.representative = {
        branch: sentinel,
        hiddenStem: sentinel,
        tenGod: sentinel as never,
      };
    }
    report.relations.push({
      type: "branch-clash",
      pillars: ["year", "month"],
      symbols: [sentinel, sentinel],
      label: sentinel,
    });
    const poisoned = items.map((item): InterpretationItem =>
      item.pillarDependencies.some(key => ambiguous.has(key))
        ? {
            ...item,
            scenario: sentinel,
            advantageVersion: sentinel,
            shadowVersion: sentinel,
            actionNow: sentinel,
            actionLongTerm: sentinel,
          }
        : item);

    const narrative = buildLifeScrollNarrative(chart, report, poisoned);

    assertCompleteNarrative(narrative);
    expect(JSON.stringify(narrative)).not.toContain(sentinel);
    expect(visibleParts(narrative).join("")).not.toContain(sentinel);
    expect(narrative.uncertaintyFlags).toEqual(
      expect.arrayContaining([
        "unknown-hour",
        "candidate-pillar-excluded",
        "candidate-professional-field-excluded",
      ]),
    );
  });

  it("keeps public prose free of chart terms, evidence labels, and event promises", () => {
    const { chart, report, items } = fixture();
    const visible = visibleParts(
      buildLifeScrollNarrative(chart, report, items),
    ).join("");

    expect(visible).not.toMatch(
      /四柱|日主|十神|月令|旺衰|藏干|纳音|十二长生|干支关系/,
    );
    expect(visible).not.toMatch(
      /专业依据|本章来源|可靠级|证据等级|计算规则|规则 ID|数据来源清单/,
    );
    expect(visible).not.toMatch(
      /你(?:已经|曾经|注定|必然|一定会).{0,16}(?:成功|离职|结婚|离婚|患病|发财)/,
    );
  });
});
