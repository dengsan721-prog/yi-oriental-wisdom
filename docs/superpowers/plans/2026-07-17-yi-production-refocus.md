# 「艺」真实命理使用场景改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refocus both published experiences on a real birth-chart workflow with rapid year selection, data-first results, concise interpretations, and no people/expert or development-status content.

**Architecture:** Extend the existing deterministic Four Pillars kernel with validated date-picker helpers and compact chart-view models. Replace the client experience and GitHub Pages document with the same production flow: brand ritual, birth input, live chart, six domains, fortune timeline, compatibility, and auxiliary calculations.

**Tech Stack:** TypeScript, React, vinext/Vite, Vitest, standalone HTML/CSS/JavaScript for GitHub Pages.

## Global Constraints

- User-facing pages must not contain `Demo`, `演示`, `Beta`, `模拟`, or `测试版`.
- Remove all references to 南怀瑾、李叔同／弘一法师、倪海厦、历史人物镜鉴 and 专家智慧谱系.
- The opening viewport contains only `艺`, `看见命局，读懂时运。`, and `开始排盘`.
- About 70% of the result surface is charts/data and 30% is concise interpretation.
- Year selection supports direct input and decade jumps from 1900 through the current year.
- Unimplemented or unverified modules remain hidden rather than presenting fixed sample results.

---

### Task 1: Test and implement fast date-selection helpers

**Files:**
- Create: `site/lib/yi/date-picker.ts`
- Create: `site/tests/yi/date-picker.test.ts`

**Interfaces:**
- Produces: `getYearGroups(currentYear: number): number[]`, `getDaysInMonth(year: number, month: number): number`, `toEarthlyHour(hour: number): string`.

- [ ] **Step 1: Write failing tests.**

```ts
import { describe, expect, it } from "vitest";
import { getDaysInMonth, getYearGroups, toEarthlyHour } from "../../lib/yi/date-picker";

describe("date picker helpers", () => {
  it("builds decade anchors from 1900 through current year", () => {
    expect(getYearGroups(2026)).toEqual([1900,1910,1920,1930,1940,1950,1960,1970,1980,1990,2000,2010,2020]);
  });
  it("handles leap years", () => {
    expect(getDaysInMonth(2000, 2)).toBe(29);
    expect(getDaysInMonth(1900, 2)).toBe(28);
  });
  it("maps clock time to earthly hours", () => expect(toEarthlyHour(23)).toBe("子时"));
});
```

- [ ] **Step 2: Run `vitest run tests/yi/date-picker.test.ts`; expect module-not-found failure.**

- [ ] **Step 3: Implement the three pure functions with 1900 as the lower year bound and 0–23 hour validation.**

- [ ] **Step 4: Run all unit tests; expect 7 tests passing.**

### Task 2: Replace the React product flow

**Files:**
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/app/globals.css`
- Modify: `site/lib/content/demo.ts`

**Interfaces:**
- Consumes: `calculateFourPillars`, date-picker helpers.
- Produces: stages `intro → intake → calculating → result`, compact six-domain cards, fortune timeline, relationship chart.

- [ ] **Step 1: Reduce the opening viewport to the exact approved brand content.**

- [ ] **Step 2: Replace the native date field with year/month/day controls.**

The year panel includes a direct numeric field, decade chips, and a scrollable year grid; month uses 12 chips; day options derive from `getDaysInMonth`. Time offers clock and earthly-hour views plus `时辰不详`.

- [ ] **Step 3: Make the result first viewport data-first.**

Show Four Pillars, day master, five-element bars, ten-god distribution, structure, favorable element, current fortune, and one short summary before any narrative text.

- [ ] **Step 4: Replace long sections with six compact domain cards and one horizontal fortune timeline.**

- [ ] **Step 5: Retain four relationship types with element complement, ten-god relation, clash/harmony, communication rhythm, and one action; no score.**

- [ ] **Step 6: Hide photo, Zi Wei, expert graph, and historical-mirror surfaces. Keep only real bone-weight/zodiac auxiliary outputs when derived from input.**

- [ ] **Step 7: Search user-visible source for banned names/status terms and remove every match except test assertions.**

### Task 3: Replace the GitHub Pages production experience

**Files:**
- Modify: `docs/index.html`

**Interfaces:**
- Produces the same brand/input/result flow without redirecting to another domain.

- [ ] **Step 1: Replace the page with a standalone responsive production surface.**

- [ ] **Step 2: Implement direct year input, decade jumps, month/day selection, time selection, and input-derived zodiac/hour/chart values in browser JavaScript.**

- [ ] **Step 3: Ensure no fixed example result is presented as the user's result.**

- [ ] **Step 4: Verify viewport metadata, 44px touch targets, no horizontal overflow styles, and zero banned terms.**

### Task 4: Verify and republish both addresses

**Files:**
- Modify only generated hosting metadata if required.

- [ ] **Step 1: Run `vitest run` and `vinext build`; require zero failures.**

- [ ] **Step 2: Run exact content scans for removed people and development-status language across user-visible files; require zero matches.**

- [ ] **Step 3: Commit and push `master` to GitHub.**

- [ ] **Step 4: Save and deploy a new public Sites version.**

- [ ] **Step 5: Poll GitHub Pages and the Sites URL until both return HTTP 200 and contain the revised title and opening copy.**
