import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Grid2X2,
  Heart,
  List as ListIcon,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Truck,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import moquecaImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import vegetableImage from "@/assets/gastronomy/cat-acai.jpg";
import juiceImage from "@/assets/gastronomy/cat-cafes.jpg";
import dessertImage from "@/assets/gastronomy/cat-lanchonetes.jpg";

type FulfillmentMode = "delivery" | "pickup" | "dine-in";
type ConceptTab = "menu" | "reviews" | "info";
type MenuViewMode = "list" | "grid";
type MenuSortMode = "relevance" | "popular" | "price-asc" | "price-desc";
type PriceFilter = "all" | "under-20" | "20-to-35" | "over-35";

type ConceptMenuItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  available?: boolean;
  featured?: boolean;
};

type CartLine = ConceptMenuItem & {
  quantity: number;
  addonsTotal?: number;
  notes?: string;
};

const territoryHref = "/ba/salvador/pituba";

const menuItems: ConceptMenuItem[] = [
  {
    id: "prato-do-dia",
    name: "Prato do dia",
    category: "Refeições",
    description: "Arroz, feijão, salada e proteína do dia.",
    price: 24,
    image: foodImage,
    featured: true,
  },
  {
    id: "moqueca-de-peixe",
    name: "Moqueca de peixe",
    category: "Refeições",
    description: "Peixe ao leite de coco, com arroz e farofa.",
    price: 38,
    image: moquecaImage,
  },
  {
    id: "opcao-vegetariana",
    name: "Opção vegetariana",
    category: "Refeições",
    description: "Legumes grelhados, arroz integral e salada.",
    price: 22,
    image: vegetableImage,
  },
  {
    id: "suco-de-maracuja",
    name: "Suco de maracujá",
    category: "Bebidas",
    description: "Suco natural de maracujá.",
    price: 8,
    image: juiceImage,
  },
  {
    id: "pudim-caseiro",
    name: "Pudim caseiro",
    category: "Sobremesas",
    description: "Receita tradicional da Ana.",
    price: 10,
    image: dessertImage,
    available: false,
  },
];

const offerItem: ConceptMenuItem = {
  id: "oferta-prato-suco",
  name: "Prato do dia + suco",
  category: "Ofertas",
  description: "Prato do dia com suco de maracujá.",
  price: 29,
  image: foodImage,
};

const allSelectableItems = [...menuItems, offerItem];

const popularityByItemId: Record<string, number> = {
  [offerItem.id]: 120,
  "prato-do-dia": 98,
  "moqueca-de-peixe": 92,
  "suco-de-maracuja": 80,
  "opcao-vegetariana": 72,
  "pudim-caseiro": 20,
};

const categories = ["Todas", "Refeições", "Bebidas", "Sobremesas"];

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const matchesPriceFilter = (item: ConceptMenuItem, filter: PriceFilter) => {
  if (filter === "under-20") return item.price < 20;
  if (filter === "20-to-35") return item.price >= 20 && item.price <= 35;
  if (filter === "over-35") return item.price > 35;
  return true;
};

const matchesMenuFilters = (item: ConceptMenuItem, category: string, query: string, priceFilter: PriceFilter) => {
  const matchesCategory = category === "Todas" || item.category === category;
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = !normalizedQuery || `${item.name} ${item.description}`.toLowerCase().includes(normalizedQuery);
  return matchesCategory && matchesQuery && matchesPriceFilter(item, priceFilter);
};

const sortMenuItems = (items: ConceptMenuItem[], sortMode: MenuSortMode) => [...items].sort((first, second) => {
  if (sortMode === "popular") return (popularityByItemId[second.id] ?? 0) - (popularityByItemId[first.id] ?? 0);
  if (sortMode === "price-asc") return first.price - second.price;
  if (sortMode === "price-desc") return second.price - first.price;
  return 0;
});

