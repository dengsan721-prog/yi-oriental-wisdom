import { Solar } from "lunar-typescript";
import { relationDynamics } from "./report-copy";
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
  weatherMetaphor: string;
  interaction: string;
  scenario: string;
  action: string;
};

export const FORTUNE_SOURCE_IDS = [
  "calendar.eight-char.v1",
  "ten-god.hidden-stems.v1",
  "relation.gan-zhi.v1",
  "fortune.translation.v1",
] as const;

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
  stageStory: string;
  lifeAreas: {
    career: string;
    wealth: string;
    relationship: string;
    family: string;
    rhythm: string;
  };
  alignedState: string;
  strainedState: string;
  actions: [string, string, string];
  years: FortuneYear[];
  confidence: FourPillarsResult["confidence"];
  method: { ruleVersion: string; basis: string; disclaimer: string; sourceIds: string[] };
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

type StageFrame = {
  image: string;
  scene: string;
  career: string;
  wealth: string;
  relationship: string;
  family: string;
  rhythm: string;
  aligned: string;
  strained: string;
  actions: [string, string, string];
};

const stageFrames: Record<"peer" | "expression" | "resource" | "authority" | "learning", StageFrame> = {
  peer: {
    image: "一支并肩划桨的船队，速度来自同伴，方向却要靠清楚分工守住",
    scene: "项目启动会、共同任务或家庭分工讨论",
    career: "工作推进适合拆出独立责任区，再用共同里程碑汇合",
    wealth: "资源重点在共享额度、共同成本与个人储备之间保持可追踪边界",
    relationship: "关系中的自主与陪伴要同时被说清，避免把默契当成授权",
    family: "家庭分工需要从谁更应该做，改成谁负责、何时复核、怎样轮换",
    rhythm: "恢复方式应保留不被协作占用的独处时段，同时安排固定对齐",
    aligned: "既能提出自己的判断，也能让同伴清楚接住责任，竞争转成彼此校准",
    strained: "容易在比较、抢先或替人决定中消耗，最后每个人都很忙却没有共同结果",
    actions: ["画出个人与共同责任边界", "建立共享资源台账与复核日", "为分歧约定暂停和重谈条件"],
  },
  expression: {
    image: "一间持续开灯的工作室，灵感要经过打样、反馈和交付才成为作品",
    scene: "方案评审、公开分享或作品交付现场",
    career: "工作重点是把观点做成可试用的成果，用反馈决定是否扩大",
    wealth: "资源更适合投向稳定产出和用户体验，并为试错设置清楚上限",
    relationship: "表达锋芒要与倾听配对，让对方听见请求而不只听见判断",
    family: "家庭中的经验可以被分享，但不要把自己的有效方法变成唯一标准",
    rhythm: "灵感高峰之后应主动安排收尾和恢复，避免持续输出透支判断",
    aligned: "能把复杂经验讲清、做出原型并接受反馈，表达最终变成可复用的价值",
    strained: "可能只顾表达速度或舒适节奏，要么压过协作者，要么拖延必须完成的收口",
    actions: ["选一项主题完成最小可交付版本", "收集三条具体反馈再修改", "为表达与恢复分别预留时间"],
  },
  resource: {
    image: "一座需要持续调度的集市，机会很多，真正重要的是容量、承诺与周转",
    scene: "预算会、合作报价或家庭支出讨论",
    career: "工作选择要同时核对机会质量、现有承诺和真实交付容量",
    wealth: "财富观察聚焦预算、现金流和资源归属，不把命理提示当成收益承诺",
    relationship: "关系中需要说清时间、金钱与照顾怎样分配，善意也要有容量边界",
    family: "家庭安排适合把长期固定成本与临时需求分开协商，避免一人默默兜底",
    rhythm: "每增加一项机会，都应同步减少或暂停另一项占用，给恢复留下预算",
    aligned: "能看见现实机会，也能守住核心承诺，让资源在可承受范围内持续流动",
    strained: "容易因为舍不得选项而分散投入，或因过度求稳而拒绝所有必要试验",
    actions: ["建立机会与承诺的同一张清单", "为试验设置金额和时间上限", "每月删除一个低回报占用"],
  },
  authority: {
    image: "一座正在换班的瞭望塔，责任带来视野，也要求权限、标准和求助通道清楚",
    scene: "职责交接、截止日前的协调会或规则复核",
    career: "工作推进应先确认权限、验收标准和升级路径，再承担高压结果",
    wealth: "资源配置以风险上限和责任归属为先，不用个人硬扛替代正式机制",
    relationship: "关系里要区分照顾、控制与共同决定，规则应允许双方提出例外",
    family: "家庭责任需要可轮换、可求助，避免把能承担误写成必须永远承担",
    rhythm: "高压之后安排明确降载窗口，用睡眠、休息和任务量记录观察负荷",
    aligned: "能在压力中保持标准、及时暴露阻塞，并让责任通过制度而非个人意志传递",
    strained: "容易长期紧绷或迷失在程序里，表面负责，实际判断空间与关系弹性都在缩小",
    actions: ["写清权限、期限与停止条件", "建立一次正式阻塞升级机制", "高压任务后安排可执行的降载日"],
  },
  learning: {
    image: "一座边读边开放的藏书室，知识要走出书架，才会变成别人也能使用的路径",
    scene: "新项目调研、课程复盘或向导师求助",
    career: "工作适合先验证关键假设，再把个人方法整理成团队可复核的步骤",
    wealth: "资源优先支持可信学习与基础能力，但每项输入都要对应一次实践检验",
    relationship: "提供建议前先确认对方是否需要，让支持不取代对方自己的决定",
    family: "家庭经验可以被整理和传承，同时为不同成员保留不同做法与修正权",
    rhythm: "输入与独处之后要安排身体活动和现实反馈，避免思考一直悬空",
    aligned: "能从可靠来源建立框架，再把知识转成清楚步骤、复盘记录和可分享支持",
    strained: "可能不断增加输入或频繁换方法，用准备感替代真正进入现场的反馈",
    actions: ["只保留一个当前学习主题", "每轮输入后完成一次现实实践", "把有效步骤写成他人可复核的说明"],
  },
};

