import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Send,
  Shield,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { StepId } from "./publicarVaga.shared";

interface StepMeta {
  id: StepId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  number: number;
}

export function PublishHeader({
  steps,
  currentStepIndex,
  completeness,
  onBack,
  onStepChange,
}: {
  steps: readonly StepMeta[];
  currentStepIndex: number;
  completeness: number;
  onBack: () => void;
  onStepChange: (step: StepId) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary shrink-0" />
            {steps.at(currentStepIndex)?.label ?? "Etapa"}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Passo {currentStepIndex + 1} de {steps.length} · {completeness}% preenchido
          </p>
        </div>
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-2 max-w-3xl mx-auto overflow-x-auto scrollbar-hide">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onStepChange(s.id)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
              i === currentStepIndex
                ? "bg-primary text-primary-foreground"
                : i < currentStepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <s.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.number}</span>
          </button>
        ))}
      </div>
    </header>
  );
}

export function PublishPermissionBanner({
  canPublish,
  isLoadingPermission,
  permissionMessage,
  businessName,
  empresaFallback,
}: {
  canPublish: boolean;
  isLoadingPermission: boolean;
  permissionMessage: string;
  businessName?: string | null;
  empresaFallback?: string;
}) {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-4">
      <div
        className={cn(
          "rounded-xl border p-3 flex items-start gap-3",
          canPublish ? "bg-success/10 border-success/25" : "bg-warning/10 border-warning/25",
        )}
      >
        {canPublish ? (
          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
        ) : (
          <Shield className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isLoadingPermission
              ? "Validando permissão para publicar..."
              : canPublish
                ? "Publicação liberada"
                : "Publicação bloqueada"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isLoadingPermission ? "Aguarde a validação do perfil/empresa." : permissionMessage}
          </p>
          {!isLoadingPermission && canPublish && (
            <p className="text-[11px] text-muted-foreground">
              Perfil ativo selecionado {" • "} Empresa:{" "}
              <strong>{businessName || empresaFallback || "-"}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PublishBottomActions({
  isPreview,
  publishing,
  isLoadingPermission,
  canPublish,
  currentStepIndex,
  stepsLength,
  onEdit,
  onPublish,
  onBack,
  onNext,
}: {
  isPreview: boolean;
  publishing: boolean;
  isLoadingPermission: boolean;
  canPublish: boolean;
  currentStepIndex: number;
  stepsLength: number;
  onEdit: () => void;
  onPublish: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-20">
      <div className="max-w-3xl mx-auto">
        {isPreview ? (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onEdit}>
              Editar
            </Button>
            <Button
              className="flex-1 h-12 text-base font-semibold rounded-xl shadow-lg"
              onClick={onPublish}
              disabled={publishing || isLoadingPermission || !canPublish}
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : isLoadingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : !canPublish ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Publicação bloqueada
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Vaga
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <Button variant="outline" className="h-12 rounded-xl px-5" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
            <Button className="flex-1 h-12 text-base font-semibold rounded-xl" onClick={onNext}>
              {currentStepIndex === stepsLength - 2 ? "Revisar" : "Próximo"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
