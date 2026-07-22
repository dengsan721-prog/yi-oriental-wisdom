import type { ChartRelation, ElementDiagnostic, ElementName, FourPillarsResult, MonthCommandFact, ProfessionalReport, TenGodName } from "./types";

export type ReportCopyContext = {
  dayMaster: string;
  dayMasterElement: ElementName;
  monthCommand: MonthCommandFact;
  exposedStems: string[];
  roots: string[];
  elementDiagnostics: ElementDiagnostic[];
  relations: ChartRelation[];
  pillarCount: number;
  stablePillarCount: number;
  confidence: FourPillarsResult["confidence"];
};

function elementDistribution(diagnostics: ElementDiagnostic[]): string {
  return diagnostics.map(({ element, count }) => `${element}${count}`).join("、");
}

function confidenceLabel(confidence: FourPillarsResult["confidence"]): string {
  if (confidence === "high") return "较高";
  if (confidence === "medium") return "中等";
  return "有限";
}

function relationSummary(relations: ChartRelation[]): string {
  return relations.length ? relations.map((relation) => relation.label).join("、") : "已知柱间未检出所支持的合冲刑害破或三合关系";
}

export type RelationDynamics = {
  scene: string;
  advantage: string;
  friction: string;
  action: string;
  weather: string;
};

const relationDynamicsByType: Record<ChartRelation["type"], RelationDynamics> = {
  "stem-combination": {
    scene: "意图、表达或职责口径出现对接窗口",
    advantage: "能把分散意图翻译成共同语言，并形成可协商的合作起点",
    friction: "口头一致容易掩盖负责人、期限和验收方式仍未说清",
    action: "把共同意图写成负责人、期限与验收方式，再复述确认理解一致",
    weather: "云层逐渐接拢，气流开始对接",
  },
  "branch-combination": {
    scene: "日常安排、资源使用或行动节奏出现衔接机会",
    advantage: "能把零散配合沉淀为稳定协作，让现实安排彼此接住",
    friction: "默契增强时容易省略资源归属、边界与退出条件",
    action: "先确认共同目标，再写清资源归属、退出条件和复核时间",
    weather: "暖湿气流缓慢汇合，地面安排更易衔接",
  },
  "branch-trine": {
    scene: "多个角色、任务或资源在同一主题上形成同向联动",
    advantage: "能集中分散力量形成协同，把一个主题推到更完整的规模",
    friction: "同向投入容易彼此放大，热度上升后反而忽略容量与边界",
    action: "只选一个共同目标汇总资源，并设置阶段检查点与停止条件",
    weather: "三股气流汇成持续风带，推动力明显增强",
  },
  "branch-clash": {
    scene: "时间表、立场或行动方向发生正面对撞",
    advantage: "能快速暴露彼此真正不能兼容的条件，为重新选择打开空间",
    friction: "即时反应会放大切换成本，让分歧在事实核对前升级",
    action: "暂停即时结论，分列双方事实与不可让渡项，再安排限时协调",
    weather: "冷暖锋面正面相遇，节奏出现明显切换",
  },
  "branch-punishment": {
    scene: "规则、压力或旧反应彼此牵动，同一问题反复加码",
    advantage: "能从重复循环中找到真正的触发顺序，并识别需要停止的位置",
    friction: "责任和情绪纠缠时，容易用更大力度重复原本无效的办法",
    action: "记录触发顺序并设置停止条件，必要时引入第三方拆开责任与情绪",
    weather: "低压在同一区域盘旋，旧路径容易重复出现",
  },
  "branch-harm": {
    scene: "信息与期待出现错位，未说清的顾虑在表面平静下累积",
    advantage: "能看见被省略的条件和隐性需要，为关系补上必要信息",
    friction: "根据暗示替对方下结论，会让误解在没有核对时持续增加",
    action: "先复述所听见的意思，再补问遗漏条件，不根据暗示代替对方决定",
    weather: "雾气压低能见度，近处信息需要再次确认",
  },
  "branch-break": {
    scene: "旧接口、原有约定或惯用安排开始松动",
    advantage: "能辨认哪些旧规则已经失效，并为更新留下现实入口",
    friction: "只拆旧安排却没有过渡方案，容易让责任和资源暂时失去承接",
    action: "逐条核对旧约定的适用范围，保留可用部分并写下过渡安排",
    weather: "阵风吹松旧连接，局部结构需要重新固定",
  },
};

const noRelationDynamics: RelationDynamics = {
  scene: "关系规则尚未命中，现实变化需要从日常反馈重新辨认",
  advantage: "能保留观察空间，不急着把普通变化套进单一关系结论",
  friction: "把未命中误解成毫无变化，可能错过真实但尚未成形的信号",
  action: "记录事实、触发与结果，等出现可重复证据后再调整判断",
  weather: "远处云层变化，但尚未形成明确锋面",
};

