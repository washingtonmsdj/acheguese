/**
 * useRideRequestForm Hook
 * 
 * Hook centralizado para gerenciar estado e validação do formulário de solicitação de corrida.
 * Consolida 18 estados locais em um único reducer para melhor performance e manutenibilidade.
 * 
 * @module mobility/hooks/useRideRequestForm
 */

import { useReducer, useCallback, useMemo } from 'react';
import type { RideType, PaymentMethod } from '@/core/mobility/types';
import type { GeolocationCoordinates } from '@/modules/mobility/hooks/useGeolocation';
import { PAYMENT_METHOD } from '@/shared/types/constants';
import type { BoardingPoint } from '@/modules/mobility/components/BoardingPointsPanel';

export type TrustPreference = 'qualquer' | 'verificado' | 'vizinho';

export interface AddressData {
  text: string;
  coords: GeolocationCoordinates | null;
  locationId: string;
  isValid: boolean;
  isLoading: boolean;
}

export interface RideRequestFormState {
  // Tipo e configuração
  type: RideType;
  
  // Endereços
  origin: AddressData;
  destination: AddressData;
  selectedBoardingPoint: BoardingPoint | null;
  
  // Opções básicas
  departureTime: string;
  seats: number;
  
  // Opções avançadas
  suggestedPrice: string;
  paymentMethod: PaymentMethod;
  trustPreference: TrustPreference;
  observation: string;
  
  // Estados de UI
  showAdvancedOptions: boolean;
  showBoardingPoints: boolean;
  userEditedPrice: boolean;
  isSubmitting: boolean;
}

type RideRequestFormAction =
  | { type: 'SET_RIDE_TYPE'; payload: RideType }
  | { type: 'SET_ORIGIN'; payload: Partial<AddressData> }
  | { type: 'SET_DESTINATION'; payload: Partial<AddressData> }
  | { type: 'SET_BOARDING_POINT'; payload: BoardingPoint | null }
  | { type: 'SET_DEPARTURE_TIME'; payload: string }
  | { type: 'SET_SEATS'; payload: number }
  | { type: 'SET_SUGGESTED_PRICE'; payload: string }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'SET_TRUST_PREFERENCE'; payload: TrustPreference }
  | { type: 'SET_OBSERVATION'; payload: string }
  | { type: 'TOGGLE_ADVANCED_OPTIONS' }
  | { type: 'TOGGLE_BOARDING_POINTS' }
  | { type: 'SET_USER_EDITED_PRICE'; payload: boolean }
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
  suggestedPrice: '',
  paymentMethod: PAYMENT_METHOD.PIX,
  trustPreference: 'qualquer',
  observation: '',
  showAdvancedOptions: false,
  showBoardingPoints: false,
  userEditedPrice: false,
  isSubmitting: false,
};

function reducer(state: RideRequestFormState, action: RideRequestFormAction): RideRequestFormState {
  switch (action.type) {
    case 'SET_RIDE_TYPE':
      return {
        ...state,
        type: action.payload,
        // Reset campos específicos ao mudar tipo
        seats: action.payload === 'carona_compartilhada' ? state.seats : 1,
        departureTime: action.payload === 'agendada' ? state.departureTime : '',
      };
      
    case 'SET_ORIGIN':
      return {
        ...state,
        origin: { ...state.origin, ...action.payload },
      };
      
    case 'SET_DESTINATION':
      return {
        ...state,
        destination: { ...state.destination, ...action.payload },
      };
      
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
      
    case 'SET_SUGGESTED_PRICE':
      return {
        ...state,
        suggestedPrice: action.payload,
        userEditedPrice: true,
      };
      
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
      
    case 'SET_USER_EDITED_PRICE':
      return { ...state, userEditedPrice: action.payload };
      
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
    setRideType: (type: RideType) => void;
    setOrigin: (data: Partial<AddressData>) => void;
    setDestination: (data: Partial<AddressData>) => void;
    setBoardingPoint: (point: BoardingPoint | null) => void;
    setDepartureTime: (time: string) => void;
    setSeats: (seats: number) => void;
    setSuggestedPrice: (price: string) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setTrustPreference: (pref: TrustPreference) => void;
    setObservation: (obs: string) => void;
    toggleAdvancedOptions: () => void;
    toggleBoardingPoints: () => void;
    setUserEditedPrice: (edited: boolean) => void;
    setSubmitting: (submitting: boolean) => void;
    reset: () => void;
  };
  validation: {
    isValid: boolean;
    canSubmit: boolean;
    errors: string[];
  };
}

