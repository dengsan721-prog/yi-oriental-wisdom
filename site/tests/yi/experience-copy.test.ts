import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CompatibilitySection } from "../../components/yi/CompatibilitySection";
import { DetailSection } from "../../components/yi/DetailSection";
import { MirrorSection, MirrorSectionView } from "../../components/yi/MirrorSection";
import { ReferenceAtlasSection } from "../../components/yi/ReferenceAtlasSection";
import { getCalculationSteps } from "../../components/yi/YiExperience";
import { calculateCompatibility } from "../../lib/yi/compatibility";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { matchLifeMirrors, type MirrorCandidate } from "../../lib/yi/mirrors";
import type { MovieCharacterRecord } from "../../lib/yi/movie-characters";
import { buildZodiacMirror } from "../../lib/yi/zodiac-mirror";
import type { BirthSubmission } from "../../components/yi/BirthIntake";
import type { InterpretationItem } from "../../lib/yi/types";

const priorities: InterpretationItem["priority"][] = ["core", "important", "supporting"];

type MirrorView = "zodiac" | "animals" | "historical" | "movies";
type HostElementProps = { children?: ReactNode; [key: string]: unknown };

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

function isMovieCandidate(candidate: MirrorCandidate): candidate is MovieCharacterRecord {
  return candidate.kind === "movie" && "characterName" in candidate;
}

function findHostElements(root: ReactNode, type: string): ReactElement<HostElementProps>[] {
  const elements: ReactElement<HostElementProps>[] = [];
  const visit = (node: ReactNode) => Children.forEach(node, child => {
    if (!isValidElement<HostElementProps>(child)) return;
    if (child.type === type) elements.push(child);
    visit(child.props.children);
  });
  visit(root);
  return elements;
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

it("renders four mirror entrances with the complete zodiac record selected by default", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const zodiac = buildZodiacMirror(chart);
  const html = renderToStaticMarkup(createElement(MirrorSection, { chart }));
  const navStart = html.indexOf('<nav class="mirror-tabs"');
  expect(navStart, "mirror navigation").toBeGreaterThan(-1);
  const nav = extractBalancedElement(html, "nav", navStart);

  expectStrictOrder(nav, ["生肖镜像", "动物镜像", "历史人物", "电影角色"]);
  expect(nav.match(/<button /g)).toHaveLength(4);
  expect(nav).toContain('<button type="button" aria-pressed="true" class="active">生肖镜像</button>');
  for (const label of ["动物镜像", "历史人物", "电影角色"]) {
    expect(nav).toContain(`<button type="button" aria-pressed="false" class="">${label}</button>`);
  }

  const zodiacStart = html.indexOf('<div class="mirror-view" data-mirror-view="zodiac">');
  const zodiacView = extractBalancedElement(html, "div", zodiacStart);
  expect(zodiacView).toContain('<article class="reading-card zodiac-mirror">');
  expect(zodiacView).not.toMatch(/^<div[^>]* hidden/);
  expect(html).toContain('<div class="mirror-view" data-mirror-view="animals" hidden="">');
  expect(html).toContain('<div class="mirror-view" data-mirror-view="historical" hidden="">');
  expect(html).toContain('<div class="mirror-view" data-mirror-view="movies" hidden="">');
  expectStrictOrder(html, ["<h1>", "<h2>"]);

  for (const marker of [
    zodiac.firstImpression,
    zodiac.culturalSource,
    zodiac.trustStyle,
    zodiac.strengthPattern,
    zodiac.pressurePattern,
    zodiac.workScene,
    zodiac.relationshipScene,
    zodiac.familyScene,
    zodiac.chartAgreement,
    zodiac.chartDifference,
    zodiac.immediateAction,
    zodiac.longTermPractice,
    zodiac.caution,
    "与八字主盘互证",
    "理论与文化来源",
    "产品观察模型",
    "查看来源用途与边界",
  ]) expect(zodiacView, marker).toContain(marker);
  expect(zodiac.sources.every(id => zodiacView.includes(id) === false)).toBe(true);
  expect(zodiacView.match(/<a /g)).toHaveLength(zodiac.sources.length);
  expect(zodiacView).not.toMatch(/<details[^>]*\sopen(?:=|>)/);
  expect(html).toContain("镜像提供观察语言，不宣称人与人的命运相同");
  expect(html).not.toMatch(/\d+(?:\.\d+)?\s*[%％]/);
  expect(html).not.toContain("匹配度");
});

