import { describe, expect, it } from "vitest";
import {
  auditContentItems,
  auditProductContent,
  type AuditableContentItem,
} from "../../lib/yi/content-audit";

it("passes the complete product content matrix", () => {
  expect(auditProductContent()).toEqual([]);
});

const completeItem: AuditableContentItem = {
  module: "test-module",
  itemId: "complete",
  fields: {
    summary: "这是一段足以通过最小内容长度检查的完整说明文字。",
  },
  sourceIds: ["domain.mapping.v2"],
  boundary: "这是一段明确说明适用范围与不确定性的边界文字。",
  scenario: "在团队讨论方案时，先核对事实和现实反馈，再决定下一步。",
  action: "今天记录一项可观察行为，并在两周后按真实结果复盘。",
};

describe("content audit rule guards", () => {
  it("reports missing and too-short required prose", () => {
    const issues = auditContentItems([{
      ...completeItem,
      fields: { missingField: "", shortField: "太短" },
    }]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: "missing", field: "missingField" }),
      expect.objectContaining({ rule: "too-short", field: "shortField" }),
    ]));
  });

  it("reports forbidden product jargon", () => {
    const issues = auditContentItems([{
      ...completeItem,
      fields: { summary: "这段生活化说明仍然混入资源接口这样的生涩产品黑话。" },
    }]);

    expect(issues).toContainEqual(expect.objectContaining({ rule: "forbidden", field: "summary" }));
  });

  it("reports duplicate scenarios and actions inside one module", () => {
    const duplicate = { ...completeItem, itemId: "duplicate" };
    const issues = auditContentItems([completeItem, duplicate]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "duplicate", rule: "duplicate", field: "scenario" }),
      expect.objectContaining({ itemId: "duplicate", rule: "duplicate", field: "action" }),
    ]));
  });

  it("reports missing or unresolved provenance and an absent boundary", () => {
    const issues = auditContentItems([
      { ...completeItem, itemId: "missing-source", sourceIds: [], boundary: "" },
      { ...completeItem, itemId: "unknown-source", sourceIds: ["not.registered"] },
    ]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "missing-source", rule: "missing-source", field: "sourceIds" }),
      expect.objectContaining({ itemId: "missing-source", rule: "missing", field: "boundary" }),
      expect.objectContaining({ itemId: "unknown-source", rule: "missing-source", field: "sourceIds" }),
    ]));
  });

  it("rejects certain hour-dependent conclusions when birth time is unknown", () => {
    const issues = auditContentItems([{
      ...completeItem,
      unknownHour: true,
      fields: { summary: "时柱为甲子，因此晚年会固定走向某种结果。" },
    }]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: "certainty", field: "summary" }),
    ]));
  });
});
