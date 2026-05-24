/**
 * Event CTA
 * 
 * Call-to-action principal do evento
 * Suporta multiplos tipos: inscricao, contato, externo, lista de espera
 * 
 */

import { motion } from 'framer-motion';
import { 
  Ticket, 
  MessageCircle, 
  ExternalLink, 
  Clock, 
  Phone,
  Mail,
  Globe,
  Instagram,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';
import type { EventCTA as EventCTAType } from '../types';

interface EventCTAProps {
  cta: EventCTAType;
  isFree?: boolean;
  isSoldOut?: boolean;
  disabled?: boolean;
  onAction: () => void;
  className?: string;
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

function normalizeInstagram(value: string): string {
  return value.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '');
}

export function EventCTA({ 
  cta, 
  isFree = false,
  isSoldOut = false,
  disabled = false,
  onAction,
  className 
}: EventCTAProps) {
  if (!cta.enabled) return null;

  const getIcon = () => {
    switch (cta.type) {
      case 'register':
        return Ticket;
      case 'contact':
        return MessageCircle;
      case 'external':
        return ExternalLink;
      case 'waitlist':
        return Clock;
      default:
        return Ticket;
    }
  };

  const Icon = getIcon();

  return (
    <section className={cn("sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-lg", className)}>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Info */}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {isSoldOut ? 'Ingressos esgotados' : isFree ? 'Evento gratuito' : 'Garanta sua vaga'}
            </p>
            <p className="text-lg font-bold text-foreground">
              {cta.label}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {/* Contact Methods (if type is contact) */}
            {cta.type === 'contact' && cta.contact_methods && (
              <div className="flex gap-2">
                {cta.contact_methods.whatsapp && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      const phone = normalizePhone(cta.contact_methods!.whatsapp!);
                      openSafeExternalUrl(`https://wa.me/${phone}`, { context: 'event-cta-whatsapp' });
                    }}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                )}
                {cta.contact_methods.instagram && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      const username = normalizeInstagram(cta.contact_methods!.instagram!);
                      openSafeExternalUrl(`https://instagram.com/${username}`, { context: 'event-cta-instagram' });
                    }}
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="hidden sm:inline">Instagram</span>
                  </Button>
                )}
                {cta.contact_methods.email && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => window.location.assign(`mailto:${encodeURIComponent(cta.contact_methods!.email!)}`)}
                  >
                    <Mail className="h-5 w-5" />
                    <span className="hidden sm:inline">E-mail</span>
                  </Button>
                )}
                {cta.contact_methods.phone && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => window.location.assign(`tel:${normalizePhone(cta.contact_methods!.phone!)}`)}
                  >
                    <Phone className="h-5 w-5" />
                    <span className="hidden sm:inline">Telefone</span>
                  </Button>
                )}
                {cta.contact_methods.website && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => openSafeExternalUrl(cta.contact_methods!.website!, { context: 'event-cta-website' })}
                  >
                    <Globe className="h-5 w-5" />
                    <span className="hidden sm:inline">Site</span>
                  </Button>
                )}
              </div>
            )}

            {/* Main CTA Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className={cn(
                  "gap-2 px-8 shadow-lg",
                  (isSoldOut || disabled)
                    ? "bg-muted text-muted-foreground cursor-not-allowed" 
                    : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                )}
                disabled={isSoldOut || disabled}
                onClick={onAction}
              >
                <Icon className="h-5 w-5" />
                <span className="font-bold">
                  {isSoldOut 
                    ? 'Esgotado' 
                    : cta.type === 'waitlist' 
                    ? 'Entrar na lista de espera'
                    : cta.type === 'register'
                    ? isFree ? 'Garantir vaga gratis' : 'Comprar ingresso'
                    : cta.label
                  }
                </span>
                {!isSoldOut && <ArrowRight className="h-5 w-5" />}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Trust Indicators */}
        {!isSoldOut && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Confirmacao imediata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Dados seguros</span>
            </div>
            {isFree && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>100% gratuito</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
