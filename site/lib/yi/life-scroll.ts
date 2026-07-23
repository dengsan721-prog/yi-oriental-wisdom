import {
  REVIEWED_DAO_NOTES,
  selectReviewedDaoNotes,
  type DaoNoteTheme,
  type ReviewedDaoNote,
} from "./dao-note-corpus";
import {
  selectStableStoryFacts,
  type SafeStoryInterpretation,
  type StableStoryUncertaintyFlag,
} from "./stable-story-facts";
import {
  buildStoryMirrors,
  type StoryMirror,
} from "./story-mirrors";
import type {
  ChartRelation,
  ElementName,
  FourPillarsResult,
  InterpretationItem,
  ProfessionalReport,
} from "./types";

export type StoryBeatId =
  | "situation"
  | "desire"
  | "opening"
  | "cost"
  | "low-point"
  | "choice"
  | "turn"
  | "mature-method";

export type StoryBeat = Readonly<{
  id: StoryBeatId;
  text: string;
  internalEvidenceId: string | null;
}>;

export type DaoStoryContext = Readonly<{
  tension: string;
  turn: string;
  scene: string;
  action: string;
}>;

export type DaoStoryNote = Readonly<{
  internalSourceId: string;
  chapter: number;
  excerpt: string;
  placement: "career" | "relationship" | "turning-point" | "closing";
  plainCommentary: Readonly<{
    traditionalMeaning: string;
    storyConnection: string;
    sceneGuidance: string;
  }>;
}>;

export type DaoStoryNoteResult = Readonly<{
  daoNotes: readonly DaoStoryNote[];
  uncertaintyFlags: readonly string[];
}>;

export type LifeScrollNarrative = Readonly<{
  oneLineTheme: string;
  openingScene: readonly string[];
  careerArc: readonly string[];
  relationshipArc: readonly string[];
  turningPointArc: readonly string[];
  matureArc: readonly string[];
  animalInterlude: StoryMirror;
  historicalInterlude: StoryMirror;
  daoNotes: readonly DaoStoryNote[];
  closingLine: string;
  actionNow: string;
  internalStoryBeats: readonly StoryBeat[];
  internalEvidenceIds: readonly string[];
  uncertaintyFlags: readonly string[];
}>;

type MissingDomain = "career" | "relationship" | "rhythm";
type UsableDaoNote = ReviewedDaoNote & {
  traditionalCommentarySummary: string;
};
type DaoPlacement = DaoStoryNote["placement"];

type ElementTexture = Readonly<{
  theme: string;
  situation: string;
  desiredOutcome: string;
  transition: string;
  maturity: string;
  closing: string;
  careerOpeningLead: string;
  careerCostLead: string;
  relationshipLowPointLead: string;
  relationshipChoiceLead: string;
  rhythmTurnLead: string;
  matureLead: string;
  reviewLead: string;
  reflectionLead: string;
}>;

type StructureFrame = Readonly<{
  openingMethod: string;
  overuseCost: string;
  matureMethod: string;
  daoTension: string;
}>;

type RelationFrame = Readonly<{
  conflict: string;
  repair: string;
  visibleTurn: string;
  daoScene: string;
  daoAction: string;
}>;

type DaoFrameContext = Readonly<{
  tension: string;
  turn: string;
  scene: string;
  action: string;
  opening: string;
}>;

type DaoPlacementContexts = Readonly<
  Partial<Record<DaoPlacement, DaoStoryContext>>
>;

type DaoFrame = Readonly<{
  storyConnection: (context: DaoFrameContext) => string;
  sceneGuidance: (context: DaoFrameContext) => string;
}>;

const UNKNOWN_TIME_SENTENCE =
  "出生时间没有确认，与一天具体时段有关的内容暂时留白。";

const DOMAIN_GAP_COPY: Readonly<Record<MissingDomain, string>> = {
  career:
    "事业这一段没有足够稳定材料，因此只给通用观察，不当成个人结论。",
  relationship:
    "关系这一段没有足够稳定材料，因此只给通用观察，不当成个人结论。",
  rhythm:
    "节奏这一段没有足够稳定材料，因此只给通用观察，不当成个人结论。",
};

const PRIORITY_ORDER: Readonly<Record<SafeStoryInterpretation["priority"], number>> = {
  core: 0,
  important: 1,
  supporting: 2,
};

const PUBLIC_FORBIDDEN =
  /四柱|日主|十神|月令|旺衰|藏干|纳音|十二长生|干支关系|命理|专业依据|本章来源|可靠级|证据等级|计算规则|规则 ID|数据来源清单/u;

