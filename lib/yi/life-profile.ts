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
export type StorageResult = { ok: true } | { ok: false; reason: "quota" | "security" | "unavailable" };
export type LifeProfileAction =
  | { type: "add-event"; event: LifeEvent }
  | { type: "delete-event"; id: string }
  | { type: "add-relation"; relation: LifeRelation }
  | { type: "delete-relation"; id: string }
  | { type: "toggle-action"; id: string };

const pad = (value: number) => String(value).padStart(2, "0");

export function getBrowserStorage(source: object): ProfileStorage | null {
  try { return (source as { localStorage?: ProfileStorage }).localStorage ?? null; }
  catch { return null; }
}
const monthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const monthlyThemes = ["整理边界", "积蓄能量", "表达与连接", "稳步推进", "校准方向", "照顾身心", "作出选择", "建立秩序", "完成收束", "尝试新路", "复盘关系", "为来年留白"];
const minimizeProfile = (profile: LifeProfile): LifeProfile => ({ ...profile, birth: { ...profile.birth, location: "" } });

export function createLifeProfile(input: {
  name: string;
  birth: BirthInput;
  chart: FourPillarsResult;
  overview: ProfessionalOverview;
  interpretations: InterpretationItem[];
  existing?: LifeProfile | null;
  now?: Date;
}): LifeProfile {
  const now = input.now ?? new Date();
  const rhythm = input.interpretations.find(item => item.domain === "rhythm") ?? input.interpretations[0];
  const stage = rhythm?.plainLanguage || input.overview.pattern || "观察当下，稳步向前";
  const action = rhythm?.action || "记录一件今天可以完成的小事";
  const year = now.getFullYear();
  const annualMap = [-1, 0, 1].map(offset => ({
    year: year + offset,
    theme: `复盘计划模板 · ${offset < 0 ? "回看与沉淀" : offset > 0 ? "展开与准备" : stage}`,
    focus: offset === 0 ? action : offset < 0 ? "保留真正有效的经验" : "给重要方向预留空间",
  }));
  const monthlyRhythm = Array.from({ length: 12 }, (_, index) => ({
    month: `${year}-${pad(index + 1)}`,
    theme: `行动计划模板 · ${monthlyThemes[index]}`,
    action: index === now.getMonth() ? action : `围绕“${monthlyThemes[index]}”留下一条记录`,
  }));
  const timestamp = now.toISOString();
  return {
    version: 1,
    name: input.name || "访客",
    birth: { ...input.birth, location: "" },
    createdAt: input.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    currentStage: stage,
    annualMap,
    monthlyRhythm,
    events: input.existing?.events ?? [],
    relations: input.existing?.relations ?? [],
    actions: input.existing?.actions.length ? input.existing.actions : [{ id: `action-${now.getTime()}`, text: action, done: false }],
  };
}

export function lifeProfileReducer(profile: LifeProfile, action: LifeProfileAction): LifeProfile {
  if (action.type === "add-event") return { ...profile, events: [...profile.events, action.event] };
  if (action.type === "delete-event") return { ...profile, events: profile.events.filter(item => item.id !== action.id) };
  if (action.type === "add-relation") return { ...profile, relations: [...profile.relations, action.relation] };
  if (action.type === "delete-relation") return { ...profile, relations: profile.relations.filter(item => item.id !== action.id) };
  return { ...profile, actions: profile.actions.map(item => item.id === action.id ? { ...item, done: !item.done } : item) };
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

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object";
const isString = (value: unknown): value is string => typeof value === "string";
const isTimestamp = (value: unknown) => isString(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
function isDate(value: unknown, optional = false) {
  if (optional && value === "") return true;
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
const hasStrings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => isString(value[key]));

function isBirthInput(value: unknown): value is BirthInput {
  if (!isObject(value) || !hasStrings(value, ["name", "date", "location", "gender", "timeConfidence"])) return false;
  return isDate(value.date) && (value.time === null || (isString(value.time) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time))) &&
    ["female", "male", "unspecified"].includes(value.gender as string) && ["exact", "approximate", "unknown"].includes(value.timeConfidence as string);
}

function isLifeProfile(value: unknown): value is LifeProfile {
  if (!isObject(value) || value.version !== 1 || !hasStrings(value, ["name", "createdAt", "updatedAt", "currentStage"]) || !isBirthInput(value.birth)) return false;
  if (!isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt)) return false;
  if (!Array.isArray(value.annualMap) || !value.annualMap.every(item => isObject(item) && Number.isInteger(item.year) && hasStrings(item, ["theme", "focus"]))) return false;
  if (!Array.isArray(value.monthlyRhythm) || !value.monthlyRhythm.every(item => isObject(item) && isString(item.month) && /^\d{4}-(0[1-9]|1[0-2])$/.test(item.month) && hasStrings(item, ["theme", "action"]))) return false;
  if (!Array.isArray(value.events) || !value.events.every(item => isObject(item) && hasStrings(item, ["id", "title", "date", "note"]) && isDate(item.date, true))) return false;
  if (!Array.isArray(value.relations) || !value.relations.every(item => isObject(item) && hasStrings(item, ["id", "name", "relationship", "note"]) && ["partner", "family", "friend", "colleague", "other"].includes(item.relationship as string))) return false;
  return Array.isArray(value.actions) && value.actions.every(item => isObject(item) && hasStrings(item, ["id", "text"]) && typeof item.done === "boolean");
}

function storageFailure(error: unknown): StorageResult {
  const name = isObject(error) && isString(error.name) ? error.name : "";
  if (name === "QuotaExceededError") return { ok: false, reason: "quota" };
  if (name === "SecurityError") return { ok: false, reason: "security" };
  return { ok: false, reason: "unavailable" };
}

export function saveLifeProfile(storage: ProfileStorage, profile: LifeProfile): StorageResult {
  try {
    storage.setItem(LIFE_PROFILE_STORAGE_KEY, JSON.stringify(minimizeProfile(profile)));
    return { ok: true };
  } catch (error) {
    return storageFailure(error);
  }
}

export function exportLifeProfile(profile: LifeProfile): string {
  return JSON.stringify(minimizeProfile(profile), null, 2);
}

export function loadLifeProfile(storage: ProfileStorage): LifeProfile | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(LIFE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profile: unknown = JSON.parse(raw);
    if (isLifeProfile(profile)) return profile;
    clearLifeProfile(storage);
    return null;
  } catch {
    if (raw) clearLifeProfile(storage);
    return null;
  }
}

export function clearLifeProfile(storage: ProfileStorage): StorageResult {
  try {
    storage.removeItem(LIFE_PROFILE_STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    return storageFailure(error);
  }
}
