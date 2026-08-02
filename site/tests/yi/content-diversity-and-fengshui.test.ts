import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DrawSection, selectDailyDrawRecord } from "../../components/yi/DrawSection";
import { QimenSection, selectDailyQimenRecord } from "../../components/yi/QimenSection";
import { TraditionSection } from "../../components/yi/TraditionSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { simulatePersonalizedReportCorpus } from "../../lib/yi/report-personalization";
import { getRitualCorpusSummary } from "../../lib/yi/ritual-expansion";
import { getScenarioCorpusSummary } from "../../lib/yi/scenario-library";
import type { BirthInput } from "../../lib/yi/types";

const births: BirthInput[] = [
  { name: "林予安", date: "1988-03-12", time: "07:40", location: "杭州", gender: "female", timeConfidence: "exact" },
  { name: "周明远", date: "1992-11-03", time: "21:10", location: "成都", gender: "male", timeConfidence: "exact" },
  { name: "陈知白", date: "1979-08-26", time: "14:20", location: "广州", gender: "unspecified", timeConfidence: "exact" },
  { name: "欧阳司徒", date: "1990-06-15", time: "09:30", location: "杭州", gender: "female", timeConfidence: "exact" },
  { name: "赵若水", date: "2001-01-08", time: "00:35", location: "北京", gender: "female", timeConfidence: "exact" },
];

const drawQuestions = [
  "事业去留", "工作沟通", "升职争取", "副业开始", "关系修复", "伴侣相处",
  "亲子沟通", "家庭安排", "财运取舍", "大额支出", "合作分账", "健康作息",
  "考试复习", "搬家出行", "今日行动", "重要决定",
];

const qimenQuestions = [
  "合同谈判", "见面沟通", "面试汇报", "客户推进", "考试学习", "搬家出行",
  "就医问诊", "家事安排", "合作邀约", "财务盘点", "关系破冰", "今日行动",
];

function uniqueCount(values: readonly string[]) {
  return new Set(values).size;
}

