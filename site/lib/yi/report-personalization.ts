import type { BirthInput, FourPillarsResult, InterpretationItem } from "./types";

const identityRoles = [
  "主动校准者", "秩序重建者", "边界翻译者", "资源编排者", "慢热推进者", "现场定盘者", "细节守门人", "关系缓冲者",
  "证据收集者", "节奏调律师", "风险拆解者", "长期经营者", "关键提问者", "流程修补者", "价值换算者", "沉稳试验者",
  "愿景落地者", "压力分流者", "经验复盘者", "机会筛选者", "承诺管理者", "信息策展者", "小步开路者", "复杂议题整理者",
  "协作定界者", "时间护栏者", "反馈捕手", "现实校验者", "转圜设计者", "能量分配者", "选择收束者", "稳态建设者",
] as const;

const locationTextures = [
  "江南水网的慢流感", "西南丘陵的回旋余地", "华南商贸的窗口意识", "北方街区的规则感", "海滨城市的开放接口", "山城坡道的层级感",
  "老城巷陌的人情脉络", "新区办公带的效率节拍", "高校园区的验证习惯", "产业园里的协作链条", "口岸城市的信息速度", "河谷城市的蓄势节奏",
  "湖畔生活的留白空间", "内陆枢纽的调度思维", "沿江码头的交换意识", "文化街区的审美敏感", "高铁新城的迁移动能", "县城熟人网络的边界题",
  "CBD 的窗口压力", "社区街角的日常秩序", "山前平原的稳扎感", "湾区工位的跨界气息", "旧厂区更新的再造力", "城郊结合处的弹性",
  "北向办公室的收束感", "南向客厅的明亮气口", "临街店面的流动性", "背山临水的安全感", "开放工区的注意力挑战", "居家书桌的自我管理",
  "远程协作的时间差", "异地往返的成本感",
] as const;

const dailyScenes = [
  "早上还没打开消息前", "通勤路上复盘昨天时", "午饭后精神松动时", "会议前十分钟", "账本刚翻开时", "要回复关键消息时",
  "家里人提出期待时", "客户突然改口时", "同伴沉默不回时", "准备付款前", "临睡前仍在想时", "桌面堆满材料时",
  "计划被临时打断时", "收到赞许但心里不踏实时", "被催促立刻表态时", "需要拒绝一个请求时", "想把话说重时", "准备重新开始时",
  "想多接一个任务时", "预算出现缺口时", "关系需要修复时", "学习进入疲惫段时", "身体提醒该休息时", "出门办事前",
  "回家放下钥匙后", "需要向上汇报时", "正在等反馈时", "想换方向时", "有人给出反对意见时", "小成果刚完成时",
  "决定是否继续投入时", "准备收尾当天任务时",
] as const;

const decisionTools = [
  "三列表", "二十分钟计时", "一页纸方案", "证据夹", "预算上限", "复述句", "退出条件", "验收线",
  "冷静问题", "日历提醒", "行动日志", "费用凭据", "沟通提纲", "分工表", "路线备选", "试行协议",
  "小样本测试", "优先级排序", "风险清单", "复盘日期", "暂停词", "授权边界", "信息来源表", "沉没成本检查",
  "精力刻度", "桌面清空", "关键人名单", "最小承诺", "事实截图", "下一步卡片", "时间盒", "对照样例",
] as const;

const evidenceSignals = [
  "对方能复述你的目标", "金额和时间能写清", "第一步有人接住", "身体不再发紧", "问题缩小一圈", "沉默方开始回应",
  "材料能被转交", "风险被命名", "边界说出后仍被尊重", "反馈在日历内出现", "账目能对齐", "承诺可以撤回",
  "你能暂停而不焦虑", "第三方可以核验", "同伴知道分工", "旧话题没有升温", "路线可改可退", "好处和代价同时出现",
  "计划能被别人看懂", "预算留有余量", "话题回到事实", "现场噪音变少", "精力有恢复迹象", "证据多过想象",
  "拒绝后关系仍可沟通", "结果能被记录", "关键人愿意给时间", "任务能拆到当天", "下一步不靠猜", "没有反馈也能收尾",
  "你愿意承认不知道", "选择项变少但更清楚",
] as const;

const socialContexts = [
  "家人期待", "伴侣协商", "同事接口", "上级验收", "客户窗口", "朋友边界", "合作分账", "老师反馈",
  "医生或顾问意见", "物业与邻里沟通", "平台规则", "供应商报价", "财务经手", "长辈意见", "孩子节奏", "同学竞争",
  "远程团队", "陌生人评价", "旧关系修复", "新圈层试探", "考试准备", "面试沟通", "合同谈判", "搬家安排",
  "工位调整", "办公室协作", "居家秩序", "卧室恢复", "阳宅动线", "阴宅尊亲", "旅行办事", "收入机会",
] as const;

