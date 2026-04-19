/**
 * Profile Public Route
 * Rota pública de perfil PESSOAL por username: /u/:username
 *
 * RESPONSABILIDADE:
 * - Resolver username para profile PERSONAL
 * - Redirecionar outros tipos para suas rotas canônicas
 * - Renderizar página pública do perfil pessoal
 *
 * Rota pública canônica:
 * - /u/:username = APENAS perfil pessoal/social
 * 
 * REDIRECIONAMENTOS:
 * - Business → /empresas/:uf/:cidade/:bairro/:slug
 * - Professional → /profissionais/:uf/:cidade/:slug
 * - Driver → 404 (não tem página pública)
 */
import { logger } from '@/shared/utils/logger';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/core/profiles/services/ProfileService';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { ProfessionalUrlService } from '@/core/professional/services/ProfessionalUrlService';
import { ProfilePublicPage } from '@/modules/profile/pages/ProfilePublicPage';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

type RouteResult = 
  | { type: 'profile'; profile: any }
  | { type: 'redirect'; url: string }
  | { type: 'not_found' };

export default function ProfilePublicRoute() {
  const { username } = useParams<{ username: string }>();

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async (): Promise<RouteResult> => {
      if (!username) {
        throw new Error('Username is required');
      }

      logger.info('[ProfilePublicRoute] Resolving username', { username });

      const profile = await profileService.getByUsername(username);

      if (!profile) {
        logger.warn('[ProfilePublicRoute] Profile not found', { username });
        return { type: 'not_found' };
      }

      // ✅ NOVO: Verificar tipo de perfil e redirecionar se necessário
      if (profile.profile_type === 'business') {
        logger.info('[ProfilePublicRoute] Redirecting business to canonical URL', { 
          username, 
          profileId: profile.id 
        });

        // Buscar URL canônica da empresa
        const businessContext = await BusinessUrlService.resolveById(profile.id);
        
        if (businessContext) {
          const urls = BusinessUrlService.buildUrls(businessContext);
          return { 
            type: 'redirect', 
            url: urls.canonical 
          };
        }

        // Fallback: se não encontrar contexto, vai para 404
        logger.warn('[ProfilePublicRoute] Business context not found', { profileId: profile.id });
        return { type: 'not_found' };
      }

      if (profile.profile_type === 'professional') {
        logger.info('[ProfilePublicRoute] Redirecting professional to canonical URL', { 
          username, 
          profileId: profile.id 
        });

        // Buscar URL canônica do profissional
        const professionalContext = await ProfessionalUrlService.resolveById(profile.id);
        
        if (professionalContext) {
          const urls = ProfessionalUrlService.buildUrls(professionalContext);
          return { 
            type: 'redirect', 
            url: urls.canonical 
          };
        }

        // Fallback: se não encontrar contexto, vai para 404
        logger.warn('[ProfilePublicRoute] Professional context not found', { profileId: profile.id });
        return { type: 'not_found' };
      }

      if (profile.profile_type === 'driver') {
        logger.info('[ProfilePublicRoute] Driver profile has no public page', { 
          username, 
          profileId: profile.id 
        });

        // Driver não tem página pública
        return { type: 'not_found' };
      }

      // ✅ CORRETO: Apenas personal chega aqui
      if (profile.profile_type === 'personal') {
        return { 
          type: 'profile', 
          profile 
        };
      }

      // Tipo desconhecido
      logger.warn('[ProfilePublicRoute] Unknown profile type', { 
        username, 
        profileType: profile.profile_type 
      });
      return { type: 'not_found' };
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !result || result.type === 'not_found') {
    logger.error('[ProfilePublicRoute] Error or profile not found', { username, error });

    if (username) {
      logPageNotFound({
        entityType: 'profile',
        identifier: username,
        attemptedUrl: `/u/${username}`,
      });
    }

    return <Navigate to="/404" replace />;
  }

  if (result.type === 'redirect') {
    logger.info('[ProfilePublicRoute] Redirecting to canonical URL', { 
      from: `/u/${username}`, 
      to: result.url 
    });
    return <Navigate to={result.url} replace />;
  }

  // ✅ APENAS perfil personal chega aqui
  return <ProfilePublicPage profile={result.profile} />;
}
