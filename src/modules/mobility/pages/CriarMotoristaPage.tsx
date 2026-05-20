import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Car, Bike } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { DriverRegistrationForm } from "@/modules/mobility/components/driver/DriverRegistrationForm";
import { useDriverCreateMultiProfile } from "@/modules/mobility/hooks/useDriverCreateMultiProfile";

type DriverType = "motorista" | "motoboy";

export default function CriarMotoristaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobilityUrls = useMobilityUrls();
  const { refetch, setModuleContext, effectiveProfile } = useMultiProfileContext();
  const { profiles } = useSessionContext();

  const personalProfile = profiles.find((profile) => profile.profileType === "personal");

  // Detecta o tipo operacional com base no parametro da URL.
  const driverType: DriverType = useMemo(() => {
    const typeParam = searchParams.get("type");
    return typeParam === "motoboy" ? "motoboy" : "motorista";
  }, [searchParams]);

  // ✅ Configuração baseada no tipo
  const config = useMemo(() => {
    if (driverType === "motoboy") {
      return {
        title: "Cadastro de Motoboy",
        subtitle: "Cadastrando motoboy como",
        icon: Bike,
        iconColor: "text-orange-500",
        badgeText: "Modo Motoboy",
        badgeColor: "bg-orange-500/15 text-orange-600 border-orange-200",
        bio: (city?: string) => city ? `Motoboy em ${city}` : "Motoboy cadastrado",
        capabilities: { can_do_delivery: true, can_do_rides: false },
        defaultVehicleType: "motorcycle" as const,
      };
    }
    
    return {
      title: "Cadastro de Motorista",
      subtitle: "Cadastrando motorista como",
      icon: Car,
      iconColor: "text-primary",
      badgeText: "Modo Motorista",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      bio: (city?: string) => city ? `Motorista em ${city}` : "Motorista cadastrado",
      capabilities: { can_do_delivery: false, can_do_rides: true },
      defaultVehicleType: "car" as const,
    };
  }, [driverType]);

  useEffect(() => {
    setModuleContext("driver");
    return () => setModuleContext(null);
  }, [setModuleContext]);

  const { createDriver, isLoading } = useDriverCreateMultiProfile({
    onSuccess: async (result) => {
      await refetch();
      // ✅ Driver não tem página pública
      // Redirecionar para dashboard de mobilidade
      toast.success(`Cadastro realizado com sucesso! Seu perfil de ${driverType} está ativo.`);
      navigate(mobilityUrls.home);
    },
  });

  const handleSubmit = (input: Parameters<typeof createDriver>[0]) => {
    // ✅ Adicionar capacidades baseadas no tipo
    const enhancedInput = {
      ...input,
      bio: config.bio(input.city),
      capabilities: config.capabilities,
    };
    createDriver(enhancedInput);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(mobilityUrls.home)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-sm font-semibold">{config.title}</h1>
            <Badge variant="outline" className={config.badgeColor}>
              {config.badgeText}
            </Badge>
          </div>
          <div className="w-6" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {effectiveProfile ? (
          <ActiveProfileBadge
            profile={effectiveProfile}
            action={config.subtitle}
            className="mb-4"
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <config.icon className={`h-5 w-5 ${config.iconColor}`} />
              {config.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DriverRegistrationForm
              defaultValues={{
                name: personalProfile?.displayName || personalProfile?.name,
                city: personalProfile?.city,
                avatarUrl: personalProfile?.avatarUrl,
                state: personalProfile?.state,
                vehicleType: config.defaultVehicleType,
              }}
              loading={isLoading}
              submitLabel={isLoading ? "Criando perfil..." : "Enviar cadastro"}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


