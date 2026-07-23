import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompatibilitySection } from "../../components/yi/CompatibilitySection";
import { MirrorSection } from "../../components/yi/MirrorSection";
import { ReferenceAtlasSection } from "../../components/yi/ReferenceAtlasSection";
import { TraditionSection } from "../../components/yi/TraditionSection";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import {
  getAtlasGroups,
  getAtlasMethods,
  resolveAtlasVisual,
} from "../../lib/yi/traditional-atlas";
import type { BirthSubmission } from "../../components/yi/BirthIntake";

const expectedReviewIds = [
  "folk-review-long-road",
  "folk-review-many-hands",
  "classical-review-other-mountain",
  "classical-review-listen-widely",
] as const;

const forbidden = [
  "专业依据", "本章来源", "本章依据与使用边界", "可靠级",
  "规则 ID", "命盘依据", "参考依据", "匹配百分比", "总分",
  "注定", "必然", "一定会", "克夫", "克妻", "刑克",
  "短命", "寿元", "得病", "患病", "必有大财", "必破财",
  "必定结婚", "必定离婚", "必生子", "绝后", "血光", "灾祸",
] as const;

const historicalContextMarkers = {
  "孔子": ["春秋时期思想家与教育者", "《论语》"],
  "弗洛伦斯·南丁格尔": ["护理改革者", "医院卫生"],
  "莫罕达斯·甘地": ["印度独立运动", "非暴力"],
  "海伦·凯勒": ["作家与残障权利倡导者", "大学"],
  "李清照": ["宋代词人", "战乱南渡"],
  "玛丽·居里": ["物理学家与化学家", "镭"],
  "纳尔逊·曼德拉": ["反种族隔离", "总统"],
  "司马光": ["北宋史学家", "《资治通鉴》"],
  "司马迁": ["西汉史学家", "《史记》"],
  "苏轼": ["北宋文人", "贬谪"],
  "陶渊明": ["东晋诗人", "辞去彭泽县令"],
  "王阳明": ["明代思想家与官员", "龙场"],
  "徐霞客": ["明代旅行家", "《徐霞客游记》"],
  "玄奘": ["唐代僧人和翻译家", "印度"],
  "张骞": ["汉代使者", "西域"],
} as const;

const movieContextMarkers = {
  "哪吒": ["魔丸", "天劫"],
  "张麻子": ["县长身份", "黄四郎"],
  "马有铁": ["贵英", "土屋"],
  "刘培强": ["空间站", "木星"],
  "成东青": ["英语培训", "伙伴"],
  "静秋": ["老三", "病逝"],
  "贾晓玲": ["母亲年轻时代", "改写"],
  "程勇": ["仿制药", "患者"],
  "郎平": ["女排", "教练"],
  "宋子豪": ["犯罪集团", "警察弟弟"],
  "陈家驹": ["警察", "冒险追捕"],
  "旭仔": ["生母", "亲密关系"],
  "陈永仁": ["卧底", "身份"],
  "李翘": ["香港", "黎小军"],
  "苏丽珍": ["配偶背叛", "克制"],
  "阿星": ["少林功夫", "足球队"],
  "桃姐": ["中风", "照料"],
  "罗进二": ["哥哥病逝", "家庭"],
  "金基宇": ["伪造学历", "暴力"],
  "柴田治": ["偷窃", "家庭"],
  "李钟秀": ["海美失踪", "猜疑"],
  "小林大悟": ["入殓师", "妻子"],
  "兰彻": ["填鸭教育", "朋友"],
  "西敏": ["离开伊朗", "女儿"],
  "荻野千寻": ["父母变成猪", "浴场"],
  "岛田勘兵卫": ["武士", "农民"],
  "吉塔·珀尕": ["摔跤", "父亲"],
  "迈克尔·柯里昂": ["复仇", "家族权力"],
  "马克西姆斯": ["角斗士", "康茂德"],
  "弗瑞奥萨": ["五位女性", "堡垒"],
  "福瑞斯特·甘": ["越战", "珍妮"],
  "凯瑟琳·约翰逊": ["NASA", "轨道"],
  "威尔·亨廷": ["麻省理工", "心理咨询"],
  "安迪·杜弗兰": ["冤狱", "隧道"],
  "艾琳·布罗克维奇": ["水污染", "居民"],
  "弗罗多·巴金斯": ["魔戒", "末日火山"],
} as const;

