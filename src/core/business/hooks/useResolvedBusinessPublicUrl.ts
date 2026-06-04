import { useEffect, useMemo, useState } from "react";
import {
  BusinessUrlService,
  type BusinessUrlContext,
} from "@/core/business/services/BusinessUrlService";

export interface ResolvedBusinessPublicUrlState {
  url: string | null;
  fallbackUrl: string | null;
  isResolving: boolean;
}

/**
 * Resolves the preferred public business URL.
 *
 * The territorial URL is available immediately as fallback, then the hook
 * upgrades to /:communityAlias/:slug when the SSOT alias can be resolved.
 */
export function useResolvedBusinessPublicUrl(
  ctx: BusinessUrlContext | null | undefined,
): ResolvedBusinessPublicUrlState {
  const resolvedContext = useMemo(() => {
    if (!ctx?.slug || !ctx.geographic_path) return null;

    return {
      id: ctx.id,
      slug: ctx.slug,
      is_premium: ctx.is_premium,
      community_alias: ctx.community_alias,
      geographic_path: ctx.geographic_path,
    };
  }, [
    ctx?.community_alias,
    ctx?.geographic_path,
    ctx?.id,
    ctx?.is_premium,
    ctx?.slug,
  ]);

  const fallbackUrl = useMemo(() => {
    if (!resolvedContext) return null;

    try {
      return BusinessUrlService.getCanonicalUrl(resolvedContext);
    } catch {
      return null;
    }
  }, [resolvedContext]);

  const [url, setUrl] = useState<string | null>(fallbackUrl);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(fallbackUrl);

    if (!resolvedContext || !fallbackUrl) {
      setIsResolving(false);
      return;
    }

    setIsResolving(true);

    void BusinessUrlService.getCanonicalUrlWithResolvedCommunityAlias(resolvedContext)
      .then((resolvedUrl) => {
        if (!cancelled) {
          setUrl(resolvedUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(fallbackUrl);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackUrl, resolvedContext]);

  return {
    url,
    fallbackUrl,
    isResolving,
  };
}
