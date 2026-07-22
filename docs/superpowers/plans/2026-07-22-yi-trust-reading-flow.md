# Yi Trust and Reading Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Every task uses strict TDD and receives a fresh read-only review before the next task starts.

**Goal:** Close the expert-review blockers in birth-data trust, relationship discoverability and role clarity, then make the rich report readable in five-second, thirty-second, three-minute and source-depth layers.

**Architecture:** Keep all existing calculations and content corpora. Add small view-state helpers at the owning component, present already-computed report facts in the result header, map relationship participants at the UI boundary, and progressively disclose the existing long-form material without deleting it. Product-language cleanup changes only user-visible copy, not calculation identifiers.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 4, Vite 8, existing hash router and CSS system.

## Global Constraints

- The first visible layer is `专业叫法 + 一句白话 + 一个场景 + 一个动作`; deeper theory remains available by deliberate expansion.
- Never submit the seeded picker date or time until the user explicitly confirms both; choosing `不知道时辰` counts as one explicit time confirmation.
- The first release calculates only birth clock times that already use China Standard Time (`UTC+8`). Birth address is record-only and does not trigger timezone, longitude or true-solar-time conversion.
- Unknown time never creates a time pillar or exact fortune timeline, and the result header must state which outputs are closed.
- Parent-child compatibility must state which person is the caregiver and which is the child before calculation copy is shown.
- Keep all 21 interpretation items, all 9 compatibility axes and all 7 atlas translation layers; use progressive disclosure instead of deletion.
- Preserve the existing single `艺` brand, local Zhongshan seal font, five outward gold rings and no-upload atlas boundary.
- No `Demo`, `演示`, `Beta`, `模拟`, `测试版`, deterministic outcome, fear, medical diagnosis or image-based moral judgment in user-visible copy.
- Do not stage or commit `site/pnpm-workspace.yaml`, temporary shims or incidental generated `docs` changes.

---

### Task 1: Birth Data Trust Contract

**Files:**

- Modify: `site/components/yi/BirthIntake.tsx`
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/app/globals.css`
- Test: `site/tests/yi/intake-state.test.ts`
- Test: `site/tests/yi/result-navigation.test.ts`
- Test: `site/tests/yi/report-model.test.ts`

**Interfaces:**

- `BirthIntake` keeps `onSubmit` and adds optional `heading?: string`.
- Export `type BirthConfirmationState = { date: boolean; time: boolean }` and `isBirthSubmissionReady(state): boolean` from `BirthIntake.tsx`.
- `ResultShell` keeps existing callbacks; it renders compact facts from `report.birthFacts` and `birth` without recomputation.

- [ ] **Step 1: Write failing trust-contract tests**

```ts
expect(isBirthSubmissionReady({ date: false, time: false })).toBe(false);
expect(isBirthSubmissionReady({ date: true, time: false })).toBe(false);
expect(isBirthSubmissionReady({ date: true, time: true })).toBe(true);

const html = renderToStaticMarkup(createElement(BirthIntake, { onSubmit: () => {} }));
expect(html).toContain("请选择出生日期");
expect(html).toContain("请选择时辰，或选择不知道时辰");
expect(html).toMatch(/<button[^>]+type="submit"[^>]+disabled/);
expect(html).toContain("仅支持中国标准时间（UTC+8）");
expect(html).toContain("出生地址只作记录");
```

Add a static `ResultShell` rendering assertion for `本次采用`, solar date/time, location, `UTC+8`, `修改出生资料`, and the unknown-time closed-output sentence.

- [ ] **Step 2: Run the new focused tests and record RED**

Run: `pnpm exec vitest run tests/yi/intake-state.test.ts tests/yi/result-navigation.test.ts tests/yi/report-model.test.ts`

Expected: fail because confirmation state, disabled submit, UTC+8 intake boundary and result-header facts do not yet exist.

- [ ] **Step 3: Implement explicit confirmation state**

Use picker seed values only inside the picker. Initial summaries read as unconfirmed and the submit button stays disabled. Date becomes confirmed only after the date sheet's `确认`; exact/twelve-period time becomes confirmed only after the time sheet's `确认`; `不知道时辰` confirms time immediately and clears all time coordinates.

```ts
export type BirthConfirmationState = { date: boolean; time: boolean };
export function isBirthSubmissionReady(state: BirthConfirmationState) {
  return state.date && state.time;
}
```

Keep name, address and gender optional. Add one concise intake boundary: `当前仅支持出生地当时采用中国标准时间（UTC+8）的钟表时间；出生地址只作报告记录，暂不换算海外时区或真太阳时。`

- [ ] **Step 4: Render the adopted birth facts in the report header**

Show `本次采用` followed by the report's solar date/time, time-confidence label, location and `UTC+8`. For unknown time add: `已关闭：时柱、时柱派生判断与精确大运年份。` Rename the restart action to `修改出生资料`.

- [ ] **Step 5: Run focused tests, lint and strict TypeScript**

Expected: focused tests pass, ESLint exits 0, and changed files plus direct consumers pass the existing strict TypeScript flags.

- [ ] **Step 6: Commit**

```bash
git add site/components/yi/BirthIntake.tsx site/components/yi/ResultShell.tsx site/app/globals.css site/tests/yi/intake-state.test.ts site/tests/yi/result-navigation.test.ts site/tests/yi/report-model.test.ts
git commit -m "fix: require confirmed birth coordinates"
```

---

### Task 2: Discoverable Compatibility and Parent-Child Roles

**Files:**

- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/components/yi/CompatibilitySection.tsx`
- Modify: `site/app/globals.css`
- Test: `site/tests/yi/result-navigation.test.ts`
- Test: `site/tests/yi/experience-copy.test.ts`

