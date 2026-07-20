# Plan D Task 1 Report — Consolidate Source and Copyright Governance

## Outcome

Implemented a static, unified Yi source registry and a deterministic reference audit.  The registry keeps calculation libraries, classical frameworks, product-original heuristics, public cultural references, traditional catalog entries, historical identities, film-character identities, and the zodiac element/modality model separate by role and usage boundary.  `SourceNote` keeps its compact first layer and exposes the governance details only inside its existing disclosure.

## TDD evidence

1. **RED — source audit module:** Added `site/tests/yi/source-audit.test.ts`, then ran `pnpm exec vitest run tests/yi/source-audit.test.ts`. It failed as expected because `../../lib/yi/source-audit` did not exist.
2. **GREEN — source registry and audit:** Added `getAllSources()` and `auditSourceReferences()`. The same focused test passed: 3 tests passed.
3. **RED — source-note governance details:** Added the visible-detail contract to `site/tests/yi/source-note.test.ts`, then ran `pnpm exec vitest run tests/yi/source-note.test.ts`. It failed as expected because the rendered disclosure did not contain the resolved source role.
4. **GREEN — source-note disclosure:** Added resolved title, grade, role, edition/access note, boundary, and conditional external link rendering. The focused source-note test passed: 3 tests passed.
5. **RED — required access date:** Tightened the audit test to require every record to have an ISO date. It failed as expected for `edition-pending`.
6. **GREEN — catalog-review date:** Kept the edition-pending wording in `editionNote` while assigning the reviewed offline traditional records the catalog review date `2026-07-20`. The focused source-audit test passed: 3 tests passed.

## Changed files

- `site/lib/yi/sources.ts` — extends reference metadata and builds the unified, duplicate-free registry.
- `site/lib/yi/source-audit.ts` — checks source IDs deterministically and de-duplicates missing-ID issues in first-seen order.
- `site/components/yi/SourceNote.tsx` — renders resolved governance details within the existing `<details>` layer.
- `site/tests/yi/source-audit.test.ts` — registry, reference-resolution, unknown-ID, and identity/model coverage.
- `site/tests/yi/source-note.test.ts` — visible source-detail coverage.

`site/lib/yi/traditional-sources.ts` did not need modification: its existing edition and boundary metadata is adapted into the unified contract. Generated `docs` were not edited. The user-owned untracked `site/pnpm-workspace.yaml` was not touched or staged.

## Registry counts

The final registry has **71** unique records in stable insertion order:

| Category | Count | Notes |
| --- | ---: | --- |
| Calculation library | 2 | `lunar-typescript`-based coordinate calculations |
| Classical framework | 1 | Gan-zhi relationship rule framework |
| Product heuristic | 3 | Explicitly product-original, not classical authority |
| Traditional 子平 | 7 | Catalog records with edition and use boundaries |
| Traditional 相学 | 1 | Cultural/atlas terminology only |
| Traditional 象数 | 2 | Cultural terminology only |
| Public reference | 3 | GB/T, National Museum, NASA after classical canonicalization |
| Historical-person identity | 15 | One deterministic record for each current historical mirror |
| Film-character identity | 36 | One deterministic record for each current movie candidate |
| Modern astrology model | 1 | Elements/modality classification with science boundary |

The two overlapping classical records (`classic.san-ming-tong-hui`, `classic.di-tian-sui`) are represented once each; the richer traditional-catalog metadata replaces the lighter reference-catalog version.

## Copyright and source-boundary decisions

- Classical originals, later compilation/commentary, and product-original interpretation remain separated by `role`, `editionNote`, and `boundary` fields.
- Calculation libraries are labelled as program dependencies; they do not provide personality or event predictions.
- Product heuristics are explicitly labelled “产品原创” and are never displayed as classical authority.
- Historical records only verify identity and public documentary/works context. Film records only verify film/character identity through direct candidate-specific IMDb title records. The comparison prose remains local product-original copy.
- No external synopsis, review, dialogue, biography wording, or modern web personality text was copied.
- Web-source spot checks on 2026-07-20 confirmed current institutional records including the American Foundation for the Blind’s Helen Keller archive, The National Archives’ Florence Nightingale resource, the Gandhi Heritage Portal, and NASA’s constellation boundary context.
- All URLs are HTTPS; only the explicitly edition-pending traditional entries retain an empty URL, with their pending status recorded in the edition note.

## Verification

All commands were run from `site/` with the bundled Node runtime available on `PATH`:

| Command | Result |
| --- | --- |
| `pnpm exec vitest run tests/yi/source-audit.test.ts tests/yi/source-note.test.ts tests/yi/traditional-atlas.test.ts` | Passed — 3 files, 33 tests |
| `pnpm exec vitest run` | Passed — 27 files, 400 tests |
| `pnpm run lint` | Passed — ESLint completed without findings |
| `pnpm exec tsc --noEmit --strict --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types node,vite/client lib/yi/source-audit.ts components/yi/SourceNote.tsx tests/yi/source-audit.test.ts tests/yi/source-note.test.ts` | Passed |
| `git diff --check` | Passed |

