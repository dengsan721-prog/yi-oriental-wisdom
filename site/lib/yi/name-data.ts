import type {
  CommonVariantDisambiguation,
  ElementVector,
  NameDataGenerationMetadata,
  NameGraphemeInspection,
  NameInputInspection,
  ProvisionalVariantCandidate,
  RawInputProtection,
  ReviewedFullNameRecord,
  ReviewedNameCharacterRecord,
  TghCoreData,
  TghCoreRecord,
  TghReading,
  UnicodeCodePoint,
  VariantCandidate,
  VariantProposal,
} from "./name-types";

const NAME_SEGMENTER = new Intl.Segmenter("zh-Hans", { granularity: "grapheme" });
let corePromise: Promise<TghCoreData> | undefined;

function codePointLabel(codePoint: number): UnicodeCodePoint {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function codePoints(value: string): UnicodeCodePoint[] {
  return [...value].map(character => codePointLabel(character.codePointAt(0)!));
}

function toneOf(pinyin: string): 1 | 2 | 3 | 4 | 5 {
  const marks = new Set([...pinyin.normalize("NFD")].map(character => character.codePointAt(0)));
  if (marks.has(0x0304)) return 1;
  if (marks.has(0x0301)) return 2;
  if (marks.has(0x030c)) return 3;
  if (marks.has(0x0300)) return 4;
  return 5;
}

function isCompatibilityIdeograph(codePoint: number): boolean {
  return (codePoint >= 0xf900 && codePoint <= 0xfaff) || (codePoint >= 0x2f800 && codePoint <= 0x2fa1f);
}

function isVariationSelector(codePoint: number): boolean {
  return (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || (codePoint >= 0xe0100 && codePoint <= 0xe01ef);
}

function isPrivateUse(codePoint: number): boolean {
  return (
    (codePoint >= 0xe000 && codePoint <= 0xf8ff) ||
    (codePoint >= 0xf0000 && codePoint <= 0xffffd) ||
    (codePoint >= 0x100000 && codePoint <= 0x10fffd)
  );
}

function inspectGrapheme(rawCluster: string): NameGraphemeInspection {
  const rawNumbers = [...rawCluster].map(character => character.codePointAt(0)!);
  const rawCodePoints = rawNumbers.map(codePointLabel);
  const protections: RawInputProtection[] = [];
  if (rawNumbers.some(isCompatibilityIdeograph)) protections.push("compatibility-ideograph");
  if (rawNumbers.some(isVariationSelector)) protections.push("ideographic-variation-sequence");
  if (rawNumbers.some(isPrivateUse)) protections.push("private-use-character");

  const nfc = rawCluster.normalize("NFC");
  const nfcCodePoints = codePoints(nfc);
  return {
    rawCluster,
    rawCodePoints,
    nfcCodePoints,
    nfcLookup: protections.length === 0 ? nfc : null,
    normalizationChanged: rawCodePoints.join(" ") !== nfcCodePoints.join(" "),
    containsNonBmp: rawNumbers.some(codePoint => codePoint > 0xffff),
    protections,
  };
}

export function inspectRawNameInput(rawInput: string): NameInputInspection {
  return {
    rawInput,
    graphemes: [...NAME_SEGMENTER.segment(rawInput)].map(segment => inspectGrapheme(segment.segment)),
  };
}

function provisionalCandidates(rawCodePoints: string): ProvisionalVariantCandidate[] {
  if (!rawCodePoints) return [];
  return rawCodePoints.split(",").map(rawCodePoint => {
    const numericCodePoint = Number.parseInt(rawCodePoint, 16);
    return {
      glyph: String.fromCodePoint(numericCodePoint),
      codePoints: [codePointLabel(numericCodePoint)],
      sourceIds: ["unicode.unihan-17.data"],
      provisional: true,
    };
  });
}

function decodeCore(payload: string, metadata: NameDataGenerationMetadata): TghCoreData {
  const records = payload.trimEnd().split("\n").map((row, offset): TghCoreRecord => {
    const [rawCodePoint, rawReadings, rawRadicals, rawTotalStrokes, rawTraditional, rawSimplified] = row.split("|");
    const numericCodePoint = Number.parseInt(rawCodePoint, 16);
    const tghIndex = offset + 1;
    const readings: TghReading[] = rawReadings.split(",").map(pinyin => ({
      pinyin,
      tone: toneOf(pinyin),
      sourceId: "unicode.unihan-17.data",
      sourceProperty: "kTGHZ2013",
    }));
    return {
      glyph: String.fromCodePoint(numericCodePoint),
      codePoint: codePointLabel(numericCodePoint),
      rawTgh: `2013:${tghIndex}`,
      tghIndex,
      tghLevel: tghIndex <= 3500 ? 1 : tghIndex <= 6500 ? 2 : 3,
      readings,
      radicalStrokeRecords: rawRadicals.split(" ").map(value => ({
        value,
        sourceId: "unicode.unihan-17.data",
        sourceProperty: "kRSUnicode",
      })),
      totalStrokeRecord: {
        rawValue: rawTotalStrokes,
        informative: true,
        sourceId: "unicode.unihan-17.data",
        sourceProperty: "kTotalStrokes",
      },
      traditionalVariants: provisionalCandidates(rawTraditional),
      simplifiedVariants: provisionalCandidates(rawSimplified),
    };
  });
  const byCodePoint = new Map(records.map(record => [record.codePoint, record]));
  return {
    metadata,
    records,
    lookupByGlyph(glyph) {
      const glyphCodePoints = codePoints(glyph);
      return glyphCodePoints.length === 1 ? byCodePoint.get(glyphCodePoints[0]) ?? null : null;
    },
    lookupByCodePoint(codePoint) {
      return byCodePoint.get(codePoint) ?? null;
    },
  };
}

export function loadTghCoreData(): Promise<TghCoreData> {
  corePromise ??= import("./name-tgh-data").then(module =>
    decodeCore(
      module.NAME_TGH_COMPACT_PAYLOAD,
      module.NAME_TGH_GENERATION_METADATA as unknown as NameDataGenerationMetadata,
    ),
  );
  return corePromise;
}

function manualVariant(glyph: string, meaningHint: string): VariantCandidate {
  return {
    glyph,
    codePoints: codePoints(glyph),
    meaningHint,
    sourceIds: ["standard.tgh-variants", "unicode.unihan-17.data"],
  };
}

export const COMMON_VARIANT_DISAMBIGUATIONS: CommonVariantDisambiguation[] = [
  {
    inputGlyph: "发",
    inputCodePoints: codePoints("发"),
    candidates: [manualVariant("發", "生发、出发、发展等义项"), manualVariant("髮", "头发、毛发等义项")],
    adoptedGlyph: null,
    requiresConfirmation: true,
  },
  {
    inputGlyph: "后",
    inputCodePoints: codePoints("后"),
    candidates: [manualVariant("后", "君主、皇后等保留原字义项"), manualVariant("後", "先后、之后、后方等义项")],
    adoptedGlyph: null,
    requiresConfirmation: true,
  },
  {
    inputGlyph: "台",
    inputCodePoints: codePoints("台"),
    candidates: [
      manualVariant("台", "兄台、台辅等保留原字义项"),
      manualVariant("臺", "高台、台湾等义项"),
      manualVariant("檯", "桌台、柜台等器物义项"),
      manualVariant("颱", "台风这一气象义项"),
    ],
    adoptedGlyph: null,
    requiresConfirmation: true,
  },
  {
    inputGlyph: "干",
    inputCodePoints: codePoints("干"),
    candidates: [
      manualVariant("干", "干涉、盾牌等保留原字义项"),
      manualVariant("乾", "干燥、乾坤等义项"),
      manualVariant("幹", "才干、从事等义项"),
    ],
    adoptedGlyph: null,
    requiresConfirmation: true,
  },
  {
    inputGlyph: "里",
    inputCodePoints: codePoints("里"),
    candidates: [
      manualVariant("里", "里程、乡里等保留原字义项"),
      manualVariant("裏", "内部、里面等义项的一种传统字形"),
      manualVariant("裡", "内部、里面等义项的另一传统字形"),
    ],
    adoptedGlyph: null,
    requiresConfirmation: true,
  },
];

export function getCommonVariantDisambiguation(glyph: string): CommonVariantDisambiguation | null {
  return COMMON_VARIANT_DISAMBIGUATIONS.find(record => record.inputGlyph === glyph) ?? null;
}

export async function getVariantProposal(inputGlyph: string): Promise<VariantProposal> {
  const record = (await loadTghCoreData()).lookupByGlyph(inputGlyph);
  const candidates = record
    ? [...record.traditionalVariants, ...record.simplifiedVariants].filter(
        (candidate, index, all) => all.findIndex(item => item.glyph === candidate.glyph) === index,
      )
    : [];
  return {
    inputGlyph,
    candidates,
    adoptedGlyph: null,
    requiresConfirmation: candidates.length > 0,
  };
}

function reviewedCharacter(
  id: string,
  glyph: string,
  meaning: string,
  vector: ElementVector,
  unknownShare: number,
  basisText: string,
  coverageSourceIds: string[],
): ReviewedNameCharacterRecord {
  return {
    id,
    glyph,
    codePoints: codePoints(glyph),
    meaning,
    coverageSourceIds,
    reviewedOn: "2026-07-22",
    reviewerRole: "姓名文化内容复核",
    semantic: {
      methodId: "name.semantic-five-elements.v1",
      version: "1.0.0",
      vector,
      unknownShare,
      basisText,
      sourceIds: [
        "name.semantic-five-elements.v1",
        "unicode.unihan-17.data",
        "classic.shangshu-hongfan-five-elements",
      ],
      confidence: "reviewed",
    },
  };
}

const PRODUCT_EXAMPLE = ["name.semantic-five-elements.v1"];
const MPS_COVERAGE = ["mps.name-report-2021"];

export const REVIEWED_NAME_CHARACTERS: ReviewedNameCharacterRecord[] = [
  reviewedCharacter("name-char-lin", "林", "成片树木，含生长与相互支撑的意象。", { 木: 0.85, 火: 0.05, 土: 0.05, 金: 0, 水: 0.05 }, 0.1, "按已确认的树木字义作产品语义审校，不从部首或笔画推导五行。", PRODUCT_EXAMPLE),
  reviewedCharacter("name-char-zhi", "知", "知道、理解与辨识。", { 木: 0.15, 火: 0.45, 土: 0.1, 金: 0.2, 水: 0.1 }, 0.2, "按理解与辨识的采用义项作复合文化向量，不声称存在唯一古法归类。", PRODUCT_EXAMPLE),
  reviewedCharacter("name-char-yuan", "远", "距离长，也可表达眼界与长期方向。", { 木: 0.25, 火: 0.1, 土: 0.2, 金: 0.05, 水: 0.4 }, 0.15, "按延展和远行的采用义项作产品语义审校，字形工程字段不参与归类。", PRODUCT_EXAMPLE),
  reviewedCharacter("name-char-lin-arrive", "临", "来到、面对，也含临近之义。", { 木: 0.25, 火: 0.1, 土: 0.1, 金: 0.05, 水: 0.5 }, 0.2, "按面对与临近的采用义项并结合水木意象审校，不把笔画转换成五行。", PRODUCT_EXAMPLE),
  reviewedCharacter("name-char-chuan", "川", "河流与开阔水道。", { 木: 0.05, 火: 0, 土: 0.05, 金: 0, 水: 0.9 }, 0.05, "按河流这一明确自然意象审校，属于产品文化解释而不是国家规范结论。", PRODUCT_EXAMPLE),
  reviewedCharacter("name-char-yi", "艺", "技能、才艺与持续练习。", { 木: 0.45, 火: 0.3, 土: 0.1, 金: 0.1, 水: 0.05 }, 0.2, "按技能与练习的采用义项作复合向量，保留文化解释中的不确定比例。", MPS_COVERAGE),
  reviewedCharacter("name-char-han", "涵", "包容、涵养，也可联想到水的容纳。", { 木: 0.1, 火: 0.05, 土: 0.1, 金: 0.05, 水: 0.7 }, 0.15, "按涵养和容纳的采用义项审校，水意象不回写出生盘的五行计数。", MPS_COVERAGE),
  reviewedCharacter("name-char-yi-one", "一", "数目之始，也可表达专一与简明。", { 木: 0.15, 火: 0.15, 土: 0.25, 金: 0.25, 水: 0.2 }, 0.35, "采用义项较抽象，因此使用均衡向量并明确较高未知比例，拒绝笔画推断。", MPS_COVERAGE),
  reviewedCharacter("name-char-nuo", "诺", "答应、承诺与守信。", { 木: 0.15, 火: 0.35, 土: 0.2, 金: 0.2, 水: 0.1 }, 0.2, "按承诺与守信的采用义项审校，文化向量不等于人格或命运判断。", MPS_COVERAGE),
  reviewedCharacter("name-char-zi", "梓", "树木名，现代姓名中也常作成长意象。", { 木: 0.85, 火: 0.05, 土: 0.05, 金: 0, 水: 0.05 }, 0.1, "按树木这一明确字义审校；公安姓名报告只用于覆盖取样，不证明质量。", MPS_COVERAGE),
  reviewedCharacter("name-char-ze", "泽", "水汇聚之处，也有润泽、恩惠之义。", { 木: 0.05, 火: 0.05, 土: 0.1, 金: 0.05, 水: 0.75 }, 0.1, "按水域与润泽的采用义项审校，不把语义水意象添加进出生盘。", MPS_COVERAGE),
  reviewedCharacter("name-char-mu", "沐", "洗濯、润泽，也含受到润养的表达。", { 木: 0.15, 火: 0.05, 土: 0.05, 金: 0.05, 水: 0.7 }, 0.15, "按洗濯与润养的采用义项审校；流行度仅决定覆盖顺序，不决定好坏。", MPS_COVERAGE),
  reviewedCharacter("name-char-chen", "辰", "时辰，也可指日月星的时间坐标。", { 木: 0.1, 火: 0.15, 土: 0.45, 金: 0.1, 水: 0.2 }, 0.25, "按时间坐标这一采用义项作复合向量，不把地支或笔画机械换算成命局结论。", MPS_COVERAGE),
  reviewedCharacter("name-char-yu", "宇", "屋檐、空间，也常表达开阔尺度。", { 木: 0.1, 火: 0.1, 土: 0.5, 金: 0.15, 水: 0.15 }, 0.2, "按空间与承载的采用义项审校，产品向量不是汉字的全国统一属性。", MPS_COVERAGE),
  reviewedCharacter("name-char-xin", "欣", "喜悦、欣然与蓬勃。", { 木: 0.3, 火: 0.45, 土: 0.1, 金: 0.1, 水: 0.05 }, 0.15, "按喜悦与蓬勃的采用义项审校，不由偏旁或总笔画生成五行标签。", MPS_COVERAGE),
];

const reviewedCharactersByGlyph = new Map(REVIEWED_NAME_CHARACTERS.map(record => [record.glyph, record]));

export function findReviewedNameCharacter(glyph: string): ReviewedNameCharacterRecord | null {
  return reviewedCharactersByGlyph.get(glyph) ?? null;
}

export const REVIEWED_FULL_NAMES: ReviewedFullNameRecord[] = [
  {
    id: "reviewed-full-name-lin-zhi-yuan",
    surname: "林",
    fullName: "林知远",
    adoptedReadings: ["lín", "zhī", "yuǎn"],
    adoptedGlyphBasis: "registered-input",
    reviewStatus: "reviewed",
    reviewDate: "2026-07-22",
    reviewerRole: "姓名文化组合复核",
    risks: [],
  },
  {
    id: "reviewed-full-name-lin-yi-han",
    surname: "林",
    fullName: "林艺涵",
    adoptedReadings: ["lín", "yì", "hán"],
    adoptedGlyphBasis: "registered-input",
    reviewStatus: "reviewed",
    reviewDate: "2026-07-22",
    reviewerRole: "姓名文化组合复核",
    risks: [],
  },
];

const reviewedFullNames = new Map(REVIEWED_FULL_NAMES.map(record => [record.fullName, record]));

export function findReviewedFullName(fullName: string): ReviewedFullNameRecord | null {
  return reviewedFullNames.get(fullName) ?? null;
}
