import { describe, expect, it } from "vitest";
import {
  buildChartElementVisibility,
  buildChartNarrative,
  DETAIL_ACTION_ID_ALLOWLIST,
  listDetailActionIds,
  type ChartNarrative,
  type CareerScene,
  type DetailActionId,
  type RelationshipScene,
  type RhythmScene,
} from "../../lib/yi/chart-narrative";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { INTERPRETATION_IDS } from "../../lib/yi/interpretation-enrichment";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { selectStableStoryFacts } from "../../lib/yi/stable-story-facts";
import { stemElements } from "../../lib/yi/stems-branches";
import type {
  BirthInput,
  ElementName,
  InterpretationItem,
  PillarKey,
} from "../../lib/yi/types";

const exactBirth: BirthInput = {
  name: "测试人林岚",
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

const BEAT_FIELDS = [
  "situation",
  "opportunity",
  "firstStrength",
  "overuseCost",
  "lowPoint",
  "newChoice",
  "turn",
  "observableSignal",
] as const;

const MICRO_FIELDS = [
  "title",
  "trigger",
  "firstReaction",
  "apparentBenefit",
  "cost",
  "turnAction",
  "example",
  "observableSignal",
] as const;

const EXPECTED_ACTION_FRAMES: Readonly<Record<DetailActionId, string>> = {
  "self-day-master:actionNow": "写下结论、依据和反证",
  "self-day-master:actionLongTerm": "建立决策记录并双周复盘",
  "self-support:actionNow": "区分亲自、协作和暂停",
  "self-support:actionLongTerm": "建立支持台账并在过载时减量",
  "self-interface:actionNow": "写清偏好、规则目的和替代方案",
  "self-interface:actionLongTerm": "按底线、学习和协商条件复盘",
  "talent-public:actionNow": "保留一项结论、三项依据和一项请求",
  "talent-public:actionLongTerm": "比较六次汇报的现场反馈",
  "talent-hidden:actionNow": "把熟练步骤写成可试用清单",
  "talent-hidden:actionLongTerm": "沉淀三项可交接模板",
  "talent-output:actionNow": "写一页摘要并附材料索引",
  "talent-output:actionLongTerm": "按使用者反馈更新交付模板",
  "career-role:actionNow": "确认目标、责任、权限和验收人",
  "career-role:actionLongTerm": "在十五、三十、六十天复盘职责",
  "career-pressure:actionNow": "标出关键路径、确认点和风险",
  "career-pressure:actionLongTerm": "用三个项目复盘延期与返工",
  "career-environment:actionNow": "按自主、协作、反馈和恢复比较环境",
  "career-environment:actionLongTerm": "用八周日志形成择业条件",
  "wealth-structure:actionNow": "把资金分为支出、储备和试验",
  "wealth-structure:actionLongTerm": "月初预算、月中校准、月末复盘",
  "wealth-risk:actionNow": "限定可承受试验和退出条件",
  "wealth-risk:actionLongTerm": "记录五次机会决定再考虑追加",
  "wealth-boundary:actionNow": "书面确认金额、用途和归还日期",
  "wealth-boundary:actionLongTerm": "区分赠与、借款和共同承担",
  "relationship-day-branch:actionNow": "用四句话说明事实、感受、需要和请求",
  "relationship-day-branch:actionLongTerm": "每周进行二十分钟关系对话",
  "relationship-trigger:actionNow": "记录触发、身体信号、解释和需要",
  "relationship-trigger:actionLongTerm": "为高频循环约定暂停和重谈",
  "relationship-repair:actionNow": "冲突后轮流复述并确认一个动作",
  "relationship-repair:actionLongTerm": "建立暂停、道歉和改变的修复约定",
  "family-year:actionNow": "区分保留、轮换和停止的家庭角色",
  "family-year:actionLongTerm": "记录家庭任务的发起、执行和收尾",
  "family-resource:actionNow": "明确支持范围、时间和结束条件",
  "family-resource:actionLongTerm": "建立可接受也可拒绝的支持清单",
  "family-boundary:actionNow": "说明可协助范围、不能承担和归还时间",
  "family-boundary:actionLongTerm": "用六周逐步归还代办责任",
  "rhythm-climate:actionNow": "连续七天记录睡眠、专注和活动",
  "rhythm-climate:actionLongTerm": "用十二周建立季节节奏图",
  "rhythm-recovery:actionNow": "两周记录睡眠、专注和情绪波动",
  "rhythm-recovery:actionLongTerm": "设置当天、三日和一周恢复层级",
  "rhythm-decision:actionNow": "区分必须知道、可以后补和无法消除",
  "rhythm-decision:actionLongTerm": "记录十次决定并形成停止收集规则",
};

function fixture(birth: BirthInput = exactBirth) {
  const chart = calculateFourPillars(birth);
  const report = buildProfessionalReport(chart, birth);
  const items = buildInterpretations(chart);
  return { chart, report, items };
}

function countHan(text: string): number {
  return [...text].filter(character => /\p{Script=Han}/u.test(character)).length;
}

function beatText(beat: ChartNarrative["self"]): string {
  return BEAT_FIELDS.map(field => beat[field]).join("");
}

function microText(
  story:
    | ChartNarrative["careerAdvice"][number]
    | ChartNarrative["relationshipAdvice"][number]
    | ChartNarrative["rhythmAdvice"][number],
): string {
  return MICRO_FIELDS.map(field => story[field]).join("");
}

function publicNarrativeText(narrative: ChartNarrative): string {
  return [
    ...narrative.professionalTranslations.flatMap(translation => [
      translation.whatItMeans,
      translation.lifeScene,
      translation.practicalGuidance,
    ]),
    ...[narrative.self, narrative.career, narrative.relationship, narrative.rhythm]
      .map(beatText),
    ...narrative.careerAdvice.map(microText),
    ...narrative.relationshipAdvice.map(microText),
    ...narrative.rhythmAdvice.map(microText),
  ].join("");
}

function attachedActionIds(narrative: ChartNarrative): DetailActionId[] {
  return [
    narrative.self,
    narrative.career,
    narrative.relationship,
    narrative.rhythm,
    ...narrative.careerAdvice,
    ...narrative.relationshipAdvice,
    ...narrative.rhythmAdvice,
  ].flatMap(entry => [...entry.sourceActionIds]);
}

function assertDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) assertDeepFrozen(child, seen);
}

