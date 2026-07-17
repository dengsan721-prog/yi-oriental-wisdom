import { describe, expect, it } from "vitest";
import {
  LIFE_PROFILE_STORAGE_KEY,
  buildLifeHome,
  clearLifeProfile,
  createLifeProfile,
  lifeProfileReducer,
  loadLifeProfile,
  getBrowserStorage,
  saveLifeProfile,
  exportLifeProfile,
  type LifeProfile,
  type ProfileStorage,
} from "../../lib/yi/life-profile";
import { calculateFourPillars } from "../../lib/yi/four-pillars";
import { buildInterpretations, buildProfessionalOverview } from "../../lib/yi/interpretation";

const savedProfile: LifeProfile = {
  version: 1,
  name: "小艺",
  birth: {
    name: "小艺",
    date: "1990-04-18",
    time: "08:30",
    location: "浙江省杭州市某医院",
    gender: "female",
    timeConfidence: "exact",
  },
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
  currentStage: "在稳住节奏后打开新的空间",
  annualMap: [{ year: 2026, theme: "收束与选择", focus: "只推进一件重要的事" }],
  monthlyRhythm: [{ month: "2026-07", theme: "整理边界", action: "写下本月要停止的一件事" }],
  events: [{ id: "event-1", title: "准备转岗", date: "2026-08-01", note: "先完成信息访谈" }],
  relations: [{ id: "relation-1", name: "家人", relationship: "family", note: "每周留一次不带建议的倾听" }],
  actions: [{ id: "action-1", text: "约一次信息访谈", done: false }],
};

function memoryStorage(): ProfileStorage {
  const data = new Map<string, string>();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
}

