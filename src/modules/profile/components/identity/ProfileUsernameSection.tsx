/**
 * ProfileUsernameSection
 * Secao de username publico para tela de edicao de perfil pessoal.
 * O fluxo de confirmacao de salvamento e controlado pela pagina.
 */

import { ProfileIdentityField } from '@/core/public-identity/components/domains/ProfileIdentityField';
import { IdentityImpactNotice } from '@/core/public-identity/components/IdentityImpactNotice';

interface ProfileUsernameSectionProps {
  username: string;
  onUsernameChange: (value: string) => void;
  originalUsername?: string;
  profileId?: string;
  disabled?: boolean;
}

export function ProfileUsernameSection({
  username,
  onUsernameChange,
  originalUsername = '',
  profileId,
  disabled,
}: ProfileUsernameSectionProps) {
  const originalUrl = originalUsername ? `/u/${originalUsername}` : '';
  const newUrl = username ? `/u/${username}` : '';

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Identidade publica
      </p>

      <ProfileIdentityField
        value={username}
        onChange={onUsernameChange}
        entityId={profileId}
        showHistory={false}
        showCooldown={!!profileId}
        disabled={disabled}
        placeholder="ex: joao_silva"
      />

      <IdentityImpactNotice
        entityType="profile"
        originalValue={originalUsername}
        currentValue={username}
        originalUrl={originalUrl}
        newUrl={newUrl}
      />
    </div>
  );
}
