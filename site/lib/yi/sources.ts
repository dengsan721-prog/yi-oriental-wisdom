import { ANIMAL_MIRRORS } from "./animal-mirrors";
import { HISTORICAL_MIRRORS } from "./historical-mirrors";
import { MOVIE_CHARACTERS } from "./movie-characters";
import { TRADITIONAL_SOURCE_CATALOG } from "./traditional-sources";

export type RuleSource = {
  ruleId: string;
  label: string;
  appliesWhen: string;
  sourceType: "library-calculation" | "classical-framework" | "product-method" | "product-heuristic";
  version: string;
  references: readonly string[];
  accessDate?: string;
};

export type ReferenceSource = {
  id: string;
  grade: "A" | "A/B" | "B";
  title: string;
  url: string;
  role: string;
  boundary: string;
  editionNote: string;
  accessDate: string;
};

export const YI_RULE_SOURCES: Record<string, RuleSource> = {
  "calendar.eight-char.v1": { ruleId: "calendar.eight-char.v1", label: "标准八字历法", appliesWhen: "公历日期与时间有效", sourceType: "library-calculation", version: "lunar-typescript@1.8.6", references: ["EightChar 标准年、月、日、时干支"] },
  "ten-god.hidden-stems.v1": { ruleId: "ten-god.hidden-stems.v1", label: "十神与完整藏干", appliesWhen: "已知日干及目标干支", sourceType: "library-calculation", version: "lunar-typescript@1.8.6", references: ["EightChar 各柱十神与藏干 API"] },
  "relation.gan-zhi.v1": { ruleId: "relation.gan-zhi.v1", label: "干支关系完整规则表", appliesWhen: "两支关系需两处已知坐标；三合与三刑需三支齐全；自刑需同一地支出现在两处已知坐标", sourceType: "product-method", version: "1.2.0", references: ["产品维护的天干五合表：甲己、乙庚、丙辛、丁壬、戊癸", "产品维护的地支六合表：子丑、寅亥、卯戌、辰酉、巳申、午未", "产品维护的地支三合表：申子辰水局、亥卯未木局、寅午戌火局、巳酉丑金局", "产品维护的地支六冲表：子午、丑未、寅申、卯酉、辰戌、巳亥", "产品维护的地支相刑规则：子卯相刑；寅巳申三刑；丑戌未三刑；辰午酉亥自刑", "产品维护的地支六害表：子未、丑午、寅巳、卯辰、申亥、酉戌", "产品维护的地支六破表：子酉、卯午、辰丑、戌未、寅亥、巳申"] },
  "climate.season-prompt.v1": { ruleId: "climate.season-prompt.v1", label: "月令调候提示", appliesWhen: "标准八字月支已知", sourceType: "product-heuristic", version: "1.0.0", references: ["寒暖燥湿框架", "仅作生活节律提示，不作调候用神结论"] },
  "structure.support-score.v2": { ruleId: "structure.support-score.v2", label: "五行支持度结构观察", appliesWhen: "至少三柱已知", sourceType: "product-heuristic", version: "2.0.0", references: ["干支主五行计数；月柱双权重", "非古籍格局或喜忌判定"] },
  "domain.mapping.v2": { ruleId: "domain.mapping.v2", label: "生活主题映射", appliesWhen: "命盘结构字段已生成", sourceType: "product-heuristic", version: "2.0.0", references: ["七主题独立选择器", "用于自我观察，不预测具体事件"] },
  "fortune.translation.v1": { ruleId: "fortune.translation.v1", label: "岁运生活领域、故事与行动转译", appliesWhen: "大运与流年计算坐标已经生成", sourceType: "product-method", version: "1.0.0", references: ["五类生活领域的产品转译表", "阶段故事与行动建议由命盘、岁运关系和十神主题共同生成"] },
  "name.semantic-five-elements.v1": { ruleId: "name.semantic-five-elements.v1", label: "姓名语义五行人工审校", appliesWhen: "姓名字义与采用字形已经人工确认", sourceType: "product-method", version: "1.0.0", references: ["只覆盖有限人工审校字集", "五元素向量与 unknownShare 分开记录", "不从部首、笔画或国家规范推导汉字五行"], accessDate: "2026-07-22" },
  "name.reality-score.v1": { ruleId: "name.reality-score.v1", label: "姓名现实使用实测规则", appliesWhen: "用户自愿完成四项现实场景验证", sourceType: "product-method", version: "1.0.0", references: ["四项固定分值直接相加", "任一项未验证时不显示总分", "资料覆盖、文化向量与命盘并读均不加分"], accessDate: "2026-07-22" },
  "name.advice-gate.v1": { ruleId: "name.advice-gate.v1", label: "姓名建议保守门禁", appliesWhen: "资料口径已确认并且现实使用风险由人工与用户共同确认", sourceType: "product-method", version: "1.0.0", references: ["资料缺口只阻断结论", "建议档位只读取共同确认的现实硬风险", "分数和命盘文化并读不改变建议档位"], accessDate: "2026-07-22" },
};

