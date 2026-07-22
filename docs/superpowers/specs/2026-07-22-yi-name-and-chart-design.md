# 艺｜姓名使用与五行文化设计规格

日期：2026-07-22

## 目标

当用户在出生坐标中填写姓名时，在“命盘”内部呈现一份既有传统语境、又能让普通人立即看懂的姓名分析。它回答四件事：这个名字在现实中是否好读、好写、好用；每个字表达什么；姓名的五行文化意象怎样与命盘并排理解；是否真的有必要改名。

姓名为空时，整个模块不存在，不显示空卡，不加载姓名数据块，也不要求补填。姓名分析不改变四柱、十神、五行计数、格局或大运计算。

## 证据分层

1. 国家规范与法律只回答规范字、编码、姓名权和登记流程：
   - 《通用规范汉字表》及教育部实施通知：8105 个规范汉字；新命名、更名的人名用字以字表为范围。
   - GB 18030-2022 及其现行修改状态：说明编码交换范围，不保证所有字体、输入法和旧业务系统都能显示某个字。
   - 《民法典》第一千零一十二、一千零一十五、一千零一十六条：姓名权、姓氏选择与依法登记。
2. 古典原典只回答命名文化：
   - 《左传·桓公六年》“信、义、象、假、类”及命名避讳。
   - 《礼记·曲礼上》关于古代命名避讳。
   - 《尚书·洪范》水、火、木、金、土及润下、炎上、曲直、从革、稼穑的五行母题。
   - 《礼记·月令》五音、时令与五行的历史体系；不直接换算现代普通话姓名。
3. Unicode Unihan 17.0 只提供工程数据：`kTGH`、`kTGHZ2013`、`kMandarin`、`kRSUnicode`、`kTotalStrokes`、`kDefinition`、`kSimplifiedVariant`、`kTraditionalVariant`。简繁字段和 `kTGH` 均为 provisional 工程映射；`kRSUnicode` 是检字记录且可能多值；`kTotalStrokes` 是 informative 的 IRG 工程总笔画记录，不等于康熙笔画。它们都不是汉字五行。
4. “艺姓名五行解释模型 v1.0”和“艺姓名使用评分规则 v1.0”是产品规则。汉字五行向量、0–100 分、建议门禁和候选排序不冒充国家标准或学术公认定论。

经核对，国家标准和 Unihan 均没有“汉字五行”字段。产品不宣称存在全国统一的“每字唯一五行表”。

## 简体、繁体、异体与采用字形

- 主分析永远以用户现实输入、证件登记或准备登记的原始 Unicode 字符序列为准。整名保存 `rawInput`；先按原始 grapheme 和 code points 检测兼容汉字、变体序列和 PUA，再决定是否允许生成 NFC 查表形式。兼容汉字可能在 NFC 中发生 canonical folding，禁止先归一化后识别；始终禁止 NFKC、静默简繁转换和未经确认的兼容折叠。
- “传统字形参考”是展开层中的可选证据补充。规范字与繁体字的对应优先依据《通用规范汉字表》附表；Unihan 17.0 `kTraditionalVariant`／`kSimplifiedVariant` 只生成候选关联字和交叉核对记录。
- 一简一繁且语义无歧义时，可自动展示“原字 → 可能关联字”，但候选不默认勾选。只有用户主动进入传统字形参考并确认后，才产生独立的传统字形分析口径。
- 一简多繁必须按姓名实际含义确认。例如“发”可能对应“發／髮”，“干”可能对应“乾／幹／干”，“后”可能对应“後／后”，“台”可能对应“臺／檯／颱／台”，“里”可能对应“裏／裡／里”。未确认时，传统口径下该字的字义、读音、笔画、五行和总分全部停算。
- UI 同时显示“你输入的字／可能关联字／本次采用字形／笔画口径”。不要求用户理解编码术语，而是问生活语义，例如“名字里的‘发’是生发、出发，还是头发的意思？”
- 语义五行只按已确认字义和逐字人工审校的产品规则解释。部首、总笔画只是检字和字形工程记录，不生成五行分。简繁字义若导出不同文化归类，两种结果并列，不合并成一个“真正五行”。
- 康熙字形、传统繁体和现实登记字形不是同一概念。五格／81 数理若保留，只能默认关闭并标为“20 世纪熊崎式姓名学文化附录，不是中国古法，不进入主分”；固定具体字典版本和笔画口径，歧义字不计算。

