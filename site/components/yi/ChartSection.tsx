import {
  assertMatchingChartReport,
  buildChartElementVisibility,
  buildChartNarrative,
  type ChartNarrative,
  type NarrativeBeat,
  type PlainChartTranslation,
  type SceneMicroStory,
} from "../../lib/yi/chart-narrative";
import type {
  FourPillarsResult,
  InterpretationItem,
  PillarKey,
  ProfessionalReport,
} from "../../lib/yi/types";
import { SceneLineArt } from "./SceneLineArt";

const pillarOrder: readonly PillarKey[] = ["year", "month", "day", "hour"];
const pillarNames: Record<PillarKey, string> = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱",
};

export type ProfessionalChartCellStatus =
  | "stable"
  | "candidate"
  | "unavailable";

export type ProfessionalChartCell = {
  key: PillarKey;
  status: ProfessionalChartCellStatus;
  lines: readonly string[];
};

export type ProfessionalChartRowId =
  | "stem"
  | "branch"
  | "stem-ten-god"
  | "hidden-stems"
  | "hidden-ten-gods"
  | "na-yin"
  | "twelve-growth";

export type ProfessionalChartGrid = {
  columns: readonly {
    key: PillarKey;
    label: string;
    status: ProfessionalChartCellStatus;
    note?: string;
  }[];
  rows: readonly {
    id: ProfessionalChartRowId;
    label: string;
    cells: readonly ProfessionalChartCell[];
  }[];
};

type GridRowDefinition = {
  id: ProfessionalChartRowId;
  label: string;
};

const gridRows: readonly GridRowDefinition[] = [
  { id: "stem", label: "天干" },
  { id: "branch", label: "地支" },
  { id: "stem-ten-god", label: "主星／十神" },
  { id: "hidden-stems", label: "藏干" },
  { id: "hidden-ten-gods", label: "藏干十神" },
  { id: "na-yin", label: "纳音" },
  { id: "twelve-growth", label: "十二长生" },
];

function coordinateStatus(
  status: "stable" | "candidate" | "unavailable",
  targetCandidate: boolean,
): ProfessionalChartCellStatus {
  if (status === "unavailable") return "unavailable";
  return targetCandidate || status === "candidate" ? "candidate" : "stable";
}

export function buildProfessionalChartGrid(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
): ProfessionalChartGrid {
  assertMatchingChartReport(chart, report);
  const factByKey = new Map(report.pillarFacts.map(fact => [fact.key, fact]));
  const dayAxisAmbiguous = chart.ambiguousPillars.includes("day")
    || chart.professional.ambiguousFields.includes("dayMaster")
    || chart.professional.ambiguousFields.includes("dayPillar");
  const columnStatus = (key: PillarKey): ProfessionalChartCellStatus => {
    const fact = factByKey.get(key);
    if (!fact) return "unavailable";
    return fact.ambiguous || (key === "day" && dayAxisAmbiguous)
      ? "candidate"
      : "stable";
  };
  const unavailable = (key: PillarKey): ProfessionalChartCell => ({
    key,
    status: "unavailable",
    lines: [key === "hour" ? "时辰未填写" : "资料待核"],
  });
  const buildCell = (
    rowId: ProfessionalChartRowId,
    key: PillarKey,
  ): ProfessionalChartCell => {
    const fact = factByKey.get(key);
    if (!fact) return unavailable(key);
    const targetCandidate = columnStatus(key) === "candidate";
    if (rowId === "stem") {
      return {
        key,
        status: targetCandidate ? "candidate" : "stable",
        lines: [fact.stem],
      };
    }
    if (rowId === "branch") {
      return {
        key,
        status: targetCandidate ? "candidate" : "stable",
        lines: [fact.branch],
      };
    }
    if (rowId === "stem-ten-god") {
      return {
        key,
        status: targetCandidate || dayAxisAmbiguous
          ? "candidate"
          : "stable",
        lines: [fact.stemTenGod],
      };
    }
    if (rowId === "hidden-stems") {
      return {
        key,
        status: targetCandidate ? "candidate" : "stable",
        lines: fact.hiddenStems.map(item => item.stem),
      };
    }
    if (rowId === "hidden-ten-gods") {
      return {
        key,
        status: targetCandidate || dayAxisAmbiguous
          ? "candidate"
          : "stable",
        lines: fact.hiddenStems.map(item => item.tenGod),
      };
    }
    const coordinate = report.pillarCoordinates[key];
    if (rowId === "na-yin") {
      if (coordinate.naYin.status === "unavailable") return unavailable(key);
      return {
        key,
        status: coordinateStatus(
          coordinate.naYin.status,
          targetCandidate,
        ),
        lines: [coordinate.naYin.value],
      };
    }
    if (coordinate.twelveGrowth.status === "unavailable") {
      return unavailable(key);
    }
    return {
      key,
      status: coordinateStatus(
        coordinate.twelveGrowth.status,
        targetCandidate || dayAxisAmbiguous,
      ),
      lines: [coordinate.twelveGrowth.value],
    };
  };

  return {
    columns: pillarOrder.map(key => ({
      key,
      label: pillarNames[key],
      status: columnStatus(key),
      ...(columnStatus(key) === "unavailable"
        ? { note: key === "hour" ? "时辰未填写" : "资料待核" }
        : {}),
    })),
    rows: gridRows.map(row => ({
      ...row,
      cells: pillarOrder.map(key => buildCell(row.id, key)),
    })),
  };
}

