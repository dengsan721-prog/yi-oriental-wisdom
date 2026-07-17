import { branchElements } from "./stems-branches";
import type { ElementName, FourPillarsResult, TenGodName } from "./types";

export type ZodiacMirror = {
  zodiac: string;
  branch: string;
  element: string;
  yinYang: string;
  culturalSource: string;
  firstImpression: string;
  trustStyle: string;
  strengthPattern: string;
  pressurePattern: string;
  workScene: string;
  relationshipScene: string;
  familyScene: string;
  chartAgreement: string;
  chartDifference: string;
  immediateAction: string;
  longTermPractice: string;
  caution: string;
  sources: string[];
  confidence: "high" | "limited";
  yearAmbiguous: boolean;
  monthAmbiguous: boolean;
};

type ZodiacContent = Omit<ZodiacMirror, "branch" | "element" | "yinYang" | "chartAgreement" | "chartDifference" | "sources" | "confidence" | "yearAmbiguous" | "monthAmbiguous">;

const content: Record<string, ZodiacContent> = {
  子: {
    zodiac: "鼠",
    culturalSource: "子鼠来自十二地支配十二动物的计时传统，民俗常借鼠的夜间感知与寻路能力表达机敏观察。",
    firstImpression: "先听清环境，再从细节里找到入口",
    trustStyle: "信任通常从小范围交换信息开始，确认对方守约后才逐步增加投入。",
    strengthPattern: "顺境里擅长发现被忽略的线索，把零散资源接成一条可行路径。",
    pressurePattern: "压力下容易反复收集信息、推迟表态，或把谨慎变成过度设防。",
    workScene: "项目资料不全又需要快速启动时，你可能先找关键缺口、试一条小路径，再决定是否扩大投入。",
    relationshipScene: "关系刚建立时，你更重视对方是否持续回应细节；若缺少确认，容易把沉默理解成风险。",
    familyScene: "家庭安排变化时，你常先补齐时间、预算和联络信息，让每个人知道下一步从哪里开始。",
    immediateAction: "把当前最不确定的问题写成一条可验证假设，今天只完成一次低成本求证。",
    longTermPractice: "每周复盘一次哪些信息真正改变了决定，逐步减少只增加焦虑、却不改变行动的收集。",
    caution: "这是子鼠的年支文化镜像，不是完整人格结论，也不替代现实经历。",
  },
  丑: {
    zodiac: "牛",
    culturalSource: "丑牛在农耕文化里连接土地、节律与长期劳作，生肖叙事因而常用它表达稳定推进和耐力。",
    firstImpression: "把复杂任务落到可重复的日常步骤",
    trustStyle: "更看重长期兑现、责任是否持续，而不是一次热情或漂亮承诺。",
    strengthPattern: "顺境里能守住节奏，把需要耐心的事情一点点积累成可靠成果。",
    pressurePattern: "压力下可能继续硬撑，不愿临时换路，直到身体和协作都出现明显负荷。",
    workScene: "面对周期长、短期看不到成果的任务时，你往往愿意建立流程并持续交付，让进度逐渐可见。",
    relationshipScene: "你常用实际照顾表达在意，但若双方没有说明需要，付出可能被误读成理所当然。",
    familyScene: "家庭需要稳定运行时，你容易主动接住固定责任，也需要避免把所有可靠都等同于亲自承担。",
    immediateAction: "为本周最重的一项责任设定完成标准和停止时间，同时明确一件可以请人协作的部分。",
    longTermPractice: "每月检查一次坚持是否仍服务目标；保留有效习惯，也允许证据支持下的调整与休息。",
    caution: "丑牛只是一种传统文化镜像，不等于你必须沉默承担或永远不能改变方向。",
  },
  寅: {
    zodiac: "虎",
    culturalSource: "寅虎在传统图像中常与山林、勇气和护卫相连，生肖文化借此表达主动开局与守护边界。",
    firstImpression: "先站出来定方向，再带动周围行动",
    trustStyle: "信任来自对方在关键时刻是否坦诚、是否愿意共同承担，而非表面顺从。",
    strengthPattern: "顺境里敢于开局、保护团队目标，并在不确定中给出明确的第一步。",
    pressurePattern: "压力下可能把速度当成唯一答案，语气变硬，忽略他人需要理解和准备的时间。",
    workScene: "团队犹豫、窗口期很短时，你可能率先提出方向和分工，帮助大家从讨论进入行动。",
    relationshipScene: "遇到重要分歧时，你倾向直接保护核心立场；若先问清对方顾虑，力量更容易被接住。",
    familyScene: "家人需要支持时，你常先解决外部问题，但也要给对方选择帮助方式的空间。",
    immediateAction: "在下一次需要拍板前，先用一句话说明目标，再邀请一位相关者指出最大的反证。",
    longTermPractice: "建立行动前的短暂停顿：确认权限、风险和协作者，让果断与可持续协作同时存在。",
    caution: "寅虎文化镜像不是攻击性或领导力认证，现实中的勇气也包括倾听和修正。",
  },
  卯: {
    zodiac: "兔",
    culturalSource: "卯兔常与晨光、敏锐和温和形象相连，传统生肖表达更多是民俗象征而非固定性格分类。",
    firstImpression: "先感受关系温度，再寻找双方都能进入的表达",
    trustStyle: "更容易通过稳定语气、尊重边界和细致回应建立安全感。",
    strengthPattern: "顺境里善于感知氛围、调整沟通分寸，让不同意见保留继续对话的空间。",
    pressurePattern: "压力下可能为了避免冲突而延后真实表达，随后在细节里持续消耗。",
    workScene: "需要协调多个立场时，你往往先观察语气和关系，再用较柔和的方式推进共同决定。",
    relationshipScene: "你重视被理解和不被逼迫；若总等对方猜到需求，温和也可能变成信息缺失。",
    familyScene: "家庭气氛紧张时，你常主动缓和现场，但不必独自负责所有人的情绪稳定。",
    immediateAction: "选择一个正在回避的小分歧，用事实、感受、请求三句话在今天清楚表达一次。",
    longTermPractice: "每周练习一次温和而明确的拒绝，记录对方真实反应，校正对冲突后果的想象。",
    caution: "卯兔是年支文化镜像，不等于软弱、讨好或某一种关系命运。",
  },
  辰: {
    zodiac: "龙",
    culturalSource: "辰龙是十二生肖中富含神话与礼仪象征的形象，常承载整合变化、公共愿景和文化想象。",
    firstImpression: "把分散力量组织成一个更大的愿景",
    trustStyle: "容易被有格局又能落地的人吸引，信任需要愿景、能力与兑现三者一致。",
    strengthPattern: "顺境里能跨越局部限制，把多方资源围绕共同方向重新组合。",
    pressurePattern: "压力下可能追求宏大叙事，却跳过具体限制，或因现实进度不及期待而失望。",
    workScene: "跨部门项目缺少共同语言时，你可能先提出整体图景，再把不同团队放进同一张路线图。",
    relationshipScene: "你重视共同成长和精神空间，但宏观期待仍需落成具体时间、责任与相处方式。",
    familyScene: "家庭讨论长期方向时，你常想整合每个人的愿望，需要同时承认资源和阶段限制。",
    immediateAction: "把一个宏大目标缩成未来十四天可交付的成果，并写清负责人、资源和验收方式。",
    longTermPractice: "每季度用事实检查愿景与现实的距离，保留方向感，同时及时删减不再成立的假设。",
    caution: "辰龙的象征性很强，但文化镜像不等于特殊身份、天赋保证或人生等级。",
  },
  巳: {
    zodiac: "蛇",
    culturalSource: "巳蛇在传统叙事里常连接蜕变、潜行和观察，生肖文化用它表达审慎判断与阶段更新。",
    firstImpression: "先看清结构和动机，再选择准确出手的时点",
    trustStyle: "信任来自信息是否一致、对方能否尊重隐私，以及复杂处是否仍愿意说真话。",
    strengthPattern: "顺境里擅长深入研究、辨认变化信号，并在合适时机更新旧方法。",
    pressurePattern: "压力下可能过度推演动机，把不确定留在心里，导致沟通越来越间接。",
    workScene: "面对信息复杂、不能草率表态的议题时，你往往先梳理因果与风险，再给出精确建议。",
    relationshipScene: "你需要深度和可信度；若只测试对方却不说明规则，双方容易陷入彼此猜测。",
    familyScene: "家庭旧模式需要改变时，你能察觉细微变化，但最好把观察转成可讨论的事实。",
    immediateAction: "把一个反复猜测的问题改写成可直接询问的句子，并约定何时得到明确答复。",
    longTermPractice: "建立研究与决定的截止线：信息达到预设标准后先行动，再用反馈继续修正。",
    caution: "巳蛇只是传统文化镜像，不是城府、危险或神秘能力的判断。",
  },
  午: {
    zodiac: "马",
    culturalSource: "午马在交通、征行和生活图像中常代表移动与开阔，生肖民俗因而强调行动、连接和自由感。",
    firstImpression: "通过行动获得方向，在移动中扩大可能",
    trustStyle: "信任需要彼此给空间、说到做到，并能共同经历真实任务而非只停在语言。",
    strengthPattern: "顺境里启动快、感染力强，能把想法带到现场并迅速获得反馈。",
    pressurePattern: "压力下可能不断增加行程和目标，用忙碌回避停下来判断真正优先级。",
    workScene: "需要打开市场、推进外部合作或快速试验时，你往往愿意先到现场，边行动边校准。",
    relationshipScene: "你重视共同体验和自主空间；若节奏变化太快，对方可能来不及理解你的方向。",
    familyScene: "家庭生活停滞时，你常用一次出行或新安排恢复活力，也需要保留稳定的日常连接。",
    immediateAction: "从并行目标中只保留一个本周主线，取消一项低价值行程，为复盘留出完整时段。",
    longTermPractice: "每月区分探索、交付和恢复三种日程，让自由不再依赖持续加速。",
    caution: "午马文化镜像不等于坐不住或不适合承诺，行动风格仍需由现实验证。",
  },
  未: {
    zodiac: "羊",
    culturalSource: "未羊在礼俗和艺术中常与群体、温润及照料相连，生肖叙事借它表达协同与关系维护。",
    firstImpression: "先让群体有安全感，再推动细致协作",
    trustStyle: "信任从尊重、稳定回应和彼此照顾中累积，对冷硬命令较为敏感。",
    strengthPattern: "顺境里能照顾关系细节，把分散成员连接成愿意合作的共同体。",
    pressurePattern: "压力下可能顾及所有人而忽略自己，或因不愿让人失望而承担过量责任。",
    workScene: "团队成员状态不一时，你常先照顾沟通和参与感，再把任务重新分配到合适位置。",
    relationshipScene: "你愿意体谅差异，但真正的亲近也需要表达自己的限制，而不是持续迁就。",
    familyScene: "家中多人需要协调时，你往往成为联络和缓冲者，需要防止责任长期集中。",
    immediateAction: "列出本周正在替别人承担的三件事，选择一件归还责任并说明可提供的帮助边界。",
    longTermPractice: "建立互惠记录：照顾他人的同时，也固定提出具体请求，让支持形成双向循环。",
    caution: "未羊是文化镜像，不等于顺从、依赖或必须承担照顾者角色。",
  },
  申: {
    zodiac: "猴",
    culturalSource: "申猴在民间故事中常呈现学习、变通和工具使用，生肖文化由此延伸出机巧与试验精神。",
    firstImpression: "快速理解规则，再找到更灵活的解法",
    trustStyle: "信任来自对方思路开放、能接住变化，也愿意在玩笑之外认真兑现约定。",
    strengthPattern: "顺境里学习快、组合能力强，能用新工具把旧问题变得更容易处理。",
    pressurePattern: "压力下可能频繁换方案、用机智绕过难点，却没有完成必要的深度投入。",
    workScene: "遇到流程低效或工具老旧时，你往往能迅速试出替代方案，并把复杂步骤简化。",
    relationshipScene: "轻松互动能快速拉近距离，但重要议题仍需要放下玩笑，确认真实感受和承诺。",
    familyScene: "家庭出现突发安排时，你常能临场变通；长期规则则需要稳定记录而非只靠反应。",
    immediateAction: "为正在尝试的新方法设一个完成定义，今天停止继续换工具，先交付可验证版本。",
    longTermPractice: "每季度选一项能力做深度训练，用连续作品而不是新鲜感判断是否真正掌握。",
    caution: "申猴文化镜像不等于投机或聪明等级，灵活也需要责任和长期练习。",
  },
  酉: {
    zodiac: "鸡",
    culturalSource: "酉鸡与报晓、时序和日常秩序紧密相连，生肖文化常借此表达准时、辨识与公开呈现。",
    firstImpression: "把标准说清楚，让成果在正确时间被看见",
    trustStyle: "信任依赖信息透明、时间明确和质量可检查，对含糊承诺较难安心。",
    strengthPattern: "顺境里能发现差错、建立标准，并把成果整理成别人容易理解的形式。",
    pressurePattern: "压力下可能把标准推到过细，持续纠错，让自己和协作者都感到紧绷。",
    workScene: "交付临近、信息混乱时，你往往会重新核对版本、格式和时间，把成果整理到可验收状态。",
    relationshipScene: "你重视说清和守时；若表达只剩纠正，对方可能听不到背后的在意与期待。",
    familyScene: "家庭日程和规则需要建立时，你常能让分工更明确，也要给偶发变化留出余量。",
    immediateAction: "为当前交付写出三个真正影响结果的标准，把其余细节移到下一轮优化清单。",
    longTermPractice: "练习在指出问题时同时说明目标、已有进展和下一步，让准确与合作感并存。",
    caution: "酉鸡是年支文化镜像，不等于挑剔、虚荣或某种固定社交评价。",
  },
  戌: {
    zodiac: "狗",
    culturalSource: "戌狗在生活与民俗中常象征守护、陪伴和界限，生肖叙事因此重视忠诚、责任与公平。",
    firstImpression: "先确认原则和责任，再坚定守住共同约定",
    trustStyle: "信任建立在忠实履约、立场一致和困难时不回避，对背离承诺尤其敏感。",
    strengthPattern: "顺境里可靠、有守护意识，能在混乱中维护团队规则与弱小者的空间。",
    pressurePattern: "压力下可能过度警觉，先判断谁对谁错，难以及时看见环境已经变化。",
    workScene: "团队责任模糊或质量底线受挑战时，你常愿意站出来说明原则并推动问题被负责到底。",
    relationshipScene: "你看重忠诚和一致行动；遇到变化时，先确认事实比迅速判断立场更有帮助。",
    familyScene: "家人需要依靠时，你常成为稳定支点，也要避免把保护转成替别人作决定。",
    immediateAction: "挑选一个正在坚持的原则，写清它保护什么、成本是什么，以及什么证据会支持调整。",
    longTermPractice: "每月进行一次边界复盘，区分真正责任、情感支持和不属于自己的决定。",
    caution: "戌狗文化镜像不是道德评分，也不等于所有关系都必须以牺牲维持。",
  },
  亥: {
    zodiac: "猪",
    culturalSource: "亥猪在民俗中连接丰足、休养与朴实生活，生肖文化常用它表达接纳、恢复和现实享受。",
    firstImpression: "让资源真正服务生活，而不是只停在占有",
    trustStyle: "信任来自相处是否自然、需求能否坦诚，以及对方是否尊重基本舒适与尊严。",
    strengthPattern: "顺境里包容度高、能承接他人，也懂得把成果转成可持续的生活质量。",
    pressurePattern: "压力下可能用舒适和拖延暂时回避难题，或因不愿计较而让边界逐渐模糊。",
    workScene: "团队长期高压后，你常能察觉恢复和资源补给的重要性，推动节奏回到可持续状态。",
    relationshipScene: "你重视真实、松弛和相互接纳；重要分歧仍需明确谈清，不能只靠时间自然过去。",
    familyScene: "家庭需要照顾生活品质时，你往往关注饮食、休息和团聚，也要平衡预算与个人空间。",
    immediateAction: "找出一个正在用拖延换短暂轻松的问题，今天完成最小步骤，并安排真正的休息。",
    longTermPractice: "建立享受与责任并行的节奏：完成关键承诺后有意识恢复，不让补偿性放松替代处理。",
    caution: "亥猪是传统文化镜像，不等于懒散、财富水平或固定生活方式。",
  },
};

