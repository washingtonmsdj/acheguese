import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Car,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  Settings2,
  Shield,
} from "lucide-react";
import {
  AdminDataState,
  AdminErrorState,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTable,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useToast } from "@/shared/hooks/use-toast";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { useLocationContext } from "@/core/location";
import { mobilityRolloutService } from "@/core/mobility/services";
import { RolloutSource, RolloutStatus } from "@/core/rollout/types";
import {
  operationalDiagnosticsService,
  type OperationalTable,
  type OperationalTableResult,
} from "@/modules/admin/services";
import { logger } from "@/shared/utils/logger";

const RUNTIME_CHECK_TABLES: OperationalTable[] = [
  { table: "module_rollouts", label: "Rollout de modulos", required: true },
  { table: "locations", label: "Hierarquia territorial", required: true },
  { table: "driver_profiles", label: "Cadastros de motoristas", required: true },
  { table: "driver_data", label: "Status operacional de motoristas", required: true },
  { table: "ride_requests", label: "Corridas e entregas", required: true },
  { table: "ride_reports", label: "Reports de corrida", required: true },
  { table: "driver_moderation_events", label: "Historico de moderacao de motoristas", required: true },
  { table: "pricing_rules", label: "Regras de pricing", required: false },
];

const OPTIONAL_NOT_PROVISIONED: OperationalTableResult[] = [
  {
    table: "pickup_points",
    label: "Pontos de embarque",
    required: false,
    state: "not_provisioned",
    detail: "Modulo opcional nao provisionado neste schema",
  },
];

const QUICK_TOOLS = [
  { label: "Gestao de Motoristas", to: "/admin/motoristas" },
  { label: "Operacoes Motoboy", to: "/admin/motoboy-operacoes" },
  { label: "Identidade", to: "/admin/identidade" },
  { label: "Mapa", to: "/admin/mapa" },
  { label: "Pricing", to: "/admin/pricing" },
  { label: "Territorios", to: "/admin/territory-management" },
  { label: "Locations", to: "/admin/locations" },
  { label: "Notificacoes", to: "/admin/notifications" },
  { label: "Verificacoes", to: "/admin/verificacoes" },
  { label: "Roles e Permissoes", to: "/admin/roles" },
];

function describeRolloutSource(source: RolloutSource | null): string {
  if (source === RolloutSource.LOCAL) return "local";
  if (source === RolloutSource.INHERITED) return "herdado";
  if (source === RolloutSource.DEFAULT) return "padrao";
  return "indefinido";
}

function tableStateBadge(item: OperationalTableResult) {
  if (item.state === "ok") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Disponivel</Badge>;
  }

  if (item.state === "missing") {
    return <Badge variant="destructive">Ausente</Badge>;
  }

  if (item.state === "error") {
    return <Badge variant="destructive">Erro</Badge>;
  }

  return <Badge variant="outline">Nao provisionada</Badge>;
}