const ELEMENT_TEXTURES: Readonly<Record<ElementName, ElementTexture>> = {
  木: {
    theme: "让生长有支点，让每一步都能在现实反馈中修正",
    situation: "像新枝寻找支点，方向感先出现，周围条件仍在变化",
    desiredOutcome: "方向能够继续生长，也能在必要处及时修剪",
    transition: "转折像调整枝条朝向，变化不大，却让后续生长少走弯路",
    maturity: "成熟不是一味向前，而是辨认哪一部分该生长、哪一部分该停",
    closing: "方向可以继续生长，但每次生长都要重新核对承载它的现实条件",
    careerOpeningLead: "事业的门一开，你先扶稳最有生长可能的一枝。",
    careerCostLead: "枝叶一多，原本的生长力也可能遮住责任与边界。",
    relationshipLowPointLead: "当你急着把两个人带向同一方向，反对意见可能被听成拖后腿。",
    relationshipChoiceLead: "转折不是砍掉关系，而是先修去猜测。",
    rhythmTurnLead: "你先暂停长出新的枝杈，为恢复腾出空间。",
    matureLead: "后来，你不再把不断扩张当成唯一进步。",
    reviewLead: "每轮回看时，方向仍要接受现实修剪。",
    reflectionLead: "回头看这次修枝，真正的变化不在口号里。",
  },
  火: {
    theme: "让重要之事被看见，也给判断留下冷静复核的空间",
    situation: "像光线先照亮重点，行动意愿很快升起，细节尚需慢一点核对",
    desiredOutcome: "重要之事能够被看见，同时不让速度压过理解",
    transition: "转折像把过亮的光调到合适强度，重点仍清楚，旁人也能跟上",
    maturity: "成熟是既能照亮方向，也知道何时降温、听完并再次确认",
    closing: "重要之事值得被照亮，也值得在行动前后接受安静而完整的复核",
    careerOpeningLead: "事业的门一开，你先把最重要的问题照亮。",
    careerCostLead: "光太强时，速度会先于理解抵达现场。",
    relationshipLowPointLead: "当你急着让对方明白，沉默可能被误读成冷淡，迟疑也可能被听成拒绝。",
    relationshipChoiceLead: "你先把音量和速度降下来，让请求成为一次真正能回答的邀请。",
    rhythmTurnLead: "一轮高强度输出之后，你先给身体和注意力降温。",
    matureLead: "后来，热情不再靠持续燃烧证明。",
    reviewLead: "每轮回看时，热度仍要接受安静复核。",
    reflectionLead: "回头看这次降温，转折要靠新的回应发亮。",
  },
  土: {
    theme: "在承接责任时守住边界，让稳定能够容纳必要变化",
    situation: "像地面承接多方重量，责任自然聚拢过来，容量却需要被重新丈量",
    desiredOutcome: "重要责任得到承接，又不让任何一个人长期独自负重",
    transition: "转折像重新分配承重点，表面没有轰动，整体却开始恢复稳定",
    maturity: "成熟是让稳定服务真实生活，而不是用不动来证明可靠",
    closing: "稳定来自边界、分工与补给共同成立，不来自一个人永远不说累",
    careerOpeningLead: "事业的门一开，你先把散落的责任放到同一张桌上。",
    careerCostLead: "当所有重量都落向你，可靠也可能慢慢变成默认代办。",
    relationshipLowPointLead: "你可能用多做一点维持安稳，却把疲惫和不满留在心里。",
    relationshipChoiceLead: "你把能承担、不能承担和需要共同承担的部分逐项摆明。",
    rhythmTurnLead: "你先卸下一项并非必须由自己完成的重量。",
    matureLead: "后来，稳定不再靠一个人硬撑。",
    reviewLead: "每轮回看时，承重仍要重新核对容量。",
    reflectionLead: "回头看这次卸重，稳定要由新的分工检验。",
  },
  金: {
    theme: "用清楚标准切开混乱，也为过渡与协商保留位置",
    situation: "像在混乱里先划出边界，判断迅速成形，过渡成本仍需要被看见",
    desiredOutcome: "标准足够清楚，受影响的人也有解释和调整的入口",
    transition: "转折像把锋利标准磨出安全边缘，方向没变，协商开始能够发生",
    maturity: "成熟是既敢取舍，也能把过渡、例外和修正条件说明白",
    closing: "清楚标准可以保护行动，但它仍要为现实差异和后续修正留出入口",
    careerOpeningLead: "事业的门一开，你先从混乱中切出目标、权限和完成标准。",
    careerCostLead: "标准落得太快时，例外、过渡和人的准备时间可能一起被削掉。",
    relationshipLowPointLead: "当清楚变成裁决，双方会忙着证明谁更有道理。",
    relationshipChoiceLead: "你先把不能退让的底线与仍可商量的部分分开。",
    rhythmTurnLead: "你先结束无须继续扩张的任务，为判断留出空白。",
    matureLead: "后来，准确不只意味着敢于取舍，也意味着愿意复查。",
    reviewLead: "每轮回看时，标准仍要为修正留下入口。",
    reflectionLead: "回头看这次留白，标准要经过真实协作检验。",
  },
  水: {
    theme: "在流动选择中守住主线，让变化汇入可持续方向",
    situation: "像水流同时遇到几条通道，选择很多，真正主线需要被再次确认",
    desiredOutcome: "变化保持流动，又不会把长期承诺冲散",
    transition: "转折像把分散水流收回主河道，选择减少，行动反而更有力量",
    maturity: "成熟是允许路线改变，同时记得变化要服务哪个长期方向",
    closing: "变化可以带来新通道，但只有回到主线，流动才会形成持续力量",
    careerOpeningLead: "事业的门一开，你先把分散信号接回一条主流。",
    careerCostLead: "入口太多时，新信息会不断改写方向。",
    relationshipLowPointLead: "为了适应变化，你可能反复调整表达，却没有说清哪项承诺不会改变。",
    relationshipChoiceLead: "你先说清不变目标、可变方法和下次核对时间。",
    rhythmTurnLead: "你暂时关掉新的信息入口，把精力收回一条河道。",
    matureLead: "后来，灵活不再等于随时改道。",
    reviewLead: "每轮回看时，变化仍要回到长期主线。",
    reflectionLead: "回头看这次收流，主线要由后续节奏确认。",
  },
};

const NEUTRAL_TEXTURE: ElementTexture = {
  theme: "在信息尚未确定处保留边界，把下一步交给现实反馈",
  situation: "像在能见度有限的路口停一下，先确认脚下条件再决定方向",
  desiredOutcome: "重要目标能够继续推进，同时保留撤回和修正的空间",
  transition: "转折来自一项可核对的小变化，而不是给自己下新的定论",
  maturity: "成熟是承认未知、保留边界，并让每次选择都接受现实反馈",
  closing: "尚未确定的部分可以留白，已经确认的行动则要清楚、适量并可复盘",
  careerOpeningLead: "资料还不足以写成个人定论时，事业先从一项可撤回的小试验开始。",
  careerCostLead: "一次顺利或吃力都不宜被扩大成固定模式。",
  relationshipLowPointLead: "关系材料不足时，不猜测任何一方的动机，只看尚未说清的事实、影响和需要。",
  relationshipChoiceLead: "这一步不宣布谁应该改变，只先完成一个可以回应的请求。",
  rhythmTurnLead: "你先减少一个变量，并记录注意力、恢复和协作是否出现变化。",
  matureLead: "未知部分继续留白，已经确认的部分则反复核对。",
  reviewLead: "每轮回看时，只保留有新事实支持的调整。",
  reflectionLead: "回头看这次试验，只用后来出现的事实判断。",
};

