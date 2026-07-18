import { getInterpretationEnrichment, type InterpretationId } from "./interpretation-enrichment";
import type { ChartRelation, FourPillarsResult, Pillar, PillarKey, ProfessionalChart } from "./types";

function scene(id: InterpretationId, scenarios: readonly [string, string]) {
  return { scenario: scenarios[0], scenarios, action: getInterpretationEnrichment(id).actionNow };
}

export const scenarioLibrary = {
  "self-day-master": scene("self-day-master", [
    "会议需要在多种意见中作决定时，你可能先建立自己的判断顺序，再选择吸收哪些建议；如果没有主动寻找反证，清晰主见也可能变成过早定案。",
    "跨部门评审争论不休时，你先把必须今天决定、可以补证和需要他人拍板的事项分开；同事会更容易跟上，但若跳过复述异议，决策仍可能留下盲点。",
  ]),
  "self-support": scene("self-support", [
    "工作、家庭和关系责任同时推进时，你可能只盯着事项有没有完成，却没有计算注意力、恢复时间和协作资源，直到效率或耐心明显下降。",
    "项目冲刺恰逢家中临时事务时，你先保住最关键的一件交付，却容易把休息和求助推迟；周围人可能以为你还能承受，过载因而继续累积。",
  ]),
  "self-interface": scene("self-interface", [
    "个人偏好与组织规则不一致时，你一面想保留真实，一面又担心影响结果；若差异没有被拆开说明，容易在沉默适应和突然反弹之间摆动。",
    "团队要求统一流程而你有一套更顺手的方法时，你先用小样证明差异，再讨论哪些步骤必须一致；若只在心里抵触，别人只会看到配合忽冷忽热。",
  ]),
  "talent-public": scene("talent-public", [
    "公开汇报或展示成果时，你会自然调用最熟练的表达方式；若没有先确认听众和目标，流畅呈现也可能材料很多、主线不清，听众仍不知道下一步。",
    "向陌生客户做十分钟提案时，你先展示最有把握的成果；如果没有先问对方要解决什么，专业细节会占满时间，最后仍难形成明确决定。",
  ]),
  "talent-hidden": scene("talent-hidden", [
    "安静准备、独立摸索或暂时没有明确指令时，你会回到顺手的处理步骤；它能保证底稿质量，也可能因缺少外部试用而留下交接断点。",
    "独自准备一份重要材料时，你会把逻辑和细节反复磨顺；若直到截止前才让同伴试读，原本清楚的思路可能在交接处变得难懂。",
  ]),
  "talent-output": scene("talent-output", [
    "需要把复杂研究转成一页方案、清单或报告时，你既要保留关键条件，又要降低接收者的理解成本；信息越多，越需要先确定交付物为谁解决什么问题。",
    "研究资料要交给执行团队时，你先画流程或做样例，再删去与当下决定无关的信息；若舍不得取舍，接收者会在厚材料里找不到行动起点。",
  ]),
  "career-role": scene("career-role", [
    "接到新的角色分配时，职位名称看起来清楚，目标、权限和验收标准却可能仍有空白；若急着开始执行，后期容易出现有责任无授权或多人重复负责。",
    "临时被推为项目负责人时，你先确认谁能决定、谁来执行和怎样算完成；若只接下头衔没有补齐权限，团队会把所有卡点重新推回给你。",
  ]),
  "career-pressure": scene("career-pressure", [
    "截止期限突然提前时，熟悉的旧方法会自动接管，帮助你快速推进；若同时减少沟通，关键依赖和质量风险可能直到交付前才集中暴露。",
    "上线前发现关键依赖晚到时，你先缩小本次交付范围并公开风险；若为了显得可靠而独自补洞，其他人会直到最后一刻才知道计划已失真。",
  ]),
  "career-environment": scene("career-environment", [
    "选择新团队或比较两份工作时，短期兴奋和单次挫折都容易放大判断；真正需要比较的是任务、授权、反馈、协作与恢复条件能否长期支持发挥。",
    "试岗第二周遇到一次混乱协作时，你不急着凭情绪下结论，而是记录任务边界、反馈速度和恢复成本；连续几次记录比单日感受更能说明是否适合。",
  ]),
  "wealth-structure": scene("wealth-structure", [
    "做月度预算时，账户余额可能看起来充足，但固定付款、时间承诺和未来责任尚未进入计算；只有把这些放在同一张表里，才看得见真实可用资源。",
    "准备支付一笔大额课程或设备费用时，你把现金、未来三个月固定支出和可取消承诺放在一起核算；若只看当前余额，安全空间会被高估。",
  ]),
  "wealth-risk": scene("wealth-risk", [
    "面对一个看起来稀缺的新机会时，你可能在兴奋中放大收益，或因不确定而无限收集资料；两种情况都缺少最大损失、证据门槛和小规模试验。",
    "朋友推荐一个限时合作机会时，你先写下最坏损失、验证期限和退出条件，再决定是否小额试验；若只听热度或只等绝对确定，都难获得可比较证据。",
  ]),
  "wealth-boundary": scene("wealth-boundary", [
    "亲友借款或多人共同支出时，情感支持与财务责任容易混在一起；金额、用途、归还方式没有写清，一次善意可能逐渐变成双方都难开口的压力。",
    "几位朋友商量共同旅行或合租费用时，你先确认谁垫付、哪些费用均摊以及临时退出怎样处理；这些话若留到事后，亲近感很容易被账目消耗。",
  ]),
  "relationship-day-branch": scene("relationship-day-branch", [
    "亲密关系讨论陪伴、承诺或分工时，你可能默认对方应该理解没有说出口的期待；当回应不符合想象，失望便容易被解释成不重视。",
    "伴侣讨论周末安排时，你先说出自己真正想要的陪伴方式，也请对方复述理解；若把期待藏在试探里，对方可能只感到要求突然变化。",
  ]),
  "relationship-trigger": scene("relationship-trigger", [
    "一句熟悉的话、迟到或临时变更可能触发强烈反应；如果没有分清事实、自动解释和真正需要，一次具体事件很快会扩大成人格或关系的总判断。",
    "对方临时改约时，你先确认发生了什么，再说这件事触发了怎样的担心；若直接把一次变化等同于不在乎，争论会从安排迅速升级成人格判断。",
  ]),
  "relationship-repair": scene("relationship-repair", [
    "冲突之后若只追求迅速恢复表面平静，原来的影响、需要和规则仍未更新；同样的问题往往会换一个场景再次出现，让双方越来越难相信道歉。",
    "争执后的第二天，你们各自说明影响、需要和下一次暂停信号，并约定一周后复盘；若只说以后注意却不改规则，道歉很快会失去可信度。",
  ]),
  "family-year": scene("family-year", [
    "家庭再次需要有人组织时，你可能自然接回从小熟悉的调停、执行或照顾角色；它能维持秩序，也可能让一个未被重新协商的旧角色长期固化。",
    "逢年过节需要协调全家安排时，你先列出必须共同决定和可以各自选择的部分；若又自动接过所有调停工作，旧角色会在无人讨论时继续固化。",
  ]),
  "family-resource": scene("family-resource", [
    "任务已经超出负荷却收到家人帮助时，你可能因不习惯接受而继续说没事，或把一次支持默认为长期安排；双方都需要知道范围、意愿和结束条件。",
    "照顾任务突然增加时，家人提出帮忙，你先确认对方能承担多久、哪些事仍由自己负责；把支持说清范围，比含糊地客气或默认更能保护关系。",
  ]),
  "family-boundary": scene("family-boundary", [
    "家人把本可自行承担的事项交给你时，立即代办能暂时减少冲突，却会让责任反复回到同一个人；积累不满后突然退出，同样会破坏合作。",
    "亲人反复请你代办同一件事时，你这次陪他完成第一步并约定之后由谁接手；若每次都全盘接管，短期省事会换来长期依赖和积怨。",
  ]),
  "rhythm-climate": scene("rhythm-climate", [
    "换季后仍沿用上一阶段的作息和工作强度时，你可能直到专注与恢复明显下降才调整；季节线索适合提醒观察，不适合解释具体健康问题。",
    "入夏后下午专注明显变短时，你连续两周记录睡眠、任务密度和恢复情况，再调整高强度工作的时段；真实记录比把一切归因于季节更可靠。",
  ]),
  "rhythm-recovery": scene("rhythm-recovery", [
    "连续完成一段密集工作后，兴奋感可能让你马上接下新任务，却忽略判断力和作息仍未恢复；完全停摆也未必比逐级降载更有效。",
    "一轮发布刚结束时，你先留出半天处理收尾和恢复，再决定是否接新任务；若把兴奋当成精力已经回来，判断失误往往会在下一轮集中出现。",
  ]),
  "rhythm-decision": scene("rhythm-decision", [
    "决定是否继续收集信息时，你可能担心遗漏而迟迟不动，也可能为了摆脱焦虑仓促拍板；关键不是获得全部信息，而是预先定义什么证据已经足够。",
    "方案已经收集到三类关键证据时，你按预先写好的门槛做一次小决定，并留下复查日期；若继续追求没有遗漏，行动成本会比新增信息更快上升。",
  ]),
} satisfies Record<InterpretationId, { scenario: string; action: string }>;

