/**
 * useRideRequestForm Hook
 *
 * Estado canônico de apresentação do formulário de corrida de passageiro.
 * Preço não pertence ao formulário: a cotação comercial é emitida pelo backend
 * depois que os endereços canônicos existem.
 *
 * @module mobility/hooks/useRideRequestForm
 */

import { useReducer, useMemo } from 'react';
import type { RideType, PaymentMethod } from '@/core/mobility/types';
import type { GeolocationCoordinates } from '@/modules/mobility/hooks/useGeolocation';
import { PAYMENT_METHOD } from '@/shared/types/constants';
import type { BoardingPoint } from '@/modules/mobility/components/BoardingPointsPanel';

export type PassengerRideType = Exclude<RideType, 'entrega'>;
export type TrustPreference = 'qualquer' | 'verificado' | 'vizinho';

export interface AddressData {
  text: string;
  coords: GeolocationCoordinates | null;
  locationId: string;
  isValid: boolean;
  isLoading: boolean;
}

export interface RideRequestFormState {
  type: PassengerRideType;
  origin: AddressData;
  destination: AddressData;
  selectedBoardingPoint: BoardingPoint | null;
  departureTime: string;
  seats: number;
  paymentMethod: PaymentMethod;
  trustPreference: TrustPreference;
  observation: string;
  showAdvancedOptions: boolean;
  showBoardingPoints: boolean;
  isSubmitting: boolean;
}

