# Yi Story Report Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the result reading experience as a rich, deterministic life story: a seven-part “人生画卷” with reviewed 《道德经》 notes, a professional four-pillars chart followed by a detailed plain-language story and scene advice, a story-led fortune timeline, and clear folk-language compatibility, mirror, and tradition modules.

**Architecture:** Preserve the audited calculation and source models, then project them into dedicated user-facing narrative models. The browser never calls a generative service. A frozen reviewed Dao corpus, deterministic theme selection, explicit story beats, reviewed professional lookup tables, and editorial golden fixtures make the output reproducible and testable. Internal evidence IDs remain in models and tests but never render as source/evidence panels.

**Tech Stack:** TypeScript, React 19, Vitest, React server rendering, existing four-pillars/fortune/mirror engines, local reviewed data tables, CSS.

## Global Constraints

- This is implementation sequence 3 of 4. It depends on the foundation and name plans. Keep the existing embedded name analysis mounted until the integration plan activates the standalone name route.
- Never edit, delete, stage, or commit `site/pnpm-workspace.yaml`; its SHA-256 remains `FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78`.
- Only the chart may show common bazi terminology. The life scroll, fortune, compatibility, mirror, and tradition pages must not show 四柱、日主、十神、月令、旺衰、藏干、纳音、十二长生、干支关系, or calculation language.
- No rebuilt module in this sequence may render “专业依据”, “本章来源”, “本章依据与使用边界”, “可靠级”, “证据等级”, “计算规则”, “规则 ID”, or “数据来源清单”. The still-routable legacy `DetailSection`/`SourceNote` is a temporary sequence boundary and is removed atomically in sequence 4.
- Keep internal source IDs, uncertainty flags, source registries, and calculation audits.
- The life scroll uses Dao wisdom as a literary annotation, never as proof that a chart predicts an event.
- Do not invent a year of wealth, marriage, divorce, illness, disaster, bereavement, or other concrete life event.
- Use conditional, observable scenes: “当……时，你可能……” and “可以留意……”, not deterministic outcomes.
- Do not expose 格局、喜用神、神煞、空亡、调候 unless a complete reviewed algorithm and golden cases are added in this plan. They are intentionally omitted here.
- Do not call the page a demo.
- Run this PowerShell preflight once in the implementation session. Every later command block uses these absolute variables; do not run a task block in a fresh shell without rerunning this preflight:

```powershell
$repoRoot = "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$siteRoot = Join-Path $repoRoot "site"
$protectedFile = Join-Path $siteRoot "pnpm-workspace.yaml"
$protectedSha = "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78"
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpmExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$env:Path = "$nodeRuntimeDir;$env:Path"

foreach ($requiredPath in @($repoRoot, $siteRoot, $protectedFile, $pnpmExe, $gitExe)) {
  if (-not (Test-Path -LiteralPath $requiredPath)) { throw "Missing required path: $requiredPath" }
}
if ((& $gitExe -C $repoRoot branch --show-current) -ne "feature/yi-content-engine-rebuild") {
  throw "Wrong branch."
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $protectedFile).Hash -ne $protectedSha) {
  throw "Protected file hash changed."
}
& $gitExe -C $repoRoot ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file became tracked." }
& $gitExe -C $repoRoot status --short --branch

function Assert-StoryCommitScope {
  param([Parameter(Mandatory = $true)][string[]]$Expected)

  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $protectedFile).Hash -ne $protectedSha) {
    throw "Protected file hash changed."
  }
  & $gitExe -C $repoRoot ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
  if ($LASTEXITCODE -eq 0) { throw "Protected file became tracked." }
  $staged = @(& $gitExe -C $repoRoot diff --cached --name-only)
  $staged | ForEach-Object { Write-Output $_ }
  $difference = @(Compare-Object ($Expected | Sort-Object) ($staged | Sort-Object))
  if ($difference.Count -ne 0) {
    $difference | Format-Table | Out-String | Write-Output
    throw "Unexpected staged path."
  }
  & $gitExe -C $repoRoot diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw "Staged diff check failed." }
}
```

After every explicit `git add`, call `Assert-StoryCommitScope` with that task's exact file allowlist. Never broaden an allowlist with a directory-level add.

## Dependency and Exit Contract

The useful actions from `DetailSection` must be present in `ChartSection` before the old route is removed. The final route/navigation switch happens in the integration plan after all four primary sections render.

**Interfaces:** Inputs are immutable `FourPillarsResult`, `ProfessionalReport`, and `InterpretationItem[]` values already produced by the current engine. Outputs are `ReviewedDaoNote`, `StableStoryFacts`, `LifeScrollNarrative`, `ChartCoordinateValue`, `ChartNarrative`, `FortuneStoryTimeline`, and plain folk projections. `PortraitSection`, `ChartSection`, `FortuneSection`, and the folk sections are the only new public consumers in this sequence. No new model writes to birth facts, the four-pillars object, saved profile, hash route, or local storage.

**Atomic boundary:** This sequence may prove that all useful `DetailSection` actions have equivalents, but it must not remove the old render, import, or route. Sequence 4 changes `ResultShell`, the route union, legacy redirect, navigation, and component deletion in one green commit. Its deletion preflight must rerun `tests/yi/chart-narrative.test.ts` and directly compare a stable fixture's `coveredDetailActionIds` with the exported `DETAIL_ACTION_ID_ALLOWLIST`; a missing, duplicate, or unknown ID blocks deletion.

This plan is complete when:

- the life scroll has seven distinct parts, 1600–2600 Chinese characters, 2–4 contextual Dao notes, a clear animal scene, and a clear historical-person scene;
- the chart displays professional four-pillars data, verified 纳音 and 十二长生, then a 1200–2000-character plain story and detailed career/relationship/rhythm scene advice;
- fortune periods show stage stories and practical actions without evidence accordions;
- folk modules are understandable, concrete, playful, and non-scoring;
- eight golden cases pass structural tests and human editorial review at 14/16 or higher, with neither Dao-note nor chart-translation quality scored zero;
- no forbidden evidence/source label is visible in the rebuilt portrait, chart, fortune, compatibility, mirror, tradition, or reference-atlas surfaces; the explicitly retained legacy detail/source route remains a sequence-4 removal gate.

---

### Task 1: Freeze the Reviewed 《道德经》 Note Corpus

**Files:**

- Create: `site/lib/yi/dao-note-corpus.ts`
- Create: `site/tests/yi/dao-note-corpus.test.ts`

- [ ] Define the corpus contract in the failing test:

```ts
export const DAO_NOTE_CORPUS_VERSION = "dao-note-corpus-v1" as const;

export type DaoNoteTheme =
  | "service" | "patience" | "bend" | "self-knowledge" | "reversal"
  | "small-steps" | "long-road" | "leadership" | "flexibility" | "completion";

export type ReviewedDaoNote = {
  id: string;
  chapter: number;
  themes: readonly DaoNoteTheme[];
  sourceTextTraditional: string;
  displayTextSimplified: string;
  traditionalCommentarySummary: string;
  modernStoryMeanings: readonly [string, string];
  baseEdition: string;
  sourceUrl: string;
  sourceLocator: string;
  traditionalCommentaryEdition: string;
  traditionalCommentaryUrl: string;
  traditionalCommentaryLocator: string;
  independentEditionCheck: {
    edition: string;
    isbnOrCatalogId: string;
    pageOrImageLocator: string;
    checkedText: string;
  };
  variantDecision: string;
  verifiedAt: string;
  reviewer: "传统文本内容复核";
  checksum: `sha256:${string}`;
};

export function canonicalizeDaoNote(
  note: Omit<ReviewedDaoNote, "checksum">,
): string;

export function canonicalizeJson(value: unknown): string;
```

- [ ] Require exactly these ten reviewed entries:

| ID | Chapter | Simplified display text | Primary story theme |
|---|---:|---|---|
| `dao-08-water` | 8 | 上善若水，水善利万物而不争 | service |
| `dao-15-clear` | 15 | 孰能浊以静之徐清 | patience |
| `dao-22-whole` | 22 | 曲则全 | bend |
| `dao-33-self` | 33 | 知人者智，自知者明；胜人者有力，自胜者强 | self-knowledge |
| `dao-40-return` | 40 | 反者道之动，弱者道之用 | reversal |
| `dao-63-small` | 63 | 图难于其易，为大于其细 | small-steps |
| `dao-64-road` | 64 | 千里之行，始于足下 | long-road |
| `dao-66-lower` | 66 | 江海所以能为百谷王者，以其善下之 | leadership |
| `dao-76-soft` | 76 | 强大处下，柔弱处上 | flexibility |
| `dao-81-no-strife` | 81 | 圣人之道，为而不争 | completion |

