import { DriverAvailabilityLayout } from "@/modules/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoboyDisponibilidadePage
 * 
 * Página de disponibilidade de motoboy na Central (/central/motoboy/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motoboy".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoboyDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motoboy" />;
}
