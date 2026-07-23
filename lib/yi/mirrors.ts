import { ANIMAL_MIRRORS } from "./animal-mirrors";
import {
  getPublicSayingLead,
  type PublicSayingLead,
} from "./folk-saying-corpus";
import { HISTORICAL_MIRRORS } from "./historical-mirrors";
import { extractMirrorFeatures, scoreMirror, type MirrorFeatureVector } from "./mirror-features";
import { MOVIE_CHARACTERS, type MovieCharacterRecord } from "./movie-characters";
import type { FourPillarsResult } from "./types";
import { buildZodiacMirror } from "./zodiac-mirror";

export type MirrorCandidate = {
  id: string;
  name: string;
  kind: "animal" | "historical" | "movie";
  vector: MirrorFeatureVector;
  similar: string;
  different: string;
  lesson: string;
  shadow: string;
  sourceReferences: string[];
};

export type AnimalArchetype = {
  name: string;
  basis: string;
  mappedFeatures: string[];
  strengthPattern: string;
  pressurePattern: string;
  action: string;
  caution: string;
};

export type HistoricalMirror = {
  person: string;
  dimension: string;
  basis: string;
  source: string;
  reliability: "high" | "medium" | "contextual";
  observation: string;
  action: string;
  caution: string;
};

export type MirrorPublicCard = Readonly<{
  name: string;
  workTitle?: string;
  introduction: string;
  matchingScene: string;
  importantDifference: string;
  takeaway: string;
  playfulObservation: string;
}>;

export type MirrorPublicView = Readonly<{
  id: "zodiac" | "animal" | "historical" | "movie";
  label: string;
  cards: readonly MirrorPublicCard[];
  lead?: PublicSayingLead;
}>;

function rank<T extends MirrorCandidate>(candidates: T[], chart: FourPillarsResult): T[] {
  const { vector } = extractMirrorFeatures(chart);
  return [...candidates]
    .map(candidate => ({ candidate, score: scoreMirror(vector, candidate.vector) }))
    .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id))
    .map(item => item.candidate);
}

function rankMovies(chart: FourPillarsResult): MovieCharacterRecord[] {
  const selected: MovieCharacterRecord[] = [];
  const stages = new Set<MovieCharacterRecord["stage"]>();
  for (const candidate of rank(MOVIE_CHARACTERS, chart)) {
    if (stages.has(candidate.stage)) continue;
    selected.push(candidate);
    stages.add(candidate.stage);
  }
  return selected;
}

export function matchLifeMirrors(chart: FourPillarsResult): {
  animals: MirrorCandidate[];
  historical: MirrorCandidate[];
  movies: MovieCharacterRecord[];
} {
  return {
    animals: rank(ANIMAL_MIRRORS, chart).slice(0, 3),
    historical: rank(HISTORICAL_MIRRORS, chart).slice(0, 3),
    movies: rankMovies(chart),
  };
}

export function matchAnimalArchetype(chart: FourPillarsResult): AnimalArchetype {
  const first = matchLifeMirrors(chart).animals[0];
  return {
    name: first.name,
    basis: `显式映射：${extractMirrorFeatures(chart).evidence.join("；")}`,
    mappedFeatures: Object.entries(first.vector).map(([key, value]) => `${key}=${value}`),
    strengthPattern: first.similar,
    pressurePattern: first.shadow,
    action: first.lesson,
    caution: "这是行为隐喻，不是性格标签。",
  };
}

export function matchHistoricalMirror(chart: FourPillarsResult): HistoricalMirror {
  const first = matchLifeMirrors(chart).historical[0];
  return {
    person: first.name,
    dimension: "人生结构单维比较",
    basis: `显式映射：${extractMirrorFeatures(chart).evidence.join("；")}`,
    source: first.sourceReferences.join("；"),
    reliability: "contextual",
    observation: first.similar,
    action: first.lesson,
    caution: "仅比较具体维度，不表示命运相同。",
  };
}

type ZodiacPublicSeed = Readonly<{
  name: string;
  introduction: string;
  matchingScene: string;
  importantDifference: string;
  takeaway: string;
  playfulObservation: string;
}>;

