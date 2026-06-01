import { AlertCircle, CheckCircle, Edit2, MapPin } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import type { UserResidenceWithRelations } from "@/core/residence/services/ResidenceService";

interface ResidenceSummaryCardProps {
  residence: UserResidenceWithRelations;
  localNeighborhood: string | null;
  onEdit: () => void;
  onRequestVerification: () => void;
}

export function ResidenceSummaryCard({
  residence,
  localNeighborhood,
  onEdit,
  onRequestVerification,
}: ResidenceSummaryCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Endereço</h4>
            {residence.is_verified && (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
            {!residence.is_verified && residence.verification_requested_at && (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Em análise
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <p>
              {residence.address?.street}, {residence.address?.number}
              {residence.address?.complement &&
                ` - ${residence.address.complement}`}
            </p>
            <p className="text-muted-foreground">{residence.location?.name}</p>
            {localNeighborhood ? (
              <p className="text-muted-foreground">
                Localidade informada: {localNeighborhood}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              CEP: {residence.address?.postal_code}
            </p>
          </div>

          {!residence.is_verified && !residence.verification_requested_at && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onRequestVerification}
            >
              Solicitar Verificação
            </Button>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
