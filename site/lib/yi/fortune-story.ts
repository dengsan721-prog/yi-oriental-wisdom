import {
  buildFortuneTimeline,
  calculateTenGod,
  type FortunePeriod,
} from "./fortune";
import type {
  BirthInput,
  FourPillarsResult,
  TenGodName,
} from "./types";

export type FortuneStoryYear = Readonly<{
  age: number;
  year: number;
  title: string;
  scene: string;
  action: string;
}>;

export type FortuneStoryPeriod = Readonly<{
  id: string;
  ageRange: string;
  yearRange: string;
  title: string;
  openingScene: string;
  careerScene: string;
  resourceScene: string;
  relationshipScene: string;
  familyScene: string;
  rhythmScene: string;
  favorableCurrent: string;
  likelyCost: string;
  actions: readonly [string, string, string];
  years: readonly [FortuneStoryYear, ...FortuneStoryYear[]];
  internalMethodIds: readonly string[];
}>;

export type FortuneStoryTimeline =
  | Readonly<{
      status: "available";
      timingNote: string;
      periods: readonly [FortuneStoryPeriod, ...FortuneStoryPeriod[]];
    }>
  | Readonly<{
      status: "unavailable";
      reason: "unknown-time" | "gender-unspecified";
      explanation: string;
    }>;

type StoryCategory =
  | "peer"
  | "expression"
  | "resource"
  | "authority"
  | "learning";

type PeriodStoryFrame = Readonly<{
  title: string;
  careerScene: string;
  resourceScene: string;
  relationshipScene: string;
  familyScene: string;
  rhythmScene: string;
  favorableCurrent: string;
  likelyCost: string;
  actions: readonly [string, string, string];
}>;

type AnnualStoryFrame = Readonly<{
  title: string;
  firstMove: string;
  benefit: string;
  risk: string;
  turn: string;
}>;

const PERIOD_STORY_FRAMES: Readonly<
  Record<StoryCategory, PeriodStoryFrame>