it("renders three semantically owned candidate cards in every non-zodiac mirror view", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const groups = matchLifeMirrors(chart);
  const html = renderToStaticMarkup(createElement(MirrorSection, { chart }));

  for (const [view, candidates] of Object.entries(groups) as [keyof typeof groups, (typeof groups)[keyof typeof groups]][]) {
    const viewStart = html.indexOf(`<div class="mirror-view" data-mirror-view="${view}" hidden="">`);
    expect(viewStart, `${view} mirror view`).toBeGreaterThan(-1);
    const mirrorView = extractBalancedElement(html, "div", viewStart);
    const cardStarts = [...mirrorView.matchAll(/<article class="mirror-candidate">/g)].map(match => match.index);
    const cards = cardStarts.map(start => extractBalancedElement(mirrorView, "article", start));

    expect(cards, view).toHaveLength(3);
    candidates.forEach((candidate, index) => {
      const card = cards[index];
      const headerStart = card.indexOf("<header>");
      const header = extractBalancedElement(card, "header", headerStart);
      const movie = isMovieCandidate(candidate) ? candidate : null;
      const identity = movie ? movie.characterName : candidate.name;

      expect(header).toContain(`<h2>${identity}</h2>`);
      if (movie) {
        expect(header).toContain(`<p class="mirror-film-title">《${movie.filmTitle}》</p>`);
        expect(header).not.toContain(candidate.name);
      } else {
        expect(header).not.toContain("mirror-film-title");
      }
      expectStrictOrder(card, [
        "<header>",
        "为什么相似",
        "哪里不同",
        "可以借鉴",
        "需要避开的阴影",
        "<details>",
        "来源与使用边界",
      ]);
      for (const field of ["similar", "different", "lesson", "shadow"] as const) {
        const owners = candidates.filter(item => item[field] === candidate[field]).length;
        expect(occurrences(mirrorView, candidate[field]), `${view}.${candidate.id}.${field} view ownership`).toBe(owners);
        cards.forEach((owner, ownerIndex) => {
          const expected = candidates[ownerIndex][field] === candidate[field] ? 1 : 0;
          expect(occurrences(owner, candidate[field]), `${view}.${candidate.id}.${field} card ${ownerIndex}`).toBe(expected);
        });
      }
      const sources = renderToStaticMarkup(createElement("p", null, candidate.sourceReferences.join("｜")));
      expect(card).toContain(`<details><summary>来源与使用边界</summary>${sources}</details>`);
      expect(card).not.toMatch(/<details[^>]*\sopen(?:=|>)/);
    });
  }
});

it("executes every mirror tab transition and reveals only the matching panel", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  let activeView: MirrorView = "zodiac";
  const render = () => MirrorSectionView({ chart, activeView, onSelectView: view => { activeView = view; } });
  const expectedViews: [label: string, view: MirrorView][] = [
    ["生肖镜像", "zodiac"],
    ["动物镜像", "animals"],
    ["历史人物", "historical"],
    ["电影角色", "movies"],
  ];

  for (const [label, view] of expectedViews) {
    const button = findHostElements(render(), "button").find(element => element.props.children === label);
    expect(button, `${label} button`).toBeDefined();
    if (!button) continue;
    const onClick = button.props.onClick;
    expect(onClick, `${label} onClick`).toBeTypeOf("function");
    if (typeof onClick !== "function") continue;
    onClick();
    expect(activeView, `${label} selected view`).toBe(view);

    const updated = render();
    const buttons = findHostElements(updated, "button");
    expect(buttons).toHaveLength(4);
    for (const [candidateLabel, candidateView] of expectedViews) {
      const candidateButton = buttons.find(element => element.props.children === candidateLabel);
      expect(candidateButton?.props["aria-pressed"], `${candidateLabel} aria-pressed`).toBe(candidateView === view);
    }

    const panels = findHostElements(updated, "div").filter(element => typeof element.props["data-mirror-view"] === "string");
    expect(panels).toHaveLength(4);
    for (const panel of panels) {
      const panelView = panel.props["data-mirror-view"] as MirrorView;
      expect(panel.props.hidden, `${panelView} visibility after ${label}`).toBe(panelView !== view);
    }
  }
});

