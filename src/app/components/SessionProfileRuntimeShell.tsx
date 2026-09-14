import { Suspense } from "react";

import { AppRoutes } from "@/app/routes/AppRoutes";
import { SessionProvider } from "@/core/session/providers/SessionProvider";
import {
  MultiProfileProvider,
  ModuleContextSync,
} from "@/core/profiles/contexts/multi-profile-runtime-context";
import { TerritoryModeInitializer } from "@/core/location/components/TerritoryModeInitializer";

/**
 * Runtime autenticado/contextual.
 *
 * A entrada publica `/` nao precisa inicializar Supabase Auth, perfis ou modo
 * territorial. Este shell so e carregado quando a navegacao sai da raiz
 * community-first, preservando o comportamento completo das demais rotas.
 */
export default function SessionProfileRuntimeShell() {
  return (
    <SessionProvider>
      <MultiProfileProvider>
        <TerritoryModeInitializer />
        <ModuleContextSync />
        <Suspense fallback={null}>
          <AppRoutes />
        </Suspense>
      </MultiProfileProvider>
    </SessionProvider>
  );
}