> = {
  peer: {
    title: "在合作中守住自己的位置",
    careerScene:
      "工作推进适合拆出各自负责的部分，再用共同里程碑把成果接到一起。",
    resourceScene:
      "资源安排先区分个人储备、共同额度和临时支出，让每一笔投入都有清楚去处。",
    relationshipScene:
      "关系里同时保留自主与陪伴，重要决定先询问，不把熟悉当成默认授权。",
    familyScene:
      "家庭分工从谁更应该做，转成谁负责、怎样轮换以及何时重新商量。",
    rhythmScene:
      "协作之外保留不被占用的独处时间，并用固定对齐减少反复沟通的消耗。",
    favorableCurrent:
      "顺风处在于既能提出自己的判断，也能让同伴清楚接住责任。",
    likelyCost:
      "最容易吃亏的地方是忙着比较或抢先，最后每个人都很用力，却没有共同结果。",
    actions: [
      "画出个人责任与共同责任的边界。",
      "为共享资源建立记录和固定复核日。",
      "为分歧约定暂停信号与重谈时间。",
    ],
  },
  expression: {
    title: "把想法做成能被使用的作品",
    careerScene:
      "工作上先把观点做成可以试用的小成果，再根据反馈决定是否扩大范围。",
    resourceScene:
      "资源优先支持稳定产出和真实体验，同时给试错设定清楚的时间与金额上限。",
    relationshipScene:
      "表达主张时先听完对方，再说具体请求，让彼此回应事情，而不只回应判断。",
    familyScene:
      "家庭经验可以分享，但每个人仍保留选择不同做法和提出修正的空间。",
    rhythmScene:
      "输出高峰之后主动安排收尾与恢复，避免持续兴奋挤掉必要的休息。",
    favorableCurrent:
      "顺风处在于能把复杂经验讲清、做出原型，并愿意让反馈修正作品。",
    likelyCost:
      "最容易吃亏的地方是只顾表达速度，或者一直打磨却迟迟不完成交付。",
    actions: [
      "选择一个主题完成最小可交付版本。",
      "收集三条具体反馈后只修改关键部分。",
      "分别为表达、收尾和恢复预留时间。",
    ],
  },
  resource: {
    title: "让机会、预算与承诺排成次序",
    careerScene:
      "工作选择同时核对机会质量、现有任务和真实交付容量，不让新选项挤掉主线。",
    resourceScene:
      "资源管理聚焦预算、现金流和归属边界，每增加一项投入，就写明上限与退出条件。",
    relationshipScene:
      "关系中把时间、金钱和照顾怎样分配说清楚，让善意留在双方都能承担的范围内。",
    familyScene:
      "家庭安排把长期固定成本与临时需求分开商量，避免一个人长期默默兜底。",
    rhythmScene:
      "每接受一项新机会，同步减少或暂停另一项占用，为恢复保留真实时间。",
    favorableCurrent:
      "顺风处在于能看见现实机会，也能守住核心承诺，让资源持续流动。",
    likelyCost:
      "最容易吃亏的地方是舍不得放下任何选项，结果投入分散，重要事项反而缺少支持。",
    actions: [
      "把新机会与现有承诺放进同一张清单。",
      "为试验写下时间上限、金额上限和退出条件。",
      "每月停止一项长期占用却回报很低的事项。",
    ],
  },
  authority: {
    title: "在责任加重时保留判断余地",
    careerScene:
      "工作开始前先确认权限、验收标准和升级路径，再决定能够承担到哪一步以及何时求助。",
    resourceScene:
      "资源安排以风险上限和责任归属为先，不用个人长期硬扛替代正式支持。",
    relationshipScene:
      "关系中区分照顾、控制与共同决定，让共同约定允许双方提出例外和不同意见。",
    familyScene:
      "家庭责任保持可轮换、可求助，能承担不等于必须一直独自承担。",
    rhythmScene:
      "高压任务之后安排明确的降载窗口，用睡眠、休息和任务量观察真实负荷。",
    favorableCurrent:
      "顺风处在于能在压力中保持标准，也能及时暴露阻塞并请求支持。",
    likelyCost:
      "最容易吃亏的地方是长期紧绷或困在程序里，表面负责，判断空间却越来越小。",
    actions: [
      "写清当前责任的权限、期限与停止条件。",
      "为阻塞问题建立一次正式升级机制。",
      "高压任务结束后安排可以执行的降载日。",
    ],
  },
  learning: {
    title: "让学习走出书架，变成可用方法",
    careerScene:
      "工作中先验证关键假设，再把个人方法整理成团队可以复核的步骤。",
    resourceScene:
      "资源优先支持可信学习与基础能力，每一项新输入都对应一次现实实践。",
    relationshipScene:
      "提供建议前先确认对方是否需要，让支持帮助选择，而不取代对方决定。",
    familyScene:
      "家庭经验可以整理和传承，同时为不同成员保留不同做法与修正权。",
    rhythmScene:
      "输入与独处之后安排身体活动和现实反馈，避免思考一直悬在空中。",
    favorableCurrent:
      "顺风处在于能从可靠材料建立框架，再把知识转成清楚步骤和可分享支持。",
    likelyCost:
      "最容易吃亏的地方是不断增加输入或频繁换方法，用准备感替代真正进入现场。",
    actions: [
      "只保留一个当前最重要的学习主题。",
      "每轮输入之后完成一次现实实践。",
      "把有效步骤写成别人也能核对的说明。",
    ],
  },
};

const ANNUAL_STORY_FRAMES: Readonly<
  Record<TenGodName, AnnualStoryFrame>
