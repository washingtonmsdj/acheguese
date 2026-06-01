import { Badge } from "@/shared/components/ui/badge";
import type { VagaStatus } from "@/core/admin/services/AdminVagasService";

type AdminVagasStatusBadgeProps = {
  status: VagaStatus;
};

export function AdminVagasStatusBadge({ status }: AdminVagasStatusBadgeProps) {
  switch (status) {
    case "published":
      return <Badge variant="secondary">Publicada</Badge>;
    case "pending_review":
      return <Badge variant="default">Em revisão</Badge>;
    case "paused":
      return <Badge variant="outline">Pausada</Badge>;
    case "closed":
      return <Badge variant="secondary">Encerrada</Badge>;
    case "draft":
      return <Badge variant="outline">Rascunho</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejeitada</Badge>;
    case "removed":
      return <Badge variant="secondary">Removida</Badge>;
    case "expired":
      return <Badge variant="secondary">Expirada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