function ConceptPublicHeader({
  saved,
  onSave,
  onShare,
}: {
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
}) {
  const navigate = useNavigate();

  return (
    <header className="relative z-40 border-b border-territory-border bg-territory-surface/95 backdrop-blur-md">
      <div className="hidden h-[3.25rem] items-center gap-6 px-5 md:flex lg:px-8">
        <Link
          to={territoryHref}
          className="font-heading text-[1.4rem] font-bold tracking-[-0.04em] text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-territory-brand"
        >
          achegue-se<span className="text-territory-sun">.</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 text-xs text-territory-ink">
          <MapPin className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="truncate">Santa Cruz, Salvador - BA</span>
          <span aria-hidden="true">⌄</span>
        </div>
        <nav className="ml-auto flex items-center gap-7 text-xs font-semibold text-territory-ink" aria-label="Navegação pública">
          <Link to={territoryHref} className="hover:text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-territory-brand">Explorar</Link>
          <Link to="/comunidade/ba/salvador/pituba" className="hover:text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-territory-brand">Comunidade</Link>
          <Button type="button" className="h-9 rounded-lg bg-territory-brand px-5 text-xs font-bold text-white hover:bg-territory-brand/90" onClick={() => navigate("/login")}>Entrar</Button>
        </nav>
      </div>

      <div className="flex h-12 items-center justify-between px-4 md:hidden">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Explorar
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onSave} aria-pressed={saved} className={cn("inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand", saved ? "text-territory-brand" : "text-territory-ink")}>
            <Heart className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" />
            Salvar
          </button>
          <button type="button" onClick={onShare} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Compartilhar
          </button>
        </div>
      </div>
    </header>
  );
}

function BusinessIdentity({
  saved,
  onSave,
  onShare,
}: {
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
}) {
  return (
    <section className="relative z-10 border-b border-territory-border bg-territory-surface">
      <div className="flex flex-wrap items-end gap-3 px-4 pb-2 pt-0 sm:gap-4 sm:px-6 sm:pb-2 lg:pb-1 lg:px-8">
        <div className="-mt-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-territory-surface bg-[#ad5944] text-center font-heading text-sm font-bold leading-4 text-white shadow-territory-subtle sm:h-24 sm:w-24 sm:text-base">
          Sabores
          <br />
          da Ana
        </div>
        <div className="min-w-0 flex-1 pb-0.5">
          <h1 className="font-heading text-lg font-bold tracking-[-0.03em] text-territory-ink sm:text-2xl">Sabores da Ana</h1>
          <p className="text-xs text-territory-muted sm:text-sm">Comida caseira</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-territory-ink sm:text-sm">
            <MapPin className="h-3.5 w-3.5 text-territory-brand" aria-hidden="true" />
            Santa Cruz, Salvador - BA
          </p>
        </div>
        <div className="hidden items-center gap-2 pb-1 sm:flex">
          <Button type="button" variant="outline" className="h-9 rounded-lg border-territory-border bg-territory-surface px-4 text-xs font-semibold text-territory-ink hover:bg-territory-raised" onClick={onSave}>
            <Heart className={cn("mr-1.5 h-4 w-4", saved && "fill-current text-territory-brand")} aria-hidden="true" />
            Salvar
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-lg border-territory-border bg-territory-surface px-4 text-xs font-semibold text-territory-ink hover:bg-territory-raised" onClick={onShare}>
            <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Compartilhar
          </Button>
        </div>
      </div>
    </section>
  );
}

