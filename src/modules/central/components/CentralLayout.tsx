import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ResponsiveWorkspaceShell } from "@/core/navigation/ResponsiveWorkspaceShell";
import { CentralNavigation } from "@/modules/central/components/CentralNavigation";
import { CentralHeader } from "@/modules/central/components/CentralHeader";

/**
 * CentralLayout
 *
 * Layout principal da Central.
 */
export function CentralLayout() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ResponsiveWorkspaceShell
        navigation={<CentralNavigation />}
        header={<CentralHeader />}
        mainClassName="p-4 md:p-6 pb-20 md:pb-6"
      >
        <Outlet />
      </ResponsiveWorkspaceShell>
    </>
  );
}
