import { describe, expect, it } from "vitest";
import { ANIMAL_MIRRORS } from "../../lib/yi/animal-mirrors";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { HISTORICAL_MIRRORS } from "../../lib/yi/historical-mirrors";
import { extractMirrorFeatures, scoreMirror, type MirrorFeatureVector } from "../../lib/yi/mirror-features";
import { matchLifeMirrors, type MirrorCandidate } from "../../lib/yi/mirrors";
import { MOVIE_CHARACTERS, type MovieCharacterRecord } from "../../lib/yi/movie-characters";

const exactChart = calculateFourPillars({
  name: "林知远",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "unspecified",
  timeConfidence: "exact",
});

const mirrorKeys = [
  "id",
  "name",
  "kind",
  "vector",
  "similar",
  "different",
  "lesson",
  "shadow",
  "sourceReferences",
].sort();
const movieKeys = [
  ...mirrorKeys,
  "filmTitle",
  "characterName",
  "region",
  "era",
  "stage",
  "coreDrive",
  "actionStyle",
  "stressResponse",
  "relationshipStyle",
  "talentExpression",
  "blindSpot",
  "turningPoint",
  "matureArc",
  "shadowArc",
].sort();
const vectorKeys: (keyof MirrorFeatureVector)[] = [
  "growth",
  "expression",
  "stability",
  "discernment",
  "adaptability",
];
const sharedPassages: (keyof Pick<MirrorCandidate, "similar" | "different" | "lesson" | "shadow">)[] = [
  "similar",
  "different",
  "lesson",
  "shadow",
];
const characterPassages: (keyof Pick<MovieCharacterRecord,
  | "coreDrive"
  | "actionStyle"
  | "stressResponse"
  | "relationshipStyle"
  | "talentExpression"
  | "blindSpot"
  | "turningPoint"
  | "matureArc"
  | "shadowArc"
>)[] = [
  "coreDrive",
  "actionStyle",
  "stressResponse",
  "relationshipStyle",
  "talentExpression",
  "blindSpot",
  "turningPoint",
  "matureArc",
  "shadowArc",
];
const moviePassages = [...sharedPassages, ...characterPassages];
const releaseDecades = [
  "1950年代作品",
  "1970年代作品",
  "1980年代作品",
  "1990年代作品",
  "2000年代作品",
  "2010年代作品",
  "2020年代作品",
] as const;
type PassageField = (typeof moviePassages)[number];
type PassageCandidate = MirrorCandidate
  & Partial<Pick<MovieCharacterRecord, "filmTitle" | "characterName">>
  & Partial<Record<PassageField, string>>;

