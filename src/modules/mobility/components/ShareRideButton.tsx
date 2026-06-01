import React, { useState } from "react";
import { Share2, Copy, Check, Clock, Eye, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { useSessionContext } from "@/core/session";
import { safetyService } from "@/core/safety";
import type { RideRequest } from "@/core/mobility/types";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";

interface ShareRideButtonProps {
  ride: RideRequest;
  variant?: "default" | "compact";
  className?: string;
}

interface ShareLink {
  id: string;
  shareToken: string;
  shareUrl: string;
  expiresAt: string;
}

export function ShareRideButton({
  ride,
  variant = "default",
  className,
}: ShareRideButtonProps) {
  const { activeProfile } = useSessionContext();
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateShareLink = async () => {
    if (!activeProfile?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      // ✅ SSOT - Criar compartilhamento via core/safety
      const result = await safetyService.createRideShare({
        rideId: ride.id,
        createdBy: activeProfile.id,
        expiresInHours: 24,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar compartilhamento');
      }

      setShareLink({
        id: result.data!.id,
        shareToken: result.data!.shareToken,
        shareUrl: result.data!.shareUrl,
        expiresAt: result.data!.expiresAt,
      });

      toast.success("Link criado com sucesso!");
    } catch (error) {
      logger.error("Erro ao criar link:", error);
      toast.error("Erro ao criar link de compartilhamento");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink.shareUrl);
      setCopied(true);
      toast.success("Link copiado!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;

    const shareData = {
      title: "Rastreamento de Corrida",
      text: `Estou em uma viagem. Acompanhe em tempo real:\n${shareLink.shareUrl}`,
      url: shareLink.shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Compartilhado com sucesso!");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!shareLink) {
      handleCreateShareLink();
    }
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all"
        >
          <Share2 className="h-3.5 w-3.5" />
          Compartilhar
        </button>
        <ShareDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          ride={ride}
          shareLink={shareLink}
          loading={loading}
          copied={copied}
          onCopy={handleCopyLink}
          onShare={handleShare}
        />
      </>
    );
  }

  return (
    <>
      <Button onClick={handleOpen} variant="outline" className="gap-2">
        <Share2 className="h-4 w-4" />
        Compartilhar Corrida
      </Button>
      <ShareDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        ride={ride}
        shareLink={shareLink}
        loading={loading}
        copied={copied}
        onCopy={handleCopyLink}
        onShare={handleShare}
      />
    </>
  );
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: RideRequest;
  shareLink: ShareLink | null;
  loading: boolean;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
}

function ShareDialog({
  open,
  onOpenChange,
  ride,
  shareLink,
  loading,
  copied,
  onCopy,
  onShare,
}: ShareDialogProps) {
  const expiresIn = shareLink
    ? Math.round(
        (new Date(shareLink.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60),
      )
    : 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-400" />
            Compartilhar Corrida
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Compartilhe esta corrida com outras pessoas
        </DialogDescription>

        <div className="space-y-4">
          {/* Ride Info */}
          <div className="p-3 rounded-xl bg-muted border border-border space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm font-medium truncate">{ride.origin}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm font-medium truncate">
                  {ride.destination}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : shareLink ? (
            <>
              {/* Share Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Link de Rastreamento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink.shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm font-mono"
                  />
                  <Button
                    onClick={onCopy}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expira em {expiresIn}h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Rastreamento em tempo real</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={onShare} className="flex-1 gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Fechar
                </Button>
              </div>

              {/* Security Note */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  🔒 Este link permite que qualquer pessoa acompanhe sua corrida
                  em tempo real. Compartilhe apenas com pessoas de confiança.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Erro ao criar link. Tente novamente.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
