import { YI_RULE_SOURCES } from "./sources";
import type { FourPillarsResult, InterpretationItem, PillarKey, ProfessionalOverview } from "./types";

type Domain = InterpretationItem["domain"];
type Draft = Omit<InterpretationItem, "id" | "domain" | "confidence" | "sourceTradition" | "sourceReferences" | "sourceRuleIds" | "pillarDependencies" | "affectedByUnknownHour"> & { ruleIds: string[] };
type DomainSelector = (chart: FourPillarsResult) => Draft[];

function godAt(chart: FourPillarsResult, pillar: PillarKey, position?: "stem" | "branch") {
  return chart.professional.tenGods.find(item => item.pillar === pillar && (!position || item.position === position))?.tenGod ?? "信息暂缺";
}

function relationEvidence(chart: FourPillarsResult, preferred: PillarKey[]) {
  const selected = chart.professional.relations.find(relation => relation.pillars.every(pillar => preferred.includes(pillar)));
  return selected ? `${selected.pillars.join("、")}柱见${selected.label}` : `${preferred.join("、")}柱之间未见五合、六合或六冲`;
}

function baseRules(chart: FourPillarsResult) {
  const p = chart.professional;
  return {
    day: `${p.dayMaster.stem}日主，属${p.dayMaster.element}`,
    structure: `支持度结构观察为${p.structureBalance}（产品计分 ${p.supportScore}%）`,
    month: `月支本气十神为${godAt(chart, "month", "branch")}`,
    climate: p.climate,
  };
}

