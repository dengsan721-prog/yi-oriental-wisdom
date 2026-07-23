export const DAO_NOTE_CORPUS_VERSION = "dao-note-corpus-v1" as const;

export type DaoNoteTheme =
  | "service"
  | "patience"
  | "bend"
  | "self-knowledge"
  | "reversal"
  | "small-steps"
  | "long-road"
  | "leadership"
  | "flexibility"
  | "completion";

export type DaoNoteIndependentEditionCheck = Readonly<{
  edition: "《老子道德經》（四庫全書本）";
  medium: "Wikisource 固定版本转录";
  sourceUrl: string;
  revisionId: "oldid=633486";
  locator: string;
  checkedText: string;
}>;

export type ReviewedDaoNote = Readonly<{
  id: string;
  chapter: number;
  themes: readonly DaoNoteTheme[];
  sourceTextTraditional: string;
  displayTextSimplified: string;
  traditionalCommentaryStatus:
    | "present"
    | "absent-in-adopted-witness";
  traditionalCommentarySummary: string | null;
  modernStoryMeanings: readonly [string, string];
  usageBoundary: string;
  baseEdition: string;
  sourceUrl: string;
  sourceLocator: string;
  traditionalCommentaryEdition: string;
  traditionalCommentaryUrl: string;
  traditionalCommentaryMedium:
    "OCR 工作文本（仅供定位，不作为独立定本）";
  traditionalCommentaryLocator: string;
  independentEditionCheck: DaoNoteIndependentEditionCheck;
  variantDecision: string;
  verifiedAt: "2026-07-23";
  reviewStatus: "source-cross-checked-awaiting-human";
  reviewerRole: "产品文本校勘";
  humanReviewerId: null;
  checksum: `sha256:${string}`;
}>;

type DaoNotePayload = Omit<ReviewedDaoNote, "checksum">;

const CTEXT_COMMENTARY_URL = "https://ctext.org/wiki.pl?if=gb&res=235636";
const WIKISOURCE_REVISION_URL =
  "https://zh.wikisource.org/w/index.php?title=老子道德經_(四庫全書本)&oldid=633486";
const USAGE_BOUNDARY =
  "仅用于人生故事的转折与回味，不作为命盘、四柱或现实结果的证据。";

function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (
    (typeof value !== "object" || value === null)
    && typeof value !== "function"
  ) {
    return value;
  }
  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);
  for (const child of Object.values(object)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function canonicalizeJsonValue(
  value: unknown,
  ancestors: ReadonlySet<object>,
): string {
  if (value === null || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON rejects non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value.normalize("NFC"));
  }
  if (
    value === undefined
    || typeof value === "function"
    || typeof value === "symbol"
    || typeof value === "bigint"
  ) {
    throw new TypeError(
      `Unsupported canonical JSON value: ${typeof value}`,
    );
  }
  if (typeof value !== "object") {
    throw new TypeError(
      `Unsupported canonical JSON value: ${typeof value}`,
    );
  }
  if (ancestors.has(value)) {
    throw new TypeError("Canonical JSON rejects cyclic values");
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new TypeError("Canonical JSON rejects symbol keys");
  }

  const nextAncestors = new Set(ancestors).add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new TypeError("Canonical JSON rejects sparse arrays");
      }
    }
    return `[${value
      .map(item => canonicalizeJsonValue(item, nextAncestors))
      .join(",")}]`;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Canonical JSON rejects non-plain objects");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .map(raw => ({ raw, normalized: raw.normalize("NFC") }))
    .sort((left, right) =>
      left.normalized < right.normalized
        ? -1
        : left.normalized > right.normalized ? 1 : 0
    );
  if (new Set(keys.map(key => key.normalized)).size !== keys.length) {
    throw new TypeError("Canonical JSON rejects duplicate normalized keys");
  }
  const entries = keys.map(({ raw, normalized }) => {
    if (record[raw] === undefined) {
      throw new TypeError("Canonical JSON rejects undefined");
    }
    return `${JSON.stringify(normalized)}:${canonicalizeJsonValue(
      record[raw],
      nextAncestors,
    )}`;
  });
  return `{${entries.join(",")}}`;
}

function canonicalizeJsonImpl(value: unknown): string {
  return canonicalizeJsonValue(value, new Set());
}

function canonicalizeDaoNoteImpl(note: DaoNotePayload): string {
  return canonicalizeJsonImpl(note);
}

export const canonicalizeJson = Object.freeze(canonicalizeJsonImpl);
export const canonicalizeDaoNote = Object.freeze(canonicalizeDaoNoteImpl);

function independentEditionCheck(
  locator: string,
  checkedText: string,
): DaoNoteIndependentEditionCheck {
  return {
    edition: "《老子道德經》（四庫全書本）",
    medium: "Wikisource 固定版本转录",
    sourceUrl: WIKISOURCE_REVISION_URL,
    revisionId: "oldid=633486",
    locator,
    checkedText,
  };
}