export function relationDynamics(type: ChartRelation["type"] | null): RelationDynamics {
  return type === null ? noRelationDynamics : relationDynamicsByType[type];
}

const tenGodOverview: Record<TenGodName, { gift: string; scene: string; friction: string; practice: string }> = {
  比肩: { gift: "独立判断和并肩推进", scene: "多人任务需要各自扛起一段责任", friction: "主见彼此顶住，协作容易变成各做各的", practice: "先划责任区，再约共同验收点" },
  劫财: { gift: "快速组队和调动共享资源", scene: "临时项目需要迅速找人、找渠道、找办法", friction: "资源归属和先后顺序若不清楚，热心会变成拉扯", practice: "把额度、权限和退出条件写明" },
  食神: { gift: "稳定表达、照顾体验和打磨作品", scene: "长期任务需要把复杂经验讲给别人听", friction: "舒适节奏可能回避必须及时作出的决定", practice: "保留稳定输出，同时给关键决定设期限" },
  伤官: { gift: "发现问题、修正规则和提出新方法", scene: "旧流程已经妨碍真实工作，需要有人指出断点", friction: "改变速度可能超过他人的理解和协作容量", practice: "把质疑改写成小范围可验证的方案" },
  偏财: { gift: "辨认外部机会和灵活调配资源", scene: "多个窗口同时出现，需要快速判断哪个值得试", friction: "选项过多容易稀释核心承诺和可用时间", practice: "先设容量上限，再为试验写退出条件" },
  正财: { gift: "管理日常资源和兑现现实承诺", scene: "预算、工时和交付必须长期稳定运转", friction: "维持既有安排时，可能把变化都视作额外负担", practice: "把基础盘与试验盘分开核算" },
  七杀: { gift: "在压力下迅速辨认重点并采取行动", scene: "硬期限或高要求任务突然压到眼前", friction: "持续紧绷时，速度会挤压判断与求助空间", practice: "先确认权限、停止条件和可求助对象" },
  正官: { gift: "建立规则、承担职责和维护公共标准", scene: "多人协作需要清楚角色、程序和验收口径", friction: "程序如果压过真实问题，负责会变成僵住", practice: "保留例外流程，并让阻塞可以被正式升级" },
  偏印: { gift: "独立研究、捕捉非常规线索和切换方法", scene: "常规答案失效，需要重新组合资料与路径", friction: "方法过于个人化时，洞察很难被别人复核", practice: "记录假设、步骤与验证期限" },
  正印: { gift: "系统学习、承接支持和沉淀经验", scene: "复杂任务需要先搭知识框架再稳步推进", friction: "输入不断增加时，实践和反馈容易被延后", practice: "每完成一轮学习就立刻做一次现实验证" },
};

const dayMasterOverview: Record<string, { gift: string; scene: string; friction: string }> = {
  甲: { gift: "从空白处立方向、搭骨架", scene: "任务缺少主线，需要先确定什么必须站住", friction: "方向感过强时，容易晚一步听见环境已经变化" },
  乙: { gift: "沿现实缝隙连接资源、逐步生长", scene: "条件不完整，需要通过协商找到可持续路径", friction: "适应过多时，自己的边界与真正目标可能变模糊" },
  丙: { gift: "把重点照亮并带动他人看见", scene: "信息分散，需要有人公开说明方向和意义", friction: "推进过快时，尚未准备好的人可能只感到压力" },
  丁: { gift: "把注意力聚到细节并维持稳定温度", scene: "工作需要耐心打磨，也需要照顾参与者体验", friction: "长期承担细微照顾时，自己的负荷容易被忽略" },
  戊: { gift: "在变化中建立稳定坐标并承接责任", scene: "局面摇摆，需要重新安排资源、顺序和底线", friction: "为了守住稳定，可能把必要调整拖到成本变高" },
  己: { gift: "整合零散条件并把事情细致培育", scene: "多人需求交织，需要逐项消化后形成可行安排", friction: "承接过多细节时，容易替别人承担本该共同决定的部分" },
  庚: { gift: "切开混乱、定义标准并果断推进", scene: "旧规则失效，需要清理阻塞并建立新边界", friction: "判断过快或标准过硬时，容易遗漏过渡与协商成本" },
  辛: { gift: "辨认细微差别并把成果打磨得清楚", scene: "质量、表达和承诺需要精确到可被复核", friction: "过度追求完整时，交付和求助都可能被推迟" },
  壬: { gift: "汇集多方信息并为变化打开通道", scene: "局面快速流动，需要连接不同角色与可能性", friction: "选择不断增加时，主线可能被新鲜信息带散" },
  癸: { gift: "捕捉隐微信号并进行深入酝酿", scene: "答案尚未成形，需要安静观察条件如何累积", friction: "等待更多把握时，可能错过低风险试验的窗口" },
};