const selfSelector: DomainSelector = chart => {
  const b = baseRules(chart);
  return [
    { professionalTitle: "日主作为自我观察起点", innovationTitle: "内在坐标", basis: b.day, plainLanguage: "先辨认自己惯用的启动方式，再判断是否适合当下环境。", scenario: "独立做决定而外界意见很多时", mirror: "以日主为镜，不把五行当人格标签", action: "写下判断、证据和可调整条件。", caution: "日主只是一条观察轴，不代表完整人格。", ruleIds: ["calendar.eight-char.v1", "domain.mapping.v2"] },
    { professionalTitle: "自我支持方式结构观察", innovationTitle: "能量底座", basis: b.structure, plainLanguage: "这项计分只提示你当前结构更偏向获得支持还是向外表达。", scenario: "连续承担任务并判断是否需要补给时", mirror: "像看土壤含水量一样看支持条件", action: "记录一周中恢复和消耗最大的活动。", caution: "这是产品启发式，不是旺衰、格局或喜忌结论。", ruleIds: ["structure.support-score.v2", "domain.mapping.v2"] },
    { professionalTitle: "日月两柱的内外协调", innovationTitle: "内外接口", basis: relationEvidence(chart, ["day", "month"]), plainLanguage: "内在选择与现实环境之间可能有牵引，也可能需要主动建立连接。", scenario: "个人偏好与工作环境要求不一致时", mirror: "把合冲看作齿轮的咬合方式", action: "区分不可协商的底线与可学习的适应。", caution: "合冲不等于吉凶或事件必然发生。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
  ];
};

const talentSelector: DomainSelector = chart => [
  { professionalTitle: "月干十神的公开表达线索", innovationTitle: "能力出口", basis: `月干十神为${godAt(chart, "month", "stem")}`, plainLanguage: "可观察你在公开任务中更常调用哪一种关系功能。", scenario: "汇报、教学或展示阶段性成果时", mirror: "像选择合适的工具，而非领取固定天赋标签", action: "用一个小交付验证这种表达方式。", caution: "十神功能不直接等于职业天赋。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
  { professionalTitle: "日支藏干的熟练模式", innovationTitle: "隐性手感", basis: `日支首个藏干十神为${godAt(chart, "day", "branch")}`, plainLanguage: "独处或熟悉情境中，你可能更自然地使用这类能力。", scenario: "没有明确指令、需要自己摸索方法时", mirror: "像惯用手，熟练但仍可训练另一侧", action: "回看三次做得顺手的任务，提炼共同步骤。", caution: "藏干需结合完整结构，单项不能定性。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
  { professionalTitle: "时柱所示的后续表达线索", innovationTitle: "未来试验场", basis: chart.pillars.hour ? `时干十神为${godAt(chart, "hour", "stem")}` : "时辰未知，后续表达线索暂不判断", plainLanguage: chart.pillars.hour ? "可把这项功能放进长期作品或晚近目标中试验。" : "先用已知三柱观察能力，不补造时柱信息。", scenario: "规划长期作品、第二曲线或个人项目时", mirror: "像远处航标，需用真实行动校准", action: "设一个四周试验并记录反馈。", caution: "时柱信息依赖可靠出生时辰。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
];

const careerSelector: DomainSelector = chart => [
  { professionalTitle: "月柱作为工作环境线索", innovationTitle: "职场接口", basis: `月干为${godAt(chart, "month", "stem")}，月支本气为${godAt(chart, "month", "branch")}`, plainLanguage: "月柱可帮助观察你与制度、任务和协作环境的接口。", scenario: "进入新团队或职责发生变化时", mirror: "像观察岗位与组织之间的插槽", action: "写清责任、权限和成果标准。", caution: "不能由十神直接指定行业或职位。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
  { professionalTitle: "年月关系的组织适配线索", innovationTitle: "组织齿轮", basis: relationEvidence(chart, ["year", "month"]), plainLanguage: "早期经验与当前环境之间的衔接方式值得被看见。", scenario: "旧经验在新组织中不完全适用时", mirror: "旧齿轮进入新机器，需要重新校准", action: "保留一个有效旧方法，同时试验一个新流程。", caution: "关系结构不评价组织好坏。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
  { professionalTitle: "支持与输出的职业节奏", innovationTitle: "责任配速", basis: baseRules(chart).structure, plainLanguage: "计分用于提醒工作中补给与交付的配比，不是事业成败判断。", scenario: "任务密集、需要决定亲自承担还是协作时", mirror: "像为长跑安排补给点", action: "为高耗能任务配置资源或协作者。", caution: "产品计分不构成古法旺衰判断。", ruleIds: ["structure.support-score.v2", "domain.mapping.v2"] },
];

const wealthSelector: DomainSelector = chart => [
  { professionalTitle: "财星仅作资源互动观察", innovationTitle: "资源接口", basis: `已知十神中财星出现 ${chart.professional.tenGods.filter(x => x.tenGod.includes("财")).length} 次`, plainLanguage: "这里观察的是你与资源交换的结构线索，不预测财富规模。", scenario: "安排预算、报价或投入新项目时", mirror: "把资源看作需要流向与边界的水系", action: "区分生存资金、稳定投入与试验预算。", caution: "财星数量不等于财富多少。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
  { professionalTitle: "日月关系的价值交换线索", innovationTitle: "价值回路", basis: relationEvidence(chart, ["day", "month"]), plainLanguage: "个人投入与环境回报之间需要明确可验证的交换条件。", scenario: "付出很多却难以衡量回报时", mirror: "像检查回路是否闭合", action: "为投入设定时间、金额和退出条件。", caution: "合冲不表示必然得财或破财。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
  { professionalTitle: "五行分布的资源分散提示", innovationTitle: "配置篮子", basis: `当前主五行计数为${Object.entries(chart.elementCounts).map(([k, v]) => `${k}${v}`).join("、")}`, plainLanguage: "分布只用于提醒资源是否过度集中在一种行动方式。", scenario: "同时面对储蓄、学习与事业投入时", mirror: "像检查篮子里的重量分布", action: "给高波动尝试设置明确上限。", caution: "五行计数不是投资建议或喜忌。", ruleIds: ["structure.support-score.v2", "domain.mapping.v2"] },
];

const relationshipSelector: DomainSelector = chart => [
  { professionalTitle: "日支作为亲密互动观察位", innovationTitle: "关系座席", basis: `日支为${chart.pillars.day.branch}，藏干首见${godAt(chart, "day", "branch")}`, plainLanguage: "可从熟悉关系中的惯常回应方式开始观察。", scenario: "亲密关系出现期待落差时", mirror: "座席提示视角，不替你定义关系", action: "先说事实与感受，再提一个具体请求。", caution: "日支不能单独断定婚恋结果。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
  { professionalTitle: "日月互动的关系边界", innovationTitle: "边界潮汐", basis: relationEvidence(chart, ["day", "month"]), plainLanguage: "个人需求与现实安排之间需要持续协商。", scenario: "工作节奏挤压共同时间时", mirror: "像潮汐一样看靠近与退让", action: "约定一个固定沟通窗口和暂停信号。", caution: "结构关系不等于相处质量。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
  { professionalTitle: "年日互动的既有关系脚本", innovationTitle: "旧脚本新写法", basis: relationEvidence(chart, ["year", "day"]), plainLanguage: "早期经验可能影响现在的回应习惯，但脚本可以重写。", scenario: "同一种冲突在不同关系里反复出现时", mirror: "旧地图不必决定新路线", action: "识别触发点，并练习一种不同回应。", caution: "不把家庭经验归因成宿命。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
];

const familySelector: DomainSelector = chart => [
  { professionalTitle: "年柱作为早期环境线索", innovationTitle: "家族底色", basis: `年干十神为${godAt(chart, "year", "stem")}，年支首藏为${godAt(chart, "year", "branch")}`, plainLanguage: "可观察早期环境让你熟悉了怎样的责任与回应方式。", scenario: "家人期待你自然承担某项角色时", mirror: "底色会影响画面，但不是整幅画", action: "写下你愿意承接和不再代替承担的部分。", caution: "年柱不用于评价原生家庭。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
  { professionalTitle: "年月关系的代际衔接", innovationTitle: "代际接口", basis: relationEvidence(chart, ["year", "month"]), plainLanguage: "家庭经验与社会角色之间可能既有延续也有调整。", scenario: "家庭期待与现实职业选择发生张力时", mirror: "像两段轨道需要一个转辙点", action: "说明选择背后的现实条件，而非只争对错。", caution: "合冲不代表亲缘吉凶。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
  { professionalTitle: "时柱相关的后代与愿景观察", innovationTitle: "留白传承", basis: chart.pillars.hour ? `时支为${chart.pillars.hour.branch}，首藏十神为${godAt(chart, "hour", "branch")}` : "时辰未知，不判断时柱相关的后代与晚近愿景", plainLanguage: chart.pillars.hour ? "把它作为你希望传递何种经验的提问。" : "保留未知比补造结论更可靠。", scenario: "思考对子女、晚辈或长期家庭愿景的投入时", mirror: "传承像递出一盏灯，而非复制路线", action: "写下一条希望传递的原则和一种尊重差异的方法。", caution: "时柱依赖可靠时辰，也不预测子女结果。", ruleIds: ["ten-god.hidden-stems.v1", "domain.mapping.v2"] },
];

const rhythmSelector: DomainSelector = chart => [
  { professionalTitle: "标准月令的季节节律提示", innovationTitle: "四时节拍", basis: baseRules(chart).climate, plainLanguage: "月令用于提醒寒暖燥湿的生活观察，不给出调候用神。", scenario: "安排季度工作强度与恢复节奏时", mirror: "像顺着季节调整作息", action: "记录睡眠、运动与高压日的关联。", caution: "调候提示不替代健康评估。", ruleIds: ["calendar.eight-char.v1", "climate.season-prompt.v1"] },
  { professionalTitle: "日月关系的日常配速", innovationTitle: "昼夜接口", basis: relationEvidence(chart, ["day", "month"]), plainLanguage: "内在节奏与外部周期需要找到可持续接口。", scenario: "忙碌周期反复打乱休息时", mirror: "像校准两只走速不同的钟", action: "给高强度日配置明确的恢复日。", caution: "合冲只作节奏提问，不对应健康事件。", ruleIds: ["relation.gan-zhi.v1", "domain.mapping.v2"] },
  { professionalTitle: "时支所示的日内节律线索", innovationTitle: "时辰刻度", basis: chart.pillars.hour ? `出生时支为${chart.pillars.hour.branch}` : "时辰未知，不生成时柱节律判断", plainLanguage: chart.pillars.hour ? "可把出生时段当作日内节律的观察起点，再用记录验证。" : "日内节律只从真实作息记录建立。", scenario: "调整入睡、起床与深度工作窗口时", mirror: "刻度帮助记录，不替身体作答", action: "连续两周记录精力峰谷再调整安排。", caution: "时支不是医学结论，且依赖可靠时辰。", ruleIds: ["calendar.eight-char.v1", "domain.mapping.v2"] },
];

const domainSelectors: Record<Domain, DomainSelector> = {
  self: selfSelector, talent: talentSelector, career: careerSelector, wealth: wealthSelector,
  relationship: relationshipSelector, family: familySelector, rhythm: rhythmSelector,
};

const pillarDependencies: Record<Domain, readonly [readonly PillarKey[], readonly PillarKey[], readonly PillarKey[]]> = {
  self: [["day"], ["year", "month", "day"], ["day", "month"]],
  talent: [["month"], ["day"], ["hour"]],
  career: [["month"], ["year", "month"], ["year", "month", "day"]],
  wealth: [["year", "month", "day"], ["day", "month"], ["year", "month", "day"]],
  relationship: [["day"], ["day", "month"], ["year", "day"]],
  family: [["year"], ["year", "month"], ["hour"]],
  rhythm: [["month"], ["day", "month"], ["hour"]],
};

export function buildProfessionalOverview(chart: FourPillarsResult): ProfessionalOverview {
  const p = chart.professional;
  const counts = new Map<string, number>();
  for (const item of p.tenGods) counts.set(item.tenGod, (counts.get(item.tenGod) ?? 0) + 1);
  const dominant = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0]?.[0] ?? "信息有限";
  return { dayMaster: `${p.dayMaster.stem}日主`, dayMasterElement: p.dayMaster.element, structureBalance: p.structureBalance, pattern: p.pattern, climate: p.climate, sameAndResourceElements: [...p.sameAndResourceElements], lowerCountElements: [...p.lowerCountElements], tenGodSummary: `已知干支中较常出现${dominant}`, relationSummary: p.relations.length ? p.relations.map(x => x.label).join("、") : "已知柱间未见五合、六合或六冲", confidence: p.observationConfidence };
}

export function buildInterpretations(chart: FourPillarsResult): InterpretationItem[] {
  return (Object.entries(domainSelectors) as [Domain, DomainSelector][]).flatMap(([domain, selector]) => selector(chart).map((draft, index) => {
    const sources = draft.ruleIds.map(id => YI_RULE_SOURCES[id]);
    const dependencies = [...pillarDependencies[domain][index]];
    const affected = dependencies.some(pillar => chart.ambiguousPillars.includes(pillar));
    const heuristic = sources.some(source => source.sourceType === "product-heuristic");
    const basis = affected && dependencies.some(pillar => pillar !== "hour") ? `${draft.basis}；该柱位随未知时辰可能变化，当前值仅为日内参考` : draft.basis;
    return { ...draft, basis, id: `${domain}-${index + 1}`, domain, confidence: affected ? "limited" : heuristic ? "medium" : chart.confidence, sourceTradition: sources.map(source => source.label).join("；"), sourceReferences: sources.flatMap(source => [...source.references]), sourceRuleIds: [...draft.ruleIds], pillarDependencies: dependencies, affectedByUnknownHour: affected };
  }));
}
