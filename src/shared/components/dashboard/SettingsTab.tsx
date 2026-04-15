import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Store, Settings } from "lucide-react";

interface SettingsTabProps {
  businessId: string;
  onEditBusiness: () => void;
}

export function SettingsTab({ businessId, onEditBusiness }: SettingsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Configurações da Empresa</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie as configurações e informações da sua business.
          </p>
          <Button onClick={onEditBusiness} className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Editar Informações da Empresa
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-2">Gerenciar Membros</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione ou remova membros da equipe que podem gerenciar esta
            business.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Em breve
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
