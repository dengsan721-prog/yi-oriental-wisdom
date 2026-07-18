import { getInterpretationEnrichment, type InterpretationId } from "./interpretation-enrichment";
import { scenarioLibrary } from "./scenario-library";
import { YI_RULE_SOURCES } from "./sources";
import type { FourPillarsResult, InterpretationItem, PillarKey, ProfessionalOverview } from "./types";

type Domain = InterpretationItem["domain"];
type Draft = Omit<InterpretationItem,
  "domain" | "confidence" | "sourceTradition" | "sourceReferences" | "sourceRuleIds" |
  "affectedByUnknownHour" | "scenario" | "action" | "traditionalJudgment" |
  "advantageVersion" | "shadowVersion" | "actionNow" | "actionLongTerm" | "priority"
> & { id: InterpretationId; ruleIds: string[] };
type DomainSelector = (chart: FourPillarsResult) => Draft[];

const pillarNames: Record<PillarKey, string> = { year: "年", month: "月", day: "日", hour: "时" };
const structureNames: Record<FourPillarsResult["professional"]["structureBalance"], string> = {
  "support-heavy": "支持条件较集中",
  mixed: "支持与输出较交错",
  "expression-heavy": "向外输出较集中",
};

function godAt(chart: FourPillarsResult, pillar: PillarKey, position?: "stem" | "branch") {
  return chart.professional.tenGods.find(item => item.pillar === pillar && (!position || item.position === position))?.tenGod ?? "信息暂缺";
}

function relationEvidence(chart: FourPillarsResult, preferred: PillarKey[]) {
  const positions = preferred.map(pillar => `${pillarNames[pillar]}柱`).join("、");
  const selected = chart.professional.relations.filter(relation =>
    relation.pillars.length === preferred.length && relation.pillars.every(pillar => preferred.includes(pillar)));
  const distinct = [...new Map(selected.map(relation => [relation.label, relation])).values()];
  return distinct.length
    ? `${positions}实见${distinct.map(relation => `${relation.label}（${relation.symbols.join("、")}）`).join("、")}`
    : `${positions}未见五合、六合、三合、冲、刑、害、破`;
}

function baseRules(chart: FourPillarsResult) {
  const p = chart.professional;
  return {
    day: `日主为${p.dayMaster.stem}${p.dayMaster.element}，阴阳属性为${p.dayMaster.polarity === "yang" ? "阳" : "阴"}；日支为${chart.pillars.day.branch}，本气十神为${godAt(chart, "day", "branch")}`,
    structure: `日主${p.dayMaster.stem}${p.dayMaster.element}生于${chart.pillars.month.branch}月令，支持度结构观察为${structureNames[p.structureBalance]}（产品计分 ${p.supportScore}%）`,
    month: `月令为${chart.pillars.month.branch}，月干${chart.pillars.month.stem}所示十神为${godAt(chart, "month", "stem")}，月支本气十神为${godAt(chart, "month", "branch")}`,
    climate: `月令${chart.pillars.month.branch}所示${p.climate}`,
  };
}