- [ ] For each record, require:

  - the matching traditional short text;
  - a traditional commentary summary that explains the adopted Wang Bi idea without pretending it is chart evidence;
  - exactly two modern story meanings;
  - the CText base URL `https://ctext.org/dao-de-jing/zh` plus the exact chapter/line locator;
  - the Wang Bi working-text URL `https://ctext.org/wiki.pl?if=gb&res=235636` plus the exact commentary locator;
  - an independent edition check naming the adopted printed or facsimile edition, ISBN/catalog ID, exact page or scan-image locator, and the text actually checked;
  - a written decision for every simplified/traditional or edition variant;
  - a fixed verification date and reviewer role;
  - checksum equal to SHA-256 of the UTF-8 bytes returned by `canonicalizeDaoNote`, with the stored form `sha256:${lowercaseHex}`.

Freeze canonicalization in production code and tests without adding a package:

```ts
export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON rejects non-finite numbers");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .map((raw) => ({ raw, normalized: raw.normalize("NFC") }))
      .sort((left, right) =>
        left.normalized < right.normalized ? -1 : left.normalized > right.normalized ? 1 : 0
      );
    if (new Set(keys.map((key) => key.normalized)).size !== keys.length) {
      throw new TypeError("Canonical JSON rejects duplicate normalized keys");
    }
    const entries = keys.map(({ raw, normalized }) => {
      if (record[raw] === undefined) throw new TypeError("Canonical JSON rejects undefined");
      return `${JSON.stringify(normalized)}:${canonicalizeJson(record[raw])}`;
    });
    return `{${entries.join(",")}}`;
  }
  throw new TypeError(`Unsupported canonical JSON value: ${typeof value}`);
}
```

Arrays keep declared order; object keys sort recursively; all strings and keys normalize to NFC; the serialization is compact and has no trailing newline. Test the exact vector `canonicalizeJson({ b: "曲", a: ["全", 1] }) === '{"a":["全",1],"b":"曲"}'`. Compute the digest with `createHash("sha256").update(canonical, "utf8").digest("hex")`, lowercase it, and prefix `sha256:`. For each complete record, the test destructures `{ checksum, ...payload }`, passes `payload` to `canonicalizeDaoNote`, and recomputes the stored checksum rather than trusting a literal.

The CText Wang Bi page identifies itself as an OCR draft, so it is a discovery/working text only. A record cannot turn green from URL presence or a checksum alone. Before accepting it, the reviewer must compare the short quote and the summarized Wang Bi idea against an independently paginated printed/facsimile edition (the public-domain 四库本 at `https://zh.wikisource.org/zh-hant/老子道徳經_(四庫全書本)` may be one cross-check, but the record still needs an exact page/image or published-edition locator). If the two witnesses disagree in a way that changes the meaning, keep that note out of the ten-record public corpus until `variantDecision` is reviewed.

- [ ] Test selection behavior:

```ts
const selected = selectReviewedDaoNotes(
  ["reversal", "small-steps", "completion"],
  { min: 2, max: 4 },
);
expect(selected.map((note) => note.id)).toEqual([
  "dao-40-return", "dao-63-small", "dao-81-no-strife",
]);
expect(new Set(selected.map((note) => note.id)).size).toBe(selected.length);
```

Selection must be deterministic, ordered by requested theme then corpus order, and never random.

- [ ] Run the red test:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/dao-note-corpus.test.ts
```

Expected failure: the corpus module does not exist.

- [ ] Implement the ten fully reviewed records and:

```ts
export function selectReviewedDaoNotes(
  themes: readonly DaoNoteTheme[],
  bounds: { min: 2; max: 4 },
): ReviewedDaoNote[];
```

If direct theme matches yield fewer than two notes, use `dao-33-self` then `dao-64-road` as stable fallbacks. Never return more than four or duplicate an entry.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/dao-note-corpus.test.ts
```

Expected: corpus, checksum, and deterministic selection tests pass.

- [ ] Commit:

```powershell
$expected = @(
  "site/lib/yi/dao-note-corpus.ts",
  "site/tests/yi/dao-note-corpus.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "feat: freeze reviewed dao note corpus"
```

---

### Task 2: Build the Deterministic Life-Scroll Narrative

**Files:**

- Create: `site/lib/yi/stable-story-facts.ts`
- Create: `site/lib/yi/life-scroll.ts`
- Create: `site/lib/yi/story-mirrors.ts`
- Create: `site/tests/yi/stable-story-facts.test.ts`
- Create: `site/tests/yi/life-scroll.test.ts`
- Create: `site/tests/yi/story-mirrors.test.ts`

- [ ] Define the shared stable-fact selector and the view model:

```ts
export type StableStoryFacts = {
  dayMasterElement: ElementName | null;
  structureBalance: ProfessionalChart["structureBalance"] | null;
  relations: readonly ChartRelation[];
  interpretations: readonly InterpretationItem[];
  excludedInterpretationIds: readonly string[];
  currentLesson: string | null;
  hourUnknown: boolean;
  uncertaintyFlags: readonly (
    | "unknown-hour"
    | "candidate-pillar-excluded"
    | "candidate-professional-field-excluded"
  )[];
};

export function selectStableStoryFacts(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
  items: readonly InterpretationItem[],
): StableStoryFacts;

export type StoryMirror = {
  name: string;
  introduction: string;
  matchingScene: string;
  difference: string;
  takeaway: string;
};

export type DaoNote = {
  chapter: number;
  excerpt: string;
  plainCommentary: {
    traditionalMeaning: string;
    storyConnection: string;
    sceneGuidance: string;
  };
  placement: "opening" | "career" | "relationship" | "turning-point" | "closing";
  internalSourceId: string;
};

export type LifeScrollNarrative = {
  oneLineTheme: string;
  openingScene: readonly string[];
  careerArc: readonly string[];
  relationshipArc: readonly string[];
  turningPointArc: readonly string[];
  matureArc: readonly string[];
  closingLine: string;
  actionNow: string;
  daoNotes: readonly DaoNote[];
  animalInterlude: StoryMirror;
  historicalInterlude: StoryMirror;
  internalEvidenceIds: readonly string[];
  uncertaintyFlags: readonly string[];
};

export function buildLifeScrollNarrative(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
  items: readonly InterpretationItem[],
): LifeScrollNarrative;
```

`selectStableStoryFacts` is the only gateway from chart/report facts into both `buildLifeScrollNarrative` and `buildChartNarrative`. Apply these exact rules:

- `dayMasterElement` is `null` when `ambiguousFields` contains `dayMaster` or `dayPillar`, or `ambiguousPillars` contains `day`;
- `structureBalance` is `null` when `ambiguousFields` contains `structureBalance`;
- retain a relation only when none of its `pillars` occur in `ambiguousPillars`;
- retain an interpretation only when none of its `pillarDependencies` occur in `ambiguousPillars`;
- add every excluded item ID to `excludedInterpretationIds`;
- expose `currentLesson` only when no professional field and no non-hour pillar is ambiguous; otherwise return `null` and use a reviewed neutral choice beat;
- use `null` values to select neutral prose; never read the engine's representative value behind an ambiguity flag.

- [ ] Add failing structural tests:

  - `oneLineTheme` contains 18–36 Han characters;
  - every arc contains 2–4 short paragraphs;
  - the total visible narrative contains 1600–2600 Han characters;
  - opening, career, relationship, turning point, mature arc, closing, and current action are all non-empty;
  - `daoNotes` contains 2–4 unique source IDs;
  - every Dao note has three distinct paragraphs: 45–90 Han characters explaining the adopted traditional meaning, 55–110 connecting it to this story's actual turn, and 45–90 giving one concrete person/action/consequence scene or next move; the combined note is 160–260 Han characters and no segment may be reused unchanged across different selected notes;
  - no visible narrative contains chart terminology or forbidden evidence labels;
  - `internalEvidenceIds` and `uncertaintyFlags` are absent from rendered content but preserved in the model.

