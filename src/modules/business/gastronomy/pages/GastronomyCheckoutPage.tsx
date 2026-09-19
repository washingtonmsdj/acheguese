import { useLocation, useNavigate, useParams } from "react-router-dom";

import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { Button } from "@/shared/components/ui/button";
import { useGastronomyDetail } from "../hooks";
import type { GastronomyBusiness } from "../types/gastronomy";
import GastronomyCheckoutSurface from "./GastronomyCheckoutSurface";

export default function GastronomyCheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const params = useParams<{
    state?: string;
    city?: string;
    district?: string;
    slug?: string;
  }>();
  const stateBusiness = (state as { business?: GastronomyBusiness } | null)
    ?.business;
  const detailQuery = useGastronomyDetail(stateBusiness ? undefined : params);

  const business = stateBusiness ?? detailQuery.data ?? null;

  if (!business && detailQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">Carregando checkout...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">
          Checkout inválido. Volte para a loja e reabra o pedido.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate(GastronomyUrlService.getHomeUrl())}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return <GastronomyCheckoutSurface business={business} />;
}
