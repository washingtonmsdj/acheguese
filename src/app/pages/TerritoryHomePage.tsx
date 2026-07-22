import { useMemo, type FormEvent } from "react";
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
  TrendingUp,
  UtensilsCrossed,
  Users,
  Mic,
  Store,
  Wrench,
  Car,
  BadgeCheck,
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
 * Territory Home — Sprint HOME.2 (editorial rich)
 * -----------------------------------------------------------
 * Responde em <5s: "onde estou · o que está acontecendo · como participo".
 * Estrutura:
 *  1. Header territorial + notificações
 *  2. Busca
 *  3. Agora na {bairro} — pulso do bairro (4 métricas)
 *  4. Hoje na {bairro} — 3 cards editoriais com capa
 *  5. Acontecendo no bairro — feed misto com thumbs
 *  6. Explore o que você precisa — grid de verticais
 */

type PulseCard = {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
  hint?: string;
  category: ContentCategoryKey;
  trend?: boolean;
};

type TodayCard = {
  id: string;
  kind: "Alerta" | "Evento" | "Discussão";
  category: ContentCategoryKey;
  title: string;
  meta: string;
  cta: string;
  href: string;
  cover: string;
  coverAlt: string;
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
      thumb: string;
    }
  | {
      kind: "evento";
      id: string;
      title: string;
      place: string;
      time: string;
      href: string;
      thumb: string;
    }
  | {
      kind: "oferta";
      id: string;
      title: string;
      detail: string;
      href: string;
      thumb: string;
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
    { id: "p2", icon: UtensilsCrossed, value: "15", label: "Restaurantes", hint: "abertos", category: "gastronomy" },
    { id: "p3", icon: AlertTriangle, value: "1", label: "Alerta ativo", hint: "Ver detalhes", category: "alert" },
    { id: "p4", icon: Users, value: "Alto", label: "Movimento", hint: "agora", category: "discussion", trend: true },
  ];

  const today: TodayCard[] = [
    {
      id: "t1",
      kind: "Alerta",
      category: "alert",
      title: "Interdição na Rua das Orquídeas",
      meta: "Até 17h · Hoje",
      cta: "Ver no mapa",
      href: LAUNCH_URLS.map ?? "#",
      cover:
        "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=70",
      coverAlt: "Obra em rua urbana",
    },
    {
      id: "t2",
      kind: "Evento",
      category: "event",
      title: "Feira orgânica na Praça Ana Lúcia",
      meta: "Sábado, 7h às 12h",
      cta: "Ver detalhes",
      href: LAUNCH_URLS.events,
      cover:
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=600&q=70",
      coverAlt: "Barraca de feira com frutas",
    },
    {
      id: "t3",
      kind: "Discussão",
      category: "discussion",
      title: "Alguém recomenda um bom veterinário?",
      meta: "12 respostas · Pituba",
      cta: "Ver conversas",
      href: LAUNCH_URLS.community,
      cover:
        "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=70",
      coverAlt: "Cachorro em parque",
    },
  ];

  const feed: FeedItem[] = [
    {
      kind: "post",
      id: "f1",
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
      id: "f2",
      title: "Mercado Bom Dia",
      status: "Aberto",
      distance: "450 m",
      rating: "4,7 (128)",
      href: LAUNCH_URLS.business,
      thumb:
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=70",
    },
    {
      kind: "evento",
      id: "f3",
      title: "Feira local no sábado",
      place: "Praça Ana Lúcia",
      time: "10h",
      href: LAUNCH_URLS.events,
      thumb:
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=200&q=70",
    },
    {
      kind: "oferta",
      id: "f4",
      title: "Farmácia Saúde+",
      detail: "Até 30% de desconto em vitaminas",
      href: LAUNCH_URLS.business,
      thumb:
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=200&q=70",
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
    <div className="min-h-[100dvh] bg-background pb-24 text-foreground">
      {/* 1. HEADER TERRITORIAL */}
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`Mudar de bairro. Você está em ${territoryName}.`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
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

          <div className="flex items-center gap-1">
            <Link
              to={LAUNCH_URLS.search}
              aria-label="Buscar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Search className="h-5 w-5" />
            </Link>
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
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-3">
        {/* 2. BUSCA */}
        <form onSubmit={handleSubmit} role="search" className="relative">
          <label className="sr-only" htmlFor="territory-search">
            Procurar algo em {territoryName}
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="territory-search"
            name="q"
            type="search"
            placeholder="Procure empresas, serviços, eventos ou pessoas…"
            className="h-12 w-full rounded-full border border-border bg-muted/40 pl-12 pr-12 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button
            type="button"
            aria-label="Buscar por voz"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Mic className="h-4 w-4" />
          </button>
        </form>

        {/* 3. AGORA — pulso do bairro */}
        <section aria-labelledby="pulse-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="pulse-title" className="font-display text-[16px] font-semibold leading-none">
              Agora em {territoryName}
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Ver mais ›
            </Link>
          </div>

          <ul className="grid grid-cols-4 gap-2">
            {pulse.map((card) => {
              const tokens = getCategoryTokens(card.category);
              const Icon = card.icon;
              return (
                <li key={card.id}>
                  <div className="flex h-full flex-col items-start gap-1.5 rounded-2xl border border-border/60 bg-card p-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tokens.chip}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-[18px] font-semibold leading-none">
                      {card.value}
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-foreground/90">
                      {card.label}
                    </span>
                    {card.hint ? (
                      <span
                        className={`text-[10px] leading-tight ${
                          card.category === "alert" ? tokens.text : "text-muted-foreground"
                        }`}
                      >
                        {card.hint}
                      </span>
                    ) : null}
                    {card.trend ? (
                      <TrendingUp className="mt-auto h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 4. HOJE — cards editoriais com capa */}
        <section aria-labelledby="today-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="today-title" className="font-display text-[16px] font-semibold leading-none">
              Hoje em {territoryName}
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Ver tudo ›
            </Link>
          </div>

          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {today.map((item) => {
              const tokens = getCategoryTokens(item.category);
              return (
                <li key={item.id} className="min-w-0">
                  <Link
                    to={item.href}
                    className="group block overflow-hidden rounded-2xl border border-border/60 bg-card transition-transform hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={item.cover}
                        alt={item.coverAlt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tokens.chip}`}
                      >
                        {item.kind}
                      </span>
                    </div>
                    <div className="p-2 sm:p-3">
                      <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground sm:text-[14px]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-[12px]">{item.meta}</p>
                      <span className={`mt-1 inline-block text-[10px] font-semibold sm:text-[12px] ${tokens.text}`}>
                        {item.cta}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 5. ACONTECENDO — feed misto */}
        <section aria-labelledby="feed-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="feed-title" className="font-display text-[16px] font-semibold leading-none">
              Acontecendo no bairro
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Ver todos ›
            </Link>
          </div>

          <ul className="space-y-2.5">
            {feed.map((item) => {
              if (item.kind === "post") {
                const tokens = getCategoryTokens("discussion");
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${tokens.chip}`}>
                        {item.avatarInitial}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`rounded-md px-1.5 py-0.5 font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            Post
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {item.author}
                          </span>
                          <span className="text-muted-foreground">· {item.time}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {item.replies} respostas · {item.neighborhood}
                        </p>
                      </div>
                      <span className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
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
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                        <Store className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`rounded-md px-1.5 py-0.5 font-semibold uppercase tracking-wide ${tokens.chip}`}>
                            Empresa
                          </span>
                          <span className="truncate font-semibold text-foreground">
                            {item.title}
                          </span>
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        </div>
                        <p className={`mt-1 text-[13px] ${tokens.text}`}>
                          {item.status} · {item.distance} · ★ {item.rating}
                        </p>
                      </div>
                      <img
                        src={item.thumb}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
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
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                        <Calendar className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`rounded-md px-1.5 py-0.5 font-semibold uppercase tracking-wide ${tokens.chip}`}>
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
                      <img
                        src={item.thumb}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
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
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tokens.chip}`}>
                      <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={`rounded-md px-1.5 py-0.5 font-semibold uppercase tracking-wide ${tokens.chip}`}>
                          Oferta
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {item.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">{item.detail}</p>
                    </div>
                    <img
                      src={item.thumb}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 6. EXPLORE — grid de verticais */}
        <section aria-labelledby="explore-title" className="mt-6">
          <h2
            id="explore-title"
            className="mb-3 font-display text-[16px] font-semibold leading-none"
          >
            Explore o que você precisa
          </h2>

          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {explore.map((vertical) => {
              const tokens = getCategoryTokens(vertical.category);
              const Icon = vertical.icon;
              return (
                <li key={vertical.id}>
                  <Link
                    to={vertical.href}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tokens.chip}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-foreground">
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