const firstBirth = {
  name: "甲",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
} as const;

const secondBirth: BirthSubmission = {
  name: "乙",
  date: "1992-11-03",
  time: "18:20",
  location: "上海",
  gender: "unspecified",
  timeConfidence: "exact",
  birthDate: {
    mode: "solar",
    year: 1992,
    month: 11,
    day: 3,
    isLeapMonth: false,
  },
  timeMode: "exact",
};

const first = calculateFourPillars(firstBirth);
const second = calculateFourPillars(secondBirth);

function expectSafePublicText(value: unknown) {
  const text = JSON.stringify(value);
  for (const term of forbidden) expect(text).not.toContain(term);
  expect(text).not.toMatch(
    /(?:\d{1,3}岁|\d{4}年|\d{1,2}月|\d{1,2}日).{0,16}(?:会|将|必|注定).{0,16}(?:结婚|离婚|生子|发财|破财|患病|灾祸|死亡)/u,
  );
  expect(text).not.toMatch(
    /internalReviewId|attestations|reviewerKind|humanReviewStatus|humanReviewerId|sourceIds|sourceReferences|professionalBasis|score|confidence/u,
  );
}

function expectConcreteScene(scene: string) {
  expect(scene).toMatch(/你|你们|一方|对方|家人|孩子|照顾者|伙伴|同事|朋友|团队|成员/u);
  expect(scene).toMatch(/说|问|写|做|拿|停|听|看|安排|确认|交给|回应|记录|选择|提出|完成/u);
  expect(scene).toMatch(/于是|结果|最后|就会|反而|免得|否则|因此|让|才/u);
}

describe("reviewed saying corpus", () => {
  it("separates folk sayings from classical quotations and keeps human review honest", async () => {
    const corpusModule = await import("../../lib/yi/folk-saying-corpus");
    const corpus = Reflect.get(corpusModule, "REVIEWED_SAYING_CORPUS");
    const getPublicSayingLead = Reflect.get(corpusModule, "getPublicSayingLead");

    expect(corpus).toBeInstanceOf(Array);
    expect(getPublicSayingLead).toBeTypeOf("function");
    if (!Array.isArray(corpus) || typeof getPublicSayingLead !== "function") return;

    expect(corpus.map((item) => item.id)).toEqual(expectedReviewIds);
    for (const item of corpus) {
      expect(item.attestations).toHaveLength(2);
      expect(new Set(item.attestations.map(
        (attestation: { publisherOrInstitution: string }) =>
          attestation.publisherOrInstitution,
      )).size).toBe(2);
      for (const attestation of item.attestations) {
        expect(attestation.url).toMatch(/^https:\/\/(?!.*(?:search|query))/u);
        expect(attestation.title.trim().length).toBeGreaterThanOrEqual(4);
        expect(attestation.exactLocator.trim().length).toBeGreaterThan(10);
      }
      expect(item.audits.map(
        (audit: { reviewerKind: string }) => audit.reviewerKind,
      )).toEqual(["source-audit", "independent-model"]);
      expect(item.humanReviewStatus).toBe("pending");
      expect(item.humanReviewerId).toBeNull();
      expect(item.automatedGate).toBe(
        "sources-cross-checked-awaiting-human-review",
      );
      expect(item.safeUseDecision).toMatch(/趣味|观察|有限|不用于/u);
      expect(JSON.stringify(item)).not.toMatch(
        /approved-by-human|human-approved|真人审核|审核人签字/u,
      );
    }

    const longRoad = getPublicSayingLead("folk-review-long-road");
    const manyHands = getPublicSayingLead("folk-review-many-hands");
    const otherMountain = getPublicSayingLead(
      "classical-review-other-mountain",
    );
    const listenWidely = getPublicSayingLead(
      "classical-review-listen-widely",
    );
    expect(longRoad).toEqual({
      kind: "folk",
      attribution: "民间常说",
      saying: "路遥知马力，日久见人心",
    });
    expect(manyHands).toEqual({
      kind: "folk",
      attribution: "民间常说",
      saying: "众人拾柴火焰高",
    });
    expect(otherMountain).toEqual({
      kind: "classical",
      attribution: "《诗经》有言",
      saying: "他山之石，可以攻玉",
    });
    expect(listenWidely).toEqual({
      kind: "classical",
      attribution: "古人有言",
      saying: "兼听则明，偏信则暗",
    });
    expect(JSON.stringify([otherMountain, listenWidely]))
      .not.toContain("民间常说");
  });

  it("keeps the editorial table in exact one-to-one pending-review sync", async () => {
    const corpusModule = await import("../../lib/yi/folk-saying-corpus");
    const corpus = Reflect.get(corpusModule, "REVIEWED_SAYING_CORPUS");
    expect(corpus).toBeInstanceOf(Array);
    if (!Array.isArray(corpus)) return;

    const doc = readFileSync(
      new URL(
        "../../../docs/editorial/yi-folk-saying-review-v1.md",
        import.meta.url,
      ),
      "utf8",
    );
    const rows = doc.split(/\r?\n/u)
      .filter((line) => /^\| (?:folk|classical)-review-/u.test(line));
    expect(rows).toHaveLength(corpus.length);
    expect(rows.map((row) => row.split("|")[1].trim()))
      .toEqual(corpus.map((item) => item.id));
    for (const item of corpus) {
      const row = rows.find((candidate) => candidate.includes(`| ${item.id} |`));
      expect(row, item.id).toBeDefined();
      if (!row) continue;
      expect(row).toContain(item.attestations[0].exactLocator);
      expect(row).toContain(item.attestations[1].exactLocator);
      expect(row).toContain("source-audit");
      expect(row).toContain("independent-model");
      expect(row).toContain("pending");
      expect(row).toContain("null");
      expect(row).not.toMatch(/approved|真人审核|签字/u);
    }
    expect(doc).toMatch(/纠正示例/u);
  });
});

