/**
 * EducationDashboardPage
 *
 * Dashboard administrativo da instituicao de educacao.
 * Rota: /central/empresas/:businessId/education
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
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationNiche } from '../niches/hooks/useEducationNiche';
import { getNicheByKey } from '../niches/registry';

export function EducationDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: profile, isLoading } = useEducationProfile(businessId);
  const nicheData = useEducationNiche(profile?.niche_key);
  const nicheInfo = profile?.niche_key ? getNicheByKey(profile.niche_key) : null;

  // Helper para status do nicho
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'full_enabled':
        return <Badge className="bg-green-100 text-green-800">Completo</Badge>;
      case 'basic_enabled':
        return <Badge className="bg-blue-100 text-blue-800">Básico</Badge>;
      case 'beta':
        return <Badge className="bg-amber-100 text-amber-800">Beta</Badge>;
      case 'planned':
        return <Badge variant="outline">Planejado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const menuItems = [
    {
      icon: Settings,
      label: 'Configuração',
      href: `/central/empresas/${businessId}/educacao/setup`,
      description: 'Dados da instituição e perfil',
    },
    {
      icon: BookOpen,
      label: 'Programas',
      href: `/central/empresas/${businessId}/educacao/programas`,
      description: 'Gerenciar turmas e programas',
    },
    {
      icon: Users,
      label: 'Leads',
      href: `/central/empresas/${businessId}/educacao/leads`,
      description: 'Pipeline de matrículas',
    },
    {
      icon: Calendar,
      label: 'Eventos',
      href: `/central/empresas/${businessId}/educacao/eventos`,
      description: 'Eventos e visitas agendadas',
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      href: `/central/empresas/${businessId}/educacao/analytics`,
      description: 'Estatísticas e relatórios',
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Educação</h1>
            <p className="text-sm text-gray-500">
              {profile?.institution_type ?? 'Instituição não configurada'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{profile.status}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Nicho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{nicheInfo?.displayName || profile.niche_key}</p>
                  <p className="text-xs text-muted-foreground">
                    {nicheInfo ? `${nicheInfo.enabledCapabilities.length} capabilities` : 'Nicho não configurado'}
                  </p>
                </div>
                {getStatusBadge(nicheInfo?.supportLevel)}
              </div>
              {nicheData.isBeta && (
                <p className="text-xs text-amber-600 mt-2">
                  Este nicho está em beta. Algumas funcionalidades podem ser limitadas.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {profile.whatsapp_number ? 'Configurado' : 'Não configurado'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {profile && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Infraestrutura cadastrada</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Recursos basicos</div>
              <div className="text-xl font-bold">{profile.school_basic_resources?.length ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Acessibilidade</div>
              <div className="text-xl font-bold">{profile.school_accessibility_features?.length ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Equipamentos</div>
              <div className="text-xl font-bold">{profile.school_equipment_features?.length ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Instalacoes</div>
              <div className="text-xl font-bold">{profile.school_facility_features?.length ?? 0}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={item.href}>
              <Card className="group hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <item.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
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
