import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatYiHash, parseYiHash, resolveYiHydratedRoute } from "../../lib/yi/hash-router";
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

  it("keeps the server and hydration first frame on the intro route", () => {
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
  ])("resolves hydration route %o with saved profile=%s", (requested, hasProfile, expected) => {
    expect(resolveYiHydratedRoute(requested, hasProfile)).toEqual(expected);
  });
});
