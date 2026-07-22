import type { BirthInput, FourPillarsResult } from "./types";
import type { UserFaceSide } from "./atlas-orientation";
import type { ZodiacSign } from "./constellations";
import { getTraditionalContent } from "./traditional-content";
import { getZodiacProfile } from "./zodiac-profiles";

export type AtlasMethodId = "face" | "mole" | "palm" | "star";

export type ReferenceGender = "male" | "female";

export type AtlasVisual = {
  image: string;
  imageAspect: number;
  visualFocus?: { x: number; y: number; width: number; height: number };
  hotspot?: { x: number; y: number };
  view?: "front" | "user-left" | "user-right";
  mirrored: boolean;
};

export type AtlasOption = {
  id: string;
  title: string;
  visual?: AtlasVisual;
  visuals?: Partial<Record<ReferenceGender, AtlasVisual>>;
  userSide?: UserFaceSide;
  landmark?: string;
  professionalResult: string;
  traditionalBasis: string;
  plainLanguage: string;
  lifeScene: string;
  strengthAndPitfall: string;
  action: string;
  chartComparison: string;
  caution: string;
  sourceIds: string[];
};

export type AtlasGroup = { title: string; options: AtlasOption[] };
export type AtlasMethod = { id: AtlasMethodId; label: string; subtitle: string };
export type AtlasReading = {
  id: string;
  title: string;
  professionalResult: string;
  caution: string;
  sourceIds: string[];
  layers: { label: string; text: string }[];
};

type Seed = {
  id: string;
  title: string;
  signal: string;
  plain: string;
  scene: string;
  strength: string;
  pitfall: string;
  action: string;
  crop?: string;
  hotspot?: { x: number; y: number };
  userSide?: UserFaceSide;
  landmark?: string;
};

const METHODS: AtlasMethod[] = [
  { id: "face", label: "相面", subtitle: "面型与五官标准参考" },
  { id: "mole", label: "面痣", subtitle: "十二区域位置自查" },
  { id: "palm", label: "手纹", subtitle: "手型与主线图谱" },
  { id: "star", label: "星座", subtitle: "十二太阳星座辅助镜像" },
];

