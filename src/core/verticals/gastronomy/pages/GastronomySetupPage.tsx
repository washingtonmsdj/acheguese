import { lazy, Suspense } from "react";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";

interface GastronomySetupPageProps {
  businessId: string;
}

const ModuleGastronomySetupPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomySetupPage"));

export default function GastronomySetupPage(props: GastronomySetupPageProps) {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ModuleGastronomySetupPage {...props} />
    </Suspense>
  );
}

