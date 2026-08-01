import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DrawSection, selectDailyDrawRecord } from "../../components/yi/DrawSection";
import { NameAnalysisView, createNameAnalysisViewState } from "../../components/yi/NameAnalysisSection";
import { QimenSection, selectDailyQimenRecord } from "../../components/yi/QimenSection";
import { ResultShell, getAvailableSections, getResultSections } from "../../components/yi/ResultShell";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { analyzeName } from "../../lib/yi/name-analysis";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import { deriveYiThemeElement } from "../../lib/yi/theme";
import type { BirthInput } from "../../lib/yi/types";

const birth: BirthInput = {
  name: "欧阳司徒",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江杭州",
  gender: "female",
  timeConfidence: "exact",
};

function model(input: BirthInput = birth) {
  const chart = calculateFourPillars(input);
  const report = buildProfessionalReport(chart, input);
  return { chart, report, items: buildInterpretations(chart) };
}

function renderShell(activeSection: "portrait" | "face" | "star" | "tradition" = "portrait") {
  const { chart, report, items } = model();
  return renderToStaticMarkup(createElement(ResultShell, {
    name: birth.name,
    chart,
    birth,
    report,
    interpretations: items,
    activeSection,
    onSectionChange: () => undefined,
    onRestart: () => undefined,
    onSaveHome: () => undefined,
    themeElement: deriveYiThemeElement(chart),
  }));
}

function readPngInfo(asset: URL) {
  const bytes = readFileSync(asset);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
}

