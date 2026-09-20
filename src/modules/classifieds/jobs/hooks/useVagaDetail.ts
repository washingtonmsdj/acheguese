/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE VAGA DETAIL — Hook para página de detalhe de vaga
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Responsabilidade:
 * - Buscar vaga por slug canônico
 * - Buscar vagas relacionadas
 * - Gestão de candidatura
 * - SEO (meta tags)
 * - SSOT: usa VagasService (nunca acessa Supabase diretamente)
 * 
 * Página: /vagas/:uf/:cidade/:slug
 * 
 * @version 3.0.0 - Hook Completo AAA
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VagasService } from '../services/VagasService';
import { VagaReportService, type VagaReportReason } from '../services/VagaReportService';
import type { Vaga } from '../types/vagas.types';
import { useSessionContext } from '@/core/session';
import { buildMailtoUrl, buildTelUrl, buildWhatsAppUrl, onlyDigits, openContactUrl } from '@/shared/utils/contactLinks';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UseVagaDetailParams {
  slug: string;
  locationId?: string; // Para buscar relacionadas
}

type VagaShareResult = 'shared' | 'copied';

interface UseVagaDetailReturn {
  // Dados
  vaga: Vaga | null;
  vagasRelacionadas: Vaga[];
  vagasEmpresa: Vaga[];
  
  // Estados
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isLoadingRelacionadas: boolean;
  
  // Candidatura
  isCandidatando: boolean;
  candidatarSe: (mensagem?: string) => Promise<void>;
  
  // Ações
  refetch: () => void;
  compartilhar: () => Promise<VagaShareResult>;
  salvarVaga: () => Promise<boolean>;
  denunciarVaga: (input: { reason: VagaReportReason; description?: string }) => Promise<void>;
  isSaved: boolean;
  isDenunciando: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const STALE_TIME = 5 * 60 * 1000; // 5 minutos

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useVagaDetail(params: UseVagaDetailParams): UseVagaDetailReturn {
  const { slug, locationId } = params;
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();

  // Query principal: buscar vaga por slug
  const {
    data: vaga,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vaga', slug],
    queryFn: () => VagasService.getVagaBySlug(slug),
    staleTime: STALE_TIME,
    enabled: !!slug,
  });

  // Query: vagas relacionadas (mesma categoria/tags)
  const relatedLocationId = locationId ?? vaga?.locationId;
  const {
    data: vagasRelacionadas = [],
    isLoading: isLoadingRelacionadas,
  } = useQuery({
    queryKey: ['vagas-relacionadas', vaga?.id, relatedLocationId],
    queryFn: () => {
      if (!vaga?.id || !relatedLocationId) return [];
      return VagasService.getVagasRelacionadas(vaga.id, relatedLocationId, 4);
    },
    staleTime: STALE_TIME,
    enabled: Boolean(vaga?.id && relatedLocationId),
  });

  // Query: outras vagas da mesma empresa
  const {
    data: vagasEmpresa = [],
  } = useQuery({
    queryKey: ['vagas-empresa', vaga?.empresaId],
    queryFn: () => {
      if (!vaga?.empresaId) return [];
      return VagasService.getVagasByEmpresa(vaga.empresaId, 3);
    },
    staleTime: STALE_TIME,
    enabled: !!vaga?.empresaId,
  });

  const {
    data: isSaved = false,
  } = useQuery({
    queryKey: ['vaga-saved', activeProfile?.id, vaga?.id],
    queryFn: () => VagasService.isVagaSaved(vaga!.id),
    enabled: Boolean(vaga?.id && activeProfile?.id),
  });