- [ ] Add story-dynamics tests requiring distinct text material for:

  1. current situation;
  2. desired or protected outcome;
  3. advantage opening the first door;
  4. the same advantage creating a cost;
  5. a career or relationship low point;
  6. a changed choice;
  7. a visible turn;
  8. a mature method.

Implement this with an internal `StoryBeat` array and render it into the seven public sections so tests can validate the beat IDs without keyword guessing:

```ts
type StoryBeatId =
  | "situation" | "desire" | "opening"
  | "cost" | "low-point" | "choice" | "turn" | "mature-method";

type StoryBeat = {
  id: StoryBeatId;
  domain: "opening" | "career" | "relationship" | "turning-point" | "mature";
  text: string;
};
```

- [ ] Test that unknown-time input omits hour-dependent items, adds one natural uncertainty sentence, and does not display a technical boundary chapter.

- [ ] Add a solar-term-boundary regression using `2024-02-04`, unknown time, 北京, and unspecified gender. First assert the engine marks at least one non-hour pillar or professional field ambiguous. Poison every excluded interpretation and every representative-only report value with the sentinel `候选信息不应出现`; assert neither the life-scroll model nor its rendered visible text contains the sentinel, while `uncertaintyFlags` records the exclusion. Repeat the same sentinel assertion against `buildChartNarrative` in Task 5.

- [ ] Test safe degradation with `items: []` and with career/relationship/rhythm items missing independently. Each case must return a complete, readable seven-part story without throwing, use only chart/report facts that are present, and add no invented event. The fallback story still satisfies minimum section shape, while its `uncertaintyFlags` records the missing domain.

- [ ] Add mirror tests for every animal and historical candidate returned by the existing matchers:

  - animal introduction states the animal’s recognizable behavior or survival pattern;
  - matching scene shows a person, action, and consequence;
  - historical introduction states who the person was in one clear sentence;
  - difference explicitly says the reader’s life is not the historical figure’s life;
  - takeaway is actionable and contains no source/reliability label.

- [ ] Run red tests:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/stable-story-facts.test.ts tests/yi/life-scroll.test.ts tests/yi/story-mirrors.test.ts
```

Expected failure: stable-fact, narrative, and story-mirror modules do not exist.

- [ ] Build deterministic phrase libraries keyed by:

  - stable day-master element for scene texture only, or neutral texture when it is `null`;
  - stable `structureBalance` for opening method and cost, or a neutral arc when it is `null`;
  - strongest stable reviewed content domains for career/relationship material;
  - stable chart relation types for conflict style;
  - stable `currentLesson` for the changed choice, or the reviewed neutral choice beat when it is `null`.

Templates must combine complete paragraphs, not word fragments. Deduplicate conclusions by normalized sentence key before assembling the final arcs. Build domain material only from `StableStoryFacts.interpretations`, with a total helper such as `itemsFor(domain): readonly InterpretationItem[]`; never call the old `pick()` or index an empty filtered array. Missing domains use reviewed neutral scene templates keyed only by stable facts and set the matching uncertainty flag.

- [ ] Build Dao note themes from the actual story beats:

```ts
const themes: DaoNoteTheme[] = [
  hasOverControlCost ? "flexibility" : "self-knowledge",
  hasLargeTask ? "small-steps" : "long-road",
  relationshipNeedsSpace ? "service" : "bend",
  "completion",
];
```

Build `plainCommentary.traditionalMeaning` from the reviewed traditional-commentary summary, `storyConnection` from the current story's concrete tension and turn, and `sceneGuidance` from one recognizable situation with a person, action, and consequence. All three length gates above are mandatory. It must not collapse into one generic sentence, copy the corpus wording unchanged into every report, or use the Dao line as chart evidence.

- [ ] Build story mirrors by projecting existing audited matches; retain their internal IDs but rewrite the public fields into concrete, self-contained introductions and scenes.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/stable-story-facts.test.ts tests/yi/life-scroll.test.ts tests/yi/story-mirrors.test.ts tests/yi/fortune-mirrors.test.ts
```

Expected: narrative structure, variation, mirrors, and existing matchers pass.

- [ ] Commit:

```powershell
$expected = @(
  "site/lib/yi/life-scroll.ts",
  "site/lib/yi/stable-story-facts.ts",
  "site/lib/yi/story-mirrors.ts",
  "site/tests/yi/life-scroll.test.ts",
  "site/tests/yi/stable-story-facts.test.ts",
  "site/tests/yi/story-mirrors.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "feat: build deterministic life scroll narrative"
```

---

### Task 3: Render “人生画卷” as the First Reading Chapter

**Files:**

- Modify: `site/components/yi/PortraitSection.tsx`
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Create: `site/tests/yi/life-scroll-view.test.ts`
- Modify: `site/tests/yi/portrait-view.test.ts`
- Modify: `site/tests/yi/result-navigation.test.ts`
- Modify: `site/app/globals.css`

- [ ] Write failing view tests:

```ts
const html = renderToStaticMarkup(createElement(PortraitSection, {
  chart,
  report,
  items,
}));
for (const text of [
  "人生画卷", "人生一句话", "事业线", "婚姻与关系线",
  "命运转折线", "中后程", "《道德经》小注",
]) {
  expect(html).toContain(text);
}
```

Require the animal and historical interludes to show their introduction, matching scene, difference, and takeaway.

- [ ] Add a forbidden-label test over rendered text:

```ts
for (const forbidden of [
  "专业依据", "本章来源", "本章依据与使用边界", "可靠级",
  "证据等级", "计算规则", "规则 ID", "数据来源清单",
  "日主", "十神", "月令", "旺衰", "藏干", "纳音",
]) {
  expect(html).not.toContain(forbidden);
}
```

- [ ] Run the red tests:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/life-scroll-view.test.ts tests/yi/portrait-view.test.ts
```

Expected failure: the old portrait cards, professional basis labels, and source component still render.

- [ ] Replace `pick()`-driven card composition with one call to `buildLifeScrollNarrative(chart, report, items)`.

- [ ] Change `PortraitSection` props from `{ chart, overview, items }` to `{ chart, report, items }`. Update `ResultShell` to pass its existing `ProfessionalReport`.

- [ ] Remove the now-unused `overview: ProfessionalOverview` prop and type import from `ResultShell`. Remove `overview={buildProfessionalOverview(result)}` from the production `ResultShell` call in `YiExperience`, and remove the same prop plus its now-unused test import from the `renderResult` fixture in `result-navigation.test.ts`. Keep `buildProfessionalOverview` in `YiExperience`: `saveAndOpenHome` still needs it when building the saved profile. Preserve the required `themeElement` prop introduced by the foundation plan and preserve the legacy `DetailSection` import/render unchanged.

- [ ] Render all seven parts in one readable vertical flow. Each section has 2–4 short paragraphs; Dao notes sit beside the story turn they annotate. Do not hide the main arcs behind nested `<details>`.

- [ ] Render Dao notes exactly as:

```tsx
<aside className="dao-story-note">
  <small>《道德经》小注 · 第{note.chapter}章</small>
  <blockquote>{note.excerpt}</blockquote>
  <p><strong>这句话原本在说：</strong>{note.plainCommentary.traditionalMeaning}</p>
  <p><strong>放进你这一卷：</strong>{note.plainCommentary.storyConnection}</p>
  <p><strong>落到眼前一幕：</strong>{note.plainCommentary.sceneGuidance}</p>
</aside>
```

Do not render `internalSourceId`. The three commentary paragraphs remain visible and expanded; do not hide them behind a disclosure control.

- [ ] Use a narrower reading measure on desktop and full-width padded text on 390px. Keep paragraph line height at least 1.75, section spacing consistent, and interludes visually distinct without large empty gaps.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/life-scroll-view.test.ts tests/yi/portrait-view.test.ts tests/yi/life-scroll.test.ts tests/yi/result-navigation.test.ts
```

Expected: the life scroll renders and no professional/evidence UI leaks.

- [ ] Commit:

```powershell
$expected = @(
  "site/app/globals.css",
  "site/components/yi/PortraitSection.tsx",
  "site/components/yi/ResultShell.tsx",
  "site/components/yi/YiExperience.tsx",
  "site/tests/yi/life-scroll-view.test.ts",
  "site/tests/yi/portrait-view.test.ts",
  "site/tests/yi/result-navigation.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "feat: render life scroll experience"
```

---

### Task 4: Add Verified 纳音 and 十二长生 Coordinates

**Files:**