## 不采用的主评分方法

- 不把五格剖象、81 数理或康熙笔画吉凶纳入主分。
- 不使用“命盘有几个木、几个水，所以缺什么就补什么”。姓名不会被加进出生盘五行计数。
- 不把现代拼音声母机械换算成五音五行。
- 不把 Unicode 部首检字字段包装成构字语义或五行依据。
- 不使用来源不明的商业“姓名五行大全”、康熙字典 JSON 或抓取的吉凶断语。

## 信息架构

位置：报告 > 命盘，出生事实之后、30 秒人生概览之前。没有新顶级标签。

第一层始终可见：

- 标题“姓名使用与五行文化”、当前姓名。
- 一个现实使用结论、一项当下行动、“已核验 3/4 类资料”等资料状态。
- “本产品规则下的观察”，不用“权威定论”式措辞。
- 固定边界：“分数只评估姓名方案，不评价人；姓名不会改写出生盘，也不保证人生结果。”

第二层“展开完整姓名分析”：

- “姓名现实使用实测分”或“尚未完成现实验证，暂不评分”，以及四个实测维度、规则 ID 和每项得分原因。资料覆盖与分数分开，分数不含命局文化互动。
- 逐字卡：实际读音、单字义、《通用规范汉字表》收录级别、Unicode 码点、原始多值笔画与部首工程记录、语义五行向量、争议和证据等级。
- 有简繁关系时展示字形口径；一简多繁提供语义确认，不默认选候选。
- 命局文化并读：只读确定柱，与姓名文化意象并排；明确“不把名字加进命盘计数；这部分不计分，也不触发改名”。
- 场景化使用：第一次自我介绍、电话报名字、证件录入、老师或客户点名等画面。
- 改名建议：保留、微调、重构三档，只由封闭的真实使用风险触发。
- 用户主动点击“看看命名方向”后，展示 3 个命名方向和经审校示例字。动态拼出的完整姓名固定标“待人工复核”；只有进入有限整名库的具体组合才能标“已审校”。同名提示写“本产品未查询全国同名人数”。
- “依据与流派边界”折叠区：来源、数据版本、规则版本、五格旁注和公安部官方同名查询入口。

## 输入、支持范围与隐私

- 复用出生坐标中的可选姓名，不新增首屏必填项。默认是“现用姓名”；候选模式只在用户主动点击后出现。
- 以 Unicode grapheme cluster 切分姓名，禁止按 UTF-16 code unit 切字；扩展区汉字、代理对和变体选择符不能被拆坏。
- 首版自动语义分析支持汉字姓名与已审校复姓；复姓识别允许在展开层纠正。间隔号、拉丁字母或尚未覆盖的少数民族姓名保留原文，只显示可确定的编码与使用提示，并说“当前模型未覆盖”，不说姓名无效。
- 多音字不强猜。未确认实际读音时不进入实测，其他已确定内容仍可阅读。
- PUA、IVS、兼容汉字或异体关系未确认时，不做任何会改变原码点的归一化；相关字的读音、字义、笔画、五行和实测暂停。扩展区汉字只要能按完整码点查到已审校记录即可继续，不能仅因使用代理对而判为无效。
- 超长姓名允许换行，不截断；超出首版逐字分析上限时展示降级说明。
- 姓名不写入 URL、远程接口或分析日志。候选姓名、读音和字形确认默认只留在当前页面，不持久化。运行时不请求第三方姓名接口。
- 官方同名查询链接不预填姓名。跳转前说明“将离开本产品，后续登录、实名认证和信息处理由公安部平台负责”。

## 数据契约