const ZODIAC_PUBLIC_SEEDS: readonly ZodiacPublicSeed[] = [
  {
    name: "鼠",
    introduction: "先认识子鼠：这面文化镜借它先找线索、再试小路的动作来观察生活。",
    matchingScene: "当你和伙伴接到资料不全的任务时，你先问清一个关键缺口并做小测试，于是团队不用在猜测里一起空转。",
    importantDifference: "真实的人还要说明意图和边界，不能把谨慎变成对所有人的长期设防。",
    takeaway: "今天把最不确定的问题写成一条可验证假设，只做一次低成本求证。",
    playfulObservation: "像先闻一闻风向再出门很机灵；如果一直不出门，地图再全也到不了现场。",
  },
  {
    name: "牛",
    introduction: "先认识丑牛：这面文化镜借它稳定劳作的节拍来观察持续兑现。",
    matchingScene: "当家人把长期整理交给你时，你列出每天能完成的一小步并持续做，于是混乱慢慢有了可见次序。",
    importantDifference: "人的责任可以协商和轮换，可靠不等于凡事都要独自扛住。",
    takeaway: "给本周最重的责任写下完成线、停止时间和一个可以求助的人。",
    playfulObservation: "慢慢走并不怕，怕的是把休息也当成偏航，最后只有车在走、拉车的人没了力气。",
  },
  {
    name: "虎",
    introduction: "先认识寅虎：这面文化镜借它主动开局、守住边界的动作来观察担当。",
    matchingScene: "当团队都在犹豫时，你先说清目标并提出第一步，于是大家有了可以回应和修正的起点。",
    importantDifference: "人的果断需要权限、证据和他人参与，不能把音量当成方向正确。",
    takeaway: "下一次拍板前先请一位相关者说出最大的反证，再决定怎样行动。",
    playfulObservation: "先站出来很有用；如果站得太靠前，身后伙伴的声音也可能被自己挡住。",
  },
  {
    name: "兔",
    introduction: "先认识卯兔：这面文化镜借它留意气氛、轻声靠近的动作来观察分寸。",
    matchingScene: "当朋友说话越来越少时，你先问对方想被听见还是想独处，于是关心不会变成追问。",
    importantDifference: "人的温和也需要清楚表达，不说真实需要会让别人只能继续猜。",
    takeaway: "今天把一句含蓄暗示改成事情、感受、请求三句话。",
    playfulObservation: "脚步轻能少惊动别人；轻到完全没有声音，别人也不知道你已经需要帮助。",
  },
  {
    name: "龙",
    introduction: "先认识辰龙：这面文化镜借它聚拢想象、带起气势的形象来观察发起力。",
    matchingScene: "当伙伴对项目失去方向时，你画出完成后的具体样子并分出第一步，于是热情有了可以落地的入口。",
    importantDifference: "文化形象不是能力认证，现实成果仍要由时间、资源和协作承接。",
    takeaway: "把一个大想法改写成七天内能完成、能展示、能听反馈的小版本。",
    playfulObservation: "把云聚起来很有气势；如果迟迟不落一滴雨，地上的人还是不知道该种什么。",
  },
  {
    name: "蛇",
    introduction: "先认识巳蛇：这面文化镜借它安静观察、适时换路的动作来观察判断。",
    matchingScene: "当会议信息互相矛盾时，你先停下来核对关键数字再提出新路线，于是团队少走了一段来回返工。",
    importantDifference: "人的保留会被伙伴解读，改变方向前仍要说明原因和承诺怎样延续。",
    takeaway: "为一个重要判断各写一条支持证据和反证，再决定是否换路。",
    playfulObservation: "会转弯是一种本事；如果每次都悄悄转弯，同行的人只会发现你突然不见了。",
  },
  {
    name: "马",
    introduction: "先认识午马：这面文化镜借它快速起步、持续向前的动作来观察行动力。",
    matchingScene: "当机会窗口很短时，你先完成第一版并邀请伙伴补缺，于是讨论很快有了真实对象。",
    importantDifference: "人的速度会影响他人，起步前还要确认方向、容量和谁负责收尾。",
    takeaway: "启动一件事时同时写下停止条件、复盘时间和后续维护人。",
    playfulObservation: "跑得快能先看见远处；忘了回头确认队伍，最后可能只剩自己知道终点在哪。",
  },
  {
    name: "羊",
    introduction: "先认识未羊：这面文化镜借它贴近群体、照顾氛围的形象来观察协作。",
    matchingScene: "当家人意见分成两边时，你先复述双方在意什么再提出共同一步，于是争论没有继续扩大。",
    importantDifference: "人的照顾要有同意和边界，维持和气不能长期替代真实决定。",
    takeaway: "下一次协调时先写自己的判断，再去听两方意见，最后明确一个截止点。",
    playfulObservation: "把大家招呼到一张桌旁很温暖；如果只添椅子不谈问题，桌面还是会越来越挤。",
  },
  {
    name: "猴",
    introduction: "先认识申猴：这面文化镜借它快速试验、灵活换工具的动作来观察应变。",
    matchingScene: "当同事卡在旧流程时，你换一个工具做出示范，于是大家先看见效果，再一起决定是否调整。",
    importantDifference: "人的变化需要连续说明，频繁换法会让伙伴无法判断什么仍然有效。",
    takeaway: "今天只测试一个新办法，并提前写下保留项、观察点和结束时间。",
    playfulObservation: "工具多很方便；每分钟换一把，螺丝还没拧紧，工具箱倒先翻了个遍。",
  },
  {
    name: "鸡",
    introduction: "先认识酉鸡：这面文化镜借它守时报讯、分辨细节的形象来观察提醒。",
    matchingScene: "当项目快到截止点时，你把遗漏逐项指出并标明负责人，于是团队能在交付前补上缺口。",
    importantDifference: "人的提醒要考虑对象和时机，指出问题不能代替共同解决。",
    takeaway: "每提出一个问题，同时确认一个有效点和一个可执行修正。",
    playfulObservation: "准时报晓能叫醒大家；如果一整天都在报时，真正重要的那一声反而没人听见。",
  },
  {
    name: "狗",
    introduction: "先认识戌狗：这面文化镜借它守护关系、留意风险的形象来观察承诺。",
    matchingScene: "当朋友遇到麻烦时，你先确认安全和可用资源再陪他处理，于是支持没有变成替他做主。",
    importantDifference: "人的忠诚包含拒绝和纠错，不能用无条件站队证明关系。",
    takeaway: "帮忙前先问对方需要什么、自己能做到哪一步、何时重新确认。",
    playfulObservation: "守门很可靠；如果每个影子都被当成闯入者，屋里的人也会不敢开窗。",
  },
  {
    name: "猪",
    introduction: "先认识亥猪：这面文化镜借它安稳享用、保留松弛的形象来观察恢复。",
    matchingScene: "当家人忙完一轮任务时，你安排一顿简单饭和不谈工作的时间，于是大家有机会把疲惫放下来。",
    importantDifference: "人的松弛仍要照看现实边界，舒服不能长期替代需要处理的问题。",
    takeaway: "为本周安排一段真正恢复的时间，也写下一件恢复后要面对的事。",
    playfulObservation: "会休息能让路走得更长；如果把所有提醒都塞到坐垫下面，坐久了还是会硌得慌。",
  },
] as const;