function PublicTabs({ activeTab, onChange }: { activeTab: ConceptTab; onChange: (tab: ConceptTab) => void }) {
  const tabs: Array<{ value: ConceptTab; label: string }> = [
    { value: "menu", label: "Cardápio" },
    { value: "reviews", label: "Avaliações" },
    { value: "info", label: "Informações" },
  ];

  return (
    <nav className="border-b border-territory-border bg-territory-surface" aria-label="Conteúdo do estabelecimento">
      <div className="flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {tabs.map((tab) => (
          <button key={tab.value} type="button" onClick={() => onChange(tab.value)} className={cn("relative min-h-9 shrink-0 px-3 text-xs font-semibold text-territory-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:min-h-9 sm:px-4 sm:text-sm lg:min-h-8", activeTab === tab.value && "text-territory-brand") } aria-current={activeTab === tab.value ? "page" : undefined}>
            {tab.label}
            {activeTab === tab.value ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-territory-brand" /> : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

function FulfillmentBar({ mode, onChange }: { mode: FulfillmentMode; onChange: (mode: FulfillmentMode) => void }) {
  const options: Array<{ value: FulfillmentMode; label: string; icon: typeof Truck }> = [
    { value: "delivery", label: "Entrega", icon: Truck },
    { value: "pickup", label: "Retirada", icon: ShoppingBag },
    { value: "dine-in", label: "No local", icon: Store },
  ];
  const modeDescription = mode === "delivery" ? "Entrega no seu endereço" : mode === "pickup" ? "Retirada no estabelecimento" : "Consumo no estabelecimento";

  return (
    <section className="border-b border-territory-border bg-territory-surface">
      <div className="flex flex-col gap-0 px-4 py-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6 sm:py-2 lg:px-8 lg:py-1">
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-territory-border bg-territory-raised sm:w-64" role="radiogroup" aria-label="Forma de recebimento">
          {options.map((option) => {
            const Icon = option.icon;
            const selected = mode === option.value;
            return (
              <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option.value)} className={cn("inline-flex min-h-8 items-center justify-center gap-1 px-2 text-[0.6875rem] font-semibold text-territory-ink transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-xs", selected ? "bg-territory-brand text-white" : "hover:bg-territory-surface")}>
                <Icon className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-nowrap items-center justify-center gap-x-1 overflow-hidden whitespace-nowrap text-[0.625rem] leading-4 text-territory-muted sm:gap-x-2 sm:text-xs">
          <span className="truncate">{modeDescription}</span>
          <span aria-hidden="true">•</span>
          <span>{mode === "delivery" ? "Taxa calculada no checkout" : "Sem taxa de entrega"}</span>
          <span aria-hidden="true">•</span>
          <button type="button" className="font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Ver horários</button>
        </div>
      </div>
    </section>
  );
}

function SearchAndCategories({ query, onQueryChange, category, onCategoryChange, viewMode, onViewModeChange, priceFilter, onPriceFilterChange, sortMode, onSortModeChange, resultCount }: { query: string; onQueryChange: (value: string) => void; category: string; onCategoryChange: (value: string) => void; viewMode: MenuViewMode; onViewModeChange: (value: MenuViewMode) => void; priceFilter: PriceFilter; onPriceFilterChange: (value: PriceFilter) => void; sortMode: MenuSortMode; onSortModeChange: (value: MenuSortMode) => void; resultCount: number }) {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <label className="relative block">
        <span className="sr-only">Buscar no cardápio</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
        <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar no cardápio" className="h-9 rounded-lg border-territory-border bg-territory-surface pl-9 text-xs text-territory-ink placeholder:text-territory-muted sm:h-10 sm:text-sm" />
      </label>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide" role="tablist" aria-label="Categorias do cardápio">
          {categories.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => onCategoryChange(item)} className={cn("min-h-8 shrink-0 rounded-full px-3 text-[0.6875rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand sm:px-4 sm:text-xs", category === item ? "bg-territory-brand text-white" : "bg-territory-raised text-territory-ink hover:bg-territory-border")}>
              {item}
            </button>
          ))}
        </div>
        <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-territory-border bg-territory-surface p-0.5" role="group" aria-label="Visualização dos itens">
          <button type="button" aria-label="Visualizar em lista" aria-pressed={viewMode === "list"} onClick={() => onViewModeChange("list")} className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md text-territory-muted transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", viewMode === "list" ? "bg-territory-brand text-white" : "hover:bg-territory-raised hover:text-territory-ink")}>
            <ListIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Visualizar em grade" aria-pressed={viewMode === "grid"} onClick={() => onViewModeChange("grid")} className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md text-territory-muted transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", viewMode === "grid" ? "bg-territory-brand text-white" : "hover:bg-territory-raised hover:text-territory-ink")}>
            <Grid2X2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="min-w-0 flex-1 sm:flex-none">
          <span className="sr-only">Filtrar por preço</span>
          <select value={priceFilter} onChange={(event) => onPriceFilterChange(event.target.value as PriceFilter)} aria-label="Filtrar por preço" className="h-8 w-full min-w-0 rounded-lg border border-territory-border bg-territory-surface px-2.5 text-[0.6875rem] font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:h-9 sm:w-auto sm:text-xs">
            <option value="all">Preço</option>
            <option value="under-20">Até R$ 20</option>
            <option value="20-to-35">R$ 20 a R$ 35</option>
            <option value="over-35">Acima de R$ 35</option>
          </select>
        </label>
        <label className="min-w-0 flex-1 sm:flex-none">
          <span className="sr-only">Ordenar cardápio</span>
          <select value={sortMode} onChange={(event) => onSortModeChange(event.target.value as MenuSortMode)} aria-label="Ordenar cardápio" className="h-8 w-full min-w-0 rounded-lg border border-territory-border bg-territory-surface px-2.5 text-[0.6875rem] font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:h-9 sm:w-auto sm:text-xs">
            <option value="relevance">Relevância</option>
            <option value="popular">Mais vendidos</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>
        <span className="ml-auto text-[0.6875rem] text-territory-muted sm:text-xs">{resultCount} {resultCount === 1 ? "item" : "itens"}</span>
      </div>
    </div>
  );
}

