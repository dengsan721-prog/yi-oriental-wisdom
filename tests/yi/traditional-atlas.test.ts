import { describe, expect, it } from "vitest";
import { TRADITIONAL_SOURCE_CATALOG } from "../../lib/yi/traditional-sources";
import {
  buildAtlasReading,
  getAtlasGroups,
  getAtlasMethods,
  getAtlasOption,
  resolveAtlasVisual,
} from "../../lib/yi/traditional-atlas";
import { calculateFourPillars } from "../../lib/yi/four-pillars";

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

describe("traditional self-comparison atlases", () => {
  it("ships four complete atlases with stable totals", () => {
    expect(getAtlasMethods().map((item) => item.id)).toEqual(["face", "mole", "palm", "star"]);
    expect(getAtlasGroups("face").flatMap((group) => group.options)).toHaveLength(10);
    expect(getAtlasGroups("mole").flatMap((group) => group.options)).toHaveLength(12);
    expect(getAtlasGroups("palm").flatMap((group) => group.options)).toHaveLength(10);
    expect(getAtlasGroups("star").flatMap((group) => group.options)).toHaveLength(12);
  });

  it("gives every option seven substantial layers, a caution and a source", () => {
    for (const method of getAtlasMethods()) {
      for (const group of getAtlasGroups(method.id)) {
        for (const option of group.options) {
          expect([
            option.professionalResult, option.traditionalBasis, option.plainLanguage,
            option.lifeScene, option.strengthAndPitfall, option.action, option.chartComparison,
          ].every((value) => value.length >= 12)).toBe(true);
          expect(option.caution.length).toBeGreaterThanOrEqual(12);
          expect(option.sourceIds.length).toBeGreaterThan(0);
          expect(getAtlasOption(option.id)?.id).toBe(option.id);
        }
      }
    }
  });

  it("keeps every photographic choice visually distinct on a fixed source coordinate plane", () => {
    const photographicOptions = getAtlasMethods()
      .filter((method) => method.id !== "star")
      .flatMap((method) => getAtlasGroups(method.id))
      .flatMap((group) => group.options);
    const visualKeys = photographicOptions.map((option) => {
      const visual = resolveAtlasVisual(option, "female");
      return `${visual.image}:${JSON.stringify(visual.visualFocus ?? visual.hotspot)}`;
    });

    expect(new Set(visualKeys).size).toBe(photographicOptions.length);
    for (const option of photographicOptions) {
      const visual = resolveAtlasVisual(option, "female");
      expect(visual.imageAspect).toBeGreaterThan(1);
      expect(visual.visualFocus ?? visual.hotspot).toBeTruthy();
    }

    const faceFeatures = getAtlasGroups("face")[1].options;
    expect(new Set(faceFeatures.map((option) => resolveAtlasVisual(option, "female").image))).toEqual(
      new Set(["reference/face-features-female.webp"]),
    );
    const palmShapes = getAtlasGroups("palm")[0].options;
    expect(new Set(palmShapes.map((option) => resolveAtlasVisual(option, "female").image))).toEqual(
      new Set(["reference/palm-shape-reference.webp"]),
    );
  });

  it("translates a selected option against the real main chart without certainty claims", () => {
    const chart = calculateFourPillars({
      name: "", date: "1990-06-15", time: "09:30", location: "上海",
      gender: "unspecified", timeConfidence: "exact",
    });
    const option = getAtlasOption("face-square")!;
    const reading = buildAtlasReading(option, chart);

    expect(reading.layers).toHaveLength(7);
    expect(reading.layers.map((layer) => layer.label)).toEqual([
      "传统结果", "传统依据", "白话翻译", "生活场景", "优势与误区", "行动建议", "主盘对照",
    ]);
    expect(reading.layers[6].text).toContain(`${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}日主`);
    expect(JSON.stringify(reading)).not.toMatch(/注定|必然|寿命|疾病诊断/);
  });
});
