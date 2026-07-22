import { calculateTenGod } from "./fortune";
import type { AmbiguousProfessionalField, ElementName, FourPillarsResult, Pillar, PillarKey, TenGodName } from "./types";

export type RelationshipType = "partner" | "parent-child" | "business" | "friend";
export type CompatibilityAxisId =
  | "attraction"
  | "communication"
  | "trigger"
  | "trust"
  | "conflict"
  | "resources"
  | "decisions"
  | "stability"
  | "repair";

export type CompatibilityAxis = {
  id: CompatibilityAxisId;
  label: string;
  professionalBasis: string;
  plainLanguage: string;
  scene: string;
  action: string;
  caution: string;
};

export type CompatibilityResult = {
  relationship: RelationshipType;
  summary: string;
  axes: CompatibilityAxis[];
  roleSpecificGuidance: string[];
  elementDynamics: { element: ElementName; first: number; second: number; observation: string }[];
  tenGodDynamics: { direction: "A→B" | "B→A"; basis: string; theme: TenGodName; observation: string }[];
  combinationsAndClashes: { symbols: string[]; relation: string; coordinates: string[]; observation: string }[];
  communicationScenario: string;
  actionRules: string[];
  limitations: string[];
};

type AxisCopy = { plain: string; scene: string; action: string };
type GodStyle = { contact: string; speech: string; pressure: string; decision: string; repair: string };
type EvidenceProfileBase = {
  first: FourPillarsResult;
  second: FourPillarsResult;
  dayRelations: string[];
  crossRelations: CompatibilityResult["combinationsAndClashes"];
  elementDynamics: CompatibilityResult["elementDynamics"];
  relationMode: "supportive" | "tense" | "mixed" | "neutral";
  elementMode: "close" | "visible" | "wide";
  widestElement: ElementName;
  widerSide: "A" | "B" | "双方";
  confidence: "high" | "medium" | "limited";
  uncertain: boolean;
  boundaryCandidate: boolean;
};
type EvidenceProfile = EvidenceProfileBase & (
  | { dayPending: true; aToB: null; bToA: null }
  | { dayPending: false; aToB: TenGodName; bToA: TenGodName }
);

const elements: ElementName[] = ["木", "火", "土", "金", "水"];
const pillarKeys: PillarKey[] = ["year", "month", "day", "hour"];
const pillarLabels: Record<PillarKey, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };
const confidenceLabels: Record<FourPillarsResult["confidence"], string> = {
  high: "高置信",
  medium: "中等置信",
  limited: "有限置信",
};
const axisOrder: CompatibilityAxisId[] = [
  "attraction", "communication", "trigger", "trust", "conflict",
  "resources", "decisions", "stability", "repair",
];

const axisLabels: Record<CompatibilityAxisId, string> = {
  attraction: "彼此为什么靠近",
  communication: "话怎样才能被听见",
  trigger: "最容易被碰到的地方",
  trust: "信任怎样一点点长出来",
  conflict: "争执通常从哪里开始",
  resources: "钱、时间与人情怎样流动",
  decisions: "谁在什么时候做决定",
  stability: "关系靠什么走得长",
  repair: "走远以后怎样重新靠近",
};

const scenarios: Record<RelationshipType, string> = {
  partner: "讨论共同生活安排时，先分别说亲密需要与个人边界，再确认一个双方都能执行的约定。",
  "parent-child": "遇到规则冲突时，照顾者先说明底线和原因，再给孩子与年龄相称、有限而真实的选择。",
  business: "分配职责与收益前，把决策权、交付标准、现金流红线和复盘节点写入同一份记录。",
  friend: "出现期待落差时，用具体事件和可请求的行动代替对人格的判断，并允许彼此保留生活空间。",
};

const actionRulesByRole: Record<RelationshipType, string[]> = {
  partner: [
    "先说具体事件与亲密需要，不把沉默、忙碌或不同节奏解释成人格结论。",
    "家庭事务写明负责人、完成时间与可以求助的方式，避免把默契当作承诺。",
    "情绪升高时约定暂停时长，恢复后先复述对方意思，再处理一个议题。",
    "每周用一次短复盘确认靠近、独处、家务与共同计划的节奏。",
  ],
  "parent-child": [
    "照顾者先说明规则保护什么，再提供与年龄相称的两个真实选择。",
    "把行为、能力和人格分开反馈，不用一次失误定义孩子。",
    "期待写成可以观察的小步骤，同时保留孩子表达不同需要的入口。",
    "冲突后由成年人先恢复安全感，再共同复盘发生了什么和下次怎样求助。",
  ],
  business: [
    "权限边界：列明各自决策权限、否决事项、临时授权和升级路径。",
    "投资与成本审批：约定金额门槛、双人审批、书面留痕和禁止追加的情形。",
    "现金流与分配：按固定周期核对回款、支出、利润亏损与追加责任。",
    "风险止损与暂停：触及现金流、安全、合规或交付红线时停止新增承诺并复核。",
    "退出流程：预先约定通知期、债务处理、客户沟通、数据归属和估值争议程序。",
    "文档交接：退出或换岗时交接合同、账号、数据、进度、权限与责任清单。",
  ],
  friend: [
    "提出请求时说明事情、需要和可接受的时间，不把及时回应当作友情证明。",
    "涉及金钱、保密或长期帮忙时先讲清边界，让对方可以诚实拒绝。",
    "生活阶段改变后重新商量联系频率，不用旧习惯要求现在的彼此。",
    "误会后从具体事件重新对齐，并给关系留下自然恢复的时间。",
  ],
};

const roleFrame: Record<RelationshipType, string> = {
  partner: "伴侣关系要同时容纳亲密、承诺与两个成年人的独立边界，靠近不能替代清楚协商",
  "parent-child": "亲子关系先保护安全与成长，成年人承担解释规则的责任，同时尊重孩子正在发展的能力",
  business: "商业合作把互补放进书面治理，用权限、现金流和退出机制承接差异，不能只凭默契",
  friend: "朋友关系依靠自愿陪伴与清楚请求，也允许双方在不同人生阶段调整距离和频率",
};

