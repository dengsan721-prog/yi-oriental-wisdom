import { describe, expect, it } from "vitest";
import {
  LIFE_PROFILE_STORAGE_KEY,
  buildLifeHome,
  clearLifeProfile,
  createLifeProfile,
  loadLifeProfile,
  saveLifeProfile,
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

    saveLifeProfile(storage, savedProfile);
    expect(loadLifeProfile(storage)).toEqual(savedProfile);
    clearLifeProfile(storage);

    expect(storage.getItem(LIFE_PROFILE_STORAGE_KEY)).toBeNull();
    expect(loadLifeProfile(storage)).toBeNull();
  });

  it("ignores malformed or unsupported stored profiles", () => {
    const storage = memoryStorage();
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, "not-json");
    expect(loadLifeProfile(storage)).toBeNull();
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, JSON.stringify({ ...savedProfile, version: 2 }));
    expect(loadLifeProfile(storage)).toBeNull();
  });
});
