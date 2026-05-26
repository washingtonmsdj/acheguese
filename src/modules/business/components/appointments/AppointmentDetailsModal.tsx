import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import type { AppointmentStatus } from "./constants";

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

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContact: (appointment: Appointment, method: "whatsapp" | "phone") => void;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  completed: {
    label: "Concluído",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

export const AppointmentDetailsModal = ({
  appointment,
  open,
  onOpenChange,
  onContact,
}: AppointmentDetailsModalProps) => {
  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Detalhes do agendamento selecionado
        </DialogDescription>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Cliente
              </label>
              <p className="font-semibold">{appointment.client_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <Badge
                variant="outline"
                className={cn("mt-1", STATUS_CONFIG[appointment.status].color)}
              >
                {STATUS_CONFIG[appointment.status].label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Data
              </label>
              <p>
                {format(new Date(appointment.appointment_date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Horário
              </label>
              <p>{appointment.appointment_time}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Serviço
            </label>
            <p>{appointment.service_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Telefone
              </label>
              <p>{appointment.client_phone}</p>
            </div>
            {appointment.client_email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  E-mail
                </label>
                <p className="text-sm">{appointment.client_email}</p>
              </div>
            )}
          </div>

          {appointment.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Observações
              </label>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => onContact(appointment, "whatsapp")}
              className="flex-1 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => onContact(appointment, "phone")}
              className="flex-1 gap-2"
            >
              <Phone className="h-4 w-4" />
              Ligar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
