import { YI_SOURCES, type YiSourceKey } from "./sources";
import type { FourPillarsResult, InterpretationItem, ProfessionalOverview } from "./types";

type Domain = InterpretationItem["domain"];

const domainLanguage: Record<Domain, { label: string; innovation: string; scenario: string; action: string }> = {
  self: { label: "自我结构", innovation: "内在定盘", scenario: "当你需要独立判断而外界意见很多时", action: "写下自己的判断、证据与可调整条件，再做决定。" },
  talent: { label: "能力表达", innovation: "天赋开关", scenario: "在学习新技能或向他人展示成果时", action: "选择一个可在一周内交付的小成果，让能力进入真实反馈。" },
  career: { label: "事业角色", innovation: "职场站位", scenario: "面对职责扩张、协作或岗位选择时", action: "把责任、权限和成果标准写成一页清单。" },
  wealth: { label: "资源经营", innovation: "价值回路", scenario: "配置时间、预算与合作资源时", action: "先守住稳定现金流，再为高波动尝试设定上限。" },
  relationship: { label: "关系互动", innovation: "关系镜面", scenario: "亲密关系中出现期待落差或边界拉扯时", action: "先说事实与感受，再提出一个具体、可回应的请求。" },
  family: { label: "家庭承接", innovation: "家族回声", scenario: "家庭成员期待你承担、协调或表态时", action: "区分关心与代替负责，并明确你能承接的范围。" },
  rhythm: { label: "身心节律", innovation: "四时节拍", scenario: "连续忙碌后需要恢复或安排长期节奏时", action: "为睡眠、运动与无输入时间各保留一个固定窗口。" },
};

function dominantGod(chart: FourPillarsResult) {
  const counts = new Map<string, number>();
  for (const item of chart.professional.tenGods) counts.set(item.tenGod, (counts.get(item.tenGod) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0]?.[0] ?? "十神信息有限";
}

function makeItem(
  chart: FourPillarsResult,
  domain: Domain,
  sequence: number,
  sourceKey: YiSourceKey,
  professionalTitle: string,
  basis: string,
  plainLanguage: string,
  mirror: string,
  caution: string,
  affectedByUnknownHour = false,
): InterpretationItem {
  const source = YI_SOURCES[sourceKey];
  return {
    id: `${domain}-${sequence}`,
    domain,
    professionalTitle,
    innovationTitle: `${domainLanguage[domain].innovation}·${sequence}`,
    basis,
    plainLanguage,
    scenario: domainLanguage[domain].scenario,
    mirror,
    action: domainLanguage[domain].action,
    caution,
    confidence: affectedByUnknownHour && !chart.pillars.hour ? "limited" : chart.confidence,
    sourceTradition: source.tradition,
    sourceReferences: [...source.references],
    affectedByUnknownHour,
  };
}

export function buildProfessionalOverview(chart: FourPillarsResult): ProfessionalOverview {
  const p = chart.professional;
  return {
    dayMaster: `${p.dayMaster.stem}日主`, dayMasterElement: p.dayMaster.element, strength: p.strength,
    pattern: p.pattern, climate: p.climate, favorableElements: [...p.favorableElements],
    unfavorableElements: [...p.unfavorableElements], tenGodSummary: `较显著的十神为${dominantGod(chart)}`,
    relationSummary: p.relations.length ? p.relations.map(item => item.label).join("、") : "原局未见明显天干五合、地支六合或六冲",
    confidence: chart.confidence,
  };
}

export function buildInterpretations(chart: FourPillarsResult): InterpretationItem[] {
  const p = chart.professional;
  const god = dominantGod(chart);
  const relation = p.relations[0];
  const strengthText = p.strength === "strong" ? "承载力较足，适合主动输出并接受现实校验" : p.strength === "weak" ? "更需要资源、同伴与节奏支持，不宜长期硬扛" : "力量相对均衡，关键在按情境调配投入";
  const relationBasis = relation ? `${relation.pillars.join("、")}柱见${relation.label}` : "原局未见明显天干五合、地支六合或六冲";
  const items: InterpretationItem[] = [];
  for (const domain of Object.keys(domainLanguage) as Domain[]) {
    const { label } = domainLanguage[domain];
    items.push(makeItem(chart, domain, 1, "balance", `${label}：${p.dayMaster.stem}日主${p.strength}`, `日主属${p.dayMaster.element}，扶助占比约${p.strengthScore}%`, strengthText, `像${p.dayMaster.element}性意象一样，在适合的条件中调整伸展方式`, "旺衰是结构权重，不等于能力高低或命运定论。"));
    items.push(makeItem(chart, domain, 2, "tenGods", `${label}：${god}较显`, `${god}在已知干支十神中出现频率较高；月令判断为${p.pattern}`, `你可能更常借由${god}所代表的互动方式处理这一主题，但仍需结合真实经历验证。`, `把${god}当作一面观察镜，而不是固定身份标签`, "十神描述关系功能，不直接对应职业、财富或关系结果。"));
    const hourKnown = Boolean(chart.pillars.hour);
    items.push(makeItem(chart, domain, 3, domain === "rhythm" ? "climate" : "relations", `${label}：${hourKnown ? "全盘联动观察" : "时柱影响待补"}`, hourKnown ? `${relationBasis}；${p.climate}` : `${relationBasis}；时辰未知，晚景、子女与内在愿景层面的信息暂不定论`, hourKnown ? "结构中的合冲与寒暖提示你在变化中既要看连接，也要看节奏。" : "当前结论只使用年、月、日三柱，涉及时柱的细节保留开放。", hourKnown ? "像观察潮汐一样辨认关系牵引与节奏变化" : "镜面暂留一角空白，等待可靠时辰再补全", "合冲表示结构互动，不等同于具体事件必然发生。", true));
  }
  return items;
}