const roleAxisCopy: Record<RelationshipType, Record<CompatibilityAxisId, AxisCopy>> = {
  partner: {
    attraction: { plain: "第一吸引力常来自对方提供了自己熟悉或欠缺的互动感，但心动之后仍要看需要能否被说清。", scene: "两个人安排第一次长途旅行，一方很快订好路线，另一方更在意沿途能否留出独处时间；若把差异当成拒绝，热情会迅速变成压力，成熟做法是先交换期待再订行程。", action: "各写下‘我怎样感到被靠近’和‘我什么时候需要空间’，交换后只选一项本周实践。" },
    communication: { plain: "亲密对话的难点往往不是没有感情，而是关心、建议和压力被使用了不同语法，需要先翻译再回应。", scene: "晚饭后讨论家务，一方马上给方案，另一方只想先被理解；如果方案被听成指责、沉默被看成冷淡，争论就会偏离原题，成熟版本是先确认此刻需要倾听还是解决。", action: "重要对话开头先问‘你要我听见、一起想办法，还是现在定下来’，再进入内容。" },
    trigger: { plain: "伴侣最敏感之处常落在被忽略、被催促或被越界的瞬间，触发反应不等于真实意图。", scene: "一方临时晚归却没有发消息，另一方连续追问；前者感到被管束，后者感到不被放在心上，旧有防御开始接管现场，成熟版本是区分事实、担心和可执行请求。", action: "各自列出一个身体警报和一句暂停用语，出现警报时先报状态，不继续猜测对方动机。" },
    trust: { plain: "伴侣信任来自可预期的小承诺：说到的事能做到，做不到时能提早说明，而不是依赖宏大表态。", scene: "两人准备共同搬家，一方承诺联系房东却迟迟没有进展；若另一方默默接手，表面顺利却积累失望，成熟版本是公开进度、困难与新的完成时间。", action: "把本周一个共同承诺写成负责人、截止点、变更通知方式，完成后再增加下一项。" },
    conflict: { plain: "争执容易从节奏、边界或表达方式升级成对关系本身的质疑，越需要安全时越要把议题缩小。", scene: "周末探望双方父母的安排出现冲突，一方强调公平，另一方强调当下需要；若开始翻旧账，具体行程会变成谁更重要的审判，成熟版本是一次只处理本周安排与补偿办法。", action: "冲突时把议题写成一个可回答的问题，禁止加入‘总是’‘从不’，二十分钟无进展就按约暂停。" },
    resources: { plain: "钱、时间和家务都是关系资源，分配方式会把双方对公平、照顾与自主的理解显露出来。", scene: "共同账户要支付一笔家庭开支，一方重视当下体验，另一方担心安全垫；若把谨慎说成吝啬、把消费说成不负责，资源讨论就会伤及尊严，成熟版本是先定共同底线再保留个人额度。", action: "列出共同支出、个人额度、家务时间和人情往来四栏，先约定需要双人确认的阈值。" },
    decisions: { plain: "伴侣不必每件事都平均做主，但需要知道哪些可单独决定、哪些必须共同确认、谁负责收尾。", scene: "装修时一方擅长快速选择，另一方需要比较资料；若快的一方全部拍板、慢的一方事后否定，效率和参与感都会受损，成熟版本是按事项分配主责与否决边界。", action: "把近期三项决定标成个人决定、主责征询和共同决定，并为共同项设一个截止时间。" },
    stability: { plain: "长期稳定不是没有变化，而是关系在工作、家庭与身体节奏变化时仍能重新协商。", scene: "一方进入高强度项目期，原有约会和家务安排被打乱；若另一方只看见失约、忙碌者只看见压力，关系会渐渐失联，成熟版本是承认阶段变化并设置临时节奏。", action: "每月检查一次亲密、独处、家务和共同计划，任何一项连续失衡两周就重新分配。" },
    repair: { plain: "修复不等于立刻和好，而是先让伤害被看见，再说明责任、补救与下次的不同做法。", scene: "一次激烈争论后，一方急着拥抱翻篇，另一方仍需要整理；若催促原谅，靠近会再次变成压力，成熟版本是先确认伤害、约定回来谈的时间，再用具体行动补回安全感。", action: "使用四句修复语言：我做了什么、可能怎样影响你、我愿意怎样补救、下次我会在哪一步停下来。" },
  },
  "parent-child": {
    attraction: { plain: "亲子之间的靠近首先是依恋与照顾，不应把孩子的迎合误当成熟，也不把探索距离解释成拒绝。", scene: "孩子从学校回家立刻关上房门，照顾者想马上问清情况；若追问被体验为侵入，双方都会更紧张，成熟做法是先提供食物和安静，再约一个孩子可预期的谈话时间。", action: "每天安排十分钟不纠正、不教学的共同时间，由孩子选择活动，成年人只负责稳定在场。" },
    communication: { plain: "亲子沟通要把规则原因、孩子感受和下一步分开，年龄与承受能力比说服速度更重要。", scene: "作业迟迟未完成，照顾者连续讲道理，孩子只听见自己不够好；若音量继续升高，信息已经无法进入，成熟版本是先让情绪下降，再用一句原因和两个选择重启。", action: "规则只说三部分：保护什么、现在要做什么、可以从哪两个选择中决定，并让孩子复述。" },
    trigger: { plain: "孩子的拖延、顶嘴或退缩可能碰到成年人的焦虑；成年人的催促也可能碰到孩子的羞耻或无力。", scene: "出门前孩子反复找不到物品，照顾者脱口而出‘怎么总是这样’；孩子从解决问题转向保护自尊，现场更慢，成熟版本是先完成当下任务，再另找平静时间训练整理。", action: "成年人察觉声音变硬时先停十秒，把人格评价改写为一个可观察行为和一个具体帮助。" },
    trust: { plain: "亲子信任来自规则一致、承诺兑现和犯错后仍能求助，监督不能代替可恢复的安全感。", scene: "孩子隐瞒一次测验结果，照顾者若立即没收所有自主权，短期安静却会降低下次求助概率，成熟版本是处理事实后共同设计补救，同时说明哪些权限能逐步恢复。", action: "为一个反复问题约定诚实报告、补救步骤和权限恢复条件，让孩子知道犯错后仍有路径。" },
    conflict: { plain: "亲子冲突中的权力不对等真实存在，因此成年人要先管住羞辱、威胁与无限加码，再谈边界。", scene: "屏幕时间结束时孩子拒绝交还设备，照顾者若边吼边追加惩罚，规则会变成力量对抗；成熟版本是执行预先约定的后果，等双方平稳后再复盘触发点。", action: "后果提前约定、与行为相关且有结束条件；现场不临时加码，事后由成年人先检查自己的处理。" },
    resources: { plain: "时间、注意力、学习机会和零花钱都是教养资源，目标是逐步培养管理能力而不是永久代管。", scene: "孩子想把零花钱一次用完，照顾者担心浪费而直接拒绝；若不给任何练习空间，孩子只学会隐藏，成熟版本是保留小额试错区，同时共同记录选择与结果。", action: "把资源分成成年人守底线、孩子可练习、需要共同商量三类，并按年龄逐步扩大练习区。" },
    decisions: { plain: "亲子决策要区分安全底线、家庭共同事务和孩子个人选择，不能把所有事情都包装成自由。", scene: "孩子想退出一项课外活动，照顾者担心半途而废；若强迫坚持或立刻放弃，都跳过了原因，成熟版本是先听清困难，再约定试行期与退出后的责任。", action: "每项决定先标明谁承担后果；安全由成年人决定，成长选择给有限范围，共同事务安排复盘点。" },
    stability: { plain: "稳定的亲子关系既需要可预期规则，也要随年龄更新权限，旧办法不能永久套在成长中的孩子身上。", scene: "进入青春期后，孩子希望关门和独处，照顾者仍沿用幼年时的随时检查；若把成长需求看成疏远，信任会变薄，成熟版本是重谈隐私边界与紧急例外。", action: "每半年按年龄复核作息、隐私、零花钱与设备权限，写明扩大自主所需的能力和责任。" },
    repair: { plain: "亲子修复由成年人先示范负责，不要求孩子立刻接受道歉，也不把照顾付出当作免除责任的理由。", scene: "照顾者在亲友面前批评孩子后想用买东西翻篇，孩子仍然沉默；成熟版本是私下承认具体伤害、停止辩解，并询问怎样补回尊重，再给孩子决定回应时间。", action: "成年人先说清自己的行为与影响，提出一项补救，并询问孩子希望现在谈还是约定稍后再谈。" },
  },
  business: {
    attraction: { plain: "商业上的靠近应被翻译成能力、资源或判断接口，互补感不能替代资质核验和书面职责。", scene: "两位合作方在路演后发现彼此思路互补，便想立刻共同投入；若没有核对交付能力、时间承诺和利益冲突，兴奋会掩盖治理缺口，成熟版本是先做小范围验证。", action: "先设一个有期限、可验收的小项目，分别记录投入、交付、决策和复盘，再决定是否扩大合作。" },
    communication: { plain: "商业沟通要把观点变成数据、责任人与截止点，不能用关系默契代替可追踪的信息。", scene: "经营会上，一方报告增长机会，另一方不断追问风险；若前者把追问看成不信任、后者把热情看成鲁莽，会议会变成立场防守，成熟版本是用同一组指标比较方案。", action: "每个提案固定写目标、假设、现金影响、负责人、截止点和反方意见，会议只处理差异项。" },
    trigger: { plain: "合作触发点常藏在越权、信息延迟、成本失控或功劳归属，必须由制度承接而非猜测动机。", scene: "一方未经确认向客户承诺额外交付，另一方在群里直接否定；越权与公开纠正同时触发防御，成熟版本是先保护客户接口，再按升级路径复盘授权和责任。", action: "列出越权、延迟披露、预算超线三类触发事件，为每类预设通知人、暂停动作和复核时限。" },
    trust: { plain: "商业信任来自信息可核、承诺可追、权限可审计；关系再熟也要保留交叉检查与冲突披露。", scene: "回款晚于计划，一方担心影响士气而暂未披露，另一方月底才发现资金缺口；成熟版本不是追究人格，而是建立固定现金流报告和异常提前通知。", action: "建立周度交付表、月度现金流表和利益冲突披露，关键数据至少由两人交叉确认。" },
    conflict: { plain: "商业争执要回到合同、数据和职责，不把经营分歧升级为人格或关系胜负。", scene: "新产品未达目标，一方主张继续追加，另一方要求停止；若只争谁更有眼光，现金流会继续承压，成熟版本是按预设指标触发止损复核并记录异议。", action: "争议先冻结新增承诺，列出共同事实、分歧假设与可逆方案；超过权限就进入书面升级或第三方程序。" },
    resources: { plain: "资金、人力、客户和时间都应有所有权、使用权限与核算周期，投入热情不能代替现金纪律。", scene: "大客户要求提前扩充团队，一方看到机会，另一方担心回款周期；成熟版本是先测算最坏现金缺口、设投资门槛和止损点，再决定分阶段投入。", action: "为新增投入写金额门槛、资金来源、回款假设、最坏缺口、审批人和停止追加条件。" },
    decisions: { plain: "合作决策要区分岗位主责、共同保留事项和紧急授权，速度与制衡可以同时存在。", scene: "客户临时要求降价，销售负责人想立即回应，财务负责人担心毛利与先例；成熟版本是按金额和毛利阈值确定谁可决定，超线事项进入双签。", action: "制作权限矩阵：日常事项单责、重大事项双签、红线事项否决，并规定临时授权的到期与追认。" },
    stability: { plain: "长期合作靠透明数据、定期复盘与可执行退出，而不是把不退出当作关系证明。", scene: "业务方向改变后，原有分工已不适用，一方承担过多却迟迟不提；成熟版本是按季度重估职责、收益和风险承受，并允许用既定程序暂停或退出。", action: "每季度复核权限、投入、现金流、风险红线和退出条件；任何一项失真就暂停扩张并书面修订。" },
    repair: { plain: "商业修复首先恢复事实、权限与交付，再处理感受；道歉不能替代损失确认和制度修补。", scene: "一次越权承诺造成延期，双方都担心客户流失；成熟版本是先明确对外负责人和补救计划，再确认损失、责任及流程缺口，而不是私下口头翻篇。", action: "按事实影响、客户补救、责任承担、权限修订和复盘日期五步记录；无法恢复时启动退出与交接。" },
  },
  friend: {
    attraction: { plain: "朋友之间的靠近可能来自共同兴趣、互相启发或安静陪伴，不必把联系频率当成关系价值。", scene: "两人在社群活动中迅速聊得投机，一方希望每天分享，另一方更习惯偶尔深谈；若用回复速度验证友情，轻松感会变成任务，成熟版本是说清各自舒服的联系节奏。", action: "互相说出一种喜欢的陪伴方式和一种不方便的频率，先按一个月试行再自然调整。" },
    communication: { plain: "朋友沟通最需要把倾诉、建议和帮忙请求分开，让对方知道自己可以怎样回应，也可以拒绝。", scene: "一方深夜发来长段烦恼，另一方第二天只给解决方案；前者觉得没被理解，后者以为已经帮忙，成熟版本是发消息时先注明想被听见、想听意见还是需要具体协助。", action: "请求前加一句‘我希望你听听、给意见或帮一个具体忙’，并询问对方现在是否有容量。" },
    trigger: { plain: "友情的敏感点常在失约、比较、秘密边界或单向付出，先核对事实比测试关系更有效。", scene: "共同聚会临时取消后，一方看到朋友去了别处便感到被轻视；若用冷淡试探，对方只会感到莫名，成熟版本是直接询问变化并说明自己受影响的具体部分。", action: "被触发时不发试探信息，先写下事实、自己的解释和一个可直接询问的问题，隔十分钟再发送。" },
    trust: { plain: "朋友信任来自守约、保密和遇到做不到时坦白说明，不要求对方承担所有情绪或随时可用。", scene: "一方转述了朋友的私人近况，虽无恶意却越过保密边界；成熟版本是停止扩散、承认具体影响，并重新确认哪些内容可以对外说、哪些必须先征得同意。", action: "涉及隐私、借款或长期帮忙时明确保密范围、归还时间和退出方式，不靠默认理解。" },
    conflict: { plain: "朋友冲突没有家庭或合同强制维系，更需要清楚表达、保留体面，并接受距离可能暂时调整。", scene: "一次共同旅行中，消费和作息差异不断累积，回程后双方都减少联系；成熟版本是挑一个具体事件说明影响，讨论下次怎样分账与留白，而不是给对方贴标签。", action: "只谈一个可复核事件，提出一个以后可执行的请求；若对方暂不回应，就说明自己的边界并停止追逼。" },
    resources: { plain: "朋友间的钱、时间、人脉与情绪劳动都需要自愿和清楚边界，帮忙不是永久义务。", scene: "一方多次请朋友介绍工作机会，另一方不好意思拒绝却逐渐有压力；成熟版本是说明能帮到哪一步、不能保证什么，并让请求者承担后续联系与结果。", action: "涉及借款、人脉或连续陪伴时说明范围、期限和对方可拒绝的入口，重要约定用文字确认。" },
    decisions: { plain: "共同旅行、项目或聚会可以按经验分工，但任何人都应保留预算、时间和安全上的否决权。", scene: "朋友们计划跨城旅行，一人快速订票，另一人还没确认预算；若用群体热情催促，参与会变成负担，成熟版本是先收集不可妥协条件，再由主责者整理方案。", action: "共同决定先收集每个人的预算、时间和底线，再指定一人整理；沉默不视为同意。" },
    stability: { plain: "友情保鲜靠的是阶段变化后仍能重新认识彼此，而不是复制过去的联系强度。", scene: "一方成为新手父母后很少参加聚会，另一方以为关系淡了；成熟版本是承认容量变化，改用更短、更可行的陪伴，同时保留以后重新靠近的可能。", action: "人生阶段变化时主动更新联系频率和可提供的支持，每三个月用一次轻量邀约保持入口。" },
    repair: { plain: "朋友修复需要真诚说明影响，也尊重对方决定回应速度；补救可以具体，但不能强迫恢复原状。", scene: "一句玩笑在公开场合让朋友难堪，事后解释‘没有恶意’反而加重伤害；成熟版本是承认场合与影响、停止辩护，询问是否需要澄清，并接受对方先拉开距离。", action: "道歉时删去‘但是’，说明具体行为、影响和补救；给对方选择现在谈、稍后谈或暂时不谈。" },
  },
};

