import type { ElementName, FourPillarsResult } from "./types";

export type InterpretationCard = {
  id: string;
  innovationName: string;
  professionalName: string;
  professionalBasis: string;
  story: string;
  realityCheck: string;
  action: string;
  counterCondition: string;
};

const wisdom: Record<ElementName, Omit<InterpretationCard, "id">> = {
  木: { innovationName: "生长之力", professionalName: "木性与生发", professionalBasis: "五行木的数量与季节位置", story: "你像一株会寻找光线的树，真正有力量时，往往不是守住原地，而是持续学习、连接与生长。", realityCheck: "回想最近一年：是否越有成长空间，你越愿意投入？", action: "选一件停滞已久的事，今天只推进最小的一步。", counterCondition: "如果你在变化中持续感到耗竭，这一主题应降低权重。" },
  火: { innovationName: "照见之力", professionalName: "火性与显化", professionalBasis: "五行火的数量与季节位置", story: "你像一盏需要被点亮的灯，在表达、影响和创造看得见的成果时，更容易进入状态。", realityCheck: "你是否在被看见、被回应时更有行动力？", action: "把一个想法讲给可信任的人，并收集一个真实反馈。", counterCondition: "如果公开表达长期让你失去能量，应优先保护边界。" },
  土: { innovationName: "承载之力", professionalName: "土性与中和", professionalBasis: "五行土的数量与季节位置", story: "你像一片能让人落脚的土地，擅长把散乱的人与事重新安放到可持续的秩序里。", realityCheck: "团队或家庭混乱时，大家是否习惯来找你收尾？", action: "为当前最重要的事写下边界、负责人和完成标准。", counterCondition: "如果承接过多已经影响健康，需要把可靠改成有边界的可靠。" },
  金: { innovationName: "取舍之力", professionalName: "金性与肃降", professionalBasis: "五行金的数量与季节位置", story: "你像秋日清澈的风，重要能力不是拥有更多，而是看清什么应该留下、什么应当结束。", realityCheck: "面对复杂选择时，你是否常能先看见标准和漏洞？", action: "删掉一个低价值承诺，为真正重要的事腾出空间。", counterCondition: "如果判断过快伤害了关系，需要先听完再下结论。" },
  水: { innovationName: "洞察之力", professionalName: "水性与润下", professionalBasis: "五行水的数量与季节位置", story: "你像深夜仍在流动的水，擅长观察未说出口的信息，并为变化预留转身的空间。", realityCheck: "在陌生环境里，你是否常先观察，再找到最省力的入口？", action: "在下一次重要沟通前，先写下三个你还不知道的问题。", counterCondition: "如果观察变成反复犹豫，应给决定设置时间边界。" },
};

export function buildInterpretation(result: FourPillarsResult): InterpretationCard[] {
  return (Object.entries(result.elementCounts) as [ElementName, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([element], index) => ({ id: `${element}-${index}`, ...wisdom[element] }));
}
