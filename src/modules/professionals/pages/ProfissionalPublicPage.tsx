/**
 * Perfil publico de profissional.
 * Rota: /servicos/:state/:city/profissional/:slug
 *
 * O estado concept-mock e exclusivo do desenvolvimento: ele fornece apenas
 * conteudo demonstrativo para validar a composicao visual sem alterar o
 * contrato publico ou inventar dados para perfis reais.
 */

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  ChevronRight,
  Flag,
  Info,
  MapPin,
  MessageCircle,
  Share2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { TerritorySurface, TerritoryTopbar } from "@/app/components/territory-vivo";
import { MODULE_SLUGS, buildModuleTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { logPageNotFound } from "@/core/public-identity/utils/identity-logger";
import { useSessionContext } from "@/core/session";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn";
import {
  PROFESSIONAL_CONCEPT_DETAILS,
  PROFESSIONAL_CONCEPT_MOCK,
} from "../mocks/professionalConceptMock";
import { ProfessionalLeadRequestDialog } from "../components/ProfessionalLeadRequestDialog";
import {
  type ProfessionalPublicProfile,
  useProfessionalBySlug,
} from "../hooks/useProfessionalBySlug";

interface ProfileServiceItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTerritoryName(profile: ProfessionalPublicProfile, conceptMockEnabled: boolean): string {
  if (conceptMockEnabled) return "Complexo do Nordeste";
  return profile.city ?? "Seu território";
}

function getContextLabel(profile: ProfessionalPublicProfile, state?: string): string {
  const city = profile.city ?? "Salvador";
  const uf = profile.state ?? state?.toUpperCase() ?? "BA";
  return `${city}, ${uf}`;
}

function getProfileServices(
  profile: ProfessionalPublicProfile,
  conceptMockEnabled: boolean,
): ProfileServiceItem[] {
  if (conceptMockEnabled) return PROFESSIONAL_CONCEPT_DETAILS.services;

  return [
    {
      title: profile.service_subcategory ?? profile.service_category ?? "Serviços profissionais",
      description: profile.description ?? "Atendimento e soluções para a vizinhança.",
      icon: Wrench,
    },
  ];
}

function ShareProfileButton() {
  const handleShare = async () => {
    const shareData = { title: document.title, url: window.location.href };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      aria-label="Compartilhar perfil"
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Compartilhar</span>
    </button>
  );
}

function ProfileActions({ saved, onToggleSaved }: { saved: boolean; onToggleSaved: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleSaved}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        aria-pressed={saved}
        aria-label={saved ? "Remover perfil dos salvos" : "Salvar perfil"}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current text-territory-brand")} aria-hidden="true" />
        <span className="hidden sm:inline">{saved ? "Salvo" : "Salvar"}</span>
      </button>
      <ShareProfileButton />
    </div>
  );
}

