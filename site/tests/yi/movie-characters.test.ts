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
    expect(source.length).toBeGreaterThanOrEqual(6);
    expect(source).not.toMatch(/网络资料|百科资料|相关资料|媒体报道|电影资料|动物资料/);
  }
}

function expectVariedPassages(candidates: MirrorCandidate[]) {
  for (const field of sharedPassages) {
    const normalized = candidates.map((candidate) => candidate[field]
      .replaceAll(candidate.name, "")
      .replace(/[《》]/g, ""));
    expect(new Set(normalized).size, `${field} passages`).toBe(candidates.length);
  }
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

  it("ships a balanced, original-analysis movie-character corpus", () => {
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
    const serialized = JSON.stringify(MOVIE_CHARACTERS);
    expect(serialized).not.toMatch(/经典台词|对白摘录|台词摘录|剧情简介|剧情梗概|剧照|海报|营销文案/);
    expect(serialized).not.toMatch(/https?:[^"\s]+\.(?:jpe?g|png|webp|gif)/i);
    expect(serialized).not.toMatch(/[“”]/);
    expectVariedPassages(MOVIE_CHARACTERS);
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
