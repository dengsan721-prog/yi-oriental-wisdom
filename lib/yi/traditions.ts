import { Solar } from "lunar-typescript";
import type { BirthInput, FourPillarsResult } from "./types";

export type TraditionMethod = "称骨" | "生肖" | "星座";
export type TraditionalLayer = {
  title: string;
  observation: string;
  mainChartComparison: string;
  confidence: "medium" | "limited";
  source: string;
};
export type TraditionalReading = {
  method: TraditionMethod;
  subject: string;
  available: boolean;
  role: string;
  layers: TraditionalLayer[];
  caution: string;
};

const yearGanZhi = ["甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉","甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未","甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳","甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯","甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑","甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥"];
const yearWeights = [12,9,6,7,12,5,9,8,7,8,15,9,16,8,8,19,12,6,8,7,5,15,6,16,15,7,9,12,10,7,15,6,5,14,14,9,7,7,9,12,8,7,13,5,14,5,9,17,5,7,12,8,8,6,19,6,8,16,10,7];
const monthWeights = [6,7,18,9,5,16,9,15,18,8,9,5];
const dayWeights = [5,10,8,15,16,15,8,16,8,16,9,17,8,17,10,8,9,18,5,15,10,9,8,9,15,18,7,8,16,6];
const timeWeights = [16,6,7,10,9,16,10,8,8,9,6,6];
const zodiacSource = "《渊海子平》论年柱与十二支取象；生肖仅取年支民俗层";
const boneSource = "《袁天罡称骨歌》通行重量表：六十年、农历十二月、三十日、十二时辰四表相加";
const starSource = "太阳星座通行黄道日期边界（按公历月日）；仅作西方通俗分类参照";

function mainComparison(chart: FourPillarsResult, detail: string) {
  return `主盘为${chart.professional.dayMaster.stem}${chart.professional.dayMaster.element}日主、${chart.professional.structureBalance}结构；${detail}，冲突时以主盘和现实证据为先。`;
}

function layers(subject: string, chart: FourPillarsResult, source: string, observations: string[], confidence: "medium" | "limited"): TraditionalLayer[] {
  const titles = ["计算依据", "核心取象", "优势假设", "压力校验", "关系提醒", "行动实验", "边界复核"];
  return titles.map((title, index) => ({ title, observation: observations[index], mainChartComparison: mainComparison(chart, `${subject}只用于辅助观察`), confidence, source }));
}

function starSign(month: number, day: number) {
  const boundaries = [[1,20,"水瓶座"],[2,19,"双鱼座"],[3,21,"白羊座"],[4,20,"金牛座"],[5,21,"双子座"],[6,22,"巨蟹座"],[7,23,"狮子座"],[8,23,"处女座"],[9,23,"天秤座"],[10,24,"天蝎座"],[11,23,"射手座"],[12,22,"摩羯座"]] as const;
  const [, start, current] = boundaries[month - 1];
  return day >= start ? current : boundaries[(month + 10) % 12][2];
}

export function buildTraditionalReadings(chart: FourPillarsResult, input: BirthInput): TraditionalReading[] {
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time?.split(":").map(Number) ?? [12, 0];
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
  const animal = lunar.getYearShengXiaoByLiChun();
  const sign = starSign(month, day);
  const boneAvailable = input.time !== null && input.timeConfidence !== "unknown";
  const yearIndex = yearGanZhi.indexOf(chart.pillars.year.stem + chart.pillars.year.branch);
  const boneWeight = boneAvailable ? yearWeights[yearIndex] + monthWeights[Math.abs(lunar.getMonth()) - 1] + dayWeights[lunar.getDay() - 1] + timeWeights[lunar.getTimeZhiIndex()] : null;
  const boneSubject = boneWeight === null ? "时辰未知，称骨无法完成" : `骨重 ${Math.floor(boneWeight / 10)} 两 ${boneWeight % 10} 钱`;
  return [
    { method: "称骨", subject: boneSubject, available: boneAvailable, role: "辅助民俗观察，不覆盖子平八字主盘", layers: layers(boneSubject, chart, boneSource, [boneAvailable ? `年柱、农历${Math.abs(lunar.getMonth())}月${lunar.getDay()}日、${lunar.getTimeZhi()}时四表相加` : "缺少时辰重量，四项合计不成立", boneAvailable ? "总量只对应通行歌诀区间，不拆成人格定论。" : "不展示骨重或歌诀结论。", "若歌诀描述与经历相符，也只保留可验证部分。", "压力描述必须由实际事件验证。", "不以骨重衡量关系价值。", "记录一项歌诀假设，一周后复盘证据。", "称骨属于民俗辅助层。"], boneAvailable ? "medium" : "limited"), caution: boneAvailable ? "重量表版本可能存在异文，已列明采用的通行表。" : "未知时辰时隐藏确定性结论。" },
    { method: "生肖", subject: `${animal}（立春年界）`, available: true, role: "辅助民俗观察，不覆盖子平八字主盘", layers: layers(animal, chart, zodiacSource, [`按立春年柱${chart.pillars.year.stem}${chart.pillars.year.branch}取生肖${animal}`, "只观察年柱的社会环境与早年接口。", "可检验在群体中的默认协作方式。", "不从生肖直接推断压力反应。", "不使用生肖合不合判断关系。", "观察一次群体互动并记录真实反馈。", "生肖不代表完整命局。"], "medium"), caution: "生肖仅是年支取象，不是人格标签。" },
    { method: "星座", subject: sign, available: true, role: "辅助通俗观察，不覆盖子平八字主盘", layers: layers(sign, chart, starSource, [`按公历${month}月${day}日落入${sign}`, "太阳星座只提供自我表达的通俗假设。", "检验主动表达与目标选择场景。", "不从星座直接预测压力事件。", "不以星座匹配判断关系成败。", "选择一个表达场景收集反馈。", "未计算完整西方本命盘。"], "limited"), caution: "太阳星座不是完整占星盘，也不覆盖八字主盘。" },
  ];
}
