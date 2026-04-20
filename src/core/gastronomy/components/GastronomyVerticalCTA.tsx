/**
 * GastronomyVerticalCTA — CTA de ativação do vertical gastronomia
 *
 * Exibido no dashboard da empresa quando:
 * - A empresa é elegível (categoria restaurante/lazer)
 * - Ainda não tem perfil gastronômico configurado
 *
 * Não importa nada de modules/business — blindagem arquitetural mantida.
 */

import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import type { GastronomyActivationStatus } from '../hooks/useGastronomyStatus';

interface GastronomyVerticalCTAProps {
  businessId: string;
  status: GastronomyActivationStatus;
}

const STATUS_CONFIG = {
  not_configured: {
    badge: null,
    title: 'Ativar Módulo Gastronomia',
    description: 'Habilite cardápio digital, delivery e apareça na listagem de gastronomia.',
    cta: 'Configurar agora',
    variant: 'default' as const,
    icon: UtensilsCrossed,
  },
  active: {
    badge: { label: 'Ativo', color: 'text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
    title: 'Módulo Gastronomia',
    description: 'Seu perfil gastronômico está ativo e visível na listagem.',
    cta: 'Gerenciar',
    variant: 'outline' as const,
    icon: UtensilsCrossed,
  },
  inactive: {
    badge: { label: 'Inativo', color: 'text-muted-foreground border-border', icon: XCircle },
    title: 'Módulo Gastronomia',
    description: 'Perfil gastronômico desativado. Reative para aparecer nas listagens.',
    cta: 'Reativar',
    variant: 'outline' as const,
    icon: UtensilsCrossed,
  },
  temporarily_closed: {
    badge: { label: 'Temporariamente fechado', color: 'text-amber-600 border-amber-500/30', icon: Clock },
    title: 'Módulo Gastronomia',
    description: 'Marcado como temporariamente fechado.',
    cta: 'Gerenciar',
    variant: 'outline' as const,
    icon: UtensilsCrossed,
  },
  not_eligible: null,
};

export function GastronomyVerticalCTA({ businessId, status }: GastronomyVerticalCTAProps) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[status];

  if (!config) return null;

  const Icon = config.icon;

  const handleClick = () => {
    navigate(`/dashboard/business/${businessId}/gastronomy/setup`);
  };

  return (
    <Card className={`border ${status === 'not_configured' ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${status === 'not_configured' ? 'bg-primary/10' : 'bg-muted'}`}>
            <Icon className={`h-5 w-5 ${status === 'not_configured' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold">{config.title}</p>
              {config.badge && (
                <Badge variant="outline" className={`gap-1 text-xs ${config.badge.color}`}>
                  <config.badge.icon className="h-3 w-3" />
                  {config.badge.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
          <Button
            size="sm"
            variant={config.variant}
            onClick={handleClick}
            className="shrink-0 gap-1"
          >
            {config.cta}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
