import {
  INTERPRETATION_IDS,
  type InterpretationId,
} from "./interpretation-enrichment";
import { selectStableStoryFacts } from "./stable-story-facts";
import { stemElements } from "./stems-branches";
import type {
  ElementName,
  FourPillarsResult,
  InterpretationItem,
  PillarKey,
  ProfessionalReport,
} from "./types";

export type DetailActionId =
  `${InterpretationId}:${"actionNow" | "actionLongTerm"}`;

export const DETAIL_ACTION_ID_ALLOWLIST: readonly DetailActionId[] =
  Object.freeze(INTERPRETATION_IDS.flatMap(id => [
    `${id}:actionNow` as const,
    `${id}:actionLongTerm` as const,
  ]));

const chartPillarKeys: readonly PillarKey[] = [
  "year",
  "month",
  "day",
  "hour",
];

export function assertMatchingChartReport(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
): void {
  const factByKey = new Map(report.pillarFacts.map(fact => [fact.key, fact]));
  const ambiguous = new Set<PillarKey>(chart.ambiguousPillars);
  if (chart.professional.ambiguousFields.includes("dayMaster")
    || chart.professional.ambiguousFields.includes("dayPillar")) {
    ambiguous.add("day");
  }
  const dayAxisMismatched = !ambiguous.has("day")
    && report.dayMaster !== chart.professional.dayMaster.stem;
  const mismatched = dayAxisMismatched
    || chartPillarKeys.some(key => {
      const pillar = chart.pillars[key];
      const fact = factByKey.get(key);
      return pillar === null
        ? fact !== undefined
        : !ambiguous.has(key) && (
          fact === undefined
          || fact.stem !== pillar.stem
          || fact.branch !== pillar.branch
        );
    });
  if (mismatched) {
    throw new Error("命盘与专业报告不一致：四柱坐标不匹配");
  }
}

const actionPairOutcomes: Readonly<Record<InterpretationId, string>> = {
  "self-day-master": "让判断从当下结论走向持续校准",
  "self-support": "让承担回到真实容量",
  "self-interface": "让分歧从立场回到可协商条件",
  "talent-public": "让表达随现场理解逐步调整",
  "talent-hidden": "让个人熟练变成可交接经验",
  "talent-output": "让成果随真实用途改进",
  "career-role": "让角色从名称落到可验收交付",
  "career-pressure": "让压力经验改进下一次计划",
  "career-environment": "让环境选择依据长期样本",
  "wealth-structure": "让新机会不挤压基本盘",
  "wealth-risk": "让追加资源依赖新证据",
  "wealth-boundary": "让善意与财务责任同时清楚",
  "relationship-day-branch": "让期待可以被听见和回应",
  "relationship-trigger": "让分歧保留暂停与修复入口",
  "relationship-repair": "让和好落到下一次新规则",
  "family-year": "让熟悉角色重新接受协商",
  "family-resource": "让帮助保留双方余力",
  "family-boundary": "让每个人逐步接回自己的责任",
  "rhythm-climate": "让加速和降档都有记录依据",
  "rhythm-recovery": "让恢复按照真实消耗展开",
  "rhythm-decision": "让把握来自复盘而非等待",
};

const actionSemanticFrames: Readonly<Record<DetailActionId, string>> = {
  "self-day-master:actionNow": "写下结论、依据和反证",
  "self-day-master:actionLongTerm": "建立决策记录并双周复盘",
  "self-support:actionNow": "区分亲自、协作和暂停",
  "self-support:actionLongTerm": "建立支持台账并在过载时减量",
  "self-interface:actionNow": "写清偏好、规则目的和替代方案",
  "self-interface:actionLongTerm": "按底线、学习和协商条件复盘",
  "talent-public:actionNow": "保留一项结论、三项依据和一项请求",
  "talent-public:actionLongTerm": "比较六次汇报的现场反馈",
  "talent-hidden:actionNow": "把熟练步骤写成可试用清单",
  "talent-hidden:actionLongTerm": "沉淀三项可交接模板",
  "talent-output:actionNow": "写一页摘要并附材料索引",
  "talent-output:actionLongTerm": "按使用者反馈更新交付模板",
  "career-role:actionNow": "确认目标、责任、权限和验收人",
  "career-role:actionLongTerm": "在十五、三十、六十天复盘职责",
  "career-pressure:actionNow": "标出关键路径、确认点和风险",
  "career-pressure:actionLongTerm": "用三个项目复盘延期与返工",
  "career-environment:actionNow": "按自主、协作、反馈和恢复比较环境",
  "career-environment:actionLongTerm": "用八周日志形成择业条件",
  "wealth-structure:actionNow": "把资金分为支出、储备和试验",
  "wealth-structure:actionLongTerm": "月初预算、月中校准、月末复盘",
  "wealth-risk:actionNow": "限定可承受试验和退出条件",
  "wealth-risk:actionLongTerm": "把五次机会决定记录下来，再考虑是否追加",
  "wealth-boundary:actionNow": "书面确认金额、用途和归还日期",
  "wealth-boundary:actionLongTerm": "区分赠与、借款和共同承担",
  "relationship-day-branch:actionNow": "用四句话说明事实、感受、需要和请求",
  "relationship-day-branch:actionLongTerm": "每周进行二十分钟关系对话",
  "relationship-trigger:actionNow": "记录触发、身体信号、解释和需要",
  "relationship-trigger:actionLongTerm": "为高频循环约定暂停和重谈",
  "relationship-repair:actionNow": "冲突后轮流复述并确认一个动作",
  "relationship-repair:actionLongTerm": "建立暂停、道歉和改变的修复约定",
  "family-year:actionNow": "区分保留、轮换和停止的家庭角色",
  "family-year:actionLongTerm": "记录家庭任务的发起、执行和收尾",
  "family-resource:actionNow": "明确支持范围、时间和结束条件",
  "family-resource:actionLongTerm": "建立可接受也可拒绝的支持清单",
  "family-boundary:actionNow": "说明可协助范围、不能承担和归还时间",
  "family-boundary:actionLongTerm": "用六周逐步归还代办责任",
  "rhythm-climate:actionNow": "连续七天记录睡眠、专注和活动",
  "rhythm-climate:actionLongTerm": "用十二周建立季节节奏图",
  "rhythm-recovery:actionNow": "两周记录睡眠、专注和情绪波动",
  "rhythm-recovery:actionLongTerm": "设置当天、三日和一周恢复层级",
  "rhythm-decision:actionNow": "区分必须知道、可以后补和无法消除",
  "rhythm-decision:actionLongTerm": "记录十次决定并形成停止收集规则",
};

export type NarrativeBeat = {
  situation: string;
  opportunity: string;
  firstStrength: string;
  overuseCost: string;
  lowPoint: string;
  newChoice: string;
  turn: string;
  observableSignal: string;
  sourceActionIds: readonly DetailActionId[];
};

export type CareerScene =
  | "task-entry"
  | "collaboration-conflict"
  | "opportunity-choice"
  | "long-accumulation";

