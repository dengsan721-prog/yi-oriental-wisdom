import { getInterpretationEnrichment, type InterpretationId } from "./interpretation-enrichment";

function scene(id: InterpretationId, scenario: string) {
  return { scenario, action: getInterpretationEnrichment(id).actionNow };
}

export const scenarioLibrary = {
  "self-day-master": scene("self-day-master", "会议需要在多种意见中作决定时，你可能先建立自己的判断顺序，再选择吸收哪些建议；如果没有主动寻找反证，清晰主见也可能变成过早定案。"),
  "self-support": scene("self-support", "工作、家庭和关系责任同时推进时，你可能只盯着事项有没有完成，却没有计算注意力、恢复时间和协作资源，直到效率或耐心明显下降。"),
  "self-interface": scene("self-interface", "个人偏好与组织规则不一致时，你一面想保留真实，一面又担心影响结果；若差异没有被拆开说明，容易在沉默适应和突然反弹之间摆动。"),
  "talent-public": scene("talent-public", "公开汇报或展示成果时，你会自然调用最熟练的表达方式；若没有先确认听众和目标，流畅呈现也可能材料很多、主线不清，听众仍不知道下一步。"),
  "talent-hidden": scene("talent-hidden", "安静准备、独立摸索或暂时没有明确指令时，你会回到顺手的处理步骤；它能保证底稿质量，也可能因缺少外部试用而留下交接断点。"),
  "talent-output": scene("talent-output", "需要把复杂研究转成一页方案、清单或报告时，你既要保留关键条件，又要降低接收者的理解成本；信息越多，越需要先确定交付物为谁解决什么问题。"),
  "career-role": scene("career-role", "接到新的角色分配时，职位名称看起来清楚，目标、权限和验收标准却可能仍有空白；若急着开始执行，后期容易出现有责任无授权或多人重复负责。"),
  "career-pressure": scene("career-pressure", "截止期限突然提前时，熟悉的旧方法会自动接管，帮助你快速推进；若同时减少沟通，关键依赖和质量风险可能直到交付前才集中暴露。"),
  "career-environment": scene("career-environment", "选择新团队或比较两份工作时，短期兴奋和单次挫折都容易放大判断；真正需要比较的是任务、授权、反馈、协作与恢复条件能否长期支持发挥。"),
  "wealth-structure": scene("wealth-structure", "做月度预算时，账户余额可能看起来充足，但固定付款、时间承诺和未来责任尚未进入计算；只有把这些放在同一张表里，才看得见真实可用资源。"),
  "wealth-risk": scene("wealth-risk", "面对一个看起来稀缺的新机会时，你可能在兴奋中放大收益，或因不确定而无限收集资料；两种情况都缺少最大损失、证据门槛和小规模试验。"),
  "wealth-boundary": scene("wealth-boundary", "亲友借款或多人共同支出时，情感支持与财务责任容易混在一起；金额、用途、归还方式没有写清，一次善意可能逐渐变成双方都难开口的压力。"),
  "relationship-day-branch": scene("relationship-day-branch", "亲密关系讨论陪伴、承诺或分工时，你可能默认对方应该理解没有说出口的期待；当回应不符合想象，失望便容易被解释成不重视。"),
  "relationship-trigger": scene("relationship-trigger", "一句熟悉的话、迟到或临时变更可能触发强烈反应；如果没有分清事实、自动解释和真正需要，一次具体事件很快会扩大成人格或关系的总判断。"),
  "relationship-repair": scene("relationship-repair", "冲突之后若只追求迅速恢复表面平静，原来的影响、需要和规则仍未更新；同样的问题往往会换一个场景再次出现，让双方越来越难相信道歉。"),
  "family-year": scene("family-year", "家庭再次需要有人组织时，你可能自然接回从小熟悉的调停、执行或照顾角色；它能维持秩序，也可能让一个未被重新协商的旧角色长期固化。"),
  "family-resource": scene("family-resource", "任务已经超出负荷却收到家人帮助时，你可能因不习惯接受而继续说没事，或把一次支持默认为长期安排；双方都需要知道范围、意愿和结束条件。"),
  "family-boundary": scene("family-boundary", "家人把本可自行承担的事项交给你时，立即代办能暂时减少冲突，却会让责任反复回到同一个人；积累不满后突然退出，同样会破坏合作。"),
  "rhythm-climate": scene("rhythm-climate", "换季后仍沿用上一阶段的作息和工作强度时，你可能直到专注与恢复明显下降才调整；季节线索适合提醒观察，不适合解释具体健康问题。"),
  "rhythm-recovery": scene("rhythm-recovery", "连续完成一段密集工作后，兴奋感可能让你马上接下新任务，却忽略判断力和作息仍未恢复；完全停摆也未必比逐级降载更有效。"),
  "rhythm-decision": scene("rhythm-decision", "决定是否继续收集信息时，你可能担心遗漏而迟迟不动，也可能为了摆脱焦虑仓促拍板；关键不是获得全部信息，而是预先定义什么证据已经足够。"),
} satisfies Record<InterpretationId, { scenario: string; action: string }>;

export type ScenarioId = keyof typeof scenarioLibrary;
