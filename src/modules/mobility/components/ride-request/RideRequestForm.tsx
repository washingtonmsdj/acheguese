/* eslint-disable react-hooks/exhaustive-deps */
/**
 * RideRequestForm Component (AAA)
 *
 * Formulário de corrida de passageiro. Entregas pertencem ao fluxo Motoboy e
 * preço comercial é emitido pelo backend após a criação dos endereços canônicos.
 *
 * @module mobility/components/ride-request/RideRequestForm
 */
import { logger } from '@/shared/utils/logger';
import React, { memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Car, Loader2, MapPin, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { toast } from 'sonner';
import { AddressInput } from './AddressInput';
import { RideTypeSelector } from './RideTypeSelector';
import { TrustPreferenceChips } from './TrustPreferenceChips';
import { AdvancedOptions } from './AdvancedOptions';
import { BoardingPointsPanel, type BoardingPoint } from '../BoardingPointsPanel';
import { useRideRequestForm } from '@/modules/mobility/hooks/useRideRequestForm';
import type { CreateRideRequestData } from '@/modules/mobility/hooks/useMobilidade';
import { AddressService } from '@/core/address/services/AddressService';
import type { GeolocationCoordinates } from '@/modules/mobility/hooks/useGeolocation';

export interface RideRequestFormProps {
  onSubmit: (data: CreateRideRequestData) => void | Promise<void>;
  className?: string;
}

export const RideRequestForm = memo<RideRequestFormProps>(function RideRequestForm({
  onSubmit,
  className,
}) {
  const { state, actions, validation } = useRideRequestForm();
  const addressService = React.useMemo(() => new AddressService(), []);
  const [showBoardingPoints, setShowBoardingPoints] = React.useState(false);

  useEffect(() => {
    if (state.type !== 'agendada' && !state.departureTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      actions.setDepartureTime(now.toISOString().slice(0, 16));
    }
  }, [state.type, state.departureTime, actions]);

  const createAddress = useCallback(
    async (
      locationId: string,
      street: string,
      coords: GeolocationCoordinates | null
    ): Promise<string> => {
      const hasCoords =
        coords !== null &&
        Number.isFinite(coords.latitude) &&
        Number.isFinite(coords.longitude);
      const hasText = street.trim().length > 0;
      const addressType: 'exact' | 'approximate' | 'gps_only' =
        hasCoords && !hasText ? 'gps_only' : 'approximate';

      const addr = await addressService.createAddress({
        location_id: locationId,
        street: addressType !== 'gps_only' ? street : null,
        address_type: addressType,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        geocoding_source: hasCoords ? 'gps' : 'manual',
      });
      return addr.id;
    },
    [addressService]
  );

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
          ? `${state.selectedBoardingPoint.name} - ${state.selectedBoardingPoint.address}`
          : state.origin.text;

        const [pickupAddressId, dropoffAddressId] = await Promise.all([
          createAddress(state.origin.locationId, finalOrigin, state.origin.coords),
          createAddress(
            state.destination.locationId,
            state.destination.text,
            state.destination.coords
          ),
        ]);

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

        await onSubmit({
          origin: finalOrigin,
          destination: state.destination.text,
          departure_time: new Date(state.departureTime || Date.now()).toISOString(),
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

        actions.reset();
      } catch (err: unknown) {
        logger.error('RideRequestForm.handleSubmit', err);
        toast.error(
          err instanceof Error ? err.message : 'Erro ao criar corrida. Tente novamente.',
        );
      } finally {
        actions.setSubmitting(false);
      }
    },
    [validation, state, actions, onSubmit, createAddress]
  );

  const selectedRideType = state.type;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
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
              Voltar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!showBoardingPoints && (
        <>
          <AddressInput
            label="Origem"
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
                {state.selectedBoardingPoint.name} - {state.selectedBoardingPoint.address}
              </span>
            ) : (
              <span>Ou escolher ponto de embarque do bairro</span>
            )}
          </motion.button>

          <AddressInput
            label="Destino"
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

          <RideTypeSelector value={state.type} onChange={actions.setRideType} />

          <TrustPreferenceChips
            value={state.trustPreference}
            onChange={actions.setTrustPreference}
          />

          <AdvancedOptions
            rideType={state.type}
            paymentMethod={state.paymentMethod}
            onPaymentMethodChange={actions.setPaymentMethod}
            observation={state.observation}
            onObservationChange={actions.setObservation}
            departureTime={state.departureTime}
            onDepartureTimeChange={actions.setDepartureTime}
            seats={state.seats}
            onSeatsChange={actions.setSeats}
          />

          <Button
            type="submit"
            disabled={!validation.canSubmit}
            className={cn(
              'w-full text-primary-foreground font-semibold rounded-xl h-11 shadow-lg sticky bottom-4',
              selectedRideType === 'viagem' &&
                'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary/20',
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
                {selectedRideType === 'viagem' && <Car className="h-4 w-4" aria-hidden="true" />}
                {selectedRideType === 'agendada' && <Calendar className="h-4 w-4" aria-hidden="true" />}
                {selectedRideType === 'carona_compartilhada' && <Users className="h-4 w-4" aria-hidden="true" />}
              </>
            )}
            <span className="ml-2">
              {state.isSubmitting
                ? 'Solicitando...'
                : `Solicitar ${
                    selectedRideType === 'viagem'
                      ? 'Viagem'
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
