import { Link2, QrCode, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

export default function BusinessPremiumSitePage() {
  const { business, premiumUrl, publicUrl, entitlements } = useBusinessDashboardContext();

  const isPremiumEnabled = Boolean(premiumUrl && entitlements.canUseShortPremiumLink);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Link premium da empresa</CardTitle>
          <CardDescription>
            Gestao do mini-site em /p/:slug, independente da vertical.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={isPremiumEnabled ? "default" : "outline"}>
              {isPremiumEnabled ? "Ativo" : "Bloqueado pelo plano"}
            </Badge>
            <span className="text-sm text-muted-foreground">Slug: {business.slug || "nao definido"}</span>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Mini-site</p>
            <p className="text-muted-foreground">{premiumUrl || "Nao disponivel no plano atual"}</p>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Pagina publica canonica</p>
            <p className="text-muted-foreground">{publicUrl || "Nao disponivel"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled={!premiumUrl}>
              <Globe className="h-4 w-4" />
              Preview do mini-site
            </Button>
            <Button variant="outline" size="sm" className="gap-2" disabled={!premiumUrl}>
              <QrCode className="h-4 w-4" />
              Gerar QR Code
            </Button>
            <Button variant="outline" size="sm" className="gap-2" disabled={!premiumUrl}>
              <Link2 className="h-4 w-4" />
              Copiar link curto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

