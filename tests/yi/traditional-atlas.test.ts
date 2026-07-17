import { describe, expect, it } from "vitest";
import { TRADITIONAL_SOURCE_CATALOG } from "../../lib/yi/traditional-sources";

describe("traditional source catalog", () => {
  it("contains every confirmed core classic with an explicit role", () => {
    const sources = Object.values(TRADITIONAL_SOURCE_CATALOG);
    const titles = sources.map((source) => source.title);

    expect(titles).toEqual(expect.arrayContaining([
      "渊海子平", "滴天髓", "子平真诠", "穷通宝鉴", "三命通会",
      "麻衣神相", "周易", "梅花易数", "神峰通考", "命理约言",
    ]));
    expect(sources).toHaveLength(10);

    for (const source of sources) {
      expect(source.usage.length).toBeGreaterThan(8);
      expect(source.editionNote.length).toBeGreaterThan(5);
      expect(source.boundary.length).toBeGreaterThan(8);
      if (source.url) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.editionNote).toContain("2026-07-17");
      }
    }
  });

  it("keeps source disciplines separate", () => {
    const sources = Object.values(TRADITIONAL_SOURCE_CATALOG);
    expect(sources.filter((source) => source.category === "相学").map((source) => source.title)).toEqual(["麻衣神相"]);
    expect(sources.filter((source) => source.category === "象数").map((source) => source.title)).toEqual(["周易", "梅花易数"]);
    expect(sources.every((source) => !source.boundary.includes("科学证明"))).toBe(true);
  });
});
