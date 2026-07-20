import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { shouldRenderSourceNote } from "../../components/yi/ResultShell";
import { SourceNote } from "../../components/yi/SourceNote";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { getAllSources } from "../../lib/yi/source-audit";
import { YI_RULE_SOURCES } from "../../lib/yi/sources";

const chart = calculateFourPillars({ name: "", date: "1990-06-15", time: "09:30", location: "杭州", gender: "female", timeConfidence: "exact" });
const items = buildInterpretations(chart);

describe("section-owned source note", () => {
  it("belongs only to the detailed interpretation chapter", () => {
    expect(shouldRenderSourceNote("detail")).toBe(true);
    for (const section of ["portrait", "chart", "fortune", "mirror", "compatibility", "tradition"] as const) {
      expect(shouldRenderSourceNote(section)).toBe(false);
    }
  });

  it("renders concise registered theory and product-translation labels", () => {
    const html = renderToStaticMarkup(createElement(SourceNote, { chart, items }));
    const ids = [...new Set(items.flatMap(item => item.sourceRuleIds))];
    expect(html).toContain("理论依据");
    expect(html).toContain("现代转译");
    expect(html).toContain("查看完整来源与规则");
    for (const id of ids) expect(html).toContain(YI_RULE_SOURCES[id].label);
    expect(html).not.toContain(items[0].sourceTradition);
  });

  it("shows resolved source governance details only inside the disclosure", () => {
    const html = renderToStaticMarkup(createElement(SourceNote, { chart, items }));
    const details = html.slice(html.indexOf("<details"), html.indexOf("</details>") + "</details>".length);
    const beforeDetails = html.slice(0, html.indexOf("<details"));
    const ids = [...new Set(items.flatMap(item => item.sourceRuleIds))];
    const registry = new Map(getAllSources().map(source => [source.id, source]));
    for (const id of ids) {
      const source = registry.get(id)!;
      for (const value of [source.title, source.grade, source.role, source.editionNote, source.boundary]) {
        expect(details).toContain(value);
        expect(beforeDetails).not.toContain(value);
      }
      if (source.url) {
        expect(details).toContain(`href="${source.url}"`);
        expect(beforeDetails).not.toContain(`href="${source.url}"`);
      }
    }
  });
});
