import { BrowserRouter, useLocation } from "react-router-dom";

import FullAppRuntimeShell from "@/app/components/FullAppRuntimeShell";

function RoutedAppRuntimeContent() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shouldCheckAuthRedirect =
    location.hash.length > 1 ||
    searchParams.has("code") ||
    searchParams.get("mode") === "recovery";

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
