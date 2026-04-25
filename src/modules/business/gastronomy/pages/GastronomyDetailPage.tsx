import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Heart,
  LayoutDashboard,
  MapPin,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';

import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { useSessionContext } from '@/core/session';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { usePublicGastronomySnapshot } from '@/modules/business/public/hooks';
import {
  GastronomyContactSidebar,
  GastronomyOwnerDashboard,
  GastronomyPhotoGallery,
  GastronomyQuickActions,
  GastronomyShareDialog,
  MenuItemCard,
  MenuItemDetailDrawer,
  ReviewsSection,
  StickyOrderBar,
} from '../components';
import { useFavoritesManager } from '../hooks';
import { getCuisineLabel } from '../constants';
import type { MenuItemWithRelations } from '../types';
import { useGastronomyOpeningStatus } from '../hooks/useGastronomyOpeningStatus';
import { formatBrl } from '../utils/currency';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

export default function GastronomyDetailPage() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();
  const moduleUrls = useFriendlyModuleUrls();
  const { user, activeProfile, profiles } = useSessionContext();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: snapshot, isLoading: isLoadingSnapshot } = usePublicGastronomySnapshot({
    state,
    city,
    district,
    slug,
  });

  const business = snapshot?.gastronomy.business ?? null;
  const profile = snapshot?.gastronomy.profile ?? business?.gastronomy_profile ?? null;
  const menu = snapshot?.gastronomy.menu ?? null;
  const promotions = snapshot?.gastronomy.promotions ?? [];
  const hasUsefulMenuContent = snapshot?.gastronomy.hasUsefulMenuContent ?? false;
  const companyUrl = snapshot?.seo.canonicalBusinessUrl ?? null;
  const gastronomyCanonicalUrl =
    snapshot?.seo.canonicalGastronomyUrl ?? snapshot?.seo.canonical ?? null;
  const seoTitle = snapshot?.seo.title ?? `${business?.name ?? 'Gastronomia'} - Cardapio e pedidos | Achegue-se`;
  const seoDescription =
    snapshot?.seo.description ??
    `${business?.description ?? ''} - cardapio, precos e pedidos.`;
  const seoRobots = snapshot?.seo.robots ?? 'index, follow';

  useEffect(() => {
    if (!snapshot?.routing.redirectToCanonical) {
      return;
    }

    navigate(snapshot.routing.redirectToCanonical, { replace: true });
  }, [navigate, snapshot?.routing.redirectToCanonical]);

  const { isFavorited, toggleFavorite, isToggling } = useFavoritesManager(
    business?.business_data_id,
  );

  const openingStatus = useGastronomyOpeningStatus(business);

  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return [...menu.categories].sort((a, b) => a.display_order - b.display_order);
  }, [menu]);

  useEffect(() => {
    if (!sortedCategories.length) {
      setActiveCategory(null);
      return;
    }
    if (!activeCategory || !sortedCategories.some((c) => c.id === activeCategory)) {
      setActiveCategory(sortedCategories[0].id);
    }
  }, [activeCategory, sortedCategories]);

  if (!business && !isLoadingSnapshot) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-semibold">Estabelecimento nao encontrado</h1>
        <p className="mt-3 text-muted-foreground">
          O endereco informado nao pertence a um estabelecimento ativo neste territorio.
        </p>
        <Button asChild className="mt-6">
          <Link to={moduleUrls.gastronomy}>Voltar para gastronomia</Link>
        </Button>
      </div>
    );
  }

  if (!business || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const activeCategoryData = sortedCategories.find((c) => c.id === activeCategory);
  const activeItems = activeCategoryData?.items ?? [];
  const cuisineLabel = getCuisineLabel(profile.cuisine_type);
  const averageRating = business.rating.toFixed(1);
  const photos = business.fotos ?? [];
  const neighborhoodName =
    business.location?.name ??
    business.location?.full_name ??
    snapshot?.institutional.locationText ??
    "Bairro nao informado";

  const ownerProfileId = business.profile_id;
  const isOwner = Boolean(
    ownerProfileId &&
      (activeProfile?.id === ownerProfileId ||
        profiles.some((profileItem) => profileItem.id === ownerProfileId)),
  );

  const serviceModes = [
    profile.delivery_enabled ? { label: 'Entrega', icon: Truck, color: 'text-emerald-600' } : null,
    profile.takeout_enabled ? { label: 'Retirada', icon: ShoppingBag, color: 'text-amber-600' } : null,
    profile.dine_in_enabled ? { label: 'No local', icon: Store, color: 'text-blue-600' } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof Truck; color: string }>;

  const dotColorClass = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-amber-500',
  }[openingStatus?.dotColor ?? 'red'];

  const absoluteGastronomyUrl =
    gastronomyCanonicalUrl && typeof window !== 'undefined'
      ? `${window.location.origin}${gastronomyCanonicalUrl}`
      : undefined;

  const breadcrumbsSchema =
    absoluteGastronomyUrl && typeof window !== 'undefined'
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Inicio',
              item: window.location.origin,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Gastronomia',
              item: `${window.location.origin}${moduleUrls.gastronomy}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: business.name,
              item: absoluteGastronomyUrl,
            },
          ],
        }
      : null;

  const menuOfferSchema =
    absoluteGastronomyUrl && hasUsefulMenuContent
      ? {
          '@context': 'https://schema.org',
          '@type': 'Restaurant',
          name: business.name,
          description: business.description,
          url: absoluteGastronomyUrl,
          servesCuisine: cuisineLabel,
          hasMenu: {
            '@type': 'Menu',
            name: menu?.name ?? `Cardapio ${business.name}`,
            hasMenuSection: sortedCategories.map((category) => ({
              '@type': 'MenuSection',
              name: category.name,
              hasMenuItem: category.items.map((item) => ({
                '@type': 'MenuItem',
                name: item.name,
                description: item.description,
                image: item.image_url,
                offers: {
                  '@type': 'Offer',
                  price: item.base_price,
                  priceCurrency: 'BRL',
                  availability: item.is_available
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                },
              })),
            })),
          },
        }
      : null;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, url });
        return;
      } catch {
        // fallback for dialog
      }
    }
    setShareOpen(true);
  };

  const ownerManagementActions = isOwner
    ? [
        ownerProfileId
          ? { label: 'Dashboard empresa', url: businessManagementRoutes.overview(ownerProfileId), primary: true }
          : null,
        ownerProfileId ? { label: 'Editar pagina / imagens', url: `/edit-business/${ownerProfileId}` } : null,
        ownerProfileId
          ? { label: 'Produtos / cardapio', url: businessManagementRoutes.gastronomyCardapio(ownerProfileId) }
          : null,
        ownerProfileId
          ? {
              label: 'Analytics / visitantes',
              url: businessManagementRoutes.gastronomyAnalytics(ownerProfileId),
            }
          : null,
        ownerProfileId && profile.delivery_enabled
          ? { label: 'Pedidos', url: businessManagementRoutes.gastronomyPedidos(ownerProfileId) }
          : null,
        ownerProfileId && profile.delivery_enabled
          ? { label: 'Entregas', url: businessManagementRoutes.gastronomyEntregas(ownerProfileId) }
          : null,
      ].filter((item): item is { label: string; url: string; primary?: boolean } => Boolean(item?.url))
    : [];

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {absoluteGastronomyUrl && <link rel="canonical" href={absoluteGastronomyUrl} />}
        <meta
          name="robots"
          content={!isLoadingSnapshot && !hasUsefulMenuContent ? 'noindex, follow' : seoRobots}
        />
        {breadcrumbsSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbsSchema)}</script>}
        {menuOfferSchema && <script type="application/ld+json">{JSON.stringify(menuOfferSchema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-background pb-28">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60" />
          {business.banner_url ? (
            <img src={business.banner_url} alt={business.name} className="h-72 w-full object-cover sm:h-80" />
          ) : (
            <div className="h-72 w-full bg-muted sm:h-80" />
          )}

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full bg-black/45 text-white hover:bg-black/65"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="rounded-full bg-black/45 text-white hover:bg-black/65"
                onClick={toggleFavorite}
                disabled={isToggling || !user}
                title={
                  !user
                    ? 'Faca login para favoritar'
                    : isFavorited
                      ? 'Remover dos favoritos'
                      : 'Adicionar aos favoritos'
                }
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="rounded-full bg-black/45 text-white hover:bg-black/65"
                onClick={handleShare}
                aria-label="Compartilhar estabelecimento"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-10 text-white">
            <div className="mx-auto max-w-5xl">
              <div className="mb-3 flex flex-wrap gap-2">
                {business.is_verified && (
                  <Badge className="border-0 bg-white/15 text-white">
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    Verificado
                  </Badge>
                )}
                {profile.delivery_enabled && (
                  <Badge className="border-0 bg-emerald-500/90 text-white">Delivery ativo</Badge>
                )}
                {openingStatus && (
                  <Badge className="border-0 bg-black/30 text-white gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColorClass}`} />
                    {openingStatus.statusText}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">{business.name}</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/85 sm:text-base">{business.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{averageRating}</span>
                  <span className="text-white/70">({business.total_reviews} avaliacoes)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{neighborhoodName}</span>
                </div>
                {profile.delivery_enabled && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {profile.delivery_time_min ?? 20}-{profile.delivery_time_max ?? 40} min
                    </span>
                  </div>
                )}
                <span>{cuisineLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b bg-card">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            {serviceModes.map((mode) => (
              <div key={mode.label} className={`flex items-center gap-1.5 ${mode.color}`}>
                <mode.icon className="h-4 w-4" />
                <span className="font-medium">{mode.label}</span>
              </div>
            ))}
            {serviceModes.length > 0 && <span className="hidden h-4 w-px bg-border sm:block" />}
            <span className="text-muted-foreground">Taxa: {formatBrl(profile.delivery_fee ?? 0)}</span>
            {profile.minimum_order && (
              <>
                <span className="hidden h-4 w-px bg-border sm:block" />
                <span className="text-muted-foreground">Minimo: {formatBrl(profile.minimum_order)}</span>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <GastronomyQuickActions business={business} companyUrl={companyUrl} />

          {isOwner && ownerManagementActions.length > 0 && (
            <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">Painel do proprietario</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atalhos rapidos para gerir visitantes, imagens, produtos e operacao.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ownerManagementActions.map((action) => (
                  <Button
                    key={`owner-action-${action.label}`}
                    size="sm"
                    variant={action.primary ? 'default' : 'outline'}
                    onClick={() => navigate(action.url)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <Tabs defaultValue="cardapio" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-6">
                  <TabsTrigger value="cardapio">Cardapio</TabsTrigger>
                  <TabsTrigger value="sobre">Sobre</TabsTrigger>
                  {isOwner ? (
                    <TabsTrigger value="dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-1.5" />
                      Dashboard
                    </TabsTrigger>
                  ) : (
                    <TabsTrigger value="avaliacoes">Avaliacoes</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="cardapio" className="space-y-6">
                  {promotions.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-xl font-semibold">Promocoes ativas</h2>
                      <div className="grid gap-3">
                        {promotions.map((promo) => (
                          <div key={promo.id} className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                            <p className="font-medium">{promo.title}</p>
                            {promo.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{promo.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">Cardapio</h2>
                        <p className="text-sm text-muted-foreground">
                          {menu ? 'Cardapio operacional publicado' : 'Cardapio ainda nao publicado'}
                        </p>
                      </div>
                      {isLoadingSnapshot && <Badge variant="outline">Carregando</Badge>}
                    </div>

                    {sortedCategories.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {sortedCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setActiveCategory(category.id)}
                            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                              activeCategory === category.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {category.name} ({category.items.length})
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {activeItems.map((item) => (
                        <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
                      ))}
                      {!activeItems.length && (
                        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                          {menu
                            ? 'Nenhum item disponivel nesta categoria.'
                            : 'Este estabelecimento ainda nao publicou um cardapio operacional.'}
                        </div>
                      )}
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="sobre" className="space-y-6">
                  <section className="space-y-3">
                    <h2 className="text-xl font-semibold">Sobre o restaurante</h2>
                    <p className="leading-relaxed text-muted-foreground">
                      {business.description || 'Nenhuma descricao cadastrada.'}
                    </p>
                  </section>

                  {(profile.has_parking ||
                    profile.has_wifi ||
                    profile.has_accessibility ||
                    profile.has_kids_area ||
                    profile.has_live_music ||
                    profile.accepts_reservations) && (
                    <section className="space-y-3">
                      <h2 className="text-xl font-semibold">Recursos</h2>
                      <div className="flex flex-wrap gap-2">
                        {profile.accepts_reservations && <Badge variant="outline">Aceita reservas</Badge>}
                        {profile.has_parking && <Badge variant="outline">Estacionamento</Badge>}
                        {profile.has_wifi && <Badge variant="outline">Wi-Fi</Badge>}
                        {profile.has_accessibility && <Badge variant="outline">Acessivel</Badge>}
                        {profile.has_kids_area && <Badge variant="outline">Area kids</Badge>}
                        {profile.has_live_music && <Badge variant="outline">Musica ao vivo</Badge>}
                      </div>
                    </section>
                  )}

                  {photos.length > 0 && <GastronomyPhotoGallery photos={photos} businessName={business.name} />}
                </TabsContent>

                {!isOwner && (
                  <TabsContent value="avaliacoes">
                    <ReviewsSection businessProfileId={business.profile_id} businessName={business.name} />
                  </TabsContent>
                )}

                {isOwner && (
                  <TabsContent value="dashboard">
                    <GastronomyOwnerDashboard
                      businessProfileId={business.profile_id}
                      businessDataId={business.business_data_id}
                      business={business}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            <GastronomyContactSidebar business={business} />
          </div>
        </div>
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
        businessUrl={typeof window !== 'undefined' ? window.location.href : gastronomyCanonicalUrl ?? ''}
      />
    </>
  );
}
