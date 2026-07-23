# Yi Five-Element Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the product-wide dark visual foundation with a light, day-master-driven five-element theme, replace every visible single-character brand mark with an audited local lishu “命” glyph, and give the report owner a ritual identity header without weakening the existing save flow.

**Architecture:** Derive one transient `YiThemeElement` from the calculated day master at the `YiExperience` root and expose it through `data-element`. CSS consumes semantic tokens rather than raw element colors. A shared `YiBrandMark` owns the audited inline SVG and optional five-ring treatment. `ResultShell` receives the already-derived theme for its ritual seal; routing remains unchanged in this foundation slice.

**Tech Stack:** React 19, TypeScript, vinext/Vite, Vitest, React server rendering, CSS custom properties, inline SVG, Git/GitHub Pages.

## Global Constraints

- Work only in `C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild` on `feature/yi-content-engine-rebuild`.
- Never edit, delete, stage, or commit `site/pnpm-workspace.yaml`. Its frozen SHA-256 is `FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78`.
- Use explicit `git add <path...>` commands. Never use `git add .`, `git add -A`, or broad staging.
- Keep the product name “艺｜东方人生智慧”. Only the central and compact single-character visual mark becomes “命”.
- Do not depend on a system font, CDN font, or text fallback for the “命” glyph.
- The five-element theme comes from the day master only. Do not derive it from element counts, missing elements, name analysis, 格局, 喜用神, or 神煞.
- If the day pillar or day master is ambiguous, use the neutral theme.
- Keep the current adopted-facts → action-area order, confirmation dialog, save failure message, keyboard trap, Escape behavior, and focus restoration.
- Do not remove the `detail` user route until its useful content has been migrated under the story-report plan.
- Run every red test before implementation and record the expected reason for failure.
- Before any `pnpm` command in PowerShell, run:

```powershell
$nodeRuntimeDir = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$env:Path = "$nodeRuntimeDir;$env:Path"
```

## Dependency and Exit Contract

This is implementation sequence 1 of 4. It does not change the report-section route set. The standalone name route and legacy detail migration are activated only after the name module exists and useful detail content has moved into the chart.

Execution prerequisite: the approved design spec and all four implementation-plan documents are committed and tracked before Task 1 starts. Therefore the protected `site/pnpm-workspace.yaml` must be the only untracked path at the baseline gate; an untracked plan document is a stop condition, not an allowed exception.

This plan is complete when:

- all six theme modes are present and the root owns exactly one `data-element`;
- “命” is an audited U+547D inline path on desktop and mobile;
- the hero mark still has five outward breathing rings, while reduced motion leaves two static soft rings;
- compact marks reuse the same SVG without hero rings;
- the readable owner-name ritual precedes the independent “个人命运全景报告” title, then adopted facts and actions;
- the save interaction contract is unchanged;
- focused tests pass and the protected file hash is unchanged.

---

### Task 1: Freeze the Baseline and Add the Theme Contract

**Files:**

- Create: `site/lib/yi/theme.ts`
- Create: `site/tests/yi/theme.test.ts`
- Modify: `site/components/yi/YiExperience.tsx`

- [ ] From the repository root, record the baseline and protected-file state:

```powershell
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" status --short --branch
Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml"
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" ls-files --error-unmatch site/pnpm-workspace.yaml
```

Expected: branch is `feature/yi-content-engine-rebuild`; the only untracked path is the protected file; SHA matches the frozen value; `ls-files` exits non-zero.

- [ ] Write the failing theme tests first:

