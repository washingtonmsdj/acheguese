import * as React from "react";

import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
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
  showStrength?: boolean;
  showRequirements?: boolean;
  strengthValue?: string;
  showCapsLockHint?: boolean;
}

const strengthColor: Record<number, string> = {
  0: "bg-transparent",
  1: "bg-destructive",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-primary",
};

/** Campo de senha compartilhado do fluxo de autenticação. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      invalid,
      showStrength = false,
      showRequirements = true,
      strengthValue = "",
      showCapsLockHint = true,
      className,
      onKeyUp,
      onKeyDown,
      onBlur,
      onFocus,
      id,
      ...props
    },
    ref,
  ) {
    const [visible, setVisible] = React.useState(false);
    const [capsLock, setCapsLock] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const requirements = React.useMemo(
      () =>
        showStrength && showRequirements
          ? getAuthPasswordRequirementStatus(strengthValue)
          : [],
      [showStrength, showRequirements, strengthValue],
    );
    const strength = React.useMemo(
      () => (showStrength ? getAuthPasswordStrength(strengthValue) : { level: 0, label: "" }),
      [showStrength, strengthValue],
    );

    const detectCapsLock = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (typeof event.getModifierState === "function") {
          setCapsLock(event.getModifierState("CapsLock"));
        }
      },
      [],
    );

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={cn("h-11 pr-12", invalid && "border-destructive", className)}
            onKeyUp={(event) => {
              detectCapsLock(event);
              onKeyUp?.(event);
            }}
            onKeyDown={(event) => {
              detectCapsLock(event);
              onKeyDown?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              setCapsLock(false);
              onBlur?.(event);
            }}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            aria-controls={id}
          >
            <AuthConceptIcon name={visible ? "eye-off" : "eye"} />
          </button>
        </div>

        {showCapsLockHint && focused && capsLock ? (
          <p role="status" aria-live="polite" className="text-xs font-medium text-amber-600">
            Caps Lock ativado
          </p>
        ) : null}

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
            {requirements.length > 0 ? (
              <ul className="space-y-0.5">
                {requirements.map((requirement) => (
                  <li
                    key={requirement.id}
                    className={cn(
                      "text-xs",
                      requirement.satisfied ? "text-emerald-600" : "text-muted-foreground",
                    )}
                  >
                    {requirement.satisfied ? "✓" : "•"} {requirement.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
