import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ExternalLink,
  Home,
  KeyRound,
  MapPin,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { useSessionContext } from "@/core/session";
import { usePermission } from "@/core/authorization";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { ResidenceManager } from "@/core/residence/components/ResidenceManager";
import { ServiceAreasManager } from "@/core/service-areas/components/ServiceAreasManager";
import { getProfileTypeLabel } from "@/modules/profile/utils/profileDomainRules";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const {
    activeProfile,
    isLoading: activeProfileLoading,
  } = useSessionContext();
  const { allowed: canManageServiceAreas } = usePermission("manage", { businessId: activeProfile?.id });
  const [activeTab, setActiveTab] = useState("residencia");

  const isProfessionalProfile = canManageServiceAreas;
  const territoryLabel =
    [activeProfile?.neighborhood, activeProfile?.city, activeProfile?.state]
      .filter(Boolean)
      .join(", ") || null;

  if (activeProfileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando configuracoes operacionais...</p>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Nenhum perfil ativo disponivel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta area operacional depende de uma identidade ativa para gerenciar residencia
            e areas de atuacao.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate(appUrls.profile.central)}>
              Voltar ao hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configuracoes Operacionais</title>
        <meta
          name="description"
          content="Residencia, areas de atuacao e atalhos operacionais do perfil ativo."
        />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.central)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Configuracoes operacionais
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste o contexto territorial e a operacao do perfil ativo sem misturar conta,
              privacidade e governanca de identidade.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Perfil ativo</p>
              <h2 className="mt-2 truncate text-xl font-semibold text-foreground">
                {activeProfile.display_name || activeProfile.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{getProfileTypeLabel(activeProfile)}</Badge>
                {territoryLabel ? <Badge variant="outline">{territoryLabel}</Badge> : null}
                <Badge variant="outline">
                  {isProfessionalProfile ? "Gerencia areas de atuacao" : "Sem areas de atuacao"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-1.5" onClick={() => navigate(appUrls.profile.settings("privacy"))}>
                <Shield className="h-4 w-4" />
                Privacidade
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => navigate(appUrls.profile.settings("links"))}>
                <ExternalLink className="h-4 w-4" />
                Vinculos
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.85fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings2 className="h-5 w-5" />
                  Territorio e operacao
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className={`grid w-full ${isProfessionalProfile ? "grid-cols-2" : "grid-cols-1"}`}>
                    <TabsTrigger value="residencia" className="gap-2">
                      <Home className="h-4 w-4" />
                      Residencia
                    </TabsTrigger>

                    {isProfessionalProfile ? (
                      <TabsTrigger value="areas" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Areas de atuacao
                      </TabsTrigger>
                    ) : null}
                  </TabsList>

                  <TabsContent value="residencia" className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Residencia</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Define o territorio principal para personalizacao da comunidade,
                        visibilidade local e contexto do hub.
                      </p>
                    </div>
                    <ResidenceManager />
                  </TabsContent>

                  {isProfessionalProfile ? (
                    <TabsContent value="areas" className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Areas de atuacao</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Configure a cobertura geografica dos servicos profissionais ligados
                          ao perfil ativo.
                        </p>
                      </div>
                      <ServiceAreasManager profileId={activeProfile.id} />
                    </TabsContent>
                  ) : null}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Atalhos relacionados</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => navigate(appUrls.profile.settings("privacy"))}
                >
                  <Shield className="h-4 w-4" />
                  Privacidade do perfil
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => navigate(appUrls.profile.settings("links"))}
                >
                  <ExternalLink className="h-4 w-4" />
                  Vinculos e links
                </Button>
                {isProfessionalProfile ? (
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => navigate(appUrls.profile.settings("members"))}
                  >
                    <Users className="h-4 w-4" />
                    Membros do perfil
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => navigate(appUrls.notifications)}
                >
                  <Bell className="h-4 w-4" />
                  Inbox de notificacoes
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => navigate(appUrls.profile.account)}
                >
                  <KeyRound className="h-4 w-4" />
                  Minha conta
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Escopo desta area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Esta tela concentra apenas configuracoes operacionais ligadas ao
                  territorio e cobertura de atuacao.
                </p>
                <p>
                  Conta, senha, notificacoes, privacidade, vinculos e membros continuam
                  nas superficies especializadas ja existentes.
                </p>
                {!isProfessionalProfile ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-4">
                    <p className="font-medium text-foreground">Areas de atuacao indisponiveis</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      O perfil ativo nao tem permissao de gerenciar cobertura profissional.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfiguracoesPage;