> = {
  比肩: {
    title: "自己的那一步先站稳",
    firstMove: "先说出自己愿意负责的一步，再邀请同伴补上另一块",
    benefit: "个人主张和共同任务同时有了位置",
    risk: "只顾证明自己能做，忽略别人已经承担的部分",
    turn: "保留自己的责任，也把需要协作的环节说清",
  },
  劫财: {
    title: "一起做，也把边界说清",
    firstMove: "先把大家共同使用的部分摆出来，再确认哪些仍由各自决定",
    benefit: "热闹的合作开始有了清楚边界",
    risk: "把熟悉当成默认同意，拿走了别人选择的空间",
    turn: "先问一句是否愿意，再约定轮换和归还",
  },
  食神: {
    title: "让一个小作品慢慢成形",
    firstMove: "先做一个别人能看懂的小样，再问对方哪一步最有用",
    benefit: "想法有了可以触摸和回应的形状",
    risk: "只享受开始的新鲜感，到了收尾就换下一件事",
    turn: "先完成一个小版本，再用一条反馈修改",
  },
  伤官: {
    title: "把不同意见说成新办法",
    firstMove: "先说自己看见的差异，再给出一个可以试的新办法",
    benefit: "分歧不再只是顶嘴，而变成了可比较的选择",
    risk: "话说得太快，只留下输赢，没有留下理解",
    turn: "把判断改成事实、影响和一个请求",
  },
  偏财: {
    title: "新选择先小试",
    firstMove: "先挑一个新选项试一小步，不一次把所有东西都拿上",
    benefit: "好奇心有了空间，原来的主线也没有被挤走",
    risk: "每个新鲜选项都想抓住，最后没有一件真正完成",
    turn: "只试一项，并提前说好什么时候停下来看看",
  },
  正财: {
    title: "手边资源排好次序",
    firstMove: "先把手边的时间、物品和帮助排好，完成一件再拿下一件",
    benefit: "日常安排变得安稳，也更容易看见余量",
    risk: "为了不出错把每一步抓得太紧，忘了变化已经出现",
    turn: "保留基本次序，也留一个可以调整的位置",
  },
  七杀: {
    title: "压力来到时先找暂停点",
    firstMove: "先看哪里可以停一下、谁能帮忙，再把难题拆成小步",
    benefit: "紧张局面有了可以下手的第一步",
    risk: "为了赶快证明勇敢，把害怕和求助都藏起来",
    turn: "先说出最担心的一点，再选择一项安全的小动作",
  },
  正官: {
    title: "责任与要求重新对齐",
    firstMove: "先问清要做到什么、自己能决定什么，以及何时请人检查",
    benefit: "责任不再是一句重话，而变成了能完成的步骤",
    risk: "只记住别人期待，却没有确认自己是否真正理解",
    turn: "复述要求、确认一步，再约好检查时间",
  },
  偏印: {
    title: "换个角度试一条新路",
    firstMove: "先从不熟悉的角度看一遍，再用一个小动作验证",
    benefit: "原来卡住的地方出现了新的入口",
    risk: "不停换方法，反而没有留下任何可比较的结果",
    turn: "只保留一个新办法，和原来的做法各试一次",
  },
  正印: {
    title: "把可靠示范练成自己的步骤",
    firstMove: "先跟着一个可靠示范做一遍，再说出自己学会了哪一步",
    benefit: "支持不再只是被照顾，而变成了可以重复的能力",
    risk: "一直等别人给完整答案，不敢开始自己的尝试",
    turn: "请人示范一次，自己完成一次，再一起看哪里要改",
  },
};

const PRESCHOOL_STORY_FRAMES: Readonly<
  Record<TenGodName, AnnualStoryFrame>
