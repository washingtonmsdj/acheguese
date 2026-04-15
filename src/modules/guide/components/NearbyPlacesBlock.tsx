/**
 * NearbyPlacesBlock — O que tem por perto (camada secundária)
 *
 * Mostra estabelecimentos/serviços próximos ao ponto turístico.
 * Usa mock data por enquanto. Visualmente separado do conteúdo principal.
 */

import { MapPin, UtensilsCrossed, Coffee, ShoppingBag, Compass } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface NearbyPlace {
  id: string;
  name: string;
  type: 'restaurante' | 'cafe' | 'loja' | 'servico' | 'experiencia';
  distance: string;
  description: string;
  image?: string;
}

const TYPE_CONFIG: Record<NearbyPlace['type'], { icon: React.ReactNode; label: string; color: string }> = {
  restaurante: { icon: <UtensilsCrossed className="h-3.5 w-3.5" />, label: 'Restaurante', color: 'bg-orange-500/10 text-orange-600' },
  cafe: { icon: <Coffee className="h-3.5 w-3.5" />, label: 'Café', color: 'bg-amber-500/10 text-amber-600' },
  loja: { icon: <ShoppingBag className="h-3.5 w-3.5" />, label: 'Loja', color: 'bg-blue-500/10 text-blue-600' },
  servico: { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Serviço', color: 'bg-green-500/10 text-green-600' },
  experiencia: { icon: <Compass className="h-3.5 w-3.5" />, label: 'Experiência', color: 'bg-purple-500/10 text-purple-600' },
};

// Mock nearby places
const MOCK_NEARBY: NearbyPlace[] = [
  { id: 'nb-1', name: 'Restaurante Pelô Bistrô', type: 'restaurante', distance: '150m', description: 'Comida baiana contemporânea' },
  { id: 'nb-2', name: 'Café do Terreiro', type: 'cafe', distance: '200m', description: 'Café artesanal e bolos caseiros' },
  { id: 'nb-3', name: 'Artesanato Bahia', type: 'loja', distance: '100m', description: 'Lembranças e artesanato local' },
  { id: 'nb-4', name: 'Tour Histórico a Pé', type: 'experiencia', distance: '50m', description: 'Passeio guiado pelo centro histórico' },
];

interface NearbyPlacesBlockProps {
  pointTitle: string;
  neighborhood?: string;
}

export function NearbyPlacesBlock({ pointTitle, neighborhood }: NearbyPlacesBlockProps) {
  return (
    <div className="mt-10 pt-8 border-t border-border">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">O que tem por perto</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Estabelecimentos e serviços próximos {neighborhood ? `em ${neighborhood}` : `de ${pointTitle}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK_NEARBY.map((place) => {
          const config = TYPE_CONFIG[place.type];
          return (
            <Card key={place.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{place.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {place.distance}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
