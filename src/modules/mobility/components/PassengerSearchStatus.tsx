/**
 * PassengerSearchStatus - Componente para passageiro acompanhar busca
 *
 * Demonstra uso do hook useRideSearch para acompanhar busca em tempo real.
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import {
  useRideSearch,
  type RideSearchStatus,
} from '../hooks/useRideSearch';
import { Loader2, CheckCircle, XCircle, User } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';

interface PassengerSearchStatusProps {
  rideId: string;
  onStatusChange?: (status: RideSearchStatus) => void;
}

export function PassengerSearchStatus({
  rideId,
  onStatusChange,
}: PassengerSearchStatusProps) {
  const { toast } = useToast();

  const { searchStatus, isSearching } = useRideSearch({
    rideId,
    enabled: true,
    onStatusChange: (status) => {
      if (status.status === 'driver_accepted') {
        toast({
          title: 'Motorista confirmado!',
          description: 'Seu motorista está a caminho',
        });
      } else if (status.status === 'expired') {
        toast({
          title: 'Busca expirada',
          description: 'Não encontramos motorista disponível',
          variant: 'destructive',
        });
      } else if (status.status === 'failed') {
        toast({
          title: 'Corrida encerrada',
          description: 'A corrida foi encerrada por uma falha operacional',
          variant: 'destructive',
        });
      }

      onStatusChange?.(status);
    },
  });

  if (!searchStatus) {
    return null;
  }

  const getIcon = () => {
    switch (searchStatus.status) {
      case 'searching':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'driver_found':
        return <User className="h-8 w-8 text-blue-600" />;
      case 'driver_accepted':
      case 'in_progress':
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'expired':
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (searchStatus.status) {
      case 'searching':
        return 'border-primary';
      case 'driver_found':
        return 'border-blue-600';
      case 'driver_accepted':
      case 'in_progress':
      case 'completed':
        return 'border-green-600';
      case 'expired':
      case 'cancelled':
      case 'failed':
        return 'border-red-600';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Card className={`w-full max-w-md ${getStatusColor()} border-2`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4 text-center">
          {getIcon()}

          <div>
            <h3 className="text-lg font-semibold mb-1">
              {getStatusTitle(searchStatus.status)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchStatus.message}
            </p>
          </div>

          {isSearching && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusTitle(status: RideSearchStatus['status']): string {
  switch (status) {
    case 'searching':
      return 'Procurando motorista';
    case 'driver_found':
      return 'Motorista encontrado';
    case 'driver_accepted':
      return 'Corrida confirmada';
    case 'in_progress':
      return 'Corrida em andamento';
    case 'completed':
      return 'Corrida concluída';
    case 'expired':
      return 'Busca expirada';
    case 'cancelled':
      return 'Corrida cancelada';
    case 'failed':
      return 'Corrida encerrada';
    default:
      return '';
  }
}
