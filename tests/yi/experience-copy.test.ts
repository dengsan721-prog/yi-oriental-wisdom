import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CompatibilitySection, formatCompatibilityCopy, getCompatibilityParticipants } from "../../components/yi/CompatibilitySection";
import { DetailSection } from "../../components/yi/DetailSection";
import { MirrorSection, MirrorSectionView } from "../../components/yi/MirrorSection";
import { ReferenceAtlasSection } from "../../components/yi/ReferenceAtlasSection";
import { getCalculationSteps } from "../../components/yi/YiExperience";
import { buildCompatibilityPublicView } from "../../lib/yi/compatibility";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildMirrorPublicViews } from "../../lib/yi/mirrors";
import type { BirthSubmission } from "../../components/yi/BirthIntake";
import type { InterpretationItem } from "../../lib/yi/types";

const priorities: InterpretationItem["priority"][] = ["core", "important", "supporting"];

type MirrorView = "zodiac" | "animal" | "historical" | "movie";
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
  expect(css).toMatch(/\.reading-card details>summary\{min-height:44px;display:flex;align-items:center;cursor:pointer;color:var\(--yi-accent-strong\)\}/);
  expect(css).toMatch(/@media\(max-width:700px\)\{\.reading-contrast,\.reading-actions\{grid-template-columns:1fr\}/);
});

it("renders four safe mirror entrances with the zodiac action card selected by default", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const zodiac = buildMirrorPublicViews(chart)[0].cards[0];
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

  const zodiacStart = html.indexOf('<section class="mirror-view" aria-label="生肖镜像内容">');
  const zodiacView = extractBalancedElement(html, "section", zodiacStart);
  expect(zodiacView).toContain('<article class="mirror-public-card">');
  expect(zodiacView).not.toMatch(/^<section[^>]* hidden/u);
  expect(html).toContain('<section class="mirror-view" aria-label="动物镜像内容" hidden="">');
  expect(html).toContain('<section class="mirror-view" aria-label="历史人物内容" hidden="">');
  expect(html).toContain('<section class="mirror-view" aria-label="电影角色内容" hidden="">');
  expectStrictOrder(html, ["<h1>", "<h2>"]);

  for (const marker of [
    zodiac.name,
    zodiac.introduction,
    zodiac.matchingScene,
    zodiac.importantDifference,
    zodiac.takeaway,
    zodiac.playfulObservation,
    "先认识",
    "像你的一个现场",
    "最重要的不同",
    "可以带走的动作",
    "有趣的一面",
  ]) expect(zodiacView, marker).toContain(marker);
  expect(zodiacView).not.toContain("<details");
  expect(zodiacView).not.toContain("<a ");
  expect(html).toContain("先认识镜中对象");
  expect(html).not.toMatch(/\d+(?:\.\d+)?\s*[%％]/);
  expect(html).not.toContain("匹配度");
  expect(html).not.toMatch(/本章依据与使用边界|来源与使用边界/u);
});

it("renders three semantically owned public cards in every non-zodiac mirror view", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const views = buildMirrorPublicViews(chart).slice(1);
  const html = renderToStaticMarkup(createElement(MirrorSection, { chart }));

  for (const view of views) {
    const viewStart = html.indexOf(`<section class="mirror-view" aria-label="${view.label}内容" hidden="">`);
    expect(viewStart, `${view.label} mirror view`).toBeGreaterThan(-1);
    const mirrorView = extractBalancedElement(html, "section", viewStart);
    const cardStarts = [...mirrorView.matchAll(/<article class="mirror-public-card">/g)].map(match => match.index);
    const cards = cardStarts.map(start => extractBalancedElement(mirrorView, "article", start));

    expect(cards, view.label).toHaveLength(3);
    view.cards.forEach((publicCard, index) => {
      const cardMarkup = cards[index];
      expect(cardMarkup).toContain(`<h2>${publicCard.name}</h2>`);
      if (publicCard.workTitle) {
        expect(cardMarkup).toContain(`<p>${publicCard.workTitle}</p>`);
      }
      expectStrictOrder(cardMarkup, [
        "<header>",
        publicCard.introduction,
        "像你的一个现场",
        publicCard.matchingScene,
        "最重要的不同",
        publicCard.importantDifference,
        "可以带走的动作",
        publicCard.takeaway,
        "有趣的一面",
        publicCard.playfulObservation,
      ]);
      for (const field of ["introduction", "matchingScene", "importantDifference", "takeaway", "playfulObservation"] as const) {
        const owners = view.cards.filter(
          item => item[field] === publicCard[field],
        ).length;
        expect(
          occurrences(mirrorView, publicCard[field]),
          `${view.label}.${publicCard.name}.${field} view ownership`,
        ).toBe(owners);
        cards.forEach((owner, ownerIndex) => {
          const expected =
            view.cards[ownerIndex][field] === publicCard[field] ? 1 : 0;
          expect(
            occurrences(owner, publicCard[field]),
            `${view.label}.${publicCard.name}.${field} card ${ownerIndex}`,
          ).toBe(expected);
        });
      }
      expect(cardMarkup).not.toContain("<details");
    });
  }
});

