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

function candidateIntroduction(candidate: MirrorCandidate): string {
  if (candidate.kind === "animal") {
    return `先认识${candidate.name}：这里只借它在真实环境中的一种动作照生活，不把动物习性套成人格。`;
  }
  if (candidate.kind === "historical") {
    return `先认识${candidate.name}：这里只比较一段可核对的做法，不复制历史处境，也不宣称命运相同。`;
  }
  const movie = candidate as MovieCharacterRecord;
  return `先认识《${movie.filmTitle}》里的${movie.characterName}：这里只借角色的一次选择照见生活，不把剧情当作你的结局。`;
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
    playfulObservation:
      `借${movie ? movie.characterName : candidate.name}这面镜子看动作就好；如果只学表面姿态，反而会错过真正需要修正的后果。`,
  };
}

function zodiacPublicCard(name: string): MirrorPublicCard {
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
      cards: [zodiacPublicCard(zodiac.zodiac)],
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
