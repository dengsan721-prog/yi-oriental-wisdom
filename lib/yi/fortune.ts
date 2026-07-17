import { Solar } from "lunar-typescript";
import { detectRelations, type DetectedRelation, type RelationCoordinate } from "./relations";
import { branchElements, stemElements } from "./stems-branches";
import type { BirthInput, ChartRelation, FourPillarsResult, PillarKey, TenGodName } from "./types";

export type FortuneReading = {
  climate: string;
  originalInteraction: string;
  opportunity: string;
  pressure: string;
  career: string;
  resources: string;
  relationship: string;
  wellbeing: string;
  strategy: string;
};

export type FortuneYear = {
  age: number;
  year: number;
  stemBranch: string;
  basis: string;
  theme: string;
  interaction: string;
  scenario: string;
  action: string;
};

export type FortunePeriod = {
  id: string;
  stemBranch: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  tenGod: TenGodName;
  theme: string;
  reading: FortuneReading;
  years: FortuneYear[];
  confidence: FourPillarsResult["confidence"];
  method: { ruleVersion: string; basis: string; disclaimer: string };
};

type FortuneCoordinateKey = "annual" | "period" | PillarKey;
type FortuneCoordinate = RelationCoordinate<FortuneCoordinateKey> & { label: string; stemBranch: string };
export type FortuneRelation = {
  type: ChartRelation["type"];
  label: string;
  symbols: string[];
  coordinates: Array<{ key: FortuneCoordinateKey; label: string; stemBranch: string }>;
};

const elementOrder = ["木", "火", "土", "金", "水"] as const;
const pillarLabels: Record<PillarKey, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };
const supportiveTypes: ChartRelation["type"][] = ["stem-combination", "branch-combination", "branch-trine"];
const tensionTypes: ChartRelation["type"][] = ["branch-clash", "branch-punishment", "branch-harm", "branch-break"];

export function calculateTenGod(day: string, other: string): TenGodName {
  const dayIndex = elementOrder.indexOf(stemElements[day]);
  const otherIndex = elementOrder.indexOf(stemElements[other]);
  const delta = (otherIndex - dayIndex + 5) % 5;
  const samePolarity = "甲丙戊庚壬".includes(day) === "甲丙戊庚壬".includes(other);
  if (delta === 0) return samePolarity ? "比肩" : "劫财";
  if (delta === 1) return samePolarity ? "食神" : "伤官";
  if (delta === 2) return samePolarity ? "偏财" : "正财";
  if (delta === 3) return samePolarity ? "七杀" : "正官";
  return samePolarity ? "偏印" : "正印";
}

function periodTheme(god: TenGodName) {
  if (["比肩", "劫财"].includes(god)) return "边界、同伴与自主选择";
  if (["食神", "伤官"].includes(god)) return "表达、作品与经验输出";
  if (["正财", "偏财"].includes(god)) return "资源配置与现实承诺";
  if (["正官", "七杀"].includes(god)) return "责任、规则与压力转化";
  return "学习、支持与内在整合";
}

function coordinate(key: FortuneCoordinateKey, label: string, stemBranch: string): FortuneCoordinate {
  return { key, label, stemBranch, stem: stemBranch[0], branch: stemBranch[1] };
}

function knownPillars(chart: FourPillarsResult): FortuneCoordinate[] {
  return (Object.entries(chart.pillars) as [PillarKey, FourPillarsResult["pillars"][PillarKey]][])
    .filter((entry): entry is [PillarKey, NonNullable<typeof entry[1]>] => Boolean(entry[1]))
    .filter(([key]) => !chart.ambiguousPillars.includes(key))
    .map(([key, pillar]) => coordinate(key, pillarLabels[key], `${pillar.stem}${pillar.branch}`));
}

function mapRelation(
  relation: DetectedRelation<FortuneCoordinateKey>,
  coordinates: FortuneCoordinate[],
): FortuneRelation {
  return {
    type: relation.type,
    label: relation.label,
    symbols: relation.symbols,
    coordinates: relation.coordinates.map(key => {
      const match = coordinates.find(item => item.key === key)!;
      return { key, label: match.label, stemBranch: match.stemBranch };
    }),
  };
}

function analyzeFocalRelations(focal: FortuneCoordinateKey, coordinates: FortuneCoordinate[]): FortuneRelation[] {
  return detectRelations(coordinates)
    .filter(relation => relation.coordinates.includes(focal) && relation.coordinates.some(key => key !== focal))
    .map(relation => mapRelation(relation, coordinates));
}

