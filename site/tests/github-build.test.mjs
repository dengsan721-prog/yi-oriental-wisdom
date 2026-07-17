import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repositoryRoot = new URL("../../", import.meta.url);
const stableDocumentation = [
  "superpowers/specs/2026-07-17-yi-oriental-life-wisdom-design.md",
  "superpowers/plans/2026-07-17-yi-github-spa-navigation.md",
  "superpowers/plans/2026-07-17-yi-life-wisdom-upgrade.md",
  "superpowers/plans/2026-07-17-yi-professional-paid-report.md",
];

function normalizeLineEndings(value) {
  return value.replaceAll("\r\n", "\n");
}

test("GitHub build is the full bundled React app", async () => {
  const html = await readFile(new URL("../../docs/index.html", import.meta.url), "utf8");
  const assets = await readdir(new URL("../../docs/assets/", import.meta.url));
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /\/yi-oriental-wisdom\/assets\/index-[^\"]+\.js/);
  assert.ok(assets.some((name) => /^index-.+\.js$/.test(name)));
  const jsName = assets.find((name) => /^index-.+\.js$/.test(name));
  const js = await readFile(new URL(`../../docs/assets/${jsName}`, import.meta.url), "utf8");
  const cssName = assets.find((name) => /^index-.+\.css$/.test(name));
  assert.ok(cssName);
  const css = await readFile(new URL(`../../docs/assets/${cssName}`, import.meta.url), "utf8");
  assert.match(js, /建立出生坐标/);
  assert.match(js, /开始排盘/);
  assert.doesNotMatch(js, /用最少操作完成录入/);
  assert.doesNotMatch(js, /阳历、农历均可录入/);
  assert.doesNotMatch(js, /请确认出生信息/);
  assert.doesNotMatch(js, /当前版本不做真太阳时校正/);
  assert.doesNotMatch(js, /生辰排盘/);
  assert.match(js, /出生地址/);
  for (const professionalTerm of ["月令", "透干", "藏干", "根气", "干支关系"]) {
    assert.match(js, new RegExp(professionalTerm));
  }
  for (const fortuneTerm of ["阶段气候", "原局互动", "机会来源", "压力来源", "岁运关系", "典型场景", "年度动作"]) {
    assert.match(js, new RegExp(fortuneTerm));
  }
  for (const atlasTerm of ["相面", "面痣", "手纹", "星座", "标准照片与图谱仅供自行对照"]) {
    assert.match(js, new RegExp(atlasTerm));
  }
  assert.doesNotMatch(js, /称骨/);
  assert.doesNotMatch(js, /getUserMedia|FileReader|type=["']file["']|capture=["']/);
  assert.match(js, /\/yi-oriental-wisdom\//);
  assert.match(js, /reference\/face-reference\.webp/);
  assert.match(css, /@keyframes yi-breathe/);
  assert.match(css, /\.birth-fact-band/);
  assert.match(css, /\.professional-pillars/);
  assert.match(css, /\.element-diagnostics/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  const resultTabsRule = css.match(/\.result-tabs\{[^}]*\}/)?.[0];
  assert.ok(resultTabsRule);
  assert.match(resultTabsRule, /overflow-x:auto/);
  assert.match(resultTabsRule, /scrollbar-width:none/);
  assert.match(css, /\.result-tabs::-webkit-scrollbar\{display:none\}/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(html, /href="#birth"/);
  assert.doesNotMatch(html, /function calculateChart/);
  for (const asset of ["face-reference.webp", "mole-reference.webp", "palm-reference.webp"]) {
    const bytes = await readFile(new URL(`../../docs/reference/${asset}`, import.meta.url));
    assert.ok(bytes.length > 50_000, `${asset} is not the verified full reference asset`);
  }
  const referenceAssets = await readdir(new URL("../../docs/reference/", import.meta.url));
  assert.equal(referenceAssets.filter((name) => name.endsWith(".png")).length, 0, "stale PNG reference assets remain in the deployment");
});

test("GitHub build preserves deployment metadata and internal planning docs", async () => {
  await readFile(new URL("../../docs/.nojekyll", import.meta.url));

  for (const path of stableDocumentation) {
    const afterBuild = await readFile(new URL(`../../docs/${path}`, import.meta.url), "utf8");
    const { stdout: beforeBuild } = await execFileAsync(
      "git",
      ["show", `HEAD:docs/${path}`],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    assert.equal(
      normalizeLineEndings(afterBuild),
      normalizeLineEndings(beforeBuild),
      `${path} changed during the GitHub build`,
    );
  }
});

test("GitHub build publishes the lunar-typescript MIT notice", async () => {
  const notice = await readFile(
    new URL("../../docs/THIRD_PARTY_LICENSES.txt", import.meta.url),
    "utf8",
  );

  assert.match(notice, /lunar-typescript/);
  assert.match(notice, /Copyright \(c\) 2020 6tail/);
  assert.doesNotMatch(notice, /Copyright \(c\) 2019 6tail/);
  assert.match(notice, /Permission is hereby granted, free of charge/);
  assert.match(notice, /THE SOFTWARE IS PROVIDED "AS IS"/);
});
