import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  FileText,
  Globe2,
  HeartHandshake,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  ShieldCheck,
  Store,
  Users,
  Utensils,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/app/config/launchScope";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { cn } from "@/shared/utils/cn";
import heroCommunity from "@/assets/complexo-comercio.jpg";
import communityPhoto from "@/assets/complexo-cultura.jpg";
import residentPhoto from "@/assets/persona-morador.jpg";
import businessPhoto from "@/assets/persona-comerciante.jpg";
import professionalPhoto from "@/assets/persona-prestador.jpg";

const FALLBACK_COMMUNITY_NAME = "Complexo do Nordeste de Amaralina";
const COMMUNITY_NAME =
  TERRITORY_CONFIG.launch.community.name || FALLBACK_COMMUNITY_NAME;
const COMMUNITY_CITY = TERRITORY_CONFIG.launch.name || "Salvador";
const COMMUNITY_SHORT_NAME = COMMUNITY_NAME.replace(/^Complexo do /, "");

type ModuleDefinition = {
  id: string;
  surface: LaunchSurfaceKey;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const MODULES: readonly ModuleDefinition[] = [
  {
    id: "community",
    surface: "community",
    title: "Comunidade",
    description: "Pessoas, histórias e iniciativas locais.",
    href: LAUNCH_URLS.community,
    icon: Users,
  },
  {
    id: "business",
    surface: "business",
    title: "Negócios",
    description: "Conheça e apoie negócios da região.",
    href: LAUNCH_URLS.business,
    icon: Store,
  },
  {
    id: "services",
    surface: "services",
    title: "Serviços",
    description: "Encontre serviços e profissionais.",
    href: LAUNCH_URLS.services,
    icon: Wrench,
  },
  {
    id: "gastronomy",
    surface: "gastronomy",
    title: "Gastronomia",
    description: "Sabores que fazem parte da história.",
    href: LAUNCH_URLS.gastronomy,
    icon: Utensils,
  },
  {
    id: "classifieds",
    surface: "classifieds",
    title: "Classificados",
    description: "Divulgue e encontre o que precisa.",
    href: LAUNCH_URLS.classifieds,
    icon: FileText,
  },
  {
    id: "map",
    surface: "map",
    title: "Mapa",
    description: "Explore os lugares do território.",
    href: LAUNCH_URLS.map,
    icon: MapPin,
  },
] as const;

const ENABLED_MODULES = MODULES.filter((module) =>
  isLaunchSurfaceEnabled(module.surface),
);

const PROFILES = [
  {
    name: "Ana Oliveira",
    type: "Pessoal",
    description: "Participe da comunidade, comente e compartilhe histórias.",
    image: residentPhoto,
  },
  {
    name: "Sabores da Ana",
    type: "Negócio",
    description: "Divulgue seu negócio, compartilhe novidades e converse com clientes.",
    image: businessPhoto,
  },
  {
    name: "Ana Serviços",
    type: "Profissional",
    description: "Ofereça seus serviços e mostre o seu trabalho.",
    image: professionalPhoto,
  },
] as const;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--territory-focus))]";

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span
      className={cn(
        "font-heading text-[1.35rem] font-bold tracking-[-0.055em] sm:text-[1.5rem]",
        light ? "text-white" : "text-territory-brand",
      )}
    >
      achegue-se<span className="text-territory-sun">.</span>
    </span>
  );
}

function PrimaryAction({
  children,
  to,
  className,
  onClick,
}: {
  children: ReactNode;
  to: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-territory-sun px-5 py-3 text-sm font-bold text-territory-ink transition-colors hover:bg-territory-sun/85",
        focusRing,
        className,
      )}
    >
      {children}
    </Link>
  );
}

function SecondaryAction({
  children,
  to,
  className,
}: {
  children: ReactNode;
  to: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-territory-brand px-5 py-3 text-sm font-semibold text-territory-brand transition-colors hover:bg-territory-brand/5",
        focusRing,
        className,
      )}
    >
      {children}
    </Link>
  );
}

function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-territory-brand">
      {children}
    </p>
  );
}

