/**
 * ProfileService - Refatorado para usar Repository Pattern
 * 
 * SSOT: Service layer desacoplado do Supabase
 * Usa ProfileRepository para todas as operações de banco
 * 
 * @version 2.0.0
 * @since Sprint 1 - Repository Pattern Refactoring
 * 
 * MIGRATION STRATEGY:
 * 1. Este arquivo coexiste com ProfileService.ts original
 * 2. Gradualmente migrar métodos para usar repository
 * 3. Quando completo, substituir ProfileService.ts
 */

import {
  ProfileRepository,
  type DatabaseProfileVerificationStatus,
  type Profile as ProfileEntity,
} from '@/core/infrastructure/database';
import { DatabaseError } from '@/core/infrastructure/database';
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { Profile, CreateProfileData, UpdateProfileData } from "./types";

function toServiceProfile(profile: ProfileEntity): Profile {
  return profile as unknown as Profile;
}

function toServiceProfiles(profiles: ProfileEntity[]): Profile[] {
  return profiles as unknown as Profile[];
}

/**
 * ProfileService refatorado usando Repository Pattern
 * 
 * Benefícios:
 * - ✅ Testável com mocks
 * - ✅ Desacoplado do Supabase
 * - ✅ Queries centralizadas no repository
 * - ✅ Tratamento de erros consistente
 */
export class ProfileServiceRefactored {
  constructor(private repo: ProfileRepository) {}

  /**
   * Busca profile por ID
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getProfileById(profileId: string): Promise<Profile | null> {
    try {
      const profile = await this.repo.findById(profileId);
      return profile ? toServiceProfile(profile) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.isNotFound()) {
          return null;
        }
      }
      
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfileById",
        metadata: { profileId },
      });
      
      throw error;
    }
  }

  /**
   * Busca profiles por IDs
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findByIds(ids);
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfilesByIds",
        metadata: { ids },
      });
      
      return [];
    }
  }

  /**
   * Busca profile por username
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getByUsername(username: string): Promise<Profile | null> {
    try {
      const profile = await this.repo.findByUsername(username);
      return profile ? toServiceProfile(profile) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.isNotFound()) {
          return null;
        }
      }
      
      trackError(error as Error, {
        component: "ProfileService",
        action: "getByUsername",
        metadata: { username },
      });
      
      throw error;
    }
  }

  /**
   * Busca profiles por user_id
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getProfilesByUserId(userId: string): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findByUserId(userId);
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfilesByUserId",
        metadata: { userId },
      });
      
      return [];
    }
  }

  /**
   * Verifica se username está disponível
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async isUsernameAvailable(
    username: string,
    excludeProfileId?: string
  ): Promise<boolean> {
    try {
      return await this.repo.isUsernameAvailable(username, excludeProfileId);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "isUsernameAvailable",
        metadata: { username, excludeProfileId },
      });
      
      return false;
    }
  }

  /**
   * Conta total de profiles
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getTotalProfilesCount(): Promise<number> {
    try {
      return await this.repo.count();
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getTotalProfilesCount",
      });
      
      return 0;
    }
  }

  /**
   * Busca profiles verificados
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getVerifiedProfiles(): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findVerified();
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getVerifiedProfiles",
      });
      
      return [];
    }
  }

  /**
   * Busca profiles pendentes de verificação
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getPendingVerificationProfiles(): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findPendingVerification();
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getPendingVerificationProfiles",
      });
      
      return [];
    }
  }

  /**
   * Conta profiles por status de verificação
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async countByVerificationStatus(
    status: DatabaseProfileVerificationStatus
  ): Promise<number> {
    try {
      return await this.repo.countByVerificationStatus(status);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "countByVerificationStatus",
        metadata: { status },
      });
      
      return 0;
    }
  }

  /**
   * Busca profiles por cidade
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getProfilesByCity(city: string): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findByCity(city);
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfilesByCity",
        metadata: { city },
      });
      
      return [];
    }
  }

  /**
   * Busca profiles por bairro
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getProfilesByNeighborhood(neighborhood: string): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findByNeighborhood(neighborhood);
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getProfilesByNeighborhood",
        metadata: { neighborhood },
      });
      
      return [];
    }
  }

  /**
   * Busca ranking de profiles por pontos
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async getRanking(limit: number = 50): Promise<Profile[]> {
    try {
      const profiles = await this.repo.findTopByPoints(limit);
      return toServiceProfiles(profiles);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getRanking",
        metadata: { limit },
      });
      
      return [];
    }
  }

  /**
   * Incrementa pontos de um profile
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async incrementPoints(profileId: string, points: number): Promise<Profile> {
    try {
      const profile = await this.repo.incrementPoints(profileId, points);
      return toServiceProfile(profile);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "incrementPoints",
        metadata: { profileId, points },
      });
      
      throw error;
    }
  }

  /**
   * Cria um novo profile
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async createProfile(data: CreateProfileData): Promise<Profile> {
    try {
      const profile = await this.repo.create(data as any);
      return toServiceProfile(profile);
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.isDuplicate()) {
          throw new Error('Username already exists');
        }
      }
      
      trackError(error as Error, {
        component: "ProfileService",
        action: "createProfile",
        metadata: { data },
      });
      
      throw error;
    }
  }

  /**
   * Atualiza um profile
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async updateProfile(
    profileId: string,
    updates: UpdateProfileData
  ): Promise<Profile> {
    try {
      const profile = await this.repo.update(profileId, updates as any);
      return toServiceProfile(profile);
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.isNotFound()) {
          throw new Error('Profile not found');
        }
        if (error.isDuplicate()) {
          throw new Error('Username already exists');
        }
      }
      
      trackError(error as Error, {
        component: "ProfileService",
        action: "updateProfile",
        metadata: { profileId, updates },
      });
      
      throw error;
    }
  }

  /**
   * Deleta um profile
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async deleteProfile(profileId: string): Promise<void> {
    try {
      await this.repo.delete(profileId);
    } catch (error) {
      if (error instanceof DatabaseError) {
        if (error.isNotFound()) {
          // Já deletado, ignorar
          return;
        }
      }
      
      trackError(error as Error, {
        component: "ProfileService",
        action: "deleteProfile",
        metadata: { profileId },
      });
      
      throw error;
    }
  }

  /**
   * Verifica se profile existe
   * ANTES: Query direta no Supabase
   * DEPOIS: Usa repository
   */
  async profileExists(profileId: string): Promise<boolean> {
    try {
      return await this.repo.exists(profileId);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "profileExists",
        metadata: { profileId },
      });
      
      return false;
    }
  }
}

/**
 * Instância singleton do service refatorado
 * Usa ProfileRepository
 */
export const profileServiceRefactored = new ProfileServiceRefactored(
  new ProfileRepository()
);
