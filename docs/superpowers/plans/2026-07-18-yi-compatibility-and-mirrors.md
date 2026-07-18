# Yi Compatibility and Four-Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 将四类合盘升级为九维关系说明书，并建立动物、生肖、历史人物、电影角色四重人生镜像。

**Architecture:** 合盘继续使用双方真实四柱、双向十神和跨盘干支关系，但输出统一的九维 CompatibilityAxis 数组，并按伴侣、亲子、商业和朋友加载不同场景。镜像系统使用结构化特征向量和可解释评分，返回候选与匹配依据；人物和电影角色数据与匹配算法分离，界面不显示虚假的精确百分比。

**Tech Stack:** TypeScript 5.9、React 19、Vitest 4、CSS

## Global Constraints

- 合盘不输出单一分数，不判断关系成败。
- 伴侣、亲子、商业伙伴和朋友使用不同场景与行动规则。
- 商业合盘必须覆盖权责、资金、风险、暂停与退出。
- 亲子合盘不为孩子贴标签，伴侣合盘不使用克夫或克妻。
- 动物、生肖、历史人物和电影角色都只是观察镜像，不宣称命运相同。
- 电影角色分析使用原创文字，不复制台词、海报、剧照或网络影评。
- 每种镜像说明相似、不同、可借鉴和需要避免的阴影。

---

## File Structure

- site/lib/yi/compatibility.ts：九维合盘模型、关系专属场景和行动规则。
- site/lib/yi/mirror-features.ts：从命盘提取可解释特征向量。
- site/lib/yi/animal-mirrors.ts：动物原型候选库。
- site/lib/yi/historical-mirrors.ts：历史人物候选库与来源。
- site/lib/yi/movie-characters.ts：电影角色候选库与来源。
- site/lib/yi/mirrors.ts：统一排名、去重和候选结果。
- site/components/yi/CompatibilitySection.tsx：九维关系说明书。
- site/components/yi/MirrorSection.tsx：四重镜像导航和深度卡片。
- site/app/globals.css：合盘轴和镜像卡片样式。
- site/tests/yi/compatibility-traditions.test.ts：四类九维合盘。
- site/tests/yi/mirror-features.test.ts：命盘特征与可解释评分。
- site/tests/yi/fortune-mirrors.test.ts：三类候选与边界。
- site/tests/yi/movie-characters.test.ts：角色库完整性、原创边界和去重。

### Task 1: Build Nine-Dimension Compatibility Results

**Files:**
- Modify: site/lib/yi/compatibility.ts
- Modify: site/tests/yi/compatibility-traditions.test.ts

**Interfaces:**
- Produces CompatibilityAxisId = attraction | communication | trigger | trust | conflict | resources | decisions | stability | repair.
- CompatibilityResult gains summary, axes and roleSpecificGuidance.
- Existing elementDynamics, tenGodDynamics, combinationsAndClashes, actionRules and limitations remain for professional evidence.

- [ ] **Step 1: Write failing axis tests**

~~~ts
it.each(["partner", "parent-child", "business", "friend"] as const)(
  "builds a complete nine-axis %s relationship manual",
  relationship => {
    const result = calculateCompatibility(first, second, relationship);
    expect(result.summary.length).toBeGreaterThanOrEqual(80);
    expect(result.axes.map(axis => axis.id)).toEqual([
      "attraction", "communication", "trigger", "trust", "conflict",
      "resources", "decisions", "stability", "repair",
    ]);
    for (const axis of result.axes) {
      expect(axis.professionalBasis.length).toBeGreaterThanOrEqual(20);
      expect(axis.plainLanguage.length).toBeGreaterThanOrEqual(40);
      expect(axis.scene.length).toBeGreaterThanOrEqual(60);
      expect(axis.action.length).toBeGreaterThanOrEqual(30);
      expect(axis.caution.length).toBeGreaterThanOrEqual(20);
    }
    expect(result.roleSpecificGuidance.length).toBeGreaterThanOrEqual(4);
  },
);
~~~

- [ ] **Step 2: Run tests and verify failure**

