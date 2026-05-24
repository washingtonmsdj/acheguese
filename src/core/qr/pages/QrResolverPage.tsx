/**
 * QR RESOLVER PAGE — Página de resolução de QR Code
 *
 * Rota: /q/:token
 * 
 * Responsabilidades:
 * 1. Resolver token para URL
 * 2. Registrar scan
 * 3. Redirecionar para destino
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QrCodeService } from '../QrCodeService';
import { Loader2 } from 'lucide-react';
import {
  getAllowedRedirectOriginsFromEnv,
  navigateToSafeRedirect,
  resolveSafeRedirectUrl,
} from '@/shared/utils/safeRedirect';

const QR_REDIRECT_ORIGINS = getAllowedRedirectOriginsFromEnv('VITE_ALLOWED_QR_REDIRECT_ORIGINS');

export function QrResolverPage() {
  const { token } = useParams<{ token: string }>();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!token) {
      setError('Token inválido');
      return;
    }
    
    async function resolve() {
      try {
        // Resolver token
        const result = await QrCodeService.resolveToken(token!);
        
        if (result.error || !result.data) {
          setError(result.error || 'QR Code não encontrado');
          return;
        }
        
        const destinationUrl = resolveSafeRedirectUrl(result.data, {
          allowedOrigins: QR_REDIRECT_ORIGINS,
          allowRelative: true,
          context: 'qr-resolver',
        });

        if (!destinationUrl) {
          setError('Destino do QR Code bloqueado por segurança');
          return;
        }
        
        // Buscar QR Code para registrar scan
        const qrResult = await QrCodeService.getByToken(token!);
        
        if (qrResult.data) {
          // Detectar dispositivo
          const deviceType = QrCodeService.detectDeviceType(navigator.userAgent);
          
          // Registrar scan (não bloqueia redirect)
          QrCodeService.recordScan({
            qr_code_id: qrResult.data.id,
            device_type: deviceType,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            resolved_url: destinationUrl,
          }).catch(err => {
            logger.error('Erro ao registrar scan:', err);
            // Não bloqueia o redirect
          });
        }
        
        // Redirecionar
        setResolvedUrl(destinationUrl);
      } catch (err) {
        logger.error('Erro ao resolver QR Code:', err);
        setError('Erro ao processar QR Code');
      }
    }
    
    resolve();
  }, [token]);
  
  useEffect(() => {
    if (!resolvedUrl) return;

    const redirected = navigateToSafeRedirect(resolvedUrl, {
      allowedOrigins: QR_REDIRECT_ORIGINS,
      allowRelative: true,
      context: 'qr-resolver',
    });

    if (!redirected) {
      setError('Destino do QR Code bloqueado por segurança');
    }
  }, [resolvedUrl]);
  
  // Erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            QR Code Inválido
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/"
            className="text-primary hover:underline"
          >
            Voltar para página inicial
          </a>
        </div>
      </div>
    );
  }
  
  // Loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Processando QR Code...</p>
      </div>
    </div>
  );
}

