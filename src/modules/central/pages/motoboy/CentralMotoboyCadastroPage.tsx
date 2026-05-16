import { DriverProfileLayout } from "@/modules/mobility/components/driver/DriverProfileLayout";

/**
 * CentralMotoboyCadastroPage
 * 
 * Página de cadastro de motoboy na Central (/central/motoboy/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motoboy".
 * 
 * Esta página renderiza o conteúdo real da rota canônica da Central.
 */
export default function CentralMotoboyCadastroPage() {
  return <DriverProfileLayout service="motoboy" />;
}
