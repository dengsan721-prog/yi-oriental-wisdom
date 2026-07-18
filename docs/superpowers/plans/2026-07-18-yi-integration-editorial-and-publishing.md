# Yi Integration, Editorial QA and Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 统一内容来源和质量门禁，完成中山王篆首页品牌字与多层金色呼吸光环，并对全部模块进行编辑、移动端、构建和公网发布验收。

**Architecture:** 本计划依赖前三份子系统计划完成。来源登记、内容审计和构建验证保持为纯数据或脚本，页面只消费已验证内容。首页字体本地托管并保留 OFL 许可；发布继续使用现有 React 产品构建 docs，不维护第二套页面。

**Tech Stack:** TypeScript 5.9、React 19、Vitest 4、Vite 8、CSS、GitHub Pages、SIL OFL 1.1 字体

## Global Constraints

- 现有 React 产品是唯一源码，docs 只能由 npm run build:github 生成。
- 首页只保留单字“艺”、两行品牌语和主按钮。
- “艺”使用已核授权的中山王篆字形，本地托管字体与许可副本。
- 四至五层金色光环依次向外扩散，不旋转、不闪烁，完整周期约四至六秒。
- prefers-reduced-motion 下停止扩散，只保留静态柔光。
- 古籍原文、后世注解和产品现代解释分开；现代网络文案不直接复制。
- 所有模块通过命理、内容、产品、视觉和风险五类质询。
- GitHub Pages、字体、图片和构建资源必须在手机其他网络下返回 200。

---

## File Structure

- site/lib/yi/sources.ts：统一现代、标准、文化和人物来源。
- site/lib/yi/traditional-sources.ts：十部核心古籍来源与版本。
- site/lib/yi/source-audit.ts：来源完整性、引用存在性和纪律边界。
- site/lib/yi/content-audit.ts：跨模块篇幅、禁词、场景、行动和重复审计。
- site/components/yi/SourceNote.tsx：来源用途、版本和边界展示。
- site/components/yi/YiExperience.tsx：首页“艺”字和多层光环结构。
- site/public/fonts/JFZSKSealScript_V3.5.ttf：本地托管中山王篆字体。
- site/public/fonts/OFL.txt：原字体许可副本。
- site/public/fonts/README.md：版本、来源、转换和字形验证记录。
- site/app/globals.css：字体、首页光环和跨模块最终视觉。
- site/tests/yi/source-note.test.ts：来源展示。
- site/tests/yi/source-audit.test.ts：所有引用可解析。
- site/tests/yi/content-audit.test.ts：跨模块内容矩阵。
- site/tests/yi/intro-first-frame.test.ts：首页字体和光环。
- site/tests/yi/experience-copy.test.ts：关键产品语言。
- site/tests/github-build.test.mjs：生产构建、安全和资源。
- docs/superpowers/reviews/2026-07-18-yi-editorial-review.md：五视角审校记录。
- docs/superpowers/reviews/2026-07-18-yi-release-checklist.md：发布与公网复验记录。

### Task 1: Consolidate Source and Copyright Governance

**Files:**
- Modify: site/lib/yi/sources.ts
- Modify: site/lib/yi/traditional-sources.ts
- Create: site/lib/yi/source-audit.ts
- Create: site/tests/yi/source-audit.test.ts
- Modify: site/components/yi/SourceNote.tsx

**Interfaces:**
- Produces getAllSources(): UnifiedSource[].
- Produces auditSourceReferences(ids): string[].
- UnifiedSource contains id, title, category, grade, url, role, editionNote, boundary and accessDate.

- [ ] **Step 1: Write failing source-audit tests**

~~~ts
import { describe, expect, it } from "vitest";
import { auditSourceReferences, getAllSources } from "../../lib/yi/source-audit";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { calculateFourPillars } from "../../lib/yi/four-pillars";

