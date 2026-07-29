import { useCallback, useEffect, useState } from "react";

export function useBrowserPath(): [string, (path: string, replace?: boolean) => void] {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  const navigate = useCallback((path: string, replace = false) => {
    window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    setPathname(window.location.pathname);
  }, []);

  return [pathname, navigate];
}