function ProfileTabs() {
  return (
    <nav
      className="-mx-4 flex overflow-x-auto border-b border-territory-border px-4 scrollbar-hide sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      aria-label="Seções do perfil"
    >
      {[
        { label: "Sobre", active: true },
        { label: "Serviços", active: false },
        { label: "Trabalhos", active: false },
        { label: "Recomendações", active: false },
      ].map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={cn(
            "relative min-h-10 shrink-0 px-3 text-sm font-medium text-territory-muted transition-colors first:pl-0 last:pr-0 hover:text-territory-ink after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-transparent first:after:left-0 last:after:right-0 sm:px-4 sm:after:inset-x-4 md:min-h-12",
            tab.active && "font-bold text-territory-ink after:bg-territory-brand",
          )}
          aria-current={tab.active ? "page" : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function ProfileHero({
  profile,
  territoryName,
  locationLabel,
}: {
  profile: ProfessionalPublicProfile;
  territoryName: string;
  locationLabel: string;
}) {
  const profileName = profile.professional_name;
  const category = profile.service_category ?? profile.service_subcategory ?? "Serviços profissionais";

  return (
    <section className="mt-3 md:mt-5" aria-labelledby="professional-profile-title">
      <div className="flex items-start gap-3 sm:gap-4">
        <Avatar className="h-20 w-20 shrink-0 border border-territory-border bg-territory-raised sm:h-24 sm:w-24 md:h-28 md:w-28">
          <AvatarImage src={profile.avatar_url ?? profile.logo_url ?? undefined} alt="" />
          <AvatarFallback className="bg-territory-raised text-xl font-bold text-territory-brand sm:text-2xl">
            {getInitials(profileName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 pt-1 md:pt-2">
          <h1
            id="professional-profile-title"
            className="font-heading text-[1.5rem] font-bold leading-[1.05] tracking-[-0.045em] text-territory-ink sm:text-[1.75rem] md:text-[2rem]"
          >
            {profileName}
          </h1>
          <p className="mt-1 text-sm font-bold text-territory-brand sm:text-base">{category}</p>
          {locationLabel ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-territory-ink sm:text-base">
              <MapPin className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs leading-5 text-territory-muted sm:text-sm">
            Atendimento no {territoryName}
          </p>
        </div>
      </div>
      {profile.description ? (
        <p className="mt-3 max-w-3xl text-sm leading-5 text-territory-ink sm:text-base sm:leading-7">
          {profile.description}
        </p>
      ) : null}
    </section>
  );
}

function ConversationButton({
  profile,
  onOpen,
  className,
  label,
}: {
  profile: ProfessionalPublicProfile;
  onOpen: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!profile.is_accepting_clients}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink shadow-territory-highlight transition-colors hover:bg-territory-sun/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand disabled:cursor-not-allowed disabled:opacity-55 md:min-h-11",
        className,
      )}
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {label ?? `Conversar com ${profile.professional_name.split(" ")[0]}`}
    </button>
  );
}

function ServicesSection({ services }: { services: ProfileServiceItem[] }) {
  return (
    <section aria-labelledby="professional-services-title">
      <h2 id="professional-services-title" className="font-heading text-xl font-bold tracking-[-0.025em] text-territory-ink sm:text-2xl">
        Como posso ajudar
      </h2>
      <div className="mt-3 border-t border-territory-border">
        {services.map((service) => {
          const Icon = service.icon;
          return (
              <div key={service.title} className="flex min-h-[3.25rem] items-center gap-3 border-b border-territory-border py-1.5 sm:gap-4 md:min-h-[4.25rem] md:py-3">
              <Icon className="h-7 w-7 shrink-0 text-territory-ink" strokeWidth={1.8} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-territory-ink sm:text-base">{service.title}</p>
                <p className="mt-0.5 text-sm text-territory-muted">{service.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-5 text-territory-muted sm:text-sm">
        Valores e condições combinados na conversa.
      </p>
    </section>
  );
}

function PortfolioSection({ portfolio }: { portfolio: string[] }) {
  if (portfolio.length === 0) return null;

  return (
    <section aria-labelledby="professional-portfolio-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="professional-portfolio-title" className="font-heading text-xl font-bold leading-6 tracking-[-0.025em] text-territory-ink sm:text-2xl sm:leading-7">
          Trabalhos realizados
        </h2>
        <button type="button" className="inline-flex min-h-6 items-center gap-1 text-sm font-bold text-territory-brand hover:text-territory-brand-strong md:min-h-10">
          <span className="hidden sm:inline">Ver todas as fotos</span>
          <span className="sm:hidden">Ver fotos</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-3 sm:gap-3">
        {portfolio.map((image, index) => (
          <img
            key={`${image}-${index}`}
            src={image}
            alt={`Trabalho realizado ${index + 1}`}
            className={cn("aspect-[1.35] w-full rounded-lg object-cover", index === 2 && "hidden sm:block")}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationsSection() {
  return (
    <section aria-labelledby="professional-recommendations-title">
      <h2 id="professional-recommendations-title" className="font-heading text-xl font-bold tracking-[-0.025em] text-territory-ink sm:text-2xl">
        Recomendações
      </h2>
      <div className="mt-3 flex items-start gap-3 border-t border-territory-border pt-4">
        <MessageCircle className="mt-0.5 h-7 w-7 shrink-0 text-territory-ink" strokeWidth={1.8} aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-territory-ink sm:text-base">Ainda não há recomendações.</p>
          <p className="mt-1 text-sm leading-6 text-territory-muted">
            As recomendações aparecerão aqui quando forem publicadas.
          </p>
        </div>
      </div>
    </section>
  );
}

function ConversationAside({
  profile,
  coverage,
  onOpen,
}: {
  profile: ProfessionalPublicProfile;
  coverage: string[];
  onOpen: () => void;
}) {
  return (
    <aside className="hidden md:block xl:sticky xl:top-24" aria-label="Contato e região de atendimento">
      <TerritorySurface className="p-4 sm:p-5">
        <h2 className="font-heading text-xl font-bold tracking-[-0.025em] text-territory-ink sm:text-2xl">Vamos conversar?</h2>
        <p className="mt-2 text-sm leading-6 text-territory-ink">
          Explique o que precisa e combine o atendimento diretamente com {profile.professional_name.split(" ")[0]}.
        </p>
        <ConversationButton profile={profile} onOpen={onOpen} className="mt-3 w-full" />
        <p className="mt-2 text-xs leading-5 text-territory-muted">Valores e condições combinados na conversa.</p>

        <div className="mt-5 border-t border-territory-border pt-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-territory-ink" aria-hidden="true" />
            <h3 className="text-base font-bold text-territory-ink">Região de atendimento</h3>
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-5 text-territory-ink">
            {coverage.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="mt-5 border-t border-territory-border pt-5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
            <div>
              <h3 className="text-base font-bold text-territory-ink">Antes de combinar</h3>
              <p className="mt-2 text-sm leading-6 text-territory-muted">Alinhe o serviço, o valor e a forma de pagamento.</p>
            </div>
          </div>
        </div>

        <button type="button" className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 border-t border-territory-border pt-4 text-xs font-semibold text-territory-muted hover:text-territory-brand">
          <Flag className="h-4 w-4" aria-hidden="true" />
          Denunciar perfil
        </button>
      </TerritorySurface>
    </aside>
  );
}

function MobileCoverageSection({ coverage }: { coverage: string[] }) {
  if (coverage.length === 0) return null;

  return (
    <section className="md:hidden" aria-labelledby="professional-mobile-coverage-title">
      <h2
        id="professional-mobile-coverage-title"
        className="font-heading text-xl font-bold tracking-[-0.025em] text-territory-ink"
      >
        Onde atende
      </h2>
      <ul className="mt-3 border-t border-territory-border pt-3 text-sm leading-6 text-territory-ink">
        {coverage.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function ProfileLoading({ territoryName, contextLabel, searchHref }: { territoryName: string; contextLabel: string; searchHref: string }) {
  return (
    <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <TerritoryTopbar territoryName={territoryName} contextLabel={contextLabel} isAuthenticated={false} searchHref={searchHref} searchLabel="Buscar serviços e negócios" showMobileSearch={false} />
      <main className="mx-auto w-full max-w-[72rem] px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-5 w-48 animate-pulse rounded bg-territory-raised" />
        <div className="mt-8 flex items-center gap-4"><div className="h-24 w-24 animate-pulse rounded-full bg-territory-raised" /><div className="space-y-3"><div className="h-8 w-56 animate-pulse rounded bg-territory-raised" /><div className="h-4 w-40 animate-pulse rounded bg-territory-raised" /></div></div>
        <div className="mt-8 h-12 animate-pulse rounded bg-territory-raised" />
        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_20rem]"><div className="h-96 animate-pulse rounded-territory bg-territory-raised" /><div className="h-96 animate-pulse rounded-territory bg-territory-raised" /></div>
      </main>
    </div>
  );
}

export default function ProfissionalPublicPage() {
  const { state, city, slug } = useParams<{ state: string; city: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useSessionContext();
  const { unreadCount } = useUnifiedNotifications();
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const conceptMockEnabled = import.meta.env.DEV && searchParams.get("concept-mock") === "1";
  const territoryName = conceptMockEnabled ? "Complexo do Nordeste" : "Seu território";
  const contextLabel = conceptMockEnabled ? "Salvador, BA" : `${city ?? "Salvador"}, ${(state ?? "BA").toUpperCase()}`;
  const searchTerritoryBase = conceptMockEnabled
    ? `/${state ?? "ba"}/${city ?? "salvador"}/complexo-do-nordeste-de-amaralina`
    : `/${state ?? "ba"}/${city ?? "salvador"}`;
  const searchHref = buildModuleTerritoryUrl(MODULE_SLUGS.search, searchTerritoryBase);

  const { data: professional, isLoading, error } = useProfessionalBySlug({
    uf: state ?? "",
    cidade: city ?? "",
    slug: slug ?? "",
    enabled: !conceptMockEnabled,
  });

  useEffect(() => {
    if (!isLoading && (error || !professional) && slug && state && city && !conceptMockEnabled) {
      logPageNotFound({
        entityType: "professional",
        identifier: slug,
        attemptedUrl: professionalPublicRoutes.detail({ state, city, slug }),
      });
    }
  }, [city, conceptMockEnabled, error, isLoading, professional, slug, state]);

  if (isLoading && !conceptMockEnabled) {
    return <ProfileLoading territoryName={territoryName} contextLabel={contextLabel} searchHref={searchHref} />;
  }

  const profile = conceptMockEnabled ? PROFESSIONAL_CONCEPT_MOCK : professional;
  if (error || !profile) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-territory-canvas px-4 text-center text-territory-ink">
        <p className="mb-4 text-lg font-semibold">Profissional não encontrado.</p>
        <Link to={searchHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-4 text-sm font-semibold hover:border-territory-brand"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar à busca</Link>
      </div>
    );
  }

  const profileTerritoryName = getTerritoryName(profile, conceptMockEnabled);
  const profileContextLabel = getContextLabel(profile, state);
  const profileLocationLabel = conceptMockEnabled
    ? PROFESSIONAL_CONCEPT_DETAILS.locationLabel
    : [profile.city, profile.state].filter(Boolean).join(" · ");
  const services = getProfileServices(profile, conceptMockEnabled);
  const portfolio = conceptMockEnabled ? PROFESSIONAL_CONCEPT_DETAILS.portfolio : [];
  const coverage = conceptMockEnabled ? PROFESSIONAL_CONCEPT_DETAILS.coverage : profile.city ? [profile.city] : [];

  return (
    <div className="min-h-[100dvh] bg-territory-canvas pb-24 text-territory-ink md:pb-8">
      <TerritoryTopbar territoryName={profileTerritoryName} contextLabel={profileContextLabel} isAuthenticated={Boolean(user)} unreadCount={unreadCount} searchHref={searchHref} searchLabel="Buscar serviços e negócios" showMobileSearch={false} />

      <main className="mx-auto w-full max-w-[72rem] px-4 pb-8 pt-2 sm:px-6 md:pt-5 lg:px-8">
        <div className="hidden items-center gap-2 text-xs text-territory-muted md:flex"><Link to={searchHref} className="hover:text-territory-brand">Explorar</Link><span aria-hidden="true">/</span><Link to={buildModuleTerritoryUrl(MODULE_SLUGS.services, searchTerritoryBase)} className="hover:text-territory-brand">Serviços</Link><span aria-hidden="true">/</span><span className="truncate">{profile.professional_name}</span></div>

        <div className="mt-3 flex items-center justify-between gap-3 md:mt-2"><Link to={searchHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Voltar à busca</Link><ProfileActions saved={saved} onToggleSaved={() => setSaved((value) => !value)} /></div>

        <ProfileHero profile={profile} territoryName={profileTerritoryName} locationLabel={profileLocationLabel} />
        <div className="mt-3 md:hidden">
          <ConversationButton profile={profile} onOpen={() => setLeadDialogOpen(true)} className="w-full" />
          <p className="mt-1 text-center text-xs leading-5 text-territory-muted">Conte o que precisa e combine os detalhes.</p>
        </div>
        <ProfileTabs />

        <div className="mt-4 grid gap-5 md:gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)] xl:items-start xl:gap-9">
          <div className="min-w-0 space-y-4 md:space-y-8"><ServicesSection services={services} /><PortfolioSection portfolio={portfolio} /><MobileCoverageSection coverage={coverage} /><RecommendationsSection /></div>
          <ConversationAside profile={profile} coverage={coverage} onOpen={() => setLeadDialogOpen(true)} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-territory-border bg-territory-surface/96 px-4 py-2 backdrop-blur-xl safe-area-bottom md:hidden"><div className="mx-auto flex max-w-lg items-center gap-3"><span className="inline-flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold text-territory-ink"><MessageCircle className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><span className="truncate">Fale sobre seu serviço</span></span><ConversationButton profile={profile} onOpen={() => setLeadDialogOpen(true)} label="Conversar" className="shrink-0 px-5" /></div></div>

      <ProfessionalLeadRequestDialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen} professionalId={profile.id} professionalName={profile.professional_name} defaultService={profile.service_subcategory ?? profile.service_category} sourceChannel="public_profile" />
    </div>
  );
}
