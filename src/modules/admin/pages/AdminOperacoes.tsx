/* eslint-disable react-hooks/exhaustive-deps */
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
} from "@/core/admin/components";
import { useLocationContext } from "@/core/location";
import { mobilityRolloutService } from "@/core/mobility/services/runtime";
import { RolloutSource, RolloutStatus } from "@/core/rollout/types";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import {
  operationalDiagnosticsService,
  type OperationalTable,
  type OperationalTableResult,
} from "@/modules/admin/services";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useToast } from "@/shared/hooks/use-toast";
import { logger } from "@/shared/utils/logger";

const RUNTIME_CHECK_TABLES: OperationalTable[] = [
  { table: "module_rollouts", label: "Rollout de módulos", required: true },
  { table: "locations", label: "Hierarquia territorial", required: true },
  { table: "driver_profiles", label: "Cadastros de motoristas", required: true },
  { table: "driver_data", label: "Status operacional de motoristas", required: true },
  { table: "ride_requests", label: "Corridas e entregas", required: true },
  { table: "ride_reports", label: "Reports de corrida", required: true },
  {
    table: "driver_moderation_events",
    label: "Histórico de moderação de motoristas",
    required: true,
  },
  { table: "pickup_points", label: "Pontos de embarque", required: false },
  { table: "pricing_rules", label: "Regras de pricing", required: false },
];

const QUICK_TOOLS = [
  { label: "Gestão de Motoristas", to: "/admin/motoristas" },
  { label: "Operações Motoboy", to: "/admin/motoboy-operacoes" },
  { label: "Identidade", to: "/admin/identidade" },
  { label: "Mapa", to: "/admin/mapa" },
  { label: "Pricing", to: "/admin/pricing" },
  { label: "Territórios", to: "/admin/territory-management" },
  { label: "Locations", to: "/admin/locations" },
  { label: "Notificações", to: "/admin/notifications" },
  { label: "Verificações", to: "/admin/verificacoes" },
  { label: "Roles e Permissões", to: "/admin/roles" },
];

function describeRolloutSource(source: RolloutSource | null): string {
  if (source === RolloutSource.LOCAL) return "local";
  if (source === RolloutSource.INHERITED) return "herdado";
  if (source === RolloutSource.DEFAULT) return "padrão";
  return "indefinido";
}