export const YI_REFERENCE_SOURCES: Record<string, ReferenceSource> = {
  "calendar.gb-t-33661-2017": {
    id: "calendar.gb-t-33661-2017",
    grade: "A",
    title: "GB/T 33661-2017 农历的编算和颁行",
    url: "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296",
    role: "用于核对农历编算和颁行的国家标准身份，不承担人格解释。",
    boundary: "国家标准支持历法坐标，不支持生肖性格或人生事件预测。",
    editionNote: "国家市场监督管理总局国家标准全文公开系统收录页；按标准正文与产品解释分开使用。",
    accessDate: "2026-07-20",
  },
  "classic.san-ming-tong-hui": {
    id: "classic.san-ming-tong-hui",
    grade: "A/B",
    title: "三命通会",
    url: "https://www.shidianguji.com/zh/book/HY1521/chapter/1knwelu5suaf3",
    role: "用于十二支属相、干支关系和岁运术语的古籍脉络核对。",
    boundary: "古籍目录与规则是文化框架，不把单一属相改写成确定人格。",
    editionNote: "与传统目录采用同一识典古籍正文入口；具体卷次与影印页仍需逐条互校。",
    accessDate: "2026-07-17",
  },
  "classic.di-tian-sui": {
    id: "classic.di-tian-sui",
    grade: "A/B",
    title: "滴天髓辑要",
    url: "https://www.shidianguji.com/book/NMG41601JH000040/chapter/1lly6pm5s2joo",
    role: "用于日干、地支、藏干、季节强弱和全局配合的传统语言。",
    boundary: "强调配合与进退，不摘取单句作为吉凶保证或现实诊断。",
    editionNote: "与传统目录采用同一识典古籍《滴天髓辑要》入口；原文与辑订阐释分层。",
    accessDate: "2026-07-17",
  },
  "culture.zodiac-national-museum": {
    id: "culture.zodiac-national-museum",
    grade: "B",
    title: "中国国家博物馆：人化的生肖",
    url: "https://www.chnmuseum.cn/yj/xscg/xslw/201812/t20181224_33168.shtml",
    role: "用于十二动物与十二地支相配及生肖艺术、民俗演变的文化背景。",
    boundary: "民俗与文物资料不等于现代心理测量，也不证明未来预测。",
    editionNote: "中国国家博物馆学术文章；用于文化背景而非个体性格证据。",
    accessDate: "2026-07-20",
  },
  "culture.nasa-constellations": {
    id: "culture.nasa-constellations",
    grade: "B",
    title: "NASA: What Are Constellations?",
    url: "https://spaceplace.nasa.gov/constellations/sp/",
    role: "用于区分天文学星座、文化图像与占星表达的不同层次。",
    boundary: "NASA 明确区分天文学与占星；星座人格说法不属于科学证据。",
    editionNote: "NASA Space Place 科普页；用于天文学概念边界，不为占星人格提供科学背书。",
    accessDate: "2026-07-20",
  },
  "standard.tgh-table": {
    id: "standard.tgh-table",
    grade: "A",
    title: "教育部《通用规范汉字表》",
    url: "https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/201306/t20130601_186002.html",
    role: "用于确定通用规范汉字的 8105 字范围、顺序、三级边界和人名用字规范背景。",
    boundary: "国家字表只支持规范字范围与序号，不支持姓名吉凶、汉字五行或人生结果。",
    editionNote: "2013 年发布页；生成资产另以教育部 GF 0023-2020 PDF 的《字表》序号/UCS 列逐项复核。",
    accessDate: "2026-07-22",
  },
  "standard.tgh-implementation": {
    id: "standard.tgh-implementation",
    grade: "A",
    title: "教育部等十二部门关于贯彻实施《通用规范汉字表》的通知",
    url: "https://www.moe.gov.cn/srcsite/A19/s229/201310/t20131015_159487.html",
    role: "用于说明通用规范汉字表在教育、公共服务和新命名更名等场景中的实施口径。",
    boundary: "实施通知不保证每个字体、输入法或业务系统都能正确显示所有规范字，也不支持姓名评价。",
    editionNote: "教语信〔2013〕2 号实施通知；按教育部现有公开页面核对。",
    accessDate: "2026-07-22",
  },
  "standard.tgh-variants": {
    id: "standard.tgh-variants",
    grade: "A/B",
    title: "教育部《汉字规范的科学化》",
    url: "https://www.moe.gov.cn/jyb_xwfb/xw_fbh/moe_2069/s7135/s7562/s7569/201308/t20130827_156343.html",
    role: "用于说明《通用规范汉字表》附表的简繁对应、一简多繁分解与规范化原则。",
    boundary: "简繁对应必须结合具体义项确认；该来源不授权静默换写现实登记字形，也不等同于康熙字形。",
    editionNote: "2013 年教育部新闻发布会背景材料；与正式字表附表结合使用。",
    accessDate: "2026-07-22",
  },
  "unicode.uax38": {
    id: "unicode.uax38",
    grade: "A",
    title: "Unicode Standard Annex #38: Unicode Han Database",
    url: "https://www.unicode.org/reports/tr38/",
    role: "用于解释 Unihan 数据文件、属性类型、变体关系、检字字段和工程状态。",
    boundary: "Unihan 属性是字符工程数据；读音、变体、部首与总笔画均不能直接证明姓名含义或汉字五行。",
    editionNote: "Unicode 17.0.0，UAX #38 Revision 39；属性语义按该版本核对。",
    accessDate: "2026-07-22",
  },
  "unicode.unihan-17.data": {
    id: "unicode.unihan-17.data",
    grade: "A",
    title: "Unicode 17.0.0 Unihan.zip",
    url: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
    role: "用于生成 kTGH、kTGHZ2013、kMandarin、kRSUnicode、kTotalStrokes 和简繁候选的离线工程数据。",
    boundary: "kRSUnicode 是可多值检字记录，kTotalStrokes 是 informative 工程记录，简繁字段为 provisional；这些都不是汉字五行。",
    editionNote: "Unicode 17.0.0 数据快照；ZIP SHA-256 为 f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e。",
    accessDate: "2026-07-22",
  },
  "unicode.license-v3": {
    id: "unicode.license-v3",
    grade: "A",
    title: "Unicode License V3",
    url: "https://www.unicode.org/license.txt",
    role: "用于记录随派生 Unihan 数据再分发所适用的版权与许可声明。",
    boundary: "许可允许按条件使用和分发数据，但不为产品结论、数据正确性或特定用途提供保证。",
    editionNote: "UNICODE LICENSE V3；完整通知保存在 site/THIRD_PARTY_NOTICES.md。",
    accessDate: "2026-07-22",
  },
  "law.civil-code-name-rights": {
    id: "law.civil-code-name-rights",
    grade: "A",
    title: "中华人民共和国民法典姓名权相关条款",
    url: "https://www.court.gov.cn/zixun/xiangqing/233181.html",
    role: "用于说明姓名权、姓氏选择和姓名变更后依法登记等基本法律边界。",
    boundary: "民法典不保证具体改名申请必然获批，产品也不替代户籍机关的个案办理要求。",
    editionNote: "重点使用第一千零一十二、一千零一十五和第一千零一十六条；现行公开文本。",
    accessDate: "2026-07-22",
  },
  "classic.zuozhuan-naming": {
    id: "classic.zuozhuan-naming",
    grade: "A/B",
    title: "《左传·桓公六年》命名材料",
    url: "https://ctext.org/chun-qiu-zuo-zhuan/huan-gong-liu-nian/zhs",
    role: "用于呈现信、义、象、假、类及命名避讳的古典命名文化背景。",
    boundary: "古典命名材料不提供现代姓名分数、Unicode 字形映射或每字唯一五行表。",
    editionNote: "中国哲学书电子化计划公开文本；用于文化原文定位，版本异文仍需纸本互校。",
    accessDate: "2026-07-22",
  },
  "classic.liji-quli-naming": {
    id: "classic.liji-quli-naming",
    grade: "A/B",
    title: "《礼记·曲礼上》命名避讳材料",
    url: "https://ctext.org/text.pl?if=gb&node=9516&show=parallel",
    role: "用于呈现古代命名和避讳的礼制语境，不直接转成现代评分。",
    boundary: "礼制文本不规定现代户籍登记结果，也不支持姓名改变命运或每字唯一五行。",
    editionNote: "中国哲学书电子化计划中英对照公开文本；用于原文定位与文化说明。",
    accessDate: "2026-07-22",
  },
  "classic.shangshu-hongfan-five-elements": {
    id: "classic.shangshu-hongfan-five-elements",
    grade: "A/B",
    title: "《尚书·洪范》五行材料",
    url: "https://ctext.org/shang-shu/great-plan",
    role: "用于水、火、木、金、土及润下、炎上、曲直、从革、稼穑的文化母题。",
    boundary: "原典没有现代 8105 字逐字五行表；产品的字符向量必须另行标为人工审校规则。",
    editionNote: "中国哲学书电子化计划公开文本；仅作五行母题和术语背景。",
    accessDate: "2026-07-22",
  },
  "classic.liji-yueling-five-elements": {
    id: "classic.liji-yueling-five-elements",
    grade: "A/B",
    title: "《礼记·月令》五音与时令材料",
    url: "https://ctext.org/liji/yue-ling",
    role: "用于说明古代五音、时令与五行配属的历史文化体系。",
    boundary: "古代五音体系不能机械换算现代普通话声母，也不能直接生成姓名五行得分。",
    editionNote: "中国哲学书电子化计划公开文本；用于体系边界与历史语境。",
    accessDate: "2026-07-22",
  },
  "academic.five-grid-history": {
    id: "academic.five-grid-history",
    grade: "B",
    title: "王治理《中日姓名预测学漫谈及比较》",
    url: "https://core.ac.uk/download/41439923.pdf",
    role: "用于追溯近现代五格剖象与中日姓名预测方法的历史传播背景。",
    boundary: "五格属于近现代文化附录，不是中国古法，不进入主分，也不作为改名建议门禁。",
    editionNote: "公开学术论文下载页；仅用于方法史定位，不为预测效力背书。",
    accessDate: "2026-07-22",
  },
  "mps.name-report-2021": {
    id: "mps.name-report-2021",
    grade: "A/B",
    title: "公安部户政管理研究中心《二〇二一年全国姓名报告》",
    url: "https://gat.hunan.gov.cn/gat/jwgk/jwzx/gabyw/202201/t20220126_22471460.html",
    role: "仅用于选择高频姓名字的首版人工审校覆盖样本，并提示流行度与重名风险。",
    boundary: "报告中的频次不代表名字质量、性别适配、文化五行或个体人生结果。",
    editionNote: "公安部户政管理研究中心 2021 年报告的政府网站公开转载页。",
    accessDate: "2026-07-22",
  },
  "mps.same-name-service": {
    id: "mps.same-name-service",
    grade: "A",
    title: "公安部互联网政务服务平台",
    url: "https://ywtb.mps.gov.cn/",
    role: "作为用户主动离站查询同名信息的官方服务入口，不预填姓名。",
    boundary: "登录、实名认证和离站后的数据处理由公安部平台负责；本产品不代查，也不保证服务结果。",
    editionNote: "公安部互联网政务服务平台入口；访问前应展示离站与隐私提示。",
    accessDate: "2026-07-22",
  },
};

