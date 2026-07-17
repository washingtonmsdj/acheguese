import { z } from "zod";

import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  isReportReason,
  type CommunityReportReason,
} from "@/core/moderation/reportReasons";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export const COMMUNITY_REPORT_TARGET_TYPES = [
  "post",
  "comment",
  "profile",
  "lost_found_post",
  "lost_found_comment",
  "question",
  "answer",
] as const;

export type CommunityReportTargetType =
  (typeof COMMUNITY_REPORT_TARGET_TYPES)[number];

export interface CommunityReportInput {
  targetType: CommunityReportTargetType;
  targetId: string;
  reason: CommunityReportReason;
  details?: string;
}

const reportInputSchema = z
  .object({
    targetType: z.enum(COMMUNITY_REPORT_TARGET_TYPES),
    targetId: z.string().uuid(),
    reason: z
      .string()
      .refine(
        (reason) => isReportReason(COMMUNITY_REPORT_REASON_OPTIONS, reason),
        "invalid_community_report_reason",
      ),
    details: z.string().trim().max(2000).optional(),
  })
  .strict();

type SupabaseErrorLike = {
  message?: string;
  code?: string;
};

function toPublicReportError(error: SupabaseErrorLike): Error {
  switch (error.code) {
    case "23505":
      return new Error("Voce ja enviou uma denuncia para este conteudo.");
    case "P0001":
      return new Error("Limite diario de denuncias atingido.");
    case "42501":
      return new Error("Seu perfil nao pode denunciar este conteudo.");
    case "22023":
      return new Error("Os dados da denuncia sao invalidos.");
    default:
      return new Error("Nao foi possivel enviar a denuncia.");
  }
}

class CommunityReportService {
  async report(input: CommunityReportInput): Promise<void> {
    const parsed = reportInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Os dados da denuncia sao invalidos.");
    }

    const { error } = await supabase.from("community_reports").insert({
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId,
      reason: parsed.data.reason,
      description: parsed.data.details || null,
    });

    if (error) {
      logger.error("CommunityReportService.report", error, {
        targetType: parsed.data.targetType,
        errorCode: error.code,
      });
      throw toPublicReportError(error);
    }
  }
}

export const communityReportService = new CommunityReportService();
