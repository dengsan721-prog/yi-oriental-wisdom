import type { ElementName } from "./types";
import type { UnicodeCodePoint } from "./name-types";
import {
  REVIEWED_NAME_CHARACTERS,
  REVIEWED_TRADITIONAL_PAIRS,
} from "./name-data";

export const NAME_ELEMENT_COVERAGE_VERSION = "name-element-coverage-v1" as const;

export type NameElementPrimaryReview = {
  readonly role: "姓名文化内容复核";
  readonly reviewerId: string;
  readonly reviewedOn: string;
  readonly recordEvidenceId: string;
  readonly locator: string;
};

export type NameElementSecondReview = {
  readonly role: "姓名文化第二复核";
  readonly reviewerId: string;
  readonly reviewedOn: string;
  readonly recordEvidenceId: string;
  readonly locator: string;
};

export type NameElementSource = {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  readonly locator: string;
  readonly url: string | null;
  readonly useBasis: string;
};

export type NameElementRule = {
  readonly id: string;
  readonly version: typeof NAME_ELEMENT_COVERAGE_VERSION;
  readonly title: string;
  readonly adoptedPrinciple: string;
  readonly sourceIds: readonly string[];
  readonly primaryReview: NameElementPrimaryReview;
  readonly secondReview: NameElementSecondReview;
};

type NameElementRecordBase = {
  readonly id: string;
  readonly glyph: string;
  readonly codePoints: readonly UnicodeCodePoint[];
  readonly adoptedMeaning: string;
  readonly displayPinyin: string;
  readonly glyphSourceIds: readonly string[];
  readonly readingSourceIds: readonly string[];
  readonly meaningSourceIds: readonly string[];
  readonly elementRuleId: string;
  readonly elementRationale: string;
  readonly ruleVersion: typeof NAME_ELEMENT_COVERAGE_VERSION;
  readonly primaryReview: NameElementPrimaryReview;
  readonly secondReview: NameElementSecondReview;
};

export type ApprovedNameElementRecord = NameElementRecordBase & {
  readonly reviewDecision: "approved";
  readonly element: ElementName;
  readonly unresolvedAlternatives: readonly [];
  readonly recommendation: boolean;
};

export type PendingNameElementRecord = NameElementRecordBase & {
  readonly reviewDecision: "pending";
  readonly element: null;
  readonly unresolvedAlternatives: readonly [ElementName, ElementName, ...ElementName[]];
  readonly recommendation: false;
};

export type ReviewedNameElementRecord =
  | ApprovedNameElementRecord
  | PendingNameElementRecord;

export type NameElementLookupInput = {
  readonly inputGlyph: string;
  readonly adoptedGlyph: string | null;
  readonly adoptedReading: string | null;
  readonly adoptedMeaning: string | null;
};

export type NameElementPendingReason =
  | "glyph-unconfirmed"
  | "reading-unconfirmed"
  | "meaning-unconfirmed"
  | "unreviewed-character"
  | "element-classification-pending";

export type NameElementResolution =
  | { readonly status: "approved"; readonly record: ApprovedNameElementRecord }
  | {
      readonly status: "pending";
      readonly reason: NameElementPendingReason;
      readonly glyph: string | null;
    };

export type ReviewedAdoptedNameMeaning = {
  readonly adoptedMeaning: string;
  readonly recordIds: readonly string[];
  readonly meaningSourceIds: readonly string[];
};

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && (typeof value === "object" || typeof value === "function")
    && !Object.isFrozen(value)
  ) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function reviewsFor(recordEvidenceId: string): {
  readonly primaryReview: NameElementPrimaryReview;
  readonly secondReview: NameElementSecondReview;
} {
  return {
    primaryReview: {
      role: "姓名文化内容复核",
      reviewerId: "yi-name-element-primary-2026-07-23",
      reviewedOn: "2026-07-23",
      recordEvidenceId,
      locator: `内部审计轨迹：${recordEvidenceId}`,
    },
    secondReview: {
      role: "姓名文化第二复核",
      reviewerId: "yi-name-element-secondary-2026-07-23",
      reviewedOn: "2026-07-23",
      recordEvidenceId,
      locator: `内部第二审计轨迹：${recordEvidenceId}`,
    },
  };
}

const UNIHAN_URL = "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip";

