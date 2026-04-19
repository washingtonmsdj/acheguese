/**
 * RideRequestForm Component (AAA)
 * 
 * Formulário principal de solicitação de corrida com hierarquia correta:
 * 1. Origem/Destino (foco principal)
 * 2. Estimativa de preço (destacada)
 * 3. Tipo de corrida (tabs compactas)
 * 4. Preferências de confiança (chips)
 * 5. Opções avançadas (accordion)
 * 
 * @module mobility/components/ride-request/RideRequestForm
 * @version 2.0.0 (AAA)
 */
import { logger } from '@/shared/utils/logger';
import React, { memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { toast } from 'sonner';
import { AddressInput } from './AddressInput';
import { RideTypeSelector } from './RideTypeSelector';
import { TrustPreferenceChips } from './TrustPreferenceChips';
import { AdvancedOptions } from './AdvancedOptions';
import { RouteEstimateCardEnhanced } from '../RouteEstimateCardEnhanced';
import { BoardingPointsPanel, type BoardingPoint } from '../BoardingPointsPanel';
import { useRideRequestForm } from '@/modules/mobility/hooks/useRideRequestForm';
import { usePriceEstimate } from '@/core/pricing/hooks/usePriceEstimate';
import type { PriceEstimateRequest } from '@/core/pricing/types';
import type { CreateRideRequestData } from '@/modules/mobility/hooks/useMobilidade';
import { AddressService } from '@/core/address/services/AddressService';
import type { GeolocationCoordinates } from '@/modules/mobility/hooks/useGeolocation';

export interface RideRequestFormProps {
  /** Callback ao submeter formulário */
  onSubmit: (data: CreateRideRequestData) => void | Promise<void>;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Formulário de solicitação de corrida com hierarquia otimizada
 * 
 * @example
 * ```tsx
 * <RideRequestForm
 *   onSubmit={async (data) => {
 *     await createRide(data);
 *   }}
 * />
 * ```
 */
export const RideRequestForm = memo<RideRequestFormProps>(function RideRequestForm({
  onSubmit,
  className,
}) {
  const { state, actions, validation } = useRideRequestForm();
  const addressService = new AddressService();
  
  const [showBoardingPoints, setShowBoardingPoints] = React.useState(false);

  // Auto-preencher horário para viagens imediatas
  useEffect(() => {
    if (state.type !== 'agendada' && !state.departureTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      actions.setDepartureTime(now.toISOString().slice(0, 16));
    }
  }, [state.type, state.departureTime, actions]);

  // Estimativa de preço
  const priceEstimateRequest: PriceEstimateRequest | null = React.useMemo(() => {
    if (!state.origin.coords || !state.destination.coords) return null;
    return {
      mode: state.type === 'entrega' ? 'delivery' : 'ride',
      origin: {
        latitude: state.origin.coords.latitude,
        longitude: state.origin.coords.longitude,
      },
      destination: {
        latitude: state.destination.coords.latitude,
        longitude: state.destination.coords.longitude,
      },
      options: { includeBreakdown: true, applyPeakHours: true },
    };
  }, [state.origin.coords, state.destination.coords, state.type]);

  const { data: priceEstimate } = usePriceEstimate(priceEstimateRequest, {
    enabled: !!priceEstimateRequest,
  });

  // Auto-preencher preço sugerido
  useEffect(() => {
    if (priceEstimate && !state.userEditedPrice) {
      actions.setSuggestedPrice(priceEstimate.estimatedPrice.toFixed(2));
    }
  }, [priceEstimate, state.userEditedPrice, actions]);

  // Reset userEditedPrice quando coords mudam
  useEffect(() => {
    actions.setUserEditedPrice(false);
  }, [state.origin.coords, state.destination.coords, actions]);

  // Criar address canônico
  const createAddress = useCallback(
    async (
      locationId: string,
      street: string,
      coords: GeolocationCoordinates | null
    ): Promise<string> => {
      const hasCoords = !!(coords?.latitude && coords?.longitude);
      const hasText = street.trim().length > 0;
      const addressType: 'exact' | 'approximate' | 'gps_only' =
        hasCoords && !hasText ? 'gps_only' : 'approximate';

      const addr = await addressService.createAddress({
        location_id: locationId,
        street: addressType !== 'gps_only' ? street : null,
        address_type: addressType,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        geocoding_source: hasCoords ? 'gps' : 'manual',
      });
      return addr.id;
    },
    [addressService]
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validation.canSubmit) {
        toast.error(validation.errors[0] || 'Preencha todos os campos obrigatórios');
        return;
      }

      actions.setSubmitting(true);

      try {
        const finalOrigin = state.selectedBoardingPoint
          ? `${state.selectedBoardingPoint.name} — ${state.selectedBoardingPoint.address}`
          : state.origin.text;

        // Criar addresses canônicos
        const [pickupAddressId, dropoffAddressId] = await Promise.all([
          createAddress(state.origin.locationId, finalOrigin, state.origin.coords),
          createAddress(
            state.destination.locationId,
            state.destination.text,
            state.destination.coords
          ),
        ]);

        // Montar observação com preferência de confiança
        const obs = [
          state.observation || '',
          state.trustPreference !== 'qualquer'
            ? `[Preferência: ${
                state.trustPreference === 'verificado'
                  ? 'Motorista Verificado'
                  : 'Vizinho do Bairro'
              }]`
            : '',
        ]
          .filter(Boolean)
          .join(' ');

        // Submeter
        await onSubmit({
          origin: finalOrigin,
          destination: state.destination.text,
          departure_time: new Date(state.departureTime || Date.now()).toISOString(),
          suggested_price: state.suggestedPrice ? parseFloat(state.suggestedPrice) : undefined,
          type: state.type,
          payment_method: state.paymentMethod,
          observation: obs || undefined,
          available_seats:
            state.type === 'carona_compartilhada' ? state.seats : undefined,
          origin_lat: state.origin.coords!.latitude,
          origin_lng: state.origin.coords!.longitude,
          destination_lat: state.destination.coords!.latitude,
          destination_lng: state.destination.coords!.longitude,
          search_radius_km: 5,
          pickup_address_id: pickupAddressId,
          dropoff_address_id: dropoffAddressId,
          pickup_location_id: state.origin.locationId,
          dropoff_location_id: state.destination.locationId,
        });

        // Reset form
        actions.reset();
      } catch (err: any) {
        logger.error('RideRequestForm.handleSubmit', err);
        toast.error(err?.message || 'Erro ao criar corrida. Tente novamente.');
      } finally {
        actions.setSubmitting(false);
      }
    },
    [validation, state, actions, onSubmit, createAddress]
  );

  const selectedRideType = state.type;
  const isDelivery = state.type === 'entrega';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Boarding Points Panel (se aberto) */}
      <AnimatePresence>
        {showBoardingPoints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <BoardingPointsPanel
              selectable
              selectedId={state.selectedBoardingPoint?.id}
              onSelect={(point: BoardingPoint) => {
                actions.setBoardingPoint(point);
                setShowBoardingPoints(false);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowBoardingPoints(false)}
              className="w-full mt-2 text-muted-foreground rounded-xl"
            >
              ← Voltar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form (se não estiver mostrando boarding points) */}
      {!showBoardingPoints && (
        <>
          {/* ── FOCO PRINCIPAL ── */}
          
          {/* Origem */}
          <AddressInput
            label={isDelivery ? 'Local de retirada' : 'Origem'}
            placeholder="Digite o endereço de origem"
            showGPS
            autoCaptureGPS
            onValidated={(result) => {
              actions.setOrigin({
                text: result.text,
                coords: result.coords,
                locationId: result.locationId,
                isValid: true,
                isLoading: false,
              });
            }}
            icon={<div className="w-2 h-2 rounded-full bg-primary" />}
            iconColor="text-primary"
            required
          />

          {/* Ponto de Embarque (apenas viagem/compartilhada) */}
          {!isDelivery && (
            <motion.button
              type="button"
              onClick={() => setShowBoardingPoints(true)}
              className={cn(
                'w-full flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left text-xs',
                state.selectedBoardingPoint
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'border-dashed border-border text-muted-foreground hover:border-border/80'
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {state.selectedBoardingPoint ? (
                <span className="font-medium">
                  {state.selectedBoardingPoint.name} — {state.selectedBoardingPoint.address}
                </span>
              ) : (
                <span>Ou escolher ponto de embarque do bairro →</span>
              )}
            </motion.button>
          )}

          {/* Destino */}
          <AddressInput
            label={isDelivery ? 'Destino da entrega' : 'Destino'}
            placeholder="Para onde você vai?"
            onValidated={(result) => {
              actions.setDestination({
                text: result.text,
                coords: result.coords,
                locationId: result.locationId,
                isValid: true,
                isLoading: false,
              });
            }}
            icon={<div className="w-2 h-2 rounded-sm bg-warning" />}
            iconColor="text-warning"
            required
          />

          {/* Estimativa de Rota */}
          <AnimatePresence>
            {priceEstimate && state.origin.coords && state.destination.coords && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RouteEstimateCardEnhanced
                  estimate={{
                    distance: priceEstimate.metadata.distanceKm,
                    duration: priceEstimate.metadata.durationMinutes,
                    price: priceEstimate.estimatedPrice,
                    eta: `${priceEstimate.metadata.durationMinutes} min`,
                    fare: {
                      base: priceEstimate.breakdown?.baseFare || 0,
                      distance: priceEstimate.breakdown?.distanceFare || 0,
                      time: priceEstimate.breakdown?.timeFare || 0,
                      total: priceEstimate.estimatedPrice,
                      formatted: `R$ ${priceEstimate.estimatedPrice.toFixed(2)}`,
                    },
                  }}
                  variant="compact"
                />
                {priceEstimate.metadata.peakHourMultiplier > 1 && (
                  <p className="text-xs text-warning mt-1">
                    ⚠️ Horário de pico ({priceEstimate.metadata.peakHourMultiplier}x)
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── OPÇÕES RÁPIDAS ── */}

          {/* Tipo de Corrida */}
          <RideTypeSelector value={state.type} onChange={actions.setRideType} />

          {/* Preferências de Confiança (apenas não-entrega) */}
          {!isDelivery && (
            <TrustPreferenceChips
              value={state.trustPreference}
              onChange={actions.setTrustPreference}
            />
          )}

          {/* ── OPÇÕES AVANÇADAS ── */}

          <AdvancedOptions
            rideType={state.type}
            suggestedPrice={state.suggestedPrice}
            onSuggestedPriceChange={actions.setSuggestedPrice}
            paymentMethod={state.paymentMethod}
            onPaymentMethodChange={actions.setPaymentMethod}
            observation={state.observation}
            onObservationChange={actions.setObservation}
            departureTime={state.departureTime}
            onDepartureTimeChange={actions.setDepartureTime}
            seats={state.seats}
            onSeatsChange={actions.setSeats}
            estimatedPrice={priceEstimate?.estimatedPrice}
          />

          {/* ── CTA (STICKY) ── */}

          <Button
            type="submit"
            disabled={!validation.canSubmit}
            className={cn(
              'w-full text-primary-foreground font-semibold rounded-xl h-11 shadow-lg sticky bottom-4',
              selectedRideType === 'viagem' &&
                'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary/20',
              selectedRideType === 'entrega' &&
                'bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 shadow-warning/20',
              selectedRideType === 'agendada' &&
                'bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-accent/20',
              selectedRideType === 'carona_compartilhada' &&
                'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-secondary/20'
            )}
          >
            {state.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {selectedRideType === 'viagem' && '🚗'}
                {selectedRideType === 'entrega' && '📦'}
                {selectedRideType === 'agendada' && '📅'}
                {selectedRideType === 'carona_compartilhada' && '👥'}
              </>
            )}
            <span className="ml-2">
              {state.isSubmitting
                ? 'Solicitando...'
                : `Solicitar ${
                    selectedRideType === 'viagem'
                      ? 'Viagem'
                      : selectedRideType === 'entrega'
                      ? 'Entrega'
                      : selectedRideType === 'agendada'
                      ? 'Agendada'
                      : 'Compartilhada'
                  }`}
            </span>
          </Button>
        </>
      )}
    </form>
  );
});

RideRequestForm.displayName = 'RideRequestForm';