function MenuRow({ item, selected, onSelect }: { item: ConceptMenuItem; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" disabled={item.available === false} onClick={onSelect} className={cn("group flex w-full items-center gap-2.5 border-b border-territory-border px-2.5 py-2 text-left transition-colors last:border-b-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:gap-4 sm:px-3 sm:py-2.5", selected && "lg:bg-[hsl(var(--territory-success)/0.12)]", item.available === false ? "cursor-not-allowed opacity-55" : "hover:bg-territory-raised")}>
      <span className="relative h-12 w-[3.75rem] shrink-0 overflow-hidden rounded-lg bg-territory-raised sm:h-12 sm:w-[4.75rem]">
        <img src={item.image} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-territory-ink sm:text-[0.9375rem]">{item.name}</span>
        <span className="mt-0.5 block truncate text-[0.6875rem] text-territory-muted sm:text-xs">{item.description}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-territory-ink sm:text-sm">
        {item.available === false ? <span className="rounded-full bg-territory-raised px-1.5 py-0.5 text-[0.5625rem] font-semibold text-territory-muted sm:text-[0.625rem]">Indisponível</span> : money(item.price)}
        <ChevronRight className="h-4 w-4 text-territory-brand" aria-hidden="true" />
      </span>
    </button>
  );
}

function MenuGridCard({ item, selected, featured = false, onSelect }: { item: ConceptMenuItem; selected: boolean; featured?: boolean; onSelect: () => void }) {
  return (
    <button type="button" disabled={item.available === false} onClick={onSelect} className={cn("group flex min-w-0 flex-col rounded-lg border border-territory-border bg-territory-surface p-2 text-left transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:rounded-xl sm:p-2.5 lg:flex-row lg:items-center lg:gap-3 lg:p-2.5", featured && "border-territory-sun/80 bg-territory-sun/20", selected && "border-territory-brand bg-[hsl(var(--territory-success)/0.12)]", item.available === false ? "cursor-not-allowed opacity-55" : "hover:border-territory-brand/50 hover:bg-territory-raised")}>
      <span className="relative block aspect-[5/3] w-full shrink-0 overflow-hidden rounded-md bg-territory-raised sm:rounded-lg lg:h-16 lg:w-24 lg:aspect-auto">
        <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
        {featured ? <span className="absolute left-1 top-1 rounded-full bg-territory-sun px-1.5 py-0.5 text-[0.5625rem] font-bold text-territory-ink">Oferta</span> : null}
        {item.available === false ? <span className="absolute bottom-1 left-1 rounded-full bg-territory-surface/95 px-1.5 py-0.5 text-[0.5625rem] font-semibold text-territory-muted">Indisponível</span> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mt-2 block line-clamp-2 min-h-8 text-xs font-bold leading-4 text-territory-ink sm:text-sm lg:mt-0 lg:min-h-0 lg:truncate">{item.name}</span>
        <span className="mt-1 block line-clamp-2 min-h-8 text-[0.6875rem] leading-4 text-territory-muted sm:text-xs lg:mt-0.5 lg:min-h-0 lg:line-clamp-1">{item.description}</span>
        <span className="mt-2 flex items-center justify-between gap-1 text-xs font-bold text-territory-ink sm:text-sm lg:mt-1">
          {item.available === false ? <span className="text-[0.625rem] font-semibold text-territory-muted">Temporariamente indisponível</span> : money(item.price)}
          <ChevronRight className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

function OfferCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-lg bg-territory-sun/25 px-2.5 py-2 text-left transition-colors hover:bg-territory-sun/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
      <img src={foodImage} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] font-semibold text-territory-brand sm:text-xs">Ofertas</span>
        <span className="block truncate text-xs font-bold text-territory-ink sm:text-sm">Prato do dia + suco · {money(29)}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-territory-ink" aria-hidden="true" />
    </button>
  );
}