> = {
  比肩: {
    title: "我来做这一步",
    firstMove: "先选一块自己来搭，再请家人帮忙扶住另一边",
    benefit: "孩子看见自己能完成一小步，也愿意和别人一起",
    risk: "只想把玩具全拿在自己手里，不让别人碰",
    turn: "说“这块我来，那块一起做”，再轮流一次",
  },
  劫财: {
    title: "轮到谁，先说清",
    firstMove: "先问小伙伴想玩哪一个，再商量一人玩一会儿",
    benefit: "大家都等得到自己的回合，游戏能继续",
    risk: "一着急就去抢玩具，忘了先开口问",
    turn: "把玩具放回中间，说“轮到你，再轮到我”",
  },
  食神: {
    title: "小作品做完给家人看",
    firstMove: "先把一幅画或一座积木搭完，再请家人看看",
    benefit: "孩子的小想法有了能看见的样子",
    risk: "刚玩一会儿就换下一样，地上留下许多没收好的玩具",
    turn: "先收好手上这一样，再选下一样",
  },
  伤官: {
    title: "不一样，也能好好说",
    firstMove: "先指给家人看哪里不一样，再说自己想怎么改",
    benefit: "闹别扭变成了一句能听懂的话",
    risk: "不高兴时只喊“不要”，别人不知道发生了什么",
    turn: "说“我不喜欢这里，我想这样”，再请大人听一遍",
  },
  偏财: {
    title: "新玩具先玩一个",
    firstMove: "先从新玩具里挑一个，玩一会儿再换",
    benefit: "新鲜感有了位置，手边也没有乱成一团",
    risk: "每样都想马上拿到，最后哪个也没玩明白",
    turn: "把没玩的先放回盒子，只留一个在手边",
  },
  正财: {
    title: "玩过的东西送回家",
    firstMove: "先把画笔、积木和故事书各自放回原位",
    benefit: "孩子知道下一次去哪里找到它们",
    risk: "怕别人弄乱，什么都紧紧抱着不肯分享",
    turn: "留下正在用的一样，其他玩具先回到盒子",
  },
  七杀: {
    title: "害怕时先找大人",
    firstMove: "先告诉家人“我有点怕”，再一起做最小的一步",
    benefit: "紧张的时候也有人陪着，孩子不必一个人硬撑",
    risk: "为了显得勇敢，哭了也不肯让人靠近",
    turn: "停一下、牵住照顾者的手，再试一小步",
  },
  正官: {
    title: "小约定变成小动作",
    firstMove: "先听清“收一盒积木”这样的一个小约定，再开始做",
    benefit: "大人的话变成孩子做得到的一步",
    risk: "一次听到太多要求，只记得自己又做错了",
    turn: "请家人只说一件事，做完再说下一件",
  },
  偏印: {
    title: "换一种玩法看看",
    firstMove: "先把积木换个方向，或给画添一种新颜色",
    benefit: "卡住的游戏又有了好玩的入口",
    risk: "不停换玩法，刚开始就把手上的东西丢开",
    turn: "新玩法和原玩法各玩一回，再挑更喜欢的",
  },
  正印: {
    title: "跟着做一次，再自己来",
    firstMove: "先看家人示范怎样收玩具，再自己做一遍",
    benefit: "被帮助的一步慢慢变成孩子会做的事",
    risk: "总等着大人代劳，自己不肯伸手试",
    turn: "请照顾者做第一步，孩子接着完成第二步",
  },
};

type LifeStageContext = Readonly<{
  id:
    | "preschool"
    | "child"
    | "teen"
    | "launch"
    | "building"
    | "steward"
    | "later"
    | "transition";
  label: string;
  metaphor: string;
  events: readonly [string, string, string];
  career: string;
  resource: string;
  relationship: string;
  family: string;
  rhythm: string;
  consequence: string;
  reviewPartner: string;
  youth: boolean;
}>;

