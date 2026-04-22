import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ServiceCardEnhanced } from "./ServiceCardEnhanced";
import { useServicesAd } from "@/modules/professionals/services/hooks/useServicesAd";
import { SponsoredAdCard } from "@/shared/services/promotions";
import type { ProfessionalItem } from "@/modules/professionals/services/hooks/useServicos";

interface ServicesListProps {
  professionals: ProfessionalItem[];
  initialLoading: boolean;
  loading: boolean;
  sentinelRef:
    | React.Ref<HTMLDivElement>
    | ((node: HTMLDivElement | null) => void);
  onProfessionalClick: (professional: ProfessionalItem) => void;
  onNavigateToRegister: () => void;
}

const ServicesList = React.forwardRef<HTMLDivElement, ServicesListProps>(
  (
    {
      professionals,
      initialLoading,
      loading,
      sentinelRef,
      onProfessionalClick,
      onNavigateToRegister,
    },
    ref,
  ) => {
    const { ad } = useServicesAd();

    // Slot de anúncio após o 2º item (índice 1)
    const AD_SLOT_INDEX = 1;

    if (initialLoading) {
      return (
        <div ref={ref} className="flex flex-col gap-3 px-4 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (professionals.length === 0) {
      return (
        <div ref={ref} className="text-center py-8 px-4">
          <p className="text-sm text-muted-foreground mb-3">
            Nenhum profissional encontrado.
          </p>
          <Button variant="outline" onClick={onNavigateToRegister}>
            Cadastrar um serviço
          </Button>
        </div>
      );
    }

    return (
      <div ref={ref} className="flex flex-col gap-3 px-4 py-2">
        {professionals.map((professional, index) => (
          <React.Fragment key={professional.id}>
            <ServiceCardEnhanced
              professional={professional}
              index={index}
              onProfessionalClick={onProfessionalClick}
            />
            {/* Slot de anúncio patrocinado após o 2º item */}
            {index === AD_SLOT_INDEX && ad && (
              <SponsoredAdCard campaign={ad} />
            )}
          </React.Fragment>
        ))}

        {loading && !initialLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    );
  },
);
ServicesList.displayName = "ServicesList";

export { ServicesList };