const godStyles: Record<TenGodName, GodStyle> = {
  比肩: { contact: "以平等并肩建立熟悉感", speech: "直接交换立场", pressure: "双方都坚持自己的步幅", decision: "各自保有主张", repair: "恢复对等与尊重" },
  劫财: { contact: "以快速投入和共同挑战拉近距离", speech: "反应快且容易抢先", pressure: "资源与边界容易重叠", decision: "争取先手与参与权", repair: "重新划清投入边界" },
  食神: { contact: "以照顾、分享和舒展感靠近", speech: "倾向温和铺陈体验", pressure: "可能回避立即碰硬", decision: "先顾及可持续感受", repair: "用具体照顾恢复松弛" },
  伤官: { contact: "以新鲜观点和真实表达形成吸引", speech: "擅长指出问题与例外", pressure: "措辞锋利时容易伤人", decision: "先挑战既有方案", repair: "把批评改写成可执行请求" },
  偏财: { contact: "以机会感、流动性与资源连接靠近", speech: "从可能性和外部接口切入", pressure: "承诺范围可能扩张过快", decision: "愿意抓住窗口快速行动", repair: "重新核对投入与承诺" },
  正财: { contact: "以可靠投入和现实照料建立连接", speech: "重视事实、成本与兑现", pressure: "容易把关系变成责任清单", decision: "先确认资源是否可承受", repair: "用持续兑现补回可信度" },
  七杀: { contact: "以行动力、挑战感和明确边界吸引", speech: "偏好结论、时限与直接要求", pressure: "高压时容易催促或压缩空间", decision: "在压力下迅速承担", repair: "先降压再重订边界" },
  正官: { contact: "以稳定秩序和责任感建立安全", speech: "倾向按规则与角色说明", pressure: "标准过紧时容易彼此审查", decision: "先确认规范和责任归属", repair: "恢复一致规则与可预期性" },
  偏印: { contact: "以独特理解和跳跃洞察形成默契", speech: "从隐含线索和整体感觉切入", pressure: "容易省略推理让对方跟不上", decision: "先形成内部判断再表达", repair: "补出过程并允许核对" },
  正印: { contact: "以理解、支持和知识照应靠近", speech: "先吸收背景再给回应", pressure: "可能用照顾替代询问", decision: "重视依据、保护与长期影响", repair: "先确认需要再提供支持" },
};

