# Yi Traditional Reference Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用标准参考照片与图谱交付相面、面痣、手纹和星座四类传统技法，让用户自行对照，不采集或识别用户照片。

**Architecture:** 将传统内容建模为可测试的参考图谱选项，图片只作为标准示例，热点与文字由 HTML/CSS 叠加。用户主动点选图谱编号后得到七层解释并与八字主盘对照；页面不包含相机、上传、相册读取、人脸识别或掌纹识别能力。

**Tech Stack:** React 19、TypeScript 5.9、Vitest 4、WebP/PNG 标准参考图、CSS 图谱热点、现有 GitHub Pages Vite 构建

## Global Constraints

- 传统技法只包含相面、面痣、手纹和星座；称骨完全删除。
- 相面、面痣、手纹只展示标准照片与原创标注图，由用户自行对照。
- 页面不得出现文件上传、相机调用、相册读取、`getUserMedia`、`FileReader`、人脸识别或掌纹识别。
- 不提供颜值评分、种族民族推断、健康诊断、犯罪倾向、寿命判断或人格定罪。
- 每个图谱选项必须包含传统结果、传统依据、白话翻译、生活场景、优势与误区、行动建议和与主命盘对照。
- 参考照片必须有明确生成记录、版权或使用授权；可识别真人素材必须有合适肖像授权。
- 《麻衣神相》用于相学规则库；《周易》《梅花易数》只能提供象数语言，不能混入四柱计算。
- 核心参考书目同时保留《渊海子平》《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《神峰通考》《命理约言》等。

---

## File Structure

- `site/lib/yi/traditional-atlas.ts`：四种技法、图谱分组、选项和七层解释。
- `site/lib/yi/traditional-sources.ts`：十部核心典籍及数字来源、版本、用途和边界。
- `site/components/yi/ReferenceAtlasSection.tsx`：方法切换、图谱展示、热点选择和七层解读。
- `site/components/yi/TraditionSection.tsx`：传统栏目入口与主盘对照。
- `site/public/reference/face-reference.webp`：面型与五官标准照片组合。
- `site/public/reference/mole-reference.webp`：正侧面中性参考照片底图。
- `site/public/reference/palm-reference.webp`：左右手掌标准照片底图。
- `site/public/reference/README.md`：素材生成、授权、修改和使用范围记录。
- `site/app/globals.css`：照片图谱、热点、图例和移动端布局。
- `site/tests/yi/traditional-atlas.test.ts`：内容完整度、来源和禁用能力测试。
- `site/tests/github-build.test.mjs`：构建产物禁用上传/识别检查。

### Task 1: Build the Traditional Source Catalog

**Files:**
- Create: `site/lib/yi/traditional-sources.ts`
- Create: `site/tests/yi/traditional-atlas.test.ts`

**Interfaces:**
- Produces: `TRADITIONAL_SOURCE_CATALOG` and `getTraditionalSource(id)`.
- Every source has `id`, `title`, `category`, `grade`, `usage`, `editionNote`, `url`, and `boundary`.

- [ ] **Step 1: Write a failing catalog test**

```ts
// site/tests/yi/traditional-atlas.test.ts
import { describe, expect, it } from "vitest";
import { TRADITIONAL_SOURCE_CATALOG } from "../../lib/yi/traditional-sources";

describe("traditional source catalog", () => {
  it("contains every confirmed core classic with an explicit role", () => {
    const titles = Object.values(TRADITIONAL_SOURCE_CATALOG).map((source) => source.title);
    expect(titles).toEqual(expect.arrayContaining(["渊海子平","滴天髓","子平真诠","穷通宝鉴","三命通会","麻衣神相","周易","梅花易数","神峰通考","命理约言"]));
    for (const source of Object.values(TRADITIONAL_SOURCE_CATALOG)) {
      expect(source.usage.length).toBeGreaterThan(8);
      expect(source.editionNote.length).toBeGreaterThan(5);
      expect(source.boundary.length).toBeGreaterThan(8);
    }
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `cd site; npx vitest run tests/yi/traditional-atlas.test.ts`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement all ten sources**

```ts
// site/lib/yi/traditional-sources.ts
export type TraditionalSource = { id:string; title:string; category:"子平"|"相学"|"象数"; grade:"A/B"|"B"; usage:string; editionNote:string; url:string; boundary:string };

