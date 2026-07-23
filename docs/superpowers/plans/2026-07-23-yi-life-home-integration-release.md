# Yi Life Home, Integration, and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the saved-life homepage a truthful achievement dashboard led by recording an event or relationship, activate the final four-chapter result flow and three folk entries, remove the legacy detail/source UI, verify the complete experience at desktop and 390px, and publish the verified commit to GitHub Pages.

**Architecture:** Migrate the existing version-1 local profile to a minimal version-2 shape that records only explicit monthly/annual review completion facts; derive every dashboard value and milestone from that stored state. Keep event and relationship capture as the two core actions beneath the truthful dashboard, and keep monthly/annual review as secondary navigation. Integrate the already-built theme, name, story, chart, fortune, and folk projections in one atomic hash-route switch. Release from a clean tracked export, commit deterministic GitHub build artifacts, push without force, verify the Pages Actions run, and perform online browser acceptance.

**Tech Stack:** React 19, TypeScript, Vitest, vinext, Vite GitHub build, ESLint, Git, GitHub Pages, in-app browser automation.

## Global Constraints

- This is implementation sequence 4 of 4. Start only after the foundation, name, and story-report focused suites pass.
- Work on `feature/yi-content-engine-rebuild` in the existing worktree.
- Never edit, delete, stage, or commit `site/pnpm-workspace.yaml`; its SHA-256 must remain `FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78`.
- Do not add dashboard claims that cannot be reconstructed from `LifeProfile`.
- Do not claim a daily streak, monthly streak, relation-record date, or review-completion date. Version 2 stores only explicit completed month keys and completed years, not timestamps.
- Preserve profile privacy minimization: birth location is not saved or exported.
- Migrate `yi-life-profile-v1` to `yi-life-profile-v2` once. A migrated profile starts with empty review-completion arrays; migration must never infer that an existing monthly or annual template was completed.
- Derived metrics and milestone states belong in `LifeHomeModel`; only explicit review-completion facts belong in the stored version-2 profile.
- Keep event/relation CRUD, save failures, clear confirmation, and export behavior.
- The final primary report chain is `portrait → chart → fortune → name`.
- The final folk entries are `compatibility → mirror → tradition`.
- The story-report plan must leave the legacy `DetailSection` render path mounted. Remove it only in Task 3 of this plan, in the same atomic commit that activates the canonical redirect and final navigation.
- Before every commit, verify the protected file SHA-256, prove it is absent from the index, print the staged path list, and reject any path outside that task's exact allowlist.
- Do not force-push. If `origin/master` is not an ancestor of the verified release commit, stop and reconcile the new remote state before publishing.
- Every “complete”, “passing”, or “deployed” claim requires fresh command or browser evidence.
- Before any `pnpm` command in PowerShell, run:

```powershell
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
```

## Exit Contract

This plan is complete only when:

- the home overview reads in this order: name/theme → truthful dashboard → “记录一件事”/“记录一个关系” → action list → recent summaries → monthly/annual review → privacy;
- dashboard numbers and unlocked milestones are derived from actual stored arrays, including explicit version-2 review-completion facts;
- relation records preserve a user-selected relationship type;
- monthly and annual review are secondary;
- the primary/fun navigation and canonical legacy route work;
- one global cultural-use footer remains and evidence/source panels are absent;
- focused tests, full Vitest, ESLint, `tsc`, vinext build, GitHub build, and a clean-export gate all pass;
- local and public desktop/390px browser acceptance have no console errors or horizontal overflow;
- the verified commit is on `origin/master`, the matching GitHub Pages Actions run concludes successfully, and the public URL serves that commit.

---

### Task 1: Derive Truthful Dashboard Metrics and Achievements

**Files:**

- Modify: `site/lib/yi/life-profile.ts`
- Modify: `site/tests/yi/life-profile.test.ts`

**Interfaces:**

- Consumes: the current `yi-life-profile-v1` storage payload, `LifeEvent[]`, `LifeRelation[]`, and `LifeAction[]`.
- Produces: `LEGACY_LIFE_PROFILE_STORAGE_KEY`, version-2 `LIFE_PROFILE_STORAGE_KEY`, `LifeReviewCompletionFacts`, version-2 `LifeProfile`, `migrateLifeProfileV1`, review-completion reducer actions, and the exact `LifeHomeModel` consumed by Task 2.
- Migration boundary: a v1 profile becomes v2 with empty review-completion arrays. Existing monthly/annual templates are never treated as completed reviews.

- [ ] Add the failing versioned-storage and model contracts:

```ts
export const LEGACY_LIFE_PROFILE_STORAGE_KEY = "yi-life-profile-v1";
export const LIFE_PROFILE_STORAGE_KEY = "yi-life-profile-v2";

export type LifeReviewCompletionFacts = {
  monthly: string[];
  annual: number[];
};

export type LifeHomeMetric =
  | { id: "events" | "relations"; kind: "count"; label: string; value: number }
  | {
      id: "actions";
      kind: "ratio";
      label: "已完成行动";
      completed: number;
      total: number;
    };

export type LifeMilestone = {
  id:
    | "first-record"
    | "three-events"
    | "first-relation"
    | "first-completed-action"
    | "monthly-review"
    | "annual-review";
  label: string;
  unlocked: boolean;
  current: number;
  target: number;
};

export type LifeProfile = {
  version: 2;
  name: string;
  birth: BirthInput;
  createdAt: string;
  updatedAt: string;
  currentStage: string;
  annualMap: AnnualEntry[];
  monthlyRhythm: MonthlyEntry[];
  events: LifeEvent[];
  relations: LifeRelation[];
  actions: LifeAction[];
  reviewCompletions: LifeReviewCompletionFacts;
};

export type LifeHomeModel = {
  name: string;
  currentStage: string;
  annualEntry: AnnualEntry | null;
  monthlyTheme: string;
  monthlyAction: string;
  nextAction: string;
  events: LifeEvent[];
  relations: LifeRelation[];
  actions: LifeAction[];
  currentMonthKey: string;
  currentYear: number;
  metrics: readonly LifeHomeMetric[];
  milestones: readonly LifeMilestone[];
  unlockedMilestoneCount: number;
  totalRecordCount: number;
};
```

- [ ] Add a red migration test using an exact v1 fixture:

```ts
storage.setItem(LEGACY_LIFE_PROFILE_STORAGE_KEY, JSON.stringify(v1SavedProfile));
const migrated = loadLifeProfile(storage);

expect(migrated).toMatchObject({
  version: 2,
  reviewCompletions: { monthly: [], annual: [] },
  birth: { location: "" },
});
expect(JSON.parse(storage.getItem(LIFE_PROFILE_STORAGE_KEY)!)).toEqual(migrated);
expect(storage.getItem(LEGACY_LIFE_PROFILE_STORAGE_KEY)).toBeNull();
```

Also test:

- a failed write of the v2 payload returns the minimized in-memory migrated profile and leaves the valid v1 payload intact;
- `clearLifeProfile` removes both storage keys;
- a newly created profile is version 2 with empty completion arrays;
- export keeps explicit completion facts but still removes birth location;
- corrupted v1/v2 data is removed and returns `null`.