const relationPairs: [string, string, string][] = [
  ["子", "午", "冲"], ["丑", "未", "冲"], ["寅", "申", "冲"], ["卯", "酉", "冲"], ["辰", "戌", "冲"], ["巳", "亥", "冲"],
  ["子", "丑", "合"], ["寅", "亥", "合"], ["卯", "戌", "合"], ["辰", "酉", "合"], ["巳", "申", "合"], ["午", "未", "合"],
  ["子", "未", "害"], ["丑", "午", "害"], ["寅", "巳", "害"], ["卯", "辰", "害"], ["申", "亥", "害"], ["酉", "戌", "害"],
  ["寅", "巳", "刑"], ["巳", "申", "刑"], ["寅", "申", "刑"], ["丑", "戌", "刑"], ["戌", "未", "刑"], ["丑", "未", "刑"], ["子", "卯", "刑"],
  ["子", "酉", "破"], ["卯", "午", "破"], ["辰", "丑", "破"], ["戌", "未", "破"], ["寅", "亥", "破"], ["巳", "申", "破"],
];

const branchTrines = [
  ["申", "子", "辰", "水"],
  ["亥", "卯", "未", "木"],
  ["寅", "午", "戌", "火"],
  ["巳", "酉", "丑", "金"],
] as const;

export function classifyBranchRelation(left: string, right: string): string[] {
  return relationPairs
    .filter(([a, b]) => (a === left && b === right) || (a === right && b === left))
    .map(([, , relation]) => relation);
}

