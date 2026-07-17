/** Canonical orchestration for federated public search. */

import { CommunityEntityLinkService } from "@/core/community-experience/services/CommunityEntityLinkService";
import type { CommunityEntityLinkRecord } from "@/core/community-experience/types";
import {
  getCommunitySearchLinkLimit,
} from "@/core/search/config/searchConfig";
import type {
  CommunityLinkedEntityIds,
  SearchCategory,
  SearchFilters,
  SearchHistoryScope,
  SearchLinkedEntityType,
  SearchProvider,
  SearchProviderResult,
  SearchRequestOptions,
  SearchResults,
} from "@/core/search/contracts";
import {
  createProviderInput,
  getLinkedEntityTypes,
  getSearchProviders,
  isSearchBucketEnabled,
} from "@/core/search/providers/searchProviders";
import { trackError, trackPerformance } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

export type {
  ClassifiedSearchResult,
  EventSearchResult,
  PostSearchResult,
  ProfessionalSearchResult,
  SearchCategory,
  SearchDocument,
  SearchDocumentType,
  SearchFilters,
  SearchHistoryScope,
  SearchRequestOptions,
  SearchResults,
  WorkOpportunitySearchResult,
} from "@/core/search/contracts";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error
    ? signal.reason
    : new DOMException("Search aborted", "AbortError");
}

function historyStorageKey(scope: SearchHistoryScope): string {
  return scope === "global"
    ? "search_history"
    : `search_history:${scope}`;
}

export class SearchService {
  private static readonly SLOW_SEARCH_THRESHOLD_MS = 450;

  private static nowMs(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  private static logSlowSearch(
    scope: string,
    startedAt: number,
    metadata?: Record<string, unknown>,
  ): void {
    const elapsed = this.nowMs() - startedAt;
    if (elapsed < this.SLOW_SEARCH_THRESHOLD_MS) return;
    logger.warn(`[SearchService] Slow ${scope}: ${Math.round(elapsed)}ms`, metadata);
  }

  static async search(
    query: string,
    filters: SearchFilters = {},
    options: SearchRequestOptions = {},
  ): Promise<SearchResults> {
    const startedAt = this.nowMs();
    try {
      const searchTerm = query?.trim() ?? "";
      if (searchTerm.length < 2) return this.emptyResults();
      throwIfAborted(options.signal);

      const category: SearchCategory = filters.category ?? "all";
      const providers = getSearchProviders(category);
      const linkedEntityIds = await this.getCommunityLinkedEntityIds(
        filters.communityId,
        providers,
      );
      throwIfAborted(options.signal);

      const providerResults = await Promise.all(
        providers.map((provider) =>
          this.runProvider(
            provider,
            createProviderInput(
              searchTerm,
              filters,
              linkedEntityIds,
              options.signal,
            ),
          ),
        ),
      );
      throwIfAborted(options.signal);

      return this.mergeProviderResults(providerResults);
    } catch (error) {
      if (isAbortError(error)) throw error;
      trackError(error as Error, {
        component: "SearchService",
        action: "search",
        metadata: {
          queryLength: query?.trim()?.length ?? 0,
          category: filters.category ?? "all",
          hasCommunityScope: Boolean(filters.communityId),
        },
      });
      return this.emptyResults();
    } finally {
      const durationMs = this.nowMs() - startedAt;
      trackPerformance("search.federated.duration", durationMs, {
        category: filters.category ?? "all",
        hasCommunityScope: Boolean(filters.communityId),
      });
      this.logSlowSearch("federated-search", startedAt, {
        queryLength: query?.trim()?.length ?? 0,
        category: filters.category ?? "all",
        hasCommunityScope: Boolean(filters.communityId),
      });
    }
  }

  private static async runProvider(
    provider: SearchProvider,
    input: Parameters<SearchProvider["search"]>[0],
  ): Promise<SearchProviderResult> {
    try {
      return await provider.search(input);
    } catch (error) {
      if (isAbortError(error)) throw error;
      logger.error(`[SearchService] ${provider.bucket} provider failed`, error);
      return {
        bucket: provider.bucket,
        documents: [],
        payload: { [provider.bucket]: [] },
      };
    }
  }

  private static async getCommunityLinkedEntityIds(
    communityId: string | null | undefined,
    providers: readonly SearchProvider[],
  ): Promise<CommunityLinkedEntityIds> {
    if (!communityId) return {};
    const entityTypes = getLinkedEntityTypes(providers);
    if (entityTypes.length === 0) return {};

    try {
      const links = await CommunityEntityLinkService.listActiveByCommunity(
        communityId,
        { entityTypes, limit: getCommunitySearchLinkLimit() },
      );
      return this.toLinkedEntityIdSet(links, entityTypes);
    } catch (error) {
      logger.warn("SearchService.communityEntityLinks", error);
      return {};
    }
  }

  private static toLinkedEntityIdSet(
    links: readonly CommunityEntityLinkRecord[],
    allowedTypes: readonly SearchLinkedEntityType[],
  ): CommunityLinkedEntityIds {
    const grouped: Partial<Record<SearchLinkedEntityType, Set<string>>> = {};
    for (const link of links) {
      if (!allowedTypes.includes(link.entity_type as SearchLinkedEntityType)) continue;
      const type = link.entity_type as SearchLinkedEntityType;
      grouped[type] ??= new Set<string>();
      grouped[type]?.add(link.entity_id);
    }
    return grouped;
  }

  private static mergeProviderResults(
    providerResults: readonly SearchProviderResult[],
  ): SearchResults {
    const merged = this.emptyResults();
    for (const providerResult of providerResults) {
      Object.assign(merged, providerResult.payload);
      merged.documents.push(...providerResult.documents);
    }
    merged.total = merged.documents.length;
    return merged;
  }

  private static emptyResults(): SearchResults {
    return {
      documents: [],
      communities: [],
      businesses: [],
      professionals: [],
      opportunities: [],
      classifieds: [],
      events: [],
      posts: [],
      coupons: [],
      total: 0,
    };
  }

  static getSearchSuggestions(): string[] {
    return [
      "comunidade pituba",
      ...(isSearchBucketEnabled("events") ? ["eventos hoje"] : []),
      "classificados bicicleta",
      "pedreiro pituba",
      "pizzaiolo",
      "eletricista amaralina",
      "restaurantes",
      "salao de beleza",
      "encanador",
      "pet shop",
      "farmacia",
    ];
  }

  static saveSearchHistory(
    query: string,
    scope: SearchHistoryScope = "global",
  ): void {
    try {
      const normalized = query.trim();
      if (normalized.length < 2) return;
      const history = this.getSearchHistory(scope);
      const updated = [normalized, ...history.filter((item) => item !== normalized)].slice(0, 10);
      localStorage.setItem(historyStorageKey(scope), JSON.stringify(updated));
    } catch (error) {
      logger.warn("Failed to save search history:", error);
    }
  }

  static getSearchHistory(scope: SearchHistoryScope = "global"): string[] {
    try {
      const stored = localStorage.getItem(historyStorageKey(scope));
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string").slice(0, 10)
        : [];
    } catch {
      return [];
    }
  }

  static clearSearchHistory(scope: SearchHistoryScope = "global"): void {
    try {
      localStorage.removeItem(historyStorageKey(scope));
    } catch (error) {
      logger.warn("Failed to clear search history:", error);
    }
  }
}
