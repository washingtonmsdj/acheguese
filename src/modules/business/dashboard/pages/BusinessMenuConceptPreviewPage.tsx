import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Home,
  Image as ImageIcon,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  Utensils,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import moquecaImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import vegetableImage from "@/assets/gastronomy/cat-acai.jpg";
import juiceImage from "@/assets/gastronomy/cat-cafes.jpg";
import dessertImage from "@/assets/gastronomy/cat-lanchonetes.jpg";
import cakeImage from "@/assets/gastronomy/cat-hamburgueria.jpg";
import ownerImage from "@/assets/persona-comerciante.jpg";
import { cn } from "@/shared/utils/cn";

const territoryHref = "/ba/salvador/complexo-do-nordeste-de-amaralina";

type MenuStatus = "Disponível" | "Indisponível" | "Rascunho";

type ConceptMenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  status: MenuStatus;
  image: string;
  description: string;
};

const initialMenuItems: ConceptMenuItem[] = [
  {
    id: "prato-do-dia",
    name: "Prato do dia",
    category: "Refeições",
    price: "R$ 24,00",
    status: "Disponível",
    image: foodImage,
    description: "Arroz, feijão, salada e acompanhamento do dia.",
  },
  {
    id: "moqueca-de-peixe",
    name: "Moqueca de peixe",
    category: "Refeições",
    price: "A partir de R$ 38,00",
    status: "Disponível",
    image: moquecaImage,
    description: "Peixe ao leite de coco, com arroz e farofa.",
  },
  {
    id: "opcao-vegetariana",
    name: "Opção vegetariana",
    category: "Refeições",
    price: "R$ 22,00",
    status: "Disponível",
    image: vegetableImage,
    description: "Legumes assados, arroz e acompanhamentos da casa.",
  },
  {
    id: "suco-de-maracuja",
    name: "Suco de maracujá",
    category: "Bebidas",
    price: "R$ 8,00",
    status: "Indisponível",
    image: juiceImage,
    description: "Suco natural de maracujá.",
  },
  {
    id: "pudim-caseiro",
    name: "Pudim caseiro",
    category: "Sobremesas",
    price: "R$ 10,00",
    status: "Disponível",
    image: dessertImage,
    description: "Pudim de leite condensado feito na casa.",
  },
  {
    id: "bolo-de-aipim",
    name: "Bolo de aipim",
    category: "Sobremesas",
    price: "R$ 7,00",
    status: "Rascunho",
    image: cakeImage,
    description: "Bolo de aipim com coco.",
  },
];

const menuNavigation: Array<{ label: string; icon: LucideIcon; href?: string }> = [
  { label: "Visão geral", icon: Home, href: "/central?concept-mock=1" },
  { label: "Perfil público", icon: UserRound },
  { label: "Cardápio", icon: Utensils },
  { label: "Conversas", icon: MessageCircle, href: "/mensagens?concept-mock=1" },
  { label: "Publicações e ofertas", icon: Megaphone },
  { label: "Equipe e acessos", icon: Users },
  { label: "Configurações", icon: Settings },
];

const globalNavigation = [
  { label: "Início", icon: Home, href: territoryHref },
  { label: "Explorar", icon: Search, href: "/busca/ba/salvador/complexo-do-nordeste-de-amaralina" },
  { label: "Comunidade", icon: Users, href: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina" },
  { label: "Conversas", icon: MessageCircle, href: "/mensagens?concept-mock=1" },
  { label: "Conta", icon: UserRound, href: "/conta?concept-mock=1" },
];

const categories = ["Refeições", "Bebidas", "Sobremesas"];

function ConceptBrand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to={territoryHref}
      className={cn(
        "inline-flex items-baseline font-heading text-[1.55rem] font-bold tracking-[-0.055em]",
        light ? "text-white" : "text-territory-ink",
      )}
    >
      achegue-se<span className="ml-0.5 text-territory-sun">.</span>
    </Link>
  );
}

function ConceptAvatar({ className }: { className?: string }) {
  return <img src={ownerImage} alt="Ana" className={cn("rounded-full object-cover", className)} />;
}

