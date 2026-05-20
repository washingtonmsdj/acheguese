import { useState, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Clock,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Globe,
  Navigation,
  Share2,
  Store,
  Star,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ViewOnMapButton } from "@/core/maps/components/ViewOnMapButton";
import { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
import { BusinessService } from "@/core/business/services/BusinessService";
import { logger } from "@/shared/utils/logger";
import type { BizData } from "@/modules/business/types";

interface SimilarBusiness {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating: number;
  total_avaliacoes: number;
  neighborhood: string;
  slug: string;
  city: string;
  is_premium: boolean;
  nicho: string;
}

interface BusinessContactSidebarProps {
  business: BizData;
  onNavigate: () => void;
}

export function BusinessContactSidebar({
  business,
  onNavigate,
}: BusinessContactSidebarProps) {
  const { navigateToBusiness } = useBusinessNavigation();
  const [similarBusinesses, setSimilarBusinesses] = useState<SimilarBusiness[]>([]);
  const structuredAddress =
    typeof business.address === "object" && business.address
      ? business.address
      : null;

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const data = await BusinessService.getSimilarBusinesses(
          business.id,
          business.category,
          5,
        );
        const mapped = data.map((b) => ({
          id: b.id,
          name: b.name,
          logo: b.logo_url || "",
          category: b.category,
          rating: b.rating || 0,
          total_avaliacoes: b.total_reviews || 0,
          neighborhood: b.location?.name || "",
          slug: b.slug,
          city: b.business_city || "",
          is_premium: b.is_premium || false,
          nicho: b.category,
        }));
        setSimilarBusinesses(mapped);
      } catch (err) {
        logger.warn("Error fetching similar businesses:", err);
        setSimilarBusinesses([]);
      }
    }

    if (business) fetchSimilar();
  }, [business]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <aside className="w-full lg:w-[320px] flex-shrink-0">
      <div className="lg:sticky lg:top-20 space-y-4 sm:space-y-5">
        {/* Quick Actions */}
        <Card className="p-4 sm:p-5 border-2 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-base mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
            {business.whatsapp && (
              <Button
                asChild
                size="sm"
                className="w-full justify-start bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-md hover:shadow-lg transition-all"
              >
                <a
                  href={`https://wa.me/${business.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="truncate">WhatsApp</span>
                </a>
              </Button>
            )}
            {business.phone && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full justify-start hover:bg-secondary/80 transition-all"
              >
                <a href={`tel:${business.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="truncate">Ligar</span>
                </a>
              </Button>
            )}
            {(business.address || (business.latitude && business.longitude)) && (
              <Button
                size="sm"
                variant="outline"
                onClick={onNavigate}
                className="w-full justify-start hover:bg-secondary/80 transition-all"
              >
                <Navigation className="h-4 w-4 mr-2" />
                <span className="truncate">Como Chegar</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="w-full justify-start hover:bg-secondary/80 transition-all"
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span className="truncate">Compartilhar</span>
            </Button>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-4 sm:p-5 border-2 shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-base mb-4">Contato</h3>
          <div className="space-y-4">
            {/* Horário */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-2">Horário de Funcionamento</p>
                {business.schedule ? (
                  <>
                    <div className="space-y-1 mb-2">
                      {business.schedule
                        .replace(/\\n/g, "\n") // Converter \\n literal para \n
                        .split("\n")
                        .filter((linha: string) => linha.trim())
                        .map((linha: string, idx: number) => (
                          <p key={idx} className="text-sm leading-relaxed">
                            {linha.trim()}
                          </p>
                        ))}
                    </div>
                    <div className="flex items-start gap-2 pt-3 border-t">
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full mt-1 shrink-0 animate-pulse",
                          business.aberto ? "bg-green-500" : "bg-red-500",
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            business.aberto ? "text-green-600" : "text-red-600",
                          )}
                        >
                          {business.aberto ? "Aberto agora" : "Fechado"}
                        </span>
                        {business.aberto && business.schedule_fechamento && (
                          <span className="text-xs text-muted-foreground">
                            Fecha às {business.schedule_fechamento}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Consulte pelo phone
                  </p>
                )}
              </div>
            </div>

            {(business.phone || business.whatsapp || business.email) && (
              <Separator />
            )}

            {/* Se não tem nenhum contato, mostrar mensagem */}
            {!business.phone &&
              !business.whatsapp &&
              !business.email &&
              !business.instagram &&
              !business.facebook &&
              !business.website && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    Informações de contato não disponíveis
                  </p>
                </div>
              )}

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

            {(business.instagram || business.facebook || business.email) && (
              <Separator />
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
                  <svg
                    className="h-4 w-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Instagram</p>
                  <a
                    href={`https://instagram.com/${business.instagram.replace("@", "")}`}
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
                  <svg
                    className="h-4 w-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
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
                      business.website.startsWith("http")
                        ? business.website
                        : `https://${business.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-primary transition-colors block truncate"
                  >
                    {business.website
                      .replace(/^https?:\/\/(www\.)?/, "")
                      .replace(/\/$/, "")}
                  </a>
                </div>
              </div>
            )}

            {business.address && <Separator />}

            {/* Endereço */}
            {business.address && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Endereço</p>
                  <p className="text-sm font-semibold break-words">
                    {typeof business.address === 'string'
                      ? business.address
                      : [
                          structuredAddress?.street,
                          structuredAddress?.number,
                          structuredAddress?.complement
                        ].filter(Boolean).join(', ')
                    }
                    {structuredAddress?.postal_code && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        CEP: {structuredAddress.postal_code}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Similar Businesses */}
        <Card className="p-4 sm:p-5 border-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-bold text-base">Empresas Similares</h3>
          </div>

          {similarBusinesses.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-3 capitalize">
                Outras empresas de {business.category}
              </p>
              <div className="space-y-2">
                {similarBusinesses.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() =>
                      navigateToBusiness({
                        id: sim.id,
                        slug: sim.slug,
                        is_premium: sim.is_premium || false,
                        geographic_path: null,
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-all group cursor-pointer border border-transparent hover:border-primary/20"
                  >
                    <div className="h-12 w-12 rounded-xl overflow-hidden border-2 flex-shrink-0 shadow-sm">
                      {sim.logo ? (
                        <img
                          src={sim.logo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-gray-700">
                          <span className="text-white font-bold text-xs">
                            {sim.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w: string) => w[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {sim.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-foreground">
                          {Number(sim.rating).toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({sim.total_avaliacoes || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4 sm:py-6">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground capitalize px-2">
                Nenhuma outra empresa de {business.category} cadastrada no momento
              </p>
            </div>
          )}
        </Card>

        {/* Localização */}
        {business.address && (
          <Card className="p-4 sm:p-5 border-2 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-base">Localização</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Endereço completo
                </p>
                <p className="text-xs sm:text-sm font-medium break-words">
                  {typeof business.address === 'string'
                    ? business.address
                    : [
                        structuredAddress?.street,
                        structuredAddress?.number,
                        structuredAddress?.complement
                      ].filter(Boolean).join(', ')
                  }
                </p>
                {business.neighborhood && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {business.neighborhood}
                  </p>
                )}
                {structuredAddress?.postal_code && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    CEP: {structuredAddress.postal_code}
                  </p>
                )}
              </div>

              <Separator />

              {/* Mapa - usa coordenadas se disponível, senão usa endereço */}
              <div className="aspect-video rounded-xl overflow-hidden border-2 shadow-md">
                {business.latitude && business.longitude ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${business.latitude},${business.longitude}&output=embed&z=15`}
                    allowFullScreen
                  />
                ) : structuredAddress?.latitude && structuredAddress?.longitude ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${structuredAddress.latitude},${structuredAddress.longitude}&output=embed&z=15`}
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      typeof business.address === 'string'
                        ? `${business.address}, ${business.neighborhood || ""}`
                        : `${structuredAddress?.street || ''} ${structuredAddress?.number || ''}, ${business.neighborhood || ""}`
                    )}&output=embed&z=15`}
                    allowFullScreen
                  />
                )}
              </div>

              <div className="flex gap-2">
                {(business.latitude && business.longitude) ||
                 (structuredAddress?.latitude && structuredAddress?.longitude) ? (
                  <>
                    <ViewOnMapButton
                      latitude={business.latitude || structuredAddress?.latitude}
                      longitude={business.longitude || structuredAddress?.longitude}
                      itemId={business.id}
                      itemType="business"
                      itemName={business.name}
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm"
                    />
                    <Button
                      onClick={onNavigate}
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-9 w-9"
                      title="Abrir no GPS"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={onNavigate}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    Como Chegar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </aside>
  );
}
