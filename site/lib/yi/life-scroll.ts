import {
  REVIEWED_DAO_NOTES,
  selectReviewedDaoNotes,
  type DaoNoteTheme,
  type ReviewedDaoNote,
} from "./dao-note-corpus";
import {
  selectStableStoryFacts,
  type StableStoryUncertaintyFlag,
} from "./stable-story-facts";
import {
  buildStoryMirrors,
  type StoryMirror,
} from "./story-mirrors";
import type {
  FourPillarsResult,
  InterpretationItem,
  ProfessionalReport,
} from "./types";

export type StoryBeatId =
  | "situation"
  | "desire"
  | "opening"
  | "cost"
  | "low-point"
  | "choice"
  | "turn"
  | "mature-method";

export type StoryBeat = Readonly<{
  id: StoryBeatId;
  text: string;
  internalEvidenceId: string | null;
}>;

export type DaoStoryContext = Readonly<{
  tension: string;
  turn: string;
  scene: string;
  action: string;
}>;

export type DaoStoryNote = Readonly<{
  internalSourceId: string;
  excerpt: string;
  placement: "career" | "relationship" | "turning-point" | "closing";
  plainCommentary: Readonly<{
    traditionalMeaning: string;
    storyConnection: string;
    sceneGuidance: string;
  }>;
}>;

export type DaoStoryNoteResult = Readonly<{
  daoNotes: readonly DaoStoryNote[];
  uncertaintyFlags: readonly string[];
}>;

export type LifeScrollNarrative = Readonly<{
  oneLineTheme: string;
  openingScene: readonly string[];
  careerArc: readonly string[];
  relationshipArc: readonly string[];
  turningPointArc: readonly string[];
  matureArc: readonly string[];
  animalInterlude: StoryMirror;
  historicalInterlude: StoryMirror;
  daoNotes: readonly DaoStoryNote[];
  closingLine: string;
  actionNow: string;
  internalStoryBeats: readonly StoryBeat[];
  internalEvidenceIds: readonly string[];
  uncertaintyFlags: readonly string[];
}>;

type MissingDomain = "career" | "relationship" | "rhythm";
type UsableDaoNote = ReviewedDaoNote & {
  traditionalCommentarySummary: string;
};

const UNKNOWN_TIME_SENTENCE =
  "出生时间没有确认，与一天具体时段有关的内容暂时留白。";

const DAO_PLACEMENTS: readonly DaoStoryNote["placement"][] = [
  "career",
  "relationship",
  "turning-point",
  "closing",
];

const NEUTRAL_BEATS: Readonly<Record<StoryBeatId, string>> = {
  situation:
    "眼前可能同时有几件重要的事需要处理，信息尚未齐全，责任和个人容量也还没有被放到同一张清单里。",
  desire:
    "真正想靠近的不是表面的忙碌，而是一种更清楚的推进方式：知道为何开始、和谁同行，也知道何时应该暂停。",
  opening:
    "新的入口常出现在任务仍可小步试验的时候，可以先确认对象、目标和反馈方式，再决定是否继续投入更多资源。",
  cost:
    "若为了尽快获得确定感而一次承担过多，边界、依赖和验收条件会被挤到后面，返工与疲惫便容易同时增加。",
  "low-point":
    "局面吃力时，最难的未必是能力不足，而是各方都用自己的解释填补空白，原本可协商的问题逐渐变成防御。",
  choice:
    "新的选择从停止猜测开始：把事实、影响、需要和下一步分别说清，允许相关的人补充信息或明确不同意见。",
  turn:
    "转折不必依靠突然改变，可以先减掉一项额外负担，恢复基本节奏，再用一次可逆的小行动检验真实变化。",
  "mature-method":
    "成熟的方法会把目标、资源、边界、复盘和退出条件放在一起，让坚持有补给，让调整有理由，也让同行者有声音。",
};

function deepFreeze<T>(value: T, seen = new Set<object>()): Readonly<T> {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
}

