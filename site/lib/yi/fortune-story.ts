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
  openingScene: string;
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
    openingScene:
      "这一阶段可用一张不断更新的分工表来理解：推动力常来自同伴与共同任务，决定权和责任边界也需要说清。",
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
    openingScene:
      "这一阶段像一间持续打样的工作室：想法需要经过小版本、真实反馈和完整收尾，才会变成别人能使用的成果。",
    careerScene:
      "工作上先把观点做成可以试用的小成果，再根据反馈决定是否扩大范围。",
    resourceScene:
      "资源优先支持稳定产出和真实体验，同时给试错设定清楚的时间与金额上限。",
    relationshipScene:
      "表达主张时把倾听放在旁边，让对方听见具体请求，而不只听见判断。",
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
    openingScene:
      "这一阶段像一座需要持续调度的集市：选择不少，真正重要的是看清容量、已有承诺和每项投入的周转方式。",
    careerScene:
      "工作选择同时核对机会质量、现有任务和真实交付容量，不让新选项挤掉主线。",
    resourceScene:
      "资源管理聚焦预算、现金流和归属边界，每增加一项投入，就写明上限与退出条件。",
    relationshipScene:
      "关系中把时间、金钱和照顾怎样分配说清楚，让善意也有可以持续的容量。",
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
    openingScene:
      "这一阶段像一座正在换班的瞭望塔：责任带来更大视野，也要求权限、标准、例外和求助通道都能被看见。",
    careerScene:
      "工作开始前先确认权限、验收标准和升级路径，再决定能够承担多大的结果。",
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
    openingScene:
      "这一阶段像一座边读边开放的藏书室：知识需要进入实践、复盘和分享，才会成为自己与他人都能使用的路径。",
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
    scene:
      "当共同任务增多时，先看决定权、执行责任和复核位置是否清楚，再决定怎样加入。",
    action:
      "选一件正在协作的事，写下谁决定、谁执行以及何时复核。",
  },
  expression: {
    title: "让一个想法完成小规模试用",
    scene:
      "当表达欲和新点子同时增加时，先把其中一个做成可试用版本，再听真实使用者怎么回应。",
    action:
      "选择一个想法完成小版本，并记录三条具体反馈。",
  },
  resource: {
    title: "给新机会设好容量上限",
    scene:
      "当新选择进入日程时，把它和已有承诺放在同一张表里，先确认时间、预算与退出位置。",
    action:
      "为一项新机会写下投入上限、保留事项和停止条件。",
  },
  authority: {
    title: "先把责任边界和求助通道写清",
    scene:
      "当期限、标准或公开责任变重时，先确认权限与支持，再把任务拆成能够停下检查的步骤。",
    action:
      "为一项高压任务写明负责人、验收点、求助人和停止条件。",
  },
  learning: {
    title: "用一次实践检验新知识",
    scene:
      "当新信息不断进入时，先选一个问题实践，再根据结果决定哪些内容值得继续保留。",
    action:
      "选一个新方法完成一次现实实践，并写下它适用与不适用的条件。",
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
  const frame = YEAR_STORY_FRAMES[storyCategory(annualGod)];
  return {
    age: year.age,
    year: year.year,
    title: frame.title,
    scene: frame.scene,
    action: frame.action,
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
  const frame = PERIOD_STORY_FRAMES[storyCategory(period.tenGod)];
  const years = period.years.map(year =>
    buildFortuneStoryYear(chart, year)
  ) as [FortuneStoryYear, ...FortuneStoryYear[]];
  return {
    id: period.id,
    ageRange: `${period.startAge}–${period.endAge}岁`,
    yearRange: `${period.startYear}–${period.endYear}`,
    title: frame.title,
    openingScene: frame.openingScene,
    careerScene: frame.careerScene,
    resourceScene: frame.resourceScene,
    relationshipScene: frame.relationshipScene,
    familyScene: frame.familyScene,
    rhythmScene: frame.rhythmScene,
    favorableCurrent: frame.favorableCurrent,
    likelyCost: frame.likelyCost,
    actions: [...frame.actions],
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
