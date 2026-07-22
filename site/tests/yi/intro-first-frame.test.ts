import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { YiExperience } from "../../components/yi/YiExperience";

const siteRoot = new URL("../../", import.meta.url);

describe("public intro first frame", () => {
  it("shows only the ritual identity while local storage is being restored", () => {
    const html = renderToStaticMarkup(createElement(YiExperience));

    expect(html).toContain('aria-label="艺"');
    expect(html).toContain("看见命局");
    expect(html).toContain("读懂时运");
    expect(html).toContain("开始排盘");
    expect(html).not.toContain("建立出生坐标");
    expect(html).not.toContain("请确认出生信息");
    expect(html).not.toContain("正在读取本机档案");
    expect(html).not.toMatch(/<(?:p|small)\b/);
  });

  it("renders an accessible five-layer outward gold ring treatment", async () => {
    const [css, html] = await Promise.all([
      readFile(new URL("app/globals.css", siteRoot), "utf8"),
      Promise.resolve(renderToStaticMarkup(createElement(YiExperience))),
    ]);
    const orbit = html.match(/<div class="yi-brand-orbit yi-mark" role="img" aria-label="艺">([\s\S]*?)<\/div>/)?.[0] ?? "";
    const rings = orbit.match(/<i class="yi-breath-ring" aria-hidden="true" style="--ring-index:\d"><\/i>/g) ?? [];
    const ringRule = css.match(/\.yi-breath-ring\{[^}]*\}/)?.[0] ?? "";

    expect(orbit).toMatch(/<svg class="yi-brand-glyph" aria-hidden="true" viewBox="0 0 1000 1000" data-code-point="U\+827A"[^>]*>/);
    expect(rings).toHaveLength(5);
    expect(ringRule).toMatch(/^\.yi-breath-ring\{[^}]*pointer-events:none[^}]*animation:yi-ring-outward 5s cubic-bezier\(\.22,\.55,\.28,1\) infinite[^}]*animation-delay:calc\(var\(--ring-index\) \* 1s\)[^}]*\}$/);
    expect(ringRule).not.toMatch(/rotate|rotation/i);
    const keyframes = /@keyframes yi-ring-outward\{0%\{transform:scale\(\.72\);opacity:0\}12%\{opacity:\.66\}70%\{opacity:\.12\}100%\{transform:scale\(3\.1\);opacity:0\}\}/.exec(css)?.[0] ?? "";
    expect(keyframes).not.toBe("");
    expect(keyframes).not.toMatch(/rotate/i);
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\)\{\.yi-breath-ring\{animation:none;opacity:\.16;transform:scale\(calc\(1 \+ var\(--ring-index\) \* \.34\)\)\}\}/);
    expect(css).not.toContain("yi-breathe");
    expect(css).not.toContain(".yi-mark i,.yi-mark b");
  });

  it("ships one audited lishu vector for U+827A without a device-font dependency", async () => {
    const auditUrl = new URL("public/fonts/yi-lishu-source-audit.json", siteRoot);
    const sourceSvgUrl = new URL("public/fonts/yi-lishu-u827a.svg", siteRoot);
    const licenseUrl = new URL("public/fonts/OFL-1.1.rtf", siteRoot);
    const readmeUrl = new URL("public/fonts/README.md", siteRoot);
    const cssUrl = new URL("app/globals.css", siteRoot);
    const [auditText, sourceSvg, license, readme, css] = await Promise.all([
      readFile(auditUrl, "utf8"),
      readFile(sourceSvgUrl, "utf8"),
      readFile(licenseUrl, "utf8"),
      readFile(readmeUrl, "utf8"),
      readFile(cssUrl, "utf8"),
    ]);
    const audit = JSON.parse(auditText) as {
      glyph: string;
      codePoint: string;
      style: string;
      rendering: string;
      outlineSha256: string;
      source: {
        project: string;
        repository: string;
        release: string;
        archiveSha256: string;
        license: string;
      };
      coverage: { matchingGlyphRecords: number };
    };
    const html = renderToStaticMarkup(createElement(YiExperience));
    const renderedPath = html.match(/<path\b[^>]*\bd="([^"]+)"[^>]*(?:><\/path>|\/>)/)?.[1] ?? "";

    expect(audit).toMatchObject({
      glyph: "艺",
      codePoint: "U+827A",
      style: "lishu",
      rendering: "inline-svg",
      source: {
        project: "FontPlayer template project",
        repository: "https://github.com/HiToysMaker/fontplayer",
        release: "v0.4.1",
        archiveSha256: "424abbce964b40bc32ee8f27d95c190f3647dff9db8881003bbc3bf6b34235ab",
        license: "SIL Open Font License 1.1",
      },
      coverage: { matchingGlyphRecords: 1 },
    });
    expect(audit.outlineSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(createHash("sha256").update(renderedPath).digest("hex")).toBe(audit.outlineSha256);
    expect(sourceSvg).toContain(`d="${renderedPath}"`);
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(readme).toContain("U+827A");
    expect(readme.toLowerCase()).toContain(audit.outlineSha256);
    expect(css).not.toMatch(/@font-face|font-family:\s*["']Yi Zhongshan Seal|JFZSKSealScript/i);
    expect(html.match(/<svg class="yi-brand-glyph"[^>]*data-code-point="U\+827A"[^>]*>/g)).toHaveLength(1);
    expect(html).toMatch(/<path fill="currentColor" d="[^"]{100,}"(?:><\/path>|\/>)/);
    expect(html).not.toContain(">艺<");
  });
});
