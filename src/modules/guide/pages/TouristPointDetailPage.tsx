/**
 * TouristPointDetailPage — Detalhe expandido de ponto turístico
 *
 * Rota canônica: /guia/pontos-turisticos/:state/:city/:district?/:slug
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

import { useEffect, useState } from 'react';
import { useParams, Link, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { useTouristPoint } from '../hooks/useTouristPoint';
import { useGuideUrls } from '../hooks/useGuideUrls';
import { shouldRedirect } from '../utils/canonicalRedirect';
import { TouristPointGallery } from '../components/TouristPointGallery';
import { TouristPointFactsPanel } from '../components/TouristPointFactsPanel';
import { TouristPointTipsSection } from '../components/TouristPointTipsSection';
import { TouristPointMapSection } from '../components/TouristPointMapSection';
import { NearbyPlacesBlock } from '../components/NearbyPlacesBlock';
import { RelatedPointsBlock } from '../components/RelatedPointsBlock';
import { CommunityPhotosGallery } from '../components/CommunityPhotosGallery';
import { MOCK_TOURIST_POINTS, type MockTouristPointExtended } from '../__mocks__/touristPointMocks';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types/categories';
import { PRICE_TYPE_LABELS } from '../types';

export default function TouristPointDetailPage() {
  const params = useParams<{ state?: string; city?: string; slug?: string; groupSlugOrDistrict?: string; id?: string }>();
  const location = useLocation();
  // Para rota direta por ID, resolved pode não existir (não está dentro de TerritorialLayout)
  let resolved;
  try {
    const context = useTerritorialContext();
    resolved = context.resolved;
  } catch {
    // Rota direta por ID não tem contexto territorial
    resolved = undefined;
  }
  
  const guideUrls = useGuideUrls(resolved);

  // Detectar se estamos na rota de 3 ou 4 segmentos OU rota direta por ID
  // Rota direta: /pontos-turisticos/:id (UUID)
  // Rota 3 segmentos: /guia/pontos-turisticos/:state/:city/:slug
  //   → groupSlugOrDistrict é o slug do ponto turístico
  // Rota 4 segmentos: /guia/pontos-turisticos/:state/:city/:district/:slug
  //   → slug é o slug do ponto turístico
  // Rota 4 segmentos com placeholder: /guia/pontos-turisticos/:state/:city/_/:slug
  //   → "_" é ignorado, slug é o slug do ponto turístico
  
  // Verificar se é um UUID (rota direta por ID)
  const isUUID = params.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
  
  const pointSlug = isUUID 
    ? params.id 
    : (params.slug || (params.groupSlugOrDistrict !== '_' ? params.groupSlugOrDistrict : undefined));

  // Se não há slug, significa que groupSlugOrDistrict pode ser tanto um distrito
  // quanto um slug de ponto turístico. Vamos tentar buscar como ponto turístico.
  // Para rota direta por ID, locationId é opcional
  const locationId = !isUUID && resolved
    ? (resolved.kind === 'location'
      ? resolved.location.id
      : resolved.group.members[0]?.id ?? '')
    : undefined;

  const { data: point, isLoading } = useTouristPoint(locationId, pointSlug);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

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

  // BLINDAGEM: Redirecionamento canônico
  // Se a URL não está no formato canônico (sem bairro ou bairro errado), redireciona
  const redirectCheck = shouldRedirect(location.pathname, point ?? null);
  if (redirectCheck.shouldRedirect && redirectCheck.canonicalUrl) {
    return <Navigate to={redirectCheck.canonicalUrl} replace />;
  }

  // Enrich with mock extended data when available
  const mockPoint = MOCK_TOURIST_POINTS.find((p) => p.slug === pointSlug);

  const territoryName = resolved
    ? (resolved.kind === 'location'
      ? resolved.location.full_name
      : resolved.group.name)
    : 'Brasil';

  const backUrl = resolved ? guideUrls.touristPoints : '/pontos-turisticos';

  if (isLoading && !loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading && loadingTimedOut && !mockPoint) {
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

  // Use real data if available, otherwise fall back to mock
  const displayPoint = point ?? mockPoint;

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

  const coverMedia = displayPoint.media?.find((m) => m.is_cover) ?? displayPoint.media?.[0];

  // Extended fields from mock
  const ext = mockPoint as MockTouristPointExtended | undefined;
  const category = ext?.category;
  const catLabel = category ? CATEGORY_LABELS[category] : null;
  const catIcon = category ? CATEGORY_ICONS[category] : null;
  const rating = ext?.rating ?? 0;
  const reviewCount = ext?.review_count ?? 0;
  
  // SSOT: Priorizar point.location?.name sobre mock neighborhood
  const neighborhood = point?.location?.name ?? ext?.neighborhood;
  const neighborhoodFull = point?.location?.full_name ?? neighborhood;
  
  // SSOT: Priorizar point.address coordenadas sobre mock
  const latitude = point?.address?.latitude ?? ext?.latitude;
  const longitude = point?.address?.longitude ?? ext?.longitude;
  
  const tips = ext?.tips ?? null;
  const howToGetThere = ext?.how_to_get_there ?? null;
  const isFree = ext?.is_free;
  const isAccessible = ext?.is_accessible;
  const isFamilyFriendly = ext?.is_family_friendly;

  return (
    <>
      <Helmet>
        <title>{displayPoint.title} — Pontos Turísticos — {territoryName}</title>
        <meta name="description" content={displayPoint.summary} />
        <link rel="canonical" href={guideUrls.touristPointDetail(displayPoint.slug)} />
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
              {catLabel && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <span>{catIcon}</span>
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
              <Button size="sm" variant="outline" className="text-xs">
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
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
                  {PRICE_TYPE_LABELS[displayPoint.price_type]}
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
            city={params.city ?? 'salvador'}
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
