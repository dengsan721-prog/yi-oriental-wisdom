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
type PassageField = (typeof moviePassages)[number];
type PassageCandidate = MirrorCandidate
  & Partial<Pick<MovieCharacterRecord, "filmTitle" | "characterName">>
  & Partial<Record<PassageField, string>>;

const namedInstitutions = [
  "American Foundation for the Blind",
  "BirdLife International",
  "Center for Whale Research",
  "Cornell Lab of Ornithology",
  "Encyclopaedia Britannica",
  "Gandhi Heritage Portal",
  "International Crane Foundation",
  "IUCN Red List",
  "Monterey Bay Aquarium",
  "NASA",
  "Nelson Mandela Foundation",
  "NOAA Fisheries",
  "Nobel Prize",
  "San Diego Zoo Wildlife Alliance",
  "Smithsonian Institution",
  "Smithsonian Ocean",
  "Smithsonian's National Zoo",
  "Snow Leopard Trust",
  "The National Archives (UK)",
  "U.S. Fish & Wildlife Service",
];
const primaryAuthors = [
  "Florence Nightingale",
  "Helen Keller",
  "Li Qingzhao",
  "Marie Curie",
  "Nelson Mandela",
  "孔子弟子及再传弟子编",
  "李清照",
  "钱谦益",
  "司马光",
  "司马迁",
  "苏轼",
  "陶渊明",
  "王守仁",
  "徐弘祖",
  "玄奘、辩机",
  "慧立、彦悰",
];
const authoritativeHosts = ["filmarchive.gov.hk"];

function isRecognizableSource(source: string): boolean {
  if (/^电影《[^》]{2,}》（(?:19|20)\d{2}）$/.test(source)) return true;
  if (/^《(?:史记|汉书|晋书|宋史|明史)·[^》]+》/.test(source)) return true;
  if (primaryAuthors.some(author => source.startsWith(`${author}《`))) return true;
  if (namedInstitutions.some(institution => source.startsWith(`${institution}《`))) return true;
  if (source.endsWith("，印度政府出版档案")) return true;
  try {
    const url = new URL(source);
    return url.protocol === "https:"
      && authoritativeHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
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
  for (const source of candidate.sourceReferences) {
    expect(isRecognizableSource(source), `${candidate.id}: ${source}`).toBe(true);
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
  it("recognizes only primary, institutional or authoritative source references", () => {
    expect(isRecognizableSource("电影《岁月神偷》（2010）")).toBe(true);
    expect(isRecognizableSource("NOAA Fisheries《Green Turtle》物种档案")).toBe(true);
    expect(isRecognizableSource("https://www.filmarchive.gov.hk/sc/web/hkfa/example.html")).toBe(true);
    expect(isRecognizableSource("凭空编造的权威材料")).toBe(false);
    expect(isRecognizableSource("伪造NASA《不存在的研究》")).toBe(false);
    expect(isRecognizableSource("https://example.com/unknown-source")).toBe(false);
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