```ts
import { describe, expect, it } from "vitest";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { FourPillarsResult } from "../../lib/yi/types";

function chart(element: "木" | "火" | "土" | "金" | "水"): FourPillarsResult {
  const dayStem = { 木: "甲", 火: "丙", 土: "戊", 金: "庚", 水: "壬" }[element];
  return {
    pillars: {
      year: { stem: "甲", branch: "子", element: "木", branchElement: "水", label: "年柱" },
      month: { stem: "丙", branch: "寅", element: "火", branchElement: "木", label: "月柱" },
      day: { stem: dayStem, branch: "辰", element, branchElement: "土", label: "日柱" },
      hour: null,
    },
    elementCounts: { 木: 2, 火: 1, 土: 2, 金: 0, 水: 1 },
    professional: {
      dayMaster: { stem: dayStem, element, polarity: "yang" },
      structureBalance: "mixed",
      supportScore: 0,
      observationConfidence: "limited",
      pattern: "",
      climate: "",
      sameAndResourceElements: [],
      lowerCountElements: [],
      tenGods: [],
      relations: [],
      ambiguousFields: [],
    },
    ambiguousPillars: [],
    confidence: "medium",
    disclaimer: "",
  };
}

describe("deriveYiThemeElement", () => {
  it.each(["木", "火", "土", "金", "水"] as const)(
    "uses the unambiguous %s day master",
    (element) => expect(deriveYiThemeElement(chart(element))).toBe(element),
  );

  it("falls back to neutral without a chart", () => {
    expect(deriveYiThemeElement(null)).toBe("neutral");
  });

  it("falls back when day-pillar evidence is ambiguous", () => {
    const input = chart("水");
    input.ambiguousPillars = ["day"];
    expect(deriveYiThemeElement(input)).toBe("neutral");
  });

  it.each(["dayMaster", "dayPillar"] as const)(
    "falls back when %s is ambiguous",
    (field) => {
      const input = chart("金");
      input.professional.ambiguousFields = [field];
      expect(deriveYiThemeElement(input)).toBe("neutral");
    },
  );
});
```

- [ ] Run the red test:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/theme.test.ts
```

Expected failure: Vitest cannot resolve `../../lib/yi/theme`.

- [ ] Implement the smallest pure derivation:

```ts
import type { ElementName, FourPillarsResult } from "./types";

export type YiThemeElement = ElementName | "neutral";

const elements = new Set<ElementName>(["木", "火", "土", "金", "水"]);

export function deriveYiThemeElement(
  chart: FourPillarsResult | null | undefined,
): YiThemeElement {
  if (!chart) return "neutral";
  if (chart.ambiguousPillars.includes("day")) return "neutral";
  if (
    chart.professional.ambiguousFields.includes("dayMaster") ||
    chart.professional.ambiguousFields.includes("dayPillar")
  ) {
    return "neutral";
  }
  const element = chart.professional.dayMaster.element;
  return elements.has(element) ? element : "neutral";
}
```

- [ ] In `YiExperience`, compute the theme from `result` and add it only to the existing root:

```tsx
const themeElement = deriveYiThemeElement(result);

return <main data-element={themeElement}>
  {/* keep the existing route-owned children */}
</main>;
```

- [ ] Add a source-level assertion to `theme.test.ts` that `YiExperience.tsx` contains `data-element={themeElement}` and does not persist a `themeElement` field.

- [ ] Re-run:

```powershell
pnpm test tests/yi/theme.test.ts
```

Expected: all theme derivation tests pass.

- [ ] Commit only this task:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$git = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $git add site/lib/yi/theme.ts site/tests/yi/theme.test.ts site/components/yi/YiExperience.tsx
$protectedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash
if ($protectedHash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") {
  throw "Protected pnpm-workspace.yaml hash changed."
}
& $git ls-files --error-unmatch site/pnpm-workspace.yaml *> $null
if ($LASTEXITCODE -eq 0) { throw "Protected pnpm-workspace.yaml became tracked." }
$expectedStaged = @(
  "site/components/yi/YiExperience.tsx",
  "site/lib/yi/theme.ts",
  "site/tests/yi/theme.test.ts"
) | Sort-Object
$actualStaged = @(& $git diff --cached --name-only) | Sort-Object
$stagedDelta = @(Compare-Object -ReferenceObject $expectedStaged -DifferenceObject $actualStaged)
if ($stagedDelta.Count) {
  $stagedDelta | Format-Table | Out-String | Write-Host
  throw "Unexpected staged paths."
}
$actualStaged
& $git diff --cached --check
& $git commit -m "feat: add day-master theme contract"
```

