import { describe, expect, it } from "vitest";
import { createInitialResultShellState, createResultScrollPositions, getAvailableSections, getResultSections, resultShellReducer, restoreScrollTop } from "../../components/yi/ResultShell";

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

  it("preserves real compatibility state when switching report sections", () => {
    const initial = createInitialResultShellState();
    const withRelationship = resultShellReducer(initial, { type: "set-relationship", relationship: "business" });
    const switched = resultShellReducer(withRelationship, { type: "select-section", section: "portrait" });
    expect(switched.compatibility.relationship).toBe("business");
    expect(switched.compatibility).toBe(withRelationship.compatibility);
  });

  it("opens only implemented sections and keeps reusable scroll positions", () => {
    expect(getAvailableSections()).toEqual(["portrait", "chart", "detail"]);
    const positions = createResultScrollPositions();
    expect(positions).toBeInstanceOf(Map);
    positions.set("detail", 320);
    expect(positions.get("detail")).toBe(320);
    expect(restoreScrollTop(positions, "detail")).toBe(320);
    expect(restoreScrollTop(positions, "portrait")).toBe(0);
  });
});
