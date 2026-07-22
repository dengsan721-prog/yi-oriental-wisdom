import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COMMON_VARIANT_DISAMBIGUATIONS,
  REVIEWED_FULL_NAMES,
  REVIEWED_NAME_CHARACTERS,
  findReviewedFullName,
  findReviewedNameCharacter,
  getCommonVariantDisambiguation,
  getVariantProposal,
  inspectRawNameInput,
  loadTghCoreData,
} from "../../lib/yi/name-data";

describe("Yi name data", () => {
  it("matches the official 8,105-codepoint sequence, indexes and three levels exactly", async () => {
    const core = await loadTghCoreData();

    expect(core.records).toHaveLength(8105);
    expect(new Set(core.records.map(record => record.codePoint)).size).toBe(8105);
    core.records.forEach((record, offset) => {
      const index = offset + 1;
      expect(record.tghIndex).toBe(index);
      expect(record.rawTgh).toBe(`2013:${index}`);
      expect(record.tghLevel).toBe(index <= 3500 ? 1 : index <= 6500 ? 2 : 3);
    });

    expect(core.records[3499].codePoint).toBe("U+77D7");
    expect(core.records[3500].codePoint).toBe("U+4E42");
    expect(core.records[6499].codePoint).toBe("U+9F49");
    expect(core.records[6500].codePoint).toBe("U+4E8D");
    expect(core.records[8104].codePoint).toBe("U+883C");

    const sequence = core.records
      .map(record => `${String(record.tghIndex).padStart(4, "0")}\t${record.codePoint.slice(2).padStart(5, "0")}\n`)
      .join("");
    expect(createHash("sha256").update(sequence).digest("hex")).toBe(
      "d84e2bb7979b36a2fe130a300f978b235386acef5b6202bf4cff90ef6fa1c74b",
    );
    expect(core.metadata.officialVerification).toMatchObject({
      recordCount: 8105,
      extractorAgreementCount: 8105,
      extractorConflictCount: 0,
      unihanMismatchCount: 0,
    });
  });

  it("preserves preferred readings, multi-valued radicals and informative total strokes", async () => {
    const core = await loadTghCoreData();

    expect(core.lookupByGlyph("一")?.readings).toEqual([
      { pinyin: "yī", tone: 1, sourceId: "unicode.unihan-17.data", sourceProperty: "kTGHZ2013" },
    ]);
    expect(core.lookupByGlyph("行")?.readings.map(reading => reading.pinyin)).toEqual(["háng", "héng", "xíng"]);
    expect(core.lookupByGlyph("重")?.readings.map(reading => reading.pinyin)).toEqual(["chóng", "zhòng"]);
    expect(core.lookupByGlyph("习")?.radicalStrokeRecords.map(record => record.value)).toEqual(["5.2", "15.1"]);
    expect(core.lookupByGlyph("一")?.totalStrokeRecord).toEqual({
      rawValue: "1",
      informative: true,
      sourceId: "unicode.unihan-17.data",
      sourceProperty: "kTotalStrokes",
    });
    expect(core.lookupByGlyph("一")).not.toHaveProperty("kangxiStrokes");
  });

  it("returns unknown for characters outside the TGH core instead of guessing", async () => {
    const core = await loadTghCoreData();
    expect(core.lookupByGlyph("㐀")).toBeNull();
    expect(core.lookupByCodePoint("U+3400")).toBeNull();
  });

  it("preserves whole-name raw input and segments non-BMP characters as grapheme clusters", async () => {
    const rawInput = "林𫘜";
    const inspection = inspectRawNameInput(rawInput);

    expect(inspection.rawInput).toBe(rawInput);
    expect(inspection.graphemes).toHaveLength(2);
    expect(inspection.graphemes[1]).toMatchObject({
      rawCluster: "𫘜",
      rawCodePoints: ["U+2B61C"],
      nfcLookup: "𫘜",
      containsNonBmp: true,
    });

    const core = await loadTghCoreData();
    expect(core.lookupByGlyph("𫘜")?.tghIndex).toBe(6640);
  });

  it("detects compatibility ideographs before NFC and refuses their folded lookup", () => {
    const inspection = inspectRawNameInput("\uF900");
    const grapheme = inspection.graphemes[0];

    expect(inspection.rawInput).toBe("\uF900");
    expect(grapheme.rawCodePoints).toEqual(["U+F900"]);
    expect(grapheme.nfcCodePoints).toEqual(["U+8C48"]);
    expect(grapheme.nfcLookup).toBeNull();
    expect(grapheme.normalizationChanged).toBe(true);
    expect(grapheme.protections).toContain("compatibility-ideograph");
  });

  it("keeps IVS and PUA input blocked from normalization while preserving raw codepoints", () => {
    const ivs = inspectRawNameInput(`禰\u{E0100}`).graphemes[0];
    expect(ivs.rawCodePoints).toEqual(["U+79B0", "U+E0100"]);
    expect(ivs.protections).toContain("ideographic-variation-sequence");
    expect(ivs.nfcLookup).toBeNull();

    const pua = inspectRawNameInput("\uE000").graphemes[0];
    expect(pua.rawCodePoints).toEqual(["U+E000"]);
    expect(pua.protections).toContain("private-use-character");
    expect(pua.nfcLookup).toBeNull();
  });

  it("keeps Unihan variants provisional and never silently adopts even one candidate", async () => {
    const proposal = await getVariantProposal("汉");
    expect(proposal.candidates.map(candidate => candidate.glyph)).toEqual(["漢"]);
    expect(proposal.candidates.every(candidate => candidate.provisional)).toBe(true);
    expect(proposal.adoptedGlyph).toBeNull();
    expect(proposal.requiresConfirmation).toBe(true);
  });

  it("covers common one-to-many simplified/traditional cases with meaning hints", () => {
    expect(COMMON_VARIANT_DISAMBIGUATIONS.map(record => record.inputGlyph)).toEqual(["发", "后", "台", "干", "里"]);
    const expectedCandidates: Record<string, string[]> = {
      发: ["發", "髮"],
      后: ["后", "後"],
      台: ["台", "臺", "檯", "颱"],
      干: ["干", "乾", "幹"],
      里: ["里", "裏", "裡"],
    };
    for (const [glyph, candidates] of Object.entries(expectedCandidates)) {
      const record = getCommonVariantDisambiguation(glyph)!;
      expect(record.candidates.map(candidate => candidate.glyph)).toEqual(candidates);
      expect(record.candidates.every(candidate => candidate.meaningHint.length >= 4)).toBe(true);
      expect(record.candidates.every(candidate => candidate.sourceIds.includes("standard.tgh-variants"))).toBe(true);
      expect(record.adoptedGlyph).toBeNull();
      expect(record.requiresConfirmation).toBe(true);
    }
  });

  it("limits semantic five-element labels to manually reviewed product records", async () => {
    const core = await loadTghCoreData();
    expect(REVIEWED_NAME_CHARACTERS.length).toBeGreaterThanOrEqual(12);
    expect(REVIEWED_NAME_CHARACTERS.length).toBeLessThan(100);
    expect(REVIEWED_NAME_CHARACTERS.length).toBeLessThan(core.records.length);

    for (const record of REVIEWED_NAME_CHARACTERS) {
      expect(record.semantic.methodId).toBe("name.semantic-five-elements.v1");
      expect(record.semantic.version).toBe("1.0.0");
      expect(record.semantic.basisText.length).toBeGreaterThanOrEqual(12);
      expect(record.semantic.sourceIds).toContain("name.semantic-five-elements.v1");
      expect(Object.values(record.semantic.vector).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
      expect(record.semantic.unknownShare).toBeGreaterThanOrEqual(0);
      expect(record.semantic.unknownShare).toBeLessThanOrEqual(1);
    }
    expect(findReviewedNameCharacter("㐀")).toBeNull();
  });

  it("treats reviewed full names as finite exact combinations, not a cross-product of reviewed characters", () => {
    expect(REVIEWED_FULL_NAMES.length).toBeGreaterThanOrEqual(2);
    for (const record of REVIEWED_FULL_NAMES) {
      expect(record.fullName.startsWith(record.surname)).toBe(true);
      expect(record.reviewStatus).toBe("reviewed");
      expect(record.reviewDate).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      expect(record.reviewerRole.length).toBeGreaterThanOrEqual(4);
      expect(record.adoptedReadings).toHaveLength([...record.fullName].length);
      expect(record.adoptedGlyphBasis).toBe("registered-input");
    }

    expect(findReviewedFullName("林知远")?.fullName).toBe("林知远");
    expect(findReviewedNameCharacter("林")).not.toBeNull();
    expect(findReviewedNameCharacter("知")).not.toBeNull();
    expect(findReviewedNameCharacter("川")).not.toBeNull();
    expect(findReviewedFullName("林知川")).toBeNull();
  });

  it("records source checksums, license, deterministic verification and lazy asset budget", async () => {
    const core = await loadTghCoreData();
    expect(core.metadata).toMatchObject({
      unicodeVersion: "17.0.0",
      generatedOn: "2026-07-22",
      unihan: {
        url: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
        sha256: "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e",
      },
      officialTgh: {
        url: "https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/202103/W020210318300204215237.pdf",
        sha256: "0ff0890afc34c5e486edeebafb05350dec69a7bf0d1d75044d7d3f7b722ec3d0",
      },
    });
    expect(core.metadata.payloadGzipBytes).toBeLessThanOrEqual(160 * 1024);

    const nameDataPath = fileURLToPath(new URL("../../lib/yi/name-data.ts", import.meta.url));
    const nameDataSource = readFileSync(nameDataPath, "utf8");
    expect(nameDataSource).toContain('import("./name-tgh-data")');
    expect(nameDataSource).not.toMatch(/from\s+["']\.\/name-tgh-data["']/);
    expect(nameDataSource).not.toContain("fetch(");

    const noticePath = fileURLToPath(new URL("../../THIRD_PARTY_NOTICES.md", import.meta.url));
    const notice = readFileSync(noticePath, "utf8");
    expect(notice).toContain("UNICODE LICENSE V3");
    expect(notice).toContain("Unicode Data Files and Software License");
    expect(notice).toContain("https://www.unicode.org/license.txt");
  });
});
