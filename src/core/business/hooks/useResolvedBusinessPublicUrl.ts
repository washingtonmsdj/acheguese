import { useMemo } from "react";
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
 * Resolves the public business URL.
 *
 * Public URLs never upgrade to community aliases automatically. Community
 * scoped URLs are generated only from explicit community context.
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

  return {
    url: fallbackUrl,
    fallbackUrl,
    isResolving: false,
  };
}
