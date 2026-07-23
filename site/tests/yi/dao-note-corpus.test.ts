import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  DAO_NOTE_CORPUS_VERSION,
  REVIEWED_DAO_NOTES,
  canonicalizeDaoNote,
  canonicalizeJson,
  selectReviewedDaoNotes,
  type DaoNoteTheme,
  type ReviewedDaoNote,
} from "../../lib/yi/dao-note-corpus";

const WIKISOURCE_REVISION_URL =
  "https://zh.wikisource.org/w/index.php?title=老子道德經_(四庫全書本)&oldid=633486";
const CTEXT_COMMENTARY_URL = "https://ctext.org/wiki.pl?if=gb&res=235636";

const EXPECTED_NOTES = [
  {
    id: "dao-08-water",
    chapter: 8,
    sourceTextTraditional: "上善若水，水善利萬物而不爭",
    displayTextSimplified: "上善若水，水善利万物而不争",
    theme: "service",
    paragraphId: 11599,
    crossCheckLocator: "上篇·第八章",
    commentaryIdea: /不争/,
  },
  {
    id: "dao-15-clear",
    chapter: 15,
    sourceTextTraditional: "孰能濁以靜之徐清",
    displayTextSimplified: "孰能浊以静之徐清",
    theme: "patience",
    paragraphId: 11606,
    crossCheckLocator: "上篇·第十五章",
    commentaryIdea: /详慎.*徐清|徐清.*详慎/,
  },
  {
    id: "dao-22-whole",
    chapter: 22,
    sourceTextTraditional: "曲則全",
    displayTextSimplified: "曲则全",
    theme: "bend",
    paragraphId: 11613,
    crossCheckLocator: "上篇·第二十二章",
    commentaryIdea: /不自见/,
  },
  {
    id: "dao-33-self",
    chapter: 33,
    sourceTextTraditional: "知人者智，自知者明；勝人者有力，自勝者強",
    displayTextSimplified: "知人者智，自知者明；胜人者有力，自胜者强",
    theme: "self-knowledge",
    paragraphId: 11624,
    crossCheckLocator: "上篇·第三十三章",
    commentaryIdea: /自胜/,
  },
  {
    id: "dao-40-return",
    chapter: 40,
    sourceTextTraditional: "反者道之動，弱者道之用",
    displayTextSimplified: "反者道之动，弱者道之用",
    theme: "reversal",
    paragraphId: 11631,
    crossCheckLocator: "上篇·第四十章",
    commentaryIdea: /反.*弱|弱.*反/,
  },
  {
    id: "dao-63-small",
    chapter: 63,
    sourceTextTraditional: "圖難於其易，為大於其細",
    displayTextSimplified: "图难于其易，为大于其细",
    theme: "small-steps",
    paragraphId: 11654,
    crossCheckLocator: "下篇·第六十三章",
    commentaryIdea: /图难于易/,
  },
  {
    id: "dao-64-road",
    chapter: 64,
    sourceTextTraditional: "千里之行，始於足下",
    displayTextSimplified: "千里之行，始于足下",
    theme: "long-road",
    paragraphId: 11655,
    crossCheckLocator: "下篇·第六十四章",
    commentaryIdea: /慎终如始/,
  },
  {
    id: "dao-66-lower",
    chapter: 66,
    sourceTextTraditional: "江海所以能為百谷王者，以其善下之",
    displayTextSimplified: "江海所以能为百谷王者，以其善下之",
    theme: "leadership",
    paragraphId: 11657,
    crossCheckLocator: "下篇·第六十六章",
    commentaryIdea: null,
  },
  {
    id: "dao-76-soft",
    chapter: 76,
    sourceTextTraditional: "強大處下，柔弱處上",
    displayTextSimplified: "强大处下，柔弱处上",
    theme: "flexibility",
    paragraphId: 11667,
    crossCheckLocator: "下篇·第七十六章",
    commentaryIdea: /柔弱.*适应|适应.*柔弱/,
  },
  {
    id: "dao-81-no-strife",
    chapter: 81,
    sourceTextTraditional: "聖人之道，為而不爭",
    displayTextSimplified: "圣人之道，为而不争",
    theme: "completion",
    paragraphId: 11672,
    crossCheckLocator: "下篇·第八十一章",
    commentaryIdea: /为而不争/,
  },
] as const satisfies readonly {
  id: string;
  chapter: number;
  sourceTextTraditional: string;
  displayTextSimplified: string;
  theme: DaoNoteTheme;
  paragraphId: number;
  crossCheckLocator: string;
  commentaryIdea: RegExp | null;
}[];

