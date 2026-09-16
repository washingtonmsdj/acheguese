import { useState } from "react";
import {
  BarChart3,
  Copy,
  EyeOff,
  Filter,
  Image,
  Lock,
  MessageCircle,
  Mic,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  useGroupMessageReports,
  useUpdateGroupMessageReportStatus,
} from "@/core/community-groups/hooks/useGroupQueries";
import type { GroupMessageReportStatus } from "@/core/community-groups/types";
import {
  DEFAULT_GROUP_RULES,
  GROUP_CAPABILITY_LABELS,
  getGroupCategory,
} from "@/shared/constants/groupTaxonomy";
import { cn } from "@/shared/utils/cn";

interface GroupInfoPanelGroup {
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  category?: string | null;
  is_private?: boolean | null;
  posts_count?: number | null;
  rules?: string | null;
  media_policy?: string | null;
  posting_policy?: string | null;
  join_policy?: string | null;
  member_visibility?: string | null;
  capabilities?: {
    images?: boolean;
    audio?: boolean;
    polls?: boolean;
    chat?: boolean;
    reactions?: boolean;
    reports?: boolean;
    share_link?: boolean;
  } | null;
  creator?: { name?: string | null } | null;
  created_at: string;
}

interface GroupMessageReportItem {
  id: string;
  message_id: string;
  reason: string;
  details?: string | null;
  status: GroupMessageReportStatus;
  created_at: string;
  message?: {
    content?: string | null;
    message_type?: string | null;
    profile?: { name?: string | null } | null;
  } | null;
  moderation_history?: Array<{ at: string; status: string }> | null;
}

type CapabilityItem = { label: string; icon: LucideIcon };
type ReportFilter =
  | "all"
  | "pending"
  | "reviewing"
  | "resolved"
  | "dismissed";

const REPORT_FILTERS: Array<{ key: ReportFilter; label: string }> = [
  { key: "pending", label: "Pendentes" },
  { key: "reviewing", label: "Em análise" },
  { key: "resolved", label: "Resolvidas" },
  { key: "dismissed", label: "Dispensadas" },
  { key: "all", label: "Todas" },
];

const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  reviewing: "Em análise",
  resolved: "Resolvida",
  dismissed: "Dispensada",
};

