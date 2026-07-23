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
  "wealth-risk:actionLongTerm": "记录五次机会决定再考虑追加",
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

const elementStoryStyle: Record<
  ElementName,
  { opening: string; strength: string; risk: string; mature: string }
> = {
  木: {
    opening: "先从混乱里搭出方向，再让做法逐步生长",
    strength: "愿意先立起骨架，并给后来的人留下可以继续推进的入口",
    risk: "方向一旦立住，容易晚一步听见条件已经改变",
    mature: "把坚持变成有复查点的长期建设",
  },
  火: {
    opening: "先把重点照亮，让身边的人看见为何值得行动",
    strength: "能迅速聚拢注意力，把模糊问题转成大家愿意讨论的主题",
    risk: "亮度和速度同时上升时，容易让尚未准备好的人只感到压力",
    mature: "把热度变成可持续的节拍和清楚邀请",
  },
  土: {
    opening: "先稳住责任与次序，再把零散条件一项项接住",
    strength: "能在局面摇摆时建立可靠坐标，让事情不至于失去承接",
    risk: "为了维持稳定，容易把本该协商的变化继续揽在自己身上",
    mature: "把可靠变成边界清楚的共同承担",
  },
  金: {
    opening: "先切开混乱、划清标准，再决定哪一步值得推进",
    strength: "能快速辨认关键差异，把含糊要求整理成可以复核的结果",
    risk: "标准收得太快时，容易漏掉过渡、解释与共同适应的成本",
    mature: "让清楚的标准同时保留修正入口",
  },
  水: {
    opening: "先汇集信号、连接不同位置，再寻找真正能流动的通道",
    strength: "能在变化中保留多个视角，把分散信息带回一条主线",
    risk: "选择持续增加时，主线容易被新鲜信息带散",
    mature: "让开放与停止规则同时存在",
  },
};

const neutralStyle = {
  opening: "先核对眼前事实，再决定下一步怎样推进",
  strength: "愿意在行动前看清条件，也给不同意见留下进入空间",
  risk: "若急着获得确定感，仍可能把第一种解释当成全部事实",
  mature: "把判断写成可以复查和修改的行动",
};

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

const actionOwnerItems: readonly (readonly InterpretationId[])[] = [
  ["self-day-master", "self-support"],
  ["career-role", "career-pressure"],
  ["relationship-day-branch", "relationship-trigger"],
  ["rhythm-climate", "rhythm-recovery"],
  ["self-interface", "talent-public"],
  ["talent-hidden", "talent-output", "career-environment"],
  ["relationship-repair", "family-resource"],
  ["family-year", "family-boundary"],
  ["wealth-structure", "wealth-boundary"],
  ["wealth-risk", "rhythm-decision"],
];

function buildActionBuckets(
  presentIds: readonly string[],
): DetailActionId[][] {
  const present = new Set(presentIds);
  return actionOwnerItems.map(ids =>
    actionIdsForIds(ids.filter(id => present.has(id))));
}

function consumedActionText(
  ids: readonly DetailActionId[],
): string | null {
  return ids.length
    ? ids.map(id => actionSemanticFrames[id]).join("；")
    : null;
}

function sceneFor(
  items: readonly Pick<InterpretationItem, "id" | "scenario">[],
  ids: readonly InterpretationId[],
  fallback: string,
): string {
  return items.find(item => ids.includes(item.id as InterpretationId))
    ?.scenario ?? fallback;
}

function relationSituation(
  relationType: FourPillarsResult["professional"]["relations"][number]["type"]
    | null,
): string {
  if (relationType === "stem-combination"
    || relationType === "branch-combination"
    || relationType === "branch-trine") {
    return "彼此容易迅速形成共同方向，也更需要把责任、期限和退出条件补写完整";
  }
  if (relationType === "branch-clash"
    || relationType === "branch-punishment"
    || relationType === "branch-harm"
    || relationType === "branch-break") {
    return "不同节奏容易在压力里互相放大，先核对事实比立刻解释谁对谁错更重要";
  }
  return "现有材料没有给出单一互动结论，因此更适合从真实对话和重复行为开始观察";
}

