import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReferenceAtlasSection } from "../../components/yi/ReferenceAtlasSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  buildMoleDetailTitle,
  getUserSideLabel,
  MIRROR_GUIDANCE,
} from "../../lib/yi/atlas-orientation";
import {
  getAtlasGroups,
  getAtlasOption,
  resolveAtlasVisual,
  resolveReferenceGender,
  type AtlasVisual,
  type ReferenceGender,
} from "../../lib/yi/traditional-atlas";
import type { BirthInput } from "../../lib/yi/types";

const genders: ReferenceGender[] = ["male", "female"];
const atlasBirth = {
  name: "",
  date: "1990-06-15",
  time: "09:30",
  location: "上海",
  gender: "male",
  timeConfidence: "exact",
} satisfies BirthInput;
const atlasChart = calculateFourPillars(atlasBirth);

const expectedMoleMetadata = {
  "mole-forehead-center": { userSide: "center", landmark: "额部正中，发际线与眉间之间" },
  "mole-temple-left": { userSide: "left", landmark: "对应侧眉尾外上方与发际线之间" },
  "mole-temple-right": { userSide: "right", landmark: "对应侧眉尾外上方与发际线之间" },
  "mole-brow": { userSide: "center", landmark: "两眉之间至眉体内侧" },
  "mole-eye-lower": { userSide: "right", landmark: "用户右眼下睑与颧骨上缘之间" },
  "mole-nose": { userSide: "center", landmark: "鼻梁、鼻头与鼻翼区域" },
  "mole-cheek-left": { userSide: "left", landmark: "对应侧眼外下方至鼻翼外侧的颧面区" },
  "mole-cheek-right": { userSide: "right", landmark: "对应侧眼外下方至鼻翼外侧的颧面区" },
  "mole-philtrum": { userSide: "center", landmark: "鼻底与上唇之间的纵向沟" },
  "mole-mouth-corner": { userSide: "right", landmark: "用户右侧上下唇交界外缘" },
  "mole-chin": { userSide: "center", landmark: "下唇下方至下颌底缘的正中区域" },
  "mole-jaw": { userSide: "right", landmark: "用户右侧嘴角外下方至下颌角之间" },
} as const;

const expectedGeometry = {
  "face-oval": { visualFocus: { x: 0, y: 0, width: 20, height: 100 } },
  "face-round": { visualFocus: { x: 20, y: 0, width: 20, height: 100 } },
  "face-square": { visualFocus: { x: 40, y: 0, width: 20, height: 100 } },
  "face-long": { visualFocus: { x: 60, y: 0, width: 20, height: 100 } },
  "face-heart": { visualFocus: { x: 80, y: 0, width: 20, height: 100 } },
  "face-brow-straight": { visualFocus: { x: 2, y: 32, width: 16, height: 11 } },
  "face-brow-arched": { visualFocus: { x: 22, y: 32, width: 16, height: 11 } },
  "face-eye-open": { visualFocus: { x: 42, y: 36, width: 16, height: 10 } },
  "face-nose-defined": { visualFocus: { x: 67, y: 39, width: 6, height: 25 } },
  "face-mouth-balanced": { visualFocus: { x: 86, y: 55, width: 8, height: 9 } },
  "mole-forehead-center": { hotspot: { x: 50, y: 19 } },
  "mole-temple-left": { hotspot: { x: 36, y: 28 } },
  "mole-temple-right": { hotspot: { x: 64, y: 28 } },
  "mole-brow": { hotspot: { x: 45, y: 34 } },
  "mole-eye-lower": { hotspot: { x: 56, y: 41 } },
  "mole-nose": { hotspot: { x: 50, y: 51 } },
  "mole-cheek-left": { hotspot: { x: 38, y: 52 } },
  "mole-cheek-right": { hotspot: { x: 62, y: 52 } },
  "mole-philtrum": { hotspot: { x: 50, y: 62 } },
  "mole-mouth-corner": { hotspot: { x: 61, y: 67 } },
  "mole-chin": { hotspot: { x: 50, y: 78 } },
  "mole-jaw": { hotspot: { x: 66, y: 74 } },
  "palm-wood": { visualFocus: { x: 0, y: 0, width: 20, height: 100 } },
  "palm-fire": { visualFocus: { x: 20, y: 0, width: 20, height: 100 } },
  "palm-earth": { visualFocus: { x: 40, y: 0, width: 20, height: 100 } },
  "palm-metal": { visualFocus: { x: 60, y: 0, width: 20, height: 100 } },
  "palm-water": { visualFocus: { x: 80, y: 0, width: 20, height: 100 } },
  "palm-life": { hotspot: { x: 33, y: 58 } },
  "palm-head": { hotspot: { x: 33, y: 49 } },
  "palm-heart": { hotspot: { x: 34, y: 38 } },
  "palm-fate": { hotspot: { x: 67, y: 55 } },
  "palm-sun": { hotspot: { x: 72, y: 42 } },
} as const;

