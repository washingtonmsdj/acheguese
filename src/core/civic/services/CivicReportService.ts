/**
 * Compatibility facade for civic reports.
 * Canonical implementation lives in core/community/services/CivicReportService.
 */

import { CivicReportService as communityCivicReportService } from "@/core/community/services/CivicReportService";
import type { CivicReport } from "@/core/community/services/CivicReportService";

export type { CivicReport };

export type CreateCivicReportData = Parameters<
  (typeof communityCivicReportService)["createReport"]
>[0];

export const CivicReportService = communityCivicReportService;
export const civicReportService = communityCivicReportService;
