import { describe, expect, it } from "vitest";
import { findRepeatedSections, validateInterpretation } from "../../lib/yi/content-quality";
import type { InterpretationItem } from "../../lib/yi/types";

const item: InterpretationItem = {
  id: "self-day-master",
  domain: "self",
  professionalTitle: "日主作为自我观察起点",
  innovationTitle: "你在复杂局面里首先握住的方向",
  basis: "日主甲木，日支与月令共同形成已知结构证据。",
  traditionalJudgment: "以日干为我，参看月令、根气和全局生克。",
  plainLanguage: "你会先建立自己的方向，再决定哪些外部意见值得吸收。",
  scenario: "会议进入最后十分钟时，意见仍然分散，你往往先把问题重新排成顺序。",
  advantageVersion: "你能在混乱里快速形成可执行的第一步。",
  shadowVersion: "反馈不足时，独立判断也可能变成一个人硬扛。",
  mirror: "像一枚在风里仍能回正的罗盘。",
  action: "先写判断和反证，再做决定。",
  actionNow: "下一次决定前写下一个支持证据和一个反证。",
  actionLongTerm: "连续四周复盘判断与结果，训练主动校准。",
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
});