const faceSeeds: Seed[] = [
  { id:"face-oval", title:"椭圆面型", signal:"轮廓纵横比例柔和、下颌收束", plain:"更容易在变化中寻找平衡，不急于把立场推到极端", scene:"团队讨论出现两种方案时，先整理共同目标，再给出折中路径", strength:"兼顾与调和", pitfall:"为了维持和气而延迟明确选择", action:"给每次协调设一个决策时点", crop:"8% 50%" },
  { id:"face-round", title:"圆面型", signal:"面部长宽接近、轮廓转折圆润", plain:"更关注关系温度和共同参与感，通常先让环境变得可接近", scene:"新成员加入时，主动解释规则并照顾对方的进入节奏", strength:"亲和与连接", pitfall:"把照顾他人变成额外责任", action:"帮助前先确认范围与结束时间", crop:"29% 50%" },
  { id:"face-square", title:"方正面型", signal:"下颌与额部线条清晰、轮廓转折明确", plain:"遇事倾向先定边界与标准，再把任务推到可以交付", scene:"项目模糊时，会主动列清责任、节点和验收条件", strength:"稳定推进与承担", pitfall:"标准过硬时让协作缺少回旋", action:"把底线标准与可协商项分开写", crop:"50% 50%" },
  { id:"face-long", title:"长面型", signal:"纵向比例较长、视觉重心上下延展", plain:"更愿意拉长时间尺度思考，先理解来龙去脉再投入", scene:"面对复杂课题时先建立资料框架，再逐步形成判断", strength:"耐心研究与长线规划", pitfall:"准备过久而错过试验窗口", action:"研究到七成时先做一个小样", crop:"71% 50%" },
  { id:"face-heart", title:"心形面型", signal:"额部较开、下颌向下收尖", plain:"容易从想法和可能性出发，希望把个人表达做出辨识度", scene:"策划内容时先提出一个鲜明概念，再寻找适合的呈现方式", strength:"创意表达与主动发起", pitfall:"开头很亮但后续维护不足", action:"每个新想法同时绑定一个收尾动作", crop:"92% 50%" },
  { id:"face-brow-straight", title:"平直眉型", signal:"眉势横向舒展、起伏相对克制", plain:"处理信息时偏向直接拆解，愿意用清楚规则降低误会", scene:"收到含糊需求时，会先追问范围、优先级和交付口径", strength:"逻辑清楚与沟通直接", pitfall:"只讲结论时忽略他人的接受节奏", action:"表达结论后补一句理由和影响", crop:"50% 28%" },
  { id:"face-brow-arched", title:"弧形眉型", signal:"眉峰有起伏、线条形成柔和弧度", plain:"更容易捕捉场景气氛，并根据对象调整表达方式", scene:"同一意见对不同伙伴使用不同例子，让信息更容易被理解", strength:"情境感知与表达弹性", pitfall:"过度适应造成真实意见不清", action:"先写下自己的原始判断再沟通", crop:"50% 28%" },
  { id:"face-eye-open", title:"眼神开阔型", signal:"睑裂开度自然、目光接触稳定", plain:"愿意把注意力放在外部反馈上，通常通过互动形成判断", scene:"会议中会观察回应并及时调整说明顺序", strength:"开放接收与现场反应", pitfall:"反馈太多时容易被他人节奏牵引", action:"重要决定保留一次独立复盘", crop:"50% 38%" },
  { id:"face-nose-defined", title:"鼻部轮廓清晰型", signal:"鼻梁与鼻翼边界清楚、面中支撑明确", plain:"做事较重视资源、成本和可持续性，倾向先看承载条件", scene:"接新项目时会核对预算、人手、时间和维护成本", strength:"资源意识与现实评估", pitfall:"条件不完整时迟迟不启动", action:"区分必要条件与可边做边补条件", crop:"50% 52%" },
  { id:"face-mouth-balanced", title:"口唇比例均衡型", signal:"上下唇比例协调、口角线条平稳", plain:"表达时较看重来回回应，希望观点既被说清也被接住", scene:"关系有分歧时愿意复述对方意思，再说明自己的需要", strength:"双向沟通与关系修复", pitfall:"反复确认让问题迟迟不能落地", action:"每次沟通以一个明确约定收尾", crop:"50% 68%" },
];

