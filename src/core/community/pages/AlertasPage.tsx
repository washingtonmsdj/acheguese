/**
 * AlertasPage â€” PÃ¡gina dedicada aos alertas comunitÃ¡rios de seguranÃ§a
 * Usa o mÃ³dulo community-alerts (AlertFeedSection) como Ãºnica fonte de alertas.
 *
 * MIGRAÃ‡ÃƒO: usa locationContextStore (fundaÃ§Ã£o geogrÃ¡fica) em vez de profile.city.
 */

import React from "react";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AlertFeedSection } from "@/core/community-alerts";
import { communityLocationService } from "@/core/community/services/CommunityLocationService";
import { useLocationContext } from "@/core/location";

export default function AlertasPage() {
  // Usa a fundaÃ§Ã£o geogrÃ¡fica â€” nÃ£o depende de profile.city
  const { activeLocation } = useLocationContext();
  const locationName = communityLocationService.getActiveLocationName();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#12181B]" role="main">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          {activeLocation ? (
            <AlertFeedSection
              city={activeLocation.name}
              neighborhood={
                activeLocation.type === "district"
                  ? activeLocation.name
                  : undefined
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Selecione uma localizaÃ§Ã£o para ver os alertas da sua regiÃ£o.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

