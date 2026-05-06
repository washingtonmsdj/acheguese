import { DriverEarningsLayout } from "@/modules/mobility/components/driver/DriverEarningsLayout";

/**
 * PerfilMobilidadeMotoboyGanhosPage
 * 
 * Página legada de ganhos de motoboy (/perfil/mobilidade/motoboy/ganhos).
 * Reutiliza o componente compartilhado DriverEarningsLayout com service="motoboy".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoboyGanhosPage() {
  return <DriverEarningsLayout service="motoboy" />;
}