export type RelationshipScene =
  | "approach"
  | "misunderstanding"
  | "argument"
  | "repair"
  | "boundary";

export type RhythmScene =
  | "productive-window"
  | "overload-signal"
  | "pause"
  | "restart"
  | "decision-window";

export type SceneMicroStory<TScene extends string> = {
  id: string;
  covers: readonly TScene[];
  title: string;
  trigger: string;
  firstReaction: string;
  apparentBenefit: string;
  cost: string;
  turnAction: string;
  example: string;
  observableSignal: string;
  sourceActionIds: readonly DetailActionId[];
};

export type PlainChartTranslation = {
  sectionId:
    | "overview"
    | "month-strength"
    | "element-flow"
    | "relations"
    | "missing-elements";
  whatItMeans: string;
  lifeScene: string;
  practicalGuidance: string;
};

export type ChartNarrative = {
  professionalTranslations: readonly [
    PlainChartTranslation,
    PlainChartTranslation,
    PlainChartTranslation,
    PlainChartTranslation,
    PlainChartTranslation,
  ];
  self: NarrativeBeat;
  career: NarrativeBeat;
  relationship: NarrativeBeat;
  rhythm: NarrativeBeat;
  careerAdvice: readonly [
    SceneMicroStory<CareerScene>,
    SceneMicroStory<CareerScene>,
  ];
  relationshipAdvice: readonly [
    SceneMicroStory<RelationshipScene>,
    SceneMicroStory<RelationshipScene>,
  ];
  rhythmAdvice: readonly [
    SceneMicroStory<RhythmScene>,
    SceneMicroStory<RhythmScene>,
  ];
  coveredDetailActionIds: readonly DetailActionId[];
  internalActionFrames: readonly {
    id: DetailActionId;
    frame: string;
  }[];
  internalEvidenceIds: readonly string[];
  uncertaintyFlags: readonly string[];
};

export type ChartElementVisibility = {
  visibleElements: readonly ElementName[];
  hiddenOnlyElements: readonly ElementName[];
  absentInStablePillars: readonly ElementName[];
  hourUnknown: boolean;
};

const elementOrder: readonly ElementName[] = ["木", "火", "土", "金", "水"];
const interpretationOrder = new Map<string, number>(
  INTERPRETATION_IDS.map((id, index) => [id, index]),
);

type ElementStoryStyle = Readonly<{
  opening: string;
  strength: string;
  risk: string;
  mature: string;
  overviewScene: string;
  overviewGuidance: string;
  monthScene: string;
  monthGuidance: string;
  flowScene: string;
  flowGuidance: string;
}>;

const elementStoryStyle: Readonly<Record<
  ElementName,
  ElementStoryStyle
>> = {
  木: {
    opening: "先从混乱里搭出方向，再让做法逐步生长",
    strength: "愿意先立起骨架，并给后来的人留下可以继续推进的入口",
    risk: "方向一旦立住，容易晚一步听见条件已经改变",
    mature: "把坚持变成有复查点的长期建设",
    overviewScene:
      "接到需要从零启动的新任务时，你先把目标、限制与可用资源搭成一页骨架，再请同伴指出哪根支撑还不稳；第一版因此能够生长，也保留修订入口。",
    overviewGuidance:
      "本周挑一项刚起步的任务，画出主干、两条支线和停止条件；三天后只保留得到现实反馈的一枝。",
    monthScene:
      "项目条件变化时，你不急着推倒重来，而是标出受影响的枝节、需要修订的接口和仍然有效的主干；于是团队知道从哪里继续接手。",
    monthGuidance:
      "用两周记录三次条件变化，每次只修订一个接口，并比较返工是否下降、交接是否更顺。",
    flowScene:
      "跨部门协作卡住时，你先让一位同伴试跑最小的一步，再根据他接住了什么、卡在哪里，决定下一枝由谁继续；遗漏会在扩张前出现。",
    flowGuidance:
      "本周把一项熟练做法改成三步清单，交给同伴完成一次；只依据试跑记录决定增加、修剪还是停止。",
  },
  火: {
    opening: "先把重点照亮，让身边的人看见为何值得行动",
    strength: "能迅速聚拢注意力，把模糊问题转成大家愿意讨论的主题",
    risk: "亮度和速度同时上升时，容易让尚未准备好的人只感到压力",
    mature: "把热度变成可持续的节拍和清楚邀请",
    overviewScene:
      "讨论陷入散乱时，你先圈出最需要回答的一个问题，用一页画面说明为何重要，再把话筒交给现场；大家能复述重点，行动才真正开始。",
    overviewGuidance:
      "本周选一次十分钟表达，只保留一个主题、一个例子和一个请求；结束后记录听众实际复述了什么。",
    monthScene:
      "连续发言或推进后，你主动留出回应时间，让尚未准备好的人提出疑问；热度因此没有压过理解，方案也能在现场补齐盲点。",
    monthGuidance:
      "用两周比较一次只顾讲完与一次预留提问的结果，记录回应人数、遗漏问题和会后返工。",
    flowScene:
      "需要带动多人时，你先在现场点亮共同目标，再明确邀请一位安静成员补充反例；不同声音进入后，速度仍在，方向却不再只靠气氛。",
    flowGuidance:
      "本周主持一次短讨论，先说重点，再点名邀请两种不同意见；会后只保留能被共同执行的一项动作。",
  },
  土: {
    opening: "先稳住责任与次序，再把零散条件一项项接住",
    strength: "能在局面摇摆时建立可靠坐标，让事情不至于失去承接",
    risk: "为了维持稳定，容易把本该协商的变化继续揽在自己身上",
    mature: "把可靠变成边界清楚的共同承担",
    overviewScene:
      "多人分工还在摇摆时，你把责任、期限和验收人放进同一张表，并把无人承接的事项公开出来；可靠从个人兜底变成团队可见的安排。",
    overviewGuidance:
      "本周选一项共同任务，标出发起、执行、收尾和可求助对象；先交回一件长期默认代办。",
    monthScene:
      "临时加项来到桌前时，你先重新确认当前容量、原有承诺和谁来承接，不用沉默接下换取稳定；分工因此没有继续压向同一个人。",
    monthGuidance:
      "连续两周记录每次临时加项由谁提出、谁决定、谁执行；超过容量时明确延后、交接或取消一种。",
    flowScene:
      "团队习惯把零碎工作交给最可靠的人时，你把默认代办逐项交回负责人，再给需要协作的部分安排清楚接口；事情仍有人接，重量却开始分散。",
    flowGuidance:
      "本周从任务表中选一项默认代办，写清原负责人、交接时间和验收方式；七天后核对是否真正归位。",
  },
  金: {
    opening: "先切开混乱、划清标准，再决定哪一步值得推进",
    strength: "能快速辨认关键差异，把含糊要求整理成可以复核的结果",
    risk: "标准收得太快时，容易漏掉过渡、解释与共同适应的成本",
    mature: "让清楚的标准同时保留修正入口",
    overviewScene:
      "面对需求含糊的新任务，你先写下三项验收标准、一个允许试验的例外和复查日期；同伴据此做出小样，争论便从感觉回到结果。",
    overviewGuidance:
      "本周选一项正在评审的方案，把结论、依据、例外与停止条件放在同一页；小样完成后再决定取舍。",
    monthScene:
      "规则变化时，你先补一条例外和过渡办法，再请受影响的人复述新标准；清楚因此没有变成突然裁决，执行者也知道何时复查。",
    monthGuidance:
      "用两周跟踪一次规则调整，分别记录例外使用、解释成本和返工次数；只修改造成最大误解的一条。",
    flowScene:
      "跨部门拿到一份模糊要求时，你把它切成对象、交付物、验收人和截止点，再留一个协商入口；不同做法因此能在同一标准下比较。",
    flowGuidance:
      "本周把一个模糊要求改写成四项可验收条件，请两位同伴各做一次复述；根据遗漏处补标准，不补评价。",
  },
  水: {
    opening: "先汇集信号、连接不同位置，再寻找真正能流动的通道",
    strength: "能在变化中保留多个视角，把分散信息带回一条主线",
    risk: "选择持续增加时，主线容易被新鲜信息带散",
    mature: "让开放与停止规则同时存在",
    overviewScene:
      "消息从多个入口涌来时，你先把它们收回一条工作主线，标出今天必须回应、可以等待和应当关闭的通道；注意力于是重新有了去向。",
    overviewGuidance:
      "本周关闭三个非必要消息入口，只保留一个信息源和一个当天动作；完成后再决定是否打开下一条通道。",
    monthScene:
      "新信息不断改变判断时，你先写下停止收集的规则、当前主线和允许改道的条件；变化仍能进入，却不能每次都把行动带回起点。",
    monthGuidance:
      "用两周记录五次改主意的时刻，注明是哪条新事实改变了关键条件；没有新证据时继续原路线。",
    flowScene:
      "多人各自带来一组信号时，你先汇总共同目标、冲突条件和可验证的一条路径，再让每个人说明手中信息能支持哪一步；分散线索由此汇入行动。",
    flowGuidance:
      "本周把三路信息画成一张流向图，只选择能在七天内产生反馈的一条路径，并写下何时停止。",
  },
};

