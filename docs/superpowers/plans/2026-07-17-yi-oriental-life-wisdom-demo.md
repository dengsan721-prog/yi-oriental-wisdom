# 「艺｜东方人生智慧」Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a responsive single-page Demo that calculates a real foundational Four Pillars chart and presents a premium, accessible Oriental life-wisdom experience.

**Architecture:** Use the Sites vinext starter with a client-rendered single route. Keep deterministic calendrical/domain rules in `lib/yi`, product copy and demo fixtures in `lib/content`, and focused React sections under `components/yi`; `app/page.tsx` only composes the experience. Persistence, authentication, real face recognition, and complete Zi Wei calculation remain outside the first Demo.

**Tech Stack:** TypeScript, React, vinext/Vite, CSS, Vitest, Cloudflare Sites.

## Global Constraints

- Brand mark is only `艺`; `东方人生智慧` is a separate subtitle.
- Visual direction is premium future-Oriental: deep blue-black, restrained warm gold, generous whitespace, subtle glass layers.
- Four Pillars is the primary model; Zi Wei is an independently labeled Beta demonstration.
- Show innovative and professional names together, with three view modes: plain, professional, dual.
- Do not output deterministic fate claims, fear-based copy, blame labels, or a single compatibility score.
- Face and mole reading is an upload simulation and must state that the Demo does not retain the photo.
- All important interpretations expose professional basis, plain story, reality check, action, and counter-condition.
- Support desktop/mobile, keyboard interaction, touch, and `prefers-reduced-motion`.

## File Structure

- `app/page.tsx`: compose the single-page experience and hold top-level demo state.
- `app/layout.tsx`: finished metadata and social metadata.
- `app/globals.css`: tokens, responsive layout, motion, and section/component styling.
- `components/yi/BrandHero.tsx`: brand, promise, and primary/relationship entry actions.
- `components/yi/BirthDataSheet.tsx`: validated birth-data form and confidence controls.
- `components/yi/CalculationRitual.tsx`: staged calculation transition.
- `components/yi/LifeWisdomDashboard.tsx`: first-result summary and terminology modes.
- `components/yi/ProfessionalChart.tsx`: Four Pillars evidence table.
- `components/yi/RelationshipWisdom.tsx`: four relationship types and five-dimensional output.
- `components/yi/FaceWisdomDemo.tsx`: local preview and simulated, non-retained interpretation.
- `components/yi/WisdomSections.tsx`: rhythm, historical mirror, Zi Wei Beta, and action plan.
- `lib/yi/types.ts`: shared input/output contracts.
- `lib/yi/stems-branches.ts`: deterministic stem/branch and five-element mappings.
- `lib/yi/four-pillars.ts`: Demo-grade foundational Four Pillars calculation.
- `lib/yi/interpret.ts`: deterministic structured narrative selection.
- `lib/content/demo.ts`: traceable demo copy, relationship scenarios, historical-mirror fixtures.
- `tests/yi/four-pillars.test.ts`: fixed-vector domain tests.
- `tests/yi/interpret.test.ts`: narrative contract and safety-language tests.

---

### Task 1: Initialize the Sites project and build the tested domain kernel

**Files:**
- Create through Sites initializer: `package.json`, `.openai/hosting.json`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- Create: `lib/yi/types.ts`
- Create: `lib/yi/stems-branches.ts`
- Create: `lib/yi/four-pillars.ts`
- Create: `tests/yi/four-pillars.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `BirthInput`, `Pillar`, `FourPillarsResult`, `calculateFourPillars(input: BirthInput): FourPillarsResult`.

- [ ] **Step 1: Initialize the current project with the Sites starter and keep its package manager and hosting configuration.**

Run the Sites root initializer with the workspace root as target. Start the development server in a retained session and open its exact printed local URL once.

- [ ] **Step 2: Add the test script and Vitest dependency.**

```json
{
  "scripts": { "test": "vitest run" },
  "devDependencies": { "vitest": "latest" }
}
```

Run: `pnpm install`
Expected: lockfile updates without dependency errors.

- [ ] **Step 3: Define exact domain contracts in `lib/yi/types.ts`.**

```ts
export type BirthInput = {
  name: string;
  date: string;
  time: string | null;
  location: string;
  gender: "female" | "male" | "unspecified";
  timeConfidence: "exact" | "approximate" | "unknown";
};
export type Pillar = { stem: string; branch: string; element: string; label: string };
export type FourPillarsResult = {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  elementCounts: Record<"木" | "火" | "土" | "金" | "水", number>;
  confidence: "high" | "medium" | "limited";
  disclaimer: string;
};
```

- [ ] **Step 4: Write failing fixed-vector tests in `tests/yi/four-pillars.test.ts`.**

```ts
import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";

