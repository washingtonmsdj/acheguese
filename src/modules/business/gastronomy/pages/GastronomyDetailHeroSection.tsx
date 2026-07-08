import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Heart,
  MapPin,
  Share2,
  Star,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';

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

export function GastronomyDetailHeroSection({
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
          onClick={onBack}
          aria-label="Voltar"
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
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={cn('h-5 w-5', isFavorited && 'fill-current')} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            onClick={onShare}
            aria-label="Compartilhar estabelecimento"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
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
                <span className="h-2 w-2 rounded-full animate-pulse bg-current opacity-80" />
                {openingStatus.statusText}
                {openingStatus.isOpen && openingStatus.closingTime && (
                  <span className="hidden sm:inline opacity-80">
                    Fecha as {openingStatus.closingTime}
                  </span>
                )}
              </Badge>
            )}
          </div>

          <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            {business.name}
          </h1>

          {business.description && (
            <p className="mt-1 line-clamp-1 max-w-2xl text-xs text-white/80 sm:text-sm">
              {business.description}
            </p>
          )}

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
