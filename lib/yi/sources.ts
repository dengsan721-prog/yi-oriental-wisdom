export const YI_SOURCES = {
  balance: { tradition: "子平法·旺衰与月令", references: ["《子平真诠》月令取用", "《滴天髓》旺衰中和"] },
  tenGods: { tradition: "子平法·十神", references: ["《三命通会》十神关系", "五行生克与阴阳同异"] },
  climate: { tradition: "子平法·调候", references: ["《穷通宝鉴》月令调候", "寒暖燥湿的中和原则"] },
  relations: { tradition: "子平法·干支作用", references: ["天干五合", "地支六合与六冲"] },
} as const;

export type YiSourceKey = keyof typeof YI_SOURCES;