function hasAmbiguousDay(chart: FourPillarsResult) {
  const fields = new Set<AmbiguousProfessionalField>(chart.professional.ambiguousFields);
  return chart.ambiguousPillars.includes("day") || fields.has("dayMaster") || fields.has("dayPillar");
}

function stablePillars(chart: FourPillarsResult): Array<[PillarKey, Pillar]> {
  return pillarKeys.flatMap((key) => {
    const pillar = chart.pillars[key];
    const ambiguous = chart.ambiguousPillars.includes(key) || (key === "day" && hasAmbiguousDay(chart));
    return pillar && !ambiguous ? [[key, pillar] as [PillarKey, Pillar]] : [];
  });
}

function stableElementCounts(chart: FourPillarsResult): Record<ElementName, number> {
  const counts: Record<ElementName, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const [, pillar] of stablePillars(chart)) {
    counts[pillar.element] += 1;
    counts[pillar.branchElement] += 1;
  }
  return counts;
}

function buildElementDynamics(first: FourPillarsResult, second: FourPillarsResult): CompatibilityResult["elementDynamics"] {
  const firstCounts = stableElementCounts(first);
  const secondCounts = stableElementCounts(second);
  return elements.map((element) => {
    const a = firstCounts[element];
    const b = secondCounts[element];
    const observation = a === b
      ? `双方稳定柱的${element}计数同为${a}，配置接近仍需观察实际分工。`
      : `${a > b ? "A" : "B"}的稳定柱${element}计数更高，适合把相关经验用于示范，不据此包办或定性。`;
    return { element, first: a, second: b, observation };
  });
}

function crossRelations(first: FourPillarsResult, second: FourPillarsResult): CompatibilityResult["combinationsAndClashes"] {
  const aCoordinates = stablePillars(first).map(([key, pillar]) => ({ side: "A" as const, label: `A${pillarLabels[key]}`, branch: pillar.branch }));
  const bCoordinates = stablePillars(second).map(([key, pillar]) => ({ side: "B" as const, label: `B${pillarLabels[key]}`, branch: pillar.branch }));
  const allCoordinates = [...aCoordinates, ...bCoordinates];
  const relations: CompatibilityResult["combinationsAndClashes"] = [];
  const observations: Record<string, string> = {
    合: "稳定柱形成合，容易找到协作接口，也要防止默契取代边界与确认。",
    冲: "稳定柱形成冲，节奏与方向容易正面拉扯，适合预设暂停和复盘。",
    害: "稳定柱形成害，误会可能从没有说出的期待累积，适合提早核对事实。",
    刑: "稳定柱形成刑，同一问题可能反复施压，适合拆小议题并限制升级。",
    破: "稳定柱形成破，原有配合方式容易出现松动或错位，适合及时重订边界与交接。",
  };
  for (const [left, right, relation] of relationPairs) {
    const matched = aCoordinates.flatMap((a) => bCoordinates.map((b) => ({ a, b })))
      .find(({ a, b }) => (a.branch === left && b.branch === right) || (a.branch === right && b.branch === left));
    if (!matched) continue;
    const coordinates = [matched.a.label, matched.b.label];
    relations.push({
      symbols: [left, right],
      relation,
      coordinates,
      observation: `证据坐标：${matched.a.label}${matched.a.branch}、${matched.b.label}${matched.b.branch}。${observations[relation]}`,
    });
  }
  for (const [firstBranch, secondBranch, thirdBranch, element] of branchTrines) {
    const symbols = [firstBranch, secondBranch, thirdBranch];
    const candidates = symbols.map((symbol) => allCoordinates.filter((coordinate) => coordinate.branch === symbol));
    let matched: typeof allCoordinates | undefined;
    for (const firstCoordinate of candidates[0]) {
      for (const secondCoordinate of candidates[1]) {
        for (const thirdCoordinate of candidates[2]) {
          const group = [firstCoordinate, secondCoordinate, thirdCoordinate];
          if (new Set(group.map((coordinate) => coordinate.side)).size === 2) {
            matched = group;
            break;
          }
        }
        if (matched) break;
      }
      if (matched) break;
    }
    if (!matched) continue;
    const coordinates = matched.map((coordinate) => coordinate.label);
    const label = `${symbols.join("")}三合${element}局`;
    relations.push({
      symbols,
      relation: "三合",
      coordinates,
      observation: `证据坐标：${matched.map((coordinate) => `${coordinate.label}${coordinate.branch}`).join("、")}。${label}三支齐全，且双方命盘均提供已知柱位；只作为协作接口观察。`,
    });
  }
  if (relations.length) return relations;
  return [{
    symbols: [aCoordinates[0]?.branch ?? "待核", bCoordinates[0]?.branch ?? "待核"],
    relation: "无直接合冲刑害破或三合",
    coordinates: [aCoordinates[0]?.label ?? "A待核", bCoordinates[0]?.label ?? "B待核"],
    observation: "双方稳定柱未见直接合冲刑害破或三合，不以单一地支关系替代真实互动观察。",
  }];
}