function stageFrame(tenGod: TenGodName): StageFrame {
  if (["比肩", "劫财"].includes(tenGod)) return stageFrames.peer;
  if (["食神", "伤官"].includes(tenGod)) return stageFrames.expression;
  if (["偏财", "正财"].includes(tenGod)) return stageFrames.resource;
  if (["七杀", "正官"].includes(tenGod)) return stageFrames.authority;
  return stageFrames.learning;
}

function relationKind(type: ChartRelation["type"]): string {
  if (type === "branch-trine") return "三合";
  if (type === "branch-clash") return "相冲";
  if (type === "branch-punishment") return "相刑";
  if (type === "branch-harm") return "相害";
  if (type === "branch-break") return "相破";
  return "相合";
}

function confidenceText(confidence: FourPillarsResult["confidence"]): string {
  if (confidence === "high") return "高置信";
  if (confidence === "medium") return "中等置信";
  return "有限置信";
}

function buildFortuneStageCopy(
  stemBranch: string,
  tenGod: TenGodName,
  chart: FourPillarsResult,
  range: { startAge: number; endAge: number; startYear: number; endYear: number },
): Pick<FortunePeriod, "stageStory" | "lifeAreas" | "alignedState" | "strainedState" | "actions"> {
  const pillars = knownPillars(chart);
  const month = pillars.find(item => item.key === "month") ?? pillars[0];
  const day = pillars.find(item => item.key === "day") ?? pillars[0];
  const family = pillars.find(item => item.key === "year") ?? month;
  const relations = analyzePeriodRelations(stemBranch, chart);
  const focal = primaryRelation(relations);
  const relationEvidence = focal
    ? `${relationKind(focal.type)}证据为${describeRelation(focal)}`
    : `${stemBranch}大运与${stableCoordinatesText(chart)}逐项核对后未见相合、三合、相冲、相刑、相害或相破`;
  const frame = stageFrame(tenGod);
  const godGuidance = periodGodGuidance[tenGod];
  const dynamics = relationDynamics(focal?.type ?? null);
  const confidence = confidenceText(chart.confidence);

  return {
    stageStory: `阶段故事：${range.startYear}至${range.endYear}（${range.startAge}至${range.endAge}岁）的${stemBranch}${tenGod}大运，像${frame.image}。例如在一次${frame.scene}里，你可能先依靠“${godGuidance.scene}”处理眼前任务；关系动力呈现为${dynamics.scene}，协作方可能因此感到${dynamics.friction}。原局的${month.label}${month.stemBranch}与${day.label}${day.stemBranch}提供环境和执行坐标，${relationEvidence}，事情因此更需要分阶段核对而不是抢下结论。成熟走法是${dynamics.action}，再用${godGuidance.action}承接；本段按${confidence}观察，不把它写成必然事件。`,
    lifeAreas: {
      career: `事业：${stemBranch}${tenGod}阶段，${frame.career}；${month.label}${month.stemBranch}与${day.label}${day.stemBranch}是计算坐标，先用一次真实交付检验节奏，不由十神直接指定职业。`,
      wealth: `财富：${stemBranch}${tenGod}阶段，${frame.wealth}；以${day.label}${day.stemBranch}核对预算、时间和承诺，不把命理结构写成收益保证。`,
      relationship: `关系：${stemBranch}${tenGod}阶段，${frame.relationship}；${relationEvidence}，并以日支${day.branch}（${day.label}${day.stemBranch}）核对互动，不把结构标签贴到具体的人身上。`,
      family: `家庭：${stemBranch}${tenGod}阶段，${frame.family}；家庭坐标先参照${family.label}${family.stemBranch}，再结合${relationEvidence}，只讨论分工与沟通倾向，不归罪任何成员。`,
      rhythm: `身心节奏：${stemBranch}${tenGod}阶段，${frame.rhythm}；${month.label}${month.stemBranch}仍是季节背景，只记录负荷与恢复变化，不据此作健康预测。`,
    },
    alignedState: `顺势状态：${stemBranch}${tenGod}大运中，${frame.aligned}；${dynamics.advantage}。当${relationEvidence}能够被识别并写进边界、期限或分工时，再用现实反馈确认。`,
    strainedState: `吃力状态：${stemBranch}${tenGod}大运中，${frame.strained}；${dynamics.friction}。若忽略${relationEvidence}和${day.label}${day.stemBranch}的现实容量，压力可能反复，但不等于必然事件。`,
    actions: [
      `行动一：针对${stemBranch}${tenGod}的阶段主题，先${frame.actions[0]}；关系策略是${dynamics.action}。执行时把${relationEvidence}写进观察记录，两周后复盘。`,
      `行动二：在${stemBranch}${tenGod}大运内${frame.actions[1]}；同时采用“${godGuidance.action}”，让${month.label}${month.stemBranch}的环境条件可以被核对。`,
      `行动三：围绕${stemBranch}${tenGod}完成“${frame.actions[2]}”；以${day.label}${day.stemBranch}为现实坐标，只保留能被反馈验证的部分，${confidence}之外的推断继续留白。`,
    ],
  };
}

