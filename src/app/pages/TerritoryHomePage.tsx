import { useMemo, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronDown,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Search,
  Sun,
  UtensilsCrossed,
  Users,
  Store,
  Wrench,
  Car,
  BadgeCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { LAUNCH_URLS } from "@/config/territory";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import { useSessionContext } from "@/core/session";
import {
  getCategoryTokens,
  type ContentCategoryKey,
} from "@/shared/design-system/contentCategories";

/**
 * Territory Home — Sprint HOME.UI.1 (premium refinement)
 * -------------------------------------------------------
 * Fonte de verdade: docs/05-ux/HOME-SPEC.md.
 *
 * Hierarquia da dobra (§3 do SPEC + refinamento HOME.UI.1):
 *   1. Header do território
 *   2. Busca
 *   3. Agora no bairro (pulso compacto)
 *   4. Hoje no bairro (2 cards + Ver tudo)
 *   5. Acontecendo no bairro (feed misto)
 *   6. Passear pelo bairro (Explore)
 *
 * Estética: neutros (80%), verde institucional (15%), semântico (5%).
 * Tipografia: Inter, hierarquia 28/22/18/16/14/12.
 * Escopo: apenas frontend. Sem backend, hooks novos, services, rotas.
 */

type PulseCard = {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
  hint?: string;
  category: ContentCategoryKey;
};

type TodayCard = {
  id: string;
  kind: "Alerta" | "Evento";
  category: ContentCategoryKey;
  title: string;
  meta: string;
  cta: string;
  href: string;
};

type FeedItem =
  | {
      kind: "post";
      id: string;
      author: string;
      avatarInitial: string;
      time: string;
      title: string;
      replies: number;
      neighborhood: string;
      href: string;
    }
  | {
      kind: "empresa";
      id: string;
      title: string;
      status: string;
      distance: string;
      rating: string;
      href: string;
    }
  | {
      kind: "evento";
      id: string;
      title: string;
      place: string;
      time: string;
      href: string;
    }
  | {
      kind: "oferta";
      id: string;
      title: string;
      detail: string;
      href: string;
    };

type ExploreVertical = {
  id: string;
  label: string;
  icon: LucideIcon;
  category: ContentCategoryKey;
  href: string;
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Premium palette scoped to the Territory Home only, so we don't touch
 * global tokens or other screens. Uses SSOT semantic tokens for content
 * categories while overriding the surface/foreground scale to match the
 * Airbnb/Apple/Notion/Linear register requested for HOME.UI.1.
 */
const HOME_THEME: CSSProperties = {
  // Neutral surface scale (HSL triplets — Tailwind reads hsl(var(--...)))
  "--background": "210 40% 98%",       // #F8FAFC
  "--foreground": "220 26% 14%",       // #111827
  "--card": "0 0% 100%",               // #FFFFFF
  "--card-foreground": "220 26% 14%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "220 26% 14%",
  "--muted": "210 40% 98%",
  "--muted-foreground": "220 9% 46%",  // #6B7280
  "--border": "220 13% 91%",           // #E5E7EB
  "--input": "220 13% 91%",
  // Institutional green — #18B37E
  "--primary": "158 76% 39%",
  "--primary-foreground": "0 0% 100%",
  "--ring": "158 76% 39%",
  "--accent": "158 76% 39%",
  "--accent-foreground": "0 0% 100%",
  // Typography
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontFeatureSettings: '"cv02","cv03","cv04","cv11"',
  WebkitFontSmoothing: "antialiased",
} as CSSProperties;

export default function TerritoryHomePage() {
  const navigate = useNavigate();
  const params = useParams();
  const { activeLocation } = useActiveTerritory();
  const { user } = useSessionContext();
  const { unreadCount } = useUnifiedNotifications();

  const territoryName = useMemo(() => {
    if (activeLocation?.name) return titleCase(activeLocation.name);
    if (params.district) return titleCase(params.district.replace(/-/g, " "));
    if (params.city) return titleCase(params.city.replace(/-/g, " "));
    return "Seu bairro";
  }, [activeLocation, params]);

  const cityLine = useMemo(() => {
    const city = params.city ? titleCase(params.city.replace(/-/g, " ")) : "Salvador";
    const state = (params.state ?? "ba").toUpperCase();
    return `${city}, ${state}`;
  }, [params]);

  const pulse: PulseCard[] = [
    { id: "p1", icon: Sun, value: "28°", label: "Ensolarado", hint: "Sensação 30°", category: "neutral" },
    { id: "p2", icon: UtensilsCrossed, value: "15", label: "Restaurantes", hint: "abertos agora", category: "gastronomy" },
    { id: "p3", icon: AlertTriangle, value: "1", label: "Alerta ativo", hint: "Ver detalhes", category: "alert" },
    { id: "p4", icon: Users, value: "Alto", label: "Movimento", hint: "no bairro", category: "discussion" },
  ];

  const today: TodayCard[] = [
    {
      id: "t1",
      kind: "Alerta",
      category: "alert",
      title: "Interdição na Rua das Orquídeas",
      meta: "Até as 17h · hoje",
      cta: "Ver no mapa",
      href: LAUNCH_URLS.map ?? "#",
    },
    {
      id: "t2",
      kind: "Evento",
      category: "event",
      title: "Feira orgânica na Praça Ana Lúcia",
      meta: "Sábado · 7h às 12h",
      cta: "Ver detalhes",
      href: LAUNCH_URLS.events,
    },
  ];

  const feed: FeedItem[] = [
    {
      kind: "post",
      id: "f1",
      author: "Juliana Santos",
      avatarInitial: "J",
      time: "2h",
      title: "Alguém recomenda um bom chaveiro por aqui?",
      replies: 8,
      neighborhood: territoryName,
      href: LAUNCH_URLS.community,
    },
    {
      kind: "empresa",
      id: "f2",
      title: "Mercado Bom Dia",
      status: "Aberto",
      distance: "450 m",
      rating: "4,7 (128)",
      href: LAUNCH_URLS.business,
    },
    {
      kind: "evento",
      id: "f3",
      title: "Feira local no sábado",
      place: "Praça Ana Lúcia",
      time: "10h",
      href: LAUNCH_URLS.events,
    },
    {
      kind: "oferta",
      id: "f4",
      title: "Farmácia Saúde+",
      detail: "Até 30% de desconto em vitaminas",
      href: LAUNCH_URLS.business,
    },
  ];

  const explore: ExploreVertical[] = [
    { id: "e1", label: "Gastronomia", icon: UtensilsCrossed, category: "gastronomy", href: LAUNCH_URLS.gastronomy },
    { id: "e2", label: "Mobilidade", icon: Car, category: "mobility", href: LAUNCH_URLS.map ?? LAUNCH_URLS.search },
    { id: "e3", label: "Empresas", icon: Store, category: "business", href: LAUNCH_URLS.business },
    { id: "e4", label: "Serviços", icon: Wrench, category: "neutral", href: LAUNCH_URLS.services },
    { id: "e5", label: "Eventos", icon: Calendar, category: "event", href: LAUNCH_URLS.events },
    { id: "e6", label: "Mais", icon: MoreHorizontal, category: "neutral", href: LAUNCH_URLS.search },
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(q ? `${LAUNCH_URLS.search}?q=${encodeURIComponent(q)}` : LAUNCH_URLS.search);
  };

  return (
    <div
      className="min-h-[100dvh] bg-background pb-28 text-foreground antialiased"
      style={HOME_THEME}
    >
      {/* 1. HEADER TERRITORIAL */}
      <header
        className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="group flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={`Trocar de bairro. Você está em ${territoryName}.`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[22px] font-bold leading-tight tracking-[-0.01em]">
                  {territoryName}
                </span>
                <ChevronDown
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="block truncate text-[12px] font-normal text-muted-foreground">
                {cityLine}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-0.5">
            <Link
              to={user ? "/notificacoes" : "/login"}
              aria-label={
                user && unreadCount > 0
                  ? `${unreadCount} novidades para você`
                  : "Ver novidades"
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {user && unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-category-alert px-1 text-[10px] font-bold text-category-alert-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-5">
        {/* 2. BUSCA — CTA principal da Home */}
        <form onSubmit={handleSubmit} role="search" className="relative">
          <label className="sr-only" htmlFor="territory-search">
            Procurar em {territoryName}
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
            strokeWidth={2}
          />
          <input
            id="territory-search"
            name="q"
            type="search"
            placeholder="Procure empresas, serviços, eventos ou pessoas..."
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-[14px] font-normal text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.04)] placeholder:text-[hsl(220,14%,64%)] focus:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </form>

        {/* 3. AGORA — pulso do bairro */}
        <section aria-labelledby="pulse-title" className="mt-7">
          <div className="mb-3 flex items-baseline justify-between">
            <h2
              id="pulse-title"
              className="text-[16px] font-semibold leading-none tracking-[-0.01em]"
            >
              Agora em {territoryName}
            </h2>
          </div>

          <ul className="grid grid-cols-4 gap-2">
            {pulse.map((card) => {
              const tokens = getCategoryTokens(card.category);
              const Icon = card.icon;
              return (
                <li key={card.id} className="min-w-0">
                  <div className="flex h-full min-w-0 flex-col items-start gap-1 overflow-hidden rounded-2xl border border-border bg-card p-2.5 sm:p-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${tokens.chip}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.25} />
                    </span>
                    <span className="w-full truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] sm:text-[18px]">
                      {card.value}
                    </span>
                    <span className="w-full truncate text-[11px] font-medium leading-tight text-foreground/90 sm:text-[12px]">
                      {card.label}
                    </span>
                    {card.hint ? (
                      <span
                        className={`w-full truncate text-[10px] leading-tight sm:text-[11px] ${
                          card.category === "alert" ? tokens.text : "text-muted-foreground"
                        }`}
                      >
                        {card.hint}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 4. HOJE — no máximo 2 cards + CTA "Ver tudo" */}
        <section aria-labelledby="today-title" className="mt-7">
          <div className="mb-3 flex items-baseline justify-between">
            <h2
              id="today-title"
              className="text-[22px] font-semibold leading-tight tracking-[-0.015em]"
            >
              Hoje em {territoryName}
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary transition-opacity hover:opacity-80"
            >
              Ver tudo
            </Link>
          </div>

          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {today.map((item) => {
              const tokens = getCategoryTokens(item.category);
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-border/40 hover:shadow-[0_1px_3px_rgba(17,24,39,0.06)]"
                  >
                    <div className="flex flex-col gap-2.5">
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tokens.chip}`}
                      >
                        {item.kind}
                      </span>
                      <p className="text-[16px] font-semibold leading-snug tracking-[-0.005em] text-foreground">
                        {item.title}
                      </p>
                      <p className="text-[13px] font-normal text-muted-foreground">
                        {item.meta}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[13px] font-medium ${tokens.text}`}>
                      {item.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 5. ACONTECENDO NO BAIRRO — feed misto abaixo da dobra */}
        <section aria-labelledby="feed-title" className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2
              id="feed-title"
              className="text-[22px] font-semibold leading-tight tracking-[-0.015em]"
            >
              Acontecendo no bairro
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary transition-opacity hover:opacity-80"
            >
              Ver tudo
            </Link>
          </div>

          <ul className="space-y-2">
            {feed.map((item) => {
              if (item.kind === "post") {
                const tokens = getCategoryTokens("discussion");
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${tokens.chip}`}>
                        {item.avatarInitial}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            Post
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {item.author}
                          </span>
                          <span className="text-muted-foreground">· {item.time}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {item.replies} respostas · {item.neighborhood}
                        </p>
                      </div>
                      <span className="mt-1 flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        {item.replies}
                      </span>
                    </Link>
                  </li>
                );
              }

              if (item.kind === "empresa") {
                const tokens = getCategoryTokens("business");
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                        <Store className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            Empresa
                          </span>
                          <span className="truncate font-semibold text-foreground">
                            {item.title}
                          </span>
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          <span className={tokens.text}>{item.status}</span> · {item.distance} · ★ {item.rating}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              }

              if (item.kind === "evento") {
                const tokens = getCategoryTokens("event");
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                        <Calendar className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            Evento
                          </span>
                          <span className="truncate font-semibold text-foreground">
                            {item.title}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {item.place} · {item.time}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              }

              // oferta
              const tokens = getCategoryTokens("business");
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                      <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                          Oferta
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {item.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">{item.detail}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 6. EXPLORE — categorias (sem aparência de banner) */}
        <section aria-labelledby="explore-title" className="mt-8">
          <h2
            id="explore-title"
            className="mb-3 text-[22px] font-semibold leading-tight tracking-[-0.015em]"
          >
            Explore o bairro
          </h2>

          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {explore.map((vertical) => {
              const tokens = getCategoryTokens(vertical.category);
              const Icon = vertical.icon;
              return (
                <li key={vertical.id}>
                  <Link
                    to={vertical.href}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tokens.chip}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2.25} />
                    </span>
                    <span className="text-[12px] font-medium leading-tight text-foreground">
                      {vertical.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