Run: cd site; npx vitest run tests/yi/compatibility-traditions.test.ts

Expected: FAIL because summary, axes and roleSpecificGuidance do not exist.

- [ ] **Step 3: Add the structured compatibility types**

~~~ts
export type CompatibilityAxisId =
  | "attraction" | "communication" | "trigger" | "trust" | "conflict"
  | "resources" | "decisions" | "stability" | "repair";

export type CompatibilityAxis = {
  id: CompatibilityAxisId;
  label: string;
  professionalBasis: string;
  plainLanguage: string;
  scene: string;
  action: string;
  caution: string;
};

export type CompatibilityResult = {
  relationship: RelationshipType;
  summary: string;
  axes: CompatibilityAxis[];
  roleSpecificGuidance: string[];
  elementDynamics: { element: ElementName; first: number; second: number; observation: string }[];
  tenGodDynamics: { direction: "A→B" | "B→A"; basis: string; theme: TenGodName; observation: string }[];
  combinationsAndClashes: { symbols: [string, string]; relation: string; observation: string }[];
  communicationScenario: string;
  actionRules: string[];
  limitations: string[];
};
~~~

- [ ] **Step 4: Build all nine axes from real evidence**

Use the two directional ten gods, day-branch relation, all cross relations, five-element difference and confidence in every result. Use this exact label map:

~~~ts
const axisLabels: Record<CompatibilityAxisId, string> = {
  attraction: "彼此为什么靠近",
  communication: "话怎样才能被听见",
  trigger: "最容易被碰到的地方",
  trust: "信任怎样一点点长出来",
  conflict: "争执通常从哪里开始",
  resources: "钱、时间与人情怎样流动",
  decisions: "谁在什么时候做决定",
  stability: "关系靠什么走得长",
  repair: "走远以后怎样重新靠近",
};
~~~

Each axis builder must include a professionalBasis string containing at least one actual day stem, day branch, ten god or cross relation. Role-specific scene dictionaries must not share exact paragraphs across the four relationship types.

- [ ] **Step 5: Add relationship-specific guidance**

Use exact topics:

- Partner: intimacy need, commitment method, household rhythm, repair language.
- Parent-child: rule explanation, choice range, talent support, expectation boundary.
- Business: authority, investment threshold, cash flow, risk stop, exit and handover.
- Friend: companionship, request clarity, boundary, changing life stages.

- [ ] **Step 6: Run tests and commit**

Run: cd site; npx vitest run tests/yi/compatibility-traditions.test.ts

Expected: PASS for all four relationship types.

~~~bash
git add site/lib/yi/compatibility.ts site/tests/yi/compatibility-traditions.test.ts
git commit -m "feat: build nine-axis compatibility manuals"
~~~

### Task 2: Render the Relationship Manual

**Files:**
- Modify: site/components/yi/CompatibilitySection.tsx
- Modify: site/app/globals.css
- Modify: site/tests/yi/experience-copy.test.ts

**Interfaces:**
- CompatibilitySection keeps its current props and second-birth flow.
- It renders result.summary, nine axis cards, roleSpecificGuidance and a folded professional evidence section.

- [ ] **Step 1: Add failing bundle labels**

~~~ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

