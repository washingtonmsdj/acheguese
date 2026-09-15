import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  AUTH_PASSWORD_MIN_LENGTH,
  getAuthPasswordRequirementStatus,
  getAuthPasswordStrength,
} from "@/core/auth/utils/passwordPolicy";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  ResetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@/shared/validation/schemas/user.schema";

interface ChangePasswordFormProps {
  onSave: (data: ResetPasswordFormInput) => Promise<void>;
  onCancel: () => void;
}

export function ChangePasswordForm({
  onSave,
  onCancel,
}: ChangePasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onBlur",
  });

  const newPasswordValue = watch("newPassword") ?? "";
  const confirmPasswordValue = watch("confirmNewPassword") ?? "";
  const passwordStrength = getAuthPasswordStrength(newPasswordValue);
  const passwordRequirements = useMemo(
    () => getAuthPasswordRequirementStatus(newPasswordValue),
    [newPasswordValue],
  );
  const passwordsMatch =
    newPasswordValue === confirmPasswordValue && confirmPasswordValue.length > 0;

  const onValid = async (data: ResetPasswordFormInput) => {
    try {
      await onSave(data);
      reset();
    } catch {
      // A página proprietária do fluxo apresenta o erro ao usuário.
    }
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
      <div className="flex items-start gap-3 border-b border-territory-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-base font-bold text-territory-ink">
            Defina uma nova senha
          </h2>
          <p className="mt-1 text-sm leading-5 text-territory-muted">
            Crie uma senha forte e que você não use em outros serviços. Se precisar, a recuperação por e-mail continua disponível.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-sm font-semibold text-territory-ink">
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder={`Mínimo ${AUTH_PASSWORD_MIN_LENGTH} caracteres`}
            className="h-12 pr-11"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? "new-password-error" : "password-strength"}
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={isSubmitting}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <InlineFieldError id="new-password-error" message={errors.newPassword?.message} />

        {newPasswordValue.length > 0 ? (
          <div id="password-strength" className="space-y-2 pt-1" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    level <= passwordStrength.level
                      ? passwordStrength.level <= 1
                        ? "bg-destructive"
                        : passwordStrength.level <= 2
                          ? "bg-territory-warm"
                          : "bg-territory-success"
                      : "bg-territory-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-territory-muted">
              Força: <span className="text-territory-ink">{passwordStrength.label}</span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-sm font-semibold text-territory-ink">
          Confirmar nova senha
        </Label>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="Repita a nova senha"
          className="h-12"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.confirmNewPassword)}
          aria-describedby={errors.confirmNewPassword ? "confirm-password-error" : undefined}
          {...register("confirmNewPassword")}
        />
        <InlineFieldError
          id="confirm-password-error"
          message={errors.confirmNewPassword?.message}
        />
        {confirmPasswordValue.length > 0 && !errors.confirmNewPassword ? (
          <p
            className={`flex items-center gap-1.5 text-xs font-semibold ${passwordsMatch ? "text-territory-success" : "text-destructive"}`}
            aria-live="polite"
          >
            {passwordsMatch ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
            {passwordsMatch ? "As senhas coincidem" : "As senhas ainda não coincidem"}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-territory-border bg-territory-raised p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-territory-brand" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-territory-muted">
            Requisitos
          </p>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {passwordRequirements.map((requirement) => (
            <li
              key={requirement.id}
              className={`flex items-start gap-2 text-xs ${requirement.satisfied ? "text-territory-success" : "text-territory-muted"}`}
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${requirement.satisfied ? "bg-territory-success" : "bg-territory-border"}`}
                aria-hidden="true"
              />
              {requirement.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 w-full sm:w-auto"
        >
          <X className="mr-2 h-4 w-4" aria-hidden="true" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !passwordsMatch}
          className="min-h-11 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/90 sm:min-w-40 sm:w-auto"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </div>
    </form>
  );
}
