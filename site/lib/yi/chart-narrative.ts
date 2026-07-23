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

type DomainCue = typeof neutralStyle;

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

type StructureStoryStyle = {
  opportunity: string;
  overload: string;
  recovery: string;
  decision: string;
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
  },
  mixed: {
    opportunity: "多个方向都有理由时先排主次",
    overload: "反复平衡会让忙碌失去主线",
    recovery: "先固定一个重点和一个补给窗口",
    decision: "写清主线与复查点，只让新事实改路线",
  },
  "expression-heavy": {
    opportunity: "行动启动快，但仍要确认验收后再加速",
    overload: "持续输出会挤压理解与恢复",
    recovery: "先降低强度，留出睡眠、反馈与排序窗口",
    decision: "收束目标与退出条件，再推进关键一步",
  },
};

const neutralStructureStyle: StructureStoryStyle = {
  opportunity: "条件尚未稳定时先做可逆小试验",
  overload: "过早归纳规律会把行动带偏",
  recovery: "先减少一项负荷，再按真实记录调整",
  decision: "保留检查点与停止条件",
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
        return `先把方法变成可交接成果：${pair.now}，再${pair.longTerm}。`;
      }
      if (pair.id === "talent-output") {
        return `有了底稿，${pair.now}，并${pair.longTerm}，让成果随用途改进。`;
      }
      if (pair.id === "career-environment") {
        return `接下来${pair.now}，再${pair.longTerm}，用长期样本选择环境。`;
      }
      if (pair.id === "wealth-structure") {
        return `准备投入时，${pair.now}，按${pair.longTerm}守住基本盘。`;
      }
      return `最后${pair.now}，${pair.outcome}：${pair.longTerm}。`;
    }).join("");
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
      whatItMeans: `当前有${facts.absentCount}类方式在稳定柱中完全未见，只表示可确认的信息有限，并不等于人生缺陷，也不自动指向某种补救。${facts.hourUnknown ? "具体时段尚未确认，当前名单仍可能改变。" : "已列时段也只能作为观察起点。"}`,
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
  lowPoint: string;
  reset: string;
  result: string;
  signal: string;
};

function continueSentence(value: string): string {
  return value.trim().replace(/[。！？；，]+$/u, "");
}