export function buildFortuneGuidance(
  annualGod: TenGodName,
  periodGod: TenGodName,
  relationType: ChartRelation["type"] | null,
): { scene: string; action: string } {
  const annual = annualGodGuidance[annualGod];
  const period = periodGodGuidance[periodGod];
  const relation = relationDynamics(relationType);
  if (!relationType) {
    return {
      scene: `关系规则未命中时，${relation.scene}；流年${annualGod}仍由“${annual.scene}”形成观察点，大运${periodGod}以“${period.scene}”承接。`,
      action: `关系规则未命中不制造事件结论；先${relation.action}，再按流年${annualGod}执行“${annual.action}”，并用大运${periodGod}的“${period.action}”承接。`,
    };
  }
  return {
    scene: `${relation.scene}；流年${annualGod}进一步把“${annual.scene}”带到当年，大运${periodGod}则通过“${period.scene}”决定承接方式。`,
    action: `${relation.action}；先按流年${annualGod}完成“${annual.action}”，再用大运${periodGod}的“${period.action}”承接后续。`,
  };
}

function noRelationEvidence(annualStemBranch: string, periodStemBranch: string, chart: FourPillarsResult): string {
  return `${annualStemBranch}流年、${periodStemBranch}大运与${stableCoordinatesText(chart)}统一核对后，未命中五合、六合、三合、冲、刑、害、破、三刑或自刑`;
}

