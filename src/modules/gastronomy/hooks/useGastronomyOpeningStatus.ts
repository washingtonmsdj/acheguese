/**
 * useGastronomyOpeningStatus — Status de abertura em tempo real
 *
 * Reutiliza OpeningHoursService do SSOT de business.
 * Atualiza a cada minuto para refletir mudanças de horário.
 */

import { useState, useEffect } from 'react';
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';
import type { GastronomyBusiness } from '../types';

export interface GastronomyOpeningStatus {
  isOpen: boolean;
  statusText: string;
  dotColor: 'green' | 'red' | 'yellow';
  closingTime: string | null;
}

function computeStatus(business: GastronomyBusiness): GastronomyOpeningStatus {
  const result = OpeningHoursService.calculateStatus(
    business.horario_funcionamento,
  );

  if (result.is_open) {
    return {
      isOpen: true,
      statusText: 'Aberto agora',
      dotColor: 'green',
      closingTime: result.next_change?.time ?? null,
    };
  }

  if (result.next_change?.action === 'opens') {
    return {
      isOpen: false,
      statusText: result.status_text,
      dotColor: 'yellow',
      closingTime: null,
    };
  }

  return {
    isOpen: false,
    statusText: result.status_text,
    dotColor: 'red',
    closingTime: null,
  };
}

export function useGastronomyOpeningStatus(
  business: GastronomyBusiness | null | undefined,
): GastronomyOpeningStatus | null {
  const [status, setStatus] = useState<GastronomyOpeningStatus | null>(
    business ? computeStatus(business) : null,
  );

  useEffect(() => {
    if (!business) {
      setStatus(null);
      return;
    }

    setStatus(computeStatus(business));

    // Recalcular a cada minuto
    const interval = setInterval(() => {
      setStatus(computeStatus(business));
    }, 60_000);

    return () => clearInterval(interval);
  }, [business]);

  return status;
}
