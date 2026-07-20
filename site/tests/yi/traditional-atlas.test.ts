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