const HISTORICAL_PUBLIC_CONTEXT: Readonly<Record<string, string>> = {
  "historical-confucius":
    "春秋时期思想家与教育者孔子周游列国并长期讲学，弟子及再传弟子后来把其言行整理成《论语》，影响了后世教育与伦理讨论。",
  "historical-florence-nightingale":
    "英国护理改革者南丁格尔在克里米亚战争医院记录伤病与环境问题，推动医院卫生改进，并把经验带进现代护理教育。",
  "historical-gandhi":
    "印度独立运动领袖甘地组织非暴力不合作行动，把个人自律变成公开动员方式，也因此长期面对监禁、冲突与社会争议。",
  "historical-helen-keller":
    "美国作家与残障权利倡导者海伦·凯勒借触觉语言学习沟通，完成大学教育后持续写作与演讲，让更多人看见无障碍教育的重要。",
  "historical-li-qingzhao":
    "宋代词人李清照经历战乱南渡与收藏散失，仍整理金石经历并持续创作，让个人离乱成为后世能够读懂的时代记忆。",
  "historical-marie-curie":
    "物理学家与化学家玛丽·居里通过长期实验研究放射性，发现钋和镭，并成为首位两次获得诺贝尔科学奖的人。",
  "historical-nelson-mandela":
    "南非反种族隔离运动领袖曼德拉经历二十七年监禁，获释后参与谈判推动制度转型，后来成为南非总统。",
  "historical-sima-guang":
    "北宋史学家司马光主持编纂《资治通鉴》，把跨越多个朝代的史事按时间梳理成可供后来者借鉴的长篇通史。",
  "historical-sima-qian":
    "西汉史学家司马迁在遭受宫刑后仍完成《史记》，以人物纪传串起时代兴衰，留下影响深远的史学与文学作品。",
  "historical-su-shi":
    "北宋文人苏轼多次遭遇贬谪与迁居，仍在各地写作、办事并连接当地生活，让挫折转化成诗文与公共实践。",
  "historical-tao-yuanming":
    "东晋诗人陶渊明辞去彭泽县令回乡生活，并写下《归去来兮辞》等作品，让仕途与内心原则的取舍成为长期话题。",
  "historical-wang-yangming":
    "明代思想家与官员王阳明被贬龙场后继续讲学和处理现实事务，后来以知行合一说明认识必须进入行动检验。",
  "historical-xu-xiake":
    "明代旅行家徐霞客长期实地考察山川并修正沿途记录，身后整理成《徐霞客游记》，留下可复查的地理见闻。",
  "historical-xuanzang":
    "唐代僧人和翻译家玄奘远行印度求学，回国后主持翻译佛典并参与整理《大唐西域记》，把跨地域知识带回中原。",
  "historical-zhang-qian":
    "汉代使者张骞出使西域时历经扣留仍返回长安，带回沿途见闻，推动汉朝对西域的了解与往来。",
};

