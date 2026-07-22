# Task 5A implementation report

Status: DONE

Commit: `d737a54 fix: harden yi method accuracy`

## TDD evidence

- RED: the new `method-accuracy.test.ts` started with 18 cases, 16 failing and 2 passing. The failures covered the missing explicit day convention/copy, obsolete portrait IDs and fallback, six breaks/four trines, relationship provenance, atlas source labels, fortune translation provenance, and audit fixture/visible-overview gaps.
- GREEN: focused suite 18/18; affected existing suites 10 files / 170 tests; full Vitest 29 files / 434 tests.
- Lint: exit 0.
- Targeted strict TypeScript: exit 0.
- GitHub gate: 5/5, with only the pre-existing non-blocking bundle-size advisory.
- `git diff --check HEAD^ HEAD`: clean.

## Implemented scope

- Explicit `EightChar.setSect(2)` and disclosed 00:00 civil-midnight convention, including a concise 23:00 tradition boundary.
- Distinguished `getYun(gender, 1)` start-age calculation from the day-boundary convention.
- Corrected portrait semantic IDs and removed the silent fallback.
- Added six breaks and complete four-trine detection with exact A/B pillar coordinates and both-chart contribution.
- Reclassified `relation.gan-zhi.v1` as a product-maintained method and limited `三命通会` to contextual background.
- Unified atlas source resolution and separated cultural-model labels from traditional labels.
- Added a versioned product-owned fortune translation source to audit and UI paths.
- Added independent unknown-time/gender fixtures, visible overview auditing, and observation-oriented 30-second labels.

## Cleanup and scope control

- Generated `docs` output restored and temporary npm shim removed.
- Protected untracked `site/pnpm-workspace.yaml` was not staged or committed.
- Task 5B interaction work was not included.

## Review fix

Status: DONE

### Findings addressed

- Corrected the unified boundary for product-maintained methods: `product-method` sources now identify themselves as team-maintained product methods, while `product-heuristic` retains the separate heuristic wording.
- Replaced source-text regex assertions for `EightChar.setSect(2)` and `getYun(gender, 1)` with behavior-level spies that verify arguments and call order at the calculation boundary.
- Added the missing negative compatibility case proving that a trine is not reported when its only completing branch comes from an ambiguous candidate pillar.

### TDD and mutation evidence

- Focused RED after adding the review tests: 1 failed / 19 passed; the product-method boundary still used `产品启发式` wording.
- Controlled mutation RED for the base chart spy: moving `getDayGan()` before `setSect(2)` made the sequencing assertion fail.
- Controlled mutation RED for the fortune spy: changing `getYun(gender, 1)` to `getYun(gender, 2)` made the argument assertion fail.
- Controlled mutation RED for compatibility: allowing ambiguous pillars through the stable-pillar filter made the new trine-negative assertion fail.
- Focused GREEN: 1 file / 20 tests passed.
- Related suites GREEN: 7 files / 132 tests passed.
- Full Vitest GREEN: 29 files / 436 tests passed.
- Lint: exit 0.
- Targeted strict TypeScript: exit 0.
- GitHub gate: production build succeeded and 5/5 Node tests passed; only the known non-blocking bundle-size advisory remained.

### Cleanup and scope control

- Generated `docs` output was restored and the temporary npm shim was removed after the GitHub gate.
- No Task 5B interaction code was touched.
- Protected untracked `site/pnpm-workspace.yaml` remains outside the commit.
