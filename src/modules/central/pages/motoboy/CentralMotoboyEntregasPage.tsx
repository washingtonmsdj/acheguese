import { DriverDeliveriesLayout } from "@/modules/mobility/components/driver/DriverDeliveriesLayout";

/**
 * CentralMotoboyEntregasPage
 * 
 * Página de entregas de motoboy na Central (/central/motoboy/entregas).
 * Renderiza o componente compartilhado DriverDeliveriesLayout.
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverDeliveriesLayout também é usado pela página legada
 * /perfil/mobilidade/motoboy/entregas para evitar duplicação de regra.
 */
export default function CentralMotoboyEntregasPage() {
  return <DriverDeliveriesLayout />;
}
