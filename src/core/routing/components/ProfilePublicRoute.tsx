/**
 * Profile Public Route
 * Rota pública de profile por username: /u/:username
 *
 * RESPONSABILIDADE:
 * - Resolver username para profile
 * - Renderizar página pública do profile
 * - Redirecionar para 404 se username não existir
 *
 * Rota pública canônica:
 * - /u/:username = identidade pública oficial
 */

import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/core/profiles';
import { logger } from '@/shared/utils/logger';
import { ProfilePublicPage } from '@/modules/profile/pages/ProfilePublicPage';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

export default function ProfilePublicRoute() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('Username is required');
      }

      logger.info('[ProfilePublicRoute] Resolving username', { username });

      const profile = await profileService.getByUsername(username);

      if (!profile) {
        logger.warn('[ProfilePublicRoute] Profile not found', { username });
        return null;
      }

      return profile;
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
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

  return <ProfilePublicPage profile={profile} />;
}