---

### Task 2: Establish the Light Five-Element Visual System

**Files:**

- Modify: `site/app/globals.css`
- Modify: `site/tests/yi/theme.test.ts`
- Modify: `site/tests/yi/experience-copy.test.ts`

- [ ] Add failing CSS contract tests that read `globals.css` and require the neutral base plus five data-element modes:

```ts
const requiredTokens = [
  "--yi-bg", "--yi-surface", "--yi-surface-raised", "--yi-text",
  "--yi-text-muted", "--yi-line", "--yi-accent", "--yi-accent-strong",
  "--yi-accent-soft", "--yi-gold", "--yi-danger", "--yi-success", "--yi-focus",
] as const;

for (const token of requiredTokens) expect(css).toContain(token);
for (const element of ["neutral", "木", "火", "土", "金", "水"]) {
  expect(css).toContain(`data-element="${element}"`);
}
```

Also assert that `.primary-button`, form focus states, dialogs, result cards, life-home cards, and the page background consume `--yi-*` tokens rather than the old dark constants.

Parse the literal palette values and calculate WCAG contrast in the test. Require normal text and muted text against `--yi-bg`, and button text against every `--yi-accent`, to be at least 4.5:1; require focus and non-text boundaries to be at least 3:1. Require fixed `--yi-element-wood|fire|earth|metal|water` semantic colors to be declared once on the shared root and not overridden by any day-master theme.

- [ ] Run the red tests:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/theme.test.ts tests/yi/experience-copy.test.ts
```

Expected failure: semantic tokens and the six theme selectors do not yet exist.

- [ ] Define the neutral foundation and semantic roles at the top of `globals.css`:

```css
main[data-element] {
  --yi-bg: #fbf7ef;
  --yi-surface: #fffdf8;
  --yi-surface-raised: #ffffff;
  --yi-text: #202421;
  --yi-text-muted: #656a66;
  --yi-line: #e4ddd1;
  --yi-gold: #9b742e;
  --yi-danger: #9f3f36;
  --yi-success: #36705a;
  --yi-focus: #315f87;
  --yi-element-wood: #3f6d5a;
  --yi-element-fire: #a84f3f;
  --yi-element-earth: #8a642c;
  --yi-element-metal: #5e6873;
  --yi-element-water: #3f647e;
  color: var(--yi-text);
  background: var(--yi-bg);
}
main[data-element="neutral"] {
  --yi-accent: #8a6a3c;
  --yi-accent-strong: #654b25;
  --yi-accent-soft: #eee2ca;
}
main[data-element="木"] {
  --yi-accent: #3f6d5a;
  --yi-accent-strong: #294f40;
  --yi-accent-soft: #dcebe3;
}
main[data-element="火"] {
  --yi-accent: #a84f3f;
  --yi-accent-strong: #7b352b;
  --yi-accent-soft: #f3dfd9;
}
main[data-element="土"] {
  --yi-accent: #8a642c;
  --yi-accent-strong: #62461f;
  --yi-accent-soft: #ede2c8;
}
main[data-element="金"] {
  --yi-accent: #5e6873;
  --yi-accent-strong: #414a54;
  --yi-accent-soft: #e3e7ea;
}
main[data-element="水"] {
  --yi-accent: #3f647e;
  --yi-accent-strong: #29475d;
  --yi-accent-soft: #dce8ef;
}
```

- [ ] Replace the page-level dark hard-coding surgically. Cover the intro, birth form, calculating screen, report shell, dialog, cards, navigation, life home, inputs, buttons, dividers, and empty states. Fixed chart element chips retain their semantic element color and must include a text label.

- [ ] Keep content surfaces light. Use the accent for borders, small labels, active navigation, and the primary button; do not flood entire cards with saturated element color.

- [ ] Preserve keyboard visibility:

```css
main[data-element] :focus-visible {
  outline: 3px solid var(--yi-focus);
  outline-offset: 3px;
}
```

- [ ] Confirm interactive controls retain at least `44px` height and long Chinese names wrap:

```css
.primary-button,
.secondary-button,
.report-nav button,
.life-nav button {
  min-height: 44px;
}
.report-owner-name {
  overflow-wrap: anywhere;
}
```

- [ ] Re-run:

```powershell
pnpm test tests/yi/theme.test.ts tests/yi/experience-copy.test.ts
```

Expected: theme and copy contracts pass.

- [ ] Commit:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$git = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $git add site/app/globals.css site/tests/yi/theme.test.ts site/tests/yi/experience-copy.test.ts
$protectedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash
if ($protectedHash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") {
  throw "Protected pnpm-workspace.yaml hash changed."
}
& $git ls-files --error-unmatch site/pnpm-workspace.yaml *> $null
if ($LASTEXITCODE -eq 0) { throw "Protected pnpm-workspace.yaml became tracked." }
$expectedStaged = @(
  "site/app/globals.css",
  "site/tests/yi/experience-copy.test.ts",
  "site/tests/yi/theme.test.ts"
) | Sort-Object
$actualStaged = @(& $git diff --cached --name-only) | Sort-Object
$stagedDelta = @(Compare-Object -ReferenceObject $expectedStaged -DifferenceObject $actualStaged)
if ($stagedDelta.Count) {
  $stagedDelta | Format-Table | Out-String | Write-Host
  throw "Unexpected staged paths."
}
$actualStaged
& $git diff --cached --check
& $git commit -m "feat: add light five-element visual system"
```