export default function AdminOperacoes() {
  const { canModerate, isChecking } = useAdminGuard();
  const { toast } = useToast();
  const { activeLocation } = useLocationContext();
  const activeLocationId = activeLocation?.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [moduleEnabled, setModuleEnabled] = useState(false);
  const [motoboyEnabled, setMotoboyEnabled] = useState(false);
  const [source, setSource] = useState<RolloutSource | null>(null);
  const [tableResults, setTableResults] = useState<OperationalTableResult[]>([]);
  const [tableCheckRunning, setTableCheckRunning] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  const requiredTables = useMemo(
    () => tableResults.filter((item) => item.required),
    [tableResults],
  );

  const missingRequiredTables = useMemo(
    () => requiredTables.filter((item) => item.state !== "ok"),
    [requiredTables],
  );

  const optionalTables = useMemo(
    () => tableResults.filter((item) => !item.required),
    [tableResults],
  );

  const loadMobilityState = useCallback(async () => {
    if (!activeLocationId) {
      setModuleEnabled(false);
      setMotoboyEnabled(false);
      setSource(null);
      return;
    }

    const [rollout, motoboy] = await Promise.all([
      mobilityRolloutService.getMobilityRolloutForLocation(activeLocationId),
      mobilityRolloutService.isMotoboyEnabled(activeLocationId),
    ]);

    setModuleEnabled(rollout?.status === RolloutStatus.ACTIVE);
    setMotoboyEnabled(motoboy);
    setSource(rollout?.source ?? null);
  }, [activeLocationId]);

  const checkOperationalTables = useCallback(async () => {
    setTableCheckRunning(true);
    setDiagnosticsError(null);
    try {
      const checks = await operationalDiagnosticsService.checkTables(
        RUNTIME_CHECK_TABLES,
      );

      setTableResults([...checks, ...OPTIONAL_NOT_PROVISIONED]);
    } catch (error) {
      logger.error("AdminOperacoes: erro ao validar tabelas operacionais", error as Error);
      setDiagnosticsError("Nao foi possivel consolidar o diagnostico das tabelas operacionais.");
      toast({
        title: "Falha no diagnostico",
        description: "Nao foi possivel verificar as tabelas operacionais.",
        variant: "destructive",
      });
    } finally {
      setTableCheckRunning(false);
    }
  }, [toast]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      await Promise.all([loadMobilityState(), checkOperationalTables()]);
    } catch (error) {
      logger.error("AdminOperacoes: erro ao recarregar superficie operacional", error as Error);
      setPageError("Nao foi possivel recarregar os controles operacionais desta superficie.");
      toast({
        title: "Falha ao atualizar",
        description: "Revise a conectividade e tente atualizar novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [checkOperationalTables, loadMobilityState]);

  useEffect(() => {
    if (!isChecking && canModerate) {
      void refreshAll();
    }
  }, [canModerate, isChecking, refreshAll]);

  const saveMobilityControls = async () => {
    if (!activeLocationId) {
      toast({
        title: "Localizacao obrigatoria",
        description: "Selecione uma localizacao ativa para salvar os controles.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await mobilityRolloutService.setMobilityEnabled(activeLocationId, moduleEnabled);
      await mobilityRolloutService.setMotoboyEnabled(activeLocationId, motoboyEnabled);
      await loadMobilityState();

      toast({
        title: "Operacao salva",
        description: "Controles de mobilidade atualizados com sucesso.",
      });
    } catch (error) {
      logger.error("AdminOperacoes: erro ao salvar controles de mobilidade", error as Error);
      toast({
        title: "Falha ao salvar",
        description: "Nao foi possivel persistir os controles de mobilidade.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">Apenas administradores podem acessar esta pagina.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operacoes do Sistema"
        description="Controles administrativos criticos, rollout de mobilidade e diagnostico de prontidao operacional."
        icon={Settings2}
        actions={
          <Button variant="outline" onClick={refreshAll} disabled={tableCheckRunning || isSaving}>
            {tableCheckRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        }
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Rollout mobility"
          value={moduleEnabled ? "Ativo" : "Desligado"}
          subtitle={`Fonte: ${describeRolloutSource(source)}`}
          icon={Car}
        />
        <AdminStatsCard
          title="Modo motoboy"
          value={motoboyEnabled ? "Ativo" : "Desligado"}
          subtitle={activeLocation?.name ?? "Nenhuma localizacao ativa"}
          icon={Settings2}
          iconColor="text-sky-600"
        />
        <AdminStatsCard
          title="Tabelas obrigatorias"
          value={`${requiredTables.filter((item) => item.state === "ok").length}/${requiredTables.length || 0}`}
          subtitle={`${missingRequiredTables.length} pendencia(s) critica(s)`}
          icon={Database}
          iconColor={missingRequiredTables.length ? "text-red-600" : "text-emerald-600"}
        />
        <AdminStatsCard
          title="Ferramentas operacionais"
          value={QUICK_TOOLS.length}
          subtitle={`${optionalTables.length} tabela(s) opcional(is) no diagnostico`}
          icon={Shield}
          iconColor="text-violet-600"
        />
      </AdminStatsGrid>

      {pageError ? (
        <AdminErrorState
          title="Falha ao atualizar operacoes do sistema"
          description={pageError}
          onRetry={() => {
            void refreshAll();
          }}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <div className="space-y-4">
          <AdminSectionCard
            title="Mobilidade por localizacao"
            description="Controle oficial do rollout mobility e do modo motoboy no admin."
            icon={Car}
            actions={<Badge variant="outline">{activeLocation?.name ?? "Nenhuma localizacao ativa"}</Badge>}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="mobility-module-enabled" className="font-semibold">
                    Modulo de mobilidade habilitado
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fonte atual do rollout: {describeRolloutSource(source)}.
                  </p>
                </div>
                <Switch
                  id="mobility-module-enabled"
                  checked={moduleEnabled}
                  onCheckedChange={setModuleEnabled}
                  disabled={!activeLocationId || isSaving}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="motoboy-mode-enabled" className="font-semibold">
                    Modo motoboy habilitado
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quando desligado, novas solicitacoes de entrega por motoboy ficam bloqueadas.
                  </p>
                </div>
                <Switch
                  id="motoboy-mode-enabled"
                  checked={motoboyEnabled}
                  onCheckedChange={setMotoboyEnabled}
                  disabled={!activeLocationId || isSaving}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveMobilityControls} disabled={!activeLocationId || isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar controles
                </Button>
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Diagnostico de tabelas operacionais"
            description="Visao objetiva do que esta pronto no banco para administracao do sistema."
            icon={Database}
          >
            {diagnosticsError && !tableResults.length ? (
              <AdminErrorState
                title="Falha ao carregar diagnostico operacional"
                description={diagnosticsError}
                onRetry={() => {
                  void checkOperationalTables();
                }}
              />
            ) : (
              <AdminDataState
                loading={tableCheckRunning && !tableResults.length}
                isEmpty={!tableCheckRunning && !tableResults.length}
                emptyTitle="Sem diagnostico operacional"
                emptyDescription="Nao foi possivel consolidar as tabelas operacionais deste ambiente."
              >
                <div className="space-y-3">
                  {diagnosticsError ? (
                    <AdminErrorState
                      title="Diagnostico parcialmente indisponivel"
                      description={diagnosticsError}
                      onRetry={() => {
                        void checkOperationalTables();
                      }}
                    />
                  ) : null}

                  <AdminTable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Detalhe</TableHead>
                        <TableHead>Criticidade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableResults.map((item) => (
                        <TableRow key={item.table}>
                          <TableCell className="min-w-[220px]">
                            <div className="space-y-1">
                              <div className="font-medium">{item.label}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {item.table}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[320px] text-sm text-muted-foreground">
                            {item.detail ?? "Sem detalhes"}
                          </TableCell>
                          <TableCell>
                            {item.required ? (
                              <Badge variant="secondary">Obrigatoria</Badge>
                            ) : (
                              <Badge variant="outline">Opcional</Badge>
                            )}
                          </TableCell>
                          <TableCell>{tableStateBadge(item)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </AdminTable>

                  {missingRequiredTables.length > 0 ? (
                    <div className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Existem tabelas obrigatorias ausentes ou com erro. Corrija o schema antes de considerar o admin operacional em 100%.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Infraestrutura minima de operacao administrativa validada para as tabelas obrigatorias.
                      </p>
                    </div>
                  )}
                </div>
              </AdminDataState>
            )}
          </AdminSectionCard>
        </div>

        <div className="space-y-4">
          <AdminSectionCard
            title="Ferramentas administrativas"
            description="Acesso rapido para operacao diaria do sistema."
            icon={Settings2}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
              {QUICK_TOOLS.map((tool) => (
                <Button key={tool.to} variant="outline" className="justify-between" asChild>
                  <Link to={tool.to}>
                    <span>{tool.label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Leitura objetiva"
            description="Resumo do estado operacional atual e do que ainda bloqueia prontidao plena."
            icon={Shield}
            contentClassName="space-y-2 text-sm text-muted-foreground"
          >
            <p>
              Esta superficie concentra controles criticos de rollout e diagnostico de schema sem acessar tabelas sensiveis diretamente da page.
            </p>
            <p>
              Ownership canonico: o admin central governa rollout/moderacao/politicas globais; dashboards de negocio e mobilidade permanecem responsaveis por operacao do proprio perfil e execucao diaria.
            </p>
            <p>
              Prontidao total depende de zerar tabelas obrigatorias ausentes ou com erro e consolidar a leitura operacional hoje ainda vinculada a `operationalDiagnosticsService` dentro de `core/admin`.
            </p>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  );
}