const STRUCTURE_FRAMES: Readonly<Record<
  NonNullable<ReturnType<typeof selectStableStoryFacts>["structureBalance"]>,
  StructureFrame
>> = {
  "support-heavy": {
    openingMethod:
      "开门方法是把已经积累的资源推出一个可见版本，而不是继续等到全部条件齐备。",
    overuseCost:
      "过度的一端是继续承接、准备和补充，行动窗口却在反复完善中逐渐缩小。",
    matureMethod:
      "长期方法要给输入设置停止点，并让每一轮积累都接上一项现实交付。",
    daoTension: "准备和承接不断增加，现实行动却被向后推迟",
  },
  mixed: {
    openingMethod:
      "开门方法是先排出冲突条件，再选择一项能够同时照顾推进与补给的小试验。",
    overuseCost:
      "过度的一端是在多个方向间反复切换，忙于平衡，却没有留下清楚的主次。",
    matureMethod:
      "长期方法要固定主线与复盘节点，只在新事实真正改变判断时调整路线。",
    daoTension: "多个方向彼此牵动，主线和补给都容易失去次序",
  },
  "expression-heavy": {
    openingMethod:
      "开门方法是先收束输出目标，确认接收者和验收方式，再把速度用于关键一步。",
    overuseCost:
      "过度的一端是行动和表达持续加速，理解、恢复与协作容量却来不及跟上。",
    matureMethod:
      "长期方法要在每次输出后安排恢复和反馈，让速度不再依靠持续透支。",
    daoTension: "输出速度不断上升，理解和恢复空间却被逐渐挤压",
  },
};

const NEUTRAL_STRUCTURE: StructureFrame = {
  openingMethod:
    "通用的开门方法是先做一项可逆的小试验，再依据真实反馈决定是否增加投入。",
  overuseCost:
    "结构尚未稳定时，不把一次顺利或吃力扩大成长期结论，只记录具体条件与结果。",
  matureMethod:
    "长期方法先保留检查点和停止条件，让未知部分继续留白。",
  daoTension: "条件尚未稳定，行动容易被过早解释成固定结论",
};

const RELATION_FRAMES: Readonly<Record<ChartRelation["type"], RelationFrame>> = {
  "stem-combination": {
    conflict:
      "低点常来自口头方向看似一致，负责人、期限和完成标准却没有真正对齐。",
    repair:
      "修复要把共同意图写成负责人、期限与完成标准，再让双方复述各自理解。",
    visibleTurn:
      "可见转折是口头共识开始变成各方都能核对的书面约定。",
    daoScene: "共同意图已经出现，但职责和完成标准仍未说清",
    daoAction: "把负责人、期限与完成标准逐项确认",
  },
  "branch-combination": {
    conflict:
      "低点常来自配合越来越顺手，资源归属、个人边界和退出条件反而被省略。",
    repair:
      "修复要先确认共同目标，再把资源归属、退出条件和复核时间逐项说清。",
    visibleTurn:
      "可见转折是默契之外出现清楚边界，合作不再依赖任何一方自行猜测。",
    daoScene: "日常配合逐渐顺手，资源边界和退出条件却被省略",
    daoAction: "确认共同目标并补齐资源边界与退出条件",
  },
  "branch-trine": {
    conflict:
      "低点常来自多方力量同时加码，热度越来越高，容量和停止条件却无人提醒。",
    repair:
      "修复要把分散力量收回一个共同目标，并设置阶段检查点与停止条件。",
    visibleTurn:
      "可见转折是团队从同时加码改为分段投入，每一步都有容量检查。",
    daoScene: "多方力量同向增加，整体容量和停止位置却被忽略",
    daoAction: "只保留一个共同目标并设置阶段检查点",
  },
  "branch-clash": {
    conflict:
      "低点常来自时间表、立场或方向正面对撞，事实还没核对，反应已经彼此升级。",
    repair:
      "修复要暂停即时结论，分列双方事实与不可让渡项，再安排限时协调。",
    visibleTurn:
      "可见转折是对撞被拆成具体条件，双方开始讨论可调整与不可调整之处。",
    daoScene: "时间表与立场正面对撞，双方都急着先保住自己的答案",
    daoAction: "暂停即时结论并分列双方事实与底线",
  },
  "branch-punishment": {
    conflict:
      "低点常来自同一问题反复加码，责任与情绪纠缠后，旧办法被用得更重。",
    repair:
      "修复要记录触发顺序并设置停止条件，必要时请第三方拆开责任与情绪。",
    visibleTurn:
      "可见转折是重复循环第一次在固定位置停下，新的回应得以进入。",
    daoScene: "同一问题反复加码，旧办法在压力下被不断重复",
    daoAction: "记录触发顺序并在固定位置设置停止信号",
  },
  "branch-harm": {
    conflict:
      "低点常来自信息与期待错位，未说清的顾虑在表面平静下继续累积。",
    repair:
      "修复要先复述听见的意思，再补问遗漏条件，不根据暗示替对方决定。",
    visibleTurn:
      "可见转折是暗示被具体问题取代，误解在继续累积前得到核对。",
    daoScene: "表面仍然平静，未说清的顾虑和期待却持续错位",
    daoAction: "先复述所听见的意思，再询问遗漏条件",
  },
  "branch-break": {
    conflict:
      "低点常来自旧约定已经松动，新安排尚未接住责任和资源，现场只剩临时补洞。",
    repair:
      "修复要逐条核对旧约定的适用范围，保留可用部分并写下过渡安排。",
    visibleTurn:
      "可见转折是旧接口被明确更新，责任和资源重新找到承接位置。",
    daoScene: "旧约定开始松动，新安排还没有接住责任与资源",
    daoAction: "核对旧约定范围并写下清楚的过渡安排",
  },
};