const moleSeeds: Seed[] = [
  { id:"mole-forehead-center", title:"额中区域", signal:"额部中央的可见标记", plain:"传统多把这里联想到早期规划与公开目标，可拿来观察自己如何面对期待", scene:"新阶段开始时先想清方向，却可能给自己设下过高起点", strength:"目标感与前瞻", pitfall:"把计划当成必须一次实现的承诺", action:"把年度目标拆成三个月验证", hotspot:{x:50,y:19}, userSide:"center", landmark:"额部正中，发际线与眉间之间" },
  { id:"mole-temple-left", title:"左侧太阳穴", signal:"左侧鬓角前方的可见标记", plain:"传统常以迁移与外部环境取象，可用来回看你如何适应陌生场域", scene:"更换团队或城市时，先观察人际规则再决定投入方式", strength:"环境扫描与适应", pitfall:"等待完全看懂才行动", action:"进入新环境七天内完成一次小连接", hotspot:{x:36,y:28}, userSide:"left", landmark:"对应侧眉尾外上方与发际线之间" },
  { id:"mole-temple-right", title:"右侧太阳穴", signal:"右侧鬓角前方的可见标记", plain:"传统常把此区与外部往来联系，可观察出行、跨界与切换节奏", scene:"同时处理本地事务和外部合作时，容易在切换中消耗注意力", strength:"跨场景连接", pitfall:"行程和承诺排得过密", action:"给每次切换预留十五分钟缓冲", hotspot:{x:64,y:28}, userSide:"right", landmark:"对应侧眉尾外上方与发际线之间" },
  { id:"mole-brow", title:"眉间眉内区域", signal:"眉部或两眉之间的可见标记", plain:"传统把眉部视为同伴与计划接口，可用于观察合作中的判断方式", scene:"伙伴意见不同的时候，容易先从规则与可信度评估对方", strength:"识别合作质量", pitfall:"过早形成固定印象", action:"判断前主动寻找一条反证", hotspot:{x:45,y:34}, userSide:"center", landmark:"两眉之间至眉体内侧" },
  { id:"mole-eye-lower", title:"眼下区域", signal:"下眼睑至颧上之间的可见标记", plain:"传统多用情感与照料取象，可观察自己是否容易替他人承担情绪", scene:"家人状态低落时，会迅速进入安慰和处理问题的角色", strength:"共情与照顾", pitfall:"把陪伴误成必须解决", action:"先问对方需要倾听还是建议", hotspot:{x:56,y:41}, userSide:"right", landmark:"用户右眼下睑与颧骨上缘之间" },
  { id:"mole-nose", title:"鼻部区域", signal:"鼻梁、鼻头或鼻翼附近的可见标记", plain:"传统常以资源流动取象，可用来检查现实中的收支与承诺边界", scene:"面对机会时既关注收益，也担心资源被长期占用", strength:"资源敏感度", pitfall:"只看即时得失忽略长期价值", action:"用时间、现金和关系三栏评估机会", hotspot:{x:50,y:51}, userSide:"center", landmark:"鼻梁、鼻头与鼻翼区域" },
  { id:"mole-cheek-left", title:"左侧面颊", signal:"左侧颧面区域的可见标记", plain:"传统多把面颊与执行和影响力联系，可观察推动别人时的力度", scene:"项目遇阻时会主动协调，但有时把建议表达成了要求", strength:"推动与担当", pitfall:"用力过强让他人退后", action:"先问对方愿意承担哪一部分", hotspot:{x:38,y:52}, userSide:"left", landmark:"对应侧眼外下方至鼻翼外侧的颧面区" },
  { id:"mole-cheek-right", title:"右侧面颊", signal:"右侧颧面区域的可见标记", plain:"传统常从此区谈现实权责，可观察你如何拿捏表现与合作", scene:"成果要被看见时，既想负责又担心显得过于突出", strength:"责任感与呈现", pitfall:"在退让和强撑之间摆动", action:"提前约定署名、汇报和决策权", hotspot:{x:62,y:52}, userSide:"right", landmark:"对应侧眼外下方至鼻翼外侧的颧面区" },
  { id:"mole-philtrum", title:"人中区域", signal:"鼻下至上唇之间的可见标记", plain:"传统常借此谈延续与照料，本产品只用来观察长期责任的安排", scene:"面对家庭或长期项目时，容易把持续投入当成不能停下的任务", strength:"耐心与长期陪伴", pitfall:"责任没有交接机制", action:"为长期事项建立替补和休息规则", hotspot:{x:50,y:62}, userSide:"center", landmark:"鼻底与上唇之间的纵向沟" },
  { id:"mole-mouth-corner", title:"口角区域", signal:"嘴角左右附近的可见标记", plain:"传统多以言语与饮食取象，这里转译为表达习惯和日常边界观察", scene:"气氛紧张时可能用玩笑缓和，却让真实需要没有被听见", strength:"活化氛围与表达", pitfall:"绕开难说的话题", action:"玩笑之后补一句真实诉求", hotspot:{x:61,y:67}, userSide:"right", landmark:"用户右侧上下唇交界外缘" },
  { id:"mole-chin", title:"下巴中央", signal:"颏部中央的可见标记", plain:"传统常把下庭与晚段安顿联系，可观察你对稳定基地的需要", scene:"工作忙乱时会更想整理住处、流程或固定资源，让生活重新可控", strength:"安顿与收尾", pitfall:"把稳定误成拒绝变化", action:"保留一个稳定核心和一个试验空间", hotspot:{x:50,y:78}, userSide:"center", landmark:"下唇下方至下颌底缘的正中区域" },
  { id:"mole-jaw", title:"下颌侧区", signal:"下颌轮廓左右两侧的可见标记", plain:"传统以边界和承载取象，可观察你在压力下如何守住责任范围", scene:"别人临时加任务时，口头答应很快，事后才发现精力已经超载", strength:"承接与执行", pitfall:"责任边界说得太晚", action:"新增承诺前先说当前容量", hotspot:{x:66,y:74}, userSide:"right", landmark:"用户右侧嘴角外下方至下颌角之间" },
];

