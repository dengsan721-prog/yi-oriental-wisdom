import { afterEach, describe, expect, it, vi } from "vitest";
import {
  auditContentItems,
  auditNameAnalysis,
  auditProductContent,
  nameAnalysisToAuditableItems,
  type AuditableContentItem,
} from "../../lib/yi/content-audit";
import type { CompatibilityResult } from "../../lib/yi/compatibility";
import { analyzeName } from "../../lib/yi/name-analysis";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
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

  it.each([
    "改名改命", "最吉", "必选", "补足五行", "康熙古法", "公安保证批准",
    "保证发财", "保证治愈", "保证婚姻", "保证生育", "保证避灾", "保证投资收益",
  ])("rejects the name-module prohibited claim %s", forbidden => {
    const issues = auditContentItems([{
      ...completeItem,
      itemId: forbidden,
      fields: { summary: `这段姓名说明错误地承诺${forbidden}，必须被审计拒绝。` },
    }]);

    expect(issues).toContainEqual(expect.objectContaining({ rule: "forbidden", field: "summary" }));
  });

  it("does not mistake an explicit no-guarantee boundary for a deterministic promise", () => {
    const issues = auditContentItems([{
      ...completeItem,
      itemId: "no-guarantee",
      fields: { summary: "本产品不保证投资收益，也不替代任何医疗、法律或财务判断。" },
    }]);

    expect(issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "no-guarantee", rule: "forbidden" }),
    ]));
  });

  it.each([
    ["fate", "一定能改变命运"],
    ["medical", "确保治疗高血压"],
    ["legal", "肯定获得有利判决"],
    ["financial", "保证盈利赚钱"],
    ["registration", "一定能成功登记姓名"],
    ["marriage", "一定能够改善婚姻"],
    ["fertility", "必会怀孕生子"],
    ["medical-and-marriage", "一定能够治愈疾病并改善婚姻"],
    ["financial-and-legal", "肯定带来投资收益和法律胜诉"],
    ["financial-and-marriage", "必会发财并且婚姻幸福"],
    ["promotional", "这项服务宣传改名改命"],
    ["legal-modal-after-predicate", "胜诉是肯定的"],
    ["financial-modal-inside-predicate", "投资收益一定可达百分之十"],
    ["registration-modal-inside-predicate", "姓名登记一定成功"],
    ["marriage-modal-inside-predicate", "婚姻肯定幸福"],
    ["fertility-modal-after-predicate", "怀孕是必然的"],
    ["fate-success-predicate", "确保扭转运势"],
    ["medical-success-predicate", "一定能把病治好"],
    ["legal-success-predicate", "必定让官司获胜"],
    ["financial-success-predicate", "保证获得回报"],
    ["registration-success-predicate", "一定会获准落户"],
    ["marriage-success-predicate", "肯定白头到老"],
    ["fertility-success-predicate", "必定有孩子"],
    ["fate-improvement", "保证改善命运"],
    ["fate-improvement-modal-after", "改善运势是必然的"],
    ["medical-improvement-modal-inside", "病情肯定会好转"],
    ["medical-cure-modal-after", "治好疾病是肯定的"],
  ])("rejects clause-level unnegated %s claim: %s", (_category, summary) => {
    const issues = auditContentItems([{
      ...completeItem,
      itemId: summary,
      fields: { summary: `这段姓名说明宣称${summary}，应当被明确拒绝。` },
    }]);

    expect(issues).toContainEqual(expect.objectContaining({ rule: "forbidden", field: "summary" }));
  });

  it.each([
    ["fate", "本产品没有保证改变命运，只核对现实使用。"],
    ["medical", "本产品未曾保证治疗高血压，身体问题请咨询医生。"],
    ["legal", "本产品从未保证获得有利判决，法律问题请咨询律师。"],
    ["financial", "本产品没有保证发财，也不替代现实判断。"],
    ["financial", "本产品从未保证投资收益，请以真实结果为准。"],
    ["financial", "本产品不能向任何用户保证投资收益，请以真实结果为准。"],
    ["registration", "本产品未曾保证成功登记姓名，请以办理机关答复为准。"],
    ["marriage", "本产品没有保证改善婚姻，只提供沟通核对。"],
    ["fertility", "本产品从未保证怀孕生子，健康问题请咨询医生。"],
    ["medical", "姓名文化说明不会治愈疾病，身体问题请咨询医生。"],
    ["promotional", "这并非必选方案，请根据现实需要决定。"],
    ["promotional", "本产品不提供改名改命承诺，只做现实使用核对。"],
    ["medical-negation-between", "肯定不会治愈疾病"],
    ["financial-negation-between", "一定不能保证投资收益"],
    ["fate-negation-between", "必然无法改变命运"],
    ["registration-negation-between", "一定不代表能够批准登记"],
    ["contrast-with-scoped-negations", "不保证治愈疾病，但肯定不会改变命运"],
    ["promotional-not", "本方案不是最吉"],
    ["promotional-not-belong", "本方案不属于必选"],
    ["promotional-no-such", "这里没有所谓最吉"],
    ["medical-directive", "一定要咨询医生后再决定疾病治疗"],
    ["financial-data-directive", "请确保投资收益数据来自可核验的账户记录"],
    ["marriage-directive", "一定要先确认婚姻状态，再讨论沟通安排"],
    ["promotional-uncertain", "本方案未必是最吉"],
    ["promotional-not-necessarily", "本方案不一定是必选"],
    ["promotional-reversed-not", "最吉并不是本方案的承诺"],
    ["promotional-reversed-not-belong", "必选不属于我们的建议"],
    ["financial-evidence-directive", "请确保先核对投资收益达到目标的证据"],
    ["denied-fate-assertion", "我们不能回答姓名是否一定能改变命运"],
  ])("allows a natural explicit %s boundary: %s", (_category, summary) => {
    const issues = auditContentItems([{
      ...completeItem,
      itemId: summary,
      fields: { summary },
    }]);

    expect(issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: "forbidden", field: "summary" }),
    ]));
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

  it("rejects certain year or month coordinates when those pillars are awaiting confirmation", () => {
    const issues = auditContentItems([
      { ...completeItem, itemId: "year", uncertainPillars: ["year"], fields: { summary: "年柱显示甲子，因此把边界候选写成了确定事实。" } },
      { ...completeItem, itemId: "month", uncertainPillars: ["month"], fields: { summary: "月柱为丙寅，因此把交节候选写成了确定事实。" } },
      { ...completeItem, itemId: "boundary", uncertainPillars: ["year", "month"], fields: { summary: "年柱与月柱尚未确定，当前不把候选坐标写成结论。" } },
    ]);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "year", rule: "certainty", field: "summary" }),
      expect.objectContaining({ itemId: "month", rule: "certainty", field: "summary" }),
    ]));
    expect(issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "boundary", rule: "certainty" }),
    ]));
  });
});

