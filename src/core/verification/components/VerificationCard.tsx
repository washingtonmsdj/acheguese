/**
 * VerificationCard - Card de verificacao individual no painel admin.
 */
import { Check, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { PendingVerification } from "@/core/profiles/services/ProfileVerificationAdminService";

interface VerificationCardProps {
  verification: PendingVerification;
  onApprove: (profileId: string) => void;
  onReject: (profileId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  showActions?: boolean;
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
  isApproving,
  isRejecting,
  showActions = true,
}: VerificationCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={verification.avatar_url || undefined} />
            <AvatarFallback>{getInitials(verification.display_name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{verification.display_name}</h3>
                <p className="text-xs text-muted-foreground">ID: {verification.profile_id}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 flex-shrink-0">
                {verification.type}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>
                Solicitado{" "}
                {formatDistanceToNow(new Date(verification.requested_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {showActions ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(verification.profile_id)}
                  disabled={isApproving || isRejecting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(verification.profile_id)}
                  disabled={isApproving || isRejecting}
                  className="flex-1"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
              </div>
            ) : (
              <div className="text-xs text-green-600 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Verificacao aprovada
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

