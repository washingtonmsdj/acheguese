import { DriverAvailabilityLayout } from "@/modules/mobility/components/driver/DriverAvailabilityLayout";

/**
 * CentralMotoboyDisponibilidadePage
 * 
 * Página de disponibilidade de motoboy na Central (/central/motoboy/disponibilidade).
 * Renderiza o componente compartilhado DriverAvailabilityLayout com service="motoboy".
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverAvailabilityLayout também é usado pela página legada
 * /perfil/mobilidade/motoboy/disponibilidade para evitar duplicação de regra.
 */
export default function CentralMotoboyDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motoboy" />;
}