---

### Task 3: Replace “艺” with an Audited Local Lishu “命”

**Files:**

- Modify: `site/components/yi/YiLishuGlyph.tsx`
- Create: `site/components/yi/YiBrandMark.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/app/globals.css`
- Modify: `site/tests/yi/intro-first-frame.test.ts`
- Create: `site/public/fonts/yi-lishu-u547d.svg`
- Create: `site/public/fonts/yi-lishu-u547d-source-audit.json`
- Modify: `site/public/fonts/README.md`
- Create: `docs/fonts/yi-lishu-u547d.svg`
- Create: `docs/fonts/yi-lishu-u547d-source-audit.json`
- Modify: `docs/fonts/README.md`
- Delete: `site/public/fonts/yi-lishu-u827a.svg`
- Delete: `site/public/fonts/yi-lishu-source-audit.json`
- Delete: `docs/fonts/yi-lishu-u827a.svg`
- Delete: `docs/fonts/yi-lishu-source-audit.json`

- [ ] Update `intro-first-frame.test.ts` first using the repository's existing React server-rendering and string-inspection style. Do not add Testing Library, jest-dom, jsdom, or an XML package:

```ts
const html = renderToStaticMarkup(createElement(YiExperience));
const ringClasses = html.match(/class="mark-ring r[1-5]"/g) ?? [];
const sourceOpeningTag = glyphSource.match(/<svg\b[^>]*>/)?.[0] ?? "";
const sourcePaths = [...glyphSource.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)];

expect(html).toContain('aria-label="命"');
expect(html).toContain('data-code-point="U+547D"');
expect(ringClasses).toHaveLength(5);
expect(sourceOpeningTag).toContain('data-code-point="U+547D"');
expect(sourcePaths).toHaveLength(1);
expect(sourcePaths[0]?.[1]?.length).toBeGreaterThan(100);
expect(glyphSource).not.toMatch(/<text\b|<style\b|\bstyle\s*=|font-family/i);
expect(glyphSource).not.toMatch(/\b(?:href|src)\s*=/i);
expect(audit.codePoint).toBe("U+547D");
expect(audit.source.license).toMatch(/SIL Open Font License 1\.1/i);
```

An ordinary SVG namespace such as `xmlns="http://www.w3.org/2000/svg"` is allowed and must not be mistaken for an external dependency. Only `href`/`src`, embedded style, `font-family`, and `<text>` rendering paths are forbidden.