```ts
type FiveElement = "木" | "火" | "土" | "金" | "水";
type ElementVector = Record<FiveElement, number>;

type CharacterMethodEvidence = {
  methodId: string;
  version: string;
  vector: ElementVector;
  unknownShare: number;
  basisText: string;
  sourceIds: string[];
  confidence: "reviewed" | "contested" | "unknown";
};

type VariantCandidate = {
  glyph: string;
  codePoints: string[];
  meaningHint: string;
  sourceIds: string[];
};

type NameCharacterRecord = {
  rawCluster: string;
  nfcLookup: string;
  inputGlyph: string;
  inputCodePoints: string[];
  adoptedGlyph: string | null;
  glyphBasis: "registered-input" | "confirmed-traditional-reference";
  variantCandidates: VariantCandidate[];
  requiresConfirmation: boolean;
  tghIndex: number | null;
  tghLevel: 1 | 2 | 3 | null;
  readings: { pinyin: string; tone: number; sourceId: string }[];
  adoptedReading: string | null;
  radicalStrokeRecords: { value: string; sourceId: string }[];
  totalStrokeRecord: { value: number; sourceId: string } | null;
  meaning: string | null;
  semantic: CharacterMethodEvidence | null;
  analysisBlockers: AnalysisBlocker[];
  confirmedUsageRisks: ConfirmedUsageRisk[];
};

type AnalysisBlocker = {
  id:
    | "registration-glyph-pending"
    | "actual-reading-unconfirmed"
    | "adopted-glyph-unconfirmed"
    | "key-meaning-unreviewed"
    | "unsupported-input";
  evidence: string;
};

type ConfirmedUsageRisk = {
  id:
    | "confirmed-severe-homophone-or-ambiguity"
    | "persistent-input-document-or-calling-issue";
  severity: "hard";
  evidence: string;
  manuallyReviewed: true;
  userConfirmed: true;
};

type NameChartInteractionInput = {
  certainPillars: Readonly<Partial<Record<PillarKey, Readonly<Pillar>>>>;
  unavailableReasons: ("year-boundary" | "month-boundary" | "unknown-time")[];
};
```

五种元素向量值域为 0–1，归一化后总和为 1；`unknownShare` 是证据不足比例，不是第六种五行。每条语义记录都带方法 ID、版本、依据文本、来源和争议状态。未人工审校的字为“暂未归类”。

`NameChartInteractionInput` 复用现有 `PillarKey` 和 `Pillar`，由主盘只读派生：只允许读取未列入 `ambiguousPillars` 的确定柱；未知时辰只说“时柱不参与”，不声称已证明关系是否反转；年柱或月柱待核时，命局文化并读直接 unavailable。首版只做结构并排展示，不输出匹配、补益、生克或适配结论。姓名分析不得回写 `FourPillarsResult` 或 `ProfessionalReport`。

## 离线数据与校验

- 8105 字核心表：从 Unihan 17.0 `kTGH` 裁出，保留原始 `2013:index`；读音优先 `kTGHZ2013`，`kMandarin` 只回退。用官方《通用规范汉字表》校验完整码点集合、级别边界、无缺无增，并保存源文件 checksum、Unicode License v3、版本、生成日期和源 URL。只验证“数量为 8105”不算通过。
- 简繁候选索引：裁出 Unihan 简繁字段但明确 provisional；一简多繁人工消歧表依据《通用规范汉字表》附表，保存义项提示和来源。未审校多候选不自动采用。
- 人工审校姓名字集：覆盖产品样本、公安部 2021 年报告中的高频字和示例字；包含中文含义、风险与五行向量。公安部数据只用于选择覆盖样本和提示流行度／重名风险，不代表名字质量或性别适配。
- 有限整名组合库：每条保存具体姓氏、完整姓名、实际读音、字形口径、组合审校状态、审校日期、复核角色和风险记录。审过单字不等于审过完整姓名。
- 8105 字数据必须是独立静态 chunk；空姓名不请求。构建门禁记录 chunk 大小，首版压缩后预算 160 kB，超出则失败。

## 姓名现实使用实测规则 v1.0

用户明确需要姓名打分，因此保留 0–100 分，但不再把“数据库能查到、读音有记录、字义已审校、整名进入产品库”当成名字更好的证据。这些只决定资料覆盖和能否开始实测，绝不加分。

分数来自展开层中自愿完成的“30 秒现实使用实测”；出生录入不增加操作。任一项选择“未验证”时不显示总分，只显示已完成项。每项答案均可修改，分值按 5 分粒度且返回规则 ID：

| 实测维度 | 满分 | 用户可验证的固定规则 |
|---|---:|---|
| 听见与读准 | 30 | `R-HEAR-30`：两位不熟悉姓名的人第一次听后都能正确复述／叫读；`R-HEAR-15`：一位正确；`R-HEAR-00`：都未正确；未实际测试为 `unverified` |
| 输入与显示 | 25 | `R-INPUT-25`：在常用手机和电脑两种环境均能一次输入并正确显示；`R-INPUT-10`：仅一种环境顺畅；`R-INPUT-00`：两种均持续有问题；未测试为 `unverified` |
| 证件与系统 | 25 | `R-DOC-25`：现用名在两个实际办理／业务系统场景均无持续问题；`R-DOC-10`：一个场景有持续问题；`R-DOC-00`：两个场景均有持续问题；候选名或未经历两个场景均为 `unverified` |
| 含义与本人接受度 | 20 | `R-MEAN-20`：用户确认采用义项符合本人表达且没有长期困扰；`R-MEAN-10`：存在一个长期需要解释的歧义；`R-MEAN-00`：存在经本人确认的严重负面歧义；未确认采用义项为 `unverified` |

