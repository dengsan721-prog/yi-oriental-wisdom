import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  REVIEWED_NAME_CHARACTERS,
  REVIEWED_TRADITIONAL_PAIRS,
} from "../../lib/yi/name-data";
import {
  NAME_ELEMENT_COVERAGE_VERSION,
  NAME_ELEMENT_RULES,
  NAME_ELEMENT_SOURCES,
  REVIEWED_NAME_ELEMENT_RECORDS,
  getReviewedNameElementRecommendations,
  resolveReviewedNameElement,
} from "../../lib/yi/name-element-data";
import type { ElementName } from "../../lib/yi/types";
import {
  COMMON_NAME_COVERAGE_SAMPLE_V1,
  FULL_NAME_EVIDENCE_SOURCES,
} from "../fixtures/yi/name-element-coverage-common-names-v1";

const EXPECTED_RECOMMENDATIONS = {
  木: [
    ["林", "lín", "双木成林，取树木聚生成长之义"],
    ["森", "sēn", "木多成森，取繁茂有生机之义"],
    ["桐", "tóng", "梧桐之木，取挺立舒展之义"],
    ["楠", "nán", "楠木常青，取坚实沉稳之义"],
    ["竹", "zhú", "竹有节而生，取挺拔有度之义"],
    ["禾", "hé", "谷物幼苗，取生长收成之义"],
  ],
  火: [
    ["明", "míng", "日月照临，取光明清楚之义"],
    ["昕", "xīn", "太阳将出，取破晓初明之义"],
    ["晗", "hán", "天将明亮，取晨光渐起之义"],
    ["煦", "xù", "温暖和煦，取暖意照拂之义"],
    ["晟", "shèng", "光明旺盛，取明盛向上之义"],
    ["晴", "qíng", "雨止天清，取日光明朗之义"],
  ],
  土: [
    ["安", "ān", "安定安稳，取有所安处之义"],
    ["辰", "chén", "日月星辰，取时序有位之义"],
    ["宇", "yǔ", "屋宇空间，取安居开阔之义"],
    ["岚", "lán", "山间雾气，取山气沉静之义"],
    ["坤", "kūn", "坤为大地，取厚重承载之义"],
    ["城", "chéng", "城垣守护，取稳固有界之义"],
  ],
  金: [
    ["锦", "jǐn", "有彩纹的丝织品，取华美有章之义"],
    ["钧", "jūn", "古代重量单位，取持衡有度之义"],
    ["锐", "ruì", "锋利敏锐，取清晰进取之义"],
    ["铭", "míng", "刻写记述，取铭记自持之义"],
    ["铠", "kǎi", "护身铠甲，取坚定守护之义"],
    ["铃", "líng", "金属响器，取清亮有声之义"],
  ],
  水: [
    ["涵", "hán", "水泽包容，取涵养容纳之义"],
    ["泽", "zé", "水聚润泽，取滋养惠及之义"],
    ["沐", "mù", "以水洗濯，取清润更新之义"],
    ["清", "qīng", "水澄而清，取清澈明净之义"],
    ["澜", "lán", "水面大波，取开阔有势之义"],
    ["川", "chuān", "河流川流，取流动通达之义"],
  ],
} as const;

const ELEMENTS = ["木", "火", "土", "金", "水"] as const;

const EXPECTED_CTEXT_SIMPLIFIED_NAMES_1_TO_99 = [
  "宋江",
  "卢俊义",
  "吴用",
  "公孙胜",
  "关胜",
  "林冲",
  "秦明",
  "呼延灼",
  "花荣",
  "柴进",
  "李应",
  "朱仝",
  "鲁智深",
  "武松",
  "董平",
  "张清",
  "杨志",
  "徐宁",
  "索超",
  "戴宗",
  "刘唐",
  "李逵",
  "史进",
  "穆弘",
  "雷横",
  "李俊",
  "阮小二",
  "张横",
  "阮小五",
  "张顺",
  "阮小七",
  "杨雄",
  "石秀",
  "解珍",
  "解宝",
  "燕青",
  "朱武",
  "黄信",
  "孙立",
  "宣赞",
  "郝思文",
  "韩滔",
  "彭玘",
  "单廷圭",
  "魏定国",
  "萧让",
  "裴宣",
  "欧鹏",
  "邓飞",
  "燕顺",
  "杨林",
  "凌振",
  "蒋敬",
  "吕方",
  "郭盛",
  "安道全",
  "皇甫端",
  "王英",
  "扈三娘",
  "鲍旭",
  "樊瑞",
  "孔明",
  "孔亮",
  "项充",
  "李衮",
  "金大坚",
  "马麟",
  "童威",
  "童猛",
  "孟康",
  "侯健",
  "陈达",
  "杨春",
  "郑天寿",
  "陶宗旺",
  "宋清",
  "乐和",
  "龚旺",
  "丁得孙",
  "穆春",
  "曹正",
  "宋万",
  "杜迁",
  "薛永",
  "施恩",
  "周通",
  "李忠",
  "杜兴",
  "汤隆",
  "邹润",
  "邹渊",
  "朱富",
  "朱贵",
  "蔡福",
  "蔡庆",
  "李立",
  "李云",
  "焦挺",
  "石勇",
] as const;