function assertCompleteNarrative(narrative: ChartNarrative): void {
  expect(narrative.professionalTranslations.map(item => item.sectionId)).toEqual([
    "overview",
    "month-strength",
    "element-flow",
    "relations",
    "missing-elements",
  ]);
  for (const translation of narrative.professionalTranslations) {
    expect(countHan(translation.whatItMeans), translation.sectionId)
      .toBeGreaterThanOrEqual(45);
    expect(countHan(translation.whatItMeans), translation.sectionId)
      .toBeLessThanOrEqual(90);
    expect(countHan(translation.lifeScene), translation.sectionId)
      .toBeGreaterThanOrEqual(55);
    expect(countHan(translation.lifeScene), translation.sectionId)
      .toBeLessThanOrEqual(110);
    expect(countHan(translation.practicalGuidance), translation.sectionId)
      .toBeGreaterThanOrEqual(45);
    expect(countHan(translation.practicalGuidance), translation.sectionId)
      .toBeLessThanOrEqual(90);
    expect(countHan(
      `${translation.whatItMeans}${translation.lifeScene}${translation.practicalGuidance}`,
    ), translation.sectionId).toBeGreaterThanOrEqual(160);
    expect(countHan(
      `${translation.whatItMeans}${translation.lifeScene}${translation.practicalGuidance}`,
    ), translation.sectionId).toBeLessThanOrEqual(260);
    expect(translation.lifeScene).toMatch(/你|一个人|当事人/u);
    expect(translation.lifeScene).toMatch(/先|把|写|说|问|做|记录|选择|暂停|交付/u);
    expect(translation.lifeScene).toMatch(/于是|因此|结果|否则|便|从而|让/u);
    expect(translation.practicalGuidance)
      .toMatch(/本周|一次|两周|七天|二十分钟|三项|一项/u);
  }

  const beats = [
    narrative.self,
    narrative.career,
    narrative.relationship,
    narrative.rhythm,
  ];
  for (const beat of beats) {
    for (const field of BEAT_FIELDS) {
      expect(beat[field].trim(), field).not.toBe("");
    }
  }
  expect(countHan(beats.map(beatText).join(""))).toBeGreaterThanOrEqual(1200);
  expect(countHan(beats.map(beatText).join(""))).toBeLessThanOrEqual(2000);
  expect(new Set(beats.map(beat => beat.observableSignal)).size).toBe(4);

  expect(narrative.careerAdvice).toHaveLength(2);
  expect(narrative.relationshipAdvice).toHaveLength(2);
  expect(narrative.rhythmAdvice).toHaveLength(2);
  for (const story of [
    ...narrative.careerAdvice,
    ...narrative.relationshipAdvice,
    ...narrative.rhythmAdvice,
  ]) {
    for (const field of MICRO_FIELDS) {
      expect(story[field].trim(), `${story.id}:${field}`).not.toBe("");
    }
  }
  expect(countHan(narrative.careerAdvice.map(microText).join("")))
    .toBeGreaterThanOrEqual(500);
  expect(countHan(narrative.careerAdvice.map(microText).join("")))
    .toBeLessThanOrEqual(850);
  expect(countHan(narrative.relationshipAdvice.map(microText).join("")))
    .toBeGreaterThanOrEqual(500);
  expect(countHan(narrative.relationshipAdvice.map(microText).join("")))
    .toBeLessThanOrEqual(850);
  expect(countHan(narrative.rhythmAdvice.map(microText).join("")))
    .toBeGreaterThanOrEqual(420);
  expect(countHan(narrative.rhythmAdvice.map(microText).join("")))
    .toBeLessThanOrEqual(700);
}

