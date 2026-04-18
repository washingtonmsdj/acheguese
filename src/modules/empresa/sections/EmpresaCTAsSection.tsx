/**
 * EmpresaCTAsSection
 * 
 * Seção de CTAs principais com botões de ação e opções de rota.
 * Inclui WhatsApp, Ligar, Rota, Salvar, Recomendar e CTA de Gastronomia.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import {
  MessageCircle,
  Phone,
  Navigation,
  Bookmark,
  ThumbsUp,
  ShoppingBag,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ActionButton, RouteOptions } from '../components/ctas';
import { GastronomyCTA } from '@/modules/gastronomy/components/GastronomyCTA';
import type { EmpresaCTAsSectionProps } from './types';

export function EmpresaCTAsSection({
  business,
  isDeliveryBusiness,
  gastronomyUrl,
  isFavorite,
  hasRecommended,
  showRouteOptions,
  onToggleFavorite,
  onToggleRecommended,
  onToggleRouteOptions,
  onRoute,
}: EmpresaCTAsSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        {/* Primary CTA for delivery businesses */}
        {isDeliveryBusiness && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl shadow-lg gap-2">
              <ShoppingBag className="h-5 w-5" /> Pedir Agora
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-base rounded-xl gap-2"
            >
              <ClipboardList className="h-5 w-5" /> Ver Cardápio
            </Button>
          </div>
        )}

        {/* Action grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {business.whatsapp && (
            <ActionButton
              icon={MessageCircle}
              label="WhatsApp"
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
              color="emerald-400"
            />
          )}
          {business.phone && (
            <ActionButton
              icon={Phone}
              label="Ligar"
              href={`tel:${business.phone}`}
              color="primary"
            />
          )}
          <ActionButton
            icon={Navigation}
            label="Como chegar"
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

        {/* Route options */}
        <RouteOptions show={showRouteOptions} onRoute={onRoute} />
      </motion.div>

      {/* Gastronomy CTA */}
      {gastronomyUrl && business && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <GastronomyCTA
            gastronomyUrl={gastronomyUrl}
            businessName={business.name}
          />
        </motion.div>
      )}
    </section>
  );
}
