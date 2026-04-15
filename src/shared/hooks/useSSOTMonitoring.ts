import { useState, useEffect, useCallback } from "react";
import { SSOTValidators } from "@/shared/types/constants";
interface SSOTViolation {
  table: string;
  column: string;
  value: string;
  recordId: string;
  timestamp: string;
}

interface SSOTMonitoringData {
  violations: SSOTViolation[];
  totalRecords: number;
  complianceRate: number;
  lastCheck: string;
}

/**
 * Hook para monitoramento SSOT em tempo real
 * Verifica conformidade de dados retornados por queries
 */
export function useSSOTMonitoring() {
  const [data, setData] = useState<SSOTMonitoringData>({
    violations: [],
    totalRecords: 0,
    complianceRate: 100,
    lastCheck: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida um conjunto de registros contra regras SSOT
   */
  const validateRecords = useCallback(
    (
      records: Record<string, unknown>[],
      table: string,
      validations: { column: string; validator: (val: string) => boolean }[],
    ): SSOTViolation[] => {
      const violations: SSOTViolation[] = [];

      for (const record of records) {
        for (const { column, validator } of validations) {
          const value = record[column];
          if (value && typeof value === "string" && !validator(value)) {
            violations.push({
              table,
              column,
              value,
              recordId: String(record.id || "unknown"),
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      return violations;
    },
    [],
  );

  /**
   * Analisa dados já carregados para detectar violações SSOT
   * Não faz queries diretas — recebe dados de Services
   */
  const analyzeData = useCallback(
    (
      datasets: {
        table: string;
        records: Record<string, unknown>[];
        validations: { column: string; validator: (val: string) => boolean }[];
      }[],
    ) => {
      setLoading(true);
      setError(null);

      try {
        const allViolations: SSOTViolation[] = [];
        let totalRecords = 0;

        for (const dataset of datasets) {
          totalRecords += dataset.records.length;
          const violations = validateRecords(
            dataset.records,
            dataset.table,
            dataset.validations,
          );
          allViolations.push(...violations);
        }

        const complianceRate =
          totalRecords > 0
            ? Math.round(
                ((totalRecords - allViolations.length) / totalRecords) * 100,
              )
            : 100;

        setData({
          violations: allViolations,
          totalRecords,
          complianceRate,
          lastCheck: new Date().toISOString(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    [validateRecords],
  );

  /**
   * Atalho: validações padrão SSOT
   */
  const defaultValidations = {
    rideRequests: [
      { column: "status", validator: SSOTValidators.isValidRideStatus },
      {
        column: "payment_method",
        validator: SSOTValidators.isValidPaymentMethod,
      },
    ],
    profiles: [{ column: "role", validator: SSOTValidators.isValidUserRole }],
    reports: [
      { column: "status", validator: SSOTValidators.isValidReportStatus },
    ],
  };

  return {
    data,
    loading,
    error,
    analyzeData,
    validateRecords,
    defaultValidations,
  };
}
