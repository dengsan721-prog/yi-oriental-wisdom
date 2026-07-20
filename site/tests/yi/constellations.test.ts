import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConstellationMap } from "../../components/yi/ConstellationMap";
import { CONSTELLATIONS, ZODIAC_SIGNS, type ZodiacSign } from "../../lib/yi/constellations";

const expectedSigns = [
  ["aries", "♈", "白羊座", "Aries"],
  ["taurus", "♉", "金牛座", "Taurus"],
  ["gemini", "♊", "双子座", "Gemini"],
  ["cancer", "♋", "巨蟹座", "Cancer"],
  ["leo", "♌", "狮子座", "Leo"],
  ["virgo", "♍", "处女座", "Virgo"],
  ["libra", "♎", "天秤座", "Libra"],
  ["scorpio", "♏", "天蝎座", "Scorpio"],
  ["sagittarius", "♐", "射手座", "Sagittarius"],
  ["capricorn", "♑", "摩羯座", "Capricorn"],
  ["aquarius", "♒", "水瓶座", "Aquarius"],
  ["pisces", "♓", "双鱼座", "Pisces"],
] as const satisfies readonly (readonly [ZodiacSign, string, string, string])[];

function countElements(markup: string, tag: string): number {
  return markup.match(new RegExp(`<${tag}(?:\\s|>)`, "g"))?.length ?? 0;
}

