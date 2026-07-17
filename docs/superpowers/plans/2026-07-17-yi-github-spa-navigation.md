# Yi GitHub SPA Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将完整 React 产品作为 GitHub Pages 唯一版本发布，并实现首页、出生录入、计算中和报告之间真正的页面级跳转。

**Architecture:** 使用独立 Vite 客户端入口构建现有 `YiExperience`，输出到仓库 `docs/`。使用哈希路由管理页面和报告章节，使 GitHub Pages 刷新不产生 404，同时保留浏览器前进后退行为；录入 DOM 只在 `#/birth` 出现。

**Tech Stack:** React 19、TypeScript 5.9、Vite 8、Vitest 4、lunar-typescript 1.8.6、GitHub Pages

## Global Constraints

- 首页只能显示单字“艺”、两行品牌语和“开始排盘”。
- 首页小字说明全部删除，录入区不能通过上下滚动提前看到。
- “艺”外圈使用克制呼吸动效，并尊重 `prefers-reduced-motion`。
- 录入页顶部居中只显示“建立出生坐标”。
- 姓名和出生地址允许为空；阳历/农历、日期、精确时间/十二时辰/不知道时辰均可使用。
- `docs/` 只能由完整 React 产品构建生成，不维护第二套计算器。
- 页面不得出现 Demo、演示版、测试版或固定样例冒充真实结果的文案。

---

## File Structure

- `site/github/index.html`：GitHub Pages 的 Vite HTML 入口。
- `site/github/main.tsx`：挂载 `YiExperience` 并引入全局样式。
- `site/vite.github.config.ts`：静态构建根目录、基础路径和输出目录。
- `site/lib/yi/hash-router.ts`：纯函数路由解析与格式化。
- `site/components/yi/useYiRoute.ts`：监听 `hashchange` 并提供 `push`/`replace`。
- `site/components/yi/YiExperience.tsx`：让流程状态由路由驱动。
- `site/components/yi/ResultShell.tsx`：让报告章节与 URL 同步。
- `site/components/yi/BirthIntake.tsx`：压缩出生录入并移除说明性正文。
- `site/app/globals.css`：页面切换、呼吸标志、紧凑录入样式。
- `site/tests/yi/hash-router.test.ts`：纯路由单元测试。
- `site/tests/yi/intake-state.test.ts`：录入归一化与出生地址测试。
- `site/tests/github-build.test.mjs`：构建产物与禁用旧内嵌页面测试。
- `site/tests/rendered-html.test.mjs`：旧静态说明页测试；迁移后删除，避免两套发布验收并存。

### Task 1: Add the Single GitHub Build Entry

