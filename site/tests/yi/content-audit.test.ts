import { afterEach, describe, expect, it, vi } from "vitest";
import {
  auditContentItems,
  auditProductContent,
  type AuditableContentItem,
} from "../../lib/yi/content-audit";
import type { CompatibilityResult } from "../../lib/yi/compatibility";
import type { MonthCommandFact } from "../../lib/yi/types";

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

afterEach(() => {
  vi.doUnmock("../../lib/yi/compatibility");
  vi.doUnmock("../../lib/yi/interpretation");
  vi.doUnmock("../../lib/yi/traditional-atlas");
  vi.resetModules();
});

describe("independent review regressions", () => {
  it("rejects a compatibility matrix that duplicates attraction and omits repair", async () => {
    vi.resetModules();
    vi.doMock("../../lib/yi/compatibility", async () => {
      const actual = await vi.importActual<typeof import("../../lib/yi/compatibility")>("../../lib/yi/compatibility");
      return {
        ...actual,
        calculateCompatibility: (...args: Parameters<typeof actual.calculateCompatibility>): CompatibilityResult => {
          const result = actual.calculateCompatibility(...args);
          return {
            ...result,
            axes: result.axes.map(axis => axis.id === "repair" ? { ...axis, id: "attraction" } : axis),
          };
        },
      };
    });

    const auditModule = await import("../../lib/yi/content-audit");
    const issues = auditModule.auditProductContent();

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "compatibility:partner:exact", itemId: "repair", rule: "missing", field: "id" }),
      expect.objectContaining({ module: "compatibility:partner:exact", itemId: "attraction", rule: "duplicate", field: "id" }),
    ]));
  });

  it("scans every displayed compatibility field plus interpretation and atlas titles", async () => {
    vi.resetModules();
    vi.doMock("../../lib/yi/compatibility", async () => {
      const actual = await vi.importActual<typeof import("../../lib/yi/compatibility")>("../../lib/yi/compatibility");
      return {
        ...actual,
        calculateCompatibility: (...args: Parameters<typeof actual.calculateCompatibility>): CompatibilityResult => {
          const result = actual.calculateCompatibility(...args);
          return {
            ...result,
            axes: result.axes.map((axis, index) => index === 0 ? { ...axis, label: "高维链接会被用户直接看见" } : axis),
            elementDynamics: result.elementDynamics.map((entry, index) => index === 0 ? { ...entry, observation: "五行证据混入高维链接" } : entry),
            tenGodDynamics: result.tenGodDynamics.length
              ? result.tenGodDynamics.map((entry, index) => index === 0 ? { ...entry, observation: "十神证据混入高维链接" } : entry)
              : [{ direction: "A→B", basis: "稳定日干证据", theme: "比肩", observation: "十神证据混入高维链接" }],
            combinationsAndClashes: result.combinationsAndClashes.length
              ? result.combinationsAndClashes.map((entry, index) => index === 0 ? { ...entry, observation: "干支证据混入高维链接" } : entry)
              : [{ symbols: ["甲", "己"], relation: "相合", observation: "干支证据混入高维链接" }],
          };
        },
      };
    });
    vi.doMock("../../lib/yi/interpretation", async () => {
      const actual = await vi.importActual<typeof import("../../lib/yi/interpretation")>("../../lib/yi/interpretation");
      return {
        ...actual,
        buildInterpretations: (...args: Parameters<typeof actual.buildInterpretations>) => actual.buildInterpretations(...args).map((item, index) => index === 0
          ? { ...item, professionalTitle: "专业高维链接标题", innovationTitle: "创新高维链接标题" }
          : item),
      };
    });
    vi.doMock("../../lib/yi/traditional-atlas", async () => {
      const actual = await vi.importActual<typeof import("../../lib/yi/traditional-atlas")>("../../lib/yi/traditional-atlas");
      return {
        ...actual,
        getAtlasGroups: (...args: Parameters<typeof actual.getAtlasGroups>) => actual.getAtlasGroups(...args).map((group, groupIndex) => ({
          ...group,
          options: group.options.map((option, optionIndex) => groupIndex === 0 && optionIndex === 0
            ? { ...option, title: "图谱高维链接标题" }
            : option),
        })),
      };
    });

    const auditModule = await import("../../lib/yi/content-audit");
    const issues = auditModule.auditProductContent();

    for (const field of [
      "label", "elementDynamics", "tenGodDynamics", "combinationsAndClashes",
      "professionalTitle", "innovationTitle", "title",
    ]) {
      expect(issues, field).toEqual(expect.arrayContaining([
        expect.objectContaining({ rule: "forbidden", field }),
      ]));
    }
  });

  it("detects deterministic unknown-hour variants without flagging an uncertainty boundary", () => {
    const issues = auditContentItems([
      { ...completeItem, itemId: "hour-display", unknownHour: true, fields: { summary: "时柱显示甲子，因此把它写成确定事实。" } },
      { ...completeItem, itemId: "hour-spaced", unknownHour: true, fields: { summary: "时柱 ： 甲子，被直接当成确定坐标。" } },
      { ...completeItem, itemId: "hour-stem", unknownHour: true, fields: { summary: "时干为甲，因此把它写成确定事实。" } },
      { ...completeItem, itemId: "hour-branch", unknownHour: true, fields: { summary: "时支显示子，因此把它写成确定事实。" } },
      { ...completeItem, itemId: "late-life", unknownHour: true, fields: { summary: "晚年事业确定走向稳定管理岗位。" } },
      { ...completeItem, itemId: "children", unknownHour: true, fields: { summary: "子女发展确定进入艺术创作方向。" } },
      { ...completeItem, itemId: "boundary", unknownHour: true, fields: { summary: "由于时辰未知，当前不讨论时柱、晚年或子女走向。" } },
      { ...completeItem, itemId: "boundary-negated", unknownHour: true, fields: { summary: "子女不会据此确定发展方向，只保留观察。" } },
    ]);

    for (const itemId of ["hour-display", "hour-spaced", "hour-stem", "hour-branch", "late-life", "children"]) {
      expect(issues, itemId).toEqual(expect.arrayContaining([
        expect.objectContaining({ itemId, rule: "certainty", field: "summary" }),
      ]));
    }
    for (const itemId of ["boundary", "boundary-negated"]) {
      expect(issues, itemId).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ itemId, rule: "certainty" }),
      ]));
    }
  });

  it("requires the product-owned astrology model for zodiac personality provenance", () => {
    const zodiacItem = {
      ...completeItem,
      itemId: "zodiac-profile",
      sourceIds: ["culture.nasa-constellations"],
      requiredSourceIds: ["model.western-astrology-element-modality"],
    } as AuditableContentItem & { requiredSourceIds: readonly string[] };

    expect(auditContentItems([zodiacItem])).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "zodiac-profile", rule: "missing-source", field: "sourceIds" }),
    ]));
  });

  it("narrows resolved month-command ten-god values while preserving ambiguous null", async () => {
    const reportCopyModule = await import("../../lib/yi/report-copy");
    const resolveTenGod = (reportCopyModule as typeof reportCopyModule & {
      monthCommandTenGod?: (monthCommand: MonthCommandFact) => string | null;
    }).monthCommandTenGod;
    const ambiguous: MonthCommandFact = {
      branch: "待核",
      hiddenStem: "待核",
      tenGod: "待核",
      ambiguous: true,
      representative: { branch: "寅", hiddenStem: "甲", tenGod: "比肩" },
    };
    const resolved: MonthCommandFact = {
      branch: "寅",
      hiddenStem: "甲",
      tenGod: "比肩",
      ambiguous: false,
    };

    expect(resolveTenGod).toBeTypeOf("function");
    expect(resolveTenGod?.(ambiguous)).toBeNull();
    expect(resolveTenGod?.(resolved)).toBe("比肩");
  });
});