/**
 * Hook para gerenciar estado e validação do formulário de solicitação de corrida
 * 
 * @returns Estado, actions e validação do formulário
 * 
 * @example
 * ```tsx
 * const { state, actions, validation } = useRideRequestForm();
 * 
 * // Atualizar origem
 * actions.setOrigin({ text: 'Rua X, 123', coords: {...}, isValid: true });
 * 
 * // Verificar se pode submeter
 * if (validation.canSubmit) {
 *   // Submit form
 * }
 * ```
 */
export function useRideRequestForm(): UseRideRequestFormReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Actions memoizadas
  const actions = useMemo(() => ({
    setRideType: (type: RideType) => dispatch({ type: 'SET_RIDE_TYPE', payload: type }),
    setOrigin: (data: Partial<AddressData>) => dispatch({ type: 'SET_ORIGIN', payload: data }),
    setDestination: (data: Partial<AddressData>) => dispatch({ type: 'SET_DESTINATION', payload: data }),
    setBoardingPoint: (point: BoardingPoint | null) => dispatch({ type: 'SET_BOARDING_POINT', payload: point }),
    setDepartureTime: (time: string) => dispatch({ type: 'SET_DEPARTURE_TIME', payload: time }),
    setSeats: (seats: number) => dispatch({ type: 'SET_SEATS', payload: seats }),
    setSuggestedPrice: (price: string) => dispatch({ type: 'SET_SUGGESTED_PRICE', payload: price }),
    setPaymentMethod: (method: PaymentMethod) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: method }),
    setTrustPreference: (pref: TrustPreference) => dispatch({ type: 'SET_TRUST_PREFERENCE', payload: pref }),
    setObservation: (obs: string) => dispatch({ type: 'SET_OBSERVATION', payload: obs }),
    toggleAdvancedOptions: () => dispatch({ type: 'TOGGLE_ADVANCED_OPTIONS' }),
    toggleBoardingPoints: () => dispatch({ type: 'TOGGLE_BOARDING_POINTS' }),
    setUserEditedPrice: (edited: boolean) => dispatch({ type: 'SET_USER_EDITED_PRICE', payload: edited }),
    setSubmitting: (submitting: boolean) => dispatch({ type: 'SET_SUBMITTING', payload: submitting }),
    reset: () => dispatch({ type: 'RESET' }),
  }), []);
  
  // Validação
  const validation = useMemo(() => {
    const errors: string[] = [];
    
    // Validar origem
    if (!state.origin.text.trim()) {
      errors.push('Origem é obrigatória');
    } else if (!state.origin.isValid) {
      errors.push('Origem inválida');
    }
    
    // Validar destino
    if (!state.destination.text.trim()) {
      errors.push('Destino é obrigatório');
    } else if (!state.destination.isValid) {
      errors.push('Destino inválido');
    }
    
    // Validar horário (apenas agendada)
    if (state.type === 'agendada' && !state.departureTime) {
      errors.push('Horário é obrigatório para corridas agendadas');
    }
    
    // Validar observação (obrigatória para entrega)
    if (state.type === 'entrega' && !state.observation.trim()) {
      errors.push('Descrição do objeto é obrigatória para entregas');
    }
    
    // Validar vagas (compartilhada)
    if (state.type === 'carona_compartilhada' && (state.seats < 1 || state.seats > 4)) {
      errors.push('Número de vagas inválido (1-4)');
    }
    
    const isValid = errors.length === 0;
    const canSubmit = isValid && !state.isSubmitting && !state.origin.isLoading && !state.destination.isLoading;
    
    return { isValid, canSubmit, errors };
  }, [state]);
  
  return {
    state,
    actions,
    validation,
  };
}
