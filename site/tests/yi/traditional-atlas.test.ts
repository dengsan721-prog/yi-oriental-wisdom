import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
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
import { ZODIAC_PROFILES } from "../../lib/yi/zodiac-profiles";

const FACE_IDS = [
  "face-oval", "face-round", "face-square", "face-long", "face-heart",
  "face-brow-straight", "face-brow-arched", "face-eye-open", "face-nose-defined", "face-mouth-balanced",
] as const;
const MOLE_IDS = [
  "mole-forehead-center", "mole-temple-left", "mole-temple-right", "mole-brow", "mole-eye-lower", "mole-nose",
  "mole-cheek-left", "mole-cheek-right", "mole-philtrum", "mole-mouth-corner", "mole-chin", "mole-jaw",
] as const;
const PALM_IDS = [
  "palm-wood", "palm-fire", "palm-earth", "palm-metal", "palm-water",
  "palm-life", "palm-head", "palm-heart", "palm-fate", "palm-sun",
] as const;
const TRADITIONAL_IDS = [...FACE_IDS, ...MOLE_IDS, ...PALM_IDS] as const;

function expectTextToContainEvery(text: string, fragments: string[]) {
  for (const fragment of fragments) expect.soft(text).toContain(fragment);
}

const GENDERED_ATLAS_ASSETS = [
  "face-shapes-male.webp", "face-shapes-female.webp",
  "face-features-male.webp", "face-features-female.webp",
  "mole-male-front.webp", "mole-male-left.webp", "mole-male-right.webp",
  "mole-female-front.webp", "mole-female-left.webp", "mole-female-right.webp",
] as const;

function readWebpDimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(buffer.subarray(8, 12).toString("ascii")).toBe("WEBP");

  for (let offset = 12; offset + 8 <= buffer.length;) {
    const chunkType = buffer.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + chunkSize > buffer.length) {
      throw new Error(`WebP 文件包含截断的数据区块：${chunkType}`);
    }

    if (chunkType === "VP8X" && chunkSize >= 10) {
      return {
        width: buffer.readUIntLE(payload + 4, 3) + 1,
        height: buffer.readUIntLE(payload + 7, 3) + 1,
      };
    }
    if (chunkType === "VP8 " && chunkSize >= 10) {
      expect(buffer.subarray(payload + 3, payload + 6)).toEqual(Buffer.from([0x9d, 0x01, 0x2a]));
      return {
        width: buffer.readUInt16LE(payload + 6) & 0x3fff,
        height: buffer.readUInt16LE(payload + 8) & 0x3fff,
      };
    }
    if (chunkType === "VP8L" && chunkSize >= 5) {
      expect(buffer[payload]).toBe(0x2f);
      const packed = buffer.readUInt32LE(payload + 1);
      return {
        width: (packed & 0x3fff) + 1,
        height: ((packed >>> 14) & 0x3fff) + 1,
      };
    }

    offset = payload + chunkSize + (chunkSize % 2);
  }

  throw new Error("WebP 文件缺少 VP8、VP8L 或 VP8X 图像区块");
}

function makeWebpChunk(type: string, payload: Buffer, declaredSize = payload.length) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32LE(declaredSize, 4);
  const padding = declaredSize % 2 === 1 ? Buffer.from([0]) : Buffer.alloc(0);
  return Buffer.concat([header, payload, padding]);
}

function makeWebp(...chunks: Buffer[]) {
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, 4, "ascii");
  header.writeUInt32LE(body.length + 4, 4);
  header.write("WEBP", 8, 4, "ascii");
  return Buffer.concat([header, body]);
}

function makeVp8Payload(width: number, height: number) {
  const payload = Buffer.alloc(10);
  payload.set([0x9d, 0x01, 0x2a], 3);
  payload.writeUInt16LE(width, 6);
  payload.writeUInt16LE(height, 8);
  return payload;
}

function makeVp8lPayload(width: number, height: number) {
  const payload = Buffer.alloc(5);
  payload[0] = 0x2f;
  payload.writeUInt32LE((width - 1) | ((height - 1) << 14), 1);
  return payload;
}

function makeVp8xPayload(width: number, height: number) {
  const payload = Buffer.alloc(10);
  payload.writeUIntLE(width - 1, 4, 3);
  payload.writeUIntLE(height - 1, 7, 3);
  return payload;
}

