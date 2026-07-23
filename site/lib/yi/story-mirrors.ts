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

const REVIEWED_MATCHING_SCENES: Readonly<Record<string, string>> = {
  "animal-albatross":
    "当长期任务进入反馈稀少、伙伴开始怀疑方向的阶段时，信天翁提醒你设置补给点，同时核对体力、信息和同行成本；这样坚持会有现实支撑，改道也不会被误解成轻易放弃。",
  "animal-bottlenose-dolphin":
    "当协作现场信号很多、每个人理解又不完全相同时，宽吻海豚提醒你用短回合交换观察、复述理解并确认下一步；因此团队能保留敏捷，也能避免热闹互动掩盖真正分歧。",
  "animal-elephant-herd":
    "当团队中有人习惯把所有重量都接到自己身上时，非洲象群提醒你划清个人负责、共同负责和需要转交的部分；于是照料仍然存在，而可靠的人不必靠持续透支证明价值。",
  "animal-gray-wolf":
    "当成员开始用沉默猜测地位、把异议当成忠诚问题时，灰狼提醒你公开目标、决定权与求助信号，并按事实更新分工；结果合作回到清楚协议，不再被未说出口的等级想象牵着走。",
  "animal-green-sea-turtle":
    "当熟悉路线令人安心、环境却已经出现新信号时，绿海龟提醒你同时保留一项稳定指标和一项开放指标；这样长期承诺仍有方向，新信息也能及时改变完成路线。",
  "animal-honeybee-colony":
    "当集体冲刺让空档变得令人焦虑、协调劳动逐渐隐形时，蜜蜂群落提醒你写清产出、工作量与退出条件；因此贡献可以被看见，顺手补位也不会自动变成长期义务。",
  "animal-manatee":
    "当冲突逼近而你不想提高音量、又担心边界被忽略时，西印度海牛提醒你明确时间、范围和后续动作；于是温和不再等于默认接受，问题也能在积累成阻塞前被回应。",
  "animal-meerkat":
    "当风险信息不断出现、团队开始被连续警报拖住时，狐獴提醒你分开已发生、可能发生和建议动作，再邀请伙伴补充事实；这样重要提醒仍有分量，观察者也不用替所有人决定。",
  "animal-orca-pod":
    "当团队经验逐渐变成不可质疑的内部传统时，虎鲸家族群提醒你把经验整理成可讨论的方法，并给新成员留下修订入口；因此传承能够继续服务现实，而不会滑向排斥差异。",
  "animal-peregrine-falcon":
    "当机会窗口很短、行动冲动快过信息核对时，游隼提醒你预先写明起飞条件、停止条件和复盘时间；于是速度有了清楚标准，落地后的维护与解释也不会被遗忘。",
  "animal-giant-pacific-octopus":
    "当原方案受阻、你准备切换路径或呈现方式时，巨型太平洋章鱼提醒你先说明不变目标和切换条件；这样伙伴看见的是方法调整而非承诺漂移，多条路径也能继续累积信任。",
  "animal-red-crowned-crane":
    "当关系需要稳定配合、双方又各自需要空间时，丹顶鹤提醒你定期讨论距离、协作和个人安排，并允许约定更新；因此稳定成为持续协商的结果，而不是压住情绪的静止表面。",
  "animal-sloth":
    "当任务速度变慢、你分不清是在深思、恢复还是回避时，三趾树懒提醒你设置最小可见进度并记录身体信号；于是慢节奏能够保护质量，也会及时暴露需要面对的问题。",
  "animal-snow-leopard":
    "当独自处理困难、又不能让协作者长期失去信息时，雪豹提醒你区分私密过程和必须共享的节点；这样专注仍受保护，相关的人也知道目标、风险和下一次更新时间。",
  "animal-wild-goose-flock":
    "当长期协作总由少数人领航、掉队者又不敢开口时，鸿雁雁阵提醒你设计领航、跟随和休整的轮换规则；因此团队可以持续前进，而不必用个别成员的耗竭换取表面一致。",
  "historical-confucius":
    "当一个学习原则长期停在赞同、没有进入真实场景时，孔子这面镜子提醒你围绕同一问题连续记录行动、反馈和修正；因此理解会被现实检验，也能逐步变成伙伴共同使用的方法。",
  "historical-florence-nightingale":
    "当照料愿望不断救火、同类问题却反复出现时，弗洛伦斯·南丁格尔这面镜子提醒你建立最小记录并试验一项环境调整；这样善意会获得可复查的路径，改进也不再只靠个人硬撑。",
  "historical-gandhi":
    "当公开主张很有力量、日常做法却还缺少核对点时，莫罕达斯·甘地这面镜子提醒你把主张改成自己先能履行的行为；于是立场接受他人质询，不会只靠道德姿态要求不同处境的人。",
  "historical-helen-keller":
    "当常用路径失效、困难被误写成只能靠意志克服时，海伦·凯勒这面镜子提醒你列出可用工具、感知通道和协作者；因此第二条进入问题的路线会出现，制度缺口也不会被励志叙事遮住。",
  "historical-li-qingzhao":
    "当一段经历在心里反复翻涌、公开边界仍不清楚时，李清照这面镜子提醒你分开事实、感受和未回答的问题；这样表达可以选择公开、留存或暂缓，细腻观察也不会困住必要行动。",
  "historical-marie-curie":
    "当重要判断依赖微弱差异、投入又已经持续很久时，玛丽·居里这面镜子提醒你区分观察、推断和反例，并保留停止条件；因此耐力服务于可复查的方法，而不会被沉没成本绑住。",
  "historical-nelson-mandela":
    "当僵局里既有不可放弃的原则、也有必须共同处理的现实时，纳尔逊·曼德拉这面镜子提醒你分开底线、路径与待核事实；于是协商可以前进，同时保留责任与真实修复的位置。",
  "historical-sima-guang":
    "当争议材料彼此冲突、结论又被催着尽快形成时，司马光这面镜子提醒你先排时间线，再分开事实、解释与价值判断；这样读者能看见判断怎样形成，新材料也有清楚的进入位置。",
  "historical-sima-qian":
    "当长期作品被宏大目标推着扩张、缺席视角逐渐被忽略时，司马迁这面镜子提醒你按人物、事件、材料和疑问建立索引；因此使命感会落到可完成单元，损耗不再被当成作品价值的凭据。",
  "historical-su-shi":
    "当计划外变化带来失落、你又很快想把它解释成收获时，苏轼这面镜子提醒你保留原目标、发展新用途并联系现实伙伴；于是适应包含行动，也给哀伤、申诉和支持留下空间。",
  "historical-tao-yuanming":
    "当职位、收入和内在原则之间出现交换难题时，陶渊明这面镜子提醒你列明不愿交换之处、现实成本和折中方案；因此价值选择会接受生活核算，也不会把退出浪漫化后留给家人承担。",
  "historical-wang-yangming":
    "当一个道理自认已经明白、现实里却反复做不到时，王阳明这面镜子提醒你把下一步缩成可完成动作，再记录认识被事实修正之处；这样行动不会越过协商，确信也要接受外部检验。",
  "historical-xu-xiake":
    "当二手判断彼此矛盾、探索又容易只收集印证时，徐霞客这面镜子提醒你记录路线、观察、材料和被现场改变的判断；因此移动会沉淀成可复查成果，未知也不会无限扩张范围。",
  "historical-xuanzang":
    "当关键概念存在多个版本、继续追源又可能没有尽头时，玄奘这面镜子提醒你核对一手文本、权威注解和采用限制；于是求知会形成明确版本决定，也保留足够安全的停止条件。",
  "historical-zhang-qian":
    "当长期任务受阻、原终点短期内仍无法抵达时，张骞这面镜子提醒你同时记录原目标、替代成果和撤退标准；因此途中形成的地图、联系人和已核信息能够留下，不必用硬撑证明承诺。",
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
    .replaceAll(
      "编排事实本身也需要接受来源偏差检查",
      "编排事实也需要检查材料可能带来的偏向与遗漏",
    )
    .replaceAll(
      "处理争议材料时先列时间线和来源等级",
      "处理争议材料时先列时间线，逐项注明材料出处与不确定处",
    )
    .replaceAll(
      "找到两个一手来源和一个权威注解",
      "找到两份一手文本和一份权威注解",
    )
    .replaceAll("补充证据", "补充事实")
    .replaceAll("证据条件", "可核对条件")
    .replaceAll("证据点", "核对点")
    .replaceAll("证据日志", "核对日志")
    .replaceAll("新证据", "新材料")
    .replaceAll("证据", "材料")
    .replaceAll("来源", "材料出处")
    .replaceAll("可靠级", "复核层次")
    .replaceAll("匹配分", "比较结果")
    .replaceAll("显式映射", "具体比较");
}

function addressReader(scene: string): string {
  return scene
    .replace(/^当/u, "当你面对")
    .replace(/；(?:因此|于是|结果)/u, "；这样");
}

export function projectStoryMirror(candidate: MirrorCandidate): StoryMirror {
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
    matchingScene: REVIEWED_MATCHING_SCENES[candidate.id]
      ? addressReader(REVIEWED_MATCHING_SCENES[candidate.id])
      : `当你把${candidate.name}用作一面行动镜子时，可以完整执行“${publicText(candidate.lesson)}”；这样比较会落到可观察的行动与后果，不会停在标签上。`,
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
