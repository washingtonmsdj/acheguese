/**
 * 🏆 ADMIN BUSINESS FILTERS - SSOT COMPLIANT
 *
 * ✅ Filtros baseados em business_data (SSOT)
 * ✅ Campos corretos e valores válidos
 * ✅ Compatível com BusinessService
 *
 * @version 1.0.0 - SSOT Migration
 */

import {
  ADMIN_BUSINESS_CATEGORIES,
  ADMIN_BUSINESS_STATUS,
} from "./adminBusinessFields";

interface FilterConfig {
  key: string;
  label: string;
  options?: string[];
}

export const ADMIN_BUSINESS_FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [...ADMIN_BUSINESS_STATUS],
  },
  {
    key: "category",
    label: "Categoria",
    options: [...ADMIN_BUSINESS_CATEGORIES],
  },
  {
    key: "neighborhood",
    label: "Bairro",
    // Options will be generated dynamically from data
  },
];