// Intentionally independent of the production arrays: corpus additions require a reviewed entry here.
const vettedSourceReferences: Record<string, readonly string[]> = {
  "animal-albatross": ["Encyclopaedia Britannica《Albatross》物种条目", "Cornell Lab of Ornithology《Albatrosses》鸟类指南"],
  "animal-bottlenose-dolphin": ["NOAA Fisheries《Common Bottlenose Dolphin》物种档案", "Smithsonian Ocean《Bottlenose Dolphin》物种介绍"],
  "animal-elephant-herd": ["Smithsonian's National Zoo《African Elephant》物种档案", "IUCN Red List《Loxodonta africana》评估条目"],
  "animal-gray-wolf": ["Smithsonian's National Zoo《Gray Wolf》物种档案", "U.S. Fish & Wildlife Service《Gray Wolf》物种档案"],
  "animal-green-sea-turtle": ["NOAA Fisheries《Green Turtle》物种档案", "IUCN Red List《Chelonia mydas》评估条目"],
  "animal-honeybee-colony": ["Smithsonian Institution《Honey Bees》教育资料", "Encyclopaedia Britannica《Honeybee》物种条目"],
  "animal-manatee": ["U.S. Fish & Wildlife Service《West Indian Manatee》物种档案", "Smithsonian's National Zoo《Manatee》物种介绍"],
  "animal-meerkat": ["Smithsonian's National Zoo《Meerkat》物种档案", "San Diego Zoo Wildlife Alliance《Meerkat》动物档案"],
  "animal-orca-pod": ["NOAA Fisheries《Killer Whale》物种档案", "Center for Whale Research《Orca Survey》研究项目资料"],
  "animal-peregrine-falcon": ["Cornell Lab of Ornithology《Peregrine Falcon》鸟类指南", "U.S. Fish & Wildlife Service《Peregrine Falcon》物种资料"],
  "animal-giant-pacific-octopus": ["Monterey Bay Aquarium《Giant Pacific Octopus》动物指南", "Smithsonian Ocean《Giant Pacific Octopus》物种介绍"],
  "animal-red-crowned-crane": ["International Crane Foundation《Red-crowned Crane》物种档案", "BirdLife International《Red-crowned Crane》物种资料"],
  "animal-sloth": ["Smithsonian's National Zoo《Sloth》物种档案", "Encyclopaedia Britannica《Sloth》物种条目"],
  "animal-snow-leopard": ["Smithsonian's National Zoo《Snow Leopard》物种档案", "Snow Leopard Trust《About Snow Leopards》物种资料"],
  "animal-wild-goose-flock": ["Cornell Lab of Ornithology《Greater White-fronted Goose》鸟类指南", "BirdLife International《Swan Goose》物种资料"],
  "historical-confucius": ["孔子弟子及再传弟子编《论语》", "《史记·孔子世家》"],
  "historical-florence-nightingale": ["Florence Nightingale《Notes on Nursing》", "The National Archives (UK)《Florence Nightingale》馆藏指南"],
  "historical-gandhi": ["Gandhi Heritage Portal《The Story of My Experiments with Truth》", "Collected Works of Mahatma Gandhi，印度政府出版档案"],
  "historical-helen-keller": ["Helen Keller《The Story of My Life》", "American Foundation for the Blind《Helen Keller Biography》"],
  "historical-li-qingzhao": ["李清照《金石录后序》", "《宋史·李格非传》及相关记载"],
  "historical-marie-curie": ["Nobel Prize《Marie Curie – Biographical》", "Marie Curie《Pierre Curie》传记及自传笔记"],
  "historical-nelson-mandela": ["Nelson Mandela Foundation《Timeline》", "Nelson Mandela《Long Walk to Freedom》"],
  "historical-sima-guang": ["司马光《资治通鉴》", "《宋史·司马光传》"],
  "historical-sima-qian": ["司马迁《史记·太史公自序》", "《汉书·司马迁传》"],
  "historical-su-shi": ["苏轼《东坡全集》", "《宋史·苏轼传》"],
  "historical-tao-yuanming": ["陶渊明《归去来兮辞》及诗文", "《晋书·陶潜传》"],
  "historical-wang-yangming": ["王守仁《传习录》", "《明史·王守仁传》"],
  "historical-xu-xiake": ["徐弘祖《徐霞客游记》", "钱谦益《徐霞客传》"],
  "historical-xuanzang": ["玄奘、辩机《大唐西域记》", "慧立、彦悰《大唐大慈恩寺三藏法师传》"],
  "historical-zhang-qian": ["《史记·大宛列传》", "《汉书·张骞李广利传》"],
  "movie-cn-ne-zha": ["电影《哪吒之魔童降世》（2019）"],
  "movie-cn-zhang-mazi": ["电影《让子弹飞》（2010）"],
  "movie-cn-ma-youtie": ["电影《隐入尘烟》（2022）"],
  "movie-cn-liu-peiqiang": ["电影《流浪地球》（2019）"],
  "movie-cn-cheng-dongqing": ["电影《中国合伙人》（2013）"],
  "movie-cn-jingqiu": ["电影《山楂树之恋》（2010）"],
  "movie-cn-jia-xiaoling": ["电影《你好，李焕英》（2021）"],
  "movie-cn-cheng-yong": ["电影《我不是药神》（2018）"],
  "movie-cn-lang-ping": ["电影《夺冠》（2020）"],
  "movie-hk-song-zihao": ["电影《英雄本色》（1986）"],
  "movie-hk-chan-kakweui": ["电影《警察故事》（1985）"],
  "movie-hk-yuddy": ["电影《阿飞正传》（1990）"],
  "movie-hk-chen-yongren": ["电影《无间道》（2002）"],
  "movie-hk-li-qiao": ["电影《甜蜜蜜》（1996）"],
  "movie-hk-su-lizhen": ["电影《花样年华》（2000）"],
  "movie-hk-sing": ["电影《少林足球》（2001）"],
  "movie-hk-tao-jie": ["电影《桃姐》（2011）"],
  "movie-hk-luo-jiner": ["电影《岁月神偷》（2010）", "https://www.filmarchive.gov.hk/sc/web/hkfa/pe-event-2021-mna-fs-film03.html"],
  "movie-asia-kim-kiwoo": ["电影《寄生虫》（2019）"],
  "movie-asia-osamu-shibata": ["电影《小偷家族》（2018）"],
  "movie-asia-lee-jongsu": ["电影《燃烧》（2018）"],
  "movie-asia-kobayashi-daigo": ["电影《入殓师》（2008）"],
  "movie-asia-rancho": ["电影《三傻大闹宝莱坞》（2009）"],
  "movie-asia-simin": ["电影《一次别离》（2011）"],
  "movie-asia-chihiro": ["电影《千与千寻》（2001）"],
  "movie-asia-shimada-kanbei": ["电影《七武士》（1954）"],
  "movie-asia-geeta-phogat": ["电影《摔跤吧！爸爸》（2016）"],
  "movie-west-michael-corleone": ["电影《教父》（1972）"],
  "movie-west-maximus": ["电影《角斗士》（2000）"],
  "movie-west-furiosa": ["电影《疯狂的麦克斯4：狂暴之路》（2015）"],
  "movie-west-forrest-gump": ["电影《阿甘正传》（1994）"],
  "movie-west-katherine-johnson": ["电影《隐藏人物》（2016）", "NASA《Katherine Johnson Biography》"],
  "movie-west-will-hunting": ["电影《心灵捕手》（1997）"],
  "movie-west-andy-dufresne": ["电影《肖申克的救赎》（1994）"],
  "movie-west-erin-brockovich": ["电影《永不妥协》（2000）"],
  "movie-west-frodo-baggins": ["电影《指环王：护戒使者》（2001）"],
};

