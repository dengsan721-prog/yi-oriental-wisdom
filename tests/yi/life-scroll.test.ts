import { describe, expect, it } from "vitest";
import { REVIEWED_DAO_NOTES } from "../../lib/yi/dao-note-corpus";
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

const fiveElementBirths = [
  {
    element: "木",
    birth: {
      ...exactBirth,
      date: "1988-08-08",
      time: "18:30",
    },
    leads: [
      "先扶稳最有生长可能的一枝",
      "枝叶一多",
      "反对意见可能被听成拖后腿",
      "先修去猜测",
      "暂停长出新的枝杈",
      "不再把不断扩张当成唯一进步",
    ],
  },
  {
    element: "火",
    birth: {
      ...exactBirth,
      date: "2001-09-21",
      time: "14:10",
    },
    leads: [
      "先把最重要的问题照亮",
      "光太强时",
      "沉默可能被误读成冷淡",
      "把音量和速度降下来",
      "给身体和注意力降温",
      "热情不再靠持续燃烧证明",
    ],
  },
  {
    element: "土",
    birth: {
      ...exactBirth,
      date: "1995-05-17",
      time: "12:00",
    },
    leads: [
      "把散落的责任放到同一张桌上",
      "所有重量都落向你",
      "把疲惫和不满留在心里",
      "需要共同承担的部分逐项摆明",
      "卸下一项并非必须由自己完成的重量",
      "稳定不再靠一个人硬撑",
    ],
  },
  {
    element: "金",
    birth: {
      ...exactBirth,
      date: "1978-12-05",
      time: "06:20",
    },
    leads: [
      "从混乱中切出目标、权限和完成标准",
      "标准落得太快时",
      "双方会忙着证明谁更有道理",
      "底线与仍可商量的部分分开",
      "结束无须继续扩张的任务",
      "准确不只意味着敢于取舍",
    ],
  },
  {
    element: "水",
    birth: {
      ...exactBirth,
      date: "1992-11-03",
      time: null,
      timeConfidence: "unknown" as const,
    },
    leads: [
      "把分散信号接回一条主流",
      "入口太多时",
      "没有说清哪项承诺不会改变",
      "不变目标、可变方法和下次核对时间",
      "把精力收回一条河道",
      "灵活不再等于随时改道",
    ],
  },
] as const;

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
const REVIEWED_CHAPTERS = new Map(
  REVIEWED_DAO_NOTES.map(note => [note.id, note.chapter]),
);

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
  expect(Number.isInteger(note.chapter)).toBe(true);
  expect(note.chapter).toBe(REVIEWED_CHAPTERS.get(note.internalSourceId));
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

