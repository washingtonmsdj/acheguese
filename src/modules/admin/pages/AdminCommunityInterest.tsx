/**
 * AdminCommunityInterest
 *
 * Painel administrativo da waitlist de bairros em `coming_soon`.
 * SSOT: consome `adminCommunityInterestService` e usa a baseline visual do admin.
 *
 * Depende de `community_interest_registrations` — migração pendente em
 * `docs/migrations-pending/20260720120000_create_community_interest_registrations.sql`.
 * Enquanto a tabela não existir, a page renderiza estados vazios/erro amigáveis.
 */

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  CalendarDays,
  Download,
  MailCheck,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminCommunityInterestService,
  type AdminCommunityInterestFilters,
  type CommunityInterestAdminStatus,
  type CommunityInterestRegistration,
  type CommunityInterestRole,
} from "@/core/admin";
import {
  AdminDataState,
  AdminFiltersBar,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTable,
  type FilterOption,
} from "@/core/admin/components";
import { useSessionContext } from "@/core/session";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const PAGE_SIZE = 25;

const ROLE_LABELS: Record<CommunityInterestRole, string> = {
  morador: "Morador",
  comerciante: "Comerciante",
  prestador: "Prestador",
  visitante: "Visitante",
  outro: "Outro",
};

const ROLE_FILTER_OPTIONS: FilterOption = {
  label: "Vínculo",
  value: "role",
  placeholder: "Vínculo",
  options: (Object.entries(ROLE_LABELS) as [CommunityInterestRole, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
};

const UPDATES_FILTER_OPTIONS: FilterOption = {
  label: "Atualizações",
  value: "wantsUpdates",
  placeholder: "Aceita novidades",
  options: [
    { value: "true", label: "Aceita novidades" },
    { value: "false", label: "Não aceita" },
  ],
};

const STATUS_LABELS: Record<CommunityInterestAdminStatus, string> = {
  new: "Novo",
  reviewed: "Revisado",
  contacted: "Contatado",
  converted: "Convertido",
  discarded: "Descartado",
};

const STATUS_BADGE: Record<CommunityInterestAdminStatus, string> = {
  new: "bg-slate-100 text-slate-800",
  reviewed: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  converted: "bg-emerald-100 text-emerald-800",
  discarded: "bg-rose-100 text-rose-800",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",;\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: CommunityInterestRegistration[]): string {
  const headers = [
    "id",
    "created_at",
    "updated_at",
    "full_name",
    "email",
    "phone",
    "role",
    "community_id",
    "community_slug",
    "territory_path",
    "wants_updates",
    "turnstile_verified",
    "admin_status",
    "reviewed_at",
    "reviewed_by",
    "user_id",
    "source",
    "message",
    "admin_notes",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.created_at,
        row.updated_at,
        row.full_name,
        row.email,
        row.phone ?? "",
        row.role,
        row.community_id ?? "",
        row.community_slug ?? "",
        row.territory_path ?? "",
        row.wants_updates ? "sim" : "nao",
        row.turnstile_verified ? "sim" : "nao",
        row.admin_status ?? "new",
        row.reviewed_at ?? "",
        row.reviewed_by ?? "",
        row.user_id ?? "",
        row.source ?? "",
        (row.message ?? "").replace(/\s+/g, " ").slice(0, 500),
        (row.admin_notes ?? "").replace(/\s+/g, " ").slice(0, 500),
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\ufeff${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminCommunityInterest() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [wantsUpdates, setWantsUpdates] = useState<string>("");
  const [communitySlug, setCommunitySlug] = useState("");
  const [territoryPath, setTerritoryPath] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPage, setIsExportingPage] = useState(false);
  const [selected, setSelected] = useState<CommunityInterestRegistration | null>(null);
  const [editStatus, setEditStatus] = useState<CommunityInterestAdminStatus>("new");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useSessionContext();

  const filters = useMemo<AdminCommunityInterestFilters>(
    () => ({
      search: search.trim() || undefined,
      role: (role || undefined) as CommunityInterestRole | undefined,
      wantsUpdates:
        wantsUpdates === "true"
          ? true
          : wantsUpdates === "false"
            ? false
            : undefined,
      communitySlug: communitySlug.trim() || undefined,
      territoryPath: territoryPath.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [search, role, wantsUpdates, communitySlug, territoryPath, fromDate, toDate],
  );

  const listQuery = useQuery({
    queryKey: ["admin-community-interest", { ...filters, page }],
    queryFn: () =>
      adminCommunityInterestService.list({ ...filters, page, pageSize: PAGE_SIZE }),
  });

  const statsQuery = useQuery({
    queryKey: ["admin-community-interest-stats", filters],
    queryFn: () => adminCommunityInterestService.getStats(filters),
  });

  const breakdownQuery = useQuery({
    queryKey: ["admin-community-interest-breakdown", filters],
    queryFn: () => adminCommunityInterestService.getCommunityBreakdown(filters, 10),
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = statsQuery.data;
  const breakdown = breakdownQuery.data ?? [];

  const handleClearFilters = () => {
    setSearch("");
    setRole("");
    setWantsUpdates("");
    setCommunitySlug("");
    setTerritoryPath("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === "role") setRole(value);
    if (key === "wantsUpdates") setWantsUpdates(value);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const rows = await adminCommunityInterestService.exportAll(filters, 5000);
      if (rows.length === 0) {
        toast.info("Nenhum registro para exportar com os filtros atuais.");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`interesse-comunidade-${stamp}.csv`, toCsv(rows));
      toast.success(`Exportados ${rows.length} registros`);
    } catch {
      toast.error("Falha ao gerar CSV de exportação");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPage = async () => {
    if (items.length === 0) {
      toast.info("Sem registros na página atual.");
      return;
    }
    try {
      setIsExportingPage(true);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(
        `interesse-comunidade-pagina-${page}-${stamp}.csv`,
        toCsv(items),
      );
      toast.success(`Exportados ${items.length} registros da página ${page}`);
    } finally {
      setIsExportingPage(false);
    }
  };

  const openDetail = (row: CommunityInterestRegistration) => {
    setSelected(row);
    setEditStatus((row.admin_status ?? "new") as CommunityInterestAdminStatus);
    setEditNotes(row.admin_notes ?? "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    const res = await adminCommunityInterestService.updateRegistration(
      selected.id,
      { admin_status: editStatus, admin_notes: editNotes || null },
      user?.id ?? null,
    );
    setIsSaving(false);
    if (!res.ok) {
      toast.error(`Falha ao salvar: ${res.error ?? "erro"}`);
      return;
    }
    toast.success("Registro atualizado");
    setSelected(null);
    queryClient.invalidateQueries({ queryKey: ["admin-community-interest"] });
    queryClient.invalidateQueries({ queryKey: ["admin-community-interest-stats"] });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Interesse da Comunidade"
        description="Waitlist dos bairros em coming_soon. Filtre, analise a distribuição por território e exporte a base para prospecção."
        icon={MailCheck}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportPage}
              disabled={isExportingPage || items.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExportingPage ? "Gerando..." : "Exportar página"}
            </Button>
            <Button onClick={handleExport} disabled={isExporting || total === 0}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Gerando..." : "Exportar tudo"}
            </Button>
          </div>
        }
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Total de interessados"
          value={stats?.total ?? 0}
          icon={Users}
          loading={statsQuery.isLoading}
          subtitle="Considerando os filtros aplicados"
        />
        <AdminStatsCard
          title="Últimos 7 dias"
          value={stats?.last7d ?? 0}
          icon={CalendarDays}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Últimos 30 dias"
          value={stats?.last30d ?? 0}
          icon={CalendarDays}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Aceitam novidades"
          value={stats?.wantsUpdates ?? 0}
          icon={BellRing}
          loading={statsQuery.isLoading}
          subtitle={
            stats && stats.total > 0
              ? `${Math.round((stats.wantsUpdates / stats.total) * 100)}% da base filtrada`
              : undefined
          }
        />
      </AdminStatsGrid>

      <AdminFiltersBar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar por nome, email ou mensagem"
        filters={[ROLE_FILTER_OPTIONS, UPDATES_FILTER_OPTIONS]}
        filterValues={{ role, wantsUpdates }}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <AdminSectionCard
        title="Recorte territorial"
        description="Filtre por comunidade (slug) ou prefixo do território (ex.: BR/BA/Salvador/Barra)."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="community-slug">Community slug</Label>
            <Input
              id="community-slug"
              value={communitySlug}
              onChange={(event) => {
                setCommunitySlug(event.target.value);
                setPage(1);
              }}
              placeholder="ex.: barra-salvador"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="territory-path">Território (prefixo)</Label>
            <Input
              id="territory-path"
              value={territoryPath}
              onChange={(event) => {
                setTerritoryPath(event.target.value);
                setPage(1);
              }}
              placeholder="BR/BA/Salvador"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="from-date">De</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to-date">Até</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Top comunidades"
        description="Distribuição de interessados por comunidade nos filtros atuais (amostra de até 2.000 registros)."
        icon={MapPin}
      >
        <AdminDataState
          loading={breakdownQuery.isLoading}
          isEmpty={breakdown.length === 0}
          emptyTitle="Sem distribuição para exibir"
          emptyDescription="Ajuste os filtros ou aguarde novos cadastros."
        >
          <div className="grid gap-2 md:grid-cols-2">
            {breakdown.map((row) => (
              <div
                key={`${row.community_slug ?? ""}-${row.territory_path ?? ""}`}
                className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {row.community_slug ?? "(sem slug)"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.territory_path ?? "sem território"}
                  </p>
                </div>
                <Badge variant="secondary">{row.count}</Badge>
              </div>
            ))}
          </div>
        </AdminDataState>
      </AdminSectionCard>

      <AdminSectionCard
        title="Registros de interesse"
        description={`${total} registro(s) com os filtros atuais.`}
      >
        <AdminDataState
          loading={listQuery.isLoading}
          isEmpty={!listQuery.isLoading && items.length === 0}
          emptyTitle="Nenhum registro encontrado"
          emptyDescription="Ajuste os filtros ou aguarde novos cadastros vindos das páginas de bairros em coming_soon."
        >
          <AdminTable
            footer={
              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
              />
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Comunidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verif.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => {
                const status = (row.admin_status ?? "new") as CommunityInterestAdminStatus;
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(row)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.full_name}</div>
                      {row.message ? (
                        <div className="mt-0.5 line-clamp-2 max-w-[320px] text-xs text-muted-foreground">
                          {row.message}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{row.email}</div>
                      {row.phone ? (
                        <div className="text-xs text-muted-foreground">{row.phone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[row.role] ?? row.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{row.community_slug ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.territory_path ?? "sem território"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_BADGE[status]} hover:opacity-90`}>
                        {STATUS_LABELS[status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.turnstile_verified ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetail(row);
                        }}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </AdminTable>
        </AdminDataState>
      </AdminSectionCard>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do cadastro</DialogTitle>
            <DialogDescription>
              Consulte metadados completos e atualize o status de triagem.
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Nome</div>
                  <div className="font-medium">{selected.full_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vínculo</div>
                  <div>{ROLE_LABELS[selected.role] ?? selected.role}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">E-mail</div>
                  <div className="break-all">{selected.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Telefone</div>
                  <div>{selected.phone ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Comunidade</div>
                  <div>{selected.community_slug ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {selected.territory_path ?? "sem território"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Turnstile</div>
                  <div>{selected.turnstile_verified ? "Verificado" : "Não verificado"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Criado</div>
                  <div>{formatDate(selected.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Atualizado</div>
                  <div>{formatDate(selected.updated_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Revisado em</div>
                  <div>{selected.reviewed_at ? formatDate(selected.reviewed_at) : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Aceita novidades</div>
                  <div>{selected.wants_updates ? "Sim" : "Não"}</div>
                </div>
              </div>

              {selected.message ? (
                <div>
                  <div className="text-xs text-muted-foreground">Mensagem</div>
                  <div className="rounded border bg-muted/30 p-2 text-sm whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Status de triagem</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(value) =>
                      setEditStatus(value as CommunityInterestAdminStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as CommunityInterestAdminStatus[]).map(
                        (key) => (
                          <SelectItem key={key} value={key}>
                            {STATUS_LABELS[key]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="admin-notes">Notas internas</Label>
                  <Textarea
                    id="admin-notes"
                    value={editNotes}
                    onChange={(event) => setEditNotes(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Contexto de contato, próximos passos, etc."
                  />
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)} disabled={isSaving}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
