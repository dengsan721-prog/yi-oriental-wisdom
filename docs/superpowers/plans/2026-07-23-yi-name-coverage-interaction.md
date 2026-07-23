# Yi Name Element Coverage Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the name experience into one standalone, understandable, playful module that shows a single 100-point five-element coverage result, gives audited character suggestions for uncovered elements, and lets the user compare a candidate name without changing the birth chart or saved profile.

**Architecture:** Add a frozen, human-reviewed name-element corpus separate from engineering glyph metadata. A pure coverage function unions stable visible stem/branch elements with confirmed reviewed name characters and returns either a complete score or an explicit pending state. A new `NameSection` renders current-name and candidate-name cards while reusing the existing name engine only for glyph, reading, variant, and meaning confirmation.

**Tech Stack:** TypeScript, React 19, Vitest, React server rendering, existing Unihan/TGH name inspection, existing four-pillars model.

## Global Constraints

- This is implementation sequence 2 of 4 and depends on the theme contract from `2026-07-23-yi-five-element-foundation.md`.
- Never edit, delete, stage, or commit `site/pnpm-workspace.yaml`; its SHA-256 must remain `FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78`.
- Publicly call the result “姓名五行齐备度”, not a fortune, quality, luck, personality, or professional 八字 score.
- The visible formula is exactly `coveredElements.length * 20`.
- Show `覆盖 ${coveredCount}/5 项` as the primary value, `${score}/100` as the adjacent value, and “只看五行覆盖，不是姓名好坏” beside it.
- UI tests must exercise all six display tiers: `0/5 → 0/100`, `1/5 → 20/100`, `2/5 → 40/100`, `3/5 → 60/100`, `4/5 → 80/100`, and `5/5 → 100/100`.
- Do not use Unicode radicals, stroke count, pinyin initials, an unreviewed commercial table, the existing semantic-vector maximum, hidden stems, 旺衰, or 喜用神 to auto-assign a single element.
- Never turn an unknown character into a zero or missing-element penalty. Any unresolved glyph, reading, traditional variant, adopted meaning, or element-review disagreement produces “资料待确认，暂不评分”.
- The score uses only two fact groups:
  1. the five elements explicitly visible on stable `pillar.element` and `pillar.branchElement` fields for non-ambiguous year, month, day, and present hour pillars;
  2. elements of name characters whose adopted glyph, reading, meaning, and element decision all match an approved reviewed record.
- The score explicitly excludes hidden stems, `elementCounts`, semantic weights, 旺衰, 喜用神, and every other professional-chart field.
- A name result never mutates `FourPillarsResult`, never changes `elementCounts`, and never affects the life scroll, fortune periods, compatibility, or saved profile.
- When the visible chart already contains all five elements, every fully reviewed current or candidate name is honestly 5/5 and 100/100.
- Keep existing complex reality-score and advice contracts internal for compatibility, but do not show a second 100-point result in the new module.
- Candidate state is session-only. Do not write it into `yi-life-profile-v1`, local storage, session storage, or the URL.
- Before any `pnpm` command in PowerShell, run:

```powershell
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
```

## Cross-Plan Interface and Activation Boundary

This plan owns and freezes these exports:

- `site/lib/yi/name-element-data.ts`
  - `NAME_ELEMENT_COVERAGE_VERSION`
  - `NAME_ELEMENT_RULES`
  - `REVIEWED_NAME_ELEMENT_RECORDS`
  - `resolveReviewedNameElement`
  - `getReviewedNameElementRecommendations`
- `site/lib/yi/name-element-coverage.ts`
  - `NAME_COVERAGE_SCOPE_NOTICE`
  - `toNameElementCoverageCharacters`
  - `getStableVisibleChartElements`
  - `calculateNameElementCoverage`
- `site/components/yi/NameSection.tsx`
  - `NameSection`
  - `NameCoverageCard`
  - `formatNameCoverageScore`
  - candidate composition and latest-request helpers named in Task 4
- `site/components/yi/NameAnalysisSection.tsx`
  - the existing `loadNameAnalysisForView`, `createNameAnalysisViewState`, and `nameAnalysisViewReducer`
  - `NameAnalysisViewResult.surname`, propagated from the existing name engine

The public component boundary is exactly:

```ts
import type {
  FourPillarsResult,
  ProfessionalReport,
} from "../../lib/yi/types";

export type NameSectionProps = {
  name: string;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
};
```

The later integration plan must pass its existing `name`, `chart`, and `report` values exactly as `<NameSection name={name} chart={chart} professionalReport={report} />`.

This plan may render `NameSection` directly in tests, but it must not edit the hash router, result navigation, `ResultShell`, or `ChartSection`. It must leave the existing embedded `NameAnalysisSection` mounted in production. The route becomes active only after both conditions are true:

1. the story-report plan has moved the useful `detail` content into the chart; and
2. `2026-07-23-yi-life-home-integration-release.md` adds the standalone `name` route and removes the embedded chart copy in the same integration commit.

That integration commit owns route activation and duplicate removal. This plan owns neither. Until then, the new `NameSection` is a tested dormant interface.

Contract excerpts use TypeScript `declare` only to make the interface shape independently type-checkable. The production files must provide the initialized constants and function/component implementations required by each task.

This plan is complete when:

- the reviewed corpus resolves at least 95 of exactly 100 independent, source-traceable full-name fixtures;
- every unresolved fixture is correctly and explicitly pending;
- the pure engine returns only 0, 20, 40, 60, 80, or 100 for complete results;
- pending facts never receive a numeric score;
- all six score tiers render the correct primary and secondary values;
- current and candidate names can be compared without stale async overwrites;
- all candidate confirmation choices reset correctly when the candidate changes; and
- the protected file remains untracked, unchanged, and absent from every staged allowlist.

---

### Task 1: Freeze the Reviewed Name-Element Corpus and the 100-Name Evidence Gate

**Files:**

- Create: `site/lib/yi/name-element-data.ts`
- Create: `site/tests/fixtures/yi/name-element-coverage-common-names-v1.ts`
- Create: `site/tests/yi/name-element-data.test.ts`

- [ ] Define these complete production contracts in `name-element-data.ts`:

```ts
import type { ElementName } from "./types";
import type { UnicodeCodePoint } from "./name-types";

export const NAME_ELEMENT_COVERAGE_VERSION = "name-element-coverage-v1" as const;

export type NameElementPrimaryReview = {
  role: "姓名文化内容复核";
  reviewerId: string;
  reviewedOn: string;
};

export type NameElementSecondReview = {
  role: "姓名文化第二复核";
  reviewerId: string;
  reviewedOn: string;
};

export type NameElementSource = {
  id: string;
  title: string;
  publisher: string;
  locator: string;
  url: string | null;
  useBasis: string;
};

export type NameElementRule = {
  id: string;
  version: typeof NAME_ELEMENT_COVERAGE_VERSION;
  title: string;
  adoptedPrinciple: string;
  sourceIds: readonly string[];
  primaryReview: NameElementPrimaryReview;
  secondReview: NameElementSecondReview;
};

type NameElementRecordBase = {
  id: string;
  glyph: string;
  codePoints: readonly UnicodeCodePoint[];
  adoptedMeaning: string;
  displayPinyin: string;
  glyphSourceIds: readonly string[];
  readingSourceIds: readonly string[];
  meaningSourceIds: readonly string[];
  elementRuleId: string;
  elementRationale: string;
  ruleVersion: typeof NAME_ELEMENT_COVERAGE_VERSION;
  primaryReview: NameElementPrimaryReview;
  secondReview: NameElementSecondReview;
};

export type ApprovedNameElementRecord = NameElementRecordBase & {
  reviewDecision: "approved";
  element: ElementName;
  unresolvedAlternatives: readonly [];
  recommendation: boolean;
};

export type PendingNameElementRecord = NameElementRecordBase & {
  reviewDecision: "pending";
  element: null;
  unresolvedAlternatives: readonly [ElementName, ElementName, ...ElementName[]];
  recommendation: false;
};

export type ReviewedNameElementRecord =
  | ApprovedNameElementRecord
  | PendingNameElementRecord;

export type NameElementLookupInput = {
  inputGlyph: string;
  adoptedGlyph: string | null;
  adoptedReading: string | null;
  adoptedMeaning: string | null;
};

export type NameElementPendingReason =
  | "glyph-unconfirmed"
  | "reading-unconfirmed"
  | "meaning-unconfirmed"
  | "unreviewed-character"
  | "element-classification-pending";

export type NameElementResolution =
  | { status: "approved"; record: ApprovedNameElementRecord }
  | {
      status: "pending";
      reason: NameElementPendingReason;
      glyph: string | null;
    };

export declare const NAME_ELEMENT_SOURCES: readonly NameElementSource[];
export declare const NAME_ELEMENT_RULES: readonly NameElementRule[];
export declare const REVIEWED_NAME_ELEMENT_RECORDS:
  readonly ReviewedNameElementRecord[];

export declare function resolveReviewedNameElement(
  input: Readonly<NameElementLookupInput>,
): NameElementResolution;

export declare function getReviewedNameElementRecommendations(
  element: ElementName,
): readonly ApprovedNameElementRecord[];
```

Each fact family has its own source chain. Do not put glyph, reading, and meaning evidence into one undifferentiated `sourceIds` field. `elementRuleId` must resolve to a reviewed rule, and `elementRationale` must explain why that adopted meaning falls under that rule. A source ID may appear in more than one source array only when the source truly supports each claimed fact.

Every rule and record requires a primary review role/date and a second review role/date. A disagreement about the assigned element must never be resolved by array order, majority, or code. It remains `reviewDecision: "pending"`, has `element: null`, lists at least two `unresolvedAlternatives`, cannot be recommended, and resolves to `element-classification-pending`.

- [ ] Define the independent full-name fixture contract in `name-element-coverage-common-names-v1.ts`:

```ts
import type {
  NameElementLookupInput,
  NameElementPendingReason,
} from "../../../lib/yi/name-element-data";

export type FullNameEvidenceRef = {
  sourceId: string;
  locator: string;
  attestsExactFullName: true;
};

export type FullNameEvidenceSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedOn: string | null;
  accessedOn: string;
};

export type NameCoverageFixtureCase =
  | "ordinary"
  | "simplified-variant"
  | "traditional-variant"
  | "polyphonic";

export type NameCoverageFixtureRecord = {
  id: string;
  fullName: string;
  surname: string;
  givenName: string;
  surnameKind: "single" | "compound";
  givenNameLength: 1 | 2;
  orthography: "simplified" | "traditional";
  variantPairId: string | null;
  cases: readonly NameCoverageFixtureCase[];
  sourceRefs: readonly [FullNameEvidenceRef, ...FullNameEvidenceRef[]];
  characters: readonly NameElementLookupInput[];
  expected:
    | { status: "complete" }
    | {
        status: "pending";
        reasons: readonly [
          NameElementPendingReason,
          ...NameElementPendingReason[],
        ];
      };
};

export declare const COMMON_NAME_COVERAGE_SAMPLE_V1:
  readonly NameCoverageFixtureRecord[];

export declare const FULL_NAME_EVIDENCE_SOURCES:
  readonly FullNameEvidenceSource[];
```

Populate the export with exactly 100 literal records. Each record must be an independently attested complete name from a public, auditable source. `sourceRefs[].locator` must identify the page, row, table, paragraph, or entry that prints that exact full name, and `attestsExactFullName` must be `true`. Do not manufacture full names by combining separate surname and given-name lists; do not use `flatMap`, nested surname/name loops, or a Cartesian product.

The frozen set must include:

- both single-character and double-character given names;
- both single and compound surnames;
- at least one audited simplified/traditional variant pair, linked by the same non-null `variantPairId`;
- at least one traditional form that is pending until the adopted glyph is confirmed;
- at least one polyphonic use that is pending until the adopted reading is confirmed.

At least 95 records must resolve completely. Every remaining record must declare the exact expected pending reasons; pending records count as correct coverage only when the resolver returns those reasons exactly.

- [ ] Put this complete recommendation expectation in the test. The production record must match glyph, adopted pinyin, and adopted meaning exactly, in addition to the source and review checks:

```ts
const EXPECTED_RECOMMENDATIONS = {
  木: [
    ["林", "lín", "双木成林，取树木聚生成长之义"],
    ["森", "sēn", "木多成森，取繁茂有生机之义"],
    ["桐", "tóng", "梧桐之木，取挺立舒展之义"],
    ["楠", "nán", "楠木常青，取坚实沉稳之义"],
    ["竹", "zhú", "竹有节而生，取挺拔有度之义"],
    ["禾", "hé", "谷物幼苗，取生长收成之义"],
  ],
  火: [
    ["明", "míng", "日月照临，取光明清楚之义"],
    ["昕", "xīn", "太阳将出，取破晓初明之义"],
    ["晗", "hán", "天将明亮，取晨光渐起之义"],
    ["煦", "xù", "温暖和煦，取暖意照拂之义"],
    ["晟", "shèng", "光明旺盛，取明盛向上之义"],
    ["晴", "qíng", "雨止天清，取日光明朗之义"],
  ],
  土: [
    ["安", "ān", "安定安稳，取有所安处之义"],
    ["辰", "chén", "日月星辰，取时序有位之义"],
    ["宇", "yǔ", "屋宇空间，取安居开阔之义"],
    ["岚", "lán", "山间雾气，取山气沉静之义"],
    ["坤", "kūn", "坤为大地，取厚重承载之义"],
    ["城", "chéng", "城垣守护，取稳固有界之义"],
  ],
  金: [
    ["锦", "jǐn", "有彩纹的丝织品，取华美有章之义"],
    ["钧", "jūn", "古代重量单位，取持衡有度之义"],
    ["锐", "ruì", "锋利敏锐，取清晰进取之义"],
    ["铭", "míng", "刻写记述，取铭记自持之义"],
    ["铠", "kǎi", "护身铠甲，取坚定守护之义"],
    ["铃", "líng", "金属响器，取清亮有声之义"],
  ],
  水: [
    ["涵", "hán", "水泽包容，取涵养容纳之义"],
    ["泽", "zé", "水聚润泽，取滋养惠及之义"],
    ["沐", "mù", "以水洗濯，取清润更新之义"],
    ["清", "qīng", "水澄而清，取清澈明净之义"],
    ["澜", "lán", "水面大波，取开阔有势之义"],
    ["川", "chuān", "河流川流，取流动通达之义"],
  ],
} as const;
```

