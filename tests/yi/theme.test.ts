import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { FourPillarsResult } from "../../lib/yi/types";

function chart(element: "木" | "火" | "土" | "金" | "水"): FourPillarsResult {
  const dayStem = { 木: "甲", 火: "丙", 土: "戊", 金: "庚", 水: "壬" }[element];
  return {
    pillars: {
      year: { stem: "甲", branch: "子", element: "木", branchElement: "水", label: "年柱" },
      month: { stem: "丙", branch: "寅", element: "火", branchElement: "木", label: "月柱" },
      day: { stem: dayStem, branch: "辰", element, branchElement: "土", label: "日柱" },
      hour: null,
    },
    elementCounts: { 木: 2, 火: 1, 土: 2, 金: 0, 水: 1 },
    professional: {
      dayMaster: { stem: dayStem, element, polarity: "yang" },
      structureBalance: "mixed",
      supportScore: 0,
      observationConfidence: "limited",
      pattern: "",
      climate: "",
      sameAndResourceElements: [],
      lowerCountElements: [],
      tenGods: [],
      relations: [],
      ambiguousFields: [],
    },
    ambiguousPillars: [],
    confidence: "medium",
    disclaimer: "",
  };
}

describe("deriveYiThemeElement", () => {
  it.each(["木", "火", "土", "金", "水"] as const)(
    "uses the unambiguous %s day master",
    (element) => expect(deriveYiThemeElement(chart(element))).toBe(element),
  );

  it("falls back to neutral without a chart", () => {
    expect(deriveYiThemeElement(null)).toBe("neutral");
  });

  it("falls back when day-pillar evidence is ambiguous", () => {
    const input = chart("水");
    input.ambiguousPillars = ["day"];
    expect(deriveYiThemeElement(input)).toBe("neutral");
  });

  it.each(["dayMaster", "dayPillar"] as const)(
    "falls back when %s is ambiguous",
    (field) => {
      const input = chart("金");
      input.professional.ambiguousFields = [field];
      expect(deriveYiThemeElement(input)).toBe("neutral");
    },
  );

  it("sets a derived root theme without persisting it", () => {
    const source = readFileSync(new URL("../../components/yi/YiExperience.tsx", import.meta.url), "utf8");
    expect(source).toContain("data-element={themeElement}");
    expect(source).not.toMatch(/themeElement\s*:/);
  });
});

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

const requiredTokens = [
  "--yi-bg", "--yi-surface", "--yi-surface-raised", "--yi-text",
  "--yi-text-muted", "--yi-line", "--yi-accent", "--yi-accent-strong",
  "--yi-accent-soft", "--yi-gold", "--yi-danger", "--yi-success", "--yi-focus",
] as const;

function rule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...css.matchAll(new RegExp(`${escaped}\\{([^}]*)\\}`, "g"))];
  const match = matches.at(-1);
  expect(match, `${selector} rule`).toBeTruthy();
  return match?.[1] ?? "";
}

