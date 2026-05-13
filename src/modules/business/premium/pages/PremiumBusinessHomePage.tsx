import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Clock3,
  Globe,
  MapPin,
  Phone,
  Star,
  Store,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatBrl } from "@/modules/business/gastronomy/utils/currency";
import { usePremiumBusinessSiteContext } from "@/modules/business/premium/context/PremiumBusinessSiteContext";

export default function PremiumBusinessHomePage() {
  const { businessSnapshot, hasGastronomy, routes } = usePremiumBusinessSiteContext();
  const business = businessSnapshot.institutional.business;
  const commerce = hasGastronomy ? businessSnapshot.gastronomyPreview : [];
  const previewItems = businessSnapshot.gastronomyPreview.slice(0, 3);
  const absoluteCanonical =
    typeof window !== "undefined" ? `${window.location.origin}${routes.home}` : undefined;
  const openStatusLabel =
    businessSnapshot.institutional.openStatus.open === true
      ? "Aberto"
      : businessSnapshot.institutional.openStatus.open === false
        ? "Fechado"
        : "Horario nao informado";
  const openStatusVariant =
    businessSnapshot.institutional.openStatus.open === true ? "default" : "secondary";

  return (
    <>
      <Helmet>
        <title>{`${businessSnapshot.institutional.name} | Link Premium`}</title>
        <meta name="description" content={businessSnapshot.institutional.description} />
        {absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="space-y-6">
        <div className="overflow-hidden rounded-2xl border bg-card">
          {businessSnapshot.institutional.bannerUrl ? (
            <img
              src={businessSnapshot.institutional.bannerUrl}
              alt={businessSnapshot.institutional.name}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="h-40 w-full bg-muted" />
          )}

          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {businessSnapshot.institutional.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {businessSnapshot.institutional.category}
                </p>
              </div>

              <Badge variant={openStatusVariant}>{openStatusLabel}</Badge>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {businessSnapshot.institutional.description}
            </p>

            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{businessSnapshot.institutional.addressText ?? "Endereco nao informado"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <span>{businessSnapshot.institutional.openStatus.todayHours ?? "Horario nao informado"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{businessSnapshot.institutional.phone ?? "Contato nao informado"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span>
                  {businessSnapshot.institutional.rating.toFixed(1)} (
                  {businessSnapshot.institutional.reviewCount} avaliacoes)
                </span>
              </div>
            </div>

            {hasGastronomy && (
              <div className="pt-1">
                <Button asChild className="w-full sm:w-auto">
                  <Link to={routes.menu}>Ver cardapio e pedir</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {hasGastronomy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atendimento e pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Cardapio com itens</span>
                  <Badge variant="outline">{commerce.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="w-full">
                    <Link to={routes.menu}>Pedir agora</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servicos disponiveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {business.modos_atendimento?.length ? (
                <div className="flex flex-wrap gap-2">
                  {business.modos_atendimento.map((mode) => (
                    <Badge key={mode} variant="outline">
                      {mode}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>Sem servicos cadastrados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modulos ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {businessSnapshot.verticals.activeVerticals.length ? (
                <div className="flex flex-wrap gap-2">
                  {businessSnapshot.verticals.activeVerticals.map((vertical) => (
                    <Badge key={vertical} variant="outline">
                      {vertical}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>Sem modulos ativos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" />
                Contato rapido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{businessSnapshot.institutional.phone ?? "Nao informado"}</p>
              {businessSnapshot.institutional.whatsapp ? (
                <Button asChild size="sm" className="w-full">
                  <a
                    href={`https://wa.me/${businessSnapshot.institutional.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir WhatsApp
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-primary" />
                Presenca online
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{businessSnapshot.institutional.website ?? "Site nao informado"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-primary" />
                Credibilidade local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                Nota {businessSnapshot.institutional.rating.toFixed(1)} com{" "}
                {businessSnapshot.institutional.reviewCount} avaliacoes.
              </p>
            </CardContent>
          </Card>
        </div>

        {businessSnapshot.institutional.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {businessSnapshot.institutional.photos.slice(0, 6).map((photo, index) => (
                  <img
                    key={`${photo}-${index}`}
                    src={photo}
                    alt={`${businessSnapshot.institutional.name} foto ${index + 1}`}
                    className="aspect-square w-full rounded-lg border object-cover"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {hasGastronomy && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                Previa do cardapio
              </CardTitle>
              <Button asChild size="sm">
                <Link to={routes.menu}>Abrir cardapio</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {previewItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda nao ha itens em destaque no cardapio.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {previewItems.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-lg border bg-card">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                          <Store className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {item.priceFrom ? `A partir de ${formatBrl(item.priceFrom)}` : item.priceLabel}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}