- [ ] Write `name-element-data.test.ts` with imports for every referenced symbol and local helpers. The test must make these assertions without undefined factory functions:

```ts
import { describe, expect, it } from "vitest";
import {
  NAME_ELEMENT_RULES,
  NAME_ELEMENT_SOURCES,
  REVIEWED_NAME_ELEMENT_RECORDS,
  getReviewedNameElementRecommendations,
  resolveReviewedNameElement,
} from "../../lib/yi/name-element-data";
import {
  COMMON_NAME_COVERAGE_SAMPLE_V1,
  FULL_NAME_EVIDENCE_SOURCES,
} from "../fixtures/yi/name-element-coverage-common-names-v1";

function codePoints(value: string): string[] {
  return Array.from(
    value,
    (glyph) => `U+${glyph.codePointAt(0)!.toString(16).toUpperCase()}`,
  );
}

describe("reviewed name-element data", () => {
  it("keeps separate traceable facts and two completed reviews", () => {
    const sourceIds = new Set(NAME_ELEMENT_SOURCES.map((source) => source.id));
    const ruleIds = new Set(NAME_ELEMENT_RULES.map((rule) => rule.id));

    expect(sourceIds.size).toBe(NAME_ELEMENT_SOURCES.length);
    for (const source of NAME_ELEMENT_SOURCES) {
      expect(source.id.trim()).not.toBe("");
      expect(source.title.trim()).not.toBe("");
      expect(source.publisher.trim()).not.toBe("");
      expect(source.locator.trim()).not.toBe("");
      if (source.url !== null) {
        expect(source.url).toMatch(/^https:\/\//);
      }
      expect(source.useBasis.trim()).not.toBe("");
    }

    for (const rule of NAME_ELEMENT_RULES) {
      expect(rule.version).toBe("name-element-coverage-v1");
      expect(rule.adoptedPrinciple.trim()).not.toBe("");
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of rule.sourceIds) {
        expect(sourceIds.has(sourceId)).toBe(true);
      }
      expect(rule.primaryReview.reviewerId.trim()).not.toBe("");
      expect(rule.secondReview.reviewerId.trim()).not.toBe("");
      expect(rule.primaryReview.reviewerId).not.toBe(
        rule.secondReview.reviewerId,
      );
      expect(rule.primaryReview.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rule.secondReview.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    for (const record of REVIEWED_NAME_ELEMENT_RECORDS) {
      expect(record.codePoints).toEqual(codePoints(record.glyph));
      expect(record.adoptedMeaning.trim()).not.toBe("");
      expect(record.displayPinyin.trim()).not.toBe("");
      expect(record.glyphSourceIds.length).toBeGreaterThan(0);
      expect(record.readingSourceIds.length).toBeGreaterThan(0);
      expect(record.meaningSourceIds.length).toBeGreaterThan(0);
      for (const sourceId of [
        ...record.glyphSourceIds,
        ...record.readingSourceIds,
        ...record.meaningSourceIds,
      ]) {
        expect(sourceIds.has(sourceId)).toBe(true);
      }
      expect(ruleIds.has(record.elementRuleId)).toBe(true);
      expect(record.elementRationale.trim()).not.toBe("");
      expect(record.ruleVersion).toBe("name-element-coverage-v1");
      expect(record.primaryReview.role).toBe("姓名文化内容复核");
      expect(record.secondReview.role).toBe("姓名文化第二复核");
      expect(record.primaryReview.reviewerId.trim()).not.toBe("");
      expect(record.secondReview.reviewerId.trim()).not.toBe("");
      expect(record.primaryReview.reviewerId).not.toBe(
        record.secondReview.reviewerId,
      );
      expect(record.primaryReview.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.secondReview.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      if (record.reviewDecision === "pending") {
        expect(record.element).toBeNull();
        expect(record.unresolvedAlternatives.length).toBeGreaterThanOrEqual(2);
        expect(record.recommendation).toBe(false);
        expect(resolveReviewedNameElement({
          inputGlyph: record.glyph,
          adoptedGlyph: record.glyph,
          adoptedReading: record.displayPinyin,
          adoptedMeaning: record.adoptedMeaning,
        })).toMatchObject({
          status: "pending",
          reason: "element-classification-pending",
        });
      } else {
        expect(record.element).not.toBeNull();
        expect(record.unresolvedAlternatives).toEqual([]);
      }
    }
  });

  it("freezes 100 independent, traceable complete-name cases", () => {
    const evidenceSourceIds = new Set(
      FULL_NAME_EVIDENCE_SOURCES.map((source) => source.id),
    );
    expect(evidenceSourceIds.size).toBe(FULL_NAME_EVIDENCE_SOURCES.length);
    for (const source of FULL_NAME_EVIDENCE_SOURCES) {
      expect(source.id.trim()).not.toBe("");
      expect(source.title.trim()).not.toBe("");
      expect(source.publisher.trim()).not.toBe("");
      expect(source.url).toMatch(/^https:\/\//);
      if (source.publishedOn !== null) {
        expect(source.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(source.accessedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(COMMON_NAME_COVERAGE_SAMPLE_V1).toHaveLength(100);
    expect(new Set(
      COMMON_NAME_COVERAGE_SAMPLE_V1.map((sample) => sample.id),
    ).size).toBe(100);
    expect(new Set(
      COMMON_NAME_COVERAGE_SAMPLE_V1.map((sample) => sample.fullName),
    ).size).toBe(100);

    const complete = COMMON_NAME_COVERAGE_SAMPLE_V1.filter(
      (sample) => sample.expected.status === "complete",
    );
    const pending = COMMON_NAME_COVERAGE_SAMPLE_V1.filter(
      (sample) => sample.expected.status === "pending",
    );
    expect(complete.length).toBeGreaterThanOrEqual(95);
    expect(pending.length).toBe(100 - complete.length);
    expect(pending.length).toBeGreaterThan(0);

    for (const sample of COMMON_NAME_COVERAGE_SAMPLE_V1) {
      expect(sample.fullName).toBe(`${sample.surname}${sample.givenName}`);
      expect(sample.characters.map(
        (character) => character.inputGlyph,
      ).join("")).toBe(sample.fullName);
      expect(sample.sourceRefs.length).toBeGreaterThan(0);
      for (const source of sample.sourceRefs) {
        expect(source.sourceId.trim()).not.toBe("");
        expect(evidenceSourceIds.has(source.sourceId)).toBe(true);
        expect(source.locator.trim()).not.toBe("");
        expect(source.attestsExactFullName).toBe(true);
      }

      const resolutions = sample.characters.map(resolveReviewedNameElement);
      const actualReasons = resolutions.flatMap((resolution) =>
        resolution.status === "pending" ? [resolution.reason] : [],
      );

      if (sample.expected.status === "complete") {
        expect(actualReasons).toEqual([]);
      } else {
        expect([...new Set(actualReasons)].sort()).toEqual(
          [...new Set(sample.expected.reasons)].sort(),
        );
      }
    }
  });
});
```