function lowestConfidence(first: FourPillarsResult, second: FourPillarsResult): EvidenceProfile["confidence"] {
  const rank = { high: 2, medium: 1, limited: 0 } as const;
  return rank[first.confidence] <= rank[second.confidence] ? first.confidence : second.confidence;
}

function buildProfile(first: FourPillarsResult, second: FourPillarsResult): EvidenceProfile {
  const dayPending = hasAmbiguousDay(first) || hasAmbiguousDay(second);
  const cross = crossRelations(first, second);
  const directRelations = cross.filter((item) => item.relation !== "无直接合冲刑害破或三合");
  const hasSupport = directRelations.some((item) => item.relation === "合" || item.relation === "三合");
  const hasTension = directRelations.some((item) => item.relation !== "合" && item.relation !== "三合");
  const relationMode = hasSupport && hasTension ? "mixed" : hasSupport ? "supportive" : hasTension ? "tense" : "neutral";
  const elementDynamics = buildElementDynamics(first, second);
  const totalGap = elementDynamics.reduce((sum, item) => sum + Math.abs(item.first - item.second), 0);
  const widest = elementDynamics.reduce((current, item) => (
    Math.abs(item.first - item.second) > Math.abs(current.first - current.second) ? item : current
  ));
  const elementMode = totalGap <= 2 ? "close" : totalGap <= 6 ? "visible" : "wide";
  const sharedProfile: EvidenceProfileBase = {
    first,
    second,
    dayRelations: dayPending ? [] : classifyBranchRelation(first.pillars.day.branch, second.pillars.day.branch),
    crossRelations: cross,
    elementDynamics,
    relationMode,
    elementMode,
    widestElement: widest.element,
    widerSide: widest.first === widest.second ? "双方" : widest.first > widest.second ? "A" : "B",
    confidence: lowestConfidence(first, second),
    uncertain: first.confidence !== "high" || second.confidence !== "high" || first.ambiguousPillars.length > 0 || second.ambiguousPillars.length > 0,
    boundaryCandidate: [...first.ambiguousPillars, ...second.ambiguousPillars].some((key) => key === "year" || key === "month"),
  };
  return dayPending
    ? { ...sharedProfile, dayPending: true, aToB: null, bToA: null }
    : {
        ...sharedProfile,
        dayPending: false,
        aToB: calculateTenGod(first.pillars.day.stem, second.pillars.day.stem),
        bToA: calculateTenGod(second.pillars.day.stem, first.pillars.day.stem),
      };
}

function relationMeaning(profile: EvidenceProfile) {
  const meanings = {
    supportive: "稳定柱以合为主，容易先找到共同接口，但仍需把默认默契说成明确约定",
    tense: "稳定柱以冲、刑、害或破的张力为主，差异会较早进入现场，适合先设边界与暂停机制",
    mixed: "稳定柱同时出现合或三合与冲刑害破，靠近和拉扯会并存，需要把合作接口与压力点分别处理",
    neutral: "稳定柱未见直接合冲刑害破或三合，互动质量更依赖真实习惯、请求方式与持续兑现",
  } as const;
  return meanings[profile.relationMode];
}

function elementMeaning(profile: EvidenceProfile) {
  if (profile.elementMode === "close") return `稳定柱五行总差较窄，${profile.widestElement}也没有形成明显单边优势，分工更要依据现实能力`;
  if (profile.elementMode === "visible") return `稳定柱五行差异可见，其中${profile.widerSide}的${profile.widestElement}更显，互补需要经过请求而不能变成代偿`;
  return `稳定柱五行差异较宽，其中${profile.widerSide}的${profile.widestElement}落差最明显，应把优势、负担和替补机制写清`;
}

function semanticBasis(id: CompatibilityAxisId, profile: EvidenceProfile) {
  const relation = relationMeaning(profile);
  const element = elementMeaning(profile);
  if (profile.dayPending) {
    switch (id) {
      case "attraction": return "至少一方日柱待核，暂不生成双向十神或由候选日干推导的靠近风格";
      case "communication": return "至少一方日柱待核，暂不生成双向十神或由候选日干推导的表达风格";
      case "trigger": return `日柱待核期间不生成候选日支关系；${relation}`;
      case "trust": return `${relation}；信任更适合由可核对的小承诺逐步累积`;
      case "conflict": return `日柱待核期间不生成候选日支关系或压力风格；${relation}`;
      case "resources": return `${element}，资源分配要同时看投入、承受与退出责任`;
      case "decisions": return "至少一方日柱待核，暂不生成双向十神或由候选日干推导的决策风格";
      case "stability": return `${element}；当前证据置信为${confidenceLabels[profile.confidence]}，稳定来自可调整的结构而非静态判断`;
      case "repair": return `日柱待核期间不生成候选日干、日支对应的修复风格；${relation}`;
    }
  } else {
    const a = godStyles[profile.aToB];
    const b = godStyles[profile.bToA];
    switch (id) {
      case "attraction": return `A对B呈${profile.aToB}，倾向${a.contact}；B对A呈${profile.bToA}，倾向${b.contact}`;
      case "communication": return `A侧${a.speech}，B侧${b.speech}，同一句关心可能经过两套表达顺序`;
      case "trigger": return `${a.pressure}与${b.pressure}相遇；${relation}`;
      case "trust": return `${relation}；信任更适合由可核对的小承诺逐步累积`;
      case "conflict": return `${a.pressure}和${b.pressure}会在压力下放大；${relation}`;
      case "resources": return `${element}，资源分配要同时看投入、承受与退出责任`;
      case "decisions": return `A侧${a.decision}，B侧${b.decision}，需要按事项而非按人格分配主责`;
      case "stability": return `${element}；当前证据置信为${confidenceLabels[profile.confidence]}，稳定来自可调整的结构而非静态判断`;
      case "repair": return `A侧适合${a.repair}，B侧适合${b.repair}；${relation}`;
    }
  }
}