const yangBranches = new Set(["子", "寅", "辰", "午", "申", "戌"]);
const sourceIds = ["culture.zodiac-national-museum", "classic.san-ming-tong-hui", "classic.di-tian-sui"];

function monthCommand(chart: FourPillarsResult): TenGodName | "待核" {
  return chart.professional.tenGods.find(item => item.pillar === "month" && item.position === "branch" && item.hiddenStemIndex === 0)?.tenGod
    ?? chart.professional.tenGods.find(item => item.pillar === "month" && item.position === "branch")?.tenGod
    ?? "待核";
}

function elementInteraction(yearElement: ElementName, dayElement: ElementName): string {
  if (yearElement === dayElement) return "同类元素使年支镜像与日主表达更容易彼此呼应";
  const produces: Record<ElementName, ElementName> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  if (produces[yearElement] === dayElement) return "年支元素对日主有传统生助关系，可观察外部经验如何提供支持";
  if (produces[dayElement] === yearElement) return "日主向年支元素输出，可观察自我投入是否得到现实反馈";
  return "年支与日主存在传统制衡关系，更适合把差异转成边界和反馈问题";
}

function commandLens(command: TenGodName | "待核"): { agreement: string; calibration: string } {
  const lenses: Record<TenGodName | "待核", { agreement: string; calibration: string }> = {
    比肩: { agreement: "月令主题会把观察落到自主选择和同伴协作，生肖优势要通过清楚分工才容易稳定呈现", calibration: "若只强调自己的节奏，主盘所需的同伴反馈会不足；校准点是先说边界，再确认共同目标" },
    劫财: { agreement: "月令主题会放大资源共享与竞争边界，生肖行动力需要在权责清楚后使用", calibration: "若热情先于规则，资源与责任容易混在一起；校准点是先写归属、上限和退出条件" },
    食神: { agreement: "月令主题偏向稳定表达、作品体验和持续产出，生肖特点宜先转成小规模可感知成果", calibration: "若只停在舒适表达，关键决定可能被延后；校准点是为交付和决定分别设截止时间" },
    伤官: { agreement: "月令主题偏向观点突破、问题发现与重新表达，生肖镜像可用于寻找更有效的公开接口", calibration: "若表达强度超过证据，合作方可能只听见反驳；校准点是同时给出问题、依据和替代方案" },
    偏财: { agreement: "月令主题把注意力带向流动资源、外部机会和快速交换，生肖优势要接受投入产出检验", calibration: "若机会数量替代了优先级，主盘会出现承诺分散；校准点是给试验设预算上限和复盘日期" },
    正财: { agreement: "月令主题重视稳定资源、现实承诺和可持续兑现，生肖特点需要落到清晰的时间与成本", calibration: "若只顾完成眼前责任，长期弹性会下降；校准点是同时保留基本盘、试验额和停止条件" },
    七杀: { agreement: "月令主题把规则压力、硬期限和风险边界推到前台，生肖行动必须先确认权限与停止条件", calibration: "若在压力下直接放大生肖惯性，容易把速度当成安全；校准点是先拆风险、求助对象和最小步骤" },
    正官: { agreement: "月令主题重视职责、秩序和可被检验的公共标准，生肖优势需要通过角色与流程承接", calibration: "若只追求符合规则，真实问题可能被形式遮住；校准点是同时核对制度要求与任务目的" },
    偏印: { agreement: "月令主题偏向非标准学习、独立研究和经验重组，生肖镜像可作为提出新假设的入口", calibration: "若长期停留在内部推演，现实反馈会不足；校准点是把一个判断转成可被反证的小试验" },
    正印: { agreement: "月令主题重视系统学习、支持输入和恢复基础，生肖优势要先获得足够资料与稳定补给", calibration: "若持续准备却迟迟不交付，支持会变成停滞；校准点是规定学习结束点并输出一个可检查成果" },
    待核: { agreement: "月令坐标仍待核，只能保留生肖与日主的初步对照，不把当前月令候选写成确定主题", calibration: "校准点是补充可靠出生时刻；在此之前以已知主盘和现实经历为先，不扩写月令结论" },
  };
  return lenses[command];
}

