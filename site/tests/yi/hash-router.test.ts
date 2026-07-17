import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatYiHash, guardYiRoute, parseYiHash, resolveYiHydratedRoute } from "../../lib/yi/hash-router";
import { useYiRoute } from "../../components/yi/useYiRoute";

function RouteProbe() {
  const { route } = useYiRoute();
  return createElement("span", null, formatYiHash(route));
}

describe("yi hash router", () => {
  it.each([
    ["", { page: "intro" }],
    ["#/", { page: "intro" }],
    ["#/birth", { page: "birth" }],
    ["#/calculating", { page: "calculating" }],
    ["#/report/chart", { page: "report", section: "chart" }],
    ["#/report/not-real", { page: "report", section: "portrait" }],
    ["#/home", { page: "home" }],
  ])("parses %s", (hash, expected) => expect(parseYiHash(hash)).toEqual(expected));

  it("formats report routes", () => {
    expect(formatYiHash({ page: "report", section: "fortune" })).toBe("#/report/fortune");
  });

  it("starts the route hook on intro during server rendering", () => {
    expect(renderToStaticMarkup(createElement(RouteProbe))).toContain("#/");
  });

  it.each([
    [{ page: "report", section: "chart" } as const, false, { page: "birth" }],
    [{ page: "calculating" } as const, false, { page: "birth" }],
    [{ page: "home" } as const, false, { page: "intro" }],
    [{ page: "birth" } as const, false, { page: "birth" }],
    [{ page: "intro" } as const, true, { page: "home" }],
    [{ page: "report", section: "fortune" } as const, true, { page: "report", section: "fortune" }],
    [{ page: "birth" } as const, true, { page: "birth" }],
  ])("resolves the one-time restored route %o with saved profile=%s", (requested, hasProfile, expected) => {
    expect(resolveYiHydratedRoute(requested, hasProfile)).toEqual(expected);
  });

  it("guards the same report route again when hydrated data is cleared", () => {
    const report = { page: "report", section: "chart" } as const;
    const ready = { hasProfile: true, hasResult: true, hasBirth: true };
    const cleared = { hasProfile: false, hasResult: false, hasBirth: false };

    expect(guardYiRoute(report, ready)).toBe(report);
    const afterClear = guardYiRoute(report, cleared);
    expect(afterClear).toEqual({ page: "birth" });
    expect(guardYiRoute(afterClear, cleared)).toBe(afterClear);
    expect(guardYiRoute({ page: "home" }, cleared)).toEqual({ page: "intro" });
  });

  it.each([
    ["#/report/detail", { hasProfile: false, hasResult: false, hasBirth: false }, { page: "birth" }],
    ["#/calculating", { hasProfile: false, hasResult: false, hasBirth: false }, { page: "birth" }],
    ["#/home", { hasProfile: false, hasResult: false, hasBirth: false }, { page: "intro" }],
    ["#/report/detail", { hasProfile: false, hasResult: true, hasBirth: false }, { page: "birth" }],
    ["#/report/detail", { hasProfile: false, hasResult: true, hasBirth: true }, { page: "report", section: "detail" }],
    ["#/home", { hasProfile: true, hasResult: true, hasBirth: true }, { page: "home" }],
    ["#/birth", { hasProfile: true, hasResult: true, hasBirth: true }, { page: "birth" }],
  ])("guards a hydrated manual hash change at %s", (hash, state, expected) => {
    const route = parseYiHash(hash);
    const guarded = guardYiRoute(route, state);
    expect(guarded).toEqual(expected);
    if (formatYiHash(route) === formatYiHash(expected)) expect(guarded).toBe(route);
  });
});
