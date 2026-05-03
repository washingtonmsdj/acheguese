/* eslint-disable react-refresh/only-export-components */
/**
 * 🚧 MIGRATION WARNING BANNER
 *
 * Componente temporário para indicar módulos que ainda não foram migrados
 * para a nova arquitetura feature-first.
 *
 * @version 1.0.0
 * @temporary Remover após conclusão da migração
 */

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";

interface MigrationWarningBannerProps {
  moduleName: string;
  expectedMigrationPhase?: string;
  showInProduction?: boolean;
}

export function MigrationWarningBanner({
  moduleName,
  expectedMigrationPhase,
  showInProduction = false,
}: MigrationWarningBannerProps) {
  // Não mostrar em produção por padrão
  if (import.meta.env.PROD && !showInProduction) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="text-yellow-500">🚧 Módulo em Migração</AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        <p className="mb-2">
          O módulo <strong>{moduleName}</strong> ainda não foi migrado para a
          nova arquitetura feature-first.
        </p>
        {expectedMigrationPhase && (
          <p className="text-xs">
            <Info className="inline h-3 w-3 mr-1" />
            Migração prevista: {expectedMigrationPhase}
          </p>
        )}
        <p className="text-xs mt-2 opacity-75">
          Este aviso é temporário e será removido após a conclusão da migração.
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook para verificar se um módulo foi migrado
 */
export function useModuleMigrationStatus(moduleName: string): {
  isMigrated: boolean;
  phase: string | null;
} {
  // Módulos já migrados
  const migratedModules = new Set([
    "dashboard",
    "profile",
    "community",
    "notifications",
  ]);

  // Fases de migração planejadas
  const migrationPhases: Record<string, string> = {
    business: "Fase 6 - Semana 4 (Dias 1-2)",
    services: "Fase 6 - Semana 4 (Dias 3-4)",
    classifieds: "Fase 6 - Semana 5 (Dia 1)",
    mobility: "Fase 6 - Semana 5 (Dias 2-3)",
    admin: "Fase 6 - Semana 5 (Dias 4-5)",
  };

  return {
    isMigrated: migratedModules.has(moduleName),
    phase: migrationPhases[moduleName] || null,
  };
}
