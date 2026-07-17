/**
 * AdminCommunityIssues - Gestão administrativa de problemas urbanos
 * 
 * SSOT: Usa adminCommunityIssuesService
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCommunityIssuesService } from "@/core/admin";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  ISSUE_STATUS_LABELS,
} from "@/core/community/issues";
import type { IssueCategory, IssueStatus, IssuePriority } from "@/core/community/issues";
import { AdminCommunityIssuesAnalytics } from "./community-issues/AdminCommunityIssuesAnalytics";
import { AdminCommunityIssuesFilters } from "./community-issues/AdminCommunityIssuesFilters";
import { AdminCommunityIssuesReviewList } from "./community-issues/AdminCommunityIssuesReviewList";
import { AdminCommunityIssuesStats } from "./community-issues/AdminCommunityIssuesStats";
import { AdminCommunityIssuesTable } from "./community-issues/AdminCommunityIssuesTable";
import type { IssueAdminItem } from "./community-issues/AdminCommunityIssues.types";

export default function AdminCommunityIssues() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "">("");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "">("");
  
  // Dialogs
  const [selectedIssue, setSelectedIssue] = useState<IssueAdminItem | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatus | "">("");

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["admin-community-issues-stats"],
    queryFn: () => adminCommunityIssuesService.getStats(),
  });

  // Buscar issues
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ["admin-community-issues", page, search, statusFilter, categoryFilter, priorityFilter, activeTab],
    queryFn: () =>
      adminCommunityIssuesService.getAllIssues({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        underReview: activeTab === "review" ? true : undefined,
      }),
  });

  // Buscar issues sob revisão
  const { data: reviewIssues } = useQuery({
    queryKey: ["admin-community-issues-review"],
    queryFn: () => adminCommunityIssuesService.getIssuesUnderReview(),
    enabled: activeTab === "review",
  });

  // Buscar analytics
  const { data: topSupported } = useQuery({
    queryKey: ["admin-community-issues-top-supported"],
    queryFn: () => adminCommunityIssuesService.getTopSupportedIssues(10),
    enabled: activeTab === "analytics",
  });

  const categoryStats = stats?.categories;
  const resolutionRate = stats
    ? {
        total: stats.total,
        resolved: stats.resolvido,
        rate: stats.total > 0 ? Math.round((stats.resolvido / stats.total) * 100) : 0,
      }
    : undefined;

  // Mutations
  const removeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const removed = await adminCommunityIssuesService.removeIssue(id, reason);
      if (!removed) throw new Error("community_issue_remove_failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-stats"] });
      toast.success("Issue removido com sucesso");
      setShowRemoveDialog(false);
      setSelectedIssue(null);
      setRemovalReason("");
    },
    onError: () => {
      toast.error("Erro ao remover issue");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IssueStatus }) => {
      const updated = await adminCommunityIssuesService.updateStatus(id, status);
      if (!updated) throw new Error("community_issue_status_update_failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-stats"] });
      toast.success("Status atualizado");
      setShowStatusDialog(false);
      setSelectedIssue(null);
      setNewStatus("");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const clearReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const cleared = await adminCommunityIssuesService.clearUnderReview(id);
      if (!cleared) throw new Error("community_issue_review_clear_failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-review"] });
      queryClient.invalidateQueries({ queryKey: ["admin-community-issues-stats"] });
      toast.success("Issue aprovado");
    },
    onError: () => {
      toast.error("Erro ao aprovar issue");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          Gestão de Problemas Urbanos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie issues, moderação e resolução de problemas
        </p>
      </div>

      <AdminCommunityIssuesStats stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos os Issues</TabsTrigger>
          <TabsTrigger value="review">
            Sob Revisão
            {stats?.underReview ? (
              <Badge variant="destructive" className="ml-2">
                {stats.underReview}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AdminCommunityIssuesFilters
            search={search}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            priorityFilter={priorityFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onCategoryFilterChange={setCategoryFilter}
            onPriorityFilterChange={setPriorityFilter}
          />
          <AdminCommunityIssuesTable
            issuesData={issuesData}
            isLoading={isLoading}
            page={page}
            isClearingReview={clearReviewMutation.isPending}
            onPageChange={setPage}
            onClearReview={(issueId) => clearReviewMutation.mutate(issueId)}
            onOpenStatusDialog={(issue) => {
              setSelectedIssue(issue);
              setShowStatusDialog(true);
            }}
            onOpenRemoveDialog={(issue) => {
              setSelectedIssue(issue);
              setShowRemoveDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <AdminCommunityIssuesReviewList
            reviewIssues={reviewIssues}
            isClearingReview={clearReviewMutation.isPending}
            onClearReview={(issueId) => clearReviewMutation.mutate(issueId)}
            onOpenRemoveDialog={(issue) => {
              setSelectedIssue(issue);
              setShowRemoveDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AdminCommunityIssuesAnalytics
            resolutionRate={resolutionRate}
            topSupported={topSupported}
            categoryStats={categoryStats}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de Remoção */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Issue</DialogTitle>
            <DialogDescription>
              Informe o motivo da remoção. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da remoção..."
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveDialog(false);
                setSelectedIssue(null);
                setRemovalReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedIssue && removalReason.trim().length >= 3) {
                  removeMutation.mutate({ id: selectedIssue.id, reason: removalReason });
                } else {
                  toast.error("Informe um motivo com pelo menos 3 caracteres");
                }
              }}
              disabled={removeMutation.isPending || removalReason.trim().length < 3}
            >
              Remover Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atualização de Status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>
              Selecione o novo status para este issue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as IssueStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ISSUE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusDialog(false);
                setSelectedIssue(null);
                setNewStatus("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedIssue && newStatus) {
                  updateStatusMutation.mutate({ id: selectedIssue.id, status: newStatus as IssueStatus });
                } else {
                  toast.error("Selecione um status");
                }
              }}
              disabled={updateStatusMutation.isPending || !newStatus}
            >
              Atualizar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