const LIFE_STAGE_CONTEXTS: readonly LifeStageContext[] = [
  {
    id: "preschool",
    label: "幼年启蒙期",
    metaphor: "一间由玩具、画纸、故事和家人陪伴组成的小屋",
    events: ["和家人一起搭积木", "收拾玩具", "与小伙伴轮流画画或玩游戏"],
    career: "“事业”在幼年只表示愿意尝试、完成一个小动作并学会求助；大人把任务说成孩子能听懂的一步",
    resource: "资源是玩具、画笔、点心、时间和家人陪伴；一次只拿需要的一份，用完再放回原处",
    relationship: "和小伙伴相处先练习轮流、等待和说“我还想玩”；大人帮助孩子把抢夺改成请求",
    family: "家人用简短、稳定的生活约定带孩子参与收拾、洗手或准备出门，不让孩子承担成人责任",
    rhythm: "玩耍、吃饭和休息要有清楚转换；累了先停下，由照顾者帮助恢复",
    consequence: "孩子便可能用哭闹或躲开表达超出能力的压力",
    reviewPartner: "家人或照顾者",
    youth: true,
  },
  {
    id: "child",
    label: "童年学习期",
    metaphor: "一座由课堂、家庭和同伴游戏连成的小院",
    events: ["课堂小组的一次分工", "放学后的一次家务安排", "同伴游戏中的一次约定变化"],
    career: "“事业”在童年只表示学习、兴趣和承担小任务；一次课堂合作里，先说清自己愿意做哪一步",
    resource: "资源是放学后的时间、文具、零花钱和家人支持；拿取和分享之前先问清用途",
    relationship: "同伴之间会遇到轮流、等待和被误会；先复述对方的话，再说明自己的需要",
    family: "家务与生活约定要由大人说明，孩子可以参与选择一项能完成的小责任",
    rhythm: "学习、游戏和休息要能轮换；注意力散掉时先暂停，而不是继续硬撑",
    consequence: "孩子容易把一次不顺误以为自己什么都做不好",
    reviewPartner: "老师或家人",
    youth: true,
  },
  {
    id: "teen",
    label: "少年探索期",
    metaphor: "一条连接课堂、社团、朋友和家庭期待的长廊",
    events: ["课程小组的一次交作业", "社团活动的一次任务分配", "朋友之间的一次计划调整"],
    career: "“事业”在少年阶段先理解为学习、兴趣与集体任务；把目标和完成标准问清，再开始投入",
    resource: "资源包括时间、精力、学习材料和可获得的帮助；先保住作息与主课，再安排新兴趣",
    relationship: "朋友和家人的期待可能同时出现；把事实、感受和请求分开说，误会才有机会停下",
    family: "家庭约定需要解释缘由，也要给少年留下表达不同意见和重新商量的入口",
    rhythm: "考试、活动与休息挤在一起时，先减掉一项非必要安排，再恢复睡眠和日常节奏",
    consequence: "忙乱会把一次小分歧放大成对自己或他人的总判断",
    reviewPartner: "老师、家人或可信任的同伴",
    youth: true,
  },
  {
    id: "launch",
    label: "独立起步期",
    metaphor: "一座从学习通向独立生活与第一份正式责任的车站",
    events: ["一项独立完成的课程、实习或工作任务", "一次与室友或伙伴的共同开支商量", "一次在新团队里的不同意见讨论"],
    career: "面对第一次独立交付时，先确认目标、可用支持和完成标准，再决定投入多大力气",
    resource: "收入、时间和学习投入刚开始需要自己安排；先保住基本生活与储备，再做小规模试验",
    relationship: "靠近新伙伴时，把期待说成可回答的请求，不用试探代替真正的对话",
    family: "离开熟悉分工后，重新商量联系、支持与个人决定的边界",
    rhythm: "新鲜感会推高强度；每完成一轮任务，就安排收尾、睡眠与一天低负荷时间",
    consequence: "主线便会被疲惫和返工冲散",
    reviewPartner: "同伴、导师或合作伙伴",
    youth: false,
  },
  {
    id: "building",
    label: "主线建设期",
    metaphor: "一座同时铺设事业、关系与生活基础的工地",
    events: ["一项从启动走到交付的长期项目", "一次与伴侣或家人的共同责任安排", "一次为新机会进行的时间与资源重排"],
    career: "长期项目要经得住交付与复盘；先看职责、关键节点和退出标准是否清楚",
    resource: "把日常支出、储备和试验分开安排，让新机会不挤掉已有承诺",
    relationship: "共同生活需要把时间、照顾和决定权说清，和好之后还要留下新约定",
    family: "家庭任务按发起、执行和收尾分工，避免同一个人长期默默兜底",
    rhythm: "高强度阶段要有结束信号；连续两周记录睡眠、专注和恢复，再调整任务量",
    consequence: "延期、误会和资源紧张便会在同一时间出现",
    reviewPartner: "同事、伴侣或家人",
    youth: false,
  },
  {
    id: "steward",
    label: "责任整合期",
    metaphor: "一座需要同时照看团队、家庭与个人主线的调度台",
    events: ["团队里的一次关键责任交接", "一次与家人的长期照顾重排", "一次重要选择中的主线取舍"],
    career: "经验开始影响更多人时，把判断依据、授权范围和接班路径一起交代清楚",
    resource: "资源不只看增加，也看哪些承诺该交接、暂停或结束，给长期主线留出余地",
    relationship: "少替别人预设答案，多问一句对方真正需要什么，再决定怎样支持",
    family: "照顾责任保持可轮换、可求助，爱不等于一个人永远承担全部",
    rhythm: "把恢复列入正式安排，重要决定避开连续透支后的低质量时段",
    consequence: "能力便会变成无法停下的负担",
    reviewPartner: "同事、伴侣、家人或长期伙伴",
    youth: false,
  },
  {
    id: "later",
    label: "经验传承期",
    metaphor: "一间既保存旧地图、也欢迎年轻人画新路线的会客厅",
    events: ["一次向年轻同伴讲经验的谈话", "一次与家人的日常分工调整", "一项重新选择的长期投入"],
    career: "把“事业”理解为经验如何继续被使用；留下步骤和判断条件，不要求后来者完全照做",
    resource: "时间与精力优先给真正重要的人和事，减少长期占用却没有回应的安排",
    relationship: "允许彼此用不同节奏生活，用清楚请求代替反复提醒或默默失望",
    family: "把帮助的范围、方式和结束时间讲清，让下一代也能接回自己的责任",
    rhythm: "日常活动、休息与社交保持可持续，按真实感受调整，不跟过去的强度较劲",
    consequence: "经验便会变成控制，自己也失去新的生活空间",
    reviewPartner: "家人、朋友或可信任的晚辈",
    youth: false,
  },
];

