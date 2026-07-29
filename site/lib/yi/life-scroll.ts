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

type BaseLifeScrollRecommendations = Readonly<{
  idiom: Readonly<{ phrase: string; commentary: string }>;
  proverb: Readonly<{ phrase: string; commentary: string }>;
  poem: Readonly<{ title: string; commentary: string }>;
  classicalMusic: Readonly<{ title: string; commentary: string }>;
  jayChouSong: Readonly<{ title: string; commentary: string }>;
}>;

export type LifeScrollRecommendations = Readonly<{
  idiom: Readonly<{ phrase: string; commentary: string }>;
  proverb: Readonly<{ phrase: string; commentary: string }>;
  poem: Readonly<{ title: string; original: string; commentary: string }>;
  classicalMusic: Readonly<{ title: string; commentary: string }>;
  jayChouSong: Readonly<{ title: string; lyricImagery: string; commentary: string }>;
  herb: Readonly<{ title: string; commentary: string }>;
  mountain: Readonly<{ title: string; commentary: string }>;
  lifeBook: Readonly<{ title: string; commentary: string }>;
  settingPoem: Readonly<{ title: string; original: string; commentary: string }>;
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
  recommendations: LifeScrollRecommendations;
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
  desireScene: string;
  careerScene: string;
  careerActionScene: string;
  relationshipScene: string;
  relationshipActionScene: string;
  rhythmScene: string;
  rhythmActionScene: string;
  matureScene: string;
}>;

type StructureFrame = Readonly<{
  openingMethod: string;
  overuseCost: string;
  matureMethod: string;
}>;