Read both public and `docs/fonts` copies as bytes, calculate their SHA-256 values, and require byte equality. Parse the single `d` outline independently from each SVG and require it to match both the rendered component path and `audit.outlineSha256`. Also require the recorded source version, exact export workflow, archive SHA, raw-export SHA, glyph-path SHA, reviewer date, and desktop/phone rendering note.

- [ ] Add CSS assertions that normal motion has five staggered outward rings and that the parsed `yi-ring-outward` duration is between `4.5` and `5.5` seconds:

```ts
const ringRule = css.match(/\.mark-ring\{[^}]*\}/)?.[0] ?? "";
const durationSeconds = Number(
  /animation:\s*yi-ring-outward\s+([\d.]+)s/.exec(ringRule)?.[1],
);
expect(durationSeconds).toBeGreaterThanOrEqual(4.5);
expect(durationSeconds).toBeLessThanOrEqual(5.5);
```

Also require the `prefers-reduced-motion: reduce` rule to hide rings 3–5 and leave rings 1–2 visible, static, and soft.

- [ ] Run the red test:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/intro-first-frame.test.ts
```

Expected failure: the component and audit still identify “艺”/U+827A and no U+547D asset exists.

- [ ] Before changing the component, download and verify the exact FontPlayer v0.4.1 template in a new temporary directory. Do not place the 74 MB archive or extracted project in the repository:

```powershell
$fontAuditDir = Join-Path $env:TEMP ("yi-fontplayer-v0.4.1-u547d-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -LiteralPath $fontAuditDir | Out-Null
$templateZip = Join-Path $fontAuditDir "template.zip"
$templateUrl = "https://github.com/HiToysMaker/fontplayer/releases/download/v0.4.1/template.zip"
Invoke-WebRequest -Uri $templateUrl -OutFile $templateZip
$archiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $templateZip).Hash
if ($archiveHash -ne "424ABBCE964B40BC32EE8F27D95C190F3647DFF9DB8881003BBC3BF6B34235AB") {
  throw "FontPlayer v0.4.1 template archive hash mismatch."
}
Expand-Archive -LiteralPath $templateZip -DestinationPath $fontAuditDir
$templateJson = Get-ChildItem -LiteralPath $fontAuditDir -Filter "*.json" -File |
  Where-Object { $_.FullName -notmatch "[\\/]__MACOSX[\\/]" } |
  Select-Object -First 1
if (-not $templateJson) { throw "FontPlayer template JSON was not found." }
$licenseFile = Join-Path $fontAuditDir "OFL-1.1.rtf"
$licenseHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $licenseFile).Hash
if ($licenseHash -ne "B3131D001EC1C5B140A7E065DC9D7AD0B7CB68E1414DB7EB60277BDB5191D7A4") {
  throw "FontPlayer template license hash mismatch."
}
$node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$coverageCheck = @"
const fs = require('node:fs');
const project = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const records = project.file.characterList.filter(
  (item) => item.character?.text === '命' && String(item.character?.unicode).toUpperCase() === '547D',
);
if (records.length !== 1) throw new Error('Expected exactly one U+547D 命 record.');
console.log(JSON.stringify({
  glyph: records[0].character.text,
  codePoint: 'U+547D',
  recordUuid: records[0].uuid,
  componentCount: records[0].components.length,
}));
"@
& $node -e $coverageCheck $templateJson.FullName
if ($LASTEXITCODE -ne 0) { throw "FontPlayer U+547D coverage check failed." }
```

- [ ] Perform this exact audited manual export; do not redraw or simplify any stroke:

  1. Open FontPlayer v0.4.1 from the official release or its official web interface `https://toysmaker.github.io/fontplayer_demo/`.
  2. Choose “打开工程” and select `$templateJson.FullName` from the verified archive above.
  3. Locate the sole character `命` / U+547D. In advanced editing, apply “字玩标准隶书（仅笔画）” through “风格切换” with the already adopted parameters: 字重 `50`、起笔风格 `1`、起笔数值 `2`、转角风格 `1`、转角数值 `2`、字重变化 `0`、弯曲程度 `1`.
  4. Export only the selected U+547D glyph as SVG to `$fontAuditDir\ming-u547d-fontplayer-raw.svg`. This raw file is the review input and remains outside the repository.
  5. Confirm the raw SVG visibly reads “命”, contains paths only, and contains no text or font reference. Preserve all exported path commands in document order. Join multiple exported `d` values with one ASCII space only when forming the repository's one-path SVG; do not change coordinates, curve commands, or subpath order.
  6. Use `apply_patch` to place that exact joined outline into `site/public/fonts/yi-lishu-u547d.svg`, `docs/fonts/yi-lishu-u547d.svg`, and `YI_LISHU_U547D_PATH`. Do not generate repository files with a shell redirection script.
  7. Record in both audit JSON copies: project/release/commit, archive URL and SHA, license filename and SHA, U+547D record UUID and component count from the coverage check, the exact seven-step export workflow and parameters, raw SVG SHA, normalized outline SHA, final SVG SHA, `viewBox`, path/text counts, reviewer role/date, and desktop plus 390px phone rendering note.

