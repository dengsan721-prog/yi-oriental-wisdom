export const reportSectionIds = ["portrait", "chart", "detail", "fortune", "mirror", "compatibility", "tradition"] as const;

export type ReportSectionId = typeof reportSectionIds[number];

export type YiRoute =
  | { page: "intro" | "birth" | "calculating" | "home" }
  | { page: "report"; section: ReportSectionId };

export type YiRouteDataState = {
  hasProfile: boolean;
  hasResult: boolean;
  hasBirth: boolean;
};

export function parseYiHash(hash: string): YiRoute {
  const path = hash.replace(/^#/, "");
  if (path === "/birth") return { page: "birth" };
  if (path === "/calculating") return { page: "calculating" };
  if (path === "/home") return { page: "home" };

  const report = /^\/report\/([^/]+)$/.exec(path);
  if (report) {
    const section = report[1] as ReportSectionId;
    return { page: "report", section: reportSectionIds.includes(section) ? section : "portrait" };
  }

  return { page: "intro" };
}

export function formatYiHash(route: YiRoute) {
  if (route.page === "report") return `#/report/${route.section}`;
  if (route.page === "intro") return "#/";
  return `#/${route.page}`;
}

export function resolveYiHydratedRoute(requested: YiRoute, hasProfile: boolean): YiRoute {
  if (hasProfile) {
    if (requested.page === "intro" || requested.page === "calculating") return { page: "home" };
    return requested;
  }
  if (requested.page === "report" || requested.page === "calculating") return { page: "birth" };
  if (requested.page === "home") return { page: "intro" };
  return requested;
}

export function guardYiRoute(route: YiRoute, state: YiRouteDataState): YiRoute {
  if ((route.page === "report" || route.page === "calculating") && (!state.hasResult || !state.hasBirth)) {
    return { page: "birth" };
  }
  if (route.page === "home" && !state.hasProfile) return { page: "intro" };
  return route;
}