- [ ] Add exact dashboard tests from a version-2 `savedProfile` containing one event, one relation, and two actions of which one is complete:

```ts
expect(home.metrics).toEqual([
  { id: "events", kind: "count", label: "已记录事件", value: 1 },
  { id: "relations", kind: "count", label: "已记录关系", value: 1 },
  { id: "actions", kind: "ratio", label: "已完成行动", completed: 1, total: 2 },
]);
expect(home.totalRecordCount).toBe(2);
expect(home.currentMonthKey).toBe("2026-07");
expect(home.currentYear).toBe(2026);
```

- [ ] Add the six and only six milestone thresholds:

```ts
const thresholds = {
  "first-record": 1,
  "three-events": 3,
  "first-relation": 1,
  "first-completed-action": 1,
  "monthly-review": 1,
  "annual-review": 1,
} as const;
```

Test zero state, every exact threshold, and recomputation after deleting an event/relation, toggling an action, and setting a review back to incomplete. Assert the input profile remains unchanged.

- [ ] Add reducer tests for explicit review facts:

```ts
const withMonth = lifeProfileReducer(savedProfile, {
  type: "set-monthly-review-completed",
  month: "2026-07",
  completed: true,
});
expect(withMonth.reviewCompletions.monthly).toEqual(["2026-07"]);

const withYear = lifeProfileReducer(withMonth, {
  type: "set-annual-review-completed",
  year: 2026,
  completed: true,
});
expect(withYear.reviewCompletions.annual).toEqual([2026]);

const undone = lifeProfileReducer(withYear, {
  type: "set-monthly-review-completed",
  month: "2026-07",
  completed: false,
});
expect(undone.reviewCompletions.monthly).toEqual([]);
```

Reject invalid month keys and non-integer years rather than persisting them. Repeating `completed: true` must not create duplicates.

- [ ] Add a negative test that serialized `LifeHomeModel` does not contain birth date, time, location, or invented fields named `streak`, `recordedAt`, or `lastRecordedAt`.

- [ ] Run the red test:

```powershell
Set-Location site
pnpm test tests/yi/life-profile.test.ts
```

Expected failure: version-2 keys, migration, explicit review facts, ratio metric, and six milestones are absent.

- [ ] Implement the minimal schema migration:

```ts
export type LifeProfileV1 = Omit<LifeProfile, "version" | "reviewCompletions"> & {
  version: 1;
};

export function migrateLifeProfileV1(profile: LifeProfileV1): LifeProfile {
  return {
    ...profile,
    version: 2,
    reviewCompletions: { monthly: [], annual: [] },
  };
}
```

`loadLifeProfile` first validates the v2 key. If absent, it validates the legacy key, migrates in memory, minimizes birth location, writes v2, and removes v1 only after the v2 write succeeds. If that write fails, return the minimized in-memory migration and retain v1. `saveLifeProfile` writes only v2. `clearLifeProfile` attempts to remove both keys even if one removal fails, and reports a storage failure if either operation fails.

- [ ] Extend `LifeProfileAction` and implement idempotent review completion:

```ts
| {
    type: "set-monthly-review-completed";
    month: string;
    completed: boolean;
  }
| {
    type: "set-annual-review-completed";
    year: number;
    completed: boolean;
  }
```

Keep month keys in `YYYY-MM` format and years as integers. Add on `true`, remove on `false`, deduplicate, and sort before storing so export stays deterministic.

- [ ] Implement the derived model inside `buildLifeHome`:

```ts
const eventCount = profile.events.length;
const relationCount = profile.relations.length;
const completedActionCount = profile.actions.filter((action) => action.done).length;
const actionCount = profile.actions.length;
const totalRecordCount = eventCount + relationCount;

const milestoneFacts = {
  "first-record": totalRecordCount,
  "three-events": eventCount,
  "first-relation": relationCount,
  "first-completed-action": completedActionCount,
  "monthly-review": profile.reviewCompletions.monthly.length,
  "annual-review": profile.reviewCompletions.annual.length,
} as const;
```

Return copied arrays, the three exact metrics, the six exact milestones, `currentMonthKey`, and `currentYear`. Do not infer review completion from `annualMap` or `monthlyRhythm`.

- [ ] Re-run:

```powershell
pnpm test tests/yi/life-profile.test.ts
```

Expected: migration, storage failure, privacy, reducer, ratio, and milestone tests pass.

- [ ] Stage exactly the two task files, verify the protected file and index, print and validate the staged allowlist, then commit:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe add -- site/lib/yi/life-profile.ts site/tests/yi/life-profile.test.ts
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
$expected = @("site/lib/yi/life-profile.ts", "site/tests/yi/life-profile.test.ts")
$staged
if (Compare-Object ($expected | Sort-Object) ($staged | Sort-Object)) { throw "Unexpected staged path." }
& $gitExe diff --cached --check
& $gitExe commit -m "feat: migrate truthful life dashboard facts"
```

---

### Task 2: Put Event and Relationship Recording First

**Files:**

- Modify: `site/components/yi/LifeHome.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Create: `site/tests/yi/life-home-view.test.ts`
- Modify: `site/tests/yi/result-navigation.test.ts`
- Modify: `site/app/globals.css`

**Interfaces:**

- Consumes: version-2 `LifeProfile`, `LifeHomeModel`, review-completion reducer actions from Task 1, and `YiThemeElement` from the foundation plan.
- Produces: `getLifeHomeSections()`, `parseLifeRelationship(value)`, `createMonthlyReviewToggleAction(profile, month)`, `createAnnualReviewToggleAction(profile, year)`, and `LifeHomeProps` with `themeElement: YiThemeElement` plus optional `now?: Date` for deterministic SSR tests. `YiExperience` omits `now` in production.
- UI order contract: name/current theme → truthful dashboard → two equal core actions → current action list → recent event/relation summaries → monthly review → annual review → privacy/export/clear.

```ts
export type LifeHomeProps = {
  profile: LifeProfile;
  themeElement: YiThemeElement;
  now?: Date;
  onChange: (profile: LifeProfile) => StorageResult;
  onViewReport: () => void;
  onClear: () => StorageResult;
};
```

- [ ] Write a server-rendered failing view test with `renderToStaticMarkup`. Require the overview order:

```ts
const identity = html.indexOf('data-testid="life-home-identity"');
const dashboard = html.indexOf("我的生活记录");
const eventAction = html.indexOf("记录一件事");
const relationAction = html.indexOf("记录一个关系");
const actionList = html.indexOf("行动清单");
const recent = html.indexOf("最近记录摘要");
const monthly = html.indexOf("月度回看");
const annual = html.indexOf("年度回看");
const privacy = html.indexOf("档案保存在当前网站来源");

expect(identity).toBeGreaterThan(-1);
expect(dashboard).toBeGreaterThan(identity);
expect(eventAction).toBeGreaterThan(dashboard);
expect(relationAction).toBeGreaterThan(eventAction);
expect(actionList).toBeGreaterThan(relationAction);
expect(recent).toBeGreaterThan(actionList);
expect(monthly).toBeGreaterThan(recent);
expect(annual).toBeGreaterThan(monthly);
expect(privacy).toBeGreaterThan(annual);
```

- [ ] Require navigation order:

