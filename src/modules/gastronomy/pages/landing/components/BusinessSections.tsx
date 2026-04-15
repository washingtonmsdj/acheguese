/**
 * Componente das seções de businesses (nearest, top rated, featured)
 */

import { motion } from 'framer-motion';
import { MapPin, Star, Tag } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { BusinessSectionCarousel } from '../../../components';
import type { BusinessSectionItems } from '../types';
import { INSECURE_CONTEXT_DESTINATION_MESSAGE } from '../constants';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

interface BusinessSectionsProps {
  sectionItems: BusinessSectionItems;
  distanceMap: Map<string, number>;
  sectionScopeLabel: string;
  hasDistanceReference: boolean;
  canUseGeolocation: boolean;
  locationPermissionState: PermissionState | null;
  isLocatingUser: boolean;
  onActivateLocation: () => void;
}

export function BusinessSections(props: BusinessSectionsProps) {
  const {
    sectionItems,
    distanceMap,
    sectionScopeLabel,
    hasDistanceReference,
    canUseGeolocation,
    locationPermissionState,
    isLocatingUser,
    onActivateLocation,
  } = props;

  const fallbackMessage = hasDistanceReference
    ? `Seu destino de entrega esta ativo, mas as lojas ${sectionScopeLabel} ainda nao possuem coordenadas suficientes para calcular proximidade real.`
    : !canUseGeolocation
      ? INSECURE_CONTEXT_DESTINATION_MESSAGE
      : locationPermissionState === 'denied'
        ? 'Localizacao bloqueada no navegador. Informe um endereco para calcular proximidade real.'
        : `Defina um destino de entrega para exibir as lojas mais proximas primeiro ${sectionScopeLabel}.`;

  const showLocationButton =
    !hasDistanceReference && canUseGeolocation && locationPermissionState !== 'denied';

  return (
    <div className="container mx-auto space-y-10 px-4 py-4">
      {sectionItems.nearest.length > 0 ? (
        <BusinessSectionCarousel
          title="Lojas mais proximas de voce"
          subtitle={`Lojas ordenadas por distancia real ${sectionScopeLabel}`}
          icon={MapPin}
          items={sectionItems.nearest}
          accentColor="bg-sky-500/10"
          distanceByBusinessId={distanceMap}
        />
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeIn}
          className="rounded-xl border border-border/60 bg-card/70 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Lojas mais proximas de voce
              </p>
              <p className="text-xs text-muted-foreground">{fallbackMessage}</p>
            </div>
            {showLocationButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={onActivateLocation}
                disabled={isLocatingUser}
              >
                {isLocatingUser ? 'Localizando...' : 'Ativar localizacao'}
              </Button>
            )}
          </div>
        </motion.div>
      )}

      <BusinessSectionCarousel
        title="Lojas melhor avaliadas"
        subtitle={`Selecao com maior nota ${sectionScopeLabel}`}
        icon={Star}
        items={sectionItems.topRated}
        accentColor="bg-amber-500/10"
        distanceByBusinessId={distanceMap}
      />

      <BusinessSectionCarousel
        title="Lojas em destaque"
        subtitle={`Lojas premium e bem avaliadas ${sectionScopeLabel}`}
        icon={Tag}
        items={sectionItems.featured}
        accentColor="bg-primary/10"
        distanceByBusinessId={distanceMap}
      />
    </div>
  );
}
