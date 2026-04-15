import React from "react";
import { useState } from "react";
import { cn } from "@/shared/utils/cn";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de image otimizada com:
 * - Lazy loading nactive
 * - Placeholder blur
 * - Responsividade
 * - Cache otimizado
 * - Fallback para erro
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Gerar URL otimizada (preparado para Cloudflare)
  const getOptimizedUrl = (url: string) => {
    // Se for URL do Supabase, add parâmetros de otimização
    if (url.includes("supabase.co/storage")) {
      // Supabase Storage suporta transformações via query params
      const params = new URLSearchParams();
      if (width) params.append("width", width.toString());
      if (height) params.append("height", height.toString());
      params.append("quality", "85");

      return params.toString() ? `${url}?${params.toString()}` : url;
    }

    return url;
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-800 text-gray-400",
          className,
        )}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-800 animate-pulse"
          style={{ width, height }}
        />
      )}
      <img
        src={getOptimizedUrl(src)}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
      />
    </div>
  );
}