function overviewConfidence(confidence: FourPillarsResult["confidence"]): string {
  if (confidence === "high") return "高置信";
  if (confidence === "medium") return "中等置信";
  return "有限置信";
}

type ResolvedMonthCommandFact = Extract<MonthCommandFact, { ambiguous: false }>;
type AmbiguousMonthCommandFact = Extract<MonthCommandFact, { ambiguous: true }>;

export function monthCommandTenGod(monthCommand: ResolvedMonthCommandFact): TenGodName;
export function monthCommandTenGod(monthCommand: AmbiguousMonthCommandFact): null;
export function monthCommandTenGod(monthCommand: MonthCommandFact): TenGodName | null;
export function monthCommandTenGod(monthCommand: MonthCommandFact): TenGodName | null {
  if (monthCommand.ambiguous === true) return null;
  return monthCommand.tenGod;
}

function overviewMonth(context: ReportCopyContext): { evidence: string; tenGod: TenGodName | null } {
  if (context.monthCommand.ambiguous) {
    return {
      evidence: `${context.monthCommand.representative.branch}月令代表坐标（待核）`,
      tenGod: null,
    };
  }
  return {
    evidence: `${context.monthCommand.branch}月令以${context.monthCommand.hiddenStem}为本气、呈${context.monthCommand.tenGod}`,
    tenGod: monthCommandTenGod(context.monthCommand),
  };
}

export function buildLifeOverview(
  context: ReportCopyContext,
): Pick<ProfessionalReport, "lifeTheme" | "coreTalents" | "centralTensions" | "currentLesson"> {
  const month = overviewMonth(context);
  const theme = month.tenGod ? tenGodOverview[month.tenGod] : null;
  const firstRelation = context.relations[0]?.label ?? "已知柱间未见明确合冲刑害破关系";
  const primaryDynamics = relationDynamics(context.relations[0]?.type ?? null);
  const exposed = context.exposedStems[0] ?? `${context.dayMaster}${context.dayMasterElement}日主天干坐标`;
  const root = context.roots[0] ?? `${context.dayMaster}${context.dayMasterElement}日主在稳定柱未见同类藏干根气`;
  const leastVisible = [...context.elementDiagnostics].sort((left, right) => left.count - right.count)[0];
  const monthGift = theme?.gift ?? "核对事实后再判断";
  const monthScene = theme?.scene ?? "资料尚待核对";
  const monthFriction = theme?.friction ?? "把代表坐标误当成唯一结论，会让行动建立在未核事实上";
  const monthPractice = theme?.practice ?? "先核出生时刻与交节候选，再决定哪些判断可以进入行动";
  const dayStyle = dayMasterOverview[context.dayMaster] ?? {
    gift: `运用${context.dayMasterElement}的计算主题形成判断`,
    scene: "现实条件需要被逐项核对",
    friction: "单一符号不能覆盖完整处境",
  };
  const confidence = overviewConfidence(context.confidence);

  return {
    lifeTheme: `主调线索：${context.dayMaster}日主行于${month.evidence}，以${monthGift}立足；先把优势做成一个可验证行动，再根据反馈扩大。结论按${confidence}阅读，不把结构当作确定结果。`,
    coreTalents: [
      `待验证优势一：${context.dayMaster}日主以${context.dayMasterElement}为参照轴，观察主题是“${dayStyle.gift}”；当${dayStyle.scene}时，可以先做一个两周内可交付的小版本。${exposed}是稳定柱可见的表达坐标，最终仍用结果和反例确认这份能力是否成立。`,
      `待验证优势二：${month.evidence}把重点放在“${monthGift}”；当${monthScene}时，这份能力更容易被看见。它来自月令本气与十神换算的组合观察，不等同于某个职业、财富或关系结果。`,
      `待验证优势三：围绕${context.dayMaster}日主，${firstRelation}对应“${primaryDynamics.scene}”；成熟优势是${primaryDynamics.advantage}。根气证据为${root}，因此仍要记录触发、对方需求与实际结果，才能知道这份能力何时真正有效。`,
    ],
    centralTensions: [
      `核心张力一：${context.dayMaster}日主倾向“${dayStyle.gift}”，其代价可能是${dayStyle.friction}；${month.evidence}又把人推向“${monthGift}”，两层吃力时常表现为${monthFriction}。这是一组需要调度的结构张力，不是性格缺陷，更不意味着某件事必然发生。`,
      `核心张力二：${firstRelation}的失控摩擦是${primaryDynamics.friction}；稳定分布中${leastVisible.element}${leastVisible.count}处只说明可见数量相对少，若把数量直接当喜忌，还会忽略${root}所代表的根气条件。`,
    ],
    currentLesson: `当下课题：以${context.dayMaster}日主和${month.evidence}为双重坐标，先练习“${monthPractice}”；遇到${firstRelation}对应的互动时，${primaryDynamics.action}。当前结论为${confidence}，现实反馈不支持的部分继续留白。`,
  };
}

