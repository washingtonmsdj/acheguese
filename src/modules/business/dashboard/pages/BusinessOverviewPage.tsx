import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CircleAlert,
  Clock3,
  ImageIcon,
  MapPin,
  MessageCircle,
  Pencil,
  Settings,
  Star,
  Store,
} from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { getBusinessAnalyticsSummary } from "@/core/business/services/business-analytics.service";
import { businessDirectMessagingService } from "@/core/messaging/services/BusinessDirectMessagingService";
import { messagingRoutes } from "@/core/messaging/routes/messagingRoutes";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "@/core/business/constants/weekDays";
import { getBusinessStatusPresentation } from "@/modules/business/dashboard/presentation/businessStatusPresentation";

interface BusinessOverviewPageProps {
  messagingAvailable: boolean;
}

export default function BusinessOverviewPage({
  messagingAvailable,
}: BusinessOverviewPageProps) {
  const { businessId, business, publicUrl } = useActiveBusinessDashboardContext();
  const navigate = useNavigate();
  const { activeProfile, profiles, switchProfile } = useSessionContext();
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const businessDataId = business.business_data_id;
  const isBusinessProfileActive = activeProfile?.id === business.profile_id;
  const canActivateBusinessProfile = profiles.some((profile) => profile.id === business.profile_id);
  const analyticsQuery = useQuery({
    queryKey: ["business-overview-analytics", businessDataId, "month"],
    queryFn: () => getBusinessAnalyticsSummary(businessDataId!, "month"),
    enabled: Boolean(businessDataId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const messagesQuery = useQuery({
    queryKey: ["business-overview-messages", business.profile_id],
    queryFn: () => businessDirectMessagingService.listConversationPreviews({
      profileId: business.profile_id,
      limit: 20,
    }),
    enabled: messagingAvailable && isBusinessProfileActive,
    staleTime: 30 * 1000,
    retry: false,
  });
  const businessThreads = messagesQuery.data?.items.filter(
    (thread) => thread.participant_role === "business" && thread.business_profile_id === business.profile_id,
  ) ?? [];
  const recentMessages = businessThreads.slice(0, 3);
  const messageSummary = !isBusinessProfileActive
    ? "Ative o perfil"
    : messagesQuery.isPending
      ? "Carregando…"
      : messagesQuery.isError
        ? "Indisponível"
        : businessThreads.length === 0
          ? "Nenhuma conversa"
          : `${businessThreads.length}${messagesQuery.data?.nextCursor ? "+" : ""} ${businessThreads.length === 1 ? "conversa" : "conversas"}`;
  const isPublic = business.status === "active" && Boolean(publicUrl);
  const statusPresentation = getBusinessStatusPresentation(business.status);
  const StatusIcon = statusPresentation.icon;

  const openBusinessInbox = async () => {
    if (switchingProfile) return;
    if (!isBusinessProfileActive) {
      setSwitchingProfile(true);
      try {
        await switchProfile(business.profile_id);
      } catch {
        toast.error("Não foi possível ativar o perfil da empresa.");
        setSwitchingProfile(false);
        return;
      }
      setSwitchingProfile(false);
    }
    navigate(messagingRoutes.inbox());
  };
  const media = [...new Set([business.banner_url, business.logo_url].filter((url): url is string => Boolean(url)))];
  const businessHours = WEEK_DAYS.flatMap((day) => {
    const schedule = business.horario_funcionamento?.[day];
    if (!schedule) return [];
    return [{ day, schedule }];
  });
  const hasReviews = business.total_reviews > 0 && business.rating > 0;
  const locationLabel = [business.location?.name, business.business_city, business.business_state]
    .filter(Boolean)
    .join(" · ");
  const quickActions = [
    { label: "Editar dados", detail: "Atualize as informações públicas", icon: Pencil, to: businessManagementRoutes.edit(businessId) },
    { label: "Fotos", detail: "Organize a galeria da empresa", icon: ImageIcon, to: businessManagementRoutes.photos(businessId) },
    { label: "Horários", detail: "Defina os dias e horários de atendimento", icon: Clock3, to: businessManagementRoutes.hours(businessId) },
    { label: "Contato e localização", detail: "Confira os dados cadastrados", icon: MapPin, to: businessManagementRoutes.dados(businessId) },
    { label: "Configurações", detail: "Gerencie o acesso à empresa", icon: Settings, to: businessManagementRoutes.configuracoes(businessId) },
  ];
  const profileSuggestions = [
    !business.description && "Adicione uma descrição do negócio",
    !(business.business_address || business.address?.street) && "Informe o endereço da empresa",
    !business.banner_url && "Adicione uma capa",
    !business.logo_url && "Adicione um logo",
  ].filter((suggestion): suggestion is string => Boolean(suggestion));

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/15 to-accent/30 sm:h-44 xl:h-52">
          {business.banner_url ? (
            <img src={business.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,hsl(var(--accent)/.35),transparent_35%)]" />
          )}
        </div>
        <div className="flex flex-col gap-3 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <div className="-mt-9 mb-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 text-primary shadow-sm sm:-mt-12 sm:h-24 sm:w-24">
              {business.logo_url ? (
                <img src={business.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-8 w-8" aria-hidden="true" />
              )}
            </div>
            <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl xl:text-3xl">
              {business.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                {getBusinessCategoryLabel(business.category)}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${statusPresentation.badgeClassName}`}>
                <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {statusPresentation.label}
              </span>
            </div>
            {locationLabel ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {locationLabel}
              </p>
            ) : null}
          </div>
          {isPublic ? (
            <Link to={publicUrl!} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
              Ver página pública <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : <p className="max-w-52 text-xs leading-5 text-muted-foreground">{statusPresentation.unavailablePublicMessage}</p>}
        </div>
      </section>

      <section aria-label="Resumo da empresa" className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <SummaryCard icon={StatusIcon} label="Situação" value={statusPresentation.label} />
        <SummaryCard icon={Star} label="Avaliações" value={hasReviews ? `${business.rating.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} · ${business.total_reviews}` : "Sem avaliações"} />
        {messagingAvailable && canActivateBusinessProfile ? (
          <SummaryCard icon={MessageCircle} label="Mensagens" value={messageSummary} />
        ) : (
          <SummaryCard icon={ImageIcon} label="Capa e logo" value={`${media.length} ${media.length === 1 ? "imagem" : "imagens"}`} />
        )}
        <SummaryCard icon={BarChart3} label="Visualizações · 30 dias" value={!businessDataId ? "Indisponível" : analyticsQuery.isPending ? "Carregando…" : analyticsQuery.isError ? "Indisponível" : String(analyticsQuery.data.views)} to={businessManagementRoutes.analytics(businessId)} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-foreground sm:text-lg">Ações rápidas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Mantenha sua presença no território atualizada.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="group flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-2 text-center transition-colors hover:border-primary/30 hover:bg-primary/[0.03] sm:min-h-28 sm:items-start sm:justify-start sm:p-4 sm:text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><action.icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-4 text-foreground sm:text-sm">{action.label}</span>
                <span className="mt-0.5 hidden text-xs leading-4 text-muted-foreground sm:block">{action.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className={`grid gap-4 ${profileSuggestions.length ? "xl:grid-cols-2" : ""}`}>
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><Building2 className="h-5 w-5 text-primary" aria-hidden="true" /> Informações principais</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <InfoRow label="Categoria" value={getBusinessCategoryLabel(business.category)} />
            <InfoRow label="Endereço" value={business.business_address || "Não informado"} />
            <InfoRow label="Telefone" value={business.phone || "Não informado"} />
          </dl>
          <Link to={businessManagementRoutes.dados(businessId)} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary">Ver dados <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
        {profileSuggestions.length ? (
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><CircleAlert className="h-5 w-5 text-primary" aria-hidden="true" /> Complete seu perfil</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {profileSuggestions.slice(0, 3).map((suggestion) => <li key={suggestion} className="flex items-start gap-2"><span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{suggestion}</li>)}
            </ul>
            <Link to={businessManagementRoutes.edit(businessId)} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary">Completar dados <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </section>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {messagingAvailable && canActivateBusinessProfile ? (
          <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" /> Mensagens recentes</h2>
              <button type="button" onClick={() => void openBusinessInbox()} disabled={switchingProfile} className="min-h-10 shrink-0 text-xs font-semibold text-primary disabled:opacity-50 sm:text-sm">{isBusinessProfileActive ? "Ver todas" : "Ativar perfil"} <ArrowRight className="inline h-4 w-4" aria-hidden="true" /></button>
            </div>
            {!isBusinessProfileActive ? (
              <p className="mt-3 text-sm leading-5 text-muted-foreground">Ative o perfil da empresa para ver e responder às conversas.</p>
            ) : messagesQuery.isPending ? (
              <p className="mt-3 text-sm text-muted-foreground">Carregando conversas…</p>
            ) : messagesQuery.isError ? (
              <p className="mt-3 text-sm text-muted-foreground">Não foi possível carregar as conversas agora.</p>
            ) : recentMessages.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma conversa recebida ainda.</p>
            ) : (
              <div className="mt-2 divide-y divide-border">
                {recentMessages.map((thread) => (
                  <Link key={thread.id} to={messagingRoutes.thread("business", thread.id)} className="flex min-w-0 items-center gap-3 py-3 hover:text-primary">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{thread.counterparty_name.charAt(0).toLocaleUpperCase("pt-BR")}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{thread.counterparty_name}</span><span className="block truncate text-xs text-muted-foreground">{thread.last_message_text}</span></span>
                    {thread.unread_count > 0 ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{thread.unread_count}</span> : null}
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}
        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><ImageIcon className="h-5 w-5 text-primary" aria-hidden="true" /> Capa e logo</h2>
            <Link to={businessManagementRoutes.edit(businessId)} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-primary sm:text-sm">Editar <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          {media.length ? (
            <div className="mt-2 grid min-h-28 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2">
              {business.banner_url ? <img src={business.banner_url} alt={`Capa de ${business.name}`} className="aspect-[16/9] h-full w-full rounded-xl object-cover" loading="lazy" /> : <div className="flex min-h-28 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Sem capa</div>}
              {business.logo_url ? <img src={business.logo_url} alt={`Logo de ${business.name}`} className="aspect-square h-full w-full rounded-xl bg-muted object-contain" loading="lazy" /> : <div className="flex min-h-28 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Sem logo</div>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Adicione capa e logo para identificar sua empresa.</p>
          )}
        </section>
        {businessHours.length > 0 ? (
          <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><Clock3 className="h-5 w-5 text-primary" aria-hidden="true" /> Horário de funcionamento</h2>
            <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
              {businessHours.map(({ day, schedule }) => (
                <div key={day} className="flex min-w-0 items-center justify-between gap-3 border-b border-border/60 py-1 last:border-0 sm:col-span-2">
                  <dt className="text-muted-foreground">{WEEK_DAY_LABELS[day]}</dt>
                  <dd className="shrink-0 font-medium text-foreground">{schedule.closed ? "Fechado" : schedule.open && schedule.close ? `${schedule.open}–${schedule.close}` : "Não informado"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, className = "", to }: { icon: typeof Store; label: string; value: string; className?: string; to?: string }) {
  const content = <>
    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
    <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    <p className="mt-0.5 break-words text-base font-bold leading-tight text-foreground sm:text-lg">{value}</p>
  </>;
  const classes = `min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4 ${className}`;
  return to ? <Link to={to} className={`${classes} transition-colors hover:border-primary/30 hover:bg-primary/[0.03]`}>{content}</Link> : <div className={classes}>{content}</div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-medium text-foreground">{value}</dd></div>;
}
