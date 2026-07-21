import { describe, expect, it } from "vitest";
import { getAllSources, YI_REFERENCE_SOURCES } from "../../lib/yi/sources";
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

const SIGN_NAMES = [
  "白羊", "金牛", "双子", "巨蟹", "狮子", "处女",
  "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼",
] as const;

function completeSentences(text: string) {
  return text.split(/[。！？；]+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length >= 18);
}

function normalizeEditorialOverlap(text: string) {
  return SIGN_NAMES.reduce((value, sign) => value.replaceAll(sign, "星座"), text)
    .replace(/[\s，。；：、！？｜“”‘’（）()《》0-9]/g, "");
}

function longestCommonSubstring(leftText: string, rightText: string) {
  const left = Array.from(leftText);
  const right = Array.from(rightText);
  let previous = new Array<number>(right.length + 1).fill(0);
  let longest = "";

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = new Array<number>(right.length + 1).fill(0);
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      if (left[leftIndex - 1] !== right[rightIndex - 1]) continue;
      current[rightIndex] = previous[rightIndex - 1] + 1;
      if (current[rightIndex] > Array.from(longest).length) {
        longest = left.slice(leftIndex - current[rightIndex], leftIndex).join("");
      }
    }
    previous = current;
  }
  return longest;
}

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
        expect.soft(completeSentences(profile[field]).length, `${profile.sign}:${field}:sentences`).toBeGreaterThanOrEqual(2);
        expect.soft(profile[field], `${profile.sign}:${field}:observable action`).toMatch(
          /问|写|说|看|听|走|做|发|交|回|读|画|列|查|记|安排|确认|记录|比较|复盘|回复|邀请|拒绝|选择|说明|核对|校准|读取|提供|处理|整理|观察|提出|完成|开始|停止|帮助|陪|联系|修改|删除|分享|进入|打开|关闭|发布|上线|汇报|讨论|协商|尝试|验证|承担|表达|准备|庆祝|尊重|评估/,
        );
      }
    }

    for (const field of PROSE_FIELDS) {
      expect(new Set(profiles.map((profile) => profile[field])).size, field).toBe(12);
    }
  });

  it("does not reuse complete editorial sentences across different signs", () => {
    const owners = new Map<string, Set<string>>();

    for (const profile of Object.values(ZODIAC_PROFILES)) {
      for (const field of PROSE_FIELDS) {
        for (const sentence of completeSentences(profile[field])) {
          const sentenceOwners = owners.get(sentence) ?? new Set<string>();
          sentenceOwners.add(profile.sign);
          owners.set(sentence, sentenceOwners);
        }
      }
    }

    const duplicates = [...owners.entries()]
      .filter(([, sentenceOwners]) => sentenceOwners.size > 1)
      .map(([sentence, sentenceOwners]) => `${[...sentenceOwners].join("/")}：${sentence}`);
    expect(duplicates).toEqual([]);
  });

  it("does not hide shared boilerplate inside otherwise distinct prose fields", () => {
    for (const field of PROSE_FIELDS) {
      for (let leftIndex = 0; leftIndex < EXPECTED_SIGNS.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < EXPECTED_SIGNS.length; rightIndex += 1) {
          const leftSign = EXPECTED_SIGNS[leftIndex];
          const rightSign = EXPECTED_SIGNS[rightIndex];
          const overlap = longestCommonSubstring(
            normalizeEditorialOverlap(ZODIAC_PROFILES[leftSign][field]),
            normalizeEditorialOverlap(ZODIAC_PROFILES[rightSign][field]),
          );
          expect.soft(
            Array.from(overlap).length,
            `${field}:${leftSign}/${rightSign} shared ${JSON.stringify(overlap)}`,
          ).toBeLessThan(30);
        }
      }
    }
  });

  it("states the scientific, astronomy, full-chart and lived-choice boundaries", () => {
    const knownSourceIds = new Set(getAllSources().map(source => source.id));
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
      expect(profile.sourceReferences, profile.sign).toEqual([
        "model.western-astrology-element-modality",
        "culture.nasa-constellations",
      ]);
      expect(profile.sourceReferences.every((id) => knownSourceIds.has(id)), profile.sign).toBe(true);
    }

    const serialized = JSON.stringify(ZODIAC_PROFILES);
    expect(serialized).not.toMatch(
      /最强|最佳|最差|排名|第一名|绝配|克星|男人|女人|男性|女性|男生|女生|一定会|永远|天生就是|旺夫|克夫|注定|必然出轨|必定成功|人格优劣|疾病诊断|人的寿命|寿命长短|寿命预测|恋爱脑|海王|渣男|渣女|妈宝|中央空调|社恐|社牛|显眼包|白月光|天生反骨|爹味/,
    );
    expect(YI_REFERENCE_SOURCES["culture.nasa-constellations"].role).toContain("天文学星座");
    expect(YI_REFERENCE_SOURCES["culture.nasa-constellations"].boundary).toContain("不属于科学证据");
  });

  it("returns canonical records and fails closed for an unknown runtime sign", () => {
    for (const sign of EXPECTED_SIGNS) expect(getZodiacProfile(sign)).toBe(ZODIAC_PROFILES[sign]);
    expect(() => getZodiacProfile("ophiuchus" as never)).toThrow("太阳星座内容不存在：ophiuchus");
  });
});