**Files:**
- Create: `site/github/index.html`
- Create: `site/github/main.tsx`
- Create: `site/vite.github.config.ts`
- Modify: `site/package.json`
- Create: `site/tests/github-build.test.mjs`
- Delete: `site/tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `YiExperience(): JSX.Element` from `site/components/yi/YiExperience.tsx`.
- Produces: `npm run build:github`, generating `docs/index.html` and hashed files under `docs/assets/`.

- [ ] **Step 1: Write the failing GitHub build test**

```js
// site/tests/github-build.test.mjs
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("GitHub build is the full bundled React app", async () => {
  const html = await readFile(new URL("../../docs/index.html", import.meta.url), "utf8");
  const assets = await readdir(new URL("../../docs/assets/", import.meta.url));
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /\/yi-oriental-wisdom\/assets\/index-[^\"]+\.js/);
  assert.ok(assets.some((name) => /^index-.+\.js$/.test(name)));
  assert.doesNotMatch(html, /href="#birth"/);
  assert.doesNotMatch(html, /function calculateChart/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd site; node --test tests/github-build.test.mjs`

Expected: FAIL because the current `docs/index.html` is the hand-written embedded calculator and has no generated `docs/assets/` directory.

- [ ] **Step 3: Add the Vite entry and build script**

```html
<!-- site/github/index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#07131c" />
    <title>艺｜东方人生智慧</title>
  </head>
  <body><div id="root"></div><script type="module" src="/main.tsx"></script></body>
</html>
```

```tsx
// site/github/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { YiExperience } from "../components/yi/YiExperience";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><YiExperience /></StrictMode>,
);
```

```ts
// site/vite.github.config.ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const siteRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL("./github", import.meta.url)),
  base: "/yi-oriental-wisdom/",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../docs", import.meta.url)),
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: { alias: { "@site": siteRoot } },
});
```

Add these scripts to `site/package.json` without removing existing scripts:

```json
{
  "scripts": {
    "build:github": "vite build --config vite.github.config.ts",
    "test:github": "npm run build:github && node --test tests/github-build.test.mjs",
    "test:rendered": "npm run test:github"
  }
}
```

Delete `site/tests/rendered-html.test.mjs` after the new build test is in place. No script may continue to validate the deleted hand-written landing page.

- [ ] **Step 4: Build and verify the new artifact**

Run: `cd site; npm run test:github`

Expected: Vite exits 0; the Node test reports 1 passing test; `docs/index.html` contains only the React mount point and hashed asset references.

- [ ] **Step 5: Commit the build foundation**

```bash
git add site/github site/vite.github.config.ts site/package.json site/tests/github-build.test.mjs site/tests/rendered-html.test.mjs docs
git commit -m "build: publish full React app to GitHub Pages"
```

### Task 2: Implement Hash Navigation and Browser History

**Files:**
- Create: `site/lib/yi/hash-router.ts`
- Create: `site/components/yi/useYiRoute.ts`
- Create: `site/tests/yi/hash-router.test.ts`
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/components/yi/ResultShell.tsx`

**Interfaces:**
- Produces: `YiRoute`, `parseYiHash(hash)`, `formatYiHash(route)`, `useYiRoute()`.
- `ResultShell` consumes `activeSection` and calls `onSectionChange(section)`.

- [ ] **Step 1: Write failing route tests**

```ts
// site/tests/yi/hash-router.test.ts
import { describe, expect, it } from "vitest";
import { formatYiHash, parseYiHash } from "../../lib/yi/hash-router";

describe("yi hash router", () => {
  it.each([
    ["", { page: "intro" }],
    ["#/", { page: "intro" }],
    ["#/birth", { page: "birth" }],
    ["#/calculating", { page: "calculating" }],
    ["#/report/chart", { page: "report", section: "chart" }],
    ["#/report/not-real", { page: "report", section: "portrait" }],
    ["#/home", { page: "home" }],
  ])("parses %s", (hash, expected) => expect(parseYiHash(hash)).toEqual(expected));

  it("formats report routes", () => {
    expect(formatYiHash({ page: "report", section: "fortune" })).toBe("#/report/fortune");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site; npx vitest run tests/yi/hash-router.test.ts`

Expected: FAIL with module-not-found for `hash-router`.

- [ ] **Step 3: Implement the router and hook**

```ts
// site/lib/yi/hash-router.ts
export const reportSectionIds = ["portrait", "chart", "detail", "fortune", "mirror", "compatibility", "tradition"] as const;
export type ReportSectionId = typeof reportSectionIds[number];
export type YiRoute =
  | { page: "intro" | "birth" | "calculating" | "home" }
  | { page: "report"; section: ReportSectionId };

export function parseYiHash(hash: string): YiRoute {
  const path = hash.replace(/^#/, "");
  if (path === "/birth") return { page: "birth" };
  if (path === "/calculating") return { page: "calculating" };
  if (path === "/home") return { page: "home" };
  const report = /^\/report\/([^/]+)$/.exec(path);
  if (report) return { page: "report", section: reportSectionIds.includes(report[1] as ReportSectionId) ? report[1] as ReportSectionId : "portrait" };
  return { page: "intro" };
}

export function formatYiHash(route: YiRoute) {
  return route.page === "report" ? `#/report/${route.section}` : route.page === "intro" ? "#/" : `#/${route.page}`;
}
```

```tsx
// site/components/yi/useYiRoute.ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { formatYiHash, parseYiHash, type YiRoute } from "../../lib/yi/hash-router";

