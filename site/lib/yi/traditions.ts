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
const boneSource = "称骨通行表 v1（整理于 2026-07-17）：六十年、农历十二月、三十日、十二时辰四表相加；异文不混算，遇不同版本须标注并重新计算";
const starSource = "太阳星座通行黄道日期边界（按公历月日）；仅作西方通俗分类参照";
const animalProfiles: Record<string, [string, string, string, string]> = {
  鼠:["信息敏锐","资源缝隙","不确定时反复试探","先核实再承诺"],牛:["稳定承载","长期建设","责任过量时僵持","明确责任上限"],虎:["主动开路","新局启动","受限时正面碰撞","先试小范围"],兔:["关系感知","协调氛围","冲突时回避表达","温和说出边界"],龙:["整合愿景","跨域推动","期待过高时失焦","拆成阶段里程碑"],蛇:["深度判断","复杂研究","高压时过度保留","给判断设期限"],马:["快速行动","外部拓展","节奏过快时耗散","安排停顿复盘"],羊:["细腻协作","照料支持","需求冲突时委屈承接","先确认自身需要"],猴:["灵活解题","变化应对","选择过多时跳转","一次完成一个闭环"],鸡:["标准辨识","质量把关","标准过紧时挑剔","区分底线与偏好"],狗:["责任忠诚","守护共同体","失望时防御","用事实重建信任"],猪:["包容连接","资源共享","边界模糊时透支","约定给予的范围"],
};
const starProfiles: Record<string, [string, string, string, string]> = {
  白羊座:["直接启动","坦率互动","受阻时急躁","行动前留一拍"],金牛座:["稳定兑现","重视可靠","变化过快时固守","先保底再试新"],双子座:["多线表达","以交流连接","信息过载时分散","收束一个结论"],巨蟹座:["情境感受","以照顾连接","不安时退守","说清安全需要"],狮子座:["可见表达","以认可连接","失去回应时用力过度","让作品代替证明"],处女座:["细节改进","以服务连接","压力下过度校正","先完成再优化"],天秤座:["平衡协商","以共识连接","冲突时延迟决定","设定决策期限"],天蝎座:["深度投入","以信任连接","受伤时封闭","逐级开放信息"],射手座:["意义扩展","以共同探索连接","受限时抽离","把自由写进约定"],摩羯座:["目标建构","以责任连接","压力下只顾任务","同步感受与进度"],水瓶座:["独立观点","以理念连接","被要求一致时疏离","解释差异的价值"],双鱼座:["想象共情","以感受连接","边界模糊时耗散","先分清谁的需要"],
};
const boneRanges: [number, number, string][] = [[21,29,"资源起点偏轻，歌诀多谈先难后成"],[30,39,"中段骨重，歌诀多谈渐进积累"],[40,49,"中高骨重，歌诀多谈自主成事"],[50,59,"较高骨重，歌诀多谈担当与机缘"],[60,72,"高段骨重，歌诀多谈厚重承载"]];

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

export function calculateBoneWeight(input: BirthInput) {
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time?.split(":").map(Number) ?? [12, 0];
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
  const lunarYearGanZhi = lunar.getYearInGanZhi();
  return { yearGanZhi: lunarYearGanZhi, totalQian: yearWeights[yearGanZhi.indexOf(lunarYearGanZhi)] + monthWeights[Math.abs(lunar.getMonth()) - 1] + dayWeights[lunar.getDay() - 1] + timeWeights[lunar.getTimeZhiIndex()] };
}

export function buildTraditionalReadings(chart: FourPillarsResult, input: BirthInput): TraditionalReading[] {
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time?.split(":").map(Number) ?? [12, 0];
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
  const animal = lunar.getYearShengXiaoByLiChun();
  const sign = starSign(month, day);
  const boneAvailable = input.time !== null && input.timeConfidence !== "unknown";
  const boneWeight = boneAvailable ? calculateBoneWeight(input).totalQian : null;
  const boneSubject = boneWeight === null ? "时辰未知，称骨无法完成" : `骨重 ${Math.floor(boneWeight / 10)} 两 ${boneWeight % 10} 钱`;
  const boneSummary = boneWeight === null ? "缺少时辰，不进入歌诀区间" : boneRanges.find(([min, max]) => boneWeight >= min && boneWeight <= max)?.[2] ?? "骨重超出通行表常见区间，需复核输入";
  const animalProfile = animalProfiles[animal];
  const starProfile = starProfiles[sign];
  return [
    { method: "称骨", subject: boneSubject, available: boneAvailable, role: "辅助民俗观察，不覆盖子平八字主盘", layers: layers(boneSubject, chart, boneSource, [boneAvailable ? `农历年${lunar.getYearInGanZhi()}、${Math.abs(lunar.getMonth())}月${lunar.getDay()}日、${lunar.getTimeZhi()}时四表相加` : "缺少时辰重量，四项合计不成立", boneSummary, boneWeight !== null && boneWeight >= 40 ? "歌诀高段常强调自主承载，需与主盘承压结构互证。" : "歌诀渐进段常强调积累，需与主盘资源结构互证。", `压力校验围绕“${boneSummary}”，不外推事件吉凶。`, "骨重不用于衡量关系价值或匹配度。", boneAvailable ? `记录“${boneSummary}”的一项现实证据与反证。` : "先补充可靠时辰，再进行四表合计。", "重量表版本与歌诀异文均需保留来源。"], boneAvailable ? "medium" : "limited"), caution: boneAvailable ? "重量表版本可能存在异文，已列明采用的通行表。" : "未知时辰时隐藏确定性结论。" },
    { method: "生肖", subject: `${animal}（立春年界）`, available: true, role: "辅助民俗观察，不覆盖子平八字主盘", layers: layers(animal, chart, zodiacSource, [`按立春年柱${chart.pillars.year.stem}${chart.pillars.year.branch}取生肖${animal}`, `${animal}的辅助属性取“${animalProfile[0]}”。`, `优势场景：${animalProfile[1]}。`, `压力表现待检验：${animalProfile[2]}。`, `关系中以“${animalProfile[0]}”为观察问题，不做合婚判断。`, `行动：${animalProfile[3]}。`, `${animal}只代表年支取象，不代表完整命局。`], "medium"), caution: "生肖仅是年支取象，不是人格标签。" },
    { method: "星座", subject: sign, available: true, role: "辅助通俗观察，不覆盖子平八字主盘", layers: layers(sign, chart, starSource, [`按公历${month}月${day}日落入${sign}`, `${sign}的表达假设：${starProfile[0]}。`, `适配场景：${starProfile[1]}。`, `压力假设：${starProfile[2]}。`, `关系观察：${starProfile[1]}，不据此判断成败。`, `行动：${starProfile[3]}。`, `${sign}仅为太阳星座，未计算上升、月亮与宫位。`], "limited"), caution: "太阳星座不是完整占星盘，也不覆盖八字主盘。" },
  ];
}
