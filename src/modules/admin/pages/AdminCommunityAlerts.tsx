/**
 * AdminCommunityAlerts - Gestao administrativa de alertas comunitarios
 *
 * SSOT: usa adminCommunityAlertsService.
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { adminCommunityAlertsService } from "@/core/admin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import type { AlertCategory, AlertStatus } from "@/shared/services/communityAlerts";
import { AdminCommunityAlertsAnalytics } from "./community-alerts/AdminCommunityAlertsAnalytics";
import { AdminCommunityAlertsBlockedTerms } from "./community-alerts/AdminCommunityAlertsBlockedTerms";
import { AdminCommunityAlertsFilters } from "./community-alerts/AdminCommunityAlertsFilters";
import { AdminCommunityAlertsReviewList } from "./community-alerts/AdminCommunityAlertsReviewList";
import { AdminCommunityAlertsStats } from "./community-alerts/AdminCommunityAlertsStats";
import { AdminCommunityAlertsTable } from "./community-alerts/AdminCommunityAlertsTable";
import type { AlertAdminItem } from "./community-alerts/AdminCommunityAlerts.types";

export default function AdminCommunityAlerts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "">("");
  const [selectedAlert, setSelectedAlert] = useState<AlertAdminItem | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [newBlockedTerm, setNewBlockedTerm] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["admin-community-alerts-stats"],
    queryFn: () => adminCommunityAlertsService.getStats(),
  });

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["admin-community-alerts", page, search, statusFilter, categoryFilter, activeTab],
    queryFn: () =>
      adminCommunityAlertsService.getAllAlerts({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        underReview: activeTab === "review" ? true : undefined,
      }),
  });

  const { data: reviewAlerts } = useQuery({
    queryKey: ["admin-community-alerts-review"],
    queryFn: () => adminCommunityAlertsService.getAlertsUnderReview(),
    enabled: activeTab === "review",
  });

  const { data: topReported } = useQuery({
    queryKey: ["admin-community-alerts-top-reported"],
    queryFn: () => adminCommunityAlertsService.getTopReportedAlerts(10),
    enabled: activeTab === "analytics",
  });

  const { data: categoryStats } = useQuery({
    queryKey: ["admin-community-alerts-category-stats"],
    queryFn: () => adminCommunityAlertsService.getStatsByCategory(),
    enabled: activeTab === "analytics",
  });

  const { data: blockedTerms } = useQuery({
    queryKey: ["admin-community-alerts-blocked-terms"],
    queryFn: () => adminCommunityAlertsService.getBlockedTerms(),
    enabled: activeTab === "blocked-terms",
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCommunityAlertsService.removeAlert(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-stats"] });
      toast.success("Alerta removido com sucesso");
      setShowRemoveDialog(false);
      setSelectedAlert(null);
      setRemovalReason("");
    },
    onError: () => {
      toast.error("Erro ao remover alerta");
    },
  });

  const clearReviewMutation = useMutation({
    mutationFn: (id: string) => adminCommunityAlertsService.clearUnderReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-stats"] });
      toast.success("Alerta aprovado");
    },
    onError: () => {
      toast.error("Erro ao aprovar alerta");
    },
  });

  const endAlertMutation = useMutation({
    mutationFn: (id: string) => adminCommunityAlertsService.endAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-stats"] });
      toast.success("Alerta encerrado");
    },
    onError: () => {
      toast.error("Erro ao encerrar alerta");
    },
  });

  const addBlockedTermMutation = useMutation({
    mutationFn: (term: string) => adminCommunityAlertsService.addBlockedTerm(term),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-blocked-terms"] });
      toast.success("Termo bloqueado adicionado");
      setNewBlockedTerm("");
    },
    onError: () => {
      toast.error("Erro ao adicionar termo bloqueado");
    },
  });

  const removeBlockedTermMutation = useMutation({
    mutationFn: (termId: string) => adminCommunityAlertsService.removeBlockedTerm(termId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-blocked-terms"] });
      toast.success("Termo bloqueado removido");
    },
    onError: () => {
      toast.error("Erro ao remover termo bloqueado");
    },
  });

  const toggleBlockedTermMutation = useMutation({
    mutationFn: ({ termId, isActive }: { termId: string; isActive: boolean }) =>
      adminCommunityAlertsService.toggleBlockedTerm(termId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-alerts-blocked-terms"] });
      toast.success("Status do termo atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar termo");
    },
  });

  const handleRemoveAlert = () => {
    if (!selectedAlert || !removalReason.trim()) {
      toast.error("Informe o motivo da remocao");
      return;
    }
    removeMutation.mutate({ id: selectedAlert.id, reason: removalReason });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <AlertTriangle className="h-8 w-8" />
          Gestao de Alertas Comunitarios
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie alertas, moderacao e termos bloqueados
        </p>
      </div>

      <AdminCommunityAlertsStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos os Alertas</TabsTrigger>
          <TabsTrigger value="review">
            Sob Revisao
            {stats?.underReview ? (
              <Badge variant="destructive" className="ml-2">
                {stats.underReview}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="blocked-terms">Termos Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AdminCommunityAlertsFilters
            search={search}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
          <AdminCommunityAlertsTable
            alertsData={alertsData}
            isLoading={isLoading}
            page={page}
            isClearingReview={clearReviewMutation.isPending}
            isEndingAlert={endAlertMutation.isPending}
            onPageChange={setPage}
            onClearReview={(alertId) => clearReviewMutation.mutate(alertId)}
            onEndAlert={(alertId) => endAlertMutation.mutate(alertId)}
            onOpenRemoveDialog={(alert) => {
              setSelectedAlert(alert);
              setShowRemoveDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <AdminCommunityAlertsReviewList
            reviewAlerts={reviewAlerts}
            isClearingReview={clearReviewMutation.isPending}
            onClearReview={(alertId) => clearReviewMutation.mutate(alertId)}
            onOpenRemoveDialog={(alert) => {
              setSelectedAlert(alert);
              setShowRemoveDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AdminCommunityAlertsAnalytics
            topReported={topReported}
            categoryStats={categoryStats}
          />
        </TabsContent>

        <TabsContent value="blocked-terms" className="space-y-4">
          <AdminCommunityAlertsBlockedTerms
            blockedTerms={blockedTerms}
            newBlockedTerm={newBlockedTerm}
            isAdding={addBlockedTermMutation.isPending}
            isRemoving={removeBlockedTermMutation.isPending}
            isToggling={toggleBlockedTermMutation.isPending}
            onNewBlockedTermChange={setNewBlockedTerm}
            onAddBlockedTerm={() => {
              if (newBlockedTerm.trim()) addBlockedTermMutation.mutate(newBlockedTerm);
            }}
            onRemoveBlockedTerm={(termId) => removeBlockedTermMutation.mutate(termId)}
            onToggleBlockedTerm={(termId, isActive) =>
              toggleBlockedTermMutation.mutate({ termId, isActive })
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Alerta</DialogTitle>
            <DialogDescription>
              Informe o motivo da remocao. Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da remocao..."
              value={removalReason}
              onChange={(event) => setRemovalReason(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false);
                setSelectedAlert(null);
                setRemovalReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAlert}
              disabled={removeMutation.isPending || !removalReason.trim()}
            >
              Remover Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
