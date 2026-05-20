/**
 * Admin Mutations - SSOT v2.0
 *
 * FunÃ§Ãµes de escrita para operaÃ§Ãµes administrativas
 * âœ… SEGURO: Usa edge functions ao invÃ©s de supabaseAdmin
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import type { AdminUserConfig, AdminUserResult } from './types';

/**
 * Criar usuÃ¡rio administrador
 * âœ… SEGURO: Usa edge function admin-create-user
 */
export async function createAdminUser(config: AdminUserConfig): Promise<AdminUserResult> {
  try {
    logger.info('admin.mutations.createAdminUser', { email: config.email });

    // Chamar edge function
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: config.email,
        password: config.password,
        username: config.email.split('@')[0], // Gerar username do email
        fullName: config.name || 'Admin',
        role: 'admin',
      },
    });

    if (error) {
      logger.error('admin.mutations.createAdminUser', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar usuario',
      };
    }

    logger.info('admin.mutations.createAdminUser', `Usuario criado: ${data.user.id}`);

    return {
      success: true,
      message: 'Usuario admin criado com sucesso!',
      userId: data.user.id,
    };

  } catch (error) {
    logger.error('admin.mutations.createAdminUser', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