const MOVIE_PUBLIC_CONTEXT: Readonly<Record<string, string>> = {
  "movie-cn-ne-zha":
    "被当作魔丸的哪吒一度用冲撞回应偏见，最后选择守护陈塘关并与天劫正面相抗，让行动而不是标签定义自己。",
  "movie-cn-zhang-mazi":
    "张麻子借县长身份与黄四郎公开较量，带动百姓反抗强权，却也在赢下对局后看见伙伴各有去路。",
  "movie-cn-ma-youtie":
    "贫困农民马有铁与贵英靠一砖一瓦盖起土屋并彼此照料，贵英离世后，这个刚有温度的家也随之瓦解。",
  "movie-cn-liu-peiqiang":
    "航天员刘培强在空间站命令与地球危机之间作出选择，最终驾驶空间站冲向木星，为救援计划争取机会。",
  "movie-cn-cheng-dongqing":
    "成东青从受挫教师做起，与伙伴把英语培训办成大公司，但成功也把三人的权力、上市方向与旧友情推入冲突。",
  "movie-cn-jingqiu":
    "静秋在外部压力下谨慎靠近老三，却因他的病逝没能等到共同生活，克制的爱最终成为一段带着遗憾的记忆。",
  "movie-cn-jia-xiaoling":
    "贾晓玲回到母亲年轻时代，拼命想替母亲改写人生，最后发现母亲早已选择爱她，于是把内疚转成理解与告别。",
  "movie-cn-cheng-yong":
    "程勇起初为赚钱带回低价仿制药，见到患者困境后冒险继续帮助他们，最终承担法律后果也赢得患者送别。",
  "movie-cn-lang-ping":
    "郎平从女排冠军成长为教练，把亲自拼赢的经验改造成训练、选人和临场调整，带领不同一代队员穿过失败再出发。",
  "movie-hk-song-zihao":
    "宋子豪决定退出犯罪集团并修补与警察弟弟的关系，却被旧伙伴和旧仇拖回冲突，改过也因此付出沉重代价。",
  "movie-hk-chan-kakweui":
    "警察陈家驹多次用高风险行动冒险追捕罪犯，案件虽被推进，受伤、破坏和亲密关系失约也一路跟来。",
  "movie-hk-yuddy":
    "旭仔不断寻找生母来确认自己是谁，却用突然离开保护脆弱，结果一次次把亲密关系留在没有答案的地方。",
  "movie-hk-chen-yongren":
    "警察陈永仁长期卧底黑帮，在一次次任务中等待恢复身份，却在真相将被确认前失去回到正常生活的机会。",
  "movie-hk-li-qiao":
    "李翘到香港后努力赚钱和安排未来，却在与黎小军的感情和现实选择之间反复分离，多年后才再次相遇。",
  "movie-hk-su-lizhen":
    "苏丽珍发现配偶背叛后与同样受伤的邻居靠近，却始终用克制守住边界，最终让没有说尽的感情停在离别里。",
  "movie-hk-sing":
    "阿星想把少林功夫带进现代生活，于是召回师兄弟组成足球队，众人在训练和比赛中重新找回能力与共同目标。",
  "movie-hk-tao-jie":
    "桃姐中风后无法继续照料别人，过去被她照顾的罗杰转身安排她的生活，角色互换让两人重新认识这段家人般的关系。",
  "movie-hk-luo-jiner":
    "罗进二在家庭困顿中目睹哥哥病逝，无法留住亲人，却在成长后把失去记成继续照顾家庭的力量。",
  "movie-asia-kim-kiwoo":
    "金基宇伪造学历进入富人家庭，又让家人逐步顶替原雇员，精心设计的上升通道最终在阶层冲突中爆发暴力。",
  "movie-asia-osamu-shibata":
    "柴田治靠偷窃维持一个没有血缘的家庭，又收留受伤女孩，警方介入后众人被迫分开，也让爱与违法责任同时显露。",
  "movie-asia-lee-jongsu":
    "李钟秀在海美失踪后把零散线索指向本，迟迟无法证实的猜疑不断升级，最后把他推向无法挽回的暴力选择。",
  "movie-asia-kobayashi-daigo":
    "失业乐手小林大悟成为入殓师并向妻子隐瞒工作，反复送别逝者后获得理解，也重新面对与父亲未完成的关系。",
  "movie-asia-rancho":
    "兰彻公开挑战填鸭教育并帮助朋友选择真正想走的路，他的离开与重逢也让同伴看见分数之外的人生结果。",
  "movie-asia-simin":
    "西敏想离开伊朗给女儿新的生活，丈夫却要留下照顾父亲，离婚争执最终把去留选择也交到女儿面前。",
  "movie-asia-chihiro":
    "父母变成猪后，荻野千寻进入浴场工作并记住自己的名字，她一次次帮助伙伴，最终救回父母并找到回家的路。",
  "movie-asia-shimada-kanbei":
    "老武士岛田勘兵卫召集同伴帮助农民守村，众人赢下战斗却失去数名伙伴，他也明白真正留下家园的是农民。",
  "movie-asia-geeta-phogat":
    "吉塔·珀尕接受父亲严苛的摔跤训练走上赛场，决赛时改用自己的现场判断，最终为自己赢下比赛。",
  "movie-west-michael-corleone":
    "迈克尔·柯里昂原本远离家族生意，却因复仇一步步接管家族权力，得到控制的同时也失去亲人的信任。",
  "movie-west-maximus":
    "被陷害的将军马克西姆斯沦为角斗士，靠竞技回到罗马挑战康茂德，最终完成对抗却也付出生命。",
  "movie-west-furiosa":
    "弗瑞奥萨带五位女性逃离暴君，发现旧家园已不存在后选择掉头攻回堡垒，把逃亡变成重新夺回水与生存权。",
  "movie-west-forrest-gump":
    "福瑞斯特·甘凭直率和坚持穿过越战、跑步与创业的意外成功，却始终无法替珍妮避开她自己的伤痛与选择。",
  "movie-west-katherine-johnson":
    "NASA数学家凯瑟琳·约翰逊精确计算载人飞行轨道，她的结果帮助任务推进，也迫使工作场所面对种族隔离造成的阻碍。",
  "movie-west-will-hunting":
    "在麻省理工做清洁工的威尔·亨廷解开高难数学题，却不断推开机会和亲密关系，直到心理咨询帮助他面对旧创伤。",
  "movie-west-andy-dufresne":
    "蒙受冤狱的安迪·杜弗兰一边在监狱建立图书馆，一边多年挖掘隧道，最终逃离并把典狱长的腐败证据交给媒体。",
  "movie-west-erin-brockovich":
    "法律助理艾琳·布罗克维奇追查社区水污染，逐户听取居民经历并整理证据，最终帮助受害居民赢得赔偿。",
  "movie-west-frodo-baggins":
    "弗罗多·巴金斯承担把魔戒送往末日火山的任务，虽与伙伴完成使命，长期负担仍让他无法完全回到从前生活。",
};

