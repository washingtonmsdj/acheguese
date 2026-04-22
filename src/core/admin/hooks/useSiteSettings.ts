/**
 * useSiteSettings - Hook para buscar configurações do site
 * 
 * Busca configurações globais como logo, favicon, cores, etc.
 * Cache de 5 minutos para evitar requests desnecessários.
 */

import { useQuery } from '@tanstack/react-query';
import { SiteSettingsService } from '@/core/admin/services/SiteSettingsService';
import type { SiteSettings } from '@/core/admin/services/SiteSettingsService';

export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: () => SiteSettingsService.getAllSettings(),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Garbage collection após 10 minutos
    retry: 1, // Tentar apenas 1 vez em caso de erro
  });
}