function referenceCanonicalize(
  value: unknown,
  ancestors: ReadonlySet<object> = new Set(),
): string {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non-finite");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (
    value === undefined
    || typeof value === "function"
    || typeof value === "symbol"
    || typeof value === "bigint"
  ) {
    throw new TypeError("unsupported");
  }
  if (typeof value !== "object") throw new TypeError("unsupported");
  if (ancestors.has(value)) throw new TypeError("cycle");

  const nextAncestors = new Set(ancestors).add(value);
  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError("symbol key");
    }
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) throw new TypeError("sparse");
    }
    return `[${value
      .map(item => referenceCanonicalize(item, nextAncestors))
      .join(",")}]`;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("non-plain object");
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new TypeError("symbol key");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .map(raw => ({ raw, normalized: raw.normalize("NFC") }))
    .sort((left, right) =>
      left.normalized < right.normalized
        ? -1
        : left.normalized > right.normalized ? 1 : 0
    );
  if (new Set(keys.map(key => key.normalized)).size !== keys.length) {
    throw new TypeError("duplicate normalized keys");
  }
  return `{${keys.map(({ raw, normalized }) => {
    if (record[raw] === undefined) throw new TypeError("undefined");
    return `${JSON.stringify(normalized)}:${referenceCanonicalize(
      record[raw],
      nextAncestors,
    )}`;
  }).join(",")}}`;
}

function referenceChecksum(note: ReviewedDaoNote): `sha256:${string}` {
  const { checksum: _checksum, ...payload } = note;
  void _checksum;
  return `sha256:${createHash("sha256")
    .update(referenceCanonicalize(payload), "utf8")
    .digest("hex")}`;
}

function expectDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (
    (typeof value !== "object" || value === null)
    && typeof value !== "function"
  ) {
    return;
  }
  if (seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeepFrozen(child, seen);
}