const selfSelector: DomainSelector = chart => {
  const b = baseRules(chart);
  return [
    {
      id: "self-day-master", professionalTitle: "日主作为自我观察起点", innovationTitle: "内在坐标",
      basis: b.day,
      plainLanguage: "这说明你可以先辨认自己惯用的启动方式，再检查它是否适合眼前任务。重点不是给性格定型，而是看何时需要主见、何时需要外部校准。",
      mirror: "像一枚罗盘：日主提供初始方位，日支补充熟悉情境中的反应，但真正路线仍由环境反馈与选择共同形成。",
      caution: "日主只是命局中的一条观察轴，不能代表完整人格，也不能据此断定能力上限、关系结果或人生走向。",
      pillarDependencies: ["day"], ruleIds: ["calendar.eight-char.v1", "ten-god.hidden-stems.v1", "domain.mapping.v2"],
    },
    {
      id: "self-support", professionalTitle: "日主得令得地与支持结构观察", innovationTitle: "能量底座",
      basis: b.structure,
      plainLanguage: "支持度提示的是已知干支中补给与输出的相对配比。分数偏低时先看资源是否跟得上，偏高时则观察能否把积累转成具体交付。",
      mirror: "像查看土壤的保水与排水：水多不等于作物一定好，水少也不等于必须灌溉，还要结合季节、根系和实际状态。",
      caution: "产品计分是结构提示，不等同于古法旺衰、格局或喜忌；不能据此宣称缺什么就补什么，也不用于判断健康。",
      pillarDependencies: ["year", "month", "day"], ruleIds: ["structure.support-score.v2", "domain.mapping.v2"],
    },
    {
      id: "self-interface", professionalTitle: "日月两柱的内外协调", innovationTitle: "内外接口",
      basis: `${relationEvidence(chart, ["day", "month"])}；同时以${b.month}作为现实环境坐标`,
      plainLanguage: "日柱代表自我立场的观察点，月柱更接近规则与工作环境。两者有关系时看互动方式，无明显关系时则更需要主动说清需求与条件。",
      mirror: "像两组齿轮：有咬合不等于顺利，无咬合也不等于冲突；齿距、转速和润滑方式才决定合作是否可持续。",
      caution: "合、冲、刑、害、破只描述结构关系，不自动等于吉凶，更不能把一次沟通困难解释成命定不合。",
      pillarDependencies: ["day", "month"], ruleIds: ["relation.gan-zhi.v1", "ten-god.hidden-stems.v1", "domain.mapping.v2"],
    },
  ];
};