export function analyzeFortuneRelations(
  annualStemBranch: string,
  periodStemBranch: string,
  chart: FourPillarsResult,
): FortuneRelation[] {
  const coordinates = [
    coordinate("annual", "流年", annualStemBranch),
    coordinate("period", "大运", periodStemBranch),
    ...knownPillars(chart),
  ];
  return analyzeFocalRelations("annual", coordinates);
}

function analyzePeriodRelations(periodStemBranch: string, chart: FourPillarsResult): FortuneRelation[] {
  return analyzeFocalRelations("period", [coordinate("period", "大运", periodStemBranch), ...knownPillars(chart)]);
}

function describeRelation(relation: FortuneRelation): string {
  const involved = relation.coordinates.map(item => `${item.label}${item.stemBranch}`).join("、");
  return `${relation.label}（涉及${involved}）`;
}

function stableCoordinatesText(chart: FourPillarsResult): string {
  return knownPillars(chart).map(item => `${item.label}${item.stemBranch}`).join("、");
}

function primaryRelation(relations: FortuneRelation[]): FortuneRelation | undefined {
  const positionWeight: Partial<Record<FortuneCoordinateKey, number>> = { day: 40, month: 35, hour: 30, period: 20, year: 10 };
  return [...relations].sort((left, right) => {
    const score = (relation: FortuneRelation) => (relation.coordinates.length >= 3 ? 100 : 0)
      + Math.max(...relation.coordinates.map(item => positionWeight[item.key] ?? 0));
    return score(right) - score(left);
  })[0];
}

function buildFortuneReading(stemBranch: string, tenGod: TenGodName, chart: FourPillarsResult): FortuneReading {
  const pillars = knownPillars(chart);
  const month = pillars.find(item => item.key === "month") ?? pillars[0];
  const day = pillars.find(item => item.key === "day") ?? pillars[0];
  const stemElement = stemElements[stemBranch[0]];
  const branchElement = branchElements[stemBranch[1]];
  const lowest = Object.entries(chart.elementCounts).sort((left, right) => left[1] - right[1])[0];
  const relations = analyzePeriodRelations(stemBranch, chart);
  const supportive = relations.find(relation => supportiveTypes.includes(relation.type));
  const tension = relations.find(relation => tensionTypes.includes(relation.type));
  const dayBranchRelation = relations.find(relation => relation.coordinates.some(item => item.key === "day") && relation.type !== "stem-combination");
  const originalRelations = chart.professional.relations.map(relation => relation.label).join("、") || "稳定原局内部未检出显式合冲刑害破";
  const allPeriodEvidence = relations.length
    ? relations.map(describeRelation).join("；")
    : `${stemBranch}大运与${stableCoordinatesText(chart)}逐项核对，未见五合、六合、三合、冲、刑、害、破、三刑或自刑`;
  const supportEvidence = supportive
    ? `支持型关系为${describeRelation(supportive)}`
    : `将${stemBranch}大运与${month.label}${month.stemBranch}等稳定柱核对后，未见支持型关系（五合、六合或三合）`;
  const tensionEvidence = tension
    ? `张力型关系为${describeRelation(tension)}`
    : `将${stemBranch}大运与${day.label}${day.stemBranch}等稳定柱核对后，未见张力型关系（冲、刑、害或破）`;
  const dayEvidence = dayBranchRelation
    ? describeRelation(dayBranchRelation)
    : `${stemBranch}大运与日支${day.branch}（${day.label}${day.stemBranch}）核对，未见直接支位关系`;
  const godTheme = periodTheme(tenGod);
  return {
    climate: `阶段气候：${stemBranch}大运的${stemElement}干、${branchElement}支进入${month.label}${month.stemBranch}所示月令环境，${tenGod}只作为${godTheme}的观察入口，不直接判吉凶。`,
    originalInteraction: `原局互动：以${stemElement}运干和${tenGod}核对${stemBranch}大运，检出${allPeriodEvidence}；原局内部另有${originalRelations}，两层证据分开阅读。`,
    opportunity: `机会来源：${stemBranch}${tenGod}大运以${stemElement}承接${godTheme}，${supportEvidence}；参照${month.label}${month.stemBranch}，先用小范围反馈辨认可用开口。`,
    pressure: `压力来源：${stemBranch}${tenGod}大运的${stemElement}动力需与${day.label}${day.stemBranch}共同看，${tensionEvidence}；先区分外部约束与惯性反应。`,
    career: `工作推进：${stemBranch}大运以${stemElement}${tenGod}作用于${month.label}${month.stemBranch}的环境接口和${day.label}${day.stemBranch}的执行接口，可用职责、期限、验收三项检验${godTheme}是否落地。`,
    resources: `资源配置：${stemBranch}${tenGod}大运以${stemElement}进入${day.label}${day.stemBranch}，应把财、印、比劫分别理解为现实资源、支持输入与同伴边界；原局计数较低为${lowest[0]}（${lowest[1]}项），不等同于简单补足。`,
    relationship: `关系沟通：${stemBranch}${tenGod}大运的${stemElement}主题落到日支${day.branch}（${day.label}${day.stemBranch}）时，${dayEvidence}；把事实、请求和界限说清，不给任何人贴命理标签。`,
    wellbeing: `身心边界：${stemBranch}${tenGod}大运的${stemElement}${branchElement}节奏仍受${month.label}${month.stemBranch}月令背景约束，应预留恢复间隔并记录负荷变化；不据此预测健康，也不替代医疗判断。`,
    strategy: `阶段策略：综合${stemBranch}${tenGod}大运的${stemElement}动力、${month.label}${month.stemBranch}环境和${day.label}${day.stemBranch}执行坐标，每季度只做一项${godTheme}实验，再按证据决定是否扩大。`,
  };
}

