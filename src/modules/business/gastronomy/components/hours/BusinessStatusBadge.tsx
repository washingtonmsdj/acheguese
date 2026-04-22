/**
 * BusinessStatusBadge — Badge de status (Aberto/Fechado)
 *
 * Mostra status em tempo real com atualização automática.
 * SSOT: Usa useBusinessStatus hook
 */

import { useBusinessStatus } from '../../hooks';
import { Badge } from '@/shared/components/ui/badge';
import { Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BusinessStatusBadgeProps {
  businessId: string;
  showNextOpening?: boolean;
}

export function BusinessStatusBadge({ businessId, showNextOpening = true }: BusinessStatusBadgeProps) {
  const { status, isLoading } = useBusinessStatus(businessId);

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-2">
        <Clock className="w-3 h-3 animate-spin" />
        Carregando...
      </Badge>
    );
  }

  if (!status) {
    return null;
  }

  const { isOpen, nextOpening } = status;

  return (
    <div className="flex flex-col gap-2">
      <Badge
        variant={isOpen ? 'default' : 'secondary'}
        className={isOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}
      >
        <Clock className="w-3 h-3 mr-1" />
        {isOpen ? 'Aberto' : 'Fechado'}
      </Badge>

      {showNextOpening && !isOpen && nextOpening && (
        <p className="text-xs text-muted-foreground">
          Abre {format(parseISO(nextOpening.date), "EEEE 'às' HH:mm", { locale: ptBR })}
          {nextOpening.reason && ` (${nextOpening.reason})`}
        </p>
      )}

      {showNextOpening && isOpen && nextOpening && (
        <p className="text-xs text-muted-foreground">
          Fecha às {nextOpening.closes_at}
        </p>
      )}
    </div>
  );
}