const NEUTRAL_RELATION: RelationFrame = {
  conflict:
    "关系材料不足时，不替任何一方解释动机，只观察事实、影响与尚未说清的需要。",
  repair:
    "通用修复从复述事实、提出具体请求和约定重谈时间开始，不预设谁应该让步。",
  visibleTurn:
    "只有当相关的人都能观察并确认一项新的回应时，才把它视为可见转折。",
  daoScene: "双方需要重新核对事实、影响和可以承担的下一步",
  daoAction: "复述事实并提出一项可以回应的具体请求",
};

const DAO_PLACEMENTS: readonly DaoPlacement[] = [
  "career",
  "relationship",
  "turning-point",
  "closing",
];

const DAO_STORY_OPENINGS: Readonly<
  Record<DaoPlacement, (scene: string) => string>
> = {
  career: scene =>
    `事业这扇门打开时，${scene}成为必须先处理的现场。`,
  relationship: scene =>
    `关系走到需要修补的地方，${scene}已经摆到双方眼前。`,
  "turning-point": scene =>
    `转折来到眼前时，${scene}让旧做法再也难以维持。`,
  closing: scene =>
    `全卷收束到${scene}，下一步必须重新取舍。`,
};

const DAO_BOUNDARY_COPY: Readonly<Record<DaoPlacement, string>> = {
  career:
    "这里借古语只帮助拿捏事业行动的分寸；它不能替现实反馈作决定，也不预告工作结果。",
  relationship:
    "放在关系里，这层古义只帮助看见相处分寸；它不替任何一方判定动机，也不预告关系走向。",
  "turning-point":
    "用在转折处，这层古义只解释选择方法；变化是否成立，仍要由后续行动与他人的真实回应确认。",
  closing:
    "用来收束全卷时，这层古义只保留行动提醒；它不把故事写成确定结局，现实仍可继续修正。",
};

const DAO_CONTEXT_FALLBACKS: Readonly<
  Record<DaoPlacement, Omit<DaoFrameContext, "opening">>
> = {
  career: {
    scene: "需要核对目标的任务",
    tension: "职责与权限尚未对齐",
    turn: "完成一项可撤回试验",
    action: "写清目标权限和停止点",
  },
  relationship: {
    scene: "需要重谈请求的关系",
    tension: "事实与猜测混在一起",
    turn: "提出一项可回应请求",
    action: "复述事实影响和需要",
  },
  "turning-point": {
    scene: "需要恢复容量的时刻",
    tension: "负荷与恢复失去平衡",
    turn: "减少一个现实变量",
    action: "记录负荷恢复和反馈",
  },
  closing: {
    scene: "需要复盘全程的节点",
    tension: "旧方法仍可能再出现",
    turn: "保留一项有效改变",
    action: "约定复查时间和边界",
  },
};

const DAO_FRAMES: Readonly<Record<string, DaoFrame>> = {
  "dao-08-water": {
    storyConnection: context =>
      `${context.opening}人物面对“${context.tension}”，先把共同需要放到位置和功劳之前。当人物${context.turn}后，局面便有重新流动的空间，但结果仍由现实回应决定。`,
    sceneGuidance: context =>
      `人物先${context.action}，再确认谁真正受益、谁仍有异议以及何时复查。服务不是讨好，也不要求任何人放弃自己的边界。`,
  },
  "dao-15-clear": {
    storyConnection: context =>
      `${context.opening}人物一度被“${context.tension}”催着立刻下结论。人物停止追加判断、等待事实沉淀；人物${context.turn}后，混乱才逐渐显出可处理的层次。`,
    sceneGuidance: context =>
      `人物先暂停一个回合，${context.action}，并约定下一次核对时间。等待期间只记录新事实，不用焦虑替空白补出答案。`,
  },
  "dao-22-whole": {
    storyConnection: context =>
      `${context.opening}人物因“${context.tension}”想用更大力度维持原路线。人物先让方法转弯以保留真正所守；${context.turn}之后，行动才重新获得余地。`,
    sceneGuidance: context =>
      `人物先${context.action}，再写下必须保留和可以改变的部分。暂时转弯不是退场，而是避免用硬撑消耗最重要的目标。`,
  },
  "dao-33-self": {
    storyConnection: context =>
      `${context.opening}人物原本被“${context.tension}”牵着走。人物不急着赢过别人，先看清自己的反应、容量与偏差；人物${context.turn}后，下一步才成为可以修正的行动。`,
    sceneGuidance: context =>
      `人物先${context.action}，随后分别写下外部事实和自己的自动解释。看清自己不是自责，而是找到哪一处回应仍能由自己改变。`,
  },
  "dao-40-return": {
    storyConnection: context =>
      `${context.opening}人物因“${context.tension}”不断向外加力。人物回到问题起点，选择较小却能持续的动作；${context.turn}之后，方向才重新接受事实校正。`,
    sceneGuidance: context =>
      `人物先${context.action}，再撤掉一项无助于主线的额外用力。退回起点是重新校准，不意味着现实一定反转或自动变好。`,
  },
  "dao-63-small": {
    storyConnection: context =>
      `${context.opening}人物被“${context.tension}”压得只看见整块难题。人物在问题尚小时先作安排；人物${context.turn}后，困难便被拆成今天能够核对的部分。`,
    sceneGuidance: context =>
      `人物先${context.action}，再选一项二十分钟内能够完成的细节，并留下下一步接口。小步不是轻看困难，而是阻止问题继续累积。`,
  },
  "dao-64-road": {
    storyConnection: context =>
      `${context.opening}人物因“${context.tension}”把目光一直放在遥远终点。人物从足下第一步起步，让后续动作彼此接续；${context.turn}使长期方向第一次有了可见进度。`,
    sceneGuidance: context =>
      `人物先${context.action}，再写下紧接着的第二步和复查时间。起步之后仍保持开始时的谨慎，避免临近完成才放松关键核对。`,
  },
  "dao-76-soft": {
    storyConnection: context =>
      `${context.opening}人物因“${context.tension}”把强硬误当成稳定。人物松开已经僵住的方法并保留调整能力；人物${context.turn}后，新路径才有进入空间。`,
    sceneGuidance: context =>
      `人物先${context.action}，再说明可以调整与不能退让的边界。柔软不是屈从，而是让行动在现实变化中仍有转向余地。`,
  },
  "dao-81-no-strife": {
    storyConnection: context =>
      `${context.opening}人物完成工作后仍被“${context.tension}”拉回比较。人物让成果回到真实受益者；${context.turn}之后，行动不再依赖争夺位置来确认价值。`,
    sceneGuidance: context =>
      `人物先${context.action}，再核对成果是否真的被使用，并清楚记录各方贡献。不争不是抹去责任，而是不让功劳竞争破坏已经完成的工作。`,
  },
};