```ts
expect(getLifeHomeSections()).toEqual([
  ["overview", "首页"],
  ["events", "事件"],
  ["relations", "关系"],
  ["monthly", "月度"],
  ["annual", "年度"],
]);
```

- [ ] Add pure tests for relationship parsing:

```ts
expect(parseLifeRelationship("partner")).toBe("partner");
expect(parseLifeRelationship("family")).toBe("family");
expect(parseLifeRelationship("friend")).toBe("friend");
expect(parseLifeRelationship("colleague")).toBe("colleague");
expect(parseLifeRelationship("other")).toBe("other");
expect(parseLifeRelationship("enemy")).toBe("other");
```

- [ ] Test overview states:

  - zero records shows “从第一条生活线索开始”;
  - populated profile shows event count, relation count, and `已完成行动 1/2`;
  - all six milestones render in the fixed order from Task 1;
  - each milestone renders `data-milestone={id}` and `data-unlocked={unlocked}`; unlocked milestones are visually distinct and include text, not color alone;
  - locked milestone shows `current/target`;
  - name and “木系人生主题” render together; neutral renders “主题待定”;
  - the latest stored event and relation each appear once in “最近记录摘要” without inventing a date;
  - no streak wording appears.

- [ ] Test explicit monthly and annual review controls:

```ts
expect(html).toContain('aria-pressed="false"');
expect(html).toContain("标记本月复盘已完成");
expect(html).toContain("标记本年复盘已完成");
```

Do not add Testing Library/jsdom. This repository's focused component tests use SSR and pure functions. With `now={new Date("2026-07-23T00:00:00.000Z")}`, call each exported toggle builder, assert its exact action, apply it through `lifeProfileReducer`, and SSR-rerender `LifeHome` with the returned profile:

```ts
const monthAction = createMonthlyReviewToggleAction(profile, "2026-07");
expect(monthAction).toEqual({
  type: "set-monthly-review-completed",
  month: "2026-07",
  completed: true,
});
const withMonth = lifeProfileReducer(profile, monthAction);
const monthHtml = renderLifeHome(withMonth, fixedNow);
expect(monthHtml).toMatch(
  /data-milestone="monthly-review"[^>]*data-unlocked="true"/,
);
expect(monthHtml).toContain('aria-pressed="true"');

const undoMonth = createMonthlyReviewToggleAction(withMonth, "2026-07");
expect(undoMonth.completed).toBe(false);
expect(lifeProfileReducer(withMonth, undoMonth).reviewCompletions.monthly).toEqual([]);
```

Repeat the same pure builder → reducer → SSR-rerender sequence for `createAnnualReviewToggleAction(profile, 2026)`. The completed render must include an unlocked matching milestone and “取消本月/本年复盘完成”; the second builder call must return it to incomplete.

- [ ] Run the red view cluster:

```powershell
Set-Location site
pnpm test tests/yi/life-home-view.test.ts tests/yi/result-navigation.test.ts
```

Expected failure: the old equal-priority grid, old navigation order, and no explicit review completion controls remain.

- [ ] Export stable helpers:

```ts
export const getLifeHomeSections = () => [
  ["overview", "首页"],
  ["events", "事件"],
  ["relations", "关系"],
  ["monthly", "月度"],
  ["annual", "年度"],
] as const;

export function parseLifeRelationship(value: FormDataEntryValue | null): LifeRelation["relationship"] {
  return ["partner", "family", "friend", "colleague", "other"].includes(String(value))
    ? String(value) as LifeRelation["relationship"]
    : "other";
}

export function createMonthlyReviewToggleAction(
  profile: LifeProfile,
  month: string,
): Extract<LifeProfileAction, { type: "set-monthly-review-completed" }> {
  return {
    type: "set-monthly-review-completed",
    month,
    completed: !profile.reviewCompletions.monthly.includes(month),
  };
}

export function createAnnualReviewToggleAction(
  profile: LifeProfile,
  year: number,
): Extract<LifeProfileAction, { type: "set-annual-review-completed" }> {
  return {
    type: "set-annual-review-completed",
    year,
    completed: !profile.reviewCompletions.annual.includes(year),
  };
}
```

- [ ] Replace the overview grid with:

  1. name, current stage, and text theme label;
  2. a metrics strip titled “我的生活记录”, including the action ratio;
  3. the six truthful milestone cards;
  4. two equal large core action buttons;
  5. the existing action checklist;
  6. one recent event and one recent relation summary, when present;
  7. small monthly then annual review cards with explicit completion controls;
  8. the existing privacy/export/clear area.

The first two buttons switch to their section. Use refs plus an effect keyed by `section` so the event title or relation name input receives focus after navigation.

Pass `themeElement={themeElement}` from `YiExperience` to `LifeHome`. Display `${themeElement}系人生主题` for the five element values and “主题待定” for neutral; do not persist this label. “日主” is chart terminology and must not appear on the home dashboard.

- [ ] Add the relationship type select:

```tsx
<select aria-label="关系类型" defaultValue="other" name="relationship">
  <option value="partner">伴侣</option>
  <option value="family">家人</option>
  <option value="friend">朋友</option>
  <option value="colleague">同事</option>
  <option value="other">其他</option>
</select>
```

Use `parseLifeRelationship(form.get("relationship"))` instead of hard-coding `other`.

- [ ] Style 390px:

  - the two main actions stack full-width;
  - every control is at least 44px;
  - metrics use two columns;
  - achievements use one column;
  - the five nav buttons fit in one grid without horizontal scroll;
  - form controls stack and never exceed the viewport.

- [ ] Re-run:

```powershell
pnpm test tests/yi/life-home-view.test.ts tests/yi/life-profile.test.ts tests/yi/result-navigation.test.ts
```

Expected: identity/dashboard/action ordering, ratio, milestones, review completion, recent summaries, relationship types, empty state, and responsive contracts pass.

- [ ] Stage the exact task files, run the protected-file and staged-allowlist gate, then commit:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe add -- site/components/yi/LifeHome.tsx site/components/yi/YiExperience.tsx site/tests/yi/life-home-view.test.ts site/tests/yi/result-navigation.test.ts site/app/globals.css
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
$expected = @(
  "site/app/globals.css",
  "site/components/yi/LifeHome.tsx",
  "site/components/yi/YiExperience.tsx",
  "site/tests/yi/life-home-view.test.ts",
  "site/tests/yi/result-navigation.test.ts"
)
$staged
if (Compare-Object ($expected | Sort-Object) ($staged | Sort-Object)) { throw "Unexpected staged path." }
& $gitExe diff --cached --check
& $gitExe commit -m "feat: lead life home with truthful progress"
```

---

### Task 3: Activate the Four-Chapter Report and Canonical Legacy Route

**Files:**

- Modify: `site/lib/yi/hash-router.ts`
- Modify: `site/components/yi/useYiRoute.ts`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/components/yi/ChartSection.tsx`
- Modify: `site/tests/yi/hash-router.test.ts`
- Modify: `site/tests/yi/result-navigation.test.ts`
- Modify: `site/tests/yi/chart-narrative.test.ts`
- Modify: `site/tests/yi/experience-copy.test.ts`
- Modify: `site/tests/yi/interpretation.test.ts`
- Modify: `site/tests/yi/method-accuracy.test.ts`
- Delete: `site/tests/yi/source-note.test.ts`
- Delete: `site/components/yi/DetailSection.tsx`
- Delete: `site/components/yi/SourceNote.tsx`
- Delete: `site/components/yi/ChapterSources.tsx`
- Modify: `site/app/globals.css`

