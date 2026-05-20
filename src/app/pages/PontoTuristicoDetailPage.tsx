/**
 * PontoTuristicoDetailPage - Pagina de detalhe de ponto turistico
 *
 * SSOT compliant - usa TouristPointService
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, Globe, Phone, Star, ExternalLink,
  Accessibility, ParkingMeter, UtensilsCrossed, Users, Navigation,
  ChevronLeft, ChevronRight, X, AlertTriangle, BadgeCheck, DollarSign,
  Share2, Loader2, Camera, Building2, Utensils, Compass, UserCheck, ImageIcon,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
  useTouristPointBySlug,
  useNearbyTouristPoints,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  PRICE_TYPE_LABELS,
  ACCESSIBILITY_LABELS,
  type TouristPoint,
} from '@/modules/guide/tourist-points';
import { useCommunityPhotos } from '@/modules/guide/tourist-points/hooks/useCommunityPhotos';
import { formatDistance } from '@/shared/utils/geolocation';
import { SEO } from '@/app/components/SEO';
import { NearbyBusinessesSection, NearbyGuidesSection } from './PontoTuristicoNearbySections';

export default function PontoTuristicoDetailPage() {
  const navigate = useNavigate();
  const { state = 'ba', city = 'salvador', slug = '' } = useParams();
  const { data: point, isLoading } = useTouristPointBySlug(state, city, slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!point) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <SEO title="Ponto turistico nao encontrado" noIndex />
        <Camera className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Ponto turistico nao encontrado</h1>
        <Button variant="outline" onClick={() => navigate(`/pontos-turisticos/${state}/${city}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>
      </div>
    );
  }

  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  const seoTitle = `${point.icon_emoji} ${point.name} - ${point.location?.name ?? point.neighborhood ?? cityName}`;
  const seoDescription = point.short_description
    ?? point.description.slice(0, 160).replace(/\n/g, ' ');
  const seoImage = point.photo_url ?? undefined;
  const seoUrl = `/pontos-turisticos/${state}/${city}/${point.slug}`;
  const seoKeywords = [
    point.name,
    CATEGORY_LABELS[point.category],
    point.location?.name ?? point.neighborhood,
    cityName,
    state.toUpperCase(),
    ...(point.tags ?? []),
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
        url={seoUrl}
        type="article"
        modifiedTime={point.updated_at}
        publishedTime={point.created_at}
      />
      {/* Hero Gallery */}
      <HeroGallery point={point} />

      {/* Breadcrumb + Back */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to={`/pontos-turisticos/${state}/${city}`}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pontos Turisticos
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{point.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title + Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_ICONS[point.category]} {CATEGORY_LABELS[point.category]}
                </Badge>
                {point.is_featured && (
                  <Badge className="bg-warning text-warning-foreground text-xs gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Destaque
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {point.icon_emoji} {point.name}
              </h1>

              {point.neighborhood && (
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {point.location?.name ?? point.neighborhood}, {cityName}
                </p>
              )}

              {/* Rating */}
              {point.rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-warning">
                    <Star className="h-4 w-4 fill-warning" />
                    <span className="font-bold text-sm">{point.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({point.total_reviews.toLocaleString('pt-BR')} avaliacoes)
                  </span>
                </div>
              )}
            </div>

            {/* Short Description */}
            {point.short_description && (
              <p className="text-base text-muted-foreground leading-relaxed font-medium border-l-4 border-primary/30 pl-4">
                {point.short_description}
              </p>
            )}

            {/* Full Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Sobre</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {point.description}
              </p>
            </div>

            {/* Observations */}
            {point.observations && (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Observacoes importantes</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{point.observations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {point.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {point.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Map Section */}
            <MapSection point={point} />

            {/* Nearby Attractions */}
            <NearbySection point={point} state={state} city={city} />

            {/* Nearby Businesses */}
            <NearbyBusinessesSection point={point} />

            {/* Tourism Guides */}
            <NearbyGuidesSection point={point} />

            {/* Community Photos */}
            <CommunityPhotosSection point={point} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Price Card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Entrada</h3>
                </div>
                <div>
                  <Badge
                    variant={point.price_type === 'free' ? 'default' : 'secondary'}
                    className={`text-sm ${point.price_type === 'free' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {PRICE_TYPE_LABELS[point.price_type]}
                  </Badge>
                  {point.price_text && (
                    <p className="text-sm text-muted-foreground mt-2">{point.price_text}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            {point.visiting_hours && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Horario de funcionamento</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{point.visiting_hours}</p>
                </CardContent>
              </Card>
            )}

            {/* Address */}
            {(point.address || point.address_text) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Endereco</h3>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {point.address ? (
                      // Canonico: join com addresses
                      <>
                        {point.address.street && (
                          <p>{point.address.street}{point.address.number ? `, ${point.address.number}` : ''}</p>
                        )}
                        {point.address.complement && <p>{point.address.complement}</p>}
                        {point.address.postal_code && <p>CEP {point.address.postal_code}</p>}
                      </>
                    ) : (
                      // Legado: texto livre
                      <p>{point.address_text}</p>
                    )}
                    <p>{point.location?.name ?? point.neighborhood}, {cityName}, {state.toUpperCase()}</p>
                  </div>
                  {(point.address?.latitude ?? point.latitude) && (point.address?.longitude ?? point.longitude) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const lat = point.address?.latitude ?? point.latitude;
                        const lng = point.address?.longitude ?? point.longitude;
                        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        const url = isIos
                          ? `maps://maps.apple.com/?daddr=${lat},${lng}`
                          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                      Como Chegar
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Accessibility */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Acessibilidade</h3>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    point.accessibility_level === 'total'
                      ? 'border-green-500 text-green-600'
                      : point.accessibility_level === 'parcial'
                      ? 'border-warning text-warning'
                      : point.accessibility_level === 'nenhuma'
                      ? 'border-destructive text-destructive'
                      : ''
                  }`}
                >
                  {ACCESSIBILITY_LABELS[point.accessibility_level]}
                </Badge>
                {point.accessibility_description && (
                  <p className="text-xs text-muted-foreground">{point.accessibility_description}</p>
                )}
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Comodidades</h3>
                <div className="space-y-2">
                  <AmenityItem icon={<ParkingMeter className="h-4 w-4" />} label="Estacionamento" available={point.has_parking} />
                  <AmenityItem icon={<UtensilsCrossed className="h-4 w-4" />} label="Restaurante / Alimentacao" available={point.has_restaurant} />
                  <AmenityItem icon={<Users className="h-4 w-4" />} label="Guia disponivel" available={point.has_guide} />
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {(point.phone || point.website) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Contato</h3>
                  {point.phone && (
                    <a href={`tel:${point.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Phone className="h-4 w-4" />
                      {point.phone}
                    </a>
                  )}
                  {point.website && (
                    <a
                      href={point.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Site oficial
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Share */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: point.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero Gallery

function HeroGallery({ point }: { point: TouristPoint }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const images = point.gallery_urls.length > 0
    ? point.gallery_urls
    : point.photo_url
    ? [point.photo_url]
    : [];

  if (images.length === 0) {
    return (
      <div className="h-48 md:h-64 bg-gradient-to-br from-primary/10 via-accent/10 to-warning/10 flex items-center justify-center">
        <span className="text-6xl">{point.icon_emoji}</span>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  const activeImage = images.at(lightboxIndex) ?? '';

  return (
    <>
      {/* Gallery grid */}
      <div className="relative h-56 md:h-80 lg:h-96 overflow-hidden bg-muted">
        {images.length === 1 ? (
          <img
            src={images[0]}
            alt={point.name}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => openLightbox(0)}
          />
        ) : (
          <div className="grid grid-cols-3 h-full gap-1">
            <div className="col-span-2 h-full">
              <img
                src={images[0]}
                alt={point.name}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(0)}
              />
            </div>
            <div className="flex flex-col gap-1 h-full">
              {images.slice(1, 3).map((url, i) => (
                <div key={i} className="flex-1 relative">
                  <img
                    src={url}
                    alt={`${point.name} - foto ${i + 2}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openLightbox(i + 1)}
                  />
                  {i === 1 && images.length > 3 && (
                    <button
                      onClick={() => openLightbox(2)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg"
                    >
                      +{images.length - 3} fotos
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo count badge */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-background transition-colors"
        >
          <Camera className="h-3.5 w-3.5" />
          {images.length} foto{images.length !== 1 ? 's' : ''}
        </button>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white z-50"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-8 w-8" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev + 1) % images.length);
                  }}
                >
                  <ChevronRight className="h-10 w-10" />
                </button>
              </>
            )}

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={activeImage}
              alt={`${point.name} - ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 text-white/60 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Map Section

function MapSection({ point }: { point: TouristPoint }) {
  const lat = point.address?.latitude ?? point.latitude;
  const lng = point.address?.longitude ?? point.longitude;
  if (!lat || !lng) return null;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Localizacao no Mapa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border border-border">
          <iframe
            src={mapUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            className="rounded-lg"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Nearby Attractions

function NearbySection({ point, state, city }: { point: TouristPoint; state: string; city: string }) {
  const { data: nearby = [] } = useNearbyTouristPoints(point.nearby_point_ids || []);

  if (nearby.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          Atracoes Proximas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nearby.map((np) => (
            <Link
              key={np.id}
              to={`/pontos-turisticos/${state}/${city}/${np.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              {np.photo_url ? (
                <img
                  src={np.photo_url}
                  alt={np.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                  {np.icon_emoji}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {np.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {CATEGORY_ICONS[np.category]} {CATEGORY_LABELS[np.category]}
                  {np.neighborhood ? ` · ${np.neighborhood}` : ''}
                </p>
              </div>
              {np.rating > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-warning flex-shrink-0">
                  <Star className="h-3 w-3 fill-warning" />
                  {np.rating.toFixed(1)}
                </div>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Nearby Businesses

function CommunityPhotosSection({ point }: { point: TouristPoint }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: photos = [], isLoading } = useCommunityPhotos(
    point.location_id ?? null,
    point.city,
    point.location?.name ?? point.neighborhood ?? null,
    point.state,
  );

  if (isLoading) return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Fotos da Comunidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (photos.length === 0) return null;
  const activePhoto = photos.at(lightboxIndex);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Fotos da Comunidade
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity relative group"
              >
                <img
                  src={photo.image_url}
                  alt={photo.content || `Foto da comunidade ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Fotos enviadas por moradores e visitantes
          </p>
        </CardContent>
      </Card>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button className="absolute top-4 right-4 text-white/80 hover:text-white z-50" onClick={() => setLightboxOpen(false)}>
              <X className="h-8 w-8" />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-50"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p - 1 + photos.length) % photos.length); }}
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-50"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p + 1) % photos.length); }}
                >
                  <ChevronRight className="h-10 w-10" />
                </button>
              </>
            )}
            <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={activePhoto?.image_url ?? ''}
                alt={activePhoto?.content ?? `Foto da comunidade ${lightboxIndex + 1}`}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
              />
              <div className="text-center">
                <p className="text-white/80 text-sm">{activePhoto?.author_name ?? 'Comunidade'}</p>
                {activePhoto?.content && (
                  <p className="text-white/50 text-xs mt-1 max-w-sm truncate">{activePhoto.content}</p>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 text-white/60 text-sm">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Amenity Item

function AmenityItem({ icon, label, available }: { icon: React.ReactNode; label: string; available: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${available ? 'text-foreground' : 'text-muted-foreground/50 line-through'}`}>
      <span className={available ? 'text-green-500' : 'text-muted-foreground/30'}>{icon}</span>
      <span>{label}</span>
      {available && <BadgeCheck className="h-3.5 w-3.5 text-green-500 ml-auto" />}
    </div>
  );
}