function value(block: string, token: string) {
  const match = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`));
  expect(match, `${token} literal`).toBeTruthy();
  return match?.[1] ?? "#000000";
}

function contrast(first: string, second: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
    const [red, green, blue] = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("light five-element CSS contract", () => {
  it("defines a neutral foundation and every day-master theme", () => {
    for (const token of requiredTokens) expect(css).toContain(token);
    for (const element of ["neutral", "木", "火", "土", "金", "水"]) {
      expect(css).toContain(`data-element="${element}"`);
    }
  });

  it("uses semantic tokens in page surfaces and core controls", () => {
    for (const selector of [
      "main[data-element]",
      ".primary-button,.primary",
      "main[data-element] input:focus,main[data-element] select:focus",
      ".picker-sheet,.save-home-dialog",
      ".result-shell,.life-home",
      ".reading-card,.mirror-candidate,.life-grid button,.life-panel article",
    ]) {
      expect(rule(selector)).toContain("var(--yi-");
    }
  });

  it("tokenizes every name-analysis surface family instead of leaving dark descendants", () => {
    for (const selector of [
      ".name-character-card",
      ".name-character-card>header>div",
      ".name-choice-group",
      ".name-reality-grid fieldset",
      ".name-risk-review",
      ".name-chart-comparison article",
      ".name-directions article",
      ".name-sources",
      ".same-name-exit",
    ]) {
      const surface = rule(selector);
      expect(surface, selector).toContain("border-color:var(--yi-line)");
      expect(surface, selector).toMatch(/background:var\(--yi-surface(?:-raised)?\)/);
      expect(surface, selector).toContain("color:var(--yi-text)");
      expect(surface).not.toMatch(/#(?:081923|151a1d|0b1d28|102631)/i);
    }
  });

  it("pairs every visible name-analysis foreground, button, and divider with light tokens", () => {
    const foregrounds: [string, string, string][] = [
      [".name-analysis-loading button", "background:var(--yi-surface-raised)", "color:var(--yi-accent-strong)"],
      [".name-current-glyphs", "color:var(--yi-text)", "overflow-wrap:anywhere"],
      [".name-mode-switch button", "background:var(--yi-surface-raised)", "color:var(--yi-accent-strong)"],
      [".name-summary-translation p", "background:var(--yi-surface)", "color:var(--yi-text-muted)"],
      [".name-analysis-summary dl", "background:var(--yi-surface-raised)", "border-color:var(--yi-line)"],
      [".name-analysis-summary dl>div", "background:var(--yi-surface)", "border-color:var(--yi-line)"],
      [".name-analysis-depth>summary", "background:var(--yi-surface-raised)", "color:var(--yi-accent-strong)"],
      [".name-choice-group>label", "background:var(--yi-surface)", "color:var(--yi-text)"],
      [".name-character-evidence>div", "border-color:var(--yi-line)", "background:var(--yi-surface)"],
      [".name-source-links li", "border-color:var(--yi-line)", "background:var(--yi-surface)"],
      [".name-source-links a", "color:var(--yi-accent-strong)", "min-height:44px"],
      [".same-name-exit button", "background:var(--yi-surface-raised)", "color:var(--yi-accent-strong)"],
      [".name-summary-boundary", "border-color:var(--yi-line)", "color:var(--yi-text-muted)"],
      [".name-analysis-depth[open]>summary", "border-color:var(--yi-line)", "color:var(--yi-accent-strong)"],
    ];

    for (const [selector, first, second] of foregrounds) {
      const declaration = rule(selector);
      expect(declaration, selector).toContain(first);
      expect(declaration, selector).toContain(second);
      expect(declaration, selector).not.toMatch(/#(?:d9c693|eadcad|bdc8cc|8298a2|ffffff0)/i);
    }

    expect(rule(".same-name-exit button")).toContain("border-color:var(--yi-accent)");
  });

  it("keeps text, button, focus, and accent boundaries accessible", () => {
    const foundation = rule("main[data-element]");
    const background = value(foundation, "--yi-bg");
    expect(contrast(value(foundation, "--yi-text"), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(foundation, "--yi-text-muted"), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(foundation, "--yi-focus"), background)).toBeGreaterThanOrEqual(3);
    expect(contrast(value(foundation, "--yi-focus"), value(foundation, "--yi-surface"))).toBeGreaterThanOrEqual(3);
    expect(contrast(value(foundation, "--yi-focus"), value(foundation, "--yi-surface-raised"))).toBeGreaterThanOrEqual(3);
    expect(contrast(value(foundation, "--yi-text"), value(foundation, "--yi-surface-raised"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value(foundation, "--yi-text-muted"), value(foundation, "--yi-surface-raised"))).toBeGreaterThanOrEqual(4.5);

    for (const element of ["neutral", "木", "火", "土", "金", "水"]) {
      const theme = rule(`main[data-element="${element}"]`);
      const accent = value(theme, "--yi-accent");
      const accentStrong = value(theme, "--yi-accent-strong");
      expect(contrast("#ffffff", accent), element).toBeGreaterThanOrEqual(4.5);
      expect(contrast(accent, background), element).toBeGreaterThanOrEqual(3);
      expect(contrast(accentStrong, value(foundation, "--yi-surface-raised")), element).toBeGreaterThanOrEqual(4.5);
      expect(contrast(accent, value(foundation, "--yi-surface-raised")), element).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps fixed element semantics outside day-master themes", () => {
    const foundation = rule("main[data-element]");
    for (const token of ["wood", "fire", "earth", "metal", "water"]) {
      expect(value(foundation, `--yi-element-${token}`)).toMatch(/^#[0-9a-f]{6}$/i);
      expect(css.match(new RegExp(`--yi-element-${token}:`, "g"))).toHaveLength(1);
    }
  });

  it("preserves keyboard visibility, touch targets, and compact report title rhythm", () => {
    expect(rule("main[data-element] :focus-visible")).toContain("outline:3px solid var(--yi-focus)");
    expect(rule("main[data-element] input:focus,main[data-element] select:focus")).not.toMatch(/outline\s*:\s*0/);
    expect(rule("main[data-element] input:focus-visible,main[data-element] select:focus-visible")).toContain("outline:3px solid var(--yi-focus)");
    expect(rule(".primary-button,.secondary-button,.primary,.report-nav button,.result-tabs button,.life-nav button")).toContain("min-height:44px");
    expect(rule(".report-document-title h1")).toContain('font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif');
    expect(rule(".report-document-title h1")).toContain("white-space:nowrap");
    expect(rule(".report-document-title h1")).toContain("text-overflow:ellipsis");
  });

  it("raises dense report copy into readable hierarchy cards", () => {
    expect(rule("body")).toContain('font-family:var(--yi-sans)');
    expect(rule(":root")).toContain('--yi-sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif');
    expect(rule(":root")).toContain('--yi-serif:"STKaiti","KaiTi","Kaiti SC","Songti SC","Noto Serif CJK SC",serif');
    expect(rule("main[data-element]")).toContain("font-family:var(--yi-sans)");
    expect(rule(".report-section>header h1")).toContain("font-weight:500");
    expect(rule(".readability-copy")).toContain("font-size:15px");
    expect(rule(".readability-copy")).toContain("line-height:1.85");
    expect(rule(".name-reference-summary")).toContain("background:linear-gradient");
    expect(rule(".name-reference-score strong")).toContain("font-size:clamp(42px,8vw,70px)");
    expect(rule(".plain-translation p,.chart-narrative-beat p,.chart-micro-story p")).toContain("font-size:15px");
    expect(rule(".professional-reading-copy")).toContain("font-size:15px");
    expect(rule(".detail-report .reading-card h2")).toContain("font-weight:650");
  });

  it("keeps the save confirmation compact and legible on mobile", () => {
    expect(css).toMatch(/\.save-home-dialog\{[^}]*width:min\(520px,calc\(100% - 28px\)\)[^}]*padding:18px/);
    expect(css).toMatch(/\.save-home-dialog p\{[^}]*font-size:13px[^}]*line-height:1\.65/);
    expect(css).toContain("@media(max-width:520px){.save-home-overlay{align-items:start;padding-top:10vh}.save-home-dialog{width:min(360px,calc(100% - 28px));padding:16px;border-radius:20px}.save-home-actions{grid-template-columns:1fr}.save-home-actions button{min-height:46px}}");
  });

  it("uses a stronger mobile typography system instead of thin serif defaults", () => {
    expect(css).toContain("@media(max-width:520px){main[data-element] :where(.result-shell,.life-home,.intake){font-size:16px;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}.report-section>header h1,.life-purpose h1,.life-change-dashboard h1{font-family:var(--yi-serif);font-weight:650;letter-spacing:0}.report-section>header p,.waterfall-card p,.reading-card p,.life-purpose p,.life-change-dashboard p,.name-reference-grid p,.name-classic-suggestions p{font-family:var(--yi-sans);font-size:16px;line-height:1.85}.result-tabs button,.result-head-actions button,.life-head button,.life-daily-form label{font-family:var(--yi-sans);font-size:15px;font-weight:650}.waterfall-card>summary h2,.name-reference-grid h3,.name-classic-suggestions h4{font-weight:700}.adopted-facts,.result-tabs-guide span{font-size:13px}}");
  });

  it("keeps traditional atlas selection text readable on light surfaces", () => {
    expect(rule(".atlas-methods button,.atlas-options button")).toContain("background:var(--yi-surface-raised)");
    expect(rule(".atlas-methods button,.atlas-options button")).toContain("color:var(--yi-text)");
    expect(rule(".atlas-methods button small,.atlas-options button small")).toContain("color:var(--yi-text-muted)");
    expect(rule(".atlas-methods button.active,.atlas-options button.active")).toContain("background:var(--yi-accent-soft)");
    expect(rule(".atlas-methods button.active,.atlas-options button.active")).toContain("color:var(--yi-accent-strong)");
  });
});
