/**
 * SafeImage - Componente seguro para imagens de usuário
 * 
 * ✅ Valida URLs de imagem
 * ✅ Fallback para imagem quebrada
 * ✅ Lazy loading por padrão
 * ✅ Bloqueia extensões perigosas (configuração vem do SSOT)
 * 
 * @example
 * ```tsx
 * <SafeImage src={userImageUrl} alt="Avatar" />
 * ```
 * 
 * @security-critical
 * @ssot src/config/security.config.ts
 */

import { ImgHTMLAttributes, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { 
  ALLOWED_IMAGE_EXTENSIONS,
  BLOCKED_IMAGE_EXTENSIONS,
  isImageExtensionSafe 
} from '@/config/security.config';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
}

/**
 * Valida se URL de imagem é segura
 * 
 * IMPORTANTE: Usa configuração do SSOT (security.config.ts)
 * NÃO hardcode extensões aqui!
 */
function isImageUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Bloqueia javascript:
    if (parsed.protocol === 'javascript:') {
      console.warn('[SafeImage] Blocked javascript: protocol');
      return false;
    }
    
    // Bloqueia data:image/svg (XSS risk)
    if (parsed.protocol === 'data:' && url.toLowerCase().includes('svg')) {
      console.warn('[SafeImage] Blocked SVG data URL (XSS risk)');
      return false;
    }

    // Valida extensão usando SSOT
    const extension = url.toLowerCase().match(/\.[^.?#]+/)?.[0];
    if (extension) {
      // Verifica se está na lista de bloqueados (do SSOT)
      const isBlocked = BLOCKED_IMAGE_EXTENSIONS.some(blocked => 
        extension === blocked
      );
      
      if (isBlocked) {
        console.warn('[SafeImage] Blocked dangerous extension:', extension);
        return false;
      }
      
      // Verifica se está na lista de permitidos (do SSOT)
      const isAllowed = ALLOWED_IMAGE_EXTENSIONS.some(allowed => 
        extension === allowed
      );
      
      if (!isAllowed) {
        console.warn('[SafeImage] Unknown extension:', extension);
        return false;
      }
    }

    return true;
  } catch {
    console.warn('[SafeImage] Invalid URL:', url);
    return false;
  }
}

export function SafeImage({
  src,
  alt,
  fallback,
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  // Valida URL usando configuração do SSOT
  if (!isImageUrlSafe(src)) {
    return <ImagePlaceholder alt={alt} className={className} />;
  }

  // Mostra placeholder se imagem falhar
  if (error) {
    return fallback ? (
      <img src={fallback} alt={alt} className={className} {...props} />
    ) : (
      <ImagePlaceholder alt={alt} className={className} />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
      {...props}
    />
  );
}

function ImagePlaceholder({ alt, className }: { alt: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-muted ${className}`}
      role="img"
      aria-label={alt}
    >
      <ImageOff className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}
