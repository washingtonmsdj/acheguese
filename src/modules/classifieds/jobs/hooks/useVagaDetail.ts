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

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VagasService } from '../services/VagasService';
import type { Vaga, Candidatura } from '../types/vagas.types';
import { buildMailtoUrl, buildTelUrl, openContactUrl } from '@/shared/utils/contactLinks';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UseVagaDetailParams {
  slug: string;
  locationId?: string; // Para buscar relacionadas
}

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
  compartilhar: () => Promise<void>;
  salvarVaga: () => Promise<void>;
  isSaved: boolean;
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
  const [isSaved, setIsSaved] = useState(false);

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
  const {
    data: vagasRelacionadas = [],
    isLoading: isLoadingRelacionadas,
  } = useQuery({
    queryKey: ['vagas-relacionadas', vaga?.id, locationId],
    queryFn: () => {
      if (!vaga?.id || !locationId) return [];
      return VagasService.getVagasRelacionadas(vaga.id, locationId, 4);
    },
    staleTime: STALE_TIME,
    enabled: !!vaga?.id && !!locationId,
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

  // Mutação: candidatar-se à vaga
  const candidaturaMutation = useMutation({
    mutationFn: async (_mensagem?: string) => {
      // TODO: Implementar quando módulo de candidaturas estiver pronto
      // Por enquanto, apenas redireciona para o canal apropriado
      if (!vaga) throw new Error('Vaga não encontrada');
      
      switch (vaga.applicationChannel) {
        case 'whatsapp':
          if (vaga.applicationWhatsapp) {
            const text = encodeURIComponent(`Olá! Vi a vaga de ${vaga.titulo} e tenho interesse. Podemos conversar?`);
            openSafeExternalUrl(`https://wa.me/55${vaga.applicationWhatsapp.replace(/\D/g, '')}?text=${text}`, {
              context: 'job-apply-whatsapp',
            });
          }
          break;
        case 'email':
          if (vaga.applicationEmail) {
            openContactUrl(
              buildMailtoUrl(vaga.applicationEmail, {
                subject: `Candidatura: ${vaga.titulo}`,
              }),
            );
          }
          break;
        case 'external_url':
          if (vaga.applicationUrl) {
            openSafeExternalUrl(vaga.applicationUrl, { context: 'job-apply-external-url' });
          }
          break;
        case 'phone':
          if (vaga.applicationPhone) {
            openContactUrl(buildTelUrl(vaga.applicationPhone));
          }
          break;
        case 'internal':
        default:
          // Candidatura interna - ainda não implementada
          throw new Error('Candidatura interna será implementada em breve');
      }
    },
    onSuccess: () => {
      // Invalidar cache para atualizar contador
      queryClient.invalidateQueries({ queryKey: ['vaga', slug] });
    },
  });

  // Handler de candidatura
  const candidatarSe = useCallback(async (mensagem?: string) => {
    await candidaturaMutation.mutateAsync(mensagem);
  }, [candidaturaMutation]);

  // Handler de compartilhamento
  const compartilhar = useCallback(async () => {
    if (!vaga) return;
    
    const shareData = {
      title: vaga.titulo,
      text: `Vaga: ${vaga.titulo} na ${vaga.empresaNome}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Usário cancelou ou não suportado
    }
  }, [vaga]);

  // Handler de salvar vaga (localStorage por enquanto)
  const salvarVaga = useCallback(async () => {
    if (!vaga) return;
    
    try {
      const saved = JSON.parse(localStorage.getItem('vagas-salvas') || '[]');
      const index = saved.indexOf(vaga.id);
      
      if (index === -1) {
        saved.push(vaga.id);
        setIsSaved(true);
      } else {
        saved.splice(index, 1);
        setIsSaved(false);
      }
      
      localStorage.setItem('vagas-salvas', JSON.stringify(saved));
    } catch {
      // Falha silenciosa
    }
  }, [vaga]);

  // Verificar se está salvo no localStorage (apenas no client)
  // useEffect(() => {
  //   if (!vaga) return;
  //   try {
  //     const saved = JSON.parse(localStorage.getItem('vagas-salvas') || '[]');
  //     setIsSaved(saved.includes(vaga.id));
  //   } catch {}
  // }, [vaga]);

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
    isSaved,
  };
}
