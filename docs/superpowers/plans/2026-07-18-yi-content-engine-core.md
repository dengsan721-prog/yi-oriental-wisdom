# Yi Content Engine Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 将现有八字总览、七域详批和大运流年升级为统一的专业判断、白话、场景、优劣版本、行动和来源内容引擎。

**Architecture:** 保留现有四柱计算和二十一条解释选择器，在 InterpretationItem 上增加内容层级与优劣版本，并使用纯函数质量门禁验证完整度。界面采用四层渐进阅读；报告总览和大运继续消费结构化模型，不在 React 组件里拼接判断逻辑。

**Tech Stack:** TypeScript 5.9、React 19、Vitest 4、lunar-typescript 1.8.6、CSS

## Global Constraints

- 完整报告目标为一万至一万八千字，但首屏只显示五秒结论。
- 核心判断正文三百至五百字，重要判断一百八十至三百字，辅助判断八十至一百五十字。
- 每条核心和重要判断都有专业依据、白话、生活场景、优势版本、失控版本、立即行动、长期训练、边界和来源。
- 禁止“功能入口、资源接口、社会接口、能量端口、底层模型、高维链接”等抽象技术词。
- 未知时辰时，时柱相关判断必须降低置信度或隐藏。
- 不作医疗、法律、投资、灾祸、寿命或确定性事件承诺。

---

## File Structure

- site/lib/yi/types.ts：扩展统一内容条目类型。
- site/lib/yi/content-quality.ts：纯函数内容质量、禁词、篇幅和重复检测。
- site/lib/yi/interpretation-enrichment.ts：二十一条解释的传统判断、优劣版本和长期训练内容。
- site/lib/yi/interpretation.ts：继续负责按命盘选择二十一条规则，并合并扩展内容。
- site/lib/yi/report-copy.ts：总览主旋律、矛盾、人生课题和行动文案。
- site/lib/yi/report-model.ts：输出增强后的结构化总览。
- site/lib/yi/fortune.ts：输出阶段故事、五领域、顺逆势和行动。
- site/components/yi/ChartSection.tsx：四层总览阅读。
- site/components/yi/DetailSection.tsx：四层详批阅读。
- site/components/yi/FortuneSection.tsx：时间长廊和阶段详情。
- site/app/globals.css：渐进展开、阅读密度和移动端样式。
- site/tests/yi/content-quality.test.ts：统一内容门禁。
- site/tests/yi/interpretation.test.ts：二十一条深度和差异性。
- site/tests/yi/report-model.test.ts：总览结构。
- site/tests/yi/fortune-mirrors.test.ts：大运和流年深度。

### Task 1: Extend the Unified Content Contract

**Files:**
- Modify: site/lib/yi/types.ts
- Create: site/lib/yi/content-quality.ts
- Create: site/tests/yi/content-quality.test.ts

**Interfaces:**
- Produces ContentPriority = "core" | "important" | "supporting".
- Extends InterpretationItem with traditionalJudgment, advantageVersion, shadowVersion, actionNow, actionLongTerm and priority.
- Produces validateInterpretation(item): string[] and findRepeatedSections(items): string[].

- [ ] **Step 1: Write the failing contract tests**

~~~ts
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

  it("detects repeated scenario and action copy", () => {
    expect(findRepeatedSections([item, { ...item, id: "self-support" }]))
      .toEqual(expect.arrayContaining(["scenario:重复", "actionNow:重复", "actionLongTerm:重复"]));
  });
});
~~~

- [ ] **Step 2: Run the test and verify failure**

Run: cd site; npx vitest run tests/yi/content-quality.test.ts

Expected: FAIL because content-quality.ts and the new type fields do not exist.

- [ ] **Step 3: Extend InterpretationItem**

Add these exact declarations to site/lib/yi/types.ts:

~~~ts
export type ContentPriority = "core" | "important" | "supporting";

