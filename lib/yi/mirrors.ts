import { ANIMAL_MIRRORS } from "./animal-mirrors";
import { HISTORICAL_MIRRORS } from "./historical-mirrors";
import { extractMirrorFeatures, scoreMirror, type MirrorFeatureVector } from "./mirror-features";
import { MOVIE_CHARACTERS, type MovieCharacterRecord } from "./movie-characters";
import type { FourPillarsResult } from "./types";

export type MirrorCandidate = {
  id: string;
  name: string;
  kind: "animal" | "historical" | "movie";
  vector: MirrorFeatureVector;
  similar: string;
  different: string;
  lesson: string;
  shadow: string;
  sourceReferences: string[];
};

export type AnimalArchetype = {
  name: string;
  basis: string;
  mappedFeatures: string[];
  strengthPattern: string;
  pressurePattern: string;
  action: string;
  caution: string;
};

export type HistoricalMirror = {
  person: string;
  dimension: string;
  basis: string;
  source: string;
  reliability: "high" | "medium" | "contextual";
  observation: string;
  action: string;
  caution: string;
};

function rank<T extends MirrorCandidate>(candidates: T[], chart: FourPillarsResult): T[] {
  const { vector } = extractMirrorFeatures(chart);
  return [...candidates]
    .map(candidate => ({ candidate, score: scoreMirror(vector, candidate.vector) }))
    .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id))
    .map(item => item.candidate);
}

function rankMovies(chart: FourPillarsResult): MovieCharacterRecord[] {
  const selected: MovieCharacterRecord[] = [];
  const stages = new Set<MovieCharacterRecord["stage"]>();
  for (const candidate of rank(MOVIE_CHARACTERS, chart)) {
    if (stages.has(candidate.stage)) continue;
    selected.push(candidate);
    stages.add(candidate.stage);
  }
  return selected;
}

export function matchLifeMirrors(chart: FourPillarsResult): {
  animals: MirrorCandidate[];
  historical: MirrorCandidate[];
  movies: MovieCharacterRecord[];
} {
  return {
    animals: rank(ANIMAL_MIRRORS, chart).slice(0, 3),
    historical: rank(HISTORICAL_MIRRORS, chart).slice(0, 3),
    movies: rankMovies(chart),
  };
}

export function matchAnimalArchetype(chart: FourPillarsResult): AnimalArchetype {
  const first = matchLifeMirrors(chart).animals[0];
  return {
    name: first.name,
    basis: `显式映射：${extractMirrorFeatures(chart).evidence.join("；")}`,
    mappedFeatures: Object.entries(first.vector).map(([key, value]) => `${key}=${value}`),
    strengthPattern: first.similar,
    pressurePattern: first.shadow,
    action: first.lesson,
    caution: "这是行为隐喻，不是性格标签。",
  };
}

export function matchHistoricalMirror(chart: FourPillarsResult): HistoricalMirror {
  const first = matchLifeMirrors(chart).historical[0];
  return {
    person: first.name,
    dimension: "人生结构单维比较",
    basis: `显式映射：${extractMirrorFeatures(chart).evidence.join("；")}`,
    source: first.sourceReferences.join("；"),
    reliability: "contextual",
    observation: first.similar,
    action: first.lesson,
    caution: "仅比较具体维度，不表示命运相同。",
  };
}