const neutralStyle: ElementStoryStyle = {
  opening: "先核对眼前事实，再决定下一步怎样推进",
  strength: "愿意在行动前看清条件，也给不同意见留下进入空间",
  risk: "若急着获得确定感，仍可能把第一种解释当成全部事实",
  mature: "把判断写成可以复查和修改的行动",
  overviewScene:
    "一项新任务来到眼前时，你先把已知事实、未知条件和可撤回的一步分开写下，再请同伴补充遗漏。",
  overviewGuidance:
    "本周只做一次低风险试验，记录原判断、现实反馈和一处修正；七天后再决定是否继续。",
  monthScene:
    "外部条件还在变化时，你先确认目标、资源和能够求助的人，再开始一个不会锁死后路的小动作。",
  monthGuidance:
    "用两周比较顺利与吃力的各一次经历，只调整最影响结果的一个现实条件。",
  flowScene:
    "几种做法都可能有效时，你把其中一种交给同伴试用，再依据对方能否完成来判断是否保留。",
  flowGuidance:
    "本周列出一项常用办法与一项未试办法，各做一次小测试，并写下继续或停止的理由。",
};

type DomainCue = Readonly<{
  opening: string;
  strength: string;
  risk: string;
  mature: string;
}>;

const elementDomainCues: Readonly<Record<ElementName, DomainCue>> = {
  木: {
    opening: "先搭方向，再用反馈修枝",
    strength: "把散乱条件接成可生长路径",
    risk: "方向定得太早会漏掉变化",
    mature: "给坚持设置复查点",
  },
  火: {
    opening: "先照亮重点，再邀请回应",
    strength: "迅速聚焦并带动行动",
    risk: "速度过快会压缩他人准备",
    mature: "把热度排成可持续节拍",
  },
  土: {
    opening: "先稳住次序，再分配责任",
    strength: "把零散任务接到可靠坐标",
    risk: "过度承接会模糊共同责任",
    mature: "把可靠变成边界清楚的分工",
  },
  金: {
    opening: "先划清标准，再保留解释入口",
    strength: "迅速分辨关键差异",
    risk: "标准收得太快会漏掉过渡",
    mature: "让取舍同时保留修正条件",
  },
  水: {
    opening: "先汇集信号，再收回一条主线",
    strength: "连接不同位置的信息",
    risk: "选择过多会冲散长期方向",
    mature: "给开放设置停止规则",
  },
};

const neutralDomainCue: DomainCue = {
  opening: "先核对事实，再小步试验",
  strength: "给不同解释留下验证空间",
  risk: "过早求确定会放大第一种解释",
  mature: "让行动可以复查和修改",
};

const relationshipReviewTextures: Readonly<Record<ElementName, string>> = {
  木: "方向与成长是否都被听见",
  火: "热度是否留出了回应时间",
  土: "可靠是否变成了共同承担",
  金: "标准是否留下了解释入口",
  水: "变化是否仍有复查坐标",
};

type StructureStoryStyle = {
  opportunity: string;
  overload: string;
  recovery: string;
  decision: string;
  rhythmWarning: string;
  recoveryExperiment: string;
  decisionExperiment: string;
  decisionProof: string;
  rhythmReview: string;
  recoveryReview: string;
  decisionReview: string;
};

const structureStoryStyles: Readonly<Record<
  NonNullable<ReturnType<typeof selectStableStoryFacts>["structureBalance"]>,
  StructureStoryStyle