describe("reviewed Dao note corpus", () => {
  it("freezes exactly the ten adopted passages and primary themes", () => {
    expect(DAO_NOTE_CORPUS_VERSION).toBe("dao-note-corpus-v1");
    expect(REVIEWED_DAO_NOTES).toHaveLength(EXPECTED_NOTES.length);
    expect(REVIEWED_DAO_NOTES.map(note => ({
      id: note.id,
      chapter: note.chapter,
      sourceTextTraditional: note.sourceTextTraditional,
      displayTextSimplified: note.displayTextSimplified,
      theme: note.themes[0],
    }))).toEqual(EXPECTED_NOTES.map(note => ({
      id: note.id,
      chapter: note.chapter,
      sourceTextTraditional: note.sourceTextTraditional,
      displayTextSimplified: note.displayTextSimplified,
      theme: note.theme,
    })));
    expect(new Set(REVIEWED_DAO_NOTES.map(note => note.id)).size).toBe(10);
  });

  it("uses exact CText paragraph anchors and the fixed Wikisource witness", () => {
    for (const expected of EXPECTED_NOTES) {
      const note = REVIEWED_DAO_NOTES.find(item => item.id === expected.id);
      expect(note).toBeDefined();
      expect(note).toMatchObject({
        baseEdition: "中國哲學書電子化計劃《道德經》正文",
        sourceUrl:
          `https://ctext.org/dao-de-jing/zh#n${expected.paragraphId}`,
        sourceLocator: `paragraph ${expected.paragraphId}`,
        traditionalCommentaryUrl: CTEXT_COMMENTARY_URL,
        traditionalCommentaryMedium:
          "OCR 工作文本（仅供定位，不作为独立定本）",
        independentEditionCheck: {
          edition: "《老子道德經》（四庫全書本）",
          medium: "Wikisource 固定版本转录",
          sourceUrl: WIKISOURCE_REVISION_URL,
          revisionId: "oldid=633486",
          locator: expected.crossCheckLocator,
          checkedText: expected.sourceTextTraditional,
        },
      });
      expect(note?.traditionalCommentaryLocator)
        .toBe(expected.crossCheckLocator);
      expect(note?.independentEditionCheck).not.toHaveProperty(
        "pageOrImageLocator",
      );
      expect(note?.independentEditionCheck).not.toHaveProperty("page");
    }
  });

  it("states the honest review boundary and the absent chapter 66 commentary", () => {
    for (const [index, expected] of EXPECTED_NOTES.entries()) {
      const note = REVIEWED_DAO_NOTES[index];
      expect(note.reviewStatus)
        .toBe("source-cross-checked-awaiting-human");
      expect(note.reviewerRole).toBe("产品文本校勘");
      expect(note.humanReviewerId).toBeNull();
      expect(note.verifiedAt).toBe("2026-07-23");
      expect(note.usageBoundary)
        .toBe("仅用于人生故事的转折与回味，不作为命盘、四柱或现实结果的证据。");
      if (expected.chapter === 66) {
        expect(note.traditionalCommentaryStatus)
          .toBe("absent-in-adopted-witness");
        expect(note.traditionalCommentarySummary).toBeNull();
        expect(note.variantDecision).toContain("四库王弼本");
        expect(note.variantDecision).toContain("无注文");
      } else {
        expect(note.traditionalCommentaryStatus).toBe("present");
        expect(note.traditionalCommentarySummary).toEqual(
          expect.any(String),
        );
        expect(expected.commentaryIdea)
          .not.toBeNull();
        expect(note.traditionalCommentarySummary)
          .toMatch(expected.commentaryIdea as RegExp);
      }
    }

    const serialized = JSON.stringify(REVIEWED_DAO_NOTES);
    expect(serialized).not.toMatch(
      /人工专家|专家审核|传统文本内容复核|已由专家|权威认证/,
    );
  });

  it("keeps exactly two concrete story uses per note without chart claims", () => {
    for (const note of REVIEWED_DAO_NOTES) {
      expect(note.modernStoryMeanings).toHaveLength(2);
      for (const meaning of note.modernStoryMeanings) {
        expect(meaning.length).toBeGreaterThanOrEqual(24);
        expect(meaning).toMatch(/故事|情节|人物|场景|转折|收束|行动/);
        expect(meaning).not.toMatch(/命盘|四柱|八字|注定|保证|预测/);
      }
    }
  });

  it("rejects common misquotes and motivational substitutions", () => {
    expect(JSON.stringify(REVIEWED_DAO_NOTES)).not.toMatch(
      /厚德载物|委曲求全|天道酬勤|保证翻盘|卑躬屈膝/,
    );
  });

  it("stores literal lowercase SHA-256 checksums independently recomputed", () => {
    for (const note of REVIEWED_DAO_NOTES) {
      expect(note.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
      const { checksum: _checksum, ...payload } = note;
      void _checksum;
      expect(canonicalizeDaoNote(payload))
        .toBe(referenceCanonicalize(payload));
    }
    expect(REVIEWED_DAO_NOTES.map(note => note.checksum))
      .toEqual(REVIEWED_DAO_NOTES.map(referenceChecksum));
  });

  it("deep-freezes every exported value and selected result", () => {
    expectDeepFrozen(REVIEWED_DAO_NOTES);
    expectDeepFrozen(canonicalizeJson);
    expectDeepFrozen(canonicalizeDaoNote);
    expectDeepFrozen(selectReviewedDaoNotes);
    expectDeepFrozen(selectReviewedDaoNotes(["reversal"], { min: 2, max: 4 }));
  });
});

describe("canonical JSON", () => {
  it("sorts recursive keys, keeps array order, and uses the golden digest", () => {
    const canonical = canonicalizeJson({ b: "曲", a: ["全", 1] });
    expect(canonical).toBe('{"a":["全",1],"b":"曲"}');
    expect(createHash("sha256").update(canonical, "utf8").digest("hex"))
      .toBe("277f3f8e518955e1bff564a29169b8bfefc1f901d5f6c025e1b75026e3482d3b");
  });

  it("normalizes both keys and string values to NFC", () => {
    expect(canonicalizeJson({ "e\u0301": "A\u030A" }))
      .toBe('{"é":"Å"}');
  });

  it.each([
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative infinity", Number.NEGATIVE_INFINITY],
    ["function", () => undefined],
    ["symbol", Symbol("dao")],
    ["bigint", BigInt(1)],
    ["date", new Date("2026-07-23T00:00:00.000Z")],
  ])("rejects unsupported %s values", (_label, value) => {
    expect(() => canonicalizeJson(value)).toThrow(TypeError);
  });

  it("rejects undefined members, sparse arrays, symbols, cycles, and normalized duplicate keys", () => {
    expect(() => canonicalizeJson({ value: undefined })).toThrow(TypeError);
    expect(() => canonicalizeJson([undefined])).toThrow(TypeError);
    expect(() => canonicalizeJson(new Array(1))).toThrow(/sparse/i);
    expect(() => canonicalizeJson({
      é: 1,
      "e\u0301": 2,
    })).toThrow(/duplicate normalized keys/i);

    const symbolObject = { value: 1 } as Record<PropertyKey, unknown>;
    symbolObject[Symbol("hidden")] = 2;
    expect(() => canonicalizeJson(symbolObject)).toThrow(/symbol/i);

    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalizeJson(cyclic)).toThrow(/cyclic/i);
  });
});

