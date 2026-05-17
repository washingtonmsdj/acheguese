import { DriverAvailabilityLayout } from "@/core/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoboyDisponibilidadePage
 * 
 * PÃ¡gina de disponibilidade de motoboy na Central (/central/motoboy/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motoboy".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoboyDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motoboy" />;
}
