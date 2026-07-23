import type { ElementName, FourPillarsResult } from "./types";

export type YiThemeElement = ElementName | "neutral";

const elements = new Set<ElementName>(["木", "火", "土", "金", "水"]);

export function deriveYiThemeElement(
  chart: FourPillarsResult | null | undefined,
): YiThemeElement {
  if (!chart) return "neutral";
  if (chart.ambiguousPillars.includes("day")) return "neutral";
  if (
    chart.professional.ambiguousFields.includes("dayMaster") ||
    chart.professional.ambiguousFields.includes("dayPillar")
  ) return "neutral";
  const element = chart.professional.dayMaster.element;
  return elements.has(element) ? element : "neutral";
}
