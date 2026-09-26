import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Settings, ArrowRight } from "lucide-react";

interface SettingsTabProps {
  onEditBusiness?: () => void;
}

export function SettingsTab({ onEditBusiness }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações da empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Atualize os dados públicos, contatos e informações exibidas da sua empresa.
        </p>
        {onEditBusiness && (
          <Button onClick={onEditBusiness} className="gap-2">
            Editar dados da empresa
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