export const NAME_ELEMENT_SOURCES: readonly NameElementSource[] = deepFreeze([
  {
    id: "unicode-unihan-17-codepoint",
    title: "Unicode Unihan 17.0.0 码位资料",
    publisher: "Unicode Consortium",
    locator: "Unihan_IRGSources.txt：Unicode code point 与统一汉字身份",
    url: UNIHAN_URL,
    useBasis: "仅证明采用字形的 Unicode 码位身份；不证明读音、采用义项或五行归类。",
  },
  {
    id: "unicode-unihan-17-ktghz2013",
    title: "Unicode Unihan 17.0.0 kTGHZ2013",
    publisher: "Unicode Consortium",
    locator: "Unihan_Readings.txt：kTGHZ2013",
    url: UNIHAN_URL,
    useBasis: "仅作为《通用规范汉字表》工程字集所附普通话读音底证；多音字仍按具体姓名逐项确认。",
  },
  {
    id: "unicode-unihan-17-kmandarin",
    title: "Unicode Unihan 17.0.0 kMandarin",
    publisher: "Unicode Consortium",
    locator: "Unihan_Readings.txt：kMandarin",
    url: UNIHAN_URL,
    useBasis: "仅证明传统字形记录中的普通话读音候选；不自动选择姓名实际读音。",
  },
  {
    id: "unicode-unihan-17-kdefinition",
    title: "Unicode Unihan 17.0.0 kDefinition",
    publisher: "Unicode Consortium",
    locator: "Unihan_Readings.txt：kDefinition",
    url: UNIHAN_URL,
    useBasis: "仅作为字典义范围底证；中文采用义项由产品内部另行记录，不由该字段证明五行。",
  },
  {
    id: "moe-revised-dictionary-sheng-reading",
    title: "教育部《重編國語辭典修訂本》“晟”",
    publisher: "中華民國教育部",
    locator: "词条 ID 9059：汉语拼音 shèng，另音 chéng；释义含“熾盛、明亮”",
    url: "https://dict.revised.moe.edu.tw/dictView.jsp?ID=9059&la=0&powerMode=0",
    useBasis: "仅证明推荐采用读音 shèng 及明亮义范围；不以本地 kTGHZ2013 的 chéng 代替该证据。",
  },
  {
    id: "yi-name-adopted-meaning-v1",
    title: "姓名覆盖字采用义项内部审计表 v1",
    publisher: "艺｜东方人生智慧",
    locator: "name-element-data.ts：COVERAGE_DEFINITIONS 与 RECOMMENDATION_DEFINITIONS",
    url: null,
    useBasis: "记录本产品采用的中文义项；它是内部审计事实，不冒充字典、外部专家或古籍逐字结论。",
  },
  {
    id: "yi-name-existing-reviewed-meaning-v1",
    title: "既有姓名引擎已审校义项互操作表",
    publisher: "艺｜东方人生智慧",
    locator: "name-data.ts：REVIEWED_NAME_CHARACTERS 与 REVIEWED_TRADITIONAL_PAIRS",
    url: null,
    useBasis: "仅保持既有已审校采用义项的精确互操作；不把旧概率向量转换成单一五行。",
  },
  {
    id: "classic-shangshu-hongfan-five-elements",
    title: "《尚书·洪范》五行段",
    publisher: "中国哲学书电子化计划",
    locator: "《洪范》“五行：一曰水，二曰火，三曰木，四曰金，五曰土”及其性质描述",
    url: "https://ctext.org/shang-shu/great-plan/zhs",
    useBasis: "仅提供五行文化语义框架；不声称古籍为现代姓名中的每个汉字逐字定五行。",
  },
  {
    id: "yi-name-semantic-element-rule-v1",
    title: "姓名采用义项五行文化映射规则 v1",
    publisher: "艺｜东方人生智慧",
    locator: "name-element-data.ts：NAME_ELEMENT_RULES 与逐字 elementRationale",
    url: null,
    useBasis: "内部产品规则：先确认字形、读音和采用义项，再进行两次独立审计；分歧保留 pending。",
  },
] satisfies readonly NameElementSource[]);

const ELEMENT_RULE_ID = "yi-name-adopted-meaning-semantic-map-v1";

export const NAME_ELEMENT_RULES: readonly NameElementRule[] = deepFreeze([
  {
    id: ELEMENT_RULE_ID,
    version: NAME_ELEMENT_COVERAGE_VERSION,
    title: "采用义项的五行文化语义映射",
    adoptedPrinciple: "本产品先锁定字形、读音与采用义项，再由两个不同内部审计轨迹按水、火、木、金、土的文化语义范围复核；这不是古籍对现代姓名用字的逐字定性，也不从部首、笔画或旧概率向量自动推导。",
    sourceIds: [
      "classic-shangshu-hongfan-five-elements",
      "yi-name-semantic-element-rule-v1",
    ],
    ...reviewsFor(ELEMENT_RULE_ID),
  },
] satisfies readonly NameElementRule[]);

