import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { calculateCompatibility, classifyBranchRelation } from "../../lib/yi/compatibility";
import { calculateTenGod } from "../../lib/yi/fortune";

const first = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
const second = calculateFourPillars({ name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "unspecified", timeConfidence: "exact" });
const contrasting = calculateFourPillars({ name: "丙", date: "1985-02-20", time: "23:40", location: "成都", gender: "unspecified", timeConfidence: "exact" });
const relationships = ["partner", "parent-child", "business", "friend"] as const;
const axisIds = [
  "attraction", "communication", "trigger", "trust", "conflict",
  "resources", "decisions", "stability", "repair",
] as const;
const confidenceLabels = { high: "高置信", medium: "中等置信", limited: "有限置信" } as const;

function withAmbiguousDay(source: typeof first, marker: "ambiguousPillars" | "dayMaster" | "dayPillar") {
  return {
    ...source,
    ambiguousPillars: marker === "ambiguousPillars"
      ? [...new Set([...source.ambiguousPillars, "day" as const])]
      : source.ambiguousPillars,
    professional: {
      ...source.professional,
      ambiguousFields: marker === "ambiguousPillars"
        ? source.professional.ambiguousFields
        : [...source.professional.ambiguousFields, marker] as typeof source.professional.ambiguousFields,
    },
  };
}

function replaceDayCandidate(source: typeof first) {
  const day = source.pillars.day.stem === "庚"
    ? { stem: "甲", branch: "午", element: "木", branchElement: "火" } as const
    : { stem: "庚", branch: "子", element: "金", branchElement: "水" } as const;
  return {
    ...source,
    pillars: { ...source.pillars, day: { ...source.pillars.day, ...day } },
    professional: {
      ...source.professional,
      dayMaster: { stem: day.stem, element: day.element, polarity: "yang" as const },
    },
  };
}

function publicTextSegments(result: ReturnType<typeof calculateCompatibility>): Array<[string, string]> {
  return [
    ["summary", result.summary],
    ...result.axes.flatMap((axis, index) => (
      (["label", "professionalBasis", "plainLanguage", "scene", "action", "caution"] as const)
        .map((field) => [`axes[${index}].${field}`, axis[field]] as [string, string])
    )),
    ["roleSpecificGuidance", JSON.stringify(result.roleSpecificGuidance)],
    ["elementDynamics", JSON.stringify(result.elementDynamics)],
    ["tenGodDynamics", JSON.stringify(result.tenGodDynamics)],
    ["combinationsAndClashes", JSON.stringify(result.combinationsAndClashes)],
    ["communicationScenario", result.communicationScenario],
    ["actionRules", JSON.stringify(result.actionRules)],
    ["limitations", JSON.stringify(result.limitations)],
  ];
}

function withoutLiteralEvidence(value: string) {
  return value
    .replace(/[甲乙丙丁戊己庚辛壬癸]/g, "干")
    .replace(/[子丑寅卯辰巳午未申酉戌亥]/g, "支")
    .replace(/比肩|劫财|食神|伤官|偏财|正财|七杀|正官|偏印|正印/g, "十神")
    .replace(/[木火土金水]/g, "五行")
    .replace(/high|medium|limited|\d+/g, "量");
}