function relationDynamics(type: ChartRelation["type"]): { scene: string; action: string } {
  if (type === "stem-combination") return { scene: "意图或表达出现对接窗口，但口头一致仍需转成明确分工", action: "把共同意图写成负责人、期限和验收方式，再确认双方理解一致" };
  if (type === "branch-combination") return { scene: "现实安排出现衔接机会，合作感增强的同时也容易省略边界确认", action: "先确认共同目标，再把资源归属、退出条件和下一次核对时间写清" };
  if (type === "branch-trine") return { scene: "三层坐标形成同向联动，多个角色或任务可能在同一主题上互相放大", action: "只选一个共同目标汇总资源，并设置阶段检查点，避免同向投入失去边界" };
  if (type === "branch-clash") return { scene: "时间表、立场或行动节奏发生正面对撞，需要先处理切换成本", action: "暂停即时结论，分列双方事实与不可让渡项，再安排一次带期限的协调" };
  if (type === "branch-punishment") return { scene: "规则、压力或重复反应彼此牵动，容易在同一问题上反复加码", action: "记录触发顺序并设停止条件，必要时引入第三方协助拆开责任与情绪" };
  if (type === "branch-harm") return { scene: "信息与期待出现错位，表面平静之下可能积累未说清的顾虑", action: "用复述确认对方原意，补问遗漏条件，不根据暗示替任何人下结论" };
  return { scene: "原有接口或约定出现松动，需要辨认哪些仍有效、哪些应重新协商", action: "逐条核对旧约定的适用范围，保留可用部分并为变更留下书面记录" };
}

const annualGodGuidance: Record<TenGodName, { scene: string; action: string }> = {
  比肩: { scene: "自主选择与同辈分工成为当年的触发主题，个人主张更需要和共同任务对齐", action: "先写下自己的责任边界，再与同伴逐项确认谁决定、谁执行、谁复核" },
  劫财: { scene: "共享资源、竞争顺序或临时协作成为当年的触发主题，容易因分配不清增加摩擦", action: "先盘点共同资源和优先级，再设置额度、使用记录与退出条件" },
  食神: { scene: "稳定输出、照顾体验和作品完成度成为当年的触发主题，节奏比一次性表现更重要", action: "选择一项可持续的小交付，固定频率发布并用真实反馈调整" },
  伤官: { scene: "直接表达、规则修正和方法创新成为当年的触发主题，观点需要经过现实验证", action: "把质疑改写成具体方案，先做小范围试验，再依据结果决定是否公开推进" },
  偏财: { scene: "外部机会、弹性资源和多方连接成为当年的触发主题，新选项会争夺既有容量", action: "把新机会与现有承诺放入同一张时间预算表，设上限后再试行" },
  正财: { scene: "固定预算、兑现承诺和日常运营成为当年的触发主题，稳定性需要明确成本支持", action: "逐项核对预算、工时和交付责任，超出容量时先协商范围而非追加保证" },
  七杀: { scene: "突发压力、硬期限或高要求任务成为当年的触发主题，反应速度需要服从风险边界", action: "先辨认权限、截止时间和可求助对象，再把高压任务拆成可停止的小步骤" },
  正官: { scene: "职责标准、组织规则和公开评价成为当年的触发主题，过程证据与结果同样重要", action: "明确验收标准和汇报节点，保留关键决定依据并及时暴露阻塞" },
  偏印: { scene: "非常规信息、独立研究和方法切换成为当年的触发主题，新知识需要过滤适用条件", action: "为每个新方法写下假设和验证期限，只保留能够复现的部分" },
  正印: { scene: "系统学习、正式支持和经验沉淀成为当年的触发主题，输入需要转化为可用流程", action: "选择一个可信来源学习，完成一次实践复盘后再增加新的输入" },
};