type RideRequestFormAction =
  | { type: 'SET_RIDE_TYPE'; payload: PassengerRideType }
  | { type: 'SET_ORIGIN'; payload: Partial<AddressData> }
  | { type: 'SET_DESTINATION'; payload: Partial<AddressData> }
  | { type: 'SET_BOARDING_POINT'; payload: BoardingPoint | null }
  | { type: 'SET_DEPARTURE_TIME'; payload: string }
  | { type: 'SET_SEATS'; payload: number }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'SET_TRUST_PREFERENCE'; payload: TrustPreference }
  | { type: 'SET_OBSERVATION'; payload: string }
  | { type: 'TOGGLE_ADVANCED_OPTIONS' }
  | { type: 'TOGGLE_BOARDING_POINTS' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET' };

const initialAddressData: AddressData = {
  text: '',
  coords: null,
  locationId: '',
  isValid: false,
  isLoading: false,
};

const initialState: RideRequestFormState = {
  type: 'viagem',
  origin: initialAddressData,
  destination: initialAddressData,
  selectedBoardingPoint: null,
  departureTime: '',
  seats: 1,
  paymentMethod: PAYMENT_METHOD.PIX,
  trustPreference: 'qualquer',
  observation: '',
  showAdvancedOptions: false,
  showBoardingPoints: false,
  isSubmitting: false,
};

function reducer(state: RideRequestFormState, action: RideRequestFormAction): RideRequestFormState {
  switch (action.type) {
    case 'SET_RIDE_TYPE':
      return {
        ...state,
        type: action.payload,
        seats: action.payload === 'carona_compartilhada' ? state.seats : 1,
        departureTime: action.payload === 'agendada' ? state.departureTime : '',
      };
    case 'SET_ORIGIN':
      return { ...state, origin: { ...state.origin, ...action.payload } };
    case 'SET_DESTINATION':
      return { ...state, destination: { ...state.destination, ...action.payload } };
    case 'SET_BOARDING_POINT':
      return {
        ...state,
        selectedBoardingPoint: action.payload,
        showBoardingPoints: false,
      };
    case 'SET_DEPARTURE_TIME':
      return { ...state, departureTime: action.payload };
    case 'SET_SEATS':
      return { ...state, seats: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_TRUST_PREFERENCE':
      return { ...state, trustPreference: action.payload };
    case 'SET_OBSERVATION':
      return { ...state, observation: action.payload };
    case 'TOGGLE_ADVANCED_OPTIONS':
      return { ...state, showAdvancedOptions: !state.showAdvancedOptions };
    case 'TOGGLE_BOARDING_POINTS':
      return { ...state, showBoardingPoints: !state.showBoardingPoints };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export interface UseRideRequestFormReturn {
  state: RideRequestFormState;
  actions: {
    setRideType: (type: PassengerRideType) => void;
    setOrigin: (data: Partial<AddressData>) => void;
    setDestination: (data: Partial<AddressData>) => void;
    setBoardingPoint: (point: BoardingPoint | null) => void;
    setDepartureTime: (time: string) => void;
    setSeats: (seats: number) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setTrustPreference: (pref: TrustPreference) => void;
    setObservation: (obs: string) => void;
    toggleAdvancedOptions: () => void;
    toggleBoardingPoints: () => void;
    setSubmitting: (submitting: boolean) => void;
    reset: () => void;
  };
  validation: {
    isValid: boolean;
    canSubmit: boolean;
    errors: string[];
  };
}

export function useRideRequestForm(): UseRideRequestFormReturn {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(() => ({
    setRideType: (type: PassengerRideType) => dispatch({ type: 'SET_RIDE_TYPE', payload: type }),
    setOrigin: (data: Partial<AddressData>) => dispatch({ type: 'SET_ORIGIN', payload: data }),
    setDestination: (data: Partial<AddressData>) => dispatch({ type: 'SET_DESTINATION', payload: data }),
    setBoardingPoint: (point: BoardingPoint | null) => dispatch({ type: 'SET_BOARDING_POINT', payload: point }),
    setDepartureTime: (time: string) => dispatch({ type: 'SET_DEPARTURE_TIME', payload: time }),
    setSeats: (seats: number) => dispatch({ type: 'SET_SEATS', payload: seats }),
    setPaymentMethod: (method: PaymentMethod) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: method }),
    setTrustPreference: (pref: TrustPreference) => dispatch({ type: 'SET_TRUST_PREFERENCE', payload: pref }),
    setObservation: (obs: string) => dispatch({ type: 'SET_OBSERVATION', payload: obs }),
    toggleAdvancedOptions: () => dispatch({ type: 'TOGGLE_ADVANCED_OPTIONS' }),
    toggleBoardingPoints: () => dispatch({ type: 'TOGGLE_BOARDING_POINTS' }),
    setSubmitting: (submitting: boolean) => dispatch({ type: 'SET_SUBMITTING', payload: submitting }),
    reset: () => dispatch({ type: 'RESET' }),
  }), []);

  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!state.origin.text.trim()) {
      errors.push('Origem é obrigatória');
    } else if (!state.origin.isValid) {
      errors.push('Origem inválida');
    }

    if (!state.destination.text.trim()) {
      errors.push('Destino é obrigatório');
    } else if (!state.destination.isValid) {
      errors.push('Destino inválido');
    }

    if (!state.origin.coords) {
      errors.push('Origem precisa de coordenadas válidas');
    }

    if (!state.destination.coords) {
      errors.push('Destino precisa de coordenadas válidas');
    }

    if (!state.origin.locationId) {
      errors.push('Território da origem é obrigatório');
    }

    if (!state.destination.locationId) {
      errors.push('Território do destino é obrigatório');
    }

    if (state.type === 'agendada' && !state.departureTime) {
      errors.push('Horário é obrigatório para corridas agendadas');
    }

    if (state.type === 'carona_compartilhada' && (state.seats < 1 || state.seats > 4)) {
      errors.push('Número de vagas inválido (1-4)');
    }

    const isValid = errors.length === 0;
    const canSubmit =
      isValid &&
      !state.isSubmitting &&
      !state.origin.isLoading &&
      !state.destination.isLoading;

    return { isValid, canSubmit, errors };
  }, [state]);

  return {
    state,
    actions,
    validation,
  };
}