const palmSeeds: Seed[] = [
  { id:"palm-wood", title:"木型手", signal:"掌形偏长、指节修长的组合", plain:"传统把这种形态联想到成长与展开，可观察你是否靠持续学习建立路径", scene:"遇到新领域时会先搜集资料、建立术语表，再逐步形成方法", strength:"学习与发展", pitfall:"方向不断生长而缺少剪枝", action:"每月主动停止一项低价值投入", crop:"24% 50%" },
  { id:"palm-fire", title:"火型手", signal:"掌形偏长而手指相对紧凑的组合", plain:"传统以火的发动取象，可观察你如何把热情迅速变成行动", scene:"看到机会会马上组织人和资源，但后续节奏可能难以维持", strength:"启动与感染力", pitfall:"用爆发代替稳定机制", action:"启动当天同时安排复盘日", crop:"24% 50%" },
  { id:"palm-earth", title:"土型手", signal:"掌形宽厚、手指比例稳健的组合", plain:"传统以土的承载取象，可观察你对秩序、可靠与重复积累的偏好", scene:"复杂任务会被拆成清单并持续执行，团队常把稳定环节交给你", strength:"可靠与落地", pitfall:"重复有效做法而忽略环境变化", action:"每个周期留一次流程更新", crop:"50% 50%" },
  { id:"palm-metal", title:"金型手", signal:"掌指轮廓清楚、骨节边界较分明", plain:"传统以金的分辨取象，可观察你如何建立标准并筛选信息", scene:"审查方案时很快发现不一致之处，也容易把注意力都放在问题上", strength:"判断与质量控制", pitfall:"校正多于鼓励", action:"每提一个问题同时确认一个有效点", crop:"76% 50%" },
  { id:"palm-water", title:"水型手", signal:"掌指线条柔和、整体延展感较强", plain:"传统以水的流动取象，可观察你是否通过感受与连接适应变化", scene:"多人协作时能感知没有说出口的顾虑，并调整沟通顺序", strength:"弹性与感知", pitfall:"吸收过多情绪而失去自己的节奏", action:"会后写下事实、感受和责任三栏", crop:"76% 50%" },
  { id:"palm-life", title:"生命线参考", signal:"拇指根部外缘的弧形主线", plain:"传统用它讨论活力与生活基础；这里只观察作息、恢复和投入节奏", scene:"任务密集时仍持续推进，却在阶段结束后才意识到需要休息", strength:"持续投入与恢复意识", pitfall:"把线长短误当寿命结论", action:"用两周精力记录替代线纹吉凶判断", hotspot:{x:33,y:58}, crop:"24% 50%" },
  { id:"palm-head", title:"智慧线参考", signal:"掌心中部横向延伸的主线", plain:"传统借此谈思考方式；可用来观察你偏向分析、想象还是边做边学", scene:"面对陌生问题时，会在查资料和直接试验之间形成自己的顺序", strength:"形成问题解决路径", pitfall:"把某种线形固定成智力高低", action:"比较一次分析方案与一次小实验结果", hotspot:{x:33,y:49}, crop:"24% 50%" },
  { id:"palm-heart", title:"感情线参考", signal:"指根下方横向延伸的主线", plain:"传统用它谈情感表达；可观察你表达关心、界限和期待的方式", scene:"在意对方时会通过行动照顾，却不一定直接说出自己的需要", strength:"投入与关系感知", pitfall:"把线纹当成关系结果保证", action:"每周进行一次明确需要的沟通", hotspot:{x:34,y:38}, crop:"24% 50%" },
  { id:"palm-fate", title:"事业线参考", signal:"由掌根向掌心上方延伸的纵线", plain:"传统多与事业路径相联；这里转译为角色选择与长期投入的观察", scene:"职业变化时会寻找一条能持续积累的主线，而不只看短期职位", strength:"路径意识与投入", pitfall:"把线有无误读成事业成败", action:"用能力资产表记录每段经历留下什么", hotspot:{x:67,y:55}, crop:"76% 50%" },
  { id:"palm-sun", title:"太阳线参考", signal:"无名指下方可能出现的纵向细线", plain:"传统常与才华呈现联系；可观察作品如何被看见和获得反馈", scene:"认真完成内容却不主动展示，直到他人提醒才对外发布", strength:"作品意识与审美表达", pitfall:"把认可多少等同个人价值", action:"固定每月公开一个完成作品", hotspot:{x:72,y:42}, crop:"76% 50%" },
];