describe("WebP dimension parser", () => {
  it("reads a synthetic VP8 fixture", () => {
    const fixture = makeWebp(makeWebpChunk("VP8 ", makeVp8Payload(641, 359)));
    expect(readWebpDimensions(fixture)).toEqual({ width: 641, height: 359 });
  });

  it("reads a synthetic VP8L fixture", () => {
    const fixture = makeWebp(makeWebpChunk("VP8L", makeVp8lPayload(777, 555)));
    expect(readWebpDimensions(fixture)).toEqual({ width: 777, height: 555 });
  });

  it("skips odd-sized chunk padding before reading a synthetic VP8X fixture", () => {
    const fixture = makeWebp(
      makeWebpChunk("EXIF", Buffer.from([1, 2, 3])),
      makeWebpChunk("VP8X", makeVp8xPayload(1500, 600)),
    );
    expect(readWebpDimensions(fixture)).toEqual({ width: 1500, height: 600 });
  });

  it("rejects a truncated chunk with a controlled UTF-8 error", () => {
    const fixture = makeWebp(makeWebpChunk("VP8X", Buffer.alloc(4), 10));
    expect(() => readWebpDimensions(fixture)).toThrow("WebP 文件包含截断的数据区块：VP8X");
  });
});

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
  it.each(GENDERED_ATLAS_ASSETS)("ships verified gendered atlas asset %s", (file) => {
    const path = resolve("public/reference", file);
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).isFile()).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(20_000);

    const dimensions = readWebpDimensions(readFileSync(path));
    expect(Math.max(dimensions.width, dimensions.height)).toBeGreaterThanOrEqual(1400);
    const ratioDelta = file.startsWith("face-")
      ? Math.abs(dimensions.width * 2 - dimensions.height * 5)
      : Math.abs(dimensions.width * 3 - dimensions.height * 4);
    expect(ratioDelta).toBeLessThanOrEqual(5);
  });

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

