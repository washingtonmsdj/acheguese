/**
 * Search Core Module
 *
 * Exporta API pública do módulo de busca
 */

export { SearchService, searchService } from "./services/SearchService";
export type {
  SearchCategory,
  SearchDocument,
  SearchDocumentType,
  SearchFilters,
  SearchResults,
} from "./services/SearchService";
