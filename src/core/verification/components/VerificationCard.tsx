/**
 * VerificationCard - Card de verificacao individual no painel admin.
 */
import { Check, Clock, ShieldOff, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { VerificationReviewItem } from "@/core/verification/types";

interface VerificationCardProps {
  verification: VerificationReviewItem;
  onApprove?: (verificationId: string) => void;
  onReject?: (verificationId: string) => void;
  onRevoke?: (verificationId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isRevoking?: boolean;
  showActions?: boolean;
}

function getStatusTone(status: VerificationReviewItem["status"]) {
  if (status === "approved")
    return "bg-green-500/10 text-green-600 border-green-500/20";
  if (status === "rejected")
    return "bg-red-500/10 text-red-600 border-red-500/20";
  if (status === "revoked")
    return "bg-muted text-muted-foreground border-border";
  return "bg-blue-500/10 text-blue-600 border-blue-500/20";
}

function getStatusLabel(status: VerificationReviewItem["status"]) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Rejeitado";
  if (status === "revoked") return "Revogado";
  return "Pendente";
}

function getTypeLabel(type: VerificationReviewItem["verification_type"]) {
  switch (type) {
    case "email":
      return "E-mail";
    case "phone":
      return "Telefone";
    case "document":
      return "Identidade";
    case "resident":
      return "Moradia";
    case "business":
      return "Empresa";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function VerificationCard({
  verification,
  onApprove,
  onReject,
  onRevoke,
  isApproving,
  isRejecting,
  isRevoking,
  showActions = true,
}: VerificationCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={verification.avatar_url || undefined} />
            <AvatarFallback>
              {getInitials(verification.display_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {verification.display_name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  ID: {verification.profile_id}
                </p>
                <p className="text-xs font-medium text-primary">
                  {getTypeLabel(verification.verification_type)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${getStatusTone(verification.status)}`}
              >
                {getStatusLabel(verification.status)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>
                Solicitado{" "}
                {formatDistanceToNow(new Date(verification.submitted_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {verification.reviewed_at ||
            verification.reviewed_by ||
            verification.review_reason ? (
              <div className="mb-3 rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground space-y-1">
                {verification.reviewed_at ? (
                  <p>
                    Decisao{" "}
                    {formatDistanceToNow(new Date(verification.reviewed_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                ) : null}
                <p>
                  Responsavel: {verification.reviewed_by || "Administrador"}
                </p>
                {verification.review_reason ? (
                  <p className="text-red-600">
                    Motivo: {verification.review_reason}
                  </p>
                ) : null}
              </div>
            ) : null}

            {showActions && onApprove && onReject ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(verification.id)}
                  disabled={isApproving || isRejecting || isRevoking}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(verification.id)}
                  disabled={isApproving || isRejecting || isRevoking}
                  className="flex-1"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {getStatusLabel(verification.status)}
                </div>
                {verification.status === "approved" && onRevoke ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRevoke(verification.id)}
                    disabled={isRevoking}
                  >
                    <ShieldOff className="h-3.5 w-3.5 mr-1" />
                    Revogar
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
