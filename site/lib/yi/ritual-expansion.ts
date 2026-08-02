import type { YiThemeElement } from "./theme";

type DrawCategory = "事业" | "关系" | "财运" | "行动";
type QimenTopic = "career" | "relationship" | "wealth" | "action";

export const expandedDrawQuestionPresets = [
  "事业去留", "工作沟通", "升职争取", "副业开始", "项目取舍", "客户合作",
  "关系修复", "伴侣相处", "亲子沟通", "家庭安排", "朋友边界", "情绪整理",
  "财运取舍", "大额支出", "合作分账", "收入机会", "账目盘点", "出行办事",
  "健康作息", "睡眠调整", "考试复习", "搬家出行", "今日行动", "重要决定",
] as const;

export const expandedQimenQuestionPresets = [
  "事业取舍", "合同谈判", "面试汇报", "客户推进", "团队协作", "岗位选择",
  "关系推进", "见面沟通", "关系破冰", "家事安排", "长辈沟通", "同事协调",
  "财运取舍", "财务盘点", "合作邀约", "报价议价", "账款确认", "资源置换",
  "考试学习", "搬家出行", "就医问诊", "健康复诊", "今日行动", "重要决定",
] as const;

const drawImages = [
  "青灯照案", "竹影过窗", "云开石径", "溪声绕阶", "春雨润枝", "白露沾衣",
  "铜镜拭尘", "纸鸢试风", "炉火温茶", "远钟入耳", "渔灯归岸", "新芽破土",
] as const;

const drawAllusions = [
  "典取周公制礼，先定名分再行事，贵在把边界说清。",
  "典取孔明借东风，时机未至先备器，风来时才不慌。",
  "典取陶公运甓，日日小功不弃，久后自见筋骨。",
  "典取王羲之洗砚，熟处仍肯下笨功，锋芒才不浮。",
  "典取苏武持节，处逆境先守住底线，转机才有落脚处。",
  "典取张良拾履，先放下面子听一回，贵人常在耐心处。",
  "典取班超投笔，决断不是莽撞，是看清旧路已尽。",
  "典取李冰治水，疏导胜过硬堵，先分流再成渠。",
  "典取范蠡泛舟，进退皆有章法，能舍才可再得。",
  "典取木兰整装，承担之前先点清器物与同伴。",
  "典取曾子三省，先查自己能改的一寸，再谈外局。",
  "典取姜太公垂钓，不急于一网得鱼，先把饵与水势看准。",
] as const;

const drawAdviceLines: Record<DrawCategory, readonly string[]> = {
  事业: [
    "把目标、负责人、验收标准写成三行，先发给最相关的一个人确认。",
    "先做一个可展示的小样，不急着宣布完整计划。",
    "今天适合删掉一项低效承诺，把精力还给主线。",
    "若要争取机会，先补一条能证明结果的证据。",
    "把卡点拆成权限、资源、节奏三类，别把所有压力都算成能力问题。",
    "用一次十分钟沟通换掉反复猜测，话越早说清越省力。",
  ],
  关系: [
    "先说事实，再说感受，最后只提一个可执行请求。",
    "把旧账暂停二十分钟，只处理今天这一件具体事。",
    "给对方一个复述机会，确认彼此听见的是同一件事。",
    "别用试探代替表达，柔和但明确地把需要说出来。",
    "把边界写成可以遵守的规则，而不是一句情绪化的狠话。",
    "今天宜修一处小裂缝，不宜一次清算所有委屈。",
  ],
  财运: [
    "先看现金流、固定支出、可取消承诺，再谈新机会。",
    "把最大损失写在纸上，若承受不起就先不进场。",
    "今天只清一笔账、止一处漏、定一个复盘日期。",
    "把人情账和金钱账分开说，越亲近越要留凭据。",
    "先守三分本，再开一寸财，急利容易遮住风险。",
    "把报价、成本、时间成本放在同一张表里看。",
  ],
  行动: [
    "把问题缩到二十分钟能开始的一步，先做完再评价。",
    "先换环境、清桌面、定计时，让身体带着心进入状态。",
    "若迟迟不动，说明任务还太大，再砍掉一半范围。",
    "今天不求完美，只求留下一个可复盘的结果。",
    "把担心写在左边，把下一步写在右边，先做右边第一项。",
    "行动后记录顺与不顺，明天才知道该放大还是收住。",
  ],
};

const drawPoemClosers = [
  "一灯照一尺，寸寸见前程。",
  "风来签有响，心定路自明。",
  "云低山不失，水转岸仍清。",
  "先收眼前局，再问远方春。",
  "小步能开径，回声便是凭。",
  "不争一时满，留白养新生。",
  "旧结从轻解，新枝向暖生。",
  "有门先叩门，无路且听声。",
] as const;

