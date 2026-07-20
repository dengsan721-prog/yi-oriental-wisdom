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
  "historical-confucius": "https://www.wikidata.org/wiki/Q4604",
  "historical-florence-nightingale": "https://www.nationalarchives.gov.uk/education/resources/florence-nightingale/",
  "historical-gandhi": "https://www.wikidata.org/wiki/Q1001",
  "historical-helen-keller": "https://www.afb.org/about-afb/history/helen-keller",
  "historical-li-qingzhao": "https://www.wikidata.org/wiki/Q464470",
  "historical-marie-curie": "https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/",
  "historical-nelson-mandela": "https://www.nelsonmandela.org/biography-timeline",
  "historical-sima-guang": "https://www.wikidata.org/wiki/Q33566",
  "historical-sima-qian": "https://www.wikidata.org/wiki/Q9372",
  "historical-su-shi": "https://www.dpm.org.cn/lemmas/242068.html",
  "historical-tao-yuanming": "https://www.wikidata.org/wiki/Q314210",
  "historical-wang-yangming": "https://museum.shqp.gov.cn/museum/zlhg/20210930/892111.html",
  "historical-xu-xiake": "https://www.dpm.org.cn/lemmas/241596.html",
  "historical-xuanzang": "https://www.wikidata.org/wiki/Q42063",
  "historical-zhang-qian": "https://www.wikidata.org/wiki/Q197276",
};

const expectedMovieUrls: Record<string, string> = {
  "movie-cn-ne-zha": "https://www.imdb.com/title/tt10627720/",
  "movie-cn-zhang-mazi": "https://www.imdb.com/title/tt1533117/",
  "movie-cn-ma-youtie": "https://www.imdb.com/title/tt17097088/",
  "movie-cn-liu-peiqiang": "https://www.imdb.com/title/tt7605074/",
  "movie-cn-cheng-dongqing": "https://www.imdb.com/title/tt2278392/",
  "movie-cn-jingqiu": "https://www.imdb.com/title/tt1554523/",
  "movie-cn-jia-xiaoling": "https://www.imdb.com/title/tt13364790/",
  "movie-cn-cheng-yong": "https://www.imdb.com/title/tt7362036/",
  "movie-cn-lang-ping": "https://www.imdb.com/title/tt10670442/",
  "movie-hk-song-zihao": "https://www.imdb.com/title/tt0092263/",
  "movie-hk-chan-kakweui": "https://www.imdb.com/title/tt0089374/",
  "movie-hk-yuddy": "https://www.imdb.com/title/tt0101258/",
  "movie-hk-chen-yongren": "https://www.imdb.com/title/tt0338564/",
  "movie-hk-li-qiao": "https://www.imdb.com/title/tt0117905/",
  "movie-hk-su-lizhen": "https://www.imdb.com/title/tt0118694/",
  "movie-hk-sing": "https://www.imdb.com/title/tt0286112/",
  "movie-hk-tao-jie": "https://www.imdb.com/title/tt2008006/",
  "movie-hk-luo-jiner": "https://www.imdb.com/title/tt1602572/",
  "movie-asia-kim-kiwoo": "https://www.imdb.com/title/tt6751668/",
  "movie-asia-osamu-shibata": "https://www.imdb.com/title/tt8075192/",
  "movie-asia-lee-jongsu": "https://www.imdb.com/title/tt7282468/",
  "movie-asia-kobayashi-daigo": "https://www.imdb.com/title/tt1069238/",
  "movie-asia-rancho": "https://www.imdb.com/title/tt1187043/",
  "movie-asia-simin": "https://www.imdb.com/title/tt1832382/",
  "movie-asia-chihiro": "https://www.imdb.com/title/tt0245429/",
  "movie-asia-shimada-kanbei": "https://www.imdb.com/title/tt0047478/",
  "movie-asia-geeta-phogat": "https://www.imdb.com/title/tt5074352/",
  "movie-west-michael-corleone": "https://www.imdb.com/title/tt0068646/",
  "movie-west-maximus": "https://www.imdb.com/title/tt0172495/",
  "movie-west-furiosa": "https://www.imdb.com/title/tt1392190/",
  "movie-west-forrest-gump": "https://www.imdb.com/title/tt0109830/",
  "movie-west-katherine-johnson": "https://www.imdb.com/title/tt4846340/",
  "movie-west-will-hunting": "https://www.imdb.com/title/tt0119217/",
  "movie-west-andy-dufresne": "https://www.imdb.com/title/tt0111161/",
  "movie-west-erin-brockovich": "https://www.imdb.com/title/tt0195685/",
  "movie-west-frodo-baggins": "https://www.imdb.com/title/tt0120737/",
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

  it("matches every movie candidate to its independently verified direct IMDb record", () => {
    const registry = new Map(getAllSources().map(source => [source.id, source]));
    expect(Object.keys(expectedMovieUrls)).toEqual(MOVIE_CHARACTERS.map(candidate => candidate.id));
    for (const candidate of MOVIE_CHARACTERS) {
      expect(registry.get(candidate.id)?.url).toBe(expectedMovieUrls[candidate.id]);
    }
  });
});