export type InterpretationItem = {
  id: string;
  domain: "self" | "talent" | "career" | "wealth" | "relationship" | "family" | "rhythm";
  professionalTitle: string;
  innovationTitle: string;
  basis: string;
  traditionalJudgment: string;
  plainLanguage: string;
  scenario: string;
  advantageVersion: string;
  shadowVersion: string;
  mirror: string;
  action: string;
  actionNow: string;
  actionLongTerm: string;
  caution: string;
  priority: ContentPriority;
  confidence: "high" | "medium" | "limited";
  sourceTradition: string;
  sourceReferences: string[];
  sourceRuleIds: string[];
  pillarDependencies: PillarKey[];
  affectedByUnknownHour: boolean;
};
~~~

- [ ] **Step 4: Implement the quality gate**

~~~ts
import type { InterpretationItem } from "./types";

const forbidden = ["功能入口", "资源接口", "社会接口", "能量端口", "底层模型", "高维链接"];
const required = [
  "professionalTitle", "innovationTitle", "basis", "traditionalJudgment", "plainLanguage",
  "scenario", "advantageVersion", "shadowVersion", "actionNow", "actionLongTerm", "caution",
] as const;
const repeatedFields = ["scenario", "actionNow", "actionLongTerm"] as const;

export function validateInterpretation(item: InterpretationItem): string[] {
  const errors: string[] = [];
  for (const field of required) {
    const value = item[field].trim();
    if (!value) errors.push(field + ":缺失");
    for (const word of forbidden) if (value.includes(word)) errors.push(field + ":禁用词:" + word);
  }
  if (item.sourceReferences.length === 0) errors.push("sourceReferences:缺失");
  if (item.sourceRuleIds.length === 0) errors.push("sourceRuleIds:缺失");
  if (item.priority === "core" && item.confidence === "limited") errors.push("priority:有限置信度不能成为核心判断");
  return errors;
}

export function findRepeatedSections(items: InterpretationItem[]): string[] {
  const errors: string[] = [];
  for (const field of repeatedFields) {
    const values = items.map(item => item[field].trim()).filter(Boolean);
    if (new Set(values).size !== values.length) errors.push(field + ":重复");
  }
  return errors;
}
~~~

- [ ] **Step 5: Run the contract tests**

Run: cd site; npx vitest run tests/yi/content-quality.test.ts

Expected: PASS.

- [ ] **Step 6: Commit the content contract**

~~~bash
git add site/lib/yi/types.ts site/lib/yi/content-quality.ts site/tests/yi/content-quality.test.ts
git commit -m "feat: define yi content quality contract"
~~~

### Task 2: Enrich All Twenty-One Professional Interpretations

**Files:**
- Create: site/lib/yi/interpretation-enrichment.ts
- Modify: site/lib/yi/interpretation.ts
- Modify: site/lib/yi/scenario-library.ts
- Modify: site/tests/yi/interpretation.test.ts

**Interfaces:**
- Produces getInterpretationEnrichment(id): InterpretationEnrichment.
- buildInterpretations(chart) continues to return exactly twenty-one InterpretationItem objects.
- Each item has a stable ID and one of seven domains; three per domain.

- [ ] **Step 1: Add failing completeness, depth and uniqueness tests**

~~~ts
import { findRepeatedSections, validateInterpretation } from "../../lib/yi/content-quality";

it("delivers twenty-one enriched and distinct interpretations", () => {
  const items = buildInterpretations(knownChart);
  expect(items).toHaveLength(21);
  expect(Object.fromEntries(["self","talent","career","wealth","relationship","family","rhythm"]
    .map(domain => [domain, items.filter(item => item.domain === domain).length])))
    .toEqual({ self:3, talent:3, career:3, wealth:3, relationship:3, family:3, rhythm:3 });
  for (const item of items) {
    expect(validateInterpretation(item)).toEqual([]);
    const text = [
      item.basis, item.traditionalJudgment, item.plainLanguage, item.scenario,
      item.advantageVersion, item.shadowVersion, item.mirror,
      item.actionNow, item.actionLongTerm, item.caution,
    ].join("");
    const minimum = item.priority === "core" ? 300 : item.priority === "important" ? 180 : 80;
    expect(text.length).toBeGreaterThanOrEqual(minimum);
  }
  expect(findRepeatedSections(items)).toEqual([]);
});
~~~

- [ ] **Step 2: Run the test and verify content-depth failure**

Run: cd site; npx vitest run tests/yi/interpretation.test.ts

Expected: FAIL because the new content layers and minimum depths are absent.

