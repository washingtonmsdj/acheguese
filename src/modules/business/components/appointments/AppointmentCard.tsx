import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  MessageCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/shared/utils/cn";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onContact: (appointment: Appointment, method: "whatsapp" | "phone") => void;
  onViewDetails: (appointment: Appointment) => void;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconColor: "text-yellow-600",
    icon: CheckCircle,
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-green-100 text-green-800 border-green-200",
    iconColor: "text-green-600",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-200",
    iconColor: "text-red-600",
    icon: XCircle,
  },
  completed: {
    label: "Concluído",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    iconColor: "text-blue-600",
    icon: CheckCircle,
  },
};

export const AppointmentCard = ({
  appointment,
  onStatusChange,
  onContact,
  onViewDetails,
}: AppointmentCardProps) => {
  const statusConfig = STATUS_CONFIG[appointment.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="p-4 border-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-center gap-1">
            <StatusIcon className={cn("h-5 w-5", statusConfig.iconColor)} />
            <Badge
              variant="outline"
              className={cn("text-xs", statusConfig.color)}
            >
              {statusConfig.label}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold">{appointment.client_name}</h4>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm font-medium">
                {appointment.service_name}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(appointment.appointment_date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {appointment.appointment_time}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {appointment.client_phone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {appointment.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => onStatusChange(appointment.id, "confirmed")}
                className="gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(appointment.id, "cancelled")}
                className="gap-1"
              >
                <XCircle className="h-3 w-3" />
                Cancelar
              </Button>
            </>
          )}

          {appointment.status === "confirmed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(appointment.id, "completed")}
              className="gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Concluir
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onContact(appointment, "whatsapp")}
            className="gap-1"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(appointment)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