Add assertions in this same test file for the required fixture categories, linked simplified/traditional pairs, all 30 exact recommendation triples, rule source resolution, valid rule review dates, recommendation count `<= 6` per element, and `reviewDecision: "approved"` on every recommendation.

- [ ] Run the red test:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/name-element-data.test.ts
```

Expected failure: `name-element-data.ts` does not exist.

- [ ] Implement the corpus, source registry, rules, exact resolver, and recommendation lookup. Reuse existing source identifiers only when the source actually supports the claimed fact. Do not convert the old probabilistic semantic vector into a single element mechanically.

- [ ] Add all 100 literal fixture entries. Do not leave invented names, source placeholders, blank locators, `TODO`, or synthesized component combinations in the frozen fixture.

- [ ] Re-run:

```powershell
pnpm test tests/yi/name-element-data.test.ts tests/yi/name-data.test.ts
```

Expected: the new evidence gate and existing name-data contract both pass.

- [ ] Verify the protected path and exact staged allowlist, then commit:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$protectedPath = "site\pnpm-workspace.yaml"
$expectedHash = "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78"
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash
if ($actualHash -ne $expectedHash) { throw "Protected file hash changed: $actualHash" }
& $gitExe ls-files --error-unmatch -- $protectedPath 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file unexpectedly became tracked" }
$stagedBefore = @(& $gitExe diff --cached --name-only)
if ($stagedBefore.Count -ne 0) { throw "Staging area was not empty before Task 1 commit" }
& $gitExe add -- site/lib/yi/name-element-data.ts site/tests/fixtures/yi/name-element-coverage-common-names-v1.ts site/tests/yi/name-element-data.test.ts
if ($LASTEXITCODE -ne 0) { throw "Task 1 git add failed" }
$expectedStaged = @(
  "site/lib/yi/name-element-data.ts",
  "site/tests/fixtures/yi/name-element-coverage-common-names-v1.ts",
  "site/tests/yi/name-element-data.test.ts"
)
$staged = @(& $gitExe diff --cached --name-only)
$unexpected = @($staged | Where-Object { $_ -notin $expectedStaged })
$missing = @($expectedStaged | Where-Object { $_ -notin $staged })
if ($unexpected.Count -ne 0 -or $missing.Count -ne 0) {
  throw "Task 1 staged allowlist mismatch. Unexpected: $unexpected Missing: $missing"
}
& $gitExe diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Task 1 staged diff check failed" }
& $gitExe commit -m "feat: add reviewed name element corpus"
```

---

### Task 2: Calculate Honest Visible-Element Coverage

**Files:**

- Create: `site/lib/yi/name-element-coverage.ts`
- Create: `site/tests/yi/name-element-coverage.test.ts`

- [ ] Define these complete contracts in the failing test and production module:

```ts
import type { NameCharacterRecord } from "./name-types";
import type { ElementName, FourPillarsResult } from "./types";

export const NAME_COVERAGE_SCOPE_NOTICE =
  "本趣味分只计算稳定命盘中直接显示的五行与姓名已审校用字；不计算命盘中隐藏的五行，也不用于判断姓名吉凶。" as const;

export type NameElementCoverageCount = 0 | 1 | 2 | 3 | 4 | 5;
export type NameElementCoverageScore = 0 | 20 | 40 | 60 | 80 | 100;

export type NameElementCoveragePendingReason =
  | "chart-unavailable"
  | "glyph-unconfirmed"
  | "reading-unconfirmed"
  | "meaning-unconfirmed"
  | "unreviewed-character"
  | "element-classification-pending"
  | "unsupported-input";

export type NameElementCoverageCharacter = {
  inputGlyph: string;
  adoptedGlyph: string | null;
  adoptedReading: string | null;
  adoptedMeaning: string | null;
  unsupportedInput: boolean;
};

export type NameElementCoverage =
  | {
      status: "complete";
      visibleChartElements: readonly ElementName[];
      nameElements: readonly ElementName[];
      coveredElements: readonly ElementName[];
      missingElements: readonly ElementName[];
      coveredCount: NameElementCoverageCount;
      score: NameElementCoverageScore;
      chartAlreadyComplete: boolean;
      notice: string;
      scopeNotice: typeof NAME_COVERAGE_SCOPE_NOTICE;
    }
  | {
      status: "pending";
      reasons: readonly NameElementCoveragePendingReason[];
      pendingGlyphs: readonly string[];
      notice: "资料待确认，暂不评分";
      scopeNotice: typeof NAME_COVERAGE_SCOPE_NOTICE;
    };

export declare function toNameElementCoverageCharacters(
  characters: readonly Readonly<NameCharacterRecord>[],
): readonly NameElementCoverageCharacter[];

export declare function getStableVisibleChartElements(
  chart: Readonly<FourPillarsResult>,
): readonly ElementName[];

export declare function calculateNameElementCoverage(input: {
  chart: Readonly<FourPillarsResult> | null;
  characters: readonly Readonly<NameElementCoverageCharacter>[];
}): NameElementCoverage;
```

`toNameElementCoverageCharacters` maps `meaning` to `adoptedMeaning` and maps an `analysisBlockers` entry whose ID is `unsupported-input` to `unsupportedInput: true`. It does not infer or repair any missing fact.

- [ ] Write the stable-chart tests with a real calculated seed chart and complete local values. The following test proves that only visible stem/branch fields matter, even if misleading `elementCounts` and hidden-stem-shaped metadata are present:

```ts
import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  getStableVisibleChartElements,
} from "../../lib/yi/name-element-coverage";
import type { FourPillarsResult, Pillar } from "../../lib/yi/types";

const seed = calculateFourPillars({
  name: "测试",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});

const woodPillar: Pillar = {
  ...seed.pillars.year,
  element: "木",
  branchElement: "木",
};

const visibleWoodOnly: FourPillarsResult = {
  ...seed,
  pillars: {
    year: { ...woodPillar },
    month: { ...woodPillar },
    day: { ...woodPillar },
    hour: { ...woodPillar },
  },
  elementCounts: { 木: 0, 火: 99, 土: 99, 金: 99, 水: 99 },
  ambiguousPillars: [],
};

const withHiddenStemMetadata = {
  ...visibleWoodOnly,
  hiddenStems: [
    { stem: "丙", element: "火" },
    { stem: "戊", element: "土" },
    { stem: "辛", element: "金" },
    { stem: "癸", element: "水" },
  ],
};

describe("stable visible chart elements", () => {
  it("uses visible stem and branch elements and excludes counts and hidden stems", () => {
    expect(getStableVisibleChartElements(visibleWoodOnly)).toEqual(["木"]);
    expect(getStableVisibleChartElements(withHiddenStemMetadata)).toEqual(["木"]);
  });
});
```

Add tests that:

- include both `.element` and `.branchElement` for each present, non-ambiguous pillar;
- omit an ambiguous year, month, day, or hour pillar as a whole;
- omit a missing hour;
- deduplicate in fixed `木、火、土、金、水` order;
- return `chart-unavailable` when `chart` is `null`; and
- never inspect `professional`, `pillarFacts.hiddenStems`, `elementCounts`, or semantic weights.

- [ ] Test every reviewed-character gate:

