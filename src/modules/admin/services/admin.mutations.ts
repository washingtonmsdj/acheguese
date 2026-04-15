/**
 * Admin Mutations - SSOT v2.0
 * 
 * Funções de escrita para operações administrativas
 */

import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import { logger } from '@/shared/utils/logger';
import type { AdminUserConfig, AdminUserResult } from './types';

/**
 * Criar usuário administrador
 */
export async function createAdminUser(config: AdminUserConfig): Promise<AdminUserResult> {
  try {
    logger.info('admin.mutations.createAdminUser', { email: config.email });

    // 1. Tentar criar usuário via Admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: {
        name: config.name || 'Admin',
      }
    });

    let userId: string;

    if (userError) {
      // Verificar se usuário já existe
      if (userError.message.includes('already registered') ||
          userError.message.includes('already been registered')) {
        logger.info('admin.mutations.createAdminUser', 'Usuário já existe, buscando ID');

        // Buscar usuário existente
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = (users as any).users.find((u: any) => u.email === config.email);
        if (!existingUser) {
          throw new Error('Usuário não encontrado');
        }

        userId = existingUser.id;
        logger.info('admin.mutations.createAdminUser', `Usuário encontrado: ${userId}`);
      } else {
        throw userError;
      }
    } else {
      if (!userData.user) {
        throw new Error('Usuário não foi criado');
      }
      userId = userData.user.id;
      logger.info('admin.mutations.createAdminUser', `Usuário criado: ${userId}`);
    }

    // 2. ✅ SSOT - Usar AdminRolesService para adicionar role
    const { AdminRolesService } = await import('@/core/admin/services/AdminRolesService');
    await AdminRolesService.grantRole(userId, 'admin');

    logger.info('admin.mutations.createAdminUser', 'Role de admin adicionada');

    return {
      success: true,
      message: 'Usuário admin criado com sucesso!',
      userId
    };

  } catch (error) {
    logger.error('admin.mutations.createAdminUser', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
