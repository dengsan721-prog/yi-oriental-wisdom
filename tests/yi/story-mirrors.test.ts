import { describe, expect, it } from "vitest";
import { ANIMAL_MIRRORS } from "../../lib/yi/animal-mirrors";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { HISTORICAL_MIRRORS } from "../../lib/yi/historical-mirrors";
import { matchLifeMirrors } from "../../lib/yi/mirrors";
import {
  buildStoryMirrors,
  projectStoryMirror,
} from "../../lib/yi/story-mirrors";
import type { BirthInput } from "../../lib/yi/types";

const birth: BirthInput = {
  name: "林岚",
  date: "1990-06-15",
  time: "09:30",
  location: "北京市",
  gender: "female",
  timeConfidence: "exact",
};

const chart = calculateFourPillars(birth);

describe("reviewed story-mirror projection", () => {
  it("covers every one of the 15 animal and 15 historical candidates", () => {
    expect(ANIMAL_MIRRORS).toHaveLength(15);
    expect(HISTORICAL_MIRRORS).toHaveLength(15);

    for (const candidate of [...ANIMAL_MIRRORS, ...HISTORICAL_MIRRORS]) {
      const mirror = projectStoryMirror(candidate);
      expect(mirror.internalCandidateId).toBe(candidate.id);
      expect(mirror.name).toBe(candidate.name);
      expect(mirror.matchingScene).toContain(candidate.name);
      expect(mirror.introduction.length, `${candidate.id}:introduction`)
        .toBeGreaterThanOrEqual(24);
      expect(mirror.matchingScene, `${candidate.id}:scene`)
        .toMatch(/当你.+时，.+；这样.+/);
      expect(mirror.matchingScene.length, `${candidate.id}:scene-length`)
        .toBeGreaterThanOrEqual(55);
      expect(mirror.difference.length, `${candidate.id}:difference`)
        .toBeGreaterThanOrEqual(30);
      expect(mirror.takeaway.length, `${candidate.id}:takeaway`)
        .toBeGreaterThanOrEqual(30);
      expect(JSON.stringify(mirror)).not.toMatch(
        /来源|可靠级|证据等级|匹配分|显式映射/,
      );
      expect(Object.isFrozen(mirror)).toBe(true);
    }
  });

  it("gives all 30 candidates distinct person-action-consequence scenes", () => {
    const projected = [...ANIMAL_MIRRORS, ...HISTORICAL_MIRRORS]
      .map(projectStoryMirror);
    const normalizedScenes = projected.map(mirror =>
      mirror.matchingScene.normalize("NFC").replace(/\s+/g, "")
    );
    const openings = projected.map(mirror =>
      mirror.matchingScene.split("时，")[0]
    );
    const consequences = projected.map(mirror =>
      mirror.matchingScene.split("；").at(-1)
    );

    expect(new Set(normalizedScenes).size).toBe(30);
    expect(new Set(openings).size).toBeGreaterThanOrEqual(15);
    expect(new Set(consequences).size).toBeGreaterThanOrEqual(15);
    for (const mirror of projected) {
      expect(mirror.matchingScene).toMatch(
        /当.+时，.+；(?:这样|因此|于是|结果).+。$/u,
      );
      expect(mirror.matchingScene).not.toMatch(
        /而；|和，再|你里|环境变化，找(?:。|；)|若急于显示能力而/u,
      );
    }
  });

  it("introduces historical identity and explicitly keeps the reader's life distinct", () => {
    for (const candidate of HISTORICAL_MIRRORS) {
      const mirror = projectStoryMirror(candidate);
      expect(mirror.introduction).toContain(candidate.name);
      expect(mirror.difference)
        .toContain(`你的生活不是${candidate.name}的生活`);
    }
  });

  it("introduces a recognizable animal behavior or survival pattern", () => {
    for (const candidate of ANIMAL_MIRRORS) {
      const mirror = projectStoryMirror(candidate);
      expect(mirror.introduction).toContain(candidate.name);
      expect(mirror.introduction).toMatch(
        /飞|游|迁|群|水域|陆地|高山|树冠|湿地|观察|协作|觅食|栖息/,
      );
    }
  });

  it("projects the first ranked audited matches without changing matcher output", () => {
    const before = JSON.stringify(chart);
    const ranked = matchLifeMirrors(chart);
    const mirrors = buildStoryMirrors(chart);

    expect(mirrors.animal.internalCandidateId).toBe(ranked.animals[0].id);
    expect(mirrors.historical.internalCandidateId)
      .toBe(ranked.historical[0].id);
    expect(JSON.stringify(chart)).toBe(before);
    expect(Object.isFrozen(mirrors)).toBe(true);
    expect(Object.isFrozen(mirrors.animal)).toBe(true);
    expect(Object.isFrozen(mirrors.historical)).toBe(true);
  });
});
