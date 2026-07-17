# 「艺」东方人生智慧升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有单页排盘升级为面向大众的东方人生智慧产品，完整交付滚轮录入、专业命盘、生活化详批、大运流年、东方镜像、关系合盘、传统技法与持续使用入口。

**Architecture:** 将当前 575 行的 `YiExperience.tsx` 拆成输入、导航和七个结果分区组件；计算层输出结构化命盘与解读数据，表现层只负责渐进展示。使用 `lunar-typescript@1.8.6` 完成公农历互转与标准历法信息，所有趣味镜像都由可测试规则映射，不使用随机值或年份取模冒充专业结论。

**Tech Stack:** React 19、TypeScript 5.9、Vinext、Vitest、CSS、lunar-typescript 1.8.6、GitHub Pages、OpenAI Sites。

## Global Constraints

- 子平八字为主结论；称骨、生肖、星座、历史人物和动物原型只作辅助观察。
- 用户可见内容不出现价格、购买方案、Demo、演示版、测试版或研发状态用语。
- 每条核心解读必须包含专业结论、命盘依据、白话翻译、生活场景、东方镜像、行动建议与提醒。
- 年月日使用三列上下滚轮；阳历与农历明确区分；未知时辰不阻止排盘。
- 未知时辰时隐藏依赖时柱的确定性结论，并明确影响范围。
- 历史人物只比较具体维度，不宣称命运相同；动物原型不得使用贬损性标签。
- 面相与面痣入口继续隐藏。
- 页面触控目标不小于 44px，移动端无页面级横向溢出。
- 理论出处简洁显示在模块底部，完整依据按需展开。

---

### Task 1: 历法、出生输入与基础类型

**Files:**
- Modify: `site/package.json`
- Modify: `site/lib/yi/types.ts`
- Create: `site/lib/yi/calendar.ts`
- Modify: `site/lib/yi/date-picker.ts`
- Test: `site/tests/yi/calendar.test.ts`
- Modify: `site/tests/yi/date-picker.test.ts`

**Interfaces:**
- Produces: `CalendarMode`, `BirthDateSelection`, `TimeMode`, `toSolarSelection()`, `getDualCalendarLabel()`, `getWheelOptions()`。
- Consumes: `Solar` 与 `Lunar` from `lunar-typescript`。

- [ ] **Step 1: 安装固定版本依赖**

Run: `cd site && pnpm add lunar-typescript@1.8.6`

Expected: `package.json` 与锁文件记录 `lunar-typescript` 1.8.6。

- [ ] **Step 2: 写历法转换失败测试**