function statusLabel(status: ProfessionalChartCellStatus): string | null {
  if (status === "candidate") return "待核";
  if (status === "unavailable") return "未提供";
  return null;
}

function ProfessionalPillarTable({
  grid,
}: {
  grid: ProfessionalChartGrid;
}) {
  return (
    <section
      className="professional-pillar-table-section"
      aria-labelledby="professional-pillar-table-title"
    >
      <header>
        <small>四柱排盘</small>
        <h2 id="professional-pillar-table-title">生辰八字专业排盘</h2>
        <p>候选坐标统一标“待核”；时辰未填写时保留空列，不补造任何数值。</p>
      </header>
      <div className="professional-pillar-table-wrap">
        <table
          className="professional-pillar-table"
          data-testid="professional-pillar-table"
        >
          <thead>
            <tr>
              <th scope="col">项目</th>
              {grid.columns.map(column => (
                <th
                  data-pillar-column={column.key}
                  data-status={column.status}
                  key={column.key}
                  scope="col"
                >
                  <span>{column.label}</span>
                  {column.status === "candidate" && <small>待核</small>}
                  {column.note && <small>{column.note}</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map(row => (
              <tr data-chart-row={row.id} key={row.id}>
                <th scope="row">{row.label}</th>
                {row.cells.map(cell => (
                  <td
                    data-cell-status={cell.status}
                    data-pillar={cell.key}
                    key={cell.key}
                  >
                    {cell.lines.map((line, index) => (
                      <span key={`${line}-${index}`}>{line}</span>
                    ))}
                    {statusLabel(cell.status) && (
                      <small>{statusLabel(cell.status)}</small>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function listText(values: readonly string[]): string {
  return values.length ? values.join("、") : "无";
}

type ProfessionalReading = {
  id: PlainChartTranslation["sectionId"];
  title: string;
  professionalText: string;
};

function buildProfessionalReadings(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
): readonly ProfessionalReading[] {
  const visibility = buildChartElementVisibility(chart, report);
  const dayAxisAmbiguous = chart.ambiguousPillars.includes("day")
    || chart.professional.ambiguousFields.includes("dayMaster")
    || chart.professional.ambiguousFields.includes("dayPillar");
  const relationAmbiguous = chart.professional.ambiguousFields
    .includes("relationSummary");
  const stableCount = report.pillarFacts.filter(fact =>
    !chart.ambiguousPillars.includes(fact.key)
    && !(fact.key === "day" && dayAxisAmbiguous)).length;
  const overview = dayAxisAmbiguous
    ? `日柱与日干参照待核；当前只确认其余${stableCount}柱的天干地支、纳音与可见五行，凡依赖日干换算的十神、藏干十神和十二长生都先作为候选，不把候选十神当成定局。`
    : `${report.dayMaster}为日干参照，当前有${stableCount}柱可作稳定观察；年柱看早年与外部背景，月柱看月令气势，日柱看自身与亲密位置，时柱看后续展开；十神、藏干、纳音和十二长生按上表互相参照，不由单项推出人生结果。`;
  const month = dayAxisAmbiguous
    ? "日干参照待核，月令的十神与旺衰观察暂不作单一判断；当前只保留月支、本气、天干地支和纳音等不依赖日干的坐标，等日主确认后再看月令对十神强弱的牵动。"
    : report.monthCommand.ambiguous
      ? "月令处在交节候选范围，本气与十神暂不作单一判断；旺衰先看月令、透干、根气、藏干是否呼应，再看四柱有没有成势或被冲散，暂不下身强身弱定论。"
      : `${report.monthCommand.branch}月令以${report.monthCommand.hiddenStem}为本气，相对日干呈${report.monthCommand.tenGod}；旺衰先看月令得气，再看天干是否透出、地支是否有根、藏干是否帮扶或制约，最后才把十神作用放回全局。`;
  const flow = `明见：${listText(visibility.visibleElements)}；只藏未透：${listText(visibility.hiddenOnlyElements)}；当前稳定柱未见：${listText(visibility.absentInStablePillars)}。显在五行像台面上的人手，藏干像仓库里的备用资源；要看它们与日主、月令和十神是否接得上，不直接等于需要补救。`;
  const relations = relationAmbiguous
    ? "关系资料待核，当前不显示具体合、冲、刑、害、破或三合结论；待四柱稳定后，才把天干合化、地支冲合刑害与三合三会放在同一张关系网里看。"
    : report.relations.length
      ? report.relations.map(relation =>
          `${relation.label}（${relation.pillars.map(key => pillarNames[key]).join("、")}），需同时看被牵动的柱位、对应十神和月令气势`).join("；")
      : "当前稳定柱之间未见可确认的合、冲、刑、害、破或三合关系；这表示关系网暂时清爽，但仍要看天干地支的五行生克、十神分布和月令气势。";
  const missing = `当前稳定柱未见：${listText(visibility.absentInStablePillars)}。未见只表示已确认资料中没有直接出现，需再看藏干、纳音、月令和十神是否能间接补气，不等于人生缺陷，也不自动指向补救。${visibility.hourUnknown ? "时柱未填写，当前未见项仍可能随时柱变化。" : "四柱已列，仍须结合现实处境检验任何建议。"} `;

  return [
    { id: "overview", title: "命局总论", professionalText: overview },
    {
      id: "month-strength",
      title: "月令与旺衰观察",
      professionalText: month,
    },
    {
      id: "element-flow",
      title: "五行气势与显隐",
      professionalText: flow,
    },
    {
      id: "relations",
      title: "天干地支关系",
      professionalText: relations,
    },
    {
      id: "missing-elements",
      title: "五行缺失说明",
      professionalText: missing.trim(),
    },
  ];
}

function PlainTranslation({
  translation,
}: {
  translation: PlainChartTranslation;
}) {
  return (
    <div className="plain-translation">
      <p className="readability-copy"><strong>这是什么意思：</strong>{translation.whatItMeans}</p>
      <p className="readability-copy"><strong>生活里会怎样：</strong>{translation.lifeScene}</p>
      <p className="readability-copy"><strong>可以怎么做：</strong>{translation.practicalGuidance}</p>
    </div>
  );
}

function WaterfallHint() {
  return <span className="waterfall-open-hint">点开阅读 · 收起回到总览</span>;
}

const beatLabels = [
  ["situation", "眼前处境"],
  ["opportunity", "真正机会"],
  ["firstStrength", "先用上的力量"],
  ["overuseCost", "用过头的代价"],
  ["lowPoint", "可能的低点"],
  ["newChoice", "新的选择"],
  ["turn", "转折怎样发生"],
  ["observableSignal", "可以观察什么"],
] as const;

function NarrativeBeatCard({
  title,
  beat,
}: {
  title: string;
  beat: NarrativeBeat;
}) {
  return (
    <article className="chart-narrative-beat">
      <SceneLineArt kind="story" />
      <h3>{title}</h3>
      {beatLabels.map(([field, label]) => (
        <p className="readability-copy" key={field}><strong>{label}</strong>{beat[field]}</p>
      ))}
    </article>
  );
}

const microLabels = [
  ["trigger", "什么时候出现"],
  ["firstReaction", "第一反应"],
  ["apparentBenefit", "眼前好处"],
  ["cost", "继续下去的代价"],
  ["turnAction", "怎样转弯"],
  ["example", "放进真实场景"],
  ["observableSignal", "可观察信号"],
] as const;

function MicroStoryCard({
  story,
}: {
  story: SceneMicroStory<string>;
}) {
  return (
    <article className="chart-micro-story">
      <SceneLineArt kind="scene" />
      <h3>{story.title}</h3>
      {microLabels.map(([field, label]) => (
        <p className="readability-copy" key={field}><strong>{label}</strong>{story[field]}</p>
      ))}
    </article>
  );
}

function DetailedNarrative({
  narrative,
}: {
  narrative: ChartNarrative;
}) {
  return (
    <section
      className="chart-detailed-reading"
      data-testid="chart-plain-story"
      aria-labelledby="chart-detailed-reading-title"
    >
      <header>
        <small>人生场景详解</small>
        <h2 id="chart-detailed-reading-title">详细通俗解读</h2>
        <p>以下内容只写可观察的场景、选择与后果，不把任何情节说成已经发生。</p>
      </header>
      <div className="chart-narrative-grid">
        <NarrativeBeatCard title="自我与选择" beat={narrative.self} />
        <NarrativeBeatCard title="事业与承担" beat={narrative.career} />
        <NarrativeBeatCard title="关系与修复" beat={narrative.relationship} />
        <NarrativeBeatCard title="节奏与恢复" beat={narrative.rhythm} />
      </div>
      {[
        ["事业场景", narrative.careerAdvice],
        ["关系场景", narrative.relationshipAdvice],
        ["生活节奏", narrative.rhythmAdvice],
      ].map(([title, stories]) => (
        <section className="chart-scene-group" key={title as string}>
          <h2>{title as string}</h2>
          <div>
            {(stories as readonly SceneMicroStory<string>[]).map(story => (
              <MicroStoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

export function ChartSection({
  chart,
  report,
  items,
}: {
  chart: FourPillarsResult;
  report: ProfessionalReport;
  items: readonly InterpretationItem[];
}) {
  const grid = buildProfessionalChartGrid(chart, report);
  const narrative = buildChartNarrative(chart, report, items);
  const readings = buildProfessionalReadings(chart, report);
  const translationById = new Map(
    narrative.professionalTranslations.map(item => [item.sectionId, item]),
  );

  return (
    <section className="report-section chart-report">
      <header className="chart-report-head">
        <small>专业命盘</small>
        <h1>四柱排盘与通俗解读</h1>
        <p>先看完整专业坐标，再逐段读懂它在现实生活中的可能表现与可验证行动。</p>
      </header>

      <section className="birth-fact-band" aria-label="出生事实">
        <div><span>公历</span><b>{report.birthFacts.solar}</b></div>
        <div><span>农历</span><b>{report.birthFacts.lunar}</b></div>
        <div><span>出生地址</span><b>{report.birthFacts.location}</b></div>
        <div><span>生肖</span><b>{report.birthFacts.zodiac}</b></div>
        <div><span>星座</span><b>{report.birthFacts.starSign}</b></div>
        <div><span>时辰状态</span><b>{report.birthFacts.timeConfidence}</b></div>
      </section>

      <ProfessionalPillarTable grid={grid} />

      <section
        className="professional-reading-sections waterfall-grid"
        aria-label="命盘专业解读与通俗说明"
      >
        {readings.map(reading => {
          const translation = translationById.get(reading.id);
          if (!translation) return null;
          return (
            <details className="professional-reading-section waterfall-card waterfall-card--illustrated" key={reading.id}>
              <summary>
                <SceneLineArt kind="chart" />
                <small>命盘小模块</small>
                <h2>{reading.title}</h2>
                <p>{reading.professionalText}</p>
                <WaterfallHint />
              </summary>
              <div className="waterfall-card-body">
                <p className="professional-reading-copy">
                  {reading.professionalText}
                </p>
                <PlainTranslation translation={translation} />
              </div>
            </details>
          );
        })}
      </section>

      <DetailedNarrative narrative={narrative} />
    </section>
  );
}