export function useYiRoute() {
  const [route, setRoute] = useState<YiRoute>({ page: "intro" });
  useEffect(() => {
    const sync = () => setRoute(parseYiHash(window.location.hash));
    sync(); window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const push = useCallback((next: YiRoute) => { window.location.hash = formatYiHash(next); }, []);
  const replace = useCallback((next: YiRoute) => { window.history.replaceState(null, "", formatYiHash(next)); setRoute(next); }, []);
  return { route, push, replace };
}
```

Refactor `YiExperience` so buttons call `push({ page: "birth" })`, calculations call `replace({ page: "calculating" })`, completion calls `replace({ page: "report", section: "portrait" })`, and rendering switches on `route.page`. Keep `loading` as a separate hydration flag, not a public route.

Refactor `ResultShell` to accept:

```ts
activeSection: ReportSectionId;
onSectionChange: (section: ReportSectionId) => void;
```

and replace its internal `select-section` reducer action with `onSectionChange(next)` while preserving per-section scroll positions.

- [ ] **Step 4: Run route and existing navigation tests**

Run: `cd site; npx vitest run tests/yi/hash-router.test.ts tests/yi/result-navigation.test.ts`

Expected: both test files pass; the route test reports all table rows successful.

- [ ] **Step 5: Rebuild and assert route copy is bundled**

Add to `site/tests/github-build.test.mjs`:

```js
const jsName = assets.find((name) => /^index-.+\.js$/.test(name));
const js = await readFile(new URL(`../../docs/assets/${jsName}`, import.meta.url), "utf8");
assert.match(js, /建立出生坐标/);
assert.match(js, /开始排盘/);
```

Run: `cd site; npm run test:github`

Expected: PASS.

- [ ] **Step 6: Commit navigation**

```bash
git add site/lib/yi/hash-router.ts site/components/yi/useYiRoute.ts site/components/yi/YiExperience.tsx site/components/yi/ResultShell.tsx site/tests/yi/hash-router.test.ts site/tests/yi/result-navigation.test.ts site/tests/github-build.test.mjs docs
git commit -m "feat: navigate yi flow as separate pages"
```

### Task 3: Simplify the Intro and Birth Intake

**Files:**
- Modify: `site/components/yi/YiExperience.tsx`
- Modify: `site/components/yi/BirthIntake.tsx`
- Modify: `site/app/globals.css`
- Modify: `site/tests/yi/intake-state.test.ts`
- Modify: `site/tests/github-build.test.mjs`

**Interfaces:**
- `normalizeBirthSubmission(draft)` continues to produce `BirthSubmission` with `location` stored in the in-memory calculation input.
- The page contains no user-facing explanation below the calendar or address controls.

- [ ] **Step 1: Add failing copy and address assertions**

```ts
// append to site/tests/yi/intake-state.test.ts
it("keeps an optional birth address without changing the solar date", () => {
  const result = normalizeBirthSubmission({
    name: " 林 ", location: " 浙江省杭州市 ",
    date: { mode: "solar", year: 1990, month: 6, day: 15, isLeapMonth: false },
    timeMode: "unknown", hour: null, minute: null, earthlyIndex: null, gender: "unspecified",
  });
  expect(result.location).toBe("浙江省杭州市");
  expect(result.date).toBe("1990-06-15");
  expect(result.time).toBeNull();
});
```

Add these build assertions:

```js
assert.doesNotMatch(js, /用最少操作完成录入/);
assert.doesNotMatch(js, /阳历、农历均可录入/);
assert.match(js, /出生地址/);
```

- [ ] **Step 2: Run tests and confirm the copy assertion fails**

Run: `cd site; npx vitest run tests/yi/intake-state.test.ts; npm run test:github`

Expected: unit test passes; GitHub build test fails because old explanatory copy remains bundled.

- [ ] **Step 3: Apply the exact intake copy and layout**

Replace the intake heading with:

```tsx
<div className="step-head"><h1>建立出生坐标</h1></div>
```

Replace the location label with:

```tsx
<label><span>出生地址（选填）</span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="城市或区县" /></label>
```

Remove the explanatory `<small>` under location and the explanatory `<p>` under the heading. Render dual calendar confirmation as one compact line:

```tsx
<p className="dual-calendar-line">阳历 {labels.solar}<span>·</span>农历 {labels.lunar}<span>·</span>{timeSummary}</p>
```

Keep the homepage JSX limited to `ritual-bg`, `Mark`, the two-line `ritual-lines`, and the start button.

- [ ] **Step 4: Add breathing and page styles**

```css
.yi-mark i,.yi-mark b{position:absolute;inset:-14%;border:1px solid #d8c08c66;border-radius:50%;animation:yi-breathe 4.8s ease-in-out infinite}
.yi-mark b{inset:-28%;opacity:.28;animation-delay:-2.4s;animation-duration:6.4s}
@keyframes yi-breathe{0%,100%{transform:scale(.94);opacity:.22}50%{transform:scale(1.08);opacity:.7}}
.step-head{text-align:center;margin-bottom:24px}.step-head h1{margin:0;font:400 clamp(30px,5vw,46px) serif}
.dual-calendar-line{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px 0;color:var(--muted);font-size:12px}
@media(prefers-reduced-motion:reduce){.yi-mark i,.yi-mark b{animation:none;transform:none}}
```

- [ ] **Step 5: Run unit, build and viewport verification**

Run: `cd site; npx vitest run tests/yi/intake-state.test.ts tests/yi/hash-router.test.ts; npm run test:github`

Expected: all tests pass.

Open the built site at 390×844 and 1440×900. Verify: intro has no vertical scroll; `#/birth` shows centered “建立出生坐标”; date and time wheels open only after tapping controls; no horizontal overflow.

- [ ] **Step 6: Commit the intake polish**

```bash
git add site/components/yi/YiExperience.tsx site/components/yi/BirthIntake.tsx site/app/globals.css site/tests/yi/intake-state.test.ts site/tests/github-build.test.mjs docs
git commit -m "feat: simplify yi birth coordinate intake"
```

### Task 4: Verify and Publish the Navigation Release

**Files:**
- Modify: `site/tests/github-build.test.mjs` only if a deployment-specific regression is discovered.

**Interfaces:**
- Produces: a public GitHub Pages build using the exact verified commit.

- [ ] **Step 1: Run the complete local gate**

Run: `cd site; npm test; npm run lint; npm run test:github`

Expected: Vitest reports all tests passing; ESLint exits 0; GitHub build test exits 0.

- [ ] **Step 2: Verify the working tree and generated artifact**

Run: `git status --short; git diff --check; git log -3 --oneline`

Expected: only intended generated `docs/` changes are tracked; no whitespace errors; the latest commits match Tasks 1–3.

- [ ] **Step 3: Push the validated commit**

```bash
git push origin master
```

Expected: push succeeds and reports the new `master` commit.

- [ ] **Step 4: Trigger and inspect GitHub Pages**

Run: `gh api -X POST repos/dengsan721-prog/yi-oriental-wisdom/pages/builds; gh api repos/dengsan721-prog/yi-oriental-wisdom/pages/builds/latest`

Expected: latest build status becomes `built` and its commit SHA equals local `git rev-parse HEAD`.

- [ ] **Step 5: Verify the public page and asset**

Run:

```powershell
$url='https://dengsan721-prog.github.io/yi-oriental-wisdom/'
$html=(Invoke-WebRequest -UseBasicParsing $url).Content
if($html -notmatch '<div id="root"></div>'){throw 'React mount missing'}
$asset=[regex]::Match($html,'/yi-oriental-wisdom/assets/index-[^\"]+\.js').Value
if(-not $asset){throw 'asset missing'}
(Invoke-WebRequest -UseBasicParsing ('https://dengsan721-prog.github.io'+$asset)).StatusCode
```

Expected: final output is `200`; mobile browser can move `#/` → `#/birth` → browser back without revealing the intake through scrolling.
