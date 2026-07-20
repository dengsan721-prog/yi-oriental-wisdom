import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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
  for (const mirrorTerm of [
    "镜面参考｜像照镜子一样对照",
    "画面右侧是你的右脸",
    "画面左侧是你的左脸",
    "你的左脸",
    "你的右脸",
    "查看你的左脸",
    "查看你的右脸",
    "男相参考",
    "女相参考",
  ]) assert.match(js, new RegExp(mirrorTerm));
  for (const constellationTerm of ["Aries", "元素：", "模式：", "金色星座连线图"]) {
    assert.match(js, new RegExp(constellationTerm));
  }
  assert.doesNotMatch(js, /称骨/);
  assert.doesNotMatch(js, /getUserMedia|FileReader|type=["']file["']|capture=["']/);
  assert.match(js, /\/yi-oriental-wisdom\//);
  assert.match(js, /reference\/face-.{0,100}(?:features.{0,100}shapes|shapes.{0,100}features).{0,100}-male\.webp/);
  assert.match(js, /reference\/face-.{0,100}(?:features.{0,100}shapes|shapes.{0,100}features).{0,100}-female\.webp/);
  assert.match(js, /reference\/mole-male-/);
  assert.match(js, /reference\/mole-female-/);
  assert.doesNotMatch(js, /reference\/(?:face-reference|face-feature-reference|mole-reference)\.webp/);
  assert.match(js, /reference\/palm-shape-reference\.webp/);
  assert.match(js, /版本说明/);
  assert.match(js, /明代佚名编纂/);
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
  assert.match(css, /\.atlas-gender-switch/);
  assert.match(css, /\.mirror-guide/);
  assert.match(css, /\.mirror-side-labels/);
  assert.match(css, /\.constellation-meta/);
  assert.doesNotMatch(css, /scaleX\(\s*-1\s*\)|rotateY\(\s*180deg\s*\)/i);
  assert.doesNotMatch(html, /href="#birth"/);
  assert.doesNotMatch(html, /function calculateChart/);
  for (const asset of [
    "palm-reference.webp", "palm-shape-reference.webp",
  ]) {
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

test("GitHub build publishes the local Zhongshan font and license", async () => {
  const [sourceFont, deployedFont, sourceLicense, deployedLicense] = await Promise.all([
    readFile(new URL("../public/fonts/JFZSKSealScript_V3.5.ttf", import.meta.url)),
    readFile(new URL("../../docs/fonts/JFZSKSealScript_V3.5.ttf", import.meta.url)),
    readFile(new URL("../public/fonts/OFL.txt", import.meta.url)),
    readFile(new URL("../../docs/fonts/OFL.txt", import.meta.url)),
  ]);
  const assets = await readdir(new URL("../../docs/assets/", import.meta.url));
  const cssName = assets.find((name) => /^index-.+\.css$/.test(name));
  assert.ok(cssName);
  const css = await readFile(new URL(`../../docs/assets/${cssName}`, import.meta.url), "utf8");

  assert.equal(deployedFont.length, sourceFont.length);
  assert.equal(sha256(deployedFont), sha256(sourceFont));
  assert.deepEqual(deployedLicense, sourceLicense);
  assert.match(deployedLicense.toString("utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(css, /url\(\/yi-oriental-wisdom\/fonts\/JFZSKSealScript_V3\.5\.ttf\)/);
});

test("GitHub build publishes every public reference file byte for byte", async () => {
  const sourceDirectory = new URL("../public/reference/", import.meta.url);
  const deployedDirectory = new URL("../../docs/reference/", import.meta.url);
  const sourceEntries = await readdir(sourceDirectory, { withFileTypes: true });
  const sourceFiles = sourceEntries.filter((entry) => entry.isFile());
  const sourceNames = sourceFiles.map((entry) => entry.name).sort();
  const deployedEntries = await readdir(deployedDirectory, { withFileTypes: true });
  const deployedNames = deployedEntries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  assert.deepEqual(deployedNames, sourceNames, "docs/reference filenames differ from site/public/reference");

  for (const entry of sourceFiles) {
    const [source, deployed] = await Promise.all([
      readFile(new URL(entry.name, sourceDirectory)),
      readFile(new URL(entry.name, deployedDirectory)),
    ]);
    assert.deepEqual(deployed, source, `${entry.name} differs from site/public/reference`);
  }
});
