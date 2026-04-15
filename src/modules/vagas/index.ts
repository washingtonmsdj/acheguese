/**
 * Módulo Vagas — Barrel export
 */
export { default as VagasListingPage } from "./pages/VagasListingPage";
export { default as VagaDetailPage } from "./pages/VagaDetailPage";
export { default as PublicarVagaPage } from "./pages/PublicarVagaPage";
export { VagaCardEnhanced } from "./components/VagaCardEnhanced";
export { VagaCardEnhanced as VagaCard } from "./components/VagaCardEnhanced"; // Alias para compatibilidade
export { VagasFilters } from "./components/VagasFilters";
export { useVagas } from "./hooks/useVagas";
export { useVagasLocation } from "./hooks/useVagasLocation";
export type { Vaga, VagaContrato, VagaModalidade, VagaNivel, VagaStatus } from "./types/vagas.types";