function ItemCustomizer({ item, size, setSize, quantity, setQuantity, farofa, setFarofa, arroz, setArroz, notes, setNotes, onAdd }: { item: ConceptMenuItem; size: "individual" | "share"; setSize: (value: "individual" | "share") => void; quantity: number; setQuantity: (value: number) => void; farofa: boolean; setFarofa: (value: boolean) => void; arroz: boolean; setArroz: (value: boolean) => void; notes: string; setNotes: (value: string) => void; onAdd: () => void }) {
  const isOffer = item.id === offerItem.id;
  const addonsTotal = (farofa ? 3 : 0) + (arroz ? 5 : 0);
  const itemPrice = isOffer ? item.price : size === "share" ? 68 : item.price;
  const total = (itemPrice + addonsTotal) * quantity;

  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-4 shadow-territory-subtle sm:p-5" aria-label={`Personalizar ${item.name}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold text-territory-ink sm:text-lg">{item.name}</h2>
          <p className="mt-1 text-xs leading-5 text-territory-muted sm:text-sm">{item.description}</p>
        </div>
        <img src={item.image} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover sm:h-24 sm:w-28" />
      </div>

      {isOffer ? (
        <div className="mt-4 rounded-lg bg-territory-raised px-3 py-2.5 text-xs leading-5 text-territory-ink">
          Inclui prato do dia e suco de maracujá.
        </div>
      ) : (
        <>
          <fieldset className="mt-4 space-y-1.5 rounded-lg border border-territory-border px-2 py-1.5">
            <legend className="text-xs font-bold text-territory-ink sm:text-sm">Tamanho · obrigatório</legend>
            <label className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs text-territory-ink hover:bg-territory-raised">
              <input type="radio" name="concept-size" checked={size === "individual"} onChange={() => setSize("individual")} className="h-4 w-4 accent-[hsl(var(--territory-brand))]" />
              <span className="flex-1">Individual</span>
              <span className="font-semibold">{money(item.price)}</span>
            </label>
            <label className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs text-territory-ink hover:bg-territory-raised">
              <input type="radio" name="concept-size" checked={size === "share"} onChange={() => setSize("share")} className="h-4 w-4 accent-[hsl(var(--territory-brand))]" />
              <span className="flex-1">Para duas pessoas</span>
              <span className="font-semibold">{money(68)}</span>
            </label>
          </fieldset>

          <fieldset className="mt-3 space-y-1.5 rounded-lg border border-territory-border px-2 py-1.5">
            <legend className="text-xs font-bold text-territory-ink sm:text-sm">Adicionais · opcional</legend>
            <label className="flex min-h-8 items-center gap-2 text-xs text-territory-ink">
              <input type="checkbox" checked={farofa} onChange={(event) => setFarofa(event.target.checked)} className="h-4 w-4 rounded accent-[hsl(var(--territory-brand))]" />
              <span className="flex-1">Farofa extra</span>
              <span>+ {money(3)}</span>
            </label>
            <label className="flex min-h-8 items-center gap-2 text-xs text-territory-ink">
              <input type="checkbox" checked={arroz} onChange={(event) => setArroz(event.target.checked)} className="h-4 w-4 rounded accent-[hsl(var(--territory-brand))]" />
              <span className="flex-1">Arroz extra</span>
              <span>+ {money(5)}</span>
            </label>
          </fieldset>
        </>
      )}

      <label className="mt-3 block text-xs font-bold text-territory-ink sm:text-sm">
        Observações
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={1} placeholder="Ex.: enviar talheres" className="mt-1.5 h-10 min-h-0 resize-none rounded-lg border-territory-border bg-territory-surface text-xs placeholder:text-territory-muted" />
      </label>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-territory-border pt-3">
        <span className="text-xs font-bold text-territory-ink sm:text-sm">Quantidade</span>
        <div className="flex items-center overflow-hidden rounded-lg border border-territory-border">
          <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="inline-flex h-8 w-8 items-center justify-center text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Minus className="h-3.5 w-3.5" aria-hidden="true" /></button>
          <span className="inline-flex h-8 w-8 items-center justify-center border-x border-territory-border text-sm font-bold text-territory-ink">{quantity}</span>
          <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(quantity + 1)} className="inline-flex h-8 w-8 items-center justify-center text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><Plus className="h-3.5 w-3.5" aria-hidden="true" /></button>
        </div>
        <span className="text-sm font-bold text-territory-ink sm:text-base">{money(total)}</span>
      </div>

      <Button type="button" onClick={onAdd} className="mt-3 h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/90">
        Adicionar ao carrinho · {money(total)}
      </Button>
    </section>
  );
}

