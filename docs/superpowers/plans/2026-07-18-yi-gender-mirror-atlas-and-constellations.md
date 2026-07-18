# Yi Gendered Mirror Atlas and Constellation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 为面相和面痣提供按性别对应的标准图谱与镜面防错交互，并为十二星座提供独立黑金矢量星图和成熟内容。

**Architecture:** 传统内容选项与视觉素材分离：同一脸型或痣位规则可根据 ReferenceGender 解析到男性或女性图片，未指定性别由页面内临时切换。所有面相和面痣坐标使用用户自身左右侧；星座使用代码原生 SVG 节点与边数据，不依赖位图生成。

**Tech Stack:** TypeScript 5.9、React 19、Vitest 4、SVG、WebP、CSS、AI 图像生成仅用于原创标准人物参考图

## Global Constraints

- 男性出生资料默认显示男性图，女性默认显示女性图，未指定性别允许切换但不修改出生资料。
- 面相和面痣全部采用镜面人逻辑：画面右侧是用户右脸，画面左侧是用户左脸。
- 不存在上传、拍照、相册读取、人脸识别、痣位识别或掌纹识别。
- 图谱只供用户自行对照，不从外貌推断道德、身份、疾病、寿命或犯罪倾向。
- 十二星座各自拥有不同星点和连线数据，使用墨黑背景与温润金线。
- 星座内容覆盖十三个成熟维度，并明确太阳星座、完整星盘和天文学边界。
- 所有动效兼容 prefers-reduced-motion。

---

## File Structure

- site/lib/yi/traditional-atlas.ts：传统图谱内容与性别视觉解析。
- site/lib/yi/atlas-orientation.ts：用户自身左右、镜面文案和痣位侧别。
- site/lib/yi/traditional-content.ts：面相、面痣和手纹三十二个小项的成熟七层内容。
- site/lib/yi/constellations.ts：十二星座 SVG 节点、边和标签坐标。
- site/lib/yi/zodiac-profiles.ts：十二太阳星座十三维成熟内容。
- site/components/yi/ConstellationMap.tsx：黑金矢量星图。
- site/components/yi/ReferenceAtlasSection.tsx：性别选择、镜面提示、三视图和图谱阅读。
- site/public/reference：男女脸型、五官和面痣原创参考图。
- site/public/reference/README.md：素材生成、镜面方向、人工检查和许可记录。
- site/app/globals.css：镜面图谱、星图和移动端样式。
- site/tests/yi/atlas-orientation.test.ts：性别与镜面方向。
- site/tests/yi/traditional-atlas.test.ts：内容、图片和安全边界。
- site/tests/yi/constellations.test.ts：十二组独立 SVG 数据。
- site/tests/yi/zodiac-profiles.test.ts：十三维内容完整度。
- site/tests/github-build.test.mjs：构建产物安全与资源检查。

### Task 1: Add Gendered Visual Resolution

**Files:**
- Modify: site/lib/yi/traditional-atlas.ts
- Create: site/tests/yi/atlas-orientation.test.ts
- Modify: site/tests/yi/traditional-atlas.test.ts

**Interfaces:**
- Produces ReferenceGender = "male" | "female".
- Produces resolveReferenceGender(birthGender, override): ReferenceGender.
- AtlasOption gains visuals for face and mole; existing IDs remain stable.
- Produces resolveAtlasVisual(option, gender): AtlasVisual.

- [ ] **Step 1: Write failing gender resolution tests**

~~~ts
import { describe, expect, it } from "vitest";
import { getAtlasOption, resolveAtlasVisual, resolveReferenceGender } from "../../lib/yi/traditional-atlas";

