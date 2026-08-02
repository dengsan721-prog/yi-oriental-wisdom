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

const drawSceneAnchors = [
  "晨起未开手机前", "午后信息最杂时", "晚间复盘账本时", "出门前整理包物时", "会议开始前十分钟", "饭桌话题转重时",
  "消息写好未发送时", "准备付款或承诺前", "独处想放弃的一刻", "刚收到反馈之后", "临睡前仍惦记时", "走到门口又犹豫时",
  "第一次听见反对意见时", "有人催促你表态时", "旧计划被打断时", "需要向长辈解释时", "要给同伴答复时", "预算表刚打开时",
  "身体提醒疲惫时", "桌面堆满材料时", "路线还没确认时", "情绪刚冒头时", "机会看似很急时", "别人沉默不回时",
] as const;

const drawMicroSignals = [
  "心能慢下来", "手边有证据", "对方愿意复述", "账目能对齐", "时间表变清楚", "身体不再发紧",
  "第一步有人接住", "旧话题没有升温", "材料能被别人看懂", "承诺可以撤回", "边界说出后仍被尊重", "花费有上限",
  "问题缩小一半", "行动有截止点", "结果可以记录", "风险能被命名", "等待有明确期限", "路线可改可退",
  "同伴知道分工", "消息没有攻击性", "桌面留出空白", "睡前能放下", "复盘有真实反馈", "下一步不靠猜",
] as const;

const drawPracticalTools = [
  "三列表", "二十分钟计时", "一页纸方案", "账本截图", "待确认清单", "复述句",
  "暂停词", "退出条件", "小样品", "路线备选", "预算上限", "睡眠记录",
  "沟通提纲", "收纳篮", "验收线", "证据夹", "日历提醒", "分工表",
  "拒绝模板", "复盘日期", "冷静问题", "费用凭据", "会议纪要", "行动日志",
] as const;

const drawRiskReminders = [
  "别把一次沉默当结论", "别把急促当机会", "别把面子当证据", "别把旧习惯当命运", "别把情绪当事实", "别把热闹当进展",
  "别把承诺说得太满", "别把不安藏成攻击", "别把账目留到事后", "别把疲惫解释成失败", "别把猜测当默契", "别把拖延包装成谨慎",
  "别把试探代替表达", "别把小错滚成大账", "别把帮助变成全盘接管", "别把漂亮计划当完成", "别把短期顺利当永久", "别把一次拒绝当关系终局",
  "别把没有回应当无路", "别把省钱变成高成本", "别把速度压过边界", "别把复杂事塞进一句话", "别把他人期待全背上", "别把今天耗在想象里",
] as const;