function ReviewsContent() {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-territory-ink">Avaliações</h2>
          <p className="mt-1 text-xs text-territory-muted sm:text-sm">O que a vizinhança achou da experiência.</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-territory-ink"><Star className="h-4 w-4 fill-territory-sun text-territory-sun" aria-hidden="true" />4,8 <span className="font-normal text-territory-muted">(32)</span></div>
      </div>
      <div className="mt-4 divide-y divide-territory-border border-y border-territory-border">
        {["Comida caseira e bem servida. A moqueca estava ótima!", "O prato do dia chegou quentinho e no horário combinado.", "Atendimento cuidadoso e opções para toda a família."].map((review, index) => (
          <article key={review} className="py-3">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-territory-ink">{["Mariana Costa", "Lucas Almeida", "Beatriz Santos"][index]}</span><span className="flex gap-0.5" aria-label="5 estrelas">{Array.from({ length: 5 }).map((_, starIndex) => <Star key={starIndex} className="h-3 w-3 fill-territory-sun text-territory-sun" aria-hidden="true" />)}</span></div>
            <p className="mt-1 text-xs leading-5 text-territory-muted">{review}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InfoContent() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-territory-border bg-territory-surface p-4"><h2 className="flex items-center gap-2 text-sm font-bold text-territory-ink"><Clock3 className="h-4 w-4 text-territory-brand" aria-hidden="true" />Horários</h2><p className="mt-2 text-xs leading-5 text-territory-muted">Segunda a sábado, das 11h às 21h.</p></div>
      <div className="rounded-xl border border-territory-border bg-territory-surface p-4"><h2 className="flex items-center gap-2 text-sm font-bold text-territory-ink"><MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />Onde estamos</h2><p className="mt-2 text-xs leading-5 text-territory-muted">Santa Cruz, Salvador - BA.</p></div>
      <div className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:col-span-2"><h2 className="flex items-center gap-2 text-sm font-bold text-territory-ink"><Utensils className="h-4 w-4 text-territory-brand" aria-hidden="true" />Sobre a casa</h2><p className="mt-2 text-xs leading-5 text-territory-muted">Comida caseira preparada no bairro, com retirada no estabelecimento e atendimento próximo.</p></div>
    </section>
  );
}

function CartSummary({ lines, onOpen }: { lines: CartLine[]; onOpen: () => void }) {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + (line.price + (line.addonsTotal ?? 0)) * line.quantity, 0);
  const names = lines.map((line) => line.name).join(" + ");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-territory-brand/20 bg-territory-brand px-3 py-2 text-white shadow-territory-subtle sm:px-4 sm:py-2.5">
      <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Seu carrinho · {itemCount} {itemCount === 1 ? "item" : "itens"} · {money(total)}</p><p className="truncate text-[0.6875rem] text-white/75">{names || "Seu carrinho está vazio"}</p></div>
      <button type="button" onClick={onOpen} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-bold text-white underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ver carrinho <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>
  );
}