const periodGodGuidance: Record<TenGodName, { scene: string; action: string }> = {
  比肩: { scene: "阶段资源主要来自自主推进和同水平协作，约束是容易各做各的", action: "用共同里程碑承接，并保留各自可独立完成的责任区" },
  劫财: { scene: "阶段资源来自快速组队与共享渠道，约束是资源边界和优先顺序容易反复", action: "用共享台账、额度和定期清算承接，避免口头分配" },
  食神: { scene: "阶段资源来自稳定产出与用户体验，约束是舒适节奏可能拖慢关键决断", action: "用固定交付周期承接，同时为必须决定的事项设截止时间" },
  伤官: { scene: "阶段资源来自表达突破与流程改造，约束是改变速度可能超过协作系统承受力", action: "用小范围试点和公开复盘承接，验证后再扩大修改范围" },
  偏财: { scene: "阶段资源来自外部连接和弹性调度，约束是机会过多会稀释核心投入", action: "用机会清单、容量上限和退出条件承接，不同时追逐所有选项" },
  正财: { scene: "阶段资源来自稳定预算和可重复运营，约束是既有承诺会压缩试错空间", action: "用基础预算与试验预算分篮承接，避免互相挤占" },
  七杀: { scene: "阶段承接依靠压力转化和快速执行，约束是长期紧绷会降低判断质量", action: "用分级响应和停止条件承接，高压持续时主动调整范围或求助" },
  正官: { scene: "阶段承接依靠规则、角色和组织信用，约束是程序可能压过真实问题", action: "用明确权限、验收和例外流程承接，让问题能够被正式升级" },
  偏印: { scene: "阶段资源来自独立洞察和替代路径，约束是方法过于个人化时难以协作复用", action: "用实验记录和操作说明承接，把个人经验转成他人可核对的步骤" },
  正印: { scene: "阶段资源来自系统知识、导师或支持网络，约束是输入过多可能延迟实践", action: "用学习后立即实践一次的规则承接，并删除长期不使用的信息" },
};

export function buildFortuneGuidance(
  annualGod: TenGodName,
  periodGod: TenGodName,
  relationType: ChartRelation["type"] | null,
): { scene: string; action: string } {
  const annual = annualGodGuidance[annualGod];
  const period = periodGodGuidance[periodGod];
  if (!relationType) {
    return {
      scene: `关系规则未命中时，流年${annualGod}仍由“${annual.scene}”形成当年观察点；大运${periodGod}则以“${period.scene}”提供阶段承接背景。`,
      action: `关系规则未命中不制造事件结论；先按流年${annualGod}执行“${annual.action}”，再按大运${periodGod}采用“${period.action}”。`,
    };
  }
  const relation = relationDynamics(relationType);
  return {
    scene: `${relation.scene}；流年${annualGod}进一步把“${annual.scene}”带到当年，大运${periodGod}则通过“${period.scene}”决定承接方式。`,
    action: `${relation.action}；先按流年${annualGod}完成“${annual.action}”，再用大运${periodGod}的“${period.action}”承接后续。`,
  };
}

function noRelationEvidence(annualStemBranch: string, periodStemBranch: string, chart: FourPillarsResult): string {
  return `${annualStemBranch}流年、${periodStemBranch}大运与${stableCoordinatesText(chart)}统一核对后，未命中五合、六合、三合、冲、刑、害、破、三刑或自刑`;
}

