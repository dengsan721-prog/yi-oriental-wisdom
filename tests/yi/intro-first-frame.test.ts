import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { YiExperience } from "../../components/yi/YiExperience";

const siteRoot = new URL("../../", import.meta.url);

function getCmapRecords(font: Uint8Array) {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tableCount = view.getUint16(4);
  let cmapOffset = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const offset = 12 + index * 16;
    if (view.getUint32(offset) === 0x636d6170) cmapOffset = view.getUint32(offset + 8);
  }
  if (cmapOffset < 0) return [];

  const encodingCount = view.getUint16(cmapOffset + 2);
  return Array.from({ length: encodingCount }, (_, index) => {
    const recordOffset = cmapOffset + 4 + index * 8;
    const subtableOffset = cmapOffset + view.getUint32(recordOffset + 4);
    return {
      platformId: view.getUint16(recordOffset),
      encodingId: view.getUint16(recordOffset + 2),
      format: view.getUint16(subtableOffset),
    };
  });
}

function cmapHasCodePoint(font: Uint8Array, codePoint: number) {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tableCount = view.getUint16(4);
  let cmapOffset = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const offset = 12 + index * 16;
    if (view.getUint32(offset) === 0x636d6170) cmapOffset = view.getUint32(offset + 8);
  }
  if (cmapOffset < 0) return false;

  const encodingCount = view.getUint16(cmapOffset + 2);
  for (let index = 0; index < encodingCount; index += 1) {
    const subtableOffset = cmapOffset + view.getUint32(cmapOffset + 4 + index * 8 + 4);
    const format = view.getUint16(subtableOffset);
    if (format === 4 && codePoint <= 0xffff) {
      const segmentCount = view.getUint16(subtableOffset + 6) / 2;
      const endCodes = subtableOffset + 14;
      const startCodes = endCodes + segmentCount * 2 + 2;
      const deltas = startCodes + segmentCount * 2;
      const rangeOffsets = deltas + segmentCount * 2;
      for (let segment = 0; segment < segmentCount; segment += 1) {
        const start = view.getUint16(startCodes + segment * 2);
        const end = view.getUint16(endCodes + segment * 2);
        if (codePoint < start || codePoint > end) continue;
        const delta = view.getInt16(deltas + segment * 2);
        const rangeOffset = view.getUint16(rangeOffsets + segment * 2);
        if (rangeOffset === 0) return ((codePoint + delta) & 0xffff) !== 0;
        const glyphOffset = rangeOffsets + segment * 2 + rangeOffset + (codePoint - start) * 2;
        const glyph = view.getUint16(glyphOffset);
        return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
      }
    }
    if (format === 12) {
      const groupCount = view.getUint32(subtableOffset + 12);
      for (let group = 0; group < groupCount; group += 1) {
        const groupOffset = subtableOffset + 16 + group * 12;
        const start = view.getUint32(groupOffset);
        const end = view.getUint32(groupOffset + 4);
        if (codePoint >= start && codePoint <= end) return view.getUint32(groupOffset + 8) !== 0;
      }
    }
  }
  return false;
}

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

  it("locally hosts the licensed Zhongshan seal glyph used by the first frame", async () => {
    const fontUrl = new URL("public/fonts/JFZSKSealScript_V3.5.ttf", siteRoot);
    const licenseUrl = new URL("public/fonts/OFL.txt", siteRoot);
    const readmeUrl = new URL("public/fonts/README.md", siteRoot);
    const cssUrl = new URL("app/globals.css", siteRoot);
    const [fontInfo, font, license, readme, css] = await Promise.all([
      stat(fontUrl),
      readFile(fontUrl),
      readFile(licenseUrl, "utf8"),
      readFile(readmeUrl, "utf8"),
      readFile(cssUrl, "utf8"),
    ]);
    const html = renderToStaticMarkup(createElement(YiExperience));

    expect(fontInfo.size).toBeGreaterThan(10_000);
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family\s*:\s*["']Yi Zhongshan Seal["'][^}]*JFZSKSealScript_V3\.5\.ttf[^}]*font-display\s*:\s*swap[^}]*\}/);
    expect(css).toMatch(/\.yi-brand-glyph\s*\{[^}]*font-family\s*:\s*["']Yi Zhongshan Seal["'][^}]*serif[^}]*\}/);
    expect(html.match(/<span class="yi-brand-glyph">艺<\/span>/g)).toHaveLength(1);
    expect(getCmapRecords(font)).toEqual([
      { platformId: 0, encodingId: 3, format: 4 },
      { platformId: 1, encodingId: 0, format: 0 },
      { platformId: 3, encodingId: 1, format: 4 },
    ]);
    expect(readme).toContain("Cmap record formats: `4` and `0`");
    expect(readme).toContain("U+827A resolves through format `4`");
    expect(readme).not.toMatch(/formats?\s+4\s+and\s+12/i);
    expect(cmapHasCodePoint(font, 0x827a)).toBe(true);
  });
});
