import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CompatibilitySection } from "../../components/yi/CompatibilitySection";
import { DetailSection } from "../../components/yi/DetailSection";
import { getCalculationSteps } from "../../components/yi/YiExperience";
import { calculateCompatibility } from "../../lib/yi/compatibility";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import type { BirthSubmission } from "../../components/yi/BirthIntake";
import type { InterpretationItem } from "../../lib/yi/types";

const priorities: InterpretationItem["priority"][] = ["core", "important", "supporting"];

function makeReading(priority: InterpretationItem["priority"]): InterpretationItem {
  return {
    id: `reading-${priority}`,
    domain: "self",
    professionalTitle: `professional-${priority}`,
    innovationTitle: `innovation-${priority}`,
    basis: `basis-${priority}`,
    traditionalJudgment: `traditional-${priority}`,
    plainLanguage: `plain-${priority}`,
    scenario: `scenario-${priority}`,
    advantageVersion: `advantage-${priority}`,
    shadowVersion: `shadow-${priority}`,
    mirror: `mirror-${priority}`,
    action: `legacy-action-${priority}`,
    actionNow: `action-now-${priority}`,
    actionLongTerm: `action-long-${priority}`,
    caution: `caution-${priority}`,
    priority,
    confidence: priority === "core" ? "high" : priority === "important" ? "medium" : "limited",
    sourceTradition: `source-tradition-${priority}`,
    sourceReferences: [`reference-a-${priority}`, `reference-b-${priority}`],
    sourceRuleIds: [`rule-${priority}`],
    pillarDependencies: ["day"],
    affectedByUnknownHour: false,
  };
}

function extractBalancedElement(markup: string, tag: string, start: number): string {
  const opening = `<${tag}`;
  const closing = `</${tag}>`;
  let cursor = start;
  let depth = 0;

  while (cursor < markup.length) {
    const nextOpening = markup.indexOf(opening, cursor);
    const nextClosing = markup.indexOf(closing, cursor);
    if (nextClosing === -1) throw new Error(`Missing ${closing}`);

    if (nextOpening !== -1 && nextOpening < nextClosing) {
      const openingEnd = markup.indexOf(">", nextOpening);
      if (openingEnd === -1) throw new Error(`Missing closing bracket for ${opening}`);
      depth += 1;
      cursor = openingEnd + 1;
      continue;
    }

    depth -= 1;
    cursor = nextClosing + closing.length;
    if (depth === 0) return markup.slice(start, cursor);
  }

  throw new Error(`Could not extract balanced ${tag}`);
}

function expectStrictOrder(markup: string, markers: string[]) {
  let previous = -1;
  for (const marker of markers) {
    const index = markup.indexOf(marker);
    expect(index, `${marker} should appear after the previous layer field`).toBeGreaterThan(previous);
    previous = index;
  }
}

function occurrences(markup: string, marker: string) {
  return markup.split(marker).length - 1;
}

it("shows only calculations the product actually performs", () => {
  expect(getCalculationSteps()).toEqual(["四柱", "五行", "藏干", "十神", "干支", "大运"]);
  expect(getCalculationSteps().join(" ")).not.toMatch(/格局|喜忌/);
});

it("renders three priority cards with four ordered progressive-reading layers", () => {
  const readings = priorities.map(makeReading);
  const html = renderToStaticMarkup(createElement(DetailSection, { items: readings }));

  expect(html.match(/<article class="reading-card reading-(?:core|important|supporting)">/g)).toHaveLength(3);

  for (const reading of readings) {
    const articleStart = html.indexOf(`<article class="reading-card reading-${reading.priority}">`);
    expect(articleStart, `${reading.priority} article`).toBeGreaterThan(-1);
    const article = extractBalancedElement(html, "article", articleStart);
    const outerDetailsStart = article.indexOf("<details>");
    expect(outerDetailsStart, `${reading.priority} outer details`).toBeGreaterThan(-1);
    const outerDetails = extractBalancedElement(article, "details", outerDetailsStart);
    expect(outerDetails.slice(0, outerDetails.indexOf(">") + 1)).toBe("<details>");

    const evidenceStart = outerDetails.indexOf('<details class="reading-evidence">');
    expect(evidenceStart, `${reading.priority} nested evidence`).toBeGreaterThan(-1);
    const evidence = extractBalancedElement(outerDetails, "details", evidenceStart);
    expect(evidence.slice(0, evidence.indexOf(">") + 1)).toBe('<details class="reading-evidence">');
    expect(outerDetails.slice(evidenceStart + evidence.length)).toBe("</details>");

    const visibleLayer = article.slice(0, outerDetailsStart);
    const deepLayer = outerDetails.slice(0, evidenceStart);
    const outsideOuterDetails = article.slice(0, outerDetailsStart) + article.slice(outerDetailsStart + outerDetails.length);
    const visibleMarkers = [reading.professionalTitle, reading.innovationTitle, reading.plainLanguage, reading.scenario];
    const deepMarkers = [
      reading.advantageVersion,
      reading.shadowVersion,
      reading.mirror,
      reading.actionNow,
      reading.actionLongTerm,
      reading.caution,
    ];
    const evidenceMarkers = [
      reading.traditionalJudgment,
      reading.basis,
      reading.sourceTradition,
      ...reading.sourceReferences,
    ];

    expectStrictOrder(visibleLayer, visibleMarkers);
    expectStrictOrder(deepLayer, deepMarkers);
    expectStrictOrder(evidence, evidenceMarkers);

    for (const marker of visibleMarkers) {
      expect(occurrences(article, marker), marker).toBe(1);
      expect(outerDetails, marker).not.toContain(marker);
    }
    for (const marker of deepMarkers) {
      expect(occurrences(article, marker), marker).toBe(1);
      expect(outsideOuterDetails, marker).not.toContain(marker);
      expect(evidence, marker).not.toContain(marker);
    }
    for (const marker of evidenceMarkers) {
      expect(occurrences(article, marker), marker).toBe(1);
      expect(outerDetails.slice(0, evidenceStart), marker).not.toContain(marker);
      expect(outsideOuterDetails, marker).not.toContain(marker);
    }
  }
});

