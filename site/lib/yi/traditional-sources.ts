export type TraditionalSource = {
  id: string;
  title: string;
  category: "子平" | "相学" | "象数";
  grade: "A/B" | "B";
  usage: string;
  editionNote: string;
  url: string;
  boundary: string;
};

export const TRADITIONAL_SOURCE_CATALOG: Record<string, TraditionalSource> = {
  "classic.yuan-hai-zi-ping": {
    id: "classic.yuan-hai-zi-ping",
    title: "渊海子平",
    category: "子平",
    grade: "A/B",
    usage: "用于干支、十神、六亲、格局等子平术语的历史脉络核对",
    editionNote: "识典古籍《新刊合并官板音义评注渊海子平》，页面标注宋徐升撰；访问于 2026-07-17，异文仍须与影印本互校",
    url: "https://www.shidianguji.com/book/NGJ892411999032112149610/chapter/1lqbrsabl0vfe",
    boundary: "原典规则与现代产品解释分栏呈现，不照搬古代身份、性别与社会等级评价",
  },
  "classic.di-tian-sui": {
    id: "classic.di-tian-sui",
    title: "滴天髓",
    category: "子平",
    grade: "A/B",
    usage: "用于干支轻重、根气、流通、顺逆与全局关系的传统语言核对",
    editionNote: "识典古籍《滴天髓辑要》，页面标注清陈素庵辑订；访问于 2026-07-17，需区分原文与辑订阐释",
    url: "https://www.shidianguji.com/book/NMG41601JH000040/chapter/1lly6pm5s2joo",
    boundary: "不将后世注解冒充原文，也不以单句直接推出人格、健康或人生事件",
  },
  "classic.zi-ping-zhen-quan": {
    id: "classic.zi-ping-zhen-quan",
    title: "子平真诠",
    category: "子平",
    grade: "A/B",
    usage: "用于月令、格局、相神和成败救应等规则链的专业梳理",
    editionNote: "区分沈氏原文、耕寸集系统与徐乐吾等后世评注；可靠公开底本待补录",
    url: "",
    boundary: "格局判断必须满足完整条件，不能只凭一个十神名称或单一柱位下结论",
  },
  "classic.qiong-tong-bao-jian": {
    id: "classic.qiong-tong-bao-jian",
    title: "穷通宝鉴",
    category: "子平",
    grade: "A/B",
    usage: "用于季节调候以及寒暖燥湿等传统观察口径的章节核对",
    editionNote: "注意栏江网、造化元钥与穷通宝鉴之间的版本流变；可靠公开底本待补录",
    url: "",
    boundary: "调候语言不转换为健康诊断、食疗建议或必然发生的人生事件",
  },
  "classic.san-ming-tong-hui": {
    id: "classic.san-ming-tong-hui",
    title: "三命通会",
    category: "子平",
    grade: "A/B",
    usage: "用于五行、干支、神煞源流及不同命理口径之间的交叉核验",
    editionNote: "识典古籍《三命通会》目录与正文页，访问于 2026-07-17；仍需与具体卷次和影印页互校",
    url: "https://www.shidianguji.com/zh/book/HY1521/chapter/1knwelu5suaf3",
    boundary: "主盘优先使用结构规则，神煞不单独决定结论，古代命例不直接套用现代用户",
  },
  "classic.ma-yi-shen-xiang": {
    id: "classic.ma-yi-shen-xiang",
    title: "麻衣神相",
    category: "相学",
    grade: "A/B",
    usage: "用于面部区域、五官形态、痣位与手相传统术语的图谱索引",
    editionNote: "识典古籍《新刊图相麻衣相法》，页面标注明代佚名编纂；访问于 2026-07-17，托名与增补内容逐条标记",
    url: "https://www.shidianguji.com/zh/book/NGJ89241199903149974518/chapter/1lq8kgst6u23s",
    boundary: "仅供标准图谱自查和文化阅读，不判断身份、民族、健康、寿命、犯罪倾向或人格优劣",
  },
  "classic.zhou-yi": {
    id: "classic.zhou-yi",
    title: "周易",
    category: "象数",
    grade: "A/B",
    usage: "用于变化、时位、关系与象数语言的文化来源和术语核对",
    editionNote: "中国哲学书电子化计划《周易》经传分章全文，访问于 2026-07-17；经文、十翼及后世解释分层引用",
    url: "https://ctext.org/book-of-changes/zh",
    boundary: "不把卦象混入四柱计算，也不用宽泛哲理冒充具体命盘的计算依据",
  },
  "classic.mei-hua-yi-shu": {
    id: "classic.mei-hua-yi-shu",
    title: "梅花易数",
    category: "象数",
    grade: "B",
    usage: "用于象数观察方法以及场景联想结构的历史语言参考",
    editionNote: "识典古籍《易学四同别录》所收《梅花数》页面，访问于 2026-07-17；书名、版本及邵雍作者归属保持审慎",
    url: "https://www.shidianguji.com/book/7398438943139561524/chapter/1kbmc0gwj26fv",
    boundary: "本产品不根据八字自动起卦，不混算卦象与四柱，也不据随机象数预测具体事件",
  },
  "classic.shen-feng-tong-kao": {
    id: "classic.shen-feng-tong-kao",
    title: "神峰通考",
    category: "子平",
    grade: "B",
    usage: "用于病药、动静以及命例推理步骤的传统口径对照研究",
    editionNote: "不同刻本和现代整理本内容差异需记录；可靠公开全文或影印底本待补录",
    url: "",
    boundary: "命例只提炼可复核的规则链，不复制身份生辰，也不外推现代用户的疾病或事件",
  },
  "classic.ming-li-yue-yan": {
    id: "classic.ming-li-yue-yan",
    title: "命理约言",
    category: "子平",
    grade: "B",
    usage: "用于清代命理术语整理以及简要判断口径的交叉核验",
    editionNote: "陈素庵相关版本需记录卷次、条目与整理者；可靠公开全文或影印底本待补录",
    url: "",
    boundary: "只在与主规则一致或明确标注分歧时使用，不用约言替代完整结构判断",
  },
};

export function getTraditionalSource(id: string) {
  return TRADITIONAL_SOURCE_CATALOG[id];
}
