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

type YearStoryFrame = Readonly<{
  title: string;
  scene: string;
  action: string;
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
      "每接受一项新机会，同步减少或暂停另一项占用，为恢复保留真实预算。",
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
      "工作开始前先确认权限、验收标准和升级路径，再决定能够承担多大范围的结果。",
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

const YEAR_STORY_FRAMES: Readonly<Record<StoryCategory, YearStoryFrame>> = {
  peer: {
    title: "把合作方式重新说清",
  },
  expression: {
    title: "让一个想法完成小规模试用",
  },
  resource: {
    title: "给新机会设好容量上限",
  },
  authority: {
    title: "先把责任边界和求助通道写清",
  },
  learning: {
    title: "用一次实践检验新知识",
  },
};

type CategoryStoryCue = Readonly<{
  firstMove: string;
  benefit: string;
  risk: string;
  turn: string;
}>;

const CATEGORY_STORY_CUES: Readonly<
  Record<StoryCategory, CategoryStoryCue>
> = {
  peer: {
    firstMove: "先看谁愿意一起做，再确认各自负责哪一步",
    benefit: "合作很快有了起点",
    risk: "急着比较、抢先或替别人作主",
    turn: "把分工、轮换和复查时间说清",
  },
  expression: {
    firstMove: "先把一个想法做成别人能看见的小版本",
    benefit: "讨论从猜测落到了真实作品",
    risk: "只顾说得快，或一直修改却不肯完成",
    turn: "先听一条具体反馈，再完成一个可以收尾的版本",
  },
  resource: {
    firstMove: "先数清手边已有的时间、物品和支持",
    benefit: "选择不再挤在同一时刻",
    risk: "什么都舍不得放下，又不断接受新安排",
    turn: "排出先后次序，只保留当前真正能承担的一项",
  },
  authority: {
    firstMove: "先问清要求、可以决定的范围和可求助对象",
    benefit: "责任终于有了可以执行的边界",
    risk: "为了证明可靠而把所有压力都接在自己身上",
    turn: "把标准、检查点和求助时机写清",
  },
  learning: {
    firstMove: "先选一个问题亲手试一次，再回头整理方法",
    benefit: "知识开始与现实结果连在一起",
    risk: "不断收集新方法，却没有完成一次实践",
    turn: "用一次实践留下结果，再决定下一步学什么",
  },
};

type LifeStageContext = Readonly<{
  id: "child" | "teen" | "launch" | "building" | "steward" | "later";
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
    id: "child",
    label: "童年学习期",
    metaphor: "一座由课堂、家庭和同伴游戏连成的小院",
    events: ["课堂小组分工", "放学后的家务安排", "同伴游戏临时改约定"],
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
    events: ["课程小组交作业", "社团活动分配任务", "朋友之间重新约定计划"],
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
    events: ["独立完成一项课程、实习或工作任务", "与室友或伙伴商量共同开支", "在新团队里提出不同意见"],
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
    events: ["把长期项目从启动带到交付", "与伴侣或家人安排一项共同责任", "为新机会重新分配时间和资源"],
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
    events: ["在团队里交接一项关键责任", "和家人重新安排长期照顾", "从多个重要选择中保留一条主线"],
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
    events: ["把一段经验讲给年轻同伴", "与家人调整日常分工", "为自己重新选择一项愿意长期投入的事情"],
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
  if (age <= 11) return LIFE_STAGE_CONTEXTS[0];
  if (age <= 17) return LIFE_STAGE_CONTEXTS[1];
  if (age <= 24) return LIFE_STAGE_CONTEXTS[2];
  if (age <= 39) return LIFE_STAGE_CONTEXTS[3];
  if (age <= 59) return LIFE_STAGE_CONTEXTS[4];
  return LIFE_STAGE_CONTEXTS[5];
}

function lifeStageForPeriod(period: FortunePeriod): LifeStageContext {
  return lifeStageForAge(Math.floor((period.startAge + period.endAge) / 2));
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
  const category = storyCategory(annualGod);
  const frame = YEAR_STORY_FRAMES[category];
  const cue = CATEGORY_STORY_CUES[category];
  const lifeStage = lifeStageForAge(year.age);
  const variant = Math.abs(year.year + year.age) % lifeStage.events.length;
  const event = lifeStage.events[variant];
  const scene = [
    `把${year.year}年（${year.age}岁）当作一页生活观察，可以从一次${event}开始：你${cue.firstMove}，于是${cue.benefit}。`,
    `如果${cue.risk}，${lifeStage.consequence}；这时要${cue.turn}，再看事情的结果是否真的改变。`,
  ].join("");
  const action = lifeStage.youth
    ? `下一次${event}时，${cue.turn}；结束后请${lifeStage.reviewPartner}一起记下发生了什么、哪一步有效，以及下次怎样调整。`
    : `下一次${event}时，${cue.turn}；结束后记下触发、动作与结果，七天后只保留真正改善局面的做法。`;
  return {
    age: year.age,
    year: year.year,
    title: `${lifeStage.label} · ${frame.title}`,
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
  const cue = CATEGORY_STORY_CUES[category];
  const lifeStage = lifeStageForPeriod(period);
  const event = lifeStage.events[
    Math.abs(period.startYear + period.startAge) % lifeStage.events.length
  ];
  const openingScene = [
    `在${period.startAge}–${period.endAge}岁这段路上，可以把你想成走进${lifeStage.metaphor}。`,
    `拿一次${event}作例子：你${cue.firstMove}，于是${cue.benefit}。`,
    `若${cue.risk}，${lifeStage.consequence}；真正的转折是${cue.turn}，让下一步留下可以复查的结果。`,
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
        `在一次${lifeStage.events[0]}里，${cue.turn}；结束后请${lifeStage.reviewPartner}一起复盘。`,
        `遇到${lifeStage.events[1]}时，先说出自己能完成的一步，再看结果是否需要调整。`,
        `下一次${lifeStage.events[2]}后，记下触发、动作和结果，不用一次经历给自己下结论。`,
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
    title: `${lifeStage.label} · ${frame.title}`,
    openingScene,
    careerScene,
    resourceScene,
    relationshipScene,
    familyScene,
    rhythmScene,
    favorableCurrent: contextOnly
      ? `顺风处在于${cue.benefit}，而且${lifeStage.reviewPartner}能一起看见过程。`
      : `${frame.favorableCurrent}在${lifeStage.label}里，这份优势要由真实结果继续确认。`,
    likelyCost: contextOnly
      ? `最容易吃亏的地方是${cue.risk}，结果把一次小事变成对自己的总判断。`
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