```ts
import { describe, expect, it } from "vitest";
import { getDualCalendarLabel, toSolarSelection } from "../../lib/yi/calendar";

describe("calendar conversion", () => {
  it("converts lunar new year to the matching solar day", () => {
    expect(toSolarSelection({ mode: "lunar", year: 2024, month: 1, day: 1, isLeapMonth: false }))
      .toEqual({ year: 2024, month: 2, day: 10 });
  });

  it("returns both calendar labels", () => {
    expect(getDualCalendarLabel({ mode: "solar", year: 2024, month: 2, day: 10, isLeapMonth: false }))
      .toMatchObject({ solar: "2024年2月10日", lunar: expect.stringContaining("正月初一") });
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `cd site && pnpm vitest run tests/yi/calendar.test.ts`

Expected: FAIL because `lib/yi/calendar.ts` does not exist.

- [ ] **Step 4: 实现类型与历法适配器**

```ts
export type CalendarMode = "solar" | "lunar";
export type TimeMode = "exact" | "earthly" | "unknown";
export type BirthDateSelection = {
  mode: CalendarMode;
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
};
```

在 `calendar.ts` 中用 `Solar.fromYmd()` 与 `Lunar.fromYmd()` 实现双向转换，捕获无效闰月并返回中文错误；`getWheelOptions()` 根据模式返回合法年、月、日，不生成不存在的日期。

- [ ] **Step 5: 运行历法与日期测试**

Run: `cd site && pnpm vitest run tests/yi/calendar.test.ts tests/yi/date-picker.test.ts`

Expected: PASS，且 2024 农历正月初一对应 2024-02-10。

- [ ] **Step 6: 提交**

```bash
git add site/package.json site/pnpm-lock.yaml site/lib/yi/types.ts site/lib/yi/calendar.ts site/lib/yi/date-picker.ts site/tests/yi/calendar.test.ts site/tests/yi/date-picker.test.ts
git commit -m "feat: add solar lunar birth calendar model"
```

### Task 2: 专业命盘与结构化解读模型

**Files:**
- Modify: `site/lib/yi/types.ts`
- Modify: `site/lib/yi/four-pillars.ts`
- Create: `site/lib/yi/interpretation.ts`
- Create: `site/lib/yi/sources.ts`
- Modify: `site/tests/yi/four-pillars.test.ts`
- Create: `site/tests/yi/interpretation.test.ts`

**Interfaces:**
- Produces: `InterpretationItem`, `ProfessionalOverview`, `buildProfessionalOverview()`, `buildInterpretations()`。
- Consumes: `FourPillarsResult` 与标准化阳历出生数据。

- [ ] **Step 1: 写结构化解读失败测试**

```ts
it("gives every interpretation a traceable seven-layer explanation", () => {
  const overview = buildProfessionalOverview(knownChart);
  const item = buildInterpretations(knownChart)[0];
  expect(overview).toMatchObject({ dayMaster: expect.any(String), pattern: expect.any(String) });
  expect(item).toMatchObject({
    professionalTitle: expect.any(String),
    basis: expect.any(String),
    plainLanguage: expect.any(String),
    scenario: expect.any(String),
    mirror: expect.any(String),
    action: expect.any(String),
    caution: expect.any(String),
    confidence: expect.stringMatching(/high|medium|limited/),
    sourceTradition: expect.any(String),
  });
});

