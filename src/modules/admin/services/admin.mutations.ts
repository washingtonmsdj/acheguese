/**
 * Admin Mutations - SSOT v2.0
 * 
 * Funções de escrita para operações administrativas
 * ✅ SEGURO: Usa edge functions ao invés de supabaseAdmin
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { AdminUserConfig, AdminUserResult } from './types';

/**
 * Criar usuário administrador
 * ✅ SEGURO: Usa edge function admin-create-user
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
        message: error.message || 'Erro ao criar usuário',
      };
    }

    logger.info('admin.mutations.createAdminUser', `Usuário criado: ${data.user.id}`);

    return {
      success: true,
      message: 'Usuário admin criado com sucesso!',
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