describe("calculateFourPillars", () => {
  it("returns stable stems, branches, element totals and high confidence", () => {
    const result = calculateFourPillars({
      name: "林知远", date: "1990-06-15", time: "09:30",
      location: "杭州", gender: "unspecified", timeConfidence: "exact"
    });
    expect(Object.keys(result.pillars)).toEqual(["year", "month", "day", "hour"]);
    expect(Object.values(result.elementCounts).reduce((a, b) => a + b, 0)).toBe(8);
    expect(result.confidence).toBe("high");
  });
  it("omits the hour pillar and lowers confidence when time is unknown", () => {
    const result = calculateFourPillars({
      name: "林知远", date: "1990-06-15", time: null,
      location: "杭州", gender: "unspecified", timeConfidence: "unknown"
    });
    expect(result.pillars.hour).toBeNull();
    expect(result.confidence).toBe("limited");
  });
});
```

- [ ] **Step 5: Run tests to verify failure.**

Run: `pnpm test -- tests/yi/four-pillars.test.ts`
Expected: FAIL because `calculateFourPillars` does not exist.

- [ ] **Step 6: Implement mappings and deterministic foundational calculation.**

`lib/yi/stems-branches.ts` exports immutable stem, branch, element, and hour tables. `lib/yi/four-pillars.ts` validates the ISO date, derives year/month/day/hour cycles deterministically, returns `hour: null` for unknown time, and includes this exact disclaimer: `传统文化体验与自我观察参考，不作为重大人生决策依据。`

- [ ] **Step 7: Run the domain tests.**

Run: `pnpm test -- tests/yi/four-pillars.test.ts`
Expected: 2 tests PASS.

- [ ] **Step 8: Commit the domain kernel.**

```bash
git add package.json pnpm-lock.yaml .openai app lib/yi tests/yi
git commit -m "feat: add foundational four pillars kernel"
```

### Task 2: Add safe structured interpretation and traceable demo content

**Files:**
- Create: `lib/yi/interpret.ts`
- Create: `lib/content/demo.ts`
- Create: `tests/yi/interpret.test.ts`

**Interfaces:**
- Consumes: `FourPillarsResult`.
- Produces: `InterpretationCard`, `buildInterpretation(result: FourPillarsResult): InterpretationCard[]`, `relationshipFixtures`, `historicalMirrors`, `actionPlan`.

- [ ] **Step 1: Write the interpretation contract tests.**

```ts
import { describe, expect, it } from "vitest";
import { buildInterpretation } from "../../lib/yi/interpret";
import type { FourPillarsResult } from "../../lib/yi/types";

const fixture = { confidence: "high", disclaimer: "文化参考", pillars: {}, elementCounts: { 木: 2, 火: 2, 土: 2, 金: 1, 水: 1 } } as unknown as FourPillarsResult;
describe("buildInterpretation", () => {
  it("provides all five explanation layers", () => {
    const card = buildInterpretation(fixture)[0];
    expect(card).toMatchObject({ professionalBasis: expect.any(String), story: expect.any(String), realityCheck: expect.any(String), action: expect.any(String), counterCondition: expect.any(String) });
  });
  it("contains no deterministic or blame language", () => {
    expect(JSON.stringify(buildInterpretation(fixture))).not.toMatch(/注定|必然|克夫|克妻|克子|必有一劫/);
  });
});
```

- [ ] **Step 2: Run the tests and confirm failure.**

Run: `pnpm test -- tests/yi/interpret.test.ts`
Expected: FAIL because the interpretation module does not exist.

- [ ] **Step 3: Implement the exact card type and deterministic selection.**

```ts
export type InterpretationCard = {
  id: string;
  innovationName: string;
  professionalName: string;
  professionalBasis: string;
  story: string;
  realityCheck: string;
  action: string;
  counterCondition: string;
};
```

Select copy from the dominant and supporting element counts; never call an external model. Fixtures must label historical figures as `人生主题相似` and Zi Wei content as `Beta 演示，不参与本次四柱主结论`.

- [ ] **Step 4: Run all tests.**

Run: `pnpm test`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit the content kernel.**

```bash
git add lib/content lib/yi/interpret.ts tests/yi/interpret.test.ts
git commit -m "feat: add safe life wisdom interpretation"
```

### Task 3: Build the brand, intake, ritual, and first-result experience

**Files:**
- Create: `components/yi/BrandHero.tsx`
- Create: `components/yi/BirthDataSheet.tsx`
- Create: `components/yi/CalculationRitual.tsx`
- Create: `components/yi/LifeWisdomDashboard.tsx`
- Create: `components/yi/ProfessionalChart.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `BirthInput`, `FourPillarsResult`, `InterpretationCard[]`.
- Produces: user-driven state transitions `intro → intake → calculating → result` and terminology mode `plain | professional | dual`.