function lifeStageForAge(age: number): LifeStageContext {
  if (age <= 6) return LIFE_STAGE_CONTEXTS[0];
  if (age <= 11) return LIFE_STAGE_CONTEXTS[1];
  if (age <= 17) return LIFE_STAGE_CONTEXTS[2];
  if (age <= 24) return LIFE_STAGE_CONTEXTS[3];
  if (age <= 39) return LIFE_STAGE_CONTEXTS[4];
  if (age <= 59) return LIFE_STAGE_CONTEXTS[5];
  return LIFE_STAGE_CONTEXTS[6];
}

function lifeStageForPeriod(period: FortunePeriod): LifeStageContext {
  const start = lifeStageForAge(period.startAge);
  const end = lifeStageForAge(period.endAge);
  if (start.id === end.id) return start;
  const startLabel = start.label.replace(/期$/u, "");
  const endLabel = end.label.replace(/期$/u, "");
  return {
    id: "transition",
    label: `${startLabel}到${endLabel}的过渡期`,
    metaphor: `一条从${startLabel}走向${endLabel}的过渡长廊`,
    events: [start.events[0], end.events[1], end.events[2]],
    career: `前半程，${start.career}；随着年龄与责任变化，${end.career}`,
    resource: `前半程，${start.resource}；进入后半程，${end.resource}`,
    relationship: `前半程，${start.relationship}；进入后半程，${end.relationship}`,
    family: `前半程，${start.family}；进入后半程，${end.family}`,
    rhythm: `前半程，${start.rhythm}；进入后半程，${end.rhythm}`,
    consequence: `${start.consequence}；责任变化后，${end.consequence}`,
    reviewPartner: "家人、同伴或其他可信任的人",
    youth: start.youth && end.youth,
  };
}

