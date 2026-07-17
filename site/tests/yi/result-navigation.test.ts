import { describe, expect, it } from "vitest";
import { getResultSections } from "../../components/yi/ResultShell";

describe("result navigation", () => {
  it("keeps the seven report sections in a stable reading order", () => {
    expect(getResultSections()).toEqual([
      ["portrait", "画像"],
      ["chart", "命盘"],
      ["detail", "详批"],
      ["fortune", "流年"],
      ["mirror", "心镜"],
      ["compatibility", "合盘"],
      ["tradition", "传统"],
    ]);
  });
});
