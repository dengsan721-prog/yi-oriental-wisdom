# Yi Lishu Mark and Result Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace the central “艺” with a legally shippable, device-independent lishu vector while retaining all five breathing rings, then move the result actions below the adopted birth facts without changing the save workflow.

**Architecture:** Keep the existing `Mark` and `ResultShell` boundaries. Render the lishu outline as inline SVG so desktop and mobile share the exact glyph, document its source and license beside the public assets, and move only the existing result action triggers while leaving modal, storage, error, and routing logic intact.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vinext, Vite, GitHub Pages.

## Global Constraints

- Work only in the existing `feature/yi-content-engine-rebuild` worktree.
- Never edit, stage, or commit the untracked `site/pnpm-workspace.yaml`.
- Preserve the five gold outward breathing rings and reduced-motion behavior.
- Do not depend on a system-installed lishu font.
- Record the glyph source, license, U+827A coverage, and reproducible integrity evidence.
- Do not alter the save confirmation dialog, focus restoration, storage failure handling, or successful navigation.
- Treat browser and deployment checks as fresh release evidence; historical test results are not release proof.

---

### Task 1: Lock the homepage glyph contract with a failing test

**Files:**
- Modify: `site/tests/yi/intro-first-frame.test.ts`
- Modify: `site/tests/github-build.test.mjs`

**Step 1: Write the failing test**

Assert that the central mark contains an accessible inline lishu SVG for U+827A, keeps exactly five breathing rings, has no Zhongshan/system-font runtime dependency, and has source/license/coverage audit records.

**Step 2: Run the focused test and verify RED**

Run: `pnpm exec vitest run tests/yi/intro-first-frame.test.ts`

Expected: FAIL because the old glyph is still a font-backed text span and the new audit artifacts do not exist.

### Task 2: Implement the stable lishu vector

**Files:**
- Create: `site/components/yi/YiLishuGlyph.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/app/globals.css`
- Modify: `site/public/fonts/README.md`
- Create: `site/public/fonts/yi-lishu-source-audit.json`
- Create: `site/public/fonts/OFL-1.1.rtf`
- Remove: `site/public/fonts/OFL.txt`
- Remove: `site/public/fonts/JFZSKSealScript_V3.5.ttf`

**Step 1: Add the minimal implementation**

Render the audited U+827A outline as inline SVG, use the existing mark container and five rings unchanged, and style the SVG without `@font-face` or a system font fallback.

**Step 2: Document provenance**

Record the upstream release URL/version, SIL OFL text, upstream archive SHA-256, exact U+827A coverage result, generation parameters, and final outline integrity value.

**Step 3: Run the focused test and verify GREEN**

Run: `pnpm exec vitest run tests/yi/intro-first-frame.test.ts`

Expected: PASS, including the unchanged five-ring assertions.

### Task 3: Lock the result action placement with a failing test

**Files:**
- Modify: `site/tests/yi/result-navigation.test.ts`

**Step 1: Write the failing test**

Assert there are no actions in the title row, the new independent action area follows the adopted-facts strip, the primary label is `保存并进入人生首页`, the secondary label is `修改出生资料`, and `保存到本机` is absent. Assert the existing modal trigger, callback, focus restoration, error route, and mobile no-overflow rules remain connected.

**Step 2: Run the focused test and verify RED**

Run: `pnpm exec vitest run tests/yi/result-navigation.test.ts`

Expected: FAIL against the old top-right action group.

### Task 4: Move the existing result triggers

**Files:**
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/app/globals.css`

**Step 1: Add the independent action area**

Move only the two trigger buttons below the adopted-facts strip. Keep the primary trigger ref and click handler attached to the renamed primary button.

**Step 2: Add compact responsive styling**

Make the actions discoverable but visually subordinate to the report title, give both buttons comfortable touch targets, stack them at narrow widths, and remove stale title-row button selectors.

**Step 3: Run focused behavior tests and verify GREEN**

Run: `pnpm exec vitest run tests/yi/result-navigation.test.ts tests/yi/life-profile.test.ts tests/yi/hash-router.test.ts`

Expected: PASS.

### Task 5: Regenerate and verify release artifacts

**Files:**
- Modify generated files under: `docs/`
- Remove obsolete generated Zhongshan font assets under: `docs/fonts/`

**Step 1: Run all automated gates**

Run, independently:

- `pnpm test`
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`
- `pnpm test:github`

Expected: every command exits 0; GitHub artifact tests confirm the new glyph provenance files and no obsolete font dependency.

**Step 2: Browser QA**

Inspect the production build at desktop size and 390 px. Verify the same lishu SVG is visible, five rings remain, the result actions follow the facts strip, buttons are easy to tap, horizontal overflow is absent, modal focus restores to the renamed primary button, and the console has no errors.

### Task 6: Publish and verify GitHub Pages

**Files:**
- No additional source files unless verification exposes a scoped defect.

**Step 1: Audit the diff**

Verify every changed file traces to this request, `site/pnpm-workspace.yaml` remains unmodified/untracked, and no unrelated file is staged.

**Step 2: Commit and push**

Commit only the audited files and push the release to the GitHub Pages source branch.

**Step 3: Verify the public deployment**

Open `https://dengsan721-prog.github.io/yi-oriental-wisdom/` from the deployed network path, repeat the desktop and 390 px smoke checks, verify no console errors, and report the exact commit and public URL.
