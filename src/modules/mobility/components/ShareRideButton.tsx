import React, { useEffect, useRef, useState } from "react";
import { Check, Clock, Copy, Eye, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { TIMEOUTS } from "@/core/mobility/constants";
import type { RideRequest } from "@/core/mobility/types";
import { useRideShare } from "@/core/safety";
import { useSessionContext } from "@/core/session";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";

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
  const { createShare } = useRideShare();
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  const handleCreateShareLink = async () => {
    if (!activeProfile?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setShareError(null);

    try {
      const result = await createShare.mutateAsync({
        rideId: ride.id,
        createdBy: activeProfile.id,
      });

      if (!result.success || !result.data) {
        setShareError(result.error || "Não foi possível criar o compartilhamento.");
        return;
      }

      setShareLink({
        id: result.data.id,
        shareToken: result.data.shareToken,
        shareUrl: result.data.shareUrl,
        expiresAt: result.data.expiresAt,
      });
    } catch (error) {
      logger.error("Erro ao criar link de compartilhamento:", error);
      setShareError("Não foi possível criar o compartilhamento.");
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink.shareUrl);
      setCopied(true);
      toast.success("Link copiado");

      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, TIMEOUTS.ANIMATION_DELAY_LONG);
    } catch (error) {
      logger.warn("Erro ao copiar link de compartilhamento:", error);
      toast.error("Erro ao copiar link");
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;

    const shareData = {
      title: "Acompanhamento de corrida",
      text: `Acompanhe os dados compartilhados desta corrida:\n${shareLink.shareUrl}`,
      url: shareLink.shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    await handleCopyLink();
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!shareLink && !createShare.isPending) {
      void handleCreateShareLink();
    }
  };

  if (variant === "compact") {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className={cn(
            "h-8 border-info/30 bg-info/10 text-xs font-semibold text-info hover:bg-info/15 hover:text-info",
            className,
          )}
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Compartilhar
        </Button>
        <ShareDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          ride={ride}
          shareLink={shareLink}
          loading={createShare.isPending}
          error={shareError}
          copied={copied}
          onCopy={handleCopyLink}
          onShare={handleShare}
          onRetry={handleCreateShareLink}
        />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        variant="outline"
        className={cn("gap-2", className)}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Compartilhar corrida
      </Button>
      <ShareDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        ride={ride}
        shareLink={shareLink}
        loading={createShare.isPending}
        error={shareError}
        copied={copied}
        onCopy={handleCopyLink}
        onShare={handleShare}
        onRetry={handleCreateShareLink}
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
  error: string | null;
  copied: boolean;
  onCopy: () => Promise<void>;
  onShare: () => Promise<void>;
  onRetry: () => Promise<void>;
}

function ShareDialog({
  open,
  onOpenChange,
  ride,
  shareLink,
  loading,
  error,
  copied,
  onCopy,
  onShare,
  onRetry,
}: ShareDialogProps) {
  const expiresAtLabel = shareLink
    ? new Date(shareLink.expiresAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-info" aria-hidden="true" />
            Compartilhar corrida
          </DialogTitle>
          <DialogDescription>
            Gere um link temporário com os dados de segurança autorizados para
            esta corrida.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="truncate text-sm font-medium">{ride.origin}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="truncate text-sm font-medium">{ride.destination}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Criando link seguro...
            </div>
          ) : shareLink ? (
            <>
              <div className="space-y-2">
                <label htmlFor="ride-share-url" className="text-sm font-medium">
                  Link de acompanhamento
                </label>
                <div className="flex gap-2">
                  <Input
                    id="ride-share-url"
                    type="text"
                    value={shareLink.shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => void onCopy()}
                    variant="outline"
                    size="icon"
                    aria-label={copied ? "Link copiado" : "Copiar link"}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Válido até {expiresAtLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Localização exibida quando autorizada e disponível</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void onShare()}
                  className="flex-1 gap-2"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Compartilhar
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                >
                  Fechar
                </Button>
              </div>

              <div className="rounded-lg border border-info/20 bg-info/10 p-3">
                <p className="text-xs text-info">
                  Este é um link temporário de acesso. Compartilhe apenas com
                  pessoas de confiança. A localização só é exposta quando as
                  regras de segurança da corrida permitem.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-foreground">
                Não foi possível criar o link
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error || "Tente novamente."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void onRetry()}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
