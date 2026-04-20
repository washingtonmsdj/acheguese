import { useQuery } from "@tanstack/react-query";
import { CivicReportService } from "@/core/community/services/CivicReportService"; // ✅ SSOT
import type { CivicReport } from "@/core/community/services/CivicReportService";

export type { CivicReport };

interface UseCivicReportsOptions {
  limit?: number;
  status?: string;
  type?: string;
}

export function useCivicReports(options: UseCivicReportsOptions = {}) {
  const { limit = 20, status, type } = options;

  return useQuery({
    queryKey: ["civic-reports", { limit, status, type }],
    queryFn: () => CivicReportService.getReports({ limit, status, type }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCivicReportById(reportId: string | null) {
  return useQuery({
    queryKey: ["civic-report", reportId],
    queryFn: () => CivicReportService.getReportById(reportId!),
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5,
  });
}