## Self-review

- Confirmed registry IDs use only lowercase letters, digits, dots, and hyphens and are unique.
- Confirmed every `buildInterpretations(chart)` rule ID resolves.
- Confirmed unknown references are de-duplicated while retaining first-seen order.
- Confirmed every current historical and film mirror candidate has a deterministic identity source, plus the separate element/modality model record.
- Confirmed `SourceNote` has no new initial-screen block and retains its confidence notice and calculation-rule explanation.
- Confirmed no runtime network request is introduced; all metadata is static local data.

## Review-fix wave — candidate-specific provenance

This section supersedes the earlier film-search and generic-person URL strategy. The registry remains at 71 unique records, but every identity link and every local-method boundary is now explicit and candidate-specific.

### Additional RED/GREEN evidence

1. **RED — audit module contract:** Tests imported `getAllSources` and `UnifiedSource` from `source-audit.ts`; the focused run failed because `getAllSources` was not exported. `source-audit.ts` now re-exports both members.
2. **RED — reviewer defects:** After that minimal export fix, focused tests failed for the person-generic/search URL policy, NASA-backed taxonomy URL, and a source title appearing before `<details>`. The registry adapters and rule titles were then corrected; 8 focused audit/note tests passed.
3. **RED — authority-record correctness:** A fixed 15-person source oracle caught `historical-sima-qian` pointing at unrelated Wikidata item Q221584. The record was corrected to the verified Sima Qian authority item Q9372; the focused run returned GREEN.

### Stable URL strategy

- All **36 film candidates** now use direct `https://www.imdb.com/title/tt.../` records. No `/find`, `/search`, query endpoint, or generic IMDb homepage remains.
- The full 36-ID set was independently submitted in one Wikidata SPARQL `VALUES` query against property P345. The query returned **36/36** items, with each returned label matching the intended film (including `tt17097088` for 《隐入尘烟》 and `tt2278392` for 《中国合伙人》).
- Each film registry title explicitly names both the film and candidate character, and its role is limited to that identity mapping. Personality comparison prose remains product-original.
- All **15 historical candidates** have an exact URL oracle in the audit test. Institutional records are retained where available (UNESCO, UK National Archives, AFB, Nobel Prize, Nelson Mandela Foundation, Palace Museum, and Qingpu Museum); Wikidata person items are used as structured authority records for Gandhi and several historical Chinese figures. Generic CText home URLs are gone.
- Source-quality caveat: Wikidata is a structured authority record rather than a critical biography. It is intentionally used only to support identity for Gandhi, Li Qingzhao, Sima Guang, Sima Qian, Tao Yuanming, Xuanzang, and Zhang Qian. No biographical inference or prose is drawn from it. No candidate remains unresolved.

### Corrected method and copyright boundaries

- The three product heuristics now have empty URLs and an explicit `产品自有方法版本` edition note; `lunar-typescript` is no longer presented as their source.
- The gan-zhi framework now has an empty URL and an explicit `对应古典文献来源待核` note instead of a generic Book of Changes link.
- The zodiac element/modality model now has an empty URL and is labelled a `产品分类约定`. NASA remains only in its separate astronomy/astrology boundary record.
- `SourceNote` governance metadata is asserted inside the `<details>` substring and absent before it. Rule source titles are distinct from the concise first-layer theory labels so the collapsed layer remains compact.

### Review-fix verification

| Command | Result |
| --- | --- |
| `pnpm exec vitest run tests/yi/source-audit.test.ts tests/yi/source-note.test.ts tests/yi/traditional-atlas.test.ts` | Passed — 3 files, 35 tests |
| `pnpm exec vitest run` | Passed — 27 files, 402 tests |
| `pnpm run lint` | Passed — no findings |
| Targeted strict TypeScript command from the brief | Passed |
| `git diff --check` | Passed after the report update |

## Second re-review fix — live authority URLs and exact film oracle

- Verified the live Confucius structured authority record at Wikidata Q4604 and replaced the dead UNESCO URL.
- Verified the Nelson Mandela Foundation’s live candidate-specific page and replaced the dead timeline URL with `https://www.nelsonmandela.org/biography-timeline`.
- **RED:** The corrected 15-person URL oracle failed against the old Confucius production URL, demonstrating the dead-link correction before production was changed.
- Added an independently authored 36-candidate IMDb oracle to `source-audit.test.ts`. It contains one exact direct URL for every movie candidate and asserts candidate order plus candidate-by-candidate equality.
- **Mutation sensitivity:** Before production changes, temporarily changed the test oracle for `movie-cn-ne-zha` from `tt10627720` to `tt10627721`. The isolated movie-oracle test failed with the expected URL mismatch; the mutation was then reverted and is not committed.
- Corrected the earlier wording so the report consistently describes direct candidate-specific IMDb title records.
- **GREEN:** focused source suites passed 36/36; full Vitest passed 403/403; lint, targeted strict TypeScript, and `git diff --check` passed.
