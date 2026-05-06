import { DriverRidesLayout } from "@/modules/mobility/components/driver/DriverRidesLayout";

/**
 * CentralMotoristaCorridasPage
 * 
 * Página de corridas de motorista na Central (/central/motorista/corridas).
 * Renderiza o componente compartilhado DriverRidesLayout.
 * 
 * Esta página não é mais um wrapper - ela renderiza o conteúdo real.
 * O componente compartilhado DriverRidesLayout também é usado pela página legada
 * /perfil/mobilidade/motorista/corridas para evitar duplicação de regra.
 */
export default function CentralMotoristaCorridasPage() {
  return <DriverRidesLayout />;
}
