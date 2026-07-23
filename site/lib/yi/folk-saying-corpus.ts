export type FolkSayingReviewId = `folk-review-${string}`;
export type ClassicalSayingReviewId = `classical-review-${string}`;
export type SayingReviewId =
  | FolkSayingReviewId
  | ClassicalSayingReviewId;

export type PublicSayingLead =
  | Readonly<{
      kind: "folk";
      attribution: "民间常说";
      saying: string;
    }>
  | Readonly<{
      kind: "classical";
      attribution: "《诗经》有言" | "古人有言";
      saying: string;
    }>;

type SayingAttestation = Readonly<{
  title: string;
  publisherOrInstitution: string;
  url: string;
  exactLocator: string;
}>;

type SourceAudit = Readonly<{
  reviewerKind: "source-audit" | "independent-model";
  scope: string;
}>;

type ReviewedSayingBase = Readonly<{
  saying: string;
  usage: readonly (
    | "compatibility"
    | "historical-mirror"
    | "tradition"
  )[];
  attestations: readonly [SayingAttestation, SayingAttestation];
  familiarSituation: string;
  retainedWording: string;
  plainConsensusMeaning: string;
  safeUseDecision: string;
  audits: readonly [SourceAudit, SourceAudit];
  reviewedAt: string;
  humanReviewStatus: "pending";
  humanReviewerId: null;
  automatedGate: "sources-cross-checked-awaiting-human-review";
}>;

export type ReviewedSaying =
  | (ReviewedSayingBase & Readonly<{
      id: FolkSayingReviewId;
      kind: "folk";
      attribution: "民间常说";
    }>)
  | (ReviewedSayingBase & Readonly<{
      id: ClassicalSayingReviewId;
      kind: "classical";
      attribution: "《诗经》有言" | "古人有言";
    }>);

const commonAudit = [
  {
    reviewerKind: "source-audit",
    scope: "核对页面归属、标题、日期、原句与精确定位。",
  },
  {
    reviewerKind: "independent-model",
    scope: "独立复核两家机构、语义一致性与有限趣味使用边界。",
  },
] as const;

