/**
 * Search Core Module
 *
 * Exporta API pública do módulo de busca
 */

export { SearchService } from "./services/SearchService";
export {
  classifiedToSearchDocument,
  eventToSearchDocument,
  opportunityToSearchDocument,
  truncateSearchDescription,
} from "./services/SearchDocumentMapper";
export type {
  SearchCategory,
  SearchDocument,
  SearchDocumentType,
  SearchFilters,
  SearchHistoryScope,
  SearchRequestOptions,
  SearchResults,
} from "./services/SearchService";
