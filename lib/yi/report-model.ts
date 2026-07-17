import { Solar } from "lunar-typescript";
import { buildKeyJudgments, buildReportActions, buildReportSummary, type ReportCopyContext } from "./report-copy";
import { stemElements } from "./stems-branches";
import type {
  BirthInput,
  ElementDiagnostic,
  ElementName,
  FourPillarsResult,
  HiddenStemFact,
  PillarFact,
  PillarKey,
  ProfessionalReport,
} from "./types";

export type { ElementDiagnostic, HiddenStemFact, PillarFact, ProfessionalReport } from "./types";

const elementOrder: ElementName[] = ["木", "火", "土", "金", "水"];
const pillarOrder: PillarKey[] = ["year", "month", "day", "hour"];
const pillarNames: Record<PillarKey, string> = { year: "年", month: "月", day: "日", hour: "时" };
const zodiacByBranch: Record<string, string> = {
  子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇",
  午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪",
};

function parseBirthDate(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("请输入有效的公历日期");
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function formatBirthFacts(chart: FourPillarsResult, birth: BirthInput): ProfessionalReport["birthFacts"] {
  const { year, month, day } = parseBirthDate(birth.date);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const dateLabel = `${year}年${month}月${day}日`;
  const timeLabel = birth.timeConfidence === "unknown" || birth.time === null
    ? `${dateLabel}（时辰不详）`
    : birth.timeConfidence === "approximate"
      ? `${dateLabel} 约${birth.time}`
      : `${dateLabel} ${birth.time}`;
  const location = birth.location.trim();
  const trueSolarTime = location
    ? "未校正：当前仅记录出生地址，尚未接入经纬度与真太阳时换算，不展示校正钟点。"
    : "未校正：未提供出生地址，且当前未接入经纬度与真太阳时换算，不展示校正钟点。";
  const zodiac = zodiacByBranch[chart.pillars.year.branch] ?? "待核";
  const zodiacLabel = chart.ambiguousPillars.includes("year") ? `${zodiac}（年柱待核）` : zodiac;
  return {
    solar: timeLabel,
    lunar: `${lunar.getYear()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    location: location || "未提供",
    timezone: "中国标准时间（UTC+8，按录入的当地钟表时间）",
    trueSolarTime,
    zodiac: zodiacLabel,
    starSign: `${solar.getXingZuo()}座`,
    timeConfidence: birth.timeConfidence === "exact" ? "精确时间" : birth.timeConfidence === "approximate" ? "约略时间" : "时辰不详",
  };
}

function buildPillarFacts(chart: FourPillarsResult): PillarFact[] {
  return pillarOrder.flatMap((key) => {
    const pillar = chart.pillars[key];
    if (!pillar) return [];
    const hiddenStems: HiddenStemFact[] = chart.professional.tenGods
      .filter((entry) => entry.pillar === key && entry.position === "branch")
      .sort((left, right) => (left.hiddenStemIndex ?? 0) - (right.hiddenStemIndex ?? 0))
      .map((entry, index) => ({ stem: entry.symbol, tenGod: entry.tenGod, index: entry.hiddenStemIndex ?? index }));
    const visibleTenGod = key === "day"
      ? "日主"
      : chart.professional.tenGods.find((entry) => entry.pillar === key && entry.position === "stem")?.tenGod ?? "待核";
    return [{
      key,
      label: pillar.label,
      stem: pillar.stem,
      branch: pillar.branch,
      stemElement: pillar.element,
      branchElement: pillar.branchElement,
      stemTenGod: visibleTenGod,
      hiddenStems,
    }];
  });
}

function exposedClue(pillar: PillarFact): string {
  return `${pillarNames[pillar.key]}干${pillar.stem}${pillar.stemElement}（${pillar.stemTenGod}）`;
}

function rootClue(pillar: PillarFact, hidden: HiddenStemFact): string {
  return `${pillarNames[pillar.key]}支${pillar.branch}藏${hidden.stem}${stemElements[hidden.stem]}（${hidden.tenGod}）`;
}

function diagnosticConclusion(
  element: ElementName,
  count: number,
  inSeason: boolean | null,
  roots: string[],
  exposed: string[],
): string {
  const season = inSeason === null
    ? "出生日处交节边界且时辰不详，月令可能跨节，季节支持暂不作单一判断"
    : inSeason
      ? "直接得到月令本气支持"
      : "未直接得到月令本气支持";
  const root = roots.length ? `藏干根气线索见${roots.join("、")}` : "未见同类藏干根气线索";
  const exposedText = exposed.length ? `透干线索见${exposed.join("、")}` : "未见同类透干线索";
  return `${element}在可见八字中${count === 0 ? "未直接出现" : `出现${count}处`}；${season}，${root}，${exposedText}。数量只是分布记录，未出现不等于应当补足；是否为结构所需仍须结合月令、根气、生克与调候审慎研判。`;
}

function buildElementDiagnostics(chart: FourPillarsResult, pillarFacts: PillarFact[]): ElementDiagnostic[] {
  const monthAmbiguous = chart.ambiguousPillars.includes("month");
  const monthMainStem = pillarFacts.find((pillar) => pillar.key === "month")?.hiddenStems[0]?.stem;
  const monthMainElement = monthMainStem ? stemElements[monthMainStem] : null;
  return elementOrder.map((element) => {
    const roots = pillarFacts.flatMap((pillar) => pillar.hiddenStems
      .filter((hidden) => stemElements[hidden.stem] === element)
      .map((hidden) => rootClue(pillar, hidden)));
    const exposed = pillarFacts.filter((pillar) => pillar.stemElement === element).map(exposedClue);
    const inSeason = monthAmbiguous ? null : monthMainElement === element;
    const count = chart.elementCounts[element];
    return { element, count, inSeason, roots, exposed, conclusion: diagnosticConclusion(element, count, inSeason, roots, exposed) };
  });
}

export function buildProfessionalReport(chart: FourPillarsResult, birth: BirthInput): ProfessionalReport {
  const pillarFacts = buildPillarFacts(chart);
  const monthFact = pillarFacts.find((pillar) => pillar.key === "month");
  const monthHidden = monthFact?.hiddenStems[0];
  if (!monthFact || !monthHidden) throw new Error("月令藏干资料不完整");
  const monthCommand = { branch: monthFact.branch, hiddenStem: monthHidden.stem, tenGod: monthHidden.tenGod };
  const dayMaster = chart.professional.dayMaster.stem;
  const exposedStems = pillarFacts.map(exposedClue);
  const roots = pillarFacts.flatMap((pillar) => pillar.hiddenStems
    .filter((hidden) => stemElements[hidden.stem] === chart.professional.dayMaster.element)
    .map((hidden) => rootClue(pillar, hidden)));
  const elementDiagnostics = buildElementDiagnostics(chart, pillarFacts);
  const copyContext: ReportCopyContext = {
    dayMaster,
    dayMasterElement: chart.professional.dayMaster.element,
    monthCommand,
    exposedStems,
    roots,
    elementDiagnostics,
    relations: chart.professional.relations,
    pillarCount: pillarFacts.length,
    monthAmbiguous: chart.ambiguousPillars.includes("month"),
    confidence: chart.confidence,
  };
  return {
    birthFacts: formatBirthFacts(chart, birth),
    pillarFacts,
    dayMaster,
    monthCommand,
    exposedStems,
    roots,
    elementDiagnostics,
    relations: [...chart.professional.relations],
    summary: buildReportSummary(copyContext),
    keyJudgments: buildKeyJudgments(copyContext),
    actions: buildReportActions(copyContext),
    confidence: chart.confidence,
  };
}
