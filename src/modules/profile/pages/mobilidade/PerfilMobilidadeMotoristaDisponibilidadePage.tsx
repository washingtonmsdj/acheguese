import { DriverAvailabilityLayout } from "@/modules/mobility/components/driver/DriverAvailabilityLayout";

/**
 * PerfilMobilidadeMotoristaDisponibilidadePage
 * 
 * Página legada de disponibilidade de motorista (/perfil/mobilidade/motorista/disponibilidade).
 * Reutiliza o componente compartilhado DriverAvailabilityLayout com service="motorista".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoristaDisponibilidadePage() {
  return <DriverAvailabilityLayout service="motorista" />;
}