export type UnifiedSource = {
  id: string;
  title: string;
  category: string;
  grade: string;
  url: string;
  role: string;
  editionNote: string;
  boundary: string;
  accessDate: string;
};

const LIBRARY_URL = "https://github.com/6tail/lunar-typescript";

function ruleSource(rule: RuleSource): UnifiedSource {
  const isLibrary = rule.sourceType === "library-calculation";
  const isClassical = rule.sourceType === "classical-framework";
  const isProductMethod = rule.sourceType === "product-method";
  return {
    id: rule.ruleId,
    title: `${rule.label}${isLibrary ? "计算来源记录" : isClassical ? "框架来源记录" : "产品方法记录"}`,
    category: isLibrary ? "计算库" : isClassical ? "传统框架" : isProductMethod ? "产品方法" : "产品启发式",
    grade: isLibrary ? "A" : isClassical ? "A/B" : "产品方法",
    url: isLibrary ? LIBRARY_URL : "",
    role: isLibrary
      ? `用于 ${rule.appliesWhen} 的程序计算；不承担传统文本解释。`
      : isClassical
        ? `用于 ${rule.appliesWhen} 的关系术语框架核对；不等同于单句断语。`
        : isProductMethod
          ? `产品维护的 ${rule.appliesWhen} 规则与转译方法；不声称逐条得到古籍原文证明。`
          : `产品原创的 ${rule.appliesWhen} 观察方法；只用于行动提示，不是古典权威。`,
    editionNote: isLibrary
      ? `计算依赖版本：${rule.version}；规则说明与库实现分开维护。`
      : isClassical
        ? `传统框架记录版本：${rule.version}；仅用于术语脉络，具体规则需另行绑定可核卷次与页码。`
        : `产品自有方法版本：${rule.version}；不引用或改写第三方现代人格文案。`,
    boundary: isLibrary
      ? "计算结果只提供历法与干支坐标，不能直接推出人格、健康或人生事件。"
      : isClassical
        ? "传统框架只作文化与结构核对，不作吉凶保证、医学判断或确定性预测。"
        : isProductMethod
          ? "产品方法由团队维护，只用于结构核对、生活转译与行动练习；不冒充古籍原文、科学测量或确定性预测。"
          : "产品启发式仅作自我观察和行动练习，不冒充古籍原文或科学测量结论。",
    accessDate: rule.accessDate ?? "2026-07-20",
  };
}

