"use client";

import { useCallback, useEffect, useState } from "react";
import { formatYiHash, parseYiHash, type YiRoute } from "../../lib/yi/hash-router";

export function useYiRoute() {
  const [route, setRoute] = useState<YiRoute>({ page: "intro" });

  useEffect(() => {
    const sync = () => setRoute(parseYiHash(window.location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const push = useCallback((next: YiRoute) => {
    window.location.hash = formatYiHash(next);
  }, []);

  const replace = useCallback((next: YiRoute) => {
    window.history.replaceState(null, "", formatYiHash(next));
    setRoute(next);
  }, []);

  return { route, push, replace };
}
