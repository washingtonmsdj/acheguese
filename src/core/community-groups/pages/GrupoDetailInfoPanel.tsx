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
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_GROUP_RULES,
  GROUP_CAPABILITY_LABELS,
  getGroupCategory,
} from "@/shared/constants/groupTaxonomy";
import {
  useGroupMessageReports,
  useUpdateGroupMessageReportStatus,
} from "@/core/community-groups/hooks/useGroupQueries";
import type { GroupMessageReportStatus } from "@/core/community-groups/types";
import { useState } from "react";
import { getRequiredRecordValue } from "@/shared/utils/recordLookup";

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
  const [reportFilter, setReportFilter] = useState<
    "all" | "pending" | "reviewing" | "resolved" | "dismissed"
  >("pending");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const categoryInfo = getGroupCategory(group.category || "geral");
  const { data: messageReports = [] } = useGroupMessageReports(groupId, canModerate);
  const updateReportStatusMutation = useUpdateGroupMessageReportStatus();
  const pendingReportsCount = messageReports.filter((report) => report.status === "pending").length;
  const filteredReports = (messageReports as GroupMessageReportItem[]).filter((report) =>
    reportFilter === "all" ? true : report.status === reportFilter,
  );
  const selectedReport = filteredReports.find((report) => report.id === selectedReportId) || null;
  const ruleLines = (group.rules || DEFAULT_GROUP_RULES.join("\n"))
    .split("\n")
    .map((rule) => rule.trim())
    .filter(Boolean);
  const capabilities = {
    text: true,
    images: group.media_policy !== "text_only" && group.capabilities?.images !== false,
    audio: group.capabilities?.audio !== false,
    polls: group.capabilities?.polls !== false,
    chat: group.capabilities?.chat !== false,
    reactions: group.capabilities?.reactions !== false,
    reports: group.capabilities?.reports !== false,
    share_link: group.capabilities?.share_link !== false,
  };
  const capabilityItems = ([
    capabilities.chat && { label: GROUP_CAPABILITY_LABELS.chat, icon: MessageCircle },
    capabilities.images && { label: GROUP_CAPABILITY_LABELS.images, icon: Image },
    capabilities.audio && { label: GROUP_CAPABILITY_LABELS.audio, icon: Mic },
    capabilities.polls && { label: GROUP_CAPABILITY_LABELS.polls, icon: BarChart3 },
    capabilities.reports && { label: GROUP_CAPABILITY_LABELS.reports, icon: ShieldCheck },
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
    <div className="px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/10 flex items-center justify-center text-4xl mx-auto mb-4 border-2 border-teal-400/20">
          {group.avatar_url ? (
            <img
              src={group.avatar_url}
              alt={`Avatar do grupo ${group.name}`}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            <Users className="h-10 w-10 text-teal-200" aria-hidden="true" />
          )}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{group.name}</h2>
        <p className="text-sm text-gray-400">{group.description || "Sem descrição"}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {capabilityItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300"
            >
              <item.icon className="h-3 w-3 text-teal-300" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">{membersCount}</p>
          <p className="text-xs text-gray-400">Membros</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{group.posts_count || 0}</p>
          <p className="text-xs text-gray-400">Posts</p>
        </div>
      </div>

      <div className="space-y-3">
        <InfoRow label="Categoria" value={categoryInfo.label} />
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-400">Visibilidade</span>
          <span className="text-sm text-white flex items-center gap-1">
            {group.is_private ? (
              <>
                <Lock className="w-3 h-3" /> Privado
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
          <span className="text-sm text-gray-400">Membros</span>
          <span className="min-w-0 flex items-center gap-1 text-right text-xs sm:text-sm text-white">
            {group.member_visibility === "hidden" ? <EyeOff className="h-3 w-3" /> : null}
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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-sm font-semibold text-teal-200"
        >
          <Copy className="h-4 w-4" />
          Copiar link de compartilhamento
        </button>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <UserCog className="h-4 w-4 text-teal-300" />
            Admins
          </span>
          <span className="text-right text-sm text-white">Promovidos na aba membros</span>
        </div>
        {canModerate ? (
          <ModerationReports
            messageReports={messageReports as GroupMessageReportItem[]}
            filteredReports={filteredReports}
            pendingReportsCount={pendingReportsCount}
            reportFilter={reportFilter}
            selectedReport={selectedReport}
            selectedReportId={selectedReportId}
            onFilterChange={setReportFilter}
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-300" />
          <h3 className="text-sm font-semibold text-white">Regras e moderação</h3>
        </div>
        <ol className="space-y-2">
          {ruleLines.map((rule, index) => (
            <li key={`${rule}-${index}`} className="flex gap-2 text-sm leading-relaxed text-gray-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[11px] text-teal-300">
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
    <div className={`flex items-center justify-between ${compact ? "gap-3" : ""} py-2`}>
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`${compact ? "min-w-0 text-right text-xs sm:text-sm" : "text-sm"} text-white`}>
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
  reportFilter: "all" | "pending" | "reviewing" | "resolved" | "dismissed";
  selectedReport: GroupMessageReportItem | null;
  selectedReportId: string | null;
  onFilterChange: (value: "all" | "pending" | "reviewing" | "resolved" | "dismissed") => void;
  onSelectReport: (value: string) => void;
  onUpdateReportStatus: (
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
  ) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2">
        <span className="flex items-center gap-2 text-sm text-amber-200">
          <ShieldCheck className="h-4 w-4" />
          Fila de moderação
        </span>
        <span className="text-right text-sm text-amber-100">
          {pendingReportsCount} denúncia(s) pendente(s)
        </span>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Denúncias recentes</p>
          <span className="text-xs text-gray-400">{messageReports.length} no total</span>
        </div>
        <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: "pending", label: "Pendentes" },
            { key: "reviewing", label: "Em análise" },
            { key: "resolved", label: "Resolvidas" },
            { key: "dismissed", label: "Dispensadas" },
            { key: "all", label: "Todas" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key as typeof reportFilter)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${
                reportFilter === filter.key
                  ? "border-teal-400/40 bg-teal-400/10 text-teal-200"
                  : "border-white/10 bg-white/5 text-gray-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filteredReports.slice(0, 8).map((report) => (
            <div
              key={report.id}
              className={`rounded-lg border bg-black/10 p-2 ${
                selectedReportId === report.id ? "border-teal-400/40" : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-gray-200">{report.reason}</p>
                <span className="shrink-0 text-[10px] uppercase text-amber-200">{report.status}</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                {new Date(report.created_at).toLocaleString("pt-BR")}
              </p>
              <button
                type="button"
                onClick={() => onSelectReport(report.id)}
                className="mt-1 text-[10px] text-teal-300 hover:text-teal-200"
              >
                Ver detalhe
              </button>
              <div className="mt-2 flex flex-wrap gap-1">
                <ReportAction label="Em análise" onClick={() => onUpdateReportStatus(report.id, "reviewing")} />
                <ReportAction label="Resolver" tone="success" onClick={() => onUpdateReportStatus(report.id, "resolved")} />
                <ReportAction label="Dispensar" tone="muted" onClick={() => onUpdateReportStatus(report.id, "dismissed")} />
              </div>
            </div>
          ))}
          {filteredReports.length === 0 ? (
            <p className="text-xs text-gray-500">Sem denúncias no momento.</p>
          ) : null}
        </div>
        {selectedReport ? (
          <ReportDetail report={selectedReport} />
        ) : null}
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
  const classes = {
    default: "border-white/10 bg-white/5 text-gray-200",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    muted: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  };
  const className = getRequiredRecordValue(classes, tone, classes.default);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[10px] ${className}`}
    >
      {label}
    </button>
  );
}

function ReportDetail({ report }: { report: GroupMessageReportItem }) {
  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-gray-300">
        <Filter className="h-3.5 w-3.5 text-teal-300" />
        Detalhe da denúncia
      </div>
      <p className="text-xs text-white">{report.reason}</p>
      <p className="mt-1 text-[11px] text-gray-400">ID da mensagem: {report.message_id}</p>
      <p className="text-[11px] text-gray-500">
        Criada em {new Date(report.created_at).toLocaleString("pt-BR")}
      </p>
      {report.details ? (
        <p className="mt-1 text-[11px] text-gray-300">Detalhes: {report.details}</p>
      ) : null}
      {report.message ? (
        <div className="mt-2 rounded-md border border-white/10 bg-white/5 p-2">
          <p className="text-[10px] uppercase text-gray-400">Mensagem original</p>
          <p className="mt-1 text-xs text-white">{report.message.content || "(sem texto)"}</p>
          <p className="mt-1 text-[11px] text-gray-400">
            Autor: {report.message.profile?.name || "Usuário"}
          </p>
          <p className="text-[11px] text-gray-500">
            Tipo: {report.message.message_type || "text"}
          </p>
        </div>
      ) : null}
      <div className="mt-2">
        <p className="text-[10px] uppercase text-gray-400">Histórico de moderação</p>
        <div className="mt-1 space-y-1">
          {(report.moderation_history || []).length === 0 ? (
            <p className="text-[11px] text-gray-500">Sem ações registradas.</p>
          ) : (
            (report.moderation_history || []).map((event, idx) => (
              <p key={`${event.at}-${idx}`} className="text-[11px] text-gray-300">
                {new Date(event.at).toLocaleString("pt-BR")} - {event.status}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