- [ ] **Step 1: Replace the starter skeleton and compose focused components.**

`app/page.tsx` owns only `stage`, `birthInput`, `result`, and `terminologyMode`. Remove `app/_sites-preview` and its imports. Remove `react-loading-skeleton` if unused.

- [ ] **Step 2: Implement the birth form validation.**

Require name, ISO date, location, gender, and time-confidence. Time is required only for `exact` or `approximate`. Validation messages are rendered next to fields and focus moves to the first invalid field.

- [ ] **Step 3: Implement the calculation ritual.**

Display these stages in order: `时间校准｜真太阳时`, `先天结构｜四柱八字`, `生命禀赋｜五行旺衰`, `人生驱动力｜十神`, `时运节律｜大运流年`, `多模型会审｜现实印证`. Reduced-motion users receive immediate textual progression without animated transforms.

- [ ] **Step 4: Implement the first-result dashboard.**

Show current life rhythm, three drivers, one opportunity, one caution variable, and one action. Add an accessible three-way terminology switch and a disclosure for professional evidence.

- [ ] **Step 5: Style the full first viewport and responsive foundation.**

Use CSS custom properties `--ink:#071019`, `--ink-2:#0d1a26`, `--gold:#cbb27a`, `--mist:#d8e7eb`, `--text:#f4f1e8`. Use fluid type with `clamp`, 44px minimum interactive targets, visible focus rings, and a 760px mobile breakpoint.

- [ ] **Step 6: Run tests and production build.**

Run: `pnpm test && pnpm build`
Expected: all tests PASS and build exits 0.

- [ ] **Step 7: Commit the primary experience.**

```bash
git add app components/yi
git commit -m "feat: build yi life wisdom primary experience"
```

### Task 4: Add relationship wisdom, face demo, mirrors, and action planning

**Files:**
- Create: `components/yi/RelationshipWisdom.tsx`
- Create: `components/yi/FaceWisdomDemo.tsx`
- Create: `components/yi/WisdomSections.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `relationshipFixtures`, `historicalMirrors`, `actionPlan`.
- Produces: four relationship modes, local image preview, Zi Wei Beta disclosure, and 7/30/90-day plans.

- [ ] **Step 1: Implement relationship wisdom without a score.**

Provide `伴侣／婚姻`, `亲子`, `商业伙伴`, and `朋友` tabs. Each output shows `吸引与认同`, `沟通节奏`, `冲突触发`, `资源互补`, and `长期协作`, followed by a replacement phrase and a next action.

- [ ] **Step 2: Implement the photo simulation.**

Accept `image/jpeg`, `image/png`, and `image/webp` up to 8 MB. Use `URL.createObjectURL` only for local preview, revoke it on replacement/unmount, and display: `Demo 仅在本机预览照片，不上传、不保存；结果为模拟文化解读。`

- [ ] **Step 3: Implement wisdom sections.**

Add life rhythm, Zi Wei Beta, historical mirror, animal/nature archetype, bone-weight reference, and 7/30/90-day action cards. Every auxiliary technique is visibly labeled `辅助参照，不覆盖四柱主结论`.

- [ ] **Step 4: Verify keyboard and responsive behavior through component logic and build.**

Run: `pnpm test && pnpm build`
Expected: all tests PASS and build exits 0.

- [ ] **Step 5: Commit the expanded experience.**

```bash
git add app components/yi lib/content
git commit -m "feat: add relationship and wisdom modules"
```

### Task 5: Finish metadata, bespoke social card, validation, and hosting

**Files:**
- Modify: `app/layout.tsx`
- Create: `public/og.png` only if the generated card passes text inspection
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: final brand palette, headline, and product motifs.
- Produces: finished build and hosted Sites URL.

- [ ] **Step 1: Replace all starter metadata.**

Set title to `艺｜东方人生智慧`, description to `把深奥命理转化为看得懂的人生故事、关系洞察与顺势行动。`, and remove the temporary `codex-preview` marker.

- [ ] **Step 2: Generate exactly one cohesive landscape social card.**

The image must use the single `艺` mark, the subtitle `东方人生智慧`, the deep-blue/gold palette, and restrained time/five-element light rings. Inspect all Chinese text. Retry once only if unusable; omit `og:image` if no card passes.

- [ ] **Step 3: Run final verification.**

Run: `pnpm test && pnpm build && git status --short`
Expected: all tests PASS, build exits 0, and only intentional generated/metadata changes remain.

- [ ] **Step 4: Commit the release candidate.**

```bash
git add app public package.json pnpm-lock.yaml
git commit -m "chore: prepare yi demo for release"
```

- [ ] **Step 5: Publish with Sites hosting and return the deployed URL.**

Expected: deployment succeeds and the public/private Sites URL loads the finished single-page Demo.