export function GrupoDetailInfoPanel({
  groupId,
  group,
  membersCount,
  canModerate,
  onCopyShareLink,
}: {
  groupId?: string;
  group: GroupInfoPanelGroup;
  membersCount: number;
  canModerate: boolean;
  onCopyShareLink: () => void;
}) {
  const [reportFilter, setReportFilter] = useState<ReportFilter>("pending");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const categoryInfo = getGroupCategory(group.category || "geral");
  const { data: messageReports = [] } = useGroupMessageReports(groupId, canModerate);
  const updateReportStatusMutation = useUpdateGroupMessageReportStatus();
  const typedReports = messageReports as GroupMessageReportItem[];
  const pendingReportsCount = typedReports.filter(
    (report) => report.status === "pending",
  ).length;
  const filteredReports = typedReports.filter((report) =>
    reportFilter === "all" ? true : report.status === reportFilter,
  );
  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) || null;
  const ruleLines = (group.rules || DEFAULT_GROUP_RULES.join("\n"))
    .split("\n")
    .map((rule) => rule.trim())
    .filter(Boolean);

  const capabilities = {
    images: group.media_policy !== "text_only" && group.capabilities?.images !== false,
    audio: group.capabilities?.audio !== false,
    polls: group.capabilities?.polls !== false,
    chat: group.capabilities?.chat !== false,
    reports: group.capabilities?.reports !== false,
  };

  const capabilityItems = ([
    capabilities.chat && { label: GROUP_CAPABILITY_LABELS.chat, icon: MessageCircle },
    capabilities.images && { label: GROUP_CAPABILITY_LABELS.images, icon: Image },
    capabilities.audio && { label: GROUP_CAPABILITY_LABELS.audio, icon: Mic },
    capabilities.polls && { label: GROUP_CAPABILITY_LABELS.polls, icon: BarChart3 },
    capabilities.reports && {
      label: GROUP_CAPABILITY_LABELS.reports,
      icon: ShieldCheck,
    },
  ] as Array<CapabilityItem | false>).filter(
    (item): item is CapabilityItem => Boolean(item),
  );

  const handleUpdateReportStatus = async (
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
  ) => {
    if (!groupId) return;
    await updateReportStatusMutation.mutateAsync({ groupId, reportId, status });
  };

  return (
    <div className="space-y-6 px-4 py-6 text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary/10">
          {group.avatar_url ? (
            <img
              src={group.avatar_url}
              alt={`Avatar do grupo ${group.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Users className="h-10 w-10 text-primary" aria-hidden="true" />
          )}
        </div>
        <h2 className="mb-1 text-xl font-bold text-foreground">{group.name}</h2>
        <p className="text-sm text-muted-foreground">
          {group.description || "Sem descrição"}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {capabilityItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              <item.icon className="h-3 w-3 text-primary" aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric value={membersCount} label="Membros" />
        <Metric value={group.posts_count || 0} label="Posts" tone="info" />
      </div>

      <div className="space-y-3">
        <InfoRow label="Categoria" value={categoryInfo.label} />
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-sm text-muted-foreground">Visibilidade</span>
          <span className="flex items-center gap-1 text-sm text-foreground">
            {group.is_private ? (
              <>
                <Lock className="h-3 w-3" aria-hidden="true" /> Privado
              </>
            ) : (
              "Público"
            )}
          </span>
        </div>
        <InfoRow
          label="Entrada"
          value={
            group.join_policy === "approval"
              ? "Por aprovação"
              : group.join_policy === "invite"
                ? "Por convite"
                : "Livre para moradores"
          }
          compact
        />
        <InfoRow
          label="Postagens"
          value={
            group.posting_policy === "admins"
              ? "Somente admins"
              : group.posting_policy === "moderators"
                ? "Admins e moderadores"
                : "Membros"
          }
          compact
        />
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-sm text-muted-foreground">Membros</span>
          <span className="flex min-w-0 items-center gap-1 text-right text-xs text-foreground sm:text-sm">
            {group.member_visibility === "hidden" ? (
              <EyeOff className="h-3 w-3" aria-hidden="true" />
            ) : null}
            {group.member_visibility === "public"
              ? "Lista pública"
              : group.member_visibility === "members"
                ? "Visível para membros"
                : group.member_visibility === "hidden"
                  ? "Oculto"
                  : "Mostra apenas quantidade"}
          </span>
        </div>

        <button
          type="button"
          onClick={onCopyShareLink}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copiar link de compartilhamento
        </button>

        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCog className="h-4 w-4 text-primary" aria-hidden="true" />
            Admins
          </span>
          <span className="text-right text-sm text-foreground">
            Promovidos na aba membros
          </span>
        </div>

        {canModerate ? (
          <ModerationReports
            messageReports={typedReports}
            filteredReports={filteredReports}
            pendingReportsCount={pendingReportsCount}
            reportFilter={reportFilter}
            selectedReport={selectedReport}
            selectedReportId={selectedReportId}
            onFilterChange={(value) => {
              setReportFilter(value);
              setSelectedReportId(null);
            }}
            onSelectReport={setSelectedReportId}
            onUpdateReportStatus={handleUpdateReportStatus}
          />
        ) : null}

        <InfoRow label="Criado por" value={group.creator?.name || "Desconhecido"} />
        <InfoRow
          label="Criado em"
          value={new Date(group.created_at).toLocaleDateString("pt-BR")}
        />
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Regras e moderação</h3>
        </div>
        <ol className="space-y-2">
          {ruleLines.map((rule, index) => (
            <li
              key={`${rule}-${index}`}
              className="flex gap-2 text-sm leading-relaxed text-foreground/85"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">
                {index + 1}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Metric({
  value,
  label,
  tone = "primary",
}: {
  value: number;
  label: string;
  tone?: "primary" | "info";
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-4 text-center">
      <p className={cn("text-2xl font-bold", tone === "info" ? "text-info" : "text-primary")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between py-2", compact && "gap-3")}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-foreground",
          compact ? "min-w-0 text-right text-xs sm:text-sm" : "text-sm",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ModerationReports({
  messageReports,
  filteredReports,
  pendingReportsCount,
  reportFilter,
  selectedReport,
  selectedReportId,
  onFilterChange,
  onSelectReport,
  onUpdateReportStatus,
}: {
  messageReports: GroupMessageReportItem[];
  filteredReports: GroupMessageReportItem[];
  pendingReportsCount: number;
  reportFilter: ReportFilter;
  selectedReport: GroupMessageReportItem | null;
  selectedReportId: string | null;
  onFilterChange: (value: ReportFilter) => void;
  onSelectReport: (value: string) => void;
  onUpdateReportStatus: (
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
  ) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2">
        <span className="flex items-center gap-2 text-sm text-warning">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Fila de moderação
        </span>
        <span className="text-right text-sm text-warning">
          {pendingReportsCount} denúncia(s) pendente(s)
        </span>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Denúncias recentes</p>
          <span className="text-xs text-muted-foreground">
            {messageReports.length} no total
          </span>
        </div>

        <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {REPORT_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key)}
              aria-pressed={reportFilter === filter.key}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                reportFilter === filter.key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredReports.slice(0, 8).map((report) => (
            <div
              key={report.id}
              className={cn(
                "rounded-lg border bg-background p-2",
                selectedReportId === report.id ? "border-primary/40" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-foreground">{report.reason}</p>
                <span className="shrink-0 text-[10px] uppercase text-warning">
                  {REPORT_STATUS_LABELS[report.status] || report.status}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(report.created_at).toLocaleString("pt-BR")}
              </p>
              <button
                type="button"
                onClick={() => onSelectReport(report.id)}
                className="mt-1 text-[10px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ver detalhe
              </button>
              <div className="mt-2 flex flex-wrap gap-1">
                <ReportAction
                  label="Em análise"
                  onClick={() => onUpdateReportStatus(report.id, "reviewing")}
                />
                <ReportAction
                  label="Resolver"
                  tone="success"
                  onClick={() => onUpdateReportStatus(report.id, "resolved")}
                />
                <ReportAction
                  label="Dispensar"
                  tone="muted"
                  onClick={() => onUpdateReportStatus(report.id, "dismissed")}
                />
              </div>
            </div>
          ))}
          {filteredReports.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem denúncias no momento.</p>
          ) : null}
        </div>

        {selectedReport ? <ReportDetail report={selectedReport} /> : null}
      </div>
    </>
  );
}

function ReportAction({
  label,
  tone = "default",
  onClick,
}: {
  label: string;
  tone?: "default" | "success" | "muted";
  onClick: () => void;
}) {
  const className =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "muted"
        ? "border-border bg-muted text-muted-foreground"
        : "border-border bg-background text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {label}
    </button>
  );
}

function ReportDetail({ report }: { report: GroupMessageReportItem }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Detalhe da denúncia
      </div>
      <p className="text-xs text-foreground">{report.reason}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        ID da mensagem: {report.message_id}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Criada em {new Date(report.created_at).toLocaleString("pt-BR")}
      </p>
      {report.details ? (
        <p className="mt-1 text-[11px] text-foreground/85">
          Detalhes: {report.details}
        </p>
      ) : null}

      {report.message ? (
        <div className="mt-2 rounded-md border border-border bg-muted/40 p-2">
          <p className="text-[10px] uppercase text-muted-foreground">
            Mensagem original
          </p>
          <p className="mt-1 text-xs text-foreground">
            {report.message.content || "(sem texto)"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Autor: {report.message.profile?.name || "Usuário"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Tipo: {report.message.message_type || "text"}
          </p>
        </div>
      ) : null}

      <div className="mt-2">
        <p className="text-[10px] uppercase text-muted-foreground">
          Histórico de moderação
        </p>
        <div className="mt-1 space-y-1">
          {(report.moderation_history || []).length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Sem ações registradas.
            </p>
          ) : (
            (report.moderation_history || []).map((event, index) => (
              <p
                key={`${event.at}-${index}`}
                className="text-[11px] text-foreground/80"
              >
                {new Date(event.at).toLocaleString("pt-BR")} - {event.status}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
