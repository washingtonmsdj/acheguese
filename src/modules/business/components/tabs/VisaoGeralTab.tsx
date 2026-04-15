import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Store,
  Truck,
  Award,
  Calendar,
  Users,
  BadgeCheck,
  CreditCard,
  Sparkles,
  Globe,
  Star,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import PhotoGallery from "@/modules/business/components/PhotoGallery.tsx";
import type { VisaoGeralTabProps, ModoAtendimentoIcon } from "@/modules/business/types/components";

const MODOS_ICONS: Record<string, ModoAtendimentoIcon> = {
  presencial: {
    icon: Store,
    label: "Presencial",
    color: "bg-primary/10 text-primary",
  },
  delivery: {
    icon: Truck,
    label: "Delivery",
    color: "bg-green-500/10 text-green-600",
  },
  domicilio: {
    icon: Store,
    label: "A domicílio",
    color: "bg-yellow-500/10 text-yellow-600",
  },
  online: {
    icon: Globe,
    label: "Online",
    color: "bg-sky-500/10 text-sky-600",
  },
};

export function VisaoGeralTab({
  business,
  gallery,
  reviews,
  user,
  onReviewsUpdate,
}: VisaoGeralTabProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Descrição */}
      <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold">Sobre a Empresa</h2>
        </div>
        {business.description ? (
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            {business.description}
          </p>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma descrição cadastrada</p>
          </div>
        )}
      </Card>

      {/* Galeria de Fotos */}
      {gallery.length > 0 && (
        <PhotoGallery photos={gallery} businessName={business.name} />
      )}

      {/* Modos de Atendimento */}
      {business.modos_atendimento && business.modos_atendimento.length > 0 && (
        <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Formas de Atendimento</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {business.modos_atendimento.map((modo: string) => {
              const m = MODOS_ICONS[modo];
              if (!m) return null;
              const Icon = m.icon;
              return (
                <div
                  key={modo}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl transition-all hover:scale-105 cursor-default",
                    m.color,
                  )}
                >
                  <Icon className="h-7 w-7" />
                  <span className="text-sm font-medium text-center">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Especialidades */}
      {business.especialidades && business.especialidades.length > 0 && (
        <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Especialidades</h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {business.especialidades.map((esp: string, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {esp}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Informações Rápidas */}
      <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold">Informações Rápidas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {business.ano_fundacao && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Fundada em</p>
                <p className="text-base font-semibold">{business.ano_fundacao}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Avaliações</p>
              <p className="text-base font-semibold">
                {business.total_avaliacoes} {business.total_avaliacoes === 1 ? 'cliente avaliou' : 'clientes avaliaram'}
              </p>
            </div>
          </div>
          {business.verified && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors md:col-span-2">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <BadgeCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-primary font-semibold mb-0.5">
                  Empresa Verificada
                </p>
                <p className="text-xs text-muted-foreground">
                  Informações confirmadas pela plataforma
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Formas de Pagamento e Facilidades */}
      {((business.formas_pagamento && business.formas_pagamento.length > 0) ||
        (business.facilidades && business.facilidades.length > 0)) && (
        <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="space-y-6">
            {business.formas_pagamento &&
              business.formas_pagamento.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold">Formas de Pagamento</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {business.formas_pagamento.map(
                      (fp: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-sm px-4 py-2 hover:bg-secondary/80 transition-colors"
                        >
                          {fp}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}

            {business.facilidades && business.facilidades.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold">Facilidades</h2>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {business.facilidades.map((fac: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-sm px-4 py-2 hover:bg-primary/5 transition-colors"
                    >
                      {fac}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Redes Sociais */}
      {(business.instagram || business.facebook || business.website) && (
        <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Redes Sociais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white hover:scale-105 hover:shadow-xl transition-all"
              >
                <svg
                  className="h-9 w-9"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <div className="text-center">
                  <p className="font-semibold text-sm">Instagram</p>
                  <p className="text-xs opacity-90 truncate max-w-full px-2">{business.instagram}</p>
                </div>
              </a>
            )}

            {business.facebook && (
              <a
                href={business.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-[#1877F2] text-white hover:scale-105 hover:shadow-xl transition-all"
              >
                <svg
                  className="h-9 w-9"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <div className="text-center">
                  <p className="font-semibold text-sm">Facebook</p>
                  <p className="text-xs opacity-90">Visitar página</p>
                </div>
              </a>
            )}

            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl transition-all"
              >
                <Globe className="h-9 w-9" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Website</p>
                  <p className="text-xs opacity-90">Visitar website</p>
                </div>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Avaliações */}
      <Card className="p-5 sm:p-7 border-2 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Avaliações dos Clientes</h2>
            </div>
            <p className="text-sm text-muted-foreground ml-13">
              {business.total_avaliacoes}{" "}
              {business.total_avaliacoes === 1 ? "avaliação" : "avaliações"}
            </p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sistema de avaliações em desenvolvimento
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-primary/30" />
            </div>
            <h3 className="font-semibold text-base mb-2">
              Nenhuma avaliação ainda
            </h3>
            <p className="text-sm mb-3">
              Seja o primeiro a avaliar esta empresa!
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