**Interfaces and atomic cutover:**

- Consumes the story/name/chart components completed by the preceding feature plans.
- `resolveYiHash(hash)` produces `{ route, canonicalHash }`; `parseYiHash(hash)` remains the route-only compatibility API.
- `useYiRoute()` produces `{ route, canonicalHash, push, replace }`. `replace(next)` must update both the URL and local state while clearing `canonicalHash`.
- `YiExperience` is the only hydration/guard/canonicalization owner. `ResultShell` receives only the final guarded `activeSection`.
- `ChartSection` keeps the story-plan contract `{ chart, report, items }`; `ResultShell` must continue to pass its existing `interpretations` as `items`. This cutover removes only the obsolete embedded-name prop.
- The old detail UI remains imported and rendered through the end of the story-plan commit. This task switches the route, navigation, standalone name chapter, and `ResultShell` render path first; it then proves there are no component import/render references and deletes `DetailSection`, `SourceNote`, `ChapterSources`, and the obsolete test in this same atomic commit. There must be no intermediate commit in which `detail` is gone from routing but still mounted, or absent from rendering while its public components remain orphaned.

- [ ] Add the failing route contract:

```ts
export const reportSectionIds = [
  "portrait", "chart", "fortune", "name",
  "compatibility", "mirror", "tradition",
] as const;

export type YiHashResolution = {
  route: YiRoute;
  canonicalHash: string | null;
};
```

Require:

```ts
expect(parseYiHash("#/report/name")).toEqual({ page: "report", section: "name" });
for (const hash of [
  "#/report/detail",
  "#/report/detail/",
  "#/report/detail/source-note",
]) {
  expect(resolveYiHash(hash)).toEqual({
    route: { page: "report", section: "chart" },
    canonicalHash: "#/report/chart",
  });
}
```

Keep this focused test pure: compose `resolveYiHash`, `resolveYiHydratedRoute`, and `guardYiRoute`. A legacy route with no saved result must finish at birth; with complete profile/result/birth state it must finish at chart and retain `canonicalHash: "#/report/chart"` as the replacement signal. Do not add jsdom. The actual `history.replaceState` address change is verified in Task 7 and again online in Task 9.

- [ ] Add failing navigation tests:

```ts
expect(getPrimaryResultSections()).toEqual([
  ["portrait", "人生画卷"],
  ["chart", "命盘"],
  ["fortune", "大运"],
  ["name", "姓名"],
]);
expect(getFunResultSections()).toEqual([
  ["compatibility", "合盘"],
  ["mirror", "镜像"],
  ["tradition", "传统"],
]);
expect(getNextPrimarySection("portrait")).toBe("chart");
expect(getNextPrimarySection("chart")).toBe("fortune");
expect(getNextPrimarySection("fortune")).toBe("name");
expect(getNextPrimarySection("name")).toBeNull();
```

Assert “详批” is absent; `NameSection` is present; `ChartSection` has `{ chart, report, items }` props and no public name-analysis child; `ResultShell` passes `items={interpretations}`; existing scroll-position helpers work for all seven final section IDs.

- [ ] Run the red tests:

```powershell
Set-Location site
pnpm test tests/yi/hash-router.test.ts tests/yi/result-navigation.test.ts
```

Expected failure: detail is still a section, name is absent, and one seven-item tab list remains.

- [ ] Implement canonical resolution:

```ts
function parseCanonicalYiPath(path: string): YiRoute {
  if (path === "/birth") return { page: "birth" };
  if (path === "/calculating") return { page: "calculating" };
  if (path === "/home") return { page: "home" };
  const report = /^\/report\/([^/]+)$/.exec(path);
  if (report) {
    const section = report[1] as ReportSectionId;
    return {
      page: "report",
      section: reportSectionIds.includes(section) ? section : "portrait",
    };
  }
  return { page: "intro" };
}

export function resolveYiHash(hash: string): YiHashResolution {
  const path = hash.replace(/^#/, "");
  if (/^\/report\/detail(?:\/.*)?\/?$/.test(path)) {
    return {
      route: { page: "report", section: "chart" },
      canonicalHash: "#/report/chart",
    };
  }
  return { route: parseCanonicalYiPath(path), canonicalHash: null };
}

export function parseYiHash(hash: string): YiRoute {
  return resolveYiHash(hash).route;
}
```

Keep `parseCanonicalYiPath` private. Unknown report sections still resolve to portrait; only legacy detail paths emit a non-null canonical hash.

- [ ] Preserve the canonical signal in `useYiRoute`:

```ts
type YiRouteState = YiHashResolution;

const [state, setState] = useState<YiRouteState>({
  route: { page: "intro" },
  canonicalHash: null,
});
```

On hash change, store `resolveYiHash`. Return `{ route: state.route, canonicalHash: state.canonicalHash, push, replace }`. In `YiExperience`, wait for profile hydration, apply `resolveYiHydratedRoute` and `guardYiRoute`, then call `replace(finalRoute)` once if either the guard changed the route or `canonicalHash` is non-null. This prevents a report flash and makes the final URL match the final guarded page.

- [ ] Split result navigation:

```ts
export const getPrimaryResultSections = () => [
  ["portrait", "人生画卷"],
  ["chart", "命盘"],
  ["fortune", "大运"],
  ["name", "姓名"],
] as const;

export const getFunResultSections = () => [
  ["compatibility", "合盘"],
  ["mirror", "镜像"],
  ["tradition", "传统"],
] as const;
```

Render the primary chain as the sticky report navigation. Render folk entries under “换个轻松角度” after the active primary chapter and as a compact back-to-report strip inside folk chapters.

- [ ] Render `<NameSection name={name} chart={chart} professionalReport={report} />` for `activeSection === "name"`.

- [ ] In the same commit, remove the embedded `<NameAnalysisSection>` import/render and the now-unused `name` prop from `ChartSection`; preserve the required `items: readonly InterpretationItem[]` prop and update `ResultShell` to render `<ChartSection chart={chart} report={report} items={interpretations} />`. Add a rendered assertion that “姓名五行齐备度” appears only in the standalone name section and that the detailed chart narrative still renders.

- [ ] Add one “下一章” button at the end of portrait, chart, and fortune. At the end of name, show one “换个轻松角度” action rather than another required chapter.

- [ ] Verify that the story-plan commits already removed every `<ChapterSources>` import/render from `PortraitSection`, `ChartSection`, `CompatibilitySection`, and `MirrorSection`; do not edit or restage those files merely to repeat that completed cleanup. Remove the `SourceNote` import/render and now-unused `shouldRenderSourceNote` export from `ResultShell`. Move the remaining UI assertions in `experience-copy.test.ts` and `interpretation.test.ts` to the life-scroll/chart projections. Keep the source-registry and calculation-accuracy assertions in `method-accuracy.test.ts`, but remove its obsolete `SourceNote` rendering assertion. Delete `source-note.test.ts` because the public source-note component no longer exists.

