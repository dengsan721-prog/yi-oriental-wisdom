# Yi Professional Paid Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前简略报告升级为有完整排盘事实、命局骨架、七域详批、大运流年和生肖镜像的付费级大众报告。

**Architecture:** 保持子平八字为主轴，先将四柱结果转换成可测试的 `ProfessionalReport`，再由页面消费结构化字段。专业规则、白话场景和来源分别存储；任何未知时辰或无法可靠判断的字段都显式降置信度，不用固定文案补造结论。

**Tech Stack:** TypeScript 5.9、React 19、Vitest 4、lunar-typescript 1.8.6

## Global Constraints

- 结果必须展示公历、农历、出生地址、生肖、星座、四柱和时辰置信度。
- 命局骨架必须展示日主、月令、透干、藏干、根气、十神分布和干支关键关系。
- 五行数量为零不等于喜用，数量、得令、得地、得势和结构需要分开表达。
- 七域合计至少二十一条判断，每条完整七层正文 220–450 个中文字符。
- 每步大运包含九项阶段解读，每个流年包含岁运关系、典型场景和年度动作。
- 生肖镜像包含文化来源、关系方式、顺逆境、三个生活场景、主盘互证和行动建议。
- 所有专业条目都要保留专业叫法、创新叫法、依据、白话、场景、行动、边界和来源。
- 不作医疗、法律、投资、灾祸、寿命或确定性人生事件承诺。

---

## File Structure

- `site/lib/yi/relations.ts`：天干地支合、冲、刑、害、破和三合检测。
- `site/lib/yi/report-model.ts`：出生事实与专业命局骨架组装。
- `site/lib/yi/report-copy.ts`：总断、关键判断和五行诊断用语。
- `site/lib/yi/interpretation.ts`：七域二十一条规则选择。
- `site/lib/yi/scenario-library.ts`：不同人群的生活场景与行动方法。
- `site/lib/yi/fortune.ts`：九项大运与三项流年解释。
- `site/lib/yi/zodiac-mirror.ts`：十二生肖完整文化镜像。
- `site/lib/yi/sources.ts`：典籍、国家标准、文化资料来源注册表。
- `site/components/yi/ChartSection.tsx`：出生事实带和专业命盘。
- `site/components/yi/DetailSection.tsx`：摘要加七层展开。
- `site/components/yi/FortuneSection.tsx`：完整阶段叙事。
- `site/components/yi/MirrorSection.tsx`：生肖、动物与人物镜像。
- `site/components/yi/SourceNote.tsx`：来源分级与规则展开。
- `site/app/globals.css`：紧凑事实表、关系标签和高密度正文。

### Task 1: Detect Complete Stem and Branch Relationships

**Files:**
- Create: `site/lib/yi/relations.ts`
- Modify: `site/lib/yi/types.ts`
- Modify: `site/lib/yi/four-pillars.ts`
- Create: `site/tests/yi/relations.test.ts`

**Interfaces:**
- Produces: `detectChartRelations(pillars: Array<{ key: PillarKey; stem: string; branch: string }>): ChartRelation[]`.
- `ChartRelation` uses `pillars: PillarKey[]`, `symbols: string[]`, and types `stem-combination | branch-combination | branch-trine | branch-clash | branch-punishment | branch-harm | branch-break`.

- [ ] **Step 1: Write failing relation tests**

```ts
// site/tests/yi/relations.test.ts
import { describe, expect, it } from "vitest";
import { detectChartRelations } from "../../lib/yi/relations";

describe("complete chart relationships", () => {
  it("finds a three-branch trine", () => {
    const result = detectChartRelations([
      { key: "year", stem: "庚", branch: "申" },
      { key: "month", stem: "戊", branch: "子" },
      { key: "day", stem: "甲", branch: "辰" },
    ]);
    expect(result).toContainEqual(expect.objectContaining({ type: "branch-trine", symbols: ["申", "子", "辰"], label: "申子辰三合水局" }));
  });

  it.each([
    ["branch-harm", "子", "未", "子未相害"],
    ["branch-break", "子", "酉", "子酉相破"],
    ["branch-punishment", "子", "卯", "子卯相刑"],
    ["branch-clash", "子", "午", "子午相冲"],
  ])("finds %s", (type, left, right, label) => {
    const result = detectChartRelations([
      { key: "year", stem: "甲", branch: left }, { key: "day", stem: "己", branch: right },
    ]);
    expect(result).toContainEqual(expect.objectContaining({ type, label }));
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd site; npx vitest run tests/yi/relations.test.ts`