const NEUTRAL_DAO_FRAMES: Readonly<Record<string, DaoFrame>> = {
  "dao-15-clear": {
    storyConnection: context =>
      `${context.opening}若${context.tension}，可以先暂停追加判断，${context.action}并等待新材料；只有事实层次变得更清楚，才继续决定下一步。`,
    sceneGuidance: context =>
      `若新事实仍然不足，先保留一个观察回合，再${context.turn}并约定核对时间。等待不是拖延，而是不给空白补出未经确认的答案。`,
  },
  "dao-33-self": {
    storyConnection: context =>
      `${context.opening}若${context.tension}且解释仍混在其中，可以先分开记录外部事实与自动解释，再核对自己的容量与偏差；只有可修改的回应变得清楚，才安排下一步。`,
    sceneGuidance: context =>
      `若仍分不清事实与解释，先${context.action}，再请相关的人补充不同观察。看清自己不是自责，而是为后续修正保留入口。`,
  },
  "dao-63-small": {
    storyConnection: context =>
      `${context.opening}若${context.tension}且问题还不能整体处理，可以在容易核对的细处先作安排，再${context.turn}；只有反馈支持继续推进，才接上下一步。`,
    sceneGuidance: context =>
      `若目标仍然过大，先${context.action}，再选一项二十分钟内能够完成的细节。小步不轻看困难，只避免问题继续累积。`,
  },
  "dao-81-no-strife": {
    storyConnection: context =>
      `${context.opening}若${context.tension}且成果归属仍不清楚，可以先核对成果是否真的被使用，再清楚记录各方贡献；只有行动回到真实受益者，才放下功劳竞争。`,
    sceneGuidance: context =>
      `若贡献边界仍不清楚，先${context.action}，再确认谁实际受益、谁仍需回应。不争不抹去责任，只避免功劳竞争破坏工作。`,
  },
};

function deepFreeze<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
}

function countHan(value: string): number {
  return [...value].filter(character => /\p{Script=Han}/u.test(character))
    .length;
}

function completeSentence(value: string): string {
  const trimmed = value.trim();
  return /[。！？]$/u.test(trimmed) ? trimmed : `${trimmed}。`;
}

function joinCompleteSentences(...values: string[]): string {
  return values.map(completeSentence).join("");
}

function leadIntoStory(lead: string, ...details: string[]): string {
  const openingClause = lead.trim().replace(/[。！？]+$/u, "");
  return completeSentence(`${openingClause}，${details.join("")}`);
}

function asConnectedClause(value: string): string {
  return value
    .trim()
    .replace(/[。！？]+$/u, "")
    .replace(/[。！？]+/gu, "，");
}

function rewriteReviewedStoryText(value: string): string {
  return value
    .replaceAll("命理线索", "现有线索")
    .replaceAll("把所有波动都解释成命理", "把所有波动都归入单一解释")
    .replaceAll("不用命理判断", "不用抽象判断")
    .replaceAll(
      "用事实、感受、需要和具体请求四句话表达",
      "依次用四句话说明事实、感受、需要与具体请求",
    )
    .replaceAll(
      "用事实、感受、需要和具体请求",
      "依次说明事实、感受、需要与具体请求",
    );
}

function safeStoryField(value: string, fallback: string): string {
  const rewritten = rewriteReviewedStoryText(value);
  return completeSentence(
    !rewritten.trim() || PUBLIC_FORBIDDEN.test(rewritten)
      ? fallback
      : rewritten,
  );
}

function conciseCompleteThought(
  value: string,
  fallback: string,
  maximumHan = 30,
): string {
  const rewritten = rewriteReviewedStoryText(value);
  const candidates = rewritten
    .split(/[。！？；，,]/u)
    .map(part => part.trim())
    .filter(Boolean);
  const selected = candidates.find(part => {
    const length = countHan(part);
    return length >= 4
      && length <= maximumHan
      && !PUBLIC_FORBIDDEN.test(part)
      && !/[而和与并再把将在为]$/u.test(part);
  });
  return selected ?? fallback;
}

function isUsableDaoNote(note: ReviewedDaoNote): note is UsableDaoNote {
  return typeof note.traditionalCommentarySummary === "string"
    && note.traditionalCommentarySummary.trim().length > 0;
}

