/**
 * GastronomyCTA - Call-to-Action para página de gastronomia
 * 
 * Exibido na página de empresas quando o negócio tem perfil gastronômico
 * Direciona para a página especializada de gastronomia com cardápio completo
 */

import { Link } from "react-router-dom";
import { UtensilsCrossed, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface GastronomyCTAProps {
  gastronomyUrl: string;
  businessName: string;
}

export function GastronomyCTA({ gastronomyUrl, businessName }: GastronomyCTAProps) {
  return (
    <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Cardápio Completo Disponível
            </h3>
            <p className="text-muted-foreground mb-4">
              Veja o cardápio completo de {businessName} com fotos dos pratos, 
              preços, opções de tamanho e adicionais. Faça seu pedido de forma fácil!
            </p>
            
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={gastronomyUrl}>
                Ver Cardápio Completo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
