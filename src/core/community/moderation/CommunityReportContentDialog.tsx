import { useSessionContext } from "@/core/session";
import { toast } from "sonner";

import { ReportReasonDialog } from "@/core/moderation/components/ReportReasonDialog";
import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  type CommunityReportReason,
} from "@/core/moderation/reportReasons";
import {
  communityReportService,
  type CommunityReportTargetType,
} from "./CommunityReportService";

interface CommunityReportContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string | null;
  targetType: CommunityReportTargetType;
}

const TARGET_LABELS: Record<CommunityReportTargetType, string> = {
  post: "publicacao",
  comment: "comentario",
  profile: "perfil",
  lost_found_post: "anuncio de achado ou perdido",
  lost_found_comment: "comentario de achado ou perdido",
  question: "pergunta",
  answer: "resposta",
};

export function CommunityReportContentDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
}: CommunityReportContentDialogProps) {
  const { activeProfile } = useSessionContext();

  const handleSubmit = async (
    reason: CommunityReportReason,
    details?: string,
  ) => {
    if (!targetId || !activeProfile) {
      throw new Error("Perfil ativo obrigatorio para denunciar");
    }

    try {
      await communityReportService.report({
        targetType,
        targetId,
        reason,
        details,
      });
      toast.success("Denuncia enviada para moderacao");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar denuncia",
      );
      throw error;
    }
  };

  return (
    <ReportReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      contentLabel={TARGET_LABELS[targetType]}
      reasonOptions={COMMUNITY_REPORT_REASON_OPTIONS}
      onSubmit={handleSubmit}
    />
  );
}