function isVettedSource(candidate: MirrorCandidate, source: string): boolean {
  if (!vettedSourceReferences[candidate.id]?.includes(source)) return false;
  const filmCitation = /^电影《([^》]+)》（(?:19|20)\d{2}）$/.exec(source);
  if (!filmCitation) return true;
  return candidate.kind === "movie"
    && filmCitation[1] === (candidate as MovieCharacterRecord).filmTitle;
}

function candidateById(id: string): MirrorCandidate {
  const candidate = [...ANIMAL_MIRRORS, ...HISTORICAL_MIRRORS, ...MOVIE_CHARACTERS]
    .find(item => item.id === id);
  if (!candidate) throw new Error(`Unknown mirror candidate: ${id}`);
  return candidate;
}

function containsExcludedCopyrightArtifact(value: string): boolean {
  return /["'“”‘’「」『』]/.test(value)
    || /经典台词|对白(?:摘录|原文)?|台词(?:摘录|原文)?|字幕(?:摘录|文本)?|剧情(?:简介|梗概)|故事梗概|官方简介|宣传语|营销文案|文案摘录|剧照|海报|片花|预告片截图|截图/.test(value)
    || /https?:\/\/\S+\.(?:jpe?g|png|webp|gif|svg)(?:[?#]\S*)?/i.test(value)
    || /https?:\/\/\S*\/(?:images?|img|stills?|posters?|thumbnails?)(?:\/|[?&#])/i.test(value)
    || /(?:image|poster|still|thumbnail)(?:_?url)?=/i.test(value);
}

function expectValidVector(vector: MirrorFeatureVector) {
  expect(Object.keys(vector).sort()).toEqual([...vectorKeys].sort());
  for (const value of Object.values(vector)) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(10);
  }
}

function expectSubstantiveCandidate(candidate: MirrorCandidate) {
  expectValidVector(candidate.vector);
  expect(candidate.similar.length).toBeGreaterThanOrEqual(50);
  for (const field of ["different", "lesson", "shadow"] as const) {
    expect(candidate[field].length, `${candidate.id}.${field}`).toBeGreaterThanOrEqual(30);
  }
  expect(candidate.sourceReferences.length).toBeGreaterThan(0);
  expect(candidate.sourceReferences, `${candidate.id} source manifest`).toEqual(vettedSourceReferences[candidate.id]);
  for (const source of candidate.sourceReferences) {
    expect(isVettedSource(candidate, source), `${candidate.id}: ${source}`).toBe(true);
  }
}

function normalizedPassage(candidate: PassageCandidate, value: string): string {
  const identityTokens = [
    candidate.name,
    candidate.filmTitle,
    candidate.characterName,
  ].filter((token): token is string => Boolean(token)).sort((left, right) => right.length - left.length);
  return [...new Set(identityTokens)]
    .reduce((normalized, token) => normalized.replaceAll(token, "{identity}"), value)
    .replace(/[《》]/g, "");
}

function duplicatePassageFields(
  candidates: PassageCandidate[],
  fields: PassageField[],
): string[] {
  return fields.filter((field) => {
    const values = candidates.map((candidate) => {
      const value = candidate[field];
      if (typeof value !== "string") throw new Error(`${candidate.id}.${field} is missing`);
      return normalizedPassage(candidate, value);
    });
    return new Set(values).size < values.length;
  });
}

function expectVariedPassages(
  candidates: PassageCandidate[],
  fields: PassageField[] = sharedPassages,
) {
  expect(duplicatePassageFields(candidates, fields)).toEqual([]);
}

function substitutionCandidate(
  base: MovieCharacterRecord,
  id: string,
  filmTitle: string,
  characterName: string,
): MovieCharacterRecord {
  const candidate = {
    ...base,
    id,
    name: `${filmTitle}·${characterName}`,
    filmTitle,
    characterName,
  };
  for (const field of moviePassages) {
    Object.assign(candidate, { [field]: `${characterName}在${filmTitle}中的${field}分析模板保持不变` });
  }
  return candidate;
}

function rankedIds(candidates: MirrorCandidate[], requireDistinctStages = false): string[] {
  const vector = extractMirrorFeatures(exactChart).vector;
  const ranked = [...candidates]
    .map(candidate => ({ candidate, score: scoreMirror(vector, candidate.vector) }))
    .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id));
  if (!requireDistinctStages) return ranked.slice(0, 3).map(item => item.candidate.id);

  const selected: string[] = [];
  const stages = new Set<string>();
  for (const item of ranked) {
    const stage = (item.candidate as MovieCharacterRecord).stage;
    if (stages.has(stage)) continue;
    stages.add(stage);
    selected.push(item.candidate.id);
  }
  return selected;
}

describe("four-layer mirror corpora", () => {
  it("accepts only record-bound vetted source references", () => {
    const years = candidateById("movie-hk-luo-jiner") as MovieCharacterRecord;
    const turtle = candidateById("animal-green-sea-turtle");
    const changedFilm = { ...years, filmTitle: "伪片名" };
    const primaryFilmSource = "电影《岁月神偷》（2010）";

    expect(isVettedSource(years, primaryFilmSource)).toBe(true);
    expect(isVettedSource(turtle, "NOAA Fisheries《Green Turtle》物种档案")).toBe(true);
    expect(isVettedSource(years, "https://www.filmarchive.gov.hk/sc/web/hkfa/pe-event-2021-mna-fs-film03.html")).toBe(true);
    expect(isVettedSource(changedFilm, primaryFilmSource)).toBe(false);
    expect(isVettedSource(years, "凭空编造的权威材料")).toBe(false);
    expect(isVettedSource(years, "伪造NASA《不存在的研究》")).toBe(false);
    expect(isVettedSource(years, "https://example.com/unknown-source")).toBe(false);
  });

  it.each([
    ["movie-west-katherine-johnson", "NASA《不存在的研究》"],
    ["historical-confucius", "《史记·不存在篇》"],
    ["historical-gandhi", "随意内容，印度政府出版档案"],
  ])("rejects a fabricated citation attributed to a vetted source: %s", (id, source) => {
    expect(isVettedSource(candidateById(id), source)).toBe(false);
  });

  it("detects dialogue, synopsis, marketing and image artifacts in stored text", () => {
    const excluded = [
      "“不要放弃”",
      "‘不要放弃’",
      "「不要放弃」",
      "『不要放弃』",
      "\"do not give up\"",
      "'do not give up'",
      "官方故事梗概：角色重新出发",
      "宣传语：每个人都能改变命运",
      "https://cdn.example.com/stills/scene.webp?size=large",
      "https://cdn.example.com/images/poster?id=123",
    ];
    expect(excluded.filter(containsExcludedCopyrightArtifact)).toEqual(excluded);
  });

  it("detects identity-only templates across every shared and movie-specific passage", () => {
    const left = substitutionCandidate(MOVIE_CHARACTERS[0], "synthetic-left", "影片甲", "角色甲");
    const right = substitutionCandidate(MOVIE_CHARACTERS[1], "synthetic-right", "影片乙", "角色乙");
    expect(duplicatePassageFields([left, right], moviePassages)).toEqual(moviePassages);
  });

  it("keeps the corrected Years character identity consistent in its analysis", () => {
    const record = MOVIE_CHARACTERS.find(item => item.id === "movie-hk-luo-jiner");
    expect(record).toBeDefined();
    expect(record?.characterName).toBe("罗进二");
    expect(record?.similar).toContain(record?.characterName);
    expect(record?.similar).not.toContain("罗进一");
  });

  it("ships exactly fifteen substantive animal candidates with broad behavioural coverage", () => {
    expect(ANIMAL_MIRRORS).toHaveLength(15);
    expect(new Set(ANIMAL_MIRRORS.map(item => item.id)).size).toBe(15);
    expect(new Set(ANIMAL_MIRRORS.map(item => item.name)).size).toBe(15);
    for (const item of ANIMAL_MIRRORS) {
      expect(Object.keys(item).sort()).toEqual(mirrorKeys);
      expect(item.kind).toBe("animal");
      expectSubstantiveCandidate(item);
    }
    const corpus = JSON.stringify(ANIMAL_MIRRORS);
    for (const axisValue of ["独居", "群体", "快速", "缓慢", "陆地", "水域", "空中", "高警觉", "低警觉"]) {
      expect(corpus).toContain(axisValue);
    }
    expectVariedPassages(ANIMAL_MIRRORS);
  });

  it("ships exactly fifteen sourced historical candidates without claimed birth-hour evidence", () => {
    expect(HISTORICAL_MIRRORS).toHaveLength(15);
    expect(new Set(HISTORICAL_MIRRORS.map(item => item.id)).size).toBe(15);
    expect(new Set(HISTORICAL_MIRRORS.map(item => item.name)).size).toBe(15);
    for (const item of HISTORICAL_MIRRORS) {
      expect(Object.keys(item).sort()).toEqual(mirrorKeys);
      expect(item.kind).toBe("historical");
      expectSubstantiveCandidate(item);
    }
    expect(JSON.stringify(HISTORICAL_MIRRORS)).not.toMatch(/出生时辰|出生时间|生辰|八字|命盘/);
    expectVariedPassages(HISTORICAL_MIRRORS);
  });

  it("ships a balanced movie-character corpus without stored copyright artifacts", () => {
    expect(MOVIE_CHARACTERS.length).toBeGreaterThanOrEqual(36);
    expect(new Set(MOVIE_CHARACTERS.map(item => item.id)).size).toBe(MOVIE_CHARACTERS.length);
    expect(new Set(MOVIE_CHARACTERS.map(item => item.characterName)).size).toBe(MOVIE_CHARACTERS.length);
    expect(new Set(MOVIE_CHARACTERS.map(item => item.name)).size).toBe(MOVIE_CHARACTERS.length);
    expect([...new Set(MOVIE_CHARACTERS.map(item => item.region))].sort()).toEqual(
      ["中国大陆", "中国香港", "亚洲", "欧美"].sort(),
    );
    expect([...new Set(MOVIE_CHARACTERS.map(item => item.stage))].sort()).toEqual(
      ["instinct", "current", "growth"].sort(),
    );
    for (const region of ["中国大陆", "中国香港", "亚洲", "欧美"] as const) {
      expect(MOVIE_CHARACTERS.filter(item => item.region === region).length, region).toBeGreaterThanOrEqual(8);
    }
    for (const item of MOVIE_CHARACTERS) {
      expect(Object.keys(item).sort()).toEqual(movieKeys);
      expect(item.kind).toBe("movie");
      expect(item.name).toBe(`${item.filmTitle}·${item.characterName}`);
      expect(item.filmTitle.length).toBeGreaterThan(0);
      expect(item.characterName.length).toBeGreaterThan(0);
      expect(releaseDecades).toContain(item.era);
      const primaryCitation = /^电影《([^》]+)》（((?:19|20)\d{2})）$/.exec(item.sourceReferences[0]);
      expect(primaryCitation, `${item.id} primary film citation`).not.toBeNull();
      if (primaryCitation) {
        const releaseYear = Number(primaryCitation[2]);
        expect(item.era).toBe(`${Math.floor(releaseYear / 10) * 10}年代作品`);
      }
      expectSubstantiveCandidate(item);
      for (const field of characterPassages) {
        expect(item[field].length, `${item.id}.${field}`).toBeGreaterThanOrEqual(20);
      }
    }
    const storedText = MOVIE_CHARACTERS.flatMap(item => [
      item.filmTitle,
      item.characterName,
      ...sharedPassages.map(field => item[field]),
      ...characterPassages.map(field => item[field]),
      ...item.sourceReferences,
    ]);
    expect(storedText.filter(containsExcludedCopyrightArtifact)).toEqual([]);
    expectVariedPassages(MOVIE_CHARACTERS, moviePassages);
  });
});

describe("deterministic life-mirror ranking", () => {
  it("uses explainable scores, id tie-breaking and one movie from every stage", () => {
    const result = matchLifeMirrors(exactChart);
    expect(result.animals.map(item => item.id)).toEqual(rankedIds(ANIMAL_MIRRORS));
    expect(result.historical.map(item => item.id)).toEqual(rankedIds(HISTORICAL_MIRRORS));
    expect(result.movies.map(item => item.id)).toEqual(rankedIds(MOVIE_CHARACTERS, true));
    expect(result.movies.map(item => item.stage).sort()).toEqual(["instinct", "current", "growth"].sort());

    for (const [candidates, selected] of [
      [ANIMAL_MIRRORS, result.animals],
      [HISTORICAL_MIRRORS, result.historical],
      [MOVIE_CHARACTERS, result.movies],
    ] as const) {
      expect(selected).toHaveLength(3);
      expect(new Set(selected.map(item => item.id)).size).toBe(3);
      const scores = candidates.map(item => scoreMirror(extractMirrorFeatures(exactChart).vector, item.vector));
      expect(new Set(scores).size).toBeLessThan(scores.length);
      for (const item of selected) expectSubstantiveCandidate(item);
    }
  });

  it("breaks a selected animal tie by ascending id instead of reversed corpus order", () => {
    const tiedIds = ["animal-giant-pacific-octopus", "animal-peregrine-falcon"];
    const corpusOrder = ANIMAL_MIRRORS.filter(item => tiedIds.includes(item.id)).map(item => item.id);
    const ranked = matchLifeMirrors(exactChart).animals;
    const vector = extractMirrorFeatures(exactChart).vector;

    expect(corpusOrder).toEqual([...tiedIds].reverse());
    expect(scoreMirror(vector, ranked[0].vector)).toBe(scoreMirror(vector, ranked[1].vector));
    expect(ranked.slice(0, 2).map(item => item.id)).toEqual(tiedIds);
  });

  it("returns identical rankings for repeated calls and ignores an unconfirmed hour candidate", () => {
    expect(matchLifeMirrors(exactChart)).toEqual(matchLifeMirrors(exactChart));

    const unknown = calculateFourPillars({
      name: "林知远",
      date: "1990-06-15",
      time: null,
      location: "杭州",
      gender: "unspecified",
      timeConfidence: "unknown",
    });
    const withCandidateHour = structuredClone(unknown);
    withCandidateHour.pillars.hour = exactChart.pillars.hour;
    withCandidateHour.elementCounts = structuredClone(exactChart.elementCounts);
    expect(matchLifeMirrors(withCandidateHour)).toEqual(matchLifeMirrors(unknown));
  });
});
