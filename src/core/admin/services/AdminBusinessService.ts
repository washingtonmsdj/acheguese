/**
 * AdminBusinessService - Serviço de administração de negócios
 *
 * SSOT COMPLIANCE: delega leitura/mutação de domínio para BusinessService e
 * comandos administrativos sensíveis para admin-business-rpc.
 */

import { logger } from "@/shared/utils/logger";
import { invokeSupabaseBrokerCommand } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import { BusinessService } from "@/core/business/services/BusinessService";
import type {
  GrantBusinessInstitutionScopeInput,
  BusinessInstitutionScopeAdminModel,
} from "@/core/business/services/BusinessService";

export type {
  GrantBusinessInstitutionScopeInput,
  BusinessInstitutionScopeAdminModel,
} from "@/core/business/services/BusinessService";
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

type AdminBusinessRpcAction = "setVerification" | "setPremium";

async function invokeAdminBusinessRpc(
  action: AdminBusinessRpcAction,
  params: Record<string, unknown>,
): Promise<void> {
  await invokeSupabaseBrokerCommand({
    action,
    functionName: "admin-business-rpc",
    params,
    serviceName: "AdminBusinessService",
  });
}

class AdminBusinessServiceClass {
  /**
   * Busca um negócio por ID.
   * SSOT: BusinessService.
   */
  async getBusinessById(id: string): Promise<AdminBusinessData | null> {
    try {
      const business = await BusinessService.getBusinessById(id);

      if (!business) {
        return null;
      }

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
   * Atualiza os campos administrativos delegáveis de um negócio.
   * SSOT: BusinessService.
   */
  async updateBusiness(
    id: string,
    updates: Partial<AdminBusinessData>,
  ): Promise<AdminBusinessData | null> {
    try {
      const businessUpdates: Record<string, unknown> = {};

      if (updates.name) businessUpdates.name = updates.name;
      if (updates.description !== undefined) {
        businessUpdates.description = updates.description;
      }
      if (updates.category !== undefined) {
        businessUpdates.category = updates.category;
      }

      await BusinessService.updateBusiness(id, businessUpdates);
      return await this.getBusinessById(id);
    } catch (error) {
      logger.error("Error in updateBusiness:", error);
      throw error;
    }
  }

  async deleteBusiness(id: string): Promise<boolean> {
    try {
      await BusinessService.deleteBusiness(id);
      return true;
    } catch (error) {
      logger.error("Error in deleteBusiness:", error);
      throw error;
    }
  }

  async verifyBusiness(id: string): Promise<boolean> {
    try {
      await invokeAdminBusinessRpc("setVerification", {
        businessId: id,
        isVerified: true,
      });
      return true;
    } catch (error) {
      logger.error("Error in verifyBusiness:", error);
      throw error;
    }
  }

  async unverifyBusiness(id: string): Promise<boolean> {
    try {
      await invokeAdminBusinessRpc("setVerification", {
        businessId: id,
        isVerified: false,
      });
      return true;
    } catch (error) {
      logger.error("Error in unverifyBusiness:", error);
      throw error;
    }
  }

  async makePremium(id: string): Promise<boolean> {
    try {
      await invokeAdminBusinessRpc("setPremium", {
        businessId: id,
        isPremium: true,
      });
      return true;
    } catch (error) {
      logger.error("Error in makePremium:", error);
      throw error;
    }
  }

  async removePremium(id: string): Promise<boolean> {
    try {
      await invokeAdminBusinessRpc("setPremium", {
        businessId: id,
        isPremium: false,
      });
      return true;
    } catch (error) {
      logger.error("Error in removePremium:", error);
      throw error;
    }
  }

  async getBusinessClaims(status?: string) {
    try {
      return await BusinessService.getBusinessClaims(status);
    } catch (error) {
      logger.error("Error in getBusinessClaims:", error);
      return null;
    }
  }

  async updateClaimStatus(
    claimId: string,
    status: "aprovada" | "rejeitada",
    reviewNotes?: string,
  ): Promise<boolean> {
    return BusinessService.updateBusinessClaimStatus(
      claimId,
      status,
      reviewNotes,
    );
  }

  async getInstitutionScopeAdminModel(): Promise<
    BusinessInstitutionScopeAdminModel | null
  > {
    return BusinessService.getBusinessInstitutionScopeAdminModel();
  }

  async grantInstitutionScope(
    input: GrantBusinessInstitutionScopeInput,
  ): Promise<string | null> {
    return BusinessService.grantBusinessInstitutionScope(input);
  }

  async revokeInstitutionScope(
    scopeId: string,
    revocationReason: string,
  ): Promise<boolean> {
    return BusinessService.revokeBusinessInstitutionScope(
      scopeId,
      revocationReason,
    );
  }

  async getBusinessClaimDetails(businessId: string) {
    try {
      return await BusinessService.getBusinessClaimDetails(businessId);
    } catch (error) {
      logger.error("Error in getBusinessClaimDetails:", error);
      return null;
    }
  }

  async getBusinessViews(businessId: string, startDate?: string) {
    try {
      const metrics = await BusinessService.getBusinessMetrics(
        businessId,
        startDate,
      );
      return Array(metrics.totalViews).fill({ id: null, viewed_at: null });
    } catch (error) {
      logger.error("Error in getBusinessViews:", error);
      return [];
    }
  }

  async countBusinessViews(businessId: string, startDate?: string) {
    try {
      const metrics = await BusinessService.getBusinessMetrics(
        businessId,
        startDate,
      );
      return metrics.totalViews;
    } catch (error) {
      logger.error("Error in countBusinessViews:", error);
      return 0;
    }
  }

  async getBusinessReviews(businessId: string) {
    try {
      const reviews = await ReviewsService.getReviewsForProfile(
        businessId,
        "business",
      );

      return reviews.map((review) => ({ rating: review.rating }));
    } catch (error) {
      logger.error("Error fetching business reviews:", error);
      return [];
    }
  }
}

export const adminBusinessService = new AdminBusinessServiceClass();