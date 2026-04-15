/**
 * 🚀 LAZY PROVIDERS - Otimização de FCP/LCP
 *
 * Providers não-críticos carregados de forma lazy para reduzir
 * o bundle inicial e melhorar First Contentful Paint.
 *
 * @version 1.0.0
 */

import { Suspense, type ReactNode } from 'react';
import { FullScreenLoader } from '@/shared/components/loading/PageLoader';

/**
 * Wrapper para providers lazy-loaded
 * Mostra fallback durante o carregamento
 */
interface LazyProviderWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyProviderWrapper({
  children,
  fallback = <FullScreenLoader />,
}: LazyProviderWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// ============================================================
// LAZY PROVIDERS - Carregados sob demanda
// ============================================================

/**
 * Lazy load SessionProvider
 * Essencial mas pode ser lazy em páginas públicas
 */
export const LazySessionProvider = (await import('@/core/session/providers/SessionProvider')).SessionProvider;

/**
 * Lazy load MultiProfileProvider
 * Só necessário para usuários logados
 */
export const LazyMultiProfileProvider = (await import('@/core/profiles/contexts/multi-profile-runtime-context')).MultiProfileProvider;

/**
 * Lazy load AccessibilityProvider
 * Pode ser carregado após FCP
 */
export const LazyAccessibilityProvider = (await import('@/shared/components/accessibility/AccessibilityProvider')).AccessibilityProvider;

/**
 * Lazy load ModuleContextSync
 * Sincronização de contexto, não bloqueante
 */
export const LazyModuleContextSync = (await import('@/core/profiles/contexts/multi-profile-runtime-context')).ModuleContextSync;

/**
 * Lazy load TerritoryModeInitializer
 * Inicialização territorial, pode ser deferida
 */
export const LazyTerritoryModeInitializer = (await import('@/core/location/components/TerritoryModeInitializer')).TerritoryModeInitializer;

// ============================================================
// OPTIMIZED PROVIDER STACK
// ============================================================

import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '@/shared/utils/queryClient';
import { Toaster } from '@/shared/components/ui/toaster';
import { Toaster as Sonner } from '@/shared/components/ui/sonner';
import { SkipToContent } from '@/shared/components/accessibility/SkipToContent';
import { SEO } from '@/app/components/SEO';
import { WebVitalsReporter } from '@/app/components/WebVitalsReporter';

interface MinimalProviderStackProps {
  children: ReactNode;
}

/**
 * Provider stack mínimo para FCP rápido
 * Apenas o essencial para render inicial
 */
export function MinimalProviderStack({ children }: MinimalProviderStackProps) {
  return (
    <HelmetProvider>
      <SEO />
      <WebVitalsReporter />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SkipToContent />
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {children}
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

/**
 * Provider stack completo para app autenticado
 * Carrega providers adicionais lazy
 */
interface FullProviderStackProps {
  children: ReactNode;
  isAuthenticated?: boolean;
}

export function FullProviderStack({ children, isAuthenticated = false }: FullProviderStackProps) {
  if (!isAuthenticated) {
    return <MinimalProviderStack>{children}</MinimalProviderStack>;
  }

  // Para usuários autenticados, carregar providers adicionais
  return (
    <HelmetProvider>
      <SEO />
      <WebVitalsReporter />
      <QueryClientProvider client={queryClient}>
        <LazyAccessibilityProvider>
          <TooltipProvider>
            <Suspense fallback={<FullScreenLoader />}>
              <LazySessionProvider>
                <LazyMultiProfileProvider>
                  <LazyModuleContextSync />
                  <LazyTerritoryModeInitializer />
                  <SkipToContent />
                  <Toaster />
                  <Sonner />
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    {children}
                  </BrowserRouter>
                </LazyMultiProfileProvider>
              </LazySessionProvider>
            </Suspense>
          </TooltipProvider>
        </LazyAccessibilityProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