it("executes every mirror tab transition and reveals only the matching panel", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  let activeView: MirrorView = "zodiac";
  const render = () => MirrorSectionView({ chart, activeView, onSelectView: view => { activeView = view; } });
  const expectedViews: [label: string, view: MirrorView][] = [
    ["生肖镜像", "zodiac"],
    ["动物镜像", "animal"],
    ["历史人物", "historical"],
    ["电影角色", "movie"],
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
    const updatedHtml = renderToStaticMarkup(updated);
    expect(updatedHtml).not.toContain("<details");
    expect(updatedHtml).toContain("先认识");
    const buttons = findHostElements(updated, "button");
    expect(buttons).toHaveLength(4);
    for (const [candidateLabel, candidateView] of expectedViews) {
      const candidateButton = buttons.find(element => element.props.children === candidateLabel);
      expect(candidateButton?.props["aria-pressed"], `${candidateLabel} aria-pressed`).toBe(candidateView === view);
    }

    const panels = findHostElements(updated, "section").filter(
      element => element.props.className === "mirror-view",
    );
    expect(panels).toHaveLength(4);
    for (const [index, panel] of panels.entries()) {
      const panelView = expectedViews[index][1];
      expect(
        panel.props.hidden,
        `${panelView} visibility after ${label}`,
      ).toBe(panelView !== view);
    }
  }
});

it("applies responsive light mirror layouts", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  expect(css).toMatch(/\.mirror-tabs\{display:grid;grid-template-columns:repeat\(4,1fr\);gap:7px\}/);
  expect(css).toMatch(/\.mirror-tabs button\{[^}]*min-height:44px/);
  expect(css).toMatch(/\.mirror-tabs button\.active\{border-color:var\(--yi-accent\);color:var\(--yi-accent-strong\)\}/);
  expect(css).toMatch(/\.mirror-public-cards\{min-width:0;display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:12px\}/);
  expect(css).toMatch(/\.mirror-public-card\{[^}]*min-width:0[^}]*border-radius:18px[^}]*overflow-wrap:anywhere/);
  expect(css).toMatch(/\.mirror-public-card aside\{[^}]*background:var\(--yi-accent-soft\)/);
  expect(css).toMatch(/@media\(max-width:420px\)\{\.compatibility-public-grid,\.mirror-public-cards,\.atlas-public-reading\{grid-template-columns:1fr\}/);
});

