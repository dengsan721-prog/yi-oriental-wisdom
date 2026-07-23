import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { YiExperience } from "../../components/yi/YiExperience";

const siteRoot = new URL("../../", import.meta.url);
const readOptional = (url: URL) => readFile(url).catch(() => Buffer.alloc(0));

describe("public intro first frame", () => {
  it("shows only the ritual identity while local storage is being restored", () => {
    const html = renderToStaticMarkup(createElement(YiExperience));

    expect(html).toContain('aria-label="命"');
    expect(html).toContain('data-code-point="U+547D"');
    expect(html).toContain("看见命局");
    expect(html).toContain("读懂时运");
    expect(html).toContain("开始排盘");
    expect(html).not.toContain("建立出生坐标");
    expect(html).not.toContain("请确认出生信息");
    expect(html).not.toContain("正在读取本机档案");
    expect(html).not.toMatch(/<(?:p|small)\b/);
  });

  it("renders five staggered outward rings with a static two-ring reduced-motion treatment", async () => {
    const [css, html] = await Promise.all([
      readFile(new URL("app/globals.css", siteRoot), "utf8"),
      Promise.resolve(renderToStaticMarkup(createElement(YiExperience))),
    ]);
    const ringClasses = html.match(/class="mark-ring r[1-5]"/g) ?? [];
    const ringRule = css.match(/\.mark-ring\{[^}]*\}/)?.[0] ?? "";
    const durationSeconds = Number(
      /animation:\s*yi-ring-outward\s+([\d.]+)s/.exec(ringRule)?.[1],
    );
    const reducedMotion = css.match(/@media\(prefers-reduced-motion:reduce\)\{\.mark-ring[\s\S]*?\}\}/)?.[0] ?? "";

    expect(ringClasses).toHaveLength(5);
    expect(durationSeconds).toBeGreaterThanOrEqual(4.5);
    expect(durationSeconds).toBeLessThanOrEqual(5.5);
    for (let index = 1; index <= 5; index += 1) {
      expect(css).toMatch(new RegExp(`\\.mark-ring\\.r${index}\\{animation-delay:-?${index - 1}s\\}`));
    }
    expect(ringRule).toContain("pointer-events:none");
    expect(ringRule).not.toMatch(/rotate|rotation/i);
    const keyframes = /@keyframes yi-ring-outward\{0%\{transform:scale\([^)]*\);opacity:0\}[\s\S]*?100%\{transform:scale\([^)]*\);opacity:0\}\}/.exec(css)?.[0] ?? "";
    expect(keyframes).not.toBe("");
    expect(keyframes).not.toMatch(/rotate/i);
    expect(reducedMotion).toContain(".mark-ring{animation:none");
    expect(reducedMotion).toContain(".mark-ring.r3,.mark-ring.r4,.mark-ring.r5{display:none}");
    expect(reducedMotion).toMatch(/\.mark-ring\.r1,.mark-ring\.r2\{[^}]*display:block[^}]*opacity:\.[12][^}]*\}/);
    expect(reducedMotion).not.toMatch(/rotate|flash/i);
    expect(css).not.toContain("yi-breathe");
    expect(css).not.toContain(".yi-breath-ring");
  });

  it("ships byte-identical audited U+547D lishu vectors without a device-font dependency", async () => {
    const publicAuditUrl = new URL("public/fonts/yi-lishu-u547d-source-audit.json", siteRoot);
    const docsAuditUrl = new URL("../docs/fonts/yi-lishu-u547d-source-audit.json", siteRoot);
    const publicSvgUrl = new URL("public/fonts/yi-lishu-u547d.svg", siteRoot);
    const docsSvgUrl = new URL("../docs/fonts/yi-lishu-u547d.svg", siteRoot);
    const licenseUrl = new URL("public/fonts/OFL-1.1.rtf", siteRoot);
    const readmeUrl = new URL("public/fonts/README.md", siteRoot);
    const cssUrl = new URL("app/globals.css", siteRoot);
    const [publicAuditBytes, docsAuditBytes, publicSvgBytes, docsSvgBytes, license, readme, css] = await Promise.all([
      readOptional(publicAuditUrl),
      readOptional(docsAuditUrl),
      readOptional(publicSvgUrl),
      readOptional(docsSvgUrl),
      readFile(licenseUrl, "utf8"),
      readFile(readmeUrl, "utf8"),
      readFile(cssUrl, "utf8"),
    ]);
    expect(publicAuditBytes.byteLength).toBeGreaterThan(0);
    expect(docsAuditBytes.byteLength).toBeGreaterThan(0);
    expect(publicSvgBytes.byteLength).toBeGreaterThan(0);
    expect(docsSvgBytes.byteLength).toBeGreaterThan(0);
    const audit = JSON.parse(publicAuditBytes.toString("utf8")) as {
      glyph: string;
      codePoint: string;
      style: string;
      rendering: string;
      outlineSha256: string;
      finalSvgSha256: string;
      verifiedAt: string;
      source: {
        project: string;
        repository: string;
        release: string;
        commit: string;
        archiveUrl: string;
        archiveSha256: string;
        license: string;
        licenseFile: string;
        licenseSha256: string;
      };
      coverage: {
        matchingGlyphRecords: number;
        recordUuid: string;
        componentCount: number;
      };
      generation: {
        application: string;
        targetStyle: string;
        parameters: {
          weight: number;
          startStyle: number;
          startValue: number;
          turnStyle: number;
          turnValue: number;
          weightVariation: number;
          bend: number;
        };
        exportWorkflow: string[];
      };
      output: {
        viewBox: string;
        pathCount: number;
        textCount: number;
        rawExportSha256: string;
        glyphPathSha256: string;
      };
      review: {
        reviewerRole: string;
        reviewerDate: string;
        renderingNote: string;
      };
    };
    const publicSvg = publicSvgBytes.toString("utf8");
    const docsSvg = docsSvgBytes.toString("utf8");
    const html = renderToStaticMarkup(createElement(YiExperience));
    const renderedPath = html.match(/<path\b[^>]*\bd="([^"]+)"[^>]*(?:><\/path>|\/>)/)?.[1] ?? "";
    const publicOpeningTag = publicSvg.match(/<svg\b[^>]*>/)?.[0] ?? "";
    const publicPaths = [...publicSvg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)];
    const docsPaths = [...docsSvg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)];
    const normalizedOutlineHash = createHash("sha256").update(publicPaths[0]?.[1] ?? "").digest("hex");

    expect(audit).toMatchObject({
      glyph: "命",
      codePoint: "U+547D",
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
      generation: {
        application: "FontPlayer v0.4.1",
        targetStyle: "字玩标准隶书（仅笔画）",
        parameters: {
          weight: 50,
          startStyle: 1,
          startValue: 2,
          turnStyle: 1,
          turnValue: 2,
          weightVariation: 0,
          bend: 1,
        },
      },
      output: {
        viewBox: "0 0 1000 1000",
        pathCount: 1,
        textCount: 0,
      },
    });
    expect(html).toContain('aria-label="命"');
    expect(html).toContain('data-code-point="U+547D"');
    expect(publicOpeningTag).toContain('data-code-point="U+547D"');
    expect(publicPaths).toHaveLength(1);
    expect(docsPaths).toHaveLength(1);
    expect(publicPaths[0]?.[1]?.length).toBeGreaterThan(100);
    expect(publicSvg).not.toMatch(/<text\b|<style\b|\bstyle\s*=|font-family/i);
    expect(publicSvg).not.toMatch(/\b(?:href|src)\s*=/i);
    expect(docsSvg).not.toMatch(/<text\b|<style\b|\bstyle\s*=|font-family/i);
    expect(docsSvg).not.toMatch(/\b(?:href|src)\s*=/i);
    expect(publicSvgBytes.equals(docsSvgBytes)).toBe(true);
    expect(publicAuditBytes.equals(docsAuditBytes)).toBe(true);
    expect(createHash("sha256").update(publicSvgBytes).digest("hex")).toBe(audit.finalSvgSha256);
    expect(publicPaths[0]?.[1]).toBe(docsPaths[0]?.[1]);
    expect(publicPaths[0]?.[1]).toBe(renderedPath);
    expect(normalizedOutlineHash).toBe(audit.outlineSha256);
    expect(normalizedOutlineHash).toBe(audit.output.glyphPathSha256);
    expect(audit.source.commit).toMatch(/^[a-f0-9]{40}$/);
    expect(audit.source.archiveUrl).toBe("https://github.com/HiToysMaker/fontplayer/releases/download/v0.4.1/template.zip");
    expect(audit.source.license).toMatch(/SIL Open Font License 1\.1/i);
    expect(audit.source.licenseFile).toBe("OFL-1.1.rtf");
    expect(audit.source.licenseSha256).toBe("b3131d001ec1c5b140a7e065dc9d7ad0b7cb68e1414db7eb60277bdb5191d7a4");
    expect(audit.coverage.recordUuid).not.toBe("");
    expect(audit.coverage.componentCount).toBeGreaterThan(0);
    expect(audit.generation.exportWorkflow).toHaveLength(7);
    expect(audit.generation.exportWorkflow.join("\n")).toContain("ming-u547d-fontplayer-raw.svg");
    expect(audit.output.rawExportSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(audit.output.glyphPathSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(audit.review.reviewerRole).not.toBe("");
    expect(audit.review.reviewerDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(audit.review.renderingNote).toMatch(/desktop/i);
    expect(audit.review.renderingNote).toContain("390px");
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(readme).toContain("隶书“命”字形");
    expect(readme).toContain("U+547D");
    expect(readme.toLowerCase()).toContain(audit.outlineSha256);
    expect(css).not.toMatch(/@font-face|font-family:\s*["']Yi Zhongshan Seal|JFZSKSealScript/i);
    expect(css.match(/\.yi-brand-glyph\{[^}]*\}/)?.[0] ?? "").toMatch(/filter:[^}]*var\(--yi-accent\)/);
    expect(css).not.toMatch(/#d4a83d|#8b641f/i);
    expect(html.match(/<svg[^>]*class="yi-brand-glyph"[^>]*data-code-point="U\+547D"[^>]*>/g)).toHaveLength(1);
    expect(html).toMatch(/<path d="[^"]{100,}" fill="currentColor"(?:><\/path>|\/>)/);
    expect(html).not.toContain(">命<");
  });
});
