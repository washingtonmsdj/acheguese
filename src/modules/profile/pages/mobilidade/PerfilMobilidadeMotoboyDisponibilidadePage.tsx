import { DriverAvailabilityLayout } from "@/modules/mobility/components/driver/DriverAvailabilityLayout";

/**
 * PerfilMobilidadeMotoboyDisponibilidadePage
 * 
 * Página legada de disponibilidade de motoboy (/perfil/mobilidade/motoboy/disponibilidade).
 * Reutiliza o componente compartilhado DriverAvailabilityLayout com service="motoboy".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoboyDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motoboy" />;
}
