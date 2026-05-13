/**
 * ContactCard
 * 
 * Card de contato com telefone, WhatsApp, email, website e redes sociais.
 * BotÃ£o de copiar telefone e CTA de reivindicar empresa.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderizaÃ§Ã£o
 */

import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Instagram,
  Facebook,
  Award,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { ContactCardProps } from '../../sections/types';

export function ContactCard({
  business,
  copiedPhone,
  onCopyPhone,
  navigate,
}: ContactCardProps) {
  return (
    <div className="space-y-4">
      {/* Contact info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground mb-4">Contato</h2>
        <div className="space-y-3">
          {business.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <a
                href={`tel:${business.phone}`}
                className="text-sm text-foreground hover:text-primary transition-colors flex-1"
              >
                {business.phone}
              </a>
              <button
                onClick={onCopyPhone}
                className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                {copiedPhone ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
          {business.whatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <a
                href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:text-emerald-400 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          )}
          {business.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <a
                href={`mailto:${business.email}`}
                className="text-sm text-foreground hover:text-primary transition-colors truncate"
              >
                {business.email}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate flex items-center gap-1"
              >
                {business.website.replace(/^https?:\/\//, "")}{" "}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Social */}
        {(business.instagram || business.facebook) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
              >
                <Instagram className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">
                  @{business.instagram}
                </span>
              </a>
            )}
            {business.facebook && (
              <a
                href={`https://facebook.com/${business.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center hover:border-sky-500/40 transition-colors"
              >
                <Facebook className="h-4 w-4 text-sky-400" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Claim CTA */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 rounded-xl p-5 text-center">
        <Award className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Esta Ã© a sua empresa?
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Reivindique e gerencie seu perfil gratuitamente
        </p>
        <Button
          onClick={() => navigate("/empresas/cadastrar")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg h-9"
        >
          Reivindicar empresa
        </Button>
      </div>
    </div>
  );
}

