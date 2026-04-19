/**
 * VerificationService - SSOT para verificações de perfil
 *
 * Responsável por gerenciar:
 * - Verificações de email, telefone, documentos
 * - Verificação de morador
 * - Verificação de negócios
 *
 * Arquitetura: Component → Hook → VerificationService → Supabase
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

export type VerificationType =
  | "email"
  | "phone"
  | "document"
  | "resident"
  | "business";

export interface Verification {
  id: string;
  profile_id: string;
  verified: boolean;
  verification_type: VerificationType;
  verified_at: string | null;
  verified_by: string | null;
  document_url: string | null;
  document_type: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVerificationParams {
  profile_id: string;
  verification_type: VerificationType;
  document_url?: string;
  document_type?: string;
  notes?: string;
}

export interface ApproveVerificationParams {
  profile_id: string;
  verification_type: VerificationType;
  verified_by: string;
  notes?: string;
}

export interface RejectVerificationParams {
  profile_id: string;
  verification_type: VerificationType;
  rejection_reason: string;
  verified_by: string;
}

/**
 * Serviço de Verificações - SSOT
 */
export class VerificationService {
  /**
   * Busca todas as verificações de um perfil
   */
  static async getProfileVerifications(
    profileId: string,
  ): Promise<Verification[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("verification")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "VerificationService",
        action: "getProfileVerifications",
        metadata: { profileId },
      });
      return [];
    }
  }

  /**
   * Busca uma verificação específica
   */
  static async getVerification(
    profileId: string,
    verificationType: VerificationType,
  ): Promise<Verification | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("verification")
        .select("*")
        .eq("profile_id", profileId)
        .eq("verification_type", verificationType)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "VerificationService",
        action: "getVerification",
        metadata: { profileId, verificationType },
      });
      return null;
    }
  }

  /**
   * Verifica se um perfil tem uma verificação específica aprovada
   */
  static async isVerified(
    profileId: string,
    verificationType: VerificationType,
  ): Promise<boolean> {
    try {
      const verification = await this.getVerification(
        profileId,
        verificationType,
      );
      return verification?.verified || false;
    } catch (error) {
      trackError(error as Error, {
        component: "VerificationService",
        action: "isVerified",
        metadata: { profileId, verificationType },
      });
      return false;
    }
  }

  /**
   * Cria uma solicitação de verificação
   */
  static async createVerificationRequest(
    params: CreateVerificationParams,
  ): Promise<{
    success: boolean;
    verification?: Verification;
    error?: string;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from("verification")
        .insert({
          profile_id: params.profile_id,
          verification_type: params.verification_type,
          document_url: params.document_url || null,
          document_type: params.document_type || null,
          notes: params.notes || null,
          verified: false,
        })
        .select()
        .single();

      if (error) {
        // Se já existe, retornar a existente
        if (error.code === "23505") {
          const existing = await this.getVerification(
            params.profile_id,
            params.verification_type,
          );
          return { success: true, verification: existing || undefined };
        }
        throw error;
      }

      logger.info("Verification request created", {
        profileId: params.profile_id,
        type: params.verification_type,
      });

      return { success: true, verification: data };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "VerificationService",
        action: "createVerificationRequest",
        metadata: { ...params },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Aprova uma verificação (admin)
   */
  static async approveVerification(
    params: ApproveVerificationParams,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("verification")
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: params.verified_by,
          notes: params.notes || null,
          rejection_reason: null,
        })
        .eq("profile_id", params.profile_id)
        .eq("verification_type", params.verification_type);

      if (error) throw error;

      logger.info("Verification approved", {
        profileId: params.profile_id,
        type: params.verification_type,
        by: params.verified_by,
      });

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "VerificationService",
        action: "approveVerification",
        metadata: { ...params },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Rejeita uma verificação (admin)
   */
  static async rejectVerification(
    params: RejectVerificationParams,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("verification")
        .update({
          verified: false,
          verified_at: null,
          verified_by: params.verified_by,
          rejection_reason: params.rejection_reason,
        })
        .eq("profile_id", params.profile_id)
        .eq("verification_type", params.verification_type);

      if (error) throw error;

      logger.info("Verification rejected", {
        profileId: params.profile_id,
        type: params.verification_type,
        by: params.verified_by,
        reason: params.rejection_reason,
      });

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "VerificationService",
        action: "rejectVerification",
        metadata: { ...params },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Lista todas as verificações pendentes (admin)
   */
  static async getPendingVerifications(
    verificationType?: VerificationType,
  ): Promise<Verification[]> {
    try {
      let query = (supabase as any)
        .from("verification")
        .select("*")
        .eq("verified", false)
        .is("rejection_reason", null)
        .order("created_at", { ascending: true });

      if (verificationType) {
        query = query.eq("verification_type", verificationType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "VerificationService",
        action: "getPendingVerifications",
        metadata: { verificationType },
      });
      return [];
    }
  }

  /**
   * Busca estatísticas de verificações (admin)
   */
  static async getVerificationStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    by_type: Record<VerificationType, number>;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from("verification")
        .select("verified, verification_type, rejection_reason");

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        verified: data?.filter((v) => v.verified).length || 0,
        pending:
          data?.filter((v) => !v.verified && !v.rejection_reason).length || 0,
        rejected: data?.filter((v) => v.rejection_reason).length || 0,
        by_type: {} as Record<VerificationType, number>,
      };

      // Contar por tipo
      data?.forEach((v) => {
        const type = v.verification_type as VerificationType;
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      trackError(error as Error, {
        component: "VerificationService",
        action: "getVerificationStats",
      });
      return {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0,
        by_type: {} as Record<VerificationType, number>,
      };
    }
  }

  /**
   * Remove uma verificação
   */
  static async deleteVerification(
    profileId: string,
    verificationType: VerificationType,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("verification")
        .delete()
        .eq("profile_id", profileId)
        .eq("verification_type", verificationType);

      if (error) throw error;

      logger.info("Verification deleted", { profileId, verificationType });
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "VerificationService",
        action: "deleteVerification",
        metadata: { profileId, verificationType },
      });
      return { success: false, error: err.message };
    }
  }
}

// Export singleton
export const verificationService = VerificationService;