function ModuleCard({ module }: { module: ModuleDefinition }) {
  const Icon = module.icon;

  return (
    <Link
      to={module.href}
      className={cn(
        "group flex min-h-[7.5rem] flex-col items-center justify-center rounded-2xl border border-territory-border bg-territory-surface px-3 py-4 text-center shadow-[0_7px_24px_-22px_hsl(var(--shadow-color)/0.6)] transition-colors hover:border-territory-brand/30 hover:bg-territory-brand/[0.03] lg:min-h-[4.75rem] lg:flex-row lg:items-center lg:justify-start lg:gap-2 lg:rounded-xl lg:px-3 lg:py-3 lg:text-left",
        focusRing,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center text-territory-brand transition-colors lg:h-8 lg:w-8">
        <Icon className="h-8 w-8 lg:h-7 lg:w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="mt-3 block text-sm font-bold text-territory-ink lg:mt-0 lg:text-xs">{module.title}</span>
        <span className="mt-1 block max-w-[11rem] text-xs leading-4 text-territory-muted lg:max-w-none lg:text-[0.7rem]">
          {module.description}
        </span>
      </span>
    </Link>
  );
}

function ProfileCard({
  name,
  type,
  description,
  image,
}: (typeof PROFILES)[number]) {
  return (
    <article className="flex h-full items-center gap-3 rounded-2xl border border-territory-border bg-territory-surface p-3 sm:gap-4 sm:p-4 lg:min-h-[5.5rem] lg:gap-2 lg:p-2">
      <img
        src={image}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16 lg:h-10 lg:w-10"
        loading="lazy"
        decoding="async"
      />
      <div className="min-w-0">
        <h3 className="font-heading text-base font-bold leading-5 text-territory-ink lg:text-sm lg:leading-4">{name}</h3>
        <p className="mt-0.5 text-xs font-semibold text-territory-brand lg:text-[0.68rem]">{type}</p>
        <p className="mt-1 text-sm leading-5 text-territory-muted lg:line-clamp-3 lg:text-[0.62rem] lg:leading-3">{description}</p>
      </div>
    </article>
  );
}

function RespectRow({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-territory-border py-3 last:border-b-0 lg:gap-2 lg:py-2">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/[0.08] text-territory-brand lg:h-8 lg:w-8">
        <Icon className="h-5 w-5 lg:h-4 lg:w-4" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-bold text-territory-ink lg:text-xs">{title}</h3>
        <p className="mt-0.5 text-sm leading-5 text-territory-muted lg:text-[0.7rem] lg:leading-4">{description}</p>
      </div>
    </div>
  );
}

function AccountStrip({
  icon: Icon,
  title,
  description,
  warm = false,
  to,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  warm?: boolean;
  to?: string;
  cta?: string;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/[0.08] text-territory-brand lg:h-8 lg:w-8 lg:bg-transparent">
        <Icon className="h-5 w-5 lg:h-7 lg:w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-territory-ink">{title}</span>
        <span className="mt-0.5 block text-sm leading-5 text-territory-muted">{description}</span>
        {cta ? (
          <span className={cn(
            "sm:hidden",
            warm
              ? "mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-territory-sun px-3 text-sm font-bold text-territory-ink"
              : "mt-2 block text-sm font-semibold text-territory-brand underline underline-offset-2",
          )}>
            {cta} <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" />
          </span>
        ) : null}
      </span>
    </>
  );

  const className = cn(
    "flex min-h-[6rem] items-center gap-3 rounded-2xl px-4 py-4 sm:px-5 lg:h-14 lg:min-h-0 lg:py-2",
    warm ? "bg-territory-sun/25" : "bg-territory-brand/[0.06]",
    to && cn("transition-colors hover:bg-territory-brand/[0.1]", focusRing),
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function FaqItem({ question, children, open = false }: { question: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="group rounded-xl border border-territory-border bg-territory-surface" open={open}>
      <summary className={cn("flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-bold text-territory-ink [&::-webkit-details-marker]:hidden lg:min-h-10 lg:px-3 lg:py-2 lg:text-xs", focusRing)}>
        {question}
        <ChevronDown className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-territory-border px-4 pb-4 pt-3 text-sm leading-5 text-territory-muted lg:px-3 lg:pb-3 lg:pt-2 lg:text-xs lg:leading-4">
        {children}
      </div>
    </details>
  );
}

export default function ComoFuncionaPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Como funciona | Achegue-se</title>
        <meta
          name="description"
          content="Entenda como o Achegue-se conecta pessoas, negócios e histórias ao território."
        />
      </Helmet>

      <div className="min-h-screen overflow-x-hidden bg-territory-canvas text-territory-ink">
        <header className="sticky top-0 z-40 border-b border-territory-border/80 bg-territory-canvas/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 w-full max-w-[76rem] items-center justify-between px-5 sm:px-8 lg:min-h-[4.5rem] lg:px-10">
            <Link to="/?trocar=territorio" aria-label="Achegue-se — início" className={focusRing}>
              <Wordmark />
            </Link>

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação institucional">
              <Link
                to="/como-funciona"
                className={cn("relative py-2 text-sm font-semibold text-territory-ink after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-territory-sun", focusRing)}
              >
                Como funciona
              </Link>
              <Link to="/contato" className={cn("py-2 text-sm font-semibold text-territory-muted transition-colors hover:text-territory-ink", focusRing)}>
                Ajuda
              </Link>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link to="/login" className={cn("px-3 py-2 text-sm font-semibold text-territory-ink", focusRing)}>
                Entrar
              </Link>
              <SecondaryAction to="/cadastro" className="min-h-10 px-4 py-2 text-xs">
                Criar minha conta
              </SecondaryAction>
            </div>

            <button
              type="button"
              className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl text-territory-brand lg:hidden", focusRing)}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>

          {isMenuOpen ? (
            <nav className="border-t border-territory-border/70 bg-territory-surface px-5 py-3 lg:hidden" aria-label="Menu mobile">
              <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-1">
                <Link to="/como-funciona" onClick={() => setIsMenuOpen(false)} className={cn("rounded-lg px-3 py-3 text-sm font-bold text-territory-brand", focusRing)}>
                  Como funciona
                </Link>
                <Link to="/contato" onClick={() => setIsMenuOpen(false)} className={cn("rounded-lg px-3 py-3 text-sm font-semibold text-territory-ink", focusRing)}>
                  Ajuda
                </Link>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className={cn("rounded-lg px-3 py-3 text-sm font-semibold text-territory-ink", focusRing)}>
                  Entrar
                </Link>
                <PrimaryAction to="/cadastro" className="mt-1 w-full" onClick={() => setIsMenuOpen(false)}>
                  Criar minha conta
                </PrimaryAction>
              </div>
            </nav>
          ) : null}
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[76rem] px-5 pb-16 focus:outline-none sm:px-8 lg:pb-0 lg:px-10">
          <section className="grid gap-7 pb-10 pt-5 sm:pt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-8 lg:gap-y-4 lg:pb-0 lg:pt-8" aria-labelledby="como-funciona-title">
            <div className="lg:pt-5">
              <SectionKicker>Começamos pelo Complexo</SectionKicker>
              <h1 id="como-funciona-title" className="mt-3 max-w-[29rem] font-heading text-[2.45rem] font-bold leading-[0.98] tracking-[-0.06em] text-territory-brand sm:text-5xl lg:mt-2 lg:max-w-none lg:text-[3rem]">
                <span className="block sm:inline">Seu lugar,</span>{" "}
                <span>mais perto.</span>
              </h1>
              <p className="mt-5 max-w-[31rem] text-base leading-6 text-territory-muted sm:text-lg sm:leading-7 lg:mt-2 lg:text-base lg:leading-6">
                <span className="sm:hidden">Encontre negócios, serviços e histórias da sua comunidade.</span>
                <span className="hidden sm:inline">Encontre negócios, serviços e histórias do {COMMUNITY_NAME}, em {COMMUNITY_CITY}.</span>
              </p>
            </div>

            <figure className="order-2 overflow-hidden rounded-2xl border border-territory-border bg-territory-surface shadow-[0_24px_60px_-42px_hsl(var(--shadow-color)/0.8)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:rounded-3xl">
              <img src={heroCommunity} alt={`Comércio e vida comunitária em ${COMMUNITY_NAME}`} className="h-[15rem] w-full object-cover sm:h-[20rem] lg:h-[11.5rem]" />
              <figcaption className="flex items-start gap-2 px-4 py-2.5 text-sm text-territory-muted sm:px-5 lg:items-center lg:text-xs">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
                <span>
                  <strong className="font-bold text-territory-ink">{COMMUNITY_NAME}</strong>
                  <span className="hidden sm:inline"> · {COMMUNITY_CITY} · Bahia</span>
                  <span className="block sm:hidden">{COMMUNITY_CITY} · Bahia</span>
                </span>
              </figcaption>
            </figure>

            <div className="order-3 lg:col-start-1 lg:row-start-2 lg:-mt-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <PrimaryAction to={LAUNCH_URLS.community} className="lg:min-h-10 lg:px-5 lg:py-2 lg:text-xs">
                  Explorar o Complexo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryAction>
                <p className="order-2 self-center text-xs text-territory-muted sm:hidden">Sem cadastro para explorar.</p>
                <SecondaryAction to="/cadastro" className="order-3 lg:min-h-10 lg:px-5 lg:py-2 lg:text-xs">Criar minha conta</SecondaryAction>
              </div>
              <p className="mt-3 hidden text-xs text-territory-muted sm:mt-3 sm:block lg:mt-1">Sem cadastro para explorar.</p>
            </div>
          </section>

          <section className="border-t border-territory-border/80 py-10 sm:py-14 lg:pt-1" aria-labelledby="encontra-title">
            <div className="flex items-end justify-between gap-4">
              <h2 id="encontra-title" className="font-heading text-2xl font-bold leading-tight tracking-[-0.045em] text-territory-brand sm:text-3xl lg:text-xl lg:leading-6">
                <span className="sm:hidden">A vida da comunidade em um só lugar.</span>
                <span className="hidden sm:inline">O que você encontra por aqui</span>
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-0 lg:grid-cols-6">
              {ENABLED_MODULES.map((module) => <ModuleCard key={module.id} module={module} />)}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-4">
              <AccountStrip icon={Globe2} title="Sem conta" description="Explore conteúdos públicos e conheça os lugares." cta="Começar a explorar" to={LAUNCH_URLS.community} />
              <AccountStrip icon={HeartHandshake} title="Com sua conta" description="Converse, participe e gerencie seus perfis." cta="Criar minha conta" warm to="/cadastro" />
            </div>
          </section>

          <section className="grid gap-8 border-t border-territory-border/80 py-10 sm:py-14 lg:grid-cols-2 lg:gap-8 lg:pb-4" aria-labelledby="participar-title">
            <div className="min-w-0">
              <h2 id="participar-title" className="max-w-2xl font-heading text-2xl font-bold leading-tight tracking-[-0.045em] text-territory-brand sm:text-3xl lg:text-xl lg:leading-6">Uma conta. Diferentes formas de participar.</h2>
              <p className="mt-3 max-w-2xl text-base leading-6 text-territory-muted lg:mt-1 lg:text-xs lg:leading-4">Use seu perfil pessoal e crie outros perfis conforme sua atuação.</p>

              <div className="relative mt-6 grid gap-3 pl-3 before:absolute before:bottom-6 before:left-0 before:top-6 before:w-px before:bg-territory-brand/40 sm:grid-cols-3 sm:pl-0 sm:before:hidden lg:mt-3">
                {PROFILES.map((profile) => (
                  <div key={profile.name} className="relative before:absolute before:-left-[0.95rem] before:top-1/2 before:h-2 before:w-2 before:-translate-y-1/2 before:rounded-full before:bg-territory-brand sm:before:hidden">
                    <ProfileCard {...profile} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-territory-brand/[0.1] px-4 py-3 text-sm font-semibold text-territory-ink sm:px-5 lg:gap-2 lg:py-2 lg:text-xs">
                <Users className="h-5 w-5 shrink-0 text-territory-brand lg:h-4 lg:w-4" aria-hidden="true" />
                <span>Você escolhe com qual perfil publica e conversa.</span>
              </div>

              <div className="mt-8 border-t border-territory-border pt-7 lg:mt-5 lg:pt-4" aria-labelledby="respeito-title">
                <h3 id="respeito-title" className="font-heading text-2xl font-bold tracking-[-0.045em] text-territory-brand sm:text-3xl lg:text-xl lg:leading-6">Participar com respeito</h3>
                <div className="mt-4 divide-y divide-territory-border border-y border-territory-border">
                  <RespectRow icon={LockKeyhole} title="Cuide das suas informações" description="Escolha o que compartilhar e mantenha seus dados seguros." />
                  <RespectRow icon={ShieldCheck} title="Encontre um problema?" description="Ajuda e denúncias ficam disponíveis quando você precisar." />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <article className="relative overflow-hidden rounded-2xl border border-territory-border bg-territory-brand/[0.06] p-5 sm:p-6 lg:h-[11.5rem] lg:min-h-0 lg:p-4">
                <div className="relative z-10 lg:max-w-[54%]">
                  <h2 className="font-heading text-2xl font-bold leading-tight tracking-[-0.045em] text-territory-brand lg:text-lg lg:leading-5">Você também pode chegar junto.</h2>
                  <p className="mt-3 text-sm leading-5 text-territory-muted lg:mt-2 lg:text-[0.68rem] lg:leading-3">Mesmo morando em outro lugar, você pode explorar o Complexo e criar sua conta.</p>
                  <p className="mt-4 text-xs font-semibold text-territory-brand lg:mt-2 lg:text-[0.62rem] lg:leading-3">{COMMUNITY_SHORT_NAME} · Santa Cruz · Vale das Pedrinhas · Chapada</p>
                  <SecondaryAction to="/indicar-comunidade" className="mt-5 hidden min-h-10 px-4 py-2 text-xs lg:mt-3 lg:inline-flex lg:min-h-9 lg:px-3 lg:py-2 lg:text-[0.65rem]">Indicar minha comunidade</SecondaryAction>
                </div>
                <div className="relative mt-5 overflow-hidden rounded-xl border border-territory-border bg-territory-surface lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:w-[43%] lg:rounded-none lg:border-0">
                  <img src={communityPhoto} alt="Paisagem de uma comunidade em expansão" className="h-36 w-full object-cover opacity-90 sm:h-40 lg:h-full" loading="lazy" decoding="async" />
                  <div className="px-4 py-3 text-center lg:hidden">
                    <p className="flex items-center justify-center gap-2 text-sm font-bold text-territory-ink"><Building2 className="h-4 w-4 text-territory-brand" aria-hidden="true" />Nossa primeira comunidade</p>
                    <p className="mt-1 text-sm text-territory-muted">{COMMUNITY_SHORT_NAME} · {COMMUNITY_CITY}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-territory-border/80 pt-5 lg:hidden">
                  <h3 className="font-heading text-xl font-bold tracking-[-0.04em] text-territory-brand">Quer ver sua comunidade aqui?</h3>
                  <p className="mt-2 text-sm leading-5 text-territory-muted">A expansão acontece por etapas, sem data definida para novos locais.</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <SecondaryAction to="/indicar-comunidade" className="min-h-10 px-4 py-2 text-xs">Indicar minha comunidade</SecondaryAction>
                    <PrimaryAction to={LAUNCH_URLS.community} className="min-h-10 px-4 py-2 text-xs">Explorar o Complexo <ArrowRight className="h-4 w-4" aria-hidden="true" /></PrimaryAction>
                  </div>
                  <p className="mt-3 text-center text-xs text-territory-muted">Indicar um lugar não exige criar uma conta.</p>
                </div>
              </article>

              <div className="mt-8 lg:mt-6" aria-labelledby="faq-title">
                <h2 id="faq-title" className="font-heading text-2xl font-bold tracking-[-0.045em] text-territory-brand sm:text-3xl lg:text-xl lg:leading-6">Dúvidas frequentes</h2>
                <div className="mt-4 grid gap-2">
                  <FaqItem question="Preciso morar no Complexo?" open>
                    Não. Você pode explorar e criar uma conta de qualquer lugar.
                  </FaqItem>
                  <FaqItem question="Quando preciso criar uma conta?">
                    A conta é necessária para conversar, participar e gerenciar seus perfis.
                  </FaqItem>
                  <FaqItem question="Como indicar outra comunidade?">
                    Use o botão de indicação e conte de onde você é. A expansão será avaliada por etapas.
                  </FaqItem>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-territory-border/80 bg-territory-surface">
          <div className="mx-auto flex w-full max-w-[76rem] flex-col items-center gap-5 px-5 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left lg:px-10">
            <Link to="/?trocar=territorio" aria-label="Achegue-se — início" className={focusRing}><Wordmark /></Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-territory-muted" aria-label="Links do rodapé">
              <Link to="/contato" className={cn("hover:text-territory-ink", focusRing)}>Ajuda</Link>
              <span aria-hidden="true">·</span>
              <Link to="/privacidade" className={cn("hover:text-territory-ink", focusRing)}>Privacidade</Link>
              <span aria-hidden="true">·</span>
              <Link to="/termos" className={cn("hover:text-territory-ink", focusRing)}>Termos</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