type RelationFrame = Readonly<{
  conflict: string;
  repair: string;
  visibleTurn: string;
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

const RECOMMENDATION_LIBRARY: Readonly<Record<ElementName | "neutral", BaseLifeScrollRecommendations>> = {
  木: {
    idiom: { phrase: "厚积薄发", commentary: "像树根在土里慢慢铺开，眼前不急着抢一时热闹，先把基本功、关系和节奏养厚；等风来时，枝叶自然会往上走。" },
    proverb: { phrase: "十年树木，百年树人", commentary: "这句俗语提醒你：真正改命不是一夜翻盘，而是每天把念头扶正一点，把行动种深一点，日久自然成林。" },
    poem: { title: "《诗经·桃夭》", commentary: "适合读它的生发之气：不是空喊兴旺，而是让一个人把温柔、秩序和新生活一点点带进家门。" },
    classicalMusic: { title: "《高山流水》", commentary: "木的生长需要知音和回响，这首曲子像山水之间的相逢，提醒你别只赶路，也要找到能听懂你节奏的人。" },
    jayChouSong: { title: "周杰伦《稻香》", commentary: "这首歌适合做低谷时的回家路：先把心收回真实生活，饭香、田埂、家人和小愿望，都能把人从虚火里拉回来。" },
  },
  火: {
    idiom: { phrase: "光风霁月", commentary: "火不是一直烧到尽头，而是把心照亮之后仍有清明；热情要有光，也要有分寸。" },
    proverb: { phrase: "心急吃不了热豆腐", commentary: "这句俗语很朴素，却正好压住火气：越重要的事，越不能靠急吼吼取胜，先降温，话才进得了人心。" },
    poem: { title: "泰戈尔《飞鸟集》", commentary: "适合借它读一种明亮而轻盈的心：真正的光不压人，它照见方向，也给别人留下回应的天空。" },
    classicalMusic: { title: "《阳春白雪》", commentary: "清亮、开阔、有上扬之气，适合提醒自己：表达要有锋芒，也要有雅量。" },
    jayChouSong: { title: "周杰伦《晴天》", commentary: "它适合放在情绪转折处：有热、有遗憾、有少年气，但最后还是要学会把那场雨唱成回忆。" },
  },
  土: {
    idiom: { phrase: "稳扎稳打", commentary: "土的本事不在声势，而在承载。一步一脚印，把责任、边界、交付都落在地上，才不怕风吹。" },
    proverb: { phrase: "一口吃不成胖子", commentary: "这句俗语替你拆掉焦虑：大事慢慢来，先把今天能扛的一小段扛稳，命运就有了新的落脚点。" },
    poem: { title: "陶渊明《归园田居》", commentary: "适合读它的安顿感：不是退缩，而是知道什么东西值得守，什么喧哗可以放下。" },
    classicalMusic: { title: "《平沙落雁》", commentary: "这首曲子有落地之美，像雁群归队，提醒你把漂浮的念头收回秩序与日常。" },
    jayChouSong: { title: "周杰伦《听妈妈的话》", commentary: "适合土气重责任的人听：真正的成熟不是硬扛到底，而是记得来处，也懂得把爱落实到行动。" },
  },
  金: {
    idiom: { phrase: "去芜存菁", commentary: "金的力量是取舍：把杂音削掉，把标准立住，留下真正锋利、真正有用的那一部分。" },
    proverb: { phrase: "磨刀不误砍柴工", commentary: "先校准工具、规则和边界，再出手，反而走得快；急着砍，刀钝了，力气都白费。" },
    poem: { title: "王昌龄《从军行》", commentary: "适合读它的决断与骨气：不为噪声乱阵，关键时候守住一口硬气。" },
    classicalMusic: { title: "《十面埋伏》", commentary: "它有锋利的局势感，提醒你看清来路去路，判断之后再行动，不在混乱里乱挥刀。" },
    jayChouSong: { title: "周杰伦《将军》", commentary: "适合金气的布局感：看棋、定势、落子，真正厉害不是逞强，而是知道哪一步最要紧。" },
  },
  水: {
    idiom: { phrase: "水滴石穿", commentary: "水的胜利不是硬碰硬，而是长久、柔韧、不断回到方向；慢一点，也能穿过最硬的石头。" },
    proverb: { phrase: "船到桥头自然直", commentary: "不是躺平等运气，而是提醒你：先把船划到桥头，很多路是在靠近之后才看清的。" },
    poem: { title: "苏轼《定风波》", commentary: "适合读它的从容：风雨来了不必立刻证明自己，先稳住脚步，风过之后，人会更清醒。" },
    classicalMusic: { title: "《渔舟唱晚》", commentary: "水的智慧在回旋与归航，这首曲子像傍晚收桨，提醒你在流动中保留安定。" },
    jayChouSong: { title: "周杰伦《七里香》", commentary: "它有水一样的记忆感：很多关系与时光，不靠用力抓住，而靠细细感受，慢慢回味。" },
  },
  neutral: {
    idiom: { phrase: "知行合一", commentary: "材料不足时，不急着给自己下定义；先把知道的事做成一小步，行动会慢慢照见答案。" },
    proverb: { phrase: "路遥知马力，日久见人心", commentary: "命运也要经得起日子检验。先记录，先行动，时间会替你筛出真正有用的路。" },
    poem: { title: "《诗经·蒹葭》", commentary: "适合读它的寻找感：方向还在水一方，但人已经开始上路；模糊不怕，怕的是不再靠近。" },
    classicalMusic: { title: "《流水》", commentary: "不知道该归哪一类时，就先听水。水不争形，却能绕过阻碍，慢慢找到自己的路。" },
    jayChouSong: { title: "周杰伦《星晴》", commentary: "适合当作轻一点的开场：先把心情抬起来，再去面对具体的事，路就没那么沉。" },
  },
};

const ELEMENT_ORDER: readonly ElementName[] = ["木", "火", "土", "金", "水"];

const POEM_VARIANTS = [
  {
    title: "王之涣《登鹳雀楼》",
    original: "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
    commentary: "这首诗像一架登高的梯子：眼前不够开阔，就先上一步。不是喊口号，而是把视野、位置和动作一起抬高。",
  },
  {
    title: "《诗经·蒹葭》",
    original: "蒹葭苍苍，白露为霜。所谓伊人，在水一方。",
    commentary: "它适合放在寻找方向的时候：目标似乎隔着水雾，但脚步已经开始。人怕的不是远，怕的是心里没了靠近的动作。",
  },
  {
    title: "王维《终南别业》",
    original: "行到水穷处，坐看云起时。",
    commentary: "这两句像一口缓下来的气：路到尽头，不一定是败局，也可能是换一种看法、等一阵云起。",
  },
  {
    title: "刘禹锡《酬乐天扬州初逢席上见赠》",
    original: "沉舟侧畔千帆过，病树前头万木春。",
    commentary: "它适合经历低潮之后的人：旧船沉了，江面仍有千帆；旧枝病了，春天仍会从旁边长出来。",
  },
  {
    title: "苏轼《定风波》",
    original: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。",
    commentary: "这首词像风雨里的稳步：外面有雨，心里不慌；不靠硬撑赢，而靠把脚步踩稳。",
  },
] as const;

const JAY_VARIANTS = [
  { title: "周杰伦《稻香》", lyricImagery: "田埂、饭香、回家路", commentary: "适合低谷回神：先回到真实生活，吃饭、睡觉、把小事做好，心气会慢慢回来。" },
  { title: "周杰伦《晴天》", lyricImagery: "雨后校园、少年遗憾", commentary: "适合关系转折：有些雨不用立刻解释，先把遗憾唱完，再决定要不要重新出发。" },
  { title: "周杰伦《将军》", lyricImagery: "棋盘、落子、局势", commentary: "适合做取舍：别在每个角落用力，先看全局，再落最要紧的一子。" },
  { title: "周杰伦《七里香》", lyricImagery: "夏天、窗外、风中香气", commentary: "适合慢慢修复：关系里的好东西，有时不是抓住，而是让它在日常里重新有香气。" },
  { title: "周杰伦《星晴》", lyricImagery: "星空、骑车、轻快心情", commentary: "适合重新点亮自己：先让心情抬头，再谈计划；人亮一点，路也亮一点。" },
] as const;

const HERB_VARIANTS = [
  { title: "黄芪", commentary: "像一味补气之药：不抢戏，却能把底气托起来。适合把作息、边界、长期体力补成根基。" },
  { title: "陈皮", commentary: "像会化开郁结的老皮：经历越多，越知道怎样把堵住的话、堵住的情绪慢慢理顺。" },
  { title: "当归", commentary: "像把血脉与归处牵回来的药：适合提醒自己别只赶路，也要把身体、家人和来处照顾好。" },
  { title: "石斛", commentary: "像山石间的清润：外面环境硬，内里仍要养出一口不燥的水气。" },
  { title: "杜仲", commentary: "像支撑腰骨的树皮：适合扛责任的人，提醒你强不是硬顶，而是有弹性地承重。" },
] as const;

const MOUNTAIN_VARIANTS = [
  { title: "泰山", commentary: "像泰山，重在稳、正、能承众望。人生关键不是一时高，而是站得住。" },
  { title: "华山", commentary: "像华山，险处见胆。适合在选择面前拿出锋芒，但每一步都要踩实。" },
  { title: "黄山", commentary: "像黄山，奇松怪石云海并存。你的路不必普通，重要的是把奇处长成美处。" },
  { title: "峨眉山", commentary: "像峨眉，柔中有峰。看似温和，真正遇事时有自己的高度。" },
  { title: "阿尔卑斯山", commentary: "像雪山长线，清冷、辽阔、需要耐力。适合把人生看成一场慢慢攀登。" },
] as const;

const BOOK_VARIANTS = [
  { title: "《论语》", commentary: "适合作为人生之书：把做人、处事、学习、反省都落到每日言行。" },
  { title: "《道德经》", commentary: "适合作为人生之书：学会不硬争，学会顺势，也学会在柔处藏力量。" },
  { title: "《庄子》", commentary: "适合作为人生之书：把心从小框里放出来，看见更大的天地。" },
  { title: "《史记》", commentary: "适合作为人生之书：看成败沉浮，学人情局势，也学人在大风里怎样留名。" },
  { title: "《大学》", commentary: "适合作为人生之书：从修身起步，把心、事、家、业一层层理顺。" },
] as const;

const SETTING_POEMS = [
  { title: "定场诗 · 起枝", original: "一念如芽破旧尘，半窗风雨半窗春。今日先修三寸土，来年自有满庭新。", commentary: "适合生长型人生：先修土，再等芽。别急着看满园，今天把一寸根扎稳。" },
  { title: "定场诗 · 明灯", original: "灯照长街夜未央，心头一点胜骄阳。开门不必声声急，先把前程说亮堂。", commentary: "适合表达型人生：你要发光，但不是灼人；把话说亮，路就清楚。" },
  { title: "定场诗 · 厚土", original: "肩上风霜脚下田，慢行也到碧云边。人间万事先安顿，一寸深根一寸天。", commentary: "适合承载型人生：慢，不是弱；稳，是你的大本事。" },
  { title: "定场诗 · 金声", original: "乱线千头一刃裁，清声落处雾云开。莫嫌取舍无人懂，留得真金照后来。", commentary: "适合取舍型人生：删繁就简，留下真正值钱的部分。" },
  { title: "定场诗 · 行舟", original: "一舟灯影过寒湾，水转云回路几弯。不与急流争片刻，终将明月载回还。", commentary: "适合流动型人生：绕路不是输，能到岸才是本事。" },
] as const;

function chartVariantIndex(chart: Readonly<FourPillarsResult>): number {
  const signature = [
    chart.pillars.year.stem,
    chart.pillars.year.branch,
    chart.pillars.month.stem,
    chart.pillars.month.branch,
    chart.pillars.day.stem,
    chart.pillars.day.branch,
    chart.pillars.hour?.stem ?? "",
    chart.pillars.hour?.branch ?? "",
  ].join("");
  return [...signature].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
}

function enrichRecommendations(
  base: BaseLifeScrollRecommendations,
  chart: Readonly<FourPillarsResult>,
): LifeScrollRecommendations {
  const elementOffset = ELEMENT_ORDER.indexOf(chart.professional.dayMaster.element);
  const variant = chartVariantIndex(chart);
  const shifted = (variant + Math.max(0, elementOffset)) % 5;
  return {
    ...base,
    poem: POEM_VARIANTS[shifted],
    jayChouSong: JAY_VARIANTS[(shifted + 2) % 5],
    herb: HERB_VARIANTS[(shifted + 1) % 5],
    mountain: MOUNTAIN_VARIANTS[(shifted + 3) % 5],
    lifeBook: BOOK_VARIANTS[(shifted + 4) % 5],
    settingPoem: SETTING_POEMS[shifted],
  };
}

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
    desireScene:
      "方向还不完整时，你把零散线索接成一条可试的路径，也允许第一版在反馈中修剪。",
    careerScene:
      "新项目刚启动时，你把所有想法画成一张分支图，只选一条能在三天内交付的小枝先做。",
    careerActionScene:
      "第一版交出去后，再依据使用者反馈决定继续生长、改向还是停下。",
    relationshipScene:
      "两个人商量下一年的生活安排时，你先写下共同目标，再分别说明各自需要保留的空间。",
    relationshipActionScene:
      "方向一致不等于每一步相同，先约定一个月后的复查点，比催对方立刻跟上更可靠。",
    rhythmScene:
      "新想法连续冒出来的一周，你只保留一项正在生长的任务，其余放进候选清单。",
    rhythmActionScene:
      "连续两周比较完成量与恢复感，没有现实进展的枝线暂不追加投入。",
    matureScene:
      "每个季度回看一次正在推进的方向，保留有成果和反馈支撑的部分，停止只靠热情维持的支线。成熟不是长得更多，而是知道何时扶正、何时修剪。",
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
    desireScene:
      "重点刚被看见时，你把热情收成一个能被复述的问题，再邀请现场补上不同意见。",
    careerScene:
      "重要方案第一次亮相时，你把内容收成一页重点和一个明确请求，用十分钟讲完，再把剩余时间交给现场提问。",
    careerActionScene:
      "别人能复述重点，才说明这次表达真正照亮了问题。",
    relationshipScene:
      "争论的音量和语速开始上升时，双方先暂停二十分钟，再轮流说事实、感受和请求。",
    relationshipActionScene:
      "每个人说完后请对方复述，避免把沉默直接解释成冷淡或拒绝。",
    rhythmScene:
      "一轮发布、授课或公开表达结束后，不马上承诺下一场高强度任务，先留出半天收尾和恢复。",
    rhythmActionScene:
      "三天后再看睡眠、注意力与反馈质量，决定是否重新加量。",
    matureScene:
      "每次重要表达前写清受众、重点和希望得到的回应，结束后也安排固定降温时间。热情能够反复点亮事情，却不再依赖持续燃烧自己。",
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
    desireScene:
      "责任逐渐聚拢时，你先把承接范围画清，再确认哪些重量需要共同分担。",
    careerScene:
      "临时接手项目时，你把负责人、决定权限、交付物和验收人放进同一张责任表。",
    careerActionScene:
      "会后若仍有任务无人承接，就公开补位，不再默认由最可靠的人继续兜底。",
    relationshipScene:
      "家庭照顾或家务分工开始失衡时，把一周任务逐项摆到日历上，标出谁发起、谁执行、谁收尾。",
    relationshipActionScene:
      "先归还一项长期代办，再观察关系是否因为边界清楚而轻松一些。",
    rhythmScene:
      "日程已经没有空白时，先移出一项并非必须由自己完成的任务，把腾出的时间真正留给吃饭、睡眠或安静恢复。",
    rhythmActionScene:
      "七天后比较负荷与精力，确认减量有没有发生，而不是只换一种忙法。",
    matureScene:
      "每月核对一次责任台账，区分亲自承担、共同承担、可以交接和应该停止的事项。稳定来自重量被合理分配，不来自一个人永远不说累。",
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
    desireScene:
      "混乱需要被切开时，你先写下能核对的标准，也给例外和异议留下位置。",
    careerScene:
      "评审新方案时，你先列出三项必须达到的标准，再单列允许试验的例外。",
    careerActionScene:
      "两个方案各做一次小样，用真实结果决定取舍，避免标准还没经过现场就变成裁决。",
    relationshipScene:
      "讨论周末安排或共同预算时，先把不能退让的底线与仍可协商的部分分开。",
    relationshipActionScene:
      "每一方都说完理由后再决定，清楚不再等于谁先下结论。",
    rhythmScene:
      "一天结束前，你先关闭已经完成或暂时无须推进的事项，写下明天唯一必须处理的重点。",
    rhythmActionScene:
      "停止时间之后不再新增任务，让判断从疲惫中退出来。",
    matureScene:
      "每次重要决定都保留结论、依据、例外和复查日期。准确不是一次切得最干净，而是标准在新事实出现时仍能修正。",
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
    desireScene:
      "信号从不同方向涌来时，你先分清主流与支流，让变化服务一个长期问题。",
    careerScene:
      "同时出现两个机会时，你分别给它们设七天试验、投入上限和停止条件。",
    careerActionScene:
      "到期只比较新增事实、真实成本与协作反馈，再决定哪条路进入主线。",
    relationshipScene:
      "临时改变计划时，你先说清哪项承诺不变、哪部分可以调整，以及何时再次确认。",
    relationshipActionScene:
      "变化有了坐标，对方才不必把改道理解成随时撤回。",
    rhythmScene:
      "信息多到无法排序时，先关闭三个非必要入口，只保留一个信息源和一个当天动作。",
    rhythmActionScene:
      "完成后再决定是否打开下一条通道，不让新鲜信息不断冲散注意力。",
    matureScene:
      "每月画一次决定地图，标出当前主线、备用路径和允许切换的条件。灵活仍被保留，但每次改道都要重新回答它是否服务长期方向。",
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
  desireScene:
    "材料尚未稳定时，只选择一件低风险的小事验证，不把一次结果扩大成人生结论。",
  careerScene:
    "面对一项新任务，先写清目标、权限、验收方式和可以撤回的位置。",
  careerActionScene:
    "完成一轮小试验后，只根据新增事实决定继续、调整还是停止。",
  relationshipScene:
    "面对一场尚未说清的对话，只记录事实、影响和双方实际说出的请求。",
  relationshipActionScene:
    "先请对方复述理解，再约定一个可以观察的新动作和重谈时间。",
  rhythmScene:
    "面对一周负荷变化，只减少一个变量，并记录注意力、睡眠和结束时间。",
  rhythmActionScene:
    "记录满七天后再比较变化，不用一天轻松或疲惫替长期节奏下结论。",
  matureScene:
    "每次复盘只保留有新事实支持的做法，同时写清停止条件和求助入口。未知部分继续留白，已经确认的部分允许下一轮修正。",
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
  },
  mixed: {
    openingMethod:
      "开门方法是先排出冲突条件，再选择一项能够同时照顾推进与补给的小试验。",
    overuseCost:
      "过度的一端是在多个方向间反复切换，忙于平衡，却没有留下清楚的主次。",
    matureMethod:
      "长期方法要固定主线与复盘节点，只在新事实真正改变判断时调整路线。",
  },
  "expression-heavy": {
    openingMethod:
      "开门方法是先收束输出目标，确认接收者和验收方式，再把速度用于关键一步。",
    overuseCost:
      "过度的一端是行动和表达持续加速，理解、恢复与协作容量却来不及跟上。",
    matureMethod:
      "长期方法要在每次输出后安排恢复和反馈，让速度不再依靠持续透支。",
  },
};

