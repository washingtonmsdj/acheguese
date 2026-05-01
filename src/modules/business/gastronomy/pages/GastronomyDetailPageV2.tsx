import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Heart,
  Info,
  MapPin,
  Phone,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Truck,
  UtensilsCrossed,
  X,
} from 'lucide-react';

import { useSessionContext } from '@/core/session';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { usePublicGastronomySnapshot } from '@/modules/business/public/hooks';
import { cn } from '@/shared/utils/cn';

import {
  GastronomyShareDialog,
  MenuItemCard,
  MenuItemDetailDrawer,
  ReviewsSection,
  StickyOrderBar,
} from '../components';
import { useFavoritesManager } from '../hooks';
import { getCuisineLabel } from '../constants';
import type { MenuCategory, MenuItemWithRelations } from '../types';
import { useGastronomyOpeningStatus } from '../hooks/useGastronomyOpeningStatus';
import { formatBrl } from '../utils/currency';

// =============================================================================
// NOVOS COMPONENTES INTERNOS
// =============================================================================

interface HeroSectionProps {
  business: {
    name: string;
    description?: string;
    banner_url?: string;
    is_verified?: boolean;
    rating: number;
    total_reviews: number;
    fotos?: string[];
  };
  profile: {
    delivery_enabled: boolean;
    delivery_time_min?: number;
    delivery_time_max?: number;
  };
  openingStatus: {
    isOpen: boolean;
    statusText: string;
    dotColor: 'green' | 'red' | 'yellow';
    closingTime?: string | null;
  } | null;
  neighborhoodName: string;
  cuisineLabel: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onBack: () => void;
  isLoading: boolean;
}

