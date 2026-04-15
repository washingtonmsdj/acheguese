/**
 * DriverOfferCard - Componente para motorista visualizar e aceitar ofertas
 */

import { Clock, DollarSign, MapPin } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useSessionContext } from "@/core/session";
import { MOBILITY_QUERY_KEYS } from "@/modules/mobility/constants";
import { useDriverOffers } from "@/modules/mobility/hooks/useDriverOffers";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";

export function DriverOfferCard() {
  const { user } = useSessionContext();
  const { toast } = useToast();
  const { driverProfileId } = useDriverProfileIdentity({
    queryKey: MOBILITY_QUERY_KEYS.driverProfile(user?.id ?? ""),
  });

  const { currentOffer, isAccepting, error, acceptOffer, rejectOffer } =
    useDriverOffers({
      driverProfileId: driverProfileId ?? undefined,
      enabled: !!driverProfileId,
      onNewOffer: (offer) => {
        toast({
          title: "Nova corrida disponível",
          description: `De ${offer.pickupAddress} para ${offer.dropoffAddress}`,
        });
      },
    });

  if (!currentOffer) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Aguardando ofertas de corrida...
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAccept = async () => {
    const result = await acceptOffer(currentOffer.rideId);

    if (result.success) {
      toast({
        title: "Corrida aceita",
        description: "Dirija-se ao local de embarque",
      });
      return;
    }

    toast({
      title: "Erro ao aceitar corrida",
      description: result.error || "Tente novamente",
      variant: "destructive",
    });
  };

  const handleReject = () => {
    rejectOffer(currentOffer.rideId);
    toast({
      title: "Oferta recusada",
      description: "Aguardando próxima corrida",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nova Corrida Disponível</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Origem</p>
              <p className="text-sm text-muted-foreground">{currentOffer.pickupAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium">Destino</p>
              <p className="text-sm text-muted-foreground">{currentOffer.dropoffAddress}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Valor sugerido</p>
              <p className="text-lg font-bold">R$ {currentOffer.suggestedPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <p className="text-sm text-muted-foreground">Expira em 30 segundos</p>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex gap-2">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1"
            disabled={isAccepting}
          >
            Recusar
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1"
            disabled={isAccepting}
          >
            {isAccepting ? "Aceitando..." : "Aceitar Corrida"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
