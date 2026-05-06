import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { Car, Bike, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface DriverGuardProps {
  service: "motorista" | "motoboy";
}

/**
 * DriverGuard
 *
 * Guard que valida driver_data e o modo correto.
 * Protege rotas /central/motorista e /central/motoboy
 *
 * Validação de serviço baseada no modelo atual:
 * - Motorista: can_do_rides !== false (true ou null)
 * - Motoboy: can_do_delivery === true
 *
 * Se não tiver perfil de driver ou modo incorreto, mostra empty state com CTA
 * para ativar usando fluxo atual (/create-driver).
 */
export function DriverGuard({ service }: DriverGuardProps) {
  const navigate = useNavigate();
  const { driverData, isRegistered, isLoading } = useDriverProfileIdentity({
    queryScope: "central-driver-guard",
  });

  const serviceLabel = service === "motorista" ? "Motorista" : "Motoboy";
  const serviceIcon = service === "motorista" ? Car : Bike;

  useEffect(() => {
    // Redirecionamento não é necessário aqui, mostraremos empty state
  }, []);

  // Mostrar loading enquanto verifica
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando perfil de {serviceLabel.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  // Se não tiver perfil de driver, mostrar empty state
  if (!isRegistered || !driverData) {
    const IconComponent = service === "motorista" ? Car : Bike;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <IconComponent className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil de {serviceLabel} não encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Você ainda não ativou seu perfil de {serviceLabel.toLowerCase()}. Cadastre-se para começar a receber solicitações.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/create-driver?type=${service}`)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Cadastrar como {serviceLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validação do modo correto
  // Motorista: can_do_rides !== false (true ou null)
  // Motoboy: can_do_delivery === true
  const canDoRides = driverData.can_do_rides !== false;
  const canDoDelivery = driverData.can_do_delivery === true;

  const hasCorrectService = service === "motorista" ? canDoRides : canDoDelivery;

  if (!hasCorrectService) {
    const wrongService = service === "motorista" ? "motoboy" : "motorista";
    const IconComponent = service === "motorista" ? Car : Bike;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
              <IconComponent className="h-8 w-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil não habilitado para {serviceLabel}</h3>
              <p className="text-sm text-muted-foreground">
                Seu perfil atual está configurado como {wrongService}. Para acessar esta área, você precisa habilitar o modo de {serviceLabel.toLowerCase()}.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/create-driver?type=${service}`)}
              variant="outline"
              className="gap-2"
            >
              Habilitar modo {serviceLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}

// Export default para lazy import
export default DriverGuard;
