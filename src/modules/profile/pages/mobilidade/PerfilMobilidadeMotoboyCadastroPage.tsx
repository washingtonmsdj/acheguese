import { DriverProfileLayout } from "@/modules/mobility/components/driver/DriverProfileLayout";

/**
 * PerfilMobilidadeMotoboyCadastroPage
 * 
 * Página legada de cadastro de motoboy (/perfil/mobilidade/motoboy/cadastro).
 * Reutiliza o componente compartilhado DriverProfileLayout com service="motoboy".
 * 
 * Esta página legada agora usa o mesmo componente compartilhado que a Central,
 * garantindo consistência e evitando duplicação de regra.
 */
export default function PerfilMobilidadeMotoboyCadastroPage() {
  return <DriverProfileLayout service="motoboy" />;
}