const talentSelector: DomainSelector = chart => [
  {
    id: "talent-public", professionalTitle: "月干十神的公开表达线索", innovationTitle: "能力出口",
    basis: `月干为${chart.pillars.month.stem}，相对${chart.professional.dayMaster.stem}日主所示十神为${godAt(chart, "month", "stem")}；月令为${chart.pillars.month.branch}`,
    plainLanguage: "月干像你在公开场合最先拿出来用的那样本领，可用来观察你在汇报、协作与交付中常先调用哪类能力。它需要通过真实反馈验证。",
    mirror: "像工具箱最上层的常用工具：拿取方便不代表只会这一种，也不代表所有任务都适合用同一把工具完成。",
    caution: "十神是相对日主建立的关系名称，不直接等于天赋、学历或职业资格；单看月干不能指定行业与岗位。",
    pillarDependencies: ["month", "day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "talent-hidden", professionalTitle: "日支藏干的熟练模式", innovationTitle: "隐性手感",
    basis: `日支为${chart.pillars.day.branch}，首个藏干相对日主所示十神为${godAt(chart, "day", "branch")}；日主为${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}`,
    plainLanguage: "藏干可作为不易被立即看见的功能线索。在独处、熟悉或缺少指令时，你可能更自然地回到这套处理方式。",
    mirror: "像惯用手形成的肌肉记忆：它能提高起步速度，也可能遮住其他可训练路径，因此要用不同任务比较效果与耗能。",
    caution: "藏干必须放回月令、透干、根气和完整十神分布中理解；一次顺手经验不能被包装成固定天赋标签。",
    pillarDependencies: ["day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "talent-output", professionalTitle: "时柱所示的后续表达线索", innovationTitle: "未来试验场",
    basis: chart.pillars.hour
      ? `时干为${chart.pillars.hour.stem}，相对${chart.professional.dayMaster.stem}日主所示十神为${godAt(chart, "hour", "stem")}；时支为${chart.pillars.hour.branch}`
      : `时辰未知，时柱与其十神不可得，只保留${chart.professional.dayMaster.stem}日主及已知三柱作为有限观察`,
    plainLanguage: chart.pillars.hour
      ? "时柱可作为较长期表达与后续项目的观察入口，但要用阶段性交付、他人反馈和现实约束反复校准。"
      : "出生时间未提供，不能补造未来能力线索；长期项目先从已知经验设计小试验，再按反馈更新判断。",
    mirror: "像远处航标而不是自动驾驶：它能提示试验方向，却不能替代近处水深、天气变化和每次航行后的修正。",
    caution: "本条高度依赖可靠出生时辰；即使时柱已知，也不据此预言晚年、成就或子女，只用于规划可验证的行动。",
    pillarDependencies: ["hour", "day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
];

const careerSelector: DomainSelector = chart => [
  {
    id: "career-role", professionalTitle: "月柱作为工作环境线索", innovationTitle: "职场接口",
    basis: `月干${chart.pillars.month.stem}为${godAt(chart, "month", "stem")}，月令${chart.pillars.month.branch}的本气十神为${godAt(chart, "month", "branch")}`,
    plainLanguage: "月柱可帮助拆解你与制度、任务和协作环境的接口：月干偏向公开呈现，月支更像持续运行的底层条件。",
    mirror: "像设备接入新的工作台：能力本身没有消失，但权限、协议和验收标准不同，输出方式就需要重新配置。",
    caution: "月柱不能直接断定事业高低、单位性质或职位名称；职业选择仍应结合能力证据、机会成本与现实责任。",
    pillarDependencies: ["month", "day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "career-pressure", professionalTitle: "年月关系的组织适配线索", innovationTitle: "组织齿轮",
    basis: `${relationEvidence(chart, ["year", "month"])}；月干十神为${godAt(chart, "month", "stem")}`,
    plainLanguage: "年柱可作早期经验入口，月柱可作当前组织接口。两者的关系提示旧方法进入新规则时，哪些部分顺接、哪些需要更新。",
    mirror: "像旧齿轮装进新机器：保留精度高的齿面，同时测量新的转速与负载，才能判断是坚持优势还是调整接口。",
    caution: "干支关系不评价组织好坏，也不保证升迁或变动；是否适配要以职责、反馈、绩效口径和可持续性验证。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["relation.gan-zhi.v1", "ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "career-environment", professionalTitle: "日主支持与输出的职业节奏", innovationTitle: "责任配速",
    basis: baseRules(chart).structure,
    plainLanguage: "这项结构观察把职业节奏拆成补给、判断和交付三段。任务密集时，先区分核心判断与可交接的重复工作。",
    mirror: "像长跑配速：起步快不是唯一优势，补给点、同伴分工与何时保留冲刺能力，同样决定能否稳定抵达。",
    caution: "支持度只用于安排工作资源，不构成事业成败或能力强弱结论；持续过载应回到真实工时与组织条件处理。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["structure.support-score.v2", "domain.mapping.v2"],
  },
];

const wealthSelector: DomainSelector = chart => [
  {
    id: "wealth-structure", professionalTitle: "财星的资源互动观察", innovationTitle: "来往有数",
    basis: `以${chart.professional.dayMaster.stem}日主为坐标，已知干支十神中财星出现${chart.professional.tenGods.filter(item => item.tenGod.includes("财")).length}次，月令为${chart.pillars.month.branch}`,
    plainLanguage: "财星在这里用于观察资源交换，不等于收入数字。更有用的问题是资金、时间、承诺和回报之间是否有清楚边界。",
    mirror: "像一条水系：流量只是表面，源头是否稳定、渠道是否渗漏、蓄水是否足够，都会影响真实可用资源。",
    caution: "财星数量不代表财富多少，本解读不构成投资建议，也不替代预算、税务、法律或持牌财务专业判断。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "wealth-risk", professionalTitle: "日月关系的价值交换线索", innovationTitle: "价值回路",
    basis: `${relationEvidence(chart, ["day", "month"])}；月令本气十神为${godAt(chart, "month", "branch")}`,
    plainLanguage: "日柱与月柱可作为个人投入和环境回报的两端。无论关系明显与否，都要把成果、责任和停止条件写成可验证约定。",
    mirror: "像检查电路：投入再大，若连接点、计量表或回路不清，努力也难以转成可确认的成果与合理回报。",
    caution: "合冲刑害破不表示必然得财或破财；合作金额与合同责任应依据现实证据，必要时咨询相应专业人士。",
    pillarDependencies: ["day", "month"], ruleIds: ["relation.gan-zhi.v1", "ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "wealth-boundary", professionalTitle: "五行分布的资源配置提示", innovationTitle: "配置篮子",
    basis: `已知柱主五行计数为${Object.entries(chart.elementCounts).map(([element, count]) => `${element}${count}`).join("、")}；日主为${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}`,
    plainLanguage: "五行计数只提示行动方式是否集中，不说明哪类资产更好。资源安排应同时保留生活安全、稳定投入和有限试验空间。",
    mirror: "像检查篮子里的重量分布：集中可以提高短期力度，但若没有备用空间，环境变化时就缺少调整余地。",
    caution: "五行数量为零不等于喜用，更不是买卖信号；任何重大投资仍应评估风险并咨询持牌专业人士。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["structure.support-score.v2", "domain.mapping.v2"],
  },
];

const relationshipSelector: DomainSelector = chart => [
  {
    id: "relationship-day-branch", professionalTitle: "日支十神的亲密回应线索", innovationTitle: "关系座席",
    basis: `日支为${chart.pillars.day.branch}，首个藏干相对${chart.professional.dayMaster.stem}日主所示十神为${godAt(chart, "day", "branch")}`,
    plainLanguage: "日支可以帮助观察熟悉关系中的第一反应。真正需要核对的是，你当下提供的信息、情绪承接或行动是否匹配对方需要。",
    mirror: "像坐在同一张桌子的不同座席：视角会影响先看见什么，但换位、提问和复述能让双方重新获得完整画面。",
    caution: "日支不能单独断定婚恋结果，也不用于给任何人贴性格标签；关系质量要由持续沟通与可观察行为判断。",
    pillarDependencies: ["day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "relationship-trigger", professionalTitle: "日月合冲的关系边界", innovationTitle: "边界潮汐",
    basis: `${relationEvidence(chart, ["day", "month"])}；日主为${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}`,
    plainLanguage: "日月互动可用来提问个人需求与现实安排如何协商。关系越有拉扯，越要把靠近速度、暂停信号和责任边界说清。",
    mirror: "像潮汐与堤岸：靠近和退让都有节奏，稳定并不来自永远一致，而来自双方知道何时停、如何再连接。",
    caution: "合冲不是缘分好坏评分，不预测分合，也不把冲突归罪于任何一方；出现伤害或控制应寻求现实支持。",
    pillarDependencies: ["day", "month"], ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"],
  },
  {
    id: "relationship-repair", professionalTitle: "年日互动的既有关系脚本", innovationTitle: "旧脚本新写法",
    basis: `${relationEvidence(chart, ["year", "day"])}；年干十神为${godAt(chart, "year", "stem")}，日支首藏为${godAt(chart, "day", "branch")}`,
    plainLanguage: "年柱与日柱可帮助看见早期经验如何进入当下回应。看见脚本的价值，是把自动反应改成可以商量的新规则。",
    mirror: "像拿着旧地图走进新城市：熟悉符号能提供参照，但路况、同行者和目的地都要求你随时重画路线。",
    caution: "早期经验不是宿命，不据此诊断家庭或伴侣，也不使用人格标签；修复效果应以双方可观察的改变衡量。",
    pillarDependencies: ["year", "day"], ruleIds: ["relation.gan-zhi.v1", "ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
];

const familySelector: DomainSelector = chart => [
  {
    id: "family-year", professionalTitle: "年月柱的家庭经验线索", innovationTitle: "家族底色",
    basis: `年干${chart.pillars.year.stem}所示十神为${godAt(chart, "year", "stem")}，月令${chart.pillars.month.branch}本气为${godAt(chart, "month", "branch")}`,
    plainLanguage: "年月柱可作为早期规则与后来社会角色的观察入口。重点是分辨哪些资源值得继承，哪些习惯需要停止复制。",
    mirror: "像画面的底色：它会影响明暗和第一印象，却不决定整幅画；新的笔触、留白和共同规则仍能改变作品。",
    caution: "年月柱不用于评价原生家庭优劣，也不预测亲缘结果；家庭历史应尊重事实、差异与每个人的选择权。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "family-resource", professionalTitle: "年月关系的照顾责任结构", innovationTitle: "照顾接力",
    basis: `${relationEvidence(chart, ["year", "month"])}；月干十神为${godAt(chart, "month", "stem")}`,
    plainLanguage: "家庭照顾常把旧责任与现实任务叠在一起。命盘只提供提问坐标，真正的分工仍要核对时间、能力和对方意愿。",
    mirror: "像一场接力：可靠不是一个人跑完全程，而是知道谁能接棒、何时补位，以及照顾者如何恢复后再出发。",
    caution: "关系结构不等于谁天生应该牺牲，也不给家人贴标签；照顾安排应尊重同意、资源边界与现实支持。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["relation.gan-zhi.v1", "ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
  {
    id: "family-boundary", professionalTitle: "时柱相关的传承观察", innovationTitle: "留白传承",
    basis: chart.pillars.hour
      ? `时支为${chart.pillars.hour.branch}，首个藏干相对${chart.professional.dayMaster.stem}日主所示十神为${godAt(chart, "hour", "branch")}`
      : `时辰未知，时柱、时支藏干与相关十神不可得，只使用年、月、日三柱作有限观察`,
    plainLanguage: chart.pillars.hour
      ? "时柱只作为传承与长期家庭规划的提问入口，把解读转成教育、储备、陪伴和尊重差异的现实安排。"
      : "出生时间不可得，不判断子女、晚年或晚景；家庭未来只从现有责任、可用资源和共同意愿制定计划。",
    mirror: "像递出一盏灯：你能提供光和经验，却不能替下一代选择道路；计划的意义是增加支持，不是复制人生。",
    caution: "本条高度依赖可靠时辰；即使时柱已知，也不预测子女数量、亲子结果或晚年事件，更不作价值标签。",
    pillarDependencies: ["hour", "day"], ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"],
  },
];

const rhythmSelector: DomainSelector = chart => [
  {
    id: "rhythm-climate", professionalTitle: "月令寒暖燥湿的恢复提示", innovationTitle: "四时节拍",
    basis: baseRules(chart).climate,
    plainLanguage: "月令可用来提醒季节环境与恢复安排的关系，但不能解释具体不适。最可靠的校验来自连续的睡眠、专注与情绪记录。",
    mirror: "像随四季调整灌溉：观察温度与土壤只是起点，植物的真实反应才决定何时加水、遮阴或暂停施力。",
    caution: "调候提示不是医学诊断，也不替代医疗建议；持续不适、疼痛或情绪困扰应及时寻求合格专业帮助。",
    pillarDependencies: ["month"], ruleIds: ["calendar.eight-char.v1", "climate.season-prompt.v1"],
  },
  {
    id: "rhythm-recovery", professionalTitle: "日月关系的阶段转换配速", innovationTitle: "节奏换挡",
    basis: `${relationEvidence(chart, ["day", "month"])}；月令为${chart.pillars.month.branch}，日主为${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}`,
    plainLanguage: "角色或环境变化时，日月关系可提醒内在惯性与外部周期是否同速。先减少并行任务，再用周复盘重新校准。",
    mirror: "像车辆换挡：上一段路的转速不一定适合新坡度，平稳过渡依靠减载、观察和逐级加速，而不是硬踩油门。",
    caution: "合冲刑害破只作节奏提问，不对应健康事件或吉凶日期；身心状态仍以真实记录和专业评估为准。",
    pillarDependencies: ["day", "month"], ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"],
  },
  {
    id: "rhythm-decision", professionalTitle: "年月日结构的长期节奏", innovationTitle: "长线刻度",
    basis: `${baseRules(chart).structure}；${relationEvidence(chart, ["year", "month"])}`,
    plainLanguage: "长期节奏不由单一年份决定。已知三柱只提供结构起点，真正结果取决于持续投入、环境变化和按证据修正。",
    mirror: "像远足地图：等高线帮助预估坡度，但天气、体力与补给会持续变化，因此每个里程碑都要重新确认路线。",
    caution: "命理节奏不是医疗、寿命或灾祸预测，也不承诺某年必成；年度计划应以现实数据、资源和风险边界更新。",
    pillarDependencies: ["year", "month", "day"], ruleIds: ["structure.support-score.v2", "relation.gan-zhi.v1", "domain.mapping.v2"],
  },
];

const domainSelectors: Record<Domain, DomainSelector> = {
  self: selfSelector, talent: talentSelector, career: careerSelector, wealth: wealthSelector,
  relationship: relationshipSelector, family: familySelector, rhythm: rhythmSelector,
};

export function interpretationLength(item: InterpretationItem) {
  return Array.from([
    item.professionalTitle, item.basis, item.plainLanguage, item.scenario,
    item.mirror, item.action, item.caution,
  ].join("")).length;
}

export function buildProfessionalOverview(chart: FourPillarsResult): ProfessionalOverview {
  const p = chart.professional;
  const counts = new Map<string, number>();
  for (const item of p.tenGods) counts.set(item.tenGod, (counts.get(item.tenGod) ?? 0) + 1);
  const dominant = [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))[0]?.[0] ?? "信息有限";
  const ambiguous = new Set(p.ambiguousFields);
  const boundaryMessage = "时辰不详且处交节日，不作单一判断";
  return {
    dayMaster: `${p.dayMaster.stem}日主`, dayMasterElement: p.dayMaster.element,
    structureBalance: ambiguous.has("structureBalance") ? "ambiguous" : p.structureBalance,
    pattern: p.pattern, climate: p.climate,
    sameAndResourceElements: ambiguous.has("sameAndResourceElements") ? [] : [...p.sameAndResourceElements],
    lowerCountElements: ambiguous.has("lowerCountElements") ? [] : [...p.lowerCountElements],
    tenGodSummary: ambiguous.has("tenGodSummary") ? boundaryMessage : `已知干支中较常出现${dominant}`,
    relationSummary: ambiguous.has("relationSummary") ? boundaryMessage : p.relations.length
      ? p.relations.map(relation => relation.label).join("、")
      : "已知柱间未见五合、六合、三合、冲、刑、害、破",
    confidence: p.observationConfidence, ambiguousFields: [...p.ambiguousFields],
  };
}

export function buildInterpretations(chart: FourPillarsResult): InterpretationItem[] {
  return (Object.entries(domainSelectors) as [Domain, DomainSelector][]).flatMap(([domain, selector]) => selector(chart).map(draft => {
    const sources = draft.ruleIds.map(id => YI_RULE_SOURCES[id]);
    const enrichment = getInterpretationEnrichment(draft.id);
    const scene = scenarioLibrary[draft.id];
    const dependencies = [...draft.pillarDependencies];
    const affected = dependencies.some(pillar => chart.ambiguousPillars.includes(pillar));
    const heuristic = sources.some(source => source.sourceType === "product-heuristic");
    const basis = affected && dependencies.some(pillar => pillar !== "hour")
      ? `${draft.basis}；相关柱位随未知时辰或交节边界可能变化，当前值仅作有限参考`
      : draft.basis;
    return {
      ...draft,
      ...enrichment,
      basis,
      domain,
      scenario: scene.scenario,
      action: enrichment.actionNow,
      confidence: affected ? "limited" : heuristic ? "medium" : chart.confidence,
      sourceTradition: sources.map(source => source.label).join("；"),
      sourceReferences: sources.flatMap(source => [...source.references]),
      sourceRuleIds: [...draft.ruleIds],
      pillarDependencies: dependencies,
      affectedByUnknownHour: affected,
    };
  }));
}