type ApprovedDefinition = readonly [
  id: string,
  glyph: string,
  pinyin: string,
  meaning: string,
  element: ElementName,
  recommendation: boolean,
  readingSourceId?: string,
  meaningSourceId?: string,
];

function codePoints(glyph: string): readonly UnicodeCodePoint[] {
  return Array.from(
    glyph,
    value => `U+${value.codePointAt(0)!.toString(16).toUpperCase()}` as UnicodeCodePoint,
  );
}

function approvedRecord(definition: ApprovedDefinition): ApprovedNameElementRecord {
  const [
    id,
    glyph,
    displayPinyin,
    adoptedMeaning,
    element,
    recommendation,
    readingSourceId = "unicode-unihan-17-ktghz2013",
    meaningSourceId = "yi-name-adopted-meaning-v1",
  ] = definition;
  return deepFreeze({
    id,
    glyph,
    codePoints: codePoints(glyph),
    adoptedMeaning,
    displayPinyin,
    glyphSourceIds: ["unicode-unihan-17-codepoint"],
    readingSourceIds: [readingSourceId],
    meaningSourceIds: [meaningSourceId],
    elementRuleId: ELEMENT_RULE_ID,
    elementRationale: `采用义项“${adoptedMeaning}”经两个不同内部审计轨迹按产品文化语义规则归入${element}；这是产品采用决定，不是古籍逐字定性。`,
    ruleVersion: NAME_ELEMENT_COVERAGE_VERSION,
    ...reviewsFor(id),
    reviewDecision: "approved",
    element,
    unresolvedAlternatives: [],
    recommendation,
  });
}

const RECOMMENDATION_DEFINITIONS: readonly ApprovedDefinition[] = [
  ["recommendation-wood-lin", "林", "lín", "双木成林，取树木聚生成长之义", "木", true],
  ["recommendation-wood-sen", "森", "sēn", "木多成森，取繁茂有生机之义", "木", true],
  ["recommendation-wood-tong", "桐", "tóng", "梧桐之木，取挺立舒展之义", "木", true],
  ["recommendation-wood-nan", "楠", "nán", "楠木常青，取坚实沉稳之义", "木", true],
  ["recommendation-wood-zhu", "竹", "zhú", "竹有节而生，取挺拔有度之义", "木", true],
  ["recommendation-wood-he", "禾", "hé", "谷物幼苗，取生长收成之义", "木", true],
  ["recommendation-fire-ming", "明", "míng", "日月照临，取光明清楚之义", "火", true],
  ["recommendation-fire-xin", "昕", "xīn", "太阳将出，取破晓初明之义", "火", true],
  ["recommendation-fire-han", "晗", "hán", "天将明亮，取晨光渐起之义", "火", true],
  ["recommendation-fire-xu", "煦", "xù", "温暖和煦，取暖意照拂之义", "火", true],
  ["recommendation-fire-sheng", "晟", "shèng", "光明旺盛，取明盛向上之义", "火", true, "moe-revised-dictionary-sheng-reading"],
  ["recommendation-fire-qing", "晴", "qíng", "雨止天清，取日光明朗之义", "火", true],
  ["recommendation-earth-an", "安", "ān", "安定安稳，取有所安处之义", "土", true],
  ["recommendation-earth-chen", "辰", "chén", "日月星辰，取时序有位之义", "土", true],
  ["recommendation-earth-yu", "宇", "yǔ", "屋宇空间，取安居开阔之义", "土", true],
  ["recommendation-earth-lan", "岚", "lán", "山间雾气，取山气沉静之义", "土", true],
  ["recommendation-earth-kun", "坤", "kūn", "坤为大地，取厚重承载之义", "土", true],
  ["recommendation-earth-cheng", "城", "chéng", "城垣守护，取稳固有界之义", "土", true],
  ["recommendation-metal-jin", "锦", "jǐn", "有彩纹的丝织品，取华美有章之义", "金", true],
  ["recommendation-metal-jun", "钧", "jūn", "古代重量单位，取持衡有度之义", "金", true],
  ["recommendation-metal-rui", "锐", "ruì", "锋利敏锐，取清晰进取之义", "金", true],
  ["recommendation-metal-ming", "铭", "míng", "刻写记述，取铭记自持之义", "金", true],
  ["recommendation-metal-kai", "铠", "kǎi", "护身铠甲，取坚定守护之义", "金", true],
  ["recommendation-metal-ling", "铃", "líng", "金属响器，取清亮有声之义", "金", true],
  ["recommendation-water-han", "涵", "hán", "水泽包容，取涵养容纳之义", "水", true],
  ["recommendation-water-ze", "泽", "zé", "水聚润泽，取滋养惠及之义", "水", true],
  ["recommendation-water-mu", "沐", "mù", "以水洗濯，取清润更新之义", "水", true],
  ["recommendation-water-qing", "清", "qīng", "水澄而清，取清澈明净之义", "水", true],
  ["recommendation-water-lan", "澜", "lán", "水面大波，取开阔有势之义", "水", true],
  ["recommendation-water-chuan", "川", "chuān", "河流川流，取流动通达之义", "水", true],
];

