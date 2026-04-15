/**
 * VerificationCard - Card de verificação individual
 */

import { Check, X, MapPin, Phone, Calendar, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PendingVerification } from "../services/VerificationService";

interface VerificationCardProps {
  verification: PendingVerification;
  onApprove: (profileId: string) => void;
  onReject: (profileId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  showActions?: boolean;
}

export function VerificationCard({
  verification,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  showActions = true,
}: VerificationCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={verification.avatar_url || undefined} />
            <AvatarFallback>{getInitials(verification.name)}</AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{verification.name}</h3>
                {verification.username && (
                  <p className="text-xs text-muted-foreground">@{verification.username}</p>
                )}
              </div>
              {verification.is_verified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 flex-shrink-0">
                  Verificado
                </span>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {verification.neighborhood}, {verification.city}
                </span>
              </div>
              {verification.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span>{verification.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>
                  Cadastrado{" "}
                  {formatDistanceToNow(new Date(verification.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            {showActions && !verification.is_verified && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(verification.id)}
                  disabled={isApproving || isRejecting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(verification.id)}
                  disabled={isApproving || isRejecting}
                  className="flex-1"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