function HeroSection({
  business,
  profile,
  openingStatus,
  neighborhoodName,
  cuisineLabel,
  isFavorited,
  onToggleFavorite,
  onShare,
  onBack,
  isLoading,
}: HeroSectionProps) {
  const averageRating = business.rating.toFixed(1);

  return (
    <div className="relative h-[32vh] min-h-[240px] max-h-[360px] w-full overflow-hidden">
      {/* Background Image */}
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : business.banner_url ? (
        <img
          src={business.banner_url}
          alt={business.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-muted to-card" />
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

      {/* Top Navigation Bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              'h-10 w-10 rounded-full backdrop-blur-sm transition-all',
              isFavorited
                ? 'bg-destructive/80 text-destructive-foreground hover:bg-destructive'
                : 'bg-black/40 text-white hover:bg-black/60'
            )}
            onClick={onToggleFavorite}
          >
            <Heart className={cn('h-5 w-5', isFavorited && 'fill-current')} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            onClick={onShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Badges Row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {business.is_verified && (
              <Badge className="border-0 bg-accent/90 text-accent-foreground backdrop-blur-sm">
                <BadgeCheck className="mr-1 h-3 w-3" />
                Verificado
              </Badge>
            )}
            {profile.delivery_enabled && (
              <Badge className="border-0 bg-success/90 text-success-foreground backdrop-blur-sm">
                <Truck className="mr-1 h-3 w-3" />
                Delivery
              </Badge>
            )}
            {openingStatus && (
              <Badge
                className={cn(
                  'border-0 gap-1.5 backdrop-blur-sm',
                  openingStatus.isOpen
                    ? 'bg-success/90 text-success-foreground'
                    : 'bg-warning/90 text-warning-foreground'
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full animate-pulse bg-current opacity-80'
                  )}
                />
                {openingStatus.statusText}
                {openingStatus.isOpen && openingStatus.closingTime && (
                  <span className="hidden sm:inline opacity-80">
                    · Fecha às {openingStatus.closingTime}
                  </span>
                )}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            {business.name}
          </h1>

          {/* Description */}
          {business.description && (
            <p className="mt-1 line-clamp-1 max-w-2xl text-xs text-white/80 sm:text-sm">
              {business.description}
            </p>
          )}

          {/* Meta Info Row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{averageRating}</span>
              <span className="text-white/60">({business.total_reviews})</span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 bg-white/30 sm:block" />
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-white/70" />
              <span>{neighborhoodName}</span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 bg-white/30 sm:block" />
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-4 w-4 text-white/70" />
              <span>{cuisineLabel}</span>
            </div>
            {profile.delivery_enabled && (
              <>
                <Separator orientation="vertical" className="hidden h-4 bg-white/30 sm:block" />
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-white/70" />
                  <span>
                    {profile.delivery_time_min ?? 20}-{profile.delivery_time_max ?? 40} min
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SERVICE BAR
// =============================================================================

interface ServiceBarProps {
  profile: {
    delivery_enabled: boolean;
    takeout_enabled: boolean;
    dine_in_enabled: boolean;
    delivery_fee?: number;
    minimum_order?: number;
  };
}

function ServiceBar({ profile }: ServiceBarProps) {
  const serviceModes = [
    profile.delivery_enabled && {
      label: 'Entrega',
      icon: Truck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    profile.takeout_enabled && {
      label: 'Retirada',
      icon: ShoppingBag,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    profile.dine_in_enabled && {
      label: 'No local',
      icon: Store,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ].filter(Boolean) as Array<{
    label: string;
    icon: typeof Truck;
    color: string;
    bgColor: string;
  }>;
  const normalizedServiceModes =
    serviceModes.length > 0
      ? serviceModes
      : [
          {
            label: 'No local',
            icon: Store,
            color: 'text-muted-foreground',
            bgColor: 'bg-muted/60',
          },
        ];

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Service Modes */}
          <div className="flex items-center gap-3">
            {normalizedServiceModes.map((mode) => (
              <div
                key={mode.label}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                  mode.bgColor,
                  mode.color
                )}
              >
                <mode.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{mode.label}</span>
              </div>
            ))}
          </div>

          {/* Pricing Info */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-muted-foreground/70">Taxa:</span>
              <span className="font-medium text-foreground">{formatBrl(profile.delivery_fee ?? 0)}</span>
            </div>
            {profile.minimum_order && profile.minimum_order > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-muted-foreground/70">Mín:</span>
                  <span className="font-medium text-foreground">{formatBrl(profile.minimum_order)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CATEGORY NAV
// =============================================================================

interface CategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onSelect: (id: string) => void;
  itemCounts: Record<string, number>;
}

function CategoryNav({ categories, activeCategory, onSelect, itemCounts }: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[73px] z-20 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollArea className="w-full" orientation="horizontal">
          <div ref={scrollRef} className="flex gap-2 py-3">
            {categories.map((category) => {
              const count = itemCounts[category.id] ?? 0;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => onSelect(category.id)}
                  className={cn(
                    'relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  )}
                >
                  {category.name}
                  {count > 0 && (
                    <span
                      className={cn(
                        'ml-1.5 text-xs',
                        isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// =============================================================================
// BUSINESS INFO SIDEBAR
// =============================================================================

interface BusinessInfoSidebarProps {
  business: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    fotos?: string[];
    address?: {
      latitude?: number;
      longitude?: number;
    };
    location?: {
      full_name?: string;
    };
    gastronomy_profile: {
      accepts_reservations: boolean;
      has_parking: boolean;
      has_wifi: boolean;
      has_accessibility: boolean;
      has_kids_area: boolean;
      has_live_music: boolean;
    };
  };
  openingStatus: {
    isOpen: boolean;
    statusText: string;
    dotColor: 'green' | 'red' | 'yellow';
  } | null;
  onNavigate: () => void;
}

function BusinessInfoSidebar({ business, openingStatus, onNavigate }: BusinessInfoSidebarProps) {
  const profile = business.gastronomy_profile;
  const hasCoords =
    typeof business.address?.latitude === 'number' &&
    typeof business.address?.longitude === 'number';

  const features = [
    profile.accepts_reservations && { icon: Info, label: 'Aceita reservas' },
    profile.has_parking && { icon: Store, label: 'Estacionamento' },
    profile.has_wifi && { icon: 'wifi', label: 'Wi-Fi' },
    profile.has_accessibility && { icon: 'accessibility', label: 'Acessível' },
    profile.has_kids_area && { icon: 'kids', label: 'Área kids' },
    profile.has_live_music && { icon: 'music', label: 'Música ao vivo' },
  ].filter(Boolean) as Array<{ icon: typeof Info; label: string }>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Contact Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
          <Phone className="h-4 w-4" />
          Contato
        </h3>

        <div className="space-y-3">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium text-foreground">{business.phone}</p>
              </div>
            </a>
          )}

          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15">
                <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 9.892H8.619c-3.309 0-6-2.691-6-6V5.417c0-3.309 2.691-6 6-6h6.002c3.309 0 6 2.691 6 6v13.334c0 3.309-2.691 6-6 6z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-medium text-success">{business.whatsapp}</p>
              </div>
            </a>
          )}

          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{business.email}</p>
              </div>
            </a>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {business.whatsapp && (
            <Button
              asChild
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <a
                href={`https://wa.me/${business.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 9.892H8.619c-3.309 0-6-2.691-6-6V5.417c0-3.309 2.691-6 6-6h6.002c3.309 0 6 2.691 6 6v13.334c0 3.309-2.691 6-6 6z" />
                </svg>
                WhatsApp
              </a>
            </Button>
          )}
          {business.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${business.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Ligar
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Opening Hours */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
          <Clock className="h-4 w-4" />
          Horário de Funcionamento
        </h3>

        {openingStatus ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-3 w-3 rounded-full animate-pulse',
                openingStatus.dotColor === 'green' && 'bg-success',
                openingStatus.dotColor === 'red' && 'bg-destructive',
                openingStatus.dotColor === 'yellow' && 'bg-warning'
              )}
            />
            <span
              className={cn(
                'font-medium',
                openingStatus.isOpen ? 'text-success' : 'text-warning'
              )}
            >
              {openingStatus.statusText}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Consulte pelo telefone</p>
        )}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-card-foreground">Comodidades</h3>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge key={feature.label} variant="secondary" className="px-2 py-1">
                {feature.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {hasCoords && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
            <MapPin className="h-4 w-4" />
            Localização
          </h3>
          {business.location?.full_name && (
            <p className="mb-3 text-sm text-muted-foreground">{business.location.full_name}</p>
          )}
          <Button variant="outline" className="w-full" onClick={onNavigate}>
            <MapPin className="mr-2 h-4 w-4" />
            Como Chegar
          </Button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PÁGINA PRINCIPAL
// =============================================================================

export default function GastronomyDetailPageV2() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();
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
  const gastronomyCanonicalUrl =
    snapshot?.seo.canonicalGastronomyUrl ?? snapshot?.seo.canonical ?? null;

  const openingStatus = useGastronomyOpeningStatus(business);

  const { isFavorited, toggleFavorite } = useFavoritesManager(business?.business_data_id);

  // Process categories and items
  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return [...menu.categories].sort((a, b) => a.display_order - b.display_order);
  }, [menu]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sortedCategories.forEach((cat) => {
      counts[cat.id] = cat.items?.length ?? 0;
    });
    return counts;
  }, [sortedCategories]);

  useEffect(() => {
    if (sortedCategories.length > 0 && !activeCategory) {
      setActiveCategory(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategory]);

  const activeCategoryData = sortedCategories.find((c) => c.id === activeCategory);
  const activeItems = activeCategoryData?.items ?? [];

  const handleNavigate = () => {
    const lat = business?.address?.latitude;
    const lng = business?.address?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const url = isIos
        ? `maps://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: business?.name, url: window.location.href });
        return;
      } catch {
        // fallback
      }
    }
    setShareOpen(true);
  };

  // SEO Schema
  const seoTitle = snapshot?.seo.title ?? `${business?.name ?? 'Gastronomia'} - Cardápio | Achegue-se`;
  const seoDescription =
    snapshot?.seo.description ??
    `${business?.description ?? ''} - cardápio, preços e pedidos online.`;

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: window.location.origin },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Gastronomia',
        item: `${window.location.origin}/gastronomia`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business?.name ?? 'Restaurante',
        item: window.location.href,
      },
    ],
  };

  if (!business && !isLoadingSnapshot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="rounded-full bg-muted p-6">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/60" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Estabelecimento não encontrado</h1>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          O endereço informado não pertence a um estabelecimento ativo neste território.
        </p>
        <Button asChild className="mt-6">
          <Link to="/gastronomia">Voltar para gastronomia</Link>
        </Button>
      </div>
    );
  }

  if (!business || !profile) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[32vh] min-h-[240px] w-full" />
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbsSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroSection
          business={business}
          profile={profile}
          openingStatus={openingStatus}
          neighborhoodName={
            business.location?.name ??
            business.location?.full_name ??
            snapshot?.institutional.locationText ??
            'Bairro não informado'
          }
          cuisineLabel={getCuisineLabel(profile.cuisine_type)}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
          onBack={() => navigate(-1)}
          isLoading={isLoadingSnapshot}
        />

        {/* Service Bar */}
        <ServiceBar profile={profile} />

        {/* Category Navigation */}
        {sortedCategories.length > 0 && (
          <CategoryNav
            categories={sortedCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            itemCounts={itemCounts}
          />
        )}

        {/* Main Content — cardapio em foco, full-width */}
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          {/* Promotions */}
          {promotions.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">Promoções Ativas</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-xl border border-success/30 bg-success/10 p-4"
                  >
                    <p className="font-medium text-success">{promo.title}</p>
                    {promo.description && (
                      <p className="mt-1 text-sm text-success/90">{promo.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Menu Items */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {activeCategoryData?.name ?? 'Cardápio'}
              </h2>
              <span className="text-sm text-muted-foreground">
                {activeItems.length} {activeItems.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {activeItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedItem}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">
                  {menu
                    ? 'Nenhum item disponível nesta categoria.'
                    : 'Este estabelecimento ainda não publicou um cardápio operacional.'}
                </p>
              </div>
            )}
          </section>

          {/* Reviews Section */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <ReviewsSection
              businessProfileId={business.profile_id}
              businessName={business.name}
            />
          </section>

          {/* Sobre o estabelecimento — contato, horario, comodidades, localizacao */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sobre o estabelecimento</h2>
              <p className="text-sm text-muted-foreground">
                Contato, horario de funcionamento e comodidades.
              </p>
            </div>
            <BusinessInfoSidebar
              business={business}
              openingStatus={openingStatus}
              onNavigate={handleNavigate}
            />
          </section>
        </main>
      </div>

      {/* Drawer for Item Detail */}
      <MenuItemDetailDrawer
        business={business}
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />

      {/* Share Dialog */}
      <GastronomyShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        businessName={business.name}
        businessDescription={business.description}
        businessUrl={window.location.href}
      />

      {/* Sticky Order Bar (if cart has items) */}
      <StickyOrderBar business={business} />
    </>
  );
}