function charBigramSimilarity(left: string, right: string) {
  const normalize = (value: string) => value.replace(/\s+/g, "");
  const toBigrams = (value: string) => new Set(Array.from(normalize(value)).slice(0, -1).map((char, index, chars) => `${char}${chars[index + 1]}`));
  const a = toBigrams(left);
  const b = toBigrams(right);
  const intersection = [...a].filter(item => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

describe("content diversity expansion and feng shui planning", () => {
  it("declares a large auditable combinational corpus for daily sign and qimen", () => {
    const summary = getRitualCorpusSummary();

    expect(summary.draw.combinableVariants).toBeGreaterThanOrEqual(500000);
    expect(summary.draw.atomicEntries).toBeGreaterThanOrEqual(180);
    expect(summary.qimen.combinableVariants).toBeGreaterThanOrEqual(1000000);
    expect(summary.qimen.atomicEntries).toBeGreaterThanOrEqual(200);
  });

  it("keeps daily sign outcomes varied across people, topics and questions", () => {
    const outcomes = births.flatMap((birth, birthIndex) => {
      const chart = calculateFourPillars(birth);
      return drawQuestions.map((question, questionIndex) => selectDailyDrawRecord(
        chart,
        birth,
        new Date(`2026-08-${String((birthIndex % 4) + 3).padStart(2, "0")}T${String(8 + (questionIndex % 8)).padStart(2, "0")}:00:00+08:00`),
        question,
      ));
    });

    expect(outcomes).toHaveLength(80);
    expect(uniqueCount(outcomes.map(item => item.signNumber))).toBeGreaterThanOrEqual(46);
    expect(uniqueCount(outcomes.map(item => item.sign))).toBeGreaterThanOrEqual(70);
    expect(uniqueCount(outcomes.map(item => item.allusion))).toBeGreaterThanOrEqual(52);
    expect(uniqueCount(outcomes.map(item => `${item.poem}\n${item.reading}`))).toBeGreaterThanOrEqual(76);
    expect(outcomes.every(item => item.reading.length > 160 && item.poem.length > 24)).toBe(true);
  });

  it("keeps qimen outcomes varied by hour, person, question and plate structure", () => {
    const hours = ["07:00", "09:00", "11:00", "15:00"];
    const outcomes = births.flatMap((birth, birthIndex) => {
      const chart = calculateFourPillars(birth);
      return qimenQuestions.flatMap((question, questionIndex) => hours.map((hour) => selectDailyQimenRecord(
        chart,
        birth,
        new Date(`2026-08-${String((birthIndex % 4) + 3).padStart(2, "0")}T${hour}:00+08:00`),
        `${question}${questionIndex % 2 === 0 ? "如何落地" : "是否推进"}`,
      )));
    });

    expect(outcomes).toHaveLength(240);
    expect(uniqueCount(outcomes.map(item => item.method))).toBeGreaterThanOrEqual(70);
    expect(uniqueCount(outcomes.map(item => item.prompt))).toBeGreaterThanOrEqual(120);
    expect(uniqueCount(outcomes.map(item => item.actionGuide))).toBeGreaterThanOrEqual(120);
    expect(uniqueCount(outcomes.map(item => item.plate.map(cell => `${cell.palace}:${cell.gate}:${cell.star}:${cell.deity}`).join("|")))).toBeGreaterThanOrEqual(90);
    expect(outcomes.every(item => item.actionGuide.includes("二十分钟") && item.directionGuide.includes("朝向"))).toBe(true);
  });

  it("adds a larger scenario corpus so report interpretations do not collapse to two reusable scenes per item", () => {
    const summary = getScenarioCorpusSummary();
    const reportSignatures = births.map((birth) => {
      const chart = calculateFourPillars(birth);
      return buildInterpretations(chart).map(item => `${item.id}:${item.scenario}:${item.action}`).join("\n");
    });

    expect(summary.baseScenes).toBeGreaterThanOrEqual(40);
    expect(summary.combinableVariants).toBeGreaterThanOrEqual(180);
    expect(uniqueCount(reportSignatures)).toBe(births.length);
    expect(uniqueCount(reportSignatures.flatMap(signature => signature.split("\n")))).toBeGreaterThanOrEqual(78);
  });

  it("personalizes reports below fifty percent similarity for the same birth moment with different identity and location", () => {
    const sameMomentBirths: BirthInput[] = [
      { name: "林予安", date: "1992-09-18", time: "10:20", location: "杭州滨江", gender: "female", timeConfidence: "exact" },
      { name: "周明远", date: "1992-09-18", time: "10:20", location: "成都高新区", gender: "male", timeConfidence: "exact" },
      { name: "陈知白", date: "1992-09-18", time: "10:20", location: "广州天河", gender: "unspecified", timeConfidence: "exact" },
      { name: "赵若水", date: "1992-09-18", time: "10:20", location: "北京朝阳", gender: "female", timeConfidence: "exact" },
    ];
    const signatures = sameMomentBirths.map((birth) => {
      const chart = calculateFourPillars(birth);
      return buildInterpretations(chart, birth).map(item => [
        item.id,
        item.plainLanguage,
        item.scenario,
        item.advantageVersion,
        item.shadowVersion,
        item.action,
        item.actionLongTerm,
      ].join("。")).join("\n");
    });

    for (let left = 0; left < signatures.length; left += 1) {
      for (let right = left + 1; right < signatures.length; right += 1) {
        expect(charBigramSimilarity(signatures[left], signatures[right])).toBeLessThan(0.5);
      }
    }
  });

  it("keeps personalized report combination duplicates below ten percent in a one hundred thousand person simulation", () => {
    const simulation = simulatePersonalizedReportCorpus({ count: 100000 });

    expect(simulation.count).toBe(100000);
    expect(simulation.atomicEntries).toBeGreaterThanOrEqual(260);
    expect(simulation.combinableVariants).toBeGreaterThanOrEqual(1000000000);
    expect(simulation.duplicateRate).toBeLessThan(0.1);
  });


  it("renders six actionable feng shui planning modules with visual diagrams in the tradition section", () => {
    const birth = births[0];
    const chart = calculateFourPillars(birth);
    const html = renderToStaticMarkup(createElement(TraditionSection, { chart, birth }));

    for (const title of ["工位风水", "办公室风水", "居家风水", "卧室风水", "阳宅风水", "阴宅风水"]) {
      expect(html).toContain(title);
    }
    expect((html.match(/class="fengshui-plan-card/g) ?? [])).toHaveLength(6);
    expect((html.match(/class="fengshui-diagram fengshui-diagram--/g) ?? [])).toHaveLength(6);
    expect((html.match(/<li>/g) ?? []).length).toBeGreaterThanOrEqual(30);
    expect(html).toContain("先看动线");
    expect(html).toContain("背后有靠");
    expect(html).toContain("采光通风");
    expect(html).toContain("图文规划");
  });

  it("offers more detailed everyday question presets for daily sign and qimen", () => {
    const birth = births[1];
    const chart = calculateFourPillars(birth);
    const draw = renderToStaticMarkup(createElement(DrawSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-08-03T10:00:00+08:00"),
    }));
    const qimen = renderToStaticMarkup(createElement(QimenSection, {
      chart,
      birth,
      onBackToChart: () => undefined,
      now: new Date("2026-08-03T10:00:00+08:00"),
    }));

    expect((draw.match(/aria-pressed="false"/g) ?? [])).toHaveLength(24);
    expect((qimen.match(/aria-pressed="false"/g) ?? [])).toHaveLength(24);
    for (const item of ["升职争取", "副业开始", "大额支出", "亲子沟通", "睡眠调整", "搬家出行"]) {
      expect(draw).toContain(`>${item}</button>`);
    }
    for (const item of ["面试汇报", "客户推进", "财务盘点", "关系破冰", "家事安排", "健康复诊"]) {
      expect(qimen).toContain(`>${item}</button>`);
    }
  });
});