总分直接相加，不按未验证项重算分母。规则、答案、停算和版本写入独立 `name-score-contract.ts`。固定 golden cases 至少包含：全项通过为 100；一个听读场景失败为 85；任一未验证时无总分；同一组实测答案在“未入库／进入审校库”前后分数完全相同。命局文化并读不计分，也永远不触发改名建议。

## 改名建议门禁

- 保留：现用姓名默认优先尊重本人身份；无真实使用硬风险时，不因分数或命局文化互动建议改名。
- 微调：恰有一个 `ConfirmedUsageRisk`；尽量保留姓氏和至少一个给定字、读音或语义主题。
- 重构：仅用于候选姓名存在两个以上 `ConfirmedUsageRisk`，或用户主动切换为候选模式并要求全新方向。不能仅由总分或五行触发。
- `AnalysisBlocker` 只表示资料或采用口径不足，只阻断分析、评分和建议，永远不能触发微调或重构。
- 可触发建议的硬风险只限“经人工和用户共同确认的严重谐音／歧义”“持续发生的输入、证件或称呼问题”。
- 书写复杂、三级字、流行度低不是硬风险。成人改名提示依法登记，且改名前实施的民事法律行为仍有约束力；不承诺公安机关必然批准。

## 文案模板

本产品规则下的观察：

> “临”以人工审校语义呈水木复合向量，“川”以水的自然意象为主。这里说的是名字的文化联想，不把任何元素加进出生盘。

生活翻译：

> 这个名字像一条穿过树林的河：第一次听见的人容易联想到开阔、移动和延展。它影响的是别人怎样记住你、你怎样介绍自己，不是把命盘里的某个元素凭空加一。

行动建议：

> 用电话报一次全名、在常用输入法里完整输入一次、请两位不熟悉你的人复述一次。若三次都顺畅，真实使用价值比单一五行标签更重要。

## 审计与拒绝结论

姓名模块的所有可见字段、建议、候选、边界和 source IDs 都进入 `content-audit.ts`。禁词至少包含“改名改命、最吉、必选、补足五行、康熙古法、公安保证批准”。

以下情况不显示确定总分或改名结论：字形、读音、字义未确认；只有商业网站互抄的五行归类；要求保证发财、治病、婚姻、生育或避灾；要求判断姓名“克父母／配偶”；要求保证登记批准。

## 主要来源

- 教育部《通用规范汉字表》：https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/201306/t20130601_186002.html
- 教育部《汉字规范的科学化》（一简多繁及附表分解原则）：https://www.moe.gov.cn/jyb_xwfb/xw_fbh/moe_2069/s7135/s7562/s7569/201308/t20130827_156343.html
- 教育部等十二部门实施通知：https://www.moe.gov.cn/srcsite/A19/s229/201310/t20131015_159487.html
- GB 18030-2022：https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=A1931A578FE14957104988029B0833D3&refer=outter
- Unicode UAX #38：https://www.unicode.org/reports/tr38/
- Unicode Unihan 17.0：https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip
- 《民法典》：https://www.court.gov.cn/zixun/xiangqing/233181.html
- 《左传·桓公六年》：https://ctext.org/chun-qiu-zuo-zhuan/huan-gong-liu-nian/zhs
- 《礼记·曲礼上》：https://ctext.org/text.pl?if=gb&node=9516&show=parallel
- 《尚书·洪范》：https://ctext.org/shang-shu/great-plan
- 《礼记·月令》：https://ctext.org/liji/yue-ling
- 王治理《中日姓名预测学漫谈及比较》：https://core.ac.uk/download/41439923.pdf
- 公安部户政管理研究中心《二〇二一年全国姓名报告》：https://gat.hunan.gov.cn/gat/jwgk/jwzx/gabyw/202201/t20220126_22471460.html
- 公安部互联网政务服务平台：https://ywtb.mps.gov.cn/