function CartDialog({ lines, onClose, onRemove, onContinue }: { lines: CartLine[]; onClose: () => void; onRemove: (id: string) => void; onContinue: () => void }) {
  const total = lines.reduce((sum, line) => sum + (line.price + (line.addonsTotal ?? 0)) * line.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="concept-cart-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-t-2xl bg-territory-surface p-4 shadow-2xl sm:rounded-2xl sm:p-5">
        <div className="flex items-center justify-between"><h2 id="concept-cart-title" className="font-heading text-lg font-bold text-territory-ink">Seu carrinho</h2><button type="button" onClick={onClose} aria-label="Fechar carrinho" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><X className="h-5 w-5" aria-hidden="true" /></button></div>
        <div className="mt-4 divide-y divide-territory-border border-y border-territory-border">{lines.length ? lines.map((line) => <div key={`${line.id}-${line.notes ?? ""}`} className="flex items-center gap-3 py-3"><img src={line.image} alt="" className="h-12 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-territory-ink">{line.quantity}× {line.name}</p><p className="text-xs text-territory-muted">{money((line.price + (line.addonsTotal ?? 0)) * line.quantity)}</p></div><button type="button" onClick={() => onRemove(line.id)} className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">Remover</button></div>) : <p className="py-5 text-sm text-territory-muted">Seu carrinho está vazio.</p>}</div>
        <div className="mt-4 flex items-center justify-between text-sm font-bold text-territory-ink"><span>Total</span><span>{money(total)}</span></div>
        <Button type="button" className="mt-4 h-11 w-full rounded-lg bg-territory-sun font-bold text-territory-ink hover:bg-territory-sun/90" disabled={!lines.length} onClick={onContinue}>Continuar para finalizar</Button>
      </section>
    </div>
  );
}

export default function GastronomyDetailConceptPreviewPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConceptTab>("menu");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<MenuViewMode>("list");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortMode, setSortMode] = useState<MenuSortMode>("relevance");
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("pickup");
  const [saved, setSaved] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>("moqueca-de-peixe");
  const [mobileCustomizerOpen, setMobileCustomizerOpen] = useState(false);
  const [gridDetailsOpen, setGridDetailsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [size, setSize] = useState<"individual" | "share">("individual");
  const [quantity, setQuantity] = useState(1);
  const [farofa, setFarofa] = useState(false);
  const [arroz, setArroz] = useState(false);
  const [notes, setNotes] = useState("");
  const [cartLines, setCartLines] = useState<CartLine[]>([
    { ...menuItems[0], quantity: 1 },
    { ...menuItems[3], quantity: 1 },
  ]);

  const selectedItem = selectedItemId ? allSelectableItems.find((item) => item.id === selectedItemId) ?? null : null;
  const filteredItems = useMemo(() => sortMenuItems(menuItems.filter((item) => matchesMenuFilters(item, activeCategory, query, priceFilter)), sortMode), [activeCategory, priceFilter, query, sortMode]);
  const filteredGridItems = useMemo(() => {
    const items = activeCategory === "Todas" ? [offerItem, ...menuItems] : menuItems;
    return sortMenuItems(items.filter((item) => matchesMenuFilters(item, activeCategory, query, priceFilter)), sortMode);
  }, [activeCategory, priceFilter, query, sortMode]);

  const addLine = (item: ConceptMenuItem, itemQuantity = 1, addonsTotal = 0, itemNotes = "", priceOverride?: number) => {
    setCartLines((current) => [...current, { ...item, price: priceOverride ?? item.price, quantity: itemQuantity, addonsTotal, notes: itemNotes }]);
  };

  const addSelectedItem = () => {
    if (!selectedItem) return;
    addLine(selectedItem, quantity, (farofa ? 3 : 0) + (arroz ? 5 : 0), notes, size === "share" ? 68 : selectedItem.price);
    setSize("individual");
    setQuantity(1);
    setFarofa(false);
    setArroz(false);
    setNotes("");
    setMobileCustomizerOpen(false);
    toast.success(`${selectedItem.name} adicionado ao carrinho.`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sabores da Ana", url: window.location.href });
        return;
      } catch {
        // O fallback mantém o fluxo no navegador.
      }
    }
    toast.success("Link copiado para compartilhar.");
  };

  const handleRemoveLine = (id: string) => {
    setCartLines((current) => {
      const index = current.findIndex((line) => line.id === id);
      if (index < 0) return current;
      return current.filter((_, lineIndex) => lineIndex !== index);
    });
  };

  const handleSelectItem = (item: ConceptMenuItem) => {
    if (item.available === false) return;
    setSelectedItemId(item.id);
    setMobileCustomizerOpen(true);
    if (viewMode === "grid") setGridDetailsOpen(true);
  };

  const handleViewModeChange = (nextMode: MenuViewMode) => {
    setViewMode(nextMode);
    setMobileCustomizerOpen(false);
    setGridDetailsOpen(false);
    if (nextMode === "grid") setSelectedItemId(null);
    else setSelectedItemId((current) => current ?? "moqueca-de-peixe");
  };

  const hasPinnedDetails = viewMode === "list" && Boolean(selectedItem);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-territory-canvas text-territory-ink">
      <ConceptPublicHeader saved={saved} onSave={() => setSaved((value) => !value)} onShare={handleShare} />

      <section className="relative h-16 overflow-hidden bg-territory-raised sm:h-24 lg:h-20">
        <img src={moquecaImage} alt="Comida caseira da Sabores da Ana" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/45" />
        <p className="absolute right-5 top-1/2 hidden max-w-[14rem] -translate-y-1/2 text-right font-heading text-lg font-bold leading-tight text-white sm:block lg:right-12 lg:text-xl">Comida caseira<br />tem outro sabor.</p>
      </section>

      <BusinessIdentity saved={saved} onSave={() => setSaved((value) => !value)} onShare={handleShare} />
      <PublicTabs activeTab={activeTab} onChange={setActiveTab} />
      <FulfillmentBar mode={fulfillmentMode} onChange={setFulfillmentMode} />

      <main className="w-full px-4 pb-28 pt-3 sm:px-6 sm:pt-3 lg:px-8 lg:pb-28">
        {activeTab === "menu" ? (
          <div className={cn("grid min-h-0 w-full items-start gap-4 lg:gap-6", hasPinnedDetails ? "lg:grid-cols-[minmax(0,1fr)_30rem]" : "lg:grid-cols-1")}>
            <section className="min-w-0">
              <SearchAndCategories query={query} onQueryChange={setQuery} category={activeCategory} onCategoryChange={setActiveCategory} viewMode={viewMode} onViewModeChange={handleViewModeChange} priceFilter={priceFilter} onPriceFilterChange={setPriceFilter} sortMode={sortMode} onSortModeChange={setSortMode} resultCount={viewMode === "grid" ? filteredGridItems.length : filteredItems.length} />
              <div className="mt-3 flex flex-col gap-2">
                {viewMode === "list" ? <OfferCard onOpen={() => handleSelectItem(offerItem)} /> : null}
                <div className="overflow-hidden rounded-xl border border-territory-border bg-territory-surface">
                  {viewMode === "grid" ? <div className={cn("grid grid-cols-2 gap-2 p-2 sm:gap-3 sm:p-3", hasPinnedDetails ? "lg:grid-cols-2" : "lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5")}>{filteredGridItems.map((item) => <MenuGridCard key={item.id} item={item} featured={item.id === offerItem.id} selected={selectedItem?.id === item.id} onSelect={() => handleSelectItem(item)} />)}</div> : filteredItems.map((item) => <MenuRow key={item.id} item={item} selected={selectedItem?.id === item.id} onSelect={() => handleSelectItem(item)} />)}
                  {!((viewMode === "grid" ? filteredGridItems : filteredItems).length) ? <p className="px-4 py-8 text-center text-sm text-territory-muted">Nenhum item encontrado.</p> : null}
                </div>
              </div>
            </section>

            {hasPinnedDetails ? <aside className="hidden lg:block">
              <div className="relative">
                <ItemCustomizer item={selectedItem} size={size} setSize={setSize} quantity={quantity} setQuantity={setQuantity} farofa={farofa} setFarofa={setFarofa} arroz={arroz} setArroz={setArroz} notes={notes} setNotes={setNotes} onAdd={addSelectedItem} />
              </div>
            </aside> : null}
          </div>
        ) : activeTab === "reviews" ? <ReviewsContent /> : <InfoContent />}
      </main>

      <div className={cn("fixed bottom-4 z-40 hidden lg:block", activeTab === "menu" && hasPinnedDetails ? "left-8 right-[32rem]" : "left-8 right-8")}>
        <CartSummary lines={cartLines} onOpen={() => setCartOpen(true)} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-territory-brand/20 bg-territory-surface/95 px-2 pt-1.5 shadow-[0_-4px_18px_rgba(18,62,61,0.12)] backdrop-blur-md lg:hidden">
        <CartSummary lines={cartLines} onOpen={() => setCartOpen(true)} />
        <button type="button" onClick={() => toast.success("A loja responderá por aqui.")} className="flex h-8 w-full items-center justify-center gap-1 text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><MessageCircle className="h-4 w-4" aria-hidden="true" />Falar com a loja</button>
      </div>

      {viewMode === "grid" && gridDetailsOpen && selectedItem ? <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/35 p-4 lg:flex" role="presentation" onMouseDown={() => { setGridDetailsOpen(false); setSelectedItemId(null); }}><section className="max-h-[calc(100dvh-2rem)] w-full max-w-[30rem] overflow-y-auto rounded-2xl bg-territory-surface p-3 shadow-2xl" role="dialog" aria-modal="true" aria-label={`Personalizar ${selectedItem.name}`} onMouseDown={(event) => event.stopPropagation()}><div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-territory-ink">Personalizar pedido</p><button type="button" aria-label="Fechar detalhes do item" onClick={() => { setGridDetailsOpen(false); setSelectedItemId(null); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><X className="h-5 w-5" aria-hidden="true" /></button></div><ItemCustomizer item={selectedItem} size={size} setSize={setSize} quantity={quantity} setQuantity={setQuantity} farofa={farofa} setFarofa={setFarofa} arroz={arroz} setArroz={setArroz} notes={notes} setNotes={setNotes} onAdd={() => { addSelectedItem(); setGridDetailsOpen(false); }} /></section></div> : null}
      {mobileCustomizerOpen && selectedItem ? <div className="fixed inset-0 z-50 flex items-end bg-black/35 lg:hidden" role="presentation" onMouseDown={() => setMobileCustomizerOpen(false)}><div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-territory-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]" onMouseDown={(event) => event.stopPropagation()}><div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-territory-ink">Personalizar pedido</p><button type="button" aria-label="Fechar personalização" onClick={() => setMobileCustomizerOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><X className="h-5 w-5" aria-hidden="true" /></button></div><ItemCustomizer item={selectedItem} size={size} setSize={setSize} quantity={quantity} setQuantity={setQuantity} farofa={farofa} setFarofa={setFarofa} arroz={arroz} setArroz={setArroz} notes={notes} setNotes={setNotes} onAdd={addSelectedItem} /></div></div> : null}
      {cartOpen ? <CartDialog lines={cartLines} onClose={() => setCartOpen(false)} onRemove={handleRemoveLine} onContinue={() => navigate("checkout")} /> : null}
    </div>
  );
}
