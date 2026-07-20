import { describe, expect, it } from "vitest";
import { HISTORICAL_MIRRORS } from "../../lib/yi/historical-mirrors";
import { buildInterpretations } from "../../lib/yi/interpretation";
import { MOVIE_CHARACTERS } from "../../lib/yi/movie-characters";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { auditSourceReferences, getAllSources, type UnifiedSource } from "../../lib/yi/source-audit";
import { YI_REFERENCE_SOURCES, YI_RULE_SOURCES } from "../../lib/yi/sources";
import { TRADITIONAL_SOURCE_CATALOG } from "../../lib/yi/traditional-sources";

const chart = calculateFourPillars({
  name: "",
  date: "1990-06-15",
  time: "09:30",
  location: "杭州",
  gender: "female",
  timeConfidence: "exact",
});

const expectedHistoricalUrls: Record<string, string> = {
  "historical-confucius": "https://www.unesco.org/en/memory-world/confucius",
  "historical-florence-nightingale": "https://www.nationalarchives.gov.uk/education/resources/florence-nightingale/",
  "historical-gandhi": "https://www.wikidata.org/wiki/Q1001",
  "historical-helen-keller": "https://www.afb.org/about-afb/history/helen-keller",
  "historical-li-qingzhao": "https://www.wikidata.org/wiki/Q464470",
  "historical-marie-curie": "https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/",
  "historical-nelson-mandela": "https://www.nelsonmandela.org/content/page/timeline",
  "historical-sima-guang": "https://www.wikidata.org/wiki/Q33566",
  "historical-sima-qian": "https://www.wikidata.org/wiki/Q9372",
  "historical-su-shi": "https://www.dpm.org.cn/lemmas/242068.html",
  "historical-tao-yuanming": "https://www.wikidata.org/wiki/Q314210",
  "historical-wang-yangming": "https://museum.shqp.gov.cn/museum/zlhg/20210930/892111.html",
  "historical-xu-xiake": "https://www.dpm.org.cn/lemmas/241596.html",
  "historical-xuanzang": "https://www.wikidata.org/wiki/Q42063",
  "historical-zhang-qian": "https://www.wikidata.org/wiki/Q197276",
};

describe("unified Yi source registry", () => {
  it("keeps descriptive, HTTPS-safe, uniquely identified source records", () => {
    const sources = getAllSources();
    expect(sources.length).toBeGreaterThanOrEqual(15);
    expect(new Set(sources.map(source => source.id)).size).toBe(sources.length);
    for (const source of sources) {
      expect(source.id).toMatch(/^[a-z0-9.-]+$/);
      expect(source.role.length).toBeGreaterThanOrEqual(12);
      expect(source.editionNote.length).toBeGreaterThanOrEqual(12);
      expect(source.boundary.length).toBeGreaterThanOrEqual(12);
      expect(source.accessDate).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      if (source.url) expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it("returns the registry in deterministic catalog order and prefers richer traditional duplicates", () => {
    const expectedIds = [
      ...Object.keys(YI_RULE_SOURCES),
      ...Object.keys(YI_REFERENCE_SOURCES),
      ...Object.keys(TRADITIONAL_SOURCE_CATALOG).filter(id => !(id in YI_REFERENCE_SOURCES)),
      ...HISTORICAL_MIRRORS.map(candidate => candidate.id),
      ...MOVIE_CHARACTERS.map(candidate => candidate.id),
      "model.western-astrology-element-modality",
    ];
    expect(getAllSources().map(source => source.id)).toEqual(expectedIds);
    expect(getAllSources().map(source => source.id)).toEqual(expectedIds);

    const registry = new Map(getAllSources().map(source => [source.id, source]));
    for (const id of ["classic.san-ming-tong-hui", "classic.di-tian-sui"]) {
      const source = registry.get(id)!;
      const traditional = TRADITIONAL_SOURCE_CATALOG[id];
      expect(source.role).toBe(traditional.usage);
      expect(source.editionNote).toBe(traditional.editionNote);
      expect(source.boundary).toBe(traditional.boundary);
    }
  });

  it("resolves every interpretation rule and reports distinct unknown IDs in first-seen order", () => {
    const ruleIds = buildInterpretations(chart).flatMap(item => item.sourceRuleIds);
    expect(auditSourceReferences(ruleIds)).toEqual([]);
    expect(auditSourceReferences(["missing.one", "missing.one", "missing.two", "missing.one"])).toEqual([
      "来源不存在:missing.one",
      "来源不存在:missing.two",
    ]);
  });

  it("registers exactly one candidate-specific source for every historical and film identity", () => {
    const sources: UnifiedSource[] = getAllSources();
    for (const candidate of HISTORICAL_MIRRORS) {
      const matches = sources.filter(source => source.id === candidate.id);
      expect(matches).toHaveLength(1);
      expect(matches[0].category).toBe("历史人物镜像");
      expect(matches[0].title).toContain(candidate.name);
      expect(matches[0].url).toMatch(/^https:\/\/(?!ctext\.org\/?$)(?!.*(?:find|search))[\w.-]+\/.+/);
      expect(matches[0].url).toBe(expectedHistoricalUrls[candidate.id]);
    }
    const movieUrls: string[] = [];
    for (const candidate of MOVIE_CHARACTERS) {
      const matches = sources.filter(source => source.id === candidate.id);
      expect(matches).toHaveLength(1);
      expect(matches[0].category).toBe("电影角色镜像");
      expect(matches[0].title).toContain(candidate.filmTitle);
      expect(matches[0].title).toContain(candidate.characterName);
      expect(matches[0].url).toMatch(/^https:\/\/www\.imdb\.com\/title\/tt\d+\/$/);
      movieUrls.push(matches[0].url);
    }
    expect(new Set(movieUrls).size).toBe(MOVIE_CHARACTERS.length);
  });

  it("allows empty URLs only for truthfully documented local or edition-pending records", () => {
    for (const source of getAllSources().filter(source => !source.url)) {
      expect(["产品启发式", "传统框架", "现代占星文化模型", "子平", "相学", "象数"]).toContain(source.category);
      expect(source.editionNote).toMatch(/产品自有|产品分类约定|来源待核|待补录/);
    }

    const model = getAllSources().find(source => source.id === "model.western-astrology-element-modality")!;
    expect(model.url).toBe("");
    expect(model.editionNote).toContain("产品分类约定");
  });
});
