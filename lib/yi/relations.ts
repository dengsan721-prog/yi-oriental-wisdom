import type { ChartRelation, PillarKey } from "./types";

export type RelationCoordinate<Key extends string = string> = { key: Key; stem: string; branch: string };
export type DetectedRelation<Key extends string = string> = {
  type: ChartRelation["type"];
  coordinates: Key[];
  symbols: string[];
  label: string;
};

type PairRelationType = Exclude<ChartRelation["type"], "stem-combination" | "branch-trine">;

const stemPairs = [
  ["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"],
] as const;

const branchPairRules: ReadonlyArray<{
  type: PairRelationType;
  suffix: string;
  pairs: ReadonlyArray<readonly [string, string]>;
}> = [
  {
    type: "branch-combination",
    suffix: "相合",
    pairs: [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]],
  },
  {
    type: "branch-clash",
    suffix: "相冲",
    pairs: [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]],
  },
  {
    type: "branch-harm",
    suffix: "相害",
    pairs: [["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]],
  },
  {
    type: "branch-break",
    suffix: "相破",
    pairs: [["子", "酉"], ["卯", "午"], ["辰", "丑"], ["戌", "未"], ["寅", "亥"], ["巳", "申"]],
  },
  { type: "branch-punishment", suffix: "相刑", pairs: [["子", "卯"]] },
];

const trines = [
  ["申", "子", "辰", "水"],
  ["亥", "卯", "未", "木"],
  ["寅", "午", "戌", "火"],
  ["巳", "酉", "丑", "金"],
] as const;

const punishmentGroups = [
  ["寅", "巳", "申"],
  ["丑", "戌", "未"],
] as const;

const selfPunishments = ["辰", "午", "酉", "亥"] as const;

function canonicalPair(
  pairs: ReadonlyArray<readonly [string, string]>,
  left: string,
  right: string,
): readonly [string, string] | undefined {
  return pairs.find(([first, second]) =>
    (left === first && right === second) || (left === second && right === first));
}

export function detectRelations<Key extends string>(coordinates: RelationCoordinate<Key>[]): DetectedRelation<Key>[] {
  const output: DetectedRelation<Key>[] = [];
  const emitted = new Set<string>();
  const add = (relation: DetectedRelation<Key>) => {
    const key = `${relation.type}:${relation.coordinates.join("-")}:${relation.symbols.join("")}`;
    if (emitted.has(key)) return;
    emitted.add(key);
    output.push(relation);
  };

  for (let leftIndex = 0; leftIndex < coordinates.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < coordinates.length; rightIndex += 1) {
      const left = coordinates[leftIndex];
      const right = coordinates[rightIndex];
      const stemPair = canonicalPair(stemPairs, left.stem, right.stem);
      if (stemPair) {
        add({
          type: "stem-combination",
          coordinates: [left.key, right.key],
          symbols: [...stemPair],
          label: `${stemPair.join("")}相合`,
        });
      }

      for (const rule of branchPairRules) {
        const branchPair = canonicalPair(rule.pairs, left.branch, right.branch);
        if (!branchPair) continue;
        add({
          type: rule.type,
          coordinates: [left.key, right.key],
          symbols: [...branchPair],
          label: `${branchPair.join("")}${rule.suffix}`,
        });
      }
    }
  }

  for (const [first, second, third, element] of trines) {
    const symbols = [first, second, third];
    const matchedIndexes = symbols.map((symbol) => coordinates.findIndex((coordinate) => coordinate.branch === symbol));
    if (matchedIndexes.some((index) => index < 0)) continue;
    add({
      type: "branch-trine",
      coordinates: [...matchedIndexes].sort((left, right) => left - right).map((index) => coordinates[index].key),
      symbols,
      label: `${symbols.join("")}三合${element}局`,
    });
  }

  for (const group of punishmentGroups) {
    const matchedIndexes = group.map((symbol) => coordinates.findIndex((coordinate) => coordinate.branch === symbol));
    if (matchedIndexes.some((index) => index < 0)) continue;
    add({
      type: "branch-punishment",
      coordinates: [...matchedIndexes].sort((left, right) => left - right).map((index) => coordinates[index].key),
      symbols: [...group],
      label: `${group.join("")}三刑`,
    });
  }

  for (const branch of selfPunishments) {
    const matched = coordinates.filter((coordinate) => coordinate.branch === branch);
    if (matched.length < 2) continue;
    add({
      type: "branch-punishment",
      coordinates: matched.slice(0, 2).map((coordinate) => coordinate.key),
      symbols: [branch, branch],
      label: `${branch}${branch}自刑`,
    });
  }

  return output;
}

export function detectChartRelations(pillars: RelationCoordinate<PillarKey>[]): ChartRelation[] {
  return detectRelations(pillars).map((relation) => ({
    type: relation.type,
    pillars: relation.coordinates,
    symbols: relation.symbols,
    label: relation.label,
  }));
}
