import { lazy, Suspense } from "react";

import { AppBootstrapLoader } from "@/app/components/AppBootstrapLoader";
import { BootstrapErrorBoundary } from "@/app/components/BootstrapErrorBoundary";
import "@/styles/accessibility.css";

const AppRuntime = lazy(() =>
  import("@/app/components/AppRuntime").then((module) => ({
    default: module.AppRuntime,
  })),
);

const App = () => (
  <BootstrapErrorBoundary>
    <Suspense fallback={<AppBootstrapLoader />}>
      <AppRuntime />
    </Suspense>
  </BootstrapErrorBoundary>
);

export default App;
