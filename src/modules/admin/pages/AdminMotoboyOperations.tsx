/**
 * AdminMotoboyOperations — Console operacional de entregas motoboy
 *
 * Superfície admin para:
 * - Fila operacional de entregas (ride_requests com ride_mode='motoboy')
 * - Filtros por status, território, source_type, motoboy, SLA
 * - Ações: cancelar operacional, reencaminhar dispatch, bloquear
 * - Painel de saúde (SLA, tempo médio aceite, taxa falha/cancelamento)
 *
 * SSOT: ride_requests (ride_mode='motoboy')
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminPageHeader,
  AdminSectionCard,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTable,
  AdminDataState,
  AdminErrorState,
} from "@/core/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { logger } from "@/shared/utils/logger";
import { AdminMotoboyOperationsService } from "@/core/admin/services/AdminMotoboyOperationsService";
import {
  Package,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================

interface MotoboyDelivery {
  id: string;
  status: string;
  source_type: string | null;
  source_id: string | null;
  recipient_name: string | null;
  package_size: string | null;
  suggested_price: number | null;
  created_at: string;
  updated_at: string;
  driver_profile_id: string | null;
  pickup_location_id: string | null;
  delivery_notes: string | null;
  failed_delivery_reason: string | null;
}

interface OperationalStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
  avgAcceptTimeMinutes: number | null;
  failureRate: number;
}

type StatusFilter =
  | "all"
  | "searching_driver"
  | "driver_assigned"
  | "driver_accepted"
  | "pickup_confirmed"
  | "in_delivery"
  | "delivered"
  | "completed"
  | "failed_delivery"
  | "cancelled_by_passenger"
  | "cancelled_by_driver";

type SourceTypeFilter = "all" | "passenger" | "business" | "gastronomy" | "service";

// ============================================
// HELPERS
// ============================================

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    searching_driver: { label: "Buscando motoboy", variant: "secondary" },
    driver_assigned: { label: "Motoboy atribuído", variant: "secondary" },
    driver_accepted: { label: "Motoboy a caminho", variant: "default" },
    pickup_confirmed: { label: "Coleta confirmada", variant: "default" },
    in_delivery: { label: "Em entrega", variant: "default" },
    delivered: { label: "Entregue", variant: "default" },
    completed: { label: "Concluída", variant: "default" },
    failed_delivery: { label: "Falha na entrega", variant: "destructive" },
    cancelled_by_passenger: { label: "Cancelada (solicitante)", variant: "outline" },
    cancelled_by_driver: { label: "Cancelada (motoboy)", variant: "outline" },
  };
  const config =
    Object.entries(map).find(([key]) => key === status)?.[1] ??
    { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function sourceTypeBadge(sourceType: string | null) {
  const map: Record<string, string> = {
    passenger: "Passageiro",
    business: "Empresa",
    gastronomy: "Gastronomia",
    service: "Serviço",
  };
  return (
    <Badge variant="outline" className="text-xs">
      {map[sourceType ?? ""] ?? sourceType ?? "—"}
    </Badge>
  );
}

function slaMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function slaBadge(minutes: number, status: string) {
  const isTracked = [
    "searching_driver",
    "driver_assigned",
    "driver_accepted",
    "driver_arriving",
    "pickup_confirmed",
    "in_delivery",
  ].includes(status);
  if (!isTracked) return null;
  if (minutes > 30) return <Badge variant="destructive" className="text-xs">{minutes}min</Badge>;
  if (minutes > 15) return <Badge variant="secondary" className="text-xs">{minutes}min</Badge>;
  return <Badge variant="outline" className="text-xs">{minutes}min</Badge>;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminMotoboyOperations() {
  const { canModerate, isChecking } = useAdminGuard();
  const { toast } = useToast();

  const [deliveries, setDeliveries] = useState<MotoboyDelivery[]>([]);
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Ação de cancelamento
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // ── Carregar dados ──────────────────────────────────────────────────────────

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await AdminMotoboyOperationsService.listDeliveries({
        status: statusFilter,
        sourceType: sourceTypeFilter,
      });
      setDeliveries((data as MotoboyDelivery[]) || []);
    } catch (error) {
      logger.error("AdminMotoboyOperations.loadDeliveries", error as Error);
      setPageError("Erro ao carregar entregas.");
    }
  }, [statusFilter, sourceTypeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const rows = await AdminMotoboyOperationsService.listStatsRows();

      const total = rows.length;
      const pending = rows.filter((r) =>
        ["searching_driver", "driver_assigned"].includes(r.status),
      ).length;
      const active = rows.filter((r) =>
        ["driver_accepted", "pickup_confirmed", "in_delivery"].includes(r.status),
      ).length;
      const completed = rows.filter((r) => r.status === "completed").length;
      const failed = rows.filter((r) => r.status === "failed_delivery").length;
      const cancelled = rows.filter((r) =>
        ["cancelled_by_passenger", "cancelled_by_driver"].includes(r.status),
      ).length;

      const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;

      setStats({
        total,
        pending,
        active,
        completed,
        failed,
        cancelled,
        avgAcceptTimeMinutes: null, // Calculado via audit quando disponível
        failureRate,
      });
    } catch (error) {
      logger.error("AdminMotoboyOperations.loadStats", error as Error);
    }
  }, []);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true);
      await Promise.all([loadDeliveries(), loadStats()]);
      if (!silent) setIsRefreshing(false);
    },
    [loadDeliveries, loadStats],
  );

  useEffect(() => {
    if (!canModerate || isChecking) return;
    setIsLoading(true);
    Promise.all([loadDeliveries(), loadStats()]).finally(() => setIsLoading(false));
  }, [canModerate, isChecking, loadDeliveries, loadStats]);

  // ── Filtro local por busca ──────────────────────────────────────────────────

  const filteredDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return deliveries;
    const q = searchQuery.toLowerCase();
    return deliveries.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.recipient_name?.toLowerCase().includes(q) ||
        d.source_id?.toLowerCase().includes(q) ||
        d.driver_profile_id?.toLowerCase().includes(q),
    );
  }, [deliveries, searchQuery]);

  // ── Ação: cancelar operacional ──────────────────────────────────────────────

  const handleCancelClick = (id: string) => {
    setSelectedDeliveryId(id);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedDeliveryId) return;
    setIsCancelling(true);

    try {
      await AdminMotoboyOperationsService.cancelOperational(
        selectedDeliveryId,
        cancelReason || "Cancelamento operacional pelo admin",
      );

      toast({
        title: "Entrega encerrada",
        description: "Intervenção registrada com auditoria operacional.",
      });
      await refresh(true);
    } catch (error) {
      logger.error("AdminMotoboyOperations.handleCancelConfirm", error as Error);
      toast({ title: "Erro", description: "Não foi possível cancelar a entrega.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setSelectedDeliveryId(null);
    }
  };

  // ── Ação: reencaminhar dispatch ─────────────────────────────────────────────

  const handleRedispatch = async (deliveryId: string) => {
    try {
      await AdminMotoboyOperationsService.redispatch(deliveryId);

      toast({ title: "Reencaminhado", description: "Entrega voltou para fila de dispatch." });
      await refresh(true);
    } catch (error) {
      logger.error("AdminMotoboyOperations.handleRedispatch", error as Error);
      toast({ title: "Erro", description: "Não foi possível reencaminhar.", variant: "destructive" });
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canModerate) {
    return <AdminErrorState description="Acesso restrito a administradores." />;
  }

  if (pageError) {
    return <AdminErrorState description={pageError} />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operações Motoboy"
        description="Console operacional de entregas via rede de motoboys"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <AdminStatsGrid>
          <AdminStatsCard
            title="Total"
            value={stats.total}
            icon={Package}
          />
          <AdminStatsCard
            title="Aguardando"
            value={stats.pending}
            icon={Clock}
            iconColor={stats.pending > 10 ? "text-orange-500" : "text-primary"}
          />
          <AdminStatsCard
            title="Em andamento"
            value={stats.active}
            icon={RefreshCw}
          />
          <AdminStatsCard
            title="Concluídas"
            value={stats.completed}
            icon={CheckCircle2}
            iconColor="text-green-600"
          />
          <AdminStatsCard
            title="Falhas"
            value={stats.failed}
            icon={XCircle}
            iconColor={stats.failed > 0 ? "text-orange-500" : "text-primary"}
          />
          <AdminStatsCard
            title="Taxa de falha"
            value={`${stats.failureRate}%`}
            icon={AlertTriangle}
            iconColor={stats.failureRate > 10 ? "text-orange-500" : "text-primary"}
          />
        </AdminStatsGrid>
      )}

      {/* Filtros */}
      <AdminSectionCard title="Filtros">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, destinatário, motoboy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="searching_driver">Buscando motoboy</SelectItem>
              <SelectItem value="driver_assigned">Motoboy atribuído</SelectItem>
              <SelectItem value="driver_accepted">Motoboy a caminho</SelectItem>
              <SelectItem value="pickup_confirmed">Coleta confirmada</SelectItem>
              <SelectItem value="in_delivery">Em entrega</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="failed_delivery">Falha na entrega</SelectItem>
              <SelectItem value="cancelled_by_passenger">Cancelada (solicitante)</SelectItem>
              <SelectItem value="cancelled_by_driver">Cancelada (motoboy)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sourceTypeFilter}
            onValueChange={(v) => setSourceTypeFilter(v as SourceTypeFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              <SelectItem value="passenger">Passageiro</SelectItem>
              <SelectItem value="business">Empresa</SelectItem>
              <SelectItem value="gastronomy">Gastronomia</SelectItem>
              <SelectItem value="service">Serviço</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminSectionCard>

      {/* Tabela operacional */}
      <AdminSectionCard
        title={`Entregas (${filteredDeliveries.length})`}
        description="Clique em uma ação para intervir operacionalmente"
      >
        {isLoading ? (
          <AdminDataState loading emptyTitle="">
            <></>
          </AdminDataState>
        ) : filteredDeliveries.length === 0 ? (
          <AdminDataState isEmpty emptyTitle="Nenhuma entrega encontrada" emptyDescription="Nenhuma entrega encontrada com os filtros aplicados.">
            <></>
          </AdminDataState>
        ) : (
          <AdminTable>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.map((delivery) => {
                const sla = slaMinutes(delivery.created_at);
                const canCancel =
                  AdminMotoboyOperationsService.canCancelOperational(delivery.status);
                const canRedispatch =
                  AdminMotoboyOperationsService.canRedispatch(delivery.status);

                return (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs">
                      {delivery.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>{statusBadge(delivery.status)}</TableCell>
                    <TableCell>{sourceTypeBadge(delivery.source_type)}</TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {delivery.recipient_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {delivery.package_size ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {delivery.suggested_price != null
                        ? `R$ ${delivery.suggested_price.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>{slaBadge(sla, delivery.status) ?? <span className="text-xs text-muted-foreground">{sla}min</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelClick(delivery.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                        {canRedispatch && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRedispatch(delivery.id)}
                          >
                            Reencaminhar
                          </Button>
                        )}
                        {!canCancel && !canRedispatch && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </AdminTable>
        )}
      </AdminSectionCard>

      {/* Dialog de cancelamento operacional */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Entrega (Admin)</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancela a entrega operacionalmente e registra auditoria. Informe o motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Motivo do cancelamento operacional"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