const COVERAGE_DEFINITIONS: readonly ApprovedDefinition[] = [
  ["coverage-char-宋", "宋", "sòng", "宋代；姓氏", "土", false],
  ["coverage-char-江", "江", "jiāng", "大河；长江", "水", false],
  ["coverage-char-吴", "吴", "wú", "古国名；姓氏", "土", false],
  ["coverage-char-用", "用", "yòng", "使用；施行", "火", false],
  ["coverage-char-公", "公", "gōng", "公正；公共", "金", false],
  ["coverage-char-孙", "孙", "sūn", "子孙；姓氏", "土", false],
  ["coverage-char-胜", "胜", "shèng", "胜出；优越", "火", false],
  ["coverage-char-关", "关", "guān", "关隘；关联", "金", false],
  ["coverage-char-冲", "冲", "chōng", "向上冲；冲行", "水", false],
  ["coverage-char-秦", "秦", "qín", "古国名；姓氏", "土", false],
  ["coverage-char-呼", "呼", "hū", "呼喊", "火", false],
  ["coverage-char-延", "延", "yán", "延伸；延续", "木", false],
  ["coverage-char-灼", "灼", "zhuó", "明亮；灼热", "火", false],
  ["coverage-char-花", "花", "huā", "花朵", "木", false],
  ["coverage-char-荣", "荣", "róng", "草木茂盛；荣誉", "木", false],
  ["coverage-char-柴", "柴", "chái", "柴木", "木", false],
  ["coverage-char-进", "进", "jìn", "前进", "火", false],
  ["coverage-char-李", "李", "lǐ", "李树；姓氏", "木", false],
  ["coverage-char-应", "应", "yìng", "回应、应允", "金", false],
  ["coverage-char-朱", "朱", "zhū", "朱红色；姓氏", "火", false],
  ["coverage-char-仝", "仝", "tóng", "同的异体；姓氏", "土", false],
  ["coverage-char-鲁", "鲁", "lǔ", "古国名；姓氏", "土", false],
  ["coverage-char-智", "智", "zhì", "智慧", "水", false],
  ["coverage-char-深", "深", "shēn", "水深；深远", "水", false],
  ["coverage-char-武", "武", "wǔ", "武力；勇健", "金", false],
  ["coverage-char-松", "松", "sōng", "松树", "木", false],
  ["coverage-char-董", "董", "dǒng", "监督；姓氏", "金", false],
  ["coverage-char-平", "平", "píng", "平坦；安定", "土", false],
  ["coverage-char-张", "张", "zhāng", "张开；姓氏", "木", false],
  ["coverage-char-杨", "杨", "yáng", "杨树", "木", false],
  ["coverage-char-志", "志", "zhì", "志向；记述", "火", false],
  ["coverage-char-徐", "徐", "xú", "缓慢；姓氏", "水", false],
  ["coverage-char-宁", "宁", "níng", "安宁", "土", false],
  ["coverage-char-索", "索", "suǒ", "绳索；寻求", "金", false],
  ["coverage-char-超", "超", "chāo", "超越", "火", false],
  ["coverage-char-戴", "戴", "dài", "佩戴", "金", false],
  ["coverage-char-宗", "宗", "zōng", "宗族；宗旨", "土", false],
  ["coverage-char-刘", "刘", "liú", "姓氏", "金", false],
  ["coverage-char-唐", "唐", "táng", "唐代；姓氏", "土", false],
  ["coverage-char-逵", "逵", "kuí", "四通八达的路", "土", false],
  ["coverage-char-史", "史", "shǐ", "历史；姓氏", "金", false],
  ["coverage-char-穆", "穆", "mù", "和美；恭敬", "土", false],
  ["coverage-char-弘", "弘", "hóng", "广大", "木", false],
  ["coverage-char-雷", "雷", "léi", "雷电", "火", false],
  ["coverage-char-横", "横", "héng", "纵横；横向", "木", false],
  ["coverage-char-俊", "俊", "jùn", "才智出众", "火", false],
  ["coverage-char-阮", "阮", "ruǎn", "乐器名；姓氏", "金", false],
  ["coverage-char-小", "小", "xiǎo", "细小；年幼", "水", false],
  ["coverage-char-二", "二", "èr", "数目二", "土", false],
  ["coverage-char-五", "五", "wǔ", "数目五", "土", false],
  ["coverage-char-顺", "顺", "shùn", "顺从；顺利", "水", false],
  ["coverage-char-七", "七", "qī", "数目七", "金", false],
  ["coverage-char-雄", "雄", "xióng", "雄健", "火", false],
  ["coverage-char-石", "石", "shí", "石头；姓氏", "土", false],
  ["coverage-char-秀", "秀", "xiù", "秀美；茂盛", "木", false],
  ["coverage-char-珍", "珍", "zhēn", "珍宝；珍贵", "金", false],
  ["coverage-char-宝", "宝", "bǎo", "珍贵之物", "金", false],
  ["coverage-char-燕", "燕", "yàn", "燕子", "木", false],
  ["coverage-char-青", "青", "qīng", "青色；年轻", "木", false],
  ["coverage-char-黄", "黄", "huáng", "黄色；姓氏", "土", false],
  ["coverage-char-信", "信", "xìn", "诚信；信息", "金", false],
  ["coverage-char-立", "立", "lì", "站立；建立", "土", false],
  ["coverage-char-宣", "宣", "xuān", "宣布；宣扬", "火", false],
  ["coverage-char-赞", "赞", "zàn", "赞美；辅助", "火", false],
  ["coverage-char-郝", "郝", "hǎo", "姓氏", "土", false],
  ["coverage-char-思", "思", "sī", "思考", "水", false],
  ["coverage-char-文", "文", "wén", "文字；文采", "水", false],
  ["coverage-char-韩", "韩", "hán", "古国名；姓氏", "土", false],
  ["coverage-char-滔", "滔", "tāo", "水势盛大", "水", false],
  ["coverage-char-彭", "彭", "péng", "鼓声；姓氏", "火", false],
  ["coverage-char-廷", "廷", "tíng", "朝廷", "土", false],
  ["coverage-char-圭", "圭", "guī", "玉制礼器", "金", false],
  ["coverage-char-魏", "魏", "wèi", "古国名；姓氏", "土", false],
  ["coverage-char-定", "定", "dìng", "安定；确定", "土", false],
  ["coverage-char-国", "国", "guó", "国家", "土", false],
  ["coverage-char-萧", "萧", "xiāo", "艾蒿；姓氏", "木", false],
  ["coverage-char-让", "让", "ràng", "谦让", "土", false],
  ["coverage-char-裴", "裴", "péi", "姓氏", "土", false],
  ["coverage-char-欧", "欧", "ōu", "姓氏", "土", false],
  ["coverage-char-鹏", "鹏", "péng", "大鸟名", "火", false],
  ["coverage-char-邓", "邓", "dèng", "古国名；姓氏", "土", false],
  ["coverage-char-飞", "飞", "fēi", "飞翔", "火", false],
  ["coverage-char-凌", "凌", "líng", "越过；冰", "水", false],
  ["coverage-char-振", "振", "zhèn", "振奋；举起", "火", false],
  ["coverage-char-蒋", "蒋", "jiǎng", "茭白；姓氏", "木", false],
  ["coverage-char-敬", "敬", "jìng", "敬重", "火", false],
  ["coverage-char-吕", "吕", "lǚ", "古国名；姓氏", "土", false],
  ["coverage-char-方", "方", "fāng", "方正；方向", "土", false],
  ["coverage-char-郭", "郭", "guō", "外城；姓氏", "土", false],
  ["coverage-char-盛", "盛", "shèng", "盛大；兴盛", "火", false],
  ["coverage-char-道", "道", "dào", "道路；道理", "水", false],
  ["coverage-char-全", "全", "quán", "完整", "土", false],
  ["coverage-char-皇", "皇", "huáng", "君主；盛大", "火", false],
  ["coverage-char-甫", "甫", "fǔ", "男子美称；起始", "土", false],
  ["coverage-char-端", "端", "duān", "端正；开端", "土", false],
  ["coverage-char-王", "王", "wáng", "君王；姓氏", "土", false],
  ["coverage-char-英", "英", "yīng", "花；才智出众", "木", false],
  ["coverage-char-扈", "扈", "hù", "随从；姓氏", "土", false],
  ["coverage-char-三", "三", "sān", "数目三", "木", false],
  ["coverage-char-娘", "娘", "niáng", "女子称谓", "土", false],
  ["coverage-char-鲍", "鲍", "bào", "姓氏", "土", false],
  ["coverage-char-旭", "旭", "xù", "初升的阳光", "火", false],
  ["coverage-char-樊", "樊", "fán", "篱笆；姓氏", "木", false],
  ["coverage-char-瑞", "瑞", "ruì", "吉祥征兆", "金", false],
  ["coverage-char-孔", "孔", "kǒng", "孔洞；姓氏", "土", false],
  ["coverage-char-亮", "亮", "liàng", "明亮", "火", false],
  ["coverage-char-项", "项", "xiàng", "颈项；条目", "土", false],
  ["coverage-char-充", "充", "chōng", "充实", "土", false],
  ["coverage-char-衮", "衮", "gǔn", "古代礼服", "金", false],
  ["coverage-char-金", "金", "jīn", "金属", "金", false],
  ["coverage-char-大", "大", "dà", "广大", "土", false],
  ["coverage-char-坚", "坚", "jiān", "坚固", "金", false],
  ["coverage-char-马", "马", "mǎ", "马；姓氏", "火", false],
  ["coverage-char-麟", "麟", "lín", "麒麟", "火", false],
  ["coverage-char-童", "童", "tóng", "儿童", "木", false],
  ["coverage-char-威", "威", "wēi", "威严", "金", false],
  ["coverage-char-猛", "猛", "měng", "勇猛", "火", false],
  ["coverage-char-孟", "孟", "mèng", "排行第一；姓氏", "木", false],
  ["coverage-char-康", "康", "kāng", "安宁；健康", "土", false],
  ["coverage-char-侯", "侯", "hóu", "诸侯；姓氏", "土", false],
  ["coverage-char-健", "健", "jiàn", "强健", "木", false],
  ["coverage-char-陈", "陈", "chén", "陈列；姓氏", "土", false],
  ["coverage-char-达", "达", "dá", "通达", "水", false],
  ["coverage-char-春", "春", "chūn", "春季", "木", false],
  ["coverage-char-郑", "郑", "zhèng", "古国名；姓氏", "土", false],
  ["coverage-char-天", "天", "tiān", "天空；自然", "火", false],
  ["coverage-char-寿", "寿", "shòu", "长寿", "木", false],
  ["coverage-char-陶", "陶", "táo", "陶器；姓氏", "土", false],
  ["coverage-char-旺", "旺", "wàng", "兴旺", "火", false],
  ["coverage-char-乐", "乐", "yuè", "音乐", "火", false],
  ["coverage-char-和", "和", "hé", "和谐", "土", false],
  ["coverage-char-龚", "龚", "gōng", "恭敬；姓氏", "土", false],
  ["coverage-char-丁", "丁", "dīng", "天干第四位；姓氏", "火", false],
  ["coverage-char-得", "得", "dé", "获得", "金", false],
  ["coverage-char-曹", "曹", "cáo", "同辈；姓氏", "土", false],
  ["coverage-char-正", "正", "zhèng", "端正", "金", false],
  ["coverage-char-万", "万", "wàn", "数目万", "土", false],
  ["coverage-char-杜", "杜", "dù", "杜梨；姓氏", "木", false],
  ["coverage-char-迁", "迁", "qiān", "迁移", "水", false],
  ["coverage-char-薛", "薛", "xuē", "蒿类植物；姓氏", "木", false],
  ["coverage-char-永", "永", "yǒng", "长久", "水", false],
  ["coverage-char-施", "施", "shī", "施行；姓氏", "水", false],
  ["coverage-char-恩", "恩", "ēn", "恩惠", "土", false],
  ["coverage-char-忠", "忠", "zhōng", "忠诚", "火", false],
  ["coverage-char-周", "周", "zhōu", "周全；姓氏", "土", false],
  ["coverage-char-通", "通", "tōng", "通达", "水", false],
  ["coverage-char-汤", "汤", "tāng", "热水；姓氏", "水", false],
  ["coverage-char-隆", "隆", "lóng", "兴盛；高", "土", false],
  ["coverage-char-兴", "兴", "xīng", "兴起", "火", false],
  ["coverage-char-邹", "邹", "zōu", "古国名；姓氏", "土", false],
  ["coverage-char-渊", "渊", "yuān", "深水", "水", false],
  ["coverage-char-润", "润", "rùn", "滋润", "水", false],
  ["coverage-char-贵", "贵", "guì", "尊贵；价值高", "金", false],
  ["coverage-char-富", "富", "fù", "富足", "土", false],
  ["coverage-char-蔡", "蔡", "cài", "古国名；姓氏", "木", false],
  ["coverage-char-福", "福", "fú", "福祉", "土", false],
  ["coverage-char-庆", "庆", "qìng", "庆贺", "火", false],
  ["coverage-char-云", "云", "yún", "云气", "水", false],
  ["coverage-char-焦", "焦", "jiāo", "焦灼；姓氏", "火", false],
  ["coverage-char-挺", "挺", "tǐng", "挺立", "木", false],
  ["coverage-char-勇", "勇", "yǒng", "勇敢", "火", false],
  ["coverage-char-卢", "卢", "lú", "饭器；姓氏", "土", false],
  ["coverage-char-义", "义", "yì", "合宜的道义", "金", false],
  ["coverage-char-盧", "盧", "lú", "饭器；姓氏", "土", false, "unicode-unihan-17-kmandarin"],
  ["coverage-char-義", "義", "yì", "合宜的道义", "金", false, "unicode-unihan-17-kmandarin"],
];

