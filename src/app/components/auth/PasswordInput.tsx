import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import {
  getAuthPasswordRequirementStatus,
  getAuthPasswordStrength,
} from "@/core/auth/utils/passwordPolicy";

type PasswordInputBaseProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export interface PasswordInputProps extends PasswordInputBaseProps {
  invalid?: boolean;
  /** Mostra o medidor de força (barra). */
  showStrength?: boolean;
  /**
   * Mostra a checklist de requisitos abaixo da barra.
   * Default: true (compat). No login usamos `false` para manter só a barra.
   */
  showRequirements?: boolean;
  /**
   * Valor do input quando o campo é controlado externamente via RHF
   * (por causa de `register` o componente não recebe `value` diretamente).
   */
  strengthValue?: string;
}

const strengthColor: Record<number, string> = {
  0: "bg-transparent",
  1: "bg-destructive",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-primary",
};

/**
 * PasswordInput
 * SSOT visual para campos de senha (login, cadastro, reset).
 *
 * Recursos:
 * - Toggle mostrar/ocultar
 * - (Opcional) medidor de força + checklist de requisitos
 *
 * O componente permanece "não controlado" para funcionar com `react-hook-form`
 * via `{...register(...)}`. Quando `showStrength` está ligado, o valor exibido
 * no medidor pode ser passado via `strengthValue` (ex.: `watch("password")`).
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { invalid, showStrength = false, strengthValue = "", className, ...props },
    ref,
  ) {
    const [visible, setVisible] = React.useState(false);
    const requirements = React.useMemo(
      () => (showStrength ? getAuthPasswordRequirementStatus(strengthValue) : []),
      [showStrength, strengthValue],
    );
    const strength = React.useMemo(
      () => (showStrength ? getAuthPasswordStrength(strengthValue) : { level: 0, label: "" }),
      [showStrength, strengthValue],
    );

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            className={cn("h-11 pr-10", invalid && "border-destructive", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showStrength && strengthValue ? (
          <div className="space-y-2 rounded-2xl border border-border/60 bg-secondary/35 p-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((tick) => (
                  <span
                    key={tick}
                    className={cn(
                      "h-1.5 flex-1 rounded-full bg-border/60 transition-colors",
                      strength.level >= tick && strengthColor[strength.level],
                    )}
                  />
                ))}
              </div>
              {strength.label ? (
                <span className="text-[0.7rem] font-medium text-muted-foreground">
                  {strength.label}
                </span>
              ) : null}
            </div>
            <ul className="space-y-0.5">
              {requirements.map((requirement) => (
                <li
                  key={requirement.id}
                  className={cn(
                    "text-xs",
                    requirement.satisfied ? "text-emerald-500" : "text-muted-foreground",
                  )}
                >
                  {requirement.satisfied ? "✓" : "•"} {requirement.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  },
);
