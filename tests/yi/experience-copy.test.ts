import { expect, it } from "vitest";
import { getCalculationSteps } from "../../components/yi/YiExperience";

it("shows only calculations the product actually performs", () => {
  expect(getCalculationSteps()).toEqual(["四柱", "五行", "藏干", "十神", "干支", "大运"]);
  expect(getCalculationSteps().join(" ")).not.toMatch(/格局|喜忌/);
});