- `adoptedGlyph === null` → `glyph-unconfirmed`;
- `adoptedReading === null` → `reading-unconfirmed`;
- `adoptedMeaning === null` → `meaning-unconfirmed`;
- no matching reviewed glyph/reading/meaning → `unreviewed-character`;
- a matching pending review decision → `element-classification-pending`;
- `unsupportedInput === true` → `unsupported-input`.

An unresolved traditional form therefore reaches `glyph-unconfirmed`; an unresolved polyphonic use reaches `reading-unconfirmed`. Deduplicate reasons and pending glyphs without changing first-seen order.

- [ ] Test the exact score domain and message with approved records from the real corpus. Do not construct a fake record that bypasses `resolveReviewedNameElement`:

```ts
import { describe, expect, it } from "vitest";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  REVIEWED_NAME_ELEMENT_RECORDS,
} from "../../lib/yi/name-element-data";
import {
  calculateNameElementCoverage,
  type NameElementCoverageCharacter,
} from "../../lib/yi/name-element-coverage";
import type { FourPillarsResult, Pillar } from "../../lib/yi/types";

const scoreSeed = calculateFourPillars({
  name: "测试",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});
const scoreWoodPillar: Pillar = {
  ...scoreSeed.pillars.year,
  element: "木",
  branchElement: "木",
};
const scoreWoodChart: FourPillarsResult = {
  ...scoreSeed,
  pillars: {
    year: { ...scoreWoodPillar },
    month: { ...scoreWoodPillar },
    day: { ...scoreWoodPillar },
    hour: { ...scoreWoodPillar },
  },
  ambiguousPillars: [],
};

describe("name element score", () => {
  it("uses an approved record and the exact 20-point formula", () => {
    const approvedWood = REVIEWED_NAME_ELEMENT_RECORDS.find(
      (record) =>
        record.reviewDecision === "approved" &&
        record.element === "木",
    );
    if (!approvedWood) throw new Error("Approved 木 fixture is required");

    const reviewedCharacter: NameElementCoverageCharacter = {
      inputGlyph: approvedWood.glyph,
      adoptedGlyph: approvedWood.glyph,
      adoptedReading: approvedWood.displayPinyin,
      adoptedMeaning: approvedWood.adoptedMeaning,
      unsupportedInput: false,
    };

    const result = calculateNameElementCoverage({
      chart: scoreWoodChart,
      characters: [reviewedCharacter],
    });

    expect(result).toMatchObject({
      status: "complete",
      coveredCount: 1,
      score: 20,
      notice: "只看五行覆盖，不是姓名好坏",
    });
  });
});
```

Add table-driven cases for all reachable complete counts, assert `score === coveredCount * 20`, assert the score is one of `[0, 20, 40, 60, 80, 100]`, and assert `"score" in result` is false for every pending result.

- [ ] Test an already-complete visible chart with two different fully reviewed names. Both results must be `coveredCount: 5`, `score: 100`, and `chartAlreadyComplete: true`, and both notices must contain “当前命盘显示的五行已经齐备，候选名字不会提高覆盖项”.

- [ ] Deep-freeze chart and character inputs, call the calculator, and assert no throw and no structural change. Use a local recursive `deepFreeze` helper defined in the test file; do not refer to an undeclared helper.

- [ ] Run the red test:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/name-element-coverage.test.ts
```

Expected failure: `name-element-coverage.ts` does not exist.

- [ ] Implement stable extraction:

```ts
import type { ElementName, FourPillarsResult } from "./types";

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const PILLARS = ["year", "month", "day", "hour"] as const;

export function getStableVisibleChartElements(
  chart: Readonly<FourPillarsResult>,
): readonly ElementName[] {
  const found = new Set<ElementName>();
  for (const key of PILLARS) {
    const pillar = chart.pillars[key];
    if (!pillar || chart.ambiguousPillars.includes(key)) continue;
    found.add(pillar.element);
    found.add(pillar.branchElement);
  }
  return ELEMENTS.filter((element) => found.has(element));
}
```

For name characters, require the reviewed record to match adopted glyph, adopted reading, and adopted meaning, and require `reviewDecision: "approved"`. Union the visible chart and approved name sets, order by `ELEMENTS`, narrow the count through an exhaustive `0..5` guard, and map that count through a fixed score tuple `[0, 20, 40, 60, 80, 100]`.

- [ ] Re-run:

```powershell
pnpm test tests/yi/name-element-coverage.test.ts tests/yi/name-element-data.test.ts
```

Expected: all visible-scope, pending, immutability, and score cases pass.

- [ ] Verify the protected path and exact staged allowlist, then commit:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$protectedPath = "site\pnpm-workspace.yaml"
$expectedHash = "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78"
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash
if ($actualHash -ne $expectedHash) { throw "Protected file hash changed: $actualHash" }
& $gitExe ls-files --error-unmatch -- $protectedPath 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file unexpectedly became tracked" }
$stagedBefore = @(& $gitExe diff --cached --name-only)
if ($stagedBefore.Count -ne 0) { throw "Staging area was not empty before Task 2 commit" }
& $gitExe add -- site/lib/yi/name-element-coverage.ts site/tests/yi/name-element-coverage.test.ts
if ($LASTEXITCODE -ne 0) { throw "Task 2 git add failed" }
$expectedStaged = @(
  "site/lib/yi/name-element-coverage.ts",
  "site/tests/yi/name-element-coverage.test.ts"
)
$staged = @(& $gitExe diff --cached --name-only)
$unexpected = @($staged | Where-Object { $_ -notin $expectedStaged })
$missing = @($expectedStaged | Where-Object { $_ -notin $staged })
if ($unexpected.Count -ne 0 -or $missing.Count -ne 0) {
  throw "Task 2 staged allowlist mismatch. Unexpected: $unexpected Missing: $missing"
}
& $gitExe diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Task 2 staged diff check failed" }
& $gitExe commit -m "feat: calculate name element coverage"
```

---

### Task 3: Render the Dormant Standalone Current-Name Experience

**Files:**

- Create: `site/components/yi/NameSection.tsx`
- Modify: `site/components/yi/NameAnalysisSection.tsx`
- Create: `site/tests/yi/name-section.test.ts`
- Modify: `site/app/globals.css`

- [ ] Export these complete component contracts from `NameSection.tsx`:

```ts
import type { ReactElement } from "react";
import type { ApprovedNameElementRecord } from "../../lib/yi/name-element-data";
import type {
  NameElementCoverage,
  NameElementCoverageCount,
  NameElementCoverageScore,
} from "../../lib/yi/name-element-coverage";
import type {
  ElementName,
  FourPillarsResult,
  ProfessionalReport,
} from "../../lib/yi/types";

export type NameSectionProps = {
  name: string;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
};

export type NameCoverageRecommendations = Readonly<
  Partial<Record<ElementName, readonly ApprovedNameElementRecord[]>>
>;

export type NameCoverageCardProps = {
  label: "当前姓名" | "候选姓名";
  name: string;
  coverage: NameElementCoverage;
  recommendationsByElement: NameCoverageRecommendations;
};

export type FormattedNameCoverageScore = {
  primary: `覆盖 ${NameElementCoverageCount}/5 项`;
  secondary: `${NameElementCoverageScore}/100`;
};

export declare function formatNameCoverageScore(
  coveredCount: NameElementCoverageCount,
): FormattedNameCoverageScore;

export declare function NameCoverageCard(
  props: NameCoverageCardProps,
): ReactElement;

export declare function NameSection(
  props: NameSectionProps,
): ReactElement;
```

