import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Search,
  Shield,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  AdCampaignAdminService,
  type AdminAdCampaignSummary,
  type AdCampaignBillingStatus,
  type AdCampaignReviewStatus,
  type AdCampaignStatus,
  type AdPlacementKey,
} from "@/core/business/promotions";
import { AdminPagination, AdminStatsCard } from "@/core/admin/components";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { formatBrl } from "@/shared/utils/currency";

const REVIEW_LABELS: Record<AdCampaignReviewStatus, string> = {
  draft: "Rascunho",
  pending: "Em revisao",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

const BILLING_LABELS: Record<AdCampaignBillingStatus, string> = {
  unpaid: "Aguardando",
  authorized: "Autorizado",
  paid: "Pago",
  refunded: "Reembolsado",
  failed: "Falhou",
};

const STATUS_LABELS: Record<AdCampaignStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
};

const PLACEMENT_LABELS: Record<AdPlacementKey, string> = {
  sidebar_widget: "Anuncios locais",
  feed_sponsored: "Feed patrocinado",
  banner_top: "Banner superior",
  banner_bottom: "Banner inferior",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function isActivationReady(campaign: AdminAdCampaignSummary): boolean {
  return (
    campaign.review_status === "approved" &&
    (campaign.billing_status === "authorized" || campaign.billing_status === "paid")
  );
}

function reviewBadge(status: AdCampaignReviewStatus) {
  if (status === "approved") return <Badge>{REVIEW_LABELS[status]}</Badge>;
  if (status === "rejected") return <Badge variant="destructive">{REVIEW_LABELS[status]}</Badge>;
  return <Badge variant="secondary">{REVIEW_LABELS[status]}</Badge>;
}

function billingBadge(status: AdCampaignBillingStatus) {
  if (status === "paid" || status === "authorized") {
    return <Badge>{BILLING_LABELS[status]}</Badge>;
  }
  if (status === "failed" || status === "refunded") {
    return <Badge variant="destructive">{BILLING_LABELS[status]}</Badge>;
  }
  return <Badge variant="outline">{BILLING_LABELS[status]}</Badge>;
}

function statusBadge(status: AdCampaignStatus) {
  if (status === "active") return <Badge>{STATUS_LABELS[status]}</Badge>;
  if (status === "ended") return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>;
  return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>;
}

type ReviewFilter = AdCampaignReviewStatus | "all";
type BillingFilter = AdCampaignBillingStatus | "all";
type StatusFilter = AdCampaignStatus | "all";
type PlacementFilter = AdPlacementKey | "all";

export default function AdminAnuncios() {
  const { canModerate, isChecking } = useAdminGuard();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewFilter>("pending");
  const [billingStatus, setBillingStatus] = useState<BillingFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [placementKey, setPlacementKey] = useState<PlacementFilter>("all");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [priorityDrafts, setPriorityDrafts] = useState<Record<string, string>>({});

  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      search,
      reviewStatus,
      billingStatus,
      status,
      placementKey,
    }),
    [billingStatus, page, placementKey, reviewStatus, search, status],
  );

  const statsQuery = useQuery({
    queryKey: ["admin-ad-campaign-stats"],
    queryFn: () => AdCampaignAdminService.getStats(),
    enabled: Boolean(canModerate),
  });

  const campaignsQuery = useQuery({
    queryKey: ["admin-ad-campaigns", listParams],
    queryFn: () => AdCampaignAdminService.listCampaigns(listParams),
    enabled: Boolean(canModerate),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      campaignId,
      payload,
    }: {
      campaignId: string;
      payload: Parameters<typeof AdCampaignAdminService.updateCampaignState>[1];
    }) => AdCampaignAdminService.updateCampaignState(campaignId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-ad-campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-ad-campaign-stats"] }),
      ]);
      toast.success("Anuncio atualizado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar anuncio.");
    },
  });

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
          <p className="text-muted-foreground">Apenas administradores podem acessar esta pagina.</p>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const campaigns = campaignsQuery.data?.data ?? [];

  function updateCampaign(
    campaignId: string,
    payload: Parameters<typeof AdCampaignAdminService.updateCampaignState>[1],
  ) {
    updateMutation.mutate({ campaignId, payload });
  }

  function rejectCampaign(campaignId: string) {
    updateCampaign(campaignId, {
      reviewStatus: "rejected",
      rejectionReason: rejectionReasons[campaignId],
    });
  }

  function savePriority(campaign: AdminAdCampaignSummary) {
    const raw = priorityDrafts[campaign.id] ?? String(campaign.priority);
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1000) {
      toast.error("Prioridade deve ser um numero inteiro entre 0 e 1000.");
      return;
    }
    updateCampaign(campaign.id, { priority: parsed });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2">
          <Megaphone className="h-8 w-8" />
          Anuncios patrocinados
        </h1>
        <p className="text-muted-foreground mt-1">
          Revise campanhas, valide billing, controle ativacao e prioridade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Total"
          value={stats?.total ?? 0}
          subtitle={`${stats?.pendingReview ?? 0} em revisao`}
          icon={Megaphone}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Ativos"
          value={stats?.active ?? 0}
          subtitle={`${stats?.approved ?? 0} aprovados`}
          icon={PlayCircle}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Billing"
          value={stats?.paidOrAuthorized ?? 0}
          subtitle={`${stats?.awaitingBilling ?? 0} aguardando`}
          icon={WalletCards}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Orcamento"
          value={formatBrl(stats?.plannedBudget ?? 0)}
          subtitle={`${formatBrl(stats?.spentBudget ?? 0)} gasto`}
          icon={Clock}
          loading={statsQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila operacional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_repeat(4,180px)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
                placeholder="Buscar anunciante, titulo ou descricao..."
              />
            </div>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={reviewStatus}
              onChange={(event) => {
                setReviewStatus(event.target.value as ReviewFilter);
                setPage(1);
              }}
            >
              <option value="all">Todas revisoes</option>
              {Object.entries(REVIEW_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={billingStatus}
              onChange={(event) => {
                setBillingStatus(event.target.value as BillingFilter);
                setPage(1);
              }}
            >
              <option value="all">Todos billings</option>
              {Object.entries(BILLING_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">Todos status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={placementKey}
              onChange={(event) => {
                setPlacementKey(event.target.value as PlacementFilter);
                setPage(1);
              }}
            >
              <option value="all">Todas posicoes</option>
              {Object.entries(PLACEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Estados</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Operacao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Carregando anuncios...
                  </TableCell>
                </TableRow>
              )}
              {!campaignsQuery.isLoading && campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma campanha encontrada.
                  </TableCell>
                </TableRow>
              )}
              {campaigns.map((campaign) => {
                const rejectReason = rejectionReasons[campaign.id] ?? "";
                const priorityValue = priorityDrafts[campaign.id] ?? String(campaign.priority);
                const canActivate = isActivationReady(campaign);

                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="min-w-[280px]">
                      <div className="space-y-1">
                        <p className="font-medium">{campaign.title}</p>
                        <p className="text-sm text-muted-foreground">{campaign.advertiser_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>
                        <Badge variant="outline">{PLACEMENT_LABELS[campaign.placement_key]}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {reviewBadge(campaign.review_status)}
                        {billingBadge(campaign.billing_status)}
                        {statusBadge(campaign.status)}
                      </div>
                      {campaign.rejection_reason && (
                        <p className="mt-2 max-w-xs text-xs text-destructive">
                          {campaign.rejection_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(campaign.starts_at)}</p>
                        <p className="text-muted-foreground">{formatDate(campaign.ends_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[150px] gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={1000}
                          value={priorityValue}
                          onChange={(event) =>
                            setPriorityDrafts((current) => ({
                              ...current,
                              [campaign.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateMutation.isPending}
                          onClick={() => savePriority(campaign)}
                        >
                          Salvar
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateCampaign(campaign.id, { reviewStatus: "approved" })
                            }
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateCampaign(campaign.id, { billingStatus: "authorized" })
                            }
                          >
                            <WalletCards className="mr-1 h-4 w-4" />
                            Autorizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateMutation.isPending}
                            onClick={() => updateCampaign(campaign.id, { billingStatus: "paid" })}
                          >
                            Pago
                          </Button>
                          <Button
                            size="sm"
                            disabled={!canActivate || updateMutation.isPending}
                            onClick={() => updateCampaign(campaign.id, { status: "active" })}
                          >
                            <PlayCircle className="mr-1 h-4 w-4" />
                            Ativar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateMutation.isPending}
                            onClick={() => updateCampaign(campaign.id, { status: "paused" })}
                          >
                            <PauseCircle className="mr-1 h-4 w-4" />
                            Pausar
                          </Button>
                        </div>

                        <div className="grid w-full max-w-xl gap-2 md:grid-cols-[1fr_auto]">
                          <Input
                            value={rejectReason}
                            maxLength={500}
                            placeholder="Motivo para rejeitar"
                            onChange={(event) =>
                              setRejectionReasons((current) => ({
                                ...current,
                                [campaign.id]: event.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updateMutation.isPending || rejectReason.trim().length < 3}
                            onClick={() => rejectCampaign(campaign.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {campaignsQuery.data && (
            <AdminPagination
              currentPage={campaignsQuery.data.page}
              totalPages={campaignsQuery.data.totalPages}
              totalItems={campaignsQuery.data.count}
              itemsPerPage={campaignsQuery.data.limit}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
