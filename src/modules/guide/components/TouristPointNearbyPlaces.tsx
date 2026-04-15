/**
 * TouristPointNearbyPlaces — Lista de estabelecimentos próximos ao ponto turístico
 * 
 * Exibe restaurantes, cafeterias, lojas e serviços próximos.
 */

import { MapPin, Star, Clock, DollarSign, Utensils, Coffee, ShoppingBag, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

interface NearbyPlace {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'shop' | 'service';
  distance: string;
  rating?: number;
  priceRange?: string;
  address: string;
  image?: string;
  isOpen?: boolean;
}

interface TouristPointNearbyPlacesProps {
  locationId: string;
  pointName: string;
}

// Mock data - será substituído por dados reais da API
const MOCK_NEARBY_PLACES: NearbyPlace[] = [
  {
    id: '1',
    name: 'Restaurante Sabor da Terra',
    category: 'restaurant',
    distance: '150m',
    rating: 4.5,
    priceRange: '$$',
    address: 'Rua das Flores, 123',
    isOpen: true,
  },
  {
    id: '2',
    name: 'Café Aroma',
    category: 'cafe',
    distance: '200m',
    rating: 4.8,
    priceRange: '$',
    address: 'Av. Principal, 456',
    isOpen: true,
  },
  {
    id: '3',
    name: 'Pizzaria Bella Napoli',
    category: 'restaurant',
    distance: '300m',
    rating: 4.3,
    priceRange: '$$',
    address: 'Rua do Comércio, 789',
    isOpen: false,
  },
  {
    id: '4',
    name: 'Loja de Artesanato Local',
    category: 'shop',
    distance: '100m',
    address: 'Praça Central, 12',
    isOpen: true,
  },
  {
    id: '5',
    name: 'Cafeteria Grão Especial',
    category: 'cafe',
    distance: '250m',
    rating: 4.6,
    priceRange: '$',
    address: 'Rua dos Cafés, 34',
    isOpen: true,
  },
  {
    id: '6',
    name: 'Farmácia Central',
    category: 'service',
    distance: '180m',
    address: 'Av. Saúde, 567',
    isOpen: true,
  },
];

const CATEGORY_CONFIG = {
  restaurant: {
    label: 'Restaurantes',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  cafe: {
    label: 'Cafeterias',
    icon: Coffee,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  shop: {
    label: 'Lojas',
    icon: ShoppingBag,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  service: {
    label: 'Serviços',
    icon: Wrench,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
};

function NearbyPlaceCard({ place }: { place: NearbyPlace }) {
  const config = CATEGORY_CONFIG[place.category];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {place.name}
              </h3>
              {place.isOpen !== undefined && (
                <Badge variant={place.isOpen ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                  {place.isOpen ? 'Aberto' : 'Fechado'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {place.distance}
              </span>
              {place.rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {place.rating.toFixed(1)}
                </span>
              )}
              {place.priceRange && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {place.priceRange}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">
              {place.address}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TouristPointNearbyPlaces({ locationId, pointName }: TouristPointNearbyPlacesProps) {
  // Filtrar por categoria
  const restaurants = MOCK_NEARBY_PLACES.filter(p => p.category === 'restaurant');
  const cafes = MOCK_NEARBY_PLACES.filter(p => p.category === 'cafe');
  const shops = MOCK_NEARBY_PLACES.filter(p => p.category === 'shop');
  const services = MOCK_NEARBY_PLACES.filter(p => p.category === 'service');

  const allPlaces = MOCK_NEARBY_PLACES;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Ao redor de {pointName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Descubra restaurantes, cafeterias, lojas e serviços próximos
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="text-xs">
            Todos ({allPlaces.length})
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="text-xs">
            <Utensils className="h-3 w-3 mr-1" />
            {restaurants.length}
          </TabsTrigger>
          <TabsTrigger value="cafes" className="text-xs">
            <Coffee className="h-3 w-3 mr-1" />
            {cafes.length}
          </TabsTrigger>
          <TabsTrigger value="shops" className="text-xs">
            <ShoppingBag className="h-3 w-3 mr-1" />
            {shops.length}
          </TabsTrigger>
          <TabsTrigger value="services" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            {services.length}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {allPlaces.map(place => (
            <NearbyPlaceCard key={place.id} place={place} />
          ))}
        </TabsContent>

        <TabsContent value="restaurants" className="space-y-3 mt-4">
          {restaurants.length > 0 ? (
            restaurants.map(place => (
              <NearbyPlaceCard key={place.id} place={place} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum restaurante encontrado nas proximidades
            </p>
          )}
        </TabsContent>

        <TabsContent value="cafes" className="space-y-3 mt-4">
          {cafes.length > 0 ? (
            cafes.map(place => (
              <NearbyPlaceCard key={place.id} place={place} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma cafeteria encontrada nas proximidades
            </p>
          )}
        </TabsContent>

        <TabsContent value="shops" className="space-y-3 mt-4">
          {shops.length > 0 ? (
            shops.map(place => (
              <NearbyPlaceCard key={place.id} place={place} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma loja encontrada nas proximidades
            </p>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-3 mt-4">
          {services.length > 0 ? (
            services.map(place => (
              <NearbyPlaceCard key={place.id} place={place} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum serviço encontrado nas proximidades
            </p>
          )}
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t">
        <Button variant="outline" className="w-full" size="sm">
          Ver todos no mapa
        </Button>
      </div>
    </div>
  );
}
