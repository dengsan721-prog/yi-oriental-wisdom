import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;
const publicFallback = new URL("../../docs/index.html", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the public experience shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, /<html[^>]+lang="zh-CN"/i);
  assert.match(html, /<title>艺｜东方人生智慧<\/title>/i);
  assert.match(html, /正在读取本机档案/);
});

test("keeps the GitHub Pages fallback honest, complete and accessible", async () => {
  const html = await readFile(publicFallback, "utf8");
  assert.match(html, /<h1[^>]*>\s*<span>看见命局<\/span>\s*<span>读懂时运<\/span>\s*<\/h1>/i);
  assert.match(html, /阳历/);
  assert.match(html, /农历/);
  assert.match(html, /不知道时辰/);
  assert.match(html, /专业结论/);
  assert.match(html, /理论依据/);
  assert.match(html, /传统文化体验与自我观察参考/);
  assert.match(html, /<nav[^>]+aria-label="结果分区"/i);
  assert.match(html, /<main\b/i);
  assert.match(html, /href="https:\/\/yi-oriental-wisdom\.dengsan721\.chatgpt\.site"[^>]*>\s*开始排盘（进入在线产品）/);
  assert.match(html, /此静态页面只说明报告结构/);
  assert.doesNotMatch(html, /Demo|演示版|测试版|购买|¥|￥|365元/);
  assert.doesNotMatch(html, /李叔同|曾国藩|南怀瑾|倪海厦|东方命理全景推演/);
  assert.doesNotMatch(html, /您的命局|你的命局|日主为|喜用神为/);
});
