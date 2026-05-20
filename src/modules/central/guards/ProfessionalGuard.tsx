import { useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { SessionService } from "@/core/session/services/SessionService";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";

/**
 * ProfessionalGuard
 *
 * Guard que valida vinculo profissional.
 * Protege rotas /central/profissional/*
 *
 * Se usuario nao tiver professional_data, mostra empty state com CTA
 * para ativar/cadastrar usando fluxo atual.
 */
export function ProfessionalGuard() {
  const navigate = useNavigate();
  const { user, profiles, isLoading: sessionLoading } = useSessionContext();

  const freshProfilesQuery = useQuery({
    queryKey: ["central", "professional-guard", "profiles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return SessionService.getUserProfiles(user.id);
    },
    enabled: Boolean(user?.id) && !sessionLoading,
    staleTime: 30_000,
  });

  const effectiveProfiles =
    freshProfilesQuery.data && freshProfilesQuery.data.length > 0
      ? freshProfilesQuery.data
      : profiles ?? [];
  const hasProfessionalProfile = effectiveProfiles.some((p) => p.profileType === "professional");

  if (sessionLoading || (user && freshProfilesQuery.isLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando perfil profissional...</p>
        </div>
      </div>
    );
  }

  if (!hasProfessionalProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil profissional nao encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Voce ainda nao ativou seu perfil profissional. Cadastre seus servicos para comecar a receber clientes.
              </p>
            </div>
            <Button onClick={() => navigate(centralRoutes.servicos.create)} className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Cadastrar servicos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}

export default ProfessionalGuard;
