import { describe, expect, it } from "vitest";
import { createInitialResultShellState, createResultScrollPositions, getAvailableSections, getResultSections, resultShellReducer, restoreScrollTop, selectResultSection } from "../../components/yi/ResultShell";

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

  it("exposes all seven production sections", () => {
    expect(getAvailableSections(true)).toHaveLength(7);
  });

  it("keeps only compatibility state in the internal reducer", () => {
    const initial = createInitialResultShellState();
    const withRelationship = resultShellReducer(initial, { type: "set-relationship", relationship: "business" });
    expect(initial).toEqual({ compatibility: { relationship: "partner", secondBirth: null } });
    expect(withRelationship.compatibility.relationship).toBe("business");
  });

  it("preserves the submitted second birth object in compatibility state", () => {
    const birth = { name: "乙", date: "1992-11-03", time: "18:20", location: "上海", gender: "female", timeConfidence: "exact", birthDate: { mode: "solar", year: 1992, month: 11, day: 3, isLeapMonth: false }, timeMode: "exact" } as const;
    const submitted = resultShellReducer(createInitialResultShellState(), { type: "set-second-birth", birth });
    expect(submitted.compatibility.secondBirth).toBe(birth);
  });

  it("delegates section changes while keeping reusable scroll positions", () => {
    expect(getAvailableSections()).toEqual(["portrait", "chart", "detail"]);
    const positions = createResultScrollPositions();
    const selected: string[] = [];
    expect(positions).toBeInstanceOf(Map);
    selectResultSection(positions, "detail", "mirror", 320, section => selected.push(section));
    expect(positions.get("detail")).toBe(320);
    expect(selected).toEqual(["mirror"]);
    expect(restoreScrollTop(positions, "detail")).toBe(320);
    expect(restoreScrollTop(positions, "portrait")).toBe(0);
  });
});