const starSeeds: Seed[] = [
  { id:"star-aries", title:"白羊座", signal:"太阳落在白羊座的现代占星分类", plain:"常被用来观察直接启动和率先尝试的倾向", scene:"机会出现时先行动再修正，团队因此快速有了第一版", strength:"勇于开始", pitfall:"速度超过信息和他人节奏", action:"行动前增加一次十分钟风险检查" },
  { id:"star-taurus", title:"金牛座", signal:"太阳落在金牛座的现代占星分类", plain:"常被用来观察稳定兑现和重视可靠条件的倾向", scene:"长期任务中愿意保持固定节拍，让成果逐渐积累", strength:"耐心与稳定", pitfall:"变化已经发生仍坚持旧方案", action:"为稳定流程设置定期更新点" },
  { id:"star-gemini", title:"双子座", signal:"太阳落在双子座的现代占星分类", plain:"常被用来观察多线表达和通过交流学习的倾向", scene:"会议中能快速连接不同观点，也容易同时打开太多议题", strength:"信息连接", pitfall:"结论分散和频繁切换", action:"每次交流只收束一个下一步" },
  { id:"star-cancer", title:"巨蟹座", signal:"太阳落在巨蟹座的现代占星分类", plain:"常被用来观察照顾关系和重视安全感的倾向", scene:"环境不确定时先照顾团队情绪，再尝试推进任务", strength:"情境感受与照料", pitfall:"把他人的情绪都变成自己的责任", action:"关心之前先确认责任归属" },
  { id:"star-leo", title:"狮子座", signal:"太阳落在狮子座的现代占星分类", plain:"常被用来观察可见表达和带动共同信心的倾向", scene:"需要公开呈现时愿意站到前面，让团队成果被看见", strength:"表现与鼓舞", pitfall:"回应不足时用力证明自己", action:"把注意力从评价移回作品标准" },
  { id:"star-virgo", title:"处女座", signal:"太阳落在处女座的现代占星分类", plain:"常被用来观察细节改进和通过服务创造价值的倾向", scene:"交付前会反复检查错误，让质量更稳定也增加了耗时", strength:"完善与校正", pitfall:"完成标准不断后移", action:"预先写清交付线和优化线" },
  { id:"star-libra", title:"天秤座", signal:"太阳落在天秤座的现代占星分类", plain:"常被用来观察平衡协商和寻找共同标准的倾向", scene:"两方冲突时能看见各自合理处，却可能延迟给出决定", strength:"协商与公平", pitfall:"把没有冲突当成真正共识", action:"给协商设置明确截止时间" },
  { id:"star-scorpio", title:"天蝎座", signal:"太阳落在天蝎座的现代占星分类", plain:"常被用来观察深度投入和逐级建立信任的倾向", scene:"重要合作前会认真验证可靠性，一旦投入就希望保持稳定", strength:"专注与深度", pitfall:"担心受伤而过度保留信息", action:"按风险等级逐步开放信息" },
  { id:"star-sagittarius", title:"射手座", signal:"太阳落在射手座的现代占星分类", plain:"常被用来观察意义扩展和通过探索保持动力的倾向", scene:"遇到瓶颈时会寻找更大视角或新的学习路线", strength:"探索与远景", pitfall:"新可能吸引走当前注意力", action:"探索前先完成现有阶段收尾" },
  { id:"star-capricorn", title:"摩羯座", signal:"太阳落在摩羯座的现代占星分类", plain:"常被用来观察目标建构和用责任维持长期路径的倾向", scene:"困难阶段仍按里程碑推进，却可能只报告进度不表达感受", strength:"责任与结构", pitfall:"把休息视为偏离目标", action:"把恢复时间纳入正式计划" },
  { id:"star-aquarius", title:"水瓶座", signal:"太阳落在水瓶座的现代占星分类", plain:"常被用来观察独立观点和以理念连接同伴的倾向", scene:"看见旧规则不合理时会提出新框架，希望从系统层解决", strength:"创新与系统视角", pitfall:"差异没有解释就显得疏离", action:"提出新方案时同步说明迁移路径" },
  { id:"star-pisces", title:"双鱼座", signal:"太阳落在双鱼座的现代占星分类", plain:"常被用来观察想象共情和感受多重可能的倾向", scene:"创作和陪伴时能进入细腻感受，也容易把边界放得太宽", strength:"想象与共情", pitfall:"混淆自己的需要与他人的需要", action:"分别写下事实、感受和责任" },
];