it("renders the relationship manual language", async () => {
  const bundle = readFileSync(resolve("components/yi/CompatibilitySection.tsx"), "utf8");
  for (const label of ["彼此为什么靠近","话怎样才能被听见","最容易被碰到的地方","关系靠什么走得长","走远以后怎样重新靠近"]) {
    expect(bundle).toContain(label);
  }
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/experience-copy.test.ts

Expected: FAIL because the nine labels are not rendered.

- [ ] **Step 3: Render summary, axes and evidence**

~~~tsx
{result && <div className="compatibility-manual">
  <header className="compatibility-summary"><small>两个人的关系主旋律</small><p>{result.summary}</p></header>
  <div className="compatibility-axes">
    {result.axes.map(axis => <article key={axis.id}>
      <span>{axis.label}</span>
      <p>{axis.plainLanguage}</p>
      <blockquote>{axis.scene}</blockquote>
      <b>可以这样做</b><p>{axis.action}</p>
      <details><summary>专业依据与边界</summary><p>{axis.professionalBasis}</p><small>{axis.caution}</small></details>
    </article>)}
  </div>
  <section className="role-guidance"><h2>{labels[relationship]}关系说明书</h2>{result.roleSpecificGuidance.map(item => <p key={item}>{item}</p>)}</section>
  <details className="compatibility-evidence"><summary>查看双向十神、五行和干支关系</summary>{/* render current evidence blocks here */}</details>
</div>}
~~~

- [ ] **Step 4: Add responsive styles**

~~~css
.compatibility-summary{padding:20px;border:1px solid #caa76055;border-radius:18px;background:linear-gradient(145deg,#13140f,#081219)}
.compatibility-axes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
.compatibility-axes article{padding:18px;border:1px solid #ffffff12;border-radius:16px;background:#0b151c}
.compatibility-axes span,.compatibility-axes b{color:var(--gold)}.compatibility-axes blockquote{margin:14px 0;padding:12px 14px;border-left:2px solid #caa760;background:#ffffff05;line-height:1.75}
.compatibility-evidence summary{min-height:44px;display:flex;align-items:center;color:#dfca95;cursor:pointer}
@media(max-width:720px){.compatibility-axes{grid-template-columns:1fr}}
~~~

- [ ] **Step 5: Run tests and commit**

Run: cd site; npx vitest run tests/yi/compatibility-traditions.test.ts tests/yi/experience-copy.test.ts

Expected: PASS.

~~~bash
git add site/components/yi/CompatibilitySection.tsx site/app/globals.css site/tests/yi/experience-copy.test.ts
git commit -m "feat: render relationship manuals"
~~~

### Task 3: Extract Explainable Mirror Features

**Files:**
- Create: site/lib/yi/mirror-features.ts
- Create: site/tests/yi/mirror-features.test.ts

**Interfaces:**
- Produces MirrorFeatureVector with growth, expression, stability, discernment and adaptability values from zero to ten.
- Produces extractMirrorFeatures(chart): { vector; evidence; stressStyle }.
- Produces scoreMirror(vector, candidateVector): number for ranking only; scores are not displayed as destiny percentages.

- [ ] **Step 1: Write failing feature tests**

~~~ts
import { describe, expect, it } from "vitest";
import { extractMirrorFeatures, scoreMirror } from "../../lib/yi/mirror-features";

describe("explainable mirror features", () => {
  it("derives bounded features and evidence from the chart", () => {
    const result = extractMirrorFeatures(first);
    for (const value of Object.values(result.vector)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
    expect(result.evidence.join("")).toContain(first.professional.dayMaster.stem);
    expect(result.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it("scores identical vectors above distant vectors", () => {
    const a = { growth:8, expression:6, stability:4, discernment:5, adaptability:7 };
    expect(scoreMirror(a, a)).toBeGreaterThan(scoreMirror(a, { growth:1, expression:1, stability:10, discernment:10, adaptability:1 }));
  });
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/mirror-features.test.ts

Expected: FAIL because mirror-features.ts does not exist.

- [ ] **Step 3: Implement bounded feature extraction**

~~~ts
import type { ElementName, FourPillarsResult } from "./types";

export type MirrorFeatureVector = {
  growth: number;
  expression: number;
  stability: number;
  discernment: number;
  adaptability: number;
};

const keys: Record<ElementName, keyof MirrorFeatureVector> = {
  木:"growth", 火:"expression", 土:"stability", 金:"discernment", 水:"adaptability",
};

const clamp = (value: number) => Math.max(0, Math.min(10, value));

export function extractMirrorFeatures(chart: FourPillarsResult) {
  const vector: MirrorFeatureVector = { growth:2, expression:2, stability:2, discernment:2, adaptability:2 };
  for (const [element, count] of Object.entries(chart.elementCounts) as [ElementName, number][]) {
    vector[keys[element]] = clamp(2 + count * 1.5);
  }
  vector[keys[chart.professional.dayMaster.element]] = clamp(vector[keys[chart.professional.dayMaster.element]] + 2);
  return {
    vector,
    stressStyle: chart.professional.structureBalance,
    evidence: [
      "日主" + chart.professional.dayMaster.stem + chart.professional.dayMaster.element,
      "结构支持度" + chart.professional.supportScore,
      "已知关系" + chart.professional.relations.map(item => item.label).join("、"),
    ],
  };
}

export function scoreMirror(left: MirrorFeatureVector, right: MirrorFeatureVector): number {
  return 50 - (Object.keys(left) as (keyof MirrorFeatureVector)[])
    .reduce((sum, key) => sum + Math.abs(left[key] - right[key]), 0);
}
~~~

- [ ] **Step 4: Run tests and commit**

Run: cd site; npx vitest run tests/yi/mirror-features.test.ts

Expected: PASS.

~~~bash
git add site/lib/yi/mirror-features.ts site/tests/yi/mirror-features.test.ts
git commit -m "feat: extract explainable mirror features"
~~~

### Task 4: Build Animal, Historical and Movie Character Libraries

**Files:**
- Create: site/lib/yi/animal-mirrors.ts
- Create: site/lib/yi/historical-mirrors.ts
- Create: site/lib/yi/movie-characters.ts
- Modify: site/lib/yi/mirrors.ts
- Create: site/tests/yi/movie-characters.test.ts
- Modify: site/tests/yi/fortune-mirrors.test.ts

**Interfaces:**
- Produces MirrorCandidate with id, name, kind, vector, similar, different, lesson, shadow, sourceReferences.
- Produces matchLifeMirrors(chart): { animals; historical; movies }, each containing three ranked candidates.
- Keeps buildZodiacMirror(chart) as the single year-branch cultural mirror.

- [ ] **Step 1: Write failing corpus and ranking tests**

~~~ts
import { expect, it } from "vitest";
import { MOVIE_CHARACTERS } from "../../lib/yi/movie-characters";
import { matchLifeMirrors } from "../../lib/yi/mirrors";

it("ships a broad movie-character corpus", () => {
  expect(MOVIE_CHARACTERS.length).toBeGreaterThanOrEqual(36);
  expect(new Set(MOVIE_CHARACTERS.map(item => item.characterName)).size).toBe(MOVIE_CHARACTERS.length);
  expect([...new Set(MOVIE_CHARACTERS.map(item => item.region))].sort()).toEqual(
    ["中国大陆","中国香港","亚洲","欧美"].sort(),
  );
  for (const item of MOVIE_CHARACTERS) {
    expect(item.filmTitle.length).toBeGreaterThan(0);
    expect(item.coreDrive.length).toBeGreaterThanOrEqual(20);
    expect(item.turningPoint.length).toBeGreaterThanOrEqual(20);
    expect(item.sourceReferences.length).toBeGreaterThan(0);
    expect(JSON.stringify(item)).not.toMatch(/经典台词|剧照|海报链接/);
  }
});

it("returns three explained candidates for each life mirror", () => {
  const result = matchLifeMirrors(first);
  for (const group of [result.animals, result.historical, result.movies]) {
    expect(group).toHaveLength(3);
    expect(new Set(group.map(item => item.id)).size).toBe(3);
    for (const item of group) {
      expect(item.similar.length).toBeGreaterThanOrEqual(50);
      expect(item.different.length).toBeGreaterThanOrEqual(30);
      expect(item.lesson.length).toBeGreaterThanOrEqual(30);
      expect(item.shadow.length).toBeGreaterThanOrEqual(30);
    }
  }
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/movie-characters.test.ts tests/yi/fortune-mirrors.test.ts

Expected: FAIL because the new libraries and matchLifeMirrors do not exist.

- [ ] **Step 3: Define the shared candidate shape**

~~~ts
import type { MirrorFeatureVector } from "./mirror-features";

export type MirrorCandidate = {
  id: string;
  name: string;
  kind: "animal" | "historical" | "movie";
  vector: MirrorFeatureVector;
  similar: string;
  different: string;
  lesson: string;
  shadow: string;
  sourceReferences: string[];
};

export type MovieCharacterRecord = MirrorCandidate & {
  kind: "movie";
  filmTitle: string;
  characterName: string;
  region: "中国大陆" | "中国香港" | "亚洲" | "欧美";
  stage: "instinct" | "current" | "growth";
  coreDrive: string;
  actionStyle: string;
  stressResponse: string;
  relationshipStyle: string;
  talentExpression: string;
  blindSpot: string;
  turningPoint: string;
  matureArc: string;
  shadowArc: string;
};
~~~

- [ ] **Step 4: Author the complete corpora**

Create:

- Fifteen animal candidates spanning solitary/group, fast/slow, land/water/air and high/low vigilance.
- Fifteen historical candidates with reliable biographies or primary texts; do not rely on unverifiable birth hours.
- At least thirty-six film characters, with at least eight each from 中国大陆、中国香港、亚洲、欧美.

Every movie record must cover the exact ten character fields in MovieCharacterRecord and use original Chinese analysis. Select characters from broadly known, legally identifiable works, but store no dialogue, image URL, poster or copyrighted synopsis.

- [ ] **Step 5: Implement deterministic ranking**

~~~ts
function rank(candidates: MirrorCandidate[], chart: FourPillarsResult): MirrorCandidate[] {
  const { vector } = extractMirrorFeatures(chart);
  return [...candidates]
    .map(candidate => ({ candidate, score: scoreMirror(vector, candidate.vector) }))
    .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id))
    .slice(0, 3)
    .map(item => item.candidate);
}

export function matchLifeMirrors(chart: FourPillarsResult) {
  return {
    animals: rank(ANIMAL_MIRRORS, chart),
    historical: rank(HISTORICAL_MIRRORS, chart),
    movies: rank(MOVIE_CHARACTERS, chart),
  };
}
~~~

For movie candidates, return one candidate for each stage: instinct, current and growth. If the top three have duplicate stages, take the highest remaining record from the missing stage.

Preserve the existing public functions for regression compatibility. Adapt the first ranked candidate back to the old shapes until all consumers and stored data have migrated:

~~~ts
export function matchAnimalArchetype(chart: FourPillarsResult): AnimalArchetype {
  const first = matchLifeMirrors(chart).animals[0];
  return {
    name:first.name,
    basis:"显式映射：" + extractMirrorFeatures(chart).evidence.join("；"),
    mappedFeatures:Object.entries(first.vector).map(([key,value]) => key + "=" + value),
    strengthPattern:first.similar,
    pressurePattern:first.shadow,
    action:first.lesson,
    caution:"这是行为隐喻，不是性格标签。",
  };
}

export function matchHistoricalMirror(chart: FourPillarsResult): HistoricalMirror {
  const first = matchLifeMirrors(chart).historical[0];
  return {
    person:first.name,
    dimension:"人生结构单维比较",
    basis:"显式映射：" + extractMirrorFeatures(chart).evidence.join("；"),
    source:first.sourceReferences.join("；"),
    reliability:"contextual",
    observation:first.similar,
    action:first.lesson,
    caution:"仅比较具体维度，不表示命运相同。",
  };
}
~~~

- [ ] **Step 6: Run tests and commit**

Run: cd site; npx vitest run tests/yi/mirror-features.test.ts tests/yi/movie-characters.test.ts tests/yi/fortune-mirrors.test.ts

Expected: PASS with three distinct candidates per mirror group.

~~~bash
git add site/lib/yi/animal-mirrors.ts site/lib/yi/historical-mirrors.ts site/lib/yi/movie-characters.ts site/lib/yi/mirrors.ts site/tests/yi/movie-characters.test.ts site/tests/yi/fortune-mirrors.test.ts
git commit -m "feat: add four-layer life mirrors"
~~~

### Task 5: Render Four Distinct Mirror Experiences

**Files:**
- Modify: site/components/yi/MirrorSection.tsx
- Modify: site/app/globals.css
- Modify: site/tests/yi/experience-copy.test.ts

**Interfaces:**
- MirrorSection consumes chart and renders four navigation buttons: 生肖、动物、历史人物、电影角色.
- Zodiac remains a single deep record; the other three display three candidates.

- [ ] **Step 1: Add failing copy assertions**

~~~ts
it("renders all four mirror entrances and movie comparison layers", async () => {
  const bundle = readFileSync(resolve("components/yi/MirrorSection.tsx"), "utf8");
  for (const label of ["生肖镜像","动物镜像","历史人物","电影角色","为什么相似","哪里不同","可以借鉴","角色阴影"]) {
    expect(bundle).toContain(label);
  }
});
~~~

- [ ] **Step 2: Run and verify failure**

Run: cd site; npx vitest run tests/yi/experience-copy.test.ts

Expected: FAIL on the new movie and comparison labels.

- [ ] **Step 3: Render tabs and candidate cards**

Use a local tab state with default zodiac. Each candidate card renders name, film title when present, similar, different, lesson, shadow and a folded source list. Do not render a numeric match percentage.

~~~tsx
<article className="mirror-candidate" key={candidate.id}>
  <header><small>{candidate.kind === "movie" ? "电影角色镜像" : "人生镜像"}</small><h2>{candidate.name}</h2></header>
  <section><b>为什么相似</b><p>{candidate.similar}</p></section>
  <section><b>哪里不同</b><p>{candidate.different}</p></section>
  <section><b>可以借鉴</b><p>{candidate.lesson}</p></section>
  <aside><b>需要避开的阴影</b><p>{candidate.shadow}</p></aside>
  <details><summary>来源与使用边界</summary><p>{candidate.sourceReferences.join("｜")}</p></details>
</article>
~~~

- [ ] **Step 4: Add black-gold mirror styles**

~~~css
.mirror-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.mirror-tabs button{min-height:44px;border:1px solid #ffffff16;border-radius:12px;background:#ffffff05;color:var(--text)}
.mirror-tabs button.active{border-color:#caa760;color:#e2c77e}.mirror-candidates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.mirror-candidate{padding:19px;border:1px solid #ffffff12;border-radius:18px;background:linear-gradient(160deg,#101820,#090d10)}
.mirror-candidate h2{font:500 27px/1.2 serif}.mirror-candidate b{display:block;color:var(--gold);font-size:12px}.mirror-candidate aside{padding:12px;background:#7d301318;border-radius:12px}
@media(max-width:760px){.mirror-tabs{grid-template-columns:repeat(2,1fr)}.mirror-candidates{grid-template-columns:1fr}}
~~~

- [ ] **Step 5: Run tests and commit**

Run: cd site; npx vitest run tests/yi/fortune-mirrors.test.ts tests/yi/movie-characters.test.ts tests/yi/experience-copy.test.ts

Expected: PASS.

~~~bash
git add site/components/yi/MirrorSection.tsx site/app/globals.css site/tests/yi/experience-copy.test.ts
git commit -m "feat: render four life mirror experiences"
~~~

### Task 6: Verify Compatibility and Mirrors

**Files:**
- Modify only defects discovered during verification.

- [ ] **Step 1: Run focused regression**

Run: cd site; npx vitest run tests/yi/compatibility-traditions.test.ts tests/yi/mirror-features.test.ts tests/yi/movie-characters.test.ts tests/yi/fortune-mirrors.test.ts tests/yi/experience-copy.test.ts

Expected: PASS.

- [ ] **Step 2: Run full lint and tests**

Run: cd site; npm run lint; npm test

Expected: both commands exit 0.

- [ ] **Step 3: Manually compare relationship roles**

Use the same two birth records for partner, parent-child, business and friend. Confirm the nine professional bases remain consistent while scenes and actions change by relationship role; business includes authority, money, stop and exit, and parent-child avoids labeling.

- [ ] **Step 4: Manually compare mirror diversity**

Generate at least five day-master-element examples. Confirm each displays three animal, three historical and three movie candidates; no result shows a numeric destiny match; movie candidates include instinct, current and growth perspectives.

- [ ] **Step 5: Build and commit review fixes**

Run: cd site; npm run test:github

Expected: PASS.

~~~bash
git add site
git commit -m "fix: close compatibility and mirror review"
~~~