Calculate the raw export hash before copying any outline:

```powershell
$rawExport = Join-Path $fontAuditDir "ming-u547d-fontplayer-raw.svg"
if (-not (Test-Path -LiteralPath $rawExport)) { throw "Audited U+547D raw SVG was not exported." }
(Get-FileHash -Algorithm SHA256 -LiteralPath $rawExport).Hash
```

If the coverage check fails, FontPlayer cannot export the selected glyph as paths, the displayed character is not visibly “命”, or the license chain is incomplete, stop this task and select another redistributable lishu source with the same source/hash/license/coverage evidence. Never approximate the glyph.

- [ ] Replace the inline path in `YiLishuGlyph.tsx`. The SVG itself must be the rendered glyph:

```tsx
export function YiLishuGlyph({ className }: { className?: string }) {
  const classes = ["yi-brand-glyph", className].filter(Boolean).join(" ");
  return (
    <svg
      aria-label="命"
      className={classes}
      data-code-point="U+547D"
      focusable="false"
      role="img"
      viewBox="0 0 1000 1000"
    >
      <path d={YI_LISHU_U547D_PATH} fill="currentColor" />
    </svg>
  );
}
```

Define `YI_LISHU_U547D_PATH` in the same file as the complete extracted `d` string copied byte-for-byte from the audited U+547D SVG. The public/docs SVG and this constant must hash to the same normalized outline; do not shorten, redraw, or convert it at runtime.

- [ ] Add the shared wrapper:

```tsx
type YiBrandMarkProps = {
  variant?: "hero" | "compact";
  rings?: boolean;
};

export function YiBrandMark({
  variant = "hero",
  rings = variant === "hero",
}: YiBrandMarkProps) {
  return (
    <span className={`yi-brand-mark yi-brand-mark--${variant}`}>
      {rings && Array.from({ length: 5 }, (_, index) => (
        <span className={`mark-ring r${index + 1}`} aria-hidden="true" key={index} />
      ))}
      <YiLishuGlyph />
    </span>
  );
}
```

- [ ] Replace the local `Mark()` in `YiExperience` with `<YiBrandMark variant="hero" />`.

- [ ] Add the five staggered ring rules and reduced-motion two-ring rule without rotation, flashing, or glyph obstruction.

- [ ] Update both font READMEs. Use “隶书‘命’字形” consistently. Remove stale “中山篆” and U+827A wording from current documentation and tests.

- [ ] Run:

```powershell
pnpm test tests/yi/intro-first-frame.test.ts tests/yi/theme.test.ts
rg -n "中山篆|U\+827A|yi-lishu-u827a" components lib tests public README.md ..\docs\fonts
```

Expected: tests pass and the scan returns no current-product references.