describe("compatibility", () => {
  function withBranches(source: typeof first, branches: [string, string, string, string]) {
    const keys = ["year", "month", "day", "hour"] as const;
    return {
      ...source,
      pillars: Object.fromEntries(keys.map((key, index) => [key, { ...source.pillars[key]!, branch: branches[index] }])) as typeof source.pillars,
    };
  }

  it.each(["partner", "parent-child", "business", "friend"] as const)("does not reduce %s compatibility to a single score", (relationship) => {
    const result = calculateCompatibility(first, second, relationship);
    expect(result).not.toHaveProperty("score");
    expect(result).toMatchObject({ relationship, elementDynamics: expect.any(Array), tenGodDynamics: expect.any(Array), combinationsAndClashes: expect.any(Array), communicationScenario: expect.any(String), actionRules: expect.any(Array), limitations: expect.any(Array) });
  });

  it.each(relationships)("builds a complete nine-axis %s relationship manual", (relationship) => {
    const result = calculateCompatibility(first, second, relationship);
    expect(result.summary.length).toBeGreaterThanOrEqual(80);
    expect(result.axes.map((axis) => axis.id)).toEqual(axisIds);
    for (const axis of result.axes) {
      expect(axis.label.length).toBeGreaterThanOrEqual(6);
      expect(axis.professionalBasis.length).toBeGreaterThanOrEqual(20);
      expect(axis.plainLanguage.length).toBeGreaterThanOrEqual(40);
      expect(axis.scene.length).toBeGreaterThanOrEqual(60);
      expect(axis.action.length).toBeGreaterThanOrEqual(30);
      expect(axis.caution.length).toBeGreaterThanOrEqual(20);
    }
    expect(result.roleSpecificGuidance.length).toBeGreaterThanOrEqual(4);
  });

  it("grounds every axis in chart evidence and exposes the complete evidence set", () => {
    const result = calculateCompatibility(first, second, "partner");
    const axisBasis = result.axes.map((axis) => axis.professionalBasis);
    const corpus = axisBasis.join(" ");
    const directionalTokens = result.tenGodDynamics.flatMap((item) => [item.theme, item.basis]);
    const dayTokens = [
      `日干${first.pillars.day.stem}`, `日支${first.pillars.day.branch}`,
      `日干${second.pillars.day.stem}`, `日支${second.pillars.day.branch}`,
    ];
    const crossTokens = result.combinationsAndClashes.map((item) => `${item.symbols.join("")}${item.relation}`);
    const elementTokens = result.elementDynamics.map((item) => `${item.element}${item.first}/${item.second}`);
    const confidenceTokens = [`A:${confidenceLabels[first.confidence]}`, `B:${confidenceLabels[second.confidence]}`];
    const actualEvidenceTokens = [...directionalTokens, ...dayTokens, ...crossTokens, ...elementTokens, ...confidenceTokens];

    for (const basis of axisBasis) {
      expect(actualEvidenceTokens.some((token) => basis.includes(token))).toBe(true);
    }
    for (const token of [...directionalTokens, ...dayTokens, ...crossTokens, ...elementTokens, ...confidenceTokens]) {
      expect(corpus).toContain(token);
    }
  });

  it("uses unique role scenes and substantively changes plain language, scenes and actions", () => {
    const manuals = relationships.map((relationship) => calculateCompatibility(first, second, relationship));
    expect(new Set(manuals.flatMap((manual) => manual.axes.map((axis) => axis.scene))).size).toBe(relationships.length * axisIds.length);

    for (const [index] of axisIds.entries()) {
      for (const field of ["plainLanguage", "scene", "action"] as const) {
        expect(new Set(manuals.map((manual) => withoutLiteralEvidence(manual.axes[index][field]))).size).toBe(relationships.length);
      }
    }
  });

  it("changes relationship advice from evidence semantics rather than symbol substitution", () => {
    const baseline = calculateCompatibility(first, second, "partner");
    const changed = calculateCompatibility(first, contrasting, "partner");
    for (const field of ["plainLanguage", "scene", "action"] as const) {
      const substantivelyChanged = baseline.axes.filter((axis, index) => (
        withoutLiteralEvidence(axis[field]) !== withoutLiteralEvidence(changed.axes[index][field])
      ));
      expect(substantivelyChanged.length).toBeGreaterThanOrEqual(6);
    }
  });

  it.each([
    ["partner", [/亲密需要/, /承诺方式/, /家庭节奏/, /修复语言/]],
    ["parent-child", [/规则解释/, /选择范围/, /天赋支持/, /期待边界/]],
    ["business", [/权限/, /投资门槛/, /现金流/, /风险止损/, /退出.*交接/]],
    ["friend", [/陪伴方式/, /请求明确/, /边界/, /人生阶段/]],
  ] as const)("covers every required %s guidance topic", (relationship, topics) => {
    const guidance = calculateCompatibility(first, second, relationship).roleSpecificGuidance.join(" ");
    for (const topic of topics) expect(guidance).toMatch(topic);
  });

  it("is deterministic for identical charts and relationship type", () => {
    expect(calculateCompatibility(first, second, "friend")).toEqual(calculateCompatibility(first, second, "friend"));
  });

  it("changes relationship semantics without changing the professional evidence", () => {
    const manuals = relationships.map((relationship) => calculateCompatibility(first, second, relationship));
    expect(manuals.map((manual) => manual.elementDynamics)).toEqual(manuals.map(() => manuals[0].elementDynamics));
    expect(manuals.map((manual) => manual.tenGodDynamics)).toEqual(manuals.map(() => manuals[0].tenGodDynamics));
    expect(manuals.map((manual) => manual.combinationsAndClashes)).toEqual(manuals.map(() => manuals[0].combinationsAndClashes));
    expect(new Set(manuals.map((manual) => withoutLiteralEvidence(manual.summary))).size).toBe(relationships.length);
    expect(new Set(manuals.map((manual) => manual.roleSpecificGuidance.join(" "))).size).toBe(relationships.length);
  });

  it("keeps public relationship language non-predictive and non-coercive", () => {
    const publicText = JSON.stringify(relationships.map((relationship) => calculateCompatibility(first, second, relationship)));
    expect(publicText).not.toMatch(/缘分(?:评分|分数|高低)|匹配分数|忠诚度|保证忠诚|控制对方|操控对方/);
    expect(publicText).not.toMatch(/注定.*(?:相守|分开|分手|复合|分合)|必然.*(?:相守|分开|分手|复合|分合)/);
    expect(publicText).not.toMatch(/(?:保证|必然|一定).*(?:收益|盈利|回报)|稳赚|投资结果/);

    const business = calculateCompatibility(first, second, "business");
    expect(business.actionRules.join(" ")).toMatch(/权限/);
    expect(business.actionRules.join(" ")).toMatch(/现金流/);
    expect(business.actionRules.join(" ")).toMatch(/止损/);
    expect(business.actionRules.join(" ")).toMatch(/退出/);
    expect(business.limitations.join(" ")).toMatch(/不构成(?:投资|金融)建议/);
  });

  it("uses only stable evidence for an unknown-time solar-term boundary candidate", () => {
    const boundary = calculateFourPillars({
      name: "交节候选", date: "2024-02-04", time: null, location: "北京", gender: "unspecified", timeConfidence: "unknown",
    });
    expect(boundary.ambiguousPillars).toEqual(expect.arrayContaining(["year", "month", "hour"]));
    const replacements = {
      year: { stem: "辛", branch: "酉", element: "金", branchElement: "金" },
      month: { stem: "壬", branch: "子", element: "水", branchElement: "水" },
      day: { stem: "癸", branch: "亥", element: "水", branchElement: "水" },
      hour: { stem: "甲", branch: "寅", element: "木", branchElement: "木" },
    } as const;
    const pillars = { ...boundary.pillars };
    for (const key of boundary.ambiguousPillars) {
      const pillar = pillars[key];
      if (pillar) pillars[key] = { ...pillar, ...replacements[key] };
    }
    const alteredCandidate = {
      ...boundary,
      pillars,
      elementCounts: { 木: 99, 火: 99, 土: 99, 金: 99, 水: 99 },
    };

    const original = calculateCompatibility(boundary, second, "parent-child");
    const altered = calculateCompatibility(alteredCandidate, second, "parent-child");
    expect(altered).toEqual(original);
    expect(original.axes.every((axis) => /置信|未知时辰|交节/.test(axis.caution))).toBe(true);
    expect(original.limitations.join(" ")).toMatch(/未知时辰/);
    expect(original.limitations.join(" ")).toMatch(/交节.*候选|候选.*交节/);
  });

  it.each([
    ["A ambiguousPillars day", "first", "ambiguousPillars"],
    ["A professional dayMaster", "first", "dayMaster"],
    ["B professional dayPillar", "second", "dayPillar"],
  ] as const)("keeps %s candidate values out of every public result surface", (_name, side, marker) => {
    const reviewed = withAmbiguousDay(side === "first" ? first : second, marker);
    const alteredCandidate = replaceDayCandidate(reviewed);
    const original = calculateCompatibility(
      side === "first" ? reviewed : first,
      side === "second" ? reviewed : second,
      "partner",
    );
    const altered = calculateCompatibility(
      side === "first" ? alteredCandidate : first,
      side === "second" ? alteredCandidate : second,
      "partner",
    );

    expect(altered).toEqual(original);
    expect(original.tenGodDynamics).toEqual([]);
    expect(JSON.stringify(original)).toContain(`${side === "first" ? "A" : "B"}日柱待核`);
  });

  it("still changes public results when a stable day pillar changes", () => {
    const baseline = calculateCompatibility(first, second, "partner");
    const changed = calculateCompatibility(replaceDayCandidate(first), second, "partner");

    expect(changed.summary).not.toBe(baseline.summary);
    expect(changed.axes).not.toEqual(baseline.axes);
    expect(changed.roleSpecificGuidance).not.toEqual(baseline.roleSpecificGuidance);
    expect({
      elementDynamics: changed.elementDynamics,
      tenGodDynamics: changed.tenGodDynamics,
      combinationsAndClashes: changed.combinationsAndClashes,
    }).not.toEqual({
      elementDynamics: baseline.elementDynamics,
      tenGodDynamics: baseline.tenGodDynamics,
      combinationsAndClashes: baseline.combinationsAndClashes,
    });
  });

  it.each([
    ["high", "高置信"],
    ["medium", "中等置信"],
    ["limited", "有限置信"],
  ] as const)("localizes %s confidence across every public text surface", (confidence, label) => {
    const result = calculateCompatibility(first, { ...second, confidence }, "business");
    const segments = publicTextSegments(result);

    for (const [surface, value] of segments) {
      expect(value, surface).not.toMatch(/\b(?:high|medium|limited)\b/);
    }
    expect(segments.map(([, value]) => value).join(" ")).toContain(label);
  });

  it("reports directional evidence for both people", () => {
    const result = calculateCompatibility(first, second, "partner");
    expect(result.tenGodDynamics.map((item) => item.direction)).toEqual(expect.arrayContaining(["A→B", "B→A"]));
    expect(result.tenGodDynamics[0].theme).toBe(calculateTenGod(first.pillars.day.stem, second.pillars.day.stem));
    expect(result.tenGodDynamics[1].theme).toBe(calculateTenGod(second.pillars.day.stem, first.pillars.day.stem));
  });

  it("uses dedicated business governance rules", () => {
    const result = calculateCompatibility(first, second, "business");
    expect(result.actionRules.join(" ")).toMatch(/投资|成本审批/);
    expect(result.actionRules.join(" ")).toMatch(/利润.*亏损/);
    expect(result.actionRules.join(" ")).toMatch(/权限/);
    expect(result.actionRules.join(" ")).toMatch(/暂停/);
    expect(result.actionRules.join(" ")).toMatch(/退出/);
    expect(result.actionRules.join(" ")).toMatch(/文档交接/);
  });

  it.each([
    ["合", "子", "丑"],
    ["冲", "子", "午"],
    ["害", "子", "未"],
    ["刑", "寅", "巳"],
  ])("returns a structured %s relation through calculateCompatibility", (relation, left, right) => {
    const result = calculateCompatibility(withBranches(first, [left, left, left, left]), withBranches(second, [right, right, right, right]), "partner");
    expect(result.combinationsAndClashes).toEqual(expect.arrayContaining([
      expect.objectContaining({ symbols: [left, right], relation, observation: expect.any(String) }),
    ]));
  });

  it("returns the structured no-direct-relation fallback through calculateCompatibility", () => {
    const result = calculateCompatibility(withBranches(first, ["子", "子", "子", "子"]), withBranches(second, ["寅", "寅", "寅", "寅"]), "friend");
    expect(result.combinationsAndClashes).toEqual([{ symbols: ["子", "寅"], relation: "无直接合冲刑害", observation: expect.any(String) }]);
  });
});

describe("branch relation coverage", () => {
  it("includes branch punishment and harm in cross-chart relations", () => {
    expect(classifyBranchRelation("子", "未")).toContain("害");
    expect(classifyBranchRelation("寅", "巳")).toContain("刑");
  });

  it.each([
    ["子", "丑", "合"], ["子", "午", "冲"], ["子", "未", "害"], ["寅", "巳", "刑"], ["子", "寅", undefined],
  ])("classifies %s-%s as %s", (left, right, expected) => {
    const relations = classifyBranchRelation(left, right);
    if (expected) expect(relations).toContain(expected);
    else expect(relations).toEqual([]);
  });
});