- [ ] **Step 3: Create the enrichment schema and complete ID registry**

~~~ts
import type { ContentPriority } from "./types";

export type InterpretationEnrichment = {
  traditionalJudgment: string;
  advantageVersion: string;
  shadowVersion: string;
  actionNow: string;
  actionLongTerm: string;
  priority: ContentPriority;
};

export const INTERPRETATION_IDS = [
  "self-day-master", "self-support", "self-interface",
  "talent-public", "talent-hidden", "talent-output",
  "career-role", "career-pressure", "career-environment",
  "wealth-structure", "wealth-risk", "wealth-boundary",
  "relationship-day-branch", "relationship-trigger", "relationship-repair",
  "family-year", "family-resource", "family-boundary",
  "rhythm-climate", "rhythm-recovery", "rhythm-decision",
] as const;

export type InterpretationId = typeof INTERPRETATION_IDS[number];

export function getInterpretationEnrichment(id: InterpretationId): InterpretationEnrichment {
  return enrichment[id];
}
~~~

Write all twenty-one enrichment records in the same file. Use this exact priority distribution:

- Core: self-day-master, self-support, career-role, wealth-structure, relationship-day-branch, rhythm-climate.
- Important: self-interface, talent-public, talent-hidden, career-pressure, career-environment, wealth-risk, relationship-trigger, relationship-repair, family-resource, rhythm-recovery.
- Supporting: talent-output, wealth-boundary, family-year, family-boundary, rhythm-decision.

Each record must have a distinct real-life anchor:

- self: meeting decision, simultaneous responsibilities, personal preference versus organizational rules.
- talent: public presentation, quiet preparation, translating complexity into a deliverable.
- career: role assignment, deadline pressure, choosing an environment.
- wealth: budgeting, opportunity evaluation, lending or shared expenses.
- relationship: intimacy expectation, conflict trigger, repair conversation.
- family: inherited family role, receiving support, returning responsibility.
- rhythm: seasonal energy, recovery after intense work, deciding when information is sufficient.

- [ ] **Step 4: Merge enrichment into the existing selector**

In interpretation.ts, keep the existing chart-dependent basis and selection logic. After each draft is selected, read getInterpretationEnrichment(draft.id), merge its fields, use scenarioLibrary for scene and action, and set action equal to actionNow for backward compatibility until all consumers use the new fields.

~~~ts
type Draft = Omit<InterpretationItem,
  "domain" | "confidence" | "sourceTradition" | "sourceReferences" | "sourceRuleIds" |
  "affectedByUnknownHour" | "scenario" | "action" | "traditionalJudgment" |
  "advantageVersion" | "shadowVersion" | "actionNow" | "actionLongTerm" | "priority"
> & { id: InterpretationId; ruleIds: string[] };

const enrichment = getInterpretationEnrichment(draft.id);
return {
  ...draft,
  ...enrichment,
  domain,
  scenario: scene.scenario,
  action: enrichment.actionNow,
  confidence,
  sourceTradition: source.tradition,
  sourceReferences: source.references,
  sourceRuleIds: draft.ruleIds,
  affectedByUnknownHour,
};
~~~

- [ ] **Step 5: Run interpretation tests**

Run: cd site; npx vitest run tests/yi/interpretation.test.ts tests/yi/content-quality.test.ts

Expected: PASS with twenty-one unique, depth-compliant items.

- [ ] **Step 6: Commit the enriched library**

~~~bash
git add site/lib/yi/interpretation-enrichment.ts site/lib/yi/interpretation.ts site/lib/yi/scenario-library.ts site/tests/yi/interpretation.test.ts
git commit -m "feat: enrich twenty-one yi interpretations"
~~~

### Task 3: Render Four-Level Professional Reading

**Files:**
- Modify: site/components/yi/DetailSection.tsx
- Modify: site/app/globals.css
- Modify: site/tests/yi/experience-copy.test.ts

**Interfaces:**
- DetailSection continues to consume items: InterpretationItem[].
- Each item renders a visible five-second verdict and a native details block for deeper layers.

- [ ] **Step 1: Add failing rendered-copy assertions**

~~~ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