export const TRADITIONAL_SOURCE_CATALOG: Record<string, TraditionalSource> = {
  "classic.yuan-hai-zi-ping": { id:"classic.yuan-hai-zi-ping", title:"渊海子平", category:"子平", grade:"A/B", usage:"用于干支、十神、格局与子平术语脉络核对", editionNote:"采用可核影印本或完整整理本，异文单独记录", url:"", boundary:"原典规则与现代产品解释分栏，不照搬古代社会评价" },
  "classic.di-tian-sui": { id:"classic.di-tian-sui", title:"滴天髓", category:"子平", grade:"A/B", usage:"用于干支轻重、根气、流通与全局关系语言", editionNote:"区分原文、刘注、任氏阐微等不同层次", url:"https://www.shidianguji.com/book/NMG41601JH000040/chapter/1lly6pm5s2joo", boundary:"不将后世注解冒充原文，不以单句作绝对断语" },
  "classic.zi-ping-zhen-quan": { id:"classic.zi-ping-zhen-quan", title:"子平真诠", category:"子平", grade:"A/B", usage:"用于月令、格局、相神和成败救应的规则梳理", editionNote:"区分沈氏原文与徐乐吾等后世评注", url:"", boundary:"格局判断必须满足规则条件，不能只凭一个十神命名" },
  "classic.qiong-tong-bao-jian": { id:"classic.qiong-tong-bao-jian", title:"穷通宝鉴", category:"子平", grade:"A/B", usage:"用于季节调候与寒暖燥湿的传统观察口径", editionNote:"记录采用版本、月令章节与具体原句位置", url:"", boundary:"调候语言不转换成健康诊断或必然人生事件" },
  "classic.san-ming-tong-hui": { id:"classic.san-ming-tong-hui", title:"三命通会", category:"子平", grade:"A/B", usage:"用于五行、干支、神煞源流及多种命理口径互证", editionNote:"以识典古籍完整目录和可核影印本互校", url:"https://www.shidianguji.com/zh/book/HY1521/chapter/1knwelu5suaf3", boundary:"主盘优先使用结构规则，神煞不单独决定结论" },
  "classic.ma-yi-shen-xiang": { id:"classic.ma-yi-shen-xiang", title:"麻衣神相", category:"相学", grade:"A/B", usage:"用于面部区域、五官形态、痣位和手相传统术语索引", editionNote:"托名、版本与增补内容需逐条记录，不预设作者归属", url:"", boundary:"仅供图谱自查和文化阅读，不作身份、健康或寿命判断" },
  "classic.zhou-yi": { id:"classic.zhou-yi", title:"周易", category:"象数", grade:"A/B", usage:"用于变化、时位、关系与象数语言的文化来源", editionNote:"经文、十翼及后世易学解释分别标注", url:"https://ctext.org/book-of-changes/zh", boundary:"不把卦象内容混入四柱计算，不用宽泛哲理冒充命盘依据" },
  "classic.mei-hua-yi-shu": { id:"classic.mei-hua-yi-shu", title:"梅花易数", category:"象数", grade:"A/B", usage:"用于象数观察方法与场景化联想结构参考", editionNote:"版本与邵雍作者归属争议需要在来源页说明", url:"", boundary:"本产品不根据用户八字自动起卦，也不混算卦象与四柱" },
  "classic.shen-feng-tong-kao": { id:"classic.shen-feng-tong-kao", title:"神峰通考", category:"子平", grade:"A/B", usage:"用于病药、动静和命例推理过程的对照研究", editionNote:"命例只提炼规则链，不复制未经核验的身份与生辰", url:"", boundary:"古代命例不作为现代用户人生事件的确定性预测" },
  "classic.ming-li-yue-yan": { id:"classic.ming-li-yue-yan", title:"命理约言", category:"子平", grade:"A/B", usage:"用于清代命理术语整理与简要判断口径互证", editionNote:"采用可核版本并记录卷次、条目和整理者", url:"", boundary:"只在与主规则一致或明确标注分歧时使用" },
};

