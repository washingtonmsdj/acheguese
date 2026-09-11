import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  GripVertical,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  PackageX,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
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
type MenuViewMode = "list" | "grid";

type ConceptMenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  status: MenuStatus;
  image: string;
  description: string;
  preparationTime?: number;
  stock?: number | null;
  stockAlertThreshold?: number;
  featured?: boolean;
  dietaryTags?: string[];
  tags?: string[];
  ingredients?: string;
  allergens?: string[];
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
    preparationTime: 25,
    stock: 12,
    stockAlertThreshold: 4,
    featured: true,
    dietaryTags: ["Sem lactose"],
  },
  {
    id: "moqueca-de-peixe",
    name: "Moqueca de peixe",
    category: "Refeições",
    price: "A partir de R$ 38,00",
    status: "Disponível",
    image: moquecaImage,
    description: "Peixe ao leite de coco, com arroz e farofa.",
    preparationTime: 35,
    stock: 4,
    stockAlertThreshold: 5,
    featured: true,
    ingredients: "Peixe, leite de coco, tomate, cebola, pimentão e coentro.",
    allergens: ["Peixe"],
  },
  {
    id: "opcao-vegetariana",
    name: "Opção vegetariana",
    category: "Refeições",
    price: "R$ 22,00",
    status: "Disponível",
    image: vegetableImage,
    description: "Legumes assados, arroz e acompanhamentos da casa.",
    preparationTime: 20,
    stock: 8,
    stockAlertThreshold: 3,
    dietaryTags: ["Vegetariano", "Sem lactose"],
  },
  {
    id: "suco-de-maracuja",
    name: "Suco de maracujá",
    category: "Bebidas",
    price: "R$ 8,00",
    status: "Indisponível",
    image: juiceImage,
    description: "Suco natural de maracujá.",
    preparationTime: 5,
    stock: 0,
    stockAlertThreshold: 6,
    dietaryTags: ["Sem lactose"],
  },
  {
    id: "pudim-caseiro",
    name: "Pudim caseiro",
    category: "Sobremesas",
    price: "R$ 10,00",
    status: "Disponível",
    image: dessertImage,
    description: "Pudim de leite condensado feito na casa.",
    preparationTime: 40,
    stock: 6,
    stockAlertThreshold: 3,
  },
  {
    id: "bolo-de-aipim",
    name: "Bolo de aipim",
    category: "Sobremesas",
    price: "R$ 7,00",
    status: "Rascunho",
    image: cakeImage,
    description: "Bolo de aipim com coco.",
    stock: null,
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

function MenuFilters({ query, onQueryChange, category, onCategoryChange, status, onStatusChange, categoryOptions, viewMode, onViewModeChange }: { query: string; onQueryChange: (value: string) => void; category: string; onCategoryChange: (value: string) => void; status: string; onStatusChange: (value: string) => void; categoryOptions?: string[]; viewMode?: MenuViewMode; onViewModeChange?: (value: MenuViewMode) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
      <label className="relative col-span-2 block min-w-0 md:w-52 md:shrink-0">
        <span className="sr-only">Buscar item pelo nome</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar item pelo nome" className="h-10 w-full rounded-lg border border-territory-border bg-territory-surface pl-9 pr-3 text-xs text-territory-ink outline-none placeholder:text-territory-muted focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" />
      </label>
      <FilterSelect value={category} onChange={onCategoryChange} options={["Todas as categorias", ...(categoryOptions ?? categories)]} label="Filtrar por categoria" />
      <FilterSelect value={status} onChange={onStatusChange} options={["Todos os status", "Disponível", "Indisponível", "Rascunho"]} label="Filtrar por status" />
      {viewMode && onViewModeChange ? <div className="hidden items-center rounded-lg border border-territory-border bg-territory-surface p-0.5 md:ml-auto md:flex" aria-label="Modo de visualização">
        <button type="button" aria-pressed={viewMode === "list"} aria-label="Visualizar em lista" onClick={() => onViewModeChange("list")} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", viewMode === "list" ? "bg-territory-brand text-white" : "text-territory-muted hover:text-territory-ink")}>
          <List className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" aria-pressed={viewMode === "grid"} aria-label="Visualizar em grade" onClick={() => onViewModeChange("grid")} className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", viewMode === "grid" ? "bg-territory-brand text-white" : "text-territory-muted hover:text-territory-ink")}>
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        </button>
      </div> : null}
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
      <button type="button" onClick={onOpen} className="flex min-w-0 items-center justify-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand">
        <img src={item.image} alt="" className="h-16 w-[5.25rem] shrink-0 rounded-lg object-cover md:h-12 md:w-16" />
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
        <ChevronRight className="h-4 w-4 md:hidden" aria-hidden="true" />
        <MoreHorizontal className="hidden h-4 w-4 md:block" aria-hidden="true" />
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

function MenuItemGrid({ items, selectedId, onOpen, onToggle, onDelete, onMarkSoldOut }: { items: ConceptMenuItem[]; selectedId: string; onOpen: (item: ConceptMenuItem) => void; onToggle: (item: ConceptMenuItem) => void; onDelete: (item: ConceptMenuItem) => void; onMarkSoldOut: (item: ConceptMenuItem) => void }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.length ? items.map((item) => {
        const isAvailable = item.status === "Disponível";
        const isSoldOut = item.stock === 0;
        const hasLowStock = typeof item.stock === "number" && typeof item.stockAlertThreshold === "number" && item.stock > 0 && item.stock <= item.stockAlertThreshold;
        return (
          <article key={item.id} className={cn("overflow-hidden rounded-xl border border-territory-border bg-territory-surface shadow-territory-subtle", selectedId === item.id && "ring-2 ring-territory-brand/30")}>
            <button type="button" onClick={() => onOpen(item)} className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand">
              <div className="relative aspect-[4/3] overflow-hidden bg-territory-raised">
                <img src={item.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                  {item.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-territory-sun px-2 py-1 text-[0.625rem] font-bold text-territory-ink"><Star className="h-3 w-3 fill-current" aria-hidden="true" />Destaque</span> : <span />}
                  <span className={cn("rounded-full px-2 py-1 text-[0.625rem] font-bold", item.status === "Disponível" ? "bg-territory-success/95 text-white" : item.status === "Rascunho" ? "bg-territory-warning text-territory-ink" : "bg-territory-ink/75 text-white")}>{item.status}</span>
                </div>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="truncate text-sm font-bold text-territory-ink">{item.name}</h3><p className="mt-0.5 text-xs text-territory-muted">{item.category}</p></div>
                  <span className="shrink-0 text-sm font-bold text-territory-ink">{item.price}</span>
                </div>
                <p className="min-h-10 line-clamp-2 text-xs leading-5 text-territory-muted">{item.description}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-territory-muted">
                  {item.preparationTime ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{item.preparationTime} min</span> : null}
                  {item.stock !== null && item.stock !== undefined ? <span className={cn("inline-flex items-center gap-1", isSoldOut ? "font-semibold text-territory-error" : hasLowStock ? "font-semibold text-territory-warning" : undefined)}>{isSoldOut ? "Esgotado" : `Estoque: ${item.stock}`}</span> : null}
                </div>
                {item.dietaryTags?.length ? <div className="flex flex-wrap gap-1">{item.dietaryTags.map((tag) => <span key={tag} className="rounded-full bg-territory-raised px-2 py-1 text-[0.625rem] font-medium text-territory-muted">{tag}</span>)}</div> : null}
              </div>
            </button>
            <div className="flex items-center justify-between gap-2 border-t border-territory-border px-3 py-2">
              <div className="flex min-w-0 items-center gap-1 text-[0.6875rem] text-territory-muted">{item.status === "Rascunho" ? <span className="font-semibold text-territory-warning">Rascunho</span> : <><AvailabilityToggle available={isAvailable} onToggle={() => onToggle(item)} name={item.name} /><span className="truncate">{isAvailable ? "Disponível" : "Indisponível"}</span></>}</div>
              <div className="flex shrink-0 items-center gap-1">
                {!isSoldOut && item.status !== "Rascunho" ? <button type="button" onClick={() => onMarkSoldOut(item)} aria-label={`Marcar ${item.name} como esgotado`} title="Marcar esgotado" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-muted hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><PackageX className="h-4 w-4" aria-hidden="true" /></button> : null}
                <button type="button" onClick={() => onOpen(item)} aria-label={`Editar ${item.name}`} title="Editar item" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => onDelete(item)} aria-label={`Excluir ${item.name}`} title="Excluir item" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-muted hover:bg-territory-error/10 hover:text-territory-error focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </div>
          </article>
        );
      }) : <p className="col-span-full rounded-xl border border-territory-border px-4 py-8 text-center text-sm text-territory-muted">Nenhum item encontrado.</p>}
    </div>
  );
}

