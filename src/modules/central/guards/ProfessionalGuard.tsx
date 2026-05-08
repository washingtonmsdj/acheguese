import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { SessionService } from "@/core/session/services/SessionService";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

/**
 * ProfessionalGuard
 *
 * Guard que valida vínculo profissional.
 * Protege rotas /central/profissional/*
 *
 * Se usuário não tiver professional_data, mostra empty state com CTA
 * para ativar/cadastrar usando fluxo atual (/services/cadastrar).
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

  useEffect(() => {
    // Redirecionamento não é necessário aqui, mostraremos empty state
  }, []);

  // Mostrar loading enquanto verifica
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

  // Se não tiver perfil profissional, mostrar empty state
  if (!hasProfessionalProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Perfil profissional não encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Você ainda não ativou seu perfil profissional. Cadastre seus serviços para começar a receber clientes.
              </p>
            </div>
            <Button
              onClick={() => navigate("/services/cadastrar")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Cadastrar serviços
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}

// Export default para lazy import
export default ProfessionalGuard;
