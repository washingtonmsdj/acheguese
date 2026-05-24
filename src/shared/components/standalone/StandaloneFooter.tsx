 
import React from "react";
/**
 * Footer da página standalone
 * Informações de contato e redes sociais
 */

import { Phone, Mail, MapPin, Instagram, Facebook, Globe } from "lucide-react";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { Button } from "@/shared/components/ui/button";
import { buildMailtoUrl, buildTelUrl } from "@/shared/utils/contactLinks";
import type { Business } from "@/shared/types/business";

interface StandaloneFooterProps {
  business: Business;
}

export default function StandaloneFooter({ business }: StandaloneFooterProps) {
  return (
    <footer id="contact" className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Logo e Nome */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <BusinessLogo
                    name={business.name}
                    logoUrl={business.logo_url}
                    alt={business.name}
                    initialsClassName="text-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{business.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {business.category}
                  </p>
                </div>
              </div>
              {business.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {business.description}
                </p>
              )}
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contato</h4>
              <div className="space-y-2 text-sm">
                {business.phone && (
                  <a
                    href={buildTelUrl(business.phone) ?? undefined}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {business.phone}
                  </a>
                )}
                {business.email && (
                  <a
                    href={buildMailtoUrl(business.email) ?? undefined}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {business.email}
                  </a>
                )}
                {business.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      {business.address}, {business.neighborhood}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="space-y-4">
              <h4 className="font-semibold">Redes Sociais</h4>
              <div className="flex gap-2">
                {business.instagram && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={business.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {business.facebook && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={business.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {business.website && (
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {business.name}. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
