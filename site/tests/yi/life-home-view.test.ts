import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LifeHome } from "../../components/yi/LifeHome";
import type { LifeProfile } from "../../lib/yi/life-profile";

const profile: LifeProfile = {
  version: 1,
  name: "小艺",
  birth: {
    name: "小艺",
    date: "1990-04-18",
    time: "08:30",
    location: "",
    gender: "female",
    timeConfidence: "exact",
  },
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
  currentStage: "在稳住节奏后打开新的空间",
  annualMap: [
    { year: 2026, theme: "年度复盘计划模板", focus: "只推进一件重要的事" },
  ],
  monthlyRhythm: [
    { month: "2026-07", theme: "月度行动计划模板", action: "写下本月要停止的一件事" },
  ],
  events: [
    { id: "event-1", title: "准备转岗", date: "2026-08-01", note: "先完成信息访谈" },
  ],
  relations: [
    { id: "relation-1", name: "家人", relationship: "family", note: "每周留一次不带建议的倾听" },
  ],
  actions: [
    { id: "action-1", text: "约一次信息访谈", done: true },
    { id: "action-2", text: "整理本月边界", done: false },
  ],
};

describe("life home overview", () => {
  it("makes recording an event and a relation the first overview actions", () => {
    const html = renderToStaticMarkup(createElement(LifeHome, {
      profile,
      onChange: () => ({ ok: true }),
      onClear: () => ({ ok: true }),
      onViewReport: () => undefined,
    }));

    expect(html).toContain("记录一件事");
    expect(html).toContain("记录一个关系");
    expect(html).toContain("成就看板");
    expect(html).toContain("已完成 1/2");
    expect(html.indexOf("记录一件事")).toBeLessThan(html.indexOf("年度计划入口"));
    expect(html.indexOf("记录一个关系")).toBeLessThan(html.indexOf("月度计划入口"));
  });
});