function annualWeatherTexture(tenGod: TenGodName): string {
  if (["比肩", "劫财"].includes(tenGod)) return "持续侧风，提醒自主方向要与同伴分工一起校准";
  if (["食神", "伤官"].includes(tenGod)) return "云层打开后的明亮长日，表达和作品需要稳定落地";
  if (["偏财", "正财"].includes(tenGod)) return "多股气流带来湿度变化，机会与容量要放在同一张表里衡量";
  if (["七杀", "正官"].includes(tenGod)) return "气压快速变化的锋面，职责、期限与风险边界需要先确认";
  return "晨雾逐渐散开的天气，知识和支持要经过实践才看得清路径";
}

function relationWeather(relation: FortuneRelation | undefined): string {
  const dynamics = relationDynamics(relation?.type ?? null);
  if (!relation) return `关系规则未命中，像${dynamics.weather}；${dynamics.action}`;
  return `${relationKind(relation.type)}${relation.label}像${dynamics.weather}；${dynamics.action}`;
}

function buildWeatherMetaphor(
  annualStemBranch: string,
  annualGod: TenGodName,
  periodStemBranch: string,
  periodGod: TenGodName,
  relation: FortuneRelation | undefined,
): string {
  return `年度天气：${annualStemBranch}${annualGod}像${annualWeatherTexture(annualGod)}；进入${periodStemBranch}${periodGod}的长期气候后，${relationWeather(relation)}。这是岁运关系的节奏比喻，不预告确定事件。`;
}

export function buildFortuneYearReading(
  chart: FourPillarsResult,
  periodStemBranch: string,
  annualStemBranch: string,
): Pick<FortuneYear, "basis" | "theme" | "weatherMetaphor" | "interaction" | "scenario" | "action"> {
  const annualGod = calculateTenGod(chart.pillars.day.stem, annualStemBranch[0]);
  const periodGod = calculateTenGod(chart.pillars.day.stem, periodStemBranch[0]);
  const relations = analyzeFortuneRelations(annualStemBranch, periodStemBranch, chart);
  const primary = primaryRelation(relations);
  const stableEvidence = stableCoordinatesText(chart);
  const evidence = primary
    ? `${describeRelation(primary)}${relations.length > 1 ? `；另检出${relations.filter(item => item !== primary).map(describeRelation).join("、")}` : ""}`
    : noRelationEvidence(annualStemBranch, periodStemBranch, chart);
  const weatherMetaphor = buildWeatherMetaphor(annualStemBranch, annualGod, periodStemBranch, periodGod, primary);
  if (!primary) {
    const guidance = buildFortuneGuidance(annualGod, periodGod, null);
    return {
      basis: `${annualStemBranch}流年天干相对日主${chart.pillars.day.stem}为${annualGod}，置于${periodStemBranch}${periodGod}大运内作阶段观察。`,
      theme: periodTheme(annualGod),
      weatherMetaphor,
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
    weatherMetaphor,
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
  eightChar.setSect(2);
  const gender = input.gender === "male" ? 1 : 0;
  const yun = eightChar.getYun(gender, 1);
  const direction = yun.isForward() ? "顺排" : "逆排";
  return yun.getDaYun(10).filter(item => item.getIndex() > 0).map((period, periodIndex) => {
    const stemBranch = period.getGanZhi();
    const tenGod = calculateTenGod(chart.pillars.day.stem, stemBranch[0]);
    const theme = periodTheme(tenGod);
    const reading = buildFortuneReading(stemBranch, tenGod, chart);
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
      reading,
      ...buildFortuneStageCopy(stemBranch, tenGod, chart, {
        startAge: period.getStartAge(),
        endAge: period.getEndAge(),
        startYear: period.getStartYear(),
        endYear: period.getEndYear(),
      }),
      years,
      confidence: chart.confidence,
      method: {
        ruleVersion: "lunar-typescript-1.8.6-yun-start-age-method-1",
        basis: `lunar-typescript EightChar.getYun(${gender}, 1) 判定${direction}并生成大运；第二个参数采用产品固定的起运年龄第1种计算口径，与日柱按00:00换日的口径彼此独立。起运于${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}日${yun.getStartHour()}时。`,
        sourceIds: [...FORTUNE_SOURCE_IDS],
        disclaimer: input.timeConfidence === "approximate"
          ? "出生时间标记为约略时间，起运年龄与阶段年份按所填时刻计算，结论保持中等置信；不预测确定事件，也不替代现实决定。"
          : "大运用于传统文化中的阶段观察，不预测确定事件，也不替代医疗、法律、财务或关系决定。",
      },
    };
  });
}
