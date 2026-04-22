/**
 * AlertasPage — Página dedicada aos alertas comunitários de segurança
 * Usa o módulo community-alerts (AlertFeedSection) como única fonte de alertas.
 *
 * MIGRAÇÃO: usa locationContextStore (fundação geográfica) em vez de profile.city.
 */

import React from "react";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AlertFeedSection } from "@/modules/community/alerts";
import { communityLocationService } from "@/core/community/services/CommunityLocationService";
import { useLocationContext } from "@/core/location";

export default function AlertasPage() {
  // Usa a fundação geográfica — não depende de profile.city
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
              Selecione uma localização para ver os alertas da sua região.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}


