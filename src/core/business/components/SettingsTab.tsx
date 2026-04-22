import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Settings, ArrowRight } from "lucide-react";

interface SettingsTabProps {
  businessId: string;
  onEditBusiness?: () => void;
}

export function SettingsTab({ businessId, onEditBusiness }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuracoes da Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          A edicao detalhada desta empresa esta centralizada no fluxo canonico de
          edicao.
        </p>
        <p className="text-xs text-muted-foreground">Empresa: {businessId}</p>
        {onEditBusiness && (
          <Button onClick={onEditBusiness} className="gap-2">
            Ir para edicao completa
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