function MenuConceptHeader() {
  return (
    <header className="hidden h-16 items-center bg-territory-brand text-white md:flex">
      <div className="flex h-full w-52 shrink-0 items-center border-r border-white/10 px-6">
        <ConceptBrand light />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-5 px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src={foodImage} alt="Sabores da Ana" className="h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold">Sabores da Ana</p>
            <p className="truncate text-xs text-white/75">Gestão do negócio</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Notificações" className="rounded-full p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <ConceptAvatar className="h-10 w-10 border border-white/50" />
            <div className="hidden leading-tight lg:block">
              <p className="text-sm font-bold">Ana</p>
              <p className="text-xs text-white/75">Proprietária</p>
            </div>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuConceptSidebar() {
  return (
    <aside className="hidden w-52 shrink-0 flex-col bg-territory-brand text-white md:flex">
      <nav className="flex flex-1 flex-col gap-1 px-2.5 py-4" aria-label="Gestão do negócio">
        <Link to="/conta?concept-mock=1" className="mb-2 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Meus perfis
        </Link>
        {menuNavigation.map(({ label, icon: Icon, href }) => {
          const active = label === "Cardápio";
          const content = (
            <>
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {label === "Conversas" ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-error px-1 text-[0.625rem] font-bold text-white">12</span> : null}
            </>
          );
          const className = cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            active ? "bg-white/15 font-bold text-white ring-1 ring-inset ring-white/20" : "text-white/90 hover:bg-white/10",
          );
          return href ? <Link key={label} to={href} className={className} aria-current={active ? "page" : undefined}>{content}</Link> : <button key={label} type="button" className={cn(className, "w-full text-left")}>{content}</button>;
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-5 text-xs leading-5 text-white/75">
        Nossa comunidade também cresce com você.<span className="ml-1 text-territory-sun">●</span>
      </div>
    </aside>
  );
}

function ConceptBottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-territory-border bg-territory-surface px-1 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navegação principal mobile">
      {globalNavigation.map(({ label, icon: Icon, href }) => (
        <Link key={label} to={href} className={cn("relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", label === "Conta" ? "text-territory-brand" : "text-territory-muted")}>
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

function MobileBusinessIdentity({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button type="button" onClick={onBack} className="flex min-h-9 items-center gap-2 text-sm font-medium text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Gestão do negócio
      </button>
      <div className="mt-3 flex items-center gap-3">
        <img src={foodImage} alt="Sabores da Ana" className="h-12 w-12 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-territory-ink">Sabores da Ana</p>
          <p className="truncate text-xs text-territory-muted">Santa Cruz · Salvador · BA</p>
        </div>
      </div>
    </div>
  );
}

function MenuPageHeading({ mobile = false, onAdd }: { mobile?: boolean; onAdd: () => void }) {
  if (mobile) {
    return (
      <>
        <div className="mt-4 flex items-center justify-between gap-3">
          <h1 className="font-heading text-[1.5rem] font-bold leading-8 tracking-[-0.04em] text-territory-ink">Cardápio</h1>
          <Link to={`${territoryHref}/cardapio`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
            Ver público <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <button type="button" onClick={onAdd} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink shadow-territory-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar item
        </button>
      </>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-[2rem] font-bold leading-10 tracking-[-0.045em] text-territory-ink">Cardápio</h1>
        <p className="mt-0.5 text-[0.9375rem] leading-5 text-territory-muted">Organize o que seus clientes encontram na sua página.</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link to={`${territoryHref}/cardapio`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          Ver cardápio público <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onAdd} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink shadow-territory-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar item
        </button>
      </div>
    </div>
  );
}

function MenuTabs({ activeTab, onChange }: { activeTab: "Itens" | "Categorias"; onChange: (tab: "Itens" | "Categorias") => void }) {
  return (
    <div className="flex h-11 items-end gap-5 border-b border-territory-border" role="tablist" aria-label="Conteúdo do cardápio">
      {(["Itens", "Categorias"] as const).map((tab) => (
        <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => onChange(tab)} className={cn("flex h-11 items-center border-b-2 px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", activeTab === tab ? "border-territory-brand font-bold text-territory-ink" : "border-transparent text-territory-muted hover:text-territory-ink")}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label: string }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-territory-border bg-territory-surface px-3 pr-9 text-xs font-medium text-territory-ink outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-ink" aria-hidden="true" />
    </label>
  );
}

function MenuFilters({ query, onQueryChange, category, onCategoryChange, status, onStatusChange }: { query: string; onQueryChange: (value: string) => void; category: string; onCategoryChange: (value: string) => void; status: string; onStatusChange: (value: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
      <label className="relative col-span-2 block min-w-0 md:w-52 md:shrink-0">
        <span className="sr-only">Buscar item pelo nome</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar item pelo nome" className="h-10 w-full rounded-lg border border-territory-border bg-territory-surface pl-9 pr-3 text-xs text-territory-ink outline-none placeholder:text-territory-muted focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" />
      </label>
      <FilterSelect value={category} onChange={onCategoryChange} options={["Todas as categorias", ...categories]} label="Filtrar por categoria" />
      <FilterSelect value={status} onChange={onStatusChange} options={["Todos os status", "Disponível", "Indisponível", "Rascunho"]} label="Filtrar por status" />
    </div>
  );
}

function AvailabilityToggle({ available, onToggle, name }: { available: boolean; onToggle: () => void; name: string }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={available} aria-label={`${available ? "Desmarcar" : "Marcar"} ${name} como disponível`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
      <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors", available ? "bg-territory-success" : "bg-territory-muted/45")}>
        <span className={cn("h-4 w-4 rounded-full bg-white shadow-sm transition-transform", available ? "translate-x-4" : "translate-x-0")} />
      </span>
    </button>
  );
}

function MenuItemRow({ item, selected, onOpen, onToggle, className }: { item: ConceptMenuItem; selected: boolean; onOpen: () => void; onToggle: () => void; className?: string }) {
  const isAvailable = item.status === "Disponível";
  const isDraft = item.status === "Rascunho";
  return (
    <div className={cn("grid min-h-[4.6rem] grid-cols-[minmax(0,1fr)_4.75rem_1.4rem] items-center gap-2 border-b border-territory-border px-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_6rem_8rem_1.75rem] md:gap-2 md:px-2 xl:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem_2.2rem] xl:gap-3 xl:px-3", selected && "md:bg-[hsl(var(--territory-success)/0.14)]", className)}>
      <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand">
        <img src={item.image} alt="" className="h-14 w-[4.5rem] shrink-0 rounded-lg object-cover md:h-12 md:w-16" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-territory-ink">{item.name}</span>
          <span className="mt-0.5 block truncate text-xs text-territory-muted">{item.category}</span>
          <span className="mt-0.5 block text-xs font-semibold text-territory-ink md:hidden">{item.price}</span>
        </span>
      </button>
      <span className="hidden text-xs font-medium text-territory-ink md:block">{item.price.includes("A partir") ? <><span className="block">A partir de</span><span className="block">R$ 38,00</span></> : item.price}</span>
      <span className="flex min-w-0 flex-col items-center justify-center gap-1 text-[0.625rem] text-territory-muted md:flex-row md:justify-start md:gap-2 md:text-xs">
        {isDraft ? <span className="inline-flex items-center gap-1.5 text-territory-warning"><span className="h-2.5 w-2.5 rounded-full bg-territory-warning" />Rascunho</span> : <><span className="md:hidden"><AvailabilityToggle available={isAvailable} onToggle={onToggle} name={item.name} /></span><span className="whitespace-nowrap md:hidden">{isAvailable ? "Disponível" : "Indisponível"}</span><span className="hidden items-center gap-1.5 whitespace-nowrap md:inline-flex"><span className={cn("h-2.5 w-2.5 rounded-full", isAvailable ? "bg-territory-success" : "bg-territory-muted")} />{item.status}</span></>}
      </span>
      <button type="button" onClick={onOpen} aria-label={`Editar ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand">
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MenuItemList({ items, selectedId, onOpen, onToggle, hideOverflowOnMobile = false }: { items: ConceptMenuItem[]; selectedId: string; onOpen: (item: ConceptMenuItem) => void; onToggle: (item: ConceptMenuItem) => void; hideOverflowOnMobile?: boolean }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-territory-border bg-territory-surface">
      <div className="hidden h-10 grid-cols-[minmax(0,1fr)_6rem_8rem_1.75rem] items-center gap-2 border-b border-territory-border bg-territory-raised px-2 text-xs font-semibold text-territory-ink md:grid xl:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem_2.2rem] xl:gap-3 xl:px-3">
        <span>Item</span><span>Preço</span><span>Disponibilidade</span><span className="sr-only">Ações</span>
      </div>
      {items.length ? items.map((item, index) => <MenuItemRow key={item.id} item={item} selected={selectedId === item.id} onOpen={() => onOpen(item)} onToggle={() => onToggle(item)} className={hideOverflowOnMobile && index >= 5 ? "max-md:hidden" : undefined} />) : <p className="px-4 py-8 text-center text-sm text-territory-muted">Nenhum item encontrado.</p>}
      <div className="hidden items-center justify-between border-t border-territory-border px-3 py-3 text-xs text-territory-muted md:flex">
        <span>1–{Math.min(items.length, 6)} de 24 itens</span>
        <span className="flex items-center gap-2">
          <button type="button" aria-label="Página anterior" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-territory-border text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Próxima página" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-territory-border text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </span>
      </div>
    </div>
  );
}

function CategoryPanel() {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-territory-border bg-territory-surface">
      {categories.map((category, index) => (
        <div key={category} className="flex min-h-16 items-center justify-between border-b border-territory-border px-4 last:border-b-0">
          <div><p className="text-sm font-bold text-territory-ink">{category}</p><p className="mt-0.5 text-xs text-territory-muted">{index === 0 ? "3 itens" : index === 1 ? "1 item" : "2 itens"}</p></div>
          <ChevronRight className="h-4 w-4 text-territory-ink" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

function MenuEditor({ item, name, onNameChange, description, onDescriptionChange, available, onAvailableChange, onClose, onSave, mobile = false }: { item: ConceptMenuItem; name: string; onNameChange: (value: string) => void; description: string; onDescriptionChange: (value: string) => void; available: boolean; onAvailableChange: () => void; onClose?: () => void; onSave: () => void; mobile?: boolean }) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  return (
    <section className={cn("border border-territory-border bg-territory-surface", mobile ? "rounded-none border-x-0 border-t-0" : "rounded-xl lg:max-h-[calc(100vh-9.5rem)] lg:overflow-y-auto scrollbar-hide")} aria-label="Editar item">
      <div className="flex items-center justify-between border-b border-territory-border px-4 py-3.5 md:px-4">
        {mobile && onClose ? <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Cardápio</button> : <h2 className="font-heading text-lg font-bold text-territory-ink">Editar item</h2>}
        {!mobile ? <button type="button" onClick={onClose} aria-label="Fechar editor" className="rounded-lg p-1 text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><X className="h-5 w-5" aria-hidden="true" /></button> : null}
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <img src={item.image} alt="" className="h-16 w-20 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-territory-ink">{item.name}</p>
            <button type="button" className="mt-2 inline-flex min-h-8 items-center gap-2 rounded-lg border border-territory-border px-3 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ImageIcon className="h-4 w-4" aria-hidden="true" />Alterar foto</button>
          </div>
        </div>
        <label className="block text-xs font-bold text-territory-ink">Nome<input value={name} onChange={(event) => onNameChange(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label>
        <div className="text-xs font-bold text-territory-ink">Categoria<div className="mt-1.5"><FilterSelect value="Refeições" onChange={() => undefined} options={["Refeições", "Bebidas", "Sobremesas"]} label="Categoria" /></div></div>
        <label className="block text-xs font-bold text-territory-ink">Descrição<textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-territory-border bg-territory-surface p-2.5 text-xs font-medium leading-5 outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label>
        <div>
          <p className="text-xs font-bold text-territory-ink">Tamanhos e preços</p>
          <div className="mt-1.5 space-y-2">
            {["Individual", "Para duas pessoas"].map((size, index) => <div key={size} className="flex items-center gap-2"><input value={size} readOnly aria-label={`Tamanho ${size}`} className="h-9 min-w-0 flex-1 rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none" /><input value={index === 0 ? "R$ 38,00" : "R$ 68,00"} readOnly aria-label={`Preço ${size}`} className="h-9 w-28 rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none" /><button type="button" aria-label={`Remover ${size}`} className="rounded p-1 text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>)}
          </div>
          <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Adicionar opção</button>
        </div>
        {["Complementos e observações", "Ingredientes e restrições alimentares"].map((section) => <div key={section} className="border-t border-territory-border pt-3"><button type="button" aria-expanded={openSection === section} onClick={() => setOpenSection((current) => current === section ? null : section)} className="flex w-full items-center justify-between text-left text-xs font-bold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">{section}<ChevronDown className={cn("h-4 w-4 transition-transform", openSection === section && "rotate-180")} aria-hidden="true" /></button>{openSection === section ? <p className="mt-2 text-xs leading-5 text-territory-muted">Configure as opções que aparecem para quem consulta o cardápio público.</p> : null}</div>)}
        <div className="border-t border-territory-border pt-3">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-territory-ink">Disponível no cardápio</p><p className="mt-1 text-[0.6875rem] text-territory-muted">Indisponível não apaga o item.</p></div><div className="flex items-center gap-2 text-xs font-semibold text-territory-ink"><AvailabilityToggle available={available} onToggle={onAvailableChange} name={item.name} />Sim</div></div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-territory-border pt-4"><button type="button" onClick={onClose} className="min-h-10 px-2 text-xs font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Cancelar</button><button type="button" onClick={onSave} className="min-h-10 rounded-lg bg-territory-brand px-4 text-xs font-bold text-white shadow-territory-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Salvar alterações</button></div>
        <p className="text-right text-[0.625rem] text-territory-muted">As alterações aparecem após salvar.</p>
      </div>
    </section>
  );
}

export default function BusinessMenuConceptPreviewPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialMenuItems);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [status, setStatus] = useState("Todos os status");
  const [activeTab, setActiveTab] = useState<"Itens" | "Categorias">("Itens");
  const [selectedId, setSelectedId] = useState("moqueca-de-peixe");
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [desktopEditorOpen, setDesktopEditorOpen] = useState(true);
  const [editorName, setEditorName] = useState("Moqueca de peixe");
  const [editorDescription, setEditorDescription] = useState("Peixe ao leite de coco, com arroz e farofa.");

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];
  const editorAvailable = selectedItem?.status === "Disponível";
  const filteredItems = items.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || item.name.toLowerCase().includes(normalizedQuery) || item.description.toLowerCase().includes(normalizedQuery);
    const matchesCategory = category === "Todas as categorias" || item.category === category;
    const matchesStatus = status === "Todos os status" || item.status === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });
  const hideOverflowOnMobile = !query.trim() && category === "Todas as categorias" && status === "Todos os status";

  const openEditor = (item: ConceptMenuItem) => {
    setSelectedId(item.id);
    setEditorName(item.name);
    setEditorDescription(item.description);
    setDesktopEditorOpen(true);
    setMobileEditorOpen(true);
  };

  const toggleAvailability = (item: ConceptMenuItem) => {
    if (item.status === "Rascunho") return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: entry.status === "Disponível" ? "Indisponível" : "Disponível" } : entry));
  };

  const saveEditor = () => {
    setItems((current) => current.map((item) => item.id === selectedId ? { ...item, name: editorName, description: editorDescription, status: editorAvailable ? "Disponível" : "Indisponível" } : item));
  };

  const addItem = () => {
    const newItem: ConceptMenuItem = { id: `novo-${items.length + 1}`, name: "Novo item", category: "Refeições", price: "R$ 0,00", status: "Rascunho", image: foodImage, description: "Adicione a descrição deste item." };
    setItems((current) => [...current, newItem]);
    openEditor(newItem);
  };

  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink max-md:h-[100dvh] max-md:overflow-y-auto max-md:scrollbar-hide md:h-screen md:overflow-hidden">
      <MenuConceptHeader />
      <div className="flex min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] md:min-h-0">
        <MenuConceptSidebar />
        <main className="min-w-0 flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:overflow-y-auto md:px-5 md:py-5 lg:px-4 xl:px-5 scrollbar-hide">
          <div className="md:hidden">
            {!mobileEditorOpen ? <>
              <MobileBusinessIdentity onBack={() => navigate("/central?concept-mock=1")} />
              <MenuPageHeading mobile onAdd={addItem} />
              <MenuTabs activeTab={activeTab} onChange={setActiveTab} />
              <MenuFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} status={status} onStatusChange={setStatus} />
              {activeTab === "Itens" ? <MenuItemList items={filteredItems} selectedId={selectedId} onOpen={openEditor} onToggle={toggleAvailability} hideOverflowOnMobile={hideOverflowOnMobile} /> : <CategoryPanel />}
              <p className="mt-2 text-xs text-territory-muted">24 itens</p>
            </> : <MenuEditor item={selectedItem} name={editorName} onNameChange={setEditorName} description={editorDescription} onDescriptionChange={setEditorDescription} available={editorAvailable} onAvailableChange={() => toggleAvailability(selectedItem)} onClose={() => setMobileEditorOpen(false)} onSave={saveEditor} mobile />}
          </div>

          <div className="hidden md:block">
            <MenuPageHeading onAdd={addItem} />
            <div className="mt-5 grid items-start gap-3.5 md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
              <div className="min-w-0">
                <MenuTabs activeTab={activeTab} onChange={setActiveTab} />
                <MenuFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} status={status} onStatusChange={setStatus} />
                {activeTab === "Itens" ? <MenuItemList items={filteredItems} selectedId={selectedId} onOpen={openEditor} onToggle={toggleAvailability} /> : <CategoryPanel />}
              </div>
              {desktopEditorOpen ? <MenuEditor item={selectedItem} name={editorName} onNameChange={setEditorName} description={editorDescription} onDescriptionChange={setEditorDescription} available={editorAvailable} onAvailableChange={() => toggleAvailability(selectedItem)} onClose={() => setDesktopEditorOpen(false)} onSave={saveEditor} /> : <button type="button" onClick={() => setDesktopEditorOpen(true)} className="rounded-xl border border-dashed border-territory-border p-6 text-left text-sm font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Abrir editor do item</button>}
            </div>
          </div>
        </main>
      </div>
      <ConceptBottomNavigation />
    </div>
  );
}