function codePoints(value: string): string[] {
  return Array.from(
    value,
    glyph => `U+${glyph.codePointAt(0)!.toString(16).toUpperCase()}`,
  );
}

function overlap(left: readonly string[], right: readonly string[]): string[] {
  const rightIds = new Set(right);
  return left.filter(id => rightIds.has(id));
}

describe("reviewed name-element data", () => {
  it("keeps separate traceable facts and distinct internal review trace labels", () => {
    expect(NAME_ELEMENT_COVERAGE_VERSION).toBe("name-element-coverage-v1");
    const sourceIds = new Set(NAME_ELEMENT_SOURCES.map(source => source.id));
    const ruleIds = new Set(NAME_ELEMENT_RULES.map(rule => rule.id));

    expect(sourceIds.size).toBe(NAME_ELEMENT_SOURCES.length);
    for (const source of NAME_ELEMENT_SOURCES) {
      expect(source.id.trim()).not.toBe("");
      expect(source.title.trim()).not.toBe("");
      expect(source.publisher.trim()).not.toBe("");
      expect(source.locator.trim()).not.toBe("");
      if (source.url !== null) {
        expect(source.url).toMatch(/^https:\/\//);
      }
      expect(source.useBasis.trim()).not.toBe("");
    }

    expect(ruleIds.size).toBe(NAME_ELEMENT_RULES.length);
    for (const rule of NAME_ELEMENT_RULES) {
      expect(rule.version).toBe(NAME_ELEMENT_COVERAGE_VERSION);
      expect(rule.adoptedPrinciple).toContain("产品");
      expect(rule.adoptedPrinciple).toMatch(/不(?:是|声称).*逐字|不把.*逐字/);
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of rule.sourceIds) {
        expect(sourceIds.has(sourceId)).toBe(true);
      }
      expect(rule.primaryReview).toMatchObject({
        role: "姓名文化内容复核",
        reviewerId: "yi-name-element-primary-2026-07-23",
        reviewedOn: "2026-07-23",
        recordEvidenceId: rule.id,
      });
      expect(rule.secondReview).toMatchObject({
        role: "姓名文化第二复核",
        reviewerId: "yi-name-element-secondary-2026-07-23",
        reviewedOn: "2026-07-23",
        recordEvidenceId: rule.id,
      });
      expect(rule.primaryReview.locator).toContain(rule.id);
      expect(rule.secondReview.locator).toContain(rule.id);
      expect(rule.primaryReview.reviewerId).not.toBe(
        rule.secondReview.reviewerId,
      );
    }

    expect(new Set(REVIEWED_NAME_ELEMENT_RECORDS.map(record => record.id)).size)
      .toBe(REVIEWED_NAME_ELEMENT_RECORDS.length);
    expect(REVIEWED_NAME_ELEMENT_RECORDS.some(
      record => record.reviewDecision === "pending",
    )).toBe(true);

    for (const record of REVIEWED_NAME_ELEMENT_RECORDS) {
      expect(record.codePoints).toEqual(codePoints(record.glyph));
      expect(record.adoptedMeaning.trim()).not.toBe("");
      expect(record.displayPinyin.trim()).not.toBe("");
      expect(record.glyphSourceIds.length).toBeGreaterThan(0);
      expect(record.readingSourceIds.length).toBeGreaterThan(0);
      expect(record.meaningSourceIds.length).toBeGreaterThan(0);
      expect(record.meaningSourceIds).not.toContain(
        "unicode-unihan-17-kdefinition",
      );
      expect(overlap(record.glyphSourceIds, record.readingSourceIds)).toEqual([]);
      expect(overlap(record.glyphSourceIds, record.meaningSourceIds)).toEqual([]);
      expect(overlap(record.readingSourceIds, record.meaningSourceIds)).toEqual([]);
      for (const sourceId of [
        ...record.glyphSourceIds,
        ...record.readingSourceIds,
        ...record.meaningSourceIds,
      ]) {
        expect(sourceIds.has(sourceId)).toBe(true);
      }
      expect(ruleIds.has(record.elementRuleId)).toBe(true);
      expect(record.elementRationale).toContain("内部");
      expect(record.elementRationale).toMatch(/不是古籍逐字|不把古籍当作逐字/);
      expect(record.ruleVersion).toBe(NAME_ELEMENT_COVERAGE_VERSION);
      expect(record.primaryReview).toMatchObject({
        role: "姓名文化内容复核",
        reviewerId: "yi-name-element-primary-2026-07-23",
        reviewedOn: "2026-07-23",
        recordEvidenceId: record.id,
      });
      expect(record.secondReview).toMatchObject({
        role: "姓名文化第二复核",
        reviewerId: "yi-name-element-secondary-2026-07-23",
        reviewedOn: "2026-07-23",
        recordEvidenceId: record.id,
      });
      expect(record.primaryReview.locator).toContain(record.id);
      expect(record.secondReview.locator).toContain(record.id);

      if (record.reviewDecision === "pending") {
        expect(record.element).toBeNull();
        expect(record.unresolvedAlternatives.length).toBeGreaterThanOrEqual(2);
        expect(record.recommendation).toBe(false);
        expect(resolveReviewedNameElement({
          inputGlyph: record.glyph,
          adoptedGlyph: record.glyph,
          adoptedReading: record.displayPinyin,
          adoptedMeaning: record.adoptedMeaning,
        })).toMatchObject({
          status: "pending",
          reason: "element-classification-pending",
          glyph: record.glyph,
        });
      } else {
        expect(record.element).not.toBeNull();
        expect(record.unresolvedAlternatives).toEqual([]);
      }
    }
  });

  it("deep-freezes every exported audit object and blocks shared review pollution", () => {
    expect(Object.isFrozen(NAME_ELEMENT_SOURCES)).toBe(true);
    expect(Object.isFrozen(NAME_ELEMENT_RULES)).toBe(true);
    expect(Object.isFrozen(REVIEWED_NAME_ELEMENT_RECORDS)).toBe(true);

    for (const source of NAME_ELEMENT_SOURCES) {
      expect(Object.isFrozen(source)).toBe(true);
    }
    for (const rule of NAME_ELEMENT_RULES) {
      expect(Object.isFrozen(rule)).toBe(true);
      expect(Object.isFrozen(rule.sourceIds)).toBe(true);
      expect(Object.isFrozen(rule.primaryReview)).toBe(true);
      expect(Object.isFrozen(rule.secondReview)).toBe(true);
    }
    for (const record of REVIEWED_NAME_ELEMENT_RECORDS) {
      expect(Object.isFrozen(record)).toBe(true);
      expect(Object.isFrozen(record.codePoints)).toBe(true);
      expect(Object.isFrozen(record.glyphSourceIds)).toBe(true);
      expect(Object.isFrozen(record.readingSourceIds)).toBe(true);
      expect(Object.isFrozen(record.meaningSourceIds)).toBe(true);
      expect(Object.isFrozen(record.unresolvedAlternatives)).toBe(true);
      expect(Object.isFrozen(record.primaryReview)).toBe(true);
      expect(Object.isFrozen(record.secondReview)).toBe(true);
    }

    const recommendations = getReviewedNameElementRecommendations("木");
    expect(Object.isFrozen(recommendations)).toBe(true);
    const lin = recommendations.find(record => record.glyph === "林")!;
    const other = REVIEWED_NAME_ELEMENT_RECORDS.find(
      record => record.id !== lin.id,
    )!;
    expect(lin.primaryReview).not.toBe(other.primaryReview);

    const before = resolveReviewedNameElement({
      inputGlyph: lin.glyph,
      adoptedGlyph: lin.glyph,
      adoptedReading: lin.displayPinyin,
      adoptedMeaning: lin.adoptedMeaning,
    });
    expect(Reflect.set(lin, "element", "火")).toBe(false);
    expect(Reflect.set(
      lin.primaryReview,
      "reviewerId",
      "polluted-review-id",
    )).toBe(false);
    expect(() => Object.defineProperty(lin, "element", {
      value: "火",
    })).toThrow();
    expect(lin.element).toBe("木");
    expect(other.primaryReview.reviewerId).toBe(
      "yi-name-element-primary-2026-07-23",
    );
    expect(resolveReviewedNameElement({
      inputGlyph: lin.glyph,
      adoptedGlyph: lin.glyph,
      adoptedReading: lin.displayPinyin,
      adoptedMeaning: lin.adoptedMeaning,
    })).toEqual(before);
  });

  it("keeps one canonical record for every exact glyph-reading-meaning key", () => {
    const exactKeys = REVIEWED_NAME_ELEMENT_RECORDS.map(
      record => JSON.stringify([
        record.glyph,
        record.displayPinyin,
        record.adoptedMeaning,
      ]),
    );
    expect(new Set(exactKeys).size).toBe(exactKeys.length);

    const source = readFileSync(
      new URL("../../lib/yi/name-element-data.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("Duplicate reviewed name element exact key");
  });

  it("exports a literal 100-object fixture without factories or call generation", () => {
    const source = readFileSync(
      new URL(
        "../fixtures/yi/name-element-coverage-common-names-v1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const file = ts.createSourceFile(
      "name-element-coverage-common-names-v1.ts",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    let initializer: ts.ArrayLiteralExpression | null = null;
    file.forEachChild(node => {
      if (!ts.isVariableStatement(node)) return;
      for (const declaration of node.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name)
          && declaration.name.text === "COMMON_NAME_COVERAGE_SAMPLE_V1"
          && declaration.initializer
          && ts.isArrayLiteralExpression(declaration.initializer)
        ) {
          initializer = declaration.initializer;
        }
      }
    });

    expect(initializer).not.toBeNull();
    expect(initializer!.elements).toHaveLength(100);
    expect(initializer!.elements.every(ts.isObjectLiteralExpression)).toBe(true);
    const calls: string[] = [];
    function visit(node: ts.Node): void {
      if (ts.isCallExpression(node)) {
        calls.push(node.getText(file));
      }
      ts.forEachChild(node, visit);
    }
    visit(initializer!);
    expect(calls).toEqual([]);
  });

  it("resolves only an exact adopted glyph, reading, meaning, and reviewed decision", () => {
    const approved = getReviewedNameElementRecommendations("木")[0]!;
    expect(resolveReviewedNameElement({
      inputGlyph: approved.glyph,
      adoptedGlyph: null,
      adoptedReading: approved.displayPinyin,
      adoptedMeaning: approved.adoptedMeaning,
    })).toEqual({ status: "pending", reason: "glyph-unconfirmed", glyph: null });
    expect(resolveReviewedNameElement({
      inputGlyph: "㐀",
      adoptedGlyph: "㐀",
      adoptedReading: "qiū",
      adoptedMeaning: "测试",
    })).toEqual({ status: "pending", reason: "unreviewed-character", glyph: "㐀" });
    expect(resolveReviewedNameElement({
      inputGlyph: approved.glyph,
      adoptedGlyph: approved.glyph,
      adoptedReading: null,
      adoptedMeaning: approved.adoptedMeaning,
    })).toEqual({ status: "pending", reason: "reading-unconfirmed", glyph: approved.glyph });
    expect(resolveReviewedNameElement({
      inputGlyph: approved.glyph,
      adoptedGlyph: approved.glyph,
      adoptedReading: "wrong",
      adoptedMeaning: approved.adoptedMeaning,
    })).toEqual({ status: "pending", reason: "reading-unconfirmed", glyph: approved.glyph });
    expect(resolveReviewedNameElement({
      inputGlyph: approved.glyph,
      adoptedGlyph: approved.glyph,
      adoptedReading: approved.displayPinyin,
      adoptedMeaning: null,
    })).toEqual({ status: "pending", reason: "meaning-unconfirmed", glyph: approved.glyph });
    expect(resolveReviewedNameElement({
      inputGlyph: approved.glyph,
      adoptedGlyph: approved.glyph,
      adoptedReading: approved.displayPinyin,
      adoptedMeaning: "近义但不是已复核的精确文案",
    })).toEqual({ status: "pending", reason: "meaning-unconfirmed", glyph: approved.glyph });
    expect(resolveReviewedNameElement({
      inputGlyph: approved.glyph,
      adoptedGlyph: approved.glyph,
      adoptedReading: approved.displayPinyin,
      adoptedMeaning: approved.adoptedMeaning,
    })).toEqual({ status: "approved", record: approved });
  });

  it("keeps every existing reviewed name meaning available as an exact non-probabilistic record", () => {
    const readings: Readonly<Record<string, string>> = {
      林: "lín", 知: "zhī", 远: "yuǎn", 临: "lín", 川: "chuān",
      艺: "yì", 涵: "hán", 一: "yī", 诺: "nuò", 梓: "zǐ",
      泽: "zé", 沐: "mù", 辰: "chén", 宇: "yǔ", 欣: "xīn",
    };

    for (const existing of REVIEWED_NAME_CHARACTERS) {
      const reading = readings[existing.glyph];
      expect(reading, existing.glyph).toBeDefined();
      const resolution = resolveReviewedNameElement({
        inputGlyph: existing.glyph,
        adoptedGlyph: existing.glyph,
        adoptedReading: reading!,
        adoptedMeaning: existing.meaning,
      });
      expect(resolution.status, existing.glyph).toBe("approved");
      if (resolution.status === "approved") {
        expect(resolution.record.recommendation).toBe(false);
        expect(resolution.record.adoptedMeaning).toBe(existing.meaning);
      }
    }

    for (const pair of REVIEWED_TRADITIONAL_PAIRS) {
      for (const reading of pair.readings) {
        const resolution = resolveReviewedNameElement({
          inputGlyph: pair.inputGlyph,
          adoptedGlyph: pair.adoptedGlyph,
          adoptedReading: reading.pinyin,
          adoptedMeaning: pair.meaning,
        });
        expect(
          resolution.status,
          `${pair.adoptedGlyph} ${reading.pinyin}`,
        ).toBe("approved");
        if (resolution.status === "approved") {
          expect(resolution.record.recommendation).toBe(false);
        }
      }
    }
  });

  it("accepts only the same glyph or a reviewed traditional adoption relation", () => {
    const lin = getReviewedNameElementRecommendations("木").find(
      record => record.glyph === "林",
    )!;
    expect(resolveReviewedNameElement({
      inputGlyph: "明",
      adoptedGlyph: "林",
      adoptedReading: lin.displayPinyin,
      adoptedMeaning: lin.adoptedMeaning,
    })).toEqual({
      status: "pending",
      reason: "glyph-unconfirmed",
      glyph: "林",
    });

    const hair = REVIEWED_TRADITIONAL_PAIRS.find(
      pair => pair.inputGlyph === "发" && pair.adoptedGlyph === "髮",
    )!;
    expect(resolveReviewedNameElement({
      inputGlyph: "发",
      adoptedGlyph: "髮",
      adoptedReading: "fǎ",
      adoptedMeaning: hair.meaning,
    }).status).toBe("approved");
  });

  it("matches the independent CText rank 1-99 oracle and paragraph columns", () => {
    const simplified = COMMON_NAME_COVERAGE_SAMPLE_V1.filter(
      sample => sample.orthography === "simplified",
    );
    expect(simplified.map(sample => sample.fullName)).toEqual(
      EXPECTED_CTEXT_SIMPLIFIED_NAMES_1_TO_99,
    );
    expect(COMMON_NAME_COVERAGE_SAMPLE_V1[99]!.fullName).toBe("盧俊義");

    for (const [index, sample] of simplified.entries()) {
      const rank = index + 1;
      const expectedParagraph = rank <= 36
        ? 6 + Math.ceil(rank / 2)
        : 25 + Math.ceil((rank - 36) / 2);
      const relativeRank = rank <= 36 ? rank : rank - 36;
      const expectedColumn = relativeRank % 2 === 1 ? "左栏" : "右栏";
      expect(sample.id).toMatch(
        new RegExp(`^shuihu-${String(rank).padStart(3, "0")}-`),
      );
      const ctextRef = sample.sourceRefs.find(
        ref => ref.sourceId === "ctext-shuihu-71-stone-tablet-gb",
      );
      expect(ctextRef, sample.fullName).toBeDefined();
      expect(ctextRef!.locator).toContain(`正文段号${expectedParagraph}`);
      expect(ctextRef!.locator).toContain(expectedColumn);
      expect(ctextRef!.locator).toContain(`石碣姓名第${rank}项`);
      expect(ctextRef!.locator).toContain(sample.fullName);
    }

    const pengQi = simplified[42]!;
    expect(pengQi.fullName).toBe("彭玘");
    expect(pengQi.sourceRefs).toContainEqual(expect.objectContaining({
      sourceId: "ctext-datawiki-peng-qi",
      attestsExactFullName: true,
    }));
    expect(pengQi.sourceRefs[0]!.locator).toContain(
      "缺字图字形经交叉核对为玘",
    );
  });

  it("freezes 100 independent, traceable complete-name literature cases", () => {
    const evidenceSourceIds = new Set(
      FULL_NAME_EVIDENCE_SOURCES.map(source => source.id),
    );
    expect(evidenceSourceIds.size).toBe(FULL_NAME_EVIDENCE_SOURCES.length);
    for (const source of FULL_NAME_EVIDENCE_SOURCES) {
      expect(source.id.trim()).not.toBe("");
      expect(source.title).toMatch(/完整姓名.*文学人物|完整姓名.*文學人物/);
      expect(source.title).not.toMatch(/现代常见|現代常見|真人/);
      expect(source.publisher.trim()).not.toBe("");
      expect(source.url).toMatch(
        /^https:\/\/ctext\.org\/(?:wiki|datawiki)\.pl\?/,
      );
      if (source.publishedOn !== null) {
        expect(source.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(source.accessedOn).toBe("2026-07-23");
    }

    expect(COMMON_NAME_COVERAGE_SAMPLE_V1).toHaveLength(100);
    expect(new Set(
      COMMON_NAME_COVERAGE_SAMPLE_V1.map(sample => sample.id),
    ).size).toBe(100);
    expect(new Set(
      COMMON_NAME_COVERAGE_SAMPLE_V1.map(sample => sample.fullName),
    ).size).toBe(100);

    const complete = COMMON_NAME_COVERAGE_SAMPLE_V1.filter(
      sample => sample.expected.status === "complete",
    );
    const pending = COMMON_NAME_COVERAGE_SAMPLE_V1.filter(
      sample => sample.expected.status === "pending",
    );
    expect(complete.length).toBeGreaterThanOrEqual(95);
    expect(complete).toHaveLength(95);
    expect(pending.map(sample => ({
      fullName: sample.fullName,
      reasons: sample.expected.status === "pending"
        ? sample.expected.reasons
        : [],
    }))).toEqual([
      { fullName: "解珍", reasons: ["reading-unconfirmed"] },
      { fullName: "解宝", reasons: ["element-classification-pending"] },
      { fullName: "彭玘", reasons: ["element-classification-pending"] },
      { fullName: "单廷圭", reasons: ["element-classification-pending"] },
      { fullName: "盧俊義", reasons: ["glyph-unconfirmed"] },
    ]);

    for (const sample of COMMON_NAME_COVERAGE_SAMPLE_V1) {
      expect(sample.fullName).toBe(`${sample.surname}${sample.givenName}`);
      expect(sample.characters.map(character => character.inputGlyph).join(""))
        .toBe(sample.fullName);
      expect(sample.sourceRefs.length).toBeGreaterThan(0);
      for (const source of sample.sourceRefs) {
        expect(evidenceSourceIds.has(source.sourceId)).toBe(true);
        expect(source.locator).toMatch(/石碣姓名第\d+(?:项|項)/);
        expect(source.locator).toContain(sample.fullName);
        expect(source.attestsExactFullName).toBe(true);
      }

      const resolutions = sample.characters.map(resolveReviewedNameElement);
      const actualReasons = resolutions.flatMap(resolution =>
        resolution.status === "pending" ? [resolution.reason] : [],
      );

      if (sample.expected.status === "complete") {
        expect(actualReasons, sample.fullName).toEqual([]);
      } else {
        expect(actualReasons, sample.fullName).toEqual(sample.expected.reasons);
      }
    }
  });

  it("covers the required name shapes, variants, and polyphonic case", () => {
    expect(new Set(COMMON_NAME_COVERAGE_SAMPLE_V1.map(
      sample => sample.givenNameLength,
    ))).toEqual(new Set([1, 2]));
    expect(new Set(COMMON_NAME_COVERAGE_SAMPLE_V1.map(
      sample => sample.surnameKind,
    ))).toEqual(new Set(["single", "compound"]));

    const simplified = COMMON_NAME_COVERAGE_SAMPLE_V1.find(
      sample => sample.cases.includes("simplified-variant"),
    )!;
    const traditional = COMMON_NAME_COVERAGE_SAMPLE_V1.find(
      sample => sample.cases.includes("traditional-variant"),
    )!;
    expect(simplified.fullName).toBe("卢俊义");
    expect(traditional.fullName).toBe("盧俊義");
    expect(simplified.variantPairId).not.toBeNull();
    expect(traditional.variantPairId).toBe(simplified.variantPairId);
    expect(simplified.orthography).toBe("simplified");
    expect(traditional.orthography).toBe("traditional");
    expect(traditional.expected).toEqual({
      status: "pending",
      reasons: ["glyph-unconfirmed"],
    });

    const polyphonic = COMMON_NAME_COVERAGE_SAMPLE_V1.find(
      sample => sample.cases.includes("polyphonic"),
    )!;
    expect(polyphonic.fullName).toBe("解珍");
    expect(polyphonic.expected).toEqual({
      status: "pending",
      reasons: ["reading-unconfirmed"],
    });
  });

  it("keeps adopted meanings aligned with the independently selected readings", () => {
    const expected = [
      ["李应", "应", "yìng", "回应、应允", "complete"],
      ["燕青", "燕", "yàn", "燕子", "complete"],
      ["乐和", "乐", "yuè", "音乐", "complete"],
      ["乐和", "和", "hé", "和谐", "complete"],
      ["解宝", "解", "xiè", "姓氏用字（读 xiè）", "pending"],
      ["单廷圭", "单", "shàn", "姓氏用字（读 shàn）", "pending"],
    ] as const;

    for (const [
      fullName,
      glyph,
      reading,
      meaning,
      expectedStatus,
    ] of expected) {
      const sample = COMMON_NAME_COVERAGE_SAMPLE_V1.find(
        candidate => candidate.fullName === fullName,
      )!;
      const character = sample.characters.find(
        candidate => candidate.inputGlyph === glyph,
      )!;
      expect(character).toEqual({
        inputGlyph: glyph,
        adoptedGlyph: glyph,
        adoptedReading: reading,
        adoptedMeaning: meaning,
      });
      const resolution = resolveReviewedNameElement(character);
      if (expectedStatus === "complete") {
        expect(resolution.status, `${fullName}:${glyph}`).toBe("approved");
      } else {
        expect(resolution).toEqual({
          status: "pending",
          reason: "element-classification-pending",
          glyph,
        });
      }
    }

    const xieZhen = COMMON_NAME_COVERAGE_SAMPLE_V1.find(
      sample => sample.fullName === "解珍",
    )!;
    expect(xieZhen.characters[0]).toEqual({
      inputGlyph: "解",
      adoptedGlyph: "解",
      adoptedReading: null,
      adoptedMeaning: "姓氏用字（读 xiè）",
    });
  });

  it("returns exactly the 30 approved recommendation triples", () => {
    let total = 0;
    for (const element of ELEMENTS) {
      const recommendations = getReviewedNameElementRecommendations(element);
      total += recommendations.length;
      expect(recommendations.length).toBeLessThanOrEqual(6);
      expect(recommendations).toHaveLength(6);
      expect(recommendations.map(record => [
        record.glyph,
        record.displayPinyin,
        record.adoptedMeaning,
      ])).toEqual(EXPECTED_RECOMMENDATIONS[element]);
      for (const record of recommendations) {
        expect(record.reviewDecision).toBe("approved");
        expect(record.element).toBe(element satisfies ElementName);
        expect(record.recommendation).toBe(true);
      }
    }
    expect(total).toBe(30);

    const sheng = getReviewedNameElementRecommendations("火").find(
      record => record.glyph === "晟",
    )!;
    expect(sheng.displayPinyin).toBe("shèng");
    expect(sheng.readingSourceIds).toEqual(["moe-revised-dictionary-sheng-reading"]);
    expect(sheng.readingSourceIds).not.toContain("unicode-unihan-17-kmandarin");
  });
});