function toStoryText(value: string): string {
  return value
    .replaceAll("四柱", "原始坐标")
    .replaceAll("日主", "自我观察点")
    .replaceAll("十神", "关系称谓")
    .replaceAll("月令", "季节条件")
    .replaceAll("旺衰", "起伏")
    .replaceAll("藏干", "内在线索")
    .replaceAll("纳音", "附加称谓")
    .replaceAll("十二长生", "阶段称谓")
    .replaceAll("干支关系", "结构互动")
    .replaceAll("专业依据", "观察线索")
    .replaceAll("本章来源", "本段来路")
    .replaceAll("可靠级", "可信层次")
    .replaceAll("证据等级", "材料层次")
    .replaceAll("计算规则", "整理方法")
    .replaceAll("规则 ID", "内部编号")
    .replaceAll("数据来源清单", "材料目录");
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

function isUsableDaoNote(note: ReviewedDaoNote): note is UsableDaoNote {
  return typeof note.traditionalCommentarySummary === "string"
    && note.traditionalCommentarySummary.trim().length > 0;
}

function buildDaoNote(
  note: UsableDaoNote,
  context: DaoStoryContext,
  placement: DaoStoryNote["placement"],
): DaoStoryNote {
  const summary = toStoryText(note.traditionalCommentarySummary);
  const tension = clipHan(
    toStoryText(context.tension).replaceAll("证明", "显示"),
    24,
  );
  const turn = clipHan(toStoryText(context.turn), 24);
  const scene = clipHan(toStoryText(context.scene), 15);
  const action = clipHan(toStoryText(context.action), 20);

  return {
    internalSourceId: note.id,
    excerpt: note.displayTextSimplified,
    placement,
    plainCommentary: {
      traditionalMeaning:
        `${summary}这段说明只帮助理解行动分寸，仍要核对眼前条件，不能替现实选择下结论。`,
      storyConnection:
        `故事里的张力是${tension}；转折发生在${turn}。这句古语只作为回望行动的镜子，帮助分辨哪些选择仍可调整，不用来确认任何经历或结果。`,
      sceneGuidance:
        `放到${scene}里，可以先${action}，再约定检查时间、可接受范围和停止条件。动作不求宏大，只要相关的人能看见变化、提出异议，并依真实反馈继续修正。`,
    },
  };
}

export function buildDaoStoryNotes(
  themes: readonly DaoNoteTheme[],
  context: DaoStoryContext,
): DaoStoryNoteResult {
  const selected = selectReviewedDaoNotes(themes, { min: 2, max: 4 });
  const usable: UsableDaoNote[] = selected.filter(isUsableDaoNote);
  const selectedIds = new Set(usable.map(note => note.id));
  const uncertaintyFlags = selected
    .filter(note => !isUsableDaoNote(note))
    .map(note => `dao-note-fallback:${note.id}`);

  const addFallback = (note: ReviewedDaoNote | undefined): void => {
    if (
      usable.length < 4
      && note
      && isUsableDaoNote(note)
      && !selectedIds.has(note.id)
    ) {
      usable.push(note);
      selectedIds.add(note.id);
    }
  };

  for (const missing of uncertaintyFlags) {
    if (!missing) continue;
    addFallback(REVIEWED_DAO_NOTES.find(note => note.id === "dao-33-self"));
    if (usable.length >= selected.length) break;
    addFallback(REVIEWED_DAO_NOTES.find(note => note.id === "dao-64-road"));
  }
  for (const fallbackId of ["dao-33-self", "dao-64-road"]) {
    if (usable.length >= 2) break;
    addFallback(REVIEWED_DAO_NOTES.find(note => note.id === fallbackId));
  }
  for (const note of REVIEWED_DAO_NOTES) {
    if (usable.length >= 2) break;
    addFallback(note);
  }

  const daoNotes = usable.slice(0, 4).map((note, index) =>
    buildDaoNote(note, context, DAO_PLACEMENTS[index] ?? "closing")
  );
  return deepFreeze({ daoNotes, uncertaintyFlags });
}

function firstInDomain(
  items: readonly InterpretationItem[],
  domain: InterpretationItem["domain"],
): InterpretationItem | undefined {
  return items.find(item => item.domain === domain);
}

function beat(
  id: StoryBeatId,
  item: InterpretationItem | undefined,
  field:
    | "scenario"
    | "advantageVersion"
    | "shadowVersion"
    | "actionNow"
    | "actionLongTerm",
): StoryBeat {
  return {
    id,
    text: item ? toStoryText(item[field]) : NEUTRAL_BEATS[id],
    internalEvidenceId: item?.id ?? null,
  };
}

function paragraph(text: string, reflection: string): string {
  return `${text}${reflection}`;
}

export function buildLifeScrollNarrative(
  chart: FourPillarsResult,
  report: ProfessionalReport,
  items: readonly InterpretationItem[],
): LifeScrollNarrative {
  const stable = selectStableStoryFacts(chart, report, items);
  const stableItems = stable.interpretations;
  const self = firstInDomain(stableItems, "self");
  const talent = firstInDomain(stableItems, "talent");
  const career = firstInDomain(stableItems, "career");
  const relationship = firstInDomain(stableItems, "relationship");
  const rhythm = firstInDomain(stableItems, "rhythm");

  const internalStoryBeats: StoryBeat[] = [
    beat("situation", self, "scenario"),
    beat("desire", talent, "advantageVersion"),
    beat("opening", career, "advantageVersion"),
    beat("cost", career, "shadowVersion"),
    beat("low-point", relationship, "shadowVersion"),
    beat("choice", relationship, "actionNow"),
    beat("turn", rhythm, "actionNow"),
    beat("mature-method", rhythm, "actionLongTerm"),
  ];
  const byId = Object.fromEntries(
    internalStoryBeats.map(item => [item.id, item]),
  ) as Record<StoryBeatId, StoryBeat>;

  const daoResult = buildDaoStoryNotes(
    ["self-knowledge", "long-road"],
    {
      tension: byId.cost.text,
      turn: byId.turn.text,
      scene: relationship
        ? relationship.scenario
        : "一次需要重新商量边界的对话",
      action: byId.choice.text,
    },
  );
  const mirrors = buildStoryMirrors(chart);
  const missingDomains = ([
    ["career", career],
    ["relationship", relationship],
    ["rhythm", rhythm],
  ] as const)
    .filter((entry): entry is readonly [MissingDomain, undefined] => !entry[1])
    .map(([domain]) => `missing-domain:${domain}`);
  const uncertaintyFlags = [
    ...stable.uncertaintyFlags,
    ...missingDomains,
    ...daoResult.uncertaintyFlags,
  ];
  const unknownTimeSuffix = stable.hourUnknown ? UNKNOWN_TIME_SENTENCE : "";

  const narrative: LifeScrollNarrative = {
    oneLineTheme: "把敏锐判断化为有边界、可复盘、能长期同行的行动",
    openingScene: [
      paragraph(
        byId.situation.text,
        "先不急着给自己定性，而是把正在发生的事、还缺的信息和可承担的范围分开。这样做会让局面从一团压力，慢慢变成能够讨论的几个现实问题。",
      ),
      paragraph(
        byId.desire.text,
        `愿望被说清以后，路线仍可保持开放：先做一项小而可逆的尝试，再看反馈是否支持继续。方向不是一次猜中的答案，而是在行动、回应和修正之间逐步形成。${unknownTimeSuffix}`,
      ),
    ],
    careerArc: [
      paragraph(
        byId.opening.text,
        "入口出现时，先确认要解决的问题、能够调用的资源和谁来验收，比急着证明能力更重要。清楚的第一步能为合作留下接口，也能让投入随事实增加。",
      ),
      paragraph(
        byId.cost.text,
        "代价被看见并不等于退缩，而是提醒你检查权限、依赖和恢复成本。若条件不足，可以缩小范围、重新分工或约定停止点，让推进速度服从真实容量。",
      ),
    ],
    relationshipArc: [
      paragraph(
        byId["low-point"].text,
        "低处的价值是让隐藏循环变得可见：谁在猜测，谁在防御，哪些请求从未被完整说出。先把人和问题分开，关系才有机会从互相判断回到共同处理。",
      ),
      paragraph(
        byId.choice.text,
        "选择之后还要给对方回应空间。一次对话只确认一个可观察动作，并约好何时重谈；真正的修复不靠立刻一致，而靠边界清楚、承诺适量和后续确实发生。",
      ),
    ],
    turningPointArc: [
      paragraph(
        byId.turn.text,
        "转弯之后先观察身体、注意力和协作是否真的改善，不用把短暂轻松写成彻底改变。若反馈不同，就调整动作而不是责怪自己，让方法继续接受现实校验。",
      ),
      "有些变化来自减少：少接一项无边界责任，少用一个未经核对的解释，少把沉默当成默认同意。空出来的位置可以容纳提问、求助和新的分工，也让重要目标重新获得稳定节奏。",
    ],
    matureArc: [
      paragraph(
        byId["mature-method"].text,
        "长期做法不是把生活管得更紧，而是为变化预留位置。每次复盘只调整一个关键变量，记录什么有效、什么无效，以及下一次需要谁共同参与，经验便会逐步沉淀。",
      ),
      "当判断变得更成熟，你仍可以保留敏锐和速度，只是不再让它们单独作主。事实负责校正方向，边界保护持续投入，关系提供不同视角，而停止条件保证任何选择都能被重新审视。",
    ],
    animalInterlude: mirrors.animal,
    historicalInterlude: mirrors.historical,
    daoNotes: daoResult.daoNotes,
    closingLine:
      "这卷故事不替你预告结局，它只把可以核对的处境、代价与选择放在眼前；真正的方向，会由下一次诚实行动和随后收到的现实反馈共同写成。",
    actionNow:
      "今天先选一件正在推进的事，写下目标、可用资源、一个停止条件和下一次检查时间，再邀请一位相关的人补充你没有看见的部分。",
    internalStoryBeats,
    internalEvidenceIds: [
      ...new Set(internalStoryBeats.flatMap(item =>
        item.internalEvidenceId ? [item.internalEvidenceId] : []
      )),
    ],
    uncertaintyFlags,
  };

  return deepFreeze(narrative);
}

export type LifeScrollUncertaintyFlag =
  | StableStoryUncertaintyFlag
  | `missing-domain:${MissingDomain}`
  | `dao-note-fallback:${string}`;