function deepFreeze<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
}

function storyCategory(tenGod: TenGodName): StoryCategory {
  if (tenGod === "比肩" || tenGod === "劫财") return "peer";
  if (tenGod === "食神" || tenGod === "伤官") return "expression";
  if (tenGod === "偏财" || tenGod === "正财") return "resource";
  if (tenGod === "七杀" || tenGod === "正官") return "authority";
  return "learning";
}

function buildFortuneStoryYear(
  chart: Readonly<FourPillarsResult>,
  year: FortunePeriod["years"][number],
): FortuneStoryYear {
  const annualGod = calculateTenGod(
    chart.pillars.day.stem,
    year.stemBranch[0],
  );
  const lifeStage = lifeStageForAge(year.age);
  const annualFrame = lifeStage.id === "preschool"
    ? PRESCHOOL_STORY_FRAMES[annualGod]
    : ANNUAL_STORY_FRAMES[annualGod];
  const variant = Math.abs(year.year + year.age) % lifeStage.events.length;
  const event = lifeStage.events[variant];
  const scene = [
    `把${year.year}年（${year.age}岁）当作一页生活观察，可以从“${event}”这个场景开始：你${annualFrame.firstMove}，于是${annualFrame.benefit}。`,
    `如果${annualFrame.risk}，${lifeStage.consequence}；这时可以${annualFrame.turn}，再看事情的结果是否真的改变。`,
  ].join("");
  const action = lifeStage.id === "preschool"
    ? `再遇到类似场景时，${annualFrame.turn}；结束后请家人或照顾者用一句话或一个贴纸，记下孩子做到了哪一步。`
    : lifeStage.youth
    ? `再遇到类似场景时，${annualFrame.turn}；结束后请${lifeStage.reviewPartner}一起记下发生了什么、哪一步有效，以及下次怎样调整。`
    : `再遇到类似场景时，${annualFrame.turn}；结束后记下触发、动作与结果，七天后只保留真正改善局面的做法。`;
  return {
    age: year.age,
    year: year.year,
    title: `${lifeStage.label} · ${annualFrame.title}`,
    scene,
    action,
  };
}