**Interfaces:**

- Export `type ParentChildPrimaryRole = "caregiver" | "child"`.
- `ResultShellState.compatibility` adds `primaryParentRole` with default `caregiver` and a reducer action `set-parent-child-primary-role`.
- Export `getCompatibilityParticipants(primaryName, secondName, relationship, primaryParentRole)` returning `{ first: string; second: string }`.
- `CompatibilitySection` accepts the primary name and role choice, and emits `onParentChildPrimaryRoleChange`.

- [ ] **Step 1: Write failing order, role and language tests**

```ts
expect(getResultSections().map(([id]) => id)).toEqual([
  "portrait", "chart", "detail", "fortune", "compatibility", "mirror", "tradition",
]);

expect(getCompatibilityParticipants("顾临川", "小满", "parent-child", "caregiver"))
  .toEqual({ first: "顾临川（照顾者）", second: "小满（孩子）" });
expect(getCompatibilityParticipants("顾临川", "小满", "parent-child", "child"))
  .toEqual({ first: "顾临川（孩子）", second: "小满（照顾者）" });
```

Render parent-child compatibility and assert two pressed-state role buttons, a visible `A方/B方` legend with names and roles, and no unexplained `A先`/`B先` in the first visible action layer.

- [ ] **Step 2: Run focused tests and record RED**

Run: `pnpm exec vitest run tests/yi/result-navigation.test.ts tests/yi/experience-copy.test.ts`

Expected: fail because compatibility is sixth, the reducer lacks the role, and participant labels are absent.

- [ ] **Step 3: Make all seven destinations visible without hidden horizontal navigation**

On mobile render four primary destinations in row one (`画像/命盘/详批/大运`) and three extended destinations in row two (`合盘/镜像/传统`). On desktop the same semantic nav may occupy one row. Preserve 44px minimum targets, sticky behavior and current-section state. Do not add a separate menu or new route.

- [ ] **Step 4: Add parent-child role mapping at the view boundary**

When `亲子` is selected, show `报告主人是照顾者 / 报告主人是孩子`. Default to caregiver. Before the manual show the exact participant legend. Replace view-layer A/B markers in visible axis/action/evidence strings with the named role labels; keep calculation coordinates unchanged internally.

Pass `heading="录入对方出生坐标"` to the nested `BirthIntake`.

- [ ] **Step 5: Run focused tests, lint, strict TypeScript and a 390×844 browser check**

Browser evidence must show all seven destinations, no horizontal overflow, both parent-child role choices, and role-labelled output after submitting a second birth.

- [ ] **Step 6: Commit**

```bash
git add site/components/yi/ResultShell.tsx site/components/yi/CompatibilitySection.tsx site/app/globals.css site/tests/yi/result-navigation.test.ts site/tests/yi/experience-copy.test.ts
git commit -m "feat: clarify relationship roles and navigation"
```

---

### Task 3: Four-Layer Reading Hierarchy

**Files:**

