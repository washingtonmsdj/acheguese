/**
 * SafeImage - Componente seguro para imagens de usuário
 * 
 * ✅ Valida URLs de imagem
 * ✅ Fallback para imagem quebrada
 * ✅ Lazy loading por padrão
 * ✅ Bloqueia SVG inline (vetor de XSS)
 * 
 * @example
 * ```tsx
 * <SafeImage src={userImageUrl} alt="Avatar" />
 * ```
 */

import { ImgHTMLAttributes, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
}

/**
 * Valida se URL de imagem é segura
 */
function isImageUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Bloqueia javascript: e data:image/svg
    if (parsed.protocol === 'javascript:') return false;
    if (parsed.protocol === 'data:' && url.includes('svg')) {
      console.warn('[SafeImage] Blocked SVG data URL (XSS risk)');
      return false;
    }

    return true;
  } catch {
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

  // Valida URL
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
