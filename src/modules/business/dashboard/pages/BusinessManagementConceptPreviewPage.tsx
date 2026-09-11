import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Home,
  MapPin,
  Megaphone,
  MessageCircle,
  Plus,
  Search,
  Settings,
  UserRound,
  Users,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import secondFoodImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import ownerImage from "@/assets/persona-comerciante.jpg";
import { cn } from "@/shared/utils/cn";

const territoryHref = "/ba/salvador/complexo-do-nordeste-de-amaralina";

type BusinessNavItem = {
  label: string;
  icon: LucideIcon;
};

const businessNavItems: BusinessNavItem[] = [
  { label: "Visão geral", icon: Home },
  { label: "Perfil público", icon: UserRound },
  { label: "Cardápio", icon: Utensils },
  { label: "Conversas", icon: MessageCircle },
  { label: "Publicações e ofertas", icon: Megaphone },
  { label: "Equipe e acessos", icon: Users },
  { label: "Configurações", icon: Settings },
];

const globalNavItems: BusinessNavItem[] = [
  { label: "Início", icon: Home },
  { label: "Explorar", icon: Search },
  { label: "Comunidade", icon: Users },
  { label: "Conversas", icon: MessageCircle },
  { label: "Conta", icon: UserRound },
];

function getGlobalNavHref(label: string) {
  if (label === "Início") return territoryHref;
  if (label === "Explorar") return "/busca/ba/salvador/complexo-do-nordeste-de-amaralina";
  if (label === "Comunidade") return "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina";
  if (label === "Conversas") return "/mensagens?concept-mock=1";
  return "/conta?concept-mock=1";
}

function ConceptBrand() {
  return (
    <Link to={territoryHref} className="inline-flex items-baseline font-heading text-[1.55rem] font-bold tracking-[-0.055em] text-territory-ink">
      achegue-se<span className="ml-0.5 text-territory-sun">.</span>
    </Link>
  );
}

function ConceptAvatar({ className }: { className?: string }) {
  return <img src={ownerImage} alt="Ana" className={cn("rounded-full object-cover", className)} />;
}

