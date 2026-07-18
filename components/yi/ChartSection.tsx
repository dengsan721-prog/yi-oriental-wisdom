import type {
  ChartRelation,
  ElementDiagnostic,
  FourPillarsResult,
  PillarKey,
  ProfessionalReport,
} from "../../lib/yi/types";

const confidenceLabel = { high: "高", medium: "中", limited: "有限" } as const;
const pillarNames: Record<PillarKey, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };

export type ChartRow = {
  label: "日主" | "月令" | "透干" | "根气" | "十神结构" | "干支关系" | "调候" | "五行提醒";
  value: string;
};

function monthCommandText(report: ProfessionalReport): string {
  if (report.monthCommand.ambiguous) {
    const candidate = report.monthCommand.representative;
    return `待核；代表坐标为${candidate.branch}月、藏干本气${candidate.hiddenStem}、相对日主呈${candidate.tenGod}，仅供核对交节前后候选。`;
  }
  return `${report.monthCommand.branch}月，以${report.monthCommand.hiddenStem}为藏干本气，相对日主呈${report.monthCommand.tenGod}。`;
}

function relationText(relation: ChartRelation): string {
  return `${relation.label}（${relation.pillars.map((pillar) => pillarNames[pillar]).join(" · ")}）`;
}

function tenGodStructure(report: ProfessionalReport): string {
  return report.pillarFacts.map((pillar) => {
    const hidden = pillar.hiddenStems.map((item) => `${item.stem}${item.tenGod}`).join("、") || "未列出";
    const status = pillar.ambiguous ? "待核代表坐标" : "已记录";
    return `${pillar.label}${status}：天干${pillar.stem}${pillar.stemTenGod}，藏干${hidden}`;
  }).join("；");
}

export function buildChartRows(report: ProfessionalReport): ChartRow[] {
  const distribution = report.elementDiagnostics.map((item) => `${item.element}${item.count}`).join("、");
  return [
    { label: "日主", value: `${report.dayMaster}为日干，也是全盘十神换算的参照轴；它不是单独的人格或吉凶结论。` },
    { label: "月令", value: monthCommandText(report) },
    { label: "透干", value: report.exposedStems.length ? report.exposedStems.join("；") : "当前稳定柱未形成可确认的透干线索。" },
    { label: "根气", value: report.roots.length ? report.roots.join("；") : "当前稳定柱未见日主同类藏干根气；待核柱不参与确定判断。" },
    { label: "十神结构", value: tenGodStructure(report) },
    { label: "干支关系", value: report.relations.length ? report.relations.map(relationText).join("；") : "稳定柱之间未检出当前规则支持的合、冲、刑、害、破或三合关系。" },
    { label: "调候", value: report.monthCommand.ambiguous ? "月令仍待核，寒暖燥湿先保留候选，不据代表坐标机械补足。" : `以${report.monthCommand.branch}月的季节条件为第一层线索，仍须合看根气、透干与全局，不由单一五行直接定喜忌。` },
    { label: "五行提醒", value: `稳定柱可见计数为${distribution}。数量只是分布记录，未出现不等于应当补足。` },
  ];
}

function seasonSupportLabel(diagnostic: ElementDiagnostic): string {
  if (diagnostic.inSeason === null) return "待核";
  return diagnostic.inSeason ? "是" : "否";
}