- Modify: `site/lib/yi/report-copy.ts`
- Modify: `site/components/yi/PortraitSection.tsx`
- Modify: `site/components/yi/ChartSection.tsx`
- Modify: `site/components/yi/DetailSection.tsx`
- Modify: `site/components/yi/CompatibilitySection.tsx`
- Modify: `site/components/yi/ReferenceAtlasSection.tsx`
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/app/globals.css`
- Test: `site/tests/yi/portrait-view.test.ts`
- Test: `site/tests/yi/experience-copy.test.ts`
- Test: `site/tests/yi/interpretation.test.ts`
- Test: `site/tests/yi/traditional-atlas.test.ts`
- Test: `site/tests/yi/source-note.test.ts`

**Interfaces:**

- Export `buildFiveSecondPortrait(chart): { professional: string; plain: string; scene: string; action: string }` from `report-copy.ts`.
- Export `selectDetailHighlights(items): InterpretationItem[]`; return exactly three distinct items while all remaining items stay available once in domain groups.
- Export `selectCompatibilityHighlights(relationship, axes)`; return exactly three relationship-specific axes and leave the other six in a closed details block.

- [ ] **Step 1: Write failing personalization and disclosure tests**

Use two distinct chart fixtures and assert the five-second output differs, contains each chart's day-master/element anchor, and contains non-empty plain, scene and action fields. Render each target component and assert:

- portrait lead owns `专业锚点 → 白话 → 场景 → 现在可做`; full feature/data/mirror material is inside closed details;
- the 30-second chart layer shows one advantage, one tension and one action before the nested `继续看完整线索` details;
- exactly three detail highlights are initially visible, with the other 18 items available once in closed domain details;
- exactly three relationship axes are initially visible, with the other six available once in closed details;
- atlas initially shows the first three translation layers and keeps the remaining four in closed details;
- `SourceNote` appears for portrait, chart and detail; fortune, compatibility, mirror and atlas retain their own source-depth entry.

- [ ] **Step 2: Run focused tests and record RED**

Run: `pnpm exec vitest run tests/yi/portrait-view.test.ts tests/yi/experience-copy.test.ts tests/yi/interpretation.test.ts tests/yi/traditional-atlas.test.ts tests/yi/source-note.test.ts`

Expected: fail on static portrait lead, expanded card counts and missing cross-module source-depth paths.

- [ ] **Step 3: Build an original chart-specific five-second portrait**

Use five day-element metaphors and three structure-balance operating modes to produce 15 combinations. Anchor the professional line in the real day master and support/output structure. Keep the metaphor observational and the action small and reversible; do not claim fixed personality or outcomes.

- [ ] **Step 4: Apply progressive disclosure without deleting content**

Implement the exact visible/deep counts from Step 1. All existing content remains reachable and appears once. Closed `<details>` elements must have descriptive summaries and 44px targets.

- [ ] **Step 5: Normalize source-depth entry points**

Use the existing `SourceNote` for portrait/chart/detail. Fortune and atlas keep the Task 5A source lists. Compatibility adds a closed source block containing the calculation, relation, contextual-classic and product-translation records already used by the module. Do not add new source claims.

- [ ] **Step 6: Run focused tests, full Vitest, lint, strict TypeScript and mobile/desktop browser checks**

Browser checks at 390×844 and 1440×900 must prove the first viewport contains the five-second judgment, scene and action before theory; every deep layer opens; no content is lost; no horizontal overflow appears.

- [ ] **Step 7: Commit**

```bash
git add site/lib/yi/report-copy.ts site/components/yi/PortraitSection.tsx site/components/yi/ChartSection.tsx site/components/yi/DetailSection.tsx site/components/yi/CompatibilitySection.tsx site/components/yi/ReferenceAtlasSection.tsx site/components/yi/ResultShell.tsx site/app/globals.css site/tests/yi
git commit -m "feat: stage yi report reading depth"
```

---

### Task 4: Public-Facing Language Cleanup

**Files:**

- Modify only user-visible string owners under `site/components/yi` and `site/lib/yi`
- Modify affected expectations under `site/tests/yi`
- Test: `site/tests/yi/content-audit.test.ts`

**Interfaces:**

- Calculation identifiers and type names stay unchanged.
- The visible-copy audit rejects unexplained internal product terms: `产品计分`, `稳定柱`, `代表坐标`, `协作接口`.

- [ ] **Step 1: Add a failing visible-copy language guard**

Audit rendered/audited user copy, not variable names or developer documentation. Assert no public field contains the four internal terms.

- [ ] **Step 2: Run the content audit and record RED**

Run: `pnpm exec vitest run tests/yi/content-audit.test.ts`

Expected: fail with exact module/item/field locations.

- [ ] **Step 3: Replace internal product language at its owning copy source**

Use these meanings consistently:

- `产品计分` → `结构参考值`, immediately explained as a product observation rather than classical 旺衰;
- `稳定柱` → `已确认柱位`;
- `代表坐标` → `核对用候选干支`;
- `协作接口` → `可执行的配合方式`.

Preserve genuine professional terms such as 日主、月令、透干、根气、十神、合冲刑害破、三合 and 调候.

- [ ] **Step 4: Run the focused audit, full gate and diff check**

Run: full Vitest, lint, strict TypeScript, GitHub gate and `git diff --check`. Restore generated `docs` and remove the temporary npm shim after the gate.

- [ ] **Step 5: Commit**

```bash
git add site/components/yi site/lib/yi site/tests/yi
git commit -m "fix: translate internal yi product language"
```

---

## Final task acceptance

- 390×844 and 1440×900: no horizontal overflow; all primary actions at least 44px.
- Birth submission cannot occur until date and time/unknown-time are explicitly confirmed.
- Report header exposes adopted birth facts, UTC+8, location role and unknown-time closures.
- All seven report destinations are visible; compatibility precedes auxiliary mirrors.
- Parent-child output names the caregiver and child.
- Five-second, thirty-second, three-minute and source-depth paths are visibly distinct.
- All existing rich content remains reachable exactly once in its module.
- Full quality gate and public-source audit pass before Task 6 publishing.
