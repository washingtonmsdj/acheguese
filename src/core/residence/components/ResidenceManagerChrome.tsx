import { Edit2, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

interface ResidenceManagerHeaderProps {
  hasResidence: boolean;
  onEdit: () => void;
}

export function ResidenceManagerHeader({
  hasResidence,
  onEdit,
}: ResidenceManagerHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Minha Residência</h3>
        <p className="text-sm text-muted-foreground">Onde você mora</p>
      </div>
      {hasResidence ? (
        <Button onClick={onEdit} size="sm">
          <Edit2 className="h-4 w-4 mr-2" />
          Editar
        </Button>
      ) : null}
    </div>
  );
}

interface ResidenceEmptyStateProps {
  onCreate: () => void;
}

export function ResidenceEmptyState({ onCreate }: ResidenceEmptyStateProps) {
  return (
    <Card className="p-6 text-center">
      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-4">
        Nenhuma residência cadastrada
      </p>
      <Button onClick={onCreate} variant="outline" size="sm">
        Cadastrar Residência
      </Button>
    </Card>
  );
}

interface ResidenceStatusCardProps {
  children: string;
}

export function ResidenceStatusCard({ children }: ResidenceStatusCardProps) {
  return (
    <Card className="p-6">
      <p className="text-sm text-muted-foreground">{children}</p>
    </Card>
  );
}
