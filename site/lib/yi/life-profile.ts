import type { BirthInput, FourPillarsResult, InterpretationItem, ProfessionalOverview } from "./types";

export const LIFE_PROFILE_STORAGE_KEY = "yi-life-profile-v1";

export type LifeEvent = { id: string; title: string; date: string; note: string };
export type LifeRelation = { id: string; name: string; relationship: "partner" | "family" | "friend" | "colleague" | "other"; note: string };
export type LifeAction = { id: string; text: string; done: boolean };
export type AnnualEntry = { year: number; theme: string; focus: string };
export type MonthlyEntry = { month: string; theme: string; action: string };

export type LifeProfile = {
  version: 1;
  name: string;
  birth: BirthInput;
  createdAt: string;
  updatedAt: string;
  currentStage: string;
  annualMap: AnnualEntry[];
  monthlyRhythm: MonthlyEntry[];
  events: LifeEvent[];
  relations: LifeRelation[];
  actions: LifeAction[];
};

export type LifeHomeModel = {
  name: string;
  currentStage: string;
  annualEntry: AnnualEntry | null;
  monthlyTheme: string;
  monthlyAction: string;
  nextAction: string;
  events: LifeEvent[];
  relations: LifeRelation[];
  actions: LifeAction[];
};

export type ProfileStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const pad = (value: number) => String(value).padStart(2, "0");
const monthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const monthlyThemes = ["整理边界", "积蓄能量", "表达与连接", "稳步推进", "校准方向", "照顾身心", "作出选择", "建立秩序", "完成收束", "尝试新路", "复盘关系", "为来年留白"];

export function createLifeProfile(input: {
  name: string;
  birth: BirthInput;
  chart: FourPillarsResult;
  overview: ProfessionalOverview;
  interpretations: InterpretationItem[];
  now?: Date;
}): LifeProfile {
  const now = input.now ?? new Date();
  const rhythm = input.interpretations.find(item => item.domain === "rhythm") ?? input.interpretations[0];
  const stage = rhythm?.plainLanguage || input.overview.pattern || "观察当下，稳步向前";
  const action = rhythm?.action || "记录一件今天可以完成的小事";
  const year = now.getFullYear();
  const annualMap = [-1, 0, 1].map(offset => ({
    year: year + offset,
    theme: offset < 0 ? "回看与沉淀" : offset > 0 ? "展开与准备" : stage,
    focus: offset === 0 ? action : offset < 0 ? "保留真正有效的经验" : "给重要方向预留空间",
  }));
  const monthlyRhythm = Array.from({ length: 12 }, (_, index) => ({
    month: `${year}-${pad(index + 1)}`,
    theme: monthlyThemes[index],
    action: index === now.getMonth() ? action : `围绕“${monthlyThemes[index]}”留下一条记录`,
  }));
  const timestamp = now.toISOString();
  return {
    version: 1,
    name: input.name || "访客",
    birth: input.birth,
    createdAt: timestamp,
    updatedAt: timestamp,
    currentStage: stage,
    annualMap,
    monthlyRhythm,
    events: [],
    relations: [],
    actions: [{ id: `action-${now.getTime()}`, text: action, done: false }],
  };
}

export function buildLifeHome(profile: LifeProfile, now = new Date()): LifeHomeModel {
  const monthly = profile.monthlyRhythm.find(item => item.month === monthKey(now));
  return {
    name: profile.name,
    currentStage: profile.currentStage,
    annualEntry: profile.annualMap.find(item => item.year === now.getFullYear()) ?? null,
    monthlyTheme: monthly?.theme ?? "记录当下",
    monthlyAction: monthly?.action ?? "写下一条本月观察",
    nextAction: profile.actions.find(item => !item.done)?.text ?? monthly?.action ?? "写下一条下一步行动",
    events: profile.events.map(({ id, title, date, note }) => ({ id, title, date, note })),
    relations: profile.relations.map(({ id, name, relationship, note }) => ({ id, name, relationship, note })),
    actions: profile.actions.map(({ id, text, done }) => ({ id, text, done })),
  };
}

function isLifeProfile(value: unknown): value is LifeProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<LifeProfile>;
  return profile.version === 1 && typeof profile.name === "string" && !!profile.birth &&
    Array.isArray(profile.annualMap) && Array.isArray(profile.monthlyRhythm) &&
    Array.isArray(profile.events) && Array.isArray(profile.relations) && Array.isArray(profile.actions);
}

export function saveLifeProfile(storage: ProfileStorage, profile: LifeProfile) {
  storage.setItem(LIFE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadLifeProfile(storage: ProfileStorage): LifeProfile | null {
  try {
    const raw = storage.getItem(LIFE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profile: unknown = JSON.parse(raw);
    return isLifeProfile(profile) ? profile : null;
  } catch {
    return null;
  }
}

export function clearLifeProfile(storage: ProfileStorage) {
  storage.removeItem(LIFE_PROFILE_STORAGE_KEY);
}
