/**
 * AdminBusinessService - Serviço de administração de negócios
 *
 * ✅ SSOT COMPLIANCE: Delega para BusinessService
 * Este serviço encapsula operações administrativas de negócios,
 * delegando para o BusinessService (SSOT) sempre que possível.
 */

import { logger } from "@/shared/utils/logger";
import { BusinessService } from "@/core/business/services/BusinessService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";

export interface AdminBusinessData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  owner_profile_id: string;
  is_verified: boolean;
  is_premium: boolean;
  rating?: number;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
}

class AdminBusinessServiceClass {
  /**
   * Busca todos os negócios
   * ✅ SSOT: Delega para BusinessService
   */
  async getAllBusinesses(): Promise<AdminBusinessData[]> {
    try {
      // Usar BusinessService.getBusinesses sem filtros para obter todos
      const businesses = await BusinessService.getBusinesses({});

      // Mapear para AdminBusinessData
      return businesses.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        category: b.category,
        owner_profile_id: b.profile_id,
        is_verified: b.is_verified || false,
        is_premium: b.is_premium || false,
        rating: b.rating,
        total_reviews: b.total_reviews,
        created_at: b.created_at,
        updated_at: b.updated_at,
      }));
    } catch (error) {
      logger.error("Error in getAllBusinesses:", error);
      throw error;
    }
  }

  /**
   * Busca um negócio por ID
   * ✅ SSOT: Usa BusinessService
   */
  async getBusinessById(id: string): Promise<AdminBusinessData | null> {
    try {
      const business = await BusinessService.getBusinessById(id);
      
      if (!business) {
        return null;
      }

      // Mapear para AdminBusinessData
      return {
        id: business.id,
        name: business.name,
        description: business.description,
        category: business.category,
        owner_profile_id: business.profile_id,
        is_verified: business.is_verified || false,
        is_premium: business.is_premium || false,
        rating: business.rating,
        total_reviews: business.total_reviews,
        created_at: business.created_at,
        updated_at: business.updated_at,
      };
    } catch (error) {
      logger.error("Error in getBusinessById:", error);
      throw error;
    }
  }

  /**
   * Atualiza um negócio
   * ✅ SSOT: Usa BusinessService
   */
  async updateBusiness(
    id: string,
    updates: Partial<AdminBusinessData>,
  ): Promise<AdminBusinessData | null> {
    try {
      // Mapear AdminBusinessData para formato do BusinessService
      const businessUpdates: Record<string, any> = {};
      
      if (updates.name) businessUpdates.name = updates.name;
      if (updates.description !== undefined) businessUpdates.description = updates.description;
      if (updates.category !== undefined) businessUpdates.category = updates.category;

      await BusinessService.updateBusiness(id, businessUpdates);
      
      // Retornar dados atualizados
      return await this.getBusinessById(id);
    } catch (error) {
      logger.error("Error in updateBusiness:", error);
      throw error;
    }
  }

  /**
   * Deleta um negócio
   * ✅ SSOT: Usa BusinessService
   */
  async deleteBusiness(id: string): Promise<boolean> {
    try {
      await BusinessService.deleteBusiness(id);
      return true;
    } catch (error) {
      logger.error("Error in deleteBusiness:", error);
      throw error;
    }
  }

  /**
   * Verifica um negócio
   * ⚠️ TODO: Adicionar is_verified ao BusinessInput quando implementado no schema
   */
  async verifyBusiness(id: string): Promise<boolean> {
    try {
      // Temporariamente usar query direta até is_verified ser adicionado ao BusinessInput
      const { supabase } = await import("@/integrations/supabase");
      const { error } = await supabase
        .from("business_data")
        .update({ is_verified: true })
        .eq("profile_id", id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in verifyBusiness:", error);
      throw error;
    }
  }

  /**
   * Remove verificação de um negócio
   * ⚠️ TODO: Adicionar is_verified ao BusinessInput quando implementado no schema
   */
  async unverifyBusiness(id: string): Promise<boolean> {
    try {
      // Temporariamente usar query direta até is_verified ser adicionado ao BusinessInput
      const { supabase } = await import("@/integrations/supabase");
      const { error } = await supabase
        .from("business_data")
        .update({ is_verified: false })
        .eq("profile_id", id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in unverifyBusiness:", error);
      throw error;
    }
  }

  /**
   * Torna um negócio premium
   * ⚠️ TODO: Adicionar is_premium ao BusinessInput quando implementado no schema
   */
  async makePremium(id: string): Promise<boolean> {
    try {
      // Temporariamente usar query direta até is_premium ser adicionado ao BusinessInput
      const { supabase } = await import("@/integrations/supabase");
      const { error } = await supabase
        .from("business_data")
        .update({ is_premium: true })
        .eq("profile_id", id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in makePremium:", error);
      throw error;
    }
  }

  /**
   * Remove status premium de um negócio
   * ⚠️ TODO: Adicionar is_premium ao BusinessInput quando implementado no schema
   */
  async removePremium(id: string): Promise<boolean> {
    try {
      // Temporariamente usar query direta até is_premium ser adicionado ao BusinessInput
      const { supabase } = await import("@/integrations/supabase");
      const { error } = await supabase
        .from("business_data")
        .update({ is_premium: false })
        .eq("profile_id", id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in removePremium:", error);
      throw error;
    }
  }

  /**
   * Busca reivindicações de negócios
   * ✅ SSOT: Usa BusinessService
   */
  async getBusinessClaims(status?: string) {
    try {
      return await BusinessService.getBusinessClaims(status);
    } catch (error) {
      logger.error("Error in getBusinessClaims:", error);
      return null;
    }
  }

  /**
   * Atualiza o status de uma reivindicação
   * ⚠️ TODO: Mover para BusinessService quando implementar ClaimService
   * Por enquanto mantém query direta mas documentada
   */
  async updateClaimStatus(
    claimId: string,
    status: "aprovada" | "rejeitada",
  ): Promise<boolean> {
    try {
      const { supabase } = await import("@/integrations/supabase");
      const { error } = await supabase
        .from("business_claims")
        .update({ status, resolved_at: new Date().toISOString() })
        .eq("id", claimId);

      if (error) {
        logger.error("Error updating claim status:", error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error("Error in updateClaimStatus:", error);
      return false;
    }
  }

  /**
   * Busca detalhes de um negócio para reivindicação (nome + slug para URL)
   * ✅ SSOT: Usa BusinessService
   */
  async getBusinessClaimDetails(businessId: string) {
    try {
      return await BusinessService.getBusinessClaimDetails(businessId);
    } catch (error) {
      logger.error("Error in getBusinessClaimDetails:", error);
      return null;
    }
  }

  /**
   * Busca visualizações de um negócio
   * ✅ SSOT: Usa BusinessService.getBusinessMetrics
   */
  async getBusinessViews(businessId: string, startDate?: string) {
    try {
      const metrics = await BusinessService.getBusinessMetrics(businessId);
      
      // Se precisar filtrar por data, usar query direta temporariamente
      // TODO: Adicionar suporte a filtro de data no BusinessService.getBusinessMetrics
      if (startDate) {
        const { supabase } = await import("@/integrations/supabase");
        const { data, error } = await supabase
          .from("business_views")
          .select("id, viewed_at")
          .eq("business_id", businessId)
          .gte("viewed_at", startDate)
          .order("viewed_at", { ascending: true });

        if (error) {
          logger.error("Error fetching business views:", error);
          return [];
        }
        return data || [];
      }

      // Retornar contagem de views do metrics
      return Array(metrics.totalViews).fill({ id: null, viewed_at: null });
    } catch (error) {
      logger.error("Error in getBusinessViews:", error);
      return [];
    }
  }

  /**
   * Conta visualizações de um negócio
   * ✅ SSOT: Usa BusinessService.getBusinessMetrics
   */
  async countBusinessViews(businessId: string, startDate?: string) {
    try {
      const metrics = await BusinessService.getBusinessMetrics(businessId);
      
      // Se precisar filtrar por data, usar query direta temporariamente
      // TODO: Adicionar suporte a filtro de data no BusinessService.getBusinessMetrics
      if (startDate) {
        const { supabase } = await import("@/integrations/supabase");
        const { count, error } = await supabase
          .from("business_views")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .gte("viewed_at", startDate);

        if (error) {
          logger.error("Error counting business views:", error);
          return 0;
        }
        return count || 0;
      }

      return metrics.totalViews;
    } catch (error) {
      logger.error("Error in countBusinessViews:", error);
      return 0;
    }
  }

  /**
   * Busca avaliações de um negócio
   */
  async getBusinessReviews(businessId: string) {
    try {
      const reviews = await ReviewsService.getReviewsForProfile(
        businessId,
        "business",
      );

      return reviews.map((r) => ({ rating: r.rating }));
    } catch (error) {
      logger.error("Error fetching business reviews:", error);
      return [];
    }
  }

  /**
   * Cria um novo profile de negócio
   * ✅ SSOT: Usa ProfileService e BusinessService
   */
  async createBusinessProfile(
    profileData: any,
    businessData: any,
    userId: string,
  ) {
    try {
      // ✅ SSOT - Usar ProfileService
      const { profileService } = await import("@/core/profiles/services/ProfileService");

      // 1. Criar profile usando ProfileService
      const profile = await profileService.createProfile({
        profile_type: "business",
        name: profileData.name,
        username: profileData.name.toLowerCase().replace(/\s+/g, "-"),
        city: profileData.phone || "Não informado",
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      });

      // 2. Adicionar user como owner em profile_members
      // ⚠️ TODO: Mover para ProfileService.addMember quando implementado
      const { supabase } = await import("@/integrations/supabase");
      const { error: memberError } = await supabase
        .from("profile_members")
        .insert({
          profile_id: profile.id,
          user_id: userId,
          role: "owner",
        });

      if (memberError) {
        logger.error("Error adding owner:", memberError);
        throw memberError;
      }

      // 3. Criar business_data usando BusinessService
      await BusinessService.createBusiness({
        profile_id: profile.id,
        ...businessData,
        status: "pendente",
        neighborhood_id: "00000000-0000-0000-0000-000000000000",
      });

      return profile;
    } catch (error) {
      logger.error("Error in createBusinessProfile:", error);
      throw error;
    }
  }

  /**
   * Atualiza um business profile
   * ✅ SSOT: Usa BusinessService
   */
  async updateBusinessProfile(profileId: string, businessData: any) {
    try {
      await BusinessService.updateBusiness(profileId, businessData);
      return true;
    } catch (error) {
      logger.error("Error in updateBusinessProfile:", error);
      throw error;
    }
  }
}

export const adminBusinessService = new AdminBusinessServiceClass();
