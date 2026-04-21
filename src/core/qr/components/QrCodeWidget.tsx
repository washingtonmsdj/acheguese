/**
 * QR CODE WIDGET — Widget de QR Code para dashboard
 *
 * SSOT: Componente central para exibir e gerenciar QR Code
 * 
 * FASE 6 - P2: Style de QR Code resolvido via EntitlementsService
 * - Usa EntitlementsService.getQrStyleVariant(planTier) para determinar estilo
 * - planTier vem de useBusinessSubscription que consulta backend
 * - Aceitável para P2 (baixo risco - apenas visual)
 * - TODO futuro: Migrar para useEntitlements() com cache React Query
 * 
 * Uso:
 * ```tsx
 * <QrCodeWidget
 *   entityType="business"
 *   entityId={businessId}
 *   canonicalUrl={canonicalUrl}
 *   ownerProfileId={profileId}
 * />
 * ```
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { toast } from 'sonner';
import {
  QrCode as QrCodeIcon,
  Download,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useQrCode } from '../hooks/useQrCode';
import { QrImageGenerator } from '../QrImageGenerator';
import { useBusinessSubscription, EntitlementsService } from '@/core/billing';
import type { QrEntityType, QrStyleVariant, QrDestinationVariant } from '../types';
// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface QrCodeWidgetProps {
  entityType: QrEntityType;
  entityId: string;
  canonicalUrl: string;
  ownerProfileId: string;
  businessId?: string; // Para buscar entitlements
  shortUrl?: string;
  styleVariant?: QrStyleVariant;
  destinationVariant?: QrDestinationVariant;
  title?: string;
  description?: string;
  showAnalytics?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export function QrCodeWidget({
  entityType,
  entityId,
  canonicalUrl,
  ownerProfileId,
  businessId,
  shortUrl,
  styleVariant = 'basic',
  destinationVariant = 'canonical',
  title = 'QR Code',
  description,
  showAnalytics = true,
}: QrCodeWidgetProps) {
  
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Buscar entitlements sempre (hook não pode ser condicional)
  // Se businessId não fornecido, passa string vazia e ignora resultado
  const subscriptionResult = useBusinessSubscription(businessId || '');
  const { entitlements, planTier, isLoading: isLoadingSubscription } = businessId 
    ? subscriptionResult
    : { entitlements: null, planTier: 'free' as const, isLoading: false };
  
  // Determinar estilo baseado no plano usando EntitlementsService
  const effectiveStyleVariant = entitlements
    ? EntitlementsService.getQrStyleVariant(planTier)
    : styleVariant;
  
  // Determinar permissões via entitlements
  const canDownloadSVG = entitlements?.canUseCustomQRCode ?? true;
  const canRegenerate = entitlements?.canUseCustomQRCode ?? true;
  const canViewAnalytics = entitlements?.canUseBasicAnalytics ?? showAnalytics;
  const shouldShowUpsell = entitlements && !entitlements.canUseCustomQRCode;
  
  const {
    qrCode,
    qrUrl,
    analytics,
    isLoading,
    isCreating,
    isRegenerating,
    isToggling,
    hasQrCode,
    isActive,
    totalScans,
    create,
    regenerate,
    activate,
    deactivate,
  } = useQrCode({
    entityType,
    entityId,
    ownerProfileId,
    canonicalUrl,
    shortUrl,
    styleVariant: effectiveStyleVariant,
    destinationVariant,
  });
  
  // ────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Gera imagem do QR Code quando disponível
   */
  useEffect(() => {
    if (qrUrl && !qrImageUrl) {
      generateQrImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrUrl]);
  
  // ────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Gera imagem do QR Code
   */
  const generateQrImage = async () => {
    if (!qrUrl) return;
    
    setIsGeneratingImage(true);
    try {
      const dataUrl = await QrImageGenerator.generatePNG(qrUrl, {
        size: 300,
        margin: 4,
        errorCorrectionLevel: 'M',
      });
      setQrImageUrl(dataUrl);
    } catch (error) {
      logger.error('Erro ao gerar imagem QR:', error);
      toast.error('Erro ao gerar imagem do QR Code');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  /**
   * Cria QR Code
   */
  const handleCreate = async () => {
    try {
      await create();
      toast.success('QR Code criado com sucesso!');
    } catch (error) {
      logger.error('Erro ao criar QR Code:', error);
    }
  };
  
  /**
   * Regenera token
   */
  const handleRegenerate = async () => {
    try {
      await regenerate();
      setQrImageUrl(null); // Força regeneração da imagem
      toast.success('Token regenerado! QR Code atualizado.');
    } catch (error) {
      logger.error('Erro ao regenerar token:', error);
    }
  };
  
  /**
   * Toggle ativo/inativo
   */
  const handleToggleActive = async () => {
    try {
      if (isActive) {
        await deactivate();
      } else {
        await activate();
      }
    } catch (error) {
      logger.error('Erro ao alterar status:', error);
    }
  };
  
  /**
   * Download PNG
   */
  const handleDownloadPNG = async () => {
    if (!qrUrl) return;
    
    try {
      const dataUrl = await QrImageGenerator.generatePNG(qrUrl, {
        size: 1000, // Alta resolução para impressão
        margin: 4,
        errorCorrectionLevel: 'H',
      });
      
      QrImageGenerator.downloadImage(dataUrl, `qr-code-${entityType}-${entityId}.png`);
      toast.success('QR Code baixado!');
    } catch (error) {
      logger.error('Erro ao baixar PNG:', error);
      toast.error('Erro ao baixar imagem');
    }
  };
  
  /**
   * Download SVG
   */
  const handleDownloadSVG = async () => {
    if (!qrUrl) return;
    
    if (!canDownloadSVG) {
      toast.error('Upgrade para Pro para baixar SVG', {
        description: 'Plano Free permite apenas PNG',
      });
      return;
    }
    
    try {
      const svg = await QrImageGenerator.generateSVG(qrUrl, {
        size: 1000,
        margin: 4,
        errorCorrectionLevel: 'H',
      });
      
      QrImageGenerator.downloadSVG(svg, `qr-code-${entityType}-${entityId}.svg`);
      toast.success('QR Code SVG baixado!');
    } catch (error) {
      logger.error('Erro ao baixar SVG:', error);
      toast.error('Erro ao baixar SVG');
    }
  };
  
  /**
   * Copia link
   */
  const handleCopyLink = async () => {
    if (!qrUrl) return;
    
    try {
      await QrImageGenerator.copyToClipboard(qrUrl);
      toast.success('Link copiado!');
    } catch (error) {
      logger.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar link');
    }
  };
  
  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  
  if (isLoading || isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Sem QR Code
  if (!hasQrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <QrCodeIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum QR Code criado ainda
            </p>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar QR Code'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Com QR Code
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* QR Code Image */}
        <div className="flex justify-center p-4 bg-white rounded-lg border">
          {isGeneratingImage ? (
            <Skeleton className="h-[300px] w-[300px]" />
          ) : qrImageUrl ? (
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-[300px] h-[300px]"
            />
          ) : (
            <div className="h-[300px] w-[300px] flex items-center justify-center text-muted-foreground">
              Gerando QR Code...
            </div>
          )}
        </div>
        
        {/* URL */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Link do QR Code:</p>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm overflow-x-auto">
              {qrUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Analytics */}
        {canViewAnalytics && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total de Scans</p>
              <p className="text-2xl font-bold">{totalScans}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scans Únicos</p>
              <p className="text-2xl font-bold">{analytics?.unique_scans || 0}</p>
            </div>
          </div>
        )}
        
        {/* Upsell para Free */}
        {shouldShowUpsell && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Upgrade para Pro</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Desbloqueie analytics, QR personalizado e download SVG
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPNG}
              disabled={!qrImageUrl}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Baixar PNG
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadSVG}
              disabled={!qrUrl || !canDownloadSVG}
              title={!canDownloadSVG ? 'Upgrade para Pro' : ''}
            >
              <FileCode className="h-4 w-4 mr-2" />
              {canDownloadSVG ? 'Baixar SVG' : 'SVG (Pro)'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating || !canRegenerate}
              title={!canRegenerate ? 'Upgrade para Pro' : ''}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRegenerating ? 'Regenerando...' : canRegenerate ? 'Regenerar' : 'Regenerar (Pro)'}
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {isActive ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Desativar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Ativar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
