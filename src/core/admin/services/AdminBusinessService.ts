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
import { ADMIN_PLACEHOLDER_IDS } from "@/core/admin/config/identifiers";
import { profileService } from "@/core/profiles/services/ProfileService";

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
   * ✅ SSOT: Usa BusinessService.updateBusiness
   */
  async verifyBusiness(id: string): Promise<boolean> {
    try {
      await BusinessService.updateBusiness(id, { is_verified: true });
      return true;
    } catch (error) {
      logger.error("Error in verifyBusiness:", error);
      throw error;
    }
  }

  /**
   * Remove verificação de um negócio
   * ✅ SSOT: Usa BusinessService.updateBusiness
   */
  async unverifyBusiness(id: string): Promise<boolean> {
    try {
      await BusinessService.updateBusiness(id, { is_verified: false });
      return true;
    } catch (error) {
      logger.error("Error in unverifyBusiness:", error);
      throw error;
    }
  }

  /**
   * Torna um negócio premium
   * ✅ SSOT: Usa BusinessService.updateBusiness
   */
  async makePremium(id: string): Promise<boolean> {
    try {
      await BusinessService.updateBusiness(id, { is_premium: true });
      return true;
    } catch (error) {
      logger.error("Error in makePremium:", error);
      throw error;
    }
  }

  /**
   * Remove status premium de um negócio
   * ✅ SSOT: Usa BusinessService.updateBusiness
   */
  async removePremium(id: string): Promise<boolean> {
    try {
      await BusinessService.updateBusiness(id, { is_premium: false });
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
   * ✅ SSOT: Usa BusinessService.updateBusinessClaimStatus
   */
  async updateClaimStatus(
    claimId: string,
    status: "aprovada" | "rejeitada",
  ): Promise<boolean> {
    return BusinessService.updateBusinessClaimStatus(claimId, status);
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
   * ✅ SSOT: Usa BusinessService.getBusinessMetrics com suporte a startDate
   */
  async getBusinessViews(businessId: string, startDate?: string) {
    try {
      const metrics = await BusinessService.getBusinessMetrics(businessId, startDate);
      return Array(metrics.totalViews).fill({ id: null, viewed_at: null });
    } catch (error) {
      logger.error("Error in getBusinessViews:", error);
      return [];
    }
  }

  /**
   * Conta visualizações de um negócio
   * ✅ SSOT: Usa BusinessService.getBusinessMetrics com suporte a startDate
   */
  async countBusinessViews(businessId: string, startDate?: string) {
    try {
      const metrics = await BusinessService.getBusinessMetrics(businessId, startDate);
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

      // 1. Criar profile usando ProfileService
      const profile = await profileService.createProfile({
        profile_type: "business",
        name: profileData.name,
        username: profileData.name.toLowerCase().replace(/\s+/g, "-"),
        city: profileData.phone || "Não informado",
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      });

      // 2. Adicionar user como owner via ProfileService.addMember
      await profileService.addMember(profile.id, userId, "owner");

      // 3. Criar business_data usando BusinessService
      await BusinessService.createBusiness({
        profile_id: profile.id,
        ...businessData,
        status: "pendente",
        neighborhood_id: ADMIN_PLACEHOLDER_IDS.EMPTY_LOCATION_ID,
      }, userId);

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