function tableStateBadge(item: OperationalTableResult) {
  if (item.state === "ok") {
    return (
      <Badge className="bg-success text-success-foreground hover:bg-success/90">
        Disponível
      </Badge>
    );
  }

  if (item.state === "missing") {
    return <Badge variant="destructive">Ausente</Badge>;
  }

  if (item.state === "error") {
    return <Badge variant="destructive">Erro</Badge>;
  }

  return <Badge variant="outline">Não provisionada</Badge>;
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
      setTableResults(checks);
    } catch (error) {
      logger.error(
        "AdminOperacoes: erro ao validar tabelas operacionais",
        error as Error,
      );
      setDiagnosticsError(
        "Não foi possível consolidar o diagnóstico das tabelas operacionais.",
      );
      toast({
        title: "Falha no diagnóstico",
        description: "Não foi possível verificar as tabelas operacionais.",
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
      logger.error(
        "AdminOperacoes: erro ao recarregar superfície operacional",
        error as Error,
      );
      setPageError(
        "Não foi possível recarregar os controles operacionais desta superfície.",
      );
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
        title: "Localização obrigatória",
        description: "Selecione uma localização ativa para salvar os controles.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await mobilityRolloutService.setMobilityEnabled(
        activeLocationId,
        moduleEnabled,
      );
      await mobilityRolloutService.setMotoboyEnabled(
        activeLocationId,
        motoboyEnabled,
      );
      await loadMobilityState();

      toast({
        title: "Operação salva",
        description: "Controles de mobilidade atualizados com sucesso.",
      });
    } catch (error) {
      logger.error(
        "AdminOperacoes: erro ao salvar controles de mobilidade",
        error as Error,
      );
      toast({
        title: "Falha ao salvar",
        description: "Não foi possível persistir os controles de mobilidade.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Carregando operações administrativas</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <AdminPageHeader
        title="Operações do Sistema"
        description="Controles administrativos críticos, rollout de mobilidade e diagnóstico de prontidão operacional."
        icon={Settings2}
        actions={
          <Button
            variant="outline"
            onClick={() => void refreshAll()}
            disabled={tableCheckRunning || isSaving}
          >
            {tableCheckRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
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
          subtitle={activeLocation?.name ?? "Nenhuma localização ativa"}
          icon={Settings2}
          iconColor="text-info"
        />
        <AdminStatsCard
          title="Tabelas obrigatórias"
          value={`${requiredTables.filter((item) => item.state === "ok").length}/${requiredTables.length || 0}`}
          subtitle={`${missingRequiredTables.length} pendência(s) crítica(s)`}
          icon={Database}
          iconColor={
            missingRequiredTables.length ? "text-destructive" : "text-success"
          }
        />
        <AdminStatsCard
          title="Ferramentas operacionais"
          value={QUICK_TOOLS.length}
          subtitle={`${optionalTables.length} tabela(s) opcional(is) no diagnóstico`}
          icon={Shield}
          iconColor="text-primary"
        />
      </AdminStatsGrid>

      {pageError ? (
        <AdminErrorState
          title="Falha ao atualizar operações do sistema"
          description={pageError}
          onRetry={() => void refreshAll()}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <div className="space-y-4">
          <AdminSectionCard
            title="Mobilidade por localização"
            description="Controle oficial do rollout mobility e do modo motoboy no admin."
            icon={Car}
            actions={
              <Badge variant="outline">
                {activeLocation?.name ?? "Nenhuma localização ativa"}
              </Badge>
            }
          >
            <div className="space-y-4">
              <ControlRow
                id="mobility-module-enabled"
                title="Módulo de mobilidade habilitado"
                description={`Fonte atual do rollout: ${describeRolloutSource(source)}.`}
                checked={moduleEnabled}
                onCheckedChange={setModuleEnabled}
                disabled={!activeLocationId || isSaving}
              />

              <ControlRow
                id="motoboy-mode-enabled"
                title="Modo motoboy habilitado"
                description="Quando desligado, novas solicitações de entrega por motoboy ficam bloqueadas."
                checked={motoboyEnabled}
                onCheckedChange={setMotoboyEnabled}
                disabled={!activeLocationId || isSaving}
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => void saveMobilityControls()}
                  disabled={!activeLocationId || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  Salvar controles
                </Button>
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Diagnóstico de tabelas operacionais"
            description="Visão objetiva do que está pronto no banco para administração do sistema."
            icon={Database}
          >
            {diagnosticsError && !tableResults.length ? (
              <AdminErrorState
                title="Falha ao carregar diagnóstico operacional"
                description={diagnosticsError}
                onRetry={() => void checkOperationalTables()}
              />
            ) : (
              <AdminDataState
                loading={tableCheckRunning && !tableResults.length}
                isEmpty={!tableCheckRunning && !tableResults.length}
                emptyTitle="Sem diagnóstico operacional"
                emptyDescription="Não foi possível consolidar as tabelas operacionais deste ambiente."
              >
                <div className="space-y-3">
                  {diagnosticsError ? (
                    <AdminErrorState
                      title="Diagnóstico parcialmente indisponível"
                      description={diagnosticsError}
                      onRetry={() => void checkOperationalTables()}
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
                            <Badge variant={item.required ? "secondary" : "outline"}>
                              {item.required ? "Obrigatória" : "Opcional"}
                            </Badge>
                          </TableCell>
                          <TableCell>{tableStateBadge(item)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </AdminTable>

                  {missingRequiredTables.length > 0 ? (
                    <OperationalNotice
                      tone="destructive"
                      icon={AlertCircle}
                      text="Existem tabelas obrigatórias ausentes ou com erro. Corrija o schema antes de considerar o admin operacional em 100%."
                    />
                  ) : (
                    <OperationalNotice
                      tone="success"
                      icon={CheckCircle2}
                      text="Infraestrutura mínima de operação administrativa validada para as tabelas obrigatórias."
                    />
                  )}
                </div>
              </AdminDataState>
            )}
          </AdminSectionCard>
        </div>

        <div className="space-y-4">
          <AdminSectionCard
            title="Ferramentas administrativas"
            description="Acesso rápido para operação diária do sistema."
            icon={Settings2}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
              {QUICK_TOOLS.map((tool) => (
                <Button
                  key={tool.to}
                  variant="outline"
                  className="justify-between"
                  asChild
                >
                  <Link to={tool.to}>
                    <span>{tool.label}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              ))}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Leitura objetiva"
            description="Resumo do estado operacional atual e do que ainda bloqueia prontidão plena."
            icon={Shield}
            contentClassName="space-y-2 text-sm text-muted-foreground"
          >
            <p>
              Esta superfície concentra controles críticos de rollout e diagnóstico de
              schema sem acessar tabelas sensíveis diretamente da página.
            </p>
            <p>
              O admin central governa rollout, moderação e políticas globais; dashboards
              de negócio e mobilidade permanecem responsáveis pela operação do próprio
              perfil e execução diária.
            </p>
            <p>
              Prontidão total depende de zerar tabelas obrigatórias ausentes ou com erro e
              consolidar a leitura operacional hoje vinculada a
              `operationalDiagnosticsService` dentro de `core/admin`.
            </p>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  );
}

function ControlRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <Label htmlFor={id} className="font-semibold">
          {title}
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function OperationalNotice({
  tone,
  icon: Icon,
  text,
}: {
  tone: "destructive" | "success";
  icon: typeof AlertCircle;
  text: string;
}) {
  return (
    <div
      className={
        tone === "destructive"
          ? "flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          : "flex gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