- [ ] Before deleting any legacy component, extend the existing stable-fixture assertion in `chart-narrative.test.ts` with an integration cutover gate. Reuse the story plan's exact `{ name: "测试人林岚", date: "1990-06-15", time: "09:30", location: "北京市", gender: "female", timeConfidence: "exact" }` fixture and its existing builder helpers; import `DETAIL_ACTION_ID_ALLOWLIST`, `buildChartNarrative`, and `listDetailActionIds` from the production chart-narrative module. The assertion must run before the deletion step and prove:

```ts
expect(listDetailActionIds(items)).toEqual(DETAIL_ACTION_ID_ALLOWLIST);

const narrative = buildChartNarrative(chart, report, items);
const attached = [
  narrative.self,
  narrative.career,
  narrative.relationship,
  narrative.rhythm,
  ...narrative.careerAdvice,
  ...narrative.relationshipAdvice,
  ...narrative.rhythmAdvice,
].flatMap((entry) => entry.sourceActionIds);

expect(new Set(attached).size).toBe(attached.length);
expect(attached).toEqual(narrative.coveredDetailActionIds);
expect([...attached].sort()).toEqual([...DETAIL_ACTION_ID_ALLOWLIST].sort());
```

Reject any missing, duplicate, or unknown action ID. This is a deletion gate, not a snapshot update.

- [ ] Run the cutover gate while all legacy files still exist:

```powershell
pnpm test tests/yi/chart-narrative.test.ts
```

Expected: the exported 42-action allowlist and the chart narrative are an exact one-to-one set. Stop the cutover before deletion if this command fails.

- [ ] Delete `DetailSection`, `SourceNote`, and `ChapterSources` only after:

```powershell
rg -n "import .*DetailSection|import .*SourceNote|import .*ChapterSources|<DetailSection\b|<SourceNote\b|<ChapterSources\b" site/components site/tests
```

shows no remaining import or render path. This deletion precheck intentionally checks component imports/renders only; do not use helper or registry names as deletion criteria. Do not delete internal calculation/source registries.

- [ ] Update mobile CSS:

```css
@media (max-width: 760px) {
  .result-primary-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
  }
  .result-fun-links {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

All buttons remain 44px; labels wrap; there is no horizontal scroll.

- [ ] Re-run:

```powershell
pnpm test tests/yi/hash-router.test.ts tests/yi/result-navigation.test.ts tests/yi/name-section.test.ts tests/yi/chart-narrative.test.ts
```

Expected: route migration and final section structure pass.

- [ ] Stage the complete cutover, prove the protected file and exact staged set, then commit:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe add -- site/lib/yi/hash-router.ts site/components/yi/useYiRoute.ts site/components/yi/YiExperience.tsx site/components/yi/ResultShell.tsx site/components/yi/ChartSection.tsx site/components/yi/DetailSection.tsx site/components/yi/SourceNote.tsx site/components/yi/ChapterSources.tsx site/tests/yi/hash-router.test.ts site/tests/yi/result-navigation.test.ts site/tests/yi/chart-narrative.test.ts site/tests/yi/experience-copy.test.ts site/tests/yi/interpretation.test.ts site/tests/yi/method-accuracy.test.ts site/tests/yi/source-note.test.ts site/app/globals.css
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
$expected = @(
  "site/app/globals.css",
  "site/components/yi/ChapterSources.tsx",
  "site/components/yi/ChartSection.tsx",
  "site/components/yi/DetailSection.tsx",
  "site/components/yi/ResultShell.tsx",
  "site/components/yi/SourceNote.tsx",
  "site/components/yi/YiExperience.tsx",
  "site/components/yi/useYiRoute.ts",
  "site/lib/yi/hash-router.ts",
  "site/tests/yi/chart-narrative.test.ts",
  "site/tests/yi/experience-copy.test.ts",
  "site/tests/yi/hash-router.test.ts",
  "site/tests/yi/interpretation.test.ts",
  "site/tests/yi/method-accuracy.test.ts",
  "site/tests/yi/result-navigation.test.ts",
  "site/tests/yi/source-note.test.ts"
)
$staged
if (Compare-Object ($expected | Sort-Object) ($staged | Sort-Object)) { throw "Unexpected staged path." }
& $gitExe diff --cached --check
& $gitExe commit -m "feat: activate final report reading flow"
```

---

### Task 4: Add One Global Boundary and Audit the Visible Product

**Files:**

- Create: `site/components/yi/YiProductFooter.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Create: `site/tests/yi/public-reading-audit.test.ts`
- Modify: `site/tests/yi/experience-copy.test.ts`
- Modify: `site/app/globals.css`
- Modify: `site/README.md`

- [ ] Write a failing static-render audit over every result section, representative home state, and the calculating state. Render the relevant components directly; do not rely on the server-rendered initial route of `YiExperience` to stand in for hydrated routes. Require exactly one occurrence of:

```text
传统文化互动，用来观察自己；医疗、法律、投资等重要决定请咨询相应专业人士。
```

- [ ] Require zero active component occurrences of:

```ts
const forbiddenLabels = [
  "专业依据",
  "本章来源",
  "本章依据与使用边界",
  "可靠级",
  "证据等级",
  "计算规则",
  "规则 ID",
  "数据来源清单",
  "查看九项专业依据",
  "详批",
];
```

Allow internal data/test files to retain source IDs and audit facts.

- [ ] Require structural professional terms to render in chart HTML and not in intro, birth, calculating, home, portrait, fortune, name, compatibility, mirror, tradition, or reference-atlas HTML. At minimum audit `四柱|日主|月令|十神|藏干|纳音|十二长生|旺衰|透干|通根|干支`. High-level product labels such as “命盘”“命局”“时运”“排盘” may remain in the intro, navigation, “查看命盘报告”, and save-dialog “命盘摘要”; they must not be accompanied there by structural analysis or calculation detail. The calculating progress itself uses the plain-language sequence below.

- [ ] Require the visible product name “艺｜东方人生智慧” to remain while every single-character mark’s accessible label is “命”.

- [ ] Run:

```powershell
Set-Location site
pnpm test tests/yi/public-reading-audit.test.ts
```

Expected failure: no global footer exists, repeated source/evidence UI may remain, and the calculating steps still expose chart terminology outside the chart chapter.

- [ ] Implement:

```tsx
export function YiProductFooter() {
  return (
    <footer className="yi-product-footer">
      传统文化互动，用来观察自己；医疗、法律、投资等重要决定请咨询相应专业人士。
    </footer>
  );
}
```

Render it once under the active page within the root `main`. Keep the home storage-privacy footer because it explains local data handling, not cultural evidence.

- [ ] Extract the calculating surface as a small exported `CalculationProgress` component so the public audit can render it deterministically. Replace `getCalculationSteps()` with these six plain-language steps:

```ts
export const getCalculationSteps = () => [
  "校准出生时间",
  "辨认人生底色",
  "整理成长线索",
  "连接事业场景",
  "连接关系场景",
  "展开人生画卷",
] as const;
```

`CalculationProgress` must say `正在展开 ${name || "访客"} 的人生画卷`; it may not say “正在建立……的命盘”. Update `experience-copy.test.ts` to assert this exact six-step list and to reject the audited professional-term regex.

- [ ] Remove residual active evidence/source panels without deleting their internal inputs. Update `site/README.md` to describe the current “命” mark, five-element theme, four-chapter reading flow, truthful name coverage, and Pages path. Do not call it a demo.

- [ ] Re-run:

```powershell
pnpm test tests/yi/public-reading-audit.test.ts tests/yi/experience-copy.test.ts tests/yi/result-navigation.test.ts
```

Expected: one footer, no visible forbidden labels, and professional terminology isolated to the chart.

- [ ] Stage only this task, prove the protected file and exact staged set, then commit:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe add -- site/components/yi/YiProductFooter.tsx site/components/yi/YiExperience.tsx site/tests/yi/public-reading-audit.test.ts site/tests/yi/experience-copy.test.ts site/app/globals.css site/README.md
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
$expected = @(
  "site/README.md",
  "site/app/globals.css",
  "site/components/yi/YiExperience.tsx",
  "site/components/yi/YiProductFooter.tsx",
  "site/tests/yi/experience-copy.test.ts",
  "site/tests/yi/public-reading-audit.test.ts"
)
$staged
if (Compare-Object ($expected | Sort-Object) ($staged | Sort-Object)) { throw "Unexpected staged path." }
& $gitExe diff --cached --check
& $gitExe commit -m "feat: finish public reading boundaries"
```

