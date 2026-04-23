/**
 * GastronomyDetailPage — Página de detalhes do restaurante
 *
 * Paridade completa com a página de empresa:
 * - Sidebar de contato (WhatsApp, telefone, email, redes sociais, horário, mapa)
 * - Restaurantes similares
 * - Quick Actions (CTAs destacados)
 * - Compartilhamento rico com QR Code
 * - Favorito persistente
 * - Status de abertura em tempo real
 * - Galeria de fotos com lightbox
 * - Dashboard do dono (visualizações, favoritos, avaliações)
 * - Sistema de avaliações completo
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
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
import {
  useActivePromotions,
  useFavoritesManager,
  useGastronomyDetail,
  useMenu,
  useMenusByBusiness,
} from '../hooks';
import { useGastronomyOpeningStatus } from '../hooks/useGastronomyOpeningStatus';
import { getCuisineLabel } from '../constants';
import { formatBrl } from '../utils/currency';
import type { MenuItemWithRelations } from '../types';

export default function GastronomyDetailPage() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();
  const moduleUrls = useFriendlyModuleUrls();
  const { user, activeProfile, profiles } = useSessionContext();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: business, isLoading: isLoadingBusiness } = useGastronomyDetail({
    state,
    city,
    district,
    slug,
  });

  const { isFavorited, toggleFavorite, isToggling } = useFavoritesManager(
    business?.business_data_id,
  );

  const { data: businessMenus } = useMenusByBusiness(business?.business_data_id);
  const primaryMenuId = businessMenus?.[0]?.id;
  const { data: menu, isLoading: isLoadingMenu } = useMenu(primaryMenuId);
  const { data: promotions = [] } = useActivePromotions(business?.business_data_id);

  const openingStatus = useGastronomyOpeningStatus(business ?? null);
  const companyUrl = useMemo(() => {
    if (!business?.slug || !business.geographic_path) return null;

    try {
      return BusinessUrlService.getCanonicalUrl({
        id: business.profile_id,
        slug: business.slug,
        geographic_path: business.geographic_path,
        is_premium: business.is_premium,
      });
    } catch {
      return null;
    }
  }, [business]);

  // ── Cardápio ──────────────────────────────────────────────────────────────
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

  const activeCategoryData = sortedCategories.find((c) => c.id === activeCategory);
  const activeItems = activeCategoryData?.items ?? [];

  // ── Estados de carregamento ───────────────────────────────────────────────
  if (!business && !isLoadingBusiness) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-semibold">Estabelecimento não encontrado</h1>
        <p className="mt-3 text-muted-foreground">
          O endereço informado não pertence a um estabelecimento ativo neste território.
        </p>
        <Button asChild className="mt-6">
          <Link to={moduleUrls.gastronomy}>Voltar para gastronomia</Link>
        </Button>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  // ── Dados derivados ───────────────────────────────────────────────────────
  const profile = business.gastronomy_profile;
  const cuisineLabel = getCuisineLabel(profile.cuisine_type);
  const neighborhoodName = business.location?.name || 'Região não informada';
  const averageRating = business.rating.toFixed(1);
  const photos = business.fotos ?? [];

  // Dono do estabelecimento: comparar com profile.id (nao auth user.id)
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, url });
        return;
      } catch {
        // fallback para dialog
      }
    }
    setShareOpen(true);
  };

  const ownerManagementActions = isOwner
    ? [
        ownerProfileId
          ? { label: 'Dashboard empresa', url: `/dashboard/business/${ownerProfileId}`, primary: true }
          : null,
        ownerProfileId
          ? { label: 'Editar pagina / imagens', url: `/edit-business/${ownerProfileId}` }
          : null,
        ownerProfileId
          ? { label: 'Produtos / cardapio', url: `/dashboard/business/${ownerProfileId}/gastronomy/menu` }
          : null,
        ownerProfileId
          ? { label: 'Analytics / visitantes', url: `/dashboard/business/${ownerProfileId}/gastronomy/analytics` }
          : null,
        ownerProfileId && profile.delivery_enabled
          ? { label: 'Pedidos', url: `/dashboard/business/${ownerProfileId}/gastronomy/orders` }
          : null,
        ownerProfileId && profile.delivery_enabled
          ? { label: 'Entregas', url: `/dashboard/business/${ownerProfileId}/gastronomy/deliveries` }
          : null,
      ].filter(
        (item): item is { label: string; url: string; primary?: boolean } => Boolean(item?.url),
      )
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>{business.name} | OrdaX</title>
        <meta
          name="description"
          content={`${business.description} — ${cuisineLabel} em ${neighborhoodName}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-28">

        {/* ── Hero / Banner ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60" />
          {business.banner_url ? (
            <img
              src={business.banner_url}
              alt={business.name}
              className="h-72 w-full object-cover sm:h-80"
            />
          ) : (
            <div className="h-72 w-full bg-muted sm:h-80" />
          )}

          {/* Botões flutuantes */}
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
                    ? 'Faça login para favoritar'
                    : isFavorited
                      ? 'Remover dos favoritos'
                      : 'Adicionar aos favoritos'
                }
              >
                <Heart
                  className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
                />
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

          {/* Info sobre o banner */}
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
                  <Badge className="border-0 bg-emerald-500/90 text-white">
                    Delivery ativo
                  </Badge>
                )}
                {openingStatus && (
                  <Badge className="border-0 bg-black/30 text-white gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColorClass}`} />
                    {openingStatus.statusText}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">{business.name}</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/85 sm:text-base">
                {business.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{averageRating}</span>
                  <span className="text-white/70">({business.total_reviews} avaliações)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{neighborhoodName}</span>
                </div>
                {profile.delivery_enabled && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {profile.delivery_time_min ?? 20}–{profile.delivery_time_max ?? 40} min
                    </span>
                  </div>
                )}
                <span>{cuisineLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barra de modos de serviço ──────────────────────────────────── */}
        <div className="border-b bg-card">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            {serviceModes.map((mode) => (
              <div key={mode.label} className={`flex items-center gap-1.5 ${mode.color}`}>
                <mode.icon className="h-4 w-4" />
                <span className="font-medium">{mode.label}</span>
              </div>
            ))}
            {serviceModes.length > 0 && (
              <span className="hidden h-4 w-px bg-border sm:block" />
            )}
            <span className="text-muted-foreground">
              Taxa: {formatBrl(profile.delivery_fee ?? 0)}
            </span>
            {profile.minimum_order && (
              <>
                <span className="hidden h-4 w-px bg-border sm:block" />
                <span className="text-muted-foreground">
                  Mínimo: {formatBrl(profile.minimum_order)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Conteúdo principal ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 py-8">

          {/* Quick Actions */}
          <GastronomyQuickActions business={business} companyUrl={companyUrl} />

          {isOwner && ownerManagementActions.length > 0 && (
            <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    Painel do proprietario
                  </h2>
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

            {/* ── Coluna principal ──────────────────────────────────────── */}
            <div>
              <Tabs defaultValue="cardapio" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-6">
                  <TabsTrigger value="cardapio">Cardápio</TabsTrigger>
                  <TabsTrigger value="sobre">Sobre</TabsTrigger>
                  {isOwner && (
                    <TabsTrigger value="dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-1.5" />
                      Dashboard
                    </TabsTrigger>
                  )}
                  {!isOwner && (
                    <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                  )}
                </TabsList>

                {/* ── Tab: Cardápio ──────────────────────────────────── */}
                <TabsContent value="cardapio" className="space-y-6">
                  {/* Promoções ativas */}
                  {promotions.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-xl font-semibold">Promoções ativas</h2>
                      <div className="grid gap-3">
                        {promotions.map((promo) => (
                          <div
                            key={promo.id}
                            className="rounded-2xl border border-primary/15 bg-primary/5 p-4"
                          >
                            <p className="font-medium">{promo.title}</p>
                            {promo.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {promo.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Cardápio */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">Cardápio</h2>
                        <p className="text-sm text-muted-foreground">
                          {menu
                            ? 'Cardápio operacional publicado'
                            : 'Cardápio ainda não publicado'}
                        </p>
                      </div>
                      {(isLoadingMenu || isLoadingBusiness) && (
                        <Badge variant="outline">Carregando</Badge>
                      )}
                    </div>

                    {/* Tabs de categorias */}
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
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onSelect={setSelectedItem}
                        />
                      ))}
                      {!activeItems.length && (
                        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                          {menu
                            ? 'Nenhum item disponível nesta categoria.'
                            : 'Este estabelecimento ainda não publicou um cardápio operacional.'}
                        </div>
                      )}
                    </div>
                  </section>
                </TabsContent>

                {/* ── Tab: Sobre ─────────────────────────────────────── */}
                <TabsContent value="sobre" className="space-y-6">
                  {/* Descrição */}
                  <section className="space-y-3">
                    <h2 className="text-xl font-semibold">Sobre o restaurante</h2>
                    <p className="leading-relaxed text-muted-foreground">
                      {business.description || 'Nenhuma descrição cadastrada.'}
                    </p>
                  </section>

                  {/* Recursos */}
                  {(profile.has_parking ||
                    profile.has_wifi ||
                    profile.has_accessibility ||
                    profile.has_kids_area ||
                    profile.has_live_music ||
                    profile.accepts_reservations) && (
                    <section className="space-y-3">
                      <h2 className="text-xl font-semibold">Recursos</h2>
                      <div className="flex flex-wrap gap-2">
                        {profile.accepts_reservations && (
                          <Badge variant="outline">Aceita reservas</Badge>
                        )}
                        {profile.has_parking && (
                          <Badge variant="outline">Estacionamento</Badge>
                        )}
                        {profile.has_wifi && <Badge variant="outline">Wi-Fi</Badge>}
                        {profile.has_accessibility && (
                          <Badge variant="outline">Acessível</Badge>
                        )}
                        {profile.has_kids_area && (
                          <Badge variant="outline">Área kids</Badge>
                        )}
                        {profile.has_live_music && (
                          <Badge variant="outline">Música ao vivo</Badge>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Galeria de fotos */}
                  {photos.length > 0 && (
                    <GastronomyPhotoGallery
                      photos={photos}
                      businessName={business.name}
                    />
                  )}
                </TabsContent>

                {/* ── Tab: Avaliações (para não-donos) ──────────────── */}
                {!isOwner && (
                  <TabsContent value="avaliacoes">
                    <ReviewsSection
                      businessProfileId={business.profile_id}
                      businessName={business.name}
                    />
                  </TabsContent>
                )}

                {/* ── Tab: Dashboard (apenas dono) ──────────────────── */}
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

            {/* ── Sidebar de contato ────────────────────────────────── */}
            <GastronomyContactSidebar business={business} />
          </div>
        </div>
      </div>

      {/* Drawers e dialogs */}
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
