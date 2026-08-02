import { deriveYiThemeElement, type YiThemeElement } from "./theme";
import type { BirthInput, FourPillarsResult } from "./types";

export type FengshuiPlan = {
  id: "desk" | "office" | "home" | "bedroom" | "yang-house" | "yin-house";
  title: string;
  subtitle: string;
  diagram: string;
  principle: string;
  steps: readonly string[];
  avoid: readonly string[];
  quickAction: string;
};

const elementTones: Record<YiThemeElement, string> = {
  木: "先让空间有生发感：通风、见绿、桌面留出伸展余地。",
  火: "先让空间有明亮感：灯光分层、入口清楚、沟通区不压迫。",
  土: "先让空间有承载感：动线稳定、收纳归位、重物有靠。",
  金: "先让空间有秩序感：边界清楚、线缆收束、物品少而精。",
  水: "先让空间有流动感：过道顺、信息通、安静角落可沉思。",
  neutral: "先让空间回到清爽可用：少堵、少乱、少压迫，多留一处可呼吸的空白。",
};

const plans: readonly Omit<FengshuiPlan, "quickAction">[] = [
  {
    id: "desk",
    title: "工位风水",
    subtitle: "图文规划｜桌、椅、屏幕、来人方向",
    diagram: "desk",
    principle: "背后有靠，前方留明堂，左右物品不过肩。",
    steps: [
      "椅背尽量靠墙、柜或稳定隔断，背后是走道时加低柜或靠垫形成安全感。",
      "屏幕放在正前偏内侧，避免正对门口被频繁打断。",
      "桌面左侧放待办，右侧放完成区，水杯和线缆不要占住手臂活动线。",
      "每天收工前留出键盘前一掌空白，第二天更容易进入状态。",
      "先看动线：别人经过时不擦身、不碰椅、不直接压到后背。",
    ],
    avoid: ["背门而坐且无靠", "杂物堆到眼前", "强光直射屏幕", "座位卡在门口冲线"],
  },
  {
    id: "office",
    title: "办公室风水",
    subtitle: "图文规划｜入口、会议、财务、协作区",
    diagram: "office",
    principle: "入口要清，主位要稳，协作区要有回旋余地。",
    steps: [
      "入口一米内不堆箱、不堵伞架，让来人先看见清楚路径。",
      "负责人座位不必追求正中，但要能看见主要入口和团队动线。",
      "会议桌旁留一条完整通道，减少每次起身都打断他人。",
      "财务、合同、印章等高敏物品放在可上锁且不被公开扫视的位置。",
      "采光通风不足时，先补工作灯和空气循环，再谈装饰。",
    ],
    avoid: ["门口堆物", "会议椅贴墙无退路", "机密材料外露", "所有人背后都是走道"],
  },
  {
    id: "home",
    title: "居家风水",
    subtitle: "图文规划｜玄关、客厅、厨房、收纳",
    diagram: "home",
    principle: "家先顺气，再求好看；入口、餐食、休息三条线不要互相打架。",
    steps: [
      "玄关只留当天会用的鞋、包、钥匙，给回家第一步留白。",
      "客厅中心不要被茶几和杂物切碎，留一条能自然走到窗边的动线。",
      "厨房刀具、火源、清洁用品分区放，湿区每天收干。",
      "家庭公共账单和快递设一个固定落点，减少到处找。",
      "每周选一个角落做十五分钟清理，不一次性折腾全屋。",
    ],
    avoid: ["玄关堵塞", "沙发无靠", "湿垃圾过夜", "餐桌长期堆文件"],
  },
  {
    id: "bedroom",
    title: "卧室风水",
    subtitle: "图文规划｜床、灯、镜、衣物",
    diagram: "bedroom",
    principle: "卧室先护睡眠：床位稳定，光线柔和，镜面和杂物降低刺激。",
    steps: [
      "床头尽量靠实墙，床两侧至少留一侧可顺畅下床。",
      "睡前视线范围内减少办公文件、脏衣堆和强提醒物。",
      "镜子不直接照床；无法移动时，用布帘或角度调整降低反射。",
      "床头灯用暖光，手机充电点离枕边远一点。",
      "起床后先开窗或开门通风十分钟，让卧室从休息切回日用。",
    ],
    avoid: ["床头悬重物", "镜面直照睡眠区", "床下长期塞杂物", "冷白强光直射枕边"],
  },
  {
    id: "yang-house",
    title: "阳宅风水",
    subtitle: "图文规划｜门、窗、水、路、院",
    diagram: "yang-house",
    principle: "阳宅重明堂、通风、排水与邻里动线，先看现实安全再谈意象。",
    steps: [
      "入户门外先保持明亮、干净、无尖锐杂物，门能完整打开。",
      "窗户保证采光通风，潮湿处优先处理渗水和霉味。",
      "排水沟、地漏、阳台不堵塞，水路顺比摆件更重要。",
      "院落或走廊留一条稳定主路径，老人小孩夜间行走不绊脚。",
      "购房或改造时记录噪音、日照、通勤、邻里四项现实指标。",
    ],
    avoid: ["门前脏堵暗", "排水不畅", "尖角杂物冲通道", "只看朝向不看安全"],
  },
  {
    id: "yin-house",
    title: "阴宅风水",
    subtitle: "图文规划｜纪念、祭扫、路径、环境维护",
    diagram: "yin-house",
    principle: "阴宅以敬祖、清洁、安宁、合规为先，不把迷信断语压过法律与公序。",
    steps: [
      "祭扫前先确认当地规定、开放时间和安全要求，不擅自改动公共设施。",
      "路径保持平稳清楚，老人同行时先看台阶、湿滑和照明。",
      "清理落叶、积水和破损供具，保持纪念空间安静整洁。",
      "家族协商以尊重和可执行为先，费用、时间、责任提前说清。",
      "若涉及迁葬、修缮或土地事项，优先咨询合法机构和专业人员。",
    ],
    avoid: ["私自施工", "明火无人看管", "把争执带到祭扫现场", "用恐吓式说法替代沟通"],
  },
];

export function buildFengshuiPlans(chart: FourPillarsResult, birth: BirthInput): FengshuiPlan[] {
  const element = deriveYiThemeElement(chart);
  const tone = elementTones[element];
  const name = birth.name.trim() || "你";
  return plans.map((plan, index) => ({
    ...plan,
    quickAction: `${name}可以先做第${index + 1}项里的一个小动作。${tone}`,
  }));
}
