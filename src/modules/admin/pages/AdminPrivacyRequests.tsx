import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  adminPrivacyRequestsService,
  type AdminPrivacyRequestDetail,
  type PrivacyRequestStatus,
  type PrivacyRequestType,
} from "@/core/admin";
import {
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
} from "@/core/admin/components";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const PAGE_SIZE = 25;
const ALL_FILTER = "all";

const STATUS_LABELS: Record<PrivacyRequestStatus, string> = {
  received: "Recebido",
  in_review: "Em análise",
  waiting_for_requester: "Aguardando titular",
  completed: "Concluído",
  denied: "Indeferido",
  cancelled: "Cancelado",
};

const STATUS_BADGES: Record<PrivacyRequestStatus, string> = {
  received: "bg-blue-100 text-blue-800",
  in_review: "bg-amber-100 text-amber-800",
  waiting_for_requester: "bg-violet-100 text-violet-800",
  completed: "bg-emerald-100 text-emerald-800",
  denied: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-700",
};

const TYPE_LABELS: Record<PrivacyRequestType, string> = {
  access: "Acesso aos dados",
  correction: "Correção",
  anonymization: "Anonimização",
  portability: "Portabilidade",
  deletion: "Eliminação",
  information: "Informações",
  consent_revocation: "Revogação de consentimento",
  automated_decision: "Decisão automatizada",
  violation_report: "Relato de violação",
  other: "Outro",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [PrivacyRequestStatus, string][];
const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [PrivacyRequestType, string][];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function protocolLabel(requestId: string): string {
  return `#${requestId.slice(0, 8).toUpperCase()}`;
}

function nextStatuses(
  status: PrivacyRequestStatus,
): Exclude<PrivacyRequestStatus, "received">[] {
  if (status === "received") return ["in_review", "cancelled"];
  if (status === "in_review") {
    return ["waiting_for_requester", "completed", "denied", "cancelled"];
  }
  if (status === "waiting_for_requester") {
    return ["in_review", "completed", "denied", "cancelled"];
  }
  return [];
}

export default function AdminPrivacyRequests() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const queryClient = useQueryClient();

  const filters = useMemo(
    () => ({
      status:
        statusFilter === ALL_FILTER
          ? null
          : (statusFilter as PrivacyRequestStatus),
      requestType:
        typeFilter === ALL_FILTER ? null : (typeFilter as PrivacyRequestType),
      page,
      pageSize: PAGE_SIZE,
    }),
    [page, statusFilter, typeFilter],
  );

  const listQuery = useQuery({
    queryKey: ["admin-privacy-requests", filters],
    queryFn: () => adminPrivacyRequestsService.listRequests(filters),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-privacy-request", selectedId],
    queryFn: () => adminPrivacyRequestsService.getRequest(selectedId!),
    enabled: Boolean(selectedId),
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const detail = detailQuery.data ?? null;
  const availableTransitions = detail ? nextStatuses(detail.status) : [];

  useEffect(() => {
    if (!listQuery.isFetching && page > totalPages) {
      setPage(totalPages);
    }
  }, [listQuery.isFetching, page, totalPages]);

  const closeDetail = () => {
    const requestId = selectedId;
    setSelectedId(null);
    setNextStatus("");
    if (requestId) {
      queryClient.removeQueries({
        queryKey: ["admin-privacy-request", requestId],
        exact: true,
      });
    }
  };

  const openDetail = (requestId: string) => {
    setNextStatus("");
    setSelectedId(requestId);
  };

  const handleTransition = async () => {
    if (!detail || !nextStatus) return;
    setIsTransitioning(true);
    try {
      await adminPrivacyRequestsService.transitionRequest(
        detail.id,
        nextStatus as Exclude<PrivacyRequestStatus, "received">,
      );
      toast.success("Status da solicitação atualizado");
      setNextStatus("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-privacy-requests"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin-privacy-request", detail.id],
        }),
      ]);
    } catch {
      toast.error("Não foi possível atualizar a solicitação");
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Privacidade e LGPD"
        description="Fila protegida de solicitações de titulares. Identificadores e conteúdo completo só são carregados ao abrir um pedido específico."
        icon={ShieldCheck}
      />

      <AdminSectionCard
        title="Solicitações de titulares"
        description="Filtre por situação ou direito exercido. A listagem usa apenas metadados de triagem e o navegador não possui acesso direto ao ledger de privacidade."
        icon={LockKeyhole}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Todas as situações</SelectItem>
                {STATUS_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Tipo de solicitação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Todos os tipos</SelectItem>
                {TYPE_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {listQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando solicitações…
          </div>
        ) : listQuery.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível carregar a fila de privacidade.
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium">Nenhuma solicitação encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A fila está vazia para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Direito solicitado</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Recebido em</TableHead>
                  <TableHead>Conta vinculada</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {protocolLabel(item.id)}
                    </TableCell>
                    <TableCell>{TYPE_LABELS[item.request_type]}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGES[item.status]} variant="secondary">
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.submitted_at)}
                    </TableCell>
                    <TableCell>{item.linked_user ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(item.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Analisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      </AdminSectionCard>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitação de privacidade</DialogTitle>
            <DialogDescription>
              Dados sensíveis deste pedido são exibidos somente nesta análise individual e removidos do cache ao fechar.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Carregando pedido…
            </div>
          ) : detailQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Não foi possível abrir esta solicitação.
            </div>
          ) : detail ? (
            <RequestDetail detail={detail} />
          ) : null}

          {detail && availableTransitions.length > 0 ? (
            <DialogFooter className="sm:items-end">
              <div className="w-full sm:w-auto sm:min-w-[260px]">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Próxima situação
                </p>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransitions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleTransition}
                disabled={!nextStatus || isTransitioning}
              >
                {isTransitioning ? "Atualizando…" : "Atualizar status"}
              </Button>
            </DialogFooter>
          ) : detail ? (
            <DialogFooter>
              <p className="text-sm text-muted-foreground">
                Esta solicitação está em estado final e não pode ser reaberta por este fluxo.
              </p>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestDetail({ detail }: { detail: AdminPrivacyRequestDetail }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Titular</p>
          <p className="font-medium">{detail.requester_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">E-mail</p>
          <p className="break-all font-medium">{detail.requester_email}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Direito solicitado</p>
          <p className="font-medium">{TYPE_LABELS[detail.request_type]}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Situação</p>
          <Badge className={STATUS_BADGES[detail.status]} variant="secondary">
            {STATUS_LABELS[detail.status]}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recebido em</p>
          <p>{formatDate(detail.submitted_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conta vinculada</p>
          <p>{detail.user_id ? "Sim" : "Não"}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Assunto</p>
        <div className="rounded-lg border p-3 font-medium">{detail.subject}</div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Mensagem</p>
        <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border p-3 leading-relaxed">
          {detail.message}
        </div>
      </div>

      {detail.resolved_at ? (
        <p className="text-xs text-muted-foreground">
          Finalizado em {formatDate(detail.resolved_at)}
        </p>
      ) : null}
    </div>
  );
}