- [ ] Commit all and only the glyph chain:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$git = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $git add site/components/yi/YiLishuGlyph.tsx site/components/yi/YiBrandMark.tsx site/components/yi/YiExperience.tsx site/app/globals.css site/tests/yi/intro-first-frame.test.ts site/public/fonts/README.md site/public/fonts/yi-lishu-u547d.svg site/public/fonts/yi-lishu-u547d-source-audit.json docs/fonts/README.md docs/fonts/yi-lishu-u547d.svg docs/fonts/yi-lishu-u547d-source-audit.json site/public/fonts/yi-lishu-u827a.svg site/public/fonts/yi-lishu-source-audit.json docs/fonts/yi-lishu-u827a.svg docs/fonts/yi-lishu-source-audit.json
$protectedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash
if ($protectedHash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") {
  throw "Protected pnpm-workspace.yaml hash changed."
}
& $git ls-files --error-unmatch site/pnpm-workspace.yaml *> $null
if ($LASTEXITCODE -eq 0) { throw "Protected pnpm-workspace.yaml became tracked." }
$expectedStaged = @(
  "docs/fonts/README.md",
  "docs/fonts/yi-lishu-source-audit.json",
  "docs/fonts/yi-lishu-u547d-source-audit.json",
  "docs/fonts/yi-lishu-u547d.svg",
  "docs/fonts/yi-lishu-u827a.svg",
  "site/app/globals.css",
  "site/components/yi/YiBrandMark.tsx",
  "site/components/yi/YiExperience.tsx",
  "site/components/yi/YiLishuGlyph.tsx",
  "site/public/fonts/README.md",
  "site/public/fonts/yi-lishu-source-audit.json",
  "site/public/fonts/yi-lishu-u547d-source-audit.json",
  "site/public/fonts/yi-lishu-u547d.svg",
  "site/public/fonts/yi-lishu-u827a.svg",
  "site/tests/yi/intro-first-frame.test.ts"
) | Sort-Object
$actualStaged = @(& $git diff --cached --name-only) | Sort-Object
$stagedDelta = @(Compare-Object -ReferenceObject $expectedStaged -DifferenceObject $actualStaged)
if ($stagedDelta.Count) {
  $stagedDelta | Format-Table | Out-String | Write-Host
  throw "Unexpected staged paths."
}
$actualStaged
& $git diff --cached --check
& $git commit -m "feat: replace hero mark with audited ming glyph"
```

---

### Task 4: Add the Report Owner Ritual Header Without Regressing Save

**Files:**

- Modify: `site/components/yi/ResultShell.tsx`
- Modify: `site/components/yi/LifeHome.tsx`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/tests/yi/result-navigation.test.ts`
- Modify: `site/app/globals.css`

- [ ] Add failing tests for the report header:

```ts
const { html } = renderResult({ ...exactBirth, name: "林知夏" });
expect(html).toContain("本卷主人");
expect(html).toContain('class="report-owner-name">林知夏<');
expect(html).toContain('data-testid="report-document-title"');
expect(html).toContain("<h1>个人命运全景报告</h1>");
expect(html).toContain('aria-label="命"');
expect(html).toContain('data-code-point="U+547D"');
expect(html).not.toContain("访客的人生报告");
```

Also cover an empty name with “未填写姓名” and a long name that receives the wrapping class.

- [ ] In the same test file, retain or add regression assertions for this exact order:

```ts
const owner = html.indexOf('data-testid="report-owner-ritual"');
const reportTitle = html.indexOf('data-testid="report-document-title"');
const facts = html.indexOf('data-testid="adopted-birth-facts"');
const actions = html.indexOf('data-testid="report-save-actions"');
expect(owner).toBeGreaterThan(-1);
expect(reportTitle).toBeGreaterThan(owner);
expect(facts).toBeGreaterThan(reportTitle);
expect(actions).toBeGreaterThan(facts);
```

Retain tests for dialog focus entry, Tab/Shift+Tab containment, Escape close, close-button focus restoration, save failure feedback, and successful `onSaveHome`.