describe("domain-specific public views", () => {
  it("covers all four relationship types and both parent-child roles with six concrete fields", async () => {
    const compatibilityModule = await import("../../lib/yi/compatibility");
    const buildPublicView = Reflect.get(
      compatibilityModule,
      "buildCompatibilityPublicView",
    );
    expect(buildPublicView).toBeTypeOf("function");
    if (typeof buildPublicView !== "function") return;

    const cases = [
      ["partner", "caregiver"],
      ["parent-child", "caregiver"],
      ["parent-child", "child"],
      ["business", "caregiver"],
      ["friend", "caregiver"],
    ] as const;
    for (const [relationship, primaryRole] of cases) {
      const view = buildPublicView(
        first,
        second,
        relationship,
        primaryRole,
      );
      expect(view).toMatchObject({
        teamStyle: expect.any(String),
        attractionScene: expect.any(String),
        misunderstandingScene: expect.any(String),
        conflictScene: expect.any(String),
        repairLine: expect.any(String),
        smallAction: expect.any(String),
        playfulObservation: expect.any(String),
        lead: {
          kind: expect.stringMatching(/^(folk|classical)$/u),
          attribution: expect.any(String),
          saying: expect.any(String),
        },
      });
      expectConcreteScene(view.attractionScene);
      expectConcreteScene(view.misunderstandingScene);
      expectConcreteScene(view.conflictScene);
      expect(view.repairLine).toMatch(/[“”]/u);
      expectSafePublicText(view);
    }
  });

  it("covers the complete 12/15/15/36 mirror catalog and selects three ranked cards per non-zodiac tab", async () => {
    const mirrorModule = await import("../../lib/yi/mirrors");
    const getPublicCatalog = Reflect.get(
      mirrorModule,
      "getMirrorPublicCatalog",
    );
    const buildPublicViews = Reflect.get(
      mirrorModule,
      "buildMirrorPublicViews",
    );
    expect(getPublicCatalog).toBeTypeOf("function");
    expect(buildPublicViews).toBeTypeOf("function");
    if (
      typeof getPublicCatalog !== "function"
      || typeof buildPublicViews !== "function"
    ) return;

    const catalog = getPublicCatalog();
    expect(catalog.zodiac).toHaveLength(12);
    expect(catalog.animal).toHaveLength(15);
    expect(catalog.historical).toHaveLength(15);
    expect(catalog.movie).toHaveLength(36);
    for (const cards of Object.values(catalog)) {
      for (const card of cards) {
        expect(card).toHaveProperty("introduction");
        expectSafePublicText(card);
      }
    }

    const views = buildPublicViews(first);
    expect(views.map((view: { id: string }) => view.id))
      .toEqual(["zodiac", "animal", "historical", "movie"]);
    expect(views.find(
      (view: { id: string }) => view.id === "historical",
    )?.lead).toEqual({
      kind: "classical",
      attribution: "《诗经》有言",
      saying: "他山之石，可以攻玉",
    });
    for (const id of ["zodiac", "animal", "movie"]) {
      expect(views.find(
        (view: { id: string }) => view.id === id,
      )).not.toHaveProperty("lead");
    }
    for (const view of views) {
      expect(view.cards).toHaveLength(view.id === "zodiac" ? 1 : 3);
      for (const card of view.cards) {
        expect(card).toMatchObject({
          name: expect.any(String),
          introduction: expect.any(String),
          matchingScene: expect.any(String),
          importantDifference: expect.any(String),
          takeaway: expect.any(String),
          playfulObservation: expect.any(String),
        });
        expectConcreteScene(card.matchingScene);
        expectSafePublicText(card);
      }
    }
  });

  it("introduces every historical figure with an identity and a concrete event or result", async () => {
    const { getMirrorPublicCatalog } = await import("../../lib/yi/mirrors");
    const cards = getMirrorPublicCatalog().historical;

    expect(cards).toHaveLength(Object.keys(historicalContextMarkers).length);
    for (const [name, markers] of Object.entries(historicalContextMarkers)) {
      const card = cards.find(candidate => candidate.name === name);
      expect(card, name).toBeDefined();
      if (!card) continue;
      expect(card.introduction).toContain(name);
      for (const marker of markers) {
        expect(card.introduction, `${name}: ${marker}`).toContain(marker);
      }
      expect(
        card.introduction.slice(card.introduction.indexOf("：") + 1)
          .match(/[。！？]/gu),
      ).toHaveLength(1);
      expect(card.introduction).not.toMatch(
        /只比较一段可核对的做法|不复制历史处境|不宣称命运相同/u,
      );
    }
  });

  it("introduces every movie character through a concrete choice and consequence", async () => {
    const { getMirrorPublicCatalog } = await import("../../lib/yi/mirrors");
    const cards = getMirrorPublicCatalog().movie;

    expect(cards).toHaveLength(Object.keys(movieContextMarkers).length);
    for (const [name, markers] of Object.entries(movieContextMarkers)) {
      const card = cards.find(candidate => candidate.name === name);
      expect(card, name).toBeDefined();
      if (!card) continue;
      expect(card.introduction).toContain(name);
      for (const marker of markers) {
        expect(card.introduction, `${name}: ${marker}`).toContain(marker);
      }
      expect(
        card.introduction.slice(card.introduction.indexOf("：") + 1)
          .match(/[。！？]/gu),
      ).toHaveLength(1);
      expect(card.introduction).not.toMatch(
        /只借角色的一次选择照见生活|不把剧情当作你的结局/u,
      );
    }
  });

  it("gives all 66 animal, historical and movie cards object-specific playful observations", async () => {
    const catalog = (await import("../../lib/yi/mirrors"))
      .getMirrorPublicCatalog();
    const cards = [
      ...catalog.animal,
      ...catalog.historical,
      ...catalog.movie,
    ];
    const normalizedObservations = cards.map(card => {
      const withoutName = card.playfulObservation.replaceAll(
        card.name,
        "镜中对象",
      );
      return card.workTitle
        ? withoutName.replaceAll(card.workTitle, "作品")
        : withoutName;
    });

    expect(cards).toHaveLength(66);
    expect(new Set(normalizedObservations).size).toBe(66);
    for (const card of cards) {
      expect(card.playfulObservation, card.name).toMatch(
        /如果|若|一旦|当|容易|可能/u,
      );
      expect(card.playfulObservation.length).toBeGreaterThanOrEqual(45);
    }
  });

  it("keeps both concrete love-style sentences in all twelve constellation scenes", async () => {
    const { buildAtlasPublicReading } = await import(
      "../../lib/yi/traditional-atlas"
    );
    const starOptions = getAtlasGroups("star")
      .flatMap(group => group.options);

    expect(starOptions).toHaveLength(12);
    for (const option of starOptions) {
      const loveStyle = option.lifeScene.match(
        /^恋爱方式：(.*?)\s+朋友关系：/u,
      )?.[1];
      expect(loveStyle, option.id).toBeDefined();
      if (!loveStyle) continue;
      expect(loveStyle.match(/[。！？]/gu), option.id).toHaveLength(2);

      const reading = buildAtlasPublicReading(option);
      expect(reading.scene, option.id).toContain(`恋爱方式：${loveStyle}`);
      expect(reading.scene, option.id).not.toContain("朋友关系：");
      expect(reading.scene, option.id).not.toContain("工作状态：");
      expect(reading.scene.length, option.id).toBeLessThan(260);
      expectConcreteScene(reading.scene);
    }
  });

  it("covers all 44 atlas options, 66 visual combinations and the folk tradition intro without fallback", async () => {
    const atlasModule = await import("../../lib/yi/traditional-atlas");
    const contentModule = await import("../../lib/yi/traditional-content");
    const buildAtlasPublicReading = Reflect.get(
      atlasModule,
      "buildAtlasPublicReading",
    );
    const buildTraditionPublicIntro = Reflect.get(
      contentModule,
      "buildTraditionPublicIntro",
    );
    expect(buildAtlasPublicReading).toBeTypeOf("function");
    expect(buildTraditionPublicIntro).toBeTypeOf("function");
    if (
      typeof buildAtlasPublicReading !== "function"
      || typeof buildTraditionPublicIntro !== "function"
    ) return;

    const options = getAtlasMethods().flatMap((method) =>
      getAtlasGroups(method.id).flatMap((group) => group.options)
    );
    expect(options).toHaveLength(44);
    const readings = options.map((option) =>
      buildAtlasPublicReading(option)
    );
    expect(readings).toHaveLength(44);
    for (const reading of readings) {
      expect(reading).toMatchObject({
        title: expect.any(String),
        scene: expect.any(String),
        playfulObservation: expect.any(String),
        action: expect.any(String),
        lead: {
          kind: expect.stringMatching(
            /^(traditional-paraphrase|culture-model)$/u,
          ),
          attribution: expect.any(String),
          text: expect.any(String),
        },
      });
      expectConcreteScene(reading.scene);
      expect(reading.scene.length).toBeLessThan(260);
      expect(reading.playfulObservation.length).toBeLessThan(260);
      expect(reading.action.length).toBeLessThan(200);
      expectSafePublicText(reading);
    }

    expect(readings.filter(
      (reading) => reading.lead.kind === "traditional-paraphrase",
    )).toHaveLength(32);
    expect(readings.filter(
      (reading) => reading.lead.kind === "culture-model",
    )).toHaveLength(12);

    const visualCombinationCount = options.reduce((count, option) => {
      if (option.id.startsWith("star-")) return count + 1;
      if (option.visuals) {
        expect(resolveAtlasVisual(option, "male")).toBeTruthy();
        expect(resolveAtlasVisual(option, "female")).toBeTruthy();
        return count + 2;
      }
      expect(resolveAtlasVisual(option, "female")).toBeTruthy();
      return count + 1;
    }, 0);
    expect(visualCombinationCount).toBe(66);

    const intro = buildTraditionPublicIntro();
    expect(intro.lead).toMatchObject({
      kind: "folk",
      attribution: "民间常说",
    });
    expectConcreteScene(intro.scene);
    expectSafePublicText(intro);
  });
});

