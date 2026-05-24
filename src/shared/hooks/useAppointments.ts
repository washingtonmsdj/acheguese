import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { buildTelUrl, buildWhatsAppUrl, openContactUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";

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

export const useAppointments = ({ businessId }: UseAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppointments([]);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [businessId]);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.client_phone.includes(searchTerm) ||
      appointment.service_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        completed: "concluido",
      };

      toast.success(`Agendamento ${statusLabels[newStatus]} com sucesso!`);
    },
    [appointments],
  );

  const contactClient = useCallback(
    (appointment: Appointment, method: "whatsapp" | "phone") => {
      if (method === "whatsapp") {
        const message = `Ola ${appointment.client_name}! Sobre seu agendamento de ${appointment.service_name} para ${appointment.appointment_date} as ${appointment.appointment_time}.`;
        const url = buildWhatsAppUrl(appointment.client_phone, message);
        if (url) openSafeExternalUrl(url, { context: "appointments-client-whatsapp" });
      } else {
        const url = buildTelUrl(appointment.client_phone);
        openContactUrl(url);
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
