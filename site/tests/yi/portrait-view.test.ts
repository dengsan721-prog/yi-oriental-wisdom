import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PortraitSection } from "../../components/yi/PortraitSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";

it("renders the already-qualified day-master label exactly once", () => {
  const chart = calculateFourPillars({
    name: "林",
    date: "1990-06-15",
    time: "09:30",
    location: "浙江省杭州市",
    gender: "female",
    timeConfidence: "exact",
  });
  const overview = buildProfessionalOverview(chart);
  expect(overview.dayMaster).toBe("辛日主");

  const html = renderToStaticMarkup(createElement(PortraitSection, {
    overview,
    items: buildInterpretations(chart),
  }));

  expect(html).toContain("<h1>辛日主 · 人生观察</h1>");
  expect(html).not.toContain("辛日主日主");
});
