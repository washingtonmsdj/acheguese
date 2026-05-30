/**
 * SSOT - Optimized Image Component
 * 
 * Componente de imagem otimizado com:
 * - Lazy loading automático
 * - Responsive images (srcset)
 * - WebP/AVIF support
 * - Loading placeholder
 * - Error fallback
 * 
 * @version 1.0.0
 */

import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';
import { resolveSafeImageUrl } from '@/shared/utils/urlSafety';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /**
   * Image source URL
   */
  src: string;
  
  /**
   * Alt text (required for accessibility)
   */
  alt: string;
  
  /**
   * Image width (for aspect ratio calculation)
   */
  width?: number;
  
  /**
   * Image height (for aspect ratio calculation)
   */
  height?: number;
  
  /**
   * Responsive sizes
   * @example "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
   */
  sizes?: string;
  
  /**
   * Enable lazy loading (default: true)
   */
  lazy?: boolean;
  
  /**
   * Fallback image URL
   */
  fallback?: string;
  
  /**
   * Show loading placeholder
   */
  showPlaceholder?: boolean;
  
  /**
   * Placeholder color
   */
  placeholderColor?: string;
  
  /**
   * Additional className
   */
  className?: string;
  
  /**
   * Object fit
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Generate srcset for responsive images
 */
function generateSrcSet(src: string): string {
  // Se a URL já tem parâmetros, adiciona com &, senão com ?
  const separator = src.includes('?') ? '&' : '?';
  
  // Gera srcset para diferentes tamanhos
  const widths = [320, 640, 768, 1024, 1280, 1536];
  
  return widths
    .map(width => `${src}${separator}w=${width} ${width}w`)
    .join(', ');
}

/**
 * Check if browser supports WebP
 */
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Optimized Image Component
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  lazy = true,
  fallback = '/placeholder-image.png',
  showPlaceholder = true,
  placeholderColor = '#f3f4f6',
  className,
  objectFit = 'cover',
  ...props
}: OptimizedImageProps) {
  const safeInitialSrc = resolveSafeImageUrl(src, { context: 'OptimizedImage.src' });
  const safeFallback = fallback
    ? resolveSafeImageUrl(fallback, { context: 'OptimizedImage.fallback' })
    : null;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(safeInitialSrc ?? safeFallback ?? '');

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (safeFallback && imageSrc !== safeFallback) {
      setImageSrc(safeFallback);
    }
  };

  // Generate srcset if width is provided
  const srcSet = width && imageSrc ? generateSrcSet(imageSrc) : undefined;

  // Default sizes if not provided
  const imageSizes = sizes || '100vw';

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
      }}
    >
      {/* Loading placeholder */}
      {showPlaceholder && isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
          aria-hidden="true"
        />
      )}

      {/* Image */}
      {imageSrc ? (
        <img
          src={imageSrc}
          srcSet={srcSet}
          sizes={imageSizes}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            aspectRatio ? 'absolute inset-0 w-full h-full' : '',
            isLoading ? 'opacity-0' : 'opacity-100',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          {...props}
        />
      ) : null}

      {/* Error state */}
      {(hasError || !imageSrc) && !safeFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Imagem não disponível</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Image Component
 * 
 * Specialized component for avatar images
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      objectFit="cover"
      fallback="/default-avatar.png"
      {...props}
    />
  );
}

/**
 * Background Image Component
 * 
 * Specialized component for background images
 */
export function BackgroundImage({
  src,
  alt,
  children,
  className,
  overlay = false,
  overlayOpacity = 0.5,
  ...props
}: OptimizedImageProps & {
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}) {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full"
        objectFit="cover"
        {...props}
      />
      
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