type IdentityCandidate = {
  id: string;
  name: string;
  sourceReferences: string[];
  filmTitle?: string;
  characterName?: string;
};

function identitySource(candidate: IdentityCandidate, category: "历史人物镜像" | "电影角色镜像"): UnifiedSource {
  const isMovie = category === "电影角色镜像";
  const filmTitle = candidate.filmTitle ?? candidate.name.split("·")[0];
  const characterName = candidate.characterName ?? candidate.name.split("·")[1];
  return {
    id: candidate.id,
    title: isMovie ? `电影《${filmTitle}》角色“${characterName}”身份来源` : `${candidate.name}人物公开身份记录`,
    category,
    grade: "B",
    url: isMovie ? movieIdentityUrls[candidate.id] ?? "" : historicalIdentityUrls[candidate.id] ?? "",
    role: isMovie
      ? `仅用于核对电影《${filmTitle}》与角色“${characterName}”的对应身份；所有人格比较均为产品原创。`
      : `仅用于核对历史人物${candidate.name}的身份和可公开核验的作品或档案线索；比较文字为产品原创。`,
    editionNote: isMovie
      ? `对应镜像候选 ${candidate.id}；IMDb 影片专页标识于 2026-07-20 核对。`
      : `对应镜像候选 ${candidate.id}；身份线索于 2026-07-20 按所列公开记录核对。`,
    boundary: isMovie
      ? "不复制剧情、对白、影评或角色人格文本；不把虚构角色当作现实人格诊断。"
      : "不以人物经历推断用户命运，不复制传记文案，也不将单一人物经验当作普遍规律。",
    accessDate: "2026-07-20",
  };
}