it("marks hour-dependent content limited when hour is unknown", () => {
  const items = buildInterpretations(unknownHourChart);
  expect(items.filter(item => item.affectedByUnknownHour).every(item => item.confidence === "limited")).toBe(true);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm vitest run tests/yi/interpretation.test.ts`

Expected: FAIL because interpretation interfaces are absent.

- [ ] **Step 3: 扩展专业结果模型**

```ts
export type InterpretationItem = {
  id: string;
  domain: "self" | "talent" | "career" | "wealth" | "relationship" | "family" | "rhythm";
  professionalTitle: string;
  innovationTitle: string;
  basis: string;
  plainLanguage: string;
  scenario: string;
  mirror: string;
  action: string;
  caution: string;
  confidence: "high" | "medium" | "limited";
  sourceTradition: string;
  sourceReferences: string[];
  affectedByUnknownHour: boolean;
};
```

将十神、日主强弱、格局、调候、喜忌和合冲关系输出为结构化字段；移除任何用输入年份取模产生专业结论的逻辑。`sources.ts` 保存简洁典籍标签，不复制长篇原文。

- [ ] **Step 4: 实现解读规则**

为七个主题各建立可追溯规则，规则输入只读命盘结构，输出固定数据结构。每项至少生成三条差异化判断；例子根据主题选择职场、关系或家庭场景。

- [ ] **Step 5: 运行全部计算测试**

Run: `cd site && pnpm vitest run tests/yi/four-pillars.test.ts tests/yi/interpretation.test.ts`

Expected: PASS；未知时辰用例没有确定性时柱判断。

- [ ] **Step 6: 提交**

```bash
git add site/lib/yi/types.ts site/lib/yi/four-pillars.ts site/lib/yi/interpretation.ts site/lib/yi/sources.ts site/tests/yi/four-pillars.test.ts site/tests/yi/interpretation.test.ts
git commit -m "feat: add traceable professional interpretation engine"
```

### Task 3: 三列滚轮出生信息体验

**Files:**
- Create: `site/components/yi/BirthIntake.tsx`
- Create: `site/components/yi/WheelPicker.tsx`
- Create: `site/components/yi/TimePicker.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/app/globals.css`
- Create: `site/tests/yi/intake-state.test.ts`

**Interfaces:**
- Consumes: `BirthDateSelection`, `TimeMode`, `getWheelOptions()`, `getDualCalendarLabel()`。
- Produces: `BirthSubmission` through `onSubmit(value)`。

- [ ] **Step 1: 写录入状态测试**

```ts
it("accepts unknown hour without a clock value", () => {
  expect(normalizeBirthSubmission({ ...baseInput, timeMode: "unknown", hour: null, minute: null }))
    .toMatchObject({ time: null, timeConfidence: "unknown" });
});

it("keeps date valid when changing from March 31 to April", () => {
  expect(clampWheelDate({ year: 2026, month: 3, day: 31 }, { month: 4 }))
    .toEqual({ year: 2026, month: 4, day: 30 });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm vitest run tests/yi/intake-state.test.ts`

Expected: FAIL because normalization helpers do not exist.

- [ ] **Step 3: 实现滚轮与输入组件**

`WheelPicker` 使用三列 `role="listbox"`，每项使用 `role="option"`、`aria-selected`，通过 CSS scroll snap 居中吸附；弹层提供取消和确认。录入页常驻区域只显示历法切换、日期摘要和时辰摘要，不展示年份、月份或日期网格。

- [ ] **Step 4: 实现三种时辰模式**

精确时间显示小时与分钟滚轮；十二时辰显示十二项及时间范围；不知道时辰一次点击完成，并显示“时柱未定，仍可排盘”。

- [ ] **Step 5: 实现双历核对与首页换行**

确认区同时显示阳历与农历标签。启动页将品牌语写为两个独立行元素：`看见命局` 与 `读懂时运`。

- [ ] **Step 6: 运行输入测试与构建**

Run: `cd site && pnpm vitest run tests/yi/intake-state.test.ts tests/yi/calendar.test.ts && pnpm build`

Expected: tests PASS and production build succeeds.

- [ ] **Step 7: 提交**

```bash
git add site/components/yi/BirthIntake.tsx site/components/yi/WheelPicker.tsx site/components/yi/TimePicker.tsx site/components/yi/YiExperience.tsx site/app/globals.css site/tests/yi/intake-state.test.ts
git commit -m "feat: replace birth grids with accessible wheel intake"
```

### Task 4: 七区人生画像与专业报告

**Files:**
- Create: `site/components/yi/ResultShell.tsx`
- Create: `site/components/yi/PortraitSection.tsx`
- Create: `site/components/yi/ChartSection.tsx`
- Create: `site/components/yi/DetailSection.tsx`
- Create: `site/components/yi/SourceNote.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/app/globals.css`
- Create: `site/tests/yi/result-navigation.test.ts`

**Interfaces:**
- Consumes: `ProfessionalOverview`, `InterpretationItem[]`, `FourPillarsResult`。
- Produces: seven-tab result shell with `activeSection` state。

- [ ] **Step 1: 写分区模型失败测试**

```ts
expect(getResultSections()).toEqual([
  ["portrait", "画像"], ["chart", "命盘"], ["detail", "详批"],
  ["fortune", "大运"], ["mirror", "镜像"], ["compatibility", "合盘"], ["tradition", "传统"],
]);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm vitest run tests/yi/result-navigation.test.ts`

Expected: FAIL because `getResultSections()` is absent.

- [ ] **Step 3: 实现紧凑结果外壳**

建立移动端横向可滑动、桌面端同一行的吸顶导航。切换分区时保留命盘、滚动位置和关系录入状态；卡片不设置无意义的固定最小高度。

- [ ] **Step 4: 实现画像、命盘与详批**

画像展示人格定位、核心特征、内外差异、天赋、压力反应和当前任务。命盘展示四柱、日主、旺衰、五行、十神、格局、调候、喜忌和当前大运。详批的每条判断按七层顺序展开，`SourceNote` 在底部显示理论体系与典籍标签。

- [ ] **Step 5: 运行测试与构建**

Run: `cd site && pnpm vitest run tests/yi/result-navigation.test.ts tests/yi/interpretation.test.ts && pnpm build`

Expected: PASS and build succeeds.

- [ ] **Step 6: 提交**

```bash
git add site/components/yi/ResultShell.tsx site/components/yi/PortraitSection.tsx site/components/yi/ChartSection.tsx site/components/yi/DetailSection.tsx site/components/yi/SourceNote.tsx site/components/yi/YiExperience.tsx site/app/globals.css site/tests/yi/result-navigation.test.ts
git commit -m "feat: build compact seven-section life report"
```

### Task 5: 大运流年、东方镜像、合盘与传统技法

**Files:**
- Create: `site/lib/yi/fortune.ts`
- Create: `site/lib/yi/mirrors.ts`
- Create: `site/lib/yi/compatibility.ts`
- Create: `site/lib/yi/traditions.ts`
- Create: `site/components/yi/FortuneSection.tsx`
- Create: `site/components/yi/MirrorSection.tsx`
- Create: `site/components/yi/CompatibilitySection.tsx`
- Create: `site/components/yi/TraditionSection.tsx`
- Create: `site/tests/yi/fortune-mirrors.test.ts`
- Create: `site/tests/yi/compatibility-traditions.test.ts`

**Interfaces:**
- Produces: `buildFortuneTimeline()`, `matchHistoricalMirror()`, `matchAnimalArchetype()`, `calculateCompatibility()`, `buildTraditionalReadings()`。
- Consumes: one or two structured birth charts。

- [ ] **Step 1: 写领域规则失败测试**

```ts
it("builds selectable decades with yearly readings", () => {
  const timeline = buildFortuneTimeline(knownChart);
  expect(timeline[0]).toMatchObject({ stemBranch: expect.any(String), startYear: expect.any(Number), years: expect.any(Array) });
});

it("explains why a mirror was selected", () => {
  expect(matchAnimalArchetype(knownChart)).toMatchObject({ name: expect.any(String), basis: expect.any(String), pressurePattern: expect.any(String) });
  expect(matchHistoricalMirror(knownChart)).toMatchObject({ person: expect.any(String), dimension: expect.any(String), source: expect.any(String) });
});

it("does not reduce compatibility to a single score", () => {
  const result = calculateCompatibility(knownChart, secondChart, "partner");
  expect(result).not.toHaveProperty("score");
  expect(result).toHaveProperty("communicationScenario");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm vitest run tests/yi/fortune-mirrors.test.ts tests/yi/compatibility-traditions.test.ts`

Expected: FAIL because domain builders do not exist.

- [ ] **Step 3: 实现大运流年与镜像规则**

大运输出干支、十神、起止年龄、起止年份、阶段主题和逐年列表；人物镜像使用本地可审计人物表，包含资料来源与可靠等级；动物原型使用显式命盘特征映射。

- [ ] **Step 4: 实现四类合盘与传统技法**

合盘覆盖伴侣、子女、商业伙伴和朋友，输出五行、十神、合冲刑害、场景与行动规则。传统技法至少输出称骨、生肖与星座的七层解读，并明确与主盘的关系。

- [ ] **Step 5: 实现四个结果分区组件**

大运可点选阶段和年份；镜像展示依据和资料来源；合盘使用第二份完整出生输入；传统技法使用三层展开，不用少量内容填充大卡片。

- [ ] **Step 6: 运行测试与构建**

Run: `cd site && pnpm vitest run tests/yi/fortune-mirrors.test.ts tests/yi/compatibility-traditions.test.ts && pnpm build`

Expected: PASS and build succeeds.

- [ ] **Step 7: 提交**

```bash
git add site/lib/yi/fortune.ts site/lib/yi/mirrors.ts site/lib/yi/compatibility.ts site/lib/yi/traditions.ts site/components/yi/FortuneSection.tsx site/components/yi/MirrorSection.tsx site/components/yi/CompatibilitySection.tsx site/components/yi/TraditionSection.tsx site/tests/yi/fortune-mirrors.test.ts site/tests/yi/compatibility-traditions.test.ts
git commit -m "feat: add fortune mirrors compatibility and traditions"
```

### Task 6: 人生首页与持续使用入口

**Files:**
- Create: `site/lib/yi/life-profile.ts`
- Create: `site/components/yi/LifeHome.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Create: `site/tests/yi/life-profile.test.ts`

**Interfaces:**
- Produces: local `LifeProfile` with annual map, monthly rhythm, events, relations and actions。
- Consumes: calculated report and user-confirmed notes。

- [ ] **Step 1: 写本地档案失败测试**

```ts
it("returns a returning user home without exposing private birth data", () => {
  const home = buildLifeHome(savedProfile, new Date("2026-07-17"));
  expect(home).toMatchObject({ currentStage: expect.any(String), monthlyTheme: expect.any(String), nextAction: expect.any(String) });
  expect(JSON.stringify(home)).not.toContain(savedProfile.birth.location);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd site && pnpm vitest run tests/yi/life-profile.test.ts`

Expected: FAIL because life profile builder does not exist.

- [ ] **Step 3: 实现设备内档案与回访首页**

当前版本只使用 `localStorage` 保存用户主动确认的命盘、关系和事件；提供清除档案入口。再次进入时展示当前阶段、月度主题、关系档案、最近事件和下一步行动，不重新要求排盘。

- [ ] **Step 4: 实现年度、月度、事件和关系入口**

界面展示真实可用的查看、添加和删除操作；不显示尚未实现的云同步、通知或付费状态。

- [ ] **Step 5: 运行测试与构建**

Run: `cd site && pnpm vitest run tests/yi/life-profile.test.ts && pnpm build`

Expected: PASS and build succeeds.

- [ ] **Step 6: 提交**

```bash
git add site/lib/yi/life-profile.ts site/components/yi/LifeHome.tsx site/components/yi/YiExperience.tsx site/tests/yi/life-profile.test.ts
git commit -m "feat: add returning user life home"
```

### Task 7: GitHub Pages 对齐、无障碍与发布验证

**Files:**
- Modify: `docs/index.html`
- Modify: `site/app/globals.css`
- Modify: `site/app/layout.tsx`
- Modify: `site/tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: final Sites content hierarchy and public copy。
- Produces: equivalent static GitHub Pages fallback and validated production build。

- [ ] **Step 1: 扩展渲染验收测试**

```js
assert.match(html, /看见命局/);
assert.match(html, /读懂时运/);
assert.match(html, /阳历/);
assert.match(html, /农历/);
assert.match(html, /不知道时辰/);
assert.match(html, /专业结论/);
assert.match(html, /理论依据/);
assert.doesNotMatch(html, /Demo|演示版|测试版|购买|￥|365元/);
```

- [ ] **Step 2: 运行测试确认静态页不满足新版结构**

Run: `cd site && pnpm test:rendered`

Expected: FAIL on at least one new content assertion.

- [ ] **Step 3: 更新静态备用页与响应式样式**

同步首页换行、滚轮录入摘要、人生画像、专业命盘和七区导航；静态页不得用固定命理样例冒充用户计算结果。检查 360px、390px、768px 与 1440px 布局，无页面级横向溢出。

- [ ] **Step 4: 运行最终验证**

Run: `cd site && pnpm test && pnpm build && pnpm test:rendered`

Expected: all Vitest files pass, production build succeeds, rendered HTML tests pass.

- [ ] **Step 5: 扫描禁用和缺失内容**

Run: `rg -n "Demo|演示版|测试版|购买|￥|365元|南怀瑾|李叔同|倪海厦|东方命理全景推演" site/app site/components site/lib docs/index.html`

Expected: no user-visible matches.

- [ ] **Step 6: 提交**

```bash
git add docs/index.html site/app/globals.css site/app/layout.tsx site/tests/rendered-html.test.mjs
git commit -m "feat: align public yi experience and accessibility"
```

- [ ] **Step 7: 发布并验证两个公网地址**

Push the validated commit to GitHub `master`, publish the exact same commit through Sites, then verify both public URLs return HTTP 200 and contain `开始排盘`, `阳历`, `农历`, `专业结论`, and `理论依据` while excluding all banned copy.

## Plan Self-Review

- Spec coverage: Tasks 1–7 cover calendar input, unknown hour, professional calculation, layered interpretation, seven result sections, fortune, mirrors, compatibility, traditional methods, returning-user value, provenance, responsive layout and publication.
- Scope boundary: face reading and mole reading remain hidden; cloud accounts, push notifications and payment are not exposed because they are not implemented in the current product surface.
- Type consistency: `BirthDateSelection`, `InterpretationItem`, `ProfessionalOverview` and `LifeProfile` are created before their consuming components.
- Professional integrity: tests prohibit random or single-score substitutes and require unknown-hour confidence handling.