function buildDaoNote(
  note: UsableDaoNote,
  context: DaoStoryContext,
  placement: DaoPlacement,
  frames: Readonly<Record<string, DaoFrame>> = DAO_FRAMES,
): DaoStoryNote {
  const frame = frames[note.id];
  const fallbackContext = DAO_CONTEXT_FALLBACKS[placement];
  const safeScene = conciseCompleteThought(
    context.scene,
    fallbackContext.scene,
    12,
  );
  const safeContext: DaoFrameContext = {
    tension: conciseCompleteThought(
      context.tension,
      fallbackContext.tension,
      12,
    ),
    turn: conciseCompleteThought(
      context.turn,
      fallbackContext.turn,
      12,
    ),
    scene: safeScene,
    action: conciseCompleteThought(
      context.action,
      fallbackContext.action,
      12,
    ),
    opening: DAO_STORY_OPENINGS[placement](safeScene),
  };
  const fallbackFrame: DaoFrame = {
    storyConnection: current =>
      `${current.opening}人物面对“${current.tension}”，先停下原有惯性，再选择${current.turn}。古语只帮助回望这次行动，实际结果仍要由后续反馈确认。`,
    sceneGuidance: current =>
      `人物先${current.action}，再约定复查时间、可接受范围和停止条件。动作保持具体，也给受影响的人留下补充事实与表达异议的入口。`,
  };
  const selectedFrame = frame ?? fallbackFrame;

  return {
    internalSourceId: note.id,
    chapter: note.chapter,
    excerpt: note.displayTextSimplified,
    placement,
    plainCommentary: {
      traditionalMeaning:
        `${note.traditionalCommentarySummary.replaceAll(
          "王弼工作文本",
          "王弼的解释",
        ).replace(/[。！？]+$/u, "")}；${DAO_BOUNDARY_COPY[placement]}`,
      storyConnection: selectedFrame.storyConnection(safeContext),
      sceneGuidance: selectedFrame.sceneGuidance(safeContext),
    },
  };
}

function buildDaoStoryNotesWithFrames(
  themes: readonly DaoNoteTheme[],
  context: DaoStoryContext,
  frames: Readonly<Record<string, DaoFrame>>,
  placementContexts: DaoPlacementContexts = {},
): DaoStoryNoteResult {
  const selected = selectReviewedDaoNotes(themes, { min: 2, max: 4 });
  const usable: UsableDaoNote[] = selected.filter(isUsableDaoNote);
  const selectedIds = new Set(usable.map(note => note.id));
  const missing = selected.filter(note => !isUsableDaoNote(note));
  const uncertaintyFlags = missing.map(note =>
    `dao-note-fallback:${note.id}`
  );
  const targetLength = selected.length;

  const add = (note: ReviewedDaoNote | undefined): void => {
    if (
      usable.length < 4
      && note
      && isUsableDaoNote(note)
      && !selectedIds.has(note.id)
    ) {
      usable.push(note);
      selectedIds.add(note.id);
    }
  };

  for (const fallbackId of ["dao-33-self", "dao-64-road"]) {
    if (usable.length >= targetLength) break;
    add(REVIEWED_DAO_NOTES.find(note => note.id === fallbackId));
  }
  for (const note of REVIEWED_DAO_NOTES) {
    if (usable.length >= Math.max(2, targetLength)) break;
    add(note);
  }

  const daoNotes = usable.slice(0, 4).map((note, index) => {
    const placement = DAO_PLACEMENTS[index] ?? "closing";
    return buildDaoNote(
      note,
      placementContexts[placement] ?? context,
      placement,
      frames,
    );
  });
  return deepFreeze({ daoNotes, uncertaintyFlags });
}

export function buildDaoStoryNotes(
  themes: readonly DaoNoteTheme[],
  context: DaoStoryContext,
): DaoStoryNoteResult {
  return buildDaoStoryNotesWithFrames(themes, context, DAO_FRAMES);
}

function selectNarrativeDaoThemes(
  structureBalance: ReturnType<
    typeof selectStableStoryFacts
  >["structureBalance"],
  relations: readonly ChartRelation[],
  hasAnyMaterial: boolean,
  hasCareerMaterial: boolean,
  hasRhythmMaterial: boolean,
): readonly DaoNoteTheme[] {
  if (!hasAnyMaterial) {
    return [
      "patience",
      "self-knowledge",
      "small-steps",
      "completion",
    ];
  }

  const themes: DaoNoteTheme[] = [];
  const add = (theme: DaoNoteTheme): void => {
    if (themes.length < 4 && !themes.includes(theme)) themes.push(theme);
  };

  if (structureBalance === "expression-heavy") {
    add("flexibility");
    add("self-knowledge");
  } else if (structureBalance === "support-heavy") {
    add("small-steps");
    add("long-road");
  } else {
    add("patience");
    add("self-knowledge");
  }

  if (relations.some(relation =>
    relation.type === "stem-combination"
    || relation.type === "branch-combination"
    || relation.type === "branch-trine")) {
    add("service");
  }
  if (relations.some(relation =>
    relation.type === "branch-clash"
    || relation.type === "branch-punishment"
    || relation.type === "branch-harm"
    || relation.type === "branch-break")) {
    add("bend");
  }
  if (hasCareerMaterial && hasRhythmMaterial) {
    add("small-steps");
    add("long-road");
  }
  add("completion");

  return themes;
}

function selectDomainItem(
  items: readonly SafeStoryInterpretation[],
  domain: SafeStoryInterpretation["domain"],
): SafeStoryInterpretation | undefined {
  return items
    .filter(item => item.domain === domain)
    .sort((left, right) =>
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]
      || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
    )[0];
}

function extractLessonIntent(currentLesson: string | null): string | null {
  const extracted = currentLesson?.match(/先练习“([^”]+)”/u)?.[1]?.trim();
  if (!extracted) return null;
  const rewritten = rewriteReviewedStoryText(extracted);
  if (
    PUBLIC_FORBIDDEN.test(rewritten)
    || countHan(rewritten) < 6
    || countHan(rewritten) > 36
    || /[。！？；：]/u.test(rewritten)
  ) {
    return null;
  }
  return rewritten;
}

function storyBeat(
  id: StoryBeatId,
  text: string,
  item: SafeStoryInterpretation | undefined,
): StoryBeat {
  return {
    id,
    text: completeSentence(text),
    internalEvidenceId: item?.id ?? null,
  };
}

