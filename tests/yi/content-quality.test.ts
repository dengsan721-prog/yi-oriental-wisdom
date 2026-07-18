import { describe, expect, it } from "vitest";
import { findRepeatedSections, validateInterpretation } from "../../lib/yi/content-quality";
import type { InterpretationItem } from "../../lib/yi/types";

const item: InterpretationItem = {
  id: "self-day-master",
  domain: "self",
  professionalTitle: "日主作为自我观察起点",
  innovationTitle: "你在复杂局面里首先握住的方向",
  basis: "日主甲木，日支与月令共同形成已知结构证据。",
  traditionalJudgment: "以日干为我，参看月令、根气、透干和全局生克制化，所得结论仍须放回完整四柱结构共同核对，并说明适用边界。",
  plainLanguage: "你会先建立自己的方向，再决定哪些外部意见值得吸收。",
  scenario: "会议进入最后十分钟时，意见仍然分散，你往往先把问题重新排成顺序。",
  advantageVersion: "你能在混乱里快速形成可执行的第一步，同时主动邀请不同证据进入判断，让清晰主见保留现实校准空间。",
  shadowVersion: "反馈不足时，独立判断也可能变成一个人硬扛，并把初始假设当成事实，使协作者无法补充关键条件。",
  mirror: "像一枚在风里仍能回正的罗盘。",
  action: "先写判断和反证，再做决定。",
  actionNow: "下一次决定前写下两个支持证据、一个反证和明确调整条件，再邀请一位持不同意见者补充。",
  actionLongTerm: "连续四周记录当时判断、支持证据、反方意见、调整条件和实际结果，每周复盘一次偏差来源，逐步训练主动校准，并保留下一轮修正记录。",
  caution: "日主只是观察轴，不能代表完整人格或能力上限。",
  priority: "core",
  confidence: "high",
  sourceTradition: "子平法",
  sourceReferences: ["滴天髓"],
  sourceRuleIds: ["calendar.eight-char.v1"],
  pillarDependencies: ["day"],
  affectedByUnknownHour: false,
};

describe("content quality gate", () => {
  it("accepts a complete structured item", () => {
    expect(validateInterpretation(item)).toEqual([]);
  });

  it("rejects abstract product jargon and missing layers", () => {
    expect(validateInterpretation({ ...item, innovationTitle: "资源接口", scenario: "" }))
      .toEqual(expect.arrayContaining(["innovationTitle:禁用词:资源接口", "scenario:缺失"]));
  });

  it.each(["能量底座", "内外接口", "职场接口", "底层条件"])("rejects reviewer-identified product jargon: %s", word => {
    expect(validateInterpretation({ ...item, innovationTitle: word }))
      .toContain(`innovationTitle:禁用词:${word}`);
  });

  it("enforces a minimum depth for every enrichment field", () => {
    const errors = validateInterpretation({
      ...item,
      traditionalJudgment: "太短",
      advantageVersion: "太短",
      shadowVersion: "太短",
      actionNow: "太短",
      actionLongTerm: "太短",
    });

    expect(errors).toEqual(expect.arrayContaining([
      "traditionalJudgment:过短:2<50",
      "advantageVersion:过短:2<45",
      "shadowVersion:过短:2<45",
      "actionNow:过短:2<35",
      "actionLongTerm:过短:2<60",
    ]));
  });

  it("reports malformed runtime fields as missing instead of throwing", () => {
    const malformed = {
      ...item,
      traditionalJudgment: undefined,
      actionNow: undefined,
      sourceReferences: undefined,
      sourceRuleIds: undefined,
    } as unknown as InterpretationItem;

    expect(validateInterpretation(malformed)).toEqual(expect.arrayContaining([
      "traditionalJudgment:缺失",
      "actionNow:缺失",
      "sourceReferences:缺失",
      "sourceRuleIds:缺失",
    ]));
  });

  it("detects repeated scenario and action copy", () => {
    expect(findRepeatedSections([item, { ...item, id: "self-support" }]))
      .toEqual(expect.arrayContaining(["scenario:重复", "actionNow:重复", "actionLongTerm:重复"]));
  });

  it("detects enrichment templates that differ only by whitespace and bilingual punctuation", () => {
    const reformat = (value: string) => `  ${value
      .replaceAll("，", " ,  ")
      .replaceAll("。", " . ")
      .replaceAll("、", " / ")
      .replaceAll("；", " ; ")}  `;
    const reformatted = {
      ...item,
      id: "self-support",
      scenario: "这是另一段完全不同的现实场景，不应触发场景重复检查。",
      traditionalJudgment: reformat(item.traditionalJudgment),
      advantageVersion: reformat(item.advantageVersion),
      shadowVersion: reformat(item.shadowVersion),
      actionNow: reformat(item.actionNow),
      actionLongTerm: reformat(item.actionLongTerm),
    };

    expect(findRepeatedSections([item, reformatted])).toEqual(expect.arrayContaining([
      "traditionalJudgment:重复",
      "advantageVersion:重复",
      "shadowVersion:重复",
      "actionNow:重复",
      "actionLongTerm:重复",
    ]));
  });
});
