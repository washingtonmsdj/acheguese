/**
 * Search Core Module
 *
 * Exporta API pública do módulo de busca
 */

export { SearchService, searchService } from "./services/SearchService";
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
  SearchResults,
} from "./services/SearchService";