Expected: FAIL because `relations.ts` does not exist.

- [ ] **Step 3: Implement the complete relation detector**

```ts
// site/lib/yi/relations.ts
import type { ChartRelation, PillarKey } from "./types";

type InputPillar = { key: PillarKey; stem: string; branch: string };
const stemPairs = [["甲","己"],["乙","庚"],["丙","辛"],["丁","壬"],["戊","癸"]] as const;
const branchPairs = {
  "branch-combination": [["子","丑"],["寅","亥"],["卯","戌"],["辰","酉"],["巳","申"],["午","未"]],
  "branch-clash": [["子","午"],["丑","未"],["寅","申"],["卯","酉"],["辰","戌"],["巳","亥"]],
  "branch-harm": [["子","未"],["丑","午"],["寅","巳"],["卯","辰"],["申","亥"],["酉","戌"]],
  "branch-break": [["子","酉"],["卯","午"],["辰","丑"],["戌","未"],["寅","亥"],["巳","申"]],
  "branch-punishment": [["子","卯"]],
} as const;
const trines = [["申","子","辰","水"],["亥","卯","未","木"],["寅","午","戌","火"],["巳","酉","丑","金"]] as const;
const punishmentGroups = [["寅","巳","申"],["丑","戌","未"]] as const;
const selfPunishments = ["辰","午","酉","亥"] as const;

export function detectChartRelations(pillars: InputPillar[]): ChartRelation[] {
  const output: ChartRelation[] = [];
  for (let i = 0; i < pillars.length; i += 1) for (let j = i + 1; j < pillars.length; j += 1) {
    const left = pillars[i], right = pillars[j];
    if (stemPairs.some(([a,b]) => (left.stem === a && right.stem === b) || (left.stem === b && right.stem === a)))
      output.push({ type: "stem-combination", pillars: [left.key,right.key], symbols: [left.stem,right.stem], label: `${left.stem}${right.stem}相合` });
    for (const [type, pairs] of Object.entries(branchPairs) as [keyof typeof branchPairs, readonly (readonly [string,string])[]][]) {
      if (pairs.some(([a,b]) => (left.branch === a && right.branch === b) || (left.branch === b && right.branch === a)))
        output.push({ type, pillars: [left.key,right.key], symbols: [left.branch,right.branch], label: `${left.branch}${right.branch}${type === "branch-combination" ? "相合" : type === "branch-clash" ? "相冲" : type === "branch-harm" ? "相害" : type === "branch-break" ? "相破" : "相刑"}` });
    }
  }
  for (const [a,b,c,element] of trines) {
    const matched = [a,b,c].map((branch) => pillars.find((pillar) => pillar.branch === branch));
    if (matched.every(Boolean)) output.push({ type: "branch-trine", pillars: matched.map((item) => item!.key), symbols: [a,b,c], label: `${a}${b}${c}三合${element}局` });
  }
  for (const group of punishmentGroups) {
    const matched = group.map((branch) => pillars.find((pillar) => pillar.branch === branch));
    if (matched.every(Boolean)) output.push({ type: "branch-punishment", pillars: matched.map((item) => item!.key), symbols: [...group], label: `${group.join("")}三刑` });
  }
  for (const branch of selfPunishments) {
    const matched = pillars.filter((pillar) => pillar.branch === branch);
    if (matched.length >= 2) output.push({ type: "branch-punishment", pillars: matched.slice(0,2).map((item) => item.key), symbols: [branch,branch], label: `${branch}${branch}自刑` });
  }
  return output;
}
```

Extend `ChartRelation` in `types.ts` to the interface described above, replace the old pairwise detector in `four-pillars.ts` with `detectChartRelations`, and preserve unknown-hour filtering.

- [ ] **Step 4: Run relation and four-pillar tests**