function buildBeat(
  config: BeatConfig,
  sourceActionIds: readonly DetailActionId[],
  prefix = "",
): NarrativeBeat {
  const consumed = buildActionSequence(sourceActionIds);
  return {
    situation:
      `${prefix}${continueSentence(config.scene)}，人物先寻找一个可控制的入口。`,
    opportunity: `机会在于${config.aim}，让压力成为可讨论的条件。`,
    firstStrength: `${config.strength}，能让事情启动并给出下一步。`,
    overuseCost: `若用过头，${config.cost}，重要反馈就会被挡在决定之外。`,
    lowPoint: `低点可能是${config.lowPoint}，小问题也会被误作无法改变的困局。`,
    newChoice: consumed
      ? `转折动作是：${config.reset}。${consumed}完成后再看结果。`
      : `转折动作是：${config.reset}，让事实、边界和下一步重新对齐。`,
    turn:
      `${continueSentence(config.result)}，变化来自反复核对，不是突然逆转。`,
    observableSignal:
      `${continueSentence(config.signal)}，连续记录两周再判断。`,
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
  cue: DomainCue,
): SceneMicroStory<TScene> {
  const consumed = buildActionSequence(sourceActionIds);
  return {
    id: config.id,
    covers: config.covers,
    title: config.title,
    trigger:
      `${continueSentence(config.trigger)}时，可以${cue.opening}。`,
    firstReaction: `${config.reaction}，借${cue.strength}暂时稳住局面。`,
    apparentBenefit: `${config.benefit}。`,
    cost: `${config.cost}，也要防${cue.risk}。`,
    turnAction: consumed
      ? `${cue.mature}：${config.turn}。${consumed}`
      : `${cue.mature}：${continueSentence(config.turn)}；还没有足够个人记录时，先把这一段当作一周小实验，记下触发、动作和结果，再决定是否保留。`,
    example:
      `${continueSentence(config.example)}，这会检验“${cue.opening}”。`,
    observableSignal:
      `${continueSentence(config.signal)}，连续记录后再判断。`,
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

  const self = buildBeat({
    scene: selfScene,
    aim: `自己想守住什么，以及如何${cue.mature}`,
    strength: cue.strength,
    cost: cue.risk,
    lowPoint: `${cue.risk}，疲惫与误解会放大一次判断`,
    reset: `${cue.mature}，再核对${visibilityCue}`,
    result: `${cue.mature}，主见仍保留也能修正`,
    signal: `能说出反证，并观察“${cue.mature}”后的反馈`,
  }, actionBuckets[0], `${unknownSentence}${missingSentence}人物通常会${cue.opening}。${visibilityCue}。`);

  const career = buildBeat({
    scene: careerScene,
    aim: `${structure.opportunity}，再确认职责与标准`,
    strength: `${cue.opening}，把任务带回主线`,
    cost: `${structure.overload}，而且${cue.risk}`,
    lowPoint: `${structure.overload}，延期与返工一起累积`,
    reset: `${cue.mature}，写清目标、负责人和停止条件`,
    result: `${cue.mature}，团队按同一清单协作`,
    signal: `返工下降，“${structure.opportunity}”对应一项交付`,
  }, actionBuckets[1]);

  const relationship = buildBeat({
    scene: `${relationshipScene}${relation.situation}。人物会${cue.opening}。`,
    aim: `${relation.approach}，同时${cue.mature}`,
    strength: `${cue.strength}，并把彼此带回具体事情`,
    cost: `${relation.conflict}。若${cue.risk}，善意也会变成压力`,
    lowPoint: `${relation.conflict}，双方越想自证，越难听见对方真正要守住的部分`,
    reset: `${cue.mature}，再按这条路径修复：${relation.repair}`,
    result: `${relation.repair}，关系不必马上完美，却多了一条可以重复使用的路径`,
    signal: `${relation.signal}，也能看见人物${cue.mature}`,
  }, actionBuckets[2]);

  const rhythm = buildBeat({
    scene: `${rhythmScene}${structure.recovery}，人物会${cue.opening}。`,
    aim: `${structure.decision}，并看清高质量时段与过载信号`,
    strength: `${cue.strength}，把精力留给关键任务`,
    cost: `${structure.overload}。若${cue.risk}，判断会在疲惫中启动`,
    lowPoint: `${structure.overload}，专注、耐心和恢复速度可能一起下降`,
    reset: `${cue.mature}，并按这条恢复顺序行动：${structure.recovery}`,
    result: `${structure.recovery}，人物开始按记录调速`,
    signal: `连续两周能按预定时间结束工作，并能用“${structure.decision}”完成一次决定`,
  }, actionBuckets[3]);

  const careerAdvice: ChartNarrative["careerAdvice"] = [
    buildMicroStory({
      id: "career-entry-collaboration",
      covers: ["task-entry", "collaboration-conflict"],
      title: "先把角色说清，再把分歧摆上桌",
      trigger: "刚接新角色，或多人对任务各有理解",
      reaction: "先按熟悉方式补空白，以速度换确定",
      benefit: "项目很快有第一版，暂时摆脱停滞",
      cost: `责任与验收仍模糊，${structure.overload}`,
      turn: "写清目标、负责人、权限和验收人",
      example: careerScene,
      signal: "任务有唯一负责人，复盘不再争论谁该知道",
    }, actionBuckets[4], cue),
    buildMicroStory({
      id: "career-choice-accumulation",
      covers: ["opportunity-choice", "long-accumulation"],
      title: "机会先小试，能力靠长期留下可以复查的现实证据",
      trigger: "新机会诱人，或长期积累缺少反馈",
      reaction: "要么全力投入，要么等待完整把握",
      benefit: "全力投入带来启动感，等待暂避失败风险",
      cost: `没有试验上限，${structure.overload}`,
      turn: `${structure.decision}，再限定试验额度`,
      example: sceneFor(
        interpretations,
        ["career-environment", "wealth-risk", "talent-output"],
        careerScene,
      ),
      signal: `每次追加投入前都有新证据，并能说明${visibilityCue}`,
    }, actionBuckets[5], cue),
  ];

  const relationshipAdvice: ChartNarrative["relationshipAdvice"] = [
    buildMicroStory({
      id: "relationship-approach-misunderstanding",
      covers: ["approach", "misunderstanding"],
      title: "靠近之前先说期待，误会出现先核事实",
      trigger: "你希望获得陪伴、回应或更明确承诺，却还没有把期待说成对方能直接回答的请求",
      reaction: "用暗示、试探或加快安排来确认自己是否被重视",
      benefit: "不用直接暴露需要，短期也能避免听见一个不确定答案",
      cost: `对方只能回应表面动作，${relation.conflict}`,
      turn: `${relation.repair}，再请对方复述理解`,
      example: `${relationshipScene}${relation.situation}。`,
      signal: relation.signal,
    }, actionBuckets[6], cue),
    buildMicroStory({
      id: "relationship-conflict-repair-boundary",
      covers: ["argument", "repair", "boundary"],
      title: "争执可以暂停，修复必须落到新规则",
      trigger: `同一冲突再次出现，情绪和责任已经纠缠在一起，${relation.conflict}`,
      reaction: "急着证明自己的解释完整，或为了恢复平静先答应以后注意",
      benefit: "争论暂时有了出口，表面关系也可能很快恢复日常",
      cost: `触发、影响和责任没有重新安排，${relation.conflict}`,
      turn: `${relation.repair}，再约定暂停信号、恢复时间和一项边界`,
      example: sceneFor(
        interpretations,
        ["relationship-trigger", "relationship-repair", "family-boundary"],
        relationshipScene,
      ),
      signal: relation.signal,
    }, actionBuckets[7], cue),
  ];

  const rhythmAdvice: ChartNarrative["rhythmAdvice"] = [
    buildMicroStory({
      id: "rhythm-window-overload-pause",
      covers: ["productive-window", "overload-signal", "pause"],
      title: "高效留给重点，过载便降档",
      trigger: `任务变密、清醒时段变少，${structure.recovery}`,
      reaction: "把更多事项塞进高效时段并延长工作",
      benefit: "关键进度短期上升，数量带来掌控感",
      cost: `休息被不断推迟，而且${structure.overload}`,
      turn: `${structure.recovery}，再连续七天记录专注时段和结束信号`,
      example: rhythmScene,
      signal: `重点任务在固定时段完成，并能看见${structure.recovery}`,
    }, actionBuckets[8], cue),
    buildMicroStory({
      id: "rhythm-restart-decision",
      covers: ["restart", "decision-window"],
      title: "小步重启，决定设门槛",
      trigger: `密集阶段刚结束，或决定已有大量信息，${structure.decision}`,
      reaction: "要么马上恢复强度，要么等待完全有把握",
      benefit: "立即加速能延续成就感，等待也暂时避开选错焦虑",
      cost: `身体和注意力可能还未归位，而且${structure.overload}`,
      turn: `${structure.decision}，再恢复一个稳定作息并写下复查日期`,
      example: sceneFor(
        interpretations,
        ["rhythm-recovery", "rhythm-decision"],
        rhythmScene,
      ),
      signal: `重新加量后仍能保持基本作息，并能说明${structure.decision}`,
    }, actionBuckets[9], cue),
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