it("keeps the complete reading hierarchy in the production bundle", async () => {
  const source = readFileSync(resolve("components/yi/DetailSection.tsx"), "utf8");
  expect(source).toContain("优势版本");
  expect(source).toContain("失控版本");
  expect(source).toContain("此刻可做");
  expect(source).toContain("长期练习");
  expect(source).toContain("为什么这样判断");
});
~~~

- [ ] **Step 2: Run the focused test and verify failure**

Run: cd site; npx vitest run tests/yi/experience-copy.test.ts

Expected: FAIL because the new labels are not rendered.

- [ ] **Step 3: Replace flat cards with progressive reading markup**

For every item render this exact semantic order:

~~~tsx
<article className={"reading-card reading-" + item.priority} key={item.id}>
  <header>
    <span>{item.professionalTitle}</span>
    <h2>{item.innovationTitle}</h2>
    <p>{item.plainLanguage}</p>
  </header>
  <section className="reading-scene">
    <b>你可能见过这样的自己</b>
    <p>{item.scenario}</p>
  </section>
  <details>
    <summary>继续读懂这一判断</summary>
    <div className="reading-contrast">
      <section><b>优势版本</b><p>{item.advantageVersion}</p></section>
      <section><b>失控版本</b><p>{item.shadowVersion}</p></section>
    </div>
    <section><b>自然镜像</b><p>{item.mirror}</p></section>
    <div className="reading-actions">
      <section><b>此刻可做</b><p>{item.actionNow}</p></section>
      <section><b>长期练习</b><p>{item.actionLongTerm}</p></section>
    </div>
    <aside><b>使用边界</b><p>{item.caution}</p></aside>
    <details className="reading-evidence">
      <summary>为什么这样判断</summary>
      <p><b>传统判断</b>{item.traditionalJudgment}</p>
      <p><b>命盘依据</b>{item.basis}</p>
      <p><b>理论传统</b>{item.sourceTradition}</p>
      <p><b>参考依据</b>{item.sourceReferences.join("｜")}</p>
    </details>
  </details>
</article>
~~~

- [ ] **Step 4: Add density and priority styles**

