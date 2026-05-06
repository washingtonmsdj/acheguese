import { DriverDeliveriesLayout } from "@/modules/mobility/components/driver/DriverDeliveriesLayout";

/**
 * PerfilMobilidadeMotoboyEntregasPage
 * 
 * Página legada de entregas de motoboy (/perfil/mobilidade/motoboy/entregas).
 * Reutiliza o componente compartilhado DriverDeliveriesLayout.
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoboyEntregasPage() {
  return <DriverDeliveriesLayout />;
}
