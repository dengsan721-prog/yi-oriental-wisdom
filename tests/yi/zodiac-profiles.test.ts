import { describe, expect, it } from "vitest";
import { YI_REFERENCE_SOURCES } from "../../lib/yi/sources";
import { getZodiacProfile, ZODIAC_PROFILES } from "../../lib/yi/zodiac-profiles";

const EXPECTED_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

const EXPECTED_TAXONOMY = {
  aries: ["火", "开创"],
  taurus: ["土", "固定"],
  gemini: ["风", "变动"],
  cancer: ["水", "开创"],
  leo: ["火", "固定"],
  virgo: ["土", "变动"],
  libra: ["风", "开创"],
  scorpio: ["水", "固定"],
  sagittarius: ["火", "变动"],
  capricorn: ["土", "开创"],
  aquarius: ["风", "固定"],
  pisces: ["水", "变动"],
} as const;

const PROSE_FIELDS = [
  "coreDrive", "outerStyle", "innerNeed", "loveStyle", "friendshipStyle", "workStyle",
  "stressResponse", "commonMisreading", "matureVersion", "growthDirection", "chartComparison",
] as const;

describe("thirteen-dimension sun-sign profiles", () => {
  it("uses the exact twelve-sign order and an independent element-modality oracle", () => {
    expect(Object.keys(ZODIAC_PROFILES)).toEqual(EXPECTED_SIGNS);

    const combinations: string[] = [];
    for (const sign of EXPECTED_SIGNS) {
      const profile = ZODIAC_PROFILES[sign];
      expect(profile.sign, sign).toBe(sign);
      expect([profile.element, profile.modality], sign).toEqual(EXPECTED_TAXONOMY[sign]);
      combinations.push(`${profile.element}/${profile.modality}`);
    }

    expect(combinations).toEqual([
      "火/开创", "土/固定", "风/变动", "水/开创",
      "火/固定", "土/变动", "风/开创", "水/固定",
      "火/变动", "土/开创", "风/固定", "水/变动",
    ]);
    expect(new Set(combinations).size).toBe(12);
  });

  it("gives all eleven prose dimensions mature, scene-rich and distinct writing", () => {
    const profiles = Object.values(ZODIAC_PROFILES);
    expect(profiles).toHaveLength(12);

    for (const profile of profiles) {
      for (const field of PROSE_FIELDS) {
        expect.soft(profile[field].length, `${profile.sign}:${field}`).toBeGreaterThanOrEqual(60);
        expect.soft(profile[field], `${profile.sign}:${field}`).toMatch(
          /会议|消息|群聊|约会|朋友|项目|截止|回家|独处|散步|清单|复盘|工作|团队|关系|对话|日历|每天|每周|两周|十分钟|三十分钟|出现时|当.+时/,
        );
      }
    }

    for (const field of PROSE_FIELDS) {
      expect(new Set(profiles.map((profile) => profile[field])).size, field).toBe(12);
    }
  });

  it("states the scientific, astronomy, full-chart and lived-choice boundaries", () => {
    for (const profile of Object.values(ZODIAC_PROFILES)) {
      expect(profile.caution, profile.sign).toContain("太阳星座");
      expect(profile.caution, profile.sign).toContain("不是完整星盘");
      expect(profile.caution, profile.sign).toContain("天文学星座");
      expect(profile.caution, profile.sign).toContain("占星文化分类");
      expect(profile.caution, profile.sign).toContain("没有科学证据");
      expect(profile.caution, profile.sign).toContain("现实选择与处境优先");
      expect(profile.chartComparison, profile.sign).toContain("八字");
      expect(profile.chartComparison, profile.sign).toContain("出生时间与地点");
      for (const dimension of ["月亮", "上升", "行星", "宫位", "相位"]) {
        expect(profile.chartComparison, profile.sign).toContain(dimension);
      }
      expect(profile.sourceReferences, profile.sign).toEqual(["culture.nasa-constellations"]);
      expect(profile.sourceReferences.every((id) => Boolean(YI_REFERENCE_SOURCES[id])), profile.sign).toBe(true);
    }

    const serialized = JSON.stringify(ZODIAC_PROFILES);
    expect(serialized).not.toMatch(/最强|绝配|克星|旺夫|克夫|注定|必然出轨|必定成功|人格优劣|疾病诊断|寿命/);
    expect(YI_REFERENCE_SOURCES["culture.nasa-constellations"].role).toContain("天文学星座");
    expect(YI_REFERENCE_SOURCES["culture.nasa-constellations"].boundary).toContain("不属于科学证据");
  });

  it("returns canonical records and fails closed for an unknown runtime sign", () => {
    for (const sign of EXPECTED_SIGNS) expect(getZodiacProfile(sign)).toBe(ZODIAC_PROFILES[sign]);
    expect(() => getZodiacProfile("ophiuchus" as never)).toThrow("太阳星座内容不存在：ophiuchus");
  });
});