describe("gendered traditional references", () => {
  it.each([
    ["male", undefined, "male"],
    ["female", undefined, "female"],
    ["unspecified", undefined, "female"],
    ["unspecified", "male", "male"],
  ] as const)("resolves %s with override %s to %s", (birthGender, override, expected) => {
    expect(resolveReferenceGender(birthGender, override)).toBe(expected);
  });

  it("uses different male and female face assets without changing the content ID", () => {
    const option = getAtlasOption("face-oval")!;
    expect(resolveAtlasVisual(option, "male").image).toBe("reference/face-shapes-male.webp");
    expect(resolveAtlasVisual(option, "female").image).toBe("reference/face-shapes-female.webp");
    expect(resolveAtlasVisual(option, "male").image).not.toBe(resolveAtlasVisual(option, "female").image);
  });

  it("uses different male and female mole atlases", () => {
    const option = getAtlasOption("mole-temple-left")!;
    expect(resolveAtlasVisual(option, "male").image).toContain("mole-male");
    expect(resolveAtlasVisual(option, "female").image).toContain("mole-female");
  });
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/atlas-orientation.test.ts tests/yi/traditional-atlas.test.ts

Expected: FAIL because gendered visual APIs do not exist.

- [ ] **Step 3: Add exact visual types and resolution**

~~~ts
import type { BirthInput } from "./types";

export type ReferenceGender = "male" | "female";
export type AtlasVisual = {
  image: string;
  imageAspect: number;
  visualFocus?: { x:number; y:number; width:number; height:number };
  hotspot?: { x:number; y:number };
  view?: "front" | "user-left" | "user-right";
  mirrored: boolean;
};

~~~

Within the existing AtlasOption declaration, remove image, imageAspect, visualFocus and hotspot, then insert these exact fields:

~~~ts
visual?: AtlasVisual;
visuals?: Partial<Record<ReferenceGender, AtlasVisual>>;
userSide?: "left" | "center" | "right";
landmark?: string;
~~~

Add these functions after the option indexes:

~~~ts
export function resolveReferenceGender(
  birthGender: BirthInput["gender"],
  override?: ReferenceGender,
): ReferenceGender {
  if (birthGender === "male" || birthGender === "female") return birthGender;
  return override ?? "female";
}

export function resolveAtlasVisual(option: AtlasOption, gender: ReferenceGender): AtlasVisual {
  const visual = option.visuals?.[gender] ?? option.visual;
  if (!visual) throw new Error("图谱缺少可用视觉：" + option.id + ":" + gender);
  return visual;
}
~~~

Face and mole options receive both male and female visuals. Palm retains one gender-neutral visual. Star does not use AtlasVisual and is rendered by ConstellationMap.

- [ ] **Step 4: Preserve stable option IDs**

Do not rename face-oval, face-square, mole-temple-left or other existing content IDs. Assign the two gender assets under the same option so saved selections and current tests remain compatible.

- [ ] **Step 5: Run tests and commit**

Run: cd site; npx vitest run tests/yi/atlas-orientation.test.ts tests/yi/traditional-atlas.test.ts

Expected: PASS.

~~~bash
git add site/lib/yi/traditional-atlas.ts site/tests/yi/atlas-orientation.test.ts site/tests/yi/traditional-atlas.test.ts
git commit -m "feat: resolve gendered traditional references"
~~~

### Task 2: Implement User-Centric Mirror Orientation

**Files:**
- Create: site/lib/yi/atlas-orientation.ts
- Modify: site/lib/yi/traditional-atlas.ts
- Modify: site/tests/yi/atlas-orientation.test.ts

**Interfaces:**
- Produces UserFaceSide = "left" | "center" | "right".
- Produces MIRROR_GUIDANCE and getUserSideLabel(side).
- Mole options gain userSide and landmark.
- All coordinates are stored in the final mirrored display plane.

- [ ] **Step 1: Add failing mirror-side tests**

~~~ts
import { MIRROR_GUIDANCE, getUserSideLabel } from "../../lib/yi/atlas-orientation";

it("states the mirror rule without observer-view ambiguity", () => {
  expect(MIRROR_GUIDANCE).toContain("画面右侧是你的右脸");
  expect(MIRROR_GUIDANCE).toContain("画面左侧是你的左脸");
  expect(MIRROR_GUIDANCE).not.toMatch(/观察者左侧|摄影者右侧/);
});

it.each([
  ["left", "你的左脸"],
  ["center", "正面中线"],
  ["right", "你的右脸"],
] as const)("labels %s as %s", (side, label) => {
  expect(getUserSideLabel(side)).toBe(label);
});

it("stores the user side on lateral mole options", () => {
  expect(getAtlasOption("mole-temple-left")?.userSide).toBe("left");
  expect(getAtlasOption("mole-temple-right")?.userSide).toBe("right");
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/atlas-orientation.test.ts

Expected: FAIL because atlas-orientation.ts and userSide do not exist.

- [ ] **Step 3: Implement mirror copy and labels**

~~~ts
export type UserFaceSide = "left" | "center" | "right";

export const MIRROR_GUIDANCE =
  "这是一张镜面人脸图。请像平时照镜子一样对照：画面右侧是你的右脸，画面左侧是你的左脸，无需在脑中反转方向。";

export function getUserSideLabel(side: UserFaceSide): string {
  return side === "left" ? "你的左脸" : side === "right" ? "你的右脸" : "正面中线";
}

export function buildMoleDetailTitle(option: { title:string; userSide?:UserFaceSide; id:string }): string {
  const side = getUserSideLabel(option.userSide ?? "center");
  return side + " · " + option.title + " · " + option.id.replace("mole-", "");
}
~~~

- [ ] **Step 4: Assign user-centric side metadata**

Assign left to all IDs ending in -left, right to all IDs ending in -right and center to forehead-center, brow, nose, philtrum, mouth-corner and chin when the landmark is central. The displayed image and hotspot coordinate must already be mirrored; do not apply a second CSS horizontal flip.

- [ ] **Step 5: Run tests and commit**

Run: cd site; npx vitest run tests/yi/atlas-orientation.test.ts

Expected: PASS.

~~~bash
git add site/lib/yi/atlas-orientation.ts site/lib/yi/traditional-atlas.ts site/tests/yi/atlas-orientation.test.ts
git commit -m "feat: define mirror-person orientation"
~~~

### Task 3: Create and Verify Gendered Reference Assets

**Files:**
- Create: site/public/reference/face-shapes-male.webp
- Create: site/public/reference/face-shapes-female.webp
- Create: site/public/reference/face-features-male.webp
- Create: site/public/reference/face-features-female.webp
- Create: site/public/reference/mole-male-front.webp
- Create: site/public/reference/mole-male-left.webp
- Create: site/public/reference/mole-male-right.webp
- Create: site/public/reference/mole-female-front.webp
- Create: site/public/reference/mole-female-left.webp
- Create: site/public/reference/mole-female-right.webp
- Modify: site/public/reference/README.md

**Interfaces:**
- Produces ten original WebP assets, each at least 1400 pixels on its long edge.
- Every asset is recorded with prompt, generation date, tool, mirror status and manual QA result.

- [ ] **Step 1: Generate male and female face-shape sheets**

Use the image generation skill twice, changing only gender:

~~~text
Create a premium educational reference contact sheet, 5:2 landscape, showing five different adult Chinese male facial shapes: oval, round, square, long, and heart-shaped. Neutral expressions, straight-on studio portraits, identical soft lighting, plain charcoal-black background, consistent head size and crop, realistic skin texture, no beauty retouching, no makeup emphasis, no jewelry, no text, no symbols, no borders. Respectful cultural self-comparison atlas, not identity recognition or health inference.
~~~

~~~text
Create a premium educational reference contact sheet, 5:2 landscape, showing five different adult Chinese female facial shapes: oval, round, square, long, and heart-shaped. Neutral expressions, straight-on studio portraits, identical soft lighting, plain charcoal-black background, consistent head size and crop, realistic skin texture, no beauty retouching, no makeup emphasis, no jewelry, no text, no symbols, no borders. Respectful cultural self-comparison atlas, not identity recognition or health inference.
~~~

Inspect at original resolution. Reject duplicated faces, inconsistent crop, glamorized styling, implausible anatomy or unclear shape differences.

- [ ] **Step 2: Generate male and female feature sheets**

Generate two five-panel sheets with straight brow, arched brow, open eye, defined nose and balanced mouth. Keep the same lighting, scale and non-glamorized standard. The content file provides labels; images contain no text.

- [ ] **Step 3: Generate male and female mole base portraits**

For each gender generate the same adult person in three separate assets: front, user's left-face view and user's right-face view. Hair is away from forehead, temples, cheeks and jaw; skin has no conspicuous mole; expression is neutral; background is charcoal-black; the asset contains no labels.

Mirror the final front-view asset during image preparation so screen right equals the subject's own right. For side assets, manually verify the stored filename refers to the user's own side, not the photographer's view.

- [ ] **Step 4: Convert and record provenance**

Use an image conversion command that preserves dimensions and sets WebP quality between 82 and 88. Record:

~~~md
- Asset:
- Gender:
- View:
- Mirrored display plane: yes
- Generation tool and date:
- Prompt:
- Anatomy and orientation QA:
- Product use: standard self-comparison only; no user image collection or biometric analysis.
~~~

- [ ] **Step 5: Add an automated asset manifest test**

~~~ts
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

it.each([
  "face-shapes-male.webp","face-shapes-female.webp",
  "face-features-male.webp","face-features-female.webp",
  "mole-male-front.webp","mole-male-left.webp","mole-male-right.webp",
  "mole-female-front.webp","mole-female-left.webp","mole-female-right.webp",
])("ships %s", file => {
  const path = resolve("public/reference", file);
  expect(existsSync(path)).toBe(true);
  expect(statSync(path).size).toBeGreaterThan(20_000);
});
~~~

- [ ] **Step 6: Commit verified assets**

~~~bash
git add site/public/reference site/tests/yi/traditional-atlas.test.ts
git commit -m "feat: add gendered face and mole atlases"
~~~

### Task 4: Build Twelve Distinct Constellation Maps

**Files:**
- Create: site/lib/yi/constellations.ts
- Create: site/components/yi/ConstellationMap.tsx
- Create: site/tests/yi/constellations.test.ts

**Interfaces:**
- Produces ZodiacSign union for all twelve signs.
- Produces CONSTELLATIONS: Record<ZodiacSign, ConstellationDefinition>.
- ConstellationMap consumes sign and decorative.

- [ ] **Step 1: Write failing constellation tests**

~~~ts
import { describe, expect, it } from "vitest";
import { CONSTELLATIONS, ZODIAC_SIGNS } from "../../lib/yi/constellations";

describe("black-gold constellations", () => {
  it("ships twelve complete and distinct maps", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    expect(Object.keys(CONSTELLATIONS)).toHaveLength(12);
    const signatures = ZODIAC_SIGNS.map(sign => JSON.stringify({
      nodes: CONSTELLATIONS[sign].nodes,
      edges: CONSTELLATIONS[sign].edges,
    }));
    expect(new Set(signatures).size).toBe(12);
  });

  it("keeps every node inside the view box and every edge valid", () => {
    for (const sign of ZODIAC_SIGNS) {
      const map = CONSTELLATIONS[sign];
      expect(map.nodes.length).toBeGreaterThanOrEqual(6);
      expect(map.edges.length).toBeGreaterThanOrEqual(5);
      for (const node of map.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(5);
        expect(node.x).toBeLessThanOrEqual(95);
        expect(node.y).toBeGreaterThanOrEqual(5);
        expect(node.y).toBeLessThanOrEqual(95);
      }
      for (const [from, to] of map.edges) {
        expect(map.nodes[from]).toBeTruthy();
        expect(map.nodes[to]).toBeTruthy();
      }
    }
  });
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/constellations.test.ts

Expected: FAIL because constellations.ts does not exist.

- [ ] **Step 3: Define the complete map contract**

~~~ts
export const ZODIAC_SIGNS = [
  "aries","taurus","gemini","cancer","leo","virgo",
  "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
] as const;
export type ZodiacSign = typeof ZODIAC_SIGNS[number];
export type StarNode = { x:number; y:number; radius:number; primary?:boolean };
export type ConstellationDefinition = {
  sign: ZodiacSign;
  glyph: string;
  chineseName: string;
  englishName: string;
  nodes: StarNode[];
  edges: [number, number][];
  label: { x:number; y:number };
};
~~~

Author all twelve maps on a 0–100 coordinate plane. Use six to fourteen nodes per sign, five to fifteen edges, two or three primary stars and a unique label anchor. The artistic line map should remain recognizably different for every sign; it does not need to claim exact astronomical projection.

- [ ] **Step 4: Implement the SVG component**

~~~tsx
import { CONSTELLATIONS, type ZodiacSign } from "../../lib/yi/constellations";

export function ConstellationMap({ sign, decorative = false }: { sign: ZodiacSign; decorative?: boolean }) {
  const map = CONSTELLATIONS[sign];
  return <svg className="constellation-map" viewBox="0 0 100 100"
    role={decorative ? undefined : "img"} aria-hidden={decorative || undefined}
    aria-label={decorative ? undefined : map.chineseName + "金色星座连线图"}>
    <g className="constellation-dust">{Array.from({ length:18 }, (_, index) =>
      <circle key={index} cx={(index * 37) % 97} cy={(index * 53) % 89} r=".25" />)}</g>
    <g className="constellation-lines">{map.edges.map(([from,to], index) =>
      <line key={index} x1={map.nodes[from].x} y1={map.nodes[from].y} x2={map.nodes[to].x} y2={map.nodes[to].y}
        style={{ animationDelay: String(index * 70) + "ms" }} />)}</g>
    <g className="constellation-stars">{map.nodes.map((node,index) =>
      <circle key={index} cx={node.x} cy={node.y} r={node.radius} className={node.primary ? "primary" : undefined} />)}</g>
    <text x={map.label.x} y={map.label.y}>{map.glyph}</text>
  </svg>;
}
~~~

- [ ] **Step 5: Add black-gold motion styles**

~~~css
.constellation-map{width:100%;height:auto;border-radius:20px;background:radial-gradient(circle at 50% 38%,#5d471c24,transparent 36%),#050708}
.constellation-lines line{stroke:#d9b75f;stroke-width:.48;stroke-linecap:round;opacity:.75;stroke-dasharray:120;animation:constellation-draw 1.4s ease both}
.constellation-stars circle{fill:#e4c56e;filter:drop-shadow(0 0 2px #e8c76688)}.constellation-stars circle.primary{fill:#fff0b1;filter:drop-shadow(0 0 5px #e7bd57)}
.constellation-dust circle{fill:#d8c58c;opacity:.28}.constellation-map text{fill:#d8b65f;font-size:10px;opacity:.42}
@keyframes constellation-draw{from{stroke-dashoffset:120;opacity:0}to{stroke-dashoffset:0;opacity:.75}}
@media(prefers-reduced-motion:reduce){.constellation-lines line{animation:none;stroke-dasharray:none}}
~~~

- [ ] **Step 6: Run tests and commit**

Run: cd site; npx vitest run tests/yi/constellations.test.ts

Expected: PASS.

~~~bash
git add site/lib/yi/constellations.ts site/components/yi/ConstellationMap.tsx site/tests/yi/constellations.test.ts site/app/globals.css
git commit -m "feat: draw twelve black gold constellations"
~~~

### Task 5: Deepen Face, Mole and Palm Content

**Files:**
- Create: site/lib/yi/traditional-content.ts
- Modify: site/lib/yi/traditional-atlas.ts
- Modify: site/tests/yi/traditional-atlas.test.ts

**Interfaces:**
- Produces TRADITIONAL_CONTENT keyed by all ten face, twelve mole and ten palm option IDs.
- Produces getTraditionalContent(id): TraditionalContentRecord.
- makeOption uses the record instead of generic sentence templates.

- [ ] **Step 1: Add failing depth, uniqueness and source tests**

~~~ts
it("gives every face, mole and palm option mature distinct content", () => {
  const options = ["face","mole","palm"]
    .flatMap(method => getAtlasGroups(method as "face" | "mole" | "palm"))
    .flatMap(group => group.options);
  expect(options).toHaveLength(32);
  for (const option of options) {
    expect(option.traditionalBasis.length).toBeGreaterThanOrEqual(80);
    expect(option.plainLanguage.length).toBeGreaterThanOrEqual(70);
    expect(option.lifeScene.length).toBeGreaterThanOrEqual(90);
    expect(option.strengthAndPitfall.length).toBeGreaterThanOrEqual(80);
    expect(option.action.length).toBeGreaterThanOrEqual(60);
    expect(option.chartComparison.length).toBeGreaterThanOrEqual(60);
    expect(option.caution.length).toBeGreaterThanOrEqual(40);
    expect(option.sourceIds.length).toBeGreaterThan(0);
  }
  expect(new Set(options.map(option => option.lifeScene)).size).toBe(32);
  expect(new Set(options.map(option => option.action)).size).toBe(32);
  expect(JSON.stringify(options)).not.toMatch(/功能入口|资源接口|社会接口|注定|寿命已定|疾病诊断/);
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/traditional-atlas.test.ts

Expected: FAIL because current generated paragraphs are shorter and reuse the same sentence skeleton.

- [ ] **Step 3: Define the complete traditional-content record**

~~~ts
export type TraditionalContentRecord = {
  id:string;
  professionalResult:string;
  traditionalBasis:string;
  recognitionGuide:string;
  plainLanguage:string;
  lifeScene:string;
  strengthAndPitfall:string;
  action:string;
  chartComparison:string;
  caution:string;
  sourceIds:string[];
};

export function getTraditionalContent(id: string): TraditionalContentRecord {
  const record = TRADITIONAL_CONTENT[id];
  if (!record) throw new Error("传统内容不存在：" + id);
  return record;
}
~~~

- [ ] **Step 4: Author ten complete face records**

Cover oval, round, square, long and heart-shaped faces plus straight brow, arched brow, open eye, defined nose and balanced mouth. Each record must explain:

- What visible shape the user should compare.
- The terminology and its traditional source.
- A modern behavioral question rather than a personality verdict.
- One work or social scene.
- One relationship or family scene.
- A useful version and an overused version.
- A two-week observation action.
- The effects of angle, age, expression and heredity.

Use male and female reference images for recognition, but do not claim the same shape creates a different moral or destiny result by gender. If a traditional source contains gendered language, identify it as historical context and translate it into a non-discriminatory observation.

- [ ] **Step 5: Author twelve complete mole records**

Each record must include:

- Exact user-centric side and landmark.
- How to distinguish the location from an adjacent zone.
- A mainstream traditional interpretation and a noted version difference.
- A present-day work, money, relationship or family scene.
- An advantage and a possible overinterpretation.
- A self-observation action.
- A boundary that position culture does not assess health, malignancy, morality or lifespan.

Left and right records must have distinct position explanations and scenes; they cannot be generated by replacing one side word.

- [ ] **Step 6: Author ten complete palm records**

Cover five hand shapes and five main lines. Every record explains:

- How to compare shape, length, clarity and proportion.
- The chosen left/right-hand convention.
- Why a single line cannot determine a whole person.
- A work, learning, relationship or recovery scene.
- How hand use, skin state and age can alter appearance.
- One combined-observation question and one action.

- [ ] **Step 7: Integrate records into makeOption**

~~~ts
if (method !== "star") {
  const content = getTraditionalContent(seed.id);
  return {
    id: seed.id,
    title: seed.title,
    ...visualFields,
    professionalResult: content.professionalResult,
    traditionalBasis: content.traditionalBasis,
    plainLanguage: content.plainLanguage,
    lifeScene: content.lifeScene,
    strengthAndPitfall: content.strengthAndPitfall,
    action: content.action,
    chartComparison: content.chartComparison,
    caution: content.caution,
    sourceIds: content.sourceIds,
  };
}
~~~

Keep the existing star return branch immediately after this block until Task 6 replaces it with ZodiacProfile content. Do not create a fallback generic paragraph for a missing face, mole or palm ID. getTraditionalContent must throw so content gaps fail tests.

- [ ] **Step 8: Run tests and commit**

Run: cd site; npx vitest run tests/yi/traditional-atlas.test.ts tests/yi/atlas-orientation.test.ts

Expected: PASS with thirty-two unique mature readings.

~~~bash
git add site/lib/yi/traditional-content.ts site/lib/yi/traditional-atlas.ts site/tests/yi/traditional-atlas.test.ts
git commit -m "feat: deepen traditional atlas content"
~~~

### Task 6: Build Thirteen-Dimension Zodiac Profiles

**Files:**
- Create: site/lib/yi/zodiac-profiles.ts
- Create: site/tests/yi/zodiac-profiles.test.ts
- Modify: site/lib/yi/traditional-atlas.ts

**Interfaces:**
- Produces ZodiacProfile with element, modality and eleven prose dimensions.
- Produces getZodiacProfile(sign): ZodiacProfile.
- Star atlas options read their content from ZodiacProfile rather than the short starSeeds fields.

- [ ] **Step 1: Write failing profile tests**

~~~ts
import { expect, it } from "vitest";
import { ZODIAC_PROFILES } from "../../lib/yi/zodiac-profiles";

it("gives every sun sign thirteen mature dimensions", () => {
  expect(Object.keys(ZODIAC_PROFILES)).toHaveLength(12);
  for (const profile of Object.values(ZODIAC_PROFILES)) {
    expect(["火","土","风","水"]).toContain(profile.element);
    expect(["开创","固定","变动"]).toContain(profile.modality);
    for (const field of [
      "coreDrive","outerStyle","innerNeed","loveStyle","friendshipStyle","workStyle",
      "stressResponse","commonMisreading","matureVersion","growthDirection","chartComparison",
    ] as const) {
      expect(profile[field].length).toBeGreaterThanOrEqual(50);
    }
    expect(profile.caution).toContain("太阳星座");
  }
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/zodiac-profiles.test.ts

Expected: FAIL because zodiac-profiles.ts does not exist.

- [ ] **Step 3: Define and author twelve complete profiles**

~~~ts
export type ZodiacProfile = {
  sign: ZodiacSign;
  element: "火" | "土" | "风" | "水";
  modality: "开创" | "固定" | "变动";
  coreDrive: string;
  outerStyle: string;
  innerNeed: string;
  loveStyle: string;
  friendshipStyle: string;
  workStyle: string;
  stressResponse: string;
  commonMisreading: string;
  matureVersion: string;
  growthDirection: string;
  chartComparison: string;
  caution: string;
  sourceReferences: string[];
};
~~~

Write original Chinese copy for all twelve profiles. Use the mature public structure of elements, modalities and common sign archetypes, but do not copy modern website sentences. Each field must include a concrete behavior, relationship or work image rather than a list of adjectives.

- [ ] **Step 4: Adapt star atlas readings**

For a selected star option, render:

- 元素与模式。
- 核心动力。
- 对外表现。
- 内在需要。
- 恋爱方式。
- 朋友关系。
- 工作状态。
- 压力反应。
- 常见误解。
- 成熟版本。
- 成长方向。
- 与八字主盘对照。
- 太阳星座边界。

- [ ] **Step 5: Run tests and commit**

Run: cd site; npx vitest run tests/yi/zodiac-profiles.test.ts tests/yi/traditional-atlas.test.ts

Expected: PASS.

~~~bash
git add site/lib/yi/zodiac-profiles.ts site/lib/yi/traditional-atlas.ts site/tests/yi/zodiac-profiles.test.ts site/tests/yi/traditional-atlas.test.ts
git commit -m "feat: deepen twelve sun sign profiles"
~~~

### Task 7: Integrate Gender, Mirror and Constellation UI

**Files:**
- Modify: site/components/yi/ReferenceAtlasSection.tsx
- Modify: site/app/globals.css
- Modify: site/tests/github-build.test.mjs
- Modify: site/tests/yi/experience-copy.test.ts

**Interfaces:**
- ReferenceAtlasSection must destructure and use birth.
- referenceGender defaults from birth.gender; a local override exists only when birth.gender is unspecified.
- Face and mole render the persistent mirror banner and user-side labels.
- Star renders ConstellationMap.

- [ ] **Step 1: Add failing bundle safety and copy assertions**

~~~js
assert.match(js, /镜面参考/);
assert.match(js, /画面右侧是你的右脸/);
assert.match(js, /画面左侧是你的左脸/);
assert.match(js, /男相参考/);
assert.match(js, /女相参考/);
assert.doesNotMatch(js, /getUserMedia|FileReader|type=["']file["']|capture=["']/);
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npm run test:github

Expected: FAIL because mirror and gender copy are absent.

- [ ] **Step 3: Use birth gender and render the selector**

~~~tsx
const [genderOverride, setGenderOverride] = useState<ReferenceGender | undefined>();
const referenceGender = resolveReferenceGender(birth.gender, genderOverride);
const visual = method === "face" || method === "mole"
  ? resolveAtlasVisual(option, referenceGender)
  : null;

{birth.gender === "unspecified" && (method === "face" || method === "mole") &&
  <div className="atlas-gender-switch" aria-label="参考人物性别">
    <button type="button" aria-pressed={referenceGender === "male"} onClick={() => setGenderOverride("male")}>男相参考</button>
    <button type="button" aria-pressed={referenceGender === "female"} onClick={() => setGenderOverride("female")}>女相参考</button>
  </div>}
~~~

- [ ] **Step 4: Render the persistent mirror banner**

~~~tsx
{(method === "face" || method === "mole") && <aside className="mirror-guide">
  <b>镜面参考｜像照镜子一样对照</b>
  <p>{MIRROR_GUIDANCE}</p>
  <div><span>你的左脸</span><span>你的右脸</span></div>
</aside>}
~~~

The option detail title repeats buildMoleDetailTitle(option) for mole items. Side view buttons read “查看你的左脸”和“查看你的右脸”.

- [ ] **Step 5: Render the constellation component**

When method is star, map option.id from star-aries to aries and render ConstellationMap. Display element and modality next to the Chinese and English names. Do not render the old radial glyph-only star-reference.

- [ ] **Step 6: Add interaction styles**

~~~css
.atlas-gender-switch{display:inline-grid;grid-template-columns:1fr 1fr;gap:5px;padding:4px;border:1px solid #ffffff14;border-radius:12px}
.atlas-gender-switch button{min-height:44px;padding:0 16px;border:0;border-radius:9px;background:transparent;color:var(--muted)}
.atlas-gender-switch button[aria-pressed=true]{background:#caa76018;color:#e2c77e}
.mirror-guide{margin:12px 0;padding:14px 16px;border:1px solid #caa76055;border-radius:14px;background:#8b68110f}
.mirror-guide b{color:#e2c77e}.mirror-guide p{margin:6px 0;line-height:1.65}.mirror-guide div{display:flex;justify-content:space-between;color:#caa760;font-size:12px}
~~~

- [ ] **Step 7: Run tests and commit**

Run: cd site; npx vitest run tests/yi/atlas-orientation.test.ts tests/yi/traditional-atlas.test.ts tests/yi/constellations.test.ts tests/yi/zodiac-profiles.test.ts tests/yi/experience-copy.test.ts; npm run test:github

Expected: PASS; bundle contains mirror guidance and no image-capture API.

~~~bash
git add site/components/yi/ReferenceAtlasSection.tsx site/app/globals.css site/tests/github-build.test.mjs site/tests/yi/experience-copy.test.ts docs
git commit -m "feat: integrate gendered mirror atlases"
~~~

### Task 8: Visual QA the Traditional Atlas

**Files:**
- Modify only defects discovered during verification.

- [ ] **Step 1: Inspect all ten reference assets at original resolution**

Confirm consistent gender, lighting and anatomy; face-shape differences are visible; feature sheets have no garbled text; front/left/right mole portraits show the same person; screen side matches the recorded user side.

- [ ] **Step 2: Verify gender behavior**

Use male, female and unspecified birth records. Confirm automatic gender selection for male and female, local switch for unspecified, and no change to saved birth.gender after switching.

- [ ] **Step 3: Verify mirror behavior**

At 390×844 and 1440×900, select every lateral mole. Confirm the top banner, side labels, hotspot and detail title all refer to the same user side. Test both front and side views.

- [ ] **Step 4: Verify all twelve constellations**

Open all twelve signs. Confirm unique geometry, readable gold lines, primary star emphasis, no clipped nodes, and a static complete map under reduced motion.

- [ ] **Step 5: Run full regression and build**

Run: cd site; npm run lint; npm test; npm run test:github

Expected: all commands exit 0.

- [ ] **Step 6: Commit visual-review fixes**

~~~bash
git add site
git commit -m "fix: close traditional atlas visual review"
~~~
