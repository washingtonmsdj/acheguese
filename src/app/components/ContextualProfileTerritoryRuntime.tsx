import type { ReactNode } from "react";

import {
  MultiProfileProvider,
  ModuleContextSync,
} from "@/core/profiles/contexts/multi-profile-runtime-context";
import { TerritoryModeInitializer } from "@/core/location/components/TerritoryModeInitializer";

type ContextualProfileTerritoryRuntimeProps = {
  children: ReactNode;
};

/**
 * Heavy contextual runtime for signed-in/application routes.
 *
 * This module is intentionally loaded through React.lazy by
 * SessionProfileRuntimeShell. Public authentication routes need SessionProvider
 * but must not download profile, residence and territory owners before login.
 */
export default function ContextualProfileTerritoryRuntime({
  children,
}: ContextualProfileTerritoryRuntimeProps) {
  return (
    <MultiProfileProvider>
      <TerritoryModeInitializer />
      <ModuleContextSync />
      {children}
    </MultiProfileProvider>
  );
}