describe("four safe component surfaces", () => {
  it("renders every compatibility role and mirror tab without leaking hidden evidence", async () => {
    const compatibilityCases = [
      ["partner", "caregiver"],
      ["parent-child", "caregiver"],
      ["parent-child", "child"],
      ["business", "caregiver"],
      ["friend", "caregiver"],
    ] as const;
    const compatibilityHtml = compatibilityCases.map(
      ([relationship, primaryParentRole]) => renderToStaticMarkup(
        createElement(CompatibilitySection, {
          chart: first,
          primaryName: "甲",
          relationship,
          primaryParentRole,
          secondBirth,
          onRelationshipChange: () => undefined,
          onSecondBirthChange: () => undefined,
          onParentChildPrimaryRoleChange: () => undefined,
        }),
      ),
    );
    const mirror = renderToStaticMarkup(createElement(MirrorSection, {
      chart: first,
    }));
    const mirrorComponentModule = await import(
      "../../components/yi/MirrorSection"
    );
    const MirrorSectionView = Reflect.get(
      mirrorComponentModule,
      "MirrorSectionView",
    );
    expect(MirrorSectionView).toBeTypeOf("function");
    if (typeof MirrorSectionView !== "function") return;
    const mirrorTabs = [
      "zodiac",
      "animal",
      "historical",
      "movie",
    ] as const;
    const mirrorHtml = mirrorTabs.map((activeView) =>
      renderToStaticMarkup(MirrorSectionView({
        chart: first,
        activeView,
        onSelectView: () => undefined,
      }))
    );

    for (const [surface, html] of [
      ...compatibilityHtml.map(
        (html, index) => [`compatibility-${index}`, html] as const,
      ),
      ["mirror-default", mirror] as const,
      ...mirrorHtml.map(
        (html, index) => [`mirror-${mirrorTabs[index]}`, html] as const,
      ),
    ]) {
      expectSafePublicText(html);
      expect(html, surface).not.toContain("<details");
      expect(html, surface).not.toMatch(
        /(?:folk|classical)-review-|animal-|historical-|movie-|attestation|reviewer/u,
      );
    }
    const compatibility = compatibilityHtml[0];
    for (const label of [
      "你们更像哪一种搭档",
      "最容易产生好感的地方",
      "最容易误会的场景",
      "一次争执可能怎样发生",
      "怎样把话说回来",
      "下次可以一起试的小动作",
    ]) expect(compatibility).toContain(label);
    expect(compatibility).toMatch(/民间常说|《诗经》有言|古人有言/u);
    expect(mirror).toContain("先认识");
    for (const tab of ["生肖镜像", "动物镜像", "历史人物", "电影角色"]) {
      expect(mirror).toContain(tab);
    }
  });

  it("renders all 44 safe atlas readings plus the traditional wrapper", async () => {
    const atlasComponentModule = await import(
      "../../components/yi/ReferenceAtlasSection"
    );
    const atlasDomainModule = await import("../../lib/yi/traditional-atlas");
    const AtlasPublicReadingCard = Reflect.get(
      atlasComponentModule,
      "AtlasPublicReadingCard",
    );
    const buildAtlasPublicReading = Reflect.get(
      atlasDomainModule,
      "buildAtlasPublicReading",
    );
    expect(AtlasPublicReadingCard).toBeTypeOf("function");
    expect(buildAtlasPublicReading).toBeTypeOf("function");
    if (
      typeof AtlasPublicReadingCard !== "function"
      || typeof buildAtlasPublicReading !== "function"
    ) return;

    const options = getAtlasMethods().flatMap((method) =>
      getAtlasGroups(method.id).flatMap((group) => group.options)
    );
    const cardHtml = options.map((option) => renderToStaticMarkup(
      createElement(AtlasPublicReadingCard, {
        reading: buildAtlasPublicReading(option),
      }),
    ));
    expect(cardHtml).toHaveLength(44);
    for (const [index, html] of cardHtml.entries()) {
      expectSafePublicText(html);
      expect(html).not.toContain("<details");
      expect(html).not.toContain(options[index].id);
      expect(html).not.toMatch(
        /(?:folk|classical)-review-|source|reviewer|attestation/u,
      );
    }

    const atlas = renderToStaticMarkup(createElement(
      ReferenceAtlasSection,
      { chart: first, birth: firstBirth },
    ));
    const tradition = renderToStaticMarkup(createElement(TraditionSection, {
      chart: first,
      birth: firstBirth,
    }));
    expectSafePublicText(atlas);
    expectSafePublicText(tradition);
    expect(atlas).toContain(
      "本页不会读取、上传或识别你的照片。",
    );
    expect(atlas).not.toContain("专业到生活的七层翻译");
    expect(atlas).not.toContain("理论依据与版本边界");
    expect(atlas).toMatch(/传统观察|文化模型/u);
    expect(tradition).toContain("民间常说");
  });

  it("keeps raw engine, evidence and editorial fields outside renderer props", () => {
    const sources = [
      "CompatibilitySection.tsx",
      "MirrorSection.tsx",
      "TraditionSection.tsx",
      "ReferenceAtlasSection.tsx",
    ].map((name) => readFileSync(
      new URL(`../../components/yi/${name}`, import.meta.url),
      "utf8",
    )).join("\n");

    expect(sources).not.toMatch(
      /ChapterSources|getAllSources|YI_REFERENCE_SOURCES|sourceReferences|professionalBasis|internalReviewId|reviewerKind|humanReviewStatus|score/u,
    );
    expect(sources).not.toMatch(
      /result\.axes|reading\.layers|reading\.sourceIds|candidate\.sourceReferences/u,
    );
    expect(sources).toMatch(/CompatibilityPublicView/u);
    expect(sources).toMatch(/MirrorPublic/u);
    expect(sources).toMatch(/TraditionPublic/u);
    expect(sources).toMatch(/AtlasPublicReading/u);
  });
});
