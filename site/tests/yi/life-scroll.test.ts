import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import {
  buildDaoStoryNotes,
  buildLifeScrollNarrative,
  type LifeScrollNarrative,
} from "../../lib/yi/life-scroll";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { selectStableStoryFacts } from "../../lib/yi/stable-story-facts";
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

const alternateBirth: BirthInput = {
  name: "顾临川",
  date: "1992-11-03",
  time: "18:20",
  location: "北京市",
  gender: "male",
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

function assertDaoNoteBounds(
  note: LifeScrollNarrative["daoNotes"][number],
): void {
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

function mainArcParts(narrative: LifeScrollNarrative): string[] {
  return [
    ...narrative.openingScene,
    ...narrative.careerArc,
    ...narrative.relationshipArc,
    ...narrative.turningPointArc,
    ...narrative.matureArc,
  ];
}

function normalizedSentences(values: readonly string[]): string[] {
  return values
    .join("")
    .split(/[。！？]/u)
    .map(value => value.normalize("NFC").replace(/\s+/g, ""))
    .filter(Boolean);
}

function assertCompleteNarrative(narrative: LifeScrollNarrative): void {
  expect(countHan(narrative.oneLineTheme)).toBeGreaterThanOrEqual(18);
  expect(countHan(narrative.oneLineTheme)).toBeLessThanOrEqual(36);
  for (const [name, arc] of [
    ["opening", narrative.openingScene],
    ["career", narrative.careerArc],
    ["relationship", narrative.relationshipArc],
    ["turning", narrative.turningPointArc],
    ["mature", narrative.matureArc],
  ] as const) {
    expect(arc.length).toBeGreaterThanOrEqual(2);
    expect(arc.length).toBeLessThanOrEqual(4);
    for (const paragraph of arc) {
      expect(countHan(paragraph), `${name}: ${paragraph}`)
        .toBeGreaterThanOrEqual(45);
    }
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

  it("selects core material deterministically and carries one causal thread", () => {
    const { chart, report, items } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, items);
    const reversed = buildLifeScrollNarrative(
      chart,
      report,
      [...items].reverse(),
    );
    const beats = Object.fromEntries(
      narrative.internalStoryBeats.map(beat => [beat.id, beat]),
    );

    expect(reversed).toEqual(narrative);
    expect(narrative.internalEvidenceIds).toEqual(
      expect.arrayContaining([
        "career-role",
        "relationship-day-branch",
        "rhythm-climate",
      ]),
    );
    expect(beats.opening.internalEvidenceId)
      .toBe(beats.cost.internalEvidenceId);
    expect(beats["low-point"].internalEvidenceId)
      .toBe(beats.choice.internalEvidenceId);
    expect(beats.turn.internalEvidenceId)
      .toBe(beats["mature-method"].internalEvidenceId);

    expect(beats.situation.text).toMatch(/处境|眼前|站在/u);
    expect(beats.desire.text).toMatch(/想守住|真正想要|希望/u);
    expect(beats.opening.text).toMatch(/为此|于是|打开入口/u);
    expect(beats.cost.text).toMatch(/同一种优势|过度|可是/u);
    expect(beats["low-point"].text).toMatch(/低点|于是|最终/u);
    expect(beats.choice.text).toMatch(/改变|转折|决定/u);
    expect(beats.turn.text).toMatch(/随后|开始出现|可见变化/u);
    expect(beats["mature-method"].text).toMatch(/此后|成熟|长期/u);

    const mainText = mainArcParts(narrative).join("");
    for (const storyBeat of narrative.internalStoryBeats) {
      expect(mainText.split(storyBeat.text)).toHaveLength(2);
    }
    const beatHan = countHan(
      narrative.internalStoryBeats.map(beat => beat.text).join(""),
    );
    expect(beatHan / countHan(mainText)).toBeGreaterThan(0.55);
  });

  it("responds substantively to two different stable charts", () => {
    const primary = fixture(exactBirth);
    const alternate = fixture(alternateBirth);
    const primaryFacts = selectStableStoryFacts(
      primary.chart,
      primary.report,
      primary.items,
    );
    const alternateFacts = selectStableStoryFacts(
      alternate.chart,
      alternate.report,
      alternate.items,
    );
    const primaryNarrative = buildLifeScrollNarrative(
      primary.chart,
      primary.report,
      primary.items,
    );
    const alternateNarrative = buildLifeScrollNarrative(
      alternate.chart,
      alternate.report,
      alternate.items,
    );

    expect({
      dayMasterElement: primaryFacts.dayMasterElement,
      structureBalance: primaryFacts.structureBalance,
      relationTypes: primaryFacts.relations.map(relation => relation.type),
      currentLesson: primaryFacts.currentLesson,
    }).not.toEqual({
      dayMasterElement: alternateFacts.dayMasterElement,
      structureBalance: alternateFacts.structureBalance,
      relationTypes: alternateFacts.relations.map(relation => relation.type),
      currentLesson: alternateFacts.currentLesson,
    });
    expect(primaryNarrative.oneLineTheme)
      .not.toBe(alternateNarrative.oneLineTheme);
    for (const key of [
      "openingScene",
      "careerArc",
      "relationshipArc",
      "turningPointArc",
      "matureArc",
    ] as const) {
      expect(primaryNarrative[key].join(""))
        .not.toBe(alternateNarrative[key].join(""));
    }
  });

  it("keeps every Dao note complete, distinct, and inside the reviewed length gates", () => {
    const { chart, report, items } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, items);

    expect(new Set(narrative.daoNotes.map(note => note.internalSourceId)).size)
      .toBe(narrative.daoNotes.length);
    for (const note of narrative.daoNotes) {
      const { traditionalMeaning, storyConnection, sceneGuidance } =
        note.plainCommentary;
      assertDaoNoteBounds(note);
      expect(new Set([
        traditionalMeaning,
        storyConnection,
        sceneGuidance,
      ]).size).toBe(3);
      expect(storyConnection).not.toContain("证明");
      expect(
        `${traditionalMeaning}${storyConnection}${sceneGuidance}`,
      ).toContain("不是命盘证据");
    }
    expect(new Set(narrative.daoNotes.map(note =>
      note.plainCommentary.storyConnection)).size)
      .toBe(narrative.daoNotes.length);
    expect(new Set(narrative.daoNotes.map(note =>
      note.plainCommentary.sceneGuidance)).size)
      .toBe(narrative.daoNotes.length);
    expect(narrative.daoNotes.find(note =>
      note.internalSourceId === "dao-33-self"
    )?.plainCommentary.storyConnection).toMatch(/自知|看清自己/u);
    expect(narrative.daoNotes.find(note =>
      note.internalSourceId === "dao-64-road"
    )?.plainCommentary.storyConnection).toMatch(/起步|第一步|接续/u);
  });

  it("keeps Dao bounds for accepted long context fragments", () => {
    const result = buildDaoStoryNotes(
      ["self-knowledge", "long-road"],
      {
        tension:
          "团队反复补充任务却没有重新确认容量边界和停止条件",
        turn:
          "把所有新增请求放回共同目标并重新确认能够承担的范围",
        scene:
          "多人项目进入最后冲刺但责任期限和验收方式仍未对齐",
        action:
          "先请每位参与者说明事实需要边界以及下一步能够承担什么",
      },
    );

    expect(result.daoNotes).toHaveLength(2);
    for (const note of result.daoNotes) {
      assertDaoNoteBounds(note);
    }
  });

  it.each([
    ["service", "dao-08-water"],
    ["patience", "dao-15-clear"],
    ["bend", "dao-22-whole"],
    ["self-knowledge", "dao-33-self"],
    ["reversal", "dao-40-return"],
    ["small-steps", "dao-63-small"],
    ["long-road", "dao-64-road"],
    ["flexibility", "dao-76-soft"],
    ["completion", "dao-81-no-strife"],
  ] as const)("uses natural Dao scene grammar for %s", (theme, sourceId) => {
    const result = buildDaoStoryNotes([theme], {
      tension: "共同任务的责任与容量没有重新确认",
      turn: "完成一项可以核对的小改变",
      scene: "时间表与立场发生正面对撞",
      action: "先分列双方事实与不能让渡的条件",
    });
    const note = result.daoNotes.find(item =>
      item.internalSourceId === sourceId
    );

    expect(note).toBeDefined();
    expect(note?.plainCommentary.storyConnection).toMatch(
      /^故事走到.+时，场景是：.+。人物/u,
    );
    expect(note?.plainCommentary.storyConnection).not.toMatch(
      /在(?:事业开门|关系修复|转折发生|全卷收束)的.+里/u,
    );
    expect(note?.plainCommentary.sceneGuidance).not.toMatch(
      /完成(?:写清|先)|先先/u,
    );
    if (note) assertDaoNoteBounds(note);
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
    const expectedMissing: Array<"career" | "relationship" | "rhythm"> =
      removed.length === 0
      ? ["career", "relationship", "rhythm"]
      : [...removed];
    const domainCopy = {
      career:
        "事业这一段没有足够稳定材料，因此只给通用观察，不当成个人结论。",
      relationship:
        "关系这一段没有足够稳定材料，因此只给通用观察，不当成个人结论。",
      rhythm:
        "节奏这一段没有足够稳定材料，因此只给通用观察，不当成个人结论。",
    };
    const domainArc = {
      career: narrative.careerArc,
      relationship: narrative.relationshipArc,
      rhythm: narrative.matureArc,
    };
    for (const domain of expectedMissing) {
      expect(narrative.uncertaintyFlags)
        .toContain(`missing-domain:${domain}`);
      expect(domainArc[domain].join("")).toContain(domainCopy[domain]);
    }
    if (removed.length === 0) {
      expect(narrative.oneLineTheme).toContain("稳定材料不足");
      expect(mainArcParts(narrative).join(""))
        .not.toMatch(/你就是|你天生|你必然/u);
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

  it("uses neutral relation prose when relationSummary alone is ambiguous", () => {
    const original = fixture();
    const chart = structuredClone(original.chart);
    const report = structuredClone(original.report);
    const sentinel = "候选关系摘要不得进入人生长卷";
    chart.ambiguousPillars = [];
    chart.professional.ambiguousFields = ["relationSummary"];
    chart.professional.relations = [{
      type: "branch-clash",
      pillars: ["year", "month"],
      symbols: [sentinel, sentinel],
      label: sentinel,
    }];
    report.relations = [{
      type: "branch-clash",
      pillars: ["year", "month"],
      symbols: [sentinel, sentinel],
      label: sentinel,
    }];

    const narrative = buildLifeScrollNarrative(
      chart,
      report,
      original.items,
    );
    const visible = visibleParts(narrative).join("");

    assertCompleteNarrative(narrative);
    expect(JSON.stringify(narrative)).not.toContain(sentinel);
    expect(visible).not.toContain(sentinel);
    expect(narrative.relationshipArc.join(""))
      .toContain("关系材料不足时");
    expect(narrative.relationshipArc.join(""))
      .not.toContain("正面对撞");
    expect(narrative.uncertaintyFlags)
      .toContain("candidate-professional-field-excluded");
  });

  it("keeps public prose free of chart terms, evidence labels, and event promises", () => {
    const { chart, report, items } = fixture();
    const visible = visibleParts(
      buildLifeScrollNarrative(chart, report, items),
    ).join("");

    expect(visible).not.toMatch(
      /四柱|日主|十神|月令|旺衰|藏干|纳音|十二长生|干支关系|命理/,
    );
    expect(visible).not.toMatch(
      /专业依据|本章来源|可靠级|证据等级|计算规则|规则 ID|数据来源清单/,
    );
    expect(visible).not.toMatch(
      /你(?:已经|曾经|注定|必然|一定会).{0,16}(?:成功|离职|结婚|离婚|患病|发财)/,
    );
  });

  it("uses complete, non-repetitive public sentences without clipped fragments", () => {
    const { chart, report, items } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, items);
    const sentences = [
      ...mainArcParts(narrative),
      narrative.closingLine,
      narrative.actionNow,
      narrative.animalInterlude.introduction,
      narrative.animalInterlude.matchingScene,
      narrative.animalInterlude.difference,
      narrative.animalInterlude.takeaway,
      narrative.historicalInterlude.introduction,
      narrative.historicalInterlude.matchingScene,
      narrative.historicalInterlude.difference,
      narrative.historicalInterlude.takeaway,
      ...narrative.daoNotes.flatMap(note => [
        note.plainCommentary.traditionalMeaning,
        note.plainCommentary.storyConnection,
        note.plainCommentary.sceneGuidance,
      ]),
    ];

    for (const sentence of sentences) {
      expect(sentence.trim()).toMatch(/[。！？]$/u);
      expect(sentence).not.toMatch(
        /而；|和，再|你里|环境变化，找(?:。|；)|若急于显示能力而|发生把|入口这卷|力量这卷|负重这卷/u,
      );
    }
    const normalized = normalizedSentences(mainArcParts(narrative));
    expect(new Set(normalized).size / normalized.length)
      .toBeGreaterThanOrEqual(0.9);
  });
});