describe("black-gold constellations", () => {
  it("ships the exact twelve signs and independent names and glyphs", () => {
    const expectedOrder = expectedSigns.map(([sign]) => sign);

    expect(ZODIAC_SIGNS).toEqual(expectedOrder);
    expect(Object.keys(CONSTELLATIONS).sort()).toEqual([...expectedOrder].sort());
    expect(expectedSigns.map(([sign]) => ({
      sign: CONSTELLATIONS[sign].sign,
      glyph: CONSTELLATIONS[sign].glyph,
      chineseName: CONSTELLATIONS[sign].chineseName,
      englishName: CONSTELLATIONS[sign].englishName,
    }))).toEqual(expectedSigns.map(([sign, glyph, chineseName, englishName]) => ({
      sign,
      glyph,
      chineseName,
      englishName,
    })));
  });

  it("keeps every map within the complete visual contract", () => {
    for (const sign of ZODIAC_SIGNS) {
      const map = CONSTELLATIONS[sign];
      expect(map.nodes.length, sign).toBeGreaterThanOrEqual(6);
      expect(map.nodes.length, sign).toBeLessThanOrEqual(14);
      expect(map.edges.length, sign).toBeGreaterThanOrEqual(5);
      expect(map.edges.length, sign).toBeLessThanOrEqual(15);
      expect([2, 3], sign).toContain(map.nodes.filter((node) => node.primary).length);

      for (const node of map.nodes) {
        expect(node.x, sign).toBeGreaterThanOrEqual(5);
        expect(node.x, sign).toBeLessThanOrEqual(95);
        expect(node.y, sign).toBeGreaterThanOrEqual(5);
        expect(node.y, sign).toBeLessThanOrEqual(95);
        expect(node.radius, sign).toBeGreaterThan(0);
        expect(node.radius, sign).toBeLessThanOrEqual(3);
      }
      expect(map.label.x, sign).toBeGreaterThanOrEqual(5);
      expect(map.label.x, sign).toBeLessThanOrEqual(95);
      expect(map.label.y, sign).toBeGreaterThanOrEqual(5);
      expect(map.label.y, sign).toBeLessThanOrEqual(95);
    }
  });

  it("uses valid connected graphs without duplicate edges or idle nodes", () => {
    for (const sign of ZODIAC_SIGNS) {
      const map = CONSTELLATIONS[sign];
      const edgeKeys = new Set<string>();
      const participants = new Set<number>();
      const neighbours = Array.from({ length: map.nodes.length }, () => new Set<number>());

      for (const [from, to] of map.edges) {
        expect(Number.isInteger(from), sign).toBe(true);
        expect(Number.isInteger(to), sign).toBe(true);
        expect(from, sign).toBeGreaterThanOrEqual(0);
        expect(to, sign).toBeGreaterThanOrEqual(0);
        expect(from, sign).toBeLessThan(map.nodes.length);
        expect(to, sign).toBeLessThan(map.nodes.length);
        expect(from, sign).not.toBe(to);

        const key = [from, to].sort((left, right) => left - right).join(":");
        expect(edgeKeys.has(key), `${sign}:${key}`).toBe(false);
        edgeKeys.add(key);
        participants.add(from);
        participants.add(to);
        neighbours[from].add(to);
        neighbours[to].add(from);
      }

      expect(participants.size, sign).toBe(map.nodes.length);
      const visited = new Set<number>([0]);
      const pending = [0];
      while (pending.length) {
        const current = pending.shift()!;
        for (const next of neighbours[current]) {
          if (visited.has(next)) continue;
          visited.add(next);
          pending.push(next);
        }
      }
      expect(visited.size, sign).toBe(map.nodes.length);
    }
  });

  it("gives all twelve maps distinct geometry and label anchors", () => {
    const signatures = ZODIAC_SIGNS.map((sign) => JSON.stringify({
      nodes: CONSTELLATIONS[sign].nodes,
      edges: CONSTELLATIONS[sign].edges,
    }));
    const labels = ZODIAC_SIGNS.map((sign) => JSON.stringify(CONSTELLATIONS[sign].label));

    expect(new Set(signatures).size).toBe(12);
    expect(new Set(labels).size).toBe(12);
  });

  it.each(expectedSigns)("renders %s deterministically with exact SVG geometry", (sign) => {
    const map = CONSTELLATIONS[sign];
    const first = renderToStaticMarkup(createElement(ConstellationMap, { sign }));
    const second = renderToStaticMarkup(createElement(ConstellationMap, { sign }));

    expect(first).toBe(second);
    expect(first).toContain('class="constellation-map"');
    expect(first).toContain('viewBox="0 0 100 100"');
    expect(countElements(first, "line")).toBe(map.edges.length);
    expect(countElements(first, "circle")).toBe(18 + map.nodes.length);
    expect(first.match(/class="primary"/g)?.length ?? 0).toBe(
      map.nodes.filter((node) => node.primary).length,
    );
    expect(first).toContain(`>${map.glyph}</text>`);
  });

  it("exposes informative maps and hides decorative maps from assistive technology", () => {
    const informative = renderToStaticMarkup(createElement(ConstellationMap, { sign: "aries" }));
    const decorative = renderToStaticMarkup(createElement(ConstellationMap, {
      sign: "aries",
      decorative: true,
    }));

    expect(informative).toContain('role="img"');
    expect(informative).toContain('aria-label="白羊座金色星座连线图"');
    expect(informative).not.toContain("aria-hidden");
    expect(decorative).not.toContain('role="img"');
    expect(decorative).not.toContain("aria-label");
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).toContain('focusable="false"');
  });

  it("defines scoped black-gold drawing and a static reduced-motion state", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.constellation-map\s*\{[^}]*background:[^}]*radial-gradient[^}]*#050708/);
    expect(css).toMatch(/\.constellation-lines line\s*\{[^}]*stroke:#d9b75f[^}]*stroke-dasharray:120[^}]*animation:constellation-draw 1\.4s/);
    expect(css).toMatch(/\.constellation-stars circle\s*\{[^}]*fill:#e4c56e/);
    expect(css).toMatch(/\.constellation-stars circle\.primary\s*\{[^}]*fill:#fff0b1/);
    expect(css).toMatch(/\.constellation-dust circle\s*\{[^}]*fill:#d8c58c/);
    expect(css).toMatch(/@keyframes constellation-draw\s*\{/);
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.constellation-lines line\s*\{[^}]*animation:none[^}]*stroke-dasharray:none/,
    );
  });

  it("contains no bitmap, upload, camera or recognition path", () => {
    const source = [
      "../../lib/yi/constellations.ts",
      "../../components/yi/ConstellationMap.tsx",
    ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

    expect(source).not.toMatch(
      /\.webp|\.png|\.jpe?g|<img|new Image|upload|camera|recognition|biometric|type=["']file|getUserMedia|mediaDevices|上传|相机|摄像头|识别|生物特征/i,
    );
  });
});