type StableScenarioFacts = {
  pillars: Record<PillarKey, Pillar | null>;
  structureBalance: ProfessionalChart["structureBalance"] | null;
  supportScore: number | null;
  relations: ChartRelation[];
};

type ScenarioSelector = (facts: StableScenarioFacts) => boolean;

const yangStems = new Set(["甲", "丙", "戊", "庚", "壬"]);
const yangBranches = new Set(["子", "寅", "辰", "午", "申", "戌"]);
const warmSeasonBranches = new Set(["巳", "午", "未"]);
const pressureRelationTypes = new Set<ChartRelation["type"]>([
  "branch-clash", "branch-punishment", "branch-harm", "branch-break",
]);

function stableScenarioFacts(chart: FourPillarsResult): StableScenarioFacts {
  const ambiguousPillars = new Set(chart.ambiguousPillars);
  const ambiguousFields = new Set<string>(chart.professional.ambiguousFields);
  const fieldCanHidePillar: Record<PillarKey, string[]> = {
    year: ["yearPillar"],
    month: ["monthCommand", "monthPillar"],
    day: ["dayMaster", "dayPillar"],
    hour: ["hourPillar"],
  };
  const stablePillar = (key: PillarKey) => {
    if (ambiguousPillars.has(key) || fieldCanHidePillar[key].some((field) => ambiguousFields.has(field))) return null;
    return chart.pillars[key];
  };
  const pillars: StableScenarioFacts["pillars"] = {
    year: stablePillar("year"),
    month: stablePillar("month"),
    day: stablePillar("day"),
    hour: stablePillar("hour"),
  };
  const structureStable = !ambiguousFields.has("structureBalance") &&
    pillars.year !== null && pillars.month !== null && pillars.day !== null;
  const relations = ambiguousFields.has("relationSummary") ? [] : chart.professional.relations
    .filter((relation) => relation.pillars.every((pillar) => pillars[pillar] !== null));
  return {
    pillars,
    structureBalance: structureStable ? chart.professional.structureBalance : null,
    supportScore: structureStable ? chart.professional.supportScore : null,
    relations,
  };
}