it("keeps disclosure targets touch-safe and reading grids single-column on mobile", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  expect(css).toMatch(/\.reading-card details>summary\{min-height:44px;display:flex;align-items:center;cursor:pointer;color:#dfca95\}/);
  expect(css).toMatch(/@media\(max-width:700px\)\{\.reading-contrast,\.reading-actions\{grid-template-columns:1fr\}/);
});

it("renders the complete relationship manual in progressive disclosure order", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const secondBirth: BirthSubmission = {
    name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "unspecified", timeConfidence: "exact",
    birthDate: { mode: "solar", year: 1992, month: 11, day: 3, isLeapMonth: false }, timeMode: "exact",
  };
  const result = calculateCompatibility(chart, calculateFourPillars(secondBirth), "partner");
  const html = renderToStaticMarkup(createElement(CompatibilitySection, {
    chart,
    relationship: "partner",
    secondBirth,
    onRelationshipChange: () => undefined,
    onSecondBirthChange: () => undefined,
  }));

  expect(html).toContain('<form class="intake-card wheel-intake">');
  const manualStart = html.indexOf('<div class="compatibility-manual">');
  expect(manualStart, "relationship manual").toBeGreaterThan(-1);
  const manual = extractBalancedElement(html, "div", manualStart);
  expect(occurrences(manual, result.summary)).toBe(1);

  const cardStarts = [...manual.matchAll(/<article class="compatibility-axis-card">/g)].map((match) => match.index);
  expect(cardStarts).toHaveLength(9);
  expectStrictOrder(manual, result.axes.map((axis) => axis.label));

  result.axes.forEach((axis, index) => {
    const article = extractBalancedElement(manual, "article", cardStarts[index]);
    const evidenceStart = article.indexOf('<details class="compatibility-axis-evidence">');
    expect(evidenceStart, `${axis.id} evidence`).toBeGreaterThan(-1);
    const evidence = extractBalancedElement(article, "details", evidenceStart);
    expect(evidence.slice(0, evidence.indexOf(">") + 1)).toBe('<details class="compatibility-axis-evidence">');
    const visible = article.slice(0, evidenceStart) + article.slice(evidenceStart + evidence.length);

    expectStrictOrder(visible, [axis.label, axis.plainLanguage, axis.scene, "可以这样做", axis.action]);
    expectStrictOrder(evidence, ["专业依据与边界", axis.professionalBasis, axis.caution]);
    for (const field of [axis.label, axis.plainLanguage, axis.scene, axis.action, axis.professionalBasis, axis.caution]) {
      expect(occurrences(article, field), `${axis.id}: ${field}`).toBe(1);
    }
    expect(visible).not.toContain(axis.professionalBasis);
    expect(visible).not.toContain(axis.caution);
  });

  const guidanceStart = manual.indexOf('<section class="role-guidance">');
  expect(guidanceStart, "role guidance").toBeGreaterThan(-1);
  const guidance = extractBalancedElement(manual, "section", guidanceStart);
  expect(guidance).toContain("伴侣关系说明书");
  expectStrictOrder(guidance, result.roleSpecificGuidance);
  for (const item of result.roleSpecificGuidance) expect(occurrences(guidance, item), item).toBe(1);

  const legacyEvidenceStart = manual.indexOf('<details class="compatibility-evidence">');
  expect(legacyEvidenceStart).toBeGreaterThan(guidanceStart + guidance.length - 1);
  const legacyEvidence = extractBalancedElement(manual, "details", legacyEvidenceStart);
  expect(legacyEvidence.slice(0, legacyEvidence.indexOf(">") + 1)).toBe('<details class="compatibility-evidence">');
  expectStrictOrder(legacyEvidence, ["<h2>沟通场景</h2>", "<h2>五行互动</h2>", "<h2>双向十神</h2>", "<h2>合、冲、刑、害观察</h2>", "<h2>行动规则</h2>"]);

  const legacyMarkers = [
    result.communicationScenario,
    ...result.elementDynamics.map((item) => `${item.element} ${item.first}:${item.second}`),
    ...result.tenGodDynamics.map((item) => `${item.direction} · ${item.theme}`),
    ...result.combinationsAndClashes.map((item) => `${item.symbols.join("·")} · ${item.relation}`),
    ...result.actionRules,
    ...result.limitations,
  ];
  const outsideLegacyEvidence = manual.slice(0, legacyEvidenceStart) + manual.slice(legacyEvidenceStart + legacyEvidence.length);
  for (const marker of legacyMarkers) {
    expect(occurrences(legacyEvidence, marker), marker).toBe(1);
    expect(outsideLegacyEvidence, marker).not.toContain(marker);
  }
});

it("keeps relationship disclosures touch-safe and axes single-column without horizontal overflow on mobile", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  expect(css).toMatch(/\.compatibility-manual\{min-width:0;overflow-wrap:anywhere\}/);
  expect(css).toMatch(/\.compatibility-axes\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/);
  expect(css).toMatch(/\.compatibility-axis-evidence>summary,\.compatibility-evidence>summary\{min-height:44px;display:flex;align-items:center;/);
  expect(css).toMatch(/@media\(max-width:720px\)\{\.compatibility-axes\{grid-template-columns:1fr\}/);
});
