import { useState } from "react";
import { Link2, QrCode, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { QrImageGenerator } from "@/core/qr";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

export default function BusinessPremiumSitePage() {
  const { business, premiumUrl, publicUrl, entitlements } = useBusinessDashboardContext();
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const isPremiumEnabled = Boolean(premiumUrl && entitlements.canUseShortPremiumLink);

  const getAbsolutePremiumUrl = (): string | null => {
    if (!premiumUrl) return null;
    return new URL(premiumUrl, window.location.origin).toString();
  };

  const handlePreview = () => {
    const url = getAbsolutePremiumUrl();
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleGenerateQr = async () => {
    const url = getAbsolutePremiumUrl();
    if (!url) return;

    setIsGeneratingQr(true);
    try {
      const dataUrl = await QrImageGenerator.generatePNG(url, {
        size: 1000,
        margin: 4,
        errorCorrectionLevel: "H",
      });
      QrImageGenerator.downloadImage(
        dataUrl,
        `qr-${business.slug || "empresa"}.png`,
      );
      toast.success("QR Code gerado e baixado.");
    } catch {
      toast.error("Não foi possível gerar o QR Code.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCopy = async () => {
    const url = getAbsolutePremiumUrl();
    if (!url) return;

    try {
      await QrImageGenerator.copyToClipboard(url);
      toast.success("Link curto copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Link premium da empresa</CardTitle>
          <CardDescription>
            Gestão do mini-site em /p/:slug, independente da vertical.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={isPremiumEnabled ? "default" : "outline"}>
              {isPremiumEnabled ? "Ativo" : "Bloqueado pelo plano"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Slug: {business.slug || "não definido"}
            </span>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Mini-site</p>
            <p className="text-muted-foreground">
              {premiumUrl || "Não disponível no plano atual"}
            </p>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Página pública comum</p>
            <p className="text-muted-foreground">
              {publicUrl || "Não disponível"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!isPremiumEnabled}
              onClick={handlePreview}
            >
              <Globe className="h-4 w-4" />
              Preview do mini-site
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!isPremiumEnabled || isGeneratingQr}
              onClick={() => void handleGenerateQr()}
            >
              {isGeneratingQr ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              {isGeneratingQr ? "Gerando..." : "Gerar QR Code"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!isPremiumEnabled}
              onClick={() => void handleCopy()}
            >
              <Link2 className="h-4 w-4" />
              Copiar link curto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
