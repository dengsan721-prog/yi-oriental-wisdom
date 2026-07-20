export type RuleSource = {
  ruleId: string;
  label: string;
  appliesWhen: string;
  sourceType: "library-calculation" | "classical-framework" | "product-heuristic";
  version: string;
  references: readonly string[];
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
  "relation.gan-zhi.v1": { ruleId: "relation.gan-zhi.v1", label: "干支关系完整规则表", appliesWhen: "两支关系需两处已知坐标；三合与三刑需三支齐全；自刑需同一地支出现在两处已知坐标", sourceType: "classical-framework", version: "1.1.0", references: ["天干五合表：甲己、乙庚、丙辛、丁壬、戊癸", "地支六合表：子丑、寅亥、卯戌、辰酉、巳申、午未", "地支三合表：申子辰水局、亥卯未木局、寅午戌火局、巳酉丑金局", "地支六冲表：子午、丑未、寅申、卯酉、辰戌、巳亥", "地支相刑规则：子卯相刑；寅巳申三刑；丑戌未三刑；辰午酉亥自刑", "地支六害表：子未、丑午、寅巳、卯辰、申亥、酉戌", "地支六破表：子酉、卯午、辰丑、戌未、寅亥、巳申"] },
  "climate.season-prompt.v1": { ruleId: "climate.season-prompt.v1", label: "月令调候提示", appliesWhen: "标准八字月支已知", sourceType: "product-heuristic", version: "1.0.0", references: ["寒暖燥湿框架", "仅作生活节律提示，不作调候用神结论"] },
  "structure.support-score.v2": { ruleId: "structure.support-score.v2", label: "五行支持度结构观察", appliesWhen: "至少三柱已知", sourceType: "product-heuristic", version: "2.0.0", references: ["干支主五行计数；月柱双权重", "非古籍格局或喜忌判定"] },
  "domain.mapping.v2": { ruleId: "domain.mapping.v2", label: "生活主题映射", appliesWhen: "命盘结构字段已生成", sourceType: "product-heuristic", version: "2.0.0", references: ["七主题独立选择器", "用于自我观察，不预测具体事件"] },
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
const CLASSICAL_FRAMEWORK_URL = "https://ctext.org/book-of-changes/zh";
const PRODUCT_METHOD_URL = "https://github.com/6tail/lunar-typescript";

function ruleSource(rule: RuleSource): UnifiedSource {
  const isLibrary = rule.sourceType === "library-calculation";
  const isClassical = rule.sourceType === "classical-framework";
  return {
    id: rule.ruleId,
    title: rule.label,
    category: isLibrary ? "计算库" : isClassical ? "传统框架" : "产品启发式",
    grade: isLibrary ? "A" : isClassical ? "A/B" : "产品方法",
    url: isLibrary ? LIBRARY_URL : isClassical ? CLASSICAL_FRAMEWORK_URL : PRODUCT_METHOD_URL,
    role: isLibrary
      ? `用于 ${rule.appliesWhen} 的程序计算；不承担传统文本解释。`
      : isClassical
        ? `用于 ${rule.appliesWhen} 的关系术语框架核对；不等同于单句断语。`
        : `产品原创的 ${rule.appliesWhen} 观察方法；只用于行动提示，不是古典权威。`,
    editionNote: isLibrary
      ? `计算依赖版本：${rule.version}；规则说明与库实现分开维护。`
      : isClassical
        ? `本地规则表版本：${rule.version}；仅保留可复核的关系条件。`
        : `产品方法版本：${rule.version}；不引用或改写第三方现代人格文案。`,
    boundary: isLibrary
      ? "计算结果只提供历法与干支坐标，不能直接推出人格、健康或人生事件。"
      : isClassical
        ? "传统框架只作文化与结构核对，不作吉凶保证、医学判断或确定性预测。"
        : "产品启发式仅作自我观察和行动练习，不冒充古籍原文或科学测量结论。",
    accessDate: "2026-07-20",
  };
}

function identitySource(candidate: { id: string; name: string; sourceReferences: string[] }, category: "历史人物镜像" | "电影角色镜像"): UnifiedSource {
  const isMovie = category === "电影角色镜像";
  const searchTerm = isMovie ? candidate.name.split("·")[0] : candidate.name;
  return {
    id: candidate.id,
    title: `${candidate.name}身份来源`,
    category,
    grade: "B",
    url: isMovie ? `https://www.imdb.com/find/?q=${encodeURIComponent(searchTerm)}` : historicalIdentityUrls[candidate.id] ?? "https://ctext.org/",
    role: isMovie
      ? "仅用于核对影片与角色身份；角色比较与所有人格表达均为产品原创。"
      : "仅用于核对历史人物身份和可公开核验的作品或档案线索；比较文字为产品原创。",
    editionNote: `对应镜像候选 ${candidate.id}；原始线索：${candidate.sourceReferences.join("；")}。`,
    boundary: isMovie
      ? "不复制剧情、对白、影评或角色人格文本；不把虚构角色当作现实人格诊断。"
      : "不以人物经历推断用户命运，不复制传记文案，也不将单一人物经验当作普遍规律。",
    accessDate: "2026-07-20",
  };
}

const historicalIdentityUrls: Record<string, string> = {
  "historical-confucius": "https://www.unesco.org/en/memory-world/confucius",
  "historical-florence-nightingale": "https://www.nationalarchives.gov.uk/education/resources/florence-nightingale/",
  "historical-gandhi": "https://www.gandhiheritageportal.org/",
  "historical-helen-keller": "https://www.afb.org/about-afb/history/helen-keller",
  "historical-li-qingzhao": "https://ctext.org/",
  "historical-marie-curie": "https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/",
  "historical-nelson-mandela": "https://www.nelsonmandela.org/content/page/timeline",
  "historical-sima-guang": "https://ctext.org/wiki.pl?if=gb&res=956454",
  "historical-sima-qian": "https://ctext.org/shiji",
  "historical-su-shi": "https://ctext.org/",
  "historical-tao-yuanming": "https://ctext.org/",
  "historical-wang-yangming": "https://ctext.org/",
  "historical-xu-xiake": "https://ctext.org/",
  "historical-xuanzang": "https://ctext.org/",
  "historical-zhang-qian": "https://ctext.org/",
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
  HISTORICAL_MIRRORS.forEach(candidate => add(identitySource(candidate, "历史人物镜像")));
  MOVIE_CHARACTERS.forEach(candidate => add(identitySource(candidate, "电影角色镜像")));
  add({
    id: "model.western-astrology-element-modality",
    title: "西方占星元素与模式分类",
    category: "现代占星文化模型",
    grade: "B",
    url: "https://spaceplace.nasa.gov/constellations/sp/",
    role: "用于说明十二太阳星座的元素与模式分组；具体档案的比较文字为产品原创。",
    editionNote: "以静态本地分类表呈现；NASA 页面仅支持天文学与占星概念边界。",
    boundary: "元素与模式属于现代占星文化分类，不是科学人格测量，也不能预测未来。",
    accessDate: "2026-07-20",
  });
  return [...registry.values()];
}
import { HISTORICAL_MIRRORS } from "./historical-mirrors";
import { MOVIE_CHARACTERS } from "./movie-characters";
import { TRADITIONAL_SOURCE_CATALOG } from "./traditional-sources";