function getRequiredPublicContext(
  contexts: Readonly<Record<string, string>>,
  candidate: MirrorCandidate,
): string {
  const context = contexts[candidate.id];
  if (!context) {
    throw new Error(`Mirror public context does not exist: ${candidate.id}`);
  }
  return context;
}

function candidateIntroduction(candidate: MirrorCandidate): string {
  if (candidate.kind === "animal") {
    return `先认识${candidate.name}：这里只借它在真实环境中的一种动作照生活，不把动物习性套成人格。`;
  }
  if (candidate.kind === "historical") {
    return `先认识${candidate.name}：${getRequiredPublicContext(
      HISTORICAL_PUBLIC_CONTEXT,
      candidate,
    )}`;
  }
  const movie = candidate as MovieCharacterRecord;
  return `先认识《${movie.filmTitle}》里的${movie.characterName}：${getRequiredPublicContext(
    MOVIE_PUBLIC_CONTEXT,
    candidate,
  )}`;
}

function candidateMatchingScene(
  candidate: MirrorCandidate,
  movie: MovieCharacterRecord | null,
): string {
  const similarity = candidate.similar.trim().replace(/[。；;]+$/u, "");
  if (candidate.kind === "animal") {
    return `你和伙伴遇到新变化时，先说清自己看到的线索，再挑一个小办法试；大家于是能一起核对结果。镜像相似点是：${similarity}。`;
  }
  if (candidate.kind === "historical") {
    return `你和同事复盘一件卡住的事时，先把${candidate.name}的一种做法与自己的现实条件分别写下，于是借鉴不会变成照搬。可以比较的做法是：${similarity}。`;
  }
  const movieCandidate = movie as MovieCharacterRecord;
  return `你和朋友讨论一个难决定时，先说出${movieCandidate.characterName}在《${movieCandidate.filmTitle}》里的选择，再问自己的条件哪里不同；这样能让角色只帮助你照见动作，不替你写结局。角色相似点是：${similarity}。`;
}