function ConceptBusinessHeader() {
  return (
    <header className="hidden h-16 items-center overflow-hidden border-b border-territory-border bg-territory-surface px-4 md:flex lg:px-6 xl:px-8">
      <ConceptBrand />
      <div className="ml-auto flex min-w-0 items-center gap-2 lg:gap-4">
        <div className="flex min-w-0 items-center gap-2 border-l border-territory-border pl-4 text-sm text-territory-ink lg:pl-6">
          <MapPin className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
          <div className="min-w-0 leading-tight">
            <p className="max-w-[13rem] truncate font-semibold">Complexo do Nordeste de Amaralina <ChevronDown className="ml-1 inline h-4 w-4" aria-hidden="true" /></p>
            <p className="text-xs text-territory-muted">Salvador, BA</p>
          </div>
        </div>
        <Bell className="h-5 w-5 shrink-0 text-territory-ink" aria-label="Notificações" />
        <div className="flex shrink-0 items-center gap-2 border-l border-territory-border pl-3 lg:pl-5">
          <ConceptAvatar className="h-9 w-9" />
          <span className="text-sm font-semibold text-territory-ink">Ana</span>
          <ChevronDown className="h-4 w-4 text-territory-muted" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function ConceptGlobalNavigation() {
  return (
    <aside className="hidden w-40 shrink-0 border-r border-territory-border bg-territory-surface px-3 py-5 md:block" aria-label="Navegação principal">
      <nav className="space-y-1">
        {globalNavItems.map(({ label, icon: Icon }) => (
          <Link key={label} to={getGlobalNavHref(label)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function ConceptBusinessNavigation({ onSelect, onBack, selectedArea }: { onSelect: (label: string) => void; onBack: () => void; selectedArea: string }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-territory-border bg-territory-surface px-3 py-5 lg:block" aria-label="Navegação do negócio">
      <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 px-3 text-sm text-territory-ink hover:text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Meus perfis
      </button>
      <div className="mb-5 flex items-center gap-3 px-3">
        <img src={foodImage} alt="Sabores da Ana" className="h-12 w-12 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold text-territory-ink">Sabores da Ana</p>
          <span className="text-xs text-territory-muted">Proprietária</span>
        </div>
      </div>
      <nav className="space-y-1">
        {businessNavItems.map(({ label, icon: Icon }) => (
          <button key={label} type="button" onClick={() => onSelect(label)} className={cn("flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand", label === selectedArea && "bg-[hsl(var(--territory-success)/0.14)] font-semibold text-territory-brand")}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
            {label === "Conversas" ? <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-error px-1 text-[0.6875rem] font-bold text-white">12</span> : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function ConceptMobileBusinessIdentity({ onBack, onViewPage }: { onBack: () => void; onViewPage: () => void }) {
  return (
    <>
      <button type="button" onClick={onBack} className="flex min-h-10 items-center gap-2 text-sm text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Meus perfis
      </button>
      <div className="mt-4 flex items-center gap-3">
        <img src={foodImage} alt="Sabores da Ana" className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg font-bold tracking-[-0.025em] text-territory-ink">Sabores da Ana</h1>
          <p className="text-sm text-territory-muted">Gestão do negócio</p>
        </div>
        <button type="button" onClick={onViewPage} className="min-h-10 shrink-0 rounded-xl border border-territory-brand px-3 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          Ver página
        </button>
      </div>
    </>
  );
}

function ConceptSectionTitle({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-heading text-lg font-bold tracking-[-0.025em] text-territory-ink">{title}</h2>
      {onClick ? <button type="button" onClick={onClick} className="rounded-lg p-1 text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button> : null}
    </div>
  );
}

function ConceptNotice({ onClick }: { onClick: () => void }) {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-territory-sun/50 bg-[hsl(var(--territory-sun)/0.2)] p-3 sm:p-4 md:items-center md:p-2.5">
      <Clock3 className="mt-0.5 h-7 w-7 shrink-0 text-territory-warm" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-territory-ink">Confira seus horários de atendimento</h2>
        <p className="mt-0.5 text-xs leading-[1.125rem] text-territory-muted md:leading-5">Mantenha os horários atualizados para quem visita sua página.</p>
        <button type="button" onClick={onClick} className="mt-1 h-5 min-h-0 p-0 text-sm font-semibold leading-5 text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:hidden">Editar horários <span aria-hidden="true">→</span></button>
      </div>
      <button type="button" onClick={onClick} className="hidden min-h-10 shrink-0 rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:inline-flex md:items-center">Editar horários</button>
    </section>
  );
}

function ConceptConversationCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-3.5 sm:p-4 md:p-3.5">
      <ConceptSectionTitle title="Atendimento" onClick={onOpen} />
      <p className="mt-0.5 text-sm text-territory-muted">12 não lidas</p>
      <div className="mt-3 space-y-2 md:mt-2">
        <div className="flex items-center gap-3 rounded-xl border border-territory-border/80 p-2.5 md:p-2">
          <img src={ownerImage} alt="Mariana Costa" className="h-11 w-11 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-territory-ink">Mariana Costa</p>
            <p className="truncate text-xs text-territory-muted">Pode ser às 12h?</p>
          </div>
          <span className="self-start text-xs text-territory-muted">10:24</span>
        </div>
        <div className="hidden items-center gap-3 rounded-xl border border-territory-border/80 p-2.5 md:flex md:p-2">
          <img src={ownerImage} alt="Lucas Almeida" className="h-11 w-11 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-territory-ink">Lucas Almeida</p>
            <p className="truncate text-xs text-territory-muted">Vocês entregam em Santa Cruz?</p>
          </div>
          <span className="self-start text-xs text-territory-muted">Ontem</span>
        </div>
      </div>
      <button type="button" onClick={onOpen} className="mt-3 min-h-10 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:mt-2 md:min-h-9">Abrir conversas</button>
    </section>
  );
}

function ConceptMenuCard({ onOpen }: { onOpen: () => void }) {
  const items = [
    { name: "Prato do dia", image: foodImage },
    { name: "Opção vegetariana", image: secondFoodImage },
  ];
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-3.5 sm:p-4 md:p-3">
      <ConceptSectionTitle title="Cardápio" onClick={onOpen} />
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={item.name} className={cn("flex items-center gap-3 rounded-xl border border-territory-border/80 p-2", index > 0 && "hidden md:flex")}>
            <img src={item.image} alt="" className="h-14 w-16 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-territory-ink">{item.name}</p>
              <p className="mt-0.5 text-xs font-medium text-territory-success">Disponível</p>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onOpen} className="mt-2 min-h-9 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-ink hover:bg-[hsl(var(--territory-brand)/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Gerenciar cardápio</button>
    </section>
  );
}

function ConceptPublicationCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold tracking-[-0.025em] text-territory-ink">Publicações e ofertas</h2>
        <button type="button" onClick={onOpen} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-territory-sun px-3 text-xs font-bold text-territory-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><Plus className="h-4 w-4" aria-hidden="true" />Criar publicação</button>
      </div>
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-territory-border/80 p-2.5 sm:flex-row sm:items-center">
        <img src={foodImage} alt="Almoço de sábado" className="h-28 w-full rounded-lg object-cover sm:h-24 sm:w-40" />
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-md bg-territory-sun px-2 py-1 text-[0.6875rem] font-bold text-territory-ink">Rascunho</span>
          <p className="mt-2 font-heading text-base font-bold text-territory-ink">Almoço de sábado</p>
        </div>
        <ChevronRight className="hidden h-5 w-5 text-territory-ink sm:block" aria-hidden="true" />
        <button type="button" onClick={onOpen} className="min-h-10 rounded-xl border border-territory-brand px-3 text-xs font-semibold text-territory-ink hover:bg-[hsl(var(--territory-brand)/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Continuar edição</button>
      </div>
    </section>
  );
}

function ConceptInfoLinks({ onOpen }: { onOpen: (label: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        { label: "Informações do negócio", description: "Fotos, endereço, contato e horários", icon: MapPin },
        { label: "Equipe e acessos", description: "Convide pessoas e defina permissões", icon: Users },
      ].map(({ label, description, icon: Icon }) => (
        <button key={label} type="button" onClick={() => onOpen(label)} className="flex min-h-20 items-center gap-3 rounded-xl border border-territory-border bg-territory-surface p-4 text-left hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Icon className="h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-territory-ink">{label}</span><span className="mt-1 block text-xs text-territory-muted">{description}</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function ConceptBottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-territory-border bg-territory-surface px-1 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navegação principal mobile">
      {globalNavItems.map(({ label, icon: Icon }) => (
        <Link key={label} to={getGlobalNavHref(label)} className={cn("relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", label === "Conta" ? "text-territory-brand" : "text-territory-muted")}>
          <span className="relative">
            <Icon className="h-5 w-5" strokeWidth={label === "Conta" ? 2.2 : 1.8} aria-hidden="true" />
            {label === "Conversas" ? <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-territory-error px-1 text-[0.5625rem] font-bold leading-none text-white">12</span> : null}
          </span>
          <span className={label === "Conta" ? "font-semibold" : undefined}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function MobileOverviewMenu({ open, onSelect }: { open: boolean; onSelect: (label: string) => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-xl border border-territory-border bg-territory-surface p-2 shadow-territory-subtle">
      {businessNavItems.slice(0, 1).concat(businessNavItems.slice(1)).map(({ label, icon: Icon }) => (
        <button key={label} type="button" onClick={() => onSelect(label)} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Icon className="h-4 w-4 text-territory-brand" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function BusinessManagementConceptPreviewPage() {
  const navigate = useNavigate();
  const [overviewMenuOpen, setOverviewMenuOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState("Visão geral");

  const selectArea = (label: string) => {
    setSelectedArea(label);
    setOverviewMenuOpen(false);
  };

  const openMessages = () => navigate("/mensagens?concept-mock=1");
  const openMenu = () => selectArea("Cardápio");
  const openPublications = () => selectArea("Publicações e ofertas");

  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink max-md:h-[100dvh] max-md:overflow-y-auto max-md:scrollbar-hide md:h-screen md:overflow-hidden">
      <ConceptBusinessHeader />
      <div className="flex min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] md:min-h-0">
        <ConceptGlobalNavigation />
        <ConceptBusinessNavigation selectedArea={selectedArea} onSelect={selectArea} onBack={() => navigate("/conta?concept-mock=1")} />
        <main className="min-w-0 flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-6 lg:pb-8 lg:pt-4 xl:px-6 scrollbar-hide md:overflow-y-auto">
          <div className="w-full">
            <div className="md:hidden">
              <ConceptMobileBusinessIdentity onBack={() => navigate("/conta?concept-mock=1")} onViewPage={() => navigate(territoryHref)} />
              <div className="relative mt-5">
                <button type="button" aria-expanded={overviewMenuOpen} onClick={() => setOverviewMenuOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-territory-border bg-territory-surface px-4 text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
                  {selectedArea}
                  <ChevronDown className={cn("h-5 w-5 transition-transform", overviewMenuOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <MobileOverviewMenu open={overviewMenuOpen} onSelect={selectArea} />
              </div>
            </div>

            <div className="hidden items-start justify-between gap-4 md:flex">
              <div>
                <h1 className="font-heading text-[2rem] font-bold leading-10 tracking-[-0.045em] text-territory-ink">Visão geral</h1>
                <p className="mt-0.5 text-[0.9375rem] leading-5 text-territory-muted">Sabores da Ana <span className="mx-1">•</span> Santa Cruz, Salvador</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[hsl(var(--territory-success)/0.14)] px-3 text-xs font-semibold text-territory-success"><Check className="h-4 w-4" aria-hidden="true" />Publicado</span>
                <button type="button" onClick={() => navigate(territoryHref)} className="min-h-10 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Ver página pública <ExternalLink className="ml-1 inline h-4 w-4" aria-hidden="true" /></button>
              </div>
            </div>

            <div className="mt-4 lg:mt-4"><ConceptNotice onClick={() => selectArea("Configurações")} /></div>
            <div className="mt-4 grid gap-4 lg:mt-3.5 lg:grid-cols-2 lg:gap-3.5">
              <ConceptConversationCard onOpen={openMessages} />
              <ConceptMenuCard onOpen={openMenu} />
            </div>
            <div className="mt-4 lg:mt-3.5"><ConceptPublicationCard onOpen={openPublications} /></div>
            <div className="mt-4 lg:mt-3.5"><ConceptInfoLinks onOpen={selectArea} /></div>
          </div>
        </main>
      </div>
      <ConceptBottomNavigation />
    </div>
  );
}