- Create: `site/lib/yi/na-yin.ts`
- Create: `site/lib/yi/twelve-growth.ts`
- Create: `site/tests/yi/na-yin.test.ts`
- Create: `site/tests/yi/twelve-growth.test.ts`
- Modify: `site/lib/yi/types.ts`
- Modify: `site/lib/yi/report-model.ts`
- Modify: `site/tests/yi/report-model.test.ts`

- [ ] Write a failing all-60 纳音 table test. Use these thirty paired entries:

```ts
const NA_YIN_PAIRS = [
  ["甲子", "乙丑", "海中金"], ["丙寅", "丁卯", "炉中火"],
  ["戊辰", "己巳", "大林木"], ["庚午", "辛未", "路旁土"],
  ["壬申", "癸酉", "剑锋金"], ["甲戌", "乙亥", "山头火"],
  ["丙子", "丁丑", "涧下水"], ["戊寅", "己卯", "城头土"],
  ["庚辰", "辛巳", "白蜡金"], ["壬午", "癸未", "杨柳木"],
  ["甲申", "乙酉", "泉中水"], ["丙戌", "丁亥", "屋上土"],
  ["戊子", "己丑", "霹雳火"], ["庚寅", "辛卯", "松柏木"],
  ["壬辰", "癸巳", "长流水"], ["甲午", "乙未", "沙中金"],
  ["丙申", "丁酉", "山下火"], ["戊戌", "己亥", "平地木"],
  ["庚子", "辛丑", "壁上土"], ["壬寅", "癸卯", "金箔金"],
  ["甲辰", "乙巳", "覆灯火"], ["丙午", "丁未", "天河水"],
  ["戊申", "己酉", "大驿土"], ["庚戌", "辛亥", "钗钏金"],
  ["壬子", "癸丑", "桑柘木"], ["甲寅", "乙卯", "大溪水"],
  ["丙辰", "丁巳", "沙中土"], ["戊午", "己未", "天上火"],
  ["庚申", "辛酉", "石榴木"], ["壬戌", "癸亥", "大海水"],
] as const;
```

Assert every one of the 60 valid pairs resolves and invalid stem-branch pairings return `null`.

- [ ] Write failing 十二长生 tests around the fixed start branches and directions:

```ts
const STARTS = {
  甲: ["亥", 1], 乙: ["午", -1],
  丙: ["寅", 1], 丁: ["酉", -1],
  戊: ["寅", 1], 己: ["酉", -1],
  庚: ["巳", 1], 辛: ["子", -1],
  壬: ["申", 1], 癸: ["卯", -1],
} as const;
const STAGES = [
  "长生", "沐浴", "冠带", "临官", "帝旺", "衰",
  "病", "死", "墓", "绝", "胎", "养",
] as const;
```

For every heavenly stem, assert all twelve branches produce all twelve stages exactly once. Include golden assertions `甲亥=长生`, `甲卯=帝旺`, `乙午=长生`, `乙寅=帝旺`, `辛子=长生`.

Require separate frozen metadata records for 纳音 and 十二长生:

```ts
export type ReviewedChartRuleMetadata = {
  ruleVersion: string;
  sourceId: string;
  workingTextUrl: string;
  workingTextLocator: string;
  adoptedEdition: string;
  isbnOrCatalogId: string;
  pageOrImageLocator: string;
  independentEditionCheck: string;
  adoptedConvention: string;
  variantDecisions: Readonly<Record<string, string>>;
  reviewedAt: string;
  reviewerRole: "命理规则内容复核";
};
```

The CText 《三命通会》 page at `https://ctext.org/wiki.pl?chapter=926860&if=gb&remap=gb` is a working OCR witness, not sufficient evidence by itself. 纳音 metadata records the exact table locator and the adopted display aliases, including `沙中金/砂中金` and `覆灯火/佛灯火`. 十二长生 metadata must cite its own exact table/passsage locator in an independently paginated printed or facsimile edition that actually supports the adopted “阳干顺、阴干逆，戊随丙、己随丁” convention; do not reuse a 纳音 locator as proof. Tests reject blank locators, an OCR-only evidence chain, or an unrecorded alias decision. Metadata stays internal and is not rendered.

- [ ] Run the red tests:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/na-yin.test.ts tests/yi/twelve-growth.test.ts
```

Expected failure: both lookup modules are missing.

- [ ] Implement pure lookups:

```ts
export function getNaYin(stem: string, branch: string): string | null;

export type TwelveGrowthStage =
  | "长生" | "沐浴" | "冠带" | "临官" | "帝旺" | "衰"
  | "病" | "死" | "墓" | "绝" | "胎" | "养";

export function getTwelveGrowthStage(
  dayStem: string,
  targetBranch: string,
): TwelveGrowthStage | null;
```

- [ ] Add an always-four-key coordinate projection without changing the existing three/four-item `pillarFacts` contract:

```ts
// site/lib/yi/types.ts
import type { TwelveGrowthStage } from "./twelve-growth";

export type ChartCoordinateReason =
  | "target-pillar-ambiguous"
  | "day-pillar-ambiguous"
  | "target-pillar-unavailable"
  | "day-stem-unavailable";

export type ChartCoordinateValue<T> =
  | { status: "stable"; value: T }
  | { status: "candidate"; value: T; reasons: readonly ChartCoordinateReason[] }
  | { status: "unavailable"; reason: ChartCoordinateReason };

export type PillarCoordinateFact = {
  key: PillarKey;
  naYin: ChartCoordinateValue<string>;
  twelveGrowth: ChartCoordinateValue<TwelveGrowthStage>;
};

export type ProfessionalReport = {
  // existing fields remain
  pillarCoordinates: Readonly<Record<PillarKey, PillarCoordinateFact>>;
};
```

Keep `TwelveGrowthStage` defined and exported only by `twelve-growth.ts`. `types.ts` must use the type-only import above, and `twelve-growth.ts` must not import `types.ts`; this keeps the report contract defined for `tsc` without introducing a runtime cycle.

`report-model.ts` uses the target pillar’s stem+branch for 纳音 and the day stem+target pillar branch for 十二长生. `pillarFacts` continues to contain only three items when hour is unknown, while `pillarCoordinates` always has `year`, `month`, `day`, and `hour`, allowing the professional four-column table to render an explicit unavailable hour without inventing a pillar. Encode uncertainty at the value level:

- stable day + stable target → both values are `stable`;
- ambiguous target with a representative value → both are `candidate` with `target-pillar-ambiguous`;
- ambiguous day with a representative day stem → every available pillar’s 十二长生 is `candidate` with `day-pillar-ambiguous`, while 纳音 for otherwise stable target pillars remains `stable`;
- ambiguous day + ambiguous target → 十二长生 records both reasons;
- unknown hour → both hour coordinates are `unavailable`; never synthesize an hour value;
- unavailable day stem → every 十二长生 value is `unavailable`.

Add exact report-model tests for all six cases. The professional table must append “待核” to candidates and render an explicit “未提供” state for unavailable values; no candidate may be projected as stable.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/na-yin.test.ts tests/yi/twelve-growth.test.ts tests/yi/report-model.test.ts
```

Expected: all table and report projections pass.

- [ ] Commit:

```powershell
$expected = @(
  "site/lib/yi/na-yin.ts",
  "site/lib/yi/report-model.ts",
  "site/lib/yi/twelve-growth.ts",
  "site/lib/yi/types.ts",
  "site/tests/yi/na-yin.test.ts",
  "site/tests/yi/report-model.test.ts",
  "site/tests/yi/twelve-growth.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "feat: add verified chart coordinates"
```

---

### Task 5: Build the Professional Chart and Detailed Plain-Language Story

**Files:**

- Create: `site/lib/yi/chart-narrative.ts`
- Create: `site/tests/yi/chart-narrative.test.ts`
- Modify: `site/components/yi/ChartSection.tsx`
- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/tests/yi/chart-view-model.test.ts`
- Modify: `site/tests/yi/result-navigation.test.ts`
- Modify: `site/app/globals.css`

- [ ] Define the narrative model:

```ts
import { INTERPRETATION_IDS, type InterpretationId } from "./interpretation-enrichment";

export type DetailActionId =
  `${InterpretationId}:${"actionNow" | "actionLongTerm"}`;

export const DETAIL_ACTION_ID_ALLOWLIST: readonly DetailActionId[] =
  INTERPRETATION_IDS.flatMap((id) => [
    `${id}:actionNow` as const,
    `${id}:actionLongTerm` as const,
  ]);