>> = {
  "support-heavy": {
    opportunity: "已有资源不少时按时交出第一版",
    overload: "反复准备会挤压行动窗口",
    recovery: "先停新增承诺，再分清可用、可交接与可放下",
    decision: "设资料截止点，用可逆交付检验准备",
    rhythmWarning: "准备与承诺同时堆高时，结束工作会比启动更困难",
    recoveryExperiment: "从已承接事项里移出一项，观察腾出的时间是否真正用于恢复",
    decisionExperiment: "给资料收集设截止日，用一份可修改的初稿替代继续等待",
    decisionProof: "能按截止日交出可修改版本，追加准备只因为出现了新证据",
    rhythmReview: "复盘时确认结束时间是否提前，未完成事项是否已经交接或放下",
    recoveryReview: "七天后比较新增承诺、交接数量与可用精力，不因一天轻松就宣布恢复",
    decisionReview: "到截止日比较初稿、遗漏条件与新增证据，再决定补充还是提交",
  },
  mixed: {
    opportunity: "多个方向都有理由时先排主次",
    overload: "反复平衡会让忙碌失去主线",
    recovery: "先固定一个重点和一个补给窗口",
    decision: "写清主线与复查点，只让新事实改路线",
    rhythmWarning: "反复权衡会占满清醒时段，真正的主线却没有获得连续时间",
    recoveryExperiment: "固定一项重点和一段补给时间，其他请求延后到复查点",
    decisionExperiment: "先写一条主线与复查日期，新增信息只有改变关键条件时才改路线",
    decisionProof: "新信息没有改变关键条件时，原定主线仍按复查日期推进",
    rhythmReview: "复盘时看唯一重点是否得到连续时间，补给窗口是否真的被保留",
    recoveryReview: "七天后比较主线进度与休息质量，若两者都未改善就重新减项",
    decisionReview: "到复查日只问新事实是否改变关键条件，不为普通噪声改路线",
  },
  "expression-heavy": {
    opportunity: "行动启动快，但仍要确认验收后再加速",
    overload: "持续输出会挤压理解与恢复",
    recovery: "先降低强度，留出睡眠、反馈与排序窗口",
    decision: "收束目标与退出条件，再推进关键一步",
    rhythmWarning: "连续启动新任务会挤掉理解与休息，下一轮速度开始借用未来精力",
    recoveryExperiment: "先降一档任务强度，把睡眠、反馈和排序各留出固定窗口",
    decisionExperiment: "删去次要目标并写明退出条件，只推进一项可以检验的关键动作",
    decisionProof: "删去次要目标后，关键动作会按退出条件完成或停止",
    rhythmReview: "复盘时比较启动数量、完成数量和睡眠，不把忙碌直接当成进展",
    recoveryReview: "七天后看输出是否回到可理解、可回应并且能够按时结束的速度",
    decisionReview: "到退出点检查关键动作是否产生反馈，没有反馈便停止追加目标",
  },
};

const neutralStructureStyle: StructureStoryStyle = {
  opportunity: "条件尚未稳定时先做可逆小试验",
  overload: "过早归纳规律会把行动带偏",
  recovery: "先减少一项负荷，再按真实记录调整",
  decision: "保留检查点与停止条件",
  rhythmWarning: "条件未稳时继续加量，会让一次偶然反馈被误当成长期规律",
  recoveryExperiment: "先移出一项负荷，再按七天记录决定是否恢复",
  decisionExperiment: "保留一个检查点和停止条件，用小步结果补齐未知",
  decisionProof: "小步结果可以复核，未知项没有被包装成确定结论",
  rhythmReview: "复盘时分别核对任务量、结束时间与恢复感，不从单日波动推断长期规律",
  recoveryReview: "七天后只比较一项负荷变化与实际结果，资料不足就继续保持小步",
  decisionReview: "到检查点核对已知、未知与可撤回程度，再决定继续还是停止",
};

type RelationStoryFrame = {
  situation: string;
  approach: string;
  conflict: string;
  repair: string;
  signal: string;
};

function relationStoryFrame(
  relationType:
    | FourPillarsResult["professional"]["relations"][number]["type"]
    | null,
): RelationStoryFrame {
  if (relationType === "stem-combination"
    || relationType === "branch-combination"
    || relationType === "branch-trine") {
    return {
      situation: "彼此容易迅速形成共同方向，也更需要把责任、期限和退出条件补写完整",
      approach: "把共同意图拆成双方能承担的动作",
      conflict: "口头一致可能遮住责任与期限错位",
      repair: "写清负责人、期限与标准，再互相复述",
      signal: "口头共识开始变成可核对约定",
    };
  }
  if (relationType === "branch-clash"
    || relationType === "branch-punishment"
    || relationType === "branch-harm"
    || relationType === "branch-break") {
    return {
      situation: "不同节奏容易在压力里互相放大，先核对事实比立刻解释谁对谁错更重要",
      approach: "先约定分歧怎样暂停与重谈",
      conflict: "双方容易把不同节奏解释成否定",
      repair: "分清事实、影响与需要，再约定新动作",
      signal: "分歧仍在，双方却能按约定重启",
    };
  }
  return {
    situation: "现有材料没有给出单一互动结论，因此更适合从真实对话和重复行为开始观察",
    approach: "先直接说期待，再看真实回应",
    conflict: "信息不足时，猜测容易变成防御",
    repair: "回到具体事情，说明事实、影响、需要与下一步",
    signal: "双方减少猜测，并能复述对方请求",
  };
}

function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (value !== null && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child, seen);
    }
    Object.freeze(value);
  }
  return value;
}

function isInterpretationId(value: string): value is InterpretationId {
  return interpretationOrder.has(value);
}

