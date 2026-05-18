/**
 * GastronomyShareDialog — Compartilhamento rico com QR Code
 *
 * Paridade com ShareBusinessDialog do módulo de empresas.
 */

import { Copy, Download, Facebook, MessageCircle, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';

interface GastronomyShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  businessDescription: string;
  businessUrl: string;
}

export function GastronomyShareDialog({
  open,
  onOpenChange,
  businessName,
  businessDescription,
  businessUrl,
}: GastronomyShareDialogProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(businessUrl);
    toast.success('Link copiado!');
  };

  const shareWhatsApp = () => {
    const text = `Olha que legal! 🍽️\n\n*${businessName}*\n${businessDescription}\n\nConfira: ${businessUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(businessUrl)}`,
      '_blank',
    );
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('gastronomy-qr-code') as unknown as SVGElement | null;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${businessName.toLowerCase().replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar {businessName}</DialogTitle>
          <DialogDescription>
            Compartilhe este restaurante com seus amigos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <QRCodeSVG
              id="gastronomy-qr-code"
              value={businessUrl}
              size={160}
              level="M"
              includeMargin
            />
            <Button variant="outline" size="sm" onClick={downloadQRCode}>
              <Download className="mr-2 h-4 w-4" />
              Baixar QR Code
            </Button>
          </div>

          {/* Link */}
          <div className="flex gap-2">
            <Input value={businessUrl} readOnly className="text-xs" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Redes sociais */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={shareWhatsApp}
              className="gap-2 border-[#25D366]/30 hover:bg-[#25D366]/10 hover:text-[#25D366]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={shareFacebook}
              className="gap-2 border-[#1877F2]/30 hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