export function getTraditionalSource(id: string) { return TRADITIONAL_SOURCE_CATALOG[id]; }
```

- [ ] **Step 4: Research and fill only verified URLs**

Search each title in recognized digital classic collections. Keep `url` empty when no reliable full-text or scan is found; do not substitute a marketing article. Add the access date and scan identifier to `editionNote` for every non-empty URL.

- [ ] **Step 5: Run the source test and commit**

Run: `cd site; npx vitest run tests/yi/traditional-atlas.test.ts`

Expected: PASS.

```bash
git add site/lib/yi/traditional-sources.ts site/tests/yi/traditional-atlas.test.ts
git commit -m "feat: register yi traditional source catalog"
```

### Task 2: Model Four Complete Reference Atlases

**Files:**
- Create: `site/lib/yi/traditional-atlas.ts`
- Modify: `site/tests/yi/traditional-atlas.test.ts`

**Interfaces:**
- Produces: `getAtlasMethods()`, `getAtlasGroups(method)`, `getAtlasOption(id)`, and `buildAtlasReading(option, chart)`.
- Atlas totals: face ≥ 10 options, mole ≥ 12 zones, palm ≥ 10 options, star exactly 12 signs.

- [ ] **Step 1: Write failing atlas completeness tests**

```ts
import { getAtlasMethods, getAtlasGroups } from "../../lib/yi/traditional-atlas";

it("ships four complete self-comparison atlases", () => {
  expect(getAtlasMethods().map((item) => item.id)).toEqual(["face","mole","palm","star"]);
  expect(getAtlasGroups("face").flatMap((g) => g.options).length).toBeGreaterThanOrEqual(10);
  expect(getAtlasGroups("mole").flatMap((g) => g.options).length).toBeGreaterThanOrEqual(12);
  expect(getAtlasGroups("palm").flatMap((g) => g.options).length).toBeGreaterThanOrEqual(10);
  expect(getAtlasGroups("star").flatMap((g) => g.options).length).toBe(12);
});

