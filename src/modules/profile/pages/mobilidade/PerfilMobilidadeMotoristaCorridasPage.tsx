import { DriverRidesLayout } from "@/modules/mobility/components/driver/DriverRidesLayout";

/**
 * PerfilMobilidadeMotoristaCorridasPage
 * 
 * Página legada de corridas de motorista (/perfil/mobilidade/motorista/corridas).
 * Reutiliza o componente compartilhado DriverRidesLayout.
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoristaCorridasPage() {
  return <DriverRidesLayout />;
}