function repeatedHanFragments(
  values: readonly string[],
  fragmentLength = 16,
  minimumFieldCount = 3,
): string[] {
  const owners = new Map<string, Set<number>>();
  values.forEach((value, fieldIndex) => {
    const normalized = value
      .normalize("NFC")
      .replace(/[^\p{Script=Han}]/gu, "");
    const fieldFragments = new Set<string>();
    for (
      let index = 0;
      index <= normalized.length - fragmentLength;
      index += 1
    ) {
      fieldFragments.add(normalized.slice(index, index + fragmentLength));
    }
    for (const fragment of fieldFragments) {
      const fields = owners.get(fragment) ?? new Set<number>();
      fields.add(fieldIndex);
      owners.set(fragment, fields);
    }
  });
  return [...owners.entries()]
    .filter(([, fields]) => fields.size >= minimumFieldCount)
    .map(([fragment]) => fragment)
    .sort();
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
  const visible = visibleParts(narrative).join("");
  const visibleHan = countHan(visible);
  expect(visibleHan).toBeGreaterThanOrEqual(1600);
  expect(visibleHan).toBeLessThanOrEqual(2600);
  expect(visible).not.toMatch(/命盘|证据|工作文本/u);
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
    expect(beats.opening.text).toMatch(/事业的门一开|事业先从/u);
    expect(beats.cost.text).toMatch(/枝叶|光太强|重量|标准|入口|固定模式/u);
    expect(beats["low-point"].text).toMatch(/当|为了|可能|事实/u);
    expect(beats.choice.text).toMatch(/先|转折|请求/u);
    expect(beats.turn.text).toMatch(/暂停|降温|卸下|结束|收回|减少/u);
    expect(beats["mature-method"].text).toMatch(/后来|长期|未知/u);

    const mainText = mainArcParts(narrative).join("");
    for (const storyBeat of narrative.internalStoryBeats) {
      expect(mainText.split(storyBeat.text)).toHaveLength(2);
    }
    const beatHan = countHan(
      narrative.internalStoryBeats.map(beat => beat.text).join(""),
    );
    expect(beatHan / countHan(mainText)).toBeGreaterThan(0.55);
  });

  it("keeps the relationship low point conditional and bridges rhythm back to relation facts", () => {
    const { chart, report, items } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, items);
    const relationship = narrative.relationshipArc.join("");
    const turning = narrative.turningPointArc[0];

    expect(relationship).not.toMatch(/于是.*开始影响|低点出现在/u);
    expect(relationship).toMatch(/当|为了|你可能/u);
    expect(turning).not.toContain("。可见转折是");
    expect(turning).toContain(
      "稍稳后，再把关系条件带回对话",
    );
    expect(turning).toMatch(
      /(?:暂停|降温|卸下|结束|收回|减少).+稍稳后.+关系条件.+对话/u,
    );
  });

  it.each([
    exactBirth,
    alternateBirth,
    {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown" as const,
    },
  ])("keeps each relationship choice concrete and naturally phrased", (birth) => {
    const { chart, report, items } = fixture(birth);
    const relationship = buildLifeScrollNarrative(
      chart,
      report,
      items,
    ).relationshipArc.join("");

    expect(relationship).toMatch(
      /事实|理由|承诺|任务|底线/u,
    );
    expect(relationship).toMatch(
      /请求|复述|复查|确认|重谈|协商|归还/u,
    );
    expect(relationship).not.toContain(
      "依次说明事实、感受、需要与具体请求四句话表达",
    );
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
    const primaryIds = primaryNarrative.daoNotes.map(note =>
      note.internalSourceId
    );
    const alternateIds = alternateNarrative.daoNotes.map(note =>
      note.internalSourceId
    );

    assertCompleteNarrative(primaryNarrative);
    assertCompleteNarrative(alternateNarrative);
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
    expect(primaryIds).toEqual(expect.arrayContaining([
      "dao-63-small",
      "dao-33-self",
      "dao-81-no-strife",
    ]));
    expect(alternateIds).toEqual(expect.arrayContaining([
      "dao-81-no-strife",
    ]));
    expect(primaryIds).not.toEqual(alternateIds);
    for (const ids of [primaryIds, alternateIds]) {
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(ids.length).toBeLessThanOrEqual(4);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("gives every element its own complete career, relation, rhythm, and mature arc", () => {
    const arcOwners = {
      career: [] as string[],
      relationship: [] as string[],
      turning: [] as string[],
      mature: [] as string[],
    };
    const sentenceSets = fiveElementBirths.map(({ element, birth, leads }) => {
      const { chart, report, items } = fixture(birth);
      const narrative = buildLifeScrollNarrative(chart, report, items);
      const arcs = [
        ...narrative.careerArc,
        ...narrative.relationshipArc,
        narrative.turningPointArc[0],
        narrative.matureArc[0],
      ];
      const visible = arcs.join("");

      expect(chart.professional.dayMaster.element).toBe(element);
      for (const lead of leads) expect(visible).toContain(lead);
      expect(visible).not.toMatch(
        /先用同一份事业优势打开入口|同一种优势一旦被用过头|改变从停止原有循环开始|成熟方法不再依赖一次用力/u,
      );
      arcOwners.career.push(narrative.careerArc.join(""));
      arcOwners.relationship.push(narrative.relationshipArc.join(""));
      arcOwners.turning.push(narrative.turningPointArc.join(""));
      arcOwners.mature.push(narrative.matureArc.join(""));

      return new Set(
        normalizedSentences(arcs).filter(sentence => countHan(sentence) >= 16),
      );
    });
    const sharedByAllElements = [...sentenceSets[0]].filter(sentence =>
      sentenceSets.slice(1).every(sentences => sentences.has(sentence))
    );

    expect(sharedByAllElements).toEqual([]);
    for (const [arc, values] of Object.entries(arcOwners)) {
      expect(
        repeatedHanFragments(values, 24, fiveElementBirths.length),
        arc,
      ).toEqual([]);
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
      expect(traditionalMeaning).toContain("王弼");
      expect(traditionalMeaning).toMatch(/只帮助|只解释|只保留/u);
      expect(traditionalMeaning).toMatch(
        /不预告|不替任何一方判定|仍要由后续行动|不把故事写成确定结局/u,
      );
      expect(traditionalMeaning).not.toMatch(/命盘|证据|工作文本/u);
    }
    expect(new Set(narrative.daoNotes.map(note =>
      note.plainCommentary.traditionalMeaning.split("；").at(-1)
    )).size).toBe(narrative.daoNotes.length);
    expect(new Set(narrative.daoNotes.map(note =>
      note.plainCommentary.storyConnection)).size)
      .toBe(narrative.daoNotes.length);
    expect(new Set(narrative.daoNotes.map(note =>
      note.plainCommentary.sceneGuidance)).size)
      .toBe(narrative.daoNotes.length);
    expect(narrative.daoNotes.find(note =>
      note.internalSourceId === "dao-33-self"
    )?.plainCommentary.storyConnection).toMatch(/自知|看清自己/u);
  });

  it("connects each Dao placement to a different story scene, tension, turn, and action", () => {
    const { chart, report, items } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, items);
    const byPlacement = Object.fromEntries(
      narrative.daoNotes.map(note => [note.placement, note]),
    ) as Record<
      LifeScrollNarrative["daoNotes"][number]["placement"],
      LifeScrollNarrative["daoNotes"][number]
    >;
    const scenes = [
      byPlacement.career.plainCommentary.storyConnection.match(
        /^事业这扇门打开时，(.+?)成为/u,
      )?.[1],
      byPlacement.relationship.plainCommentary.storyConnection.match(
        /^关系走到需要修补的地方，(.+?)已经/u,
      )?.[1],
      byPlacement["turning-point"].plainCommentary.storyConnection.match(
        /^转折来到眼前时，(.+?)让/u,
      )?.[1],
      byPlacement.closing.plainCommentary.storyConnection.match(
        /^全卷收束到(.+?)，下一步/u,
      )?.[1],
    ];
    const tensions = narrative.daoNotes.map(note =>
      note.plainCommentary.storyConnection.match(/“([^”]+)”/u)?.[1]
    );
    const turns = narrative.daoNotes.map(note =>
      note.plainCommentary.storyConnection.match(
        /人物(.+?)(?:后|之后|使长期方向)/u,
      )?.[1]
    );
    const actions = narrative.daoNotes.map(note =>
      note.plainCommentary.sceneGuidance.match(/人物先(.+?)，/u)?.[1]
    );

    for (const [label, contexts] of [
      ["scenes", scenes],
      ["tensions", tensions],
      ["turns", turns],
      ["actions", actions],
    ] as const) {
      expect(contexts.every(Boolean)).toBe(true);
      expect(
        new Set(contexts).size,
        `${label}: ${JSON.stringify(contexts)}`,
      ).toBe(narrative.daoNotes.length);
    }
    for (const note of narrative.daoNotes) {
      expect(
        `${note.plainCommentary.storyConnection}${note.plainCommentary.sceneGuidance}`,
      ).not.toMatch(
        /时成为|时后|人物先并|被“[^”]*(?:里|时)”|提醒观察让|变短时让|之后后/u,
      );
    }
  });

  it("reserves the completion chapter for the closing placement", () => {
    for (const { birth } of fiveElementBirths) {
      const { chart, report, items } = fixture(birth);
      const narrative = buildLifeScrollNarrative(chart, report, items);
      const closing = narrative.daoNotes.find(note =>
        note.placement === "closing"
      );

      expect(closing?.internalSourceId).toBe("dao-81-no-strife");
    }
  });

  it("keeps the central lesson and Dao scenes contextual across the whole scroll", () => {
    const boundaryBirth: BirthInput = {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown",
      gender: "unspecified",
    };
    for (const birth of [exactBirth, alternateBirth, boundaryBirth]) {
      const { chart, report, items } = fixture(birth);
      const narrative = buildLifeScrollNarrative(chart, report, items);

      expect(
        repeatedHanFragments(visibleParts(narrative)),
        `${birth.date}/${birth.time ?? "unknown"}`,
      ).toEqual([]);
    }
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
    for (const [turn, action] of [
      [
        "完成一项可以核对的小改变",
        "先分列双方事实与不能让渡的条件",
      ],
      ["开始核对新事实", "写清事实和边界"],
    ] as const) {
      const result = buildDaoStoryNotes([theme], {
        tension: "共同任务的责任与容量没有重新确认",
        turn,
        scene: "时间表与立场发生正面对撞",
        action,
      });
      const note = result.daoNotes.find(item =>
        item.internalSourceId === sourceId
      );

      expect(note).toBeDefined();
      expect(note?.plainCommentary.storyConnection).toMatch(
        /^事业这扇门打开时，.+成为必须先处理的现场。人物/u,
      );
      expect(note?.plainCommentary.storyConnection).not.toMatch(
        /在(?:事业开门|关系修复|转折发生|全卷收束)的.+里/u,
      );
      expect(note?.plainCommentary.storyConnection).not.toMatch(
        /开始(?:完成|开始)|采取开始|愿意完成|选择完成/u,
      );
      expect(note?.plainCommentary.sceneGuidance).not.toMatch(
        /完成(?:写清|先)|先先/u,
      );
      if (note) assertDaoNoteBounds(note);
    }
  });

  it("rejects malformed Dao slot fragments before composing public sentences", () => {
    const result = buildDaoStoryNotes(["small-steps", "self-knowledge"], {
      scene: "人物接手新角色时成为团队焦点",
      tension: "人物先并核对权限",
      turn: "完成新的角色分配时后",
      action: "再把熟悉关系里",
    });
    const publicCopy = result.daoNotes.map(note =>
      `${note.plainCommentary.storyConnection}${note.plainCommentary.sceneGuidance}`
    ).join("");

    expect(publicCopy).not.toMatch(
      /时(?:成为|已经|让|后)|人物先(?:并|再)|被“[^”]{1,16}(?:里|时)”|提醒观察(?:成为|已经|让)|[，。]当[^，。]{2,18}已经/u,
    );
    expect(publicCopy).toContain("需要核对目标的任务");
    expect(publicCopy).toContain("需要重谈请求的关系");
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
      const daoCopy = narrative.daoNotes.flatMap(note => [
        note.plainCommentary.storyConnection,
        note.plainCommentary.sceneGuidance,
      ]).join("");
      expect(narrative.oneLineTheme).toContain("稳定材料不足");
      expect(mainArcParts(narrative).join(""))
        .not.toMatch(/你就是|你天生|你必然/u);
      expect(narrative.daoNotes.map(note => note.internalSourceId)).toEqual([
        "dao-63-small",
        "dao-33-self",
        "dao-15-clear",
        "dao-81-no-strife",
      ]);
      expect(daoCopy).toContain("只观察一项事业小试验");
      expect(daoCopy).toContain("只观察一次关系对话");
      expect(daoCopy).toContain("只观察一周负荷变化");
      expect(daoCopy).toContain("只回看已经核对的部分");
      expect(daoCopy).not.toMatch(
        /输出速度不断上升|时间表与立场正面对撞|暂停即时结论/u,
      );
    }
  });

  it("keeps the empty-material opening conditional", () => {
    const { chart, report } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, []);
    const opening = narrative.openingScene.join("");

    assertCompleteNarrative(narrative);
    expect(opening).toContain("材料尚未稳定时");
    expect(opening).not.toContain("眼前同时有几项责任需要处理");
  });

  it("keeps every empty-material Dao scene conditional", () => {
    const { chart, report } = fixture();
    const narrative = buildLifeScrollNarrative(chart, report, []);
    const daoCopy = narrative.daoNotes.flatMap(note => [
      note.excerpt,
      note.plainCommentary.traditionalMeaning,
      note.plainCommentary.storyConnection,
      note.plainCommentary.sceneGuidance,
    ]).join("");

    assertCompleteNarrative(narrative);
    expect(daoCopy).not.toContain("急于获得确定感的冲动");
    expect(daoCopy).not.toMatch(
      /人物(?:一度|原本|被|完成工作后)|仍被“[^”]+”拉回/u,
    );
    const chapterSemantics = {
      "dao-15-clear": /暂停|等待/u,
      "dao-33-self": /事实与解释|看清自己/u,
      "dao-63-small": /细处|小步/u,
      "dao-81-no-strife": /功劳|受益/u,
    };
    for (const note of narrative.daoNotes) {
      expect(note.plainCommentary.storyConnection).toMatch(
        /若|如果|只有当/u,
      );
      expect(note.plainCommentary.sceneGuidance).toMatch(/若|如果/u);
      expect(
        `${note.plainCommentary.storyConnection}${note.plainCommentary.sceneGuidance}`,
      ).toMatch(chapterSemantics[
        note.internalSourceId as keyof typeof chapterSemantics
      ]);
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
    expect(narrative.turningPointArc[0]).not.toMatch(
      /新的回应真正发生|被相关的人共同确认/u,
    );
    expect(narrative.turningPointArc[0]).toMatch(
      /只有当.+(?:观察|核对).+确认.+才/u,
    );
    expect(narrative.uncertaintyFlags)
      .toContain("candidate-professional-field-excluded");
  });

  it("keeps public prose free of chart terms, evidence labels, and event promises", () => {
    const { chart, report, items } = fixture();
    const visible = visibleParts(
      buildLifeScrollNarrative(chart, report, items),
    ).join("");

    expect(visible).not.toMatch(
      /四柱|日主|十神|月令|旺衰|藏干|纳音|十二长生|干支关系|命理|命盘/,
    );
    expect(visible).not.toMatch(
      /专业依据|本章来源|可靠级|证据|工作文本|计算规则|规则 ID|数据来源清单/,
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