function professionalBasis(id: CompatibilityAxisId, profile: EvidenceProfile) {
  const { first, second } = profile;
  const dayStatus = [
    hasAmbiguousDay(first) ? "A日柱待核" : `A日柱${first.pillars.day.stem}${first.pillars.day.branch}稳定`,
    hasAmbiguousDay(second) ? "B日柱待核" : `B日柱${second.pillars.day.stem}${second.pillars.day.branch}稳定`,
  ].join("；");
  const pendingDayBasis = `${dayStatus}；日柱待核期间不生成候选日干十神、日支关系或对应互动风格。`;
  const aBasis = `A日干${first.pillars.day.stem}相对B日干${second.pillars.day.stem}`;
  const bBasis = `B日干${second.pillars.day.stem}相对A日干${first.pillars.day.stem}`;
  const dayRelation = profile.dayRelations.length ? profile.dayRelations.join("、") : "无直接合冲刑害破";
  const cross = profile.crossRelations.map((item) => `${item.coordinates.join("、")}：${item.symbols.join("")}${item.relation}`).join("、");
  const five = profile.elementDynamics.map((item) => `${item.element}${item.first}/${item.second}`).join("、");
  if (profile.dayPending && ["attraction", "communication", "trigger", "conflict", "decisions", "repair"].includes(id)) {
    return pendingDayBasis;
  }
  switch (id) {
    case "attraction": return `${aBasis}为${profile.aToB}；${bBasis}为${profile.bToA}，观察双方主动靠近的语言。`;
    case "communication": return `${aBasis}取${profile.aToB}，${bBasis}取${profile.bToA}，比较双向表达与接收顺序。`;
    case "trigger": return `A日支${first.pillars.day.branch}与B日支${second.pillars.day.branch}呈${dayRelation}；只采用稳定日柱观察触发节奏。`;
    case "trust": return `跨盘稳定关系：${cross}；全部关系并读，不用单一合、三合、冲、刑、害或破替代信任事实。`;
    case "conflict": return `A日支${first.pillars.day.branch}、B日支${second.pillars.day.branch}的日支关系为${dayRelation}；跨盘稳定关系另见${cross}。`;
    case "resources": return `稳定柱五行差异：${five}；以计数落差观察资源分配方式，不据此评价贡献高低。`;
    case "decisions": return `${aBasis}的${profile.aToB}与${bBasis}的${profile.bToA}并读，观察主张、规则与承担方式。`;
    case "stability": return `输入置信 A:${confidenceLabels[first.confidence]}，B:${confidenceLabels[second.confidence]}；稳定柱五行证据为${five}，候选柱不进入结论。`;
    case "repair": return `A日支${first.pillars.day.branch}与B日支${second.pillars.day.branch}呈${dayRelation}，并参照${profile.aToB}与${profile.bToA}的修复入口。`;
  }
}

function evidenceAction(id: CompatibilityAxisId, profile: EvidenceProfile) {
  if (profile.dayPending) {
    switch (id) {
      case "attraction": return "日柱待核期间只核对现实中的靠近需要与边界，不套用候选十神风格。";
      case "communication": return "日柱待核期间先询问对方需要倾听、讨论还是决定，不套用候选表达风格。";
      case "trigger": return "日柱待核期间记录真实触发事件，不把候选日支关系当作压力证据。";
      case "conflict": return "日柱待核期间把议题缩到一个事实，不按候选日干推定任何一方的压力反应。";
      case "trust": return profile.relationMode === "supportive" ? "把容易形成的默契写成可核对承诺，防止双方记住不同版本。" : "从低风险、短周期、能复盘的承诺开始，不用一次表态要求长期确信。";
      case "resources": return profile.elementMode === "wide" ? `为${profile.widestElement}落差设置主责、替补与上限，防止${profile.widerSide}长期单边承担。` : "即使五行差异不大也按现实能力分工，并给每项资源安排复盘日期。";
      case "decisions": return "日柱待核期间按现实能力与书面权限分配主责，不按候选十神指定决策者。";
      case "stability": return profile.uncertain ? "先执行一个月可逆方案并留痕；出生信息置信有限时，不据候选柱扩大结论。" : "每月核对一次分工与承受度；即使输入置信较高，也以现实反馈修订安排。";
      case "repair": return "日柱待核期间先确认事实、影响与补救，不按候选日干或日支指定修复入口。";
    }
  } else {
    const a = godStyles[profile.aToB];
    const b = godStyles[profile.bToA];
    switch (id) {
      case "attraction": return `A先用“${a.contact}”表达靠近，B再用“${b.contact}”确认自己的舒适边界。`;
      case "communication": return `先让A完整说出${a.speech}的依据，再请B用${b.speech}的方式复述并补充。`;
      case "trigger": return profile.relationMode === "neutral" ? "没有直接地支张力也要记录真实触发事件，不用沉默推定没有问题。" : "一出现速度、边界或期待拉扯就启动暂停语，不在高压时解释对方动机。";
      case "trust": return profile.relationMode === "supportive" ? "把容易形成的默契写成可核对承诺，防止双方记住不同版本。" : "从低风险、短周期、能复盘的承诺开始，不用一次表态要求长期确信。";
      case "conflict": return `A注意${a.pressure}，B注意${b.pressure}；任何一方出现该信号就把议题缩到一个事实。`;
      case "resources": return profile.elementMode === "wide" ? `为${profile.widestElement}落差设置主责、替补与上限，防止${profile.widerSide}长期单边承担。` : "即使五行差异不大也按现实能力分工，并给每项资源安排复盘日期。";
      case "decisions": return `分别保留A的“${a.decision}”与B的“${b.decision}”，再用权限表确定最后责任人。`;
      case "stability": return profile.uncertain ? "先执行一个月可逆方案并留痕；出生信息置信有限时，不据候选柱扩大结论。" : "每月核对一次分工与承受度；即使输入置信较高，也以现实反馈修订安排。";
      case "repair": return `A从${a.repair}进入，B从${b.repair}进入；先确认伤害，再商量双方都能验证的补救。`;
    }
  }
}

function cautionFor(profile: EvidenceProfile) {
  if (profile.dayPending) return "至少一方日柱待核，本轴不使用候选日干、日支、双向十神或相应风格；只保留其他稳定柱证据并由真实互动复核。";
  if (profile.boundaryCandidate) return "至少一方未知时辰且处于交节候选范围，本轴只用未标记为候选的稳定柱；判断置信有限，须由真实互动复核。";
  if (profile.uncertain) return "至少一方出生时间为约略或未知，本轴已排除不稳定柱证据并降低置信；请把文字当作观察问题而非定论。";
  return "本轴来自高置信出生输入中的结构证据，也只能提供观察语言；不能替代当事人的意愿、安全与持续互动。";
}