const qimenMicroMethods = [
  "先立边界", "先问证据", "先通人心", "先收账面", "先开小门", "先避噪声",
  "先定主线", "先修动线", "先看回声", "先留退路", "先亮身份", "先缓三分",
] as const;

const qimenScenePrompts = [
  "把局势看成一张桌面：谁坐主位、谁掌信息、谁能拍板，先分清再行动。",
  "今日不宜把问题想成输赢，先找能让事情流动起来的一个入口。",
  "若信息混杂，先做一次小验证；验证能带来新信息，就比空想更合时。",
  "此局重在顺势借力，先借一人、一处、一份材料，不独自硬扛。",
  "门在眼前但气口偏窄，行动要小、话要准、承诺要留余地。",
  "把人、事、钱、时间拆开看，哪个环节先清，局就从哪里开。",
  "适合用公开规则减少误会，不适合靠临场情绪推动结果。",
  "先把最容易回收反馈的动作做掉，别把一天押在一个大决定上。",
  "宜向内收束，整理材料、复盘证据、修正说法，再出门谈。",
  "宜向外试探，发起沟通、约定时间、确认资源，但别一次摊太多。",
] as const;

const qimenTopicActions: Record<QimenTopic, readonly string[]> = {
  career: [
    "先发一条确认消息，问清目标、权限、截止时间。",
    "把方案缩成一页，先让一个关键人看懂。",
    "把会议里的模糊承诺整理成三条待确认事项。",
    "先补一份证据，再谈争取或转向。",
  ],
  relationship: [
    "先约一个安静时间，只谈一件事，不翻旧账。",
    "把想要对方怎么做说成具体动作，不说人格判断。",
    "先给一句台阶，再提出真实请求。",
    "把情绪写下来，删掉攻击句后再沟通。",
  ],
  wealth: [
    "先盘点现金、欠款、固定支出，暂停新增承诺。",
    "把收益想象成慢三成，把成本想象成多三成，再看能否承受。",
    "先确认账期和退出条件，再谈合作热情。",
    "把一笔最容易漏的钱今天对清。",
  ],
  action: [
    "设二十分钟计时，只做第一个可见动作。",
    "先整理桌面和材料，让身体进入局中。",
    "如果卡住，就把任务砍到只剩一步。",
    "做完马上记录结果、阻力和下一步。",
  ],
};

function rollingHash(value: string) {
  return [...value].reduce((sum, char) => (sum * 131 + char.charCodeAt(0)) % 1000003, 17);
}

function pick<T>(items: readonly T[], seed: string, salt: string) {
  return items[rollingHash(`${seed}|${salt}`) % items.length];
}

export function buildDrawExpansion({
  seed,
  category,
  element,
  question,
  name,
}: {
  seed: string;
  category: DrawCategory;
  element: YiThemeElement;
  question: string;
  name: string;
}) {
  const image = pick(drawImages, seed, "image");
  const allusion = pick(drawAllusions, seed, "allusion");
  const action = pick(drawAdviceLines[category], seed, "action");
  const closer = pick(drawPoemClosers, seed, "poem");
  const person = name.trim() || "你";
  return {
    signSuffix: `${image}问${category}`,
    allusion: `${allusion}问事落点取“${question}”，重在今日一问、一事一签。`,
    poemLine: `${image}照所问，${closer}`,
    reading: `${person}今日所问“${question}”，落点在${category}的当下取舍。五行取${element}象，不把吉凶说死，而是看气势如何落到手边：${action}若做完后心更定、信息更清、相关的人更愿意配合，就是顺；若越做越急、越说越乱，就先停一停，把问题再缩小。`,
    textLine: `此签取“${image}”之象，问${category}不求玄远，先照见一处可动之门。`,
  };
}

export function buildQimenExpansion({
  seed,
  topic,
  question,
  hourGanzhi,
  dayGanzhi,
}: {
  seed: string;
  topic: QimenTopic;
  question: string;
  hourGanzhi: string;
  dayGanzhi: string;
}) {
  const method = `${pick(qimenMicroMethods, seed, "method-a")}，${pick(qimenMicroMethods, seed, "method-b")}`;
  const prompt = pick(qimenScenePrompts, seed, "prompt");
  const action = pick(qimenTopicActions[topic], seed, "action");
  return {
    method,
    prompt: `${dayGanzhi}日、${hourGanzhi}时起这一问，盘意先看“气口”再看成败。${prompt}`,
    actionGuide: `补一条落地法：围绕“${question}”，先按“${method}”做二十分钟，动作是：${action}二十分钟后只看三件事：有没有新信息、有没有人回应、自己是否更稳。`,
    directionNote: "朝向不是迷信地改造空间，而是用一个方向帮注意力归位；能面向就面向，不能面向就把该方向当作行动入口。",
  };
}