~~~css
.reading-card{padding:20px;border:1px solid #ffffff12;border-radius:18px;background:#0b151c}
.reading-card header>span,.reading-card b{color:var(--gold);font-size:12px}
.reading-card h2{margin:7px 0 8px;font:500 clamp(22px,3vw,34px)/1.2 serif}
.reading-card p{line-height:1.78}.reading-scene{margin:16px 0;padding:15px 16px;background:#ffffff06;border-left:2px solid #caa760}
.reading-contrast,.reading-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.reading-core{border-color:#caa76055}.reading-supporting{background:#091118}
.reading-card details>summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:#dfca95}
@media(max-width:700px){.reading-contrast,.reading-actions{grid-template-columns:1fr}.reading-card{padding:16px}}
~~~

- [ ] **Step 5: Run tests and commit**

Run: cd site; npx vitest run tests/yi/experience-copy.test.ts tests/yi/interpretation.test.ts

Expected: PASS.

~~~bash
git add site/components/yi/DetailSection.tsx site/app/globals.css site/tests/yi/experience-copy.test.ts
git commit -m "feat: render layered professional readings"
~~~

### Task 4: Enrich the Overview and Fortune Timeline

**Files:**
- Modify: site/lib/yi/types.ts
- Modify: site/lib/yi/report-copy.ts
- Modify: site/lib/yi/report-model.ts
- Modify: site/lib/yi/fortune.ts
- Modify: site/components/yi/ChartSection.tsx
- Modify: site/components/yi/FortuneSection.tsx
- Modify: site/tests/yi/report-model.test.ts
- Modify: site/tests/yi/fortune-mirrors.test.ts

**Interfaces:**
- ProfessionalReport gains lifeTheme, coreTalents, centralTensions and currentLesson.
- FortunePeriod gains stageStory, lifeAreas, alignedState, strainedState and actions.
- FortuneYear continues to live inside a FortunePeriod and gains weatherMetaphor.

- [ ] **Step 1: Add failing overview and fortune-depth tests**

~~~ts
it("builds the four-part life overview", () => {
  const report = buildProfessionalReport(calculateFourPillars(birth), birth);
  expect(report.lifeTheme.length).toBeGreaterThanOrEqual(60);
  expect(report.coreTalents).toHaveLength(3);
  expect(report.centralTensions).toHaveLength(2);
  expect(report.currentLesson.length).toBeGreaterThanOrEqual(40);
});

it("turns every fortune period into a complete stage story", () => {
  const periods = buildFortuneTimeline(chart, birth);
  for (const period of periods) {
    expect(period.stageStory.length).toBeGreaterThanOrEqual(120);
    expect(Object.keys(period.lifeAreas)).toEqual(["career","wealth","relationship","family","rhythm"]);
    expect(period.alignedState.length).toBeGreaterThanOrEqual(40);
    expect(period.strainedState.length).toBeGreaterThanOrEqual(40);
    expect(period.actions).toHaveLength(3);
    for (const year of period.years) expect(year.weatherMetaphor.length).toBeGreaterThanOrEqual(30);
  }
});
~~~

- [ ] **Step 2: Run tests and verify failure**

Run: cd site; npx vitest run tests/yi/report-model.test.ts tests/yi/fortune-mirrors.test.ts

Expected: FAIL because the enhanced fields do not exist.

- [ ] **Step 3: Add the exact report and fortune fields**

~~~ts
lifeTheme: string;
coreTalents: [string, string, string];
centralTensions: [string, string];
currentLesson: string;
~~~

Insert the four fields above into the existing ProfessionalReport type immediately before confidence. Insert these exact fields into the existing FortunePeriod type after readings:

~~~ts
stageStory: string;
lifeAreas: {
  career: string;
  wealth: string;
  relationship: string;
  family: string;
  rhythm: string;
};
alignedState: string;
strainedState: string;
actions: [string, string, string];
~~~

Derive all copy from the existing ReportCopyContext, ten-god theme, relation evidence and confidence. Each paragraph must include at least one computed symbol or relationship; no field may be filled by a universal paragraph.

- [ ] **Step 4: Render the overview and time-long-corridor fields**

ChartSection renders lifeTheme first, then three talents, two tensions and currentLesson before the professional skeleton. FortuneSection renders stageStory, five life areas, aligned/strained states and three actions below the selected period; year cards show weatherMetaphor before detailed evidence.

- [ ] **Step 5: Run focused tests**

Run: cd site; npx vitest run tests/yi/report-model.test.ts tests/yi/fortune-mirrors.test.ts tests/yi/chart-view-model.test.ts

Expected: PASS.

- [ ] **Step 6: Commit overview and fortune**

~~~bash
git add site/lib/yi/types.ts site/lib/yi/report-copy.ts site/lib/yi/report-model.ts site/lib/yi/fortune.ts site/components/yi/ChartSection.tsx site/components/yi/FortuneSection.tsx site/tests/yi/report-model.test.ts site/tests/yi/fortune-mirrors.test.ts
git commit -m "feat: deepen yi overview and fortune stories"
~~~

### Task 5: Verify the Core Content Subsystem

**Files:**
- Modify only defects discovered during verification.

- [ ] **Step 1: Run all core content tests**

Run: cd site; npx vitest run tests/yi/content-quality.test.ts tests/yi/interpretation.test.ts tests/yi/report-model.test.ts tests/yi/fortune-mirrors.test.ts tests/yi/chart-view-model.test.ts tests/yi/experience-copy.test.ts

Expected: PASS with no skipped tests.

- [ ] **Step 2: Run lint and full unit regression**

Run: cd site; npm run lint; npm test

Expected: both commands exit 0.

- [ ] **Step 3: Build the GitHub product**

Run: cd site; npm run test:github

Expected: build succeeds; the production bundle contains “优势版本”“失控版本”“此刻可做”“长期练习” and contains none of the forbidden abstract titles.

- [ ] **Step 4: Review four representative reports**

Generate exact-time and unknown-time reports for 1990-06-15 09:30 and 1992-11-03 with unknown time. Confirm that each core paragraph has computed evidence, the two reports do not reuse the same scene set, and unknown-hour items are limited or hidden.

- [ ] **Step 5: Commit verification fixes**

~~~bash
git add site
git commit -m "fix: close yi content engine review"
~~~
