import { matchLifeMirrors, type MirrorCandidate } from "./mirrors";
import type { FourPillarsResult } from "./types";

export type StoryMirror = Readonly<{
  internalCandidateId: string;
  name: string;
  introduction: string;
  matchingScene: string;
  difference: string;
  takeaway: string;
}>;

export type StoryMirrors = Readonly<{
  animal: StoryMirror;
  historical: StoryMirror;
}>;

const ANIMAL_BEHAVIOR_INTRODUCTIONS: Readonly<Record<string, string>> = {
  "animal-albatross": "信天翁借助海风滑翔飞行，能在远海上完成长距离迁移。",
  "animal-bottlenose-dolphin": "宽吻海豚在水域中交换信号，也会通过群体协作探索和觅食。",
  "animal-elephant-herd": "非洲象群在陆地迁移中照料幼象，并依靠长期记忆寻找水源。",
  "animal-gray-wolf": "灰狼在陆地上群体协作，会通过观察同伴和环境调整行动位置。",
  "animal-green-sea-turtle": "绿海龟会在辽阔水域中长途洄游，返回与繁殖有关的栖息区域。",
  "animal-honeybee-colony": "蜜蜂群落以飞行传递花源信息，并通过群体分工完成觅食与照料。",
  "animal-manatee": "西印度海牛在温暖水域缓慢游动，以水生植物为食并选择安静栖息地。",
  "animal-meerkat": "狐獴在陆地群体觅食时轮流观察危险，用叫声提醒同伴及时躲避。",
  "animal-orca-pod": "虎鲸家族群在广阔水域共同游动，以协作和经验传递完成觅食。",
  "animal-peregrine-falcon": "游隼会从高处观察目标，再以快速飞行完成俯冲并及时调整方向。",
  "animal-giant-pacific-octopus": "巨型太平洋章鱼多独自栖息，会游动、变色并探索缝隙寻找食物。",
  "animal-red-crowned-crane": "丹顶鹤会在湿地觅食、结伴迁飞，也以持续观察维持彼此距离。",
  "animal-sloth": "三趾树懒主要栖息在树冠，以缓慢移动和较低消耗适应陆地生活。",
  "animal-snow-leopard": "雪豹独自在高山陆地观察环境，借助隐蔽路线接近猎物并保存体力。",
  "animal-wild-goose-flock": "鸿雁雁阵在迁飞中轮换位置，以群体协作应对长距离空中阻力。",
};

const HISTORICAL_IDENTITY_INTRODUCTIONS: Readonly<Record<string, string>> = {
  "historical-confucius": "孔子是春秋时期的教育者与思想者，长期通过教学、整理和问答推进实践。",
  "historical-florence-nightingale": "弗洛伦斯·南丁格尔是护理改革者，以记录和统计推动医疗环境改进。",
  "historical-gandhi": "莫罕达斯·甘地是印度民族运动领袖，以公开主张和持续行动参与政治变革。",
  "historical-helen-keller": "海伦·凯勒是作家和社会活动者，借助替代性沟通方式长期学习与表达。",
  "historical-li-qingzhao": "李清照是宋代词人与金石研究者，以细密表达记录个人经验和时代迁移。",
  "historical-marie-curie": "玛丽·居里是物理学家和化学家，以长期实验、测量和复核推进研究。",
  "historical-nelson-mandela": "纳尔逊·曼德拉是南非反种族隔离运动领袖，后来参与国家转型与协商。",
  "historical-sima-guang": "司马光是北宋史学家与政治人物，以长期编纂和材料比对完成历史叙述。",
  "historical-sima-qian": "司马迁是西汉史学家，以人物、事件和制度材料组织跨时代的历史书写。",
  "historical-su-shi": "苏轼是北宋文学家与官员，在多次环境转换中持续写作并参与地方实践。",
  "historical-tao-yuanming": "陶渊明是东晋诗人，曾在仕途、家计与个人原则之间作出生活选择。",
  "historical-wang-yangming": "王阳明是明代思想家与官员，反复讨论认识怎样进入现实行动。",
  "historical-xu-xiake": "徐霞客是明代旅行家与地理观察者，以实地行走和连续记录修正见闻。",
  "historical-xuanzang": "玄奘是唐代僧人与译经者，通过远行、求学和翻译整理不同知识版本。",
  "historical-zhang-qian": "张骞是西汉使者，在长期受阻与陌生环境中保存任务线索并记录见闻。",
};

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value as Readonly<T>;
}

function publicText(value: string): string {
  return value
    .replaceAll("来源", "材料出处")
    .replaceAll("可靠级", "可信层次")
    .replaceAll("证据等级", "材料层次")
    .replaceAll("匹配分", "比较结果")
    .replaceAll("显式映射", "具体比较");
}

function clipHan(value: string, maximum: number): string {
  let result = "";
  let count = 0;
  for (const character of value) {
    if (/\p{Script=Han}/u.test(character)) {
      if (count >= maximum) break;
      count += 1;
    }
    result += character;
  }
  return result.replace(/[，；、\s]+$/u, "");
}

export function projectStoryMirror(candidate: MirrorCandidate): StoryMirror {
  const action = clipHan(publicText(candidate.lesson), 36)
    .replace(/[。；]+$/u, "");
  const difference = candidate.kind === "historical"
    ? `你的生活不是${candidate.name}的生活。${publicText(candidate.different)}`
    : publicText(candidate.different);
  const introduction = candidate.kind === "animal"
    ? ANIMAL_BEHAVIOR_INTRODUCTIONS[candidate.id]
      ?? publicText(candidate.similar)
    : HISTORICAL_IDENTITY_INTRODUCTIONS[candidate.id]
      ?? publicText(candidate.similar);

  return deepFreeze({
    internalCandidateId: candidate.id,
    name: candidate.name,
    introduction,
    matchingScene: `当你在任务或关系里同时面对多条线索、又需要决定下一步时，${action}；这样参与的人能看见目标、调整条件和停止信号，行动也会留下可复盘的结果。`,
    difference,
    takeaway: publicText(candidate.lesson),
  });
}

export function buildStoryMirrors(chart: FourPillarsResult): StoryMirrors {
  const ranked = matchLifeMirrors(chart);
  return deepFreeze({
    animal: projectStoryMirror(ranked.animals[0]),
    historical: projectStoryMirror(ranked.historical[0]),
  });
}
