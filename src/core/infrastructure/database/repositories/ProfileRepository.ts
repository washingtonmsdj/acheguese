/**
 * ProfileRepository - Repository para tabela profiles
 * 
 * SSOT: Única fonte de verdade para operações com profiles
 * Substitui queries diretas espalhadas em 12+ arquivos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { supabase } from '@/integrations/supabase';
import { BaseRepository } from './BaseRepository';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter } from '../interfaces/IRepository';
import {
  DATABASE_PROFILE_VERIFICATION_STATUS,
  type DatabaseProfileVerificationStatus,
} from '../constants/statuses';

/**
 * Interface do Profile (SSOT)
 * Define estrutura canônica do profile
 */
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  telefone: string | null;
  pontos: number;
  verification_status: DatabaseProfileVerificationStatus | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository para operações com profiles
 * Herda todas as operações CRUD do BaseRepository
 * Adiciona métodos específicos do domínio de profiles
 */
export class ProfileRepository extends BaseRepository<Profile> {
  protected readonly table = 'profiles';

  constructor() {
    super(supabase);
  }

  /**
   * Busca profile por username
   * Método específico do domínio de profiles
   */
  async findByUsername(username: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByUsername', this.table);
      }

      return data as Profile | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find profile by username: ${username}`,
        originalError: error,
        table: this.table,
        operation: 'findByUsername',
        context: { username },
      });
    }
  }

  /**
   * Busca profiles por user_id
   * Um usuário pode ter múltiplos profiles
   */
  async findByUserId(userId: string): Promise<Profile[]> {
    const filters: Filter[] = [
      this.createFilter('user_id', 'eq', userId),
    ];

    return this.findAll(filters);
  }

  /**
   * Verifica se username está disponível
   * Útil para validação de cadastro
   */
  async isUsernameAvailable(
    username: string,
    excludeProfileId?: string
  ): Promise<boolean> {
    try {
      let query = this.client
        .from(this.table)
        .select('id')
        .eq('username', username);

      if (excludeProfileId) {
        query = query.neq('id', excludeProfileId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'isUsernameAvailable', this.table);
      }

      return data === null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to check username availability: ${username}`,
        originalError: error,
        table: this.table,
        operation: 'isUsernameAvailable',
        context: { username, excludeProfileId },
      });
    }
  }

  /**
   * Busca profiles verificados
   */
  async findVerified(): Promise<Profile[]> {
    const filters: Filter[] = [
      this.createFilter('verification_status', 'eq', DATABASE_PROFILE_VERIFICATION_STATUS.VERIFIED),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca profiles pendentes de verificação
   */
  async findPendingVerification(): Promise<Profile[]> {
    const filters: Filter[] = [
      this.createFilter('verification_status', 'eq', DATABASE_PROFILE_VERIFICATION_STATUS.PENDING),
    ];

    return this.findAll(filters);
  }

  /**
   * Conta profiles por status de verificação
   */
  async countByVerificationStatus(
    status: DatabaseProfileVerificationStatus
  ): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('verification_status', 'eq', status),
    ];

    return this.count(filters);
  }

  /**
   * Busca profiles por cidade
   */
  async findByCity(city: string): Promise<Profile[]> {
    const filters: Filter[] = [
      this.createFilter('city', 'eq', city),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca profiles por bairro
   */
  async findByNeighborhood(neighborhood: string): Promise<Profile[]> {
    const filters: Filter[] = [
      this.createFilter('neighborhood', 'eq', neighborhood),
    ];

    return this.findAll(filters);
  }

}