function buildFortuneStoryPeriod(
  chart: Readonly<FourPillarsResult>,
  period: FortunePeriod,
): FortuneStoryPeriod {
  if (period.years.length === 0) {
    throw new Error(
      `Fortune story invariant: period ${period.id} has no years`,
    );
  }
  const category = storyCategory(period.tenGod);
  const frame = PERIOD_STORY_FRAMES[category];
  const lifeStage = lifeStageForPeriod(period);
  const periodFlavor = period.startAge <= 6
    ? PRESCHOOL_STORY_FRAMES[period.tenGod]
    : ANNUAL_STORY_FRAMES[period.tenGod];
  const event = lifeStage.events[
    Math.abs(period.startYear + period.startAge) % lifeStage.events.length
  ];
  const openingScene = [
    `在${period.startAge}–${period.endAge}岁这段路上，可以把你想成走进${lifeStage.metaphor}。`,
    `拿“${event}”这个场景作例子：你${periodFlavor.firstMove}，于是${periodFlavor.benefit}。`,
    `若${periodFlavor.risk}，${lifeStage.consequence}；真正的转折是${periodFlavor.turn}，让下一步留下可以复查的结果。`,
  ].join("");
  const contextOnly = lifeStage.youth || lifeStage.id === "later";
  const careerScene = contextOnly
    ? `${lifeStage.career}。完成后与${lifeStage.reviewPartner}一起看结果，再决定下一步。`
    : `${lifeStage.career}。${frame.careerScene}`;
  const resourceScene = contextOnly
    ? `${lifeStage.resource}。每次只调整一项，让真实使用情况决定是否保留。`
    : `${lifeStage.resource}。${frame.resourceScene}`;
  const relationshipScene = contextOnly
    ? `${lifeStage.relationship}。误会出现时先停下解释，互相复述后再商量新动作。`
    : `${lifeStage.relationship}。${frame.relationshipScene}`;
  const familyScene = contextOnly
    ? `${lifeStage.family}。一周后回看分工是否真正完成，再决定怎样轮换。`
    : `${lifeStage.family}。${frame.familyScene}`;
  const rhythmScene = contextOnly
    ? `${lifeStage.rhythm}。连续记录七天后，只调整最影响日常的一处。`
    : `${lifeStage.rhythm}。${frame.rhythmScene}`;
  const actions: readonly [string, string, string] = contextOnly
    ? [
        `在“${lifeStage.events[0]}”这个场景中，${periodFlavor.turn}；结束后请${lifeStage.reviewPartner}一起复盘。`,
        `面对“${lifeStage.events[1]}”这件事时，先说出自己能完成的一步，再看结果是否需要调整。`,
        `经历“${lifeStage.events[2]}”这个场景后，记下触发、动作和结果，不用一次经历给自己下结论。`,
      ]
    : frame.actions.map(action =>
        `${action}完成后与${lifeStage.reviewPartner}核对一次结果，再决定是否继续。`
      ) as [string, string, string];
  const years = period.years.map(year =>
    buildFortuneStoryYear(chart, year)
  ) as [FortuneStoryYear, ...FortuneStoryYear[]];
  return {
    id: period.id,
    ageRange: `${period.startAge}–${period.endAge}岁`,
    yearRange: `${period.startYear}–${period.endYear}`,
    title: `${lifeStage.label} · ${periodFlavor.title}`,
    openingScene,
    careerScene,
    resourceScene,
    relationshipScene,
    familyScene,
    rhythmScene,
    favorableCurrent: contextOnly
      ? `顺风处在于${periodFlavor.benefit}，而且${lifeStage.reviewPartner}能一起看见过程。`
      : `${frame.favorableCurrent}在${lifeStage.label}里，这份优势要由真实结果继续确认。`,
    likelyCost: contextOnly
      ? `最容易吃亏的地方是${periodFlavor.risk}，结果把一次小事变成对自己的总判断。`
      : `${frame.likelyCost}一旦出现“${lifeStage.consequence}”这类信号，就先减量并重新安排边界。`,
    actions,
    years,
    internalMethodIds: [...period.method.sourceIds],
  };
}

export function buildFortuneStoryTimeline(
  chart: Readonly<FourPillarsResult>,
  birth: Readonly<BirthInput>,
): FortuneStoryTimeline {
  if (birth.timeConfidence === "unknown" || birth.time === null) {
    return deepFreeze({
      status: "unavailable",
      reason: "unknown-time" as const,
      explanation:
        "出生时间尚未确认，阶段起止年龄与年份会随时刻改变。补充可靠时间后，再查看大运阶段故事。",
    });
  }
  if (birth.gender === "unspecified") {
    return deepFreeze({
      status: "unavailable",
      reason: "gender-unspecified" as const,
      explanation:
        "出生性别尚未选择，阶段先后方向暂时不能确定。补全后再查看大运阶段故事。",
    });
  }

  const rawPeriods = buildFortuneTimeline(chart, birth);
  if (rawPeriods.length === 0) {
    throw new Error(
      "Fortune story invariant: available timeline has no periods",
    );
  }
  const periods = rawPeriods.map(period =>
    buildFortuneStoryPeriod(chart, period)
  ) as [FortuneStoryPeriod, ...FortuneStoryPeriod[]];
  return deepFreeze({
    status: "available",
    timingNote: birth.timeConfidence === "approximate"
      ? "出生时间为约略时间，阶段起止年龄与年份会随实际时刻调整；先把它们当作近似观察区间。"
      : "阶段年份按已填写的出生时间排出，只用来安排长期观察，不预告具体事件。",
    periods,
  });
}