export type NarrativeBeat = {
  situation: string;
  opportunity: string;
  firstStrength: string;
  overuseCost: string;
  lowPoint: string;
  newChoice: string;
  turn: string;
  observableSignal: string;
  sourceActionIds: readonly DetailActionId[];
};

export type CareerScene =
  | "task-entry" | "collaboration-conflict"
  | "opportunity-choice" | "long-accumulation";
export type RelationshipScene =
  | "approach" | "misunderstanding" | "argument" | "repair" | "boundary";
export type RhythmScene =
  | "productive-window" | "overload-signal"
  | "pause" | "restart" | "decision-window";

export type SceneMicroStory<TScene extends string> = {
  id: string;
  covers: readonly TScene[];
  title: string;
  trigger: string;
  firstReaction: string;
  apparentBenefit: string;
  cost: string;
  turnAction: string;
  example: string;
  observableSignal: string;
  sourceActionIds: readonly DetailActionId[];
};

export type PlainChartTranslation = {
  sectionId: "overview" | "month-strength" | "element-flow" | "relations" | "missing-elements";
  whatItMeans: string;
  lifeScene: string;
  practicalGuidance: string;
};

export type ChartNarrative = {
  professionalTranslations: readonly [
    PlainChartTranslation,
    PlainChartTranslation,
    PlainChartTranslation,
    PlainChartTranslation,
    PlainChartTranslation,
  ];
  self: NarrativeBeat;
  career: NarrativeBeat;
  relationship: NarrativeBeat;
  rhythm: NarrativeBeat;
  careerAdvice: readonly [
    SceneMicroStory<CareerScene>,
    SceneMicroStory<CareerScene>,
  ];
  relationshipAdvice: readonly [
    SceneMicroStory<RelationshipScene>,
    SceneMicroStory<RelationshipScene>,
  ];
  rhythmAdvice: readonly [
    SceneMicroStory<RhythmScene>,
    SceneMicroStory<RhythmScene>,
  ];
  coveredDetailActionIds: readonly DetailActionId[];
  internalEvidenceIds: readonly string[];
  uncertaintyFlags: readonly string[];
};

export function buildChartNarrative(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
  items: readonly InterpretationItem[],
): ChartNarrative;

export function listDetailActionIds(
  items: readonly InterpretationItem[],
): DetailActionId[];

export type ChartElementVisibility = {
  visibleElements: readonly ElementName[];
  hiddenOnlyElements: readonly ElementName[];
  absentInStablePillars: readonly ElementName[];
  hourUnknown: boolean;
};

export function buildChartElementVisibility(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
): ChartElementVisibility;
```

- [ ] Add failing length and structure tests:

  - `professionalTranslations` contains exactly the five section IDs in declared order;
  - every professional translation has three visible paragraphs: `whatItMeans` is 45–90 Han characters, `lifeScene` is 55–110 and contains a person/action/consequence, and `practicalGuidance` is 45–90 with a bounded next move; total length is 160–260 Han characters;
  - the four long-reading sections total 1200–2000 Han characters;
  - each `NarrativeBeat` has all eight visible story fields, a distinct observable signal, and the internal `sourceActionIds` mapping;
  - career advice totals 500–850 Han characters;
  - relationship advice totals 500–850;
  - rhythm advice totals 420–700;
  - each category has exactly two complete microstories;
  - professional terms appear only in professional chart strings, not `ChartNarrative`;
  - no source/evidence label appears in narrative output.

- [ ] Add a strict legacy-action migration test using the fixed stable fixture `{ name: "测试人林岚", date: "1990-06-15", time: "09:30", location: "北京市", gender: "female", timeConfidence: "exact" }`. `listDetailActionIds(items)` must equal `DETAIL_ACTION_ID_ALLOWLIST` in the frozen `INTERPRETATION_IDS` order. Flatten `sourceActionIds` from the four narrative beats and all six microstories; require every allowlisted ID exactly once, reject duplicates and unknown IDs, and require that flattened list to equal `coveredDetailActionIds`. The integration deletion gate imports `DETAIL_ACTION_ID_ALLOWLIST` and `buildChartNarrative`, rebuilds this same fixture, repeats the exact set comparison, and stops before deleting `DetailSection` if it fails.

```ts
const attached = [
  narrative.self, narrative.career, narrative.relationship, narrative.rhythm,
  ...narrative.careerAdvice,
  ...narrative.relationshipAdvice,
  ...narrative.rhythmAdvice,
].flatMap((entry) => entry.sourceActionIds);

expect(listDetailActionIds(items)).toEqual(DETAIL_ACTION_ID_ALLOWLIST);
expect(attached).toHaveLength(new Set(attached).size);
expect([...attached].sort()).toEqual([...DETAIL_ACTION_ID_ALLOWLIST].sort());
expect(narrative.coveredDetailActionIds).toEqual(attached);
```

- [ ] Add element-visibility tests:

  - visible = stable pillar stems plus stable branch elements;
  - hidden-only = elements found in stable `hiddenStems` but not visible;
  - absent = neither visible nor hidden in the stable pillars;
  - ambiguous pillars do not contribute to any definite set;
  - unknown hour sets `hourUnknown: true` and the public sentence says the hour pillar may change the current absence list;
  - the output never says an absent element is automatically 喜用神 or must be supplemented.

- [ ] Require scenario coverage:

  - career: task entry, collaboration conflict, opportunity choice, long accumulation;
  - relationship: approach, misunderstanding, argument, repair, boundary;
  - rhythm: productive period, overload signal, pause, restart, decision window.

Assert coverage from the typed `covers` arrays, not from word-count or keyword guesses:

```ts
expect(new Set(narrative.careerAdvice.flatMap((story) => story.covers)))
  .toEqual(new Set<CareerScene>([
    "task-entry", "collaboration-conflict", "opportunity-choice", "long-accumulation",
  ]));
expect(new Set(narrative.relationshipAdvice.flatMap((story) => story.covers)))
  .toEqual(new Set<RelationshipScene>([
    "approach", "misunderstanding", "argument", "repair", "boundary",
  ]));
expect(new Set(narrative.rhythmAdvice.flatMap((story) => story.covers)))
  .toEqual(new Set<RhythmScene>([
    "productive-window", "overload-signal", "pause", "restart", "decision-window",
  ]));
```

- [ ] Test unknown time: omit hour-dependent interpretations and include one plain sentence saying the hour-dependent part is not shown.

- [ ] Repeat Task 2's `2024-02-04` solar-term-boundary sentinel regression against `buildChartNarrative`. Only `selectStableStoryFacts(...).interpretations` may supply narrative text or `sourceActionIds`; excluded candidate items must not leak the sentinel or be listed as covered. The professional table may show candidate coordinates only with the explicit “待核” label.

- [ ] Run the red test:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/chart-narrative.test.ts
```

Expected failure: the narrative module is missing.

- [ ] Implement deterministic narrative templates from `selectStableStoryFacts(...).interpretations`. Use `scenario`, `advantageVersion`, `shadowVersion`, `actionNow`, and `actionLongTerm` as raw material, but rewrite each category into one causal arc. Attach each consumed field's exact `${item.id}:actionNow` or `${item.id}:actionLongTerm` ID to one and only one beat/microstory. Do not concatenate old cards, use excluded candidate facts, or repeat the life scroll sentence by sentence.

- [ ] Build the five `professionalTranslations` from the same stable selector plus the corresponding professional section. `whatItMeans` explains the immediately preceding chart statement without adding a new technical claim; `lifeScene` shows how that pattern could look in a recognizable work, relationship, decision, or rhythm scene; `practicalGuidance` gives a bounded experiment and states uncertainty where the source field is candidate or unavailable. These are reviewed narrative projections, not deterministic predictions.

- [ ] Replace the chart top with a true four-column professional table:

| Row | Value source |
|---|---|
| 天干 | `pillarFact.stem` |
| 地支 | `pillarFact.branch` |
| 主星／十神 | `pillarFact.stemTenGod` |
| 藏干 | `hiddenStems[].stem` |
| 藏干十神 | `hiddenStems[].tenGod` |
| 纳音 | render `report.pillarCoordinates[key].naYin` by status |
| 十二长生 | render `report.pillarCoordinates[key].twelveGrowth` by status |

