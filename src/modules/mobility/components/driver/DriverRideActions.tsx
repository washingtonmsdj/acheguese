import { Button } from "@/shared/components/ui/button";
import { RideStatus, RideRequest } from "@/modules/mobility/types";
import { RIDE_STATUS } from "@/shared/types/constants";
import {
  Car,
  Navigation,
  MapPin,
  UserCheck,
  Play,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
} from "lucide-react";

interface DriverRideActionsProps {
  rideId: string;
  status: RideStatus;
  ride?: RideRequest;
  onStartOnTheWay?: (id: string) => void;
  onConfirmArrival?: (id: string) => void;
  onConfirmPassengerOnBoard?: (id: string) => void;
  onStartRide?: (id: string) => void;
  onCompleteRide?: (id: string, finalPrice?: number) => void;
  onCancel?: (id: string) => void;
  onContact?: () => void;
  onOpenCompleteDialog?: () => void;
}

export function DriverRideActions({
  rideId,
  status,
  ride,
  onStartOnTheWay,
  onConfirmArrival,
  onConfirmPassengerOnBoard,
  onStartRide,
  onCompleteRide,
  onCancel,
  onContact,
  onOpenCompleteDialog,
}: DriverRideActionsProps) {
  // Status: driver_assigned - Motorista acabou de aceitar
  if (status === RIDE_STATUS.DRIVER_ASSIGNED) {
    return (
      <div className="space-y-2">
        {onContact && ride && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onContact}
              size="sm"
              className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-xl text-xs h-9"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Mensagem
            </Button>
            <Button
              onClick={() => {
                if (ride.passenger?.phone) {
                  window.location.href = `tel:${ride.passenger.phone}`;
                } else {
                  onContact();
                }
              }}
              size="sm"
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-xs h-9"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Ligar
            </Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {onStartOnTheWay && (
            <Button
              onClick={() => onStartOnTheWay(rideId)}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl h-10"
            >
              <Navigation className="h-4 w-4 mr-2" /> Estou a Caminho
            </Button>
          )}
          {onCancel && (
            <Button
              onClick={() => onCancel(rideId)}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs h-10"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Status: driver_on_the_way - Motorista a caminho
  if (status === RIDE_STATUS.DRIVER_ON_THE_WAY) {
    return (
      <div className="space-y-2">
        {onContact && ride && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={onContact}
              size="sm"
              className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-xl text-xs h-9"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Mensagem
            </Button>
            <Button
              onClick={() => {
                if (ride.passenger?.phone) {
                  window.location.href = `tel:${ride.passenger.phone}`;
                } else {
                  onContact();
                }
              }}
              size="sm"
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-xs h-9"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Ligar
            </Button>
          </div>
        )}
        <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-xs text-blue-400 font-semibold">
            🚗 Indo buscar o passageiro
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {onConfirmArrival && (
            <Button
              onClick={() => onConfirmArrival(rideId)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold rounded-xl h-10"
            >
              <MapPin className="h-4 w-4 mr-2" /> Cheguei
            </Button>
          )}
          {onCancel && (
            <Button
              onClick={() => onCancel(rideId)}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs h-10"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Status: driver_arrived - Motorista chegou, aguardando passageiro
  if (status === RIDE_STATUS.DRIVER_ARRIVED) {
    return (
      <div className="space-y-2">
        {onContact && ride && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={onContact}
              size="sm"
              className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-xl text-xs h-9"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Mensagem
            </Button>
            <Button
              onClick={() => {
                if (ride.passenger?.phone) {
                  window.location.href = `tel:${ride.passenger.phone}`;
                } else {
                  onContact();
                }
              }}
              size="sm"
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-xs h-9"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Ligar
            </Button>
          </div>
        )}
        <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-xs text-green-400 font-semibold">
            ✅ Aguardando passageiro embarcar
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {onConfirmPassengerOnBoard && (
            <Button
              onClick={() => onConfirmPassengerOnBoard(rideId)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold rounded-xl h-10"
            >
              <UserCheck className="h-4 w-4 mr-2" /> Passageiro Embarcou
            </Button>
          )}
          {onCancel && (
            <Button
              onClick={() => onCancel(rideId)}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs h-10"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Status: passenger_on_board - Passageiro embarcou, pronto para iniciar
  if (status === RIDE_STATUS.PASSENGER_ON_BOARD) {
    return (
      <div className="space-y-2">
        <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
          <p className="text-xs text-indigo-400 font-semibold">
            👤 Passageiro a bordo
          </p>
        </div>
        {onStartRide && (
          <Button
            onClick={() => onStartRide(rideId)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-semibold rounded-xl h-10"
          >
            <Play className="h-4 w-4 mr-2" /> Iniciar Viagem
          </Button>
        )}
      </div>
    );
  }

  // Status: in_progress - Viagem em andamento
  if (status === RIDE_STATUS.IN_PROGRESS) {
    return (
      <div className="space-y-2">
        <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-xs text-blue-400 font-semibold">
            🚗 Viagem em andamento
          </p>
        </div>
        {onOpenCompleteDialog && (
          <Button
            onClick={onOpenCompleteDialog}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-semibold rounded-xl h-10"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Corrida
          </Button>
        )}
      </div>
    );
  }

  // Status: completed - Corrida finalizada
  if (status === RIDE_STATUS.COMPLETED) {
    return (
      <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
        <p className="text-xs text-emerald-400 font-semibold">
          ✅ Corrida concluída
        </p>
      </div>
    );
  }

  // Status: cancelled - Corrida cancelada
  if (status === RIDE_STATUS.CANCELLED) {
    return (
      <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
        <p className="text-xs text-red-400 font-semibold">
          ❌ Corrida cancelada
        </p>
      </div>
    );
  }

  // Status: pending - Aguardando aceite (não deveria aparecer para motorista)
  return null;
}
