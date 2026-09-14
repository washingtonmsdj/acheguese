import { useLocation } from "react-router-dom";

import { ConsentBannerContent } from "./ConsentBannerContent";

/**
 * Routed-app adapter for the consent banner.
 *
 * The public root imports ConsentBannerContent directly so its deferred overlay
 * chunk does not need BrowserRouter/react-router-dom merely to read pathname.
 */
export function ConsentBanner() {
  const { pathname } = useLocation();
  return <ConsentBannerContent pathname={pathname} />;
}
