import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildHundredYearLifeProgress,
  PortraitSection,
} from "../../components/yi/PortraitSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { buildLifeScrollNarrative } from "../../lib/yi/life-scroll";
import { buildProfessionalReport } from "../../lib/yi/report-model";
import type { BirthInput } from "../../lib/yi/types";

const birth: BirthInput = {
  name: "林知夏",
  date: "1990-06-15",
  time: "09:30",
  location: "浙江省杭州市",
  gender: "female",
  timeConfidence: "exact",
};

function renderLifeScroll() {
  const chart = calculateFourPillars(birth);
  const report = buildProfessionalReport(chart, birth);
  const items = buildInterpretations(chart);
  const narrative = buildLifeScrollNarrative(chart, report, items);
  const html = renderToStaticMarkup(createElement(PortraitSection, {
    birth,
    chart,
    report,
    items,
    today: new Date("2026-07-28T00:00:00+08:00"),
  }));
  return { html, narrative };
}

describe("life scroll view", () => {
  it("renders the full first-reading chapter as waterfall entry cards", () => {
    const { html, narrative } = renderLifeScroll();

    for (const text of [
      "人生画卷",
      "人生一句话",
      "事业线",
      "婚姻与关系线",
      "命运转折线",
      "中后程",
      "命运成语",
      "一句俗语",
      "推荐一首诗",
      "传统古典音乐",
      "周杰伦歌单",
      "像哪一味中药材",
      "像哪一座名山",
      "推荐一本古代典籍",
      "给人生写一首定场诗",
      "收束",
      "当下行动",
      narrative.oneLineTheme,
      narrative.closingLine,
      narrative.actionNow,
      ...narrative.openingScene,
      ...narrative.careerArc,
      ...narrative.relationshipArc,
      ...narrative.turningPointArc,
      ...narrative.matureArc,
      narrative.recommendations.idiom.phrase,
      narrative.recommendations.idiom.commentary,
      narrative.recommendations.proverb.phrase,
      narrative.recommendations.proverb.commentary,
      narrative.recommendations.poem.title,
      narrative.recommendations.poem.original,
      narrative.recommendations.poem.commentary,
      narrative.recommendations.classicalMusic.title,
      narrative.recommendations.classicalMusic.commentary,
      narrative.recommendations.jayChouSong.title,
      narrative.recommendations.jayChouSong.lyricImagery,
      narrative.recommendations.jayChouSong.commentary,
      narrative.recommendations.herb.title,
      narrative.recommendations.herb.commentary,
      narrative.recommendations.mountain.title,
      narrative.recommendations.mountain.commentary,
      narrative.recommendations.lifeBook.title,
      narrative.recommendations.lifeBook.commentary,
      narrative.recommendations.settingPoem.title,
      narrative.recommendations.settingPoem.original,
      narrative.recommendations.settingPoem.commentary,
    ]) {
      expect(html).toContain(text);
    }
    const readingOrder = [
      "<h2>人生一句话</h2>",
      "<small>动物镜像</small>",
      "<h2>事业线</h2>",
      "<h2>婚姻与关系线</h2>",
      "<h2>命运转折线</h2>",
      "<small>历史镜像</small>",
      "<h2>中后程</h2>",
      "<h2>命运成语</h2>",
      "<h2>一句俗语</h2>",
      "<h2>推荐一首诗</h2>",
      "<h2>传统古典音乐</h2>",
      "<h2>周杰伦歌单</h2>",
      "<h2>像哪一味中药材</h2>",
      "<h2>像哪一座名山</h2>",
      "<h2>推荐一本古代典籍</h2>",
      "<h2>给人生写一首定场诗</h2>",
      "<h2>收束</h2>",
    ].map(token => html.indexOf(token));
    expect(readingOrder).toEqual([...readingOrder].sort((left, right) => left - right));
    expect(html).toContain('class="life-scroll-reading waterfall-grid"');
    expect(html).toContain('class="life-progress-card"');
    expect(html).toContain('class="life-progress-stickman"');
    expect(html).toContain("100");
    expect(html).toContain("36.1%");
    expect(html).toContain("13,192");
    expect(html.match(/<details class="life-scroll-part waterfall-card/g)).toHaveLength(17);
    expect(html.match(/class="waterfall-open-hint"/g)).toHaveLength(17);
    expect(html.match(/class="scene-line-art scene-line-art--/g)?.length ?? 0).toBeGreaterThanOrEqual(17);
    expect(html).toContain('class="scene-line-art scene-line-art--animal"');
    expect(html).toContain('class="scene-line-art scene-line-art--history"');
    expect(html.match(/aria-hidden="true"/g)?.length ?? 0).toBeGreaterThanOrEqual(17);
    expect(html.match(/focusable="false"/g)?.length ?? 0).toBeGreaterThanOrEqual(17);
    expect(html).toContain("点开阅读");
    expect(html).toContain("收起回到总览");
  });

  it("turns the birth date into a hundred-year progress blessing", () => {
    const progress = buildHundredYearLifeProgress(
      "1990-06-15",
      new Date("2026-07-28T00:00:00+08:00"),
    );

    expect(progress.daysLived).toBe(13192);
    expect(progress.percentText).toBe("36.1%");
    expect(progress.progressPercent).toBeGreaterThan(36);
    expect(progress.progressPercent).toBeLessThan(37);
    expect(progress.blessing).toContain("过去");
    expect(progress.blessing).toContain("未来");
  });

  it("shows every animal and historical mirror field as a concrete interlude", () => {
    const { html, narrative } = renderLifeScroll();

    for (const mirror of [
      narrative.animalInterlude,
      narrative.historicalInterlude,
    ]) {
      for (const text of [
        mirror.name,
        mirror.introduction,
        mirror.matchingScene,
        mirror.difference,
        mirror.takeaway,
      ]) {
        expect(html).toContain(text);
      }
    }
    for (const label of ["它是谁", "相像的一幕", "重要区别", "带走的方法"]) {
      expect(html).toContain(label);
    }
  });

  it("keeps every Dao note expanded with its chapter and three plain explanations", () => {
    const { html, narrative } = renderLifeScroll();

    for (const note of narrative.daoNotes) {
      expect(html).toContain(`《道德经》小注 · 第${note.chapter}章`);
      expect(html).toContain(`<blockquote>${note.excerpt}</blockquote>`);
      expect(html).toContain(`<strong>这句话原本在说：</strong>${note.plainCommentary.traditionalMeaning}`);
      expect(html).toContain(`<strong>放进你这一卷：</strong>${note.plainCommentary.storyConnection}`);
      expect(html).toContain(`<strong>落到眼前一幕：</strong>${note.plainCommentary.sceneGuidance}`);
      expect(html).not.toContain(note.internalSourceId);
    }
    expect(html.match(/class="dao-story-note"/g)).toHaveLength(narrative.daoNotes.length);
  });

  it("does not leak professional chart or evidence language into the story", () => {
    const { html } = renderLifeScroll();

    for (const forbidden of [
      "专业依据",
      "本章来源",
      "本章依据与使用边界",
      "可靠级",
      "证据等级",
      "计算规则",
      "规则 ID",
      "数据来源清单",
      "日主",
      "十神",
      "月令",
      "旺衰",
      "藏干",
      "纳音",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("uses one narrative projection call and responsive reading measures", () => {
    const portraitSource = readFileSync(
      new URL("../../components/yi/PortraitSection.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(
      new URL("../../app/globals.css", import.meta.url),
      "utf8",
    );
    const mobileCss = css.slice(css.lastIndexOf("@media(max-width:390px){"));

    expect(portraitSource.match(/buildLifeScrollNarrative\(/g) ?? []).toHaveLength(1);
    expect(portraitSource).not.toContain("function pick(");
    expect(portraitSource).not.toContain("<ChapterSources");
    expect(css).toMatch(/\.life-scroll-reading\{[^}]*width:min\(760px,100%\)[^}]*margin:[^;}]*auto/);
    expect(css).toMatch(/\.waterfall-grid\{[^}]*column-count:2/);
    expect(css).toMatch(/\.waterfall-card>summary\{[^}]*cursor:pointer/);
    expect(css).toMatch(/\.waterfall-card--illustrated>summary\{[^}]*padding-right:104px/);
    expect(css).toMatch(/\.scene-line-art\{[^}]*pointer-events:none/);
    expect(css).toMatch(/@media\(max-width:520px\)\{[^}]*\.scene-line-art/u);
    expect(css).toMatch(/\.life-scroll-reading p\{[^}]*line-height:1\.(?:7[5-9]|8|9)/);
    expect(mobileCss).toContain(".life-scroll-reading{width:100%;gap:18px}");
    expect(mobileCss).toContain(".life-scroll-part,.dao-story-note{padding:16px}");
  });
});