function buildTranslations(
  style: typeof neutralStyle,
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
      whatItMeans: `前面的排列只是在说明，你面对任务时较容易从“${style.opening}”开始，也有一些部分必须借助现实反馈才能确认。它不是性格定论，更不是结果预告。`,
      lifeScene: "你接到一个目标模糊的新任务时，可能先按熟悉方式搭出框架，再邀请同伴复述目标；这样能迅速形成起点，也让遗漏条件在投入扩大前被看见。",
      practicalGuidance: "本周选一件正在推进的事，只记录最先采取的动作、别人给出的反馈和一次修正；七天后再判断这套起步方式在哪些场景真正有效。",
    },
    {
      sectionId: "month-strength",
      whatItMeans: facts.monthAmbiguous
        ? "当前环境起点尚未完全确认，因此这里只说明可能增加助力或阻力的条件，不单独判断能力高低；真正表现仍取决于任务、资源和持续反馈。"
        : "当前环境起点已经确认，前面的信息只描述哪些条件可能增加助力或阻力，并不能单独判断能力高低；真正表现仍取决于任务、资源和持续反馈。",
      lifeScene: "你在规则清楚、责任明确的团队里先确认目标和权限，事情便容易进入稳定节奏；若换到要求频繁变化的环境却仍照旧推进，返工会让精力很快被消耗。",
      practicalGuidance: "用两周比较一项顺利任务和一项吃力任务，各写三项环境条件、一次求助和最终结果；只调整影响最大的一个条件，再观察变化。",
    },
    {
      sectionId: "element-flow",
      whatItMeans: `当前有${facts.visibleCount}类方式容易直接出现，${facts.hiddenOnlyCount}类往往在准备、协作或压力之后才被调用。数量多少只是可见程度，不等同于优点、缺点或固定能力。`,
      lifeScene: "你处理一个跨部门项目时，先用最熟练的方式打开局面，再请一位同伴承担自己不常使用的步骤；这样既保住速度，也让单一路径造成的遗漏及时显现。",
      practicalGuidance: "本周挑一件卡住的事，列出已经反复使用的一种办法和从未尝试的一种办法；做一次低成本试验，只用结果决定是否继续。",
    },
    {
      sectionId: "relations",
      whatItMeans: `当前互动线索更接近“${facts.relationSituation}”。它只提供观察靠近、错位或拉扯的入口，不代表关系好坏；同一种张力也会随沟通方式改变。`,
      lifeScene: "你和同伴对同一件事理解不同时，先各自写下事实、担心和需要，再交换复述；于是争论从评价对方转回具体安排，也让真正不能让步的条件被看见。",
      practicalGuidance: "下一次分歧只做一次二十分钟核对：先说事实，再说影响，最后确认一项共同动作；一周后看约定是否真的执行，再决定下一步。",
    },
    {
      sectionId: "missing-elements",
      whatItMeans: `当前有${facts.absentCount}类方式未直接出现，只表示可确认的信息有限，并不等于人生缺陷，也不自动指向某种补救。${facts.hourUnknown ? "具体时段尚未确认，当前名单仍可能改变。" : "已列时段也只能作为观察起点。"}`,
      lifeScene: "你发现某类任务总要借助别人才能完成时，先观察是经验不足、资源不到位还是分工本就合理；因此能避免把一次困难变成自我否定，也能找到真正需要调整的环节。",
      practicalGuidance: "用七天记录一次真实卡点，分别写下任务要求、已有资源和可求助对象；只补齐一个现实条件，不购买象征物，也不据此作重大决定。",
    },
  ];
}

type BeatConfig = {
  scene: string;
  aim: string;
  strength: string;
  cost: string;
  reset: string;
  result: string;
  signal: string;
};