describe("life profile", () => {
  it("minimizes persisted and exported birth data by removing location", () => {
    const storage = memoryStorage();
    expect(saveLifeProfile(storage, savedProfile)).toEqual({ ok: true });
    const raw = storage.getItem(LIFE_PROFILE_STORAGE_KEY)!;
    expect(raw).not.toContain("浙江省杭州市某医院");
    expect(loadLifeProfile(storage)?.birth.location).toBe("");
    expect(exportLifeProfile(savedProfile)).not.toContain("浙江省杭州市某医院");
  });

  it("migrates an old v1 profile with a stored location on load", () => {
    const storage = memoryStorage();
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, JSON.stringify(savedProfile));
    expect(loadLifeProfile(storage)?.birth.location).toBe("");
    expect(JSON.parse(storage.getItem(LIFE_PROFILE_STORAGE_KEY)!).birth.location).toBe("");
  });

  it("labels generated yearly and monthly entries as review planning templates, not fortune inference", () => {
    const chart = calculateFourPillars(savedProfile.birth);
    const profile = createLifeProfile({ name: savedProfile.name, birth: savedProfile.birth, chart, overview: buildProfessionalOverview(chart), interpretations: buildInterpretations(chart), now: new Date("2026-07-17T12:00:00+08:00") });
    expect(profile.annualMap.every(item => item.theme.includes("复盘计划模板"))).toBe(true);
    expect(profile.monthlyRhythm.every(item => item.theme.includes("行动计划模板"))).toBe(true);
  });
  it("creates a useful profile from a calculated report", () => {
    const chart = calculateFourPillars(savedProfile.birth);
    const overview = buildProfessionalOverview(chart);
    const interpretations = buildInterpretations(chart);
    const profile = createLifeProfile({
      name: savedProfile.name,
      birth: savedProfile.birth,
      chart,
      overview,
      interpretations,
      now: new Date("2026-07-17T12:00:00+08:00"),
    });

    expect(profile.currentStage).not.toBe("");
    expect(profile.annualMap).toHaveLength(3);
    expect(profile.monthlyRhythm).toHaveLength(12);
    expect(profile.actions[0]?.text).not.toBe("");
  });

  it("uses visitor as the profile fallback when name is empty", () => {
    const birth = { ...savedProfile.birth, name: "" };
    const chart = calculateFourPillars(birth);
    const profile = createLifeProfile({ name: "", birth, chart, overview: buildProfessionalOverview(chart), interpretations: buildInterpretations(chart) });
    expect(profile.name).toBe("访客");
  });

  it("updates the complete profile when the same birthday has a changed name and gender", () => {
    const chart = calculateFourPillars({ ...savedProfile.birth, name: "新名字", gender: "male" });
    const profile = createLifeProfile({
      name: "新名字",
      birth: { ...savedProfile.birth, name: "新名字", gender: "male" },
      chart,
      overview: buildProfessionalOverview(chart),
      interpretations: buildInterpretations(chart),
      existing: savedProfile,
      now: new Date("2026-07-17T12:00:00+08:00"),
    });

    expect(profile.name).toBe("新名字");
    expect(profile.birth.gender).toBe("male");
    expect(profile.events).toEqual(savedProfile.events);
    expect(profile.relations).toEqual(savedProfile.relations);
    expect(profile.createdAt).toBe(savedProfile.createdAt);
  });

  it("returns a returning user home without exposing private birth data", () => {
    const home = buildLifeHome(savedProfile, new Date("2026-07-17T12:00:00+08:00"));

    expect(home).toMatchObject({
      currentStage: expect.any(String),
      monthlyTheme: "整理边界",
      nextAction: "约一次信息访谈",
    });
    expect(home.annualEntry?.year).toBe(2026);
    expect(home.events[0].title).toBe("准备转岗");
    expect(home.relations[0].name).toBe("家人");
    expect(JSON.stringify(home)).not.toContain(savedProfile.birth.location);
    expect(JSON.stringify(home)).not.toContain(savedProfile.birth.date);
    expect(JSON.stringify(home)).not.toContain(savedProfile.birth.time);
  });

  it("saves, loads and clears a device-only profile", () => {
    const storage = memoryStorage();

    expect(saveLifeProfile(storage, savedProfile)).toEqual({ ok: true });
    expect(loadLifeProfile(storage)).toEqual({ ...savedProfile, birth: { ...savedProfile.birth, location: "" } });
    expect(clearLifeProfile(storage)).toEqual({ ok: true });

    expect(storage.getItem(LIFE_PROFILE_STORAGE_KEY)).toBeNull();
    expect(loadLifeProfile(storage)).toBeNull();
  });

  it("ignores malformed or unsupported stored profiles", () => {
    const storage = memoryStorage();
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, "not-json");
    expect(loadLifeProfile(storage)).toBeNull();
    expect(storage.getItem(LIFE_PROFILE_STORAGE_KEY)).toBeNull();
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, JSON.stringify({ ...savedProfile, version: 2 }));
    expect(loadLifeProfile(storage)).toBeNull();
    expect(storage.getItem(LIFE_PROFILE_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["birth gender", { ...savedProfile, birth: { ...savedProfile.birth, gender: "unknown" } }],
    ["birth date", { ...savedProfile, birth: { ...savedProfile.birth, date: "yesterday" } }],
    ["timestamp", { ...savedProfile, updatedAt: "2026" }],
    ["annual item", { ...savedProfile, annualMap: [{ year: "2026", theme: "a", focus: "b" }] }],
    ["monthly item", { ...savedProfile, monthlyRhythm: [{ month: "July", theme: "a", action: "b" }] }],
    ["event item", { ...savedProfile, events: [{ id: "x", title: 3, date: "", note: "" }] }],
    ["relation item", { ...savedProfile, relations: [{ id: "x", name: "甲", relationship: "enemy", note: "" }] }],
    ["action item", { ...savedProfile, actions: [{ id: "x", text: "做事", done: "no" }] }],
  ])("rejects a profile with malformed nested %s", (_label, value) => {
    const storage = memoryStorage();
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, JSON.stringify(value));
    expect(loadLifeProfile(storage)).toBeNull();
    expect(storage.getItem(LIFE_PROFILE_STORAGE_KEY)).toBeNull();
  });

  it("returns failures instead of throwing when device storage rejects writes or deletes", () => {
    const writeError = Object.assign(new Error("full"), { name: "QuotaExceededError" });
    const deleteError = Object.assign(new Error("blocked"), { name: "SecurityError" });
    const storage: ProfileStorage = {
      getItem: () => null,
      setItem: () => { throw writeError; },
      removeItem: () => { throw deleteError; },
    };

    expect(saveLifeProfile(storage, savedProfile)).toEqual({ ok: false, reason: "quota" });
    expect(clearLifeProfile(storage)).toEqual({ ok: false, reason: "security" });
  });

  it("returns null when an opaque origin throws while reading localStorage", () => {
    const opaqueWindow = Object.defineProperty({}, "localStorage", {
      get() { throw Object.assign(new Error("opaque origin"), { name: "SecurityError" }); },
    });

    expect(() => getBrowserStorage(opaqueWindow)).not.toThrow();
    expect(getBrowserStorage(opaqueWindow)).toBeNull();
  });

  it("applies event, relation and action CRUD without mutating the profile", () => {
    const addedEvent = lifeProfileReducer(savedProfile, { type: "add-event", event: { id: "event-2", title: "搬家", date: "2026-09-01", note: "" } });
    const removedEvent = lifeProfileReducer(addedEvent, { type: "delete-event", id: "event-1" });
    const addedRelation = lifeProfileReducer(removedEvent, { type: "add-relation", relation: { id: "relation-2", name: "同事", relationship: "colleague", note: "协作" } });
    const removedRelation = lifeProfileReducer(addedRelation, { type: "delete-relation", id: "relation-1" });
    const toggled = lifeProfileReducer(removedRelation, { type: "toggle-action", id: "action-1" });

    expect(savedProfile.events).toHaveLength(1);
    expect(toggled.events.map(item => item.id)).toEqual(["event-2"]);
    expect(toggled.relations.map(item => item.id)).toEqual(["relation-2"]);
    expect(toggled.actions[0].done).toBe(true);
  });
});