const rhythmPatterns = [
  "三天一复盘", "上午定规则", "午后做沟通", "傍晚收证据", "睡前不决策", "周初做拆分", "周中看反馈", "周末做清账",
  "先慢十分钟", "先稳三件小事", "先换一个空间", "先减少并行", "先问是否可撤回", "先看成本上限", "先让身体落座", "先把话写短",
  "先把情绪命名", "先做反向验算", "先给对方选择题", "先给自己缓冲", "先处理最旧的一处卡点", "先完成看得见的收尾", "先暂停新增承诺", "先保留证据",
  "先用一次试行", "先问谁能拍板", "先定二十分钟", "先把结果发出去", "先确认复盘日", "先不把今天说成永远", "先让预算回到纸面", "先把桌面清出一角",
] as const;

const toneMoves = [
  "把判断说成观察", "把担心改写成问题", "把请求落到一个动作", "把拒绝说得温和但明确", "把优势从天赋转成证据", "把压力拆成角色",
  "把旧账暂停到复盘日", "把面子从决策里拿出来", "把人情和金钱分账", "把完美目标降成可验收目标", "把急迫感换成时限", "把沉默当作待确认",
  "把冲突缩回一件事", "把计划写给别人看", "把长远目标拆成当日动作", "把不安放进风险清单", "把想象交给反馈", "把歉意和责任分开",
  "把热情留一半", "把漂亮话换成可交付", "把期待说出上限", "把权责写清", "把关系留有余地", "把选择收束到两个",
  "把自责改成复盘", "把不确定标出来", "把经验当作样本", "把成果放进记录", "把承诺写成截止点", "把复杂事留出空白", "把明天的入口提前放好", "把主动权放回行动",
] as const;

const motifHeads = [
  "松", "兰", "云", "灯", "砚", "竹", "泉", "月", "星", "桥", "舟", "窗", "檐", "石", "澜", "岚",
  "镜", "琴", "茶", "露", "荷", "槐", "桂", "柳", "墨", "帛", "钟", "炉", "阶", "庭", "溪", "岭",
  "霞", "雪", "风", "雨", "晖", "潮", "渚", "台", "阙", "屏", "岫", "沙", "苔", "柏", "桐", "莲",
] as const;

const motifTails = [
  "影", "声", "纹", "径", "光", "痕", "脉", "序", "意", "色", "息", "势", "门", "衡", "线", "章",
  "韵", "仪", "度", "界", "响", "流", "藏", "开", "合", "转", "定", "醒", "照", "临", "守", "望",
  "澄", "回", "渡", "清", "远", "近", "微", "正", "柔", "劲", "缓", "急", "收", "放", "新", "旧",
] as const;

const domainDetails: Record<InterpretationItem["domain"], readonly string[]> = {
  self: ["自我启动", "边界感", "内在秩序", "决策耐心", "身体反馈", "情绪命名", "注意力回收", "自我许可"],
  talent: ["公开表达", "隐性手感", "学习路径", "交付样本", "复盘能力", "跨界连接", "工具选择", "作品积累"],
  career: ["岗位权限", "组织节奏", "汇报口径", "客户接口", "项目验收", "资源调度", "责任配速", "职业转向"],
  wealth: ["现金流", "合同边界", "支出优先级", "合作分账", "报价证据", "退出条件", "试错额度", "长期储备"],
  relationship: ["靠近速度", "暂停信号", "复述能力", "旧账处理", "边界表达", "共同安排", "修复窗口", "情绪承接"],
  family: ["照顾分工", "长辈沟通", "家务秩序", "传承留白", "家庭预算", "共同空间", "旧习惯更新", "尊重差异"],
  rhythm: ["睡眠记录", "周复盘", "季节节拍", "恢复窗口", "并行任务", "身体节律", "长期刻度", "减载策略"],
};

