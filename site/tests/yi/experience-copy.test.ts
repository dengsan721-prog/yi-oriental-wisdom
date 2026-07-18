import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { getCalculationSteps } from "../../components/yi/YiExperience";

it("shows only calculations the product actually performs", () => {
  expect(getCalculationSteps()).toEqual(["四柱", "五行", "藏干", "十神", "干支", "大运"]);
  expect(getCalculationSteps().join(" ")).not.toMatch(/格局|喜忌/);
});

it("keeps the complete reading hierarchy in the production bundle", async () => {
  const source = readFileSync(resolve("components/yi/DetailSection.tsx"), "utf8");
  expect(source).toContain("优势版本");
  expect(source).toContain("失控版本");
  expect(source).toContain("此刻可做");
  expect(source).toContain("长期练习");
  expect(source).toContain("为什么这样判断");
});