const NEUTRAL_STRUCTURE: StructureFrame = {
  openingMethod:
    "通用的开门方法是先做一项可逆的小试验，再依据真实反馈决定是否增加投入。",
  overuseCost:
    "结构尚未稳定时，不把一次顺利或吃力扩大成长期结论，只记录具体条件与结果。",
  matureMethod:
    "长期方法先保留检查点和停止条件，让未知部分继续留白。",
};

const RELATION_FRAMES: Readonly<Record<ChartRelation["type"], RelationFrame>> = {
  "stem-combination": {
    conflict:
      "低点常来自口头方向看似一致，负责人、期限和完成标准却没有真正对齐。",
    repair:
      "修复要把共同意图写成负责人、期限与完成标准，再让双方复述各自理解。",
    visibleTurn:
      "可见转折是口头共识开始变成各方都能核对的书面约定。",
  },
  "branch-combination": {
    conflict:
      "低点常来自配合越来越顺手，资源归属、个人边界和退出条件反而被省略。",
    repair:
      "修复要先确认共同目标，再把资源归属、退出条件和复核时间逐项说清。",
    visibleTurn:
      "可见转折是默契之外出现清楚边界，合作不再依赖任何一方自行猜测。",
  },
  "branch-trine": {
    conflict:
      "低点常来自多方力量同时加码，热度越来越高，容量和停止条件却无人提醒。",
    repair:
      "修复要把分散力量收回一个共同目标，并设置阶段检查点与停止条件。",
    visibleTurn:
      "可见转折是团队从同时加码改为分段投入，每一步都有容量检查。",
  },
  "branch-clash": {
    conflict:
      "低点常来自时间表、立场或方向正面对撞，事实还没核对，反应已经彼此升级。",
    repair:
      "修复要暂停即时结论，分列双方事实与不可让渡项，再安排限时协调。",
    visibleTurn:
      "可见转折是对撞被拆成具体条件，双方开始讨论可调整与不可调整之处。",
  },
  "branch-punishment": {
    conflict:
      "低点常来自同一问题反复加码，责任与情绪纠缠后，旧办法被用得更重。",
    repair:
      "修复要记录触发顺序并设置停止条件，必要时请第三方拆开责任与情绪。",
    visibleTurn:
      "可见转折是重复循环第一次在固定位置停下，新的回应得以进入。",
  },
  "branch-harm": {
    conflict:
      "低点常来自信息与期待错位，未说清的顾虑在表面平静下继续累积。",
    repair:
      "修复要先复述听见的意思，再补问遗漏条件，不根据暗示替对方决定。",
    visibleTurn:
      "可见转折是暗示被具体问题取代，误解在继续累积前得到核对。",
  },
  "branch-break": {
    conflict:
      "低点常来自旧约定已经松动，新安排尚未接住责任和资源，现场只剩临时补洞。",
    repair:
      "修复要逐条核对旧约定的适用范围，保留可用部分并写下过渡安排。",
    visibleTurn:
      "可见转折是旧接口被明确更新，责任和资源重新找到承接位置。",
  },
};

