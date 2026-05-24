import { Link, useParams } from "react-router-dom";
import { Percent, Plus, Tag } from "lucide-react";
import { useEntitlements } from "@/core/billing/hooks/useEntitlements";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActivePromotions } from "@/modules/business/gastronomy/hooks";
import { UpgradePromptInline } from "@/modules/business/gastronomy/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function GastronomyPromotionsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { can, isLoading } = useEntitlements({
    business_id: businessId,
    subscription_scope: "business",
  });
  const { data: promotions = [], isLoading: loadingPromotions } = useActivePromotions(businessId);

  if (!businessId || isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Carregando promoções...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!can("canUsePromotions")) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Promoções
            </CardTitle>
            <CardDescription>
              A vertical continua no contexto da empresa, mas a liberação vem do plano empresarial.
            </CardDescription>
          </CardHeader>
        </Card>
        <UpgradePromptInline
          businessId={businessId}
          feature="Promoções"
          offerKey="catalog"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Promoções da gastronomia
              </CardTitle>
              <CardDescription>
                Ofertas ativas da empresa dentro da vertical Gastronomia.
              </CardDescription>
            </div>
            <Link to={businessManagementRoutes.gastronomyCardapio(businessId)}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Vincular ao cardápio
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPromotions ? (
            <p className="text-sm text-muted-foreground">Carregando promoções...</p>
          ) : promotions.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma promoção ativa. Cadastre itens e ofertas a partir do cardápio.
            </div>
          ) : (
            promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <p className="font-medium">{promotion.title}</p>
                  </div>
                  <Badge variant="outline">Ativa</Badge>
                </div>
                {promotion.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{promotion.description}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
