import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  Crown,
  Heart,
  MapPin,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';

import { useSessionContext } from '@/core/session';
import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';
import { PLATFORM_BRAND } from '@/shared/config/brand';
import { GastronomyShareDialog, MenuItemDetailDrawer, StickyOrderBar } from '../components';
import {
  useActivePromotions,
  useFavoritesManager,
  useGastronomyCart,
  useGastronomyDetail,
  useMenu,
  useMenusByBusiness,
} from '../hooks';
import { getCuisineLabel } from '../constants';
import type { MenuItemWithRelations } from '../types';
import { formatBrl } from '../utils/currency';
import { getRecordValue, setRecordValue } from '@/shared/utils/recordLookup';

type SortMode = 'mais-pedidos' | 'menor-preco' | 'maior-preco';

export default function GastronomyPremiumDetailPage() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSessionContext();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null);
  const [search, setSearch] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('mais-pedidos');
  const [veganOnly, setVeganOnly] = useState(false);
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [glutenFreeOnly, setGlutenFreeOnly] = useState(false);
  const [lactoseFreeOnly, setLactoseFreeOnly] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [couponCode, setCouponCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const { data: business, isLoading: isLoadingBusiness } = useGastronomyDetail({
    state,
    city,
    district,
    slug,
  });
  const { data: businessMenus } = useMenusByBusiness(business?.business_data_id);
  const { data: promotions = [] } = useActivePromotions(business?.business_data_id);

  const { isFavorited, toggleFavorite, isToggling } = useFavoritesManager(
    business?.business_data_id,
  );

  const primaryMenuId = businessMenus?.[0]?.id;
  const { data: menu, isLoading: isLoadingMenu } = useMenu(primaryMenuId);
  const {
    cart,
    hasCart,
    itemCount,
    addItem,
    removeItem,
    clearCart,
    minimumOrderRemaining,
  } = useGastronomyCart(business);

  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return [...menu.categories].sort((a, b) => a.display_order - b.display_order);
  }, [menu]);

  useEffect(() => {
    if (!sortedCategories.length) {
      setActiveCategory(null);
      return;
    }
    if (!activeCategory || !sortedCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory(sortedCategories[0].id);
    }
  }, [activeCategory, sortedCategories]);

  const activeCategoryData = sortedCategories.find((category) => category.id === activeCategory);

  const filteredItems = useMemo(() => {
    const items = activeCategoryData?.items ?? [];
    const term = search.trim().toLowerCase();

    let nextItems = items.filter((item) => {
      if (term && !item.name.toLowerCase().includes(term) && !item.description?.toLowerCase().includes(term)) {
        return false;
      }
      if (veganOnly && !item.is_vegan) return false;
      if (vegetarianOnly && !item.is_vegetarian) return false;
      if (glutenFreeOnly && !item.is_gluten_free) return false;
      if (lactoseFreeOnly && !item.is_lactose_free) return false;
      return true;
    });

    if (sortMode === 'menor-preco') {
      nextItems = [...nextItems].sort((a, b) => a.base_price - b.base_price);
    } else if (sortMode === 'maior-preco') {
      nextItems = [...nextItems].sort((a, b) => b.base_price - a.base_price);
    } else {
      nextItems = [...nextItems].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }

    return nextItems;
  }, [activeCategoryData?.items, glutenFreeOnly, lactoseFreeOnly, search, sortMode, veganOnly, vegetarianOnly]);

  const profile = business?.gastronomy_profile;
  const gastronomyHomeUrl = GastronomyUrlService.getHomeUrl();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business?.name, url });
        return;
      } catch {
        // fallback
      }
    }
    setShareOpen(true);
  };

  const quantityFor = (itemId: string) => getRecordValue(itemQuantities, itemId) ?? 1;

  const updateQuantity = (itemId: string, quantity: number) => {
    const next = Math.max(1, quantity);
    setItemQuantities((current) => setRecordValue(current, itemId, next));
  };

  const handleProceedToCheckout = () => {
    if (!business) return;

    if (!hasCart) {
      document.getElementById('premium-menu-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    navigate('checkout', {
      state: { business },
    });
  };

  const handleQuickAdd = (item: MenuItemWithRelations) => {
    if (!business || !profile || !item.is_available) return;

    addItem({
      business_id: business.business_data_id,
      delivery_fee: profile.delivery_fee ?? 0,
      item_input: {
        item,
        quantity: quantityFor(item.id),
      },
    });
  };

  if (!business && !isLoadingBusiness) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Loja premium não encontrada</h1>
        <p className="mt-3 text-muted-foreground">
          Esse link premium não está ativo para o território informado.
        </p>
        <Button asChild className="mt-6">
          <Link to={gastronomyHomeUrl}>Voltar para gastronomia</Link>
        </Button>
      </div>
    );
  }

  if (!business || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const cuisineLabel = getCuisineLabel(profile.cuisine_type);
  const neighborhoodName = business.location?.name || 'Região não informada';
  const averageRating = business.rating.toFixed(1);
  const cartItems = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const deliveryFee = cart?.delivery_fee ?? 0;
  const total = cart?.total ?? subtotal;

  return (
    <>
      <Helmet>
        <title>{business.name} | Premium | {PLATFORM_BRAND.name}</title>
        <meta
          name="description"
          content={`${business.description} — cardápio premium e pedidos online em ${neighborhoodName}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <div className="overflow-hidden rounded-3xl border border-[hsl(var(--warning)/0.35)] bg-zinc-950 text-zinc-100 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <p className="text-lg font-semibold tracking-tight sm:text-2xl">{business.name}</p>
                <Badge className="border-0 bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
                  <Crown className="mr-1 h-3.5 w-3.5" />
                  Assinante Premium
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  onClick={toggleFavorite}
                  disabled={isToggling || !user}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:brightness-95"
                  onClick={handleProceedToCheckout}
                >
                  {hasCart ? 'Ir ao checkout' : 'Explorar cardápio'}
                </Button>
              </div>
            </div>

            <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_460px] lg:items-center">
              <div>
                <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-5xl">
                  Bem-vindo ao seu espaço premium
                </h1>
                <p className="mt-3 max-w-xl text-sm text-zinc-300 sm:text-base">
                  Cardápio com prioridade de exibição, campanhas e checkout completo para aumentar
                  suas conversões.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {averageRating}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {neighborhoodName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1">
                    <Truck className="h-3.5 w-3.5" />
                    {profile.delivery_time_min ?? 20}-{profile.delivery_time_max ?? 40} min
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1">
                    {cuisineLabel}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-700/70">
                {business.banner_url ? (
                  <img
                    src={business.banner_url}
                    alt={business.name}
                    className="h-64 w-full object-cover lg:h-72"
                  />
                ) : (
                  <div className="h-64 w-full bg-zinc-800 lg:h-72" />
                )}
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section id="premium-menu-section" className="space-y-4">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Área de cardápio</h2>
                {(isLoadingBusiness || isLoadingMenu) && <Badge variant="outline">Carregando</Badge>}
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pratos, bebidas e combos"
                    className="pl-9"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="justify-between"
                  onClick={() =>
                    setSortMode((current) =>
                      current === 'mais-pedidos'
                        ? 'menor-preco'
                        : current === 'menor-preco'
                          ? 'maior-preco'
                          : 'mais-pedidos',
                    )
                  }
                >
                  {sortMode === 'mais-pedidos' && 'Ordenar: Mais pedidos'}
                  {sortMode === 'menor-preco' && 'Ordenar: Menor preço'}
                  {sortMode === 'maior-preco' && 'Ordenar: Maior preço'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant={veganOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVeganOnly((current) => !current)}
                >
                  Vegano
                </Button>
                <Button
                  variant={vegetarianOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVegetarianOnly((current) => !current)}
                >
                  Vegetariano
                </Button>
                <Button
                  variant={glutenFreeOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGlutenFreeOnly((current) => !current)}
                >
                  Sem glúten
                </Button>
                <Button
                  variant={lactoseFreeOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLactoseFreeOnly((current) => !current)}
                >
                  Sem lactose
                </Button>
              </div>

              {sortedCategories.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {sortedCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={activeCategory === category.id}
                      aria-label={`Filtrar por ${category.name}`}
                      onClick={() => setActiveCategory(category.id)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeCategory === category.id
                          ? 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {category.name} ({category.items.length})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {promotions.length > 0 && (
              <div className="rounded-2xl border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.08)] p-4">
                <p className="text-sm font-semibold">Campanhas premium ativas</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {promotions.slice(0, 2).map((promotion) => (
                    <div key={promotion.id} className="rounded-lg border bg-card p-3">
                      <p className="font-medium">{promotion.title}</p>
                      {promotion.description && (
                        <p className="text-sm text-muted-foreground">{promotion.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border bg-card transition ${
                    item.is_available ? 'hover:shadow-lg' : 'opacity-60'
                  }`}
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                    role="button"
                    aria-label={`Abrir detalhes de ${item.name}`}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedItem(item);
                      }
                    }}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 w-full bg-muted" />
                    )}
                    <div className="absolute left-2 top-2 flex gap-1">
                      {item.is_featured && (
                        <Badge className="border-0 bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
                          Mais pedido
                        </Badge>
                      )}
                      {!item.is_featured && (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="line-clamp-1 text-lg font-semibold">{item.name}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {item.description || 'Sem descrição adicional.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.is_vegan && (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-xs text-green-700">
                          Vegano
                        </Badge>
                      )}
                      {item.is_vegetarian && !item.is_vegan && (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-xs text-green-600">
                          Vegetariano
                        </Badge>
                      )}
                      {item.is_gluten_free && (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                          Sem glúten
                        </Badge>
                      )}
                      {item.is_lactose_free && (
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
                          Sem lactose
                        </Badge>
                      )}
                      {item.is_spicy && (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-xs text-red-700">
                          Picante
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold tracking-tight">{formatBrl(item.base_price)}</p>
                      <div className="flex items-center rounded-lg border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => updateQuantity(item.id, quantityFor(item.id) - 1)}
                          disabled={!item.is_available}
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-9 text-center text-sm font-medium">{quantityFor(item.id)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => updateQuantity(item.id, quantityFor(item.id) + 1)}
                          disabled={!item.is_available}
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:brightness-95"
                      onClick={() => handleQuickAdd(item)}
                      disabled={!item.is_available}
                    >
                      Adicionar
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {!filteredItems.length && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum item encontrado para os filtros atuais.
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="bg-zinc-950 px-4 py-3 text-zinc-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Carrinho</h3>
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-4 p-4">
                {!hasCart && (
                  <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                    Seu carrinho está vazio.
                  </div>
                )}

                {hasCart && (
                  <>
                    <div className="max-h-64 space-y-2 overflow-auto pr-1">
                      {cartItems.map((line) => (
                        <div
                          key={line.line_id ?? `${line.item_id}-${line.name}`}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{line.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {line.quantity}x • {formatBrl(line.subtotal)}
                              </p>
                            </div>
                            {line.line_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(line.line_id as string)}
                                aria-label={`Remover ${line.name} do carrinho`}
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full" onClick={clearCart}>
                      Limpar carrinho
                    </Button>
                  </>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Itens ({itemCount})</span>
                    <span>{formatBrl(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span>{formatBrl(deliveryFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatBrl(total)}</span>
                  </div>
                </div>

                <Input
                  id="premium-coupon-code"
                  aria-label="Cupom"
                  placeholder="Cupom"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                />
                <Textarea
                  rows={3}
                  id="premium-order-notes"
                  aria-label="Observações do pedido"
                  placeholder="Observações do pedido"
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                />

                {minimumOrderRemaining > 0 && (
                  <p className="text-xs text-amber-700">
                    Faltam {formatBrl(minimumOrderRemaining)} para atingir o pedido mínimo.
                  </p>
                )}

                <Button
                  className="w-full bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:brightness-95"
                  disabled={!hasCart || minimumOrderRemaining > 0}
                  onClick={handleProceedToCheckout}
                >
                  Finalizar pedido
                </Button>
              </div>
            </div>
          </aside>
        </main>
      </div>

      <MenuItemDetailDrawer
        business={business}
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />

      <StickyOrderBar business={business} />

      <GastronomyShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        businessName={business.name}
        businessDescription={business.description}
        businessUrl={window.location.href}
      />
    </>
  );
}
