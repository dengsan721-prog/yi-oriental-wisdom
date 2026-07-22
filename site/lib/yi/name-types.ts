import type { ElementName } from "./types";

export type UnicodeCodePoint = `U+${string}`;
export type TghLevel = 1 | 2 | 3;

export type TghReading = {
  pinyin: string;
  tone: 1 | 2 | 3 | 4 | 5;
  sourceId: "unicode.unihan-17.data";
  sourceProperty: "kTGHZ2013" | "kMandarin";
};

export type RadicalStrokeRecord = {
  value: string;
  sourceId: "unicode.unihan-17.data";
  sourceProperty: "kRSUnicode";
};

export type TotalStrokeRecord = {
  rawValue: string;
  informative: true;
  sourceId: "unicode.unihan-17.data";
  sourceProperty: "kTotalStrokes";
};

export type ProvisionalVariantCandidate = {
  glyph: string;
  codePoints: UnicodeCodePoint[];
  sourceIds: readonly ["unicode.unihan-17.data"];
  provisional: true;
};

export type TghCoreRecord = {
  glyph: string;
  codePoint: UnicodeCodePoint;
  rawTgh: `2013:${number}`;
  tghIndex: number;
  tghLevel: TghLevel;
  readings: TghReading[];
  radicalStrokeRecords: RadicalStrokeRecord[];
  totalStrokeRecord: TotalStrokeRecord;
  traditionalVariants: ProvisionalVariantCandidate[];
  simplifiedVariants: ProvisionalVariantCandidate[];
};

export type NameDataGenerationMetadata = {
  unicodeVersion: "17.0.0";
  generatedOn: string;
  sequenceSha256: string;
  payloadGzipBytes: number;
  unihan: { url: string; sha256: string };
  officialTgh: { url: string; sha256: string; document: string };
  officialVerification: {
    extractors: readonly string[];
    recordCount: number;
    extractorAgreementCount: number;
    extractorConflictCount: number;
    unihanMismatchCount: number;
  };
};

export type TghCoreData = {
  metadata: NameDataGenerationMetadata;
  records: readonly TghCoreRecord[];
  lookupByGlyph(glyph: string): TghCoreRecord | null;
  lookupByCodePoint(codePoint: UnicodeCodePoint): TghCoreRecord | null;
};

export type RawInputProtection =
  | "compatibility-ideograph"
  | "ideographic-variation-sequence"
  | "private-use-character";

export type NameGraphemeInspection = {
  rawCluster: string;
  rawCodePoints: UnicodeCodePoint[];
  nfcCodePoints: UnicodeCodePoint[];
  nfcLookup: string | null;
  normalizationChanged: boolean;
  containsNonBmp: boolean;
  protections: RawInputProtection[];
};

export type NameInputInspection = {
  rawInput: string;
  graphemes: NameGraphemeInspection[];
};

export type VariantCandidate = {
  glyph: string;
  codePoints: UnicodeCodePoint[];
  meaningHint: string;
  sourceIds: string[];
};

export type CommonVariantDisambiguation = {
  inputGlyph: string;
  inputCodePoints: UnicodeCodePoint[];
  candidates: VariantCandidate[];
  adoptedGlyph: null;
  requiresConfirmation: true;
};

export type VariantProposal = {
  inputGlyph: string;
  candidates: ProvisionalVariantCandidate[];
  adoptedGlyph: null;
  requiresConfirmation: boolean;
};

export type ElementVector = Record<ElementName, number>;

export type CharacterMethodEvidence = {
  methodId: "name.semantic-five-elements.v1";
  version: "1.0.0";
  vector: ElementVector;
  unknownShare: number;
  basisText: string;
  sourceIds: string[];
  confidence: "reviewed" | "contested" | "unknown";
};

export type AnalysisBlocker = {
  id:
    | "registration-glyph-pending"
    | "actual-reading-unconfirmed"
    | "adopted-glyph-unconfirmed"
    | "key-meaning-unreviewed"
    | "unsupported-input";
  evidence: string;
};

export type ConfirmedUsageRisk = {
  id: "confirmed-severe-homophone-or-ambiguity" | "persistent-input-document-or-calling-issue";
  severity: "hard";
  evidence: string;
  manuallyReviewed: true;
  userConfirmed: true;
};

export type NameCharacterRecord = {
  rawCluster: string;
  nfcLookup: string | null;
  inputGlyph: string;
  inputCodePoints: UnicodeCodePoint[];
  adoptedGlyph: string | null;
  glyphBasis: "registered-input" | "confirmed-traditional-reference";
  variantCandidates: VariantCandidate[];
  requiresConfirmation: boolean;
  tghIndex: number | null;
  tghLevel: TghLevel | null;
  readings: TghReading[];
  adoptedReading: string | null;
  radicalStrokeRecords: RadicalStrokeRecord[];
  totalStrokeRecord: TotalStrokeRecord | null;
  meaning: string | null;
  semantic: CharacterMethodEvidence | null;
  analysisBlockers: AnalysisBlocker[];
  confirmedUsageRisks: ConfirmedUsageRisk[];
};

export type ReviewedNameCharacterRecord = {
  id: string;
  glyph: string;
  codePoints: UnicodeCodePoint[];
  meaning: string;
  coverageSourceIds: string[];
  reviewedOn: string;
  reviewerRole: string;
  semantic: CharacterMethodEvidence;
};

export type ReviewedFullNameRisk = {
  id: string;
  evidence: string;
};

export type ReviewedFullNameRecord = {
  id: string;
  surname: string;
  fullName: string;
  adoptedReadings: string[];
  adoptedGlyphBasis: "registered-input" | "confirmed-traditional-reference";
  reviewStatus: "reviewed";
  reviewDate: string;
  reviewerRole: string;
  risks: ReviewedFullNameRisk[];
};