export function buildFortuneYearReading(
  chart: FourPillarsResult,
  periodStemBranch: string,
  annualStemBranch: string,
): Pick<FortuneYear, "basis" | "theme" | "interaction" | "scenario" | "action"> {
  const annualGod = calculateTenGod(chart.pillars.day.stem, annualStemBranch[0]);
  const periodGod = calculateTenGod(chart.pillars.day.stem, periodStemBranch[0]);
  const relations = analyzeFortuneRelations(annualStemBranch, periodStemBranch, chart);
  const primary = primaryRelation(relations);
  const stableEvidence = stableCoordinatesText(chart);
  const evidence = primary
    ? `${describeRelation(primary)}${relations.length > 1 ? `；另检出${relations.filter(item => item !== primary).map(describeRelation).join("、")}` : ""}`
    : noRelationEvidence(annualStemBranch, periodStemBranch, chart);
  if (!primary) {
    const guidance = buildFortuneGuidance(annualGod, periodGod, null);
    return {
      basis: `${annualStemBranch}流年天干相对日主${chart.pillars.day.stem}为${annualGod}，置于${periodStemBranch}${periodGod}大运内作阶段观察。`,
      theme: periodTheme(annualGod),
      interaction: `岁运关系：${annualStemBranch}${annualGod}流年进入${periodStemBranch}${periodGod}大运；${evidence}；稳定原局坐标为${stableEvidence}，无关系命中不等于没有现实变化。`,
      scenario: `典型场景：${annualStemBranch}${annualGod}流年进入${periodStemBranch}${periodGod}大运，${guidance.scene}这里只形成观察问题，不制造确定事件。`,
      action: `年度动作：针对${annualStemBranch}${annualGod}与${periodStemBranch}${periodGod}的无命中结果，${guidance.action}出现真实变化再调整行动。`,
    };
  }
  const guidance = buildFortuneGuidance(annualGod, periodGod, primary.type);
  const involved = primary.coordinates.map(item => `${item.label}${item.stemBranch}`).join("、");
  return {
    basis: `${annualStemBranch}流年天干相对日主${chart.pillars.day.stem}为${annualGod}，置于${periodStemBranch}${periodGod}大运内作阶段观察。`,
    theme: periodTheme(annualGod),
    interaction: `岁运关系：${annualStemBranch}${annualGod}流年进入${periodStemBranch}${periodGod}大运，统一分析器检出${evidence}；稳定原局核对为${stableEvidence}。`,
    scenario: `典型场景：${annualStemBranch}${annualGod}流年与${periodStemBranch}${periodGod}大运共同触发${primary.label}（${involved}）时，${guidance.scene}这只是关系结构的生活化翻译。`,
    action: `年度动作：面对${annualStemBranch}${annualGod}与${periodStemBranch}${periodGod}共同形成的${primary.label}（${involved}），${guidance.action}不把关系结构当成结果保证。`,
  };
}

function buildFortuneYear(
  chart: FourPillarsResult,
  periodStemBranch: string,
  annual: { getAge(): number; getYear(): number; getGanZhi(): string },
): FortuneYear {
  const stemBranch = annual.getGanZhi();
  return {
    age: annual.getAge(),
    year: annual.getYear(),
    stemBranch,
    ...buildFortuneYearReading(chart, periodStemBranch, stemBranch),
  };
}

export function buildFortuneTimeline(chart: FourPillarsResult, input: BirthInput): FortunePeriod[] {
  if (input.gender === "unspecified" || input.timeConfidence === "unknown" || input.time === null) return [];
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time?.split(":").map(Number) ?? [12, 0];
  const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  const yun = eightChar.getYun(input.gender === "male" ? 1 : 0);
  const direction = yun.isForward() ? "顺排" : "逆排";
  return yun.getDaYun(10).filter(item => item.getIndex() > 0).map((period, periodIndex) => {
    const stemBranch = period.getGanZhi();
    const tenGod = calculateTenGod(chart.pillars.day.stem, stemBranch[0]);
    const theme = periodTheme(tenGod);
    const years = period.getLiuNian(10).map(annual => buildFortuneYear(chart, stemBranch, annual));
    return {
      id: `fortune-${periodIndex + 1}`,
      stemBranch,
      startAge: period.getStartAge(),
      endAge: period.getEndAge(),
      startYear: period.getStartYear(),
      endYear: period.getEndYear(),
      tenGod,
      theme,
      reading: buildFortuneReading(stemBranch, tenGod, chart),
      years,
      confidence: chart.confidence,
      method: {
        ruleVersion: "lunar-typescript-1.8.6-yun-sect1",
        basis: `lunar-typescript EightChar.getYun(${input.gender === "male" ? 1 : 0}) 判定${direction}，Yun.getDaYun() 生成大运；起运于${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}日${yun.getStartHour()}时。`,
        disclaimer: input.timeConfidence === "approximate"
          ? "出生时间标记为约略时间，起运年龄与阶段年份按所填时刻计算，结论保持中等置信；不预测确定事件，也不替代现实决定。"
          : "大运用于传统文化中的阶段观察，不预测确定事件，也不替代医疗、法律、财务或关系决定。",
      },
    };
  });
}