function CategoryPanel({ categories: categoryItems, items, onAdd, onRename, onDelete, onReorder }: { categories: string[]; items: ConceptMenuItem[]; onAdd: () => void; onRename: (category: string) => void; onDelete: (category: string) => void; onReorder: (from: number, to: number) => void }) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-territory-border bg-territory-surface">
      <div className="flex items-center justify-between border-b border-territory-border px-4 py-3"><div><p className="text-sm font-bold text-territory-ink">Categorias</p><p className="mt-0.5 text-xs text-territory-muted">Organize como os itens aparecem no cardápio público.</p></div><button type="button" onClick={onAdd} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-territory-sun px-3 text-xs font-bold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Adicionar</button></div>
      {categoryItems.map((category, index) => {
        const count = items.filter((item) => item.category === category).length;
        return <div key={category} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedIndex !== null && draggedIndex !== index) onReorder(draggedIndex, index); setDraggedIndex(null); }} className="flex min-h-16 items-center gap-2 border-b border-territory-border px-3 last:border-b-0"><button type="button" aria-label={`Reordenar ${category}`} className="inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><GripVertical className="h-4 w-4" aria-hidden="true" /></button><div className="min-w-0 flex-1"><p className="text-sm font-bold text-territory-ink">{category}</p><p className="mt-0.5 text-xs text-territory-muted">{count} {count === 1 ? "item" : "itens"}</p></div><button type="button" onClick={() => onRename(category)} aria-label={`Editar categoria ${category}`} title="Editar categoria" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-muted hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Pencil className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={() => onDelete(category)} aria-label={`Excluir categoria ${category}`} title="Excluir categoria" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-muted hover:bg-territory-error/10 hover:text-territory-error focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Trash2 className="h-4 w-4" aria-hidden="true" /></button><ChevronRight className="h-4 w-4 text-territory-ink" aria-hidden="true" /></div>;
      })}
    </div>
  );
}

