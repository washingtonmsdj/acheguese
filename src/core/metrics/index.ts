export { MetricsService } from './services/MetricsService';
export type { RealtimeMetrics, ReputationStats } from './services/MetricsService';

// Re-export removido: supabase não deve ser re-exportado de domínios de negócio.
// Consumidores migrados para import { supabase } from '@/integrations/supabase' em 2026-03-30.