function buildAxes(relationship: RelationshipType, profile: EvidenceProfile): CompatibilityAxis[] {
  return axisOrder.map((id) => {
    const role = roleAxisCopy[relationship][id];
    const meaning = semanticBasis(id, profile);
    return {
      id,
      label: axisLabels[id],
      professionalBasis: professionalBasis(id, profile),
      plainLanguage: `${roleFrame[relationship]}。${role.plain}${meaning}，因此要把倾向转成可以讨论和复核的行为。`,
      scene: `${role.scene} 这组命盘证据提示：${meaning}，所以现场应优先处理可观察的动作，不给任何一方贴固定标签。`,
      action: `${role.action} 同时，${evidenceAction(id, profile)}`,
      caution: cautionFor(profile),
    };
  });
}

function roleGuidance(relationship: RelationshipType, profile: EvidenceProfile): string[] {
  const relation = relationMeaning(profile);
  const element = elementMeaning(profile);
  let contact: string;
  let decision: string;
  if (profile.dayPending) {
    contact = "日柱待核，暂不生成双向十神的靠近风格";
    decision = "日柱待核期间不按候选十神分配权限";
  } else {
    contact = `${godStyles[profile.aToB].contact}和${godStyles[profile.bToA].contact}都只是入口`;
    decision = `${godStyles[profile.aToB].decision}与${godStyles[profile.bToA].decision}都要进入制度`;
  }
  const guidance: Record<RelationshipType, string[]> = {
    partner: [
      `亲密需要：分别说明靠近与独处怎样才舒服；${contact}。`,
      `承诺方式：把重要承诺写成负责人、时间和变更通知；${relation}。`,
      `家庭节奏：共同核对家务、消费、陪伴与休息；${element}。`,
      `修复语言：依次说事实、影响、责任与补救，不催促对方立刻恢复原状。`,
    ],
    "parent-child": [
      `规则解释：照顾者说明规则保护什么、何时结束和怎样求助，不用命盘给孩子定性。`,
      `选择范围：安全底线由成年人负责，成长事项提供与年龄相称的有限选择。`,
      `天赋支持：把${element}翻译成可尝试的环境与练习，不把差异写成固定能力标签。`,
      `期待边界：期待写成阶段步骤和复盘点，孩子可以表达困难，成年人负责调整方法。`,
    ],
    business: [
      `权限：按事项列主责、双签、否决和临时授权；${decision}。`,
      `投资门槛：任何新增投入先写金额上限、审批人、回款假设和禁止追加的条件。`,
      `现金流：固定周期公开余额、应收、支出和最坏缺口，不以乐观叙事替代数据。`,
      `风险止损：触及现金流、安全、合规或交付红线时暂停新增承诺，并在限定时间内复核。`,
      `退出与交接：预先约定通知期、债务与客户处理、数据权限、文件清单和责任移交。`,
    ],
    friend: [
      `陪伴方式：说清更适合共同活动、安静在场还是阶段性深谈，不用频率证明关系。`,
      `请求明确：说明事情、需要、期限和对方可以拒绝的入口，避免用试探代替提问。`,
      `边界：金钱、隐私、人脉和情绪劳动都先征得同意，帮忙不自动续期。`,
      `联系与修复：人生阶段改变后重新商量联系节奏；发生误会或失联时，先核对具体事件和影响，再各自说明需要，最后商量补救或下一次联系，不催促关系立刻恢复原状。`,
    ],
  };
  return guidance[relationship];
}

function summaryFor(relationship: RelationshipType, profile: EvidenceProfile) {
  const dayEvidence = profile.dayPending
    ? "至少一方日柱待核，暂不生成双向十神、日支关系或相应互动风格"
    : `双向十神显示，A对B以${profile.aToB}进入互动，B对A以${profile.bToA}回应`;
  return `${roleFrame[relationship]}。${dayEvidence}；${relationMeaning(profile)}。${elementMeaning(profile)}。这份手册不判断关系成败，而把九个维度拆成可以观察、协商、复盘和修复的具体入口。`;
}

function limitationsFor(relationship: RelationshipType, profile: EvidenceProfile) {
  const limitations = [
    "合盘不输出单一分数，也不判断关系成败或预测分合。",
    "命盘只提供观察语言，不用于控制他人；关系质量仍以真实互动、当事人意愿与人身安全为准。",
  ];
  if (profile.dayPending) limitations.push("至少一方日柱待核，未计算或输出候选日干十神、候选日支关系及相应互动风格。");
  if (profile.uncertain) limitations.push("至少一方出生时间约略或未知，已排除时柱等不稳定证据，相关内容置信有限。 ");
  if (profile.boundaryCandidate) limitations.push("至少一方处于交节日且未知时辰，年柱或月柱仅是候选，本手册不使用交节候选作关系结论。");
  if (relationship === "business") limitations.push("商业部分只用于权限、现金流、止损与退出治理讨论，不构成投资建议、金融建议或收益判断。");
  return limitations;
}

export function calculateCompatibility(
  first: FourPillarsResult,
  second: FourPillarsResult,
  relationship: RelationshipType,
): CompatibilityResult {
  const profile = buildProfile(first, second);
  let tenGodDynamics: CompatibilityResult["tenGodDynamics"];
  if (profile.dayPending) {
    tenGodDynamics = [];
  } else {
    tenGodDynamics = [
      { direction: "A→B", basis: `A日干${first.pillars.day.stem}相对B日干${second.pillars.day.stem}`, theme: profile.aToB, observation: `以${profile.aToB}观察A对B的作用方式，不作价值排序或关系结果预测。` },
      { direction: "B→A", basis: `B日干${second.pillars.day.stem}相对A日干${first.pillars.day.stem}`, theme: profile.bToA, observation: `以${profile.bToA}观察B对A的作用方式，不作价值排序或关系结果预测。` },
    ];
  }
  return {
    relationship,
    summary: summaryFor(relationship, profile),
    axes: buildAxes(relationship, profile),
    roleSpecificGuidance: roleGuidance(relationship, profile),
    elementDynamics: profile.elementDynamics,
    tenGodDynamics,
    combinationsAndClashes: profile.crossRelations,
    communicationScenario: scenarios[relationship],
    actionRules: actionRulesByRole[relationship],
    limitations: limitationsFor(relationship, profile),
  };
}