Run: `cd site; npx vitest run tests/yi/relations.test.ts tests/yi/four-pillars.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit relation rules**

```bash
git add site/lib/yi/relations.ts site/lib/yi/types.ts site/lib/yi/four-pillars.ts site/tests/yi/relations.test.ts site/tests/yi/four-pillars.test.ts
git commit -m "feat: detect complete stem branch relations"
```

### Task 2: Build the Professional Report Model

**Files:**
- Create: `site/lib/yi/report-model.ts`
- Create: `site/lib/yi/report-copy.ts`
- Create: `site/tests/yi/report-model.test.ts`
- Modify: `site/lib/yi/types.ts`

**Interfaces:**
- Produces: `buildProfessionalReport(chart, birth): ProfessionalReport`.
- `ProfessionalReport` contains `birthFacts`, `pillarFacts`, `dayMaster`, `monthCommand`, `exposedStems`, `roots`, `elementDiagnostics`, `relations`, `summary`, `keyJudgments`, `actions`, and `confidence`.

- [ ] **Step 1: Write failing report-model tests**

```ts
// site/tests/yi/report-model.test.ts
import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildProfessionalReport } from "../../lib/yi/report-model";

const birth = { name: "林", date: "1990-06-15", time: "09:30", location: "浙江省杭州市", gender: "female" as const, timeConfidence: "exact" as const };

