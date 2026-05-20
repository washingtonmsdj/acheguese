import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useBusinessById } from '@/core/business/hooks/useBusinessById';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * CentralBreadcrumbs
 *
 * Breadcrumbs simples para navegacao da Central.
 *
 * Exemplos:
 * - Central > Empresas
 * - Central > Empresas > Nome da empresa
 * - Central > Empresas > Nome da empresa > Gastronomia
 * - Central > Empresas > Nome da empresa > Gastronomia > Cardapio
 * - Central > Empresas > Nome da empresa > Gastronomia > Horarios
 * - Central > Empresas > Nome da empresa > Gastronomia > Pedidos
 * - Central > Motorista > Ganhos
 * - Central > Motoboy > Entregas
 */
export function CentralBreadcrumbs() {
  const location = useLocation();
  const { businessId } = useParams<{ businessId: string }>();
  const pathname = location.pathname;

  // Buscar dados da empresa quando businessId esta presente
  // Hook sempre chamado, mas so faz fetch quando businessId esta presente
  const { business, isLoading: loadingBusiness } = useBusinessById(businessId);

  // Se nao estiver na Central, nao renderizar breadcrumbs
  if (!pathname.startsWith('/central')) {
    return null;
  }

  // Extrair segmentos do path
  const segments = pathname.split('/').filter(Boolean);

  // Se for apenas /central, nao renderizar breadcrumbs
  if (segments.length === 1) {
    return null;
  }

  // Mapear segmentos para labels legiveis
  const getSegmentLabel = (segment: string, index: number): string => {
    if (index === 0) return 'Central';
    if (segment === 'empresas') return 'Empresas';
    if (segment === 'profissional') return 'Profissional';
    if (segment === 'motorista') return 'Motorista';
    if (segment === 'motoboy') return 'Motoboy';
    if (segment === 'cadastro') return 'Cadastro';
    if (segment === 'disponibilidade') return 'Disponibilidade';
    if (segment === 'corridas') return 'Corridas';
    if (segment === 'entregas') return 'Entregas';
    if (segment === 'ganhos') return 'Ganhos';
    if (segment === 'configuracoes') return 'Configuracoes';
    if (segment === 'dados') return 'Dados da empresa';
    if (segment === 'gastronomia') return 'Gastronomia';
    if (segment === 'setup') return 'Setup';
    if (segment === 'cardapio') return 'Cardapio';
    if (segment === 'horarios') return 'Horarios';
    if (segment === 'area-entrega') return 'Area de entrega';
    if (segment === 'pedidos') return 'Pedidos';
    if (segment === 'promocoes') return 'Promocoes';
    if (segment === 'planos') return 'Planos';
    if (segment === 'link-premium') return 'Link premium';
    if (segment === 'analytics') return 'Analytics';
    if (segment === 'educacao') return 'Educacao';
    if (segment === 'programas') return 'Programas';
    if (segment === 'leads') return 'Leads';
    if (segment === 'eventos') return 'Eventos';
    return segment;
  };

  // Construir caminho para cada segmento
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');

    // Se for businessId e tiver dados da empresa, usar nome da empresa
    if (segment === businessId && business) {
      return { path, label: business.name, isBusinessName: true };
    }

    const label = getSegmentLabel(segment, index);
    return { path, label };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground px-4 py-2 overflow-x-auto">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center shrink-0">
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">
              {crumb.isBusinessName && loadingBusiness ? (
                <Skeleton className="h-4 w-24 inline-block" />
              ) : (
                <span className="truncate max-w-[150px] block" title={crumb.label}>
                  {crumb.label}
                </span>
              )}
            </span>
          ) : (
            <>
              <Link
                to={crumb.path}
                className={cn(
                  'hover:text-foreground transition-colors',
                  index === 0 && 'flex items-center gap-1',
                )}
              >
                {index === 0 && <Home className="h-4 w-4" />}
                {crumb.isBusinessName && loadingBusiness ? (
                  <Skeleton className="h-4 w-24 inline-block" />
                ) : (
                  <span className="truncate max-w-[150px] block" title={crumb.label}>
                    {crumb.label}
                  </span>
                )}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