describe("deterministic chart narrative", () => {
  it("builds the complete bounded reading without leaking professional or source language", () => {
    const { chart, report, items } = fixture();
    const before = JSON.stringify({ chart, report, items });
    const narrative = buildChartNarrative(chart, report, items);
    const repeat = buildChartNarrative(chart, report, [...items].reverse());

    assertCompleteNarrative(narrative);
    expect(repeat).toEqual(narrative);
    expect(JSON.stringify({ chart, report, items })).toBe(before);
    assertDeepFrozen(narrative);

    const publicText = publicNarrativeText(narrative);
    expect(publicText).not.toMatch(
      /四柱|日主|月令|十神|旺衰|藏干|纳音|十二长生|干支关系|命理|命盘|透干|根气/u,
    );
    expect(publicText).not.toMatch(
      /专业依据|本章来源|本章依据与使用边界|可靠级|证据等级|计算规则|规则 ID|数据来源清单|工作文本/u,
    );
    expect(publicText).not.toMatch(
      /你(?:已经|曾经|注定|必然|一定会).{0,18}(?:成功|离职|结婚|离婚|患病|发财|破财|灾祸)/u,
    );
  });

  it("changes the story meaning when the stable chart and scenes change", () => {
    const primary = fixture();
    const alternate = fixture(alternateBirth);
    const primaryNarrative = buildChartNarrative(
      primary.chart,
      primary.report,
      primary.items,
    );
    const alternateNarrative = buildChartNarrative(
      alternate.chart,
      alternate.report,
      alternate.items,
    );

    expect(publicNarrativeText(alternateNarrative))
      .not.toBe(publicNarrativeText(primaryNarrative));
    expect(alternateNarrative.self.situation)
      .not.toBe(primaryNarrative.self.situation);
    expect(alternateNarrative.careerAdvice[0].example)
      .not.toBe(primaryNarrative.careerAdvice[0].example);
  });

  it("covers every legacy detail action exactly once in canonical order", () => {
    const { chart, report, items } = fixture();
    const narrative = buildChartNarrative(chart, report, items);
    const attached = attachedActionIds(narrative);

    expect(Object.isFrozen(DETAIL_ACTION_ID_ALLOWLIST)).toBe(true);
    expect(DETAIL_ACTION_ID_ALLOWLIST).toHaveLength(INTERPRETATION_IDS.length * 2);
    expect(listDetailActionIds([...items].reverse()))
      .toEqual(DETAIL_ACTION_ID_ALLOWLIST);
    expect(attached).toHaveLength(new Set(attached).size);
    expect([...attached].sort()).toEqual([...DETAIL_ACTION_ID_ALLOWLIST].sort());
    expect(narrative.coveredDetailActionIds).toEqual(attached);
    for (const entry of [
      narrative.self,
      narrative.career,
      narrative.relationship,
      narrative.rhythm,
      ...narrative.careerAdvice,
      ...narrative.relationshipAdvice,
      ...narrative.rhythmAdvice,
    ]) {
      expect(entry.sourceActionIds.length, JSON.stringify(entry)).toBeGreaterThan(0);
    }
  });

  it("consumes every migrated action as a concise visible semantic frame in its owning story", () => {
    const { chart, report, items } = fixture();
    const narrative = buildChartNarrative(chart, report, items);
    const entries = [
      narrative.self,
      narrative.career,
      narrative.relationship,
      narrative.rhythm,
      ...narrative.careerAdvice,
      ...narrative.relationshipAdvice,
      ...narrative.rhythmAdvice,
    ];
    const frames = new Map(
      narrative.internalActionFrames.map(item => [item.id, item.frame]),
    );

    expect([...frames.keys()]).toEqual(DETAIL_ACTION_ID_ALLOWLIST);
    for (const id of DETAIL_ACTION_ID_ALLOWLIST) {
      expect(frames.get(id), id).toBe(EXPECTED_ACTION_FRAMES[id]);
      const owner = entries.find(entry => entry.sourceActionIds.includes(id));
      expect(owner, id).toBeDefined();
      const visible = owner && "title" in owner
        ? microText(owner)
        : beatText(owner as ChartNarrative["self"]);
      expect(visible, id).toContain(EXPECTED_ACTION_FRAMES[id]);
    }
    expect(publicNarrativeText(narrative)).not.toContain("actionNow");
    expect(publicNarrativeText(narrative)).not.toContain("actionLongTerm");
  });

  it("makes each plain translation respond to its matching stable fact family", () => {
    const exact = fixture();
    const exactNarrative = buildChartNarrative(
      exact.chart,
      exact.report,
      exact.items,
    );
    const boundaryBirth: BirthInput = {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown",
      gender: "unspecified",
    };
    const boundary = fixture(boundaryBirth);
    const boundaryNarrative = buildChartNarrative(
      boundary.chart,
      boundary.report,
      boundary.items,
    );
    const exactById = new Map(
      exactNarrative.professionalTranslations
        .map(item => [item.sectionId, item]),
    );
    const boundaryById = new Map(
      boundaryNarrative.professionalTranslations
        .map(item => [item.sectionId, item]),
    );

    for (const id of [
      "month-strength",
      "element-flow",
      "relations",
      "missing-elements",
    ] as const) {
      expect(boundaryById.get(id), id).not.toEqual(exactById.get(id));
    }
  });

  it("covers every required career, relationship and rhythm scene exactly once", () => {
    const { chart, report, items } = fixture();
    const narrative = buildChartNarrative(chart, report, items);
    const career = narrative.careerAdvice.flatMap(story => story.covers);
    const relationship = narrative.relationshipAdvice.flatMap(story => story.covers);
    const rhythm = narrative.rhythmAdvice.flatMap(story => story.covers);

    expect(new Set(career)).toEqual(new Set<CareerScene>([
      "task-entry",
      "collaboration-conflict",
      "opportunity-choice",
      "long-accumulation",
    ]));
    expect(career).toHaveLength(new Set(career).size);
    expect(new Set(relationship)).toEqual(new Set<RelationshipScene>([
      "approach",
      "misunderstanding",
      "argument",
      "repair",
      "boundary",
    ]));
    expect(relationship).toHaveLength(new Set(relationship).size);
    expect(new Set(rhythm)).toEqual(new Set<RhythmScene>([
      "productive-window",
      "overload-signal",
      "pause",
      "restart",
      "decision-window",
    ]));
    expect(rhythm).toHaveLength(new Set(rhythm).size);
  });

  it("uses only the stable action subset when the hour is unknown", () => {
    const unknownBirth: BirthInput = {
      ...exactBirth,
      time: null,
      timeConfidence: "unknown",
    };
    const { chart, report, items } = fixture(unknownBirth);
    const stable = selectStableStoryFacts(chart, report, items);
    const narrative = buildChartNarrative(chart, report, items);
    const attached = attachedActionIds(narrative);
    const expected = stable.interpretations.flatMap(item => [
      `${item.id}:actionNow`,
      `${item.id}:actionLongTerm`,
    ] as DetailActionId[]);
    const hourDependent = items
      .filter(item => item.pillarDependencies.includes("hour"))
      .flatMap(item => [
        `${item.id}:actionNow`,
        `${item.id}:actionLongTerm`,
      ] as DetailActionId[]);
    const naturalSentence = "出生时间没有确认，与具体时段有关的内容暂时留白。";

    assertCompleteNarrative(narrative);
    expect(new Set(attached)).toEqual(new Set(expected));
    expect(attached).toHaveLength(new Set(attached).size);
    expect(narrative.coveredDetailActionIds).toEqual(attached);
    expect(publicNarrativeText(narrative).split(naturalSentence)).toHaveLength(2);
    expect(narrative.uncertaintyFlags).toContain("unknown-hour");
    expect(attached).not.toEqual(DETAIL_ACTION_ID_ALLOWLIST);
    for (const id of hourDependent) expect(attached).not.toContain(id);
  });

  it("degrades to a complete conditional reading when no detail material is available", () => {
    const { chart, report } = fixture();
    const narrative = buildChartNarrative(chart, report, []);

    assertCompleteNarrative(narrative);
    expect(attachedActionIds(narrative)).toEqual([]);
    expect(narrative.coveredDetailActionIds).toEqual([]);
    expect(narrative.uncertaintyFlags).toContain("missing-material");
    expect(publicNarrativeText(narrative)).toContain("稳定材料不足");
    expect(publicNarrativeText(narrative)).not.toMatch(/你就是|你天生|你必然/u);
  });

  it("does not leak boundary representatives, excluded interpretation copy or action ids", () => {
    const boundaryBirth: BirthInput = {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown",
      gender: "unspecified",
    };
    const original = fixture(boundaryBirth);
    const chart = structuredClone(original.chart);
    const report = structuredClone(original.report);
    const items = structuredClone(original.items);
    const sentinel = "候选信息不应出现";
    const ambiguous = new Set<PillarKey>(chart.ambiguousPillars);

    expect([...ambiguous]).toEqual(expect.arrayContaining(["year", "month", "hour"]));
    for (const key of ambiguous) {
      const pillar = chart.pillars[key];
      if (pillar) {
        pillar.stem = sentinel;
        pillar.branch = sentinel;
        pillar.label = sentinel;
      }
    }
    if (report.monthCommand.ambiguous) {
      report.monthCommand.representative = {
        branch: sentinel,
        hiddenStem: sentinel,
        tenGod: sentinel as never,
      };
    }
    report.summary = sentinel;
    report.keyJudgments = [sentinel];
    report.actions = [sentinel];
    report.lifeTheme = sentinel;
    report.currentLesson = sentinel;
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

    const stable = selectStableStoryFacts(chart, report, poisoned);
    const narrative = buildChartNarrative(chart, report, poisoned);
    const attached = attachedActionIds(narrative);

    assertCompleteNarrative(narrative);
    expect(JSON.stringify(narrative)).not.toContain(sentinel);
    expect(publicNarrativeText(narrative)).not.toContain(sentinel);
    for (const id of stable.excludedInterpretationIds) {
      expect(attached).not.toContain(`${id}:actionNow` as DetailActionId);
      expect(attached).not.toContain(`${id}:actionLongTerm` as DetailActionId);
    }
    expect(narrative.uncertaintyFlags).toEqual(expect.arrayContaining([
      "unknown-hour",
      "candidate-pillar-excluded",
      "candidate-professional-field-excluded",
    ]));
  });
});

