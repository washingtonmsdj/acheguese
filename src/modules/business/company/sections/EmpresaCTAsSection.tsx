/**
 * EmpresaCTAsSection
 *
 * Secao de CTAs principais com botoes de acao e opcoes de rota.
 * Inclui WhatsApp, Ligar, Rota, Salvar, Recomendar e CTA de Gastronomia.
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Navigation,
  Bookmark,
  ThumbsUp,
  ShoppingBag,
  ClipboardList,
  ArrowRight,
  Building2,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ActionButton, RouteOptions } from '../components/ctas';
import type { VerticalKey } from '@/core/verticals';
import { VERTICAL_CONFIGS } from '@/core/verticals';
import { buildTelUrl, buildWhatsAppUrl } from '@/shared/utils/contactLinks';
import { getRecordValue } from '@/shared/utils/recordLookup';
import type { EmpresaCTAsSectionProps } from './types';

export function EmpresaCTAsSection({
  business,
  gastronomyUrl,
  verticalPublicUrls,
  isFavorite,
  hasRecommended,
  showRouteOptions,
  onToggleFavorite,
  onToggleRecommended,
  onToggleRouteOptions,
  onRoute,
}: EmpresaCTAsSectionProps) {
  const availableVerticals = Object.entries(verticalPublicUrls ?? {}) as Array<
    [VerticalKey, string]
  >;

  const getVerticalIcon = (vertical: VerticalKey) => {
    switch (vertical) {
      case 'gastronomy':
        return UtensilsCrossed;
      default:
        return Building2;
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        {gastronomyUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              asChild
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl shadow-lg gap-2"
            >
              <Link to={gastronomyUrl}>
                <ShoppingBag className="h-5 w-5" /> Ver cardápio e pedir
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full h-12 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-base rounded-xl gap-2"
            >
              <Link to={gastronomyUrl}>
                <ClipboardList className="h-5 w-5" /> Abrir cardápio
              </Link>
            </Button>
          </div>
        )}

        {(business.whatsapp || business.phone) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {business.whatsapp && (
              <ActionButton
                icon={MessageCircle}
                label="WhatsApp"
                href={buildWhatsAppUrl(business.whatsapp) ?? undefined}
                color="emerald-400"
              />
            )}
            {business.phone && (
              <ActionButton
                icon={Phone}
                label="Ligar"
                href={buildTelUrl(business.phone) ?? undefined}
                color="primary"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <ActionButton
            icon={Navigation}
            label="Rota"
            onClick={onToggleRouteOptions}
            color="amber-400"
          />
          <ActionButton
            icon={Bookmark}
            label="Salvar"
            onClick={onToggleFavorite}
            color="primary"
            isActive={isFavorite}
          />
          <ActionButton
            icon={ThumbsUp}
            label="Recomendar"
            onClick={onToggleRecommended}
            color="primary"
            isActive={hasRecommended}
          />
        </div>

        <RouteOptions show={showRouteOptions} onRoute={onRoute} />
      </motion.div>

      {availableVerticals.length > 0 && business && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Experiências especializadas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableVerticals.map(([vertical, url]) => {
                const config = getRecordValue(VERTICAL_CONFIGS, vertical);
                if (!config) return null;
                const Icon = getVerticalIcon(vertical);

                return (
                  <Card
                    key={vertical}
                    className="border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">
                            {config.label}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {config.description}
                          </p>
                          <Button asChild size="sm" className="mt-3 gap-1.5">
                            <Link to={url}>
                              Acessar {config.label}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
