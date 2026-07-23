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
        /来源|材料出处等级|可靠级|可信层次|证据|材料层次|匹配分|显式映射/,
      );
      expect(Object.isFrozen(mirror)).toBe(true);
    }
  });

  it("uses reviewed natural source-comparison wording for Sima Guang and Xuanzang", () => {
    const simaGuang = projectStoryMirror(
      HISTORICAL_MIRRORS.find(candidate =>
        candidate.id === "historical-sima-guang"
      )!,
    );
    const xuanzang = projectStoryMirror(
      HISTORICAL_MIRRORS.find(candidate =>
        candidate.id === "historical-xuanzang"
      )!,
    );

    expect(simaGuang.difference).toContain(
      "编排事实也需要检查材料可能带来的偏向与遗漏",
    );
    expect(simaGuang.takeaway).toContain(
      "逐项注明材料出处与不确定处",
    );
    expect(simaGuang.difference).not.toContain("材料出处偏差检查");
    expect(simaGuang.takeaway).not.toContain("材料出处等级");
    expect(xuanzang.takeaway).toContain(
      "找到两份一手文本和一份权威注解",
    );
    expect(xuanzang.takeaway).not.toContain("两个一手材料出处");
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
