import { DriverProfileLayout } from "@/modules/mobility/components/driver/DriverProfileLayout";

/**
 * PerfilMobilidadeMotoristaCadastroPage
 * 
 * Página legada de cadastro de motorista (/perfil/mobilidade/motorista/cadastro).
 * Reutiliza o componente compartilhado DriverProfileLayout com service="motorista".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoristaCadastroPage() {
  return <DriverProfileLayout service="motorista" />;
}