function MenuEditor({ item, name, onNameChange, description, onDescriptionChange, category, onCategoryChange, categoryOptions, price, onPriceChange, preparationTime, onPreparationTimeChange, stock, onStockChange, stockAlertThreshold, onStockAlertThresholdChange, featured, onFeaturedChange, dietaryTags, onDietaryTagsChange, ingredients, onIngredientsChange, allergens, onAllergensChange, tags, onTagsChange, image, onImageChange, available, onAvailableChange, onMarkSoldOut, onDelete, onClose, onSave, mobile = false }: { item: ConceptMenuItem; name: string; onNameChange: (value: string) => void; description: string; onDescriptionChange: (value: string) => void; category: string; onCategoryChange: (value: string) => void; categoryOptions: string[]; price: string; onPriceChange: (value: string) => void; preparationTime: string; onPreparationTimeChange: (value: string) => void; stock: string; onStockChange: (value: string) => void; stockAlertThreshold: string; onStockAlertThresholdChange: (value: string) => void; featured: boolean; onFeaturedChange: (value: boolean) => void; dietaryTags: string[]; onDietaryTagsChange: (value: string[]) => void; ingredients: string; onIngredientsChange: (value: string) => void; allergens: string; onAllergensChange: (value: string) => void; tags: string; onTagsChange: (value: string) => void; image: string; onImageChange: (value: string) => void; available: boolean; onAvailableChange: () => void; onMarkSoldOut: () => void; onDelete: () => void; onClose?: () => void; onSave: () => void; mobile?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleDietaryTag = (tag: string) => onDietaryTagsChange(dietaryTags.includes(tag) ? dietaryTags.filter((entry) => entry !== tag) : [...dietaryTags, tag]);
  return (
    <section className={cn("border border-territory-border bg-territory-surface", mobile ? "rounded-none border-x-0 border-t-0" : "rounded-xl lg:max-h-[calc(100vh-9.5rem)] lg:overflow-y-auto scrollbar-hide")} aria-label="Editar item">
      <div className="flex items-center justify-between border-b border-territory-border px-4 py-3.5 md:px-4">
        {mobile && onClose ? <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Cardápio</button> : <h2 className="font-heading text-lg font-bold text-territory-ink">Editar item</h2>}
        {!mobile ? <button type="button" onClick={onClose} aria-label="Fechar editor" className="rounded-lg p-1 text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><X className="h-5 w-5" aria-hidden="true" /></button> : null}
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <img src={image} alt="" className="h-16 w-20 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-territory-ink">{item.name}</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImageChange(URL.createObjectURL(file)); event.target.value = ""; }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 inline-flex min-h-8 items-center gap-2 rounded-lg border border-territory-border px-3 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><ImageIcon className="h-4 w-4" aria-hidden="true" />Alterar foto</button>
          </div>
        </div>
        <label className="block text-xs font-bold text-territory-ink">Nome<input value={name} onChange={(event) => onNameChange(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label>
        <div className="text-xs font-bold text-territory-ink">Categoria<div className="mt-1.5"><FilterSelect value={category} onChange={onCategoryChange} options={categoryOptions} label="Categoria" /></div></div>
        <label className="block text-xs font-bold text-territory-ink">Descrição<textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-territory-border bg-territory-surface p-2.5 text-xs font-medium leading-5 outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-bold text-territory-ink">Preço<input value={price} onChange={(event) => onPriceChange(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label>
          <label className="block text-xs font-bold text-territory-ink">Preparo (min)<input type="number" min="0" value={preparationTime} onChange={(event) => onPreparationTimeChange(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label>
        </div>
        <div>
          <p className="text-xs font-bold text-territory-ink">Tamanhos e preços</p>
          <div className="mt-1.5 space-y-2">
            {["Individual", "Para duas pessoas"].map((size, index) => <div key={size} className="flex items-center gap-2"><input value={size} readOnly aria-label={`Tamanho ${size}`} className="h-9 min-w-0 flex-1 rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none" /><input value={index === 0 ? "R$ 38,00" : "R$ 68,00"} readOnly aria-label={`Preço ${size}`} className="h-9 w-28 rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none" /><button type="button" aria-label={`Remover ${size}`} className="rounded p-1 text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>)}
          </div>
          <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Adicionar opção</button>
        </div>
        <div className="border-t border-territory-border pt-3">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-territory-ink">Estoque e venda</p><span className="text-[0.625rem] text-territory-muted">Atualização rápida</span></div>
          <div className="mt-2 grid grid-cols-2 gap-2"><label className="block text-xs font-semibold text-territory-muted">Estoque atual<input type="number" min="0" value={stock} onChange={(event) => onStockChange(event.target.value)} placeholder="Sem controle" className="mt-1.5 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label><label className="block text-xs font-semibold text-territory-muted">Alerta em<input type="number" min="0" value={stockAlertThreshold} onChange={(event) => onStockAlertThresholdChange(event.target.value)} placeholder="Opcional" className="mt-1.5 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label></div>
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-territory-ink"><input type="checkbox" checked={featured} onChange={(event) => onFeaturedChange(event.target.checked)} className="h-4 w-4 accent-territory-brand" />Destacar no cardápio público</label>
        </div>
        {["Complementos e observações", "Ingredientes e restrições alimentares"].map((section) => <div key={section} className="border-t border-territory-border pt-3"><button type="button" aria-expanded={openSection === section} onClick={() => setOpenSection((current) => current === section ? null : section)} className="flex w-full items-center justify-between text-left text-xs font-bold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">{section}<ChevronDown className={cn("h-4 w-4 transition-transform", openSection === section && "rotate-180")} aria-hidden="true" /></button>{openSection === section ? section === "Ingredientes e restrições alimentares" ? <div className="mt-2 space-y-2"><label className="block text-xs font-semibold text-territory-muted">Ingredientes<textarea value={ingredients} onChange={(event) => onIngredientsChange(event.target.value)} rows={2} className="mt-1 w-full resize-none rounded-lg border border-territory-border bg-territory-surface p-2 text-xs font-medium text-territory-ink outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label><label className="block text-xs font-semibold text-territory-muted">Alergênicos<input value={allergens} onChange={(event) => onAllergensChange(event.target.value)} placeholder="Ex.: peixe, leite" className="mt-1 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label><div><p className="text-xs font-semibold text-territory-muted">Características</p><div className="mt-1.5 flex flex-wrap gap-1.5">{["Vegetariano", "Vegano", "Sem glúten", "Sem lactose", "Picante"].map((tag) => <button key={tag} type="button" aria-pressed={dietaryTags.includes(tag)} onClick={() => toggleDietaryTag(tag)} className={cn("rounded-full border px-2 py-1 text-[0.625rem] font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", dietaryTags.includes(tag) ? "border-territory-brand bg-territory-raised text-territory-brand" : "border-territory-border text-territory-muted")}>{tag}</button>)}</div></div><label className="block text-xs font-semibold text-territory-muted">Tags<input value={tags} onChange={(event) => onTagsChange(event.target.value)} placeholder="Ex.: caseiro, novidade" className="mt-1 h-9 w-full rounded-lg border border-territory-border bg-territory-surface px-2.5 text-xs font-medium text-territory-ink outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/25" /></label></div> : <p className="mt-2 text-xs leading-5 text-territory-muted">Configure as opções que aparecem para quem consulta o cardápio público.</p> : null}</div>)}
        <div className="border-t border-territory-border pt-3">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-territory-ink">Disponível no cardápio</p><p className="mt-1 text-[0.6875rem] text-territory-muted">Indisponível não apaga o item.</p></div><div className="flex items-center gap-2 text-xs font-semibold text-territory-ink"><AvailabilityToggle available={available} onToggle={onAvailableChange} name={item.name} />{available ? "Sim" : "Não"}</div></div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-territory-border pt-3"><button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-territory-error hover:bg-territory-error/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Excluir item</button>{item.status !== "Rascunho" && item.stock !== 0 ? <button type="button" onClick={onMarkSoldOut} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-territory-border px-2.5 text-xs font-semibold text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><PackageX className="h-3.5 w-3.5" aria-hidden="true" />Marcar esgotado</button> : null}</div>
        <div className="flex items-center justify-end gap-3 border-t border-territory-border pt-4"><button type="button" onClick={onClose} className="min-h-10 px-2 text-xs font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Cancelar</button><button type="button" onClick={onSave} className="min-h-10 rounded-lg bg-territory-brand px-4 text-xs font-bold text-white shadow-territory-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Salvar alterações</button></div>
        <p className="text-right text-[0.625rem] text-territory-muted">As alterações aparecem após salvar.</p>
      </div>
    </section>
  );
}

export default function BusinessMenuConceptPreviewPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialMenuItems);
  const [categoryOrder, setCategoryOrder] = useState(categories);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [status, setStatus] = useState("Todos os status");
  const [viewMode, setViewMode] = useState<MenuViewMode>("list");
  const [activeTab, setActiveTab] = useState<"Itens" | "Categorias">("Itens");
  const [selectedId, setSelectedId] = useState("moqueca-de-peixe");
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [desktopEditorOpen, setDesktopEditorOpen] = useState(true);
  const [editorName, setEditorName] = useState("Moqueca de peixe");
  const [editorCategory, setEditorCategory] = useState("Refeições");
  const [editorPrice, setEditorPrice] = useState("A partir de R$ 38,00");
  const [editorDescription, setEditorDescription] = useState("Peixe ao leite de coco, com arroz e farofa.");
  const [editorPreparationTime, setEditorPreparationTime] = useState("35");
  const [editorStock, setEditorStock] = useState("4");
  const [editorStockAlertThreshold, setEditorStockAlertThreshold] = useState("5");
  const [editorFeatured, setEditorFeatured] = useState(true);
  const [editorDietaryTags, setEditorDietaryTags] = useState<string[]>([]);
  const [editorIngredients, setEditorIngredients] = useState("Peixe, leite de coco, tomate, cebola, pimentão e coentro.");
  const [editorAllergens, setEditorAllergens] = useState("Peixe");
  const [editorTags, setEditorTags] = useState("");
  const [editorImage, setEditorImage] = useState(moquecaImage);

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
    setEditorCategory(item.category);
    setEditorPrice(item.price);
    setEditorDescription(item.description);
    setEditorPreparationTime(item.preparationTime?.toString() ?? "");
    setEditorStock(item.stock === null || item.stock === undefined ? "" : item.stock.toString());
    setEditorStockAlertThreshold(item.stockAlertThreshold?.toString() ?? "");
    setEditorFeatured(Boolean(item.featured));
    setEditorDietaryTags(item.dietaryTags ?? []);
    setEditorIngredients(item.ingredients ?? "");
    setEditorAllergens(item.allergens?.join(", ") ?? "");
    setEditorTags(item.tags?.join(", ") ?? "");
    setEditorImage(item.image);
    setDesktopEditorOpen(true);
    setMobileEditorOpen(true);
  };

  const toggleAvailability = (item: ConceptMenuItem) => {
    if (item.status === "Rascunho") return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: entry.status === "Disponível" ? "Indisponível" : "Disponível" } : entry));
  };

  const markSoldOut = (item: ConceptMenuItem) => {
    if (item.status === "Rascunho") return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "Indisponível", stock: 0 } : entry));
  };

  const deleteItem = (item: ConceptMenuItem) => {
    if (!window.confirm(`Excluir “${item.name}” do cardápio?`)) return;
    const remainingItems = items.filter((entry) => entry.id !== item.id);
    setItems(remainingItems);
    if (item.id === selectedId) {
      const nextItem = remainingItems[0];
      if (nextItem) openEditor(nextItem);
      else {
        setSelectedId("");
        setDesktopEditorOpen(false);
        setMobileEditorOpen(false);
      }
    }
  };

  const saveEditor = () => {
    if (!selectedItem) return;
    const parsedStock = editorStock.trim() === "" ? null : Number(editorStock);
    const parsedThreshold = editorStockAlertThreshold.trim() === "" ? undefined : Number(editorStockAlertThreshold);
    setItems((current) => current.map((item) => item.id === selectedId ? {
      ...item,
      name: editorName,
      category: editorCategory,
      price: editorPrice || item.price,
      description: editorDescription,
      preparationTime: editorPreparationTime.trim() === "" ? undefined : Number(editorPreparationTime),
      stock: parsedStock,
      stockAlertThreshold: parsedThreshold,
      featured: editorFeatured,
      dietaryTags: editorDietaryTags,
      ingredients: editorIngredients,
      allergens: editorAllergens.split(",").map((entry) => entry.trim()).filter(Boolean),
      tags: editorTags.split(",").map((entry) => entry.trim()).filter(Boolean),
      image: editorImage,
      status: item.status === "Rascunho" ? "Rascunho" : editorAvailable ? "Disponível" : "Indisponível",
    } : item));
  };

  const addItem = () => {
    const newItem: ConceptMenuItem = { id: `novo-${items.length + 1}`, name: "Novo item", category: categoryOrder[0] ?? "Refeições", price: "R$ 0,00", status: "Rascunho", image: foodImage, description: "Adicione a descrição deste item.", stock: null };
    setItems((current) => [...current, newItem]);
    openEditor(newItem);
  };

  const addCategory = () => {
    const name = window.prompt("Nome da nova categoria");
    if (!name?.trim() || categoryOrder.includes(name.trim())) return;
    setCategoryOrder((current) => [...current, name.trim()]);
  };

  const renameCategory = (oldName: string) => {
    const name = window.prompt("Nome da categoria", oldName)?.trim();
    if (!name || name === oldName || categoryOrder.includes(name)) return;
    setCategoryOrder((current) => current.map((entry) => entry === oldName ? name : entry));
    setItems((current) => current.map((item) => item.category === oldName ? { ...item, category: name } : item));
    if (category === oldName) setCategory(name);
    if (editorCategory === oldName) setEditorCategory(name);
  };

  const deleteCategory = (categoryName: string) => {
    if (!window.confirm(`Excluir a categoria “${categoryName}”? Os itens serão mantidos no cardápio.`)) return;
    setCategoryOrder((current) => current.filter((entry) => entry !== categoryName));
    if (category === categoryName) setCategory("Todas as categorias");
  };

  const reorderCategories = (from: number, to: number) => {
    setCategoryOrder((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
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
              {activeTab === "Itens" ? <MenuItemList items={filteredItems} selectedId={selectedId} onOpen={openEditor} onToggle={toggleAvailability} hideOverflowOnMobile={hideOverflowOnMobile} /> : <CategoryPanel categories={categoryOrder} items={items} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} onReorder={reorderCategories} />}
              <p className="mt-2 text-xs text-territory-muted">24 itens</p>
            </> : <MenuEditor item={selectedItem} name={editorName} onNameChange={setEditorName} description={editorDescription} onDescriptionChange={setEditorDescription} category={editorCategory} onCategoryChange={setEditorCategory} categoryOptions={categoryOrder} price={editorPrice} onPriceChange={setEditorPrice} preparationTime={editorPreparationTime} onPreparationTimeChange={setEditorPreparationTime} stock={editorStock} onStockChange={setEditorStock} stockAlertThreshold={editorStockAlertThreshold} onStockAlertThresholdChange={setEditorStockAlertThreshold} featured={editorFeatured} onFeaturedChange={setEditorFeatured} dietaryTags={editorDietaryTags} onDietaryTagsChange={setEditorDietaryTags} ingredients={editorIngredients} onIngredientsChange={setEditorIngredients} allergens={editorAllergens} onAllergensChange={setEditorAllergens} tags={editorTags} onTagsChange={setEditorTags} image={editorImage} onImageChange={setEditorImage} available={editorAvailable} onAvailableChange={() => toggleAvailability(selectedItem)} onMarkSoldOut={() => markSoldOut(selectedItem)} onDelete={() => deleteItem(selectedItem)} onClose={() => setMobileEditorOpen(false)} onSave={saveEditor} mobile />}
          </div>

          <div className="hidden md:block">
            <MenuPageHeading onAdd={addItem} />
            <div className="mt-5 grid items-start gap-3.5 md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
              <div className="min-w-0">
                <MenuTabs activeTab={activeTab} onChange={setActiveTab} />
                <MenuFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} status={status} onStatusChange={setStatus} categoryOptions={categoryOrder} viewMode={viewMode} onViewModeChange={setViewMode} />
                {activeTab === "Itens" ? viewMode === "list" ? <MenuItemList items={filteredItems} selectedId={selectedId} onOpen={openEditor} onToggle={toggleAvailability} /> : <MenuItemGrid items={filteredItems} selectedId={selectedId} onOpen={openEditor} onToggle={toggleAvailability} onDelete={deleteItem} onMarkSoldOut={markSoldOut} /> : <CategoryPanel categories={categoryOrder} items={items} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} onReorder={reorderCategories} />}
              </div>
              {desktopEditorOpen ? <MenuEditor item={selectedItem} name={editorName} onNameChange={setEditorName} description={editorDescription} onDescriptionChange={setEditorDescription} category={editorCategory} onCategoryChange={setEditorCategory} categoryOptions={categoryOrder} price={editorPrice} onPriceChange={setEditorPrice} preparationTime={editorPreparationTime} onPreparationTimeChange={setEditorPreparationTime} stock={editorStock} onStockChange={setEditorStock} stockAlertThreshold={editorStockAlertThreshold} onStockAlertThresholdChange={setEditorStockAlertThreshold} featured={editorFeatured} onFeaturedChange={setEditorFeatured} dietaryTags={editorDietaryTags} onDietaryTagsChange={setEditorDietaryTags} ingredients={editorIngredients} onIngredientsChange={setEditorIngredients} allergens={editorAllergens} onAllergensChange={setEditorAllergens} tags={editorTags} onTagsChange={setEditorTags} image={editorImage} onImageChange={setEditorImage} available={editorAvailable} onAvailableChange={() => toggleAvailability(selectedItem)} onMarkSoldOut={() => markSoldOut(selectedItem)} onDelete={() => deleteItem(selectedItem)} onClose={() => setDesktopEditorOpen(false)} onSave={saveEditor} /> : <button type="button" onClick={() => setDesktopEditorOpen(true)} className="rounded-xl border border-dashed border-territory-border p-6 text-left text-sm font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Abrir editor do item</button>}
            </div>
          </div>
        </main>
      </div>
      <ConceptBottomNavigation />
    </div>
  );
}
