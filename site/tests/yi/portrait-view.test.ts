import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PortraitSection } from "../../components/yi/PortraitSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";
import { matchAnimalArchetype, matchHistoricalMirror } from "../../lib/yi/mirrors";

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

  const items = buildInterpretations(chart);
  const html = renderToStaticMarkup(createElement(PortraitSection, {
    chart,
    overview,
    items,
  }));

  expect(html).toContain("<h1>辛日主 · 人生观察</h1>");
  expect(html).not.toContain("辛日主日主");
  for (const label of ["一句话看懂", "核心特征 01", "核心特征 02", "核心特征 03", "别人眼中的我", "真实的我", "天赋怎么用", "压力下的反应", "当前人生主线"]) {
    expect(html).toContain(label);
  }
  expect(html).toContain("专业依据");
  const identity = items.find(item => item.id === "self-day-master");
  expect(identity).toBeTruthy();
  expect(html).toContain(identity!.basis);
  const animal = matchAnimalArchetype(chart);
  const person = matchHistoricalMirror(chart);
  expect(html).toContain("自然动物原型");
  expect(html).toContain(animal.name);
  expect(html).toContain(animal.caution);
  expect(html).toContain("历史人物维度");
  expect(html).toContain(person.person);
  expect(html).toContain(person.source);
});
