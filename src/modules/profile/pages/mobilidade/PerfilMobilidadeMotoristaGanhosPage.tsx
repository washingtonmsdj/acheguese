import { DriverEarningsLayout } from "@/modules/mobility/components/driver/DriverEarningsLayout";

/**
 * PerfilMobilidadeMotoristaGanhosPage
 * 
 * Página legada de ganhos de motorista (/perfil/mobilidade/motorista/ganhos).
 * Reutiliza o componente compartilhado DriverEarningsLayout com service="motorista".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoristaGanhosPage() {
  return <DriverEarningsLayout service="motorista" />;
}