export const REVIEWED_SAYING_CORPUS = [
  {
    id: "folk-review-long-road",
    kind: "folk",
    saying: "路遥知马力，日久见人心",
    attribution: "民间常说",
    usage: ["compatibility", "tradition"],
    attestations: [
      {
        title: "路遙知馬力，日久見人心",
        publisherOrInstitution: "中华民国教育部",
        url: "https://dict.revised.moe.edu.tw/dictView.jsp?ID=66254&la=0&powerMode=0",
        exactLocator: "《重编国语辞典修订本》词条 ID 66254，释义栏标注“谚语”",
      },
      {
        title: "【每日一习话】路遥知马力，日久见人心",
        publisherOrInstitution: "央广网",
        url: "https://news.cnr.cn/native/gd/20200107/t20200107_524927743.shtml",
        exactLocator: "2020-01-07 正文第二段，解释时间久了才能看出人心",
      },
    ],
    familiarSituation: "两个人共同做事一段时间后，用持续兑现而非一次表态判断是否可靠。",
    retainedWording: "保留通行原句，不增加吉凶或关系结果解释。",
    plainConsensusMeaning: "人的做法和可靠程度需要在时间与实际事情中观察。",
    safeUseDecision: "只作关系观察的趣味开场，不用于预测分合、婚育或任何确定结果。",
    audits: commonAudit,
    reviewedAt: "2026-07-24",
    humanReviewStatus: "pending",
    humanReviewerId: null,
    automatedGate: "sources-cross-checked-awaiting-human-review",
  },
  {
    id: "folk-review-many-hands",
    kind: "folk",
    saying: "众人拾柴火焰高",
    attribution: "民间常说",
    usage: ["compatibility", "tradition"],
    attestations: [
      {
        title: "小常识与大道理｜只有团结同心，众人拾柴才能火焰高",
        publisherOrInstitution: "中共上海市委党校（上海行政学院）",
        url: "https://www.sai.gov.cn/info/2421/97731.htm",
        exactLocator: "2022-04-20 正文首段，引《中国谚语总汇·汉族卷》",
      },
      {
        title: "谈全民健身——众人拾柴火焰高",
        publisherOrInstitution: "国家体育总局",
        url: "https://www.sport.gov.cn/n20001280/n20745751/n20767279/c21282287/content.html",
        exactLocator: "2013-01-21 页面标题及正文第三至第六段的协作分工场景",
      },
    ],
    familiarSituation: "家人或伙伴把任务拆开，各自完成一小段，最后共同收口。",
    retainedWording: "保留通行原句，只解释协作分工，不扩大为结果保证。",
    plainConsensusMeaning: "多人清楚分工并持续协作，能把单人难做的事推进起来。",
    safeUseDecision: "只作协作方式的趣味观察，不用于保证事业、财富或关系结果。",
    audits: commonAudit,
    reviewedAt: "2026-07-24",
    humanReviewStatus: "pending",
    humanReviewerId: null,
    automatedGate: "sources-cross-checked-awaiting-human-review",
  },
  {
    id: "classical-review-other-mountain",
    kind: "classical",
    saying: "他山之石，可以攻玉",
    attribution: "《诗经》有言",
    usage: ["historical-mirror"],
    attestations: [
      {
        title: "影响人生的经典诗句一览",
        publisherOrInstitution: "北京市语言文字办公室",
        url: "https://jw.beijing.gov.cn/language/ywsh/201612/t20161219_1056612.html",
        exactLocator: "2015-07-06 列表第 4 条，标明《诗经·小雅·鹤鸣》",
      },
      {
        title: "A stone taken from another mountain may serve as a tool to polish the local jade",
        publisherOrInstitution: "国务院新闻办公室",
        url: "https://english.scio.gov.cn/featured/chinakeywords/2022-11/11/content_78514251.htm",
        exactLocator: "2022-11-11 China Keywords 中英文释义段，标明语出《诗经》",
      },
    ],
    familiarSituation: "借另一个人的具体做法照见自己的盲点，再决定哪一步值得试。",
    retainedWording: "保留《诗经》原句，并明确以经典出处引入。",
    plainConsensusMeaning: "别人的经验和批评可以帮助自己修正不足。",
    safeUseDecision: "只作历史镜像的有限趣味类比，不用于宣称人格或命运相同。",
    audits: commonAudit,
    reviewedAt: "2026-07-24",
    humanReviewStatus: "pending",
    humanReviewerId: null,
    automatedGate: "sources-cross-checked-awaiting-human-review",
  },
  {
    id: "classical-review-listen-widely",
    kind: "classical",
    saying: "兼听则明，偏信则暗",
    attribution: "古人有言",
    usage: ["compatibility"],
    attestations: [
      {
        title: "廉吏故事｜兼听则明，偏信则暗",
        publisherOrInstitution: "云南省纪委省监委",
        url: "https://www.ynxc.gov.cn/html/2025/xwcbbdlb_0411/3022728.html",
        exactLocator: "2025-04-11 正文首段，《资治通鉴·唐纪·唐纪八》问答",
      },
      {
        title: "兼听则明",
        publisherOrInstitution: "湖南省纪委监委",
        url: "https://www.sxfj.gov.cn/jing_cai_zhuan_ti/267e63/10943971.shtml",
        exactLocator: "2016-10-18 正文第一至二段，《新唐书·魏征传》及《资治通鉴》卷一百九十二",
      },
    ],
    familiarSituation: "争执中先分别听完双方对同一件事的描述，再确认共同事实。",
    retainedWording: "保留古典原句，以“古人有言”引入，不伪称民间俗语。",
    plainConsensusMeaning: "判断前广泛听取不同意见，比只信一方更不容易遗漏事实。",
    safeUseDecision: "只作沟通修复的有限趣味提醒，不用于裁定谁对谁错或预测关系结果。",
    audits: commonAudit,
    reviewedAt: "2026-07-24",
    humanReviewStatus: "pending",
    humanReviewerId: null,
    automatedGate: "sources-cross-checked-awaiting-human-review",
  },
] as const satisfies readonly ReviewedSaying[];

export function getReviewedSaying(id: SayingReviewId): ReviewedSaying {
  const item = REVIEWED_SAYING_CORPUS.find(candidate => candidate.id === id);
  if (!item) throw new Error(`Reviewed saying does not exist: ${id}`);
  return item;
}

export function getPublicSayingLead(
  id: SayingReviewId,
): PublicSayingLead {
  const item = getReviewedSaying(id);
  return item.kind === "folk"
    ? {
        kind: "folk",
        attribution: item.attribution,
        saying: item.saying,
      }
    : {
        kind: "classical",
        attribution: item.attribution,
        saying: item.saying,
      };
}
