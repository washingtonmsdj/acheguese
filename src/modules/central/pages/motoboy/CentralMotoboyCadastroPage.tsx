import { DriverProfileLayout } from "@/core/mobility/components/driver/DriverProfileLayout";

/**
 * CentralMotoboyCadastroPage
 * 
 * PÃ¡gina de cadastro de motoboy na Central (/central/motoboy/cadastro).
 * Renderiza o componente compartilhado DriverProfileLayout com service="motoboy".
 * 
 * Esta pÃ¡gina renderiza o conteÃºdo real da rota canÃ´nica da Central.
 */
export default function CentralMotoboyCadastroPage() {
  return <DriverProfileLayout service="motoboy" />;
}
