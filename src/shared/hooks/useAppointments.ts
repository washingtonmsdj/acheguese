 
/**
 * 📅 HOOK: useAppointments
 *
 * Hook consolidado para gerenciamento de agendamentos de negócios.
 * Anteriormente duplicado em business/ e empresa/.
 *
 * @version 2.0.0 (consolidado)
 * @author Kiro AI
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
// TODO: Mover useAppointmentNotificationActions para core ou passar via props
import { logger } from "@/shared/utils/logger";

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

interface UseAppointmentsProps {
  businessId: string;
  businessName: string;
}

export const useAppointments = ({
  businessId,
  businessName,
}: UseAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    notifyAppointmentConfirmed,
    notifyAppointmentCancelled,
    notifyAppointmentCompleted,
  } = useAppointmentNotificationActions();

  // Carregar agendamentos do Supabase
  // TODO: Implementar query real do Supabase
  useEffect(() => {
    setTimeout(() => {
      const mockAppointments: Appointment[] = [];
      setAppointments(mockAppointments);
      setLoading(false);
    }, 1000);
  }, [businessId]);

  // Filtrar agendamentos
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.client_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.client_phone.includes(searchTerm) ||
      appointment.service_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Atualizar status do agendamento
  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, newStatus: Appointment["status"]) => {
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) {
        logger.warn("Appointment not found", { appointmentId });
        return;
      }

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt,
        ),
      );

      const statusLabels = {
        pending: "pendente",
        confirmed: "confirmado",
        cancelled: "cancelado",
        completed: "concluído",
      };

      toast.success(`Agendamento ${statusLabels[newStatus]} com sucesso!`);

      // Criar notificações
      try {
        const notificationData = {
          appointment_id: appointmentId,
          business_id: businessId,
          business_name: businessName,
          client_name: appointment.client_name,
          client_phone: appointment.client_phone,
          service_name: appointment.service_name,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
        };

        switch (newStatus) {
          case "confirmed":
            await notifyAppointmentConfirmed(notificationData);
            break;
          case "cancelled":
            await notifyAppointmentCancelled(notificationData);
            break;
          case "completed":
            await notifyAppointmentCompleted(notificationData);
            break;
        }
      } catch (error) {
        logger.error("Error creating appointment notification", {
          error,
          appointmentId,
          newStatus,
        });
      }
    },
    [
      appointments,
      businessId,
      businessName,
      notifyAppointmentConfirmed,
      notifyAppointmentCancelled,
      notifyAppointmentCompleted,
    ],
  );

  // Contatar cliente
  const contactClient = useCallback(
    (appointment: Appointment, method: "whatsapp" | "phone") => {
      if (method === "whatsapp") {
        const message = `Olá ${appointment.client_name}! Sobre seu agendamento de ${appointment.service_name} para ${appointment.appointment_date} às ${appointment.appointment_time}.`;
        window.open(
          `https://wa.me/${appointment.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
          "_blank",
        );
      } else {
        window.location.href = `tel:${appointment.client_phone}`;
      }
    },
    [],
  );

  return {
    appointments: filteredAppointments,
    loading,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
    updateAppointmentStatus,
    contactClient,
  };
};