const EXISTING_REVIEW_READINGS: Readonly<Record<string, string>> = {
  林: "lín",
  知: "zhī",
  远: "yuǎn",
  临: "lín",
  川: "chuān",
  艺: "yì",
  涵: "hán",
  一: "yī",
  诺: "nuò",
  梓: "zǐ",
  泽: "zé",
  沐: "mù",
  辰: "chén",
  宇: "yǔ",
  欣: "xīn",
};

const EXISTING_REVIEW_ELEMENTS: Readonly<Record<string, ElementName>> = {
  林: "木",
  知: "火",
  远: "水",
  临: "水",
  川: "水",
  艺: "木",
  涵: "水",
  一: "土",
  诺: "金",
  梓: "木",
  泽: "水",
  沐: "水",
  辰: "土",
  宇: "土",
  欣: "火",
};

const existingReviewDefinitions: readonly ApprovedDefinition[] =
  REVIEWED_NAME_CHARACTERS.map(record => [
    `existing-review-${record.id}`,
    record.glyph,
    EXISTING_REVIEW_READINGS[record.glyph]!,
    record.meaning,
    EXISTING_REVIEW_ELEMENTS[record.glyph]!,
    false,
    "unicode-unihan-17-ktghz2013",
    "yi-name-existing-reviewed-meaning-v1",
  ]);

