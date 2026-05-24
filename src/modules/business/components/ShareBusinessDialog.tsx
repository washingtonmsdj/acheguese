import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Download,
  Facebook,
  Instagram,
  MessageCircle,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
interface ShareBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  businessDescription: string;
  businessUrl: string;
}

export default function ShareBusinessDialog({
  open,
  onOpenChange,
  businessName,
  businessDescription,
  businessUrl,
}: ShareBusinessDialogProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(businessUrl);
    toast.success("Link copiado!");
  };

  const shareWhatsApp = () => {
    const text = `Olha que legal!\n\n*${businessName}*\n${businessDescription}\n\nConfira: ${businessUrl}`;
    openSafeExternalUrl(`https://wa.me/?text=${encodeURIComponent(text)}`, {
      context: "business-share-whatsapp",
    });
  };

  const shareFacebook = () => {
    openSafeExternalUrl(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(businessUrl)}`,
      { context: "business-share-facebook" },
    );
  };

  const shareInstagram = () => {
    // Instagram não tem API de compartilhamento direto, então copiamos o link
    navigator.clipboard.writeText(businessUrl);
    toast.success("Link copiado! Cole na bio ou stories do Instagram.");
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg") as unknown as SVGElement | null;
    if (!svg) {
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qrcode-${businessName.toLowerCase().replace(/\s+/g, "-")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast.success("QR Code baixado! 📥");
    };

    img.src = `date:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: businessName,
        text: businessDescription,
        url: businessUrl,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Compartilhar {businessName}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Compartilhe esta empresa com outras pessoas
        </DialogDescription>

        <div className="space-y-6">
          {/* Link para copiar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Link da página</label>
            <div className="flex gap-2">
              <Input value={businessUrl} readOnly className="flex-1" />
              <Button onClick={copyLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botões de compartilhamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Compartilhar em</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareWhatsApp}
                variant="outline"
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              <Button
                onClick={shareFacebook}
                variant="outline"
                className="gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                onClick={shareInstagram}
                variant="outline"
                className="gap-2"
              >
                <Instagram className="h-4 w-4 text-pink-600" />
                Instagram
              </Button>
              {navigator.share && (
                <Button
                  onClick={shareNative}
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Mais opções
                </Button>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">QR Code</label>
            <div className="flex flex-col items-center gap-3 p-4 bg-muted rounded-lg">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={businessUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Imprima e cole na sua loja para clientes escanearem
              </p>
              <Button
                onClick={downloadQRCode}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar QR Code
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