describe("professional report model", () => {
  it("contains dual-calendar facts and full chart skeleton", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);
    expect(report.birthFacts.solar).toContain("1990年6月15日");
    expect(report.birthFacts.lunar).toMatch(/年.+月.+/);
    expect(report.birthFacts.location).toBe("浙江省杭州市");
    expect(report.birthFacts.zodiac).toBeTruthy();
    expect(report.birthFacts.starSign).toBeTruthy();
    expect(report.pillarFacts).toHaveLength(4);
    expect(report.pillarFacts[1].hiddenStems.length).toBeGreaterThan(0);
    expect(report.monthCommand.branch).toBe(report.pillarFacts[1].branch);
    expect(report.elementDiagnostics).toHaveLength(5);
    expect(report.keyJudgments.length).toBeGreaterThanOrEqual(6);
    expect(report.actions).toHaveLength(3);
  });

  it("never equates a missing element with favorable use", () => {
    const report = buildProfessionalReport(calculateFourPillars(birth), birth);
    expect(report.elementDiagnostics.map((item) => item.conclusion).join(" ")).not.toMatch(/缺什么补什么|就是喜用/);
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `cd site; npx vitest run tests/yi/report-model.test.ts`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Add report types and builder**

```ts
// core public types in site/lib/yi/report-model.ts
export type HiddenStemFact = { stem: string; tenGod: string; index: number };
export type PillarFact = { key: PillarKey; label: string; stem: string; branch: string; stemElement: ElementName; branchElement: ElementName; stemTenGod: string; hiddenStems: HiddenStemFact[] };
export type ElementDiagnostic = { element: ElementName; count: number; inSeason: boolean; roots: string[]; exposed: string[]; conclusion: string };
export type ProfessionalReport = {
  birthFacts: { solar: string; lunar: string; location: string; timezone: string; trueSolarTime: string; zodiac: string; starSign: string; timeConfidence: string };
  pillarFacts: PillarFact[];
  dayMaster: string;
  monthCommand: { branch: string; hiddenStem: string; tenGod: string };
  exposedStems: string[];
  roots: string[];
  elementDiagnostics: ElementDiagnostic[];
  relations: ChartRelation[];
  summary: string;
  keyJudgments: string[];
  actions: string[];
  confidence: FourPillarsResult["confidence"];
};
```

Build calendar facts with `Solar.fromYmdHms(...).getLunar()`. Group `chart.professional.tenGods` by pillar, use branch entries as hidden stems, and use visible pillar stems as exposed stems. A root exists when a hidden stem has the day-master element. Use `report-copy.ts` pure functions to produce summary, six distinct judgments, and three actions from day master, month command, element diagnostics and relations.

Every element conclusion must follow this wording structure:

```ts
`${element}在可见八字中${count === 0 ? "未直接出现" : `出现${count}处`}；${inSeason ? "得到月令季节支持" : "未直接得到月令季节支持"}，${roots.length ? `在${roots.join("、")}有根气线索` : "未见同类藏干根气"}。数量只是分布，是否为结构所需仍须结合月令、根气、生克与调候，不能直接按“缺什么补什么”处理。`
```

- [ ] **Step 4: Run model tests**

Run: `cd site; npx vitest run tests/yi/report-model.test.ts tests/yi/four-pillars.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the model**

```bash
git add site/lib/yi/report-model.ts site/lib/yi/report-copy.ts site/lib/yi/types.ts site/tests/yi/report-model.test.ts
git commit -m "feat: build professional chart report model"
```

### Task 3: Render the Fact Band and Complete Chart Skeleton

**Files:**
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/components/yi/ChartSection.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/app/globals.css`
- Create: `site/tests/yi/chart-view-model.test.ts`

**Interfaces:**
- `ResultShell` consumes a `ProfessionalReport` prop.
- `ChartSection` consumes `report: ProfessionalReport` plus the original chart.

- [ ] **Step 1: Write a failing compact-view test**

```ts
// site/tests/yi/chart-view-model.test.ts
import { expect, it } from "vitest";
import { buildChartRows } from "../../components/yi/ChartSection";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { calculateFourPillars } from "../../lib/yi/four-pillars";

it("exposes all paid-report chart rows", () => {
  const birth = { name: "", date: "1990-06-15", time: "09:30", location: "杭州", gender: "male" as const, timeConfidence: "exact" as const };
  const report = buildProfessionalReport(calculateFourPillars(birth), birth);
  expect(buildChartRows(report).map((row) => row.label)).toEqual(["日主","月令","透干","根气","十神结构","干支关系","调候","五行提醒"]);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `cd site; npx vitest run tests/yi/chart-view-model.test.ts`

Expected: FAIL because `buildChartRows` is not exported.

- [ ] **Step 3: Implement the fact band and chart rows**

Add a compact report fact band before the section body:

```tsx
<section className="birth-fact-band">
  <div><span>公历</span><b>{report.birthFacts.solar}</b></div>
  <div><span>农历</span><b>{report.birthFacts.lunar}</b></div>
  <div><span>出生地址</span><b>{report.birthFacts.location || "未填写"}</b></div>
  <div><span>生肖</span><b>{report.birthFacts.zodiac}</b></div>
  <div><span>星座</span><b>{report.birthFacts.starSign}</b></div>
  <div><span>时辰可信度</span><b>{report.birthFacts.timeConfidence}</b></div>
</section>
```

Export `buildChartRows(report)` returning the eight exact labels from the test. Render pillar cards with stem, branch, stem ten-god, hidden stems and elements. Render relation tags with the involved pillar labels. Render the summary, six key judgments and three actions before the detailed rows.

- [ ] **Step 4: Add dense, responsive styles**

```css
.birth-fact-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-bottom:16px;background:#ffffff12;border:1px solid #ffffff12;border-radius:14px;overflow:hidden}
.birth-fact-band>div{padding:12px 14px;background:#0d202b}.birth-fact-band span,.birth-fact-band b{display:block}.birth-fact-band span{color:var(--muted);font-size:11px}.birth-fact-band b{margin-top:5px;font-size:13px}
.relation-tags{display:flex;flex-wrap:wrap;gap:6px}.relation-tags span{padding:6px 9px;border:1px solid #d7bd7b42;border-radius:999px;color:var(--gold);font-size:12px}
.pillar-hidden{display:flex;flex-wrap:wrap;gap:4px}.pillar-hidden small{padding:3px 5px;background:#ffffff08;border-radius:5px}
@media(max-width:760px){.birth-fact-band{grid-template-columns:repeat(2,minmax(0,1fr))}}
```

- [ ] **Step 5: Run tests and build**

Run: `cd site; npx vitest run tests/yi/chart-view-model.test.ts tests/yi/report-model.test.ts; npm run test:github`

Expected: PASS; the bundled app contains “月令”“透干”“藏干”“根气”“干支关系”.

- [ ] **Step 6: Commit chart rendering**

```bash
git add site/components/yi/ResultShell.tsx site/components/yi/ChartSection.tsx site/components/yi/YiExperience.tsx site/app/globals.css site/tests/yi/chart-view-model.test.ts docs
git commit -m "feat: render complete professional chart skeleton"
```

### Task 4: Expand the Seven-Domain Interpretation Library

**Files:**
- Create: `site/lib/yi/scenario-library.ts`
- Modify: `site/lib/yi/interpretation.ts`
- Modify: `site/components/yi/DetailSection.tsx`
- Modify: `site/tests/yi/interpretation.test.ts`

**Interfaces:**
- `buildInterpretations(chart)` continues to return exactly 21 `InterpretationItem` objects: three for each of seven domains.
- `interpretationLength(item)` returns the combined Chinese character count of the seven layers.

- [ ] **Step 1: Add failing depth and uniqueness tests**

```ts
// append to site/tests/yi/interpretation.test.ts
it("delivers twenty-one paid-depth, non-repeated interpretations", () => {
  const items = buildInterpretations(knownChart);
  expect(items).toHaveLength(21);
  for (const item of items) {
    const full = [item.professionalTitle,item.basis,item.plainLanguage,item.scenario,item.mirror,item.action,item.caution].join("");
    expect(full.length).toBeGreaterThanOrEqual(220);
    expect(full.length).toBeLessThanOrEqual(450);
    expect(item.sourceReferences.length).toBeGreaterThan(0);
  }
  expect(new Set(items.map((item) => item.scenario)).size).toBe(21);
  expect(new Set(items.map((item) => item.action)).size).toBe(21);
});
```

- [ ] **Step 2: Run test and verify it fails on content depth**

Run: `cd site; npx vitest run tests/yi/interpretation.test.ts`

Expected: FAIL because current items are too short.

- [ ] **Step 3: Add explicit scenario and action records**

Create `scenario-library.ts` with all 21 stable IDs already emitted by `interpretation.ts`. Each record must contain a 45–85 character scene and a 35–70 character action. Use these exact domains and scenario contexts:

```ts
export const scenarioLibrary = {
  "self-day-master": { scenario: "在团队意见很多、时间又紧的时候，你可能先依照自己的判断建立顺序，再决定听取哪些建议；若环境反馈不足，也容易把独立判断变成一个人硬扛。", action: "在重要决定前写下判断、证据、反证和可调整条件，隔一晚再确认；这样既保留主见，也给现实反馈留下入口。" },
  "self-support": { scenario: "连续承担工作、家庭和关系责任时，你可能只看到任务是否完成，却忽略恢复资源已经下降，直到效率或耐心明显变差才停下来。", action: "连续七天记录补给与消耗最大的三件事，为高消耗事项预先安排休息、协作者或明确的结束时间。" },
  "self-interface": { scenario: "个人偏好与组织规则不一致时，你可能一边想保持真实，一边又担心不配合会影响结果，最终在沉默忍耐和突然反弹之间来回。", action: "把不可协商的底线、可以学习的适应和需要谈判的条件分成三栏，再选择最小的一项先沟通。" },
  "talent-public": { scenario: "在汇报、教学或展示成果时，你会自然调用月干所示的公开功能；如果准备不足，这种优势也可能变成过度解释或只顾完成形式。", action: "选择一个两周内能完成的小交付，用听众反馈而不是自我感觉验证表达方式是否真正有效。" },
  "talent-hidden": { scenario: "没有明确指令、只能自己摸索时，你会回到日支藏干所示的熟练模式；它通常顺手，却也可能让你忽略其他可训练的方法。", action: "回看三次做得顺手的任务，提炼共同步骤，再刻意换一种方法完成一次同类任务，比较质量与耗能。" },
  "talent-future": { scenario: "规划长期作品、第二曲线或个人项目时，时柱功能更像远处航标；目标越远，越容易被想象放大而缺少现实校验。", action: "设置一个四周试验，只保留一个交付目标、一个反馈指标和一次复盘日期；时辰未知时不使用本条作确定判断。" },
  "career-environment": { scenario: "进入新团队或职责变化时，旧经验可能仍然有效，却未必适合新的权限、协作和成果标准，容易出现做得很多但评价口径不同。", action: "在接手任务的第一周确认责任、权限、交付物、截止时间和验收人，并把口头共识变成可回看的文字。" },
  "career-organization": { scenario: "早期形成的做事方式进入新组织后，既能成为稳定优势，也可能与新流程发生摩擦；你需要判断该坚持能力还是更新接口。", action: "保留一个已经证明有效的旧方法，同时试验一个新流程，用四周数据比较速度、质量和协作成本。" },
  "career-pace": { scenario: "任务密集时，你可能凭意志继续加量，却没有区分哪些工作必须亲自完成、哪些适合协作，最终让核心判断被琐事稀释。", action: "把本周任务按高判断、高沟通和高重复三类重排；高重复任务优先标准化，高沟通任务提前约定边界。" },
  "wealth-interface": { scenario: "面对报价、预算或新项目投入时，你容易把资源能力理解成赚得多少，却忽略现金流、时间和承诺也是同一套交换结构。", action: "把资金分为生存、稳定投入和试验三层，每层设金额上限、复盘日期和退出条件，不以命理解读替代财务判断。" },
  "wealth-loop": { scenario: "付出很多却难以衡量回报时，问题可能不在努力不足，而在投入、成果和回报之间没有形成可确认的闭环。", action: "为下一项投入写清时间、金额、预期结果、对方责任和停止条件，先用小规模验证再追加资源。" },
  "wealth-basket": { scenario: "同时面对储蓄、学习和事业投入时，如果一种行动方式占用全部资源，短期看似集中，长期可能失去回旋空间。", action: "为高波动尝试设定明确上限，同时保留稳定现金和学习预算；任何重大投资仍应咨询持牌专业人士。" },
  "relationship-expression": { scenario: "亲密关系出现分歧时，你可能先使用自己最熟悉的十神功能回应，却没有确认对方真正需要的是信息、情绪承接还是行动安排。", action: "先复述对方事实和感受，再询问此刻需要倾听、建议还是共同决定，最后只约定一个可执行动作。" },
  "relationship-boundary": { scenario: "当关系既有吸引又有拉扯时，合冲容易被误读成缘分好坏；现实里更常见的是靠近速度与边界需求不同。", action: "为高频冲突写下触发点、各自需要和暂停信号，约定情绪降温后再谈，不用命盘给任何一方归罪。" },
  "relationship-repair": { scenario: "冲突之后如果只追求迅速恢复表面平静，原来的需求和规则没有被更新，同样的问题会换一个情境再次出现。", action: "每次冲突后各写一句事实、影响、需要和下次规则；只讨论可观察行为，不使用性格标签或宿命结论。" },
  "family-root": { scenario: "家庭责任增加时，年柱与月柱所代表的旧经验会自然被调用；它能提供秩序，也可能让你重复自己曾经不喜欢的方式。", action: "区分要继承的家庭资源、需要停止的旧模式和准备新建的规则，每次只改变一个可观察的家庭动作。" },
  "family-care": { scenario: "照顾家人时，你可能把可靠理解成承担更多，却没有确认对方是否需要帮助，也忽略照顾者本身的恢复条件。", action: "把照顾任务、可用时间和求助对象列成清单，每周至少保留一个不承担他人责任的恢复时段。" },
  "family-future": { scenario: "讨论子女或晚年时，人们容易把时柱当成确定预言；实际上它只能提供一个观察轴，且高度依赖出生时间是否可靠。", action: "时辰可靠时把结论转成教育、储备和陪伴计划；时辰未知时只保留已知三柱信息，不补造子女或晚景判断。" },
  "rhythm-recovery": { scenario: "连续推进目标时，你可能只在明显疲惫后才调整；五行结构更适合用来观察恢复节奏，而不是解释具体健康问题。", action: "连续两周记录睡眠、专注和情绪波动，找出高耗能时段并提前安排间隔；身体不适应寻求医疗帮助。" },
  "rhythm-transition": { scenario: "环境转换或角色变化时，旧节奏仍会惯性运行，导致你用上一阶段的速度处理下一阶段的任务。", action: "在角色变化后的第一个月减少同时启动的项目，用每周复盘重新确定优先级、边界和恢复安排。" },
  "rhythm-long-term": { scenario: "长期计划容易被单一年份的吉凶叙事绑架，忽略真正影响结果的是连续投入、环境变化和及时修正。", action: "把十年主题拆成一年方向、季度里程碑和本月动作，每季度同时记录命理提示、现实证据和需要修正的假设。" },
} as const;
```

Update the 21 interpretation IDs to match these keys. Expand `basis`, `plainLanguage`, `mirror` and `caution` using actual day master, month command, ten-god and relation evidence until each combined item is 220–450 characters. Do not pad with repeated synonyms; each field must add a new fact, translation, scene, action or boundary.

- [ ] **Step 4: Render a concise summary before full layers**

In `DetailSection`, make each `<summary>` show the professional title, innovation title, confidence and the first sentence of `plainLanguage`. Keep the seven layers inside the expanded body and add the source tradition and references below the boundary reminder.

- [ ] **Step 5: Run interpretation tests**

Run: `cd site; npx vitest run tests/yi/interpretation.test.ts tests/yi/interpret.test.ts`

Expected: PASS with exactly 21 unique items and all lengths in range.

- [ ] **Step 6: Commit paid-depth content**

```bash
git add site/lib/yi/scenario-library.ts site/lib/yi/interpretation.ts site/components/yi/DetailSection.tsx site/tests/yi/interpretation.test.ts
git commit -m "feat: deepen seven-domain yi interpretations"
```

### Task 5: Expand Decade and Annual Life Rhythm

**Files:**
- Modify: `site/lib/yi/fortune.ts`
- Modify: `site/components/yi/FortuneSection.tsx`
- Modify: `site/tests/yi/fortune-mirrors.test.ts`

**Interfaces:**
- `FortunePeriod` adds `reading` with nine named strings.
- `FortuneYear` adds `interaction`, `scenario`, and `action`.

- [ ] **Step 1: Write failing fortune-depth tests**

```ts
it("builds nine period readings and three annual readings", () => {
  const periods = buildFortuneTimeline(chart, exactBirth);
  const first = periods[0];
  expect(Object.keys(first.reading)).toEqual(["climate","originalInteraction","opportunity","pressure","career","resources","relationship","wellbeing","strategy"]);
  expect(first.years[0].interaction.length).toBeGreaterThan(20);
  expect(first.years[0].scenario.length).toBeGreaterThan(30);
  expect(first.years[0].action.length).toBeGreaterThan(20);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `cd site; npx vitest run tests/yi/fortune-mirrors.test.ts`

Expected: FAIL because `reading`, `interaction` and `scenario` are absent.

- [ ] **Step 3: Implement explicit fortune readings**

Add:

```ts
export type FortuneReading = {
  climate: string; originalInteraction: string; opportunity: string; pressure: string;
  career: string; resources: string; relationship: string; wellbeing: string; strategy: string;
};
```

Create `buildFortuneReading(periodStemBranch, tenGod, chart)` using the period element, ten-god theme, detected original relations and element diagnostics. Create annual `interaction` from annual stem/branch versus original pillars and current decade. Every text must name its actual stem-branch or ten-god basis.

- [ ] **Step 4: Render all nine period fields and annual three-layer cards**

Use a compact definition list for the nine fields. Keep decade and year selectors horizontally scrollable; do not place each short field in a large standalone card.

- [ ] **Step 5: Run fortune and build tests**

Run: `cd site; npx vitest run tests/yi/fortune-mirrors.test.ts; npm run test:github`

Expected: PASS; built bundle contains “阶段气候”“原局互动”“机会来源”“压力来源”“岁运关系”“典型场景”.

- [ ] **Step 6: Commit life rhythm**

```bash
git add site/lib/yi/fortune.ts site/components/yi/FortuneSection.tsx site/tests/yi/fortune-mirrors.test.ts docs
git commit -m "feat: expand decade and annual life rhythm"
```

### Task 6: Add the Complete Zodiac Mirror and Source Registry

**Files:**
- Create: `site/lib/yi/zodiac-mirror.ts`
- Modify: `site/lib/yi/sources.ts`
- Modify: `site/components/yi/MirrorSection.tsx`
- Modify: `site/components/yi/SourceNote.tsx`
- Modify: `site/tests/yi/fortune-mirrors.test.ts`

**Interfaces:**
- Produces: `buildZodiacMirror(chart): ZodiacMirror`.
- `ZodiacMirror` fields: `zodiac`, `branch`, `element`, `yinYang`, `culturalSource`, `firstImpression`, `trustStyle`, `strengthPattern`, `pressurePattern`, `workScene`, `relationshipScene`, `familyScene`, `chartAgreement`, `chartDifference`, `immediateAction`, `longTermPractice`, `caution`, `sources`.

- [ ] **Step 1: Write failing zodiac tests**

```ts
function chartWithYearBranch(branch: string) {
  return { ...chart, pillars: { ...chart.pillars, year: { ...chart.pillars.year, branch } } };
}

it.each(["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"])("builds a complete %s zodiac mirror", (branch) => {
  const mirror = buildZodiacMirror(chartWithYearBranch(branch));
  expect(mirror.zodiac).toBeTruthy();
  expect(mirror.culturalSource.length).toBeGreaterThan(20);
  expect(mirror.workScene.length).toBeGreaterThan(25);
  expect(mirror.relationshipScene.length).toBeGreaterThan(25);
  expect(mirror.familyScene.length).toBeGreaterThan(25);
  expect(mirror.chartAgreement).toContain("主盘");
  expect(mirror.sources.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `cd site; npx vitest run tests/yi/fortune-mirrors.test.ts`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement all twelve records without random mapping**

Create a `Record<string, ZodiacContent>` with the twelve fixed branch-to-animal mappings: 子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪. Each record contains distinct culture, trust, strength, pressure, work, relationship, family, immediate-action and long-practice text. Combine it with the actual year-pillar element and compare against the actual day-master element and month-command ten-god for `chartAgreement` and `chartDifference`.

Register these source IDs in `sources.ts`:

```ts
"calendar.gb-t-33661-2017": { grade: "A", title: "GB/T 33661-2017 农历的编算和颁行", url: "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296" },
"classic.san-ming-tong-hui": { grade: "A/B", title: "三命通会", url: "https://www.shidianguji.com/zh/book/HY1521/chapter/1knwelu5suaf3" },
"classic.di-tian-sui": { grade: "A/B", title: "滴天髓辑要", url: "https://www.shidianguji.com/book/NMG41601JH000040/chapter/1lly6pm5s2joo" },
"culture.zodiac-national-museum": { grade: "B", title: "人化的生肖", url: "https://www.chnmuseum.cn/yj/xscg/xslw/201812/t20181224_33168.shtml" },
"culture.nasa-constellations": { grade: "B", title: "NASA: What Are Constellations?", url: "https://spaceplace.nasa.gov/constellations/sp/" },
```

- [ ] **Step 4: Render zodiac before animal and historical mirrors**

Use a compact overview plus three scene columns and an expandable “与八字主盘互证” section. Display source titles at the bottom. Keep the explicit caution that生肖 is a year-branch culture mirror, not the whole personality.

- [ ] **Step 5: Run all report tests and build**

Run: `cd site; npx vitest run tests/yi/relations.test.ts tests/yi/report-model.test.ts tests/yi/chart-view-model.test.ts tests/yi/interpretation.test.ts tests/yi/fortune-mirrors.test.ts; npm run test:github`

Expected: PASS.

- [ ] **Step 6: Commit mirrors and sources**

```bash
git add site/lib/yi/zodiac-mirror.ts site/lib/yi/sources.ts site/components/yi/MirrorSection.tsx site/components/yi/SourceNote.tsx site/tests/yi/fortune-mirrors.test.ts docs
git commit -m "feat: add complete zodiac mirror and sources"
```

### Task 7: Final Paid-Report Verification and Publication

**Files:**
- Modify only files required by issues found during verification.

- [ ] **Step 1: Run the full quality gate**

Run: `cd site; npm test; npm run lint; npm run test:github`

Expected: all unit tests, lint and GitHub build tests pass.

- [ ] **Step 2: Check content minimums by script**

Run: `cd site; npx vitest run tests/yi/interpretation.test.ts tests/yi/report-model.test.ts tests/yi/fortune-mirrors.test.ts --reporter=verbose`

Expected: 21 deep interpretations, six key judgments, three actions, nine fields per decade, three fields per year and twelve complete zodiac records all pass.

- [ ] **Step 3: Visually verify the paid report**

At 390×844 and 1440×900, calculate one exact-time and one unknown-time chart. Verify: facts fit without horizontal overflow; four pillars and hidden stems remain readable; unknown hour does not create a false time pillar or exact fortune dates; expanding 21 items does not lose the active tab; no large empty cards contain only one sentence.

- [ ] **Step 4: Push and verify GitHub Pages**

Run: `git push origin master; gh api -X POST repos/dengsan721-prog/yi-oriental-wisdom/pages/builds`

Expected: push succeeds and Pages starts a build for the local HEAD.

- [ ] **Step 5: Confirm public content**

Fetch the public HTML and hashed JS. Expected status is 200 and bundle contains `月令`, `透干`, `藏干`, `七域详批`, `阶段气候`, `生肖镜像`, while excluding `缺什么补什么`, `称骨`, `Demo`, `演示版`.