const horizontalMirrorTransformPattern =
  /scaleX\(\s*-1(?:\.0+)?\s*\)|rotateY\(\s*180(?:\.0+)?deg\s*\)|scale\(\s*-1(?:\.0+)?(?:\s*\)|\s*,\s*1(?:\.0+)?\s*\)|\s+1(?:\.0+)?\s*\))|matrix\(\s*-1(?:\.0+)?(?:\s*,\s*|\s+)0(?:\.0+)?(?:\s*,\s*|\s+)0(?:\.0+)?(?:\s*,\s*|\s+)1(?:\.0+)?(?:\s*,\s*|\s+)/i;

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
  it("states the mirror rule in the user's own left and right", () => {
    expect(MIRROR_GUIDANCE).toBe(
      "这是一张镜面人脸图。请像平时照镜子一样对照：画面右侧是你的右脸，画面左侧是你的左脸，无需在脑中反转方向。",
    );
    expect(MIRROR_GUIDANCE).not.toMatch(/观察者左侧|观察者右侧|摄影者左侧|摄影者右侧/);
  });

  it.each([
    ["left", "你的左脸"],
    ["center", "正面中线"],
    ["right", "你的右脸"],
  ] as const)("labels %s as %s", (side, label) => {
    expect(getUserSideLabel(side)).toBe(label);
  });

  it("builds side-specific mole detail titles with a center fallback", () => {
    expect(buildMoleDetailTitle({ id: "mole-temple-right", title: "右侧太阳穴", userSide: "right" }))
      .toBe("你的右脸 · 右侧太阳穴 · temple-right");
    expect(buildMoleDetailTitle({ id: "mole-brow", title: "眉间眉内区域" }))
      .toBe("正面中线 · 眉间眉内区域 · brow");
  });

  it("assigns an exact user side and anatomical landmark to every mole option", () => {
    const actual = Object.fromEntries(
      getAtlasGroups("mole").flatMap((group) => group.options).map((option) => [option.id, {
        userSide: option.userSide,
        landmark: option.landmark,
      }]),
    );

    expect(actual).toEqual(expectedMoleMetadata);
    for (const metadata of Object.values(actual)) {
      expect(metadata.landmark?.trim().length).toBeGreaterThan(4);
    }
  });

  it("preserves every atlas focus and hotspot in the final display plane", () => {
    const actual = Object.fromEntries(
      (["face", "mole", "palm"] as const).flatMap((method) => getAtlasGroups(method))
        .flatMap((group) => group.options)
        .map((option) => {
          const visual = resolveAtlasVisual(option, "female");
          return [option.id, visual.visualFocus ? { visualFocus: visual.visualFocus } : { hotspot: visual.hotspot }];
        }),
    );

    expect(actual).toEqual(expectedGeometry);
  });

  it("keeps mirror flags intentional and star records non-photographic", () => {
    for (const method of ["face", "mole"] as const) {
      for (const option of getAtlasGroups(method).flatMap((group) => group.options)) {
        expect(resolveAtlasVisual(option, "male").mirrored).toBe(true);
        expect(resolveAtlasVisual(option, "female").mirrored).toBe(true);
      }
    }
    for (const option of getAtlasGroups("palm").flatMap((group) => group.options)) {
      expect(resolveAtlasVisual(option, "female").mirrored).toBe(false);
    }
    for (const option of getAtlasGroups("star").flatMap((group) => group.options)) {
      expect(option.visual).toBeUndefined();
      expect(option.visuals).toBeUndefined();
    }
  });

  it.each([
    ["CSS scaleX", "transform: scaleX(-1)"],
    ["3D rotateY", "transform: rotateY(180deg)"],
    ["single-value scale", "transform: scale(-1)"],
    ["CSS two-value scale", "transform: scale(-1, 1)"],
    ["SVG space-separated scale", '<g transform="scale(-1 1)">'],
    ["whitespace and case scale", "transform: SCALE( -1.0 , 1.0 )"],
    ["CSS matrix", "transform: matrix(-1, 0, 0, 1, 0, 0)"],
    ["SVG matrix", '<g transform="matrix(-1 0 0 1 0 0)">'],
    ["whitespace and case matrix", "transform: MATRIX( -1.0 , 0 , 0 , 1 , 0 , 0 )"],
  ])("detects the forbidden %s horizontal mirror", (_label, source) => {
    expect(source).toMatch(horizontalMirrorTransformPattern);
  });

  it.each([
    ["ordinary negative position", "left: -1px"],
    ["negative translation", "transform: translateX(-1px)"],
    ["vertical scale", "transform: scale(1, -1)"],
    ["negative rotation", "transform: rotate(-1deg)"],
    ["vertical matrix", "transform: matrix(1, 0, 0, -1, 0, 0)"],
  ])("does not mistake %s for a horizontal mirror", (_label, source) => {
    expect(source).not.toMatch(horizontalMirrorTransformPattern);
  });

  it("contains no observer-side ambiguity, capture behavior, or horizontal mirror transform", () => {
    const sourcePaths = [
      new URL("../../lib/yi/traditional-atlas.ts", import.meta.url),
      new URL("../../lib/yi/atlas-orientation.ts", import.meta.url),
      new URL("../../components/yi/ReferenceAtlasSection.tsx", import.meta.url),
      new URL("../../app/globals.css", import.meta.url),
    ];
    const productionSource = sourcePaths.map((path) => readFileSync(fileURLToPath(path), "utf8")).join("\n");

    expect(productionSource).not.toMatch(/观察者(?:左|右)侧|摄影者(?:左|右)侧/);
    expect(productionSource).not.toMatch(
      /getUserMedia|mediaDevices|FaceDetector|FileReader|FormData|URL\.createObjectURL|type=["']file["']|accept=["']image|\bupload\b|\brecognition\b/i,
    );
    expect(productionSource).not.toMatch(horizontalMirrorTransformPattern);
  });

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

  it.each([
    ["male", "reference/face-shapes-male.webp"],
    ["female", "reference/face-shapes-female.webp"],
    ["unspecified", "reference/face-shapes-female.webp"],
  ] as const)("renders the default face visual for %s birth gender", (gender, expectedImage) => {
    const birth = { ...atlasBirth, gender };
    const html = renderToStaticMarkup(createElement(ReferenceAtlasSection, { chart: atlasChart, birth }));

    expect(html).toContain(`src="/${expectedImage}"`);
    expect(html).not.toContain("src=\"undefined\"");
    expect(html).toContain("aspect-ratio:2.5");
    expect(html).toContain('class="atlas-visual-focus"');
    expect(html).toContain("left:0%;top:0%;width:20%;height:100%");
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