const faceVisualFocus: Record<string, NonNullable<AtlasVisual["visualFocus"]>> = {
  "face-oval": { x: 0, y: 0, width: 20, height: 100 },
  "face-round": { x: 20, y: 0, width: 20, height: 100 },
  "face-square": { x: 40, y: 0, width: 20, height: 100 },
  "face-long": { x: 60, y: 0, width: 20, height: 100 },
  "face-heart": { x: 80, y: 0, width: 20, height: 100 },
  "face-brow-straight": { x: 2, y: 32, width: 16, height: 11 },
  "face-brow-arched": { x: 22, y: 32, width: 16, height: 11 },
  "face-eye-open": { x: 42, y: 36, width: 16, height: 10 },
  "face-nose-defined": { x: 67, y: 39, width: 6, height: 25 },
  "face-mouth-balanced": { x: 86, y: 55, width: 8, height: 9 },
};

const palmShapeVisualFocus: Record<string, NonNullable<AtlasVisual["visualFocus"]>> = {
  "palm-wood": { x: 0, y: 0, width: 20, height: 100 },
  "palm-fire": { x: 20, y: 0, width: 20, height: 100 },
  "palm-earth": { x: 40, y: 0, width: 20, height: 100 },
  "palm-metal": { x: 60, y: 0, width: 20, height: 100 },
  "palm-water": { x: 80, y: 0, width: 20, height: 100 },
};

function getVisual(method: AtlasMethodId, seed: Seed): Pick<AtlasOption, "visual" | "visuals"> {
  if (method === "face") {
    const isFeature = seed.id.startsWith("face-brow") || seed.id === "face-eye-open"
      || seed.id === "face-nose-defined" || seed.id === "face-mouth-balanced";
    return {
      visuals: {
        male: {
          image: `reference/face-${isFeature ? "features" : "shapes"}-male.webp`,
          imageAspect: 5 / 2,
          visualFocus: faceVisualFocus[seed.id],
          view: "front",
          mirrored: true,
        },
        female: {
          image: `reference/face-${isFeature ? "features" : "shapes"}-female.webp`,
          imageAspect: 5 / 2,
          visualFocus: faceVisualFocus[seed.id],
          view: "front",
          mirrored: true,
        },
      },
    };
  }
  if (method === "mole") {
    const side = seed.id.endsWith("-left") ? "left" : seed.id.endsWith("-right") ? "right" : "front";
    const view = side === "left" ? "user-left" : side === "right" ? "user-right" : "front";
    return {
      visuals: {
        male: {
          image: `reference/mole-male-${side}.webp`,
          imageAspect: 1448 / 1086,
          hotspot: seed.hotspot,
          view,
          mirrored: true,
        },
        female: {
          image: `reference/mole-female-${side}.webp`,
          imageAspect: 1448 / 1086,
          hotspot: seed.hotspot,
          view,
          mirrored: true,
        },
      },
    };
  }
  if (method === "palm") {
    const isShape = seed.id.startsWith("palm-") && !seed.hotspot;
    return {
      visual: {
        image: isShape ? "reference/palm-shape-reference.webp" : "reference/palm-reference.webp",
        imageAspect: isShape ? 1778 / 885 : 1448 / 1086,
        ...(isShape ? { visualFocus: palmShapeVisualFocus[seed.id] } : { hotspot: seed.hotspot }),
        view: "front",
        mirrored: false,
      },
    };
  }
  return {};
}

