/**
 * GastronomyQuickActions — CTAs destacados do restaurante
 *
 * Paridade com QuickActions do módulo de empresas.
 */

import { Building2, MessageCircle, Navigation, Phone, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import type { GastronomyBusiness } from '../types';

interface GastronomyQuickActionsProps {
  business: GastronomyBusiness;
  onOrderClick?: () => void;
  companyUrl?: string | null;
}

export function GastronomyQuickActions({
  business,
  onOrderClick,
  companyUrl,
}: GastronomyQuickActionsProps) {
  const { phone, whatsapp, address, gastronomy_profile: profile } = business;
  const latitude = address?.latitude;
  const longitude = address?.longitude;
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  const openWhatsApp = () => {
    if (!whatsapp) {
      toast.error('WhatsApp não disponível');
      return;
    }
    const message = `Olá! Vi o ${business.name} no OrdaX e gostaria de fazer um pedido.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const makeCall = () => {
    if (!phone) {
      toast.error('Telefone não disponível');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const openNavigation = () => {
    if (!hasCoords) return;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIos
      ? `maps://maps.apple.com/?daddr=${latitude},${longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const hasActions = whatsapp || phone || hasCoords || profile.delivery_enabled || companyUrl;
  if (!hasActions) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {profile.delivery_enabled && onOrderClick && (
        <Button onClick={onOrderClick} className="gap-2 rounded-full px-5">
          <ShoppingCart className="h-4 w-4" />
          Fazer Pedido
        </Button>
      )}
      {whatsapp && (
        <Button
          variant="outline"
          onClick={openWhatsApp}
          className="gap-2 rounded-full px-5 border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#25D366]"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
      )}
      {phone && (
        <Button
          variant="outline"
          onClick={makeCall}
          className="gap-2 rounded-full px-5"
        >
          <Phone className="h-4 w-4" />
          Ligar
        </Button>
      )}
      {hasCoords && (
        <Button
          variant="outline"
          onClick={openNavigation}
          className="gap-2 rounded-full px-5"
        >
          <Navigation className="h-4 w-4" />
          Como Chegar
        </Button>
      )}
      {companyUrl && (
        <Button asChild variant="outline" className="gap-2 rounded-full px-5">
          <a href={companyUrl}>
            <Building2 className="h-4 w-4" />
            Pagina da Empresa
          </a>
        </Button>
      )}
    </div>
  );
}
