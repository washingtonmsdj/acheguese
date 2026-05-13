import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CreditCard, Loader2 } from "lucide-react";

import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PerfilHubLayout } from "@/modules/profile/pages/PerfilHubLayout";
import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { buildProfileSectionItems, getProfileSectionPath } from "@/modules/profile/utils/profileNavigation";
import type { ProfileSectionId } from "@/modules/profile/sections";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

function formatPlanLabel(value?: string | null): string {
  if (!value) return "Free";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PerfilPlanosPage() {
  const navigate = useNavigate();
  const data = useProfileHub();

  useEffect(() => {
    if (!data.user) {
      navigate(data.appUrls.auth.login);
    }
  }, [data.appUrls.auth.login, data.user, navigate]);

  const personalProfile = data.allProfiles.find((p) => p.profile_type === "personal") || data.profile;
  const activeSection: ProfileSectionId = "planos";

  const sectionItems = buildProfileSectionItems({
    businessModules: data.businessModules,
    operations: data.operations,
    notifications: data.notifications,
  });

  const handleSectionChange = (section: ProfileSectionId) => {
    navigate(getProfileSectionPath(section), { replace: true });
  };

  return (
    <PerfilHubLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      sectionItems={sectionItems}
      personalProfile={personalProfile}
      profile={data.profile}
      allProfiles={data.allProfiles}
      isVerified={data.isVerified}
      canOpenPublicProfile={data.canOpenPublicProfile}
      handle={data.handle}
      territoryLabel={data.territoryLabel}
      userEmail={data.user?.email || ""}
      accountSnapshot={
        data.account || {
          accountState: "inactive" as const,
          isBlocked: false,
          isSuspended: false,
          verificationStatus: data.verificationStatus,
          verificationRejectionReason: data.verificationRejectionReason,
        }
      }
      identity={data.identity}
      context={data.context}
      notifications={data.notifications}
      reputation={data.identity?.reputation || data.context?.reputation}
      onAvatarChange={data.handleAvatarChange}
      pageTitle="Perfil | Planos e cobranças"
      pageDescription="Central de planos, assinaturas e cobranças por entidade."
    >
      <div className="space-y-5">
        <Breadcrumbs />

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Planos e cobranças
              </CardTitle>
              <CardDescription>
                Central de assinaturas por entidade. Cada empresa mantém sua própria assinatura.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={() => navigate("/central/empresas")}>
                <ArrowLeft className="h-4 w-4" />
                Voltar para empresas
              </Button>
              <Button onClick={() => navigate(data.appUrls.business.create)}>
                Criar empresa
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                Entidades
              </CardTitle>
              <CardDescription>Assinaturas separadas por empresa, mobilidade e classificados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Empresas ativas</span>
                <Badge variant="secondary">{data.businessModules.length}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Usuário / perfil</span>
                <Badge variant="outline">{formatPlanLabel(data.identity?.plan?.type || data.context?.plan?.type)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.loading ? (
          <div className="flex min-h-[30vh] items-center justify-center rounded-3xl border border-border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando cobrancas...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Empresas</CardTitle>
                <CardDescription>Assinaturas empresariais ativas por empresa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.businessModules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma empresa vinculada.</p>
                ) : (
                  data.businessModules.map((item) => (
                    <div
                      key={item.businessId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="secondary">{formatPlanLabel(item.subscription.planTier)}</Badge>
                        <Badge variant="outline">{item.subscription.status}</Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(businessManagementRoutes.planos(item.businessId))}>
                        Ver planos da empresa
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Perfil motorista/motoboy possui ciclo operacional separado da assinatura empresarial.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classificados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Anuncios e impulsionamentos seguem pagamentos avulsos por anuncio/pacote.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PerfilHubLayout>
  );
}