describe("name analysis audit conversion", () => {
  it("converts every visible layer, scans every converted field, and passes clean source-backed content", async () => {
    const birth = { name: "林知远", date: "1985-02-20", time: "10:20", location: "成都", gender: "unspecified" as const, timeConfidence: "exact" as const };
    const result = await analyzeName({
      rawInput: birth.name,
      chart: calculateFourPillars(birth),
      realityTest: { hearing: "both", inputDisplay: "both", documents: "both", meaningAcceptance: "accepted" },
    });
    expect(result).not.toBeNull();

    const items = nameAnalysisToAuditableItems(result!);
    const visibleFields = new Set(items.flatMap(item => Object.keys(item.fields)));
    for (const required of [
      "rawInput", "ruleObservation", "plainLanguageScene", "adviceTier", "scoreSummary",
      "rawAndCodePoints", "adoptedGlyphAndBasis", "tghFacts", "readings", "engineeringFacts",
      "meaningAndSemantic", "variantCandidates", "analysisBlockers", "confirmedUsageRisks",
      "aggregateBlockers", "aggregateConfirmedUsageRisks", "fullNameRecord", "chartStatus",
      "unavailableReasons", "nameVector", "directionTitle", "exampleCharacters",
      "pillar_year_stem", "pillar_year_branch", "pillar_year_element",
      "pillar_year_branchElement", "pillar_year_label",
    ]) {
      expect(visibleFields.has(required), required).toBe(true);
    }
    expect(auditNameAnalysis(result!)).toEqual([]);

    for (const item of items) {
      for (const field of Object.keys(item.fields)) {
        const mutated: AuditableContentItem = {
          ...item,
          itemId: `${item.itemId}:${field}`,
          fields: { ...item.fields, [field]: "这段可见内容被注入改名改命的错误承诺，审计必须发现。" },
        };
        expect(auditContentItems([mutated]), `${item.itemId}.${field}`).toEqual(expect.arrayContaining([
          expect.objectContaining({ rule: "forbidden", field }),
        ]));
      }
    }
  });

  it("audits every structured pillar field, including the label, independently", async () => {
    const birth = { name: "林知远", date: "1985-02-20", time: "10:20", location: "成都", gender: "unspecified" as const, timeConfidence: "exact" as const };
    const result = await analyzeName({ rawInput: birth.name, chart: calculateFourPillars(birth) });
    expect(result?.chartInteraction?.input.certainPillars.year).not.toBeNull();

    for (const field of ["stem", "branch", "element", "branchElement", "label"] as const) {
      const mutated = structuredClone(result!);
      const pillar = mutated.chartInteraction!.input.certainPillars.year! as unknown as Record<string, string>;
      pillar[field] = "这项结构化字段被注入改名改命的错误承诺";

      expect(auditNameAnalysis(mutated), field).toEqual(expect.arrayContaining([
        expect.objectContaining({
          module: "name-analysis:chart",
          rule: "forbidden",
          field: `pillar_year_${field}`,
        }),
      ]));
    }
  });

  it("requires the public-security name report source wherever frequency context is visible", async () => {
    const result = await analyzeName({ rawInput: "林知远" });
    expect(result?.sourceIds).toContain("mps.name-report-2021");
    const summary = nameAnalysisToAuditableItems(result!).find(item => item.module === "name-analysis:summary");
    expect(summary?.requiredSourceIds).toContain("mps.name-report-2021");

    const mutated = structuredClone(result!);
    mutated.sourceIds = mutated.sourceIds.filter(id => id !== "mps.name-report-2021");
    expect(auditNameAnalysis(mutated)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        module: "name-analysis:summary",
        rule: "missing-source",
        field: "sourceIds",
      }),
    ]));
  });

  it("collects and validates nested character, score, chart, advice, and direction source IDs", async () => {
    const result = await analyzeName({ rawInput: "林知远" });
    expect(result).not.toBeNull();
    const readingMutation = structuredClone(result!);
    readingMutation.characters[0].readings[0].sourceId = "unknown.name-source" as "unicode.unihan-17.data";

    expect(auditNameAnalysis(readingMutation)).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "name-analysis:character", rule: "missing-source", field: "sourceIds" }),
    ]));

    const methodMutation = structuredClone(result!);
    methodMutation.characters[0].semantic!.methodId = "unknown.name-method" as "name.semantic-five-elements.v1";
    expect(auditNameAnalysis(methodMutation)).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "name-analysis:character", rule: "missing-source", field: "sourceIds" }),
    ]));

    const directionMutation = structuredClone(result!);
    directionMutation.directions[0].exampleCharacters[0].sourceIds[0] = "unknown.direction-source";
    expect(auditNameAnalysis(directionMutation)).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "name-analysis:direction", rule: "missing-source", field: "sourceIds" }),
    ]));
  });

  it("scans aggregate risk evidence and exact reviewed full-name metadata", async () => {
    const result = await analyzeName({
      rawInput: "林知远",
      usageRisks: [{
        id: "persistent-input-document-or-calling-issue",
        severity: "hard",
        evidence: "本人和人工复核均确认多个系统持续无法正确录入。",
        manuallyReviewed: true,
        userConfirmed: true,
      }],
    });
    expect(result?.exactReviewedFullName).not.toBeNull();

    const riskMutation = structuredClone(result!);
    riskMutation.confirmedUsageRisks[0].evidence = "这项风险证据被注入改名改命的错误承诺。";
    expect(auditNameAnalysis(riskMutation)).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "name-analysis:summary", rule: "forbidden", field: "aggregateConfirmedUsageRisks" }),
    ]));

    const reviewMutation = structuredClone(result!);
    reviewMutation.exactReviewedFullName!.reviewerRole = "宣称康熙古法的错误复核角色";
    expect(auditNameAnalysis(reviewMutation)).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "name-analysis:summary", rule: "forbidden", field: "fullNameRecord" }),
    ]));
  });

  it("carries unknown-hour and year/month boundary state into certainty auditing", async () => {
    const base = { name: "林知远", date: "2024-02-04", time: null, location: "北京", gender: "unspecified" as const, timeConfidence: "unknown" as const };
    const result = await analyzeName({ rawInput: base.name, chart: calculateFourPillars(base) });
    expect(result?.chartInteraction).not.toBeNull();
    const corrupted = structuredClone(result!);
    corrupted.chartInteraction!.ruleObservation = "年柱显示甲子，月柱为丙寅，时柱显示甲子，因此形成确定结论。";

    expect(auditNameAnalysis(corrupted)).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: "name-analysis:chart", rule: "certainty", field: "chartStatus" }),
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
              : [{ symbols: ["甲", "己"], relation: "相合", coordinates: ["A年柱", "B年柱"], observation: "干支证据混入高维链接" }],
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
        getAtlasMethods: () => actual.getAtlasMethods().map((method, index) => index === 0
          ? { ...method, label: "高维链接方法", subtitle: "高维链接方法副标题" }
          : method),
        getAtlasGroups: (...args: Parameters<typeof actual.getAtlasGroups>) => actual.getAtlasGroups(...args).map((group, groupIndex) => ({
          ...group,
          title: groupIndex === 0 ? "高维链接分组标题" : group.title,
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
      "professionalTitle", "innovationTitle", "methodLabel", "methodSubtitle", "groupTitle", "title",
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
      { ...completeItem, itemId: "hour-cannot-assert", unknownHour: true, fields: { summary: "不能断言时柱显示甲子，只能等待出生时间核实。" } },
      { ...completeItem, itemId: "late-life-not-certain", unknownHour: true, fields: { summary: "晚年方向不一定会进入管理岗位，只保留观察。" } },
      { ...completeItem, itemId: "children-not-inevitable", unknownHour: true, fields: { summary: "子女发展并非一定会走向艺术领域，需要尊重本人选择。" } },
    ]);

    for (const itemId of ["hour-display", "hour-spaced", "hour-stem", "hour-branch", "late-life", "children"]) {
      expect(issues, itemId).toEqual(expect.arrayContaining([
        expect.objectContaining({ itemId, rule: "certainty", field: "summary" }),
      ]));
    }
    for (const itemId of [
      "boundary", "boundary-negated", "hour-cannot-assert",
      "late-life-not-certain", "children-not-inevitable",
    ]) {
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
