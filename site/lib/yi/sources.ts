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
  },
  "classic.san-ming-tong-hui": {
    id: "classic.san-ming-tong-hui",
    grade: "A/B",
    title: "三命通会",
    url: "https://www.shidianguji.com/zh/book/HY1521/chapter/1knwelu5suaf3",
    role: "用于十二支属相、干支关系和岁运术语的古籍脉络核对。",
    boundary: "古籍目录与规则是文化框架，不把单一属相改写成确定人格。",
  },
  "classic.di-tian-sui": {
    id: "classic.di-tian-sui",
    grade: "A/B",
    title: "滴天髓辑要",
    url: "https://www.shidianguji.com/book/NMG41601JH000040/chapter/1lly6pm5s2joo",
    role: "用于日干、地支、藏干、季节强弱和全局配合的传统语言。",
    boundary: "强调配合与进退，不摘取单句作为吉凶保证或现实诊断。",
  },
  "culture.zodiac-national-museum": {
    id: "culture.zodiac-national-museum",
    grade: "B",
    title: "中国国家博物馆：人化的生肖",
    url: "https://www.chnmuseum.cn/yj/xscg/xslw/201812/t20181224_33168.shtml",
    role: "用于十二动物与十二地支相配及生肖艺术、民俗演变的文化背景。",
    boundary: "民俗与文物资料不等于现代心理测量，也不证明未来预测。",
  },
  "culture.nasa-constellations": {
    id: "culture.nasa-constellations",
    grade: "B",
    title: "NASA: What Are Constellations?",
    url: "https://spaceplace.nasa.gov/constellations/sp/",
    role: "用于区分天文学星座、文化图像与占星表达的不同层次。",
    boundary: "NASA 明确区分天文学与占星；星座人格说法不属于科学证据。",
  },
};
