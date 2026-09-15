import { BrowserRouter, useLocation } from "react-router-dom";

import FullAppRuntimeShell from "@/app/components/FullAppRuntimeShell";
import { hasAuthCallbackMarker } from "@/core/auth/utils/authCallback";

function RoutedAppRuntimeContent() {
  const location = useLocation();
  const shouldCheckAuthRedirect = hasAuthCallbackMarker(
    location.search,
    location.hash,
  );

  return (
    <FullAppRuntimeShell shouldCheckAuthRedirect={shouldCheckAuthRedirect} />
  );
}

/**
 * Router/runtime completo carregado somente fora da raiz pública enxuta.
 */
export default function RoutedAppRuntime() {
  return (
    <BrowserRouter>
      <RoutedAppRuntimeContent />
    </BrowserRouter>
  );
}