function isYangStem(pillar: Pillar | null) {
  return pillar !== null && yangStems.has(pillar.stem);
}

function isYangBranch(pillar: Pillar | null) {
  return pillar !== null && yangBranches.has(pillar.branch);
}

function isWarmSeason(pillar: Pillar | null) {
  return pillar !== null && warmSeasonBranches.has(pillar.branch);
}

function hasPairRelation(facts: StableScenarioFacts, left: PillarKey, right: PillarKey) {
  return facts.relations.some((relation) => relation.pillars.includes(left) && relation.pillars.includes(right));
}

function hasPressurePairRelation(facts: StableScenarioFacts, left: PillarKey, right: PillarKey) {
  return facts.relations.some((relation) => pressureRelationTypes.has(relation.type) &&
    relation.pillars.includes(left) && relation.pillars.includes(right));
}

function hasPressureRelation(facts: StableScenarioFacts) {
  return facts.relations.some((relation) => pressureRelationTypes.has(relation.type));
}

const scenarioSelectorById: Record<InterpretationId, ScenarioSelector> = {
  "self-day-master": (facts) => isYangStem(facts.pillars.day),
  "self-support": (facts) => facts.structureBalance === "expression-heavy",
  "self-interface": (facts) => hasPairRelation(facts, "day", "month"),
  "talent-public": (facts) => isYangStem(facts.pillars.month),
  "talent-hidden": (facts) => isYangBranch(facts.pillars.day),
  "talent-output": (facts) => isYangStem(facts.pillars.hour),
  "career-role": (facts) => isWarmSeason(facts.pillars.month),
  "career-pressure": (facts) => hasPressurePairRelation(facts, "year", "month"),
  "career-environment": (facts) => facts.structureBalance === "mixed",
  "wealth-structure": (facts) => facts.supportScore !== null && facts.supportScore < 50,
  "wealth-risk": (facts) => hasPressurePairRelation(facts, "day", "month"),
  "wealth-boundary": (facts) => isYangStem(facts.pillars.year),
  "relationship-day-branch": (facts) => isYangBranch(facts.pillars.day),
  "relationship-trigger": (facts) => hasPressurePairRelation(facts, "day", "month"),
  "relationship-repair": (facts) => hasPairRelation(facts, "year", "day"),
  "family-year": (facts) => isYangBranch(facts.pillars.year),
  "family-resource": (facts) => hasPairRelation(facts, "year", "month"),
  "family-boundary": (facts) => isYangBranch(facts.pillars.hour),
  "rhythm-climate": (facts) => isWarmSeason(facts.pillars.month),
  "rhythm-recovery": (facts) => hasPressureRelation(facts),
  "rhythm-decision": (facts) => facts.structureBalance === "support-heavy",
};

export function getScenarioForChart(id: InterpretationId, chart: FourPillarsResult) {
  const entry = scenarioLibrary[id];
  const useAlternate = scenarioSelectorById[id](stableScenarioFacts(chart));
  return { scenario: entry.scenarios[useAlternate ? 1 : 0], action: entry.action };
}

export type ScenarioId = keyof typeof scenarioLibrary;
