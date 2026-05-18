export { MetricsService } from "./services/MetricsService";
export type { RealtimeMetrics, ReputationStats } from "./services/MetricsService";

// Re-export removido: cliente de infraestrutura nao deve ser re-exportado por dominio de negocio.
// Consumidores foram migrados para o entrypoint canonico de infraestrutura (2026-03-30).