export function buildZodiacMirror(chart: FourPillarsResult): ZodiacMirror {
  const branch = chart.pillars.year.branch;
  const record = content[branch];
  if (!record) throw new Error(`Unsupported zodiac branch: ${branch}`);
  const element = branchElements[branch];
  const dayMaster = chart.professional.dayMaster;
  const monthBranch = chart.pillars.month.branch;
  const command = monthCommand(chart);
  const interaction = elementInteraction(element, dayMaster.element);
  const yearAmbiguous = chart.ambiguousPillars.includes("year");
  const monthAmbiguous = chart.ambiguousPillars.includes("month");
  const lens = commandLens(monthAmbiguous ? "待核" : command);
  const yearBasis = yearAmbiguous ? `年柱待核，当前代表候选年支${branch}属${element}` : `年支${branch}属${element}`;
  const monthBasis = monthAmbiguous ? `月令代表候选为月支${monthBranch}、本气十神${command}` : `月支${monthBranch}本气十神为${command}`;
  return {
    ...record,
    branch,
    element,
    yinYang: yangBranches.has(branch) ? "阳" : "阴",
    chartAgreement: `与八字主盘相互印证：${yearBasis}，日主${dayMaster.stem}${dayMaster.element}，${monthBasis}。${interaction}；${lens.agreement}。`,
    chartDifference: `主盘差异提醒：生肖只读取${yearAmbiguous ? "年柱代表候选" : "年支"}${branch}属${element}这一层，主盘还包含日主${dayMaster.stem}${dayMaster.element}、${monthAmbiguous ? "待核的月支候选" : "月支"}${monthBranch}${command}及其余干支。${lens.calibration}；若与现实经历冲突，以完整主盘和可观察事实为先。`,
    sources: sourceIds,
    confidence: yearAmbiguous || monthAmbiguous ? "limited" : "high",
    yearAmbiguous,
    monthAmbiguous,
  };
}