const EXISTING_TRADITIONAL_ELEMENTS: Readonly<Record<string, ElementName>> = {
  發: "木",
  髮: "木",
  藝: "木",
};

const existingTraditionalDefinitions: readonly ApprovedDefinition[] =
  REVIEWED_TRADITIONAL_PAIRS.flatMap(record =>
    record.readings.map((reading, readingIndex) => [
      `existing-traditional-${record.id}-${readingIndex + 1}-${reading.pinyin}`,
      record.adoptedGlyph,
      reading.pinyin,
      record.meaning,
      EXISTING_TRADITIONAL_ELEMENTS[record.adoptedGlyph]!,
      false,
      "unicode-unihan-17-kmandarin",
      "yi-name-existing-reviewed-meaning-v1",
    ] as const),
  );

function pendingRecord(
  id: string,
  glyph: string,
  displayPinyin: string,
  adoptedMeaning: string,
  unresolvedAlternatives: readonly [
    ElementName,
    ElementName,
    ...ElementName[],
  ],
): PendingNameElementRecord {
  return deepFreeze({
    id,
    glyph,
    codePoints: codePoints(glyph),
    adoptedMeaning,
    displayPinyin,
    glyphSourceIds: ["unicode-unihan-17-codepoint"],
    readingSourceIds: ["unicode-unihan-17-ktghz2013"],
    meaningSourceIds: ["yi-name-adopted-meaning-v1"],
    elementRuleId: ELEMENT_RULE_ID,
    elementRationale: `采用义项“${adoptedMeaning}”已由两个不同内部审计轨迹复核，但在产品文化语义规则中仍有多个未决映射；不以数组次序消解，也不是古籍逐字定性。`,
    ruleVersion: NAME_ELEMENT_COVERAGE_VERSION,
    ...reviewsFor(id),
    reviewDecision: "pending",
    element: null,
    unresolvedAlternatives,
    recommendation: false,
  });
}