function canonicalInterpretations<T extends { id: string }>(
  items: readonly T[],
): T[] {
  const unique = new Map<InterpretationId, T>();
  for (const item of items) {
    if (isInterpretationId(item.id) && !unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }
  return [...unique.values()].sort((left, right) =>
    interpretationOrder.get(left.id)! - interpretationOrder.get(right.id)!);
}

function actionIdsForIds(ids: readonly string[]): DetailActionId[] {
  const present = new Set(ids.filter(isInterpretationId));
  return INTERPRETATION_IDS.flatMap(id => present.has(id)
    ? [
        `${id}:actionNow` as DetailActionId,
        `${id}:actionLongTerm` as DetailActionId,
      ]
    : []);
}

export function listDetailActionIds(
  items: readonly InterpretationItem[],
): DetailActionId[] {
  return actionIdsForIds(canonicalInterpretations(items).map(item => item.id));
}

const actionOwnerSequences: readonly {
  owner: string;
  items: readonly InterpretationId[];
}[] = [
  { owner: "self", items: ["self-day-master", "self-support"] },
  { owner: "career", items: ["career-role", "career-pressure"] },
  {
    owner: "relationship",
    items: ["relationship-day-branch", "relationship-trigger"],
  },
  { owner: "rhythm", items: ["rhythm-climate"] },
  { owner: "career-entry", items: ["self-interface", "talent-public"] },
  {
    owner: "career-choice",
    items: [
      "talent-hidden",
      "talent-output",
      "career-environment",
      "wealth-structure",
      "wealth-risk",
    ],
  },
  {
    owner: "relationship-approach",
    items: ["relationship-repair", "family-resource"],
  },
  {
    owner: "relationship-boundary",
    items: ["family-year", "family-boundary", "wealth-boundary"],
  },
  { owner: "rhythm-recovery", items: ["rhythm-recovery"] },
  { owner: "rhythm-decision", items: ["rhythm-decision"] },
];

function buildActionBuckets(
  presentIds: readonly string[],
): DetailActionId[][] {
  const present = new Set(presentIds);
  return actionOwnerSequences.map(sequence =>
    sequence.items.flatMap(id => present.has(id)
      ? [
          `${id}:actionNow` as DetailActionId,
          `${id}:actionLongTerm` as DetailActionId,
        ]
      : []));
}

function buildActionSequence(
  ids: readonly DetailActionId[],
): string | null {
  if (!ids.length) return null;
  const pairs: {
    id: InterpretationId;
    now: string;
    longTerm: string;
    outcome: string;
  }[] = [];
  for (let index = 0; index < ids.length; index += 2) {
    const nowId = ids[index];
    const longTermId = ids[index + 1];
    const interpretationId = nowId.split(":")[0] as InterpretationId;
    pairs.push({
      id: interpretationId,
      now: actionSemanticFrames[nowId],
      longTerm: actionSemanticFrames[longTermId],
      outcome: actionPairOutcomes[interpretationId],
    });
  }
  const careerEntryIds = new Set<InterpretationId>([
    "self-interface",
    "talent-public",
  ]);
  if (
    pairs.length === 2
    && pairs.every(pair => careerEntryIds.has(pair.id))
  ) {
    const interfacePair = pairs.find(pair => pair.id === "self-interface")!;
    const publicPair = pairs.find(pair => pair.id === "talent-public")!;
    return `项目第一次对齐会上，人物先${interfacePair.now}，放到同一页。讨论出现分歧后，再${publicPair.now}。会后${interfacePair.longTerm}。随后六次汇报留下记录，项目结束时再${publicPair.longTerm}，只保留有效表达。`;
  }
  const careerChoiceIds = new Set<InterpretationId>([
    "talent-hidden",
    "talent-output",
    "career-environment",
    "wealth-structure",
    "wealth-risk",
  ]);
  if (pairs.length >= 3 && pairs.every(pair => careerChoiceIds.has(pair.id))) {
    return pairs.map(pair => {
      if (pair.id === "talent-hidden") {
        return `一个真实机会来到桌前，人物先把方法交给同伴试用：${pair.now}，再${pair.longTerm}。同伴能够照着完成，个人熟练才算有了现实接口。`;
      }
      if (pair.id === "talent-output") {
        return `同伴试过以后，人物${pair.now}，并${pair.longTerm}。使用者指出哪里难懂，成果便随用途改进。`;
      }
      if (pair.id === "career-environment") {
        return `进入真实协作后，人物${pair.now}，再${pair.longTerm}。环境是否合适，改由长期样本回答。`;
      }
      if (pair.id === "wealth-structure") {
        return `准备追加投入时，人物${pair.now}，按${pair.longTerm}守住基本盘，不让试验挤掉日常责任。`;
      }
      return `直到出现新证据，人物才${pair.now}，并用结果${pair.outcome}：${pair.longTerm}。`;
    }).join("");
  }
  const relationshipApproachIds = new Set<InterpretationId>([
    "relationship-repair",
    "family-resource",
  ]);
  if (
    pairs.length === 2
    && pairs.every(pair => relationshipApproachIds.has(pair.id))
  ) {
    const repair = pairs.find(pair => pair.id === "relationship-repair")!;
    const support = pairs.find(pair => pair.id === "family-resource")!;
    return `一场对话重新开始时，双方${repair.now}，随后${repair.longTerm}，把和好落到新规则。谈到帮忙时，再${support.now}，并${support.longTerm}。请求被听见，帮助也不变成长期透支。`;
  }
  const relationshipBoundaryIds = new Set<InterpretationId>([
    "family-year",
    "family-boundary",
    "wealth-boundary",
  ]);
  if (
    pairs.length === 3
    && pairs.every(pair => relationshipBoundaryIds.has(pair.id))
  ) {
    const role = pairs.find(pair => pair.id === "family-year")!;
    const boundary = pairs.find(pair => pair.id === "family-boundary")!;
    const money = pairs.find(pair => pair.id === "wealth-boundary")!;
    return `家庭分工争执暂停后，人物先${role.now}，再${role.longTerm}，让旧角色重新协商。接着${boundary.now}，并${boundary.longTerm}，让责任回到本人。若牵涉金钱，就${money.now}，随后${money.longTerm}，把善意与财务责任分清。`;
  }
  return pairs.map((pair, index) => index === 0
    ? `先处理眼前一步：${pair.now}。随后${pair.longTerm}，${pair.outcome}。`
    : `有了反馈，${pair.now}。随后${pair.longTerm}，${pair.outcome}。`
  ).join("");
}

function sceneFor(
  items: readonly Pick<InterpretationItem, "id" | "scenario">[],
  ids: readonly InterpretationId[],
  fallback: string,
): string {
  return items.find(item => ids.includes(item.id as InterpretationId))
    ?.scenario ?? fallback;
}

function buildTranslations(
  style: typeof neutralStyle,
  cue: DomainCue,
  facts: {
    monthAmbiguous: boolean;
    visibleCount: number;
    hiddenOnlyCount: number;
    absentCount: number;
    relationSituation: string;
    hourUnknown: boolean;
  },
): ChartNarrative["professionalTranslations"] {
  return [
    {
      sectionId: "overview",
      whatItMeans: `上面的表格像一张人物出场表，说明你遇到事情时较容易从“${style.opening}”开始：先用哪股劲，哪股劲要等别人提醒或事情逼近才会出来。它不是性格定论，更不是结果预告。`,
      lifeScene:
        `${style.overviewScene}到了晚上复盘，你会发现真正改变局面的不是一句“我就是这样”，而是把早上想到的办法、中午同事的反馈、家里人的提醒放在一起看；于是原本乱成一团的事，开始像小说第一章那样有主角、有阻力，也有下一步。结果仍要由现实反馈检验。`,
      practicalGuidance:
        `${style.overviewGuidance}再把这段讲给一个完全不懂的人听，能复述出来就留下，复述不出来就改成三句话清单：现在最要紧的事、最怕失控的点、明天先做的一步，并写下下一次复查时间和停止条件。`,
    },
    {
      sectionId: "month-strength",
      whatItMeans: facts.monthAmbiguous
        ? "当前环境起点尚未完全确认，因此这里只说明可能增加助力或阻力的条件，不单独判断能力高低；一个人能不能跑起来，还要看手边资源、旁边的人是否配合，以及他愿不愿意边做边改。"
        : "当前环境起点已经确认，前面的信息只描述哪些条件可能增加助力或阻力，并不能单独判断能力高低；一个人真正的表现，常常取决于任务放在什么季节、什么场子、什么人群里。",
      lifeScene: `${style.monthScene}这就像早上去市场买菜，同样的钱和同样的手艺，赶上新鲜摊位就容易做出好饭，赶上下雨收摊就要换菜单；因此看人也不能只看一句标签，要看当时的场、资源、催促和帮手。并继续接受现实反馈校验。`,
      practicalGuidance: `${style.monthGuidance}七天后复查一次，并写下保留理由。复查时不要写大词，照着小本子列三栏：什么条件帮了你、什么条件拖住你、下一次先跟谁说清楚；能讲给家里人听懂，才算这段真的读明白。`,
    },
    {
      sectionId: "element-flow",
      whatItMeans: `当前有${facts.visibleCount}类方式容易直接出现，${facts.hiddenOnlyCount}类往往在准备、协作或压力之后才被调用。可以把它理解成工具箱：有的工具放在手边，有的在抽屉里，拿不拿得出来要看场景，不等同于优点、缺点或固定能力。`,
      lifeScene: `${style.flowScene}比如客户临时改需求，你手边最顺的办法会先跳出来；同事追问细节时，抽屉里的另一套办法才被逼出来。若只看第一反应，你会误判自己“不会”；若把过程看完整，就能看见力量怎样一层一层出场，再用结果决定去留。`,
      practicalGuidance: `${style.flowGuidance}七天后复查一次。复查时做一张清单：第一反应用了什么、别人提醒后补了什么、最后真正有效的是什么；把这三句复述给朋友听，朋友听得懂，说明这段已经从抽象变成经验。`,
    },
    {
      sectionId: "relations",
      whatItMeans: `当前互动线索更接近“${facts.relationSituation}”。这像看一场多人戏：有人推门进来，有人守着旧规矩，有人想加快速度。它只提供观察靠近、错位或拉扯的入口，不代表关系好坏；同一种张力也会随沟通方式改变。`,
      lifeScene:
        `为了把“${cue.mature}”带进相处，你和同伴理解不同时，饭桌上不要急着判谁对谁错，先各自写下事实、担心和需要，再交换复述；对方听见自己被准确说出来，火气就会降一点。争论会从评价对方回到具体安排，也让双方看见仍需协商的条件和后路。`,
      practicalGuidance:
        `下一次分歧做一次二十分钟核对：先说事实，再说影响，最后确认一项共同动作；把结论写成一句话贴在聊天框里，第二天能照着复述，也能照做落实。然后一周后再看“${cue.strength}”有没有帮助双方执行约定。`,
    },
    {
      sectionId: "missing-elements",
      whatItMeans: `当前有${facts.absentCount}类方式在稳定柱中完全未见，只表示可确认的信息有限，并不等于人生缺陷，也不自动指向某种补救。更像一张菜谱少写了几味调料：先确认家里有没有、这道菜需不需要，再决定要不要添。${facts.hourUnknown ? "具体时段尚未确认，当前名单仍可能改变。" : "已列时段也只能作为观察起点。"}`,
      lifeScene:
        `你发现某类任务总要借助别人时，别急着说自己缺什么。比如同事做表快、你讲方案清楚，分工本来就可能互补；家里修东西你不会，找师傅也不是失败。先观察是经验不足、资源不到位还是分工本就合理；这样既不把一次困难变成自我否定，也能让“${cue.mature}”落到现实。`,
      practicalGuidance:
        `用七天记录一次真实卡点，写下任务要求、已有资源和可求助对象；只补齐一个现实条件。然后把这件事讲给市场摊主都能听懂：我卡在哪、能找谁、明天先补哪一环，并警惕“${cue.risk}”把暂时困难解释成固定缺陷。`,
    },
  ];
}

type BeatConfig = {
  scene: string;
  aim: string;
  strength: string;
  cost: string;
  lowPoint: string;
  reset: string;
  result: string;
  signal: string;
  review: string;
  noRecordExperiment: string;
};

function completeSentence(value: string): string {
  const trimmed = value.trim();
  return /[。！？]$/u.test(trimmed) ? trimmed : `${trimmed}。`;
}

function buildBeat(
  config: BeatConfig,
  sourceActionIds: readonly DetailActionId[],
  prefix = "",
): NarrativeBeat {
  const consumed = buildActionSequence(sourceActionIds);
  return {
    situation: `${prefix}${completeSentence(config.scene)}`,
    opportunity: completeSentence(`机会在于${config.aim}`),
    firstStrength: completeSentence(config.strength),
    overuseCost: completeSentence(`若用过头，${config.cost}`),
    lowPoint: completeSentence(`低点可能是${config.lowPoint}`),
    newChoice: consumed
      ? `转折动作是：${config.reset}。${consumed}完成后再看结果。`
      : `${completeSentence(`转折动作是：${config.reset}`)}${completeSentence(
        config.noRecordExperiment,
      )}`,
    turn: completeSentence(config.result),
    observableSignal:
      `${completeSentence(config.signal)}${completeSentence(config.review)}`,
    sourceActionIds,
  };
}

type MicroConfig<TScene extends string> = {
  id: string;
  covers: readonly TScene[];
  title: string;
  trigger: string;
  reaction: string;
  benefit: string;
  cost: string;
  turn: string;
  example: string;
  signal: string;
  review: string;
  noRecordExperiment: string;
};

function buildMicroStory<TScene extends string>(
  config: MicroConfig<TScene>,
  sourceActionIds: readonly DetailActionId[],
): SceneMicroStory<TScene> {
  const consumed = buildActionSequence(sourceActionIds);
  return {
    id: config.id,
    covers: config.covers,
    title: config.title,
    trigger: completeSentence(config.trigger),
    firstReaction: completeSentence(config.reaction),
    apparentBenefit: completeSentence(config.benefit),
    cost: completeSentence(config.cost),
    turnAction: consumed
      ? `${completeSentence(config.turn)}${consumed}`
      : `${completeSentence(config.turn)}${completeSentence(
        config.noRecordExperiment,
      )}`,
    example: completeSentence(config.example),
    observableSignal:
      `${completeSentence(config.signal)}${completeSentence(config.review)}`,
    sourceActionIds,
  };
}

export function buildChartNarrative(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
  items: readonly InterpretationItem[],
): ChartNarrative {
  assertMatchingChartReport(chart, report);
  const stable = selectStableStoryFacts(chart, report, items);
  const interpretations = canonicalInterpretations(stable.interpretations);
  const style = stable.dayMasterElement
    ? elementStoryStyle[stable.dayMasterElement]
    : neutralStyle;
  const cue = stable.dayMasterElement
    ? elementDomainCues[stable.dayMasterElement]
    : neutralDomainCue;
  const relationshipReviewTexture = stable.dayMasterElement
    ? relationshipReviewTextures[stable.dayMasterElement]
    : "事实是否比猜测更清楚";
  const actionIds = actionIdsForIds(interpretations.map(item => item.id));
  const actionBuckets = buildActionBuckets(
    interpretations.map(item => item.id),
  );
  const relation = relationStoryFrame(stable.relations[0]?.type ?? null);
  const visibility = buildChartElementVisibility(chart, report);
  const structure = stable.structureBalance
    ? structureStoryStyles[stable.structureBalance]
    : neutralStructureStyle;
  const visibilityCue = visibility.hiddenOnlyElements.length
    ? `${visibility.visibleElements.length}类做法可直接启动，${visibility.hiddenOnlyElements.length}类要在协作或压力后调用`
    : `${visibility.visibleElements.length}类做法可直接启动，其余路径要靠现实检验`;
  const unknownSentence = stable.hourUnknown
    ? "出生时间没有确认，与具体时段有关的内容暂时留白。"
    : "";
  const missingSentence = interpretations.length === 0
    ? "稳定材料不足时，这一卷只保留通用观察，不把任何场景当成已经发生的个人经历。"
    : "";

  const selfScene = sceneFor(
    interpretations,
    ["self-day-master", "self-support", "self-interface"],
    "当几项责任同时来到眼前时，你可能先抓住最能控制的一件事，再逐步确认其余条件。",
  );
  const careerScene = sceneFor(
    interpretations,
    ["career-role", "career-pressure", "career-environment"],
    "当新任务的目标、权限和期限还没说清时，你可能先动手推进，再从反馈里补齐条件。",
  );
  const relationshipScene = sceneFor(
    interpretations,
    ["relationship-day-branch", "relationship-trigger", "relationship-repair"],
    "当双方对同一安排有不同理解时，你可能先解释自己的用意，却还没有确认对方真正听见了什么。",
  );
  const rhythmScene = sceneFor(
    interpretations,
    ["rhythm-climate", "rhythm-recovery", "rhythm-decision"],
    "当任务连续叠加时，你可能靠惯性继续推进，直到专注、耐心或恢复速度开始明显下降。",
  );
  const relationshipRequestScene = sceneFor(
    interpretations,
    ["relationship-repair", "family-resource"],
    "一项相处安排没有得到回应时，一个人先说看见的事实和自己的需要，再提出对方可以直接回答的请求。",
  );

  const self = buildBeat({
    scene: selfScene,
    aim: `自己想守住什么，以及如何${cue.mature}`,
    strength: cue.strength,
    cost: cue.risk,
    lowPoint: "疲惫与误解会把一次局部判断放大成整体结论",
    reset: "核对反证与当前可用方法，再决定原判断保留多少",
    result: "判断有了复查点，主见仍保留也能修正",
    signal: "能说出反证，也能指出下一次复查点",
    review: "双周复盘时比较原判断、反证和实际后果",
    noRecordExperiment: "先在一项低风险判断中写下原结论、一个反证和复查日期",
  }, actionBuckets[0], `${unknownSentence}${missingSentence}人物通常会${cue.opening}。${visibilityCue}。`);

  const career = buildBeat({
    scene: careerScene,
    aim: `${structure.opportunity}，再确认职责与标准`,
    strength: `${style.opening}，再确认交付对象和关键条件`,
    cost: structure.overload,
    lowPoint: "职责空白把延期与返工同时推高",
    reset: "核对职责、权限与验收条件，写清负责人和停止点",
    result: "责任与验收写进同一张清单，团队据此协作",
    signal: `返工下降，“${structure.opportunity}”对应一项交付`,
    review: "两次交付后比较返工次数、责任空白和完成标准",
    noRecordExperiment: "先选一项小任务写清责任、权限和验收人，交付后再看返工是否下降",
  }, actionBuckets[1]);

  const relationship = buildBeat({
    scene: `${relationshipScene}${relation.situation}。人物先停下解释，确认对方真正听见了什么。`,
    aim: `${relation.approach}，也把“${cue.mature}”带进相处`,
    strength: `${cue.strength}，同时暂停自证，把彼此带回具体事情`,
    cost:
      `${relation.conflict}。误会继续累积时，也要留意这项旧代价：${cue.risk}`,
    lowPoint: "双方越想证明自己没有错，越难听见对方真正要守住的部分",
    reset: `核对事实、请求与回应，再按这条路径修复：${relation.repair}`,
    result: "双方先复述对方请求，再执行一项新约定；关系不必马上完美，却多了一条可以重复使用的路径",
    signal: "双方能复述请求，并执行一项新约定",
    review:
      `下一次分歧后复盘${relationshipReviewTexture}，再看双方能否执行新约定`,
    noRecordExperiment: "先用一场二十分钟对话核对事实与请求，结束前约定重谈时间",
  }, actionBuckets[2]);

  const rhythm = buildBeat({
    scene: `${rhythmScene}${structure.rhythmWarning}。`,
    aim: `${structure.decision}，并看清高质量时段与过载信号`,
    strength: `${cue.strength}，再把可用精力留给关键任务`,
    cost:
      `负荷持续叠加；若复盘仍看不见“${structure.decisionProof}”，判断会在疲惫中启动`,
    lowPoint: "结束信号被一再延后，专注、耐心和恢复速度可能一起下降",
    reset: `核对负荷、恢复与结束信号，再按这条顺序行动：${structure.recovery}`,
    result: "任务减量之后，人物开始按记录调速",
    signal: "连续两周能按预定时间结束工作，并在资料截止后完成一次可撤回的决定",
    review: structure.rhythmReview,
    noRecordExperiment: "先连续七天记录开始、过载和停止时刻，只调整最影响恢复的一项安排",
  }, actionBuckets[3]);

  const careerAdvice: ChartNarrative["careerAdvice"] = [
    buildMicroStory({
      id: "career-entry-collaboration",
      covers: ["task-entry", "collaboration-conflict"],
      title: "先把角色说清，再把分歧摆上桌",
      trigger:
        "新角色的第一次项目对齐会上，团队对负责人、决定权限和完成标准各有理解",
      reaction: `先按“${cue.opening}”补空白，以速度换确定`,
      benefit: "项目很快有第一版，暂时摆脱停滞",
      cost: `责任与验收仍模糊，${structure.overload}`,
      turn: "写清目标、负责人、权限和验收人",
      example:
        `这场会结束前，同伴补齐遗漏，负责人、权限与验收时间落在同一页，并把“${cue.mature}”写进下次复查；第一版没有继续扩大返工。`,
      signal: "会后任务有唯一负责人，下一次对齐不再争论谁该知道",
      review:
        `复查时看角色、权限和验收是否对齐，也检查第一版是否因为“${cue.risk}”增加返工。`,
      noRecordExperiment:
        "先挑一项新任务，只记录谁决定、谁执行和谁验收；交付后再比较责任空白和返工次数。",
    }, actionBuckets[4]),
    buildMicroStory({
      id: "career-choice-accumulation",
      covers: ["opportunity-choice", "long-accumulation"],
      title: "机会先小试，能力靠长期留下可以复查的现实证据",
      trigger: "新机会诱人，或长期积累缺少反馈",
      reaction:
        `要么全力投入，要么等待完整把握；这时要把“${cue.mature}”写进选择过程`,
      benefit: "全力投入带来启动感，等待暂避失败风险",
      cost: `没有试验上限，${structure.overload}`,
      turn: `${structure.decision}，再限定试验额度`,
      example: sceneFor(
        interpretations,
        ["career-environment", "wealth-risk", "talent-output"],
        "两个机会同时出现时，一个人先给试验写下时间上限和停止条件；一周后再用新增事实决定保留哪一项。",
      ),
      signal: "每次追加投入前都有新证据，并能说明试验为何继续",
      review:
        "复查时比较投入前后的新证据、额度和退出条件。",
      noRecordExperiment:
        "先给一个小机会设七天期限，到期列出新增事实、实际投入与退出代价，只按记录决定去留。",
    }, actionBuckets[5]),
  ];

  const relationshipAdvice: ChartNarrative["relationshipAdvice"] = [
    buildMicroStory({
      id: "relationship-approach-misunderstanding",
      covers: ["approach", "misunderstanding"],
      title: "靠近之前先说期待，误会出现先核事实",
      trigger:
        `你希望获得陪伴或回应，却还没有把期待说成对方能直接回答的请求；此刻容易把“${cue.opening}”当成直接开口的替代`,
      reaction:
        `用暗示或试探来确认自己是否被重视，再借“${cue.strength}”撑住不确定`,
      benefit: "不用直接暴露需要，短期也能避免听见一个不确定答案",
      cost:
        `对方只能回应动作，真正的期待仍没有进入对话，还会放大“${cue.risk}”的代价`,
      turn: "说清事实、感受、需要与请求，再请对方复述理解",
      example:
        `${relationshipRequestScene}对话里再请双方各复述一次，回应不必继续靠猜。`,
      signal: relation.signal,
      review:
        `复查时直接核对：${relationshipReviewTexture}；不再用对方的语气替真实回应下结论。`,
      noRecordExperiment:
        "选一次低风险对话，只记录请求、对方复述和实际回应。",
    }, actionBuckets[6]),
    buildMicroStory({
      id: "relationship-conflict-repair-boundary",
      covers: ["argument", "repair", "boundary"],
      title: "争执可以暂停，修复必须落到新规则",
      trigger:
        `同一冲突再次出现，情绪和责任已经纠缠在一起；人物又想沿着“${cue.opening}”尽快收场`,
      reaction:
        `急着证明自己的解释完整，或为了恢复平静先答应以后注意，再用“${cue.strength}”维持表面秩序`,
      benefit: "争论暂时有了出口，表面关系也可能很快恢复日常",
      cost:
        `触发、影响和责任未重排，同一争执仍会回来；旧代价也会重现：${cue.risk}`,
      turn:
        `分开事实、影响和各自责任，再把“${relationshipReviewTexture}”落实成暂停信号、恢复时间和一项边界`,
      example: sceneFor(
        interpretations,
        ["relationship-trigger", "relationship-repair", "family-boundary"],
        "同一争执再次出现时，双方先暂停十分钟，再各自复述事实、影响和能承担的一步；谈话因此没有回到旧指责。",
      ),
      signal: "暂停后能按约定时间重谈，并确认一项新规则",
      review:
        "复查时看重谈是否按时发生，新规则是否真正执行。",
      noRecordExperiment:
        "先约一次暂停和重谈时间，只检查新约定有没有真正执行。",
    }, actionBuckets[7]),
  ];

  const rhythmAdvice: ChartNarrative["rhythmAdvice"] = [
    buildMicroStory({
      id: "rhythm-window-overload-pause",
      covers: ["productive-window", "overload-signal", "pause"],
      title: "高效留给重点，过载便降档",
      trigger: `任务变密、清醒时段变少，${structure.rhythmWarning}`,
      reaction: "把更多事项塞进高效时段并延长工作",
      benefit: "关键进度短期上升，数量带来掌控感",
      cost: "休息被不断推迟，第二天的判断开始借用尚未恢复的精力",
      turn: `${structure.recoveryExperiment}，再连续七天记录专注时段和过载信号`,
      example:
        `下午注意力开始下降时，一个人先执行“${structure.recoveryExperiment}”里的第一步，并记录结束时间；第二天再把清醒时段留给唯一重点。`,
      signal: `重点任务在固定时段完成，并能看见“${structure.recovery}”带来的变化`,
      review: structure.recoveryReview,
      noRecordExperiment:
        "先连续七天只记录开始、过载和停止三个时刻，再调整任务量。",
    }, actionBuckets[8]),
    buildMicroStory({
      id: "rhythm-restart-decision",
      covers: ["restart", "decision-window"],
      title: "小步重启，决定设门槛",
      trigger: `密集阶段刚结束，或信息已经多到难以排序；${structure.decisionExperiment}`,
      reaction:
        `要么马上恢复强度，要么等待完全有把握，仿佛不做到“${cue.mature}”就不能开始`,
      benefit: "立即加速能延续成就感，等待也暂时避开选错焦虑",
      cost: "身体和注意力可能还未归位，重新加量会把上一轮疲惫带进下一轮",
      turn: `${structure.decisionExperiment}，再恢复一个稳定作息并标记复查日期`,
      example: sceneFor(
        interpretations,
        ["rhythm-recovery", "rhythm-decision"],
        "密集任务结束后的第一天，一个人只恢复一项固定作息，并把重大决定推到睡眠恢复后；第二次检查时再决定是否加量。",
      ),
      signal: `重新加量后仍能保持基本作息；${structure.decisionProof}`,
      review: structure.decisionReview,
      noRecordExperiment:
        "先恢复一个固定作息并设三天复查点，不同时增加第二项负荷。",
    }, actionBuckets[9]),
  ];

  const coveredDetailActionIds = [
    ...self.sourceActionIds,
    ...career.sourceActionIds,
    ...relationship.sourceActionIds,
    ...rhythm.sourceActionIds,
    ...careerAdvice.flatMap(story => story.sourceActionIds),
    ...relationshipAdvice.flatMap(story => story.sourceActionIds),
    ...rhythmAdvice.flatMap(story => story.sourceActionIds),
  ];

  return deepFreeze({
    professionalTranslations: buildTranslations(style, cue, {
      monthAmbiguous: report.monthCommand.ambiguous,
      visibleCount: visibility.visibleElements.length,
      hiddenOnlyCount: visibility.hiddenOnlyElements.length,
      absentCount: visibility.absentInStablePillars.length,
      relationSituation: relation.situation,
      hourUnknown: visibility.hourUnknown,
    }),
    self,
    career,
    relationship,
    rhythm,
    careerAdvice,
    relationshipAdvice,
    rhythmAdvice,
    coveredDetailActionIds,
    internalActionFrames: actionIds.map(id => ({
      id,
      frame: actionSemanticFrames[id],
    })),
    internalEvidenceIds: interpretations.map(item => item.id),
    uncertaintyFlags: [
      ...stable.uncertaintyFlags,
      ...(interpretations.length === 0 ? ["missing-material"] : []),
    ],
  });
}

export function buildChartElementVisibility(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
): ChartElementVisibility {
  assertMatchingChartReport(chart, report);
  const excluded = new Set<PillarKey>(chart.ambiguousPillars);
  if (chart.professional.ambiguousFields.includes("dayMaster")
    || chart.professional.ambiguousFields.includes("dayPillar")) {
    excluded.add("day");
  }
  const stablePillars = report.pillarFacts.filter(
    pillar => !excluded.has(pillar.key),
  );
  const visible = new Set<ElementName>();
  const hidden = new Set<ElementName>();
  for (const pillar of stablePillars) {
    visible.add(pillar.stemElement);
    visible.add(pillar.branchElement);
    for (const item of pillar.hiddenStems) {
      const element = stemElements[item.stem];
      if (element) hidden.add(element);
    }
  }
  return deepFreeze({
    visibleElements: elementOrder.filter(element => visible.has(element)),
    hiddenOnlyElements: elementOrder.filter(
      element => hidden.has(element) && !visible.has(element),
    ),
    absentInStablePillars: elementOrder.filter(
      element => !visible.has(element) && !hidden.has(element),
    ),
    hourUnknown: chart.pillars.hour === null
      || chart.ambiguousPillars.includes("hour"),
  });
}
