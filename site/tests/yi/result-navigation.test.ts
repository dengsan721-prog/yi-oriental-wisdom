import { describe, expect, it } from "vitest";
import { createResultScrollPositions, getAvailableSections, getResultSections } from "../../components/yi/ResultShell";

describe("result navigation", () => {
  it("keeps the seven report sections in a stable reading order", () => {
    expect(getResultSections()).toEqual([
      ["portrait", "画像"],
      ["chart", "命盘"],
      ["detail", "详批"],
      ["fortune", "大运"],
      ["mirror", "镜像"],
      ["compatibility", "合盘"],
      ["tradition", "传统"],
    ]);
  });

  it("opens only implemented sections and keeps reusable scroll positions", () => {
    expect(getAvailableSections()).toEqual(["portrait", "chart", "detail"]);
    const positions = createResultScrollPositions();
    expect(positions).toBeInstanceOf(Map);
    positions.set("detail", 320);
    expect(positions.get("detail")).toBe(320);
  });
});