const animalIdentityUrls: Record<string, string> = {
  "animal-albatross": "https://www.britannica.com/animal/albatross",
  "animal-bottlenose-dolphin": "https://www.fisheries.noaa.gov/species/common-bottlenose-dolphin",
  "animal-elephant-herd": "https://nationalzoo.si.edu/animals/african-elephant",
  "animal-gray-wolf": "https://nationalzoo.si.edu/animals/gray-wolf",
  "animal-green-sea-turtle": "https://www.fisheries.noaa.gov/species/green-turtle",
  "animal-honeybee-colony": "https://www.si.edu/spotlight/buginfo/honey-bee",
  "animal-manatee": "https://www.fws.gov/species/manatee-trichechus-manatus",
  "animal-meerkat": "https://nationalzoo.si.edu/animals/meerkat",
  "animal-orca-pod": "https://www.fisheries.noaa.gov/species/killer-whale",
  "animal-peregrine-falcon": "https://www.allaboutbirds.org/guide/Peregrine_Falcon/overview",
  "animal-giant-pacific-octopus": "https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/giant-pacific-octopus",
  "animal-red-crowned-crane": "https://savingcranes.org/species-field-guide/red-crowned-crane/",
  "animal-sloth": "https://nationalzoo.si.edu/animals/two-toed-sloth",
  "animal-snow-leopard": "https://nationalzoo.si.edu/animals/snow-leopard",
  "animal-wild-goose-flock": "https://www.allaboutbirds.org/guide/Greater_White-fronted_Goose/overview",
};