  // Mutação: candidatar-se à vaga
  const candidaturaMutation = useMutation({
    mutationFn: async (mensagem?: string) => {
      if (!vaga) throw new Error('Vaga não encontrada');

      switch (vaga.applicationChannel) {
        case 'whatsapp': {
          const digits = onlyDigits(vaga.applicationWhatsapp);
          if (digits.length < 10) {
            throw new Error('Canal de candidatura por WhatsApp indisponível.');
          }

          const url = buildWhatsAppUrl(
            vaga.applicationWhatsapp,
            `Olá! Vi a vaga de ${vaga.titulo} e tenho interesse. Podemos conversar?`,
          );
          if (!url || !openSafeExternalUrl(url, { context: 'job-apply-whatsapp' })) {
            throw new Error('Não foi possível abrir o WhatsApp para esta vaga.');
          }
          break;
        }
        case 'email': {
          const url = buildMailtoUrl(vaga.applicationEmail, {
            subject: `Candidatura: ${vaga.titulo}`,
          });
          if (!openContactUrl(url)) {
            throw new Error('E-mail de candidatura indisponível ou inválido.');
          }
          break;
        }
        case 'external_url':
          if (
            !vaga.applicationUrl ||
            !openSafeExternalUrl(vaga.applicationUrl, {
              context: 'job-apply-external-url',
            })
          ) {
            throw new Error('Link externo de candidatura indisponível ou inválido.');
          }
          break;
        case 'phone': {
          const digits = onlyDigits(vaga.applicationPhone);
          if (digits.length < 10 || !openContactUrl(buildTelUrl(vaga.applicationPhone))) {
            throw new Error('Telefone de candidatura indisponível ou inválido.');
          }
          break;
        }
        case 'internal':
        default:
          if (!activeProfile?.id) {
            throw new Error('Entre na sua conta para se candidatar por aqui.');
          }
          if (activeProfile.id === vaga.ownerProfileId) {
            throw new Error('O perfil responsavel pela vaga nao pode se candidatar.');
          }
          await VagasService.applyToVaga({
            vagaId: vaga.id,
            candidatoProfileId: activeProfile.id,
            mensagem,
          });
      }
    },
    onSuccess: () => {
      // Invalidar cache para atualizar contador/estado canônico.
      void queryClient.invalidateQueries({ queryKey: ['vaga', slug] });
    },
  });

  const savedVagaMutation = useMutation({
    mutationFn: async () => {
      if (!vaga) throw new Error('Vaga nao encontrada');
      if (!activeProfile?.id) {
        throw new Error('Entre na sua conta para salvar vagas.');
      }

      if (isSaved) {
        await VagasService.removeSavedVaga(vaga.id);
        return false;
      }

      await VagasService.saveVaga(vaga.id);
      return true;
    },
    onSuccess: (nextIsSaved) => {
      queryClient.setQueryData(['vaga-saved', activeProfile?.id, vaga?.id], nextIsSaved);
      void queryClient.invalidateQueries({ queryKey: ['vaga-saved', activeProfile?.id] });
      void queryClient.invalidateQueries({ queryKey: ['saved-vagas', activeProfile?.id] });
    },
  });

  const reportVagaMutation = useMutation({
    mutationFn: async (input: { reason: VagaReportReason; description?: string }) => {
      if (!vaga) throw new Error('Vaga nao encontrada');
      if (!activeProfile?.id) {
        throw new Error('Entre na sua conta para denunciar vagas.');
      }
      if (activeProfile.id === vaga.ownerProfileId) {
        throw new Error('O perfil responsavel pela vaga nao pode denuncia-la.');
      }

      await VagaReportService.createReport({
        vagaId: vaga.id,
        reason: input.reason,
        description: input.description,
      });
    },
  });

  // Handler de candidatura
  const candidatarSe = useCallback(async (mensagem?: string) => {
    await candidaturaMutation.mutateAsync(mensagem);
  }, [candidaturaMutation]);

  // Handler de compartilhamento
  const compartilhar = useCallback(async (): Promise<VagaShareResult> => {
    if (!vaga) throw new Error('Vaga não encontrada');
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error('Compartilhamento indisponível neste ambiente.');
    }

    const shareData = {
      title: vaga.titulo,
      text: `Vaga: ${vaga.titulo} na ${vaga.empresaNome}`,
      url: window.location.href,
    };

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return 'shared';
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
      }
    }

    if (!navigator.clipboard?.writeText) {
      throw new Error('Compartilhamento não disponível neste navegador.');
    }

    await navigator.clipboard.writeText(window.location.href);
    return 'copied';
  }, [vaga]);

  const salvarVaga = useCallback(async () => {
    return savedVagaMutation.mutateAsync();
  }, [savedVagaMutation]);

  const denunciarVaga = useCallback(async (input: { reason: VagaReportReason; description?: string }) => {
    await reportVagaMutation.mutateAsync(input);
  }, [reportVagaMutation]);

  return {
    // Dados
    vaga: vaga ?? null,
    vagasRelacionadas,
    vagasEmpresa,
    
    // Estados
    isLoading,
    isError,
    error: error as Error | null,
    isLoadingRelacionadas,
    
    // Candidatura
    isCandidatando: candidaturaMutation.isPending,
    candidatarSe,
    
    // Ações
    refetch,
    compartilhar,
    salvarVaga,
    denunciarVaga,
    isSaved,
    isDenunciando: reportVagaMutation.isPending,
  };
}
