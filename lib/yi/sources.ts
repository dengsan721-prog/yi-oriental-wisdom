export type RuleSource = {
  ruleId: string;
  label: string;
  appliesWhen: string;
  sourceType: "library-calculation" | "classical-framework" | "product-heuristic";
  version: string;
  references: readonly string[];
};

export const YI_RULE_SOURCES: Record<string, RuleSource> = {
  "calendar.eight-char.v1": { ruleId: "calendar.eight-char.v1", label: "标准八字历法", appliesWhen: "公历日期与时间有效", sourceType: "library-calculation", version: "lunar-typescript@1.8.6", references: ["EightChar 标准年、月、日、时干支"] },
  "ten-god.hidden-stems.v1": { ruleId: "ten-god.hidden-stems.v1", label: "十神与完整藏干", appliesWhen: "已知日干及目标干支", sourceType: "library-calculation", version: "lunar-typescript@1.8.6", references: ["EightChar 各柱十神与藏干 API"] },
  "relation.gan-zhi.v1": { ruleId: "relation.gan-zhi.v1", label: "干支合冲通行规则表", appliesWhen: "两柱均已知", sourceType: "classical-framework", version: "1.0.1", references: ["天干五合表：甲己、乙庚、丙辛、丁壬、戊癸", "地支六合表：子丑、寅亥、卯戌、辰酉、巳申、午未", "地支六冲表：子午、丑未、寅申、卯酉、辰戌、巳亥"] },
  "climate.season-prompt.v1": { ruleId: "climate.season-prompt.v1", label: "月令调候提示", appliesWhen: "标准八字月支已知", sourceType: "product-heuristic", version: "1.0.0", references: ["寒暖燥湿框架", "仅作生活节律提示，不作调候用神结论"] },
  "structure.support-score.v2": { ruleId: "structure.support-score.v2", label: "五行支持度结构观察", appliesWhen: "至少三柱已知", sourceType: "product-heuristic", version: "2.0.0", references: ["干支主五行计数；月柱双权重", "非古籍格局或喜忌判定"] },
  "domain.mapping.v2": { ruleId: "domain.mapping.v2", label: "生活主题映射", appliesWhen: "命盘结构字段已生成", sourceType: "product-heuristic", version: "2.0.0", references: ["七主题独立选择器", "用于自我观察，不预测具体事件"] },
};