function animalIdentitySource(candidate: IdentityCandidate): UnifiedSource {
  return {
    id: candidate.id,
    title: `${candidate.name}动物行为公开参考`,
    category: "动物行为镜像",
    grade: "B",
    url: animalIdentityUrls[candidate.id],
    role: `仅用于核对${candidate.name}的物种与行为参考；镜像比较和行动文字为产品原创。`,
    editionNote: `对应镜像候选 ${candidate.id}；参考目录：${candidate.sourceReferences.join("；")}。`,
    boundary: "动物行为只能作为隐喻素材，不作为人格诊断、能力测量或命运判断。",
    accessDate: "2026-07-22",
  };
}

const historicalIdentityUrls: Record<string, string> = {
  "historical-confucius": "https://www.wikidata.org/wiki/Q4604",
  "historical-florence-nightingale": "https://www.nationalarchives.gov.uk/education/resources/florence-nightingale/",
  "historical-gandhi": "https://www.wikidata.org/wiki/Q1001",
  "historical-helen-keller": "https://www.afb.org/about-afb/history/helen-keller",
  "historical-li-qingzhao": "https://www.wikidata.org/wiki/Q464470",
  "historical-marie-curie": "https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/",
  "historical-nelson-mandela": "https://www.nelsonmandela.org/biography-timeline",
  "historical-sima-guang": "https://www.wikidata.org/wiki/Q33566",
  "historical-sima-qian": "https://www.wikidata.org/wiki/Q9372",
  "historical-su-shi": "https://www.dpm.org.cn/lemmas/242068.html",
  "historical-tao-yuanming": "https://www.wikidata.org/wiki/Q314210",
  "historical-wang-yangming": "https://museum.shqp.gov.cn/museum/zlhg/20210930/892111.html",
  "historical-xu-xiake": "https://www.dpm.org.cn/lemmas/241596.html",
  "historical-xuanzang": "https://www.wikidata.org/wiki/Q42063",
  "historical-zhang-qian": "https://www.wikidata.org/wiki/Q197276",
};