const SHARED_AUDIT_FIELDS = {
  usageBoundary: USAGE_BOUNDARY,
  baseEdition: "中國哲學書電子化計劃《道德經》正文",
  traditionalCommentaryEdition:
    "王弼《老子道德經注》（中國哲學書電子化計劃 OCR 工作文本）",
  traditionalCommentaryUrl: CTEXT_COMMENTARY_URL,
  traditionalCommentaryMedium:
    "OCR 工作文本（仅供定位，不作为独立定本）",
  verifiedAt: "2026-07-23",
  reviewStatus: "source-cross-checked-awaiting-human",
  reviewerRole: "产品文本校勘",
  humanReviewerId: null,
} as const;

const REVIEWED_DAO_NOTE_VALUES: ReviewedDaoNote[] = [
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-08-water",
    chapter: 8,
    themes: ["service"],
    sourceTextTraditional: "上善若水，水善利萬物而不爭",
    displayTextSimplified: "上善若水，水善利万物而不争",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本把水的“不争”落在利物而不求报、处下而不争位；重点是成全而不占有。",
    modernStoryMeanings: [
      "用于合作故事：人物先解决共同需要，不把功劳与回报抢到自己名下。",
      "用于关系转折：让出位置并非退场，而是让资源流到真正需要它的场景。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11599",
    sourceLocator: "paragraph 11599",
    traditionalCommentaryLocator: "上篇·第八章",
    independentEditionCheck: independentEditionCheck(
      "上篇·第八章",
      "上善若水，水善利萬物而不爭",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11599采用；简体展示逐字记录，不作运行时繁简转换。固定Wikisource版本同章交叉检查未见改变本句意思的异文。",
    checksum:
      "sha256:5370f431b11d488eb9b325f036258bae236b853af2f6d811e56a5ae1010dbdd6",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-15-clear",
    chapter: 15,
    themes: ["patience"],
    sourceTextTraditional: "孰能濁以靜之徐清",
    displayTextSimplified: "孰能浊以静之徐清",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本以详慎为读法：浊局不可躁断，守静而待其徐清，事实未定时不抢结论。",
    modernStoryMeanings: [
      "用于混乱场景：人物先停止追加判断，等事实沉淀后再决定下一步。",
      "用于节奏转折：把暂停写成主动观察，而不是拖延或逃避行动。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11606",
    sourceLocator: "paragraph 11606",
    traditionalCommentaryLocator: "上篇·第十五章",
    independentEditionCheck: independentEditionCheck(
      "上篇·第十五章",
      "孰能濁以靜之徐清",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11606采用；简体展示采用“浊、静”，不补标自动转换字符。固定Wikisource版本按上篇第十五章交叉检查。",
    checksum:
      "sha256:ba764f87ec74ddac05d0b6d177a19a72b9194ef43ee11cb7835ed4ff17c1bd47",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-22-whole",
    chapter: 22,
    themes: ["bend"],
    sourceTextTraditional: "曲則全",
    displayTextSimplified: "曲则全",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本以“不自见”说明曲则全：不急于自我彰显，反而能保全所守并让事实显明。",
    modernStoryMeanings: [
      "用于受挫故事：人物暂时转弯以保留关键能力，不把硬撑写成勇敢。",
      "用于关系转折：减少自我彰显，让事实和长期行动重新取得信任。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11613",
    sourceLocator: "paragraph 11613",
    traditionalCommentaryLocator: "上篇·第二十二章",
    independentEditionCheck: independentEditionCheck(
      "上篇·第二十二章",
      "曲則全",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11613采用；简体展示只记录“则”的既定转换，不把“曲则全”改写成现代成语。固定Wikisource版本按本章交叉检查。",
    checksum:
      "sha256:cb08b3dc28d98a8ebd1c20d80b85e6d6ecc2bff193de269bb1128967a5a04016",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-33-self",
    chapter: 33,
    themes: ["self-knowledge"],
    sourceTextTraditional: "知人者智，自知者明；勝人者有力，自勝者強",
    displayTextSimplified: "知人者智，自知者明；胜人者有力，自胜者强",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本区分知人之智与自知之明、胜人之力与自胜之强；自胜指向克服自身偏失。",
    modernStoryMeanings: [
      "用于成长故事：人物把识别人心转回认识自己的边界与真实能力。",
      "用于冲突收束：胜负不落在压过别人，而在改掉自己反复犯的错误。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11624",
    sourceLocator: "paragraph 11624",
    traditionalCommentaryLocator: "上篇·第三十三章",
    independentEditionCheck: independentEditionCheck(
      "上篇·第三十三章",
      "知人者智，自知者明；勝人者有力，自勝者強",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11624采用；分号仅用于产品短句分层，简体字逐项固定。固定Wikisource版本按本章交叉检查。",
    checksum:
      "sha256:91f7cd119008dac4db3122016ce35a11925bdf5fb0d5bcc18ce520d3056c7d55",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-40-return",
    chapter: 40,
    themes: ["reversal"],
    sourceTextTraditional: "反者道之動，弱者道之用",
    displayTextSimplified: "反者道之动，弱者道之用",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本以“反”说明返本之动，以“弱”说明道的作用；反与弱都不是对现实结果的承诺。",
    modernStoryMeanings: [
      "用于逆境转折：人物回到问题起点，借较弱但可持续的行动重新组织局面。",
      "用于变化场景：把后退一步写成校正方向，不把柔弱误写成必然胜利。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11631",
    sourceLocator: "paragraph 11631",
    traditionalCommentaryLocator: "上篇·第四十章",
    independentEditionCheck: independentEditionCheck(
      "上篇·第四十章",
      "反者道之動，弱者道之用",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11631采用；简体展示固定“动”，不把“反”改写成逆袭叙事。固定Wikisource版本按本章交叉检查。",
    checksum:
      "sha256:e7a25912e289e02d722a3f9e37cb76d751099b09d9b362edd3c94267067837c0",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-63-small",
    chapter: 63,
    themes: ["small-steps"],
    sourceTextTraditional: "圖難於其易，為大於其細",
    displayTextSimplified: "图难于其易，为大于其细",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本把“图难于易”落在事势尚易时先作安排，大事则从细处开始，不是轻看困难。",
    modernStoryMeanings: [
      "用于事业故事：人物在问题尚小的时候拆开处理，避免困难累积成失控局面。",
      "用于行动场景：把大目标落到今天能完成的细节，并留下下一步接口。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11654",
    sourceLocator: "paragraph 11654",
    traditionalCommentaryLocator: "下篇·第六十三章",
    independentEditionCheck: independentEditionCheck(
      "下篇·第六十三章",
      "圖難於其易，為大於其細",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11654采用；简体展示固定“图、难、于、为、细”。固定Wikisource版本按下篇第六十三章交叉检查。",
    checksum:
      "sha256:afd3a3e7e4bbe1f20969316df5db7be03545c1ae34677e884da66236b5bea6f9",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-64-road",
    chapter: 64,
    themes: ["long-road"],
    sourceTextTraditional: "千里之行，始於足下",
    displayTextSimplified: "千里之行，始于足下",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本把起步与“慎终如始”连在同一章内：从足下开始，也要到临近完成时仍保持起初的谨慎。",
    modernStoryMeanings: [
      "用于长期故事：人物先走可验证的第一步，再让每一步接续而不是空喊远景。",
      "用于结尾收束：临近完成仍按开始时的谨慎核对，避免最后一步松懈。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11655",
    sourceLocator: "paragraph 11655",
    traditionalCommentaryLocator: "下篇·第六十四章",
    independentEditionCheck: independentEditionCheck(
      "下篇·第六十四章",
      "千里之行，始於足下",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11655采用；简体展示固定“于”。固定Wikisource版本按本章交叉检查，并保留“始於”底本文字。",
    checksum:
      "sha256:3ac2b160c64c94a849295f6a1d76b76d82b3e669f8efd8617162e02c3ab70ce4",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-66-lower",
    chapter: 66,
    themes: ["leadership"],
    sourceTextTraditional: "江海所以能為百谷王者，以其善下之",
    displayTextSimplified: "江海所以能为百谷王者，以其善下之",
    traditionalCommentaryStatus: "absent-in-adopted-witness",
    traditionalCommentarySummary: null,
    modernStoryMeanings: [
      "用于领导故事：人物把位置放低以听见各方需要，再承担汇集与协调责任。",
      "用于团队场景：承载不是讨好，而是让信息、资源和决定有清楚去处。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11657",
    sourceLocator: "paragraph 11657",
    traditionalCommentaryLocator: "下篇·第六十六章",
    independentEditionCheck: independentEditionCheck(
      "下篇·第六十六章",
      "江海所以能為百谷王者，以其善下之",
    ),
    variantDecision:
      "正文短句按CText paragraph 11657采用并逐字固定简体展示；采用的四库王弼本第六十六章无注文，因此摘要留空，绝不据OCR空缺编造注文。",
    checksum:
      "sha256:a383229fcc2fd93240413d7647f7b3e470fcfd0a2972498496641f0fa36ee2cc",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-76-soft",
    chapter: 76,
    themes: ["flexibility"],
    sourceTextTraditional: "強大處下，柔弱處上",
    displayTextSimplified: "强大处下，柔弱处上",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本以生之柔弱、死之坚强说明柔弱能够适应变化；这里的适应不是自我贬低。",
    modernStoryMeanings: [
      "用于变化故事：人物保留调整姿态的能力，不因一时强硬而失去转向空间。",
      "用于危机场景：先松开僵住的做法，再寻找可以适应现实的新行动。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11667",
    sourceLocator: "paragraph 11667",
    traditionalCommentaryLocator: "下篇·第七十六章",
    independentEditionCheck: independentEditionCheck(
      "下篇·第七十六章",
      "強大處下，柔弱處上",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11667采用；简体展示固定“强、处”。固定Wikisource版本按本章交叉检查，不把柔弱改写成屈从。",
    checksum:
      "sha256:f6f79e6adc88b875c213b895aca59aa0e86ed9b9a6889c7e95c614343363fdd7",
  },
  {
    ...SHARED_AUDIT_FIELDS,
    id: "dao-81-no-strife",
    chapter: 81,
    themes: ["completion"],
    sourceTextTraditional: "聖人之道，為而不爭",
    displayTextSimplified: "圣人之道，为而不争",
    traditionalCommentaryStatus: "present",
    traditionalCommentarySummary:
      "王弼工作文本以“为而不争”收束全章：完成应做之事而不与人争夺，行动不以占有为终点。",
    modernStoryMeanings: [
      "用于成事故事：人物完成该做的工作，不把最后一段变成争夺功劳。",
      "用于全篇收束：行动已经落地便放下比较，让结果回到真实受益者。",
    ],
    sourceUrl: "https://ctext.org/dao-de-jing/zh#n11672",
    sourceLocator: "paragraph 11672",
    traditionalCommentaryLocator: "下篇·第八十一章",
    independentEditionCheck: independentEditionCheck(
      "下篇·第八十一章",
      "聖人之道，為而不爭",
    ),
    variantDecision:
      "繁体短句按CText paragraph 11672采用；简体展示固定“圣、为、争”。固定Wikisource版本按下篇第八十一章交叉检查。",
    checksum:
      "sha256:7d7b08897a87c78a8d33941133e77080f8c2c6c457311cf0b321860b45cb6634",
  },
];

export const REVIEWED_DAO_NOTES: readonly ReviewedDaoNote[] =
  deepFreeze(REVIEWED_DAO_NOTE_VALUES);

const VALID_THEMES = new Set<DaoNoteTheme>([
  "service",
  "patience",
  "bend",
  "self-knowledge",
  "reversal",
  "small-steps",
  "long-road",
  "leadership",
  "flexibility",
  "completion",
]);

function validateSelectionInput(
  themes: readonly DaoNoteTheme[],
  bounds: { min: number; max: number },
): void {
  if (!Array.isArray(themes)) {
    throw new TypeError("Dao note themes must be an array");
  }
  for (let index = 0; index < themes.length; index += 1) {
    if (!Object.hasOwn(themes, index)) {
      throw new TypeError("Dao note themes reject sparse arrays");
    }
    if (!VALID_THEMES.has(themes[index])) {
      throw new TypeError(`Unknown Dao note theme: ${String(themes[index])}`);
    }
  }
  if (
    bounds === null
    || typeof bounds !== "object"
    || !Number.isInteger(bounds.min)
    || !Number.isInteger(bounds.max)
    || bounds.min < 2
    || bounds.max > 4
    || bounds.min > bounds.max
  ) {
    throw new TypeError(
      "Dao note bounds require integers with 2 <= min <= max <= 4",
    );
  }
}

function selectReviewedDaoNotesImpl(
  themes: readonly DaoNoteTheme[],
  bounds: { min: number; max: number },
): readonly ReviewedDaoNote[] {
  validateSelectionInput(themes, bounds);
  const selected: ReviewedDaoNote[] = [];
  const selectedIds = new Set<string>();
  const add = (note: ReviewedDaoNote): void => {
    if (selected.length >= bounds.max || selectedIds.has(note.id)) return;
    selected.push(note);
    selectedIds.add(note.id);
  };

  for (const theme of themes) {
    for (const note of REVIEWED_DAO_NOTES) {
      if (note.themes.includes(theme)) add(note);
    }
  }
  if (selected.length < bounds.min) {
    for (const fallbackId of ["dao-33-self", "dao-64-road"]) {
      const fallback = REVIEWED_DAO_NOTES.find(
        note => note.id === fallbackId,
      );
      if (fallback) add(fallback);
      if (selected.length >= bounds.min) break;
    }
  }
  if (selected.length < bounds.min) {
    for (const note of REVIEWED_DAO_NOTES) {
      add(note);
      if (selected.length >= bounds.min) break;
    }
  }
  return deepFreeze(selected);
}

export const selectReviewedDaoNotes = Object.freeze(
  selectReviewedDaoNotesImpl,
);