const pendingRecords: readonly PendingNameElementRecord[] = [
  pendingRecord(
    "coverage-char-解-element-pending",
    "解",
    "xiè",
    "姓氏用字（读 xiè）",
    ["金", "水"],
  ),
  pendingRecord(
    "coverage-char-玘-element-pending",
    "玘",
    "qǐ",
    "一种玉名",
    ["土", "金"],
  ),
  pendingRecord(
    "coverage-char-单-element-pending",
    "单",
    "shàn",
    "姓氏用字（读 shàn）",
    ["土", "金"],
  ),
];

const recommendationRecords = RECOMMENDATION_DEFINITIONS.map(approvedRecord);
const coverageRecords = COVERAGE_DEFINITIONS.map(approvedRecord);
const existingReviewRecords = existingReviewDefinitions.map(approvedRecord);
const existingTraditionalRecords =
  existingTraditionalDefinitions.map(approvedRecord);

export const REVIEWED_NAME_ELEMENT_RECORDS:
  readonly ReviewedNameElementRecord[] = deepFreeze([
    ...recommendationRecords,
    ...coverageRecords,
    ...existingReviewRecords,
    ...existingTraditionalRecords,
    ...pendingRecords,
  ]);

function exactRecordKey(
  glyph: string,
  displayPinyin: string,
  adoptedMeaning: string,
): string {
  return JSON.stringify([glyph, displayPinyin, adoptedMeaning]);
}

