import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  ImageIcon,
  MapPin,
  Pencil,
  Settings,
  Star,
  Store,
} from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";

function getStatusLabel(status: string) {
  switch (status) {
    case "active": return "Ativa";
    case "pending": return "Em análise";
    case "suspended": return "Suspensa";
    case "inactive": return "Inativa";
    default: return status;
  }
}

export default function BusinessOverviewPage() {
  const { businessId, business, publicUrl } = useActiveBusinessDashboardContext();
  const photos = business.fotos?.filter(Boolean) ?? [];
  const hasReviews = business.total_reviews > 0 && business.rating > 0;
  const locationLabel = [business.location?.name, business.business_city, business.business_state]
    .filter(Boolean)
    .join(" · ");
  const quickActions = [
    { label: "Editar dados", detail: "Atualize as informações públicas", icon: Pencil, to: businessManagementRoutes.edit(businessId) },
    { label: "Dados da empresa", detail: "Confira contato e localização", icon: Building2, to: businessManagementRoutes.dados(businessId) },
    { label: "Configurações", detail: "Gerencie o acesso à empresa", icon: Settings, to: businessManagementRoutes.configuracoes(businessId) },
  ];

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
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {getStatusLabel(business.status)}
              </span>
            </div>
            {locationLabel ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {locationLabel}
              </p>
            ) : null}
          </div>
          {publicUrl ? (
            <Link to={publicUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
              Ver página pública <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </section>

      <section aria-label="Resumo da empresa" className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-3">
        <SummaryCard icon={CheckCircle2} label="Situação" value={getStatusLabel(business.status)} />
        <SummaryCard icon={Star} label="Avaliações" value={hasReviews ? `${business.rating.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} · ${business.total_reviews}` : "Sem avaliações"} />
        <SummaryCard icon={ImageIcon} label="Fotos" value={`${photos.length} ${photos.length === 1 ? "foto" : "fotos"}`} className="col-span-2 xl:col-span-1" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-foreground sm:text-lg">Ações rápidas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Mantenha sua presença no território atualizada.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="group flex min-h-20 items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03] sm:min-h-28 sm:flex-col sm:items-start sm:p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><action.icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{action.label}</span>
                <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{action.detail}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary sm:hidden" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><Building2 className="h-5 w-5 text-primary" aria-hidden="true" /> Informações principais</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <InfoRow label="Categoria" value={getBusinessCategoryLabel(business.category)} />
            <InfoRow label="Endereço" value={business.business_address || "Não informado"} />
            <InfoRow label="Telefone" value={business.phone || "Não informado"} />
          </dl>
          <Link to={businessManagementRoutes.dados(businessId)} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary">Ver dados <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><Clock3 className="h-5 w-5 text-primary" aria-hidden="true" /> Próximos cuidados</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {business.description ? "Revise seus dados sempre que houver mudanças no negócio." : "Adicione uma descrição para ajudar as pessoas a conhecerem seu negócio."}
          </p>
          <Link to={businessManagementRoutes.edit(businessId)} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary">Editar empresa <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, className = "" }: { icon: typeof Store; label: string; value: string; className?: string }) {
  return <div className={`min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4 ${className}`}>
    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
    <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    <p className="mt-0.5 break-words text-base font-bold leading-tight text-foreground sm:text-lg">{value}</p>
  </div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-medium text-foreground">{value}</dd></div>;
}