describe("stable chart element visibility", () => {
  const elementOrder: ElementName[] = ["木", "火", "土", "金", "水"];

  function expectedVisibility(
    report: ReturnType<typeof buildProfessionalReport>,
    excluded: ReadonlySet<PillarKey>,
  ) {
    const facts = report.pillarFacts.filter(pillar => !excluded.has(pillar.key));
    const visible = new Set<ElementName>(facts.flatMap(pillar => [
      pillar.stemElement,
      pillar.branchElement,
    ]));
    const hidden = new Set<ElementName>(facts.flatMap(pillar =>
      pillar.hiddenStems.map(item => stemElements[item.stem])));
    return {
      visibleElements: elementOrder.filter(element => visible.has(element)),
      hiddenOnlyElements: elementOrder.filter(element =>
        hidden.has(element) && !visible.has(element)),
      absentInStablePillars: elementOrder.filter(element =>
        !visible.has(element) && !hidden.has(element)),
    };
  }

  it("separates visible, hidden-only and absent elements from stable pillars", () => {
    const { chart, report } = fixture();
    const result = buildChartElementVisibility(chart, report);

    expect(result).toMatchObject(expectedVisibility(report, new Set()));
    expect(result.hourUnknown).toBe(false);
  });

  it("excludes ambiguous pillars and keeps an unknown hour explicit", () => {
    const boundaryBirth: BirthInput = {
      ...exactBirth,
      date: "2024-02-04",
      time: null,
      timeConfidence: "unknown",
      gender: "unspecified",
    };
    const { chart, report } = fixture(boundaryBirth);
    const result = buildChartElementVisibility(chart, report);

    expect(result).toMatchObject(
      expectedVisibility(report, new Set(chart.ambiguousPillars)),
    );
    expect(result.hourUnknown).toBe(true);
    expect([
      ...result.visibleElements,
      ...result.hiddenOnlyElements,
      ...result.absentInStablePillars,
    ]).toHaveLength(5);
  });

  it("treats a professionally ambiguous day axis as a candidate pillar", () => {
    const original = fixture();
    const chart = structuredClone(original.chart);
    chart.professional.ambiguousFields = ["dayMaster"];
    const report = buildProfessionalReport(chart, exactBirth);
    const result = buildChartElementVisibility(chart, report);

    expect(result).toMatchObject(
      expectedVisibility(report, new Set<PillarKey>(["day"])),
    );
  });
});