export function buildLifeScrollNarrative(
  chart: FourPillarsResult,
  report: ProfessionalReport,
  items: readonly InterpretationItem[],
): LifeScrollNarrative {
  const stable = selectStableStoryFacts(chart, report, items);
  const stableItems = stable.interpretations;
  const self = selectDomainItem(stableItems, "self");
  const talent = selectDomainItem(stableItems, "talent");
  const career = selectDomainItem(stableItems, "career");
  const relationship = selectDomainItem(stableItems, "relationship");
  const rhythm = selectDomainItem(stableItems, "rhythm");
  const hasAnyMaterial = stableItems.length > 0;
  const texture = stable.dayMasterElement
    ? ELEMENT_TEXTURES[stable.dayMasterElement]
    : NEUTRAL_TEXTURE;
  const structure = stable.structureBalance
    ? STRUCTURE_FRAMES[stable.structureBalance]
    : NEUTRAL_STRUCTURE;
  const relation = stable.relations[0]
    ? RELATION_FRAMES[stable.relations[0].type]
    : NEUTRAL_RELATION;
  const lessonIntent = extractLessonIntent(stable.currentLesson)
    ?? "先把事实、边界和下一次检查时间说清";

  const selfScenario = safeStoryField(
    self?.scenario ?? "",
    "当需要同时处理几项责任时，先把事实、容量和优先顺序放在一起核对。",
  );
  const talentAdvantage = safeStoryField(
    talent?.advantageVersion ?? "",
    "可用的能力先通过一项小而可逆的任务接受检验，再决定是否扩大投入。",
  );
  const careerAdvantage = safeStoryField(
    career?.advantageVersion ?? "",
    "通用观察是先确认对象、目标、权限和完成标准，再开始一项可逆的小试验。",
  );
  const careerShadow = safeStoryField(
    career?.shadowVersion ?? "",
    "通用风险是为了尽快获得确定感而一次承担过多，使边界、依赖和恢复成本被推到后面。",
  );
  const relationshipShadow = safeStoryField(
    relationship?.shadowVersion ?? "",
    "通用风险是双方用各自解释填补空白，使原本可协商的问题逐渐变成防御。",
  );
  const relationshipAction = safeStoryField(
    relationship?.actionNow ?? "",
    "通用动作是分别说明事实、影响、需要与具体请求，再请对方复述理解。",
  );
  const rhythmAction = safeStoryField(
    rhythm?.actionNow ?? "",
    "通用动作是记录一周的负荷、专注和恢复，再只调整一项可以观察的安排。",
  );
  const rhythmLongTerm = safeStoryField(
    rhythm?.actionLongTerm ?? "",
    "通用长期方法是固定复盘时间，每次只改变一个变量，并保留停止与求助条件。",
  );
  const rhythmAdvantage = safeStoryField(
    rhythm?.advantageVersion ?? "",
    "通用观察是把恢复纳入任务计划，并根据连续记录调整工作与休息。",
  );

  const situation = storyBeat(
    "situation",
    `眼前的处境${texture.situation}。${selfScenario}`,
    self,
  );
  const desire = storyBeat(
    "desire",
    `在这段处境里，你真正想守住的是${texture.desiredOutcome}：${asConnectedClause(talentAdvantage)}。这份能力要接受“${lessonIntent}”的约束，才会从愿望进入现实行动。${stable.hourUnknown ? UNKNOWN_TIME_SENTENCE : ""}`,
    talent,
  );
  const opening = career
    ? storyBeat(
        "opening",
        leadIntoStory(
          texture.careerOpeningLead,
          careerAdvantage,
          structure.openingMethod,
        ),
        career,
      )
    : storyBeat(
        "opening",
        leadIntoStory(
          NEUTRAL_TEXTURE.careerOpeningLead,
          DOMAIN_GAP_COPY.career,
          "通用做法是先确认目标、权限和完成标准，再试一项可逆的小动作。",
        ),
        undefined,
      );
  const cost = career
    ? storyBeat(
        "cost",
        leadIntoStory(
          texture.careerCostLead,
          `${asConnectedClause(careerShadow)}。`,
          structure.overuseCost,
        ),
        career,
      )
    : storyBeat(
        "cost",
        leadIntoStory(
          NEUTRAL_TEXTURE.careerCostLead,
          "缺少稳定事业材料时，不能把通用风险写成你的固定模式。这里只提醒：一次承担过多，会让边界和恢复成本变得不可见。",
        ),
        undefined,
      );
  const lowPoint = relationship
    ? storyBeat(
        "low-point",
        leadIntoStory(
          texture.relationshipLowPointLead,
          `${asConnectedClause(relationshipShadow)}。`,
          relation.conflict,
        ),
        relationship,
      )
    : storyBeat(
        "low-point",
        leadIntoStory(
          NEUTRAL_TEXTURE.relationshipLowPointLead,
          DOMAIN_GAP_COPY.relationship,
          "这里只观察事实、影响和未说清的需要，不替任何一方解释动机。",
        ),
        undefined,
      );
  const choice = relationship
    ? storyBeat(
        "choice",
        leadIntoStory(
          texture.relationshipChoiceLead,
          relationshipAction,
          relation.repair,
        ),
        relationship,
      )
    : storyBeat(
        "choice",
        leadIntoStory(
          NEUTRAL_TEXTURE.relationshipChoiceLead,
          "复述事实，提出一项可以回应的具体请求，并约定何时重谈；这不是对你的关系模式下结论。",
        ),
        undefined,
      );
  const turn = rhythm
    ? storyBeat(
        "turn",
        leadIntoStory(
          texture.rhythmTurnLead,
          rhythmAction,
          leadIntoStory(
            texture.transition,
            "节奏稍稍恢复后，人物才有余地回到关系事实，再核对可调整与不可调整的条件。",
          ),
          relation.visibleTurn.replace(/^可见转折是/u, "这时，"),
        ),
        rhythm,
      )
    : storyBeat(
        "turn",
        leadIntoStory(
          NEUTRAL_TEXTURE.rhythmTurnLead,
          "因为没有稳定节奏材料，转折只保留通用观察：减少一项额外负担，恢复基本作息，再看注意力和协作是否出现可见变化。",
        ),
        undefined,
      );
  const matureMethod = rhythm
    ? storyBeat(
        "mature-method",
        leadIntoStory(
          texture.matureLead,
          rhythmLongTerm,
          structure.matureMethod,
          leadIntoStory(
            texture.reviewLead,
            "从此，每轮行动都重新核对这条约定有没有改善现实结果。",
          ),
        ),
        rhythm,
      )
    : storyBeat(
        "mature-method",
        leadIntoStory(
          NEUTRAL_TEXTURE.matureLead,
          DOMAIN_GAP_COPY.rhythm,
          "通用长期方法只是固定复盘时间、一次改变一个变量，并保留停止与求助条件。",
        ),
        undefined,
      );

  const internalStoryBeats = [
    situation,
    desire,
    opening,
    cost,
    lowPoint,
    choice,
    turn,
    matureMethod,
  ];
  const daoPlacementContexts: Readonly<
    Record<DaoPlacement, DaoStoryContext>
  > = hasAnyMaterial
    ? {
        career: {
          scene: career?.scenario ?? careerAdvantage,
          tension: career?.shadowVersion ?? careerShadow,
          turn: career?.actionNow ?? careerAdvantage,
          action: career?.actionLongTerm ?? structure.openingMethod,
        },
        relationship: {
          scene: relationship?.scenario ?? relation.daoScene,
          tension: relationship?.shadowVersion ?? relationshipShadow,
          turn: relationship?.actionNow ?? relationshipAction,
          action: relationship?.actionLongTerm ?? relation.daoAction,
        },
        "turning-point": {
          scene: rhythm?.scenario ?? "需要恢复基本容量的时刻",
          tension: rhythm?.shadowVersion ?? "负荷与恢复尚未重新平衡",
          turn: relation.visibleTurn,
          action: rhythm?.actionNow ?? rhythmAction,
        },
        closing: {
          scene: rhythm?.advantageVersion ?? rhythmAdvantage,
          tension: structure.daoTension,
          turn: lessonIntent,
          action: rhythm?.actionLongTerm ?? rhythmLongTerm,
        },
      }
    : {
        career: {
          scene: "只观察一项事业小试验",
          tension: "事业信息仍待核对",
          turn: "完成一项可撤回试验",
          action: "写清目标权限和停止点",
        },
        relationship: {
          scene: "只观察一次关系对话",
          tension: "关系事实仍待补充",
          turn: "提出一项可回应请求",
          action: "复述事实影响和需要",
        },
        "turning-point": {
          scene: "只观察一周负荷变化",
          tension: "节奏记录仍不完整",
          turn: "减少一个现实变量",
          action: "记录负荷恢复和反馈",
        },
        closing: {
          scene: "只回看已经核对的部分",
          tension: "全卷材料仍有留白",
          turn: "保留一项有效改变",
          action: "约定复查时间和边界",
        },
      };
  const daoResult = buildDaoStoryNotesWithFrames(
    selectNarrativeDaoThemes(
      stable.structureBalance,
      stable.relations,
      hasAnyMaterial,
      career !== undefined,
      rhythm !== undefined,
    ),
    daoPlacementContexts.closing,
    hasAnyMaterial ? DAO_FRAMES : NEUTRAL_DAO_FRAMES,
    daoPlacementContexts,
  );
  const mirrors = buildStoryMirrors(chart);
  const missingDomains = ([
    ["career", career],
    ["relationship", relationship],
    ["rhythm", rhythm],
  ] as const)
    .filter((entry): entry is readonly [MissingDomain, undefined] => !entry[1])
    .map(([domain]) => `missing-domain:${domain}`);

  const turningReflection = leadIntoStory(
    texture.reflectionLead,
    `${asConnectedClause(joinCompleteSentences(
      "这个转折是否成立，要看行动后是否出现可观察的新反馈",
      "把这条行动约定放在这里，是为了让选择继续接受相关人的回应，而不是宣告人物已经改变",
    ))}。`,
  );
  const matureReflection = rhythm
    ? completeSentence(
        `${rhythmAdvantage}${texture.maturity}。每次复盘只保留一项有新事实支持的调整，让长期方法既能累积，也能被停止或修正`,
      )
    : completeSentence(
        "缺少稳定节奏材料时，成熟只作通用观察：记录负荷、恢复和实际结果，连续异常或明显不适则停止自行解释并寻求专业帮助",
      );
  const narrative: LifeScrollNarrative = {
    oneLineTheme: hasAnyMaterial
      ? texture.theme
      : "稳定材料不足时，先用通用观察守住边界与下一步",
    openingScene: [situation.text, desire.text],
    careerArc: [opening.text, cost.text],
    relationshipArc: [lowPoint.text, choice.text],
    turningPointArc: [turn.text, turningReflection],
    matureArc: [matureMethod.text, matureReflection],
    animalInterlude: mirrors.animal,
    historicalInterlude: mirrors.historical,
    daoNotes: daoResult.daoNotes,
    closingLine: joinCompleteSentences(
      texture.closing,
      "这卷故事不预告结局，只把稳定材料能够支持的当下具体处境、代价、选择和复盘方式放在眼前",
    ),
    actionNow: completeSentence(
      `今天把“${lessonIntent}”落实到一件正在推进的事上，同时写下完成标准、停止条件和下一次检查时间`,
    ),
    internalStoryBeats,
    internalEvidenceIds: [
      ...new Set(internalStoryBeats.flatMap(beatItem =>
        beatItem.internalEvidenceId ? [beatItem.internalEvidenceId] : []
      )),
    ],
    uncertaintyFlags: [
      ...stable.uncertaintyFlags,
      ...missingDomains,
      ...daoResult.uncertaintyFlags,
    ],
  };

  return deepFreeze(narrative);
}

export type LifeScrollUncertaintyFlag =
  | StableStoryUncertaintyFlag
  | `missing-domain:${MissingDomain}`
  | `dao-note-fallback:${string}`;