describe("reviewed Dao note selection", () => {
  it("uses requested theme order, corpus order, and no duplicates", () => {
    const selected = selectReviewedDaoNotes(
      ["reversal", "small-steps", "completion"],
      { min: 2, max: 4 },
    );
    expect(selected.map(note => note.id)).toEqual([
      "dao-40-return",
      "dao-63-small",
      "dao-81-no-strife",
    ]);
    expect(new Set(selected.map(note => note.id)).size).toBe(selected.length);
    expect(selectReviewedDaoNotes(
      ["reversal", "small-steps", "completion"],
      { min: 2, max: 4 },
    )).toEqual(selected);
  });

  it("fills direct shortages with self, road, then corpus order", () => {
    expect(selectReviewedDaoNotes(["reversal"], { min: 3, max: 4 })
      .map(note => note.id)).toEqual([
      "dao-40-return",
      "dao-33-self",
      "dao-64-road",
    ]);
    expect(selectReviewedDaoNotes([], { min: 4, max: 4 })
      .map(note => note.id)).toEqual([
      "dao-33-self",
      "dao-64-road",
      "dao-08-water",
      "dao-15-clear",
    ]);
  });

  it("truncates at max and tolerates duplicate requested themes without duplicate notes", () => {
    expect(selectReviewedDaoNotes([
      "completion",
      "service",
      "patience",
      "bend",
      "reversal",
    ], { min: 2, max: 3 }).map(note => note.id)).toEqual([
      "dao-81-no-strife",
      "dao-08-water",
      "dao-15-clear",
    ]);
    expect(selectReviewedDaoNotes(
      ["reversal", "reversal"],
      { min: 2, max: 4 },
    ).map(note => note.id)).toEqual([
      "dao-40-return",
      "dao-33-self",
    ]);
  });

  it.each([
    [{ min: 1, max: 4 }],
    [{ min: 2, max: 5 }],
    [{ min: 4, max: 3 }],
    [{ min: 2.5, max: 4 }],
    [{ min: Number.NaN, max: 4 }],
  ])("rejects invalid bounds %j", bounds => {
    expect(() => selectReviewedDaoNotes(
      [],
      bounds as { min: number; max: number },
    )).toThrow(TypeError);
  });

  it("rejects unknown, undefined, non-array, and sparse theme requests", () => {
    expect(() => selectReviewedDaoNotes(
      ["unknown"] as unknown as readonly DaoNoteTheme[],
      { min: 2, max: 4 },
    )).toThrow(TypeError);
    expect(() => selectReviewedDaoNotes(
      [undefined] as unknown as readonly DaoNoteTheme[],
      { min: 2, max: 4 },
    )).toThrow(TypeError);
    expect(() => selectReviewedDaoNotes(
      "reversal" as unknown as readonly DaoNoteTheme[],
      { min: 2, max: 4 },
    )).toThrow(TypeError);
    expect(() => selectReviewedDaoNotes(
      new Array(1) as readonly DaoNoteTheme[],
      { min: 2, max: 4 },
    )).toThrow(/sparse/i);
  });
});