---

### Task 5: Update GitHub Build Acceptance Before Building

**Files:**

- Modify: `site/tests/github-build.test.mjs`
- Create: `site/tests/fixtures/github-build/stable-docs-sha256-v1.json`
- Modify generated files under: `docs/assets/`
- Modify: `docs/index.html`
- Verify unchanged: `docs/fonts/`, `docs/reference/`, `docs/THIRD_PARTY_LICENSES.txt`, and internal planning/spec files.

**Clean-export contract:** `site/tests/github-build.test.mjs` must use only tracked files plus Node built-ins. It must not invoke `git`, inspect `.git`, or depend on the repository working tree. This is required so the same test passes in Task 8’s `git archive` export.

- [ ] Replace the runtime `git show` comparison with a versioned hash fixture. Remove the `node:child_process`, `node:util`, `execFileAsync`, and `repositoryRoot` imports/state. Add this exact fixture:

```json
{
  "schemaVersion": 1,
  "normalization": "crlf-to-lf-utf8",
  "files": {
    "docs/superpowers/specs/2026-07-17-yi-oriental-life-wisdom-design.md": "85ef6bc2a34b310c91b3b17714882096a20460a2a9a95be3c79eb728f38acfcb",
    "docs/superpowers/plans/2026-07-17-yi-github-spa-navigation.md": "24d9870bd49de994c5c1dfd8237b6b4e77c218081c9ddbec1e1ea6e1a62612b2",
    "docs/superpowers/plans/2026-07-17-yi-life-wisdom-upgrade.md": "2149ddc15c5b8c2d6a59d695f70b7ac69d3c2dcbcda00ddf15945ff12df976e4",
    "docs/superpowers/plans/2026-07-17-yi-professional-paid-report.md": "99dccb7b4873bfa5ce6f9e76aa52cc31f1413b19ffba745fe4aa4ade223347dd"
  }
}
```

Load it with `readFile(new URL("./fixtures/github-build/stable-docs-sha256-v1.json", import.meta.url), "utf8")`. For every entry, read the tracked document through `new URL(\`../../${path}\`, import.meta.url)`, normalize CRLF to LF, hash its UTF-8 bytes with the existing `sha256`, and compare with the fixture. Require `schemaVersion === 1` and the declared normalization value. An intentional future edit to a protected stable document requires review plus a new versioned fixture; the build test must never derive its expected value from `HEAD` at runtime.

- [ ] Change the build test first and run it against the old committed build:

```powershell
Set-Location site
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --test tests/github-build.test.mjs
```

Expected failure: the old bundle still contains “艺”/U+827A assets, old navigation, and old evidence labels.

- [ ] Require the new built JS to contain:

  - “人生画卷”;
  - “姓名五行齐备度”;
  - “覆盖” and “只看五行覆盖，不是姓名好坏”;
  - “记录一件事” and “记录一个关系”;
  - “《道德经》小注”;
  - chart-only “纳音” and “十二长生”;
  - “艺｜东方人生智慧” and the global footer.

- [ ] Require built JS not to contain the removed “详批” route/label, “访客的人生报告”, “中山篆”, or stale U+827A asset names. Do not assert that internal evidence vocabulary is absent from the minified bundle; internal audit data is intentionally retained. Visibility is enforced by the rendered public-reading tests and browser acceptance.

- [ ] Update font deployment checks to:

```js
const codePoint = "U+547D";
const svgName = "yi-lishu-u547d.svg";
const auditName = "yi-lishu-u547d-source-audit.json";
```

Keep byte-for-byte public/docs equality, license hash, SVG hash, outline hash, no `<text>`, no `font-family`, and no `@font-face`.

- [ ] Update CSS checks for six `data-element` modes, semantic tokens, five outward rings, reduced-motion two-ring state, two-row mobile primary navigation, compact fun links, and life-home main actions.

- [ ] Do not weaken unrelated reference-asset and third-party-license assertions.

- [ ] Build the current source and turn the red test green:

```powershell
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
pnpm test:github
```

Expected: Vite builds with base `/yi-oriental-wisdom/`, and the updated GitHub build test passes.