const drawClosingMoves = [
  "写下一个明早能继续的动作", "把结果发给一个相关的人", "给自己留一句不追责的复盘", "在日历上标出复查时间", "把多余材料收进一个文件夹", "把最小承诺说清楚",
  "把下一步限定在一个场景里", "先确认谁能拍板", "给情绪一个名字再开口", "把费用与人情分开记录", "把担心改写成问题", "把行动范围砍到一半",
  "给对方一个选择项", "把今天不做的事也写下", "用一句话定义成功", "先确认能否撤回", "让身体先离开杂乱处", "把答案留给现实反馈",
  "找一条可退的小路", "把旧账暂停到复盘日", "先完成一个看得见的收尾", "把提醒放在醒目处", "把承诺写成截止点", "给明天留一处空白",
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

const qimenFieldRoles = [
  "拍板人", "信息源", "执行者", "旁观者", "反对者", "调停者", "付款方", "验收人",
  "介绍人", "记录者", "风险承担者", "资源提供者", "时间守门人", "情绪缓冲者", "专业确认者", "最终使用者",
  "家中长辈", "合作同伴", "客户窗口", "同事接口", "医生或顾问", "物业或平台", "老师或考官", "财务经手人",
  "出行同行者", "临时替补", "沉默的一方", "最早响应的人",
] as const;

const qimenPaceSignals = [
  "先收后放", "先静后动", "先问后答", "先证后诺", "先短后长", "先小后大", "先内后外", "先明后暗",
  "先退半步", "先留余地", "先定边界", "先借外力", "先修旧误", "先清账目", "先验路线", "先定时限",
  "先看回声", "先留凭据", "先分轻重", "先压情绪", "先稳身体", "先拆角色", "先减承诺", "先换场景",
  "先开小口", "先关杂音", "先求确认", "先等一刻",
] as const;

const qimenValidationSignals = [
  "对方愿意给时间", "资料出现新版本", "费用能写清", "责任边界变窄", "有人主动补信息", "原本卡住的人松口",
  "身体紧绷感下降", "三句话能说明白", "旧误会没有扩大", "关键人能复述目标", "流程能排进日历", "风险能列成清单",
  "备选方案能成立", "第三方能核验", "数字能对得上", "沉默方开始回应", "现场噪音变少", "你能暂停而不焦虑",
  "对方接受试行", "退出条件被承认", "材料可被转交", "报价留有余量", "方向感更清楚", "同伴知道分工",
  "问题能缩小一圈", "证据比情绪更强", "二十分钟内有反馈", "没有反馈也能收尾",
] as const;

const qimenDirectionUses = [
  "面向此方写第一条消息", "把椅子略转此方再复盘", "从此方出门先办最小一件事", "把资料放在此方静置二十分钟",
  "面向此方只谈事实不谈猜测", "在此方整理账本和凭据", "沿此方走一小段让心气落地", "把电话安排在面向此方的位置",
  "把电脑窗口移到此方视线内", "以此方为起点列三步路径", "坐定此方先喝水再开口", "在此方放一张待确认清单",
  "面向此方做一次十分钟演练", "把此方当作暂停点", "从此方开始收纳桌面", "把此方作为发起沟通的提示",
  "面向此方核对姓名、金额、时间", "把此方设为二十分钟计时入口", "在此方只处理一件事", "用此方提醒自己留退路",
  "面向此方读一遍回复再发送", "把此方当作证据夹的位置", "从此方开始确认谁能拍板", "在此方写下退出条件",
  "面向此方做身体放松", "把此方用作复盘位", "从此方开启小范围试探", "在此方结束今日这一问",
] as const;

const qimenRiskResets = [
  "若二十分钟内只增加焦虑，立刻缩小问题", "若对方只催不确认，先不加码承诺", "若数字对不上，今天只查账不表态",
  "若情绪升温，先换成书面复述", "若现场太吵，先离开再判断", "若有人绕开责任，先补边界",
  "若信息来源单一，先找第二个证据", "若身体疲惫，先休息再起局", "若计划太漂亮，先做反向验算",
  "若好处说得太满，先问代价", "若关系旧账浮起，先只处理当下", "若钱与人情混在一起，先分账",
  "若方向不可用，取同类动作即可", "若没有回应，二十分钟后收尾", "若越谈越大，回到第一步",
  "若被迫立刻决定，先争取缓冲", "若自己想讨好，先写底线", "若想一口气解释完，先删一半",
  "若第三方意见冲突，先核验事实", "若时间不够，先保留证据", "若权责不明，先问谁验收",
  "若预算超线，先停新支出", "若话题转偏，先拉回问题原句", "若承诺不可撤回，先不签字",
  "若环境杂乱，先清桌面", "若心里发虚，先找可执行证据", "若对方沉默，留一个选择题", "若已见进展，及时收口",
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
  const scene = pick(drawSceneAnchors, seed, "scene");
  const signal = pick(drawMicroSignals, seed, "signal");
  const tool = pick(drawPracticalTools, seed, "tool");
  const risk = pick(drawRiskReminders, seed, "risk");
  const close = pick(drawClosingMoves, seed, "close");
  const person = name.trim() || "你";
  return {
    signSuffix: `${image}问${category}`,
    allusion: `${allusion}问事落点取“${question}”，重在今日一问、一事一签；落到${scene}，更容易看见真气口。`,
    poemLine: `${image}照所问，${closer}`,
    reading: `${person}今日所问“${question}”，落点在${category}的当下取舍。五行取${element}象，不把吉凶说死，而是看气势如何落到手边：${action}可配合“${tool}”执行，先观察是否${signal}。${risk}；若越做越急、越说越乱，就先停一停，把问题再缩小。最后${close}，让今日这一签有头有尾。`,
    textLine: `此签取“${image}”之象，问${category}不求玄远，先照见${scene}的一处可动之门。`,
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
  const role = pick(qimenFieldRoles, seed, "role");
  const pace = pick(qimenPaceSignals, seed, "pace");
  const validation = pick(qimenValidationSignals, seed, "validation");
  const directionUse = pick(qimenDirectionUses, seed, "direction-use");
  const reset = pick(qimenRiskResets, seed, "risk-reset");
  return {
    method,
    prompt: `${dayGanzhi}日、${hourGanzhi}时起这一问，盘意先看“气口”再看成败。${prompt}这一局先盯住“${role}”，节奏取“${pace}”，不急着把全盘一次推完。`,
    actionGuide: `补一条落地法：围绕“${question}”，先按“${method}”做二十分钟，动作是：${action}二十分钟后只看三件事：有没有新信息、有没有人回应、自己是否更稳；尤其看是否${validation}。${reset}。`,
    directionNote: `朝向不是迷信地改造空间，而是用一个方向帮注意力归位；能面向就面向，不能面向就把该方向当作行动入口。今日可用法：${directionUse}。`,
  };
}

export function getRitualCorpusSummary() {
  const drawActionEntries = Object.values(drawAdviceLines).reduce((sum, items) => sum + items.length, 0);
  const qimenActionEntries = Object.values(qimenTopicActions).reduce((sum, items) => sum + items.length, 0);
  return {
    draw: {
      atomicEntries:
        expandedDrawQuestionPresets.length +
        drawImages.length +
        drawAllusions.length +
        drawActionEntries +
        drawPoemClosers.length +
        drawSceneAnchors.length +
        drawMicroSignals.length +
        drawPracticalTools.length +
        drawRiskReminders.length +
        drawClosingMoves.length,
      combinableVariants:
        expandedDrawQuestionPresets.length *
        drawImages.length *
        drawAllusions.length *
        Math.max(1, drawActionEntries) *
        drawPoemClosers.length *
        drawSceneAnchors.length *
        drawMicroSignals.length *
        drawPracticalTools.length *
        drawRiskReminders.length *
        drawClosingMoves.length,
    },
    qimen: {
      atomicEntries:
        expandedQimenQuestionPresets.length +
        qimenMicroMethods.length +
        qimenScenePrompts.length +
        qimenActionEntries +
        qimenFieldRoles.length +
        qimenPaceSignals.length +
        qimenValidationSignals.length +
        qimenDirectionUses.length +
        qimenRiskResets.length,
      combinableVariants:
        expandedQimenQuestionPresets.length *
        qimenMicroMethods.length *
        qimenMicroMethods.length *
        qimenScenePrompts.length *
        Math.max(1, qimenActionEntries) *
        qimenFieldRoles.length *
        qimenPaceSignals.length *
        qimenValidationSignals.length *
        qimenDirectionUses.length *
        qimenRiskResets.length,
    },
  };
}