const NEUTRAL_RELATION: RelationFrame = {
  conflict:
    "关系材料不足时，不替任何一方解释动机，只观察事实、影响与尚未说清的需要。",
  repair:
    "通用修复从复述事实、提出具体请求和约定重谈时间开始，不预设谁应该让步。",
  visibleTurn:
    "只有当相关的人都能观察并确认一项新的回应时，才把它视为可见转折。",
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

const DAO_STORY_CONTEXTS: Readonly<
  Record<DaoPlacement, DaoStoryContext>
> = {
  career: {
    scene: "目标与权限未对齐的新任务",
    tension: "责任已落下，权限仍未说清",
    turn: "把目标和验收人写进同一页",
    action: "比较两次交付的返工和责任空白",
  },
  relationship: {
    scene: "期待尚未说出口的重要对话",
    tension: "双方只顾解释，未复述请求",
    turn: "逐项说清事实感受需要和请求",
    action: "约定重谈并核对新规则",
  },
  "turning-point": {
    scene: "连续加量后注意力下降的一周",
    tension: "任务增加，恢复窗口被挤掉",
    turn: "移出一项负荷并记录变化",
    action: "比较睡眠专注和结束时间",
  },
  closing: {
    scene: "十二周记录后的复盘",
    tension: "一次调整正被当成长久答案",
    turn: "只保留新事实支持的做法",
    action: "写下复查停止和求助条件",
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

function conciseDaoSlot(
  value: string,
  fallback: string,
  slot: "scene" | "tension" | "turn" | "action",
  maximumHan = 16,
): string {
  const rewritten = rewriteReviewedStoryText(value);
  const candidate = rewritten
    .split(/[。！？；，,]/u)
    .map(part => part.trim())
    .find(Boolean);
  if (!candidate) return fallback;
  const length = countHan(candidate);
  const invalidEnding = /[而和与并再把将在为时后里]$/u.test(candidate);
  const invalidOpening = (slot === "turn" || slot === "action")
    && /^(?:并|再|先|随后|接着)/u.test(candidate);
  const invalidScene = slot === "scene"
    && /(?:提醒|适合|开始|完成)$/u.test(candidate);
  const invalidFragment =
    /时(?:成为|已经|让|后)|人物先(?:并|再)|提醒观察(?:成为|已经|让)|当[^，。]{2,18}已经/u
      .test(candidate);
  return length >= 4
      && length <= maximumHan
      && !PUBLIC_FORBIDDEN.test(candidate)
      && !invalidEnding
      && !invalidOpening
      && !invalidScene
      && !invalidFragment
    ? candidate
    : fallback;
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
  const safeScene = conciseDaoSlot(
    context.scene,
    fallbackContext.scene,
    "scene",
  );
  const safeContext: DaoFrameContext = {
    tension: conciseDaoSlot(
      context.tension,
      fallbackContext.tension,
      "tension",
    ),
    turn: conciseDaoSlot(
      context.turn,
      fallbackContext.turn,
      "turn",
    ),
    scene: safeScene,
    action: conciseDaoSlot(
      context.action,
      fallbackContext.action,
      "action",
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
      "small-steps",
      "self-knowledge",
      "patience",
      "completion",
    ];
  }

  const hasCooperativeRelation = relations.some(relation =>
    relation.type === "stem-combination"
    || relation.type === "branch-combination"
    || relation.type === "branch-trine");
  const hasTenseRelation = relations.some(relation =>
    relation.type === "branch-clash"
    || relation.type === "branch-punishment"
    || relation.type === "branch-harm"
    || relation.type === "branch-break");
  const careerTheme: DaoNoteTheme = hasCareerMaterial
    && structureBalance === "support-heavy"
    ? "long-road"
    : "small-steps";
  const relationshipTheme: DaoNoteTheme = hasCooperativeRelation
    ? "service"
    : "self-knowledge";
  const turningTheme: DaoNoteTheme = !hasRhythmMaterial
    ? "patience"
    : hasTenseRelation
    ? "bend"
    : structureBalance === "expression-heavy"
    ? "flexibility"
    : structureBalance === "support-heavy"
    ? "reversal"
    : "patience";

  return [
    careerTheme,
    relationshipTheme,
    turningTheme,
    "completion",
  ];
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
  const texture = hasAnyMaterial && stable.dayMasterElement
    ? ELEMENT_TEXTURES[stable.dayMasterElement]
    : NEUTRAL_TEXTURE;
  const recommendationBase = hasAnyMaterial && stable.dayMasterElement
    ? RECOMMENDATION_LIBRARY[stable.dayMasterElement]
    : RECOMMENDATION_LIBRARY.neutral;
  const recommendations = enrichRecommendations(recommendationBase, chart);
  const structure = stable.structureBalance
    ? STRUCTURE_FRAMES[stable.structureBalance]
    : NEUTRAL_STRUCTURE;
  const relation = stable.relations[0]
    ? RELATION_FRAMES[stable.relations[0].type]
    : NEUTRAL_RELATION;
  const lessonIntent = extractLessonIntent(stable.currentLesson)
    ?? "先把事实、边界和下一次检查时间说清";

  const situation = storyBeat(
    "situation",
    `眼前的处境${texture.situation}。${texture.desireScene}`,
    self,
  );
  const desire = storyBeat(
    "desire",
    `在这段处境里，你真正想守住的是${texture.desiredOutcome}。接下来要让“${lessonIntent}”进入一个可检查的现实动作，而不是停在愿望里。${stable.hourUnknown ? UNKNOWN_TIME_SENTENCE : ""}`,
    talent,
  );
  const opening = career
    ? storyBeat(
        "opening",
        joinCompleteSentences(
          texture.careerOpeningLead,
          texture.careerScene,
          texture.careerActionScene,
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
        joinCompleteSentences(
          texture.careerCostLead,
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
        joinCompleteSentences(
          texture.relationshipLowPointLead,
          texture.relationshipScene,
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
        joinCompleteSentences(
          texture.relationshipChoiceLead,
          texture.relationshipActionScene,
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
        joinCompleteSentences(
          texture.rhythmTurnLead,
          texture.rhythmScene,
          texture.rhythmActionScene,
          "稍稳后，再把关系条件带回对话",
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
        joinCompleteSentences(
          texture.matureLead,
          texture.matureScene,
          structure.matureMethod,
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
    ? DAO_STORY_CONTEXTS
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

  const turningReflection = joinCompleteSentences(
    texture.reflectionLead,
    texture.transition,
    texture.reviewLead,
  );
  const matureReflection = rhythm
    ? joinCompleteSentences(
        texture.maturity,
        texture.reviewLead,
        texture.reflectionLead,
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
    recommendations,
    daoNotes: daoResult.daoNotes,
    closingLine: joinCompleteSentences(
      texture.closing,
      "这卷故事不预告结局，只把稳定材料能够支持的当下具体处境、代价、选择和复盘方式放在眼前",
      `本卷的定场回声落在${recommendations.settingPoem.title}：先记住这一句，再回到今天的行动`,
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
