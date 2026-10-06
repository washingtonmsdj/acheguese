/**
 * EducationDashboardPage
 *
 * Dashboard administrativo da instituição de educação.
 * Rota: /central/empresas/:businessId/educacao
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Settings,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationNiche } from '../niches/hooks/useEducationNiche';
import { getNicheByKey } from '../niches/registry';
import { EducationUrlService } from '../services/EducationUrlService';
import { EducationAdminReadError } from '../components/EducationAdminReadError';

export function EducationDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useEducationProfile(businessId);
  const nicheData = useEducationNiche(profile?.niche_key);
  const nicheInfo = profile?.niche_key ? getNicheByKey(profile.niche_key) : null;
  const adminUrls = businessId
    ? {
        setup: EducationUrlService.buildAdminSetupUrl(businessId),
        programs: EducationUrlService.buildAdminProgramsUrl(businessId),
        leads: EducationUrlService.buildAdminLeadsUrl(businessId),
        events: EducationUrlService.buildAdminEventsUrl(businessId),
        analytics: EducationUrlService.buildAdminAnalyticsUrl(businessId),
      }
    : null;

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case 'full_enabled':
        return (
          <Badge className="border-territory-success/25 bg-territory-success/10 text-territory-success hover:bg-territory-success/10">
            Completo
          </Badge>
        );
      case 'basic_enabled':
        return (
          <Badge className="border-territory-info/25 bg-territory-info/10 text-territory-info hover:bg-territory-info/10">
            Básico
          </Badge>
        );
      case 'beta':
        return (
          <Badge className="border-territory-warning/25 bg-territory-warning/10 text-territory-warning hover:bg-territory-warning/10">
            Beta
          </Badge>
        );
      case 'planned':
        return (
          <Badge
            variant="outline"
            className="border-territory-border bg-territory-surface text-territory-muted"
          >
            Planejado
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-territory-raised text-territory-ink"
          >
            {status}
          </Badge>
        );
    }
  };

  const menuItems = [
    {
      icon: Settings,
      label: 'Configuração',
      href: adminUrls?.setup,
      description: 'Dados da instituição e perfil',
    },
    {
      icon: BookOpen,
      label: 'Programas',
      href: adminUrls?.programs,
      description: 'Gerenciar turmas e programas',
    },
    {
      icon: Users,
      label: 'Leads',
      href: adminUrls?.leads,
      description: 'Pipeline de matrículas',
    },
    {
      icon: Calendar,
      label: 'Eventos',
      href: adminUrls?.events,
      description: 'Eventos e visitas agendadas',
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: adminUrls?.analytics,
      description: 'Estatísticas e relatórios',
    },
  ].flatMap((item) => (item.href ? [{ ...item, href: item.href }] : []));

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6 text-territory-ink">
        <Skeleton className="h-8 w-1/3 bg-territory-raised" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-territory-raised" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar a gestão de Educação"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 text-territory-ink">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand text-territory-on-image shadow-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-territory-ink">Educação</h1>
            <p className="text-sm text-territory-muted">
              {profile?.institution_type ?? 'Instituição não configurada'}
            </p>
          </div>
        </div>
      </motion.div>

      {!profile && adminUrls?.setup && (
        <Card className="mb-8 overflow-hidden border-territory-brand/25 bg-territory-surface text-territory-ink shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="p-6 sm:p-8">
                <Badge className="mb-3 border-territory-warning/25 bg-territory-warning/10 text-territory-warning hover:bg-territory-warning/10">
                  Configuração pendente
                </Badge>
                <h2 className="font-heading text-xl font-bold text-territory-ink sm:text-2xl">
                  Prepare o perfil educacional da instituição
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-territory-muted">
                  Defina o tipo de instituição, o nicho educacional e os dados
                  operacionais antes de cadastrar programas, receber interessados
                  ou publicar eventos.
                </p>
                <Link
                  to={adminUrls.setup}
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-territory-brand px-4 py-2 text-sm font-semibold text-territory-on-image transition hover:bg-territory-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand focus-visible:ring-offset-2 focus-visible:ring-offset-territory-canvas"
                >
                  Começar configuração
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="border-t border-territory-border bg-territory-raised/55 p-6 lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-territory-muted">
                  Antes de operar
                </p>
                <ul className="mt-3 space-y-2 text-sm text-territory-muted">
                  <li>• Identifique corretamente a instituição.</li>
                  <li>• Configure somente recursos realmente oferecidos.</li>
                  <li>• Revise os canais públicos de contato.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-territory-border bg-territory-surface text-territory-ink">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm font-medium text-territory-muted">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize text-territory-ink">{profile.status}</p>
            </CardContent>
          </Card>
          <Card className="border-territory-border bg-territory-surface text-territory-ink">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm font-medium text-territory-muted">
                Nicho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-territory-ink">
                    {nicheInfo?.displayName || profile.niche_key}
                  </p>
                  <p className="text-xs text-territory-muted">
                    {nicheInfo
                      ? `${nicheInfo.enabledCapabilities.length} recursos habilitados`
                      : 'Nicho não configurado'}
                  </p>
                </div>
                {getStatusBadge(nicheInfo?.supportLevel)}
              </div>
              {nicheData.isBeta && (
                <p className="mt-2 text-xs text-territory-warning">
                  Este nicho está em beta. Algumas funcionalidades podem ser limitadas.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-territory-border bg-territory-surface text-territory-ink">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm font-medium text-territory-muted">
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-territory-ink">
                {profile.whatsapp_number ? 'Configurado' : 'Não configurado'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {profile && (
        <Card className="mb-8 border-territory-border bg-territory-surface text-territory-ink">
          <CardHeader>
            <CardTitle className="font-heading text-base text-territory-ink">
              Infraestrutura cadastrada
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-territory-border bg-territory-raised/45 p-3">
              <div className="text-xs text-territory-muted">Recursos básicos</div>
              <div className="text-xl font-bold text-territory-ink">
                {profile.school_basic_resources?.length ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-territory-border bg-territory-raised/45 p-3">
              <div className="text-xs text-territory-muted">Acessibilidade</div>
              <div className="text-xl font-bold text-territory-ink">
                {profile.school_accessibility_features?.length ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-territory-border bg-territory-raised/45 p-3">
              <div className="text-xs text-territory-muted">Equipamentos</div>
              <div className="text-xl font-bold text-territory-ink">
                {profile.school_equipment_features?.length ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-territory-border bg-territory-raised/45 p-3">
              <div className="text-xs text-territory-muted">Instalações</div>
              <div className="text-xl font-bold text-territory-ink">
                {profile.school_facility_features?.length ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={item.href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand focus-visible:ring-offset-2 focus-visible:ring-offset-territory-canvas">
              <Card className="group h-full cursor-pointer border-territory-border bg-territory-surface text-territory-ink transition-[border-color,box-shadow] hover:border-territory-brand/35 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-territory-brand/10 text-territory-brand transition-colors group-hover:bg-territory-brand/15">
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-territory-ink transition-colors group-hover:text-territory-brand">
                          {item.label}
                        </h3>
                        <p className="text-sm text-territory-muted">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted transition-colors group-hover:text-territory-brand" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default EducationDashboardPage;
