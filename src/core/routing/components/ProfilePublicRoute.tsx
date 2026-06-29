/**
 * Profile Public Route
 * Rota pública de perfil pessoal por username: /u/:username
 *
 * RESPONSABILIDADE:
 * - Resolver username para profile personal
 * - Exibir 404 para tipos não pessoais
 * - Renderizar página pública do perfil pessoal
 *
 * Rota pública canônica:
 * - /u/:username = apenas perfil pessoal/social
 *
 * COMPORTAMENTO:
 * - Business/Professional/Driver -> 404 (sem redirect)
 */
import { logger } from '@/shared/utils/logger';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/core/profiles/services/ProfileService';
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { ProfilePublicPage } from '@/core/profile/pages/ProfilePublicPage';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

type PublicRouteProfile = Exclude<
  Awaited<ReturnType<typeof profileService.getByUsername>>,
  null
>;

type RouteResult =
  | { type: 'profile'; profile: PublicRouteProfile }
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

      // Perfil público em /u é exclusivo para perfil pessoal.
      if (profile.profile_type === 'business') {
        logger.info('[ProfilePublicRoute] Business profile is not served on /u route', {
          username,
          profileId: profile.id,
        });
        return { type: 'not_found' };
      }

      if (profile.profile_type === 'professional') {
        logger.info('[ProfilePublicRoute] Professional profile is not served on /u route', {
          username,
          profileId: profile.id,
        });
        return { type: 'not_found' };
      }

      if (profile.profile_type === 'driver') {
        logger.info('[ProfilePublicRoute] Driver profile has no public page', {
          username,
          profileId: profile.id,
        });

        // Driver não tem página pública.
        return { type: 'not_found' };
      }

      // Apenas profile personal chega aqui.
      if (profile.profile_type === 'personal') {
        return {
          type: 'profile',
          profile,
        };
      }

      // Tipo desconhecido.
      logger.warn('[ProfilePublicRoute] Unknown profile type', {
        username,
        profileType: profile.profile_type,
      });
      return { type: 'not_found' };
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutos.
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
        attemptedUrl: buildPublicProfileUrl(username),
      });
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-4xl font-bold text-muted-foreground">404</p>
          <p className="mt-2 text-lg font-semibold text-foreground">Perfil não encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Este identificador não corresponde a um perfil pessoal público.
          </p>
          <a href="/" className="mt-4 inline-block text-sm text-primary underline">
            Voltar para início
          </a>
        </div>
      </div>
    );
  }

  // Apenas perfil personal chega aqui.
  return <ProfilePublicPage profile={result.profile} />;
}
