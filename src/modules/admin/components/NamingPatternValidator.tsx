/**
 * Naming Pattern Validator - SSOT Foundation
 *
 * Valida nomenclatura de colunas seguindo o padrão oficial:
 * - *_profile_id para contexto social
 * - *_user_id para contexto global
 * - Proíbe nomes ambíguos (author_profile_id, owner_profile_id, etc.)
 *
 * Referência: docs/SSOT_ARCHITECTURE.md
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertTriangle, CheckCircle2, FileCode2 } from "lucide-react";

interface NamingViolation {
  table: string;
  column: string;
  issue: "ambiguous" | "missing-suffix" | "wrong-context";
  suggestion: string;
  severity: "error" | "warning";
}

const KNOWN_VIOLATIONS: NamingViolation[] = [
  {
    table: "posts",
    column: "author_profile_id",
    issue: "ambiguous",
    suggestion: "author_profile_id",
    severity: "error",
  },
  // Adicionar mais conforme auditoria
];

export function NamingPatternValidator() {
  const errorCount = KNOWN_VIOLATIONS.filter(
    (v) => v.severity === "error",
  ).length;
  const warningCount = KNOWN_VIOLATIONS.filter(
    (v) => v.severity === "warning",
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="h-5 w-5" />
          Validação de Nomenclatura
        </CardTitle>
        <CardDescription>
          Padrão Oficial: User vs Profile vs Author
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{errorCount} Erros</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{warningCount} Avisos</Badge>
          </div>
        </div>

        {/* Regras */}
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Regras de Nomenclatura:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>
                  Contexto social: <code>*_profile_id</code>
                </li>
                <li>
                  Contexto global: <code>*_user_id</code>
                </li>
                <li>
                  Proibido: <code>author_profile_id</code>,{" "}
                  <code>owner_profile_id</code>, <code>creator_profile_id</code>
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Violations */}
        {KNOWN_VIOLATIONS.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Violações Encontradas:</h4>
            {KNOWN_VIOLATIONS.map((violation, idx) => (
              <Alert
                key={idx}
                variant={
                  violation.severity === "error" ? "destructive" : "default"
                }
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {violation.table}.{violation.column}
                    </p>
                    <p className="text-sm">
                      {violation.issue === "ambiguous" &&
                        "Nome ambíguo - não especifica se é user ou profile"}
                      {violation.issue === "missing-suffix" &&
                        "Falta sufixo _id"}
                      {violation.issue === "wrong-context" &&
                        "Contexto incorreto"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sugestão:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">
                        {violation.suggestion}
                      </code>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Documentation Link */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            📖 Documentação completa: <code>docs/SSOT_ARCHITECTURE.md</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