- [ ] Inspect every generated change:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe status --short
& $gitExe diff --stat
```

Confirm no internal planning/spec, font, reference, or license file changed during build and no stale hashed asset remains.

- [ ] Build an exact runtime allowlist from the changed Vite outputs. The only variable part is the content hash; filename families and extensions are fixed:

```powershell
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$trackedGenerated = @(& $gitExe diff --name-only --no-renames HEAD -- docs/index.html docs/assets)
$untrackedGenerated = @(& $gitExe ls-files --others --exclude-standard -- docs/assets)
$generatedPaths = @($trackedGenerated + $untrackedGenerated | Sort-Object -Unique)
$allowedGeneratedPatterns = @(
  '^docs/index\.html$',
  '^docs/assets/index-[A-Za-z0-9_-]+\.css$',
  '^docs/assets/index-[A-Za-z0-9_-]+\.js$',
  '^docs/assets/index-[A-Za-z0-9_-]+\.js\.map$',
  '^docs/assets/name-analysis-[A-Za-z0-9_-]+\.js$',
  '^docs/assets/name-analysis-[A-Za-z0-9_-]+\.js\.map$',
  '^docs/assets/name-tgh-data-[A-Za-z0-9_-]+\.js$',
  '^docs/assets/name-tgh-data-[A-Za-z0-9_-]+\.js\.map$'
)
foreach ($path in $generatedPaths) {
  $matches = @($allowedGeneratedPatterns | Where-Object { $path -match $_ })
  if ($matches.Count -ne 1) { throw "Generated path is outside the exact Vite allowlist: $path" }
}
if ("docs/index.html" -notin $generatedPaths) { throw "Expected docs/index.html to change." }
$generatedPaths
& $gitExe status --short -- docs
```

Review the exact generated list and the full docs status. The four implementation plans are committed before sequence 1 begins and must already be tracked; any untracked plan document is an unexpected release-state defect, not a generated output. Any new font/reference/license change is also a build defect because its source copy was committed by the foundation task. Do not use `git add docs/assets`, `git add docs/fonts`, or any other directory-wide staging command.

- [ ] Stage the two acceptance files and each reviewed generated path one by one; then prove the protected file and exact staged set:

```powershell
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$trackedGenerated = @(& $gitExe diff --name-only --no-renames HEAD -- docs/index.html docs/assets)
$untrackedGenerated = @(& $gitExe ls-files --others --exclude-standard -- docs/assets)
$generatedPaths = @($trackedGenerated + $untrackedGenerated | Sort-Object -Unique)
$allowedGeneratedPatterns = @(
  '^docs/index\.html$',
  '^docs/assets/index-[A-Za-z0-9_-]+\.css$',
  '^docs/assets/index-[A-Za-z0-9_-]+\.js$',
  '^docs/assets/index-[A-Za-z0-9_-]+\.js\.map$',
  '^docs/assets/name-analysis-[A-Za-z0-9_-]+\.js$',
  '^docs/assets/name-analysis-[A-Za-z0-9_-]+\.js\.map$',
  '^docs/assets/name-tgh-data-[A-Za-z0-9_-]+\.js$',
  '^docs/assets/name-tgh-data-[A-Za-z0-9_-]+\.js\.map$'
)
foreach ($path in $generatedPaths) {
  $matches = @($allowedGeneratedPatterns | Where-Object { $path -match $_ })
  if ($matches.Count -ne 1) { throw "Generated path is outside the exact Vite allowlist: $path" }
}
if ("docs/index.html" -notin $generatedPaths) { throw "Expected docs/index.html to change." }
& $gitExe add -- site/tests/github-build.test.mjs site/tests/fixtures/github-build/stable-docs-sha256-v1.json
foreach ($path in $generatedPaths) { & $gitExe add -- $path }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
$expected = @(
  "site/tests/github-build.test.mjs",
  "site/tests/fixtures/github-build/stable-docs-sha256-v1.json"
) + $generatedPaths
$staged
if (Compare-Object ($expected | Sort-Object) ($staged | Sort-Object)) { throw "Unexpected staged path." }
& $gitExe diff --cached --check
& $gitExe commit -m "build: publish five-element story experience"
```

---

### Task 6: Run Full Local Gates

**Files:**

- Verify; fix only current redesign regressions.

- [ ] Confirm the working tree and protected file before tests:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe status --short --branch
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
```

Expected: only the protected untracked file; frozen hash; `ls-files` non-zero.

- [ ] Put the bundled Node runtime on this PowerShell process path, then run the required gates:

```powershell
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
Set-Location site
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Record command, exit code, test count, and duration in the release notes for the final response.

- [ ] Run the source scans:

```powershell
rg -n "中山篆|U\+827A|yi-lishu-u827a|访客的人生报告" components lib tests public README.md ..\docs\fonts
rg -n "T[B]D|T[O]DO|implement[ ]later|fill[ ]in|appropriate[ ]error[ ]handling|similar[ ]to" components lib tests public README.md
```

Expected: no unfinished implementation marker or stale current-product term.

- [ ] Recheck the exact protected SHA, the failed `ls-files` lookup, and `git diff --cached --name-only` after the gates. The index must be empty and the protected file must remain the only untracked path.

---

### Task 7: Perform Local Desktop and 390px Browser Acceptance

**Files:**

- Create: `docs/qa/2026-07-23-yi-five-element-story-release.md`

- [ ] Read the `browser:control-in-app-browser` skill completely before using browser tools.

- [ ] Start the local app from `site` in a reusable terminal session:

```powershell
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
pnpm dev --host 127.0.0.1
```

Record the actual port from terminal output.

- [ ] At 1440×900, verify:

  - central mark is visually “命”, with five gold rings and a light neutral page;
  - birth intake, calculation, report, dialog, and home share the light token system;
  - after calculating a complete sample, root theme matches its day master;
  - ambiguous day input uses neutral theme;
  - owner name ritual, adopted facts, and actions are in the correct order;
  - save dialog receives focus, traps Tab, closes on Escape, and returns focus to the trigger;
  - all four primary chapters and all three folk entries render;
  - opening `#/report/detail` with complete saved data replaces the visible address with `#/report/chart`; with no usable saved result it finishes at `#/birth` without flashing a report;
  - chart is the only place with structural professional terms; the explicitly allowed high-level product labels carry no calculation detail elsewhere;
  - candidate-name comparison works and the latest rapid submission wins;
  - no page shows forbidden evidence/source labels;
  - no console error or uncaught rejection occurs.

- [ ] At 390×844, verify the same flow plus:

  - no `document.documentElement.scrollWidth > window.innerWidth`;
  - “命” remains the audited SVG, not fallback text;
  - inputs and buttons are easy to tap;
  - report name wraps;
  - save/edit buttons stack full-width;
  - primary report nav is two rows and folk links do not overflow;
  - long life-scroll and chart paragraphs remain readable;
  - name comparison cards stack;
  - life-home main actions stack and receive focus after selection;
  - a migrated v1 profile shows zero month/year review completions until the user explicitly marks them;
  - clicking the monthly and annual completion controls updates their matching milestones and clicking again returns them to incomplete, without fabricating dates or streaks.

- [ ] Save one desktop and one 390px screenshot in the browser evidence and write a concise table in `docs/qa/2026-07-23-yi-five-element-story-release.md` with route, viewport, checked interactions, horizontal-overflow result, and console result.

- [ ] Stop the local server cleanly.

- [ ] Stage only the QA record, prove the protected file and exact staged set, then commit:

```powershell
Set-Location ..
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $gitExe add -- docs/qa/2026-07-23-yi-five-element-story-release.md
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
$expected = @("docs/qa/2026-07-23-yi-five-element-story-release.md")
$staged
if (Compare-Object $expected $staged) { throw "Unexpected staged path." }
& $gitExe diff --cached --check
& $gitExe commit -m "test: record local release acceptance"
```

---

### Task 8: Prove a Clean Tracked Export Builds Without the Protected File

**Files:**

- Verify in a temporary export only.

This is a disposable release validation of tracked `HEAD`, not a second implementation project or worktree. All source edits stay in the existing requested worktree.

