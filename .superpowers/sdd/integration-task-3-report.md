# Plan D Task 3 Report — Five Layer Outward Gold Breathing Rings

## Delivered implementation

- Replaced the former anonymous `<i />` / `<b />` two-ring mark with one `yi-brand-orbit yi-mark` wrapper, one local-font `yi-brand-glyph`, and five decorative `yi-breath-ring` elements.
- The wrapper is the sole accessible brand name: `role="img" aria-label="艺"`. The glyph and every ring have `aria-hidden="true"`.
- Every ring uses `--ring-index` values `0` through `4`; rings are pointer-safe with `pointer-events:none`.
- `yi-ring-outward` runs in a five-second cycle with `calc(var(--ring-index) * 1s)` delays. Its keyframes use only `transform:scale(...)` and opacity—no rotation.
- Reduced motion disables the ring animation and leaves the five restrained static rings visible at `opacity:.16` with indexed scale.
- The existing Zhongshan seal font-face and first-frame visible copy remain intact.

## Strict RED / GREEN evidence

1. Added the focused first-frame test before the final production state. It checks five rendered rings, accessible markup, pointer safety, five-second outward-only keyframes, reduced-motion static rendering, and removal of legacy selectors/keyframes.
2. Restored the old two-ring production markup/CSS temporarily and ran:

   ```powershell
   pnpm exec vitest run tests/yi/intro-first-frame.test.ts tests/yi/experience-copy.test.ts
   ```

   RED: 2 expected failures in `intro-first-frame.test.ts` (the new five-layer accessibility test and the updated glyph `aria-hidden` assertion); 14 other tests passed. The five-layer test failed because the old structure supplied no `yi-brand-orbit` / `yi-breath-ring` markup.
3. Restored the new production implementation and reran the focused command.

   GREEN: 2 files passed, 16/16 tests passed.

## Markup and animation verification

- Server-rendered first-frame count: 1 `yi-brand-glyph`; 5 `yi-breath-ring` elements.
- CSS: `animation:yi-ring-outward 5s cubic-bezier(.22,.55,.28,1) infinite`; delay `calc(var(--ring-index) * 1s)`.
- CSS: `pointer-events:none`; no `rotate`; no legacy `yi-breathe`; no `.yi-mark i,.yi-mark b` selector.
- Reduced motion: `animation:none; opacity:.16; transform:scale(calc(1 + var(--ring-index) * .34))`.

## Verification results

All commands below were run with the bundled Node/Git runtime on this machine; `site/pnpm-workspace.yaml` was not staged or committed.

```powershell
pnpm exec vitest run tests/yi/intro-first-frame.test.ts tests/yi/experience-copy.test.ts
# PASS: 2 files, 16/16 tests

pnpm exec vitest run
# PASS: 27 files, 405/405 tests

pnpm run lint
# PASS

pnpm exec tsc --noEmit --strict --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types node,vite/client components/yi/YiExperience.tsx tests/yi/intro-first-frame.test.ts tests/yi/experience-copy.test.ts
# PASS

pnpm run test:github
# PASS: Vite production build plus 5/5 GitHub build tests

git diff --check
# PASS
```

The GitHub build refreshed `docs/index.html` and the hashed `docs/assets` bundle. Its checks confirm that local font files and every `site/public/reference` asset are mirrored byte-for-byte into `docs`.

## Live browser QA

Browser automation itself was present, but no browser window was running and the environment blocked the hidden local Vite-server launch command needed to expose a local URL. Therefore no viewport claims are made for 320px, 390×844, or 1440×900. The static 320px safety requirement is covered by the `width:min(52vw,260px)` orbit sizing, the existing clipped intro, and the focused markup/CSS regression tests; live visual confirmation remains outstanding.

## Changed files and self-review

- `site/components/yi/YiExperience.tsx`
- `site/app/globals.css`
- `site/tests/yi/intro-first-frame.test.ts`
- `site/tests/github-build.test.mjs`
- generated `docs/index.html` and `docs/assets/*`

Self-review: the five-ring contract, ARIA ownership, non-interception, non-rotation, five-second cycle, reduced-motion state, font integration, and first-frame copy are covered. The only outstanding item is live-browser viewport observation, blocked by the local-server launch policy rather than a product failure.

## Follow-up test-strength review

The focused first-frame test now counts `yi-breath-ring` elements only within the matched `yi-brand-orbit` subtree and inspects the complete base `.yi-breath-ring{...}` rule for forbidden `rotate` / `rotation` behavior in addition to checking the keyframes.

Sensitivity proof was performed with two controlled production mutations, restored immediately after each RED run:

1. Kept five rings globally but moved ring index `4` outside the orbit. The focused suite failed only the strengthened test, reporting `expected length 5, received 4` for the orbit subtree; 15/16 tests passed.
2. Restored the markup, then temporarily added `transform:rotate(1deg)` to the base ring rule. The focused suite again failed only the strengthened test, reporting that the full rule matched `/rotate|rotation/i`; 15/16 tests passed.
3. Restored production markup and CSS. Focused GREEN returned 16/16 passing tests.