it("applies responsive black-gold mirror layouts", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  expect(css).toMatch(/\.mirror-tabs\{display:grid;grid-template-columns:repeat\(4,1fr\);gap:7px\}/);
  expect(css).toMatch(/\.mirror-tabs button\{[^}]*min-height:44px/);
  expect(css).toMatch(/\.mirror-tabs button\.active\{border-color:#caa760;color:#e2c77e\}/);
  expect(css).toMatch(/\.mirror-candidates\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:12px\}/);
  expect(css).toMatch(/\.mirror-candidate\{border-radius:18px;background:linear-gradient\(160deg,#101820,#090d10\)\}/);
  expect(css).toMatch(/\.mirror-candidate\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
  expect(css).toMatch(/\.mirror-candidate aside\{background:#7d301318\}/);
  expect(css).toMatch(/@media\(max-width:760px\)\{\.mirror-tabs\{grid-template-columns:repeat\(2,1fr\)\}\.mirror-candidates\{grid-template-columns:1fr\}\}/);
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

  const summaryStart = manual.indexOf('<header class="compatibility-summary">');
  const summary = extractBalancedElement(manual, "header", summaryStart);
  const axesStart = manual.indexOf('<div class="compatibility-axes">');
  const axes = extractBalancedElement(manual, "div", axesStart);
  const guidanceStart = manual.indexOf('<section class="role-guidance">');
  const guidance = extractBalancedElement(manual, "section", guidanceStart);
  const legacyEvidenceStart = manual.indexOf('<details class="compatibility-evidence">');
  const legacyEvidence = extractBalancedElement(manual, "details", legacyEvidenceStart);

  expectStrictOrder(manual, [
    '<header class="compatibility-summary">',
    '<div class="compatibility-axes">',
    '<section class="role-guidance">',
    '<details class="compatibility-evidence">',
  ]);
  expect(manual).toBe(`<div class="compatibility-manual">${summary}${axes}${guidance}${legacyEvidence}</div>`);
  expect(occurrences(summary, result.summary)).toBe(1);
  expect(manual.slice(0, summaryStart) + manual.slice(summaryStart + summary.length)).not.toContain(result.summary);

  const cardStarts = [...axes.matchAll(/<article class="compatibility-axis-card">/g)].map((match) => match.index);
  const articles = cardStarts.map((start) => extractBalancedElement(axes, "article", start));
  expect(articles).toHaveLength(9);
  expect(axes).toBe(`<div class="compatibility-axes">${articles.join("")}</div>`);
  expectStrictOrder(manual, result.axes.map((axis) => axis.label));

  result.axes.forEach((axis, index) => {
    const article = articles[index];
    const evidenceStart = article.indexOf('<details class="compatibility-axis-evidence">');
    expect(evidenceStart, `${axis.id} evidence`).toBeGreaterThan(-1);
    const evidence = extractBalancedElement(article, "details", evidenceStart);
    expect(evidence.slice(0, evidence.indexOf(">") + 1)).toBe('<details class="compatibility-axis-evidence">');
    const visible = article.slice(0, evidenceStart) + article.slice(evidenceStart + evidence.length);

    expect(article).toContain(`<h2>${axis.label}</h2>`);
    expectStrictOrder(visible, [axis.label, axis.plainLanguage, axis.scene, "可以这样做", axis.action]);
    expectStrictOrder(evidence, ["专业依据与边界", axis.professionalBasis, axis.caution]);
    for (const field of ["label", "plainLanguage", "scene", "action", "professionalBasis", "caution"] as const) {
      const value = axis[field];
      const owners = result.axes.filter((candidate) => candidate[field] === value).length;
      expect(occurrences(manual, value), `${axis.id}.${field} manual ownership`).toBe(owners);
      articles.forEach((candidate, candidateIndex) => {
        const expected = result.axes[candidateIndex][field] === value ? 1 : 0;
        expect(occurrences(candidate, value), `${axis.id}.${field} in card ${candidateIndex}`).toBe(expected);
      });
      expect(summary, `${axis.id}.${field} summary`).not.toContain(value);
      expect(guidance, `${axis.id}.${field} guidance`).not.toContain(value);
      expect(legacyEvidence, `${axis.id}.${field} legacy evidence`).not.toContain(value);
    }
    expect(visible).not.toContain(axis.professionalBasis);
    expect(visible).not.toContain(axis.caution);
  });

  expect(guidance).toContain("伴侣关系说明书");
  expectStrictOrder(guidance, result.roleSpecificGuidance);
  for (const item of result.roleSpecificGuidance) expect(occurrences(guidance, item), item).toBe(1);

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
  expect(css).toMatch(/\.compatibility-axis-card>h2,\.compatibility-axis-card>b\{color:var\(--gold\)\}/);
  expect(css).toMatch(/\.compatibility-axis-evidence>summary,\.compatibility-evidence>summary\{min-height:44px;display:flex;align-items:center;/);
  expect(css).toMatch(/@media\(max-width:720px\)\{\.compatibility-axes\{grid-template-columns:1fr\}/);
});

it("renders birth-owned atlas gender and a local unspecified-only reference switch", () => {
  const baseBirth = {
    name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", timeConfidence: "exact",
  } as const;
  const chart = calculateFourPillars({ ...baseBirth, gender: "unspecified" });

  for (const [gender, expectedAsset] of [
    ["male", "reference/face-shapes-male.webp"],
    ["female", "reference/face-shapes-female.webp"],
  ] as const) {
    const html = renderToStaticMarkup(createElement(ReferenceAtlasSection, {
      chart,
      birth: { ...baseBirth, gender },
    }));
    expect(html, gender).toContain('src="/' + expectedAsset + '"');
    expect(html, gender).not.toContain("atlas-gender-switch");
    expect(html, gender).not.toContain("男相参考");
    expect(html, gender).not.toContain("女相参考");
  }

  const unspecified = renderToStaticMarkup(createElement(ReferenceAtlasSection, {
    chart,
    birth: { ...baseBirth, gender: "unspecified" },
  }));
  expect(unspecified).toContain('src="/reference/face-shapes-female.webp"');
  expect(unspecified).toContain('<div class="atlas-gender-switch" aria-label="参考人物性别">');
  expect(unspecified).toContain('aria-pressed="false">男相参考</button>');
  expect(unspecified).toContain('aria-pressed="true">女相参考</button>');
});

it("keeps mirror guidance and user-owned side labels visible in the initial face atlas", () => {
  const birth = {
    name: "甲", date: "1990-06-15", time: "09:30", location: "杭州",
    gender: "unspecified", timeConfidence: "exact",
  } as const;
  const chart = calculateFourPillars(birth);
  const html = renderToStaticMarkup(createElement(ReferenceAtlasSection, { chart, birth }));

  expect(html).toContain('<aside class="mirror-guide">');
  expect(html).toContain("<b>镜面参考｜像照镜子一样对照</b>");
  expect(html).toContain("画面右侧是你的右脸");
  expect(html).toContain("画面左侧是你的左脸");
  expect(html).toContain('<div class="mirror-side-labels"><span>你的左脸</span><span>你的右脸</span></div>');
});

it("integrates constellation maps and mole user-side copy without a second mirror transform", () => {
  const source = readFileSync(resolve("components/yi/ReferenceAtlasSection.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  expect(source).toContain('import { ConstellationMap } from "./ConstellationMap"');
  expect(source).toContain("<ConstellationMap sign={starSign}");
  expect(source).toContain("CONSTELLATIONS[starSign]");
  expect(source).toContain("getZodiacProfile(starSign)");
  expect(source).not.toContain("starSymbols");
  expect(source).not.toContain("star-reference");
  expect(source).toContain("buildMoleDetailTitle(option)");
  expect(source).toMatch(/查看\$\{getUserSideLabel\(item\.userSide\)\}/);
  expect(source).toContain("查看你的左脸");
  expect(source).toContain("查看你的右脸");
  expect(source + "\n" + css).not.toMatch(/scaleX\(\s*-1\s*\)|rotateY\(\s*180deg\s*\)/i);
});

it("styles atlas controls, mirror guidance and constellation metadata for touch and mobile", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  expect(css).toMatch(/\.atlas-gender-switch\{[^}]*display:inline-grid[^}]*grid-template-columns:1fr 1fr/);
  expect(css).toMatch(/\.atlas-gender-switch button\{[^}]*min-height:44px/);
  expect(css).toMatch(/\.atlas-gender-switch button\[aria-pressed=true\]\{[^}]*color:#e2c77e/);
  expect(css).toMatch(/\.mirror-guide\{[^}]*border:1px solid #caa76055/);
  expect(css).toMatch(/\.mirror-side-labels\{[^}]*display:flex[^}]*justify-content:space-between/);
  expect(css).toMatch(/\.constellation-meta\{[^}]*display:grid/);
  expect(css).toMatch(/\.constellation-meta h3\{[^}]*color:#e2c77e/);
  expect(css).toMatch(/@media\(max-width:760px\)\{\.atlas-gender-switch\{width:100%\}\.constellation-meta\{grid-template-columns:1fr\}/);
});