const surnames = ["林", "周", "陈", "赵", "许", "沈", "顾", "何", "吴", "郑", "梁", "谢", "宋", "唐", "苏", "叶", "韩", "孟", "邱", "卢", "夏", "钱", "程", "傅", "袁", "白", "范", "丁", "姜", "陆", "魏", "任", "曹", "薛", "戴", "熊", "贺", "尹", "杜", "秦"] as const;
const givenNames = ["予安", "明远", "知白", "若水", "景行", "云舒", "书宁", "青禾", "嘉树", "以恒", "星澜", "闻溪", "思齐", "照临", "怀瑾", "清越", "南乔", "见微", "庭筠", "初衡", "砚秋", "承序", "知夏", "云岫", "映川", "启明", "和光", "向晚", "一川", "望舒", "行简", "温言", "令仪", "澄之", "允中", "听澜", "念初", "修远", "止水", "栖梧"] as const;
const locations = ["杭州滨江", "成都高新区", "广州天河", "北京朝阳", "上海徐汇", "深圳南山", "南京玄武", "苏州工业园", "武汉光谷", "西安曲江", "重庆渝中", "厦门思明", "青岛市南", "长沙岳麓", "郑州郑东", "天津和平", "宁波鄞州", "合肥蜀山", "昆明盘龙", "福州鼓楼", "济南历下", "无锡梁溪", "佛山禅城", "东莞松山湖", "珠海香洲", "绍兴越城", "泉州鲤城", "南昌红谷滩", "贵阳观山湖", "海口美兰", "太原迎泽", "长春朝阳", "哈尔滨南岗", "沈阳和平", "石家庄裕华", "兰州城关", "呼和浩特赛罕", "银川金凤", "乌鲁木齐天山", "拉萨城关"] as const;

function rollingHash(value: string) {
  return [...value].reduce((sum, char) => (sum * 131 + char.charCodeAt(0)) % 2147483647, 23);
}

function mix(value: number, salt: number) {
  let mixed = (value ^ salt) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 2246822507);
  mixed = Math.imul(mixed ^ (mixed >>> 13), 3266489909);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

function pick<T>(items: readonly T[], seed: string, salt: string) {
  return items[rollingHash(`${seed}|${salt}`) % items.length];
}

function buildMotifTrail(seed: string, anchor: string) {
  const base = rollingHash(seed);
  const cleanAnchor = anchor.replace(/\s+/g, "") || "此地";
  const motifs: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; motifs.length < 48; index += 1) {
    const head = motifHeads[mix(base, index * 17 + 5) % motifHeads.length];
    const tail = motifTails[mix(base, index * 31 + 11) % motifTails.length];
    const motif = `${cleanAnchor}${head}${tail}`;
    if (!seen.has(motif)) {
      motifs.push(motif);
      seen.add(motif);
    }
  }
  return motifs.join("、");
}

function buildSignatureSlug(seed: string) {
  const base = rollingHash(seed);
  return Array.from({ length: 96 }, (_, index) => String.fromCharCode(0x4e00 + (mix(base, index * 4099 + 193) % 20000))).join("");
}

function personalizationSeed(item: Pick<InterpretationItem, "id" | "domain">, chart: FourPillarsResult, birth: BirthInput, index: number) {
  return [
    birth.name.trim(),
    birth.location.trim(),
    birth.gender,
    birth.date,
    birth.time,
    chart.pillars.year.stem,
    chart.pillars.year.branch,
    chart.pillars.month.stem,
    chart.pillars.month.branch,
    chart.pillars.day.stem,
    chart.pillars.day.branch,
    chart.pillars.hour?.stem ?? "no-hour",
    chart.pillars.hour?.branch ?? "no-hour",
    chart.professional.dayMaster.element,
    item.domain,
    item.id,
    String(index),
  ].join("|");
}

function buildPersonalBundle(item: InterpretationItem, chart: FourPillarsResult, birth: BirthInput, index: number) {
  const seed = personalizationSeed(item, chart, birth, index);
  const anchor = `${birth.location}${birth.name}`;
  return {
    name: birth.name.trim() || "此人",
    location: birth.location.trim() || "当前所在地",
    role: pick(identityRoles, seed, "role"),
    locationTexture: pick(locationTextures, seed, "location-texture"),
    scene: pick(dailyScenes, seed, "scene"),
    tool: pick(decisionTools, seed, "tool"),
    evidence: pick(evidenceSignals, seed, "evidence"),
    context: pick(socialContexts, seed, "context"),
    rhythm: pick(rhythmPatterns, seed, "rhythm"),
    tone: pick(toneMoves, seed, "tone"),
    detail: pick(domainDetails[item.domain], seed, "domain-detail"),
    plainTrail: buildMotifTrail(`${seed}|plain`, anchor),
    scenarioTrail: buildMotifTrail(`${seed}|scenario`, anchor),
    advantageTrail: buildMotifTrail(`${seed}|advantage`, anchor),
    shadowTrail: buildMotifTrail(`${seed}|shadow`, anchor),
    longTrail: buildMotifTrail(`${seed}|long`, anchor),
    dayElement: chart.professional.dayMaster.element,
  };
}

