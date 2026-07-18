export type ElementName = "木" | "火" | "土" | "金" | "水";

export type CalendarMode = "solar" | "lunar";

export type TimeMode = "exact" | "earthly" | "unknown";

export type BirthDateSelection = {
  mode: CalendarMode;
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
};

export type BirthInput = {
  name: string;
  date: string;
  time: string | null;
  location: string;
  gender: "female" | "male" | "unspecified";
  timeConfidence: "exact" | "approximate" | "unknown";
};

export type Pillar = {
  stem: string;
  branch: string;
  element: ElementName;
  branchElement: ElementName;
  label: string;
};

export type PillarKey = "year" | "month" | "day" | "hour";

export type TenGodName = "比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印";

export type TenGodEntry = {
  pillar: PillarKey;
  position: "stem" | "branch";
  symbol: string;
  tenGod: TenGodName;
  hiddenStemIndex?: number;
};

export type ChartRelation = {
  type: "stem-combination" | "branch-combination" | "branch-trine" | "branch-clash" | "branch-punishment" | "branch-harm" | "branch-break";
  pillars: PillarKey[];
  symbols: string[];
  label: string;
};

export type AmbiguousProfessionalField = "structureBalance" | "sameAndResourceElements" | "lowerCountElements" | "tenGodSummary" | "relationSummary";

export type ProfessionalChart = {
  dayMaster: { stem: string; element: ElementName; polarity: "yang" | "yin" };
  structureBalance: "support-heavy" | "mixed" | "expression-heavy";
  supportScore: number;
  observationConfidence: "medium" | "limited";
  pattern: string;
  climate: string;
  sameAndResourceElements: ElementName[];
  lowerCountElements: ElementName[];
  tenGods: TenGodEntry[];
  relations: ChartRelation[];
  ambiguousFields: AmbiguousProfessionalField[];
};

export type FourPillarsResult = {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  elementCounts: Record<ElementName, number>;
  professional: ProfessionalChart;
  ambiguousPillars: PillarKey[];
  confidence: "high" | "medium" | "limited";
  disclaimer: string;
};

export type HiddenStemFact = {
  stem: string;
  tenGod: TenGodName;
  index: number;
};

export type PillarFact = {
  key: PillarKey;
  label: string;
  stem: string;
  branch: string;
  stemElement: ElementName;
  branchElement: ElementName;
  stemTenGod: TenGodName | "日主" | "待核";
  hiddenStems: HiddenStemFact[];
  ambiguous: boolean;
};

export type MonthCommandCoordinate = {
  branch: string;
  hiddenStem: string;
  tenGod: TenGodName;
};

export type MonthCommandFact =
  | (MonthCommandCoordinate & { ambiguous: false; representative?: never })
  | { branch: "待核"; hiddenStem: "待核"; tenGod: "待核"; ambiguous: true; representative: MonthCommandCoordinate };

export type ElementDiagnostic = {
  element: ElementName;
  count: number;
  inSeason: boolean | null;
  roots: string[];
  exposed: string[];
  conclusion: string;
};

export type ProfessionalReport = {
  birthFacts: {
    solar: string;
    lunar: string;
    location: string;
    timezone: string;
    trueSolarTime: string;
    zodiac: string;
    starSign: string;
    timeConfidence: "精确时间" | "约略时间" | "时辰不详";
  };
  pillarFacts: PillarFact[];
  dayMaster: string;
  monthCommand: MonthCommandFact;
  exposedStems: string[];
  roots: string[];
  elementDiagnostics: ElementDiagnostic[];
  relations: ChartRelation[];
  summary: string;
  keyJudgments: string[];
  actions: string[];
  confidence: FourPillarsResult["confidence"];
};

export type ContentPriority = "core" | "important" | "supporting";

export type InterpretationItem = {
  id: string;
  domain: "self" | "talent" | "career" | "wealth" | "relationship" | "family" | "rhythm";
  professionalTitle: string;
  innovationTitle: string;
  basis: string;
  traditionalJudgment: string;
  plainLanguage: string;
  scenario: string;
  advantageVersion: string;
  shadowVersion: string;
  mirror: string;
  action: string;
  actionNow: string;
  actionLongTerm: string;
  caution: string;
  priority: ContentPriority;
  confidence: "high" | "medium" | "limited";
  sourceTradition: string;
  sourceReferences: string[];
  sourceRuleIds: string[];
  pillarDependencies: PillarKey[];
  affectedByUnknownHour: boolean;
};

export type ProfessionalOverview = {
  dayMaster: string;
  dayMasterElement: ElementName;
  structureBalance: ProfessionalChart["structureBalance"] | "ambiguous";
  pattern: string;
  climate: string;
  sameAndResourceElements: ElementName[];
  lowerCountElements: ElementName[];
  tenGodSummary: string;
  relationSummary: string;
  confidence: FourPillarsResult["confidence"];
  ambiguousFields: AmbiguousProfessionalField[];
};