describe("source governance", () => {
  it("gives every registered source a use, version note and boundary", () => {
    const sources = getAllSources();
    expect(sources.length).toBeGreaterThanOrEqual(15);
    for (const source of sources) {
      expect(source.id).toMatch(/^[a-z0-9.-]+$/);
      expect(source.role.length).toBeGreaterThanOrEqual(12);
      expect(source.editionNote.length).toBeGreaterThanOrEqual(10);
      expect(source.boundary.length).toBeGreaterThanOrEqual(12);
      if (source.url) expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it("resolves every interpretation source ID", () => {
    const chart = calculateFourPillars({
      name:"", date:"1990-06-15", time:"09:30", location:"杭州",
      gender:"male", timeConfidence:"exact",
    });
    const ids = buildInterpretations(chart).flatMap(item => item.sourceRuleIds);
    expect(auditSourceReferences(ids)).toEqual([]);
  });
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/source-audit.test.ts

Expected: FAIL because source-audit.ts does not exist.

- [ ] **Step 3: Implement the unified source adapter**

~~~ts
import { YI_REFERENCE_SOURCES } from "./sources";
import { TRADITIONAL_SOURCE_CATALOG } from "./traditional-sources";

export type UnifiedSource = {
  id:string;
  title:string;
  category:string;
  grade:string;
  url:string;
  role:string;
  editionNote:string;
  boundary:string;
  accessDate:string;
};

export function getAllSources(): UnifiedSource[] {
  const traditional = Object.values(TRADITIONAL_SOURCE_CATALOG).map(source => ({
    id:source.id, title:source.title, category:source.category, grade:source.grade,
    url:source.url, role:source.usage, editionNote:source.editionNote,
    boundary:source.boundary, accessDate:source.accessDate ?? "2026-07-18",
  }));
  const reference = Object.values(YI_REFERENCE_SOURCES).map(source => ({
    id:source.id, title:source.title, category:"现代参考", grade:source.grade,
    url:source.url, role:source.role, editionNote:source.editionNote ?? "数字来源，按访问日期复核",
    boundary:source.boundary, accessDate:source.accessDate ?? "2026-07-18",
  }));
  return [...traditional, ...reference];
}

export function auditSourceReferences(ids: string[]): string[] {
  const known = new Set(getAllSources().map(source => source.id));
  return [...new Set(ids)].filter(id => !known.has(id)).map(id => "来源不存在:" + id);
}
~~~

- [ ] **Step 4: Record all new mirror and astrology sources**

Add source records for every history/film biography source and the astrology element/modality model. Film records cite the film title and a reliable film database or official distributor page for identity only; their personality analysis remains product-original. Do not store copied synopsis or review text.

- [ ] **Step 5: Update SourceNote**

SourceNote renders:

- 来源名称和等级。
- 用途。
- 版本或访问日期。
- 使用边界。
- External link only when url is non-empty.

- [ ] **Step 6: Run tests and commit**

Run: cd site; npx vitest run tests/yi/source-audit.test.ts tests/yi/source-note.test.ts tests/yi/traditional-atlas.test.ts

Expected: PASS.

~~~bash
git add site/lib/yi/sources.ts site/lib/yi/traditional-sources.ts site/lib/yi/source-audit.ts site/components/yi/SourceNote.tsx site/tests/yi/source-audit.test.ts
git commit -m "feat: unify yi source governance"
~~~

### Task 2: Add the Zhongshan Seal-Script Brand Font

**Files:**
- Create: site/public/fonts/JFZSKSealScript_V3.5.ttf
- Create: site/public/fonts/OFL.txt
- Create: site/public/fonts/README.md
- Modify: site/app/globals.css
- Modify: site/tests/yi/intro-first-frame.test.ts

**Interfaces:**
- CSS font family is Yi Zhongshan Seal.
- The public font visually renders Unicode U+827A, the simplified character “艺”.
- Font source is jeffi369/JFZSKSealScript under SIL Open Font License 1.1.

- [ ] **Step 1: Add failing source and CSS tests**

~~~ts
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

it("ships a local licensed Zhongshan seal-script font", () => {
  const font = resolve("public/fonts/JFZSKSealScript_V3.5.ttf");
  const license = resolve("public/fonts/OFL.txt");
  expect(existsSync(font)).toBe(true);
  expect(statSync(font).size).toBeGreaterThan(10_000);
  expect(readFileSync(license, "utf8")).toContain("SIL OPEN FONT LICENSE Version 1.1");
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  expect(css).toContain('font-family:"Yi Zhongshan Seal"');
  expect(css).toContain("JFZSKSealScript_V3.5.ttf");
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/intro-first-frame.test.ts

Expected: FAIL because the local font and license are absent.

- [ ] **Step 3: Download the latest official release and license**

Use the official GitHub repository API. The reviewed release on 2026-07-18 is V3.5 and its font asset is JFZSKSealScript_V3.5.ttf:

~~~powershell
$headers = @{ "User-Agent" = "yi-font-fetch" }
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/jeffi369/JFZSKSealScript/releases/latest" -Headers $headers
if ($release.tag_name -ne "V3.5") { throw "Font release changed; review the new release before updating the recorded version." }
$asset = $release.assets | Where-Object { $_.name -eq "JFZSKSealScript_V3.5.ttf" } | Select-Object -First 1
if (-not $asset) { throw "Official V3.5 font asset was not found." }
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile site\public\fonts\JFZSKSealScript_V3.5.ttf
Invoke-WebRequest -Uri https://raw.githubusercontent.com/jeffi369/JFZSKSealScript/main/OFL.txt -OutFile site\public\fonts\OFL.txt
~~~

- [ ] **Step 4: Verify the “艺” glyph**

Load the local homepage with network access disabled after the page itself has loaded. In browser developer tools run:

~~~js
await document.fonts.load('160px "Yi Zhongshan Seal"', "艺");
document.fonts.check('160px "Yi Zhongshan Seal"', "艺");
~~~

Expected: true. Compare the rendered glyph with the official V3.5 preview and confirm it is visibly different from the serif fallback. If the glyph is absent, stop this task and review a newer official release rather than substituting an unlicensed font.

- [ ] **Step 5: Record provenance**

~~~md
# Yi Zhongshan seal-script font

- Source: https://github.com/jeffi369/JFZSKSealScript
- Release tag: V3.5
- Asset: JFZSKSealScript_V3.5.ttf
- Original family: JFZSKSealScript
- Product family alias: Yi Zhongshan Seal
- Required glyph: U+827A 艺
- License: SIL Open Font License 1.1; see OFL.txt
- Packaging: official TTF is locally hosted without a third-party font CDN
- Verification date: 2026-07-18
~~~

- [ ] **Step 6: Declare the local font**

~~~css
@font-face{
  font-family:"Yi Zhongshan Seal";
  src:url("/fonts/JFZSKSealScript_V3.5.ttf") format("truetype");
  font-style:normal;
  font-weight:400;
  font-display:swap;
}
.yi-brand-glyph{font-family:"Yi Zhongshan Seal","STKaiti",serif;font-weight:400}
~~~

Use the same Vite public-base helper already used by static image assets if an absolute /fonts path fails under the GitHub Pages subpath. The production CSS must resolve a local repository asset, never a third-party CDN.

- [ ] **Step 7: Run tests and commit**

Run: cd site; npx vitest run tests/yi/intro-first-frame.test.ts; npm run test:github

Expected: PASS; docs contains JFZSKSealScript_V3.5.ttf and OFL.txt.

~~~bash
git add site/public/fonts site/app/globals.css site/tests/yi/intro-first-frame.test.ts docs
git commit -m "feat: add Zhongshan seal script brand glyph"
~~~

### Task 3: Build Layered Outward Gold Breathing Rings

**Files:**
- Modify: site/components/yi/YiExperience.tsx
- Modify: site/app/globals.css
- Modify: site/tests/yi/intro-first-frame.test.ts
- Modify: site/tests/yi/experience-copy.test.ts

**Interfaces:**
- Homepage brand markup contains one yi-brand-glyph and five decorative yi-breath-ring spans.
- Rings expand outward sequentially over five seconds.
- Reduced-motion renders static rings.

- [ ] **Step 1: Add failing structure tests**

~~~ts
it("renders a seal-script glyph with five outward rings", () => {
  const source = readFileSync(resolve("components/yi/YiExperience.tsx"), "utf8");
  expect(source).toContain("yi-brand-glyph");
  expect((source.match(/yi-breath-ring/g) ?? []).length).toBeGreaterThanOrEqual(1);
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  expect(css).toContain("@keyframes yi-ring-outward");
  expect(css).toContain("prefers-reduced-motion:reduce");
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/intro-first-frame.test.ts

Expected: FAIL because the new markup and keyframes are absent.

- [ ] **Step 3: Render five decorative rings**

~~~tsx
<div className="yi-brand-orbit" role="img" aria-label="艺">
  <span className="yi-brand-glyph" aria-hidden="true">艺</span>
  {Array.from({ length:5 }, (_, index) =>
    <i className="yi-breath-ring" aria-hidden="true" style={{ "--ring-index": index } as React.CSSProperties} key={index} />)}
</div>
~~~

The accessible name remains a single “艺”; decorative rings are hidden from assistive technology.

- [ ] **Step 4: Implement sequential outward breathing**

~~~css
.yi-brand-orbit{position:relative;display:grid;place-items:center;width:min(52vw,260px);aspect-ratio:1;isolation:isolate}
.yi-brand-glyph{position:relative;z-index:3;font-size:clamp(104px,22vw,184px);line-height:1;color:#e4c16a;text-shadow:0 0 13px #d4a83d66,0 0 42px #8b641f36}
.yi-breath-ring{--ring-index:0;position:absolute;inset:28%;z-index:1;pointer-events:none;border:1px solid #d9b75f88;border-radius:50%;box-shadow:0 0 11px #d8aa3b35,inset 0 0 9px #d8aa3b22;opacity:0;animation:yi-ring-outward 5s cubic-bezier(.22,.55,.28,1) infinite;animation-delay:calc(var(--ring-index) * 1s)}
@keyframes yi-ring-outward{
  0%{transform:scale(.72);opacity:0}
  12%{opacity:.66}
  70%{opacity:.12}
  100%{transform:scale(3.1);opacity:0}
}
@media(prefers-reduced-motion:reduce){
  .yi-breath-ring{animation:none;opacity:.16;transform:scale(calc(1 + var(--ring-index) * .34))}
  .yi-breath-ring:nth-child(n+4){display:none}
}
~~~

- [ ] **Step 5: Verify animation constraints**

Confirm:

- Rings only scale and fade; no rotate declaration exists.
- No flash or opacity jump exceeds one cycle per second.
- The first ring starts near the glyph and the fifth reaches the outer boundary.
- The glyph remains readable at 320px width.
- Clicking “开始排盘” is never blocked because rings use pointer-events:none.

- [ ] **Step 6: Run tests and commit**

Run: cd site; npx vitest run tests/yi/intro-first-frame.test.ts tests/yi/experience-copy.test.ts; npm run test:github

Expected: PASS.

~~~bash
git add site/components/yi/YiExperience.tsx site/app/globals.css site/tests/yi/intro-first-frame.test.ts site/tests/yi/experience-copy.test.ts docs
git commit -m "feat: add layered gold breathing rings"
~~~

### Task 4: Add Cross-Module Content Audit

**Files:**
- Create: site/lib/yi/content-audit.ts
- Create: site/tests/yi/content-audit.test.ts

**Interfaces:**
- Produces auditProductContent(fixtures): ContentAuditIssue[].
- Audits overview, twenty-one interpretations, fortune, four compatibility roles, zodiac, animal, historical, movie, face, mole, palm and star content.

- [ ] **Step 1: Write the failing audit test**

~~~ts
import { expect, it } from "vitest";
import { auditProductContent } from "../../lib/yi/content-audit";

it("passes the complete product content matrix", () => {
  const issues = auditProductContent();
  expect(issues).toEqual([]);
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/content-audit.test.ts

Expected: FAIL because content-audit.ts does not exist.

- [ ] **Step 3: Implement exact audit categories**

~~~ts
export type ContentAuditIssue = {
  module:string;
  itemId:string;
  rule:"missing" | "too-short" | "forbidden" | "duplicate" | "missing-source" | "certainty";
  field:string;
};

const forbidden = [
  "功能入口","资源接口","社会接口","能量端口","底层模型","高维链接",
  "注定","必然破财","克夫","克妻","疾病诊断","寿命已定",
];
~~~

The audit uses fixed male, female and unknown-time birth fixtures and must verify:

- Twenty-one interpretation IDs and seven domains.
- Nine axes for all four compatibility roles.
- Three animal, three historical and three movie candidates.
- Twelve zodiac mirrors and twelve zodiac profiles.
- Ten face, twelve mole and ten palm options.
- Every core field has a source and boundary.
- Scenario and action strings are not duplicated within a module.
- Unknown-time output contains no certain hour-dependent conclusion.

- [ ] **Step 4: Run audit and fix all issues**

Run: cd site; npx vitest run tests/yi/content-audit.test.ts

Expected: PASS with an empty issue list. Fix data at its owning module; do not weaken audit thresholds to make failures disappear.

- [ ] **Step 5: Commit the audit**

~~~bash
git add site/lib/yi/content-audit.ts site/tests/yi/content-audit.test.ts site/lib/yi
git commit -m "test: enforce complete yi content matrix"
~~~

### Task 5: Run the Five-View Editorial Review

**Files:**
- Create: docs/superpowers/reviews/2026-07-18-yi-editorial-review.md
- Modify source files only for issues discovered.

- [ ] **Step 1: Review as a命理研究者**

For each core rule, record:

- Whether the chart evidence is present.
- Whether required conditions are complete.
- Whether systems or traditions are mixed.
- Whether unknown time is handled.

- [ ] **Step 2: Review as a大众内容编辑**

Read representative outputs for male, female and unknown time. Mark every paragraph that cannot be retold in one sentence, lacks a scene, or sounds like generic artificial-intelligence copy. Rewrite at the owning content file.

- [ ] **Step 3: Review as a产品经理**

At 390×844 and 1440×900, verify five-second, thirty-second, three-minute and source-depth paths. Confirm long theory does not occupy the initial screen.

- [ ] **Step 4: Review as a视觉设计师**

Check:

- Zhongshan seal glyph rendering.
- Five outward gold rings.
- Male/female atlas selection.
- Mirror labels and hotspots.
- Twelve unique constellation maps.
- Text density, spacing and touch targets.

- [ ] **Step 5: Review as a风险审校者**

Search for fear, discrimination, medical claims, deterministic outcomes, image-based moral judgment, copied movie dialogue and unlicensed visual references.

- [ ] **Step 6: Record every question and resolution**

Use this exact table:

~~~md
| 视角 | 模块 | 质询 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| 命理 | 命局总览 | 结论是否有两类命盘证据 | 测试或文件位置 | 修改内容 | 通过 |
~~~

No row may remain “待处理” when the plan completes.

- [ ] **Step 7: Run regression and commit review fixes**

Run: cd site; npm run lint; npm test; npm run test:github

Expected: all commands exit 0.

~~~bash
git add site docs/superpowers/reviews
git commit -m "docs: close yi expert editorial review"
~~~

### Task 6: Verify Production and Publish

**Files:**
- Create: docs/superpowers/reviews/2026-07-18-yi-release-checklist.md
- Modify only defects discovered during release verification.

- [ ] **Step 1: Confirm a clean intentional worktree**

Run: git status --short

Expected: only intentional product changes and generated docs build output are present; user-owned outputs and work directories remain untouched and untracked.

- [ ] **Step 2: Run the complete gate**

Run: cd site; npm run lint; npm test; npm run test:github

Expected: all commands exit 0 with no skipped failing suite.

- [ ] **Step 3: Verify production resources locally**

Serve docs from a local static server and verify:

- Homepage, birth page and every report route open.
- JFZSKSealScript_V3.5.ttf returns 200 and “艺” displays in Zhongshan seal script.
- Ten gendered WebP assets return 200.
- Male/female/unspecified and mirror orientation work.
- Twelve constellation maps render.
- Reduced-motion mode is static.
- No upload or camera permission appears.

- [ ] **Step 4: Commit generated docs intentionally**

~~~bash
git add docs site
git commit -m "build: publish yi content engine upgrade"
~~~

Do not add outputs or work.

- [ ] **Step 5: Push the approved branch**

Run: git push origin master

Expected: origin/master equals git rev-parse HEAD.

- [ ] **Step 6: Monitor the automatic GitHub Pages deployment**

The repository is already configured to publish from the pushed branch. Poll the public HTML until its current JavaScript and CSS asset names differ from the pre-push build and match the hashes under local docs. Do not declare completion while the public site still serves an older asset hash.

- [ ] **Step 7: Verify public desktop and mobile networks**

Open https://dengsan721-prog.github.io/yi-oriental-wisdom/ on desktop and on a phone using a network different from the development machine. Verify:

- Homepage and font.
- Multi-ring breathing.
- Birth intake.
- Report navigation.
- Professional content layers.
- Four compatibility roles.
- Four life mirrors.
- Male/female mirror atlases.
- Twelve black-gold star maps.

Use direct HTTP checks for the HTML, current JS/CSS, JFZSKSealScript_V3.5.ttf and all ten WebP resources; every resource must return 200.

- [ ] **Step 8: Record evidence**

The release checklist records:

- Local commit SHA.
- Remote master SHA.
- Pages deployed SHA.
- Public HTML and asset URLs.
- HTTP status.
- Desktop viewport.
- Phone model, browser and network.
- Remaining issues, which must be empty for completion.

- [ ] **Step 9: Commit any release-only fixes and repeat the full gate**

If a public issue is found, fix it at source, repeat lint, all tests, build, push and public verification. Do not patch docs by hand.
