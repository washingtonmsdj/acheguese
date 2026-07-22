import { useMemo, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  Star,
  UtensilsCrossed,
  Car,
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
 * Territory Home — Sprint HOME.1
 * -----------------------------------------------------------
 * Home oficial do território ativo (bairro/cidade).
 * Responde: "onde estou · o que importa agora · qual a próxima ação".
 * Não é catálogo, não é dashboard, não é marketplace.
 *
 * Revisão HOME.1:
 *  - Header enxuto (remove ícone de busca duplicado).
 *  - Busca menor (h-12) sem affordance falsa de voz.
 *  - "Hoje" reduzido a 1 destaque + 2 chips compactos (~30% menos densidade acima da dobra).
 *  - Ações rápidas em chips 40px abaixo da dobra.
 *  - Destaques usam tokens semânticos (--category-*).
 *  - Bloco "Explore" simplificado: só a chip row.
 */

type TodayItem = {
  id: string;
  category: ContentCategoryKey;
  kind: string;
  icon: LucideIcon;
  title: string;
  cta: string;
  href: string;
};

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  category: ContentCategoryKey;
  href: string;
};

type Highlight =
  | {
      kind: "post";
      category: ContentCategoryKey;
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
      category: ContentCategoryKey;
      id: string;
      title: string;
      status: string;
      distance: string;
      rating: string;
      href: string;
    }
  | {
      kind: "evento";
      category: ContentCategoryKey;
      id: string;
      title: string;
      place: string;
      time: string;
      href: string;
    };

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

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

  const today: TodayItem[] = [
    {
      id: "t1",
      category: "alert",
      kind: "Alerta",
      icon: AlertTriangle,
      title: "Interdição na Rua das Orquídeas até 17h.",
      cta: "Ver no mapa",
      href: LAUNCH_URLS.map ?? "#",
    },
    {
      id: "t2",
      category: "event",
      kind: "Evento",
      icon: Calendar,
      title: "Feira orgânica, sábado 7h",
      cta: "Ver detalhes",
      href: LAUNCH_URLS.events,
    },
    {
      id: "t3",
      category: "discussion",
      kind: "Discussão",
      icon: MessageCircle,
      title: "Recomenda um bom eletricista?",
      cta: "Ver conversas",
      href: LAUNCH_URLS.community,
    },
  ];

  const [todayLead, ...todaySecondary] = today;
  const leadTokens = getCategoryTokens(todayLead.category);

  const quickActions: QuickAction[] = [
    { id: "buscar", label: "Procurar algo", icon: Search, category: "neutral", href: LAUNCH_URLS.search },
    { id: "perto", label: "Perto de mim", icon: Navigation, category: "mobility", href: LAUNCH_URLS.map ?? LAUNCH_URLS.search },
    { id: "comer", label: "Comer agora", icon: UtensilsCrossed, category: "gastronomy", href: LAUNCH_URLS.gastronomy },
    { id: "mob", label: "Como chegar", icon: Car, category: "mobility", href: LAUNCH_URLS.map },
  ];


  const highlights: Highlight[] = [
    {
      kind: "post",
      category: "discussion",
      id: "h1",
      author: "Juliana Santos",
      avatarInitial: "J",
      time: "2h",
      title: "Alguém recomenda chaveiro por aqui?",
      replies: 8,
      neighborhood: territoryName,
      href: LAUNCH_URLS.community,
    },
    {
      kind: "empresa",
      category: "business",
      id: "h2",
      title: "Mercado Bom Dia",
      status: "Aberto agora",
      distance: "a 450 m de você",
      rating: "4,7 — 128 vizinhos avaliaram",
      href: LAUNCH_URLS.business,
    },
    {
      kind: "evento",
      category: "event",
      id: "h3",
      title: "Feira local no sábado",
      place: "Praça Ana Lúcia",
      time: "sábado às 10h",
      href: LAUNCH_URLS.events,
    },

  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(q ? `${LAUNCH_URLS.search}?q=${encodeURIComponent(q)}` : LAUNCH_URLS.search);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24 text-foreground">
      {/* 1. TERRITÓRIO — sempre fixo no topo */}
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`Mudar de bairro. Você está na ${territoryName}.`}
          >
            <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[18px] font-semibold leading-tight">
                  {territoryName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <span className="block truncate text-[12px] text-muted-foreground">
                {cityLine}
              </span>
            </span>
          </button>

          <Link
            to={user ? "/notificacoes" : "/login"}
            aria-label={
              user && unreadCount > 0
                ? `${unreadCount} novidades para você`
                : "Ver novidades"
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Bell className="h-5 w-5" />
            {user && unreadCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-category-alert px-1 text-[10px] font-bold text-category-alert-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>

        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-3">
        {/* 2. BUSCA */}
        <form onSubmit={handleSubmit} role="search" className="relative">
          <label className="sr-only" htmlFor="territory-search">
            Procurar algo na {territoryName}
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="territory-search"
            name="q"
            type="search"
            placeholder="Procurar no bairro: pizza, chaveiro, feira..."
            className="h-12 w-full rounded-full border border-border bg-muted/40 pl-12 pr-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />

        </form>

        {/* 3. HOJE — 1 destaque + 2 chips compactos */}
        <section aria-labelledby="today-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="today-title"
              className="font-display text-[16px] font-semibold leading-none"
            >
              Hoje na {territoryName}
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Abrir o bairro
            </Link>

          </div>

          <Link
            to={todayLead.href}
            className={`flex items-start gap-3 rounded-2xl border p-4 transition-transform hover:-translate-y-0.5 hover:shadow-sm ${leadTokens.chip}`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${leadTokens.badge}`}
              aria-hidden="true"
            >
              <todayLead.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${leadTokens.text}`}>
                {todayLead.kind}
              </span>
              <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-foreground">
                {todayLead.title}
              </p>
              <span className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold ${leadTokens.text}`}>
                {todayLead.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </Link>

          <ul className="mt-2 grid grid-cols-2 gap-2">
            {todaySecondary.map((item) => {
              const tokens = getCategoryTokens(item.category);
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 transition-colors hover:bg-muted/40`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tokens.chip}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`block text-[10px] font-semibold uppercase tracking-wide ${tokens.text}`}>
                        {item.kind}
                      </span>
                      <p className="truncate text-[12px] leading-tight text-foreground">
                        {item.title}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 4. DESTAQUES */}
        <section aria-labelledby="highlights-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="highlights-title"
              className="font-display text-[16px] font-semibold leading-none"
            >
              Vale conferir
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Ver mais do bairro
            </Link>

          </div>

          <ul className="space-y-3">
            {highlights.map((h) => {
              const tokens = getCategoryTokens(h.category);
              if (h.kind === "post") {
                return (
                  <li key={h.id}>
                    <Link
                      to={h.href}
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${tokens.chip}`}>
                        {h.avatarInitial}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            {tokens.label}
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {h.author}
                          </span>
                          <span>· {h.time}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug">
                          {h.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {h.replies} vizinhos comentaram
                        </p>

                      </div>
                      <span className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        {h.replies}
                      </span>
                    </Link>
                  </li>
                );
              }

              if (h.kind === "empresa") {
                return (
                  <li key={h.id}>
                    <Link
                      to={h.href}
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                        <Star className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            {tokens.label}
                          </span>
                          <span className="truncate font-semibold text-foreground">
                            {h.title}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        </div>
                        <p className={`mt-1 text-[13px] ${tokens.text}`}>
                          {h.status} · {h.distance}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          ★ {h.rating}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={h.id}>
                  <Link
                    to={h.href}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                      <Calendar className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tokens.chip}`}>
                          {tokens.label}
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {h.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {h.place} · {h.time}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 5. AÇÕES RÁPIDAS — chips compactos, abaixo da dobra */}
        <section aria-labelledby="quick-title" className="mt-6">
          <h2
            id="quick-title"
            className="mb-3 font-display text-[16px] font-semibold leading-none"
          >
            O que você quer fazer?
          </h2>

          <ul className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const tokens = getCategoryTokens(action.category);
              const Icon = action.icon;
              return (
                <li key={action.id}>
                  <Link
                    to={action.href}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-muted/40 ${tokens.chip}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {action.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 6. EXPLORE — descoberta por vertical, sem card gradiente/banner */}
        <section aria-labelledby="explore-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="explore-title"
              className="font-display text-[16px] font-semibold leading-none"
            >
              Explore o bairro
            </h2>
            <Link
              to={LAUNCH_URLS.search}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Buscar
            </Link>
          </div>

          <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { label: "Gastronomia", href: LAUNCH_URLS.gastronomy },
              { label: "Mobilidade", href: LAUNCH_URLS.map },
              { label: "Empresas", href: LAUNCH_URLS.business },
              { label: "Serviços", href: LAUNCH_URLS.services },
              { label: "Imóveis", href: LAUNCH_URLS.business },
              { label: "Eventos", href: LAUNCH_URLS.events },
              { label: "Classificados", href: LAUNCH_URLS.classifieds },
            ]
              .filter((c) => c.href && c.href !== "#")
              .map((c) => (
                <li key={c.label} className="snap-start">
                  <Link
                    to={c.href}
                    className="inline-flex min-h-9 items-center rounded-full border border-border bg-background px-3 text-[13px] font-medium text-foreground/80 hover:border-primary/40 hover:text-primary"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