function makeOption(method: AtlasMethodId, seed: Seed): AtlasOption {
  const isStar = method === "star";
  const visual = getVisual(method, seed);

  if (!isStar) {
    const content = getTraditionalContent(seed.id);
    return {
      id: seed.id,
      title: seed.title,
      ...visual,
      ...(method === "mole" ? { userSide: seed.userSide, landmark: seed.landmark } : {}),
      professionalResult: content.professionalResult,
      traditionalBasis: content.traditionalBasis,
      plainLanguage: content.plainLanguage,
      lifeScene: content.lifeScene,
      strengthAndPitfall: content.strengthAndPitfall,
      action: content.action,
      chartComparison: content.chartComparison,
      caution: content.caution,
      sourceIds: content.sourceIds,
    };
  }

  const profile = getZodiacProfile(seed.id.slice("star-".length) as ZodiacSign);
  return {
    id: seed.id,
    title: seed.title,
    ...visual,
    professionalResult: `元素：${profile.element}｜模式：${profile.modality}｜核心动力：${profile.coreDrive}`,
    traditionalBasis: `现代占星文化分类以元素和模式组织常见原型，天文学星座与占星表达并非同一概念。对外表现：${profile.outerStyle} 内在需要：${profile.innerNeed}`,
    plainLanguage: `白话理解｜常见误解：${profile.commonMisreading}`,
    lifeScene: `恋爱方式：${profile.loveStyle} 朋友关系：${profile.friendshipStyle} 工作状态：${profile.workStyle}`,
    strengthAndPitfall: `成熟版本：${profile.matureVersion} 压力反应：${profile.stressResponse}`,
    action: `成长方向：${profile.growthDirection}`,
    chartComparison: profile.chartComparison,
    caution: profile.caution,
    sourceIds: profile.sourceReferences,
  };
}

const GROUPS: Record<AtlasMethodId, AtlasGroup[]> = {
  face: [
    { title: "面型", options: faceSeeds.slice(0, 5).map((seed) => makeOption("face", seed)) },
    { title: "五官", options: faceSeeds.slice(5).map((seed) => makeOption("face", seed)) },
  ],
  mole: [{ title: "正面痣位", options: moleSeeds.map((seed) => makeOption("mole", seed)) }],
  palm: [
    { title: "手型", options: palmSeeds.slice(0, 5).map((seed) => makeOption("palm", seed)) },
    { title: "主线", options: palmSeeds.slice(5).map((seed) => makeOption("palm", seed)) },
  ],
  star: [{ title: "太阳星座", options: starSeeds.map((seed) => makeOption("star", seed)) }],
};

const optionIndex = Object.fromEntries(
  Object.values(GROUPS).flatMap((groups) => groups.flatMap((group) => group.options)).map((option) => [option.id, option]),
) as Record<string, AtlasOption>;

export function getAtlasMethods() {
  return METHODS;
}

export function getAtlasGroups(method: AtlasMethodId) {
  return GROUPS[method];
}

export function getAtlasOption(id: string) {
  return optionIndex[id];
}

export function resolveReferenceGender(
  birthGender: BirthInput["gender"],
  override?: ReferenceGender,
): ReferenceGender {
  if (birthGender === "male" || birthGender === "female") return birthGender;
  return override ?? "female";
}

export function resolveAtlasVisual(option: AtlasOption, gender: ReferenceGender): AtlasVisual {
  const visual = option.visuals?.[gender] ?? option.visual;
  if (!visual) throw new Error(`图谱缺少可用视觉：${option.id}:${gender}`);
  return visual;
}

export function buildAtlasReading(option: AtlasOption, chart: FourPillarsResult): AtlasReading {
  const structure = chart.professional.structureBalance === "support-heavy" ? "内在支持较集中"
    : chart.professional.structureBalance === "expression-heavy" ? "向外输出较集中" : "支持与输出相对混合";
  const confidence = chart.confidence === "limited" ? "当前主盘含待核坐标，只作有限对照" : "当前主盘坐标可用于结构对照";
  const isStarModel = option.id.startsWith("star-");
  return {
    id: option.id,
    title: option.title,
    professionalResult: option.professionalResult,
    caution: option.caution,
    sourceIds: option.sourceIds,
    layers: [
      { label: isStarModel ? "文化模型结果" : "传统结果", text: option.professionalResult },
      { label: isStarModel ? "模型依据" : "传统依据", text: option.traditionalBasis },
      { label: "白话翻译", text: option.plainLanguage },
      { label: "生活场景", text: option.lifeScene },
      { label: "优势与误区", text: option.strengthAndPitfall },
      { label: "行动建议", text: option.action },
      { label: "主盘对照", text: `${option.chartComparison} 你的主盘以${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}日主为观察轴，结构显示${structure}；${confidence}。` },
    ],
  };
}
