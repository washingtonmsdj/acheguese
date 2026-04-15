import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Calendar, Plus, Bell } from "lucide-react";
import AppointmentNotifications from "./AppointmentNotifications";
import { AppointmentCard } from "./appointments/AppointmentCard";
import { AppointmentFilters } from "./appointments/AppointmentFilters";
import { AppointmentDetailsModal } from "./appointments/AppointmentDetailsModal";
import { EmptyAppointments } from "./appointments/EmptyAppointments";
import { useAppointments } from "@/shared/hooks/useAppointments";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  created_at: string;
}

interface AppointmentsPanelProps {
  businessId: string;
  businessName: string;
  isOwner: boolean;
}

export default function AppointmentsPanel({
  businessId,
  businessName,
  isOwner,
}: AppointmentsPanelProps) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);

  const {
    appointments,
    loading,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
    updateAppointmentStatus,
    contactClient,
  } = useAppointments({ businessId, businessName });

  const handleNotificationClick = (appointmentId: string) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setDetailsOpen(true);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsOpen(true);
  };

  if (!isOwner) {
    return (
      <Card className="p-6 border-2">
        <div className="text-center text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="font-semibold text-lg mb-2">Agendamentos</h3>
          <p className="text-sm mb-4">
            Apenas o dono da empresa pode ver os agendamentos
          </p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 border-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            Carregando agendamentos...
          </p>
        </div>
      </Card>
    );
  }

  const hasFilters = searchTerm !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {showNotifications && (
        <AppointmentNotifications
          businessId={businessId}
          isOwner={isOwner}
          onNotificationClick={handleNotificationClick}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Agendamentos</h2>
          <p className="text-sm text-muted-foreground">
            {appointments.length}{" "}
            {appointments.length === 1 ? "agendamento" : "agendamentos"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNotifications(!showNotifications)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {showNotifications ? "Ocultar" : "Mostrar"} Notificações
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <AppointmentFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      {appointments.length === 0 ? (
        <EmptyAppointments hasFilters={hasFilters} />
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStatusChange={updateAppointmentStatus}
              onContact={contactClient}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onContact={contactClient}
      />
    </div>
  );
}