const recordsByExactKey = new Map<string, ReviewedNameElementRecord>();
const reviewedReadings = new Set<string>();
const reviewedGlyphs = new Set<string>();
for (const record of REVIEWED_NAME_ELEMENT_RECORDS) {
  const key = exactRecordKey(
    record.glyph,
    record.displayPinyin,
    record.adoptedMeaning,
  );
  if (recordsByExactKey.has(key)) {
    throw new Error(`Duplicate reviewed name element exact key: ${key}`);
  }
  recordsByExactKey.set(key, record);
  reviewedReadings.add(JSON.stringify([record.glyph, record.displayPinyin]));
  reviewedGlyphs.add(record.glyph);
}

export function findUniqueReviewedAdoptedMeaning(input: {
  readonly adoptedGlyph: string | null;
  readonly adoptedReading: string | null;
}): ReviewedAdoptedNameMeaning | null {
  if (input.adoptedGlyph === null || input.adoptedReading === null) return null;
  const matches = REVIEWED_NAME_ELEMENT_RECORDS.filter(record =>
    record.glyph === input.adoptedGlyph
    && record.displayPinyin === input.adoptedReading);
  const meanings = new Set(matches.map(record => record.adoptedMeaning));
  if (meanings.size !== 1) return null;
  return deepFreeze({
    adoptedMeaning: meanings.values().next().value!,
    recordIds: [...new Set(matches.map(record => record.id))],
    meaningSourceIds: [
      ...new Set(matches.flatMap(record => record.meaningSourceIds)),
    ],
  });
}

const reviewedInputGlyphRelations = new Set(
  REVIEWED_TRADITIONAL_PAIRS.map(
    pair => JSON.stringify([pair.inputGlyph, pair.adoptedGlyph]),
  ),
);

export function resolveReviewedNameElement(
  input: Readonly<NameElementLookupInput>,
): NameElementResolution {
  if (input.adoptedGlyph === null) {
    return { status: "pending", reason: "glyph-unconfirmed", glyph: null };
  }

  if (
    input.inputGlyph !== input.adoptedGlyph
    && !reviewedInputGlyphRelations.has(JSON.stringify([
      input.inputGlyph,
      input.adoptedGlyph,
    ]))
  ) {
    return {
      status: "pending",
      reason: "glyph-unconfirmed",
      glyph: input.adoptedGlyph,
    };
  }

  if (!reviewedGlyphs.has(input.adoptedGlyph)) {
    return {
      status: "pending",
      reason: "unreviewed-character",
      glyph: input.adoptedGlyph,
    };
  }

  if (input.adoptedReading === null) {
    return {
      status: "pending",
      reason: "reading-unconfirmed",
      glyph: input.adoptedGlyph,
    };
  }
  if (!reviewedReadings.has(JSON.stringify([
    input.adoptedGlyph,
    input.adoptedReading,
  ]))) {
    return {
      status: "pending",
      reason: "reading-unconfirmed",
      glyph: input.adoptedGlyph,
    };
  }

  if (input.adoptedMeaning === null) {
    return {
      status: "pending",
      reason: "meaning-unconfirmed",
      glyph: input.adoptedGlyph,
    };
  }
  const record = recordsByExactKey.get(
    exactRecordKey(
      input.adoptedGlyph,
      input.adoptedReading,
      input.adoptedMeaning,
    ),
  );
  if (record === undefined) {
    return {
      status: "pending",
      reason: "meaning-unconfirmed",
      glyph: input.adoptedGlyph,
    };
  }

  if (record.reviewDecision === "pending") {
    return {
      status: "pending",
      reason: "element-classification-pending",
      glyph: record.glyph,
    };
  }
  return { status: "approved", record };
}

export function getReviewedNameElementRecommendations(
  element: ElementName,
): readonly ApprovedNameElementRecord[] {
  return recommendationsByElement[element];
}

const recommendationsByElement: Readonly<
  Record<ElementName, readonly ApprovedNameElementRecord[]>
> = deepFreeze({
  木: recommendationRecords.filter(record => record.element === "木"),
  火: recommendationRecords.filter(record => record.element === "火"),
  土: recommendationRecords.filter(record => record.element === "土"),
  金: recommendationRecords.filter(record => record.element === "金"),
  水: recommendationRecords.filter(record => record.element === "水"),
});
