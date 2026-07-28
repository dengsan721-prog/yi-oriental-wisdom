import { createElement } from "react";
import { readFileSync } from "node:fs";
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
  it("keeps the first life-home screen focused on one simple self-cultivation record", () => {
    const html = renderToStaticMarkup(createElement(LifeHome, {
      profile,
      onChange: () => ({ ok: true as const }),
      onClear: () => ({ ok: true as const }),
      onViewReport: () => undefined,
    }));

    expect(html).toContain("今天遇到的小怪");
    expect(html).toContain("通关记录");
    expect(html).toContain("把一件事写成一枚经验值");
    expect(html).toContain("念、思、言、行");
    expect(html).not.toContain("填写的意义");
    expect(html).toContain('class="life-report-return"');
    expect(html).toContain('class="life-head-identity"');
    expect(html).toContain('class="life-local-actions"');
    expect(html).toContain("回看命盘报告");
    expect(html).toContain("<button>改命记录</button>");
    expect(html).toContain('aria-label="今天发生的一件事"');
    expect(html).toContain('aria-label="当下感受"');
    expect(html).toContain('aria-label="下一步计划"');
    expect(html).toContain("写下这一条");
    expect(html).not.toContain("记录一个关系");
    expect(html).not.toContain("人生首页入口");
    expect(html).not.toContain("年度计划入口");
    expect(html).not.toContain("月度计划入口");
    expect(html.indexOf("回看命盘报告")).toBeLessThan(html.indexOf("今天遇到的小怪"));
  });

  it("keeps change-life summaries, sprout guidance and rewards behind the top change button", () => {
    const source = readFileSync(new URL("../../components/yi/LifeHome.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

    expect(source).toContain('"改命记录"');
    expect(source).toContain('"change"');
    expect(source).toContain("修行进度");
    expect(source).toContain("本月打怪");
    expect(source).toContain("年度主线");
    expect(source).toContain("内容分析");
    expect(source).toContain("数据分析");
    expect(source).toContain("善念发芽");
    expect(source).toContain("称号徽章");
    expect(source).toContain("每一条记录都是一次把命运方向盘拿回来的练习");
    expect(source).toContain("连续填写");
    expect(source).toContain("立命、改过、积善、谦德");
    expect(source).toContain("查看命盘报告");
    expect(css).toContain(".life-record-window");
    expect(css).toContain(".life-change-dashboard");
    expect(css).toContain(".life-data-cube");
    expect(css).toContain(".life-change-dashboard>header");
    expect(css).toContain(".life-sprout-card");
    expect(css).toContain(".life-head-actions");
    expect(css).toContain(".life-report-return");
    expect(css).toContain(".life-head-identity");
    expect(css).toContain(".life-local-actions");
    expect(css).toContain("@media(max-width:520px){.life-head-simple{grid-template-columns:minmax(0,1fr) auto}.life-head-identity b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.life-head-actions{flex-wrap:nowrap}.life-head-simple button{white-space:nowrap;padding-inline:10px}.life-local-actions{display:flex;flex-wrap:nowrap;gap:8px}.life-local-actions button{flex:0 0 auto;min-height:38px;padding-inline:10px;font-size:13px}}");
  });
});
