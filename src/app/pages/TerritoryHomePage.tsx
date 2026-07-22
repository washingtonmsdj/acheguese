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
  Mic,
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

/**
 * Territory Home
 * -----------------------------------------------------------
 * Home oficial do território ativo (bairro/cidade).
 * Responde: "O que é importante neste território agora?"
 * Não é catálogo de módulos, não é dashboard.
 */

type Tone = "amber" | "green" | "violet" | "blue" | "orange" | "pink" | "rose";

type TodayItem = {
  id: string;
  kind: "Alerta" | "Evento" | "Discussão";
  icon: LucideIcon;
  tone: Tone;
  title: string;
  cta: string;
  href: string;
};

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  href: string;
};

type Highlight =
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

const TONE_BG: Record<Tone, string> = {
  amber: "bg-amber-50 dark:bg-amber-500/10",
  green: "bg-emerald-50 dark:bg-emerald-500/10",
  violet: "bg-violet-50 dark:bg-violet-500/10",
  blue: "bg-blue-50 dark:bg-blue-500/10",
  orange: "bg-orange-50 dark:bg-orange-500/10",
  pink: "bg-pink-50 dark:bg-pink-500/10",
  rose: "bg-rose-50 dark:bg-rose-500/10",
};
const TONE_FG: Record<Tone, string> = {
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  blue: "text-blue-600 dark:text-blue-400",
  orange: "text-orange-600 dark:text-orange-400",
  pink: "text-pink-600 dark:text-pink-400",
  rose: "text-rose-600 dark:text-rose-400",
};
const TONE_SOLID: Record<Tone, string> = {
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
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
      kind: "Alerta",
      icon: AlertTriangle,
      tone: "amber",
      title: `Interdição na Rua das Orquídeas até 17h.`,
      cta: "Ver no mapa",
      href: LAUNCH_URLS.map ?? "#",
    },
    {
      id: "t2",
      kind: "Evento",
      icon: Calendar,
      tone: "green",
      title: `Feira orgânica na Praça Ana Lúcia, sábado 7h.`,
      cta: "Ver detalhes",
      href: LAUNCH_URLS.events,
    },
    {
      id: "t3",
      kind: "Discussão",
      icon: MessageCircle,
      tone: "violet",
      title: `Alguém recomenda um bom eletricista por aqui?`,
      cta: "Ver conversas",
      href: LAUNCH_URLS.community,
    },
  ];

  const quickActions: QuickAction[] = [
    { id: "buscar", label: "Buscar", icon: Search, tone: "green", href: LAUNCH_URLS.search },
    { id: "perto", label: "Perto de mim", icon: Navigation, tone: "violet", href: LAUNCH_URLS.map ?? LAUNCH_URLS.search },
    { id: "comer", label: "Comer agora", icon: UtensilsCrossed, tone: "orange", href: LAUNCH_URLS.gastronomy },
    { id: "mob", label: "Mobilidade", icon: Car, tone: "blue", href: LAUNCH_URLS.mobility ?? "#" },
  ];

  const highlights: Highlight[] = [
    {
      kind: "post",
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
      id: "h2",
      title: "Mercado Bom Dia",
      status: "Aberto",
      distance: "450 m",
      rating: "4,7 (128)",
      href: LAUNCH_URLS.business,
    },
    {
      kind: "evento",
      id: "h3",
      title: "Feira local no sábado",
      place: "Praça Ana Lúcia",
      time: "10h",
      href: LAUNCH_URLS.events,
    },
    {
      kind: "oferta",
      id: "h4",
      title: "Farmácia Saúde+",
      detail: "Até 30% de desconto em vitaminas",
      href: LAUNCH_URLS.coupons ?? LAUNCH_URLS.business,
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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`Trocar território. Atual: ${territoryName}`}
          >
            <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[20px] font-semibold leading-tight">
                  {territoryName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <span className="block truncate text-[13px] text-muted-foreground">
                {cityLine}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1">
            <Link
              to={LAUNCH_URLS.search}
              aria-label="Buscar"
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              to={user ? "/notificacoes" : "/login"}
              aria-label={
                user && unreadCount > 0
                  ? `Notificações, ${unreadCount} não lidas`
                  : "Notificações"
              }
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Bell className="h-5 w-5" />
              {user && unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        {/* 2. BUSCA */}
        <form onSubmit={handleSubmit} role="search" className="relative">
          <label className="sr-only" htmlFor="territory-search">
            O que você procura no bairro?
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="territory-search"
            name="q"
            type="search"
            placeholder="O que você procura no bairro?"
            className="h-14 w-full rounded-full border border-border bg-muted/40 pl-12 pr-14 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button
            type="button"
            aria-label="Buscar por voz"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Mic className="h-5 w-5" />
          </button>
        </form>

        {/* 3. HOJE NO TERRITÓRIO */}
        <section aria-labelledby="today-title" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="today-title"
              className="font-display text-[18px] font-semibold leading-none"
            >
              Hoje na {territoryName}
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[14px] font-medium text-primary hover:underline"
            >
              Ver tudo
            </Link>
          </div>

          <ul className="grid grid-cols-3 gap-3">
            {today.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className={`flex h-full min-h-[168px] flex-col justify-between rounded-2xl border border-border/60 p-3 transition-transform hover:-translate-y-0.5 hover:shadow-sm ${TONE_BG[item.tone]}`}
                  >
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${TONE_FG[item.tone]}`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.kind}
                      </span>
                      <p className="mt-2 line-clamp-4 text-[13px] leading-snug text-foreground">
                        {item.title}
                      </p>
                    </div>
                    <span className={`mt-2 text-[12px] font-semibold ${TONE_FG[item.tone]}`}>
                      {item.cta}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 4. AÇÕES RÁPIDAS */}
        <section aria-labelledby="quick-title" className="mt-7">
          <h2
            id="quick-title"
            className="mb-3 font-display text-[18px] font-semibold leading-none"
          >
            Ações rápidas
          </h2>
          <ul className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.id}>
                  <Link
                    to={action.href}
                    className="flex flex-col items-center gap-2 text-center focus-visible:outline-none"
                  >
                    <span
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-sm transition-transform hover:-translate-y-0.5 ${TONE_SOLID[action.tone]}`}
                    >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <span className="text-[12px] font-medium leading-tight text-foreground">
                      {action.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 5. DESTAQUES DO TERRITÓRIO */}
        <section aria-labelledby="highlights-title" className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="highlights-title"
              className="font-display text-[18px] font-semibold leading-none"
            >
              Destaques do seu bairro
            </h2>
            <Link
              to={LAUNCH_URLS.community}
              className="text-[14px] font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <ul className="space-y-3">
            {highlights.map((h) =>
              h.kind === "post" ? (
                <li key={h.id}>
                  <Link
                    to={h.href}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[15px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      {h.avatarInitial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                          Post
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
                        {h.replies} respostas · {h.neighborhood}
                      </p>
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {h.replies}
                    </span>
                  </Link>
                </li>
              ) : h.kind === "empresa" ? (
                <li key={h.id}>
                  <Link
                    to={h.href}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <Star className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Empresa
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {h.title}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      </div>
                      <p className="mt-1 text-[13px] text-emerald-600 dark:text-emerald-400">
                        {h.status} · {h.distance}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        ★ {h.rating}
                      </p>
                    </div>
                  </Link>
                </li>
              ) : h.kind === "evento" ? (
                <li key={h.id}>
                  <Link
                    to={h.href}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                      <Calendar className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                          Evento
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
              ) : (
                <li key={h.id}>
                  <Link
                    to={h.href}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300">
                      <Star className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="rounded-md bg-pink-100 px-1.5 py-0.5 text-[11px] font-semibold text-pink-700 dark:bg-pink-500/20 dark:text-pink-300">
                          Oferta
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {h.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {h.detail}
                      </p>
                    </div>
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>

        {/* 6. EXPLORE MAIS DO TERRITÓRIO */}
        <section aria-labelledby="explore-title" className="mt-7">
          <Link
            to={LAUNCH_URLS.search}
            className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 dark:from-emerald-500/10 dark:to-emerald-500/5"
          >
            <div className="min-w-0">
              <h2 id="explore-title" className="text-[16px] font-semibold text-foreground">
                Explore mais do seu bairro
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Descubra empresas, serviços, eventos, ofertas e muito mais.
              </p>
            </div>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md"
              aria-hidden="true"
            >
              <ArrowRight className="h-5 w-5" />
            </span>
          </Link>

          {/* Portas de entrada para universos especializados */}
          <ul className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { label: "Gastronomia", href: LAUNCH_URLS.gastronomy },
              { label: "Mobilidade", href: LAUNCH_URLS.mobility ?? "#" },
              { label: "Empresas", href: LAUNCH_URLS.business },
              { label: "Serviços", href: LAUNCH_URLS.services },
              { label: "Imóveis", href: LAUNCH_URLS.realEstate ?? "#" },
              { label: "Eventos", href: LAUNCH_URLS.events },
              { label: "Classificados", href: LAUNCH_URLS.classifieds ?? "#" },
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
