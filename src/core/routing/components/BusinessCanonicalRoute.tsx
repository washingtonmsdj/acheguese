/**
 * BusinessCanonicalRoute — rota territorial canônica de empresa.
 *
 * O resolver de BusinessUrlService é a fonte única da identidade territorial:
 * resultado nulo confirmado representa 404; falha de leitura representa erro.
 */
import { useEffect } from "react";
import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { logger } from "@/shared/utils/logger";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { buildBusinessPublicUrlFromSegments } from "@/core/business/utils/businessPublicUrls";
import { logPageNotFound } from "@/core/public-identity/utils/identity-logger";

interface BusinessCanonicalRouteProps {
  BusinessDetailComponent?: ComponentType<{ businessId?: string }>;
}

export default function BusinessCanonicalRoute({
  BusinessDetailComponent,
}: BusinessCanonicalRouteProps = {}) {
  const { state, city, territorySlug, slug } = useParams<{
    state: string;
    city: string;
    territorySlug: string;
    slug: string;
  }>();

  const hasCanonicalSegments = Boolean(state && city && territorySlug && slug);
  const lookup = useQuery({
    queryKey: ["business", "canonical-route", state, city, territorySlug, slug],
    enabled: hasCanonicalSegments,
    queryFn: () => {
      if (!state || !city || !territorySlug || !slug) {
        throw new Error("Missing canonical business route segments");
      }
      return BusinessUrlService.resolveByTerritoryAndSlug(state, city, territorySlug, slug);
    },
  });

  // Só registrar 404 quando o owner concluiu a consulta sem uma empresa.
  // Falhas e tentativas de revalidação não são ausência de identidade.
  useEffect(() => {
    if (!state || !city || !territorySlug || !slug || !lookup.isSuccess || lookup.data) {
      return;
    }

    const attemptedUrl = buildBusinessPublicUrlFromSegments({
      state,
      city,
      territorySlug,
      slug,
    });
    logPageNotFound({
      entityType: "business",
      identifier: slug,
      attemptedUrl,
    });
  }, [state, city, territorySlug, slug, lookup.isSuccess, lookup.data]);

  if (!hasCanonicalSegments || (lookup.isSuccess && !lookup.data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-4xl font-bold text-muted-foreground">404</p>
          <p className="mt-2 text-lg font-semibold text-foreground">Empresa não encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A URL informada não corresponde a uma empresa ativa neste território.
          </p>
          <a href="/empresas" className="mt-4 inline-block text-sm text-primary underline">
            Voltar para empresas
          </a>
        </div>
      </div>
    );
  }

  if (lookup.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Carregando empresa...</span>
      </div>
    );
  }

  if (lookup.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center" role="alert">
          <p className="text-lg font-semibold text-foreground">Não foi possível carregar a empresa</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A consulta está indisponível no momento. Tente novamente.
          </p>
          <button
            type="button"
            className="mt-4 inline-block text-sm text-primary underline disabled:opacity-50"
            disabled={lookup.isFetching}
            onClick={() => void lookup.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!lookup.data) {
    // Uma resposta nula só é um 404 após query.isSuccess; os outros estados
    // são tratados acima. Este ramo impede que dados indefinidos sejam exibidos.
    return null;
  }

  if (!BusinessDetailComponent) {
    logger.error("[BusinessCanonicalRoute] BusinessDetailComponent não informado.");
    return null;
  }

  return <BusinessDetailComponent businessId={lookup.data.id} />;
}
