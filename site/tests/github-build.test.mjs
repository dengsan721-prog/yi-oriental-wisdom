import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
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

test("GitHub build preserves deployment metadata and internal planning docs", async () => {
  await access(new URL("../../docs/.nojekyll", import.meta.url));
  await access(
    new URL(
      "../../docs/superpowers/plans/2026-07-17-yi-github-spa-navigation.md",
      import.meta.url,
    ),
  );
});
