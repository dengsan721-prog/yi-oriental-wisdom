import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getAtlasGroups,
  getAtlasOption,
  resolveAtlasVisual,
  resolveReferenceGender,
  type AtlasVisual,
  type ReferenceGender,
} from "../../lib/yi/traditional-atlas";

const genders: ReferenceGender[] = ["male", "female"];

function expectBoundedFocus(focus: NonNullable<AtlasVisual["visualFocus"]>) {
  expect(focus.x).toBeGreaterThanOrEqual(0);
  expect(focus.y).toBeGreaterThanOrEqual(0);
  expect(focus.width).toBeGreaterThan(0);
  expect(focus.height).toBeGreaterThan(0);
  expect(focus.x + focus.width).toBeLessThanOrEqual(100);
  expect(focus.y + focus.height).toBeLessThanOrEqual(100);
}

function expectBoundedHotspot(hotspot: NonNullable<AtlasVisual["hotspot"]>) {
  expect(hotspot.x).toBeGreaterThanOrEqual(0);
  expect(hotspot.x).toBeLessThanOrEqual(100);
  expect(hotspot.y).toBeGreaterThanOrEqual(0);
  expect(hotspot.y).toBeLessThanOrEqual(100);
}

function geometryWithoutImage(visual: AtlasVisual) {
  return {
    imageAspect: visual.imageAspect,
    visualFocus: visual.visualFocus,
    hotspot: visual.hotspot,
    view: visual.view,
    mirrored: visual.mirrored,
  };
}