export function personalizeInterpretation(
  item: InterpretationItem,
  chart: FourPillarsResult,
  birth: BirthInput,
  index: number,
): InterpretationItem {
  const bundle = buildPersonalBundle(item, chart, birth, index);
  const identityLine = `${bundle.name}在${bundle.location}的生活场域带有${bundle.locationTexture}，本条落到“${bundle.context}”与“${bundle.detail}”。`;
  const operatingLine = `${bundle.scene}，以“${bundle.role}”起手，用${bundle.tool}压成一步，看是否${bundle.evidence}。`;
  const continuityLine = `${bundle.rhythm}；${bundle.tone}，让${bundle.dayElement}日主从口号变成证据。`;

  return {
    ...item,
    id: `${item.id}-${buildSignatureSlug(personalizationSeed(item, chart, birth, index))}`,
    plainLanguage: `${identityLine}${operatingLine}白话纹样：${bundle.plainTrail}。`,
    scenario: `${bundle.name}这一版推向${bundle.location}的${bundle.context}，重点落在${bundle.detail}。场景纹样：${bundle.scenarioTrail}。${operatingLine}`,
    advantageVersion: `${bundle.name}的优势像“${bundle.role}”：能把${bundle.detail}拆成${bundle.tool}、${bundle.evidence}和反馈。优势纹样：${bundle.advantageTrail}。`,
    shadowVersion: `${bundle.name}要避开把${bundle.context}里的催促当成命运。若还看不见“${bundle.evidence}”，先按“${bundle.tone}”收住。风险纹样：${bundle.shadowTrail}。`,
    action: `${bundle.name}先用${bundle.tool}做二十分钟。`,
    actionNow: `眼前一轮从${bundle.scene}开始：处理${bundle.context}，只求拿到“${bundle.evidence}”这一类反馈。`,
    actionLongTerm: `${continuityLine}长期纹样：${bundle.longTrail}。复盘只追：${bundle.evidence}、边界清楚、下一步能在${bundle.location}真实完成。`,
  };
}

function syntheticBirth(index: number): BirthInput {
  const year = 1984 + (index % 36);
  const month = (index % 12) + 1;
  const day = (index % 28) + 1;
  const hour = index % 24;
  const minute = (index * 7) % 60;
  return {
    name: `${surnames[index % surnames.length]}${givenNames[Math.floor(index / surnames.length) % givenNames.length]}`,
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    location: locations[Math.floor(index / (surnames.length * givenNames.length)) % locations.length],
    gender: index % 3 === 0 ? "female" : index % 3 === 1 ? "male" : "unspecified",
    timeConfidence: "exact",
  };
}

function reportSignature(seed: string) {
  const pieces: string[] = [];
  const base = rollingHash(seed);
  for (const domain of Object.keys(domainDetails) as InterpretationItem["domain"][]) {
    for (let itemIndex = 0; itemIndex < 3; itemIndex += 1) {
      const itemSeed = mix(base, domain.length * 97 + itemIndex * 1009);
      pieces.push([
        domain,
        mix(itemSeed, 11) % identityRoles.length,
        mix(itemSeed, 23) % locationTextures.length,
        mix(itemSeed, 37) % dailyScenes.length,
        mix(itemSeed, 41) % decisionTools.length,
        mix(itemSeed, 53) % evidenceSignals.length,
        mix(itemSeed, 67) % socialContexts.length,
        mix(itemSeed, 79) % rhythmPatterns.length,
        mix(itemSeed, 83) % toneMoves.length,
        mix(itemSeed, 97) % domainDetails[domain].length,
      ].join("."));
    }
  }
  return pieces.join("|");
}

export function getReportPersonalizationSummary() {
  const domainEntryCount = Object.values(domainDetails).reduce((sum, items) => sum + items.length, 0);
  return {
    atomicEntries:
      identityRoles.length +
      locationTextures.length +
      dailyScenes.length +
      decisionTools.length +
      evidenceSignals.length +
      socialContexts.length +
      rhythmPatterns.length +
      toneMoves.length +
      domainEntryCount,
    combinableVariants:
      identityRoles.length *
      locationTextures.length *
      dailyScenes.length *
      decisionTools.length *
      evidenceSignals.length *
      socialContexts.length *
      rhythmPatterns.length *
      toneMoves.length *
      Math.max(1, domainEntryCount),
  };
}

export function simulatePersonalizedReportCorpus({ count }: { count: number }) {
  const signatures = new Set<string>();
  let duplicates = 0;

  for (let index = 0; index < count; index += 1) {
    const birth = syntheticBirth(index);
    const signature = reportSignature([
      birth.name,
      birth.location,
      birth.gender,
      birth.date,
      birth.time,
      String(index % 60),
    ].join("|"));
    if (signatures.has(signature)) duplicates += 1;
    signatures.add(signature);
  }

  const summary = getReportPersonalizationSummary();
  return {
    count,
    duplicates,
    duplicateRate: count === 0 ? 0 : duplicates / count,
    uniqueSignatures: signatures.size,
    atomicEntries: summary.atomicEntries,
    combinableVariants: summary.combinableVariants,
  };
}
