 
/**
 * Página pública de perfil por username — /u/:username
 * 
 * RESPONSABILIDADE:
 * - Renderizar informações públicas do profile
 * - Usar apenas dados públicos seguros (sem PII sensível)
 * - Independente de rotas internas privadas
 * 
 * CONTRATO PÚBLICO PERMITIDO:
 * - name, username, avatar, bio
 * - location pública/coarse (se existir)
 * - links públicos próprios (se existirem)
 * 
 * CONTRATO PÚBLICO PROIBIDO:
 * - email, phone (PII sensível)
 * - user_id, ids internos
 * - flags internas, permissões
 * - metadados administrativos
 * 
 * Rota pública oficial:
 * - /u/:username = identidade pública principal (SEO-friendly)
 */

import { useNavigate } from 'react-router-dom';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, MapPin, CheckCircle2 } from 'lucide-react';
import type { Profile } from '@/core/profiles/types';

interface ProfilePublicPageProps {
  profile: Profile;
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ProfilePublicPage({ profile }: ProfilePublicPageProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(appUrls.home);
  };

  return (
    <>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Voltar */}
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>

        {/* Hero */}
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-border flex-shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
            <AvatarFallback className="text-xl font-bold bg-muted">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold leading-tight">{profile.name}</h1>
              {profile.verified && (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" aria-label="Verificado" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
        )}

        {/* Informações públicas (apenas location coarse) */}
        {profile.location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{profile.location}</span>
            </div>
          </div>
        )}

        {/* Badge de membro desde */}
        {profile.created_at && (
          <div className="pt-4 border-t">
            <Badge variant="outline" className="text-xs">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Badge>
          </div>
        )}
      </div>
    </>
  );
}
