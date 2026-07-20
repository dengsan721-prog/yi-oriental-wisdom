import { describe, expect, it } from "vitest";
import { HISTORICAL_MIRRORS } from "../../lib/yi/historical-mirrors";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { MOVIE_CHARACTERS } from "../../lib/yi/movie-characters";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { getAllSources } from "../../lib/yi/sources";
import { auditSourceReferences } from "../../lib/yi/source-audit";

const chart = calculateFourPillars({
  name: "",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "female",
  timeConfidence: "exact",
});

describe("unified Yi source registry", () => {
  it("keeps descriptive, HTTPS-safe, uniquely identified source records", () => {
    const sources = getAllSources();
    expect(sources.length).toBeGreaterThanOrEqual(15);
    expect(new Set(sources.map(source => source.id)).size).toBe(sources.length);
    for (const source of sources) {
      expect(source.id).toMatch(/^[a-z0-9.-]+$/);
      expect(source.role.length).toBeGreaterThanOrEqual(12);
      expect(source.editionNote.length).toBeGreaterThanOrEqual(12);
      expect(source.boundary.length).toBeGreaterThanOrEqual(12);
      expect(source.accessDate).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      if (source.url) expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it("resolves every interpretation rule and reports distinct unknown IDs in first-seen order", () => {
    const ruleIds = buildInterpretations(chart).flatMap(item => item.sourceRuleIds);
    expect(auditSourceReferences(ruleIds)).toEqual([]);
    expect(auditSourceReferences(["missing.one", "missing.one", "missing.two", "missing.one"])).toEqual([
      "来源不存在:missing.one",
      "来源不存在:missing.two",
    ]);
  });

  it("registers every current historical and film mirror identity plus the zodiac model", () => {
    const ids = new Set(getAllSources().map(source => source.id));
    for (const candidate of [...HISTORICAL_MIRRORS, ...MOVIE_CHARACTERS]) {
      expect(ids.has(candidate.id)).toBe(true);
    }
    expect(ids.has("model.western-astrology-element-modality")).toBe(true);
  });
});
