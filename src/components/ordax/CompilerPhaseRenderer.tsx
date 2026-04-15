/**
 * Compiler Phase Renderer
 * Renderiza respostas estruturadas do Game Compiler Agent
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompilerPhase } from "@/lib/ordax/constants";

export interface ValidationViolation {
  level: 'CRITICAL' | 'SEVERE' | 'MINOR';
  id: string;
  pilar: string;
  message: string;
}

// ✅ SSOT: CompilerResponse definido em lib/ordax/types.ts
// Este arquivo apenas re-exporta para compatibilidade
export type { CompilerResponse } from "@/lib/ordax/types";

interface Props {
  response: CompilerResponse;
  onApprove?: () => void;
  approving?: boolean;
}

export function CompilerPhaseRenderer({ response, onApprove, approving }: Props) {
  const { kind, phase } = response;

  // INTERPRETATION_RESULT
  if (kind === "INTERPRETATION_RESULT") {
    const interpretation = response.interpretation as {
      gameType?: string;
      mechanics?: string[];
      restrictions?: string[];
      objective?: string;
    } || {};

    return (
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Fase 1/5: Interpretação
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">📖 INTERPRETAÇÃO DO PEDIDO</h4>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium">Tipo de jogo:</span>{" "}
                  <Badge variant="secondary" className="ml-1">{interpretation.gameType || "N/A"}</Badge>
                </div>

                {interpretation.mechanics && interpretation.mechanics.length > 0 && (
                  <div>
                    <span className="font-medium">Mecânicas solicitadas:</span>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      {interpretation.mechanics.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {interpretation.restrictions && interpretation.restrictions.length > 0 && (
                  <div>
                    <span className="font-medium">Restrições identificadas:</span>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      {interpretation.restrictions.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <span className="font-medium">Objetivo do jogador:</span>
                  <p className="ml-2 mt-1">{interpretation.objective || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              ⏭️ Próxima fase: Construção do plano
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // GAME_PLAN_RESULT
  if (kind === "GAME_PLAN_RESULT") {
    const plan = response.plan || {};
    const warnings = response.planWarnings as string[] | undefined;

    return (
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Fase 2/5: Plano do Jogo
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">🧠 PLANO DO JOGO</h4>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium">Título:</span> {plan.title || "N/A"}
                </div>

                {plan.description && (
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <p className="ml-2 mt-1">{plan.description}</p>
                  </div>
                )}

                <div>
                  <span className="font-medium">Loop Principal:</span>
                  <p className="ml-2 mt-1">{plan.coreLoop || "N/A"}</p>
                </div>

                {plan.requiredSystems && plan.requiredSystems.length > 0 && (
                  <div>
                    <span className="font-medium">Sistemas Necessários:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {plan.requiredSystems.map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {plan.lifecycle && (
                  <div>
                    <span className="font-medium">Lifecycle:</span>
                    <div className="ml-2 mt-1 space-y-1">
                      <div>• Início: {plan.lifecycle.startCondition || "N/A"}</div>
                      <div>• Derrota: {plan.lifecycle.loseCondition || "N/A"}</div>
                      {plan.lifecycle.winCondition && (
                        <div>• Vitória: {plan.lifecycle.winCondition}</div>
                      )}
                      <div>• Score: {plan.lifecycle.scoreRule || "N/A"}</div>
                    </div>
                  </div>
                )}
              </div>

              {warnings && warnings.length > 0 && (
                <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                  <div className="font-medium text-xs mb-1">⚠️ Auto-completações:</div>
                  <ul className="list-disc list-inside text-[10px] space-y-0.5">
                    {warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              ⏭️ Próxima fase: Validação constitucional
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // VALIDATION_RESULT
  if (kind === "VALIDATION_RESULT") {
    const validation = response.validation || { isValid: false, summary: { critical: 0, severe: 0, minor: 0 } };
    const isValid = validation.isValid;
    const summary = validation.summary || { critical: 0, severe: 0, minor: 0 };

    return (
      <Card className={cn(
        "p-4 border",
        isValid ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            isValid ? "bg-green-500/20" : "bg-yellow-500/20"
          )}>
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Fase 3/5: Validação Constitucional
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">
                ⚖️ VALIDAÇÃO CONSTITUCIONAL
              </h4>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant={isValid ? "default" : "secondary"} className="ml-1">
                    {isValid ? "✅ VÁLIDO" : "⚠️ AVISOS"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-background/50">
                    <div className="font-medium">Críticos</div>
                    <div className={cn(
                      "text-lg font-bold",
                      summary.critical > 0 ? "text-red-500" : "text-green-500"
                    )}>
                      {summary.critical}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <div className="font-medium">Graves</div>
                    <div className={cn(
                      "text-lg font-bold",
                      summary.severe > 0 ? "text-yellow-500" : "text-green-500"
                    )}>
                      {summary.severe}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <div className="font-medium">Menores</div>
                    <div className={cn(
                      "text-lg font-bold",
                      summary.minor > 0 ? "text-blue-500" : "text-green-500"
                    )}>
                      {summary.minor}
                    </div>
                  </div>
                </div>

                {validation.violations && validation.violations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="font-medium">Violações detectadas:</div>
                    
                    {/* Violações CRÍTICAS */}
                    {validation.violations.filter((v: ValidationViolation) => v.level === 'CRITICAL').length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-red-500">🔴 CRÍTICAS</div>
                        {validation.violations
                          .filter((v: ValidationViolation) => v.level === 'CRITICAL')
                          .map((v: ValidationViolation, i: number) => (
                            <div key={i} className="p-2 rounded bg-red-500/10 border border-red-500/30 text-[10px]">
                              <div className="font-medium">[{v.id}] {v.pilar}</div>
                              <div className="text-muted-foreground">{v.message}</div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Violações GRAVES */}
                    {validation.violations.filter((v: ValidationViolation) => v.level === 'SEVERE').length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-yellow-500">🟡 GRAVES</div>
                        {validation.violations
                          .filter((v: ValidationViolation) => v.level === 'SEVERE')
                          .map((v: ValidationViolation, i: number) => (
                            <div key={i} className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-[10px]">
                              <div className="font-medium">[{v.id}] {v.pilar}</div>
                              <div className="text-muted-foreground">{v.message}</div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Violações MENORES */}
                    {validation.violations.filter((v: ValidationViolation) => v.level === 'MINOR').length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-blue-500">🔵 MENORES</div>
                        {validation.violations
                          .filter((v: ValidationViolation) => v.level === 'MINOR')
                          .map((v: ValidationViolation, i: number) => (
                            <div key={i} className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-[10px]">
                              <div className="font-medium">[{v.id}] {v.pilar}</div>
                              <div className="text-muted-foreground">{v.message}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              ⏭️ Próxima fase: Confirmação do usuário
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // CONFIRMATION_REQUIRED
  if (kind === "CONFIRMATION_REQUIRED") {
    const plan = response.plan || {};
    const validation = response.validation || { isValid: true, summary: { severe: 0 } };

    return (
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Fase 4/5: Confirmação do Usuário
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">
                ✅ PLANO PRONTO PARA COMPILAÇÃO
              </h4>
              
              <div className="space-y-2 text-xs">
                <p className="leading-relaxed">
                  {plan.description || `Um jogo ${plan.gameType || "desconhecido"} com ${plan.requiredSystems?.length || 0} sistemas.`}
                </p>

                <div className="p-3 rounded bg-background/50">
                  <div className="font-medium mb-2">O que será gerado:</div>
                  <ul className="list-disc list-inside space-y-1 text-[10px]">
                    <li>Loop de jogo: {plan.loopType || "N/A"}</li>
                    <li>Sistemas: {plan.requiredSystems?.join(", ") || "N/A"}</li>
                    <li>Entidades: {plan.requiredEntities?.join(", ") || "N/A"}</li>
                    <li>UI: HUD + StartScreen + GameOverScreen</li>
                  </ul>
                </div>

                {validation && !validation.isValid && (
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                    <div className="font-medium text-[10px]">
                      ⚠️ {validation.summary?.severe || 0} avisos detectados (não bloqueantes)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium mb-2">
                Este é o jogo que você quer gerar?
              </p>
              <Button
                onClick={onApprove}
                disabled={approving}
                className="w-full"
                size="sm"
              >
                {approving ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-2 animate-spin" />
                    Compilando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-2" />
                    ✅ Aceitar plano e compilar
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Ou descreva ajustes necessários no chat
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // COMPILER_PROTOCOL_VIOLATION
  if (kind === "COMPILER_PROTOCOL_VIOLATION") {
    return (
      <Card className="p-4 border-red-500/30 bg-red-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                Violação de Protocolo
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-red-500">
                🚫 COMPILER_PROTOCOL_VIOLATION
              </h4>
              
              <div className="space-y-2 text-xs">
                <p>{response.message}</p>

                <div className="p-2 rounded bg-background/50 text-[10px] font-mono">
                  <div>Fase atual: <span className="font-bold">{response.currentPhase}</span></div>
                  <div>Fase necessária: <span className="font-bold">{response.requiredPhase}</span></div>
                  <div>Aprovado: <span className="font-bold">{response.approvedByUser ? "Sim" : "Não"}</span></div>
                </div>

                <p className="text-muted-foreground">
                  O protocolo do compilador exige que todas as fases sejam completadas na ordem:
                  interpretation → plan → validation → confirmation → compilation
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Fallback para tipos desconhecidos
  return (
    <Card className="p-4 border-border/50">
      <div className="text-xs text-muted-foreground">
        Resposta do compilador: {kind} (fase: {phase})
      </div>
    </Card>
  );
}

// Badge de fase atual no topo do chat
export function CompilerPhaseBadge({ phase }: { phase: CompilerPhase }) {
  const phaseLabels: Record<CompilerPhase, string> = {
    interpretation: "1/5: Interpretação",
    plan: "2/5: Plano",
    validation: "3/5: Validação",
    confirmation: "4/5: Confirmação",
    compilation: "5/5: Compilação"
  };

  const phaseColors: Record<CompilerPhase, string> = {
    interpretation: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    plan: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    validation: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    confirmation: "bg-green-500/20 text-green-500 border-green-500/30",
    compilation: "bg-primary/20 text-primary border-primary/30"
  };

  return (
    <Badge variant="outline" className={cn("text-[10px]", phaseColors[phase])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
      {phaseLabels[phase]}
    </Badge>
  );
}
