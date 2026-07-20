import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Megaphone,
  Newspaper,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  COMMUNICATION_CONTENT_FORMAT_LABELS,
  PUBLICATION_TYPE_LABELS,
} from "../types";
import type { CommunicationPublicationDistribution } from "@/core/communication-territorial/types";
import { communicationTerritorialGateway } from "../services";

interface CommunityCommunicationCardProps {
  distribution: CommunicationPublicationDistribution;
  routeParams: { state: string; city: string };
}

function formatDate(value?: string | null): string {
  if (!value) return "Publicado recentemente";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ChannelHeader({
  name,
  isVerified,
  territoryLabel,
  publishedAt,
}: {
  name: string;
  isVerified: boolean;
  territoryLabel: string | null;
  publishedAt?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
      <span className="inline-flex items-center gap-1.5 font-medium text-white/85">
        <Radio className="h-3.5 w-3.5 text-primary" aria-hidden />
        {name}
      </span>
      {isVerified ? (
        <span
          className="inline-flex items-center gap-1 text-emerald-300"
          aria-label="Canal verificado"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          verificado
        </span>
      ) : null}
      {territoryLabel ? (
        <span className="inline-flex items-center gap-1 text-white/55">
          <MapPin className="h-3 w-3" aria-hidden />
          {territoryLabel}
        </span>
      ) : null}
      <span className="text-white/50">•</span>
      <time className="text-white/55">{formatDate(publishedAt)}</time>
    </div>
  );
}

/**
 * Card comunitário para publicações de comunicação.
 *
 * Diferencia dois formatos:
 * - `article`: layout editorial, resumo + CTA "Ler matéria completa" que
 *   navega para a URL canonical do canal.
 * - `update`: layout de postagem simples, corpo expansível inline, sem
 *   navegação forçada; oferece "Ver no canal" como link secundário.
 */
export function CommunityCommunicationCard({
  distribution,
  routeParams,
}: CommunityCommunicationCardProps) {
  const publication = distribution.publication;
  const channel = distribution.channel;
  const [expanded, setExpanded] = useState(false);

  if (!publication || !channel) return null;

  const interaction = communicationTerritorialGateway.resolvePublicationInteraction(
    distribution,
    routeParams,
  );
  const isArticle = publication.content_format === "article";
  const territoryLabel = publication.location?.name ?? null;
  const isVerified = channel.verification_status === "verified";
  const summary = publication.summary?.trim() || publication.body.slice(0, 220);
  const showExpandToggle = !isArticle && publication.body.length > 260;

  return (
    <Card
      data-testid="community-communication-card"
      data-content-format={publication.content_format}
      data-publication-type={publication.publication_type}
      className={cn(
        "overflow-hidden border-white/10 bg-white/[0.03] text-white transition-colors",
        isArticle ? "hover:border-primary/40" : "hover:border-white/25",
      )}
    >
      <CardContent className={cn("space-y-4", isArticle ? "p-6" : "p-5")}>
        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant="secondary"
            className={cn(
              "gap-1",
              isArticle
                ? "bg-primary/15 text-primary"
                : "bg-white/10 text-white/80",
            )}
          >
            {isArticle ? (
              <Newspaper className="h-3 w-3" aria-hidden />
            ) : (
              <Megaphone className="h-3 w-3" aria-hidden />
            )}
            {COMMUNICATION_CONTENT_FORMAT_LABELS[publication.content_format]}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/70">
            {PUBLICATION_TYPE_LABELS[publication.publication_type]}
          </Badge>
          {publication.trust_label ? (
            <Badge variant="outline" className="border-white/15 text-white/55">
              {publication.trust_label}
            </Badge>
          ) : null}
        </div>

        {/* Header do canal */}
        <ChannelHeader
          name={channel.public_name}
          isVerified={isVerified}
          territoryLabel={territoryLabel}
          publishedAt={publication.published_at}
        />

        {/* Corpo — layout muda por formato */}
        {isArticle ? (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-tight text-white">
              {publication.title}
            </h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-white/70">
              {summary}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-snug text-white/95">
              {publication.title}
            </h3>
            <p
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-white/78",
                !expanded && "line-clamp-4",
              )}
            >
              {publication.body}
            </p>
            {showExpandToggle ? (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                aria-expanded={expanded}
              >
                {expanded ? (
                  <>
                    Ler menos <ChevronUp className="h-3 w-3" aria-hidden />
                  </>
                ) : (
                  <>
                    Ler mais <ChevronDown className="h-3 w-3" aria-hidden />
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}

        {/* CTA — muda por formato */}
        {isArticle && interaction.href ? (
          <div className="pt-1">
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to={interaction.href} data-testid="communication-card-canonical-link">
                Ler matéria completa
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        ) : interaction.href ? (
          <div className="pt-1">
            <Link
              to={interaction.href}
              data-testid="communication-card-channel-link"
              className="inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-primary"
            >
              Ver no canal
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default CommunityCommunicationCard;