Use a six-entry tuple or exhaustive switch in `formatNameCoverageScore`. Do not derive the secondary text by string replacement.

- [ ] Add `surname` to the existing view result and export the request types needed by the new component:

```ts
import type {
  NameAdvice,
  NameBlockerOccurrence,
  NameCharacterRecord,
  NameChartInteraction,
  NameDirection,
  NameSemanticSummary,
  NameSurname,
} from "../../lib/yi/name-types";
import type {
  NameRealityScore,
  NameRealityTestAnswers,
} from "../../lib/yi/name-score-contract";
import type { UsageRiskInput } from "../../lib/yi/name-analysis";
import type {
  FourPillarsResult,
  ProfessionalReport,
} from "../../lib/yi/types";

export type NameAnalysisMode = "current" | "traditional-reference" | "candidate";

export type NameAnalysisViewResult = {
  rawInput: string;
  mode: NameAnalysisMode;
  characters: NameCharacterRecord[];
  blockers: NameBlockerOccurrence[];
  semanticSummary: NameSemanticSummary;
  realityScore: NameRealityScore;
  advice: NameAdvice;
  chartInteraction: NameChartInteraction | null;
  directions: [NameDirection, NameDirection, NameDirection];
  fullNameReviewStatus: "已审校" | "待人工复核";
  frequencyContext: string;
  ruleObservation: string;
  plainLanguageScene: string;
  action: string;
  boundary: string;
  sourceIds: string[];
  surname: NameSurname;
};

export type NameAnalysisRequest = {
  mode: NameAnalysisMode;
  traditionalSelections: Readonly<Record<number, string | undefined>>;
  actualReadings: Readonly<Record<number, string | undefined>>;
  realityTest: NameRealityTestAnswers;
  usageRisks: readonly UsageRiskInput[];
  requestFreshDirection: boolean;
  chart?: Readonly<FourPillarsResult>;
  professionalReport?: Readonly<ProfessionalReport>;
};
```

Propagate `result.surname` already computed by `analyzeName`; do not parse compound surnames again in `NameSection`.

- [ ] Start `name-section.test.ts` with a complete table-driven server-render test for all six UI tiers:

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  NameCoverageCard,
  formatNameCoverageScore,
} from "../../components/yi/NameSection";
import {
  NAME_COVERAGE_SCOPE_NOTICE,
  type NameElementCoverage,
  type NameElementCoverageCount,
  type NameElementCoverageScore,
} from "../../lib/yi/name-element-coverage";
import type { ElementName } from "../../lib/yi/types";

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;
const SCORES = [0, 20, 40, 60, 80, 100] as const;

function completeCoverage(
  coveredCount: NameElementCoverageCount,
): NameElementCoverage {
  const coveredElements: readonly ElementName[] =
    ELEMENTS.slice(0, coveredCount);
  const score: NameElementCoverageScore = SCORES[coveredCount];
  return {
    status: "complete",
    visibleChartElements: coveredElements,
    nameElements: [],
    coveredElements,
    missingElements: ELEMENTS.slice(coveredCount),
    coveredCount,
    score,
    chartAlreadyComplete: coveredCount === 5,
    notice: coveredCount === 5
      ? "当前命盘显示的五行已经齐备，候选名字不会提高覆盖项"
      : "只看五行覆盖，不是姓名好坏",
    scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
  };
}

describe("name coverage score presentation", () => {
  it.each([
    [0, 0],
    [1, 20],
    [2, 40],
    [3, 60],
    [4, 80],
    [5, 100],
  ] as const)("renders %s/5 as %s/100", (count, score) => {
    expect(formatNameCoverageScore(count)).toEqual({
      primary: `覆盖 ${count}/5 项`,
      secondary: `${score}/100`,
    });

    const html = renderToStaticMarkup(createElement(NameCoverageCard, {
      label: "当前姓名",
      name: "林知夏",
      coverage: completeCoverage(count),
      recommendationsByElement: {},
    }));
    expect(html).toContain(`覆盖 ${count}/5 项`);
    expect(html).toContain(`${score}/100`);
    expect(html).not.toMatch(/四柱|天干|地支|藏干|旺衰|喜用神/);
  });
});
```

- [ ] In the same test file, define complete coverage and pending literals rather than referring to undeclared factories. Test:

- the section title “姓名五行齐备度”;
- “只看五行覆盖，不是姓名好坏”;
- `NAME_COVERAGE_SCOPE_NOTICE`;
- “还差：金” and at most six approved 金 recommendations for a 4/5 result;
- “当前命盘显示的五行已经齐备，候选名字不会提高覆盖项” for 5/5;
- “资料待确认，暂不评分” and no `/100` text for a pending result;
- glyph, pinyin, and one-sentence meaning on every rendered recommendation;
- absence of “现实使用实测分”, “本章来源”, “专业依据”, “使用边界”, “高分姓名”, “满分好名”, “吉名”, “改运”, “必须改名”, “四柱”, “天干”, “地支”, “藏干”, “旺衰”, and “喜用神”.

- [ ] Test an empty current name by constructing real chart/report inputs:

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NameSection } from "../../components/yi/NameSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { BirthInput } from "../../lib/yi/types";

describe("empty current name", () => {
  it("renders a labelled input", () => {
    const birth: BirthInput = {
      name: "",
      date: "1990-06-15",
      time: "09:30",
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "exact",
    };
    const chart = calculateFourPillars(birth);
    const professionalReport = buildProfessionalReport(chart, birth);
    const html = renderToStaticMarkup(createElement(NameSection, {
      name: "",
      chart,
      professionalReport,
    }));

    expect(html).toContain('aria-label="输入现用姓名"');
  });
});
```

The snippet supplies every value it references.

