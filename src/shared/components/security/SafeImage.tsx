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
import { resolveSafeImageUrl } from '@/shared/utils/urlSafety';

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
}

export function SafeImage({
  src,
  alt,
  fallback,
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const safeSrc = resolveSafeImageUrl(src, { context: 'SafeImage.src' });
  const safeFallback = fallback
    ? resolveSafeImageUrl(fallback, { context: 'SafeImage.fallback' })
    : null;

  // Valida URL usando configuração do SSOT
  if (!safeSrc) {
    return <ImagePlaceholder alt={alt} className={className} />;
  }

  // Mostra placeholder se imagem falhar
  if (error) {
    return safeFallback ? (
      <img src={safeFallback} alt={alt} className={className} {...props} />
    ) : (
      <ImagePlaceholder alt={alt} className={className} />
    );
  }

  return (
    <img
      src={safeSrc}
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
