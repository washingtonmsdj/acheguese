/**
 * Admin API - Camada de compatibilidade (LEGACY)
 *
 * ⚠️ @deprecated - Este módulo está em processo de deprecação.
 * Use os serviços SSOT diretamente em vez deste wrapper.
 *
 * ✅ Alternativas SSOT:
 * - AdminStatsService - Para estatísticas do dashboard
 * - AdminAlertsService - Para operações de alertas
 * - AdminModerationService - Para moderação
 * - AdminClassifiedsService - Para classificados
 * - AdminEventsService - Para eventos
 * - AdminCouponsService - Para cupons
 * - AdminMessagingService - Para mensagens
 *
 * Arquivos que ainda usam este módulo (MIGRAR - baixa prioridade):
 * - src/modules/admin/pages/AdminConfiguracoes.tsx
 * - src/modules/admin/pages/AdminGamificacao.tsx
 *
 * ✅ Já migrados:
 * - useModeration.ts → AdminModerationService
 * - useAlertActions.ts → AdminAlertsService
 * - useAlertData.ts → AdminAlertsService
 * - AdminDashboard.tsx → AdminStatsService
 */

import { adminStatsService } from "@/core/admin/services/AdminStatsService";
import { adminCrudService } from "@/core/admin/services/AdminCrudService";
import type { TableStats, ActivityData, RecentActivity } from "@/core/admin/services/AdminStatsService";

export async function adminList(table: string, options?: any) {
  return await adminCrudService.list(table, {
    select: options?.select || "*",
    orderBy: options?.orderBy ?? "created_at",
    ascending: options?.ascending ?? false,
  });
}

export async function adminCreate(table: string, data: any) {
  return await adminCrudService.create(table, data);
}

export async function adminUpdate(table: string, id: string, data: any) {
  return await adminCrudService.update(table, id, data);
}

export async function adminDelete(table: string, id: string) {
  await adminCrudService.delete(table, id);
}

/**
 * ✅ SSOT: Delega para AdminStatsService.getTableStats()
 */
export async function adminGetStats(): Promise<TableStats> {
  return await adminStatsService.getTableStats();
}

/**
 * ✅ SSOT: Delega para AdminStatsService.getActivity()
 */
export async function adminGetActivity(days = 30): Promise<ActivityData[]> {
  return await adminStatsService.getActivity(days);
}

/**
 * ✅ SSOT: Delega para AdminStatsService.getRecentActivity()
 */
export async function adminGetRecent(): Promise<RecentActivity[]> {
  return await adminStatsService.getRecentActivity(10);
}