For an unknown hour, render a clear “时辰未填写” column state and do not synthesize values.

- [ ] Follow the table with these professional sections in order:

  1. 命局总论;
  2. 月令与旺衰;
  3. 五行气势与显隐;
  4. 天干地支关系;
  5. 五行缺失说明.

Every professional paragraph is immediately followed by its matching three-paragraph translation:

```tsx
<div className="plain-translation">
  <p><strong>这是什么意思：</strong>{translation.whatItMeans}</p>
  <p><strong>生活里会怎样：</strong>{translation.lifeScene}</p>
  <p><strong>可以怎么做：</strong>{translation.practicalGuidance}</p>
</div>
```

The translation contains no new professional term and must satisfy the 160–260-Han-character, person/action/consequence, and bounded-guidance gates above. A one-sentence gloss is a test failure.

The 五行缺失 section uses `buildChartElementVisibility` and labels the three sets “明见”, “只藏未透”, and “当前稳定柱未见”. When the hour is unknown, append “时柱未填写，当前未见项仍可能随时柱变化”. Never turn this list into “缺什么补什么”.

- [ ] Remove unsupported current claims:

  - remove the public `调候` row;
  - do not show 格局、喜用神、神煞、空亡;
  - do not show “观察置信度”, source chapters, rule IDs, or calculation boundary panels;
  - keep a single natural missing-fact sentence where necessary.

- [ ] Render “详细通俗解读” with the four `NarrativeBeat` stories, then render “事业场景”, “关系场景”, and “生活节奏” with two microstories each. Main reading stays expanded; do not bury all value behind nested details.

- [ ] Change `ChartSection` props to `{ name?: string; chart: FourPillarsResult; report: ProfessionalReport; items: readonly InterpretationItem[] }`, call `buildChartNarrative(chart, report, items)`, and update `ResultShell` to pass its existing `interpretations`. Do not rebuild interpretations inside `ChartSection`.