- [ ] Run the red test:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/name-section.test.ts
```

Expected failure: `NameSection` does not exist.

- [ ] Implement `NameSection` with these concrete regions, in this order:

1. header with eyebrow, title, and one-sentence explanation;
2. existing glyph/traditional/reading confirmation controls;
3. current-name `NameCoverageCard`;
4. reviewed recommendations grouped by each missing element;
5. candidate area reserved for Task 4.

Do not include source panels, professional-method panels, the legacy reality score, or a second explanation accordion. There must be no JSX placeholder comment. If the current name is empty, render the labelled current-name input instead of starting analysis.

- [ ] Reuse only these existing mechanics from `NameAnalysisSection`:

- `loadNameAnalysisForView`;
- `createNameAnalysisViewState`;
- `nameAnalysisViewReducer`;
- glyph/traditional variant confirmation; and
- actual-reading confirmation.

Keep old reality score and source-rich details available to legacy tests, but do not mount those panels inside `NameSection`.

- [ ] Keep the existing embedded name analysis in `ChartSection`. Do not add route code here. The integration plan removes that embedded render only when it exposes the standalone section.

- [ ] Style a compact coverage meter with a visible text label for each element. Do not rely on color alone. Keep controls at least 44px high, use full-width stacked controls where necessary, and keep a 390px viewport free of horizontal overflow.

- [ ] Re-run:

```powershell
pnpm test tests/yi/name-section.test.ts tests/yi/name-analysis-view.test.ts tests/yi/name-analysis.test.ts
```

Expected: standalone UI passes and existing confirmation mechanics remain green.

- [ ] Verify the protected path and exact staged allowlist, then commit:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$protectedPath = "site\pnpm-workspace.yaml"
$expectedHash = "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78"
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash
if ($actualHash -ne $expectedHash) { throw "Protected file hash changed: $actualHash" }
& $gitExe ls-files --error-unmatch -- $protectedPath 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file unexpectedly became tracked" }
$stagedBefore = @(& $gitExe diff --cached --name-only)
if ($stagedBefore.Count -ne 0) { throw "Staging area was not empty before Task 3 commit" }
& $gitExe add -- site/components/yi/NameSection.tsx site/components/yi/NameAnalysisSection.tsx site/tests/yi/name-section.test.ts site/app/globals.css
if ($LASTEXITCODE -ne 0) { throw "Task 3 git add failed" }
$expectedStaged = @(
  "site/components/yi/NameSection.tsx",
  "site/components/yi/NameAnalysisSection.tsx",
  "site/tests/yi/name-section.test.ts",
  "site/app/globals.css"
)
$staged = @(& $gitExe diff --cached --name-only)
$unexpected = @($staged | Where-Object { $_ -notin $expectedStaged })
$missing = @($expectedStaged | Where-Object { $_ -notin $staged })
if ($unexpected.Count -ne 0 -or $missing.Count -ne 0) {
  throw "Task 3 staged allowlist mismatch. Unexpected: $unexpected Missing: $missing"
}
& $gitExe diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Task 3 staged diff check failed" }
& $gitExe commit -m "feat: add standalone name report section"
```

---

### Task 4: Add Candidate-Name Comparison Without Stale Results

**Files:**

- Modify: `site/components/yi/NameSection.tsx`
- Modify: `site/tests/yi/name-section.test.ts`

- [ ] Add these complete pure helper and presentation contracts:

```ts
import type { ReactElement } from "react";
import type {
  NameAnalysisRequest,
  NameAnalysisViewState,
} from "./NameAnalysisSection";
import type { NameSurname } from "../../lib/yi/name-types";
import type {
  FourPillarsResult,
  ProfessionalReport,
} from "../../lib/yi/types";

export type CandidateNameComposition =
  | {
      status: "ready";
      fullName: string;
      inputKind: "given-name" | "full-name";
      fixedSurname: string | null;
    }
  | {
      status: "invalid";
      reason: "empty-input";
    };

export declare function composeCandidateFullName(input: {
  currentSurname: Readonly<NameSurname> | null;
  candidateInput: string;
}): CandidateNameComposition;

export type LatestNameRequestGuard = {
  begin(): number;
  isCurrent(requestId: number): boolean;
  invalidate(): void;
};

export declare function createLatestNameRequestGuard(): LatestNameRequestGuard;

export declare function runLatestNameRequest<T>(input: {
  guard: LatestNameRequestGuard;
  load: () => Promise<T>;
  apply: (value: T) => void;
}): Promise<"applied" | "stale">;

export declare function buildCandidateAnalysisRequest(input: {
  viewState: Readonly<NameAnalysisViewState>;
  chart: Readonly<FourPillarsResult>;
  professionalReport: Readonly<ProfessionalReport>;
}): Partial<NameAnalysisRequest>;

export type NameCandidateComparisonProps = {
  current: NameCoverageCardProps;
  candidate: NameCoverageCardProps | null;
  fixedSurname: string | null;
};

export declare function NameCandidateComparison(
  props: NameCandidateComparisonProps,
): ReactElement;
```

`composeCandidateFullName` trims surrounding whitespace only. With a reviewed `single` or `compound` surname, it treats the input as a given name and prefixes the exact reviewed surname. With no surname or `kind: "unknown"`, it treats the input as a complete name. It never converts simplified or traditional glyphs.

- [ ] Add complete pure composition tests:

```ts
import { describe, expect, it } from "vitest";
import {
  composeCandidateFullName,
} from "../../components/yi/NameSection";

describe("candidate full-name composition", () => {
  it("keeps a reviewed single surname fixed", () => {
    expect(composeCandidateFullName({
      currentSurname: { value: "林", kind: "single" },
      candidateInput: " 清禾 ",
    })).toEqual({
      status: "ready",
      fullName: "林清禾",
      inputKind: "given-name",
      fixedSurname: "林",
    });
  });

  it("keeps a reviewed compound surname fixed", () => {
    expect(composeCandidateFullName({
      currentSurname: { value: "欧阳", kind: "compound" },
      candidateInput: "明川",
    })).toEqual({
      status: "ready",
      fullName: "欧阳明川",
      inputKind: "given-name",
      fixedSurname: "欧阳",
    });
  });

  it("requires a complete name when the surname is unknown", () => {
    expect(composeCandidateFullName({
      currentSurname: { value: "", kind: "unknown" },
      candidateInput: "顾清禾",
    })).toEqual({
      status: "ready",
      fullName: "顾清禾",
      inputKind: "full-name",
      fixedSurname: null,
    });
  });
});
```

- [ ] Add this independently compiling server-rendered comparison test:

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  NameCandidateComparison,
} from "../../components/yi/NameSection";
import {
  NAME_COVERAGE_SCOPE_NOTICE,
  type NameElementCoverage,
} from "../../lib/yi/name-element-coverage";

const currentCoverage: NameElementCoverage = {
  status: "complete",
  visibleChartElements: ["木", "火", "土"],
  nameElements: ["水"],
  coveredElements: ["木", "火", "土", "水"],
  missingElements: ["金"],
  coveredCount: 4,
  score: 80,
  chartAlreadyComplete: false,
  notice: "只看五行覆盖，不是姓名好坏",
  scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
};
const candidateCoverage: NameElementCoverage = {
  status: "complete",
  visibleChartElements: ["木", "火", "土"],
  nameElements: ["金", "水"],
  coveredElements: ["木", "火", "土", "金", "水"],
  missingElements: [],
  coveredCount: 5,
  score: 100,
  chartAlreadyComplete: false,
  notice: "只看五行覆盖，不是姓名好坏",
  scopeNotice: NAME_COVERAGE_SCOPE_NOTICE,
};

describe("candidate comparison", () => {
  it("labels current and candidate names without declaring a winner", () => {
    const html = renderToStaticMarkup(createElement(
      NameCandidateComparison,
      {
        current: {
          label: "当前姓名",
          name: "林知夏",
          coverage: currentCoverage,
          recommendationsByElement: {},
        },
        candidate: {
          label: "候选姓名",
          name: "林清禾",
          coverage: candidateCoverage,
          recommendationsByElement: {},
        },
        fixedSurname: "林",
      },
    ));

    expect(html).toContain("保留姓氏：林");
    expect(html).toContain('aria-label="候选名（不含姓氏）"');
    expect(html).toContain("候选姓名：林清禾");
    expect(html).toContain("当前姓名：林知夏");
  });
});
```

For an empty original name or unknown surname, assert the label is “候选完整姓名”.

- [ ] Assert that both comparison cards show only:

- name;
- `覆盖 ${coveredCount}/5 项`;
- `${score}/100` for complete results only;
- covered elements;
- missing elements; and
- reviewed recommendations.

Assert that neither card renders the old reality score, professional sources, “本章依据”, “使用边界”, or a claim that one name is better.

- [ ] Test the latest-request guard with a fully defined local deferred helper and simple string payloads:

```ts
import { describe, expect, it } from "vitest";
import {
  createLatestNameRequestGuard,
  runLatestNameRequest,
} from "../../components/yi/NameSection";

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