it("gives every option seven non-empty layers and a source", () => {
  for (const method of getAtlasMethods()) for (const group of getAtlasGroups(method.id)) for (const option of group.options) {
    expect([option.professionalResult,option.traditionalBasis,option.plainLanguage,option.lifeScene,option.strengthAndPitfall,option.action,option.chartComparison].every((value) => value.length >= 12)).toBe(true);
    expect(option.sourceIds.length).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run and verify failure**

Run: `cd site; npx vitest run tests/yi/traditional-atlas.test.ts`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement stable atlas IDs and content**

Use these exact groups and IDs:

```ts
const atlasIndex = {
  face: {
    "面型": ["face-oval","face-round","face-square","face-long","face-heart"],
    "五官": ["face-brow-straight","face-brow-arched","face-eye-open","face-nose-defined","face-mouth-balanced"],
  },
  mole: {
    "正面痣位": ["mole-forehead-center","mole-temple-left","mole-temple-right","mole-brow","mole-eye-lower","mole-nose","mole-cheek-left","mole-cheek-right","mole-philtrum","mole-mouth-corner","mole-chin","mole-jaw"],
  },
  palm: {
    "手型": ["palm-wood","palm-fire","palm-earth","palm-metal","palm-water"],
    "主线": ["palm-life","palm-head","palm-heart","palm-fate","palm-sun"],
  },
  star: {
    "太阳星座": ["star-aries","star-taurus","star-gemini","star-cancer","star-leo","star-virgo","star-libra","star-scorpio","star-sagittarius","star-capricorn","star-aquarius","star-pisces"],
  },
} as const;
```

Every option implements:

```ts
export type AtlasOption = {
  id:string; title:string; image:string; crop:string; hotspot?:{x:number;y:number};
  professionalResult:string; traditionalBasis:string; plainLanguage:string;
  lifeScene:string; strengthAndPitfall:string; action:string; chartComparison:string;
  caution:string; sourceIds:string[];
};
```

Face options cite `classic.ma-yi-shen-xiang`; mole options cite it but state that position systems vary by edition; palm options cite it and state the chosen left/right convention; stars cite the cultural/astronomical boundary source from `sources.ts`. Each `chartComparison` must say either “与八字主盘相互印证”“提供不同观察角度” or “若与主盘冲突，以四柱主盘和现实经历为先”.

- [ ] **Step 4: Run completeness tests and commit**

Run: `cd site; npx vitest run tests/yi/traditional-atlas.test.ts`

Expected: PASS with 44 options and no empty layers.

```bash
git add site/lib/yi/traditional-atlas.ts site/tests/yi/traditional-atlas.test.ts
git commit -m "feat: model face mole palm and star atlases"
```

### Task 3: Create Licensed Standard Reference Images

**Files:**
- Create: `site/public/reference/face-reference.webp`
- Create: `site/public/reference/mole-reference.webp`
- Create: `site/public/reference/palm-reference.webp`
- Create: `site/public/reference/README.md`

**Interfaces:**
- Produces three 1600×1200 or larger WebP sheets referenced by every non-star `AtlasOption.image`.

- [ ] **Step 1: Generate the face reference sheet**

Use the image generation skill with this prompt:

```text
Create a premium educational reference contact sheet, 4:3 landscape, showing five different adult Chinese facial shapes: oval, round, square, long, and heart-shaped. Neutral expressions, straight-on studio portraits, identical soft lighting, plain deep blue-gray background, consistent head size and crop, realistic skin texture, no beauty retouching, no makeup emphasis, no jewelry, no text, no symbols, no borders. The image is for a respectful traditional face-reading self-comparison atlas, not identity recognition.
```

Inspect the result at original resolution. Reject it if faces are duplicated, asymmetrical in an implausible way, mislabeled by composition, or not consistently framed. Save the accepted asset as `face-reference.webp`.

- [ ] **Step 2: Generate the neutral face base for mole hotspots**

```text
Create a premium educational reference sheet, 4:3 landscape, with one neutral adult Chinese face shown front view, left three-quarter view, and right three-quarter view. Same person, neutral expression, hair pulled away from forehead and cheeks, even soft studio lighting, plain deep blue-gray background, realistic but non-glamorized, no visible moles, no makeup emphasis, no text, no labels, no arrows. Leave generous clean space around the face for HTML hotspot overlays.
```

Inspect for view consistency and save as `mole-reference.webp`.

- [ ] **Step 3: Generate and verify the palm sheet**

```text
Create a high-resolution premium educational studio photograph showing the left and right open palms of one adult Chinese person side by side, fingers naturally extended and separated, palms facing camera, wrists included, even soft lighting, accurate five-finger anatomy, natural palm creases, plain deep blue-gray background, no jewelry, no text, no arrows, no labels. The image will receive separate vector line overlays in a cultural palm-reading reference atlas.
```

Inspect hands at original resolution. Reject any extra or fused fingers, impossible joints, duplicated creases, mismatched left/right anatomy or cropped fingertips. Save only an anatomically plausible result as `palm-reference.webp`; if repeated generation cannot produce reliable anatomy, use a licensed studio hand photograph and record the license instead.

- [ ] **Step 4: Record provenance and usage**

```md
# Traditional reference asset provenance

- `face-reference.webp`: generated specifically for this product; prompt, generation date, tool and manual QA result recorded here.
- `mole-reference.webp`: generated specifically for this product; prompt, generation date, tool and manual QA result recorded here.
- `palm-reference.webp`: record generated or licensed source, generation/license date, anatomy QA and permitted use.
- Product use: standard visual reference only. No user image upload, biometric matching, identity recognition or health inference.
```

- [ ] **Step 5: Commit the verified assets**

```bash
git add site/public/reference
git commit -m "feat: add traditional reference photography"
```

### Task 4: Build the Self-Comparison Atlas UI

**Files:**
- Create: `site/components/yi/ReferenceAtlasSection.tsx`
- Modify: `site/components/yi/TraditionSection.tsx`
- Modify: `site/app/globals.css`
- Modify: `site/tests/github-build.test.mjs`

**Interfaces:**
- `ReferenceAtlasSection` consumes `{ chart: FourPillarsResult; birth: BirthInput }`.
- User interaction selects method → group → option; it never requests image permission.

- [ ] **Step 1: Add failing build safety assertions**

```js
assert.match(js, /相面/);
assert.match(js, /面痣/);
assert.match(js, /手纹/);
assert.match(js, /星座/);
assert.doesNotMatch(js, /称骨/);
assert.doesNotMatch(js, /getUserMedia|FileReader|type=["']file["']|capture=["']/);
```

- [ ] **Step 2: Run and verify failure**

Run: `cd site; npm run test:github`

Expected: FAIL because old tradition content still includes称骨 and lacks the new atlases.

- [ ] **Step 3: Implement the atlas component**

```tsx
"use client";
import { useMemo, useState } from "react";
import { buildAtlasReading, getAtlasGroups, getAtlasMethods } from "../../lib/yi/traditional-atlas";
import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";

export function ReferenceAtlasSection({ chart }: { chart: FourPillarsResult; birth: BirthInput }) {
  const [method, setMethod] = useState(getAtlasMethods()[0].id);
  const groups = getAtlasGroups(method);
  const [selectedId, setSelectedId] = useState(groups[0].options[0].id);
  const option = groups.flatMap((group) => group.options).find((item) => item.id === selectedId) ?? groups[0].options[0];
  const reading = useMemo(() => buildAtlasReading(option, chart), [option, chart]);
  return <section className="reference-atlas">
    <div className="atlas-methods">{getAtlasMethods().map((item) => <button type="button" className={method === item.id ? "active" : ""} onClick={() => { const next = getAtlasGroups(item.id); setMethod(item.id); setSelectedId(next[0].options[0].id); }} key={item.id}>{item.label}</button>)}</div>
    <p className="atlas-boundary">标准照片与图谱仅供自行对照；本页不会读取、上传或识别你的照片。</p>
    <div className="atlas-layout">
      <div className="atlas-reference"><img src={option.image} style={{ objectPosition: option.crop }} alt={`${option.title}标准参考照片`} />{option.hotspot && <i style={{ left:`${option.hotspot.x}%`, top:`${option.hotspot.y}%` }} />}</div>
      <div className="atlas-options">{groups.map((group) => <section key={group.title}><h3>{group.title}</h3>{group.options.map((item) => <button type="button" onClick={() => setSelectedId(item.id)} className={selectedId === item.id ? "active" : ""} key={item.id}>{item.title}</button>)}</section>)}</div>
    </div>
    <article className="atlas-reading"><h2>{reading.professionalResult}</h2>{reading.layers.map((layer) => <p key={layer.label}><b>{layer.label}</b>{layer.text}</p>)}</article>
  </section>;
}
```

Replace `TraditionSection` body with the four-method atlas and a compact theory-source footer. Do not leave the old `buildTraditionalReadings` output visible.

- [ ] **Step 4: Add responsive atlas styles**

```css
.atlas-methods{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.atlas-methods button,.atlas-options button{min-height:44px;border:1px solid #ffffff18;border-radius:10px;background:#ffffff06;color:var(--text)}.atlas-methods button.active,.atlas-options button.active{border-color:var(--gold);color:var(--gold)}
.atlas-boundary{color:var(--muted);font-size:12px}.atlas-layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:14px}.atlas-reference{position:relative;min-height:420px;border-radius:18px;overflow:hidden;background:#0d202b}.atlas-reference img{width:100%;height:100%;object-fit:cover}.atlas-reference i{position:absolute;width:18px;height:18px;border:2px solid var(--gold);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 8px #d8c08c22}
.atlas-options section{margin-bottom:12px}.atlas-options h3{font:400 18px serif}.atlas-options button{margin:0 6px 6px 0;padding:0 12px}.atlas-reading{margin-top:14px;padding:20px;border:1px solid #ffffff12;border-radius:16px;background:#0d202b}.atlas-reading p{color:#a7b7bd;line-height:1.7}.atlas-reading b{display:block;color:var(--gold);font-size:11px}
@media(max-width:760px){.atlas-methods{grid-template-columns:repeat(2,1fr)}.atlas-layout{grid-template-columns:1fr}.atlas-reference{min-height:320px}}
```

- [ ] **Step 5: Run tests and build**

Run: `cd site; npx vitest run tests/yi/traditional-atlas.test.ts; npm run test:github`

Expected: PASS; bundle includes all four methods, excludes称骨 and contains no upload/camera APIs.

- [ ] **Step 6: Commit the atlas UI**

```bash
git add site/components/yi/ReferenceAtlasSection.tsx site/components/yi/TraditionSection.tsx site/app/globals.css site/tests/github-build.test.mjs docs
git commit -m "feat: add self-comparison traditional atlas"
```

### Task 5: Visual QA and Public Publication

**Files:**
- Modify only issues discovered during verification.

- [ ] **Step 1: Run the complete gate**

Run: `cd site; npm test; npm run lint; npm run test:github`

Expected: all commands exit 0.

- [ ] **Step 2: Inspect every reference asset**

View all three assets at original resolution. Confirm face examples are consistently framed, mole base views show the same person, hands have correct anatomy, no baked-in labels are garbled, and HTML hotspots land on intended areas.

- [ ] **Step 3: Verify mobile self-comparison**

At 390×844, open each method, select every group, expand a result and return to the method selector. Verify no horizontal page overflow, buttons are at least 44px, the image remains large enough to compare, and no permission prompt appears.

- [ ] **Step 4: Verify desktop information density**

At 1440×900, confirm the reference image and option list are visible together, the seven-layer reading uses the remaining width, and no single sentence occupies an oversized card.

- [ ] **Step 5: Push and verify public GitHub Pages**

Run: `git push origin master; gh api -X POST repos/dengsan721-prog/yi-oriental-wisdom/pages/builds`

Expected: public build SHA equals `git rev-parse HEAD`; the page and all three `/reference/*.webp` assets return 200; mobile network can open all four methods.