- [ ] Run creation, export, all gates, and cleanup in this single `try/finally` PowerShell block. `Assert-TempChild` requires the resolved target to start with the resolved temp-root plus a directory separator, so neither the temp root itself nor a sibling prefix can pass. Cleanup revalidates each exact absolute target immediately before deletion:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$repoRoot = (Resolve-Path -LiteralPath ".").Path
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
$tempRoot = (Resolve-Path -LiteralPath $env:TEMP).Path.TrimEnd([char[]]@('\', '/'))
$tempPrefix = $tempRoot + [System.IO.Path]::DirectorySeparatorChar

function Assert-TempChild {
  param([Parameter(Mandatory = $true)][string]$Path)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  if ($fullPath -eq $tempRoot -or -not $fullPath.StartsWith($tempPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path is not a strict child of the intended temp directory: $fullPath"
  }
  return $fullPath
}

$cleanExport = Assert-TempChild (Join-Path $tempRoot ("yi-release-" + [guid]::NewGuid().ToString("N")))
$cleanArchive = Assert-TempChild (Join-Path $tempRoot ("yi-release-" + [guid]::NewGuid().ToString("N") + ".tar"))
$releaseHead = (& $gitExe rev-parse HEAD).Trim()

try {
  New-Item -ItemType Directory -LiteralPath $cleanExport -ErrorAction Stop | Out-Null
  $cleanExport = Assert-TempChild ((Resolve-Path -LiteralPath $cleanExport).Path)

  & $gitExe archive --format=tar --output=$cleanArchive HEAD
  if ($LASTEXITCODE -ne 0) { throw "git archive failed." }
  tar -xf $cleanArchive -C $cleanExport
  if ($LASTEXITCODE -ne 0) { throw "tar extraction failed." }
  if (Test-Path -LiteralPath (Join-Path $cleanExport "site\pnpm-workspace.yaml")) {
    throw "Protected untracked file leaked into the clean export."
  }

  Set-Location (Join-Path $cleanExport "site")
  pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw "Frozen install failed in clean export." }
  pnpm test
  if ($LASTEXITCODE -ne 0) { throw "Vitest failed in clean export." }
  pnpm lint
  if ($LASTEXITCODE -ne 0) { throw "ESLint failed in clean export." }
  pnpm exec tsc --noEmit
  if ($LASTEXITCODE -ne 0) { throw "tsc failed in clean export." }
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw "vinext build failed in clean export." }
  pnpm test:github
  if ($LASTEXITCODE -ne 0) { throw "GitHub Pages build acceptance failed in clean export." }

  "Clean export passed for $releaseHead"
}
finally {
  Set-Location $repoRoot
  foreach ($target in @($cleanExport, $cleanArchive)) {
    $safeTarget = Assert-TempChild $target
    if (Test-Path -LiteralPath $safeTarget) {
      $item = Get-Item -LiteralPath $safeTarget
      if ($item.PSIsContainer) {
        Remove-Item -LiteralPath $safeTarget -Recurse -Force
      }
      else {
        Remove-Item -LiteralPath $safeTarget -Force
      }
    }
  }
}
```

- [ ] Record the clean-export result and exact `$releaseHead`.

---

### Task 9: Push Without Force and Verify GitHub Pages Online

**Files:**

- No source edit unless online acceptance finds a real defect.

- [ ] Refresh remote state:

```powershell
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" fetch origin
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" merge-base --is-ancestor origin/master HEAD
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" status --short --branch
```

Expected: ancestry command exits zero; the only untracked path is the protected file. If ancestry fails, do not force-push.

- [ ] Push the named feature branch, then the same verified commit to Pages’ source branch:

```powershell
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$releaseSha = (& $gitExe rev-parse HEAD).Trim()
& $gitExe push origin HEAD:feature/yi-content-engine-rebuild
if ($LASTEXITCODE -ne 0) { throw "Feature-branch push failed." }
& $gitExe push origin HEAD:master
if ($LASTEXITCODE -ne 0) { throw "Pages-source push failed." }
```

- [ ] Poll GitHub Actions for the exact release SHA and require the matching Pages workflow to finish successfully before browser acceptance:

```powershell
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$releaseSha = (& $gitExe rev-parse HEAD).Trim()
$headers = @{
  Accept = "application/vnd.github+json"
  "User-Agent" = "yi-oriental-wisdom-release-check"
  "X-GitHub-Api-Version" = "2022-11-28"
}
if ($env:GITHUB_TOKEN) { $headers["Authorization"] = "Bearer $env:GITHUB_TOKEN" }
$runsUri = "https://api.github.com/repos/dengsan721-prog/yi-oriental-wisdom/actions/runs?branch=master&per_page=50"
$deadline = (Get-Date).AddMinutes(15)
$pagesRun = $null

do {
  $runs = Invoke-RestMethod -Uri $runsUri -Headers $headers
  $pagesRun = @(
    $runs.workflow_runs |
      Where-Object { $_.head_sha -eq $releaseSha -and $_.name -match "Pages|pages" } |
      Sort-Object created_at -Descending
  ) | Select-Object -First 1
  if ($pagesRun -and $pagesRun.status -eq "completed") { break }
  Start-Sleep -Seconds 15
} while ((Get-Date) -lt $deadline)

if (-not $pagesRun) { throw "No GitHub Pages Actions run found for $releaseSha." }
if ($pagesRun.status -ne "completed" -or $pagesRun.conclusion -ne "success") {
  throw "Pages run did not succeed: status=$($pagesRun.status), conclusion=$($pagesRun.conclusion), url=$($pagesRun.html_url)"
}
$pagesRun | Select-Object name,status,conclusion,head_sha,html_url
```

If the unauthenticated REST quota is exhausted, use the signed-in GitHub/browser connector to open the repository Actions page and inspect the run for the exact `$releaseSha`; record the same workflow name, `completed`/`success` state, and run URL. Rate limiting is not permission to omit this gate.

- [ ] After the successful Actions result, poll `https://dengsan721-prog.github.io/yi-oriental-wisdom/` until its hashed JS filename matches the newly committed `docs/index.html`. Allow normal CDN propagation; do not claim deployment based only on HTTP 200.

- [ ] Fetch the same public page through the remote web retrieval tool as a second-network check. Confirm the returned HTML references the same new hashed JS asset; this proves the result is not only reachable from the local development server/browser session.

- [ ] Repeat the public browser acceptance at 1440×900 and 390×844:

  - central U+547D “命”;
  - light neutral landing and element theme after calculation;
  - report-owner ritual and correct action order;
  - four primary chapters and three folk entries;
  - detailed story, chart, fortune, and name comparison;
  - home’s two main recording actions and truthful metrics;
  - `#/report/detail` visibly canonicalizes to `#/report/chart` for the saved report;
  - no horizontal overflow;
  - no console errors.

- [ ] Confirm remote SHA:

```powershell
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$releaseSha = (& $gitExe rev-parse HEAD).Trim()
$remoteRefs = @(& $gitExe ls-remote origin refs/heads/master refs/heads/feature/yi-content-engine-rebuild)
foreach ($ref in @("refs/heads/master", "refs/heads/feature/yi-content-engine-rebuild")) {
  if ("$releaseSha`t$ref" -notin $remoteRefs) { throw "Remote ref does not match release HEAD: $ref" }
}
$remoteRefs
```

Both remote refs must equal local `HEAD`.

- [ ] Recheck the protected file one final time:

```powershell
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
if ((Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") { throw "Protected file hash changed." }
& $gitExe ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file entered the index." }
$staged = @(& $gitExe diff --cached --name-only)
if ($staged.Count -ne 0) { throw "Index is not empty after release: $($staged -join ', ')" }
```

- [ ] Final handoff must report:

  - release commit SHA;
  - focused and full test evidence;
  - lint, `tsc`, vinext, GitHub build, and clean-export evidence;
  - local and online desktop/390px results;
  - console and overflow results;
  - protected-file SHA and untracked status;
  - matching GitHub Pages workflow name, `completed`/`success` status, and Actions run link;
  - public link: `https://dengsan721-prog.github.io/yi-oriental-wisdom/`.
