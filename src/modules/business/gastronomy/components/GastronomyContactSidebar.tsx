/**
 * GastronomyContactSidebar — Sidebar de contato e informações do restaurante
 *
 * Paridade com BusinessContactSidebar:
 * - Ações rápidas (WhatsApp, Ligar, Como Chegar, Compartilhar)
 * - Contato completo (telefone, WhatsApp, email, Instagram, Facebook, website)
 * - Horário de funcionamento com status em tempo real
 * - Localização com mapa embed
 * - Restaurantes similares
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
  Store,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { MiniMap } from '@/shared/components/maps/MiniMap';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';
import { GastronomyShareDialog } from './GastronomyShareDialog';
import { useGastronomySimilar } from '../hooks/useGastronomySimilar';
import { useGastronomyOpeningStatus } from '../hooks/useGastronomyOpeningStatus';
import { getCuisineLabel } from '../constants';
import { formatBrl } from '../utils/currency';
import type { GastronomyBusiness } from '../types';

interface GastronomyContactSidebarProps {
  business: GastronomyBusiness;
}

export function GastronomyContactSidebar({ business }: GastronomyContactSidebarProps) {
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);

  const profile = business.gastronomy_profile;
  const openingStatus = useGastronomyOpeningStatus(business);

  const { data: similar = [] } = useGastronomySimilar({
    businessDataId: business.business_data_id,
    cuisineType: profile.cuisine_type,
    limit: 5,
  });

  const latitude = business.address?.latitude;
  const longitude = business.address?.longitude;
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  const handleNavigate = () => {
    if (hasCoords) {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const url = isIos
        ? `maps://maps.apple.com/?daddr=${latitude},${longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, url });
        return;
      } catch {
        // fallback
      }
    }
    setShareOpen(true);
  };

  const dotColorClass = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-amber-500',
  }[openingStatus?.dotColor ?? 'red'];

  return (
    <aside className="w-full lg:w-[320px] flex-shrink-0">
      <div className="lg:sticky lg:top-20 space-y-4">

        {/* ── Ações Rápidas ─────────────────────────────────────── */}
        <Card className="p-4 border-2 shadow-md">
          <h3 className="font-bold text-base mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            {business.whatsapp && (
              <Button
                asChild
                size="sm"
                className="w-full justify-start bg-[#25D366] hover:bg-[#20BA5A] text-white"
              >
                <a
                  href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
                    `Olá! Vi o ${business.name} no OrdaX e gostaria de mais informações.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            )}
            {business.phone && (
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <a href={`tel:${business.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </a>
              </Button>
            )}
            {hasCoords && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleNavigate}
                className="w-full justify-start"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Como Chegar
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="w-full justify-start"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </Card>

        {/* ── Contato e Horário ─────────────────────────────────── */}
        <Card className="p-4 border-2 shadow-md">
          <h3 className="font-bold text-base mb-4">Contato</h3>
          <div className="space-y-4">

            {/* Horário de funcionamento */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Horário de Funcionamento
                </p>
                {openingStatus ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 animate-pulse ${dotColorClass}`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        openingStatus.isOpen ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {openingStatus.statusText}
                    </span>
                    {openingStatus.isOpen && openingStatus.closingTime && (
                      <span className="text-xs text-muted-foreground">
                        · Fecha às {openingStatus.closingTime}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Consulte pelo telefone</p>
                )}

                {/* Tempo de entrega */}
                {profile.delivery_enabled && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    <span>
                      {profile.delivery_time_min ?? 20}–{profile.delivery_time_max ?? 40} min ·{' '}
                      {formatBrl(profile.delivery_fee ?? 0)} entrega
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(business.phone || business.whatsapp || business.email) && <Separator />}

            {/* Telefone */}
            {business.phone && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Telefone</p>
                  <a
                    href={`tel:${business.phone}`}
                    className="text-sm font-semibold hover:text-primary transition-colors block truncate"
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {business.whatsapp && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">WhatsApp</p>
                  <a
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-[#25D366] transition-colors block truncate"
                  >
                    {business.whatsapp}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {business.email && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">E-mail</p>
                  <a
                    href={`mailto:${business.email}`}
                    className="text-sm font-semibold hover:text-primary transition-colors block truncate"
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}

            {/* Instagram */}
            {business.instagram && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Instagram</p>
                  <a
                    href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-pink-600 transition-colors block truncate"
                  >
                    {business.instagram}
                  </a>
                </div>
              </div>
            )}

            {/* Facebook */}
            {business.facebook && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Facebook</p>
                  <a
                    href={business.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-[#1877F2] transition-colors block truncate"
                  >
                    Facebook
                  </a>
                </div>
              </div>
            )}

            {/* Website */}
            {business.website && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Website</p>
                  <a
                    href={
                      business.website.startsWith('http')
                        ? business.website
                        : `https://${business.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-primary transition-colors block truncate"
                  >
                    {business.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Localização ───────────────────────────────────────── */}
        {hasCoords && (
          <Card className="p-4 border-2 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-base">Localização</h3>
            </div>

            {business.location?.full_name && (
              <p className="text-sm text-muted-foreground mb-3">
                {business.location.full_name}
              </p>
            )}

            <div className="overflow-hidden rounded-xl">
              <MiniMap
                latitude={latitude}
                longitude={longitude}
                title={business.name}
                height="200px"
                markerColor="hsl(var(--primary))"
                markerIcon="R"
                showControls={false}
                interactive={false}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigate}
              className="mt-3 w-full gap-2"
            >
              <Navigation className="h-4 w-4" />
              Como Chegar
            </Button>
          </Card>
        )}

        {/* ── Restaurantes Similares ────────────────────────────── */}
        <Card className="p-4 border-2 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-bold text-base">Restaurantes Similares</h3>
          </div>

          {similar.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Outros de {getCuisineLabel(profile.cuisine_type)}
              </p>
              <div className="space-y-2">
                {similar.map((sim) => (
                  <button
                    key={sim.business_data_id}
                    type="button"
                    onClick={() => {
                      if (sim.geographic_path && sim.slug) {
                        // Usa normalizePublicTerritoryPath — SSOT de URLs territoriais
                        navigate(
                          `/gastronomia${normalizePublicTerritoryPath(sim.geographic_path)}/${sim.slug}`,
                        );
                      } else {
                        navigate('/gastronomia');
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-all group cursor-pointer border border-transparent hover:border-primary/20 text-left"
                  >
                    <div className="h-12 w-12 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-muted flex items-center justify-center">
                      {sim.banner_url ? (
                        <img
                          src={sim.banner_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {sim.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-semibold">{sim.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({sim.total_reviews})</span>
                        {sim.delivery_enabled && (
                          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                            Delivery
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                Nenhum outro restaurante de {getCuisineLabel(profile.cuisine_type)} cadastrado
              </p>
            </div>
          )}
        </Card>
      </div>

      <GastronomyShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        businessName={business.name}
        businessDescription={business.description}
        businessUrl={window.location.href}
      />
    </aside>
  );
}