function buildBeat(
  config: BeatConfig,
  style: typeof neutralStyle,
  sourceActionIds: readonly DetailActionId[],
  prefix = "",
): NarrativeBeat {
  const consumed = consumedActionText(sourceActionIds);
  return {
    situation: `${prefix}${config.scene}人物会先寻找一个可控制的入口。`,
    opportunity: `机会不在证明自己正确，而在看清${config.aim}，把压力改写成可讨论的条件。`,
    firstStrength: `最先派上用场的是${config.strength}；它能让事情脱离停滞，也让相关的人知道下一步可以从哪里开始。`,
    overuseCost: `可是同一种力量用得过久，${config.cost}；表面仍在推进，重要反馈却会逐渐失去进入决定的空间。`,
    lowPoint: "若人物继续只靠原来的速度撑住局面，疲惫、误解和返工可能同时累积，眼前的小问题便容易被解释成无法改变的困境。",
    newChoice: consumed
      ? `转折来自几个可执行动作：${consumed}。先做完再决定是否加大投入。`
      : `转折来自一个更小也更具体的选择：${config.reset}，先让事实、边界和下一步重新对齐，再决定是否加大投入。`,
    turn: `这样做之后，${config.result}。变化不是突然逆转，而是每次核对都让人物少一点猜测，多一点可以共同确认的进展。`,
    observableSignal: `${config.signal}；连续记录两周，若这个信号稳定出现，才把它视为新方法正在发挥作用。`,
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
};

function buildMicroStory<TScene extends string>(
  config: MicroConfig<TScene>,
  sourceActionIds: readonly DetailActionId[],
): SceneMicroStory<TScene> {
  const consumed = consumedActionText(sourceActionIds);
  return {
    id: config.id,
    covers: config.covers,
    title: config.title,
    trigger: `${config.trigger}时，先分清容量与限制。`,
    firstReaction: `第一反应往往是${config.reaction}。它能暂时减少不确定，也会延续惯性。`,
    apparentBenefit: `短期好处是${config.benefit}，身边的人也能看到明确动作。`,
    cost: `代价在于${config.cost}；没有复查点，解决问题的力量也会变成消耗。`,
    turnAction: consumed
      ? `转弯动作是：${consumed}。做完再按结果决定继续或暂停。`
      : `转弯动作是${config.turn}。做完再按结果决定继续或暂停。`,
    example: `${config.example}这一幕连起行动、反馈与后果。`,
    observableSignal: `${config.signal}。只看记录，不凭一次结果下结论。`,
    sourceActionIds,
  };
}

export function buildChartNarrative(
  chart: Readonly<FourPillarsResult>,
  report: Readonly<ProfessionalReport>,
  items: readonly InterpretationItem[],
): ChartNarrative {
  const stable = selectStableStoryFacts(chart, report, items);
  const interpretations = canonicalInterpretations(stable.interpretations);
  const style = stable.dayMasterElement
    ? elementStoryStyle[stable.dayMasterElement]
    : neutralStyle;
  const actionIds = actionIdsForIds(interpretations.map(item => item.id));
  const actionBuckets = buildActionBuckets(
    interpretations.map(item => item.id),
  );
  const relation = relationSituation(stable.relations[0]?.type ?? null);
  const visibility = buildChartElementVisibility(chart, report);
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

  const self = buildBeat({
    scene: selfScene,
    aim: "自己真正想守住什么、哪些判断仍需外部校准",
    strength: style.strength,
    cost: style.risk,
    reset: "写下当前事实、第一种解释和一个可能推翻解释的反例",
    result: "主见仍然保留，却不再需要靠排除不同意见来维持",
    signal: "重要决定前能说出一条反证，并在听见新事实后主动修正",
  }, style, actionBuckets[0], `${unknownSentence}${missingSentence}人物通常会${style.opening}。`);

  const career = buildBeat({
    scene: careerScene,
    aim: "职责、权限、协作对象和完成标准是否真的一致",
    strength: `${style.opening}，并把散乱任务带回一条可执行主线`,
    cost: "为了显得可靠而接住过多责任，协作者反而看不见真正的风险与依赖",
    reset: "把目标、负责人、最晚确认点和停止条件写在同一页上",
    result: "团队开始围绕同一份现实清单协作，问题也能在最后期限之前暴露",
    signal: "返工次数下降，关键依赖能在承诺交付前被负责人明确确认",
  }, style, actionBuckets[1]);

  const relationship = buildBeat({
    scene: `${relationshipScene}${relation}`,
    aim: "事实、感受、需要与请求是否被双方分别说清",
    strength: "愿意维持连接，并试着让彼此重新回到同一件具体事情上",
    cost: "若急着消除不舒服，解释会快过倾听，善意也可能被对方体验成压力",
    reset: "先暂停评价，轮流复述对方的话，再只确认一个双方同意的新动作",
    result: "关系不必马上恢复完美，却多了一条可以重复使用的修复路径",
    signal: "分歧后能在约定时间重启对话，并准确复述对方真正提出的需要",
  }, style, actionBuckets[2]);

  const rhythm = buildBeat({
    scene: rhythmScene,
    aim: "高质量时段、过载信号和恢复所需的真实时间",
    strength: "能在重要阶段集中投入，把有限精力压到最关键的任务上",
    cost: "兴奋或责任感可能掩盖恢复尚未完成，下一轮判断便在疲惫中启动",
    reset: "减少并行事项，保留一个重点，并为暂停和重新加量预设条件",
    result: "人物不再用意志硬撑所有阶段，而是开始按记录调整速度",
    signal: "连续两周能按预定时间结束工作，重点任务完成率上升且恢复时间缩短",
  }, style, actionBuckets[3]);

  const careerAdvice: ChartNarrative["careerAdvice"] = [
    buildMicroStory({
      id: "career-entry-collaboration",
      covers: ["task-entry", "collaboration-conflict"],
      title: "先把角色说清，再把分歧摆上桌",
      trigger: "刚接下新角色，或多人对同一任务各有理解",
      reaction: "先用自己熟悉的方式补上空白，希望以速度换来确定",
      benefit: "项目很快有了第一版，团队也暂时摆脱没人开头的停滞",
      cost: "责任、权限和验收口径仍然模糊，后来每次分歧都会重新回到个人身上",
      turn: "用一页纸确认目标、负责人、权限和验收人，再请持不同意见者补充风险",
      example: careerScene,
      signal: "会议结束后每项任务都有唯一负责人，下一次复盘不再争论谁原本应该知道",
    }, actionBuckets[4]),
    buildMicroStory({
      id: "career-choice-accumulation",
      covers: ["opportunity-choice", "long-accumulation"],
      title: "机会先小试，能力靠长期留下证据",
      trigger: "一个新机会很诱人，或长期积累迟迟看不到外部反馈",
      reaction: "要么立刻投入全部精力，要么继续等待更完整的把握",
      benefit: "全力投入带来强烈启动感，继续准备也能暂时避开失败风险",
      cost: "没有试验上限和复盘日期，热情会稀释原有承诺，准备也会变成无限延期",
      turn: "限定一笔可承受投入，写清成功信号和退出条件，同时保留原有基本盘",
      example: sceneFor(
        interpretations,
        ["career-environment", "wealth-risk", "talent-output"],
        careerScene,
      ),
      signal: "每次追加投入前都有新的现实证据，三个月后还能清楚说明能力怎样被重复使用",
    }, actionBuckets[5]),
  ];

  const relationshipAdvice: ChartNarrative["relationshipAdvice"] = [
    buildMicroStory({
      id: "relationship-approach-misunderstanding",
      covers: ["approach", "misunderstanding"],
      title: "靠近之前先说期待，误会出现先核事实",
      trigger: "你希望获得陪伴、回应或更明确承诺",
      reaction: "用暗示、试探或加快安排来确认自己是否被重视",
      benefit: "不用直接暴露需要，短期也能避免听见一个不确定答案",
      cost: "对方只能回应表面动作，期待落空后，普通差异就容易被解释成不在乎",
      turn: "用四句话依次说明事实、感受、需要和请求，再请对方复述理解",
      example: relationshipScene,
      signal: "双方都能说出对方的具体请求，下一次安排不再依靠猜测或临时测试",
    }, actionBuckets[6]),
    buildMicroStory({
      id: "relationship-conflict-repair-boundary",
      covers: ["argument", "repair", "boundary"],
      title: "争执可以暂停，修复必须落到新规则",
      trigger: "同一冲突再次出现，情绪和责任已经纠缠在一起",
      reaction: "急着证明自己的解释完整，或为了恢复平静先答应以后注意",
      benefit: "争论暂时有了出口，表面关系也可能很快恢复日常",
      cost: "触发、影响和责任没有被重新安排，同样的问题会换个场景再次回来",
      turn: "约定暂停信号、恢复时间和一项边界，并在一周后核对是否真正执行",
      example: sceneFor(
        interpretations,
        ["relationship-trigger", "relationship-repair", "family-boundary"],
        relationshipScene,
      ),
      signal: "冲突升级前能主动暂停，重启后只讨论具体行为，并且约定的一项改变能够被看见",
    }, actionBuckets[7]),
  ];

  const rhythmAdvice: ChartNarrative["rhythmAdvice"] = [
    buildMicroStory({
      id: "rhythm-window-overload-pause",
      covers: ["productive-window", "overload-signal", "pause"],
      title: "高效留给重点，过载便降档",
      trigger: "任务变密，而清醒时段变得有限",
      reaction: "把更多事项塞进高效时段，再延长工作",
      benefit: "关键进度短期上升，完成数量也带来掌控感",
      cost: "休息被不断推迟，判断和耐心先于体力下降，返工随后吃掉原本抢出的时间",
      turn: "连续七天记录专注时段和结束信号，只保留三项承诺，过载时先暂停新增任务",
      example: rhythmScene,
      signal: "重点任务在固定时段完成，结束工作后仍有稳定恢复，而不是靠第二天继续偿还疲惫",
    }, actionBuckets[8]),
    buildMicroStory({
      id: "rhythm-restart-decision",
      covers: ["restart", "decision-window"],
      title: "小步重启，决定设门槛",
      trigger: "密集阶段刚结束，或重要决定已有大量信息",
      reaction: "要么马上恢复强度，要么等待完全有把握",
      benefit: "立即加速能延续成就感，等待也暂时避开选错焦虑",
      cost: "身体和注意力可能还未归位，新资料也未必继续改变结论，拖延与冒进因而同时出现",
      turn: "先恢复一个稳定作息，再为决定写下三项必要证据、可逆步骤和复查日期",
      example: sceneFor(
        interpretations,
        ["rhythm-recovery", "rhythm-decision"],
        rhythmScene,
      ),
      signal: "重新加量后两周仍能保持基本作息，决定也能说明依据、剩余未知和撤回条件",
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
    professionalTranslations: buildTranslations(style, {
      monthAmbiguous: report.monthCommand.ambiguous,
      visibleCount: visibility.visibleElements.length,
      hiddenOnlyCount: visibility.hiddenOnlyElements.length,
      absentCount: visibility.absentInStablePillars.length,
      relationSituation: relation,
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