describe("mature face, mole and palm content", () => {
  it("defines exactly thirty-two governed records and fails closed for unknown ids", async () => {
    const { TRADITIONAL_CONTENT, getTraditionalContent } = await import("../../lib/yi/traditional-content");

    expect(Object.keys(TRADITIONAL_CONTENT)).toEqual(TRADITIONAL_IDS);
    expect(Object.entries(TRADITIONAL_CONTENT).every(([id, record]) => record.id === id)).toBe(true);
    expect(() => getTraditionalContent("star-aries")).toThrow("传统内容不存在：star-aries");
    expect(() => getTraditionalContent("missing-atlas-option")).toThrow("传统内容不存在：missing-atlas-option");
  });

  it("gives every governed record mature, distinct and source-valid writing", async () => {
    const { TRADITIONAL_CONTENT } = await import("../../lib/yi/traditional-content");
    const records = Object.values(TRADITIONAL_CONTENT);
    const minimums = {
      professionalResult: 60,
      traditionalBasis: 80,
      recognitionGuide: 60,
      plainLanguage: 70,
      lifeScene: 90,
      strengthAndPitfall: 80,
      action: 60,
      chartComparison: 60,
      caution: 40,
    } as const;

    expect(records).toHaveLength(32);
    for (const record of records) {
      for (const [field, minimum] of Object.entries(minimums)) {
        expect.soft(record[field as keyof typeof minimums].length, `${record.id}:${field}`).toBeGreaterThanOrEqual(minimum);
      }
      expect(record.sourceIds.length, record.id).toBeGreaterThan(0);
      expect(record.sourceIds.every((id) => Boolean(TRADITIONAL_SOURCE_CATALOG[id])), record.id).toBe(true);
      expect(record.sourceIds, record.id).toEqual(["classic.ma-yi-shen-xiang"]);
    }

    for (const field of [
      "professionalResult", "recognitionGuide", "plainLanguage", "lifeScene",
      "strengthAndPitfall", "action", "chartComparison",
    ] as const) {
      expect(new Set(records.map((record) => record[field])).size, field).toBe(32);
    }
    expect(JSON.stringify(records)).not.toMatch(
      /功能入口|资源接口|社会接口|注定|必然如此|寿命已定|疾病诊断|发财保证|人格优劣|犯罪倾向|克夫|旺夫|例如：|可用真实发生的细节|可能优势是|现在可做：|提供不同观察角度/,
    );
  });

  it("keeps every face reading visual, behavioral, scene-based and falsifiable", async () => {
    const { getTraditionalContent } = await import("../../lib/yi/traditional-content");

    for (const id of FACE_IDS) {
      const record = getTraditionalContent(id);
      expect.soft(record.recognitionGuide, id).toMatch(/比例|轮廓|眉|眼|鼻|唇|口角/);
      expectTextToContainEvery(`${record.recognitionGuide}${record.caution}`, ["角度", "年龄", "表情", "遗传"]);
      expect.soft(record.traditionalBasis, id).toMatch(/版本|流派|刻本|传本|增补/);
      expect.soft(record.plainLanguage, id).toContain("？");
      expect.soft(record.lifeScene, id).toMatch(/工作|团队|会议|项目|同事|客户|合作|课堂|社群/);
      expect.soft(record.lifeScene, id).toMatch(/家人|伴侣|朋友|家庭|父母|孩子|亲近|关系/);
      expect.soft(record.strengthAndPitfall, id).toMatch(/有用|成熟|发挥|适量|恰当/);
      expect.soft(record.strengthAndPitfall, id).toMatch(/过度|误读|失控|用力过头|代价/);
      expectTextToContainEvery(record.action, ["两周", "支持证据", "反例"]);
    }
  });

  it("describes every mole from the user's exact side and rejects medical or moral inference", async () => {
    const { getTraditionalContent } = await import("../../lib/yi/traditional-content");
    const expectedLocation: Record<(typeof MOLE_IDS)[number], [string, string]> = {
      "mole-forehead-center": ["正面中线", "额部正中"],
      "mole-temple-left": ["你的左脸", "左侧眉尾"],
      "mole-temple-right": ["你的右脸", "右侧眉尾"],
      "mole-brow": ["正面中线", "两眉之间"],
      "mole-eye-lower": ["你的右脸", "右眼下睑"],
      "mole-nose": ["正面中线", "鼻梁"],
      "mole-cheek-left": ["你的左脸", "左眼外下方"],
      "mole-cheek-right": ["你的右脸", "右眼外下方"],
      "mole-philtrum": ["正面中线", "鼻底"],
      "mole-mouth-corner": ["你的右脸", "右侧口角"],
      "mole-chin": ["正面中线", "下唇下方"],
      "mole-jaw": ["你的右脸", "右侧下颌"],
    };

    for (const id of MOLE_IDS) {
      const record = getTraditionalContent(id);
      expectTextToContainEvery(record.recognitionGuide, expectedLocation[id]);
      expect(record.recognitionGuide, id).toMatch(/相邻|分界|不要|而不是|区别/);
      expectTextToContainEvery(record.traditionalBasis, ["传统", "版本"]);
      expect(record.strengthAndPitfall, id).toMatch(/问题|问自己|自问/);
      expect(record.action, id).toMatch(/记录|观察|核对|复盘|追踪/);
      expectTextToContainEvery(record.caution, ["健康", "良恶性", "道德", "寿命"]);
      expect(record.caution, id).toMatch(/皮肤科|医生|临床/);
    }

    for (const [leftId, rightId] of [
      ["mole-temple-left", "mole-temple-right"],
      ["mole-cheek-left", "mole-cheek-right"],
    ] as const) {
      const normalizeSide = (text: string) => text.replace(/你的|用户|左脸|右脸|左侧|右侧|左|右/g, "");
      expect(normalizeSide(getTraditionalContent(leftId).recognitionGuide)).not.toBe(
        normalizeSide(getTraditionalContent(rightId).recognitionGuide),
      );
      expect(normalizeSide(getTraditionalContent(leftId).lifeScene)).not.toBe(
        normalizeSide(getTraditionalContent(rightId).lifeScene),
      );
    }
  });

  it("uses a two-hand, combined-observation convention for every palm record", async () => {
    const { getTraditionalContent } = await import("../../lib/yi/traditional-content");

    for (const id of PALM_IDS) {
      const record = getTraditionalContent(id);
      expectTextToContainEvery(record.recognitionGuide, ["形态", "长度", "清晰", "比例"]);
      expectTextToContainEvery(`${record.recognitionGuide}${record.chartComparison}`, ["双手", "常用手", "另一只手"]);
      expect(`${record.professionalResult}${record.caution}`, id).toMatch(/单一|单凭/);
      expectTextToContainEvery(`${record.recognitionGuide}${record.caution}`, ["手部使用", "皮肤状态", "年龄"]);
      expect(record.plainLanguage, id).toContain("？");
      expect(record.action, id).toMatch(/掌形|掌纹|线条|可见|照片/);
      expect(record.action, id).toMatch(/工作|学习|沟通|休息|行动|作品|练习|安排|行为/);
    }

    for (const id of PALM_IDS.slice(5)) {
      expectTextToContainEvery(getTraditionalContent(id).caution, ["线长或断续", "寿命", "智力", "关系结果", "事业成败"]);
    }
  });

  it("integrates content field-for-field without changing ids, order or visual contracts", async () => {
    const { TRADITIONAL_CONTENT } = await import("../../lib/yi/traditional-content");
    const fields = [
      "professionalResult", "traditionalBasis", "plainLanguage", "lifeScene",
      "strengthAndPitfall", "action", "chartComparison", "caution", "sourceIds",
    ] as const;

    expect(getAtlasGroups("face").map((group) => [group.title, group.options.map((option) => option.id)])).toEqual([
      ["面型", FACE_IDS.slice(0, 5)], ["五官", FACE_IDS.slice(5)],
    ]);
    expect(getAtlasGroups("mole").map((group) => [group.title, group.options.map((option) => option.id)])).toEqual([
      ["正面痣位", MOLE_IDS],
    ]);
    expect(getAtlasGroups("palm").map((group) => [group.title, group.options.map((option) => option.id)])).toEqual([
      ["手型", PALM_IDS.slice(0, 5)], ["主线", PALM_IDS.slice(5)],
    ]);

    for (const id of TRADITIONAL_IDS) {
      const option = getAtlasOption(id)!;
      const content = TRADITIONAL_CONTENT[id];
      for (const field of fields) expect(option[field], `${id}:${field}`).toEqual(content[field]);
    }

    for (const id of FACE_IDS) {
      const option = getAtlasOption(id)!;
      expect(resolveAtlasVisual(option, "male").image).toMatch(/^reference\/face-(shapes|features)-male\.webp$/);
      expect(resolveAtlasVisual(option, "female").image).toMatch(/^reference\/face-(shapes|features)-female\.webp$/);
      expect(resolveAtlasVisual(option, "female")).toMatchObject({ imageAspect: 5 / 2, view: "front", mirrored: true });
    }
    for (const id of MOLE_IDS) {
      const option = getAtlasOption(id)!;
      expect(resolveAtlasVisual(option, "female")).toMatchObject({ imageAspect: 1448 / 1086, mirrored: true });
      expect(resolveAtlasVisual(option, "female").hotspot).toBeTruthy();
      expect(option.userSide).toBeTruthy();
      expect(option.landmark).toBeTruthy();
    }
    for (const id of PALM_IDS) {
      expect(resolveAtlasVisual(getAtlasOption(id)!, "female")).toMatchObject({ view: "front", mirrored: false });
    }

    const starOptions = getAtlasGroups("star").flatMap((group) => group.options);
    expect(starOptions.map((option) => option.id)).toEqual([
      "star-aries", "star-taurus", "star-gemini", "star-cancer", "star-leo", "star-virgo",
      "star-libra", "star-scorpio", "star-sagittarius", "star-capricorn", "star-aquarius", "star-pisces",
    ]);
    expect(starOptions.every((option) => !TRADITIONAL_CONTENT[option.id])).toBe(true);
    expect(starOptions.every((option) => option.sourceIds[0] === "culture.nasa-constellations")).toBe(true);
    expect(starOptions.every((option) => option.caution.includes("不是完整星盘"))).toBe(true);
  });

  it("maps every complete sun-sign profile into the existing seven atlas layers", () => {
    const starOptions = getAtlasGroups("star").flatMap((group) => group.options);

    for (const [sign, profile] of Object.entries(ZODIAC_PROFILES)) {
      const option = starOptions.find((candidate) => candidate.id === `star-${sign}`)!;
      expect(option.professionalResult, sign).toContain(`元素：${profile.element}`);
      expect(option.professionalResult, sign).toContain(`模式：${profile.modality}`);
      expect(option.professionalResult, sign).toContain(profile.coreDrive);
      expect(option.traditionalBasis, sign).toContain("文化分类");
      expect(option.traditionalBasis, sign).toContain(profile.outerStyle);
      expect(option.traditionalBasis, sign).toContain(profile.innerNeed);
      expect(option.plainLanguage, sign).toContain(profile.commonMisreading);
      expect(option.lifeScene, sign).toContain(`恋爱方式：${profile.loveStyle}`);
      expect(option.lifeScene, sign).toContain(`朋友关系：${profile.friendshipStyle}`);
      expect(option.lifeScene, sign).toContain(`工作状态：${profile.workStyle}`);
      expect(option.strengthAndPitfall, sign).toContain(`成熟版本：${profile.matureVersion}`);
      expect(option.strengthAndPitfall, sign).toContain(`压力反应：${profile.stressResponse}`);
      expect(option.action, sign).toContain(profile.growthDirection);
      expect(option.chartComparison, sign).toBe(profile.chartComparison);
      expect(option.caution, sign).toBe(profile.caution);
      expect(option.sourceIds, sign).toEqual(profile.sourceReferences);

      for (const field of [
        "coreDrive", "outerStyle", "innerNeed", "loveStyle", "friendshipStyle", "workStyle",
        "stressResponse", "commonMisreading", "matureVersion", "growthDirection", "chartComparison",
      ] as const) {
        expect(JSON.stringify(option), `${sign}:${field}`).toContain(profile[field]);
      }
    }
  });
});