it("renders the six-part relationship guide without exposing engine evidence", () => {
  const chart = calculateFourPillars({ name: "甲", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const secondBirth: BirthSubmission = {
    name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "unspecified", timeConfidence: "exact",
    birthDate: { mode: "solar", year: 1992, month: 11, day: 3, isLeapMonth: false }, timeMode: "exact",
  };
  const view = buildCompatibilityPublicView(
    chart,
    calculateFourPillars(secondBirth),
    "partner",
  );
  const participants = getCompatibilityParticipants("甲", "乙", "partner", "caregiver");
  const format = (copy: string) => formatCompatibilityCopy(copy, participants);
  const html = renderToStaticMarkup(createElement(CompatibilitySection, {
    chart,
    relationship: "partner",
    secondBirth,
    primaryName: "甲",
    primaryParentRole: "caregiver",
    onRelationshipChange: () => undefined,
    onSecondBirthChange: () => undefined,
    onParentChildPrimaryRoleChange: () => undefined,
  }));

  expect(html).toContain("第二份出生资料只在本次报告浏览期间保留");
  expect(html).not.toContain("会随报告保留");
  expect(html).toContain('<form class="intake-card wheel-intake">');
  const guideStart = html.indexOf(
    '<div class="compatibility-public-reading">',
  );
  expect(guideStart, "relationship guide").toBeGreaterThan(-1);
  const guide = extractBalancedElement(html, "div", guideStart);
  const labels = [
    "你们更像哪一种搭档",
    "最容易产生好感的地方",
    "最容易误会的场景",
    "一次争执可能怎样发生",
    "怎样把话说回来",
    "下次可以一起试的小动作",
  ];
  expectStrictOrder(guide, labels);
  expect(guide.match(/<article>/gu)).toHaveLength(6);
  for (const copy of [
    view.teamStyle,
    view.attractionScene,
    view.misunderstandingScene,
    view.conflictScene,
    view.repairLine,
    view.smallAction,
    view.playfulObservation,
  ]) {
    expect(guide).toContain(format(copy));
  }
  expect(guide).toContain(view.lead.attribution);
  expect(guide).toContain(view.lead.saying);
  expect(guide).not.toContain("<details");
  expect(guide).not.toMatch(
    /专业依据|干支关系结构规则|双向十神|来源与使用边界/u,
  );
});

it("names both parent-child roles while keeping engine markers out of public copy", () => {
  const chart = calculateFourPillars({ name: "顾临川", date: "1990-06-15", time: "09:30", location: "杭州", gender: "unspecified", timeConfidence: "exact" });
  const secondBirth: BirthSubmission = {
    name: "小满", date: "2012-11-03", time: "18:20", location: "上海", gender: "unspecified", timeConfidence: "exact",
    birthDate: { mode: "solar", year: 2012, month: 11, day: 3, isLeapMonth: false }, timeMode: "exact",
  };
  expect(getCompatibilityParticipants("顾临川", "小满", "parent-child", "caregiver")).toEqual({ first: "顾临川（照顾者）", second: "小满（孩子）" });
  expect(getCompatibilityParticipants("顾临川", "小满", "parent-child", "child")).toEqual({ first: "顾临川（孩子）", second: "小满（照顾者）" });
  expect(getCompatibilityParticipants("", "", "partner", "caregiver")).toEqual({ first: "报告主人", second: "第二位" });
  const caregiverParticipants = getCompatibilityParticipants("顾临川", "小满", "parent-child", "caregiver");
  expect(formatCompatibilityCopy("A→B；B→A；A先/B先；A侧/B侧；A注意/B注意；A从/B从；A会/B会；A该/B该", caregiverParticipants)).toBe("顾临川（照顾者）→小满（孩子）；小满（孩子）→顾临川（照顾者）；顾临川（照顾者）先/小满（孩子）先；顾临川（照顾者）侧/小满（孩子）侧；顾临川（照顾者）注意/小满（孩子）注意；顾临川（照顾者）从/小满（孩子）从；顾临川（照顾者）会/小满（孩子）会；顾临川（照顾者）该/小满（孩子）该");
  expect(formatCompatibilityCopy("AI、AB test、API、B2B", caregiverParticipants)).toBe("AI、AB test、API、B2B");

  const html = renderToStaticMarkup(createElement(CompatibilitySection, {
    chart,
    relationship: "parent-child",
    secondBirth,
    primaryName: "顾临川",
    primaryParentRole: "caregiver",
    onRelationshipChange: () => undefined,
    onSecondBirthChange: () => undefined,
    onParentChildPrimaryRoleChange: () => undefined,
  }));

  expect(html).toContain('aria-label="报告主人亲子角色"');
  expect(html).toMatch(/aria-pressed="true"[^>]*>报告主人是照顾者<\/button>/);
  expect(html).toMatch(/aria-pressed="false"[^>]*>报告主人是孩子<\/button>/);
  expect(html).toContain("报告主人：顾临川（照顾者）");
  expect(html).toContain("对方：小满（孩子）");
  expect(html).toContain("录入对方出生坐标");

  const childHtml = renderToStaticMarkup(createElement(CompatibilitySection, {
    chart,
    relationship: "parent-child",
    secondBirth,
    primaryName: "顾临川",
    primaryParentRole: "child",
    onRelationshipChange: () => undefined,
    onSecondBirthChange: () => undefined,
    onParentChildPrimaryRoleChange: () => undefined,
  }));

  expect(childHtml).toMatch(/aria-pressed="false"[^>]*>报告主人是照顾者<\/button>/);
  expect(childHtml).toMatch(/aria-pressed="true"[^>]*>报告主人是孩子<\/button>/);
  expect(childHtml).toContain("报告主人：顾临川（孩子）");
  expect(childHtml).toContain("对方：小满（照顾者）");

  const unexplainedMarkers = /(?:A→B|B→A|A对B|B对A|A先|B先|A再|B再|A侧|B侧|A注意|B注意|A从|B从|A会|B会|A该|B该|A(?:年|月|日|时)(?:柱|干|支)?|B(?:年|月|日|时)(?:柱|干|支)?|A待核|B待核|A长期|B长期|A完整|B用)/;
  expect(html).not.toMatch(unexplainedMarkers);
  expect(childHtml).not.toMatch(unexplainedMarkers);
  const secondChart = calculateFourPillars(secondBirth);
  const caregiverView = buildCompatibilityPublicView(
    chart,
    secondChart,
    "parent-child",
    "caregiver",
  );
  const childView = buildCompatibilityPublicView(
    chart,
    secondChart,
    "parent-child",
    "child",
  );
  expect(html).toContain(caregiverView.teamStyle);
  expect(html).toContain(caregiverView.repairLine);
  expect(childHtml).toContain(childView.teamStyle);
  expect(childHtml).toContain(childView.repairLine);
  expect(html + childHtml).not.toMatch(
    /坐标：|专业依据|双向十神|<details/u,
  );
});

it("keeps the six relationship cards single-column without horizontal overflow on mobile", () => {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  expect(css).toMatch(/\.compatibility-public-reading\{min-width:0;display:grid;gap:14px\}/);
  expect(css).toMatch(/\.compatibility-public-grid\{min-width:0;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  expect(css).toMatch(/\.compatibility-public-grid article\{[^}]*min-width:0[^}]*border-radius:15px/);
  expect(css).toMatch(/@media\(max-width:420px\)\{\.compatibility-public-grid,\.mirror-public-cards,\.atlas-public-reading\{grid-template-columns:1fr\}/);
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

it("keeps a light version note in the atlas without restoring evidence panels", () => {
  const birth = {
    name: "男", date: "1990-06-15", time: "09:30", location: "杭州",
    gender: "unspecified", timeConfidence: "exact",
  } as const;
  const chart = calculateFourPillars(birth);
  const html = renderToStaticMarkup(createElement(ReferenceAtlasSection, { chart, birth }));

  expect(html).toContain("版本说明");
  expect(html).toContain("明代佚名编纂");
  expect(html).toMatch(/传统图谱|文化模型/u);
  expect(html).not.toMatch(/专业依据|本章来源|本章依据与使用边界|查看完整来源与规则/u);
});

it("integrates constellation maps and mole user-side copy without a second mirror transform", () => {
  const source = readFileSync(resolve("components/yi/ReferenceAtlasSection.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  expect(source).toContain('import { ConstellationMap } from "./ConstellationMap"');
  expect(source).toContain("<ConstellationMap sign={starSign}");
  expect(source).toContain("CONSTELLATIONS[starSign]");
  expect(source).toContain("buildAtlasPublicReading");
  expect(source).toContain("AtlasPublicReadingCard");
  expect(source).not.toContain("getZodiacProfile");
  expect(source).not.toContain("getAllSources");
  expect(source).not.toContain("starSymbols");
  expect(source).not.toContain("star-reference");
  expect(css).not.toContain(".star-reference");
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
  expect(css).toMatch(/\.atlas-gender-switch button\[aria-pressed=true\]\{[^}]*color:var\(--yi-accent-strong\)/);
  expect(css).toMatch(/\.mirror-guide\{[^}]*border:1px solid var\(--yi-line\)/);
  expect(css).toMatch(/\.mirror-side-labels\{[^}]*display:flex[^}]*justify-content:space-between/);
  expect(css).toMatch(/\.constellation-meta\{[^}]*display:grid/);
  expect(css).toMatch(/\.constellation-meta h3\{[^}]*color:var\(--yi-accent-strong\)/);
  expect(css).toMatch(/@media\(max-width:760px\)\{\.atlas-gender-switch\{width:100%\}\.constellation-meta\{grid-template-columns:1fr\}/);
});