const movieIdentityUrls: Record<string, string> = {
  "movie-cn-ne-zha": "https://www.imdb.com/title/tt10627720/",
  "movie-cn-zhang-mazi": "https://www.imdb.com/title/tt1533117/",
  "movie-cn-ma-youtie": "https://www.imdb.com/title/tt17097088/",
  "movie-cn-liu-peiqiang": "https://www.imdb.com/title/tt7605074/",
  "movie-cn-cheng-dongqing": "https://www.imdb.com/title/tt2278392/",
  "movie-cn-jingqiu": "https://www.imdb.com/title/tt1554523/",
  "movie-cn-jia-xiaoling": "https://www.imdb.com/title/tt13364790/",
  "movie-cn-cheng-yong": "https://www.imdb.com/title/tt7362036/",
  "movie-cn-lang-ping": "https://www.imdb.com/title/tt10670442/",
  "movie-hk-song-zihao": "https://www.imdb.com/title/tt0092263/",
  "movie-hk-chan-kakweui": "https://www.imdb.com/title/tt0089374/",
  "movie-hk-yuddy": "https://www.imdb.com/title/tt0101258/",
  "movie-hk-chen-yongren": "https://www.imdb.com/title/tt0338564/",
  "movie-hk-li-qiao": "https://www.imdb.com/title/tt0117905/",
  "movie-hk-su-lizhen": "https://www.imdb.com/title/tt0118694/",
  "movie-hk-sing": "https://www.imdb.com/title/tt0286112/",
  "movie-hk-tao-jie": "https://www.imdb.com/title/tt2008006/",
  "movie-hk-luo-jiner": "https://www.imdb.com/title/tt1602572/",
  "movie-asia-kim-kiwoo": "https://www.imdb.com/title/tt6751668/",
  "movie-asia-osamu-shibata": "https://www.imdb.com/title/tt8075192/",
  "movie-asia-lee-jongsu": "https://www.imdb.com/title/tt7282468/",
  "movie-asia-kobayashi-daigo": "https://www.imdb.com/title/tt1069238/",
  "movie-asia-rancho": "https://www.imdb.com/title/tt1187043/",
  "movie-asia-simin": "https://www.imdb.com/title/tt1832382/",
  "movie-asia-chihiro": "https://www.imdb.com/title/tt0245429/",
  "movie-asia-shimada-kanbei": "https://www.imdb.com/title/tt0047478/",
  "movie-asia-geeta-phogat": "https://www.imdb.com/title/tt5074352/",
  "movie-west-michael-corleone": "https://www.imdb.com/title/tt0068646/",
  "movie-west-maximus": "https://www.imdb.com/title/tt0172495/",
  "movie-west-furiosa": "https://www.imdb.com/title/tt1392190/",
  "movie-west-forrest-gump": "https://www.imdb.com/title/tt0109830/",
  "movie-west-katherine-johnson": "https://www.imdb.com/title/tt4846340/",
  "movie-west-will-hunting": "https://www.imdb.com/title/tt0119217/",
  "movie-west-andy-dufresne": "https://www.imdb.com/title/tt0111161/",
  "movie-west-erin-brockovich": "https://www.imdb.com/title/tt0195685/",
  "movie-west-frodo-baggins": "https://www.imdb.com/title/tt0120737/",
};

function traditionalSource(source: import("./traditional-sources").TraditionalSource): UnifiedSource {
  const accessDate = source.editionNote.match(/20\d{2}-\d{2}-\d{2}/)?.[0] ?? "2026-07-20";
  return {
    id: source.id,
    title: source.title,
    category: source.category,
    grade: source.grade,
    url: source.url,
    role: source.usage,
    editionNote: source.editionNote,
    boundary: source.boundary,
    accessDate,
  };
}

function referenceSource(source: ReferenceSource): UnifiedSource {
  return {
    id: source.id,
    title: source.title,
    category: "公开参考",
    grade: source.grade,
    url: source.url,
    role: source.role,
    editionNote: source.editionNote,
    boundary: source.boundary,
    accessDate: source.accessDate,
  };
}

export function getAllSources(): UnifiedSource[] {
  const registry = new Map<string, UnifiedSource>();
  const add = (source: UnifiedSource, replace = false) => {
    if (replace || !registry.has(source.id)) registry.set(source.id, source);
  };

  Object.values(YI_RULE_SOURCES).forEach(rule => add(ruleSource(rule)));
  Object.values(YI_REFERENCE_SOURCES).forEach(source => add(referenceSource(source)));
  Object.values(TRADITIONAL_SOURCE_CATALOG).forEach(source => add(traditionalSource(source), true));
  ANIMAL_MIRRORS.forEach(candidate => add(animalIdentitySource(candidate)));
  HISTORICAL_MIRRORS.forEach(candidate => add(identitySource(candidate, "历史人物镜像")));
  MOVIE_CHARACTERS.forEach(candidate => add(identitySource(candidate, "电影角色镜像")));
  add({
    id: "model.western-astrology-element-modality",
    title: "西方占星元素与模式分类",
    category: "现代占星文化模型",
    grade: "B",
    url: "",
    role: "产品分类约定，用于组织十二太阳星座的元素与模式分组；具体档案比较文字为产品原创。",
    editionNote: "产品分类约定版本 1.0；无外部分类依据，NASA 仅保留在独立公开参考中说明科学边界。",
    boundary: "元素与模式属于现代占星文化分类，不是科学人格测量，也不能预测未来。",
    accessDate: "2026-07-20",
  });
  return [...registry.values()];
}
