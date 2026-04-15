 
import {
  adminStatsService,
  adminCrudService,
} from "@/modules/admin";
import { adminRolesService } from "@/core/admin/services/AdminRolesService";
import { USER_ROLE } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";
import { AuthService } from "@/core/auth/services/AuthService";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

// ── Types ──────────────────────────────────────────
interface ActivityData {
  date: string;
  posts: number;
  users: number;
  businesses: number;
  eventos: number;
  classificados: number;
}

interface RecentActivity {
  type: string;
  label: string;
  date: string;
}

interface BusinessRecord {
  id: string;
  name: string;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  name: string;
  created_at: string;
}

async function getHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

// === Stats & Activity ===
export async function adminGetStats(): Promise<Record<string, number>> {
  // ✅ SSOT: Usar AdminStatsService para obter estatísticas
  const tables = [
    "businesses",
    "professional_data",
    "classifieds",
    "events",
    "posts",
    "profiles",
    "comments",
  ];
  return await adminStatsService.getTableStats(tables);
}

export async function adminGetActivity(days = 30): Promise<ActivityData[]> {
  // ✅ SSOT: Usar AdminStatsService para obter atividades
  return await adminStatsService.getActivity(days);
}

export async function adminGetRecent(): Promise<RecentActivity[]> {
  // ✅ SSOT: Usar AdminStatsService para obter atividades recentes
  return await adminStatsService.getRecentActivity(10);
}

// === CRUD ===
export async function adminList(table: string) {
  // ✅ SSOT: Usar AdminCrudService para listar registros
  return await adminCrudService.list(table);
}

export async function adminGet(table: string, id: string) {
  // ✅ SSOT: Usar AdminCrudService para obter registro
  return await adminCrudService.get(table, id);
}

export async function adminCreate(
  table: string,
  data: Record<string, unknown>,
) {
  // ✅ SSOT: Usar AdminCrudService para criar registro
  return await adminCrudService.create(table, data);
}

export async function adminUpdate(
  table: string,
  id: string,
  data: Record<string, unknown>,
) {
  // ✅ SSOT: Usar AdminCrudService para atualizar registro
  return await adminCrudService.update(table, id, data);
}

export async function adminDelete(table: string, id: string) {
  // ✅ SSOT: Usar AdminCrudService para deletar registro
  return await adminCrudService.delete(table, id);
}

// === Role management ===
export async function adminAddRole(userId: string, role: string) {
  // ✅ SSOT: Usar AdminRolesService para gerenciar roles
  const success = await adminRolesService.grantRole({
    userId,
    role,
    grantedBy: "admin",
  });
  if (!success) throw new Error("Failed to grant role");

  // Retornar dados compatíveis
  return { user_id: userId, role, granted_at: new Date().toISOString() };
}

export async function adminRemoveRole(userId: string, role: string) {
  // ✅ SSOT: Usar AdminRolesService para remover role
  const success = await adminRolesService.revokeRole({
    userId,
    role,
    revokedBy: "admin",
  });
  if (!success) throw new Error("Failed to revoke role");
  return { success: true };
}

// === User Management (Auth Admin) ===
// Nota: Estas funções requerem permissões especiais e devem ser implementadas
// via RPC ou Edge Functions quando necessário
export async function adminCreateUser(date: {
  email: string;
  password: string;
  name: string;
  role?: string;
  businessData?: Record<string, unknown>;
  professionalData?: Record<string, unknown>;
}) {
  // Por enquanto, retorna erro informactive
  throw new Error(
    "Criação de usuário via admin requer configuração de Edge Function",
  );
}

export async function adminResetPassword(userId: string, newPassword: string) {
  // Por enquanto, retorna erro informactive
  throw new Error(
    "Reset de senha via admin requer configuração de Edge Function",
  );
}

export async function adminSendRecovery(email: string) {
  // ✅ SSOT - Usar AuthService para reset de senha
  await AuthService.resetPassword(email);
  return { success: true };
}

export async function adminDeleteUser(userId: string) {
  // Por enquanto, retorna erro informactive
  throw new Error(
    "Exclusão de usuário via admin requer configuração de Edge Function",
  );
}
