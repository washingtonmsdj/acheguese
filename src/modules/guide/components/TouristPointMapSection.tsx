/**
 * TouristPointMapSection — Mapa interativo do ponto turístico
 * 
 * ✅ Migrado de Google Maps para MapLibre (open source)
 * ✅ Usa componente MiniMap reutilizável
 * ✅ Sem custos de API
 * ✅ Múltiplas opções de navegação
 */

import { useState } from 'react';
import { MapPin, Navigation, Map as MapIcon, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { MiniMap } from '@/shared/components/maps/MiniMap';
import { toast } from '@/shared/components/ui/use-toast';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';

interface TouristPointMapSectionProps {
  latitude: number;
  longitude: number;
  title: string;
  address: string | null;
}

export function TouristPointMapSection({
  latitude,
  longitude,
  title,
  address,
}: TouristPointMapSectionProps) {
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);

  // URLs para apps externos
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(title)}`;
  const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  // URL territorial do mapa — SSOT via useFriendlyModuleUrls
  const moduleUrls = useFriendlyModuleUrls();
  const internalMapUrl = moduleUrls.map;

  const handleCopyCoordinates = () => {
    const coords = `${latitude}, ${longitude}`;
    navigator.clipboard.writeText(coords);
    toast({
      title: 'Coordenadas copiadas!',
      description: coords,
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <MiniMap
          latitude={latitude}
          longitude={longitude}
          title={title}
          description={address || undefined}
          markerColor="#f59e0b"
          markerIcon="📷"
          height="320px"
          showControls={true}
          interactive={true}
        />
        <CardContent className="p-4 space-y-3">
          {/* Endereço */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {address && (
                <p className="text-xs text-muted-foreground mt-0.5">{address}</p>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2">
            {/* Ver no Mapa Completo (Nosso App) */}
            <Button 
              asChild 
              size="sm" 
              variant="default"
              className="w-full"
            >
              <a href={internalMapUrl}>
                <MapIcon className="h-3.5 w-3.5 mr-1.5" />
                Ver no Mapa
              </a>
            </Button>

            {/* Como Chegar (Apps Externos) */}
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => setShowNavigationDialog(true)}
            >
              <Navigation className="h-3.5 w-3.5 mr-1.5" />
              Como Chegar
            </Button>
          </div>

          {/* Copiar Coordenadas */}
          <Button 
            size="sm" 
            variant="ghost"
            className="w-full text-xs"
            onClick={handleCopyCoordinates}
          >
            <Copy className="h-3 w-3 mr-1.5" />
            Copiar coordenadas ({latitude.toFixed(6)}, {longitude.toFixed(6)})
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de Opções de Navegação */}
      <Dialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Como você quer chegar?</DialogTitle>
            <DialogDescription>
              Escolha seu app de navegação preferido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {/* Google Maps */}
            <Button 
              asChild 
              variant="outline" 
              className="w-full justify-start"
            >
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Google Maps
              </a>
            </Button>

            {/* Apple Maps (apenas iOS) */}
            {isIos && (
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start"
              >
                <a 
                  href={appleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir no Apple Maps
                </a>
              </Button>
            )}

            {/* Waze */}
            <Button 
              asChild 
              variant="outline" 
              className="w-full justify-start"
            >
              <a 
                href={wazeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Waze
              </a>
            </Button>

            {/* Nosso Mapa */}
            <Button 
              asChild 
              variant="default" 
              className="w-full justify-start"
            >
              <a href={internalMapUrl}>
                <MapIcon className="h-4 w-4 mr-2" />
                Ver no Mapa do Achegue-se
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