export function ChartSection({ chart, report }: { chart: FourPillarsResult; report: ProfessionalReport }) {
  const chartRows = buildChartRows(report);
  return <section className="report-section chart-report">
    <header className="chart-report-head">
      <div>
        <small>专业命盘</small>
        <h1>{report.dayMaster}日主 · 命局骨架</h1>
      </div>
      <span className={`confidence-badge confidence-${report.confidence}`}>观察置信度 · {confidenceLabel[report.confidence]}</span>
      <p>{report.summary}</p>
    </header>

    <section className="birth-fact-band" aria-label="出生事实">
      <div><span>公历</span><b>{report.birthFacts.solar}</b></div>
      <div><span>农历</span><b>{report.birthFacts.lunar}</b></div>
      <div><span>出生地址</span><b>{report.birthFacts.location}</b></div>
      <div><span>生肖</span><b>{report.birthFacts.zodiac}</b></div>
      <div><span>星座</span><b>{report.birthFacts.starSign}</b></div>
      <div><span>时辰可信度</span><b>{report.birthFacts.timeConfidence}</b></div>
      <details className="time-basis">
        <summary>查看时间口径与真太阳时状态</summary>
        <dl>
          <div><dt>时区口径</dt><dd>{report.birthFacts.timezone}</dd></div>
          <div><dt>真太阳时</dt><dd>{report.birthFacts.trueSolarTime}</dd></div>
        </dl>
      </details>
    </section>

    <section className="life-overview" aria-labelledby="life-overview-title">
      <article className="life-theme">
        <small>人生主调</small>
        <h2 id="life-overview-title">先看懂贯穿全局的那条线</h2>
        <p>{report.lifeTheme}</p>
      </article>
      <section className="core-talents" aria-labelledby="core-talents-title">
        <h2 id="core-talents-title">核心天赋</h2>
        <ol>{report.coreTalents.map((talent, index) => <li key={talent}><span>0{index + 1}</span><p>{talent}</p></li>)}</ol>
      </section>
      <section className="central-tensions" aria-labelledby="central-tensions-title">
        <h2 id="central-tensions-title">核心张力</h2>
        <ol>{report.centralTensions.map((tension, index) => <li key={tension}><span>0{index + 1}</span><p>{tension}</p></li>)}</ol>
      </section>
      <article className="current-lesson">
        <small>当下课题</small>
        <p>{report.currentLesson}</p>
      </article>
    </section>

    <section className="report-lead-grid" aria-label="命局结论与行动">
      <div className="key-judgments">
        <h2>关键判断</h2>
        <ol>{report.keyJudgments.map((judgment) => <li key={judgment}>{judgment}</li>)}</ol>
      </div>
      <aside className="report-actions">
        <h2>三项行动</h2>
        <ol>{report.actions.map((action, index) => <li className="report-action" key={action}><span>0{index + 1}</span>{action}</li>)}</ol>
      </aside>
    </section>

    <section className="professional-skeleton" aria-labelledby="professional-skeleton-title">
      <header>
        <small>四柱与十神</small>
        <h2 id="professional-skeleton-title">完整命盘骨架</h2>
        <p>{report.pillarFacts.length === 3 ? "时辰不详，仅展示年、月、日三柱；不补造时柱或时柱派生事实。" : "四柱按录入出生时刻排定；标为待核的坐标只用于核对，不与稳定柱等量判断。"}</p>
      </header>
      <div className="professional-pillars" role="list" aria-label={report.pillarFacts.length === 3 ? "三柱命盘，时柱未生成" : "四柱命盘"}>
        {report.pillarFacts.map((pillar) => <article aria-label={pillar.ambiguous ? `${pillarNames[pillar.key]}待核代表坐标` : undefined} className={`pillar-card${pillar.ambiguous ? " ambiguous" : ""}`} data-pillar={pillar.key} key={pillar.key} role="listitem">
          <header><span>{pillar.label}</span>{pillar.ambiguous && <em>待核</em>}</header>
          {pillar.ambiguous && <small className="candidate-label">代表坐标 · 仅供核对</small>}
          <div className="pillar-glyphs">
            <div><small>天干</small><strong>{pillar.stem}</strong><span>{pillar.stemElement} · {pillar.stemTenGod}</span></div>
            <div><small>地支</small><strong>{pillar.branch}</strong><span>{pillar.branchElement}</span></div>
          </div>
          <div className="pillar-hidden"><b>藏干</b>{pillar.hiddenStems.map((hidden) => <small key={`${pillar.key}-${hidden.index}`}>{hidden.stem} · {hidden.tenGod}</small>)}</div>
        </article>)}
      </div>

      <section className={`month-command${report.monthCommand.ambiguous ? " ambiguous" : ""}`}>
        <div><span>月令</span><b>{report.monthCommand.ambiguous ? "待核" : report.monthCommand.branch}</b></div>
        <p>{monthCommandText(report)}</p>
      </section>

      <dl className="professional-chart-rows">
        {chartRows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>

      <section className="relation-block" aria-labelledby="relation-heading">
        <header><h2 id="relation-heading">干支关系</h2><small>传统关系名 · 涉及柱位</small></header>
        <div className="relation-tags">
          {report.relations.length
            ? report.relations.map((relation, index) => <span key={`${relation.label}-${index}`}><b>{relation.label}</b>{relation.pillars.map((pillar) => pillarNames[pillar]).join(" · ")}</span>)
            : <p>稳定柱之间未检出当前规则支持的合、冲、刑、害、破或三合关系。</p>}
        </div>
      </section>

      <section className="element-diagnostics" aria-labelledby="element-heading">
        <header><h2 id="element-heading">五行诊断</h2><p>计数、季节支持、根气与透干分开查看；“未出现”不等于“应当补足”。</p></header>
        <div>
          {report.elementDiagnostics.map((diagnostic, index) => <details className="element-diagnostic" key={diagnostic.element} open={index === 0}>
            <summary><b>{diagnostic.element}{diagnostic.count}</b><span>直接季节支持 · {seasonSupportLabel(diagnostic)}</span></summary>
            <dl>
              <div><dt>根气</dt><dd>{diagnostic.roots.length ? diagnostic.roots.join("；") : "稳定柱未见"}</dd></div>
              <div><dt>透干</dt><dd>{diagnostic.exposed.length ? diagnostic.exposed.join("；") : "稳定柱未见"}</dd></div>
            </dl>
            <p>{diagnostic.conclusion}</p>
          </details>)}
        </div>
      </section>
    </section>

    <aside className="ambiguity-note"><b>计算边界</b><p>{chart.disclaimer}</p></aside>
  </section>;
}