describe("2026-07-31 ritual polish and atlas module extraction", () => {
  it("centers the panoramic fate title with a lishu tuned font contract", () => {
    const html = renderShell("portrait");
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const title = html.slice(html.indexOf('data-testid="report-document-title"'), html.indexOf("</h1>"));
    const brand = html.slice(html.indexOf('data-testid="report-brand-line"'), html.indexOf('data-testid="report-document-title"'));

    expect(title).toContain("欧阳司徒命运全景报告");
    expect(brand).toContain("东方人生智慧");
    expect(brand).toContain("命");
    expect(brand).toMatch(/[木火土金水]命/u);
    expect(css).toContain(".report-brand-line{justify-self:start");
    expect(css).toContain(".report-document-title{text-align:center");
    expect(css).toMatch(/\.result-shell \.report-document-title h1\{[^}]*font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif/);
    expect(css).toMatch(/\.report-document-title h1\{[^}]*font-family:"LiSu","隶书","STLiti","STKaiti","KaiTi",serif/);
  });

  it("extracts face reading and star reading into lower report modules while keeping daily rituals upstairs", () => {
    const ids = getResultSections().map(([id]) => id);
    const html = renderShell("portrait");
    const nav = html.slice(html.indexOf('class="result-tabs"'), html.indexOf('class="result-content"'));

    expect(ids).toEqual([
      "portrait", "chart", "detail", "name", "fortune", "face", "star", "compatibility", "mirror", "tradition",
    ]);
    expect(getAvailableSections(true)).toHaveLength(10);
    expect(nav).toContain(">相面</button>");
    expect(nav).toContain(">星座</button>");
    expect(nav).not.toContain(">今日签</button>");
    expect(nav).not.toContain(">奇门</button>");
  });

  it("renders face and star as direct modules with focused atlas methods", () => {
    const face = renderShell("face");
    const star = renderShell("star");
    const tradition = renderShell("tradition");

    expect(face).toContain("相面");
    expect(face).toContain("面型");
    expect(face).not.toContain("<b>星座</b>");
    expect(star).toContain("星座");
    expect(star).toContain("白羊座");
    expect(star).not.toContain("<b>相面</b>");
    expect(tradition).not.toContain("<b>星座</b>");
    expect(tradition).not.toContain("<b>相面</b>");
  });

  it("makes today sign question-first, repeatable by question, and structured as sign text, poem and interpretation", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const career = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业去留");
    const relation = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "关系修复");

    expect(html).toContain("问事");
    expect(html).toContain("事业去留");
    expect(html).toContain("写下今天要问的一件事");
    expect(html).toContain("oracle-fortune-asset-tube");
    expect(html).toContain("oracle-tube-asset-shell");
    expect(html).toContain("oracle-tube-reference-asset");
    expect(html).toContain("oracle-tube-breathe-target");
    expect(html).toContain('src="oracle-lot-tube-reference.png"');
    expect(html).toContain("oracle-line-tube");
    expect(html).toContain("oracle-tube-front");
    expect(html).not.toContain("oracle-tube-inscription");
    expect(html).not.toContain("<i>签</i>");
    expect(html).not.toContain("签文");
    expect(html).not.toContain("签诗");
    expect(career.dynamicKey).not.toBe(relation.dynamicKey);
    expect(career.sign).not.toBe(relation.sign);
    expect(career.reading).not.toBe(relation.reading);
    expect(career).toHaveProperty("text");
  });

  it("upgrades today sign records into numbered category-linked lots with allusions", () => {
    const { chart } = model();
    const career = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业去留");
    const relation = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "关系修复");
    const wealth = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "财运取舍");

    expect(career.signNumber).toMatch(/^第\d+签$/u);
    expect(career.category).toBe("事业");
    expect(relation.category).toBe("关系");
    expect(wealth.category).toBe("财运");
    expect(career.allusion).toMatch(/典|春|舟|关|灯|仓|门|雨/u);
    expect(career.fortune).toMatch(/吉|凶/u);
    expect(career.poem.length).toBeGreaterThan(12);
    expect(new Set([career.signNumber, relation.signNumber, wealth.signNumber]).size).toBeGreaterThan(1);
  });

  it("keeps the lot allusion as its own field instead of repeating it in the interpretation", () => {
    const { chart } = model();
    const career = selectDailyDrawRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业去留");

    expect(career.allusion).toMatch(/^典/u);
    expect(career.reading).not.toContain(career.allusion);
  });

  it("uses the provided fortune-tube asset with a sign overlay and preserved breathing cue", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const asset = new URL("../../public/oracle-lot-tube-reference.png", import.meta.url);
    const png = readPngInfo(asset);
    const tubeStart = html.indexOf('data-testid="draw-lot-trigger"');
    const buttonStart = html.lastIndexOf("<button", tubeStart);
    const tube = html.slice(buttonStart, html.indexOf("</button>", tubeStart) + "</button>".length);

    expect(existsSync(asset)).toBe(true);
    expect(png).toMatchObject({ width: 800, height: 800, colorType: 6 });
    expect(tube).toContain("oracle-fortune-asset-tube");
    expect(tube).toContain("oracle-tube-asset-shell");
    expect(tube).toContain('class="oracle-tube-reference-asset"');
    expect(tube).toContain('src="oracle-lot-tube-reference.png"');
    expect(tube).toContain("oracle-tube-breathe-target");
    expect(tube).not.toContain("oracle-tube-inscription");
    expect(tube).not.toContain('>\u7b7e</span>');
    expect(tube).not.toContain("data-oracle-stick");
    expect(css).toContain(".oracle-line-tube .oracle-tube-reference-asset{display:block;width:100%;height:100%;object-fit:contain");
    expect(css).toContain(".oracle-line-tube.has-shaken-sticks .oracle-tube-reference-asset{animation:ritual-stick-shake");
    expect(css).toMatch(/\.oracle-line-tube \.oracle-tube-breathe-target\{[^}]*left:50%;top:76\.5%/);
    expect(css).toContain(".oracle-line-tube .oracle-tube-breathe-target::after");
    expect(css).toContain("oracle-breathe");
    expect(html).not.toContain("is-shaken");
  });

  it("keeps the lot tube source artwork unobscured with the original breathing cue", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const tubeStart = html.indexOf('data-testid="draw-lot-trigger"');
    const buttonStart = html.lastIndexOf("<button", tubeStart);
    const tube = html.slice(buttonStart, html.indexOf("</button>", tubeStart) + "</button>".length);

    expect(tube).toContain("oracle-tube-breathe-target");
    expect(tube).not.toContain("oracle-tube-inscription");
    expect(tube).not.toContain('>\u7b7e</span>');
    expect(css).toMatch(/\.oracle-line-tube \.oracle-tube-breathe-target::after\{[^}]*animation:oracle-breathe/);
  });

  it("offers richer everyday question presets for today sign and qimen", () => {
    const { chart } = model();
    const draw = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const qimen = renderToStaticMarkup(createElement(QimenSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));

    for (const item of ["工作沟通", "家庭安排", "健康作息", "出行办事"]) {
      expect(draw).toContain(`>${item}</button>`);
    }
    for (const item of ["合同谈判", "见面沟通", "考试学习", "搬家出行"]) {
      expect(qimen).toContain(`>${item}</button>`);
    }
    expect((draw.match(/aria-pressed="false"/g) ?? [])).toHaveLength(12);
    expect((qimen.match(/aria-pressed="false"/g) ?? [])).toHaveLength(12);
  });

  it("layers the sign overlay above the provided asset without exposing the old draw label", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const tubeStart = html.indexOf('data-testid="draw-lot-trigger"');
    const tube = html.slice(tubeStart, html.indexOf("</button>", tubeStart) + "</button>".length);

    expect(tube).toContain('aria-hidden="true"');
    expect(tube).not.toContain("oracle-stick-pocket");
    expect(tube).not.toContain("oracle-line-rim");
    expect(tube).not.toContain("oracle-tube-inscription");
    expect(css).toMatch(/\.oracle-line-tube\.oracle-fortune-asset-tube\{[^}]*overflow:visible/);
    expect(css).toMatch(/\.oracle-line-tube \.oracle-tube-asset-shell\{[^}]*z-index:1/);
    expect(css).toMatch(/\.oracle-line-tube \.oracle-tube-breathe-target\{[^}]*z-index:5/);
  });

  it("makes qimen question-first with presets and a richer classical plate", () => {
    const { chart } = model();
    const html = renderToStaticMarkup(createElement(QimenSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const career = selectDailyQimenRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业取舍");
    const money = selectDailyQimenRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "财运取舍");
    const asset = new URL("../../public/qimen-scene-reference.png", import.meta.url);
    const png = readPngInfo(asset);

    expect(html).toContain("问事");
    expect(html).toContain("事业取舍");
    expect(html).toContain("写下今天要问的一件事");
    expect(existsSync(asset)).toBe(true);
    expect(png.width).toBeLessThan(1040);
    expect(png.height).toBe(694);
    expect(html).toContain("qimen-scene-asset-plate");
    expect(html).toContain("qimen-scene-asset-shell");
    expect(html).toContain("qimen-scene-reference-asset");
    expect(html).toContain("qimen-breathe-target");
    expect(html).toContain('src="qimen-scene-reference.png"');
    expect(html).not.toContain('class="qimen-plate-center">\u8d77\u5c40</span>');
    expect(html).not.toContain("qimen-nine-grid");
    expect(html).not.toContain("qimen-cardinal qimen-cardinal--north");
    expect(html).not.toContain("问事时间");
    expect(career.dynamicKey).not.toBe(money.dynamicKey);
    expect(career.gate + career.direction + career.prompt).not.toBe(money.gate + money.direction + money.prompt);
    expect(career.actionGuide).toContain("二十分钟");
    expect(career.actionGuide).toContain("朝向");
    expect(career.actionGuide).toContain("顺");
    expect(career.directionGuide).toContain(career.direction);
    expect(career.timingGuide).toContain("普通人");
  });

  it("adds a classical qimen plate structure that changes by hour while staying actionable", () => {
    const { chart } = model();
    const morning = selectDailyQimenRecord(chart, birth, new Date("2026-07-31T10:00:00+08:00"), "事业取舍");
    const noon = selectDailyQimenRecord(chart, birth, new Date("2026-07-31T12:00:00+08:00"), "事业取舍");

    expect(morning.solarTerm).toMatch(/节气/u);
    expect(morning.dayGanzhi).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u);
    expect(morning.hourGanzhi).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u);
    expect(morning.xunshou).toMatch(/^旬首/u);
    expect(morning.chief).toMatch(/^值符/u);
    expect(morning.envoy).toMatch(/^值使/u);
    expect(morning.plate).toHaveLength(9);
    expect(morning.plate[0]).toMatchObject({ palace: expect.any(String), gate: expect.any(String), star: expect.any(String), deity: expect.any(String) });
    expect(morning.hourGanzhi).not.toBe(noon.hourGanzhi);
    expect(morning.plate.map(cell => cell.gate).join("")).not.toBe(noon.plate.map(cell => cell.gate).join(""));
    expect(morning.actionGuide).toContain("二十分钟");
    expect(morning.directionGuide).toContain("朝向");
  });

  it("uses small low-interference ritual return buttons and breathes around qimen start", () => {
    const { chart } = model();
    const draw = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const qimen = renderToStaticMarkup(createElement(QimenSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-07-31T10:00:00+08:00"),
    }));
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(draw).toContain("ritual-back-button--mini");
    expect(qimen).toContain("ritual-back-button--mini");
    expect(css).toContain(".ritual-back-button--mini");
    expect(css).toContain(".realistic-qimen-plate.qimen-scene-asset-plate{width:min(520px,100%)");
    expect(css).toContain(".qimen-scene-reference-asset{display:block;width:100%;height:100%;object-fit:cover");
    expect(css).toContain(".qimen-scene-asset-plate .qimen-breathe-target{position:absolute;left:64%;top:39.5%");
    expect(css).toContain(".qimen-breathe-target::after");
    expect(css).toContain("qimen-breathe");
  });

  it("adds palace and mogao inspired pastel cloud backgrounds that vary with report and ritual contexts", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(css).toContain("--yi-palace-cloud");
    expect(css).toContain("--yi-mogao-caisson");
    expect(css).toContain("--yi-pastel-wash");
    expect(css).toContain("main[data-element] :where(.result-shell,.life-home,.intake)::before");
    expect(css).toContain(".result-content::before");
    expect(css).toContain("repeating-radial-gradient(ellipse at");
    expect(css).toContain("repeating-conic-gradient(from");
    expect(css).toContain("#d88b5f");
    expect(css).toContain("#7fa99a");
    expect(css).toContain("#6d93b2");
    expect(css).toContain(".result-content:has(.portrait-report)");
    expect(css).toContain(".result-content:has(.chart-report)");
    expect(css).toContain(".result-content:has(.fortune-report)");
    expect(css).toContain(".result-content:has(.name-analysis-section)");
    expect(css).toContain(".result-content:has(.oracle-report),.result-content:has(.today-sign-page)");
    expect(css).toContain(".result-content:has(.qimen-report),.result-content:has(.qimen-standalone-page)");
    expect(css).toContain("radial-gradient(circle at 50% 38%,color-mix(in srgb,#d88b5f");
    expect(css).toContain("repeating-radial-gradient(circle at 50% 46%,color-mix(in srgb,#7fa99a");
    expect(css).toContain("linear-gradient(135deg,transparent 0 38%,color-mix(in srgb,#6d93b2");
  });

  it("keeps long panoramic report titles centered on one mobile line with lishu sizing hooks", () => {
    const html = renderShell("portrait");
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const title = html.slice(html.indexOf('data-testid="report-document-title"'), html.indexOf("</h1>"));

    expect(title).toContain('data-report-title-name="欧阳司徒"');
    expect(title).toContain('class="report-title-name">欧阳司徒</span>');
    expect(title).toContain('class="report-title-core">命运全景报告</span>');
    expect(css).toContain("--report-title-scale");
    expect(css).toContain(".report-document-title h1[data-name-length=\"4\"]");
    expect(css).toContain(".report-document-title h1[data-name-length=\"long\"]");
    expect(css).toMatch(/\.result-shell \.report-document-title h1\{[^}]*justify-content:center/);
  });

  it("shows classic name suggestions as complete names with the detected surname", async () => {
    const { chart, report } = model();
    const analysis = await analyzeName({ rawInput: birth.name, chart, professionalReport: report });
    const html = renderToStaticMarkup(createElement(NameAnalysisView, {
      analysis: analysis!,
      state: createNameAnalysisViewState(birth.name),
      onDetailsOpenChange: () => undefined,
      onModeChange: () => undefined,
      onTraditionalSelection: () => undefined,
      onReadingSelection: () => undefined,
      onRealityAnswer: () => undefined,
      onConfirmSameNameExit: () => undefined,
      onSuggestionBatchChange: () => undefined,
    } as never));

    expect(html).toContain('data-classic-name="欧阳');
    expect(html).toContain("<h4>欧阳");
    expect(html).not.toContain("<h4>乔</h4>");
    expect(html).not.toContain("<h4>清芷</h4>");
  });
});
