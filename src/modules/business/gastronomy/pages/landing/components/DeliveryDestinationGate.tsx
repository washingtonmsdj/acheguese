/**
 * Painel de orientação para definir destino sem bloquear a descoberta pública
 */

import { motion } from 'framer-motion';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

interface DeliveryDestinationGateProps {
  message: string;
  canUseGeolocation: boolean;
  isLocatingUser: boolean;
  locationPermissionState: PermissionState | null;
  onActivateLocation: () => void;
}

export function DeliveryDestinationGate(props: DeliveryDestinationGateProps) {
  const {
    message,
    canUseGeolocation,
    isLocatingUser,
    locationPermissionState,
    onActivateLocation,
  } = props;

  const showLocationButton =
    !isLocatingUser && canUseGeolocation && locationPermissionState !== 'denied';

  return (
    <section className="container mx-auto px-4 pt-2">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div
          className="rounded-2xl border border-border/70 bg-card/85 p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-foreground">
            Defina seu destino para calcular entrega com mais precisão
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{message}</p>
          {showLocationButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-8 rounded-full px-3 text-xs"
              onClick={onActivateLocation}
            >
              <LocateFixed className="mr-1 h-3.5 w-3.5" />
              Usar localização agora
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