describe("traditional atlas orientation", () => {
  it.each([
    ["male", undefined, "male"],
    ["male", "female", "male"],
    ["female", undefined, "female"],
    ["female", "male", "female"],
    ["unspecified", undefined, "female"],
    ["unspecified", "male", "male"],
    ["unspecified", "female", "female"],
  ] as const)("resolves birth gender %s with override %s to %s", (birthGender, override, expected) => {
    expect(resolveReferenceGender(birthGender, override)).toBe(expected);
  });

  it("resolves one stable face id and one stable mole id to gender-specific images", () => {
    for (const id of ["face-square", "mole-nose"]) {
      const option = getAtlasOption(id)!;

      expect(resolveAtlasVisual(option, "male").image).not.toBe(resolveAtlasVisual(option, "female").image);
      expect(getAtlasOption(id)?.id).toBe(id);
    }
  });

  it("maps all face choices to paired mirrored contact sheets with identical geometry", () => {
    const options = getAtlasGroups("face").flatMap((group) => group.options);
    expect(options).toHaveLength(10);

    for (const option of options) {
      expect(Object.keys(option.visuals ?? {}).sort()).toEqual(["female", "male"]);
      expect(option).not.toHaveProperty("visual");
      expect(option).not.toHaveProperty("image");
      expect(option).not.toHaveProperty("imageAspect");
      expect(option).not.toHaveProperty("visualFocus");
      expect(option).not.toHaveProperty("hotspot");

      const isFeature = option.id.startsWith("face-brow")
        || option.id === "face-eye-open"
        || option.id === "face-nose-defined"
        || option.id === "face-mouth-balanced";
      for (const gender of genders) {
        const visual = resolveAtlasVisual(option, gender);
        expect(visual.image).toBe(`reference/face-${isFeature ? "features" : "shapes"}-${gender}.webp`);
        expect(visual.imageAspect).toBe(5 / 2);
        expect(visual.view).toBe("front");
        expect(visual.mirrored).toBe(true);
        expect(visual.visualFocus).toBeDefined();
        expectBoundedFocus(visual.visualFocus!);
      }

      expect(geometryWithoutImage(resolveAtlasVisual(option, "male"))).toEqual(
        geometryWithoutImage(resolveAtlasVisual(option, "female")),
      );
    }
  });

  it("maps all mole choices to paired mirrored front or matching user-side references", () => {
    const options = getAtlasGroups("mole").flatMap((group) => group.options);
    expect(options).toHaveLength(12);

    for (const option of options) {
      expect(Object.keys(option.visuals ?? {}).sort()).toEqual(["female", "male"]);
      expect(option).not.toHaveProperty("visual");
      expect(option).not.toHaveProperty("image");
      expect(option).not.toHaveProperty("imageAspect");
      expect(option).not.toHaveProperty("visualFocus");
      expect(option).not.toHaveProperty("hotspot");

      const side = option.id.endsWith("-left") ? "left" : option.id.endsWith("-right") ? "right" : "front";
      const view = side === "left" ? "user-left" : side === "right" ? "user-right" : "front";
      for (const gender of genders) {
        const visual = resolveAtlasVisual(option, gender);
        expect(visual.image).toBe(`reference/mole-${gender}-${side}.webp`);
        expect(visual.imageAspect).toBe(1448 / 1086);
        expect(visual.view).toBe(view);
        expect(visual.mirrored).toBe(true);
        expect(visual.hotspot).toBeDefined();
        expectBoundedHotspot(visual.hotspot!);
      }

      expect(geometryWithoutImage(resolveAtlasVisual(option, "male"))).toEqual(
        geometryWithoutImage(resolveAtlasVisual(option, "female")),
      );
    }
  });

  it("keeps all palm choices on one unmirrored gender-neutral visual", () => {
    const groups = getAtlasGroups("palm");
    const options = groups.flatMap((group) => group.options);
    expect(options).toHaveLength(10);

    for (const option of options) {
      expect(option.visuals).toBeUndefined();
      expect(option.visual).toBeDefined();
      expect(option).not.toHaveProperty("image");
      expect(option).not.toHaveProperty("imageAspect");
      expect(option).not.toHaveProperty("visualFocus");
      expect(option).not.toHaveProperty("hotspot");

      const visual = resolveAtlasVisual(option, "female");
      const isShape = groups[0].options.some((candidate) => candidate.id === option.id);
      expect(visual.image).toBe(isShape ? "reference/palm-shape-reference.webp" : "reference/palm-reference.webp");
      expect(visual.imageAspect).toBe(isShape ? 1778 / 885 : 1448 / 1086);
      expect(visual.view).toBe("front");
      expect(visual.mirrored).toBe(false);
      if (isShape) {
        expect(visual.visualFocus).toBeDefined();
        expect(visual.hotspot).toBeUndefined();
        expectBoundedFocus(visual.visualFocus!);
      } else {
        expect(visual.hotspot).toBeDefined();
        expect(visual.visualFocus).toBeUndefined();
        expectBoundedHotspot(visual.hotspot!);
      }
      expect(resolveAtlasVisual(option, "male")).toBe(visual);
    }
  });

  it("keeps all star choices free of photographic visuals", () => {
    const options = getAtlasGroups("star").flatMap((group) => group.options);
    expect(options).toHaveLength(12);

    for (const option of options) {
      expect(option.visual).toBeUndefined();
      expect(option.visuals).toBeUndefined();
      expect(option).not.toHaveProperty("image");
      expect(option).not.toHaveProperty("imageAspect");
      expect(option).not.toHaveProperty("visualFocus");
      expect(option).not.toHaveProperty("hotspot");
    }
  });

  it("throws a clear error when an option has no usable visual", () => {
    expect(() => resolveAtlasVisual(getAtlasOption("star-aries")!, "female")).toThrow(/star-aries:female/);
  });

  it("preserves stable group order and option ids", () => {
    expect(getAtlasGroups("face").map((group) => group.options.map((option) => option.id))).toEqual([
      ["face-oval", "face-round", "face-square", "face-long", "face-heart"],
      ["face-brow-straight", "face-brow-arched", "face-eye-open", "face-nose-defined", "face-mouth-balanced"],
    ]);
    expect(getAtlasGroups("mole").map((group) => group.options.map((option) => option.id))).toEqual([[
      "mole-forehead-center", "mole-temple-left", "mole-temple-right", "mole-brow", "mole-eye-lower", "mole-nose",
      "mole-cheek-left", "mole-cheek-right", "mole-philtrum", "mole-mouth-corner", "mole-chin", "mole-jaw",
    ]]);
    expect(getAtlasGroups("palm").map((group) => group.options.map((option) => option.id))).toEqual([
      ["palm-wood", "palm-fire", "palm-earth", "palm-metal", "palm-water"],
      ["palm-life", "palm-head", "palm-heart", "palm-fate", "palm-sun"],
    ]);
    expect(getAtlasGroups("star").map((group) => group.options.map((option) => option.id))).toEqual([[
      "star-aries", "star-taurus", "star-gemini", "star-cancer", "star-leo", "star-virgo",
      "star-libra", "star-scorpio", "star-sagittarius", "star-capricorn", "star-aquarius", "star-pisces",
    ]]);
  });

  it("does not introduce upload, camera or recognition behavior in source or public atlas data", () => {
    const sourcePath = fileURLToPath(new URL("../../lib/yi/traditional-atlas.ts", import.meta.url));
    const sourceAndApiText = `${readFileSync(sourcePath, "utf8")}\n${JSON.stringify(
      ["face", "mole", "palm", "star"].flatMap((method) => getAtlasGroups(method as "face" | "mole" | "palm" | "star")),
    )}`;

    expect(sourceAndApiText).not.toMatch(
      /upload|camera|recognition|biometric|photo[-_ ]?analysis|上传|摄像头|相机|人脸识别|图像识别|生物特征|照片分析/i,
    );
  });
});
