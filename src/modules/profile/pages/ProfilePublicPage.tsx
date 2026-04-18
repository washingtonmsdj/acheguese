/**
 * Página pública de perfil PESSOAL por username — /u/:username
 * 
 * RESPONSABILIDADE:
 * - Renderizar informações públicas do perfil PESSOAL
 * - Usar apenas dados públicos seguros (sem PII sensível)
 * - Contexto: Identidade pessoal/social
 * - Design moderno e profissional
 * 
 * ⚠️ IMPORTANTE:
 * - Esta página é APENAS para perfil personal
 * - Business usa /empresas/:uf/:cidade/:bairro/:slug
 * - Professional usa /profissionais/:uf/:cidade/:slug
 * - Driver não tem página pública
 * 
 * REDIRECIONAMENTOS:
 * - ProfilePublicRoute redireciona outros tipos automaticamente
 * - Ver: src/core/routing/components/ProfilePublicRoute.tsx
 * 
 * CONTRATO PÚBLICO PERMITIDO:
 * - name, username, avatar, bio
 * - location pública/coarse (se existir)
 * - links públicos próprios (se existirem)
 * - reputação, estatísticas públicas
 * 
 * CONTRATO PÚBLICO PROIBIDO:
 * - email, phone (PII sensível)
 * - user_id, ids internos
 * - flags internas, permissões
 * - metadados administrativos
 * 
 * Rota pública canônica:
 * - /u/:username = perfil pessoal/social
 */

import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  Star,
  TrendingUp,
  Award,
  Share2,
  MessageCircle,
} from 'lucide-react';

import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/utils/cn';
import { getProfileTypeLabel } from '@/modules/profile/utils/profileDomainRules';

import type { Profile } from '@/core/profiles/types';

interface ProfilePublicPageProps {
  profile: Profile;
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatMemberSince(date?: string): string {
  if (!date) return 'Data desconhecida';
  return new Date(date).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });
}

function getProfileTypeBadgeColor(profileType?: string): string {
  switch (profileType) {
    case 'business':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400';
    case 'professional':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'driver':
      return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

export function ProfilePublicPage({ profile }: ProfilePublicPageProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  const profileTypeLabel = getProfileTypeLabel(profile as any);
  const reputationScore = profile.reputation ?? 0;
  const reputationLevel = Math.floor(reputationScore / 100) + 1;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(appUrls.home);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profile.name}`,
          text: profile.bio || `Confira o perfil de ${profile.name}`,
          url,
        });
      } catch (err) {
        // Usuário cancelou ou erro
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(url);
        // TODO: Adicionar toast de sucesso
      } catch (err) {
        // Erro ao copiar
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{profile.name} (@{profile.username}) | Perfil Público</title>
        <meta name="description" content={profile.bio || `Perfil público de ${profile.name}`} />
        <meta property="og:title" content={`${profile.name} (@${profile.username})`} />
        <meta property="og:description" content={profile.bio || `Perfil público de ${profile.name}`} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header com botão voltar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5 -ml-2" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </motion.div>

          {/* Card principal do perfil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
          >
            {/* Cover/Banner (gradiente decorativo) */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 sm:h-40" />

            {/* Conteúdo do perfil */}
            <div className="relative px-6 pb-6">
              {/* Avatar sobreposto */}
              <div className="relative -mt-16 mb-4 sm:-mt-20">
                <Avatar className="h-28 w-28 border-4 border-card shadow-xl sm:h-32 sm:w-32">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-accent/20 sm:text-3xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Nome e verificação */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                        {profile.name}
                      </h1>
                      {profile.verified && (
                        <CheckCircle2 
                          className="h-6 w-6 shrink-0 text-primary" 
                          aria-label="Perfil verificado" 
                        />
                      )}
                    </div>
                    <p className="text-base text-muted-foreground sm:text-lg">
                      @{profile.username}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Compartilhar</span>
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        // TODO: Implementar mensagem/contato
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Contato</span>
                    </Button>
                  </div>
                </div>

                {/* Badges: Tipo de perfil */}
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn("h-6 text-xs font-semibold", getProfileTypeBadgeColor(profile.profile_type))}
                  >
                    {profileTypeLabel}
                  </Badge>
                  {profile.verified && (
                    <Badge variant="outline" className="h-6 text-xs font-semibold border-primary/30 bg-primary/10 text-primary">
                      Verificado
                    </Badge>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-base leading-relaxed text-foreground">
                    {profile.bio}
                  </p>
                )}

                <Separator className="my-4" />

                {/* Informações adicionais */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Localização */}
                  {(profile.city || profile.neighborhood) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>
                        {profile.neighborhood && profile.city 
                          ? `${profile.neighborhood}, ${profile.city}`
                          : profile.city || profile.neighborhood}
                      </span>
                    </div>
                  )}

                  {/* Membro desde */}
                  {profile.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Membro desde {formatMemberSince(profile.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Reputação e estatísticas */}
                {reputationScore > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Reputação
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <StatCard
                          icon={Star}
                          label="Score"
                          value={reputationScore}
                          color="text-amber-600"
                        />
                        <StatCard
                          icon={TrendingUp}
                          label="Nível"
                          value={reputationLevel}
                          color="text-blue-600"
                        />
                        <StatCard
                          icon={Award}
                          label="Rank"
                          value={reputationLevel >= 5 ? "Top 10%" : "Crescendo"}
                          color="text-purple-600"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Seções adicionais (futuro: posts, empresas, etc.) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 space-y-6"
          >
            {/* Placeholder para conteúdo futuro */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Mais conteúdo em breve...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
 * COMPONENTES AUXILIARES
 * ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
