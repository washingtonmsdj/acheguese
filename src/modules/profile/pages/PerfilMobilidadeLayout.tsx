import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bike, Car, Clock3, ShieldAlert, Sparkles } from "lucide-react";

import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { PerfilHubLayout } from "@/modules/profile/pages/PerfilHubLayout";
import { buildProfileSectionItems, getProfileSectionPath } from "@/modules/profile/utils/profileNavigation";
import {
  buildProfileMobilityServiceNavItems,
  getProfileMobilityServiceContext,
  getProfileMobilityServicePath,
  profileMobilityRoutes,
} from "@/modules/profile/utils/profileMobilityNavigation";
import { getMobilityServiceStatus } from "@/modules/profile/utils/mobilityServiceStatus";
import type { ProfileSectionId } from "@/modules/profile/config/profile-sections.config";

function formatDateTime(value?: string | null): string {
  if (!value) return "Nao informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Nao informado";
  return parsed.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function PerfilMobilidadeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const profileHub = useProfileHub();
  const { driverData, driverProfileId, isRegistered, isLoading } = useDriverProfileIdentity({
    queryScope: "perfil-mobilidade-shell",
  });

  const context = getProfileMobilityServiceContext(location.pathname);
  const isOnline = driverData?.is_online === true;

  const motoristaStatus = getMobilityServiceStatus({
    driverProfileId,
    driverData,
    service: "motorista",
  });
  const motoboyStatus = getMobilityServiceStatus({
    driverProfileId,
    driverData,
    service: "motoboy",
  });

  const profileSectionItems = useMemo(
    () =>
      buildProfileSectionItems({
        businessModules: profileHub.businessModules,
        operations: profileHub.operations,
        notifications: profileHub.notifications,
      }),
    [profileHub.businessModules, profileHub.notifications, profileHub.operations],
  );

  const serviceNavItems = useMemo(() => {
    if (context.service === "hub") return [];

    return buildProfileMobilityServiceNavItems(context.service, {
      hasProfile: isRegistered,
      isOnline,
    });
  }, [context.service, isOnline, isRegistered]);

  const handleSectionChange = (section: ProfileSectionId) => {
    navigate(getProfileSectionPath(section), { replace: true });
  };

  if (profileHub.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando area de perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <PerfilHubLayout
      activeSection="mobilidade"
      onSectionChange={handleSectionChange}
      sectionItems={profileSectionItems}
      personalProfile={profileHub.personalProfile}
      profile={profileHub.profile}
      allProfiles={profileHub.allProfiles}
      isVerified={profileHub.isVerified}
      canOpenPublicProfile={profileHub.canOpenPublicProfile}
      handle={profileHub.handle}
      territoryLabel={profileHub.territoryLabel}
      userEmail={profileHub.user?.email || ""}
      accountSnapshot={
        profileHub.account || {
          accountState: "inactive" as const,
          isBlocked: false,
          isSuspended: false,
          verificationStatus: profileHub.verificationStatus,
          verificationRejectionReason: profileHub.verificationRejectionReason,
        }
      }
      identity={profileHub.identity}
      context={profileHub.context}
      notifications={profileHub.notifications}
      reputation={profileHub.identity?.reputation || profileHub.context?.reputation}
      onAvatarChange={profileHub.handleAvatarChange}
      pageTitle="Perfil | Mobilidade"
      pageDescription="Hub de mobilidade com servicos separados de Motorista e Motoboy."
    >
      <div className="space-y-4">
        <Breadcrumbs />

        <Card className="border-border bg-gradient-to-br from-primary/10 via-card to-accent/10">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  Mobilidade
                </CardTitle>
                <CardDescription className="max-w-2xl">
                  Secao geral de mobilidade com fluxos separados para corridas (Motorista) e entregas (Motoboy).
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <Car className="h-3 w-3" />
                  Motorista: {motoristaStatus}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Bike className="h-3 w-3" />
                  Motoboy: {motoboyStatus}
                </Badge>
                <Badge variant={isOnline ? "default" : "secondary"} className="gap-1">
                  <Clock3 className="h-3 w-3" />
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-wrap items-center gap-2">
            <Button className="gap-2" onClick={() => navigate(getProfileMobilityServicePath("motorista", "home"))}>
              <Car className="h-4 w-4" />
              Area Motorista
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "home"))}>
              <Bike className="h-4 w-4" />
              Area Motoboy
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              {isLoading
                ? "Carregando dados operacionais..."
                : `Ultima atualizacao: ${formatDateTime(driverData?.updated_at ?? driverData?.last_location_update ?? null)}`}
            </div>
          </CardContent>
        </Card>

        {context.service === "hub" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-4 w-4 text-primary" />
                  Motorista
                </CardTitle>
                <CardDescription>
                  Gerenciar corridas e transporte de passageiros com origem/destino e historico de corridas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline">Status: {motoristaStatus}</Badge>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => navigate(getProfileMobilityServicePath("motorista", "home"))}>
                    Abrir Motorista
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(getProfileMobilityServicePath("motorista", "cadastro"))}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bike className="h-4 w-4 text-primary" />
                  Motoboy
                </CardTitle>
                <CardDescription>
                  Gerenciar entregas, retirada/destino, pedidos de empresas e comprovacao de entrega.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline">Status: {motoboyStatus}</Badge>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "home"))}>
                    Abrir Motoboy
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(getProfileMobilityServicePath("motoboy", "cadastro"))}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {context.service === "motorista" ? "Motorista" : "Motoboy"}
              </CardTitle>
              <CardDescription>
                {context.service === "motorista"
                  ? "Fluxo exclusivo de corridas de passageiros."
                  : "Fluxo exclusivo de entregas de produtos e pedidos."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {serviceNavItems.map((item) => {
                  const isActive = context.section === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "border-primary/50 bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px]">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Outlet />
        </div>
      </div>
    </PerfilHubLayout>
  );
}
