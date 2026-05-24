/**
 * NearbyPlacesBlock - camada secundária "o que tem por perto".
 *
 * Em produção, só exibe dados reais com localização validada.
 */

import { Compass } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

interface NearbyPlacesBlockProps {
  pointTitle: string;
  neighborhood?: string;
}

export function NearbyPlacesBlock({ pointTitle, neighborhood }: NearbyPlacesBlockProps) {
  return (
    <div className="mt-10 pt-8 border-t border-border">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">O que tem por perto</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Estabelecimentos e serviços próximos {neighborhood ? `em ${neighborhood}` : `de ${pointTitle}`}.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground flex items-start gap-2">
          <Compass className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Esta seção será exibida quando houver fonte de dados real integrada para locais próximos.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