describe("latest candidate request", () => {
  it("applies only the latest candidate result", async () => {
    const guard = createLatestNameRequestGuard();
    const first = deferred<string>();
    const second = deferred<string>();
    const applied: string[] = [];

    const firstRun = runLatestNameRequest({
      guard,
      load: () => first.promise,
      apply: (value) => applied.push(value),
    });
    const secondRun = runLatestNameRequest({
      guard,
      load: () => second.promise,
      apply: (value) => applied.push(value),
    });

    second.resolve("林明川");
    first.resolve("林清禾");

    await expect(secondRun).resolves.toBe("applied");
    await expect(firstRun).resolves.toBe("stale");
    expect(applied).toEqual(["林明川"]);
  });
});
```

- [ ] Add pure reducer tests using two independently created `NameAnalysisViewState` values:

- changing the candidate full name dispatches `reset-name` only to candidate state;
- candidate `traditionalSelections` and `actualReadings` become empty;
- current-name state remains deeply equal to its pre-change snapshot;
- while a new candidate request is loading, the UI marks the previous result as updating and does not attribute its blockers to the new candidate;
- after the latest request resolves, old blockers are replaced by the new result;
- an unresolved candidate renders pending with no `/100`;
- changing candidate input invalidates the previous request before starting the next.

- [ ] Add a source-level persistence guard in `name-section.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("candidate persistence boundary", () => {
  it("does not write candidate state outside the component session", () => {
    const nameSectionSource = readFileSync(
      new URL("../../components/yi/NameSection.tsx", import.meta.url),
      "utf8",
    );
    expect(nameSectionSource).not.toMatch(
      /localStorage|sessionStorage|yi-life-profile-v1|URLSearchParams/,
    );
  });
});
```

This is a guard against accidental persistence; do not mock or write browser storage in this module.

- [ ] Run the red tests:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/name-section.test.ts
```

Expected failure: candidate composition, comparison, and latest-request exports do not exist.

- [ ] Implement `buildCandidateAnalysisRequest` as a pure projection that returns `mode: "candidate"`, the candidate state's `traditionalSelections` and `actualReadings`, and the exact `chart` and `professionalReport` references supplied to it. It must not carry the current-name confirmation state, reality-test state, or usage risks.

- [ ] In `NameSection`, create one guard with `useRef(createLatestNameRequestGuard())`. On candidate input change:

1. call `invalidate()` before starting another load;
2. derive the full name with `composeCandidateFullName`;
3. replace only candidate view state with `createNameAnalysisViewState(fullName)`;
4. build the request with `buildCandidateAnalysisRequest`;
5. set candidate status to `loading`;
6. call `runLatestNameRequest` with `load: () => loadNameAnalysisForView(fullName, request)`;
7. in `apply`, replace the candidate result and set status to `ready`; and
8. leave current-name state and result untouched.

Every identifier in this sequence is either an exported helper above, a `NameSectionProps` value, or component state declared in `NameSection`; do not introduce an implicit `candidateRequest` or share a reducer instance between current and candidate names.

- [ ] Re-run:

```powershell
pnpm test tests/yi/name-section.test.ts tests/yi/name-analysis-view.test.ts tests/yi/name-element-coverage.test.ts
```

Expected: candidate comparison, reset, pending, persistence, and race-protection cases pass.

- [ ] Verify the protected path and exact staged allowlist, then commit:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$protectedPath = "site\pnpm-workspace.yaml"
$expectedHash = "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78"
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash
if ($actualHash -ne $expectedHash) { throw "Protected file hash changed: $actualHash" }
& $gitExe ls-files --error-unmatch -- $protectedPath 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file unexpectedly became tracked" }
$stagedBefore = @(& $gitExe diff --cached --name-only)
if ($stagedBefore.Count -ne 0) { throw "Staging area was not empty before Task 4 commit" }
& $gitExe add -- site/components/yi/NameSection.tsx site/tests/yi/name-section.test.ts
if ($LASTEXITCODE -ne 0) { throw "Task 4 git add failed" }
$expectedStaged = @(
  "site/components/yi/NameSection.tsx",
  "site/tests/yi/name-section.test.ts"
)
$staged = @(& $gitExe diff --cached --name-only)
$unexpected = @($staged | Where-Object { $_ -notin $expectedStaged })
$missing = @($expectedStaged | Where-Object { $_ -notin $staged })
if ($unexpected.Count -ne 0 -or $missing.Count -ne 0) {
  throw "Task 4 staged allowlist mismatch. Unexpected: $unexpected Missing: $missing"
}
& $gitExe diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Task 4 staged diff check failed" }
& $gitExe commit -m "feat: compare candidate name coverage"
```

---

### Task 5: Name Module Focused Verification

**Files:**

- Verify only; fix only regressions caused by this plan.

- [ ] Run the complete name test cluster:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/name-element-data.test.ts tests/yi/name-element-coverage.test.ts tests/yi/name-section.test.ts tests/yi/name-data.test.ts tests/yi/name-analysis.test.ts tests/yi/name-analysis-view.test.ts
pnpm exec tsc --noEmit
pnpm lint
```

- [ ] Scan the new public UI:

```powershell
rg -n "高分姓名|满分好名|吉名|改名.*改运|现实使用实测分|本章来源|本章依据|专业依据|使用边界|四柱|天干|地支|藏干|旺衰|喜用神" components/yi/NameSection.tsx
```

Expected: no forbidden public claim or professional-source panel.

- [ ] Scan this implementation slice for placeholders and accidental scope expansion:

```powershell
rg -n "TODO|TBD|implement later|fill in|similar to|hash-router|ResultShell|ChartSection" lib/yi/name-element-data.ts lib/yi/name-element-coverage.ts components/yi/NameSection.tsx tests/fixtures/yi/name-element-coverage-common-names-v1.ts tests/yi/name-element-data.test.ts tests/yi/name-element-coverage.test.ts tests/yi/name-section.test.ts
```

Expected: no placeholder text and no router, result-shell, or chart integration.

- [ ] Verify the protected file, untracked status, and empty staging area:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$gitExe = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
$protectedPath = "site\pnpm-workspace.yaml"
$expectedHash = "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78"
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedPath).Hash
if ($actualHash -ne $expectedHash) { throw "Protected file hash changed: $actualHash" }
& $gitExe ls-files --error-unmatch -- $protectedPath 2>$null
if ($LASTEXITCODE -eq 0) { throw "Protected file unexpectedly became tracked" }
$staged = @(& $gitExe diff --cached --name-only)
if ($staged.Count -ne 0) { throw "Staging area is not empty: $staged" }
& $gitExe status --short
```

Expected: the frozen hash is unchanged, `git ls-files --error-unmatch` fails, the staging area is empty after the planned commits, and the protected file remains untracked.