export function buildReportSummary(context: ReportCopyContext): string {
  const timeBoundary = context.pillarCount === 3
    ? `时辰不详，当前只把${context.stablePillarCount}个不受交节影响的柱作为稳定事实，其余待核`
    : `四柱信息已记录，整体观察置信度${confidenceLabel(context.confidence)}`;
  const month = context.monthCommand.ambiguous
    ? "出生日处交节边界，月令存在交节前后候选，暂不据单一月柱、本气或十神下结论"
    : `${context.monthCommand.branch}月令以${context.monthCommand.hiddenStem}为本气，对日主呈${context.monthCommand.tenGod}主题`;
  return `命盘以${context.dayMaster}${context.dayMasterElement}日主为观察起点；${month}。${timeBoundary}。五行数量、月令、根气、透干与结构分别记录，不能由其中一项直接推出喜用或确定的人生结果。`;
}

export function buildKeyJudgments(context: ReportCopyContext): string[] {
  const leastVisible = [...context.elementDiagnostics].sort((left, right) => left.count - right.count)[0];
  const mostVisible = [...context.elementDiagnostics].sort((left, right) => right.count - left.count)[0];
  const month = context.monthCommand.ambiguous
    ? `月令判断：出生日跨节且时辰未知，代表坐标为${context.monthCommand.representative.branch}月，仅供核对交节前后候选；本气、十神与季节支持均暂不作单一判断。`
    : `月令判断：${context.monthCommand.branch}月令本气为${context.monthCommand.hiddenStem}，相对${context.dayMaster}日主呈${context.monthCommand.tenGod}；这是季节与功能线索，不等同于古法格局定论。`;
  const roots = context.roots.length
    ? `根气判断：稳定柱的日主同类藏干见${context.roots.join("、")}；这里只记录根气线索，不据数量直接判旺衰。`
    : `根气判断：稳定柱藏干未见与${context.dayMaster}${context.dayMasterElement}日主同类的根气线索；待核柱不参与此结论，未见也不自动决定补益方向。`;
  const exposed = context.exposedStems.length
    ? `透干判断：${context.stablePillarCount}个稳定柱可见${context.exposedStems.join("、")}，可用于观察公开呈现的十神功能；待核柱不参与确定判断。`
    : "透干判断：当前没有可核对的天干事实，不补造十神侧重。";
  const relation = `干支关系：${relationSummary(context.relations)}；关系只描述结构互动，不映射为吉凶或确定事件。`;
  const confidence = context.pillarCount === 3
    ? `信息边界：时辰不详，时柱未生成；当前确定结论只覆盖${context.stablePillarCount}个稳定柱，交节候选与相关关系保持待核，整体置信度有限。`
    : `信息边界：出生时间按录入值计算，报告置信度${confidenceLabel(context.confidence)}；出生地址尚未进入经纬度与真太阳时校正流程。`;

  return [
    `日主判断：日干为${context.dayMaster}、五行属${context.dayMasterElement}，日主是全盘十神换算的参照轴，不是完整人格标签。`,
    month,
    exposed,
    roots,
    `五行分布：稳定柱可见干支计数为${elementDistribution(context.elementDiagnostics)}；${mostVisible.element}相对多见、${leastVisible.element}相对少见，只说明当前稳定分布，不直接推出喜忌。`,
    relation,
    confidence,
  ];
}

export function buildReportActions(context: ReportCopyContext): string[] {
  const primaryRelation = context.relations[0];
  const leastVisible = [...context.elementDiagnostics].sort((left, right) => left.count - right.count)[0];
  const monthAction = context.monthCommand.ambiguous
    ? "先核对准确出生时刻，再辨别交节前后的月令候选；未核实时保留候选，不安排基于单一本气或十神的行动。"
    : `围绕${context.monthCommand.branch}月令的${context.monthCommand.tenGod}主题，选择一个两周可完成的现实任务，记录投入、反馈和修正，不把十神名称当成职业或成败结论。`;
  const structureAction = primaryRelation
    ? `针对命盘中的${primaryRelation.label}，在下一次相似情境记录触发条件、双方需求与可调整边界，用现实反馈检验结构提示。`
    : `针对可见计数相对较少的${leastVisible.element}，先观察它在现实任务中的实际缺口，不直接用颜色、物品或行业作机械补足。`;
  return [
    `以${context.dayMaster}${context.dayMasterElement}日主为观察轴，连续七天记录自己在启动、表达与承压时最常用的方式，并同时写下一条反证。`,
    monthAction,
    structureAction,
  ];
}