- [ ] Map every stable action currently shown by `DetailSection` into exactly one chart narrative beat or microstory and expose only its internal ID through `sourceActionIds`/`coveredDetailActionIds`; never render those IDs. Keep the existing `DetailSection` import, `activeSection === "detail"` render, `SourceNote`, and route unchanged in this sequence so `#/report/detail` remains usable. The integration plan may delete them only after the full stable-fixture allowlist assertion above is green.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/chart-narrative.test.ts tests/yi/chart-view-model.test.ts tests/yi/report-model.test.ts tests/yi/result-navigation.test.ts
```

Expected: the chart table, professional explanation, long story, and migrated actions pass.

- [ ] Commit:

```powershell
$expected = @(
  "site/app/globals.css",
  "site/components/yi/ChartSection.tsx",
  "site/components/yi/ResultShell.tsx",
  "site/lib/yi/chart-narrative.ts",
  "site/tests/yi/chart-narrative.test.ts",
  "site/tests/yi/chart-view-model.test.ts",
  "site/tests/yi/result-navigation.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "refactor: migrate detail stories into chart"
```

---

### Task 6: Present 大运 as Stage Stories

**Files:**

- Create: `site/lib/yi/fortune-story.ts`
- Create: `site/tests/yi/fortune-story.test.ts`
- Modify: `site/components/yi/FortuneSection.tsx`
- Modify: `site/tests/yi/fortune-mirrors.test.ts`
- Modify: `site/app/globals.css`

- [ ] Define the public projection:

```ts
export type FortuneStoryPeriod = {
  id: string;
  ageRange: string;
  yearRange: string;
  title: string;
  openingScene: string;
  careerScene: string;
  relationshipScene: string;
  familyScene: string;
  favorableCurrent: string;
  likelyCost: string;
  actions: readonly [string, string, string];
  years: readonly {
    year: number;
    title: string;
    scene: string;
    action: string;
  }[];
  internalMethodIds: readonly string[];
};

export type FortuneStoryTimeline =
  | {
      status: "available";
      periods: readonly [FortuneStoryPeriod, ...FortuneStoryPeriod[]];
    }
  | {
      status: "unavailable";
      reason: "unknown-time" | "gender-unspecified";
      explanation: string;
    };

export function buildFortuneStoryTimeline(
  chart: Readonly<FourPillarsResult>,
  birth: Readonly<BirthInput>,
): FortuneStoryTimeline;
```

- [ ] Add failing tests that compare the projection to `buildFortuneTimeline`:

  - age/year ranges and period order are identical;
  - all public scenes and three actions are non-empty;
  - internal method IDs remain available but do not appear in visible text;
  - no visible string contains source lists, confidence grades, “九项专业依据”, rule versions, or chart terminology;
  - exact time plus female/male gender returns `{ status: "available", periods }`;
  - unknown time returns `{ status: "unavailable", reason: "unknown-time", explanation }`;
  - exact time plus unspecified gender returns `{ status: "unavailable", reason: "gender-unspecified", explanation }`;
  - when both facts are missing, `unknown-time` wins so the component renders one explanation, never two;
  - unavailable results have no `periods` field and never fabricate a timeline.

- [ ] Run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/fortune-story.test.ts
```

Expected failure: the projection module is missing.

- [ ] For available inputs, build the projection from existing `stageStory`, `lifeAreas`, `alignedState`, `strainedState`, `actions`, and year scenes. Preserve the underlying calculation unchanged. For unavailable inputs, return the discriminated explanation before reading period data.

- [ ] Simplify `FortuneSection`:

  - display the selected stage story and its main areas immediately;
  - show “顺风处”, “最容易吃亏的地方”, and “这一程最值得做的三件事”;
  - keep the age and year selectors;
  - remove the nine-evidence accordion, confidence badge, source registry, method details, rule version, and year-basis accordion;
  - show selected-year scene and action directly.

Branch on `timeline.status` in `FortuneSection`. Render `timeline.explanation` once for the unavailable branch. Pass available `timeline.periods` to a small `AvailableFortuneStory` child that owns the period/year `useState` hooks; this preserves the Rules of Hooks if availability changes between renders. Never create a placeholder period to satisfy the UI.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/fortune-story.test.ts tests/yi/fortune-mirrors.test.ts
```

Expected: the calculation remains stable and the new public projection passes.

- [ ] Commit:

```powershell
$expected = @(
  "site/app/globals.css",
  "site/components/yi/FortuneSection.tsx",
  "site/lib/yi/fortune-story.ts",
  "site/tests/yi/fortune-mirrors.test.ts",
  "site/tests/yi/fortune-story.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "feat: present fortune stages as stories"
```

---

### Task 7: Rewrite 合盘、镜像、传统 for Folk-Language Fun

**Files:**

- Modify: `site/components/yi/CompatibilitySection.tsx`
- Modify: `site/components/yi/MirrorSection.tsx`
- Modify: `site/components/yi/TraditionSection.tsx`
- Modify: `site/components/yi/ReferenceAtlasSection.tsx`
- Modify: `site/lib/yi/compatibility.ts`
- Create: `site/lib/yi/folk-saying-corpus.ts`
- Modify: `site/lib/yi/mirrors.ts`
- Modify: `site/lib/yi/traditional-atlas.ts`
- Modify: `site/lib/yi/traditional-content.ts`
- Modify: `site/tests/yi/compatibility-traditions.test.ts`
- Create: `site/tests/yi/folk-saying-corpus.test.ts`
- Modify: `site/tests/yi/fortune-mirrors.test.ts`
- Modify: `site/tests/yi/traditional-atlas.test.ts`
- Create: `docs/editorial/yi-folk-saying-review-v1.md`
- Modify: `site/app/globals.css`

- [ ] Add failing public-copy tests.

Compatibility must show:

  1. “你们更像哪一种搭档”;
  2. “最容易产生好感的地方”;
  3. “最容易误会的场景”;
  4. “一次争执可能怎样发生”;
  5. “怎样把话说回来”;
  6. “下次可以一起试的小动作”.

Mirror must introduce the animal/person before the comparison, then show the matching scene, important difference, and takeaway.

Tradition must use “民间常说”, explain what the saying means in a familiar situation, give a playful observation, and end with one action.

The face, mole, palm, and constellation reference atlas may keep its verified images and self-selection controls, but its selected reading must use the same folk projection. Remove “专业到生活的七层翻译”, source lists, professional result headings, evidence details, and repeated boundary panels. Keep the short privacy fact that the page does not read or upload a photo. `CompatibilitySection`, `MirrorSection`, `TraditionSection`, and `ReferenceAtlasSection` are all inside this audit scope.

- [ ] Assert all four folk surfaces omit:

```ts
const forbidden = [
  "专业依据", "本章来源", "本章依据与使用边界", "可靠级",
  "规则 ID", "命盘依据", "参考依据", "匹配百分比", "总分",
  "注定", "必然", "一定会", "克夫", "克妻", "刑克",
  "短命", "寿元", "得病", "患病", "必有大财", "必破财",
  "必定结婚", "必定离婚", "必生子", "绝后", "血光", "灾祸",
];
```

Also reject regex patterns that promise a concrete outcome at an exact age, year, month, or day. Keep explicit negation in the global footer separate from the folk projection audit so a sentence such as “不用于判断寿命” does not create a false positive.

- [ ] Give every public folk projection a typed shape:

```ts
export type FolkSayingReviewId = `folk-review-${string}`;

export type FolkProjection = {
  internalReviewId: FolkSayingReviewId;
  saying: `民间常说${string}`;
  scene: string;
  playfulObservation: string;
  action?: string;
};

export type ReviewedFolkSaying = {
  id: FolkSayingReviewId;
  saying: `民间常说${string}`;
  usage: "compatibility" | "animal-mirror" | "historical-mirror" | "tradition" | "reference-atlas";
  attestations: readonly [
    { title: string; publisherOrInstitution: string; url: string; exactLocator: string },
    { title: string; publisherOrInstitution: string; url: string; exactLocator: string },
  ];
  plainConsensusMeaning: string;
  safeUseDecision: string;
  primaryReviewerId: string;
  secondReviewerId: string;
  reviewedAt: string;
  decision: "approved" | "rejected";
};
```

Require `scene` to contain a person/action/consequence rather than an abstract trait. Compatibility and tradition projections require an action; animal/historical mirror projections may omit it only when their existing `takeaway` supplies the concrete action. No projection may contain a score, exact prediction time, health claim, lifespan claim, guaranteed money outcome, marriage/fertility outcome, or disaster claim.

- [ ] Add a failing internal consensus-corpus test. Every `internalReviewId` used by a public projection must resolve to one approved `ReviewedFolkSaying`; its stored `saying` must equal the public saying exactly. Require two independently owned, exact locators from a published folk-custom collection, library/museum/public-cultural record, or another traceable edition. Reject blank locators, search-result URLs, two records from the same publisher/institution, a lone social post, AI-generated wording, self-review, or a claim whose `safeUseDecision` does not explain the limited playful use. `primaryReviewerId` and `secondReviewerId` must differ.

- [ ] Create `docs/editorial/yi-folk-saying-review-v1.md` with one row per corpus ID. Record both attestation locators, the familiar situation in which the saying is actually used, the wording retained or softened, primary and second reviewer IDs, one rejection/correction example, review date, and `approved` decision. The test parses the table and requires exact one-to-one coverage with the corpus. This metadata is an internal editorial gate and must never render in the product.

- [ ] Run the red cluster:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/folk-saying-corpus.test.ts tests/yi/compatibility-traditions.test.ts tests/yi/fortune-mirrors.test.ts tests/yi/traditional-atlas.test.ts
```

Expected failure: the reviewed consensus corpus does not exist and existing views still expose evidence, source, reliability, or abstract copy.

- [ ] Add the reviewed corpus and user-facing projection helpers inside the existing domain files. Preserve internal evidence/source fields in the engine result, but expose view fields such as `internalReviewId`, `scene`, `misunderstanding`, `repairLine`, `smallAction`, and `folkExplanation`. Every helper must select an approved corpus entry rather than prepend “民间常说” to newly invented text. `traditional-content.ts` owns the short saying/scene/action copy selected by `traditional-atlas.ts`; `ReferenceAtlasSection` renders only that projection.

- [ ] Rewrite all four components to render only the plain projections. Use concrete dialogue or actions; do not turn the page into a compatibility score or professional chart. Render `saying`, scene, playful observation, and action/takeaway only; never render `internalReviewId`, attestations, reviewer IDs, or editorial decisions.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/folk-saying-corpus.test.ts tests/yi/compatibility-traditions.test.ts tests/yi/fortune-mirrors.test.ts tests/yi/traditional-atlas.test.ts
```

Expected: folk modules are clear, concrete, and non-scoring.

- [ ] Commit:

```powershell
$expected = @(
  "docs/editorial/yi-folk-saying-review-v1.md",
  "site/app/globals.css",
  "site/components/yi/CompatibilitySection.tsx",
  "site/components/yi/MirrorSection.tsx",
  "site/components/yi/ReferenceAtlasSection.tsx",
  "site/components/yi/TraditionSection.tsx",
  "site/lib/yi/compatibility.ts",
  "site/lib/yi/folk-saying-corpus.ts",
  "site/lib/yi/mirrors.ts",
  "site/lib/yi/traditional-atlas.ts",
  "site/lib/yi/traditional-content.ts",
  "site/tests/yi/compatibility-traditions.test.ts",
  "site/tests/yi/folk-saying-corpus.test.ts",
  "site/tests/yi/fortune-mirrors.test.ts",
  "site/tests/yi/traditional-atlas.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "feat: make folk readings concrete and playful"
```

---

### Task 8: Add Eight Editorial Golden Cases and Human Review

**Files:**

- Create: `site/tests/fixtures/yi/story-golden-cases.ts`
- Create: `site/tests/fixtures/yi/story-goldens/1990-06-15-0930.json`
- Create: `site/tests/fixtures/yi/story-goldens/1992-11-03-unknown.json`
- Create: `site/tests/fixtures/yi/story-goldens/1986-02-05-1200.json`
- Create: `site/tests/fixtures/yi/story-goldens/2001-09-21-1410.json`
- Create: `site/tests/fixtures/yi/story-goldens/2024-02-04-unknown.json`
- Create: `site/tests/fixtures/yi/story-goldens/1978-12-05-0620.json`
- Create: `site/tests/fixtures/yi/story-goldens/1995-05-17-1200.json`
- Create: `site/tests/fixtures/yi/story-goldens/1988-08-08-1830.json`
- Create: `site/tests/yi/story-goldens.generate.test.ts`
- Create: `site/tests/yi/story-goldens.test.ts`
- Create: `docs/editorial/yi-story-golden-review-v1.md`

- [ ] Freeze these exact inputs:

```ts
import type { BirthInput } from "../../../lib/yi/types";

export type StoryGoldenCase = {
  id: string;
  birth: BirthInput;
  expectedFortune: "available" | "unknown-time" | "gender-unspecified";
};

const BASE_GOLDEN_BIRTH = {
  name: "测试人林岚",
  location: "北京市",
} as const;

export const STORY_GOLDEN_CASES = [
  {
    id: "1990-06-15-0930",
    birth: { ...BASE_GOLDEN_BIRTH, date: "1990-06-15", time: "09:30", gender: "female", timeConfidence: "exact" },
    expectedFortune: "available",
  },
  {
    id: "1992-11-03-unknown",
    birth: { ...BASE_GOLDEN_BIRTH, date: "1992-11-03", time: null, gender: "unspecified", timeConfidence: "unknown" },
    expectedFortune: "unknown-time",
  },
  {
    id: "1986-02-05-1200",
    birth: { ...BASE_GOLDEN_BIRTH, date: "1986-02-05", time: "12:00", gender: "unspecified", timeConfidence: "exact" },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "2001-09-21-1410",
    birth: { ...BASE_GOLDEN_BIRTH, date: "2001-09-21", time: "14:10", gender: "unspecified", timeConfidence: "exact" },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "2024-02-04-unknown",
    birth: { ...BASE_GOLDEN_BIRTH, date: "2024-02-04", time: null, gender: "unspecified", timeConfidence: "unknown" },
    expectedFortune: "unknown-time",
  },
  {
    id: "1978-12-05-0620",
    birth: { ...BASE_GOLDEN_BIRTH, date: "1978-12-05", time: "06:20", gender: "unspecified", timeConfidence: "exact" },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "1995-05-17-1200",
    birth: { ...BASE_GOLDEN_BIRTH, date: "1995-05-17", time: "12:00", gender: "unspecified", timeConfidence: "exact" },
    expectedFortune: "gender-unspecified",
  },
  {
    id: "1988-08-08-1830",
    birth: { ...BASE_GOLDEN_BIRTH, date: "1988-08-08", time: "18:30", gender: "unspecified", timeConfidence: "exact" },
    expectedFortune: "gender-unspecified",
  },
] as const satisfies readonly StoryGoldenCase[];
```

The first case deliberately fixes female gender and exact time so the golden set contains a real, reviewable 大运 story. The unknown-time cases prove the `unknown-time` explanation, and exact-time unspecified cases prove the `gender-unspecified` explanation. Do not silently fill gender or time in the generator.

- [ ] Add golden coverage assertions:

  - all five day-master elements appear;
  - `support-heavy`, `mixed`, and `expression-heavy` appear;
  - exact and unknown time appear;
  - at least one solar-term boundary ambiguity appears;
  - complete and missing-element charts appear;
  - relation and no-relation examples appear;
  - at least one `available` and one `unavailable` fortune projection appear;
  - every actual fortune status/reason equals the fixture's `expectedFortune`.

- [ ] Add structural quality assertions over every generated JSON:

  - life-scroll and chart length bounds;
  - every Dao note has all three bounded commentary paragraphs and every chart professional section has its matching three-part plain translation;
  - all required beats/microstories;
  - 2–4 Dao notes with unique IDs;
  - an available fortune has at least one period, complete stage scenes, exactly three actions, and readable year scenes;
  - an unavailable fortune has exactly one plain explanation and no `periods` field;
  - no forbidden claims or evidence UI labels;
  - no exact-future-event promise;
  - outputs differ across day-master elements and structure balances;
  - repeated normalized sentences stay below 12% of visible sentences.

- [ ] Run the red test before creating golden JSON:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/story-goldens.test.ts
```

Expected failure: fixtures and reviewed golden files do not exist.

- [ ] Add an explicit opt-in generator test at `site/tests/yi/story-goldens.generate.test.ts`. It always defines a Vitest test; when `YI_WRITE_STORY_GOLDENS !== "1"`, that test asserts the eight fixture files are unchanged and returns without writing. In write mode it imports the same `STORY_GOLDEN_CASES` and production builders as the assertion test, reuses `canonicalizeJson` from Task 1 plus one final newline, and writes only the eight exact allowlisted fixture paths. Generate with:

```powershell
try {
  $env:YI_WRITE_STORY_GOLDENS = "1"
  Set-Location -LiteralPath $siteRoot
  & $pnpmExe exec vitest run tests/yi/story-goldens.generate.test.ts
  if ($LASTEXITCODE -ne 0) { throw "Golden generation failed." }
} finally {
  Remove-Item Env:YI_WRITE_STORY_GOLDENS -ErrorAction SilentlyContinue
}
```

Each JSON contains the complete `lifeScroll`, `chartNarrative`, and discriminated `fortuneStory` projection plus its input metadata. Inspect every complete JSON before review. The normal `& $pnpmExe test` and `story-goldens.test.ts` commands are read-only and must never update expected files.

- [ ] Create `docs/editorial/yi-story-golden-review-v1.md` with one row per case and eight 0–2 scores:

  1. story arc is complete;
  2. concrete scenes are easy to picture;
  3. career/relationship/rhythm are distinct;
  4. every Dao note explains the adopted meaning, connects it to the actual turn, and lands in a concrete scene;
  5. all five professional chart translations accurately explain the preceding statement in three readable parts;
  6. career/relationship/rhythm guidance is detailed, bounded, and actionable;
  7. language is engaging without deterministic claims;
  8. historical and animal mirrors are understandable.

Each case must total at least 14/16, and neither the Dao-note score nor the chart-translation score may be below 1. Add separate non-scoring `fortuneStatus` and `fortuneReview` columns: for available output, the review names one concrete stage scene and confirms its three actions are readable; for unavailable output, it confirms the single explanation matches the missing fact and no timeline was invented. The author/generator cannot approve their own output. Record `author`, a different `independentReviewer`, reviewer role, review date, one strongest passage, one corrected weakness, revision note, and `signoff: approved`. The test parses the table and fails if a case is missing, under 14, has a zero Dao/translation score, is self-reviewed, has a mismatched/missing fortune review, lacks a returned-for-revision/correction record, or is not explicitly approved. Release verification rechecks this sign-off instead of trusting an unreviewed numeric table.

- [ ] Re-run:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/story-goldens.test.ts tests/yi/life-scroll.test.ts tests/yi/chart-narrative.test.ts tests/yi/fortune-story.test.ts tests/yi/dao-note-corpus.test.ts
```

Expected: all eight automated gates and review-table gates pass.

- [ ] Commit:

```powershell
$expected = @(
  "docs/editorial/yi-story-golden-review-v1.md",
  "site/tests/fixtures/yi/story-golden-cases.ts",
  "site/tests/fixtures/yi/story-goldens/1978-12-05-0620.json",
  "site/tests/fixtures/yi/story-goldens/1986-02-05-1200.json",
  "site/tests/fixtures/yi/story-goldens/1988-08-08-1830.json",
  "site/tests/fixtures/yi/story-goldens/1990-06-15-0930.json",
  "site/tests/fixtures/yi/story-goldens/1992-11-03-unknown.json",
  "site/tests/fixtures/yi/story-goldens/1995-05-17-1200.json",
  "site/tests/fixtures/yi/story-goldens/2001-09-21-1410.json",
  "site/tests/fixtures/yi/story-goldens/2024-02-04-unknown.json",
  "site/tests/yi/story-goldens.generate.test.ts",
  "site/tests/yi/story-goldens.test.ts"
)
& $gitExe -C $repoRoot add -- $expected
Assert-StoryCommitScope -Expected $expected
& $gitExe -C $repoRoot commit -m "test: add editorial golden story gates"
```

---

### Task 9: Story Report Focused Verification

**Files:**

- Verify only; fix only regressions caused by this plan.

- [ ] Run the focused content suite:

```powershell
Set-Location -LiteralPath $siteRoot
& $pnpmExe test tests/yi/dao-note-corpus.test.ts tests/yi/stable-story-facts.test.ts tests/yi/life-scroll.test.ts tests/yi/story-mirrors.test.ts tests/yi/life-scroll-view.test.ts tests/yi/portrait-view.test.ts tests/yi/na-yin.test.ts tests/yi/twelve-growth.test.ts tests/yi/chart-narrative.test.ts tests/yi/chart-view-model.test.ts tests/yi/report-model.test.ts tests/yi/fortune-story.test.ts tests/yi/fortune-mirrors.test.ts tests/yi/folk-saying-corpus.test.ts tests/yi/compatibility-traditions.test.ts tests/yi/traditional-atlas.test.ts tests/yi/story-goldens.test.ts
& $pnpmExe exec tsc --noEmit
& $pnpmExe lint
```

- [ ] Scan the user-facing component layer:

```powershell
Set-Location -LiteralPath $siteRoot
rg -n "专业依据|本章来源|本章依据与使用边界|可靠级|证据等级|计算规则|规则 ID|数据来源清单|查看九项专业依据" components/yi/PortraitSection.tsx components/yi/ChartSection.tsx components/yi/FortuneSection.tsx components/yi/CompatibilitySection.tsx components/yi/MirrorSection.tsx components/yi/TraditionSection.tsx components/yi/ReferenceAtlasSection.tsx
```

Expected: no occurrence in the rebuilt public sections. The legacy detail/source files still exist until the integration plan removes their routes; internal model/test documentation retains source and audit fields.

- [ ] Confirm professional terms are isolated to the chart:

```powershell
Set-Location -LiteralPath $siteRoot
rg -n "日主|月令|十神|藏干|纳音|十二长生|旺衰|透干|通根" components/yi/PortraitSection.tsx components/yi/ChartSection.tsx components/yi/FortuneSection.tsx components/yi/CompatibilitySection.tsx components/yi/MirrorSection.tsx components/yi/TraditionSection.tsx components/yi/ReferenceAtlasSection.tsx
```

Expected: active result-page matches occur only in `ChartSection.tsx`; test and internal engine files may contain them.

- [ ] Verify the protected file:

```powershell
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $protectedFile).Hash -ne $protectedSha) {
  throw "Protected file hash changed."
}
& $gitExe -C $repoRoot ls-files --error-unmatch site/pnpm-workspace.yaml 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file became tracked." }
& $gitExe -C $repoRoot status --short --branch
```

Expected: frozen hash unchanged and file remains untracked.