function candidatePublicCard(candidate: MirrorCandidate): MirrorPublicCard {
  const movie = candidate.kind === "movie"
    ? candidate as MovieCharacterRecord
    : null;
  return {
    name: movie ? movie.characterName : candidate.name,
    ...(movie ? { workTitle: `《${movie.filmTitle}》` } : {}),
    introduction: candidateIntroduction(candidate),
    matchingScene: candidateMatchingScene(candidate, movie),
    importantDifference: candidate.different,
    takeaway: candidate.lesson,
    playfulObservation: `${
      movie ? movie.characterName : candidate.name
    }这面镜子的趣味提醒：${candidate.shadow}`,
  };
}

const UNRESOLVED_ZODIAC_PUBLIC_CARD: MirrorPublicCard = {
  name: "生肖待确认",
  introduction: "你的出生日期正好靠近生肖交界，现有时间信息还不足以确定生肖。",
  matchingScene: "在结果确认前，先把这张卡当作一则文化趣味提醒，不用它给自己定性或替自己做决定。",
  importantDifference: "生肖尚未确定，不会妨碍你记录真实经历；生活中的选择和反馈比一张待确认的卡更重要。",
  takeaway: "如果方便，请补充准确出生时间后重新生成；暂时无法补充，也可以安心跳过这一张。",
  playfulObservation: "交界像站在两扇门之间：先看清门牌再进门，比急着选一扇更省脚步。",
};

function zodiacPublicCard(
  name: string,
  yearAmbiguous = false,
): MirrorPublicCard {
  if (yearAmbiguous) return { ...UNRESOLVED_ZODIAC_PUBLIC_CARD };
  const seed = ZODIAC_PUBLIC_SEEDS.find(candidate => candidate.name === name);
  if (!seed) throw new Error(`Zodiac public copy does not exist: ${name}`);
  return { ...seed };
}

export function getMirrorPublicCatalog(): Readonly<{
  zodiac: readonly MirrorPublicCard[];
  animal: readonly MirrorPublicCard[];
  historical: readonly MirrorPublicCard[];
  movie: readonly MirrorPublicCard[];
}> {
  return {
    zodiac: ZODIAC_PUBLIC_SEEDS.map(seed => ({ ...seed })),
    animal: ANIMAL_MIRRORS.map(candidatePublicCard),
    historical: HISTORICAL_MIRRORS.map(candidatePublicCard),
    movie: MOVIE_CHARACTERS.map(candidatePublicCard),
  };
}

export function buildMirrorPublicViews(
  chart: FourPillarsResult,
): readonly MirrorPublicView[] {
  const zodiac = buildZodiacMirror(chart);
  const selected = matchLifeMirrors(chart);
  return [
    {
      id: "zodiac",
      label: "生肖镜像",
      cards: [zodiacPublicCard(zodiac.zodiac, zodiac.yearAmbiguous)],
    },
    {
      id: "animal",
      label: "动物镜像",
      cards: selected.animals.map(candidatePublicCard),
    },
    {
      id: "historical",
      label: "历史人物",
      cards: selected.historical.map(candidatePublicCard),
      lead: getPublicSayingLead("classical-review-other-mountain"),
    },
    {
      id: "movie",
      label: "电影角色",
      cards: selected.movies.map(candidatePublicCard),
    },
  ];
}
