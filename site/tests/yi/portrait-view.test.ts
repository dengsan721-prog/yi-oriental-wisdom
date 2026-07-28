import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PortraitSection } from "../../components/yi/PortraitSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { buildProfessionalReport } from "../../lib/yi/report-model";

it("presents the portrait route as the story-first life scroll", () => {
  const birth = {
    name: "林",
    date: "1990-06-15",
    time: "09:30",
    location: "浙江省杭州市",
    gender: "female" as const,
    timeConfidence: "exact" as const,
  };
  const chart = calculateFourPillars({
    ...birth,
  });
  const items = buildInterpretations(chart);
  const html = renderToStaticMarkup(createElement(PortraitSection, {
    birth,
    chart,
    report: buildProfessionalReport(chart, birth),
    items,
    today: new Date("2026-07-28T00:00:00+08:00"),
  }));

  for (const label of [
    "人生画卷",
    "人生一句话",
    "事业线",
    "婚姻与关系线",
    "命运转折线",
    "中后程",
  ]) {
    expect(html).toContain(label);
  }
  expect(html).not.toContain("辛日主");
  expect(html).not.toContain("人生观察");
  expect(html).not.toContain("核心特征 01");
});