- [ ] Run the red test:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/result-navigation.test.ts
```

Expected failure: the result shell still shows a text “艺” mark and the old `{name}的人生报告` title.

- [ ] Render the ritual header with the shared compact mark:

```tsx
<header className="report-title-region" data-testid="report-title-region">
  <div className="report-owner-ritual" data-testid="report-owner-ritual">
    <YiBrandMark variant="compact" />
    <div className="report-owner-lockup">
      <span className="report-owner-kicker">本卷主人</span>
      <strong className="report-owner-name">{displayName}</strong>
      <span className="report-owner-seal">{themeElement}命印</span>
    </div>
  </div>
  <div className="report-document-title" data-testid="report-document-title">
    <small>艺｜东方人生智慧</small>
    <h1>个人命运全景报告</h1>
  </div>
</header>
```

Add a required `themeElement: YiThemeElement` prop to `ResultShell`, pass the already-derived value from `YiExperience`, and update the one `renderResult` test helper to derive and pass the same value from its calculated chart. For `neutral`, display “待定命印”. Do not derive the theme again inside `ResultShell` or infer a non-neutral element when the day pillar is ambiguous.

- [ ] Replace the `LifeHome` text mini-mark with `<YiBrandMark variant="compact" />`.

- [ ] Style the owner block as a restrained seal-and-name composition. The name ritual comes first in DOM reading order, followed by the independent “个人命运全景报告” title; the title remains the sole `<h1>` and the stronger information hierarchy. Long names wrap, and neither block uses a saturated full-width background.

- [ ] Re-run:

```powershell
pnpm test tests/yi/result-navigation.test.ts tests/yi/intro-first-frame.test.ts tests/yi/theme.test.ts
```

Expected: ritual header and all save-flow regressions pass.

- [ ] Commit:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
$git = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
& $git add site/components/yi/ResultShell.tsx site/components/yi/LifeHome.tsx site/components/yi/YiExperience.tsx site/tests/yi/result-navigation.test.ts site/app/globals.css
$protectedHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash
if ($protectedHash -ne "FB4CD1144091D2D15EF21D607C27ABE15BC40A45E1B7828AE50E232EABDE3E78") {
  throw "Protected pnpm-workspace.yaml hash changed."
}
& $git ls-files --error-unmatch site/pnpm-workspace.yaml *> $null
if ($LASTEXITCODE -eq 0) { throw "Protected pnpm-workspace.yaml became tracked." }
$expectedStaged = @(
  "site/app/globals.css",
  "site/components/yi/LifeHome.tsx",
  "site/components/yi/ResultShell.tsx",
  "site/components/yi/YiExperience.tsx",
  "site/tests/yi/result-navigation.test.ts"
) | Sort-Object
$actualStaged = @(& $git diff --cached --name-only) | Sort-Object
$stagedDelta = @(Compare-Object -ReferenceObject $expectedStaged -DifferenceObject $actualStaged)
if ($stagedDelta.Count) {
  $stagedDelta | Format-Table | Out-String | Write-Host
  throw "Unexpected staged paths."
}
$actualStaged
& $git diff --cached --check
& $git commit -m "feat: add shared brand mark and report owner ritual"
```

---

### Task 5: Focused Foundation Verification

**Files:**

- Verify only; fix only failures caused by this plan.

- [ ] Run the focused suite:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild\site"
pnpm test tests/yi/theme.test.ts tests/yi/intro-first-frame.test.ts tests/yi/result-navigation.test.ts tests/yi/experience-copy.test.ts
pnpm exec tsc --noEmit
pnpm lint
```

- [ ] Check stale terms and accidental font dependencies:

```powershell
rg -n "中山篆|U\+827A|yi-lishu-u827a|font-family=.*隶|<text\\b" components lib tests public README.md ..\docs\fonts
```

Expected: no current-product stale glyph claim or system-font rendering path.

- [ ] Verify the protected file and index:

```powershell
Set-Location "C:\Users\Administrator\Documents\Codex\2026-07-17\z\.worktrees\yi-content-engine-rebuild"
(Get-FileHash -Algorithm SHA256 -LiteralPath "site\pnpm-workspace.yaml").Hash
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" ls-files --error-unmatch site/pnpm-workspace.yaml
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" status --short
```

Expected: frozen hash unchanged; `ls-files` exits non-zero; the path remains the only unrelated untracked file.
