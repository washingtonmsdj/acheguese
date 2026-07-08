/**
 * TouristPointDetailPage — Detalhe expandido de ponto turístico
 *
 * Rota canônica: /pontos-turisticos/:state/:city/:district?/:slug
 *
 * Seções:
 * 1. Galeria forte (hero)
 * 2. Header com título, categoria, rating, badges
 * 3. Descrição completa
 * 4. Dicas úteis + como chegar
 * 5. Mapa interativo
 * 6. Informações rápidas (facts panel)
 * 7. Fotos da comunidade (hashtag)
 * 8. O que tem por perto (camada secundária)
 * 9. Lugares relacionados
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Star,
  MapPin,
  Clock,
  Accessibility,
  Users,
  Share2,
  Heart,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { useModuleTerritoryFilter } from '@/core/location';
import { useTouristPoint } from '../hooks/useTouristPoint';
import { useTouristPoints } from '../hooks/useTouristPoints';
import { buildTouristPointDetailUrl, useGuideUrls } from '../hooks/useGuideUrls';
import { useSavedTouristPoint } from '../hooks/useSavedTouristPoint';
import { TouristPointGallery } from '../components/TouristPointGallery';
import { TouristPointFactsPanel } from '../components/TouristPointFactsPanel';
import { TouristPointTipsSection } from '../components/TouristPointTipsSection';
import { TouristPointMapSection } from '../components/TouristPointMapSection';
import { NearbyPlacesBlock } from '../components/NearbyPlacesBlock';
import { RelatedPointsBlock } from '../components/RelatedPointsBlock';
import { CommunityPhotosGallery } from '../components/CommunityPhotosGallery';
import { CATEGORY_LABELS, CATEGORY_ICONS, type TouristPointCategory } from '../types/categories';
import { PRICE_TYPE_LABELS } from '@/core/guide/tourist-points/types';
import { toTouristPointDisplay } from '../types/presentation';

function getCategoryLabel(category?: TouristPointCategory | null): string | null {
  if (!category) return null;
  switch (category) {
    case 'praia':
      return CATEGORY_LABELS.praia;
    case 'praca':
      return CATEGORY_LABELS.praca;
    case 'parque':
      return CATEGORY_LABELS.parque;
    case 'trilha':
      return CATEGORY_LABELS.trilha;
    case 'mirante':
      return CATEGORY_LABELS.mirante;
    case 'museu':
      return CATEGORY_LABELS.museu;
    case 'centro-cultural':
      return CATEGORY_LABELS['centro-cultural'];
    case 'historico':
      return CATEGORY_LABELS.historico;
    case 'igreja':
      return CATEGORY_LABELS.igreja;
    case 'monumento':
      return CATEGORY_LABELS.monumento;
    case 'mercado':
      return CATEGORY_LABELS.mercado;
    case 'ar-livre':
      return CATEGORY_LABELS['ar-livre'];
    default:
      return null;
  }
}

function getCategoryIcon(category?: TouristPointCategory | null) {
  if (!category) return null;
  return getRecordValue(CATEGORY_ICONS, category) ?? null;
}

export default function TouristPointDetailPage() {
  const params = useParams<{ state?: string; city?: string; slug?: string; groupSlugOrDistrict?: string }>();
  const { resolved } = useTerritorialContext();
  const guideUrls = useGuideUrls(resolved);

  const pointSlug = params.slug ?? params.groupSlugOrDistrict;
  const locationId = resolved
    ? (resolved.kind === 'location'
      ? resolved.location.id
      : resolved.group.members.at(0)?.id ?? '')
    : undefined;

  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved });
  const territoryFilter = moduleTerritory.territoryFilter;
  const { data: point, isLoading } = useTouristPoint(locationId, pointSlug);
  const { data: relatedPointsRaw = [] } = useTouristPoints(territoryFilter);
  const {
    canSave,
    isSaved,
    isLoading: isSaving,
    toggleSaved,
  } = useSavedTouristPoint(point?.id);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  const handleToggleSaved = useCallback(async () => {
    if (!canSave) {
      toast.error('Entre na sua conta para salvar pontos turisticos.');
      return;
    }

    try {
      const nextSaved = await toggleSaved();
      toast.success(nextSaved ? 'Ponto turistico salvo.' : 'Ponto turistico removido dos salvos.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar este ponto turistico.');
    }
  }, [canSave, toggleSaved]);

  const handleShare = useCallback(async () => {
    if (!point) return;

    const url = `${window.location.origin}${buildTouristPointDetailUrl(point.location, point.slug)}`;
    const shareData = {
      title: point.title,
      text: point.summary,
      url,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData) !== false) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success('Link do ponto turistico copiado.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Nao foi possivel compartilhar este ponto turistico.');
    }
  }, [point]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setLoadingTimedOut(true);
    }, 9000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isLoading]);

  const territoryName = resolved
    ? (resolved.kind === 'location'
      ? resolved.location.full_name
      : resolved.group.name)
    : 'Brasil';

  const backUrl = guideUrls.touristPoints;

  if (isLoading && !loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading && loadingTimedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Não foi possível carregar este ponto turístico</p>
        <p className="text-sm text-muted-foreground">
          A conexão pode estar instável. Tente novamente.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link to={backUrl}>Voltar para listagem</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayPoint = point;

  if (!displayPoint) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Ponto turístico não encontrado</p>
        <p className="text-sm text-muted-foreground">
          Este ponto turístico não existe ou não está disponível.
        </p>
        <Button asChild variant="outline">
          <Link to={backUrl}>Ver todos os pontos turísticos</Link>
        </Button>
      </div>
    );
  }

  const displayModel = toTouristPointDisplay(displayPoint);
  const relatedPoints = relatedPointsRaw.map(toTouristPointDisplay);
  const coverMedia = displayPoint.media?.find((m) => m.is_cover) ?? displayPoint.media?.at(0);

  const category = displayModel.category as TouristPointCategory | undefined;
  const catLabel = getCategoryLabel(category);
  const CategoryIcon = getCategoryIcon(category);
  const rating = displayModel.rating;
  const reviewCount = displayModel.review_count;
  const neighborhood = displayModel.location?.name ?? displayModel.neighborhood;
  const latitude = displayModel.latitude;
  const longitude = displayModel.longitude;
  const tips = displayModel.tips;
  const howToGetThere = displayModel.how_to_get_there;
  const isFree = displayModel.is_free;
  const isAccessible = displayModel.is_accessible;
  const isFamilyFriendly = displayModel.is_family_friendly;

  return (
    <>
      <Helmet>
        <title>{displayPoint.title} — Pontos Turísticos — {territoryName}</title>
        <meta name="description" content={displayPoint.summary} />
        <link rel="canonical" href={buildTouristPointDetailUrl(displayPoint.location, displayPoint.slug)} />
        {coverMedia && <meta property="og:image" content={coverMedia.url} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Back nav */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 mb-4">
            <Link to={backUrl}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Pontos turísticos de {territoryName}
            </Link>
          </Button>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          {/* ── Gallery ─────────────────────────────────────────────── */}
          {displayPoint.media && displayPoint.media.length > 0 && (
            <div className="mb-8">
              <TouristPointGallery media={displayPoint.media} title={displayPoint.title} />
            </div>
          )}

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="mb-8">
            {/* Category + badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {catLabel && CategoryIcon && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {catLabel}
                </Badge>
              )}
              {isFree && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                  Gratuito
                </Badge>
              )}
              {displayPoint.is_featured && (
                <Badge className="bg-warning/15 text-warning border-warning/30 text-xs flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Destaque
                </Badge>
              )}
              {isAccessible && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Accessibility className="h-3 w-3" />
                  Acessível
                </Badge>
              )}
              {isFamilyFriendly && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Família
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
              {displayPoint.title}
            </h1>

            {/* Summary */}
            <p className="text-muted-foreground mt-2 text-base leading-relaxed max-w-2xl">
              {displayPoint.summary}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviewCount.toLocaleString('pt-BR')} avaliações)</span>
                </div>
              )}

              {neighborhood && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {neighborhood}
                </span>
              )}

              {displayPoint.opening_hours && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {displayPoint.opening_hours}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-5">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={handleToggleSaved}
                disabled={isSaving}
                aria-pressed={isSaved}
              >
                <Heart className={`h-3.5 w-3.5 mr-1.5 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Salvo' : 'Salvar'}
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Compartilhar
              </Button>
            </div>
          </div>

          {/* ── Content Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content — 2 cols */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-base font-bold text-foreground mb-3">Sobre o local</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {displayPoint.description}
                  </p>
                </div>
              </div>

              {/* Tips + how to get there */}
              <TouristPointTipsSection
                tips={tips}
                howToGetThere={howToGetThere}
                openingHours={displayPoint.opening_hours}
              />

              {/* Map */}
              {latitude && longitude && (
                <TouristPointMapSection
                  latitude={latitude}
                  longitude={longitude}
                  title={displayPoint.title}
                  address={displayPoint.address_text}
                />
              )}
            </div>

            {/* Sidebar — 1 col */}
            <div className="lg:col-span-1 space-y-6">
              <TouristPointFactsPanel point={displayPoint} />

              {/* Price highlight card */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                <p className="text-lg font-bold text-foreground">
                  {getRecordValue(PRICE_TYPE_LABELS, displayPoint.price_type) ?? displayPoint.price_type}
                </p>
                {displayPoint.price_text && (
                  <p className="text-sm text-muted-foreground mt-0.5">{displayPoint.price_text}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Community Photos ─────────────────────────────────── */}
          <CommunityPhotosGallery
            pointTitle={displayPoint.title}
            pointSlug={displayPoint.slug}
            locationId={locationId || null}
            city={params.city ?? ''}
            state={params.state}
            neighborhood={neighborhood ?? null}
          />

          {/* ── Nearby Places (secondary layer) ──────────────────── */}
          <NearbyPlacesBlock
            pointTitle={displayPoint.title}
            neighborhood={neighborhood}
          />

          {/* ── Related Points ───────────────────────────────────── */}
          <RelatedPointsBlock
            points={relatedPoints}
            currentPointId={displayPoint.id}
            category={category}
            neighborhood={neighborhood}
            buildDetailUrl={guideUrls.touristPointDetail}
          />
        </div>
      </div>
    </>
  );
}
