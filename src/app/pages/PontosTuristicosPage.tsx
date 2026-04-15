/**
 * PontosTuristicosPage - Página pública de pontos turísticos
 * 
 * Robusta e escalável para qualquer cidade do Brasil.
 * ✅ SSOT COMPLIANT - Usa TouristPointService
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Star, Camera, Filter,
  Accessibility, ParkingMeter,
  UtensilsCrossed, ChevronRight, ArrowLeft, Loader2,
  Landmark, Map, List,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useTouristPoints } from '@/core/tourist-points/hooks/useTouristPoints';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  TouristPointCategory,
  type TouristPoint,
} from '@/core/tourist-points/types';
import { TouristPointsMap } from '@/core/tourist-points/components/TouristPointsMap';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as TouristPointCategory,
  label,
  icon: CATEGORY_ICONS[value as TouristPointCategory],
}));

export default function PontosTuristicosPage() {
  const navigate = useNavigate();
  const { state = 'ba', city = 'salvador' } = useParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TouristPointCategory | ''>('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPoint, setSelectedPoint] = useState<TouristPoint | undefined>();

  const { data: points = [], isLoading } = useTouristPoints({
    state,
    city,
    category: selectedCategory || undefined,
    is_featured: showFeaturedOnly ? true : undefined,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return points;
    const q = search.toLowerCase();
    return points.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.neighborhood?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [points, search]);

  const featured = useMemo(() => filtered.filter((p) => p.is_featured), [filtered]);
  const regular = useMemo(() => filtered.filter((p) => !p.is_featured), [filtered]);

  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const stateName = state.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/15 via-accent/10 to-warning/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-warning/20 flex items-center justify-center">
                <Camera className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground font-heading">
                  Pontos Turísticos
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {cityName}, {stateName}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground max-w-2xl mb-6">
              Descubra os melhores pontos turísticos, monumentos históricos, praias, parques e
              atrações culturais. Planeje sua visita com informações detalhadas.
            </p>

            {/* Search + view toggle */}
            <div className="flex items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ponto turístico..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-card border-border"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-11 w-11 rounded-none border-0"
                  onClick={() => setViewMode('list')}
                  title="Lista"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-11 w-11 rounded-none border-0"
                  onClick={() => setViewMode('map')}
                  title="Mapa"
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      {showFilters && (
        <motion.section
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-b border-border bg-card/50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filtros</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
                className="rounded-full text-xs"
              >
                Todos
              </Button>
              {ALL_CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="rounded-full text-xs"
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </Button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="rounded border-border"
              />
              Apenas destaques
            </label>
          </div>
        </motion.section>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} cityName={cityName} />
        ) : viewMode === 'map' ? (
          <div className="flex flex-col lg:flex-row gap-4" style={{ height: '70vh' }}>
            {/* Mapa */}
            <TouristPointsMap
              points={filtered}
              selectedId={selectedPoint?.id}
              onSelect={setSelectedPoint}
              className="flex-1 h-full min-h-[400px]"
            />
            {/* Painel lateral no mapa */}
            <div className="lg:w-72 overflow-y-auto space-y-2 max-h-full">
              {filtered.map((point) => (
                <button
                  key={point.id}
                  onClick={() => setSelectedPoint(point)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedPoint?.id === point.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl flex-shrink-0">
                      {point.icon_emoji || CATEGORY_ICONS[point.category]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{point.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {CATEGORY_LABELS[point.category]}
                        {point.neighborhood ? ` · ${point.neighborhood}` : ''}
                      </p>
                    </div>
                    {point.is_featured && (
                      <Star className="h-3.5 w-3.5 text-warning fill-warning flex-shrink-0 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-warning fill-warning" />
                  <h2 className="text-lg font-bold text-foreground">Destaques</h2>
                  <Badge variant="secondary" className="text-xs">{featured.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((point, i) => (
                    <TouristPointCard key={point.id} point={point} index={i} featured state={state} city={city} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular */}
            {regular.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    {featured.length > 0 ? 'Todos os Pontos' : 'Pontos Turísticos'}
                  </h2>
                  <Badge variant="secondary" className="text-xs">{regular.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regular.map((point, i) => (
                    <TouristPointCard key={point.id} point={point} index={i} state={state} city={city} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        {filtered.length > 0 && (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            {filtered.length} ponto{filtered.length !== 1 ? 's' : ''} turístico{filtered.length !== 1 ? 's' : ''} em {cityName}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card Component ───────────────────────────────────────────────────

function TouristPointCard({ point, index, featured = false, state, city }: { point: TouristPoint; index: number; featured?: boolean; state: string; city: string }) {

  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/pontos-turisticos/${state}/${city}/${point.slug}`}>
        <Card
          className={`h-full overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
            featured
              ? 'border-warning/30 hover:border-warning/60 bg-gradient-to-br from-warning/5 to-card'
              : 'border-border hover:border-primary/30'
          }`}
        >
          {/* Image */}
          {point.photo_url && (
            <div className="relative h-40 overflow-hidden">
              <img
                src={point.photo_url}
                alt={point.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {featured && (
                <div className="absolute top-2 right-2 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Destaque
                </div>
              )}
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-background/80 text-foreground backdrop-blur-sm text-xs">
                  {CATEGORY_ICONS[point.category]} {CATEGORY_LABELS[point.category]}
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {!point.photo_url && (
                <span className="text-3xl flex-shrink-0">{point.icon_emoji || CATEGORY_ICONS[point.category]}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {point.name}
                  </h3>
                  {featured && !point.photo_url && (
                    <Star className="h-3 w-3 text-warning fill-warning flex-shrink-0" />
                  )}
                </div>

                {!point.photo_url && (
                  <Badge variant="outline" className="text-[10px] mb-2">
                    {CATEGORY_ICONS[point.category]} {CATEGORY_LABELS[point.category]}
                  </Badge>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                  {point.short_description || point.description}
                </p>

                {/* Location */}
                {(point.neighborhood || point.address) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{point.neighborhood || (typeof point.address === 'string' ? point.address : '')}</span>
                  </div>
                )}

                {/* Tags */}
                {point.tags && point.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {point.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-primary/8 text-primary px-2 py-0.5 rounded-full border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                    {point.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{point.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Amenities + rating */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  {point.accessibility && (
                    <Accessibility className="h-3.5 w-3.5" aria-label="Acessível" />
                  )}
                  {point.has_parking && (
                    <ParkingMeter className="h-3.5 w-3.5" aria-label="Estacionamento" />
                  )}
                  {point.has_restaurant && (
                    <UtensilsCrossed className="h-3.5 w-3.5" aria-label="Restaurante" />
                  )}
                  {point.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-warning">
                      <Star className="h-3 w-3 fill-warning" />
                      {point.rating.toFixed(1)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────

function EmptyState({ search, cityName }: { search: string; cityName: string }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/50 mb-4">
        <Camera className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        {search ? 'Nenhum resultado encontrado' : 'Nenhum ponto turístico cadastrado'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {search
          ? `Não encontramos pontos turísticos para "${search}". Tente outra busca.`
          : `Os pontos turísticos de ${cityName} serão exibidos aqui em breve.`}
      </p>
    </div>
  );
}
